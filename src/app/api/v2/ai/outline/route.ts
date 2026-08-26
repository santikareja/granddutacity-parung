import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { chatCompletion, parseJsonFromAi } from "@/lib/ai/client";
import { resolveAiConfigWithModel } from "@/lib/v2-admin/ai-runtime";
import { buildOutlinePrompt, type OutlineSection } from "@/lib/ai/prompts";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/v2/ai/outline — { title, providerId?, model? } → { sections }
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
      messages: buildOutlinePrompt(title),
      temperature: 0.7,
      responseFormatJson: true,
    });

    const parsed = parseJsonFromAi<{ sections?: unknown }>(raw);

    const sections: OutlineSection[] = Array.isArray(parsed.sections)
      ? parsed.sections
          .map((section): OutlineSection | null => {
            if (!section || typeof section !== "object") return null;
            const heading = (section as { heading?: unknown }).heading;
            if (typeof heading !== "string" || heading.trim().length === 0) {
              return null;
            }
            const subsRaw = (section as { subheadings?: unknown }).subheadings;
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

    if (sections.length === 0) {
      return apiError("AI tidak menghasilkan outline yang valid.", 502);
    }

    void logAiTask({
      type: "outline",
      status: "completed",
      input: { title },
      output: { sections: sections.length },
      userId: guard.user.id,
    });

    return NextResponse.json({ sections });
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
      502,
    );
  }
}
