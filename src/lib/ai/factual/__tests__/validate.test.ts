import { describe, expect, it } from "vitest";

import { validateArticleQuality } from "@/lib/ai/factual/validate";
import type { ToolSource } from "@/lib/ai/factual/sources";

const source = (url: string, summary = ""): ToolSource => ({
  source_name: "Contoh Sumber",
  source_url: url,
  data_summary: summary,
  retrieved_at: new Date().toISOString(),
  provider: "tavily",
});

// Opsi longgar untuk kata agar test fokus ke aturan lain.
const looseWords = { minWords: 3, maxWords: 100000 };

describe("validateArticleQuality", () => {
  it("lolos: 2 heading, 1 kutipan cocok, tanpa angka liar", () => {
    const html =
      '<h2>Bagian Satu</h2><p>Menurut <a href="https://example.com/data">sumber</a> kondisi pasar membaik.</p>' +
      "<h2>Bagian Dua</h2><p>Pembeli perlu mempertimbangkan lokasi dan akses harian.</p>";
    const res = validateArticleQuality(
      html,
      [source("https://example.com/data")],
      looseWords,
    );
    expect(res.ok).toBe(true);
    expect(res.needsReview).toBe(false);
    expect(res.stats.externalLinks).toBe(1);
  });

  it("menandai kutipan kurang bila ada sumber tapi tidak ada tautan eksternal", () => {
    const html = "<h2>A</h2><p>Isi.</p><h2>B</h2><p>Isi lagi.</p>";
    const res = validateArticleQuality(
      html,
      [source("https://example.com/data")],
      looseWords,
    );
    expect(res.needsReview).toBe(true);
    expect(res.reasons.join(" ")).toMatch(/kutipan sumber kurang/i);
  });

  it("menandai tautan eksternal yang tidak cocok dengan sumber", () => {
    const html =
      '<h2>A</h2><p><a href="https://lain.com/x">tautan</a></p><h2>B</h2><p>Isi.</p>';
    const res = validateArticleQuality(
      html,
      [source("https://example.com/data")],
      looseWords,
    );
    expect(res.needsReview).toBe(true);
    expect(res.reasons.join(" ")).toMatch(/tidak cocok dengan sumber/i);
  });

  it("menandai angka yang tidak ada di sumber (indikasi halusinasi)", () => {
    const html =
      '<h2>A</h2><p>Kenaikan mencapai 45,7% tahun ini menurut <a href="https://example.com/data">sumber</a>.</p><h2>B</h2><p>Isi.</p>';
    const res = validateArticleQuality(
      html,
      [source("https://example.com/data", "Pasar tumbuh stabil tanpa rincian angka.")],
      looseWords,
    );
    expect(res.needsReview).toBe(true);
    expect(res.stats.suspectNumbers.join(" ")).toContain("45,7%");
  });

  it("tidak menandai angka yang memang ada di sumber", () => {
    const html =
      '<h2>A</h2><p>Indeks 45,7% menurut <a href="https://example.com/data">sumber</a>.</p><h2>B</h2><p>Isi.</p>';
    const res = validateArticleQuality(
      html,
      [source("https://example.com/data", "Indeks harga 45,7% pada periode terbaru.")],
      looseWords,
    );
    expect(res.stats.suspectNumbers).toHaveLength(0);
  });

  it("menandai bila tidak ada sumber tapi artikel memuat tautan eksternal", () => {
    const html =
      '<h2>A</h2><p><a href="https://lain.com/x">tautan</a></p><h2>B</h2><p>Isi.</p>';
    const res = validateArticleQuality(html, [], looseWords);
    expect(res.needsReview).toBe(true);
    expect(res.reasons.join(" ")).toMatch(/tidak ada sumber/i);
  });

  it("menandai artikel yang terlalu pendek (default minWords)", () => {
    const html = "<h2>A</h2><p>Pendek.</p><h2>B</h2><p>Sekali.</p>";
    const res = validateArticleQuality(html, []);
    expect(res.needsReview).toBe(true);
    expect(res.reasons.join(" ")).toMatch(/terlalu pendek/i);
  });

  it("menandai kekurangan subheading", () => {
    const html = "<h2>Hanya satu</h2><p>Isi.</p>";
    const res = validateArticleQuality(html, [], looseWords);
    expect(res.reasons.join(" ")).toMatch(/kurang subheading/i);
  });

  it("homepage GDC tidak dihitung sebagai tautan eksternal", () => {
    const html =
      '<h2>A</h2><p>Baca <a href="https://granddutacitysouthofjakarta.com">Grand Duta City Parung</a>.</p><h2>B</h2><p>Isi.</p>';
    // Tanpa sumber → tidak boleh ada tautan eksternal. Homepage harus dikecualikan.
    const res = validateArticleQuality(html, [], looseWords);
    expect(res.stats.externalLinks).toBe(0);
    expect(res.reasons.join(" ")).not.toMatch(/tautan eksternal/i);
  });
});
