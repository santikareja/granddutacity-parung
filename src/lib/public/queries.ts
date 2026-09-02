// Query sisi publik berbasis Drizzle — MENGGANTIKAN `getPayload()` di runtime
// publik (`(site)/[slug]`, `(site)/artikel`, `sitemap.ts`).
//
// Server-side only (dipanggil dari Server Component / route metadata Next.js).
//
// KONTRAK P1 (preservation SEO): fungsi di sini menghasilkan objek dengan
// BENTUK IDENTIK dengan doc Payload `depth: 2` yang dulu dikonsumsi halaman
// publik. Dengan begitu seluruh kode metadata/JSON-LD/JSX/mapping di halaman
// tersebut tidak berubah selain sumber datanya.
//
// Semua fungsi membungkus akses DB dengan try/catch dan mengembalikan null/[]
// bila DB gagal, meniru perilaku sitemap lama yang tidak menggagalkan build di
// environment tanpa kredensial database.

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

import { db } from "@/db";
import { artikel, artikelRels, categories, media, tags } from "@/db/schema";
import type {
  PublicArticle,
  PublicCategory,
  PublicMedia,
  PublicTag,
} from "@/types/content";

// ---------------------------------------------------------------------------
// Helper konversi
// ---------------------------------------------------------------------------

// Lexical editor state kosong untuk objek artikel "mini" (related) yang
// kontennya tidak pernah dirender — menjaga bentuk objek tetap valid tanpa
// menarik kolom jsonb besar.
const EMPTY_LEXICAL_STATE = {
  root: {
    type: "root",
    children: [],
    direction: null,
    format: "",
    indent: 0,
    version: 1,
  },
} as unknown as SerializedEditorState<SerializedLexicalNode>;

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  // Kolom timestamp Postgres via node-postgres umumnya sudah Date; fallback aman.
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

// numeric Postgres dipetakan ke string oleh node-postgres; kembalikan number.
const toNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
};

// ---------------------------------------------------------------------------
// Kolom terpilih (dipakai ulang antar query)
// ---------------------------------------------------------------------------

const articleColumns = {
  id: artikel.id,
  title: artikel.title,
  slug: artikel.slug,
  excerpt: artikel.excerpt,
  content: artikel.content,
  status: artikel.status,
  publishedAt: artikel.publishedAt,
  createdAt: artikel.createdAt,
  updatedAt: artikel.updatedAt,
  seoMetaTitle: artikel.seoMetaTitle,
  seoMetaDescription: artikel.seoMetaDescription,
  seoFocusKeyword: artikel.seoFocusKeyword,
} as const;

const articleListColumns = {
  id: artikel.id,
  title: artikel.title,
  slug: artikel.slug,
  excerpt: artikel.excerpt,
  status: artikel.status,
  publishedAt: artikel.publishedAt,
  createdAt: artikel.createdAt,
  updatedAt: artikel.updatedAt,
  seoMetaTitle: artikel.seoMetaTitle,
  seoMetaDescription: artikel.seoMetaDescription,
  seoFocusKeyword: artikel.seoFocusKeyword,
} as const;

const mediaColumns = {
  id: media.id,
  url: media.url,
  thumbnailUrl: media.thumbnailUrl,
  alt: media.alt,
  caption: media.caption,
  width: media.width,
  height: media.height,
} as const;

type ArticleRow = {
  id: number;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: unknown;
  status: "draft" | "published" | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  seoMetaTitle: string | null;
  seoMetaDescription: string | null;
  seoFocusKeyword: string | null;
};

type ArticleListRow = Omit<ArticleRow, "content">;

type MediaRow = {
  id: number | null;
  url: string | null;
  thumbnailUrl: string | null;
  alt: string | null;
  caption: string | null;
  width: string | null;
  height: string | null;
};

// ---------------------------------------------------------------------------
// Mapper baris DB -> objek domain (bentuk Payload depth 2)
// ---------------------------------------------------------------------------

const mapMedia = (row: MediaRow | null | undefined): PublicMedia | null => {
  if (!row || row.id === null) return null;
  return {
    id: row.id,
    url: row.url ?? null,
    thumbnailURL: row.thumbnailUrl ?? null,
    alt: row.alt ?? null,
    caption: row.caption ?? null,
    width: toNumber(row.width),
    height: toNumber(row.height),
    // Field virtual (transformedUrl/cloudinaryUrl/originalUrl) sengaja
    // dibiarkan undefined → resolveMediaUrl fallback ke `url`.
  };
};

