/**
 * Konstanta SEO terpusat.
 *
 * Dibuat pada Fase 1 spec `seo-cannibalization-and-pseo` karena audit menemukan
 * `openGraph.siteName` tersebar dalam TIGA varian berbeda di 10 file
 * ("Grand Duta City Parung", "Grand Duta City Parung South of Jakarta",
 * "Grand Duta City South of Jakarta"). Varian yang tidak konsisten memecah
 * entitas brand di mata Google, dan itu prasyarat yang belum terpenuhi untuk
 * sitelink serta knowledge panel.
 *
 * Aturannya sekarang: JANGAN menulis literal nama situs di metadata halaman —
 * impor dari sini. Guard test `seo-invariants.test.ts` (G11) akan gagal bila
 * ada dua nilai berbeda yang beredar.
 */

export const SITE_URL = "https://granddutacitysouthofjakarta.com";

/** Satu-satunya nilai sah untuk `openGraph.siteName` di seluruh situs. */
export const OG_SITE_NAME = "Grand Duta City Parung";

/**
 * Frasa yang HANYA boleh dimiliki homepage sebagai target peringkat.
 *
 * Halaman non-homepage boleh memuat "Grand Duta City" hanya bila dipasangkan
 * modifier kuat yang mengubah maksud query (pricelist, siteplan, lokasi,
 * cluster X, cara beli, tipe X). Yang dilarang adalah brand tag berdiri
 * sendiri atau menggantung di akhir title.
 */
export const RESERVED_HOMEPAGE_KEYWORDS = [
  "grand duta city parung",
  "grand duta city south of jakarta",
] as const;
