import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { AiRequestError } from "@/lib/ai/client";
import {
  AI_BUDGETS,
  AI_NOT_CONFIGURED_MESSAGE,
  resolveAiCandidates,
  runAiTask,
} from "@/lib/v2-admin/ai-rotation";
import {
  buildArticlePrompt,
  buildEditorPrompt,
  DEFAULT_ARTICLE_WORDS,
  MAX_ARTICLE_WORDS,
  MIN_ARTICLE_WORDS,
  type OutlineSection,
} from "@/lib/ai/prompts";
import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { ensureCta } from "@/lib/v2-admin/lexical";
import { sanitizeAiHtml } from "@/lib/ai/sanitize-html";
import {
  assessAiOutput,
  hardDefectMessage,
  type OutputAssessment,
} from "@/lib/ai/output-quality";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";
import { gatherGroundingSources } from "@/lib/ai/factual/ground";
import { planGrounding } from "@/lib/ai/factual/plan";
import { validateArticleQuality } from "@/lib/ai/factual/validate";
import type { ToolSource } from "@/lib/ai/factual/sources";

export const runtime = "nodejs";
// Generasi artikel panjang bisa memakan waktu lama. AI_BUDGETS.long menjaga
// total waktu rotasi tetap di bawah batas ini.
export const maxDuration = 300;

// Buang code fence bila model membungkus output dalam ```html ... ```
const stripCodeFence = (raw: string): string => {
  const match = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (match ? match[1] : raw).trim();
};

const countWords = (html: string): number =>
  html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