const mapArticleBase = (
  row: ArticleRow,
  featuredImage: PublicMedia | null,
): PublicArticle => ({
  id: row.id,
  title: row.title ?? "",
  slug: row.slug ?? "",
  excerpt: row.excerpt ?? null,
  content: (row.content ?? EMPTY_LEXICAL_STATE) as SerializedEditorState<SerializedLexicalNode>,
  status: row.status,
  publishedAt: toIso(row.publishedAt),
  createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
  updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
  seo: {
    metaTitle: row.seoMetaTitle ?? null,
    metaDescription: row.seoMetaDescription ?? null,
    focusKeyword: row.seoFocusKeyword ?? null,
  },
  featuredImage,
});

const mapArticleListBase = (
  row: ArticleListRow,
  featuredImage: PublicMedia | null,
): PublicArticle => ({
  id: row.id,
  title: row.title ?? "",
  slug: row.slug ?? "",
  excerpt: row.excerpt ?? null,
  content: EMPTY_LEXICAL_STATE,
  status: row.status,
  publishedAt: toIso(row.publishedAt),
  createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
  updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
  seo: {
    metaTitle: row.seoMetaTitle ?? null,
    metaDescription: row.seoMetaDescription ?? null,
    focusKeyword: row.seoFocusKeyword ?? null,
  },
  featuredImage,
});

// ---------------------------------------------------------------------------
// Resolusi taksonomi (tags/kategori) untuk sekumpulan artikel
// ---------------------------------------------------------------------------

type TaxonomyMaps = {
  tagsByArticle: Map<number, PublicTag[]>;
  kategoriByArticle: Map<number, PublicCategory[]>;
};

const loadTaxonomyForArticles = async (
  articleIds: number[],
): Promise<TaxonomyMaps> => {
  const tagsByArticle = new Map<number, PublicTag[]>();
  const kategoriByArticle = new Map<number, PublicCategory[]>();

  if (articleIds.length === 0) {
    return { tagsByArticle, kategoriByArticle };
  }

  const rels = await db
    .select({
      parentId: artikelRels.parentId,
      order: artikelRels.order,
      path: artikelRels.path,
      tagsId: artikelRels.tagsId,
      categoriesId: artikelRels.categoriesId,
    })
    .from(artikelRels)
    .where(inArray(artikelRels.parentId, articleIds))
    .orderBy(asc(artikelRels.parentId), asc(artikelRels.order));

  const tagIds = Array.from(
    new Set(
      rels
        .filter((r) => r.path === "tags" && r.tagsId !== null)
        .map((r) => r.tagsId as number),
    ),
  );
  const categoryIds = Array.from(
    new Set(
      rels
        .filter((r) => r.path === "kategori" && r.categoriesId !== null)
        .map((r) => r.categoriesId as number),
    ),
  );

  const [tagRows, categoryRows] = await Promise.all([
    tagIds.length > 0
      ? db
          .select({ id: tags.id, name: tags.name, slug: tags.slug })
          .from(tags)
          .where(inArray(tags.id, tagIds))
      : Promise.resolve([]),
    categoryIds.length > 0
      ? db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          })
          .from(categories)
          .where(inArray(categories.id, categoryIds))
      : Promise.resolve([]),
  ]);

  const tagById = new Map(tagRows.map((t) => [t.id, t]));
  const categoryById = new Map(categoryRows.map((c) => [c.id, c]));

  for (const rel of rels) {
    if (rel.path === "tags" && rel.tagsId !== null) {
      const tag = tagById.get(rel.tagsId);
      if (tag) {
        const list = tagsByArticle.get(rel.parentId) ?? [];
        list.push({ id: tag.id, name: tag.name, slug: tag.slug ?? null });
        tagsByArticle.set(rel.parentId, list);
      }
    } else if (rel.path === "kategori" && rel.categoriesId !== null) {
      const category = categoryById.get(rel.categoriesId);
      if (category) {
        const list = kategoriByArticle.get(rel.parentId) ?? [];
        list.push({
          id: category.id,
          name: category.name,
          slug: category.slug ?? null,
        });
        kategoriByArticle.set(rel.parentId, list);
      }
    }
  }

  return { tagsByArticle, kategoriByArticle };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Satu artikel published berdasarkan slug, dengan featuredImage, tags[],
 * kategori[], dan relatedArtikel[] terpopulasi (setara Payload depth 2).
 */
