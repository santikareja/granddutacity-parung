import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { chatCompletion, parseJsonFromAi } from "@/lib/ai/client";
import { resolveAiConfigWithModel } from "@/lib/v2-admin/ai-runtime";
import { buildTitlesPrompt } from "@/lib/ai/prompts";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/v2/ai/titles — { topic, providerId?, model? } → { titles: string[] }
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: { topic?: unknown; providerId?: unknown; model?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) return apiError("Ide topik wajib diisi.");

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
      messages: buildTitlesPrompt(topic),
      temperature: 0.9,
      responseFormatJson: true,
    });

    const parsed = parseJsonFromAi<{ titles?: unknown }>(raw);
    const titles = Array.isArray(parsed.titles)
      ? parsed.titles
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim())
          .slice(0, 7)
      : [];

    if (titles.length === 0) {
      return apiError("AI tidak menghasilkan judul yang valid.", 502);
    }

    void logAiTask({
      type: "titles",
      status: "completed",
      input: { topicLength: topic.length },
      output: { count: titles.length },
      userId: guard.user.id,
    });

    return NextResponse.json({ titles });
  } catch (error) {
    console.error("[api/v2/ai/titles] gagal:", error);

    void logAiTask({
      type: "titles",
      status: "failed",
      input: { topicLength: topic.length },
      error: error instanceof Error ? error.message : "Gagal.",
      userId: guard.user.id,
    });

    return apiError(
      error instanceof Error ? error.message : "Gagal menghasilkan judul.",
      502,
    );
  }
}
