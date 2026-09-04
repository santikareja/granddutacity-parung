// Kandidat tautan internal antar artikel.
//
// STATUS: TIDAK LAGI DIPAKAI JALUR GENERASI ARTIKEL (4 September 2026).
//
// Sebelumnya route artikel menyuplai daftar ini ke prompt, dan prompt
// mengizinkan AI menautkan maksimal dua artikel lain. Praktiknya tautan itu
// hampir selalu terbaca dipaksakan: model menyisipkannya demi memenuhi kuota,
// bukan karena kalimatnya memang butuh rujukan. Pemilik memutuskan mencabutnya
// dan menggantinya dengan kutipan sumber data berotoritas — tautan yang justru
// menambah kredibilitas artikel.
//
// Fungsi ini DIPERTAHANKAN, tidak dihapus, karena daftar artikel published
// berguna untuk keperluan lain (mis. blok "Baca juga" yang dirender komponen,
// bukan disuntik AI) dan menghapusnya berarti kehilangan query yang sudah
// teruji. Bila enam bulan berlalu tanpa ada pemakai, ia layak dihapus.
//
// Server-side only. Defensif: kegagalan DB mengembalikan daftar kosong.

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { artikel } from "@/db/schema";

/** Artikel published sebagai kandidat rujukan internal. */
export type RelatedArticle = { title: string; path: string };

/**
 * Ambil beberapa artikel published (judul + path). URL artikel berbentuk
 * `/{slug}` (lihat sitemap.ts).
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
