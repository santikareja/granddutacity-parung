import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { chatCompletion } from "@/lib/ai/client";
import { resolveAiConfigWithModel } from "@/lib/v2-admin/ai-runtime";
import { buildArticlePrompt, type OutlineSection } from "@/lib/ai/prompts";
import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { ensureCta } from "@/lib/v2-admin/lexical";

export const runtime = "nodejs";
// Generasi artikel 900-1200 kata bisa memakan waktu lama.
export const maxDuration = 300;

// Buang code fence bila model membungkus output dalam ```html ... ```
const stripCodeFence = (raw: string): string => {
  const match = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (match ? match[1] : raw).trim();
};

// POST /api/v2/ai/article — { title, outline, providerId?, model? } → { html, content }
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: {
    title?: unknown;
    outline?: unknown;
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

  const config = await resolveAiConfigWithModel(
    typeof body.providerId === "number" ? body.providerId : undefined,
    typeof body.model === "string" ? body.model : undefined,
  );

  if (!config) {
    return apiError(
      "Layanan AI belum dikonfigurasi. Tambahkan provider di Konfigurasi AI.",
      503,
    );
  }

  try {
    const raw = await chatCompletion({
      config,
      messages: buildArticlePrompt(title, outline),
      temperature: 0.8,
      maxTokens: 4000,
    });

    const html = stripCodeFence(raw);
    if (!html) return apiError("AI menghasilkan artikel kosong.", 502);

    // Konversi ke Lexical (sekaligus sanitasi) lalu enforce CTA wajib.
    const content = ensureCta(htmlToLexicalState(html));

    return NextResponse.json({ html, content });
  } catch (error) {
    console.error("[api/v2/ai/article] gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal menghasilkan artikel.",
      502,
    );
  }
}
