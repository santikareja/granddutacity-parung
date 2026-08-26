// Operasi tulis artikel untuk CMS kustom. Server-side only.
//
// Menjaga dua invarian yang diwarisi dari hook Payload:
//   1. `status` dan `_status` selalu sinkron.
//   2. CTA "Grand Duta City Parung" selalu ada di akhir konten (idempoten).
// Juga menjaga relasi kategori/tag di tabel polimorfik artikel_rels.

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { artikel, artikelRels } from "@/db/schema";
import {
  ensureCta,
  extractFeaturedImageId,
  lexicalToPlaintext,
  slugify,
} from "./lexical";
import type { ArticleStatus } from "./articles";

export type ArticleWriteInput = {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content?: unknown;
  featuredImageId?: number | null;
  status?: ArticleStatus;
  publishedAt?: string | null;
  seoMetaTitle?: string | null;
  seoMetaDescription?: string | null;
  seoFocusKeyword?: string | null;
  categoryIds?: number[];
  tagIds?: number[];
  aiGenerated?: boolean;
  aiTopic?: string | null;
  aiOutline?: unknown;
};

const EXCERPT_MAX = 160;

const buildExcerpt = (
  provided: string | null | undefined,
  content: unknown,
): string | null => {
  const trimmed = provided?.trim();
  if (trimmed) return trimmed.slice(0, EXCERPT_MAX);

  const plain = lexicalToPlaintext(content).replace(/\s+/g, " ").trim();
  if (!plain) return null;
  return plain.length > EXCERPT_MAX ? `${plain.slice(0, EXCERPT_MAX - 1)}…` : plain;
};

// Sinkronkan relasi kategori/tag: hapus baris lama untuk path terkait lalu
// masukkan yang baru. Dijalankan dalam transaksi oleh pemanggil.
const syncRels = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  articleId: number,
  categoryIds: number[],
  tagIds: number[],
): Promise<void> => {
  await tx
    .delete(artikelRels)
    .where(
      and(eq(artikelRels.parentId, articleId), eq(artikelRels.path, "kategori")),
    );
  await tx
    .delete(artikelRels)
    .where(and(eq(artikelRels.parentId, articleId), eq(artikelRels.path, "tags")));

  const rows: (typeof artikelRels.$inferInsert)[] = [];

  categoryIds.forEach((categoryId, index) => {
    rows.push({
      parentId: articleId,
      path: "kategori",
      order: index + 1,
      categoriesId: categoryId,
    });
  });

  tagIds.forEach((tagId, index) => {
    rows.push({
      parentId: articleId,
      path: "tags",
      order: index + 1,
      tagsId: tagId,
    });
  });

  if (rows.length > 0) {
    await tx.insert(artikelRels).values(rows);
  }
};

type PreparedFields = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  featuredImageId: number | null;
  status: ArticleStatus;
  publishedAt: Date | null;
  seoMetaTitle: string | null;
  seoMetaDescription: string | null;
  seoFocusKeyword: string | null;
  aiGenerated: boolean;
  aiTopic: string | null;
  aiOutline: unknown;
};

const prepare = (
  input: ArticleWriteInput,
  existing?: { publishedAt: Date | null; featuredImageId: number | null },
): PreparedFields => {
  const title = input.title.trim();
  const status: ArticleStatus = input.status === "published" ? "published" : "draft";

  // CTA di-enforce di server, bukan mengandalkan kepatuhan editor/AI.
  const content = input.content ? ensureCta(input.content) : input.content;

  // Featured image otomatis dari gambar pertama di konten bila belum diisi.
  const featuredImageId =
    input.featuredImageId ??
    existing?.featuredImageId ??
    extractFeaturedImageId(content);

  // publishedAt terisi otomatis saat pertama kali dipublish.
  let publishedAt: Date | null = existing?.publishedAt ?? null;
  if (input.publishedAt) {
    const parsed = new Date(input.publishedAt);
    publishedAt = Number.isNaN(parsed.getTime()) ? publishedAt : parsed;
  }
  if (status === "published" && !publishedAt) {
    publishedAt = new Date();
  }

  return {
    title,
    slug: input.slug?.trim() ? slugify(input.slug) : slugify(title),
    excerpt: buildExcerpt(input.excerpt, content),
    content,
    featuredImageId: featuredImageId ?? null,
    status,
    publishedAt,
    seoMetaTitle: input.seoMetaTitle?.trim() || null,
    seoMetaDescription: input.seoMetaDescription?.trim() || null,
    seoFocusKeyword: input.seoFocusKeyword?.trim() || null,
    aiGenerated: input.aiGenerated ?? false,
    aiTopic: input.aiTopic?.trim() || null,
    aiOutline: input.aiOutline ?? null,
  };
};