// POST /api/v2/ai/article
// { title, outline, targetWords?, topic?, category?, grounding?, providerId?, model? }
//   → { html, content, model, providerName?, rotated, wordCount, sources,
//       grounding, validation, warning? }
//
// Satu jalur untuk SEMUA generasi artikel. Urutannya terikat: judul → outline →
// grounding data faktual → penulis → editor → validasi. Tidak ada lagi jalur
// "artikel faktual" terpisah yang menulis tanpa melihat judul/outline.
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: {
    title?: unknown;
    outline?: unknown;
    targetWords?: unknown;
    topic?: unknown;
    category?: unknown;
    grounding?: unknown;
    providerId?: unknown;
    model?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return apiError("Judul wajib diisi.");

  const outline: OutlineSection[] = Array.isArray(body.outline)
    ? body.outline
        .map((section): OutlineSection | null => {
          if (!section || typeof section !== "object") return null;
          const heading = (section as { heading?: unknown }).heading;
          if (typeof heading !== "string" || !heading.trim()) return null;
          const subsRaw = (section as { subheadings?: unknown }).subheadings;
          return {
            heading: heading.trim(),
            subheadings: Array.isArray(subsRaw)
              ? subsRaw.filter(
                  (s): s is string => typeof s === "string" && s.trim().length > 0,
                )
              : [],
          };
        })
        .filter((s): s is OutlineSection => s !== null)
    : [];

  if (outline.length === 0) {
    return apiError("Outline wajib disetujui terlebih dahulu.");
  }

  const targetWords =
    typeof body.targetWords === "number" && Number.isFinite(body.targetWords)
      ? Math.min(
          MAX_ARTICLE_WORDS,
          Math.max(MIN_ARTICLE_WORDS, Math.trunc(body.targetWords)),
        )
      : DEFAULT_ARTICLE_WORDS;

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  // Grounding aktif secara default. Penulis bisa mematikannya (grounding: false)
  // bila ingin artikel murni kualitatif tanpa menunggu pencarian data.
  const groundingEnabled = body.grounding !== false;

  // Anggaran token harus mengikuti target panjang. Dengan maxTokens tetap 4000,
  // artikel 2.000+ kata terpotong di tengah tag HTML dan hasil konversinya
  // rusak. Faktor 3.2 memberi ruang untuk kata Indonesia (>1 token/kata) plus
  // markup heading/list/tabel.
  const maxTokens = Math.min(16_000, Math.max(4_000, Math.round(targetWords * 3.2)));

  const candidates = await resolveAiCandidates({
    providerId: typeof body.providerId === "number" ? body.providerId : undefined,
    model: typeof body.model === "string" ? body.model : undefined,
    maxCandidates: AI_BUDGETS.articleWriter.maxCandidates,
  });

  if (candidates.length === 0) return apiError(AI_NOT_CONFIGURED_MESSAGE, 503);

  // --- TAHAP GROUNDING: ambil data faktual terkini ---
  //
  // Rencana dibuat DETERMINISTIK dari judul + outline (lihat plan.ts), bukan
  // lewat panggilan model tambahan: menghemat satu round-trip pada jalur yang
  // sudah mendekati maxDuration, dan membuat pemilihan tool bisa diuji.
  // Satu tool dicoba lebih dulu; bila tidak menghasilkan sumber layak, sistem
  // beralih ke tool lainnya. Seluruh hasil disaring allowlist otoritas.
  //
  // CATATAN 4 September 2026: kandidat tautan antar artikel tidak lagi disuplai
  // ke prompt. Tautan internal yang dipaksakan terbaca tidak natural, jadi
  // satu-satunya tautan internal yang tersisa adalah CTA ke halaman utama, dan
  // otoritas artikel dibangun dari kutipan sumber data di bawah ini.
  let sources: ToolSource[] = [];
  let groundingMeta: {
    enabled: boolean;
    primary?: string;
    reason?: string;
    fallbackUsed?: boolean;
    attempts?: { tool: string; provider: string | null; kept: number }[];
    rejected?: number;
  } = { enabled: groundingEnabled };

  if (groundingEnabled) {
    try {
      const plan = planGrounding({ title, outline, topic, category });
      const grounded = await gatherGroundingSources(plan);
      sources = grounded.sources;
      groundingMeta = {
        enabled: true,
        primary: plan.primary,
        reason: plan.reason,
        fallbackUsed: grounded.fallbackUsed,
        attempts: grounded.attempts.map((a) => ({
          tool: a.tool,
          provider: a.provider,
          kept: a.kept,
        })),
        rejected: grounded.rejectedUrls.length,
      };
    } catch (groundingError) {
      // Grounding bersifat penambah kualitas, bukan syarat. Kegagalannya tidak
      // boleh menggagalkan penulisan artikel.
      console.warn(
        "[api/v2/ai/article] grounding gagal, lanjut tanpa data eksternal:",
        groundingError instanceof Error ? groundingError.message : groundingError,
      );
      groundingMeta = { enabled: true, attempts: [], rejected: 0 };
    }
  }

  try {
    // --- PASS 1: PENULIS ---
    const result = await runAiTask<string>({
      candidates,
      messages: buildArticlePrompt(
        title,
        outline,
        targetWords,
        sources,
        topic,
      ),
      budget: AI_BUDGETS.articleWriter,
      temperature: 0.8,
      maxTokens,
      taskLabel: "article",
      // Validasi menolak keluaran yang CACAT SECARA OBJEKTIF, bukan yang
      // mutunya subjektif kurang. Melempar di sini membuat runAiTask berotasi ke
      // model berikutnya — jauh lebih berguna daripada menyimpan keluaran rusak
      // lalu menandainya untuk diperbaiki manusia.
      //
      // Yang ditolak: aksara non-Latin (mis. Tionghoa) yang kadang diselipkan
      // model multibahasa, code fence bocor, markdown tercampur HTML, tag tidak
      // berpasangan (tanda keluaran terpotong), tag terlarang, placeholder yang
      // belum diisi, kalimat model yang berbicara tentang tugasnya, serta
      // artikel tanpa satu pun heading atau paragraf.
      //
      // Catatan mutu (frasa klise, paragraf seragam, penjiplakan ringkasan
      // sumber) TIDAK menggagalkan di sini: ia dilaporkan setelah pass editor,
      // karena editor memang bertugas membersihkannya.
      parse: (raw) => {
        const rawHtml = stripCodeFence(raw);
        if (!rawHtml) {
          throw new AiRequestError("AI menghasilkan artikel kosong.", 502);
        }

        const assessment = assessAiOutput(rawHtml, sources);
        if (assessment.hasHardDefect) {
          throw new AiRequestError(
            `Keluaran AI cacat: ${hardDefectMessage(assessment)}`,
            502,
          );
        }

        return rawHtml;
      },
    });

    const draftHtml = result.value;

    // --- PASS 2: EDITOR (best-effort) ---
    // Layer kedua merapikan draft dan menghapus pola khas AI. Sengaja dibungkus
    // try/catch: bila editor gagal/timeout/rotasi habis, kita PAKAI draft
    // penulis yang sudah valid alih-alih menggagalkan seluruh permintaan.
    let finalHtml = draftHtml;
    let edited = false;
    let editorModel: string | undefined;
    try {
      const editorResult = await runAiTask<string>({
        candidates: candidates.slice(0, AI_BUDGETS.articleEditor.maxCandidates),
        messages: buildEditorPrompt(title, draftHtml),
        budget: AI_BUDGETS.articleEditor,
        temperature: 0.4,
        maxTokens,
        taskLabel: "article-editor",
        // Editor diperiksa dengan standar yang SAMA dengan penulis. Tanpa ini,
        // editor yang merusak keluaran (menyelipkan aksara asing, memotong di
        // tengah, mencampur markdown) justru menurunkan mutu draft yang tadinya
        // sudah lolos — dan kegagalannya baru terlihat setelah artikel tayang.
        parse: (raw) => {
          const polished = stripCodeFence(raw);
          if (!polished) {
            throw new AiRequestError("Editor menghasilkan keluaran kosong.", 502);
          }

          const assessment = assessAiOutput(polished, sources);
          if (assessment.hasHardDefect) {
            throw new AiRequestError(
              `Keluaran editor cacat: ${hardDefectMessage(assessment)}`,
              502,
            );
          }

          return polished;
        },
      });
      finalHtml = editorResult.value;
      edited = true;
      editorModel = editorResult.model;
    } catch (editorError) {
      // Draft penulis sudah lolos pemeriksaan cacat berat, jadi memakainya tetap
      // aman meski editor gagal.
      console.warn(
        "[api/v2/ai/article] pass editor dilewati, memakai draft penulis:",
        editorError instanceof Error ? editorError.message : editorError,
      );
    }

    // Konversi ke Lexical (sekaligus sanitasi) lalu enforce CTA wajib.
    const content = ensureCta(htmlToLexicalState(finalHtml));

    // Sanitasi hanya field `html` yang dikembalikan ke klien untuk pratinjau.
    const html = sanitizeAiHtml(finalHtml);

    const wordCount = countWords(finalHtml);
    // Keluaran yang tidak diakhiri tag tertutup biasanya terpotong di tengah
    // karena batas token provider.
    const looksTruncated = !/>\s*$/.test(finalHtml);
    const tooShort = wordCount < Math.round(targetWords * 0.6);

    const warning = looksTruncated
      ? "Keluaran AI tampak terpotong di tengah. Periksa bagian akhir artikel, atau generate ulang."
      : tooShort
        ? `Artikel hanya ~${wordCount} kata dari target ${targetWords}. Anda bisa generate ulang atau melengkapinya manual.`
        : undefined;

    // Catatan mutu pada keluaran FINAL. Cacat berat sudah tidak mungkin ada di
    // sini (kedua pass menolaknya), jadi yang tersisa adalah hal subjektif:
    // frasa klise yang lolos, paragraf terlalu seragam, kalimat yang disalin
    // utuh dari ringkasan sumber. Semuanya dilaporkan ke penulis, bukan
    // memblokir — keputusan akhir tetap pada manusia.
    const outputQuality: OutputAssessment = assessAiOutput(finalHtml, sources);

    // Validasi kualitas: mendeteksi angka tanpa sumber, tautan eksternal yang
    // tidak cocok dengan sumber, panjang, dan jumlah heading. Hanya menandai
    // untuk ditinjau — tidak pernah memblokir hasil.
    const validation = validateArticleQuality(finalHtml, sources, {
      minWords: Math.round(targetWords * 0.7),
      maxWords: Math.round(targetWords * 1.4),
      // Tanpa sumber, tidak ada kutipan yang bisa diwajibkan.
      minExternalLinks: sources.length > 0 ? 1 : 0,
    });

    void logAiTask({
      type: "article",
      status: "completed",
      input: { title, sections: outline.length, targetWords, topic, category },
      output: {
        htmlLength: html.length,
        wordCount,
        model: result.model,
        rotated: result.rotated,
        attempts: result.attempts.length,
        edited,
        editorModel,
        grounding: groundingMeta,
        sources: sources.map((s) => s.source_url),
        needsReview: validation.needsReview || outputQuality.soft.length > 0,
        outputQuality: outputQuality.summary,
        outputDefects: outputQuality.all.map((d) => d.code),
      },
      userId: guard.user.id,
    });

    return NextResponse.json({
      html,
      content,
      model: result.model,
      providerName: result.providerName,
      rotated: result.rotated,
      edited,
      wordCount,
      sources,
      grounding: groundingMeta,
      validation,
      // Catatan mutu redaksional, terpisah dari `validation` yang menilai
      // akurasi data. Keduanya dilaporkan agar penulis tahu apa yang perlu
      // dilihat sebelum publish.
      outputQuality: {
        summary: outputQuality.summary,
        notes: outputQuality.soft,
      },
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error("[api/v2/ai/article] gagal:", error);

    void logAiTask({
      type: "article",
      status: "failed",
      input: { title, sections: outline.length, targetWords },
      error: error instanceof Error ? error.message : "Gagal.",
      userId: guard.user.id,
    });

    return apiError(
      error instanceof Error ? error.message : "Gagal menghasilkan artikel.",
      error instanceof AiRequestError ? error.status : 502,
    );
  }
}
