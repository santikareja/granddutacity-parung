// Repository artikel untuk CMS kustom. Server-side only.
//
// Memakai tabel `artikel` yang sama dengan Payload. Dua aturan penting yang
// diwarisi dari perilaku Payload dan WAJIB dipertahankan agar situs publik tidak
// rusak:
//   1. `status` (dibaca frontend/sitemap) dan `_status` (mekanisme draft Payload)
//      harus selalu sama.
//   2. Setiap artikel wajib diakhiri CTA berisi tautan ke homepage dengan anchor
//      "Grand Duta City Parung" — lihat ensureCta().

import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { artikel, artikelRels, categories, media, tags } from "@/db/schema";

export type ArticleStatus = "draft" | "published";

export type ArticleListItem = {
  id: number;
  title: string | null;
  slug: string | null;
  status: ArticleStatus | null;
  publishedAt: Date | null;
  updatedAt: Date;
  aiGenerated: boolean | null;
  featuredImageUrl: string | null;
  categoryNames: string[];
};

export type ArticleListResult = {
  items: ArticleListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export type ArticleDetail = {
  id: number;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: unknown;
  featuredImageId: number | null;
  featuredImageUrl: string | null;
  status: ArticleStatus | null;
  publishedAt: Date | null;
  seoMetaTitle: string | null;
  seoMetaDescription: string | null;
  seoFocusKeyword: string | null;
  aiGenerated: boolean | null;
  aiTopic: string | null;
  categoryIds: number[];
  tagIds: number[];
  updatedAt: Date;
};

const PAGE_SIZE = 20;

// Resolusi URL media mengikuti prioritas yang dipakai frontend.
const mediaUrlExpr = media.url;

export const listArticles = async (options: {
  page?: number;
  search?: string;
  status?: ArticleStatus | "all";
}): Promise<ArticleListResult> => {
  const page = Math.max(1, options.page ?? 1);
  const search = options.search?.trim() ?? "";
  const status = options.status ?? "all";

  const filters: SQL[] = [];

  if (status !== "all") {
    filters.push(eq(artikel.status, status));
  }

  if (search) {
    const pattern = `%${search}%`;
    const searchFilter = or(
      ilike(artikel.title, pattern),
      ilike(artikel.slug, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: artikel.id,
        title: artikel.title,
        slug: artikel.slug,
        status: artikel.status,
        publishedAt: artikel.publishedAt,
        updatedAt: artikel.updatedAt,
        aiGenerated: artikel.aiGenerated,
        featuredImageUrl: mediaUrlExpr,
      })
      .from(artikel)
      .leftJoin(media, eq(artikel.featuredImageId, media.id))
      .where(where)
      .orderBy(desc(artikel.updatedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(artikel).where(where),
  ]);

  const total = totalRows[0]?.value ?? 0;

  // Ambil nama kategori untuk halaman ini saja (bukan seluruh tabel), lalu
  // kelompokkan per artikel. Dipakai untuk kolom "Kategori" di daftar admin.
  const articleIds = rows.map((row) => row.id);
  const categoryNamesByArticle = new Map<number, string[]>();
  if (articleIds.length > 0) {
    const rels = await db
      .select({
        parentId: artikelRels.parentId,
        categoryName: categories.name,
      })
      .from(artikelRels)
      .innerJoin(categories, eq(artikelRels.categoriesId, categories.id))
      .where(inArray(artikelRels.parentId, articleIds));

    for (const rel of rels) {
      const list = categoryNamesByArticle.get(rel.parentId) ?? [];
      list.push(rel.categoryName);
      categoryNamesByArticle.set(rel.parentId, list);
    }
  }

  return {
    items: rows.map((row) => ({
      ...row,
      categoryNames: categoryNamesByArticle.get(row.id) ?? [],
    })) as ArticleListItem[],
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

export const getArticleById = async (
  id: number,
): Promise<ArticleDetail | null> => {
  const rows = await db
    .select({
      id: artikel.id,
      title: artikel.title,
      slug: artikel.slug,
      excerpt: artikel.excerpt,
      content: artikel.content,
      featuredImageId: artikel.featuredImageId,
      featuredImageUrl: mediaUrlExpr,
      status: artikel.status,
      publishedAt: artikel.publishedAt,
      seoMetaTitle: artikel.seoMetaTitle,
      seoMetaDescription: artikel.seoMetaDescription,
      seoFocusKeyword: artikel.seoFocusKeyword,
      aiGenerated: artikel.aiGenerated,
      aiTopic: artikel.aiTopic,
      updatedAt: artikel.updatedAt,
    })
    .from(artikel)
    .leftJoin(media, eq(artikel.featuredImageId, media.id))
    .where(eq(artikel.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Relasi kategori & tag tersimpan di tabel polimorfik artikel_rels.
  const rels = await db
    .select({
      path: artikelRels.path,
      tagsId: artikelRels.tagsId,
      categoriesId: artikelRels.categoriesId,
    })
    .from(artikelRels)
    .where(eq(artikelRels.parentId, id));

  return {
    ...(row as Omit<ArticleDetail, "categoryIds" | "tagIds">),
    categoryIds: rels
      .map((r) => r.categoriesId)
      .filter((v): v is number => typeof v === "number"),
    tagIds: rels
      .map((r) => r.tagsId)
      .filter((v): v is number => typeof v === "number"),
  };
};

export const listCategories = async () =>
  db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(categories.name);

export const listTags = async () =>
  db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(tags.name);
