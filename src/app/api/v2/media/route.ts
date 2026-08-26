import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { listMediaPaged } from "@/lib/v2-admin/media";

export const runtime = "nodejs";

// GET /api/v2/media — daftar media dengan pagination + pencarian.
//
// Query: ?page=1&search=teks&limit=30 (limit di-clamp 1-100 oleh listMediaPaged).
// Respons: { items, total, page, totalPages }. Pemanggil lama yang hanya membaca
// `items` (dialog pemilih gambar di editor) tetap kompatibel.
export async function GET(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const pageParam = Number(url.searchParams.get("page"));
  const limitParam = Number(url.searchParams.get("limit"));
  const search = url.searchParams.get("search") ?? undefined;

  try {
    const result = await listMediaPaged({
      page: Number.isFinite(pageParam) ? pageParam : undefined,
      limit: Number.isFinite(limitParam) ? limitParam : undefined,
      search,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/v2/media] GET gagal:", error);
    return apiError("Gagal memuat daftar media.", 500);
  }
}
