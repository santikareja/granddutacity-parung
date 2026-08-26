import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { listMedia } from "@/lib/v2-admin/media";

export const runtime = "nodejs";

// GET /api/v2/media — daftar media untuk dialog pemilih gambar di editor.
export async function GET(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 200
      ? limitParam
      : 60;

  try {
    const items = await listMedia(limit);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/v2/media] GET gagal:", error);
    return apiError("Gagal memuat daftar media.", 500);
  }
}
