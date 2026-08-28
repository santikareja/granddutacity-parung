// Unit test builder prompt untuk kualitas & kebijakan tautan (Bagian A).
//
// Semua ini murni fungsi pembentuk string, jadi diuji langsung tanpa mock.

import { describe, expect, it } from "vitest";

import {
  buildArticlePrompt,
  buildEditorPrompt,
  buildOutlinePrompt,
  buildTitlesPrompt,
  type RelatedArticle,
} from "@/lib/ai/prompts";
import type { ToolSource } from "@/lib/ai/factual/sources";

const systemOf = (messages: { role: string; content: string }[]): string =>
  messages.find((m) => m.role === "system")?.content ?? "";

const userOf = (messages: { role: string; content: string }[]): string =>
  messages.find((m) => m.role === "user")?.content ?? "";

describe("buildArticlePrompt — kebijakan tautan internal", () => {
  const outline = [{ heading: "Bagian 1", subheadings: ["Sub"] }];

  it("membatasi total 3 tautan internal, maksimal 2 ditulis model", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000, []));
    // Kuota: 1 CTA homepage dari sistem + maksimal 2 dari model = 3.
    expect(sys).toContain("total maksimal 3 di seluruh artikel, minimal 1");
    expect(sys).toContain("MAKSIMAL 2 tautan internal");
  });

  it("melarang menautkan homepage sendiri (ditangani sistem)", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000, []));
    expect(sys).toMatch(/JANGAN menulis tautan ke homepage/i);
  });

  it("saat ada kandidat artikel, path-nya dicantumkan agar tidak mengarang slug", () => {
    const related: RelatedArticle[] = [
      { title: "Tips KPR Rumah Pertama", path: "/tips-kpr-rumah-pertama" },
      { title: "Panduan Survei Lokasi", path: "/panduan-survei-lokasi" },
    ];
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000, related));
    expect(sys).toContain("/tips-kpr-rumah-pertama");
    expect(sys).toContain("/panduan-survei-lokasi");
    expect(sys).toContain("DAFTAR ARTIKEL YANG BOLEH DITAUTKAN");
  });

  it("saat tidak ada kandidat, memerintahkan menulis tanpa tautan internal", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000, []));
    expect(sys).toContain("TIDAK ADA artikel internal");
    expect(sys).toMatch(/TANPA tautan internal/i);
  });
});

describe("buildArticlePrompt — kebijakan tautan eksternal & grounding", () => {
  const outline = [{ heading: "Bagian 1", subheadings: ["Sub"] }];

  const source = (url: string, name = "Badan Pusat Statistik"): ToolSource => ({
    source_name: name,
    source_url: url,
    data_summary: "Ringkasan data uji.",
    tahun_data: "2026",
    retrieved_at: new Date().toISOString(),
    provider: "bps",
  });

  it("tanpa sumber: melarang tautan eksternal & angka statistik", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000, []));
    expect(sys).toContain("TIDAK ADA data eksternal");
    expect(sys).toMatch(/TANPA tautan eksternal/i);
  });

  it("dengan sumber: URL dicantumkan dan dibatasi maksimal 2 tautan", () => {
    const sys = systemOf(
      buildArticlePrompt("Judul", outline, 1000, [], [
        source("https://www.bps.go.id/"),
      ]),
    );
    expect(sys).toContain("https://www.bps.go.id/");
    expect(sys).toContain("DATA FAKTUAL YANG TERSEDIA");
    expect(sys).toContain("maksimal 2, dan HANYA ke source_url");
  });

  it("melarang menautkan pengembang/marketplace properti lain", () => {
    const sys = systemOf(
      buildArticlePrompt("Judul", outline, 1000, [], [
        source("https://www.bps.go.id/"),
      ]),
    );
    expect(sys).toMatch(/situs pengembang properti lain/i);
    expect(sys).toMatch(/portal jual-beli properti/i);
  });

  it("judul & outline diikat di pesan user agar artikel tidak melenceng", () => {
    const msgs = buildArticlePrompt(
      "Judul Yang Mengikat",
      [{ heading: "Bagian Unik 987", subheadings: [] }],
      1000,
    );
    const user = userOf(msgs);
    expect(user).toContain("Judul Yang Mengikat");
    expect(user).toContain("Bagian Unik 987");
    expect(user).toMatch(/menuntaskan janji judul/i);
  });

  it("topik penulis ikut disertakan sebagai konteks bila ada", () => {
    const msgs = buildArticlePrompt(
      "Judul",
      outline,
      1000,
      [],
      [],
      "brief unik penulis 4242",
    );
    expect(userOf(msgs)).toContain("brief unik penulis 4242");
  });
});

describe("buildOutlinePrompt — terikat pada judul", () => {
  it("mewajibkan outline menjadi turunan judul", () => {
    const sys = systemOf(buildOutlinePrompt("Judul Pilihan"));
    expect(sys).toContain("KETERIKATAN PADA JUDUL");
  });

  it("menyertakan topik asli sebagai konteks bila diberikan", () => {
    const msgs = buildOutlinePrompt("Judul", "topik asli unik 5150");
    expect(userOf(msgs)).toContain("topik asli unik 5150");
  });

  it("tanpa topik, pesan user hanya memuat judul", () => {
    const msgs = buildOutlinePrompt("Judul Saja");
    expect(userOf(msgs)).toBe("Judul artikel: Judul Saja");
  });
});

describe("buildEditorPrompt — layer editor kedua", () => {
  it("berperan sebagai editor dan mempertahankan tautan persis", () => {
    const msgs = buildEditorPrompt("Judul", "<p>draft</p>");
    const sys = systemOf(msgs);
    expect(sys).toContain("EDITOR");
    expect(sys).toMatch(/JANGAN mengubah, menambah, atau menghapus tautan/i);
    expect(sys).toMatch(/href/i);
  });

  it("menyertakan draft yang harus dirapikan di pesan user", () => {
    const msgs = buildEditorPrompt("Judul", "<p>isi draft unik 12345</p>");
    expect(userOf(msgs)).toContain("isi draft unik 12345");
  });
});

describe("buildTitlesPrompt — kualitas Google Discover", () => {
  it("menyertakan kriteria kelayakan Google Discover", () => {
    const sys = systemOf(buildTitlesPrompt("hunian di parung", 5));
    expect(sys).toContain("GOOGLE DISCOVER");
  });
});
