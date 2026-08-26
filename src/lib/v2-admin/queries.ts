// Query statistik & daftar untuk dashboard CMS kustom. Server-side only.

import { and, count, desc, eq, gt, isNotNull, lte } from "drizzle-orm";

import { db } from "@/db";
import { artikel, categories, media, tags } from "@/db/schema";

export type DashboardStats = {
  published: number;
  draft: number;
  scheduled: number;
  media: number;
  categories: number;
  tags: number;
};

export type RecentArticle = {
  id: number;
  title: string | null;
  slug: string | null;
  status: "draft" | "published" | null;
  updatedAt: Date;
  publishedAt: Date | null;
  aiGenerated: boolean | null;
};

const zeroStats: DashboardStats = {
  published: 0,
  draft: 0,
  scheduled: 0,
  media: 0,
  categories: 0,
  tags: 0,
};

// Semua query dibungkus try/catch: dashboard harus tetap render walau DB sedang
// bermasalah, dengan angka 0 dan pesan di UI — bukan halaman error.
export const getDashboardStats = async (): Promise<{
  stats: DashboardStats;
  error: string | null;
}> => {
  const now = new Date();

  try {
    const [
      publishedRows,
      draftRows,
      scheduledRows,
      mediaRows,
      categoryRows,
      tagRows,
    ] = await Promise.all([
      // published = sudah tayang (publishedAt <= sekarang, atau belum diisi).
      db
        .select({ value: count() })
        .from(artikel)
        .where(
          and(eq(artikel.status, "published"), lte(artikel.publishedAt, now)),
        ),
      db.select({ value: count() }).from(artikel).where(eq(artikel.status, "draft")),
      // scheduled = published tapi tanggal tayang masih di masa depan.
      db
        .select({ value: count() })
        .from(artikel)
        .where(
          and(
            eq(artikel.status, "published"),
            isNotNull(artikel.publishedAt),
            gt(artikel.publishedAt, now),
          ),
        ),
      db.select({ value: count() }).from(media),
      db.select({ value: count() }).from(categories),
      db.select({ value: count() }).from(tags),
    ]);

    return {
      stats: {
        published: publishedRows[0]?.value ?? 0,
        draft: draftRows[0]?.value ?? 0,
        scheduled: scheduledRows[0]?.value ?? 0,
        media: mediaRows[0]?.value ?? 0,
        categories: categoryRows[0]?.value ?? 0,
        tags: tagRows[0]?.value ?? 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("[v2-admin] gagal memuat statistik:", error);
    return {
      stats: zeroStats,
      error:
        "Gagal memuat statistik dari database. Periksa koneksi DATABASE_URI.",
    };
  }
};

export const getRecentArticles = async (
  limit = 6,
): Promise<RecentArticle[]> => {
  try {
    return await db
      .select({
        id: artikel.id,
        title: artikel.title,
        slug: artikel.slug,
        status: artikel.status,
        updatedAt: artikel.updatedAt,
        publishedAt: artikel.publishedAt,
        aiGenerated: artikel.aiGenerated,
      })
      .from(artikel)
      .orderBy(desc(artikel.updatedAt))
      .limit(limit);
  } catch (error) {
    console.error("[v2-admin] gagal memuat artikel terbaru:", error);
    return [];
  }
};
