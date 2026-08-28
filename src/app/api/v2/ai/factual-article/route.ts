import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { AiRequestError } from "@/lib/ai/client";
import { generateFactualArticle } from "@/lib/ai/factual/generate-factual-article";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
// Perencanaan tool + panggilan API eksternal + penulisan artikel. AI_BUDGETS
// (factualPlan + factualArticle) menjaga total tetap di bawah batas ini.
export const maxDuration = 300;

// POST /api/v2/ai/factual-article
// { topic, category?, targetWords?, providerId?, model? }
//   → { html, content, wordCount, sources, toolsUsed, fallbackUsed,
//       validation, model, providerName?, rotated }
//
// TIDAK menyimpan artikel. Mengembalikan draft + sitasi + hasil validasi ke
// editor untuk ditinjau penulis (kontrol manual), lalu disimpan lewat alur
// simpan yang sudah ada. Metadata dicatat ke ai_tasks untuk audit.
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: {
    topic?: unknown;
    category?: unknown;
    targetWords?: unknown;
    providerId?: unknown;
    model?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) return apiError("Topik wajib diisi.");

  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const targetWords =
    typeof body.targetWords === "number" && Number.isFinite(body.targetWords)
      ? body.targetWords
      : undefined;
  const providerId =
    typeof body.providerId === "number" ? body.providerId : undefined;
  const model = typeof body.model === "string" ? body.model : undefined;

  try {
    const result = await generateFactualArticle({
      topic,
      category,
      targetWords,
      providerId,
      model,
      signal: request.signal,
    });

    void logAiTask({
      type: "factual-article",
      status: "completed",
      input: { topic, category, targetWords: targetWords ?? null },
      output: {
        model: result.model,
        rotated: result.rotated,
        wordCount: result.wordCount,
        toolsUsed: result.toolsUsed,
        fallbackUsed: result.fallbackUsed,
        needsReview: result.validation.needsReview,
        reviewNotes: result.validation.reasons,
        sources: result.sources.map((s) => ({
          name: s.source_name,
          url: s.source_url,
          provider: s.provider,
        })),
      },
      userId: guard.user.id,
    });

    return NextResponse.json({
      html: result.html,
      content: result.content,
      wordCount: result.wordCount,
      sources: result.sources,
      toolsUsed: result.toolsUsed,
      fallbackUsed: result.fallbackUsed,
      validation: result.validation,
      model: result.model,
      providerName: result.providerName,
      rotated: result.rotated,
    });
  } catch (error) {
    console.error("[api/v2/ai/factual-article] gagal:", error);

    void logAiTask({
      type: "factual-article",
      status: "failed",
      input: { topic, category },
      error: error instanceof Error ? error.message : "Gagal.",
      userId: guard.user.id,
    });

    return apiError(
      error instanceof Error ? error.message : "Gagal menghasilkan artikel.",
      error instanceof AiRequestError ? error.status : 502,
    );
  }
}
