import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { AiRequestError, parseJsonFromAi } from "@/lib/ai/client";
import {
  AI_BUDGETS,
  AI_NOT_CONFIGURED_MESSAGE,
  resolveAiCandidates,
  runAiTask,
} from "@/lib/v2-admin/ai-rotation";
import { buildOutlinePrompt, type OutlineSection } from "@/lib/ai/prompts";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/v2/ai/outline
// { title, providerId?, model? } → { sections, model, providerName?, rotated }
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: { title?: unknown; providerId?: unknown; model?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return apiError("Judul wajib dipilih terlebih dahulu.");

  const candidates = await resolveAiCandidates({
    providerId: typeof body.providerId === "number" ? body.providerId : undefined,
    model: typeof body.model === "string" ? body.model : undefined,
    maxCandidates: AI_BUDGETS.fast.maxCandidates,
  });

  if (candidates.length === 0) return apiError(AI_NOT_CONFIGURED_MESSAGE, 503);

  try {
    const result = await runAiTask<OutlineSection[]>({
      candidates,
      messages: buildOutlinePrompt(title),
      budget: AI_BUDGETS.fast,
      temperature: 0.7,
      responseFormatJson: true,
      taskLabel: "outline",
      parse: (raw) => {
        const parsed = parseJsonFromAi<{ sections?: unknown }>(raw);

        const sections: OutlineSection[] = Array.isArray(parsed.sections)
          ? parsed.sections
              .map((section): OutlineSection | null => {
                if (!section || typeof section !== "object") return null;
                const heading = (section as { heading?: unknown }).heading;
                if (typeof heading !== "string" || heading.trim().length === 0) {
                  return null;
                }
                const subsRaw = (section as { subheadings?: unknown })
                  .subheadings;
                const subheadings = Array.isArray(subsRaw)
                  ? subsRaw
                      .filter(
                        (s): s is string =>
                          typeof s === "string" && s.trim().length > 0,
                      )
                      .map((s) => s.trim())
                  : [];
                return { heading: heading.trim(), subheadings };
              })
              .filter((s): s is OutlineSection => s !== null)
          : [];

        // Outline dengan kurang dari 3 bagian bukan kerangka artikel yang layak;
        // perlakukan sebagai kegagalan model dan coba model berikutnya.
        if (sections.length < 3) {
          throw new AiRequestError(
            `Outline hanya berisi ${sections.length} bagian valid (minimum 3).`,
            502,
          );
        }

        return sections;
      },
    });

    void logAiTask({
      type: "outline",
      status: "completed",
      input: { title },
      output: {
        sections: result.value.length,
        model: result.model,
        rotated: result.rotated,
        attempts: result.attempts.length,
      },
      userId: guard.user.id,
    });

    return NextResponse.json({
      sections: result.value,
      model: result.model,
      providerName: result.providerName,
      rotated: result.rotated,
    });
  } catch (error) {
    console.error("[api/v2/ai/outline] gagal:", error);

    void logAiTask({
      type: "outline",
      status: "failed",
      input: { title },
      error: error instanceof Error ? error.message : "Gagal.",
      userId: guard.user.id,
    });

    return apiError(
      error instanceof Error ? error.message : "Gagal menghasilkan outline.",
      error instanceof AiRequestError ? error.status : 502,
    );
  }
}
