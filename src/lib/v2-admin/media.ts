// Query & tulis media untuk CMS kustom. Server-side only.

import { count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { media } from "@/db/schema";
import {
  destroyCloudinaryAsset,
  hasCloudinaryConfig,
} from "./media-upload";

export type MediaItem = {
  id: number;
  name: string | null;
  alt: string;
  caption: string | null;
  url: string | null;
  width: number | null;
  height: number | null;
  source: "upload" | "unsplash" | "pexels" | null;
  createdAt: Date;
};

const toNumber = (value: string | null): number | null => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const listMedia = async (limit = 60): Promise<MediaItem[]> => {
  const rows = await db
    .select({
      id: media.id,
      name: media.name,
      alt: media.alt,
      caption: media.caption,
      url: media.url,
      width: media.width,
      height: media.height,
      source: media.source,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(limit);

  // Kolom width/height bertipe numeric di Postgres → dikembalikan sebagai string.
  return rows.map((row) => ({
    ...row,
    width: toNumber(row.width),
    height: toNumber(row.height),
  }));
};

export const getMediaById = async (id: number): Promise<MediaItem | null> => {
  const rows = await db
    .select({
      id: media.id,
      name: media.name,
      alt: media.alt,
      caption: media.caption,
      url: media.url,
      width: media.width,
      height: media.height,
      source: media.source,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return { ...row, width: toNumber(row.width), height: toNumber(row.height) };
};

// --- Pagination + pencarian ------------------------------------------------

export type MediaPage = {
  items: MediaItem[];
  total: number;
  page: number;
  totalPages: number;
};

export type ListMediaPagedInput = {
  page?: number;
  search?: string;
  limit?: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

// Daftar media dengan pagination + pencarian ilike pada name/alt/filename.
export const listMediaPaged = async (
  input: ListMediaPagedInput = {},
): Promise<MediaPage> => {
  const limit = clamp(
    Number.isInteger(input.limit) ? (input.limit as number) : 30,
    1,
    100,
  );
  const page = Math.max(
    Number.isInteger(input.page) ? (input.page as number) : 1,
    1,
  );

  const search = input.search?.trim();
  const where = search
    ? or(
        ilike(media.name, `%${search}%`),
        ilike(media.alt, `%${search}%`),
        ilike(media.filename, `%${search}%`),
      )
    : undefined;

  const totalRows = await db
    .select({ value: count() })
    .from(media)
    .where(where);
  const total = totalRows[0]?.value ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  const rows = await db
    .select({
      id: media.id,
      name: media.name,
      alt: media.alt,
      caption: media.caption,
      url: media.url,
      width: media.width,
      height: media.height,
      source: media.source,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const items = rows.map((row) => ({
    ...row,
    width: toNumber(row.width),
    height: toNumber(row.height),
  }));

  return { items, total, page, totalPages };
};

// --- Update metadata -------------------------------------------------------

export type UpdateMediaInput = {
  alt?: string;
  caption?: string | null;
  name?: string | null;
};

// Perbarui metadata media (alt/caption/name). Field yang tidak dikirim tidak
// diubah. Mengembalikan MediaItem terbaru atau null bila id tidak ditemukan.
export const updateMedia = async (
  id: number,
  input: UpdateMediaInput,
): Promise<MediaItem | null> => {
  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (input.alt !== undefined) values.alt = input.alt.trim();
  if (input.caption !== undefined) {
    values.caption = input.caption?.trim() ? input.caption.trim() : null;
  }
  if (input.name !== undefined) {
    values.name = input.name?.trim() ? input.name.trim() : null;
  }

  const updated = await db
    .update(media)
    .set(values)
    .where(eq(media.id, id))
    .returning({ id: media.id });

  if (updated.length === 0) return null;

  return getMediaById(id);
};

// --- Hapus + Cloudinary ----------------------------------------------------

// Turunkan public_id Cloudinary dari secure_url. Mengambil bagian setelah
// '/upload/', membuang segmen transformasi (mengandung ',' atau prefix seperti
// f_/q_/w_/c_) dan segmen versi 'v123456', menggabung sisa path, lalu membuang
// ekstensi terakhir. Return null bila bukan URL Cloudinary yang dikenali.
export const deriveCloudinaryPublicId = (
  url: string | null,
): string | null => {
  if (!url) return null;

  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  let rest = url.slice(idx + marker.length);
  rest = rest.split("?")[0].split("#")[0];

  const segments = rest.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const isVersion = (seg: string): boolean => /^v\d+$/.test(seg);
  const isTransform = (seg: string): boolean => {
    // Segmen transformasi berisi beberapa parameter dipisah koma, atau satu
    // parameter dengan prefix pendek diikuti '_' (mis. f_auto, q_80, c_fill).
    if (seg.includes(",")) return true;
    return /^(f|q|w|h|c|e|g|b|o|r|a|x|y|z|l|u|t|d|ar|bo|co|cs|dl|dn|dpr|du|eo|fl|fn|so|vc|pg)_/.test(
      seg,
    );
  };

  const kept = segments.filter(
    (seg) => !isVersion(seg) && !isTransform(seg),
  );
  if (kept.length === 0) return null;

  let publicId = kept.join("/");
  const lastDot = publicId.lastIndexOf(".");
  const lastSlash = publicId.lastIndexOf("/");
  if (lastDot > lastSlash && lastDot !== -1) {
    publicId = publicId.slice(0, lastDot);
  }

  return publicId || null;
};

// Hapus baris media. Bila Cloudinary terkonfigurasi, hapus juga asetnya
// (best-effort — kegagalan hapus aset TIDAK menggagalkan hapus row). public_id
// diambil dari kolom cloudinaryPublicId, atau diturunkan dari URL bila kosong
// (baris lama sebelum kolom ada). Return true bila baris ada dan terhapus.
export const deleteMedia = async (id: number): Promise<boolean> => {
  const rows = await db
    .select({
      id: media.id,
      url: media.url,
      cloudinaryPublicId: media.cloudinaryPublicId,
    })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return false;

  if (hasCloudinaryConfig()) {
    const publicId =
      row.cloudinaryPublicId ?? deriveCloudinaryPublicId(row.url);
    if (publicId) {
      try {
        await destroyCloudinaryAsset(publicId);
      } catch (error) {
        console.error(
          `[media] gagal menghapus aset Cloudinary "${publicId}":`,
          error,
        );
      }
    }
  }

  const deleted = await db
    .delete(media)
    .where(eq(media.id, id))
    .returning({ id: media.id });

  return deleted.length > 0;
};
