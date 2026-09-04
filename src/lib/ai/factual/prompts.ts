// Prompt untuk artikel faktual berbasis data (orkestrasi provider-agnostic).
//
// Dua tahap:
//   1. buildToolPlanPrompt  — model memilih tool + query (dibalas sebagai JSON).
//      Ini menggantikan native function-calling agar tahan rotasi model apa pun.
//   2. buildFactualArticlePrompt — model menulis artikel HANYA dari hasil tool.

import {
  AI_PERSONA,
  BRAND_FACT_SHEET,
  CITATION_CRAFT,
  CTA_CRAFT,
  FACT_DISCIPLINE,
  HOMEPAGE_KEYWORD_GUARD,
  HOUSE_STYLE,
  OUTPUT_DISCIPLINE,
  jsonContract,
} from "@/lib/ai/brand-facts";
import type { ChatMessage } from "@/lib/ai/client";
import type { ToolSource } from "./sources";

// Perencanaan tool tidak menulis tentang proyek, jadi ia hanya butuh fondasi
// netral (persona + disiplin fakta) tanpa lembar fakta brand.
const NEUTRAL_FOUNDATION = `${AI_PERSONA}

${FACT_DISCIPLINE}`;

// Penulisan artikel butuh lembar fakta proyek.
const ARTICLE_FOUNDATION = `${NEUTRAL_FOUNDATION}

${BRAND_FACT_SHEET}`;

// ---------------------------------------------------------------------------
// Tahap 1 — perencanaan tool
// ---------------------------------------------------------------------------

export type PlannedTool =
  | { name: "search_bps_data"; indicator_keyword: string; tahun?: string }
  | { name: "search_web_tavily"; query: string; max_results?: number };

export const buildToolPlanPrompt = (
  topic: string,
  category: string,
): ChatMessage[] => [
  {
    role: "system",
    content: `${NEUTRAL_FOUNDATION}

TUGAS
Sebelum menulis artikel, tentukan sumber DATA FAKTUAL yang paling relevan untuk topik ini. Kamu TIDAK menulis artikel sekarang — kamu hanya memilih tool dan query. Sistem akan mengeksekusinya dan memberikan hasilnya padamu di langkah berikutnya.

TOOL YANG TERSEDIA
1) search_bps_data — statistik resmi Badan Pusat Statistik (angka makro: indeks harga properti, inflasi, data ekonomi/perumahan).
   Parameter: indicator_keyword (kata kunci indikator, bahasa Indonesia), tahun (opsional).
2) search_web_tavily — pencarian web real-time untuk tren, berita, dan konteks pasar terkini.
   Parameter: query (bahasa Indonesia), max_results (opsional, default 3).

CARA MEMILIH
- Topik seputar data ekonomi/statistik resmi → prioritaskan search_bps_data.
- Topik seputar tren/berita/opini pasar terkini → gunakan search_web_tavily.
- Boleh memilih KEDUANYA bila topik butuh angka makro + konteks terkini.
- Boleh memilih 0 tool (array kosong) HANYA bila topik benar-benar tidak butuh data eksternal.
- Maksimal 2 tool. Buat query spesifik dan relevan dengan topik, bukan umum.

${jsonContract(
  `{"tools": [{"name": "search_web_tavily", "query": "...", "max_results": 3}]}`,
  [
    'Setiap item punya "name" bernilai persis "search_bps_data" ATAU "search_web_tavily".',
    'Untuk search_bps_data sertakan "indicator_keyword". Untuk search_web_tavily sertakan "query".',
    'Array "tools" berisi 0 sampai 2 item.',
  ],
)}`,
  },
  {
    role: "user",
    content: `Topik: ${topic}\nKategori: ${category || "(umum)"}`,
  },
];

// ---------------------------------------------------------------------------
// Tahap 2 — penulisan artikel faktual
// ---------------------------------------------------------------------------

const formatSources = (sources: ToolSource[]): string =>
  sources
    .map((s, i) => {
      const tahun = s.tahun_data ? ` (tahun: ${s.tahun_data})` : "";
      return `[${i + 1}] ${s.source_name} — ${s.source_url}\n    ${s.data_summary}${tahun}`;
    })
    .join("\n");

export const buildFactualArticlePrompt = (
  topic: string,
  category: string,
  sources: ToolSource[],
  targetWords = 1100,
): ChatMessage[] => {
  const lower = Math.round(targetWords * 0.85);
  const upper = Math.round(targetWords * 1.15);

  const sourcesBlock =
    sources.length > 0
      ? `SUMBER DATA (hasil pencarian — HANYA ini yang boleh jadi dasar angka & klaim):\n${formatSources(sources)}`
      : `TIDAK ADA sumber data eksternal yang berhasil diambil. Tulis artikel secara KUALITATIF tanpa angka/statistik spesifik, dan tanpa tautan eksternal.`;

  return [
    {
      role: "system",
      content: `${ARTICLE_FOUNDATION}

${HOUSE_STYLE}

${OUTPUT_DISCIPLINE}

${HOMEPAGE_KEYWORD_GUARD}

TUGAS
Tulis artikel properti yang berkualitas tinggi dan berbasis data untuk audiens Indonesia yang mencari informasi properti, KPR, atau investasi rumah.

ATURAN DATA (PRIORITAS TERTINGGI)
- Gunakan HANYA data/angka dari SUMBER DATA di bawah. JANGAN pernah mengarang statistik, persentase, atau klaim angka spesifik yang tidak ada di sumber.
- Bila sebuah klaim tidak didukung sumber, tulis kualitatif (tanpa angka) atau lewati klaim itu sepenuhnya.
- Setiap angka/persentase yang kamu tulis HARUS bisa ditelusuri ke salah satu SUMBER DATA.

${
  sources.length > 0
    ? `${CITATION_CRAFT}

KEWAJIBAN SITASI
- Sisipkan 1 sampai 2 tautan eksternal ke source_url dari SUMBER DATA, secara NATURAL di dalam kalimat.
- Pakai PERSIS source_url dari daftar. Jangan mengarang URL.
- Bila sebuah sumber tidak relevan dengan topik, jangan memaksakannya.`
    : `TAUTAN EKSTERNAL
- JANGAN menyertakan tautan eksternal apa pun (tidak ada sumber yang tersedia).`
}

STRUKTUR & GAYA
- Panjang ${targetWords} kata (rentang ${lower}-${upper}).
- Minimal 2 subheading (<h2>/<h3>) yang membagi konten jadi bagian logis.
- Beri nilai tambah nyata: insight, konteks lokal, implikasi praktis — bukan sekadar merangkum data mentah.
- Boleh mengaitkan topik dengan kawasan yang relevan, tanpa menyebut angka harga/stok/cicilan (topik volatil).

${CTA_CRAFT}

KONTRAK KELUARAN (WAJIB)
- Balas HANYA dengan potongan HTML isi artikel. Tanpa penjelasan, tanpa code fence, tanpa markdown.
- JANGAN memakai <h1>, <html>, <head>, <body>, <script>, <style>, <iframe>, atau atribut style/class.
- Tag yang boleh: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a href="...">, <table>, <thead>, <tbody>, <tr>, <th>, <td>.
- Tautan eksternal memakai URL lengkap (https://...).
- Elemen terakhir keluaranmu HARUS paragraf penutup berisi tautan ke halaman utama, sesuai aturan PARAGRAF PENUTUP di atas.

${sourcesBlock}`,
    },
    {
      role: "user",
      content: `Topik: ${topic}\nKategori: ${category || "(umum)"}\n\nTulis artikelnya sekarang mengikuti seluruh aturan di atas.`,
    },
  ];
};
