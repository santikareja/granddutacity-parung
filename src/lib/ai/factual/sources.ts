// Sumber data faktual untuk artikel berbasis data. Server-side only.
//
// Tiga sumber:
//   1. BPS (webapi.bps.go.id) — statistik resmi. Best-effort: BPS memakai ID
//      variabel, bukan pencarian teks bebas, dan bentuk responsnya berubah-ubah,
//      jadi integrasi ini defensif. Bila tidak yakin, ia mengembalikan [] — TIDAK
//      pernah mengarang angka.
//   2. Tavily — web search real-time (PRIMARY).
//   3. SerpApi — fallback OTOMATIS bila Tavily gagal/timeout/kosong.
//
// Semua fungsi menormalkan hasil ke bentuk ToolSource yang sama sehingga
// orkestrator dan validator memperlakukannya seragam. Tidak ada yang melempar
// ke pemanggil kecuali disebut; kegagalan jaringan menjadi array kosong.

import { getFactualSourceConfig } from "@/lib/ai/env";

export type ToolProvider = "bps" | "tavily" | "serpapi";

export type ToolSource = {
  source_name: string;
  source_url: string;
  data_summary: string;
  tahun_data?: string;
  retrieved_at: string;
  provider: ToolProvider;
};

export type WebSearchResult = {
  sources: ToolSource[];
  providerUsed: "tavily" | "serpapi" | null;
  /** true bila Tavily gagal dan sistem berpindah ke SerpApi. */
  fallbackUsed: boolean;
};

const DEFAULT_TIMEOUT_MS = 15_000;

const nowIso = (): string => new Date().toISOString();

const truncate = (text: string, max = 600): string =>
  text.length > max ? `${text.slice(0, max).trim()}…` : text.trim();

// Fetch JSON dengan timeout. Melempar Error pada non-2xx / timeout / body bukan
// JSON, agar pemanggil (mis. searchWeb) bisa memutuskan fallback.
const fetchJson = async (
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
};

// --- BPS --------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Cari variabel BPS berdasarkan kata kunci dan rangkum judul-judulnya sebagai
 * sumber resmi. TIDAK mengarang angka: bila nilai numerik tidak dapat diambil
 * dengan yakin, ringkasan berisi nama indikator saja dan pembaca diarahkan ke
 * situs BPS. Mengembalikan [] jika tidak dikonfigurasi atau gagal.
 */
export const searchBpsData = async (
  indicatorKeyword: string,
  tahun?: string,
): Promise<ToolSource[]> => {
  const { bpsAppId } = getFactualSourceConfig();
  const keyword = indicatorKeyword.trim();
  if (!bpsAppId || !keyword) return [];

  try {
    // Domain 0000 = nasional. Endpoint list variabel berdasarkan keyword.
    const url =
      `https://webapi.bps.go.id/v1/api/list/model/var/domain/0000/` +
      `keyword/${encodeURIComponent(keyword)}/key/${encodeURIComponent(bpsAppId)}/`;

    const raw = (await fetchJson(url, { method: "GET" })) as {
      status?: string;
      data?: unknown;
    };

    if (!raw || raw.status !== "OK" || !Array.isArray(raw.data)) return [];

    // BPS membungkus hasil sebagai [page_info, rows]. Ambil rows.
    const rows = raw.data.find((part) => Array.isArray(part)) as
      | Array<{ title?: unknown; var?: unknown }>
      | undefined;

    if (!rows || rows.length === 0) return [];

    const titles = rows
      .map((row) => (typeof row.title === "string" ? row.title.trim() : ""))
      .filter((t) => t.length > 0)
      .slice(0, 5);

    if (titles.length === 0) return [];

    const summary =
      `Indikator resmi BPS terkait "${keyword}": ${titles.join("; ")}. ` +
      `Angka terkini tersedia di portal resmi BPS.`;

    return [
      {
        source_name: "Badan Pusat Statistik (BPS)",
        source_url: "https://www.bps.go.id/",
        data_summary: truncate(summary, 700),
        tahun_data: (tahun && tahun.trim()) || String(CURRENT_YEAR),
        retrieved_at: nowIso(),
        provider: "bps",
      },
    ];
  } catch (error) {
    console.error("[factual/bps] gagal mengambil data BPS:", error);
    return [];
  }
};

