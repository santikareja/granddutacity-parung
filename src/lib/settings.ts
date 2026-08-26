// Settings DB-driven (Task 7). Server-side only (Node runtime) — dipanggil dari
// route /api/v2 dan halaman server v2-admin.
//
// Lapisan cache: pembacaan dibungkus `unstable_cache` (tag "site-settings",
// revalidate 60 detik). Mutasi (`updateSettings`) melakukan upsert lalu
// memanggil `revalidateTag` untuk meng-invalidasi cache secara langsung.
//
// SCOPE PENTING: modul ini HANYA menyediakan storage + cache layer. Komponen
// publik (footer/header/metadata) BELUM di-rewire untuk membacanya — itu
// menunggu verifikasi gerbang snapshot SEO (Task 6) oleh pemilik.
//
// Ketahanan: semua akses DB dibungkus try/catch dan mengembalikan default
// kosong bila DB gagal (meniru pola src/lib/public/queries.ts) agar build/SSR
// tidak crash di environment tanpa kredensial database.

import { unstable_cache, revalidateTag } from "next/cache";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { siteSettings } from "@/db/schema";

// Tag cache bersama untuk seluruh pembacaan settings.
export const SETTINGS_CACHE_TAG = "site-settings";
// Revalidasi berkala (detik) sebagai jaring pengaman selain invalidasi on-demand.
const SETTINGS_CACHE_REVALIDATE = 60;

export type SettingType = "text" | "json" | "url" | "image" | "html";
export type SettingGroup = "general" | "seo" | "social" | "contact";

// Record settings lengkap dengan metadata (key → value + info tampilan).
export type SettingRecord = {
  key: string;
  value: string | null;
  type: string;
  group: string;
  label: string | null;
  description: string | null;
};

// Map key → record. Bentuk yang dikembalikan oleh getAllSettings/getSettingsByGroup.
export type SettingsMap = Record<string, SettingRecord>;

// Pasangan {key, value} untuk mutasi.
export type SettingValueInput = {
  key: string;
  value: string | null;
};

// --- Pembacaan (uncached primitive) ----------------------------------------

const fetchAllSettings = async (): Promise<SettingsMap> => {
  try {
    const rows = await db
      .select({
        key: siteSettings.key,
        value: siteSettings.value,
        type: siteSettings.type,
        group: siteSettings.group,
        label: siteSettings.label,
        description: siteSettings.description,
      })
      .from(siteSettings)
      .orderBy(asc(siteSettings.id));

    const map: SettingsMap = {};
    for (const row of rows) {
      map[row.key] = {
        key: row.key,
        value: row.value ?? null,
        type: row.type,
        group: row.group,
        label: row.label ?? null,
        description: row.description ?? null,
      };
    }
    return map;
  } catch (error) {
    console.warn(
      "[lib/settings] fetchAllSettings gagal (database tidak tersedia):",
      error instanceof Error ? error.message : error,
    );
    return {};
  }
};

// Versi ter-cache dari fetchAllSettings. Semua getter lain menurunkan datanya
// dari sini agar hanya ada satu entri cache yang di-invalidasi oleh satu tag.
const getCachedSettings = unstable_cache(fetchAllSettings, ["site-settings"], {
  tags: [SETTINGS_CACHE_TAG],
  revalidate: SETTINGS_CACHE_REVALIDATE,
});

// --- Public API pembacaan ---------------------------------------------------

/** Seluruh settings sebagai map key → record (value + metadata). */
export const getAllSettings = async (): Promise<SettingsMap> =>
  getCachedSettings();

/** Settings pada satu grup (general|seo|social|contact) sebagai map. */
export const getSettingsByGroup = async (
  group: SettingGroup | string,
): Promise<SettingsMap> => {
  const all = await getCachedSettings();
  const filtered: SettingsMap = {};
  for (const record of Object.values(all)) {
    if (record.group === group) {
      filtered[record.key] = record;
    }
  }
  return filtered;
};

/** Nilai mentah satu setting berdasarkan key (null bila tidak ada). */
export const getSetting = async (key: string): Promise<string | null> => {
  const all = await getCachedSettings();
  return all[key]?.value ?? null;
};

/**
 * Nilai setting bertipe JSON, di-parse ke tipe T. Mengembalikan null bila key
 * tidak ada atau JSON tidak valid.
 */
export const getJsonSetting = async <T>(key: string): Promise<T | null> => {
  const raw = await getSetting(key);
  if (raw === null || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(
      `[lib/settings] getJsonSetting("${key}") gagal parse JSON:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
};

// --- Mutasi -----------------------------------------------------------------

/**
 * Upsert sekumpulan settings ({key, value}[]). Baris yang sudah ada diperbarui
 * (value + updatedAt); key baru disisipkan dengan type/group default. Setelah
 * berhasil, cache "site-settings" di-invalidasi seketika.
 *
 * Melempar error bila penulisan DB gagal (agar route handler bisa merespons 500).
 */
export const updateSettings = async (
  records: SettingValueInput[],
): Promise<void> => {
  if (records.length === 0) return;

  const now = new Date();

  for (const record of records) {
    await db
      .insert(siteSettings)
      .values({ key: record.key, value: record.value, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: record.value, updatedAt: now },
      });
  }

  // Next 16: revalidateTag mewajibkan argumen kedua. `{ expire: 0 }` memberi
  // ekspirasi seketika — tepat untuk mutasi dari Route Handler agar admin
  // langsung melihat perubahannya (lihat docs revalidateTag).
  revalidateTag(SETTINGS_CACHE_TAG, { expire: 0 });
};
