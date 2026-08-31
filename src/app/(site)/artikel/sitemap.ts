import type { MetadataRoute } from "next";

import { getArticleSitemapEntries } from "@/lib/public/queries";

/**
 * SITEMAP ARTIKEL TERPISAH — Fase 6 spec `seo-cannibalization-and-pseo`.
 *
 * ALASANNYA DIAGNOSTIK, bukan kosmetik. Sebelum ini seluruh URL menumpuk di
 * satu `sitemap.xml`, sehingga laporan Pages di Search Console hanya memberi
 * satu angka indexation agregat. Bila satu template gagal terindeks — misalnya
 * 10 halaman tipe unit yang baru tayang di Fase 7 — kegagalannya tersembunyi di
 * balik puluhan artikel yang sehat.
 *
 * Dengan sitemap terpisah per tipe halaman, tiap template bisa diamati sendiri.
 * Ini juga prasyarat gate Fase 7.8: "indexation rate >= 80%" tidak bisa diukur
 * kalau angkanya tercampur.
 *
 * Next 16 otomatis menyajikan berkas ini di `/artikel/sitemap.xml` dan
 * mendaftarkannya lewat mekanisme sitemap milik Next.
 *
 * CATATAN: artikel tetap juga ada di `app/sitemap.ts` supaya tidak ada URL yang
 * hilang bila hanya satu sitemap yang dibaca. Duplikasi URL antar sitemap TIDAK
 * dilarang Google dan tidak menimbulkan masalah kanonikal — yang dilarang
 * adalah URL yang tidak konsisten dengan canonical-nya.
 */

const BASE_URL = "https://granddutacitysouthofjakarta.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getArticleSitemapEntries();

  return entries.map((entry) => ({
    url: `${BASE_URL}/${entry.slug}`,
    // `updatedAt` lebih dulu: ia menyatakan kapan kontennya terakhir berubah.
    // `publishedAt` hanya cadangan untuk baris lama yang `updatedAt`-nya kosong.
    lastModified: new Date(entry.updatedAt ?? entry.publishedAt ?? Date.now()),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}
