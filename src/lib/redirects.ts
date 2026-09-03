export const HOMEPAGE_CANNIBALIZATION_REDIRECT_PATH =
  "/perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap" as const;

/**
 * Slug halaman lokasi diubah 3 September 2026: `lokasi-akses-grand-duta-city-parung`
 * -> `lokasi-akses-gdc-parung`.
 *
 * Alasannya sama dengan yang mendasari seluruh kerja konsolidasi query brand:
 * slug adalah salah satu sinyal on-page yang dibaca Google, dan slug lama
 * memuat frasa target homepage secara utuh. Varian "gdc-parung" sudah menjadi
 * bahasa resmi halaman ini sendiri — `<title>`-nya "Lokasi GDC Parung: 4 Exit
 * Tol ke Jakarta & Depok" dan H1-nya "Lokasi & Akses GDC Parung ke Jakarta,
 * Depok, Bogor" — jadi slug baru justru menyelaraskan URL dengan judulnya.
 *
 * URL lama WAJIB tetap 301 ke URL baru: ia sudah terindeks, punya self-canonical
 * sendiri, dan menerima tautan internal dari header, footer, dan halaman cluster.
 * Membiarkannya 404 berarti membuang seluruh ekuitas yang sudah terkumpul.
 */
export const LOCATION_PAGE_LEGACY_PATH =
  "/lokasi-akses-grand-duta-city-parung" as const;

export const LOCATION_PAGE_PATH = "/lokasi-akses-gdc-parung" as const;

/**
 * Path yang HARUS dikeluarkan dari sitemap karena ia sumber redirect, bukan
 * tujuan. Sitemap yang memuat URL 301 mengirim sinyal bertabrakan: "indeks ini"
 * sekaligus "URL ini sudah pindah".
 */
export const REDIRECTED_SITEMAP_SOURCE_PATHS = [
  HOMEPAGE_CANNIBALIZATION_REDIRECT_PATH,
  LOCATION_PAGE_LEGACY_PATH,
] as const;

const redirectedSitemapSourcePathSet = new Set<string>(
  REDIRECTED_SITEMAP_SOURCE_PATHS,
);

function normalizePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "/";

  const pathname = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return (withoutTrailingSlash || "/").toLowerCase();
}

export function pathFromSitemapUrl(url: string) {
  try {
    return normalizePath(new URL(url).pathname);
  } catch {
    return normalizePath(url);
  }
}

export function isRedirectedSitemapSourcePath(pathname: string) {
  return redirectedSitemapSourcePathSet.has(normalizePath(pathname));
}

export function isRedirectedSitemapSourceUrl(url: string) {
  return isRedirectedSitemapSourcePath(pathFromSitemapUrl(url));
}