// --- Tavily -----------------------------------------------------------------

export const searchWebTavily = async (
  query: string,
  maxResults = 3,
): Promise<ToolSource[]> => {
  const { tavilyKey } = getFactualSourceConfig();
  const q = query.trim();
  if (!tavilyKey || !q) return [];

  const raw = (await fetchJson("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: tavilyKey,
      query: q,
      max_results: Math.max(1, Math.min(5, maxResults)),
      search_depth: "basic",
      include_answer: false,
    }),
  })) as {
    results?: Array<{ title?: unknown; url?: unknown; content?: unknown }>;
  };

  const results = Array.isArray(raw?.results) ? raw.results : [];
  const sources = results
    .filter(
      (r): r is { title: string; url: string; content?: string } =>
        typeof r.url === "string" && r.url.startsWith("http"),
    )
    .slice(0, maxResults)
    .map((r) => ({
      source_name:
        (typeof r.title === "string" && r.title.trim()) ||
        new URL(r.url).hostname,
      source_url: r.url,
      data_summary: truncate(
        typeof r.content === "string" ? r.content : "",
        600,
      ),
      retrieved_at: nowIso(),
      provider: "tavily" as const,
    }));

  // Body kosong dianggap kegagalan agar fallback SerpApi bisa dicoba.
  if (sources.length === 0) {
    throw new Error("Tavily tidak mengembalikan hasil.");
  }
  return sources;
};

// --- SerpApi (fallback otomatis) --------------------------------------------

export const searchWebSerpapi = async (
  query: string,
  maxResults = 3,
): Promise<ToolSource[]> => {
  const { serpapiKey } = getFactualSourceConfig();
  const q = query.trim();
  if (!serpapiKey || !q) return [];

  const url =
    `https://serpapi.com/search.json?engine=google&hl=id&gl=id` +
    `&q=${encodeURIComponent(q)}&num=${Math.max(1, Math.min(5, maxResults))}` +
    `&api_key=${encodeURIComponent(serpapiKey)}`;

  const raw = (await fetchJson(url, { method: "GET" })) as {
    organic_results?: Array<{
      title?: unknown;
      link?: unknown;
      snippet?: unknown;
    }>;
  };

  const results = Array.isArray(raw?.organic_results)
    ? raw.organic_results
    : [];

  return results
    .filter(
      (r): r is { title: string; link: string; snippet?: string } =>
        typeof r.link === "string" && r.link.startsWith("http"),
    )
    .slice(0, maxResults)
    .map((r) => ({
      source_name:
        (typeof r.title === "string" && r.title.trim()) ||
        new URL(r.link).hostname,
      source_url: r.link,
      data_summary: truncate(
        typeof r.snippet === "string" ? r.snippet : "",
        600,
      ),
      retrieved_at: nowIso(),
      provider: "serpapi" as const,
    }));
};

/**
 * Web search PRIMARY (Tavily) dengan fallback OTOMATIS ke SerpApi. AI tidak
 * pernah tahu fallback terjadi; ia hanya meminta "cari web". `fallbackUsed`
 * dicatat untuk metadata/log.
 */
export const searchWeb = async (
  query: string,
  maxResults = 3,
): Promise<WebSearchResult> => {
  try {
    const sources = await searchWebTavily(query, maxResults);
    return { sources, providerUsed: "tavily", fallbackUsed: false };
  } catch (tavilyError) {
    console.warn(
      "[factual/web] Tavily gagal, fallback ke SerpApi:",
      tavilyError instanceof Error ? tavilyError.message : tavilyError,
    );
    try {
      const sources = await searchWebSerpapi(query, maxResults);
      return { sources, providerUsed: "serpapi", fallbackUsed: true };
    } catch (serpError) {
      console.error(
        "[factual/web] SerpApi juga gagal:",
        serpError instanceof Error ? serpError.message : serpError,
      );
      return { sources: [], providerUsed: null, fallbackUsed: true };
    }
  }
};
