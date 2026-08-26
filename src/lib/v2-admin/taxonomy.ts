// Operasi baca/tulis taksonomi (kategori & tag) untuk CMS kustom.
// Server-side only (Node runtime) — dipanggil dari route /api/v2 dan halaman
// server v2-admin.
//
// Slug di-generate otomatis dari `name` via slugify(). Duplikasi nama/slug
// ditolak dengan pesan ramah, dan pelanggaran unique constraint Postgres
// (kode 23505) yang lolos dari race ditangkap sebagai fallback.
//
// Penghapusan ditolak selama masih ada artikel yang mereferensikan lewat
// tabel polimorfik `artikel_rels` (path 'kategori' / 'tags').

import { and, asc, count, eq, ne, or } from "drizzle-orm";

import { db } from "@/db";
import { artikelRels, categories, tags } from "@/db/schema";
import type { Category, Tag } from "@/db/schema";
import { slugify } from "./lexical";

export type CategoryWithCount = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
};

export type TagWithCount = {
  id: number;
  name: string;
  slug: string | null;
  articleCount: number;
};

export type CategoryInput = {
  name: string;
  description?: string | null;
};

export type TagInput = {
  name: string;
};

// Postgres melempar error dengan .code = '23505' saat unique constraint dilanggar.
const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === "23505";

const CATEGORY_DUPLICATE_MSG = "Nama atau slug kategori sudah dipakai.";
const TAG_DUPLICATE_MSG = "Nama atau slug tag sudah dipakai.";

// ---------------------------------------------------------------------------
// Kategori
// ---------------------------------------------------------------------------

export const listCategoriesWithCount = async (): Promise<
  CategoryWithCount[]
> => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      articleCount: count(artikelRels.id),
    })
    .from(categories)
    .leftJoin(
      artikelRels,
      and(
        eq(artikelRels.categoriesId, categories.id),
        eq(artikelRels.path, "kategori"),
      ),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    articleCount: Number(row.articleCount),
  }));
};

export const createCategory = async (
  input: CategoryInput,
): Promise<Category> => {
  const name = input.name.trim();
  const slug = slugify(name);
  const description = input.description?.trim() || null;

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(or(eq(categories.name, name), eq(categories.slug, slug)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(CATEGORY_DUPLICATE_MSG);
  }

  try {
    const rows = await db
      .insert(categories)
      .values({ name, slug, description, updatedAt: new Date() })
      .returning();
    return rows[0];
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error(CATEGORY_DUPLICATE_MSG);
    throw error;
  }
};

export const updateCategory = async (
  id: number,
  input: CategoryInput,
): Promise<Category | null> => {
  const name = input.name.trim();
  const slug = slugify(name);
  const description = input.description?.trim() || null;

  const conflict = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        or(eq(categories.name, name), eq(categories.slug, slug)),
        ne(categories.id, id),
      ),
    )
    .limit(1);

  if (conflict.length > 0) {
    throw new Error(CATEGORY_DUPLICATE_MSG);
  }

  try {
    const rows = await db
      .update(categories)
      .set({ name, slug, description, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error(CATEGORY_DUPLICATE_MSG);
    throw error;
  }
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const used = await db
    .select({ total: count() })
    .from(artikelRels)
    .where(
      and(eq(artikelRels.path, "kategori"), eq(artikelRels.categoriesId, id)),
    );

  const total = Number(used[0]?.total ?? 0);
  if (total > 0) {
    throw new Error(`Kategori masih dipakai ${total} artikel.`);
  }

  const rows = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });

  return rows.length > 0;
};

// ---------------------------------------------------------------------------
// Tag (tanpa deskripsi)
// ---------------------------------------------------------------------------

export const listTagsWithCount = async (): Promise<TagWithCount[]> => {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      articleCount: count(artikelRels.id),
    })
    .from(tags)
    .leftJoin(
      artikelRels,
      and(eq(artikelRels.tagsId, tags.id), eq(artikelRels.path, "tags")),
    )
    .groupBy(tags.id)
    .orderBy(asc(tags.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    articleCount: Number(row.articleCount),
  }));
};

export const createTag = async (input: TagInput): Promise<Tag> => {
  const name = input.name.trim();
  const slug = slugify(name);

  const existing = await db
    .select({ id: tags.id })
    .from(tags)
    .where(or(eq(tags.name, name), eq(tags.slug, slug)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(TAG_DUPLICATE_MSG);
  }

  try {
    const rows = await db
      .insert(tags)
      .values({ name, slug, updatedAt: new Date() })
      .returning();
    return rows[0];
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error(TAG_DUPLICATE_MSG);
    throw error;
  }
};

export const updateTag = async (
  id: number,
  input: TagInput,
): Promise<Tag | null> => {
  const name = input.name.trim();
  const slug = slugify(name);

  const conflict = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(or(eq(tags.name, name), eq(tags.slug, slug)), ne(tags.id, id)))
    .limit(1);

  if (conflict.length > 0) {
    throw new Error(TAG_DUPLICATE_MSG);
  }

  try {
    const rows = await db
      .update(tags)
      .set({ name, slug, updatedAt: new Date() })
      .where(eq(tags.id, id))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error(TAG_DUPLICATE_MSG);
    throw error;
  }
};

export const deleteTag = async (id: number): Promise<boolean> => {
  const used = await db
    .select({ total: count() })
    .from(artikelRels)
    .where(and(eq(artikelRels.path, "tags"), eq(artikelRels.tagsId, id)));

  const total = Number(used[0]?.total ?? 0);
  if (total > 0) {
    throw new Error(`Tag masih dipakai ${total} artikel.`);
  }

  const rows = await db
    .delete(tags)
    .where(eq(tags.id, id))
    .returning({ id: tags.id });

  return rows.length > 0;
};