export const createArticle = async (
  input: ArticleWriteInput,
): Promise<{ id: number }> => {
  const fields = prepare(input);

  return db.transaction(async (tx) => {
    const rows = await tx
      .insert(artikel)
      .values({
        title: fields.title,
        slug: fields.slug,
        excerpt: fields.excerpt,
        content: fields.content,
        featuredImageId: fields.featuredImageId,
        status: fields.status,
        // Wajib sinkron dengan `status` agar draft/publish Payload konsisten.
        underscoreStatus: fields.status,
        publishedAt: fields.publishedAt,
        seoMetaTitle: fields.seoMetaTitle,
        seoMetaDescription: fields.seoMetaDescription,
        seoFocusKeyword: fields.seoFocusKeyword,
        aiGenerated: fields.aiGenerated,
        aiTopic: fields.aiTopic,
        aiOutline: fields.aiOutline,
        updatedAt: new Date(),
      })
      .returning({ id: artikel.id });

    const created = rows[0];
    await syncRels(tx, created.id, input.categoryIds ?? [], input.tagIds ?? []);
    return created;
  });
};

export const updateArticle = async (
  id: number,
  input: ArticleWriteInput,
): Promise<{ id: number } | null> => {
  const existingRows = await db
    .select({
      publishedAt: artikel.publishedAt,
      featuredImageId: artikel.featuredImageId,
    })
    .from(artikel)
    .where(eq(artikel.id, id))
    .limit(1);

  const existing = existingRows[0];
  if (!existing) return null;

  const fields = prepare(input, existing);

  return db.transaction(async (tx) => {
    const rows = await tx
      .update(artikel)
      .set({
        title: fields.title,
        slug: fields.slug,
        excerpt: fields.excerpt,
        content: fields.content,
        featuredImageId: fields.featuredImageId,
        status: fields.status,
        underscoreStatus: fields.status,
        publishedAt: fields.publishedAt,
        seoMetaTitle: fields.seoMetaTitle,
        seoMetaDescription: fields.seoMetaDescription,
        seoFocusKeyword: fields.seoFocusKeyword,
        aiGenerated: fields.aiGenerated,
        aiTopic: fields.aiTopic,
        aiOutline: fields.aiOutline,
        updatedAt: new Date(),
      })
      .where(eq(artikel.id, id))
      .returning({ id: artikel.id });

    const updated = rows[0];
    if (!updated) return null;

    await syncRels(tx, id, input.categoryIds ?? [], input.tagIds ?? []);
    return updated;
  });
};

export const deleteArticle = async (id: number): Promise<boolean> => {
  const rows = await db
    .delete(artikel)
    .where(eq(artikel.id, id))
    .returning({ id: artikel.id });
  return rows.length > 0;
};

// Ubah status publish tanpa menyentuh field lain (untuk aksi cepat di list).
export const setArticleStatus = async (
  id: number,
  status: ArticleStatus,
): Promise<boolean> => {
  const existingRows = await db
    .select({ publishedAt: artikel.publishedAt })
    .from(artikel)
    .where(eq(artikel.id, id))
    .limit(1);

  const existing = existingRows[0];
  if (!existing) return false;

  const publishedAt =
    status === "published" && !existing.publishedAt
      ? new Date()
      : existing.publishedAt;

  const rows = await db
    .update(artikel)
    .set({
      status,
      underscoreStatus: status,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(artikel.id, id))
    .returning({ id: artikel.id });

  return rows.length > 0;
};
