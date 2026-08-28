// Penyaring kelayakan sumber tautan eksternal. Server-side only (fungsi murni).
//
// MASALAH yang diselesaikan modul ini: hasil pencarian web (Tavily/SerpApi) bisa
// mengembalikan apa saja — termasuk situs pengembang properti pesaing, portal
// jual-beli properti, dan blog acak. Menautkan itu di artikel merugikan dua kali:
// membocorkan otoritas ke pesaing dan menurunkan kredibilitas artikel.
//
// KEBIJAKAN: allowlist, bukan blocklist. Sumber HANYA lolos bila domainnya ada
// di daftar tepercaya. Domain yang tidak dikenal otomatis ditolak — lebih aman
// kehilangan satu kutipan daripada menautkan pesaing.

import type { ToolSource } from "./sources";

// Domain sendiri: bukan "sumber eksternal", ditangani terpisah oleh CTA sistem.
const OWN_DOMAINS = ["granddutacitysouthofjakarta.com"];

/**
 * Domain tepercaya. Pencocokan berbasis SUFFIX: entri "go.id" mencakup
 * "bps.go.id" dan "www.bi.go.id". Dikelompokkan agar mudah ditambah.
 */
export const AUTHORITY_DOMAINS: readonly string[] = [
  // --- Pemerintah & statistik resmi Indonesia ---
  // "go.id" mencakup seluruh instansi: bps.go.id, bi.go.id, ojk.go.id,
  // kemenkeu.go.id, pu.go.id, atrbpn.go.id, bphn.go.id, dsb.
  "go.id",

  // --- Ensiklopedia & rujukan ---
  "wikipedia.org",
  "wikimedia.org",
  "britannica.com",

  // --- Akademik & jurnal ---
  "ac.id",
  "edu",
  "doi.org",
  "researchgate.net",
  "scholar.google.com",

  // --- Lembaga internasional ---
  "worldbank.org",
  "imf.org",
  "oecd.org",
  "un.org",
  "adb.org",
  "bis.org",

  // --- Media besar Indonesia ---
  "kompas.com",
  "kompas.id",
  "tempo.co",
  "detik.com",
  "cnnindonesia.com",
  "cnbcindonesia.com",
  "kontan.co.id",
  "bisnis.com",
  "katadata.co.id",
  "tirto.id",
  "antaranews.com",
  "liputan6.com",
  "republika.co.id",
  "mediaindonesia.com",
  "jawapos.com",
  "kumparan.com",
  "thejakartapost.com",
  "investor.id",
  "sindonews.com",
  "suara.com",
  "validnews.id",
  "beritasatu.com",

  // --- Media & data internasional ---
  "reuters.com",
  "bloomberg.com",
  "ft.com",
  "bbc.com",
  "cnbc.com",
  "theguardian.com",
  "channelnewsasia.com",
  "nikkei.com",
  "tradingeconomics.com",
];

/**
 * Domain yang DILARANG meski entah bagaimana lolos allowlist: pengembang
 * properti pesaing, portal listing/marketplace properti, dan agregator iklan.
 * Diperiksa LEBIH DULU agar bersifat mutlak.
 */
export const BLOCKED_DOMAINS: readonly string[] = [
  // Portal listing / marketplace properti
  "rumah123.com",
  "rumah.com",
  "99.co",
  "lamudi.co.id",
  "pinhome.id",
  "brighton.co.id",
  "century21.co.id",
  "rumahdijual.com",
  "olx.co.id",
  "travelio.com",
  "mamikos.com",
  "pindahrumah.com",
  "urbanindo.com",
  // Agen/agregator & direktori properti
  "era.co.id",
  "raywhite.co.id",
  "propertiterbaru.com",
  "rumahku.com",
  // Pengembang besar (pesaing langsung di segmen perumahan)
  "sinarmasland.com",
  "ciputra.com",
  "ciputradevelopment.com",
  "summarecon.com",
  "agungpodomoroland.com",
  "alamsutera.com",
  "pakuwonjati.com",
  "lippokarawaci.co.id",
  "paramount-land.com",
  "modernland.co.id",
  "bsdcity.com",
  "citragrand.co.id",
  "adhipersadaproperti.co.id",
  "metropolitanland.com",
];

/** Ambil hostname tanpa "www.". Mengembalikan null bila URL tidak valid. */
export const hostnameOf = (url: string): string | null => {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

// Cocok bila host sama dengan domain atau merupakan subdomain-nya.
const matchesDomain = (host: string, domain: string): boolean =>
  host === domain || host.endsWith(`.${domain}`);

const matchesAny = (host: string, domains: readonly string[]): boolean =>
  domains.some((domain) => matchesDomain(host, domain));

/** Apakah URL menunjuk ke domain situs sendiri (internal, bukan sumber luar). */
export const isOwnDomain = (url: string): boolean => {
  const host = hostnameOf(url);
  return host !== null && matchesAny(host, OWN_DOMAINS);
};

/** Apakah URL termasuk domain yang diblokir (pesaing/marketplace). */
export const isBlockedDomain = (url: string): boolean => {
  const host = hostnameOf(url);
  return host !== null && matchesAny(host, BLOCKED_DOMAINS);
};

/**
 * Kelayakan sebuah URL untuk dijadikan tautan rujukan eksternal di artikel.
 * Urutan pemeriksaan: URL valid → bukan domain sendiri → bukan domain terlarang
 * → ada di allowlist.
 */
export const isAuthoritativeUrl = (url: string): boolean => {
  const host = hostnameOf(url);
  if (!host) return false;
  if (matchesAny(host, OWN_DOMAINS)) return false;
  if (matchesAny(host, BLOCKED_DOMAINS)) return false;
  return matchesAny(host, AUTHORITY_DOMAINS);
};

export type AuthorityFilterResult = {
  /** Sumber yang lolos, urutan asli dipertahankan. */
  kept: ToolSource[];
  /** URL yang ditolak — berguna untuk log/diagnosa, bukan untuk ditampilkan. */
  rejected: string[];
};

/**
 * Saring daftar sumber sehingga hanya domain tepercaya yang boleh dikutip dan
 * ditautkan. Model tidak pernah melihat sumber yang ditolak, jadi ia tidak
 * mungkin menautkannya.
 */
export const filterAuthoritativeSources = (
  sources: ToolSource[],
): AuthorityFilterResult => {
  const kept: ToolSource[] = [];
  const rejected: string[] = [];

  for (const source of sources) {
    // Sumber BPS dibuat sendiri oleh sistem (source_url resmi BPS), tetapi tetap
    // diverifikasi lewat jalur yang sama agar tidak ada pengecualian diam-diam.
    if (isAuthoritativeUrl(source.source_url)) {
      kept.push(source);
    } else {
      rejected.push(source.source_url);
    }
  }

  return { kept, rejected };
};
