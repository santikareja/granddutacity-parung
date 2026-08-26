import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { resolveAiConfig } from "@/lib/v2-admin/ai-runtime";

export const runtime = "nodejs";

// GET /api/v2/ai/status — dipakai UI untuk mengaktifkan/mematikan fitur AI.
// TIDAK mengembalikan API key; hanya menandai ketersediaan + nama model aktif.
export async function GET() {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const config = await resolveAiConfig();

  return NextResponse.json({
    enabled: config !== null,
    source: config?.source ?? null,
    model: config?.model ?? null,
    providerName: config?.providerName ?? null,
  });
}
