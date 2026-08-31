/**
 * LAPISAN DATA KONTEN TIPE RUMAH — server-side only.
 *
 * Menjembatani DUA sumber:
 *   1. DEFAULT di kode  — src/data/units.ts + src/data/unit-content.ts
 *   2. PENIMPAAN di DB  — tabel `unit_content` (migrasi 0002)
 *
 * ATURAN PENGGABUNGAN: nilai dari DB dipakai HANYA bila ia benar-benar terisi.
 * `null` maupun array kosong dianggap "belum ditimpa" dan jatuh kembali ke
 * default kode. Ini yang membuat situs tetap utuh ketika tabelnya masih kosong,
 * ketika `DATABASE_URI` tidak tersedia saat build, atau ketika editor
 * mengosongkan satu field karena berubah pikiran.
 *
 * `isPublished: false` diperlakukan sama dengan "tidak ada baris": halaman
 * publik memakai default kode. Itu memberi pemilik ruang menyiapkan konten
 * tanpa langsung menayangkannya.
 *
 * SEMUA fungsi baca di sini TIDAK PERNAH melempar. Halaman tipe rumah adalah
 * halaman komersial utama; kegagalan database tidak boleh membuatnya 500 —
 * cukup turunkan ke default kode.
 */

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { unitContent, type UnitContentRow } from "@/db/schema";
import {
  ACCESS_SUMMARY,
  CLUSTER_SITEPLAN,
  getUnitContent,
  resolveUnitVideo,
  type UnitGalleryImage,
  type UnitVideo,
} from "@/data/unit-content";
import { getUnitById, unitFacadeAlt, type Unit } from "@/data/units";

// ---------------------------------------------------------------------------
// Bentuk data yang dipakai halaman publik
// ---------------------------------------------------------------------------

export type AccessItem = { label: string; value: string };

export type ResolvedUnitContent = {
  priceLabel: string;
  facadeImage: string;
  floorPlanImage: string | null;
  overview: readonly string[];
  highlights: readonly string[];
  suitedFor: readonly string[];
  gallery: readonly UnitGalleryImage[];
  accessItems: readonly AccessItem[];
  video: UnitVideo | null;
  siteplan: { url: string; alt: string };
  /** true bila ada baris DB terbit yang menimpa sesuatu. Untuk badge di admin. */
  hasOverride: boolean;
};

/** Bentuk yang dikirim/diterima form admin. Semua opsional = "pakai default". */
export type UnitContentDraft = {
  priceLabel: string | null;
  facadeImage: string | null;
  floorPlanImage: string | null;
  overview: string[];
  highlights: string[];
  suitedFor: string[];
  gallery: UnitGalleryImage[];
  accessItems: AccessItem[];
  videoUrl: string | null;
  videoPoster: string | null;
  videoTitle: string | null;
  isPublished: boolean;
};

// ---------------------------------------------------------------------------
// Pengurai jsonb yang defensif
// ---------------------------------------------------------------------------
//
// Kolom jsonb bisa berisi apa pun yang pernah ditulis ke sana. Karena nilainya
// dirender langsung ke halaman publik, bentuknya diverifikasi di sini alih-alih
// dipercaya — satu baris rusak tidak boleh menjatuhkan halaman.

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const out = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return out.length > 0 ? out : null;
};

const asGallery = (value: unknown): UnitGalleryImage[] | null => {
  if (!Array.isArray(value)) return null;
  const out: UnitGalleryImage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.url !== "string" || row.url.trim().length === 0) continue;
    out.push({
      url: row.url,
      // Alt wajib ada isinya; bila editor mengosongkannya, jangan kirim alt
      // kosong ke HTML — pemanggil akan mengisinya dari data unit.
      alt: typeof row.alt === "string" && row.alt.trim().length > 0 ? row.alt : "",
      ...(typeof row.caption === "string" && row.caption.trim().length > 0
        ? { caption: row.caption }
        : {}),
    });
  }
  return out.length > 0 ? out : null;
};

const asAccessItems = (value: unknown): AccessItem[] | null => {
  if (!Array.isArray(value)) return null;
  const out: AccessItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.label !== "string" || row.label.trim().length === 0) continue;
    if (typeof row.value !== "string" || row.value.trim().length === 0) continue;
    out.push({ label: row.label, value: row.value });
  }
  return out.length > 0 ? out : null;
};

const trimmedOrNull = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// ---------------------------------------------------------------------------
// Baca
// ---------------------------------------------------------------------------

/** Satu baris mentah, atau null bila tidak ada / DB tidak tersedia. */
export const getUnitContentRow = async (
  unitId: string,
): Promise<UnitContentRow | null> => {
  try {
    const rows = await db
      .select()
      .from(unitContent)
      .where(eq(unitContent.unitId, unitId))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error("[v2-admin/unit-content] gagal membaca baris:", error);
    return null;
  }
};

/** Seluruh baris, untuk daftar di admin. Array kosong bila DB tidak tersedia. */
export const listUnitContentRows = async (): Promise<UnitContentRow[]> => {
  try {
    return await db.select().from(unitContent);
  } catch (error) {
    console.error("[v2-admin/unit-content] gagal membaca daftar:", error);
    return [];
  }
};

/**
 * Konten final untuk halaman publik: default kode + penimpaan DB.
 *
 * Dipakai server component halaman tipe. Tidak pernah melempar.
 */
