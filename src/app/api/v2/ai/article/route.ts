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
  DEFAULT_ARTICLE_WORDS,
  MAX_ARTICLE_WORDS,
  MIN_ARTICLE_WORDS,
  type OutlineSection,
} from "@/lib/ai/prompts";
import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { ensureCta } from "@/lib/v2-admin/lexical";
import { sanitizeAiHtml } from "@/lib/ai/sanitize-html";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

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
// { title, outline, targetWords?, providerId?, model? }
//   → { html, content, model, providerName?, rotated, wordCount, warning? }
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: {
    title?: unknown;
    outline?: unknown;
    targetWords?: unknown;
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

  // Anggaran token harus mengikuti target panjang. Dengan maxTokens tetap 4000,
  // artikel 2.000+ kata terpotong di tengah tag HTML dan hasil konversinya
  // rusak. Faktor 3.2 memberi ruang untuk kata Indonesia (>1 token/kata) plus
  // markup heading/list/tabel.
  const maxTokens = Math.min(16_000, Math.max(4_000, Math.round(targetWords * 3.2)));

  const candidates = await resolveAiCandidates({
    providerId: typeof body.providerId === "number" ? body.providerId : undefined,
    model: typeof body.model === "string" ? body.model : undefined,
    maxCandidates: AI_BUDGETS.long.maxCandidates,
  });

  if (candidates.length === 0) return apiError(AI_NOT_CONFIGURED_MESSAGE, 503);

  try {
    const result = await runAiTask<string>({
      candidates,
      messages: buildArticlePrompt(title, outline, targetWords),
      budget: AI_BUDGETS.long,
      temperature: 0.8,
      maxTokens,
      taskLabel: "article",
      // Validasi DISENGAJA minimal dan identik dengan perilaku sebelumnya:
      // hanya keluaran kosong yang ditolak. Menolak berdasarkan panjang akan
      // membuang artikel yang sebenarnya masih berguna dan menghabiskan
      // anggaran waktu rotasi. Kependekan/keterpotongan dilaporkan sebagai
      // peringatan supaya penulis yang memutuskan, bukan dibuang diam-diam.
      parse: (raw) => {
        const rawHtml = stripCodeFence(raw);
        if (!rawHtml) {
          throw new AiRequestError("AI menghasilkan artikel kosong.", 502);
        }
        return rawHtml;
      },
    });

    const rawHtml = result.value;

    // Konversi ke Lexical (sekaligus sanitasi) lalu enforce CTA wajib.
    // Di-feed dari HTML mentah agar `content` tetap identik.
    const content = ensureCta(htmlToLexicalState(rawHtml));

    // Sanitasi hanya field `html` yang dikembalikan ke klien untuk pratinjau.
    const html = sanitizeAiHtml(rawHtml);

    const wordCount = countWords(rawHtml);
    // Keluaran yang tidak diakhiri tag tertutup biasanya terpotong di tengah
    // karena batas token provider.
    const looksTruncated = !/>\s*$/.test(rawHtml);
    const tooShort = wordCount < Math.round(targetWords * 0.6);

    const warning = looksTruncated
      ? "Keluaran AI tampak terpotong di tengah. Periksa bagian akhir artikel, atau generate ulang."
      : tooShort
        ? `Artikel hanya ~${wordCount} kata dari target ${targetWords}. Anda bisa generate ulang atau melengkapinya manual.`
        : undefined;

    void logAiTask({
      type: "article",
      status: "completed",
      input: { title, sections: outline.length, targetWords },
      output: {
        htmlLength: html.length,
        wordCount,
        model: result.model,
        rotated: result.rotated,
        attempts: result.attempts.length,
      },
      userId: guard.user.id,
    });

    return NextResponse.json({
      html,
      content,
      model: result.model,
      providerName: result.providerName,
      rotated: result.rotated,
      wordCount,
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
