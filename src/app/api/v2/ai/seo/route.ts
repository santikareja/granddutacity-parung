import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { chatCompletion, parseJsonFromAi } from "@/lib/ai/client";
import { resolveAiConfig } from "@/lib/v2-admin/ai-runtime";
import { buildSeoPrompt } from "@/lib/ai/prompts";
import { lexicalToPlaintext, slugify } from "@/lib/v2-admin/lexical";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
// Panggilan model bisa lama; beri ruang agar tidak terputus di tengah.
export const maxDuration = 300;

// POST /api/v2/ai/seo — { title, content } → { metaTitle, metaDescription, slug, focusKeyword }
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: { title?: unknown; content?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return apiError("Judul wajib diisi sebelum menghasilkan SEO.");

  const config = await resolveAiConfig();
  if (!config) {
    return apiError(
      "Layanan AI belum dikonfigurasi. Tambahkan provider di Konfigurasi AI.",
      503,
    );
  }

  // Konten dikirim sebagai Lexical state; ubah ke plaintext untuk konteks prompt.
  const plainContent =
    typeof body.content === "string"
      ? body.content
      : lexicalToPlaintext(body.content);

  try {
    const raw = await chatCompletion({
      config,
      messages: buildSeoPrompt(title, plainContent || title),
      temperature: 0.5,
      responseFormatJson: true,
    });

    const parsed = parseJsonFromAi<{
      metaTitle?: unknown;
      metaDescription?: unknown;
      slug?: unknown;
      focusKeyword?: unknown;
    }>(raw);

    const result = {
      metaTitle:
        typeof parsed.metaTitle === "string" ? parsed.metaTitle.trim() : "",
      metaDescription:
        typeof parsed.metaDescription === "string"
          ? parsed.metaDescription.trim()
          : "",
      focusKeyword:
        typeof parsed.focusKeyword === "string" ? parsed.focusKeyword.trim() : "",
      slug:
        typeof parsed.slug === "string" && parsed.slug.trim()
          ? slugify(parsed.slug)
          : slugify(title),
    };

    void logAiTask({
      type: "seo",
      status: "completed",
      input: { title },
      output: { slug: result.slug, focusKeyword: result.focusKeyword },
      userId: guard.user.id,
    });

    return NextResponse.json(result);
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
      502,
    );
  }
}