export const getPublishedArticleBySlug = async (
  slug: string,
): Promise<PublicArticle | null> => {
  try {
    const rows = await db
      .select({ article: articleColumns, media: mediaColumns })
      .from(artikel)
      .leftJoin(media, eq(artikel.featuredImageId, media.id))
      .where(and(eq(artikel.slug, slug), eq(artikel.status, "published")))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const article = mapArticleBase(
      row.article as ArticleRow,
      mapMedia(row.media as MediaRow),
    );

    // Relasi polimorfik: tags / kategori / relatedArtikel.
    const rels = await db
      .select({
        order: artikelRels.order,
        path: artikelRels.path,
        tagsId: artikelRels.tagsId,
        categoriesId: artikelRels.categoriesId,
        artikelId: artikelRels.artikelId,
      })
      .from(artikelRels)
      .where(eq(artikelRels.parentId, article.id))
      .orderBy(asc(artikelRels.order));

    const tagIds = rels
      .filter((r) => r.path === "tags" && r.tagsId !== null)
      .map((r) => r.tagsId as number);
    const categoryIds = rels
      .filter((r) => r.path === "kategori" && r.categoriesId !== null)
      .map((r) => r.categoriesId as number);
    const relatedIds = rels
      .filter((r) => r.path === "relatedArtikel" && r.artikelId !== null)
      .map((r) => r.artikelId as number);

    const [tagRows, categoryRows, relatedRows] = await Promise.all([
      tagIds.length > 0
        ? db
            .select({ id: tags.id, name: tags.name, slug: tags.slug })
            .from(tags)
            .where(inArray(tags.id, tagIds))
        : Promise.resolve([]),
      categoryIds.length > 0
        ? db
            .select({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            })
            .from(categories)
            .where(inArray(categories.id, categoryIds))
        : Promise.resolve([]),
      relatedIds.length > 0
        ? db
            .select({ article: articleColumns, media: mediaColumns })
            .from(artikel)
            .leftJoin(media, eq(artikel.featuredImageId, media.id))
            .where(inArray(artikel.id, relatedIds))
        : Promise.resolve([]),
    ]);

    const tagById = new Map(tagRows.map((t) => [t.id, t]));
    const categoryById = new Map(categoryRows.map((c) => [c.id, c]));
    const relatedById = new Map(
      relatedRows.map((r) => {
        const relArticle = mapArticleBase(
          r.article as ArticleRow,
          mapMedia(r.media as MediaRow),
        );
        return [relArticle.id, relArticle] as const;
      }),
    );

    // Susun ulang mengikuti urutan `order` rels.
    article.tags = tagIds
      .map((id) => tagById.get(id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map((t) => ({ id: t.id, name: t.name, slug: t.slug ?? null }));

    article.kategori = categoryIds
      .map((id) => categoryById.get(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug ?? null }));

    article.relatedArtikel = relatedIds
      .map((id) => relatedById.get(id))
      .filter((a): a is PublicArticle => Boolean(a));

    return article;
  } catch (error) {
    console.warn(
      "[public/queries] getPublishedArticleBySlug gagal (database tidak tersedia):",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
};

/**
 * Daftar artikel published (ORDER BY publishedAt DESC), dengan featuredImage,
 * tags[], dan kategori[] terpopulasi.
 *
 * Archive /artikel tidak merender body artikel, jadi kolom `content` sengaja
 * tidak diambil. Ini memangkas payload DB terbesar tanpa mengubah shape
 * PublicArticle yang dikonsumsi mapper halaman.
 */
export const getPublishedArticles = async (
  limit: number,
): Promise<PublicArticle[]> => {
  try {
    const rows = await db
      .select({ article: articleListColumns, media: mediaColumns })
      .from(artikel)
      .leftJoin(media, eq(artikel.featuredImageId, media.id))
      .where(eq(artikel.status, "published"))
      .orderBy(desc(artikel.publishedAt))
      .limit(limit);

    const articles = rows.map((row) =>
      mapArticleListBase(
        row.article as ArticleListRow,
        mapMedia(row.media as MediaRow),
      ),
    );

    const { tagsByArticle, kategoriByArticle } = await loadTaxonomyForArticles(
      articles.map((a) => a.id),
    );

    for (const article of articles) {
      article.tags = tagsByArticle.get(article.id) ?? [];
      article.kategori = kategoriByArticle.get(article.id) ?? [];
    }

    return articles;
  } catch (error) {
    console.warn(
      "[public/queries] getPublishedArticles gagal (database tidak tersedia):",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
};

/**
 * Ringkasan artikel published untuk daftar sidebar / navigasi prev-next.
 *
 * Berbeda dari getPublishedArticles: query ini SENGAJA tidak menarik kolom
 * `content` (Lexical state jsonb yang besar) maupun taksonomi (tags/kategori),
 * karena konsumen ringkasan — kartu sidebar, artikel terkait, dan navigasi
 * sebelum/berikutnya di halaman detail — hanya memakai judul, slug, excerpt,
 * dan gambar utama. Untuk 50 artikel, membawa 50 blob konten penuh + query
 * taksonomi di SETIAP pembukaan artikel adalah beban terbesar yang tidak
 * terpakai. `content` diisi state kosong agar bentuk objek tetap valid.
 */
export const getPublishedArticleSummaries = async (
  limit: number,
): Promise<PublicArticle[]> => {
  try {
    const rows = await db
      .select({
        id: artikel.id,
        title: artikel.title,
        slug: artikel.slug,
        excerpt: artikel.excerpt,
        publishedAt: artikel.publishedAt,
        createdAt: artikel.createdAt,
        updatedAt: artikel.updatedAt,
        media: mediaColumns,
      })
      .from(artikel)
      .leftJoin(media, eq(artikel.featuredImageId, media.id))
      .where(eq(artikel.status, "published"))
      .orderBy(desc(artikel.publishedAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      title: row.title ?? "",
      slug: row.slug ?? "",
      excerpt: row.excerpt ?? null,
      content: EMPTY_LEXICAL_STATE,
      status: "published" as const,
      publishedAt: toIso(row.publishedAt),
      createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
      updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
      seo: { metaTitle: null, metaDescription: null, focusKeyword: null },
      featuredImage: mapMedia(row.media as MediaRow),
    }));
  } catch (error) {
    console.warn(
      "[public/queries] getPublishedArticleSummaries gagal (database tidak tersedia):",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
};

/**
 * Entri sitemap artikel published. depth 0, limit 500.
 *
 * `updatedAt` ikut diambil (Fase 6): `lastModified` di sitemap seharusnya
 * menyatakan kapan konten TERAKHIR BERUBAH, bukan kapan ia pertama diterbitkan.
 * Memakai `publishedAt` membuat artikel yang baru saja disunting tetap terlihat
 * lama bagi Google, sehingga sinyal freshness-nya hilang justru pada artikel
 * yang paling aktif dirawat.
 */
export const getArticleSitemapEntries = async (): Promise<
  { slug: string; publishedAt: string | null; updatedAt: string | null }[]
> => {
  try {
    const rows = await db
      .select({
        slug: artikel.slug,
        publishedAt: artikel.publishedAt,
        updatedAt: artikel.updatedAt,
      })
      .from(artikel)
      .where(eq(artikel.status, "published"))
      .orderBy(desc(artikel.publishedAt))
      .limit(500);

    return rows
      .filter(
        // `updatedAt` non-nullable di skema (kolom NOT NULL), jadi predikatnya
        // hanya perlu mempersempit `slug`.
        (row): row is { slug: string; publishedAt: Date | null; updatedAt: Date } =>
          Boolean(row.slug),
      )
      .map((row) => ({
        slug: row.slug,
        publishedAt: toIso(row.publishedAt),
        updatedAt: toIso(row.updatedAt),
      }));
  } catch (error) {
    console.warn(
      "[public/queries] getArticleSitemapEntries gagal (database tidak tersedia):",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
};