export const resolveUnitContentForUnit = async (
  unit: Unit,
): Promise<ResolvedUnitContent> => {
  const defaults = getUnitContent(unit.id);
  const row = await getUnitContentRow(unit.id);
  const active = row && row.isPublished ? row : null;

  const facadeImage = trimmedOrNull(active?.facadeImage) ?? unit.facadeImage;

  const galleryOverride = active ? asGallery(active.gallery) : null;
  // Alt yang dikosongkan editor diisi dari data unit, bukan dibiarkan kosong.
  const gallery: readonly UnitGalleryImage[] = galleryOverride
    ? galleryOverride.map((image) => ({
        ...image,
        alt: image.alt || unitFacadeAlt(unit),
      }))
    : defaults.gallery.length > 0
      ? defaults.gallery
      : [{ url: facadeImage, alt: unitFacadeAlt(unit) }];

  const videoUrl = trimmedOrNull(active?.videoUrl);
  const video: UnitVideo | null = videoUrl
    ? {
        url: videoUrl,
        poster: trimmedOrNull(active?.videoPoster),
        title: trimmedOrNull(active?.videoTitle) ?? `Video Tipe ${unit.name}`,
      }
    : resolveUnitVideo(unit);

  const overview =
    (active ? asStringArray(active.overview) : null) ??
    (defaults.overview.length > 0 ? defaults.overview : [unit.description]);

  return {
    priceLabel: trimmedOrNull(active?.priceLabel) ?? unit.priceLabel,
    facadeImage,
    floorPlanImage:
      trimmedOrNull(active?.floorPlanImage) ?? unit.floorPlanImage,
    overview,
    highlights:
      (active ? asStringArray(active.highlights) : null) ?? defaults.highlights,
    suitedFor:
      (active ? asStringArray(active.suitedFor) : null) ?? defaults.suitedFor,
    gallery,
    accessItems:
      (active ? asAccessItems(active.accessItems) : null) ?? ACCESS_SUMMARY,
    video,
    siteplan: CLUSTER_SITEPLAN[unit.cluster],
    hasOverride: active !== null,
  };
};

/**
 * Draf untuk form admin: nilai DB bila ada, kalau tidak nilai default kode
 * sebagai titik awal yang bisa langsung disunting.
 *
 * Sengaja mengisi form dengan default alih-alih membiarkannya kosong: editor
 * jadi melihat teks yang sekarang tayang dan bisa mengubahnya, bukan menebak
 * apa yang sedang tampil.
 */
export const getUnitContentDraft = async (
  unitId: string,
): Promise<UnitContentDraft | null> => {
  const unit = getUnitById(unitId);
  if (!unit) return null;

  const defaults = getUnitContent(unitId);
  const row = await getUnitContentRow(unitId);
  const clusterVideo = resolveUnitVideo(unit);

  return {
    priceLabel: trimmedOrNull(row?.priceLabel) ?? unit.priceLabel,
    facadeImage: trimmedOrNull(row?.facadeImage) ?? unit.facadeImage,
    floorPlanImage:
      trimmedOrNull(row?.floorPlanImage) ?? unit.floorPlanImage ?? null,
    overview: [
      ...((row ? asStringArray(row.overview) : null) ??
        (defaults.overview.length > 0 ? defaults.overview : [unit.description])),
    ],
    highlights: [
      ...((row ? asStringArray(row.highlights) : null) ?? defaults.highlights),
    ],
    suitedFor: [
      ...((row ? asStringArray(row.suitedFor) : null) ?? defaults.suitedFor),
    ],
    gallery: [...((row ? asGallery(row.gallery) : null) ?? defaults.gallery)],
    accessItems: [
      ...((row ? asAccessItems(row.accessItems) : null) ?? ACCESS_SUMMARY),
    ],
    videoUrl: trimmedOrNull(row?.videoUrl) ?? clusterVideo?.url ?? null,
    videoPoster: trimmedOrNull(row?.videoPoster) ?? clusterVideo?.poster ?? null,
    videoTitle: trimmedOrNull(row?.videoTitle) ?? clusterVideo?.title ?? null,
    isPublished: row?.isPublished ?? true,
  };
};

// ---------------------------------------------------------------------------
// Tulis
// ---------------------------------------------------------------------------

/**
 * Simpan (buat atau perbarui) konten satu unit.
 *
 * Memakai `ON CONFLICT (unit_id)` lewat `onConflictDoUpdate`, bukan
 * select-lalu-insert-atau-update: dua permintaan simpan yang datang bersamaan
 * tidak boleh melahirkan dua baris untuk unit yang sama, dan unique index
 * `unit_content_unit_id_idx` yang menjaminnya.
 *
 * Array kosong disimpan sebagai NULL supaya maknanya tegas: "kembali ke default
 * kode", bukan "daftar yang memang kosong".
 */
export const upsertUnitContent = async (
  unitId: string,
  draft: UnitContentDraft,
): Promise<UnitContentRow> => {
  const emptyToNull = <T>(list: T[]): T[] | null =>
    list.length > 0 ? list : null;

  const values = {
    unitId,
    priceLabel: trimmedOrNull(draft.priceLabel),
    facadeImage: trimmedOrNull(draft.facadeImage),
    floorPlanImage: trimmedOrNull(draft.floorPlanImage),
    overview: emptyToNull(draft.overview.map((s) => s.trim()).filter(Boolean)),
    highlights: emptyToNull(
      draft.highlights.map((s) => s.trim()).filter(Boolean),
    ),
    suitedFor: emptyToNull(draft.suitedFor.map((s) => s.trim()).filter(Boolean)),
    gallery: emptyToNull(draft.gallery),
    accessItems: emptyToNull(draft.accessItems),
    videoUrl: trimmedOrNull(draft.videoUrl),
    videoPoster: trimmedOrNull(draft.videoPoster),
    videoTitle: trimmedOrNull(draft.videoTitle),
    isPublished: draft.isPublished,
    updatedAt: new Date(),
  };

  const [row] = await db
    .insert(unitContent)
    .values(values)
    .onConflictDoUpdate({ target: unitContent.unitId, set: values })
    .returning();

  return row;
};
