import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import {
  hasPexels,
  hasUnsplash,
  searchStock,
  type StockProvider,
} from "@/lib/v2-admin/stock-photos";

export const runtime = "nodejs";

// GET /api/v2/media/stock?provider=&q=&page=
export async function GET(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  const query = (url.searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  // Tanpa query: laporkan provider mana yang aktif (untuk enable/disable UI).
  if (!query) {
    return NextResponse.json({
      providers: { unsplash: hasUnsplash(), pexels: hasPexels() },
      photos: [],
    });
  }

  if (provider !== "unsplash" && provider !== "pexels") {
    return apiError("Parameter provider harus 'unsplash' atau 'pexels'.");
  }

  if (provider === "unsplash" && !hasUnsplash()) {
    return apiError("Unsplash belum dikonfigurasi (UNSPLASH_ACCESS_KEY).", 503);
  }
  if (provider === "pexels" && !hasPexels()) {
    return apiError("Pexels belum dikonfigurasi (PEXELS_API_KEY).", 503);
  }

  try {
    const photos = await searchStock(provider as StockProvider, query, page);
    return NextResponse.json({
      providers: { unsplash: hasUnsplash(), pexels: hasPexels() },
      photos,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return apiError("Timeout saat menghubungi penyedia foto stok.", 504);
    }
    console.error("[api/v2/media/stock] gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mencari foto stok.",
      502,
    );
  }
}
