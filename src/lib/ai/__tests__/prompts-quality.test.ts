// Unit test builder prompt untuk kualitas & kebijakan tautan (Bagian A).
//
// Semua ini murni fungsi pembentuk string, jadi diuji langsung tanpa mock.

import { describe, expect, it } from "vitest";

import {
  buildArticlePrompt,
  buildEditorPrompt,
  buildTitlesPrompt,
  type RelatedArticle,
} from "@/lib/ai/prompts";

const systemOf = (messages: { role: string; content: string }[]): string =>
  messages.find((m) => m.role === "system")?.content ?? "";

const userOf = (messages: { role: string; content: string }[]): string =>
  messages.find((m) => m.role === "user")?.content ?? "";

describe("buildArticlePrompt — kebijakan tautan internal", () => {
  const outline = [{ heading: "Bagian 1", subheadings: ["Sub"] }];

  it("membatasi maksimal 1 tautan internal dan bukan 3", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000, []));
    expect(sys).toContain("MAKSIMAL 1 tautan internal");
    expect(sys).not.toContain("MAKSIMAL 3 tautan");
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
    expect(sys).toContain("TIDAK ADA artikel relevan");
    expect(sys).toMatch(/TANPA tautan internal/i);
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
