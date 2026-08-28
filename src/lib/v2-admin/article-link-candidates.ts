// Kandidat tautan internal untuk artikel yang sedang digenerate.
//
// Model AI TIDAK boleh mengarang slug artikel (akan jadi tautan mati dan
// melanggar aturan anti-halusinasi). Karena itu route menyuplai daftar artikel
// yang BENAR-BENAR sudah published dari sini, lalu prompt hanya mengizinkan AI
// menautkan salah satu path pada daftar ini — maksimal satu, hanya bila relevan.
//
// Server-side only. Defensif: kegagalan DB tidak boleh menggagalkan generasi
// artikel, jadi semua error ditangkap dan mengembalikan daftar kosong (artikel
// akan ditulis tanpa tautan internal, tetap valid).

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { artikel } from "@/db/schema";
import type { RelatedArticle } from "@/lib/ai/prompts";

/**
 * Ambil beberapa artikel published (judul + path) sebagai kandidat tautan
 * internal. URL artikel berbentuk `/{slug}` (lihat sitemap.ts).
 */
export const getInternalLinkCandidates = async (
  limit = 8,
): Promise<RelatedArticle[]> => {
  const safeLimit = Math.max(1, Math.min(20, Math.trunc(limit)));

  try {
    const rows = await db
      .select({ title: artikel.title, slug: artikel.slug })
      .from(artikel)
      .where(and(eq(artikel.status, "published"), isNotNull(artikel.slug)))
      .orderBy(desc(artikel.publishedAt))
      .limit(safeLimit);

    return rows
      .filter(
        (row): row is { title: string; slug: string } =>
          typeof row.title === "string" &&
          row.title.trim().length > 0 &&
          typeof row.slug === "string" &&
          row.slug.trim().length > 0,
      )
      .map((row) => ({
        title: row.title.trim(),
        path: `/${row.slug.trim().replace(/^\/+/, "")}`,
      }));
  } catch (error) {
    console.error(
      "[article-link-candidates] gagal membaca artikel published:",
      error,
    );
    return [];
  }
};
