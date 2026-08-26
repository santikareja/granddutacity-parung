import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { chatCompletion } from "@/lib/ai/client";
import { resolveAiConfigWithModel } from "@/lib/v2-admin/ai-runtime";
import { buildTextToolPrompt, type TextToolMode } from "@/lib/ai/prompts";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODES: readonly TextToolMode[] = [
  "rewrite",
  "expand",
  "shorten",
  "proofread",
];

const MAX_TEXT_LENGTH = 8000;

// POST /api/v2/ai/text-tool — { mode, text, providerId?, model? } → { text }
// Alat AI editor untuk teks terseleksi. Keluaran berupa plain text.
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: {
    mode?: unknown;
    text?: unknown;
    providerId?: unknown;
    model?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const mode = body.mode;
  if (typeof mode !== "string" || !MODES.includes(mode as TextToolMode)) {
    return apiError("Mode tidak valid. Pilih rewrite/expand/shorten/proofread.");
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return apiError("Teks wajib diisi.");
  if (text.length > MAX_TEXT_LENGTH) {
    return apiError(
      `Teks terlalu panjang (maks ${MAX_TEXT_LENGTH} karakter). Pilih bagian lebih kecil.`,
    );
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

  const typedMode = mode as TextToolMode;

  try {
    const raw = await chatCompletion({
      config,
      messages: buildTextToolPrompt(typedMode, text),
      // Proofread harus konservatif; mode lain boleh lebih kreatif.
      temperature: typedMode === "proofread" ? 0.2 : 0.6,
    });

    const result = raw.trim();
    if (!result) return apiError("AI tidak menghasilkan teks.", 502);

    // Log best-effort (tanpa menggagalkan respons). Simpan ringkasan aman saja.
    void logAiTask({
      type: "text-tool",
      status: "completed",
      input: { mode: typedMode, length: text.length },
      output: { length: result.length },
      userId: guard.user.id,
    });

    return NextResponse.json({ text: result });
  } catch (error) {
    console.error("[api/v2/ai/text-tool] gagal:", error);

    void logAiTask({
      type: "text-tool",
      status: "failed",
      input: { mode: typedMode, length: text.length },
      error: error instanceof Error ? error.message : "Gagal.",
      userId: guard.user.id,
    });

    return apiError(
      error instanceof Error ? error.message : "Gagal memproses teks.",
      502,
    );
  }
}
