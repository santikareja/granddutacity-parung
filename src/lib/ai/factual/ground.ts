// Eksekusi rencana grounding: ambil data faktual dari SATU sumber, dengan
// fallback berlapis bila sumber itu tidak menghasilkan apa pun.
//
// LAPIS FALLBACK (sesuai kebutuhan "pilih salah satu saja, fallback bila gagal"):
//   1. Tool primer sesuai planGrounding() — BPS atau pencarian web.
//   2. Bila primer menghasilkan 0 sumber layak → coba tool yang lain sekali.
//   3. Di dalam pencarian web sendiri: Tavily → SerpApi (ditangani searchWeb).
//   4. Bila semuanya kosong → kembalikan [] dan artikel ditulis kualitatif
//      (tanpa angka, tanpa tautan eksternal). Bukan error.
//
// Seluruh hasil disaring allowlist otoritas SEBELUM sampai ke model, sehingga
// model tidak pernah melihat — apalagi menautkan — situs pesaing.

import { filterAuthoritativeSources } from "./authority";
import type { GroundingPlan } from "./plan";
import { searchBpsData, searchWeb, type ToolSource } from "./sources";

// Batas sumber yang dikirim ke prompt. Lebih dari ini hanya menambah token tanpa
// menambah kualitas, dan mendorong model menautkan terlalu banyak.
const MAX_SOURCES = 3;

export type GroundingAttempt = {
  tool: "bps" | "web";
  query: string;
  /** Provider yang benar-benar menjawab. */
  provider: "bps" | "tavily" | "serpapi" | null;
  /** Jumlah sumber yang lolos penyaringan otoritas. */
  kept: number;
  /** Jumlah sumber yang ditolak karena domainnya tidak layak. */
  rejected: number;
};

export type GroundingResult = {
  sources: ToolSource[];
  plan: GroundingPlan;
  attempts: GroundingAttempt[];
  /** true bila tool primer gagal dan sistem beralih ke tool lain. */
  fallbackUsed: boolean;
  /** URL yang dibuang karena bukan domain tepercaya (untuk log). */
  rejectedUrls: string[];
};

type RunOutcome = {
  attempt: GroundingAttempt;
  sources: ToolSource[];
  rejectedUrls: string[];
};

const runBps = async (plan: GroundingPlan): Promise<RunOutcome> => {
  const raw = await searchBpsData(plan.bpsKeyword);
  const { kept, rejected } = filterAuthoritativeSources(raw);
  return {
    attempt: {
      tool: "bps",
      query: plan.bpsKeyword,
      provider: kept.length > 0 ? "bps" : null,
      kept: kept.length,
      rejected: rejected.length,
    },
    sources: kept,
    rejectedUrls: rejected,
  };
};

const runWeb = async (plan: GroundingPlan): Promise<RunOutcome> => {
  // Ambil lebih banyak dari MAX_SOURCES karena sebagian akan tersaring keluar
  // oleh allowlist; tanpa ini artikel sering berakhir tanpa sumber sama sekali.
  const web = await searchWeb(plan.webQuery, 6);
  const { kept, rejected } = filterAuthoritativeSources(web.sources);
  return {
    attempt: {
      tool: "web",
      query: plan.webQuery,
      provider: kept.length > 0 ? web.providerUsed : null,
      kept: kept.length,
      rejected: rejected.length,
    },
    sources: kept,
    rejectedUrls: rejected,
  };
};

const dedupe = (sources: ToolSource[]): ToolSource[] => {
  const seen = new Set<string>();
  const out: ToolSource[] = [];
  for (const source of sources) {
    const key = source.source_url.trim().toLowerCase().replace(/\/+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(source);
  }
  return out;
};

/**
 * Jalankan grounding. Tidak pernah melempar: kegagalan jaringan/konfigurasi
 * berakhir sebagai daftar sumber kosong, dan artikel tetap bisa ditulis.
 */
export const gatherGroundingSources = async (
  plan: GroundingPlan,
): Promise<GroundingResult> => {
  const attempts: GroundingAttempt[] = [];
  const rejectedUrls: string[] = [];
  let sources: ToolSource[] = [];
  let fallbackUsed = false;

  const primary = plan.primary === "bps" ? runBps : runWeb;
  const secondary = plan.primary === "bps" ? runWeb : runBps;

  try {
    const first = await primary(plan);
    attempts.push(first.attempt);
    rejectedUrls.push(...first.rejectedUrls);
    sources = first.sources;
  } catch (error) {
    console.warn(
      `[grounding] tool primer (${plan.primary}) gagal:`,
      error instanceof Error ? error.message : error,
    );
  }

  // Fallback hanya bila primer benar-benar tidak memberi sumber layak.
  if (sources.length === 0) {
    fallbackUsed = true;
    try {
      const second = await secondary(plan);
      attempts.push(second.attempt);
      rejectedUrls.push(...second.rejectedUrls);
      sources = second.sources;
    } catch (error) {
      console.warn(
        "[grounding] tool fallback juga gagal:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return {
    sources: dedupe(sources).slice(0, MAX_SOURCES),
    plan,
    attempts,
    fallbackUsed,
    rejectedUrls,
  };
};
