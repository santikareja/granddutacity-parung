import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { AiRequestError, parseJsonFromAi } from "@/lib/ai/client";
import {
  AI_BUDGETS,
  AI_NOT_CONFIGURED_MESSAGE,
  resolveAiCandidates,
  runAiTask,
} from "@/lib/v2-admin/ai-rotation";
import { buildImageMetaPrompt } from "@/lib/ai/prompts";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_ALT = 125;

/**
 * POST /api/v2/ai/image-meta — { context?, description? } → { name, alt, caption }
 *
 * Dipakai untuk mengisi metadata gambar pada unggahan MANUAL, di mana tidak ada
 * deskripsi dari penyedia foto. Petunjuk yang tersedia hanya konteks artikel dan
 * nama berkas, jadi prompt sengaja diarahkan menghasilkan metadata umum yang
 * aman alih-alih menebak isi gambar.
 *
 * CATATAN: model di sini TIDAK melihat gambarnya (bukan model vision). Hasilnya
 * wajib diperiksa penulis sebelum disimpan; UI menyampaikan hal itu.
 */
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: { context?: unknown; description?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const context =
    typeof body.context === "string" && body.context.trim()
      ? body.context.trim().slice(0, 300)
      : "Artikel properti Grand Duta City Parung";

  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 300) : "";

  const candidates = await resolveAiCandidates({
    maxCandidates: AI_BUDGETS.quick.maxCandidates,
  });

  if (candidates.length === 0) return apiError(AI_NOT_CONFIGURED_MESSAGE, 503);

  try {
    const result = await runAiTask({
      candidates,
      messages: buildImageMetaPrompt(context, description),
      budget: AI_BUDGETS.quick,
      temperature: 0.6,
      responseFormatJson: true,
      taskLabel: "image-meta",
      parse: (raw) => {
        const parsed = parseJsonFromAi<{
          name?: unknown;
          alt?: unknown;
          caption?: unknown;
        }>(raw);

        const asText = (value: unknown): string =>
          typeof value === "string" ? value.trim() : "";

        const alt = asText(parsed.alt);
        // alt text adalah satu-satunya field wajib: tanpa itu gambar tidak lolos
        // standar SEO/aksesibilitas proyek ini.
        if (!alt) {
          throw new AiRequestError("Metadata gambar tanpa alt text.", 502);
        }

        return {
          name: asText(parsed.name),
          alt: alt.slice(0, MAX_ALT),
          caption: asText(parsed.caption),
        };
      },
    });

    void logAiTask({
      type: "image-meta",
      status: "completed",
      input: { hasDescription: description.length > 0 },
      output: { model: result.model, rotated: result.rotated },
      userId: guard.user.id,
    });

    return NextResponse.json({
      ...result.value,
      model: result.model,
      rotated: result.rotated,
    });
  } catch (error) {
    console.error("[api/v2/ai/image-meta] gagal:", error);

    void logAiTask({
      type: "image-meta",
      status: "failed",
      input: { hasDescription: description.length > 0 },
      error: error instanceof Error ? error.message : "Gagal.",
      userId: guard.user.id,
    });

    return apiError(
      error instanceof Error ? error.message : "Gagal membuat metadata gambar.",
      error instanceof AiRequestError ? error.status : 502,
    );
  }
}
