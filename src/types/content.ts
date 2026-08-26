// Tipe domain sisi publik (frontend) yang menggantikan ketergantungan
// `@/payload-types` pada halaman publik yang sudah diport ke Drizzle
// (`(site)/[slug]`, `(site)/artikel`, `sitemap.ts`).
//
// PENTING (P1 — preservation SEO): bentuk objek di sini SENGAJA dibuat identik
// dengan doc Payload `depth: 2` yang dulu dikonsumsi ketiga halaman tersebut,
// sehingga seluruh kode metadata/JSON-LD/JSX/mapping tidak perlu berubah selain
// sumber datanya. Field media "virtual" (transformedUrl/cloudinaryUrl/
// originalUrl) tetap didefinisikan di sini agar helper `resolveMediaUrl` yang
// ada tetap mengcompile; nilainya di-populate dari kolom DB yang tersedia
// (url + thumbnail_u_r_l) dan sisanya dibiarkan undefined (fallback ke url).

import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

/**
 * Media terpopulasi (setara Payload `Media` pada depth 2).
 * Hanya `url`, `thumbnailURL`, `alt`, `caption`, `width`, `height` yang punya
 * nilai nyata dari DB. Field virtual lain sengaja opsional/undefined.
 */
export interface PublicMedia {
  id: number;
  url?: string | null;
  thumbnailURL?: string | null;
  transformedUrl?: string | null;
  cloudinaryUrl?: string | null;
  originalUrl?: string | null;
  alt?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  /**
   * Nama internal media (kolom `media.name`). Opsional karena hanya dipakai
   * sebagai fallback `alt` pada node upload di dalam Lexical `content`
   * (lihat `ArticleRichContent`); query publik untuk featuredImage tidak
   * memerlukannya. Ditambahkan agar renderer artikel lepas dari
   * `@/payload-types` tanpa mengubah perilaku render.
   */
  name?: string | null;
}

/**
 * Category terpopulasi (setara Payload `Category`).
 */
export interface PublicCategory {
  id: number;
  name: string;
  slug?: string | null;
}

/**
 * Tag terpopulasi (setara Payload `Tag`).
 */
export interface PublicTag {
  id: number;
  name: string;
  slug?: string | null;
}

/**
 * SEO flat dari kolom `seo_meta_title` / `seo_meta_description` /
 * `seo_focus_keyword`, dibungkus objek `seo` seperti bentuk Payload.
 */
export interface PublicArticleSeo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
}

/**
 * Artikel terpopulasi (setara Payload `Artikel` pada depth 2).
 *
 * `featuredImage`/`tags`/`relatedArtikel` memakai union dengan `number` agar
 * type guard existing (`isMedia`/`isTagObject`/`isArtikelObject`) tetap valid;
 * pada praktiknya query publik selalu mempopulasi objek.
 */
export interface PublicArticle {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: SerializedEditorState<SerializedLexicalNode>;
  status?: "draft" | "published" | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  seo?: PublicArticleSeo;
  featuredImage?: PublicMedia | number | null;
  kategori?: (PublicCategory | number)[] | null;
  tags?: (PublicTag | number)[] | null;
  relatedArtikel?: (PublicArticle | number)[] | null;
}
