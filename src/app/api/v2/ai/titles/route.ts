import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { AiRequestError, parseJsonFromAi } from "@/lib/ai/client";
import {
  AI_BUDGETS,
  AI_NOT_CONFIGURED_MESSAGE,
  resolveAiCandidates,
  runAiTask,
} from "@/lib/v2-admin/ai-rotation";
import { buildTitlesPrompt, DEFAULT_TITLE_COUNT } from "@/lib/ai/prompts";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/v2/ai/titles
// { topic, count?, providerId?, model? } → { titles, model, providerName?, rotated }
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: {
    topic?: unknown;
    count?: unknown;
    providerId?: unknown;
    model?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) return apiError("Ide topik wajib diisi.");

  // Jumlah opsi judul. Dibatasi agar prompt tetap fokus dan respons ringkas.
  const count =
    typeof body.count === "number" && Number.isFinite(body.count)
      ? Math.min(10, Math.max(3, Math.trunc(body.count)))
      : DEFAULT_TITLE_COUNT;

  const candidates = await resolveAiCandidates({
    providerId: typeof body.providerId === "number" ? body.providerId : undefined,
    model: typeof body.model === "string" ? body.model : undefined,
    maxCandidates: AI_BUDGETS.fast.maxCandidates,
  });

  if (candidates.length === 0) return apiError(AI_NOT_CONFIGURED_MESSAGE, 503);

  try {
    const result = await runAiTask<string[]>({
      candidates,
      messages: buildTitlesPrompt(topic, count),
      budget: AI_BUDGETS.fast,
      temperature: 0.9,
      responseFormatJson: true,
      taskLabel: "titles",
      // Validasi ikut menentukan sukses: model yang mengembalikan JSON rusak
      // atau judul terlalu sedikit akan digantikan model berikutnya.
      parse: (raw) => {
        const parsed = parseJsonFromAi<{ titles?: unknown }>(raw);

        const titles = Array.isArray(parsed.titles)
          ? Array.from(
              new Set(
                parsed.titles
                  .filter(
                    (t): t is string =>
                      typeof t === "string" && t.trim().length > 0,
                  )
                  // Sebagian model tetap membungkus judul dengan tanda kutip
                  // meski dilarang; bersihkan agar tidak bocor ke UI.
                  .map((t) => t.trim().replace(/^["'“”]+|["'“”]+$/g, "").trim())
                  .filter((t) => t.length > 0),
              ),
            )
          : [];

        if (titles.length < Math.min(3, count)) {
          throw new AiRequestError(
            `Keluaran hanya berisi ${titles.length} judul valid (minimum ${Math.min(3, count)}).`,
            502,
          );
        }

        return titles.slice(0, count);
      },
    });

    void logAiTask({
      type: "titles",
      status: "completed",
      input: { topicLength: topic.length, count },
      output: {
        count: result.value.length,
        model: result.model,
        rotated: result.rotated,
        attempts: result.attempts.length,
      },
      userId: guard.user.id,
    });

    return NextResponse.json({
      titles: result.value,
      model: result.model,
      providerName: result.providerName,
      rotated: result.rotated,
    });
  } catch (error) {
    console.error("[api/v2/ai/titles] gagal:", error);

    void logAiTask({
      type: "titles",
      status: "failed",
      input: { topicLength: topic.length, count },
      error: error instanceof Error ? error.message : "Gagal.",
      userId: guard.user.id,
    });

    return apiError(
      error instanceof Error ? error.message : "Gagal menghasilkan judul.",
      error instanceof AiRequestError ? error.status : 502,
    );
  }
}
