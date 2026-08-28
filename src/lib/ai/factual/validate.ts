// Validasi kualitas artikel faktual terhadap hasil tool. Server-side, murni
// fungsi (mudah diuji). Tidak pernah memblokir penyimpanan — hasilnya dipakai
// untuk menandai artikel butuh review (needsReview) beserta alasannya.

import { CTA_URL } from "@/lib/v2-admin/lexical";
import type { ToolSource } from "./sources";

export type QualityOptions = {
  minWords: number;
  maxWords: number;
  minHeadings: number;
  minExternalLinks: number;
  maxExternalLinks: number;
};

export const DEFAULT_QUALITY_OPTIONS: QualityOptions = {
  minWords: 800,
  maxWords: 1500,
  minHeadings: 2,
  minExternalLinks: 1,
  maxExternalLinks: 2,
};

export type QualityResult = {
  ok: boolean;
  needsReview: boolean;
  reasons: string[];
  stats: {
    wordCount: number;
    headingCount: number;
    externalLinks: number;
    unmatchedLinks: string[];
    suspectNumbers: string[];
  };
};

const HOMEPAGE_HOSTS = new Set([
  "granddutacitysouthofjakarta.com",
  "www.granddutacitysouthofjakarta.com",
]);

const stripTags = (html: string): string =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeUrl = (url: string): string =>
  url.trim().replace(/\/+$/, "").toLowerCase();

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

// Ekstrak href dari seluruh <a>.
const extractHrefs = (html: string): string[] => {
  const hrefs: string[] = [];
  const re = /<a\s[^>]*href\s*=\s*"([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    hrefs.push(m[1]);
  }
  return hrefs;
};

// Token angka yang "signifikan" (berpotensi klaim statistik). Tahun 1900-2099
// diabaikan agar konteks waktu tidak salah ditandai sebagai halusinasi.
const significantNumbers = (text: string): string[] => {
  const matches = text.match(/\d[\d.,]*\s*%?/g) ?? [];
  const out: string[] = [];
  for (const raw of matches) {
    const token = raw.trim();
    const hasPercent = token.includes("%");
    const digits = token.replace(/[^\d]/g, "");
    if (digits.length === 0) continue;

    const isYear =
      !hasPercent &&
      /^\d{4}$/.test(token) &&
      Number(token) >= 1900 &&
      Number(token) <= 2099;
    if (isYear) continue;

    const hasSeparator = /[.,]/.test(token);
    const significant = hasPercent || hasSeparator || digits.length >= 4;
    if (significant) out.push(token);
  }
  return out;
};

/**
 * Validasi artikel HTML terhadap sumber data yang dipakai.
 */
export const validateArticleQuality = (
  html: string,
  sources: ToolSource[],
  options: Partial<QualityOptions> = {},
): QualityResult => {
  const opts = { ...DEFAULT_QUALITY_OPTIONS, ...options };
  const reasons: string[] = [];

  const text = stripTags(html);

  // 1) Jumlah kata.
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount < opts.minWords) {
    reasons.push(
      `Artikel terlalu pendek (${wordCount} kata, minimal ${opts.minWords}).`,
    );
  } else if (wordCount > opts.maxWords) {
    reasons.push(
      `Artikel terlalu panjang (${wordCount} kata, maksimal ${opts.maxWords}).`,
    );
  }

  // 2) Heading H2/H3.
  const headingCount = (html.match(/<h[23][\s>]/gi) ?? []).length;
  if (headingCount < opts.minHeadings) {
    reasons.push(
      `Kurang subheading (${headingCount}, minimal ${opts.minHeadings} H2/H3).`,
    );
  }

  // 3) Tautan eksternal & kecocokan dengan sumber.
  const sourceUrls = new Set(sources.map((s) => normalizeUrl(s.source_url)));
  const externalHrefs = extractHrefs(html).filter((href) => {
    const host = hostOf(href);
    return host !== null && !HOMEPAGE_HOSTS.has(host) && href.startsWith("http");
  });
  const unmatchedLinks = externalHrefs.filter(
    (href) => !sourceUrls.has(normalizeUrl(href)),
  );

  if (sources.length === 0) {
    if (externalHrefs.length > 0) {
      reasons.push(
        "Ada tautan eksternal padahal tidak ada sumber data yang diambil.",
      );
    }
  } else {
    if (externalHrefs.length < opts.minExternalLinks) {
      reasons.push(
        `Kutipan sumber kurang (${externalHrefs.length}, minimal ${opts.minExternalLinks} tautan eksternal).`,
      );
    }
    if (externalHrefs.length > opts.maxExternalLinks) {
      reasons.push(
        `Terlalu banyak tautan eksternal (${externalHrefs.length}, maksimal ${opts.maxExternalLinks}).`,
      );
    }
    if (unmatchedLinks.length > 0) {
      reasons.push(
        `Ada tautan eksternal yang tidak cocok dengan sumber data: ${unmatchedLinks.join(", ")}.`,
      );
    }
  }

  // 4) Angka yang tidak ada di sumber (indikasi halusinasi).
  const haystack = sources
    .map((s) => `${s.data_summary} ${s.tahun_data ?? ""} ${s.source_name}`)
    .join(" ")
    .replace(/[.,%\s]/g, "");
  const suspectNumbers = significantNumbers(text).filter((token) => {
    const digits = token.replace(/[^\d]/g, "");
    return digits.length > 0 && !haystack.includes(digits);
  });
  if (suspectNumbers.length > 0) {
    reasons.push(
      `Ada angka yang tidak ditemukan di sumber data (indikasi halusinasi): ${suspectNumbers.join(", ")}.`,
    );
  }

  const ok = reasons.length === 0;
  return {
    ok,
    needsReview: !ok,
    reasons,
    stats: {
      wordCount,
      headingCount,
      externalLinks: externalHrefs.length,
      unmatchedLinks,
      suspectNumbers,
    },
  };
};

// CTA_URL diekspor ulang untuk kejelasan pemakaian (host homepage dikecualikan
// dari hitungan tautan eksternal).
export { CTA_URL };
