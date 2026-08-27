import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { AiRequestError, parseJsonFromAi } from "@/lib/ai/client";
import {
  AI_BUDGETS,
  AI_NOT_CONFIGURED_MESSAGE,
  resolveAiCandidates,
  runAiTask,
} from "@/lib/v2-admin/ai-rotation";
import { buildSeoPrompt } from "@/lib/ai/prompts";
import { lexicalToPlaintext, slugify } from "@/lib/v2-admin/lexical";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
// Panggilan model bisa lama; beri ruang agar tidak terputus di tengah.
export const maxDuration = 300;

// Batas keras kolom `excerpt` dan field form artikel.
const MAX_EXCERPT = 160;

/**
 * Potong teks pada batas kata terdekat agar tidak terpotong di tengah kata.
 *
 * Model kadang meleset sedikit dari batas karakter yang diminta. Memotongnya di
 * sini lebih baik daripada menolak seluruh hasil SEO hanya karena excerpt
 * kelebihan beberapa karakter.
 */
const clampText = (value: string, max: number): string => {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
};

// POST /api/v2/ai/seo — { title, content } → { metaTitle, metaDescription, slug, focusKeyword }
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: {
    title?: unknown;
    content?: unknown;
    providerId?: unknown;
    model?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return apiError("Judul wajib diisi sebelum menghasilkan SEO.");

  // Sebelumnya endpoint ini memakai resolveAiConfig() tanpa argumen, sehingga
  // pilihan provider/model dari UI diabaikan diam-diam. Sekarang dihormati.
  const candidates = await resolveAiCandidates({
    providerId: typeof body.providerId === "number" ? body.providerId : undefined,
    model: typeof body.model === "string" ? body.model : undefined,
    maxCandidates: AI_BUDGETS.fast.maxCandidates,
  });

  if (candidates.length === 0) return apiError(AI_NOT_CONFIGURED_MESSAGE, 503);

  // Konten dikirim sebagai Lexical state; ubah ke plaintext untuk konteks prompt.
  const plainContent =
    typeof body.content === "string"
      ? body.content
      : lexicalToPlaintext(body.content);

  try {
    const result = await runAiTask({
      candidates,
      messages: buildSeoPrompt(title, plainContent || title),
      budget: AI_BUDGETS.fast,
      temperature: 0.5,
      responseFormatJson: true,
      taskLabel: "seo",
      parse: (raw) => {
        const parsed = parseJsonFromAi<{
          metaTitle?: unknown;
          metaDescription?: unknown;
          excerpt?: unknown;
          slug?: unknown;
          focusKeyword?: unknown;
        }>(raw);

        const asText = (value: unknown): string =>
          typeof value === "string" ? value.trim() : "";

        const seo = {
          metaTitle: asText(parsed.metaTitle),
          metaDescription: asText(parsed.metaDescription),
          // Excerpt ikut satu paket dengan SEO supaya penulis tidak perlu
          // menulisnya terpisah. Dipotong keras di 160 karakter karena kolom
          // `excerpt` di database dan field di form memakai batas itu.
          excerpt: clampText(asText(parsed.excerpt), MAX_EXCERPT),
          focusKeyword: asText(parsed.focusKeyword),
          slug:
            typeof parsed.slug === "string" && parsed.slug.trim()
              ? slugify(parsed.slug)
              : slugify(title),
        };

        // metaTitle dan metaDescription adalah inti dari tugas ini. Bila salah
        // satu kosong, model gagal memenuhi kontrak → coba model berikutnya.
        if (!seo.metaTitle || !seo.metaDescription) {
          throw new AiRequestError(
            "Keluaran SEO tidak lengkap (metaTitle/metaDescription kosong).",
            502,
          );
        }

        return seo;
      },
    });

    void logAiTask({
      type: "seo",
      status: "completed",
      input: { title },
      output: {
        slug: result.value.slug,
        focusKeyword: result.value.focusKeyword,
        hasExcerpt: result.value.excerpt.length > 0,
        model: result.model,
        rotated: result.rotated,
      },
      userId: guard.user.id,
    });

    return NextResponse.json({
      ...result.value,
      model: result.model,
      providerName: result.providerName,
      rotated: result.rotated,
    });
  } catch (error) {
    console.error("[api/v2/ai/seo] gagal:", error);

    void logAiTask({
      type: "seo",
      status: "failed",
      input: { title },
      error: error instanceof Error ? error.message : "Gagal.",
      userId: guard.user.id,
    });

    return apiError(
      error instanceof Error ? error.message : "Gagal menghasilkan SEO.",
      error instanceof AiRequestError ? error.status : 502,
    );
  }
}
