/**
 * Tanggal update stok — SATU sumber (Fase 3 spec seo-cannibalization-and-pseo).
 *
 * CARA MEMPERBARUI: ganti HANYA baris `STOCK_UPDATED_AT` di bawah setiap kali
 * siteplan baru diunggah.
 *
 * Tanggal ini akan otomatis tersinkronisasi ke:
 * 1. Halaman Update Stok
 * 2. Sitemap (lastmod)
 * 3. Kartu profil penulis (artikel terkait)
 */
export const STOCK_UPDATED_AT = new Date("2026-09-19T00:00:00+07:00");
