// Unit test builder prompt: kualitas, kebijakan tautan, dan tekanan brand.
//
// Semua ini murni fungsi pembentuk string, jadi diuji langsung tanpa mock.
//
// KENAPA ADA BAGIAN "TEKANAN BRAND"
// Sebelum 4 September 2026, seluruh lembar fakta brand menempel di dalam blok
// anti-halusinasi, dan blok itu disuntikkan ke SEMUA prompt. Pengukuran
// menunjukkan prompt JUDUL dan OUTLINE masing-masing menerima 15 sebutan brand
// ("Parung" 5x, "Grand Duta City Parung" 2x, "Cluster Ladera/Cascada" 2x, dst)
// padahal tidak satu pun relevan untuk menyusun judul. Model kecil membaca
// pengulangan itu sebagai instruksi implisit lalu menyelipkan nama proyek ke
// judul apa pun. Guard di bawah menjaga pemisahan blok tidak diam-diam
// dikembalikan.

import { describe, expect, it } from "vitest";

import {
  buildArticlePrompt,
  buildEditorPrompt,
  buildImageMetaPrompt,
  buildOutlinePrompt,
  buildSeoPrompt,
  buildTextToolPrompt,
  buildTitlesPrompt,
  TITLE_MAX_CHARS,
  TITLE_MIN_CHARS,
} from "@/lib/ai/prompts";
import {
  AI_PERSONA,
  BRAND_ALT_NAME,
  BRAND_NAME,
  BRAND_SHORT_NAME,
  FACT_DISCIPLINE,
  HOUSE_STYLE,
} from "@/lib/ai/brand-facts";
import type { ToolSource } from "@/lib/ai/factual/sources";

const systemOf = (messages: { role: string; content: string }[]): string =>
  messages.find((m) => m.role === "system")?.content ?? "";

const userOf = (messages: { role: string; content: string }[]): string =>
  messages.find((m) => m.role === "user")?.content ?? "";

const outline = [{ heading: "Bagian 1", subheadings: ["Sub"] }];

const source = (url: string, name = "Badan Pusat Statistik"): ToolSource => ({
  source_name: name,
  source_url: url,
  data_summary: "Ringkasan data uji.",
  tahun_data: "2026",
  retrieved_at: new Date().toISOString(),
  provider: "bps",
});

/** Istilah brand yang menandakan lembar fakta proyek ikut tersuntik. */
const BRAND_TERMS = [
  BRAND_NAME,
  BRAND_ALT_NAME,
  "Cluster Ladera",
  "Cluster Cascada",
  "Duta Putra Land",
  "The Beach Lagoon",
  "200 hektar",
];

const brandHits = (text: string): string[] =>
  BRAND_TERMS.filter((term) => text.toLowerCase().includes(term.toLowerCase()));

describe("pemisahan blok — prompt netral tidak menerima lembar fakta brand", () => {
  it("blok bersama yang universal bebas dari nama brand", () => {
    // FACT_DISCIPLINE, AI_PERSONA, dan HOUSE_STYLE dipakai SEMUA prompt. Bila
    // salah satunya memuat nama brand, seluruh prompt kembali kebanjiran brand
    // dan masalah aslinya terulang.
    for (const [label, block] of [
      ["FACT_DISCIPLINE", FACT_DISCIPLINE],
      ["AI_PERSONA", AI_PERSONA],
      ["HOUSE_STYLE", HOUSE_STYLE],
    ] as const) {
      expect(
        brandHits(block),
        `${label} memuat nama brand; blok universal harus netral.`,
      ).toEqual([]);
    }
  });

  it("prompt JUDUL tidak menerima lembar fakta proyek", () => {
    const sys = systemOf(buildTitlesPrompt("cara memilih rumah keluarga muda"));
    // Frasa target boleh muncul sebagai LARANGAN (HOMEPAGE_KEYWORD_GUARD), jadi
    // yang diuji adalah fakta proyek: cluster, developer, fasilitas, skala.
    expect(brandHits(sys).filter((t) => t !== BRAND_NAME && t !== BRAND_ALT_NAME)).toEqual([]);
  });

  it("prompt OUTLINE tidak menerima lembar fakta proyek", () => {
    const sys = systemOf(buildOutlinePrompt("Cara Memilih Rumah Keluarga Muda"));
    expect(brandHits(sys).filter((t) => t !== BRAND_NAME && t !== BRAND_ALT_NAME)).toEqual([]);
  });

  it("prompt ALAT TEKS dan META GAMBAR tidak menerima lembar fakta proyek", () => {
    for (const sys of [
      systemOf(buildTextToolPrompt("rewrite", "teks apa pun")),
      systemOf(buildImageMetaPrompt("konteks", "deskripsi")),
    ]) {
      expect(brandHits(sys)).toEqual([]);
    }
  });

  it("prompt ARTIKEL tetap menerima lembar fakta proyek", () => {
    // Di sini fakta proyek memang dibutuhkan: artikel boleh membahas proyeknya.
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toContain("Cluster Ladera");
    expect(sys).toContain("Duta Putra Land");
    expect(sys).toContain("LEMBAR FAKTA PROYEK");
  });
});

describe("penjaga kata kunci halaman utama", () => {
  it("judul, outline, artikel, editor, dan SEO semuanya diberi batas frasa homepage", () => {
    for (const [label, sys] of [
      ["judul", systemOf(buildTitlesPrompt("topik"))],
      ["outline", systemOf(buildOutlinePrompt("Judul"))],
      ["artikel", systemOf(buildArticlePrompt("Judul", outline, 1000))],
      ["editor", systemOf(buildEditorPrompt("Judul", "<p>draft</p>"))],
      ["seo", systemOf(buildSeoPrompt("Judul", "ringkasan"))],
    ] as const) {
      expect(sys, `${label} kehilangan penjaga kata kunci homepage`).toContain(
        "KATA KUNCI MILIK HALAMAN UTAMA",
      );
      expect(sys).toContain(BRAND_SHORT_NAME);
    }
  });

  it("prompt SEO hanya mengizinkan nama merek versi pendek di metaTitle", () => {
    const sys = systemOf(buildSeoPrompt("Judul", "ringkasan"));
    expect(sys).toContain(`" | ${BRAND_SHORT_NAME}"`);
    // Nama panjang tidak boleh ditawarkan sebagai sufiks metaTitle.
    expect(sys).not.toContain(`" | ${BRAND_NAME}"`);
  });
});

describe("buildTitlesPrompt — batas panjang & variasi format", () => {
  it("menyatakan batas karakter sebagai batas keras", () => {
    const sys = systemOf(buildTitlesPrompt("hunian di parung", 5));
    expect(sys).toContain(`${TITLE_MIN_CHARS}-${TITLE_MAX_CHARS} karakter`);
    expect(sys).toMatch(/BATAS KERAS/);
    expect(sys).toMatch(/HITUNG karakternya/i);
  });

  it("mewajibkan empat format berbeda", () => {
    const sys = systemOf(buildTitlesPrompt("topik", 5));
    for (const format of ["LISTICLE", "HOW-TO", "PANDUAN", "PERTANYAAN"]) {
      expect(sys, `format ${format} tidak diwajibkan`).toContain(format);
    }
  });

  it("menyertakan kriteria kelayakan Google Discover", () => {
    const sys = systemOf(buildTitlesPrompt("hunian di parung", 5));
    expect(sys).toContain("GOOGLE DISCOVER");
  });

  it("melarang menempelkan nama merek di belakang judul", () => {
    const sys = systemOf(buildTitlesPrompt("topik", 5));
    expect(sys).toMatch(/Tanpa nama merek di belakang judul/i);
  });
});

describe("buildOutlinePrompt — terikat judul & wajib bagian berbasis data", () => {
  it("mewajibkan outline menjadi turunan judul", () => {
    const sys = systemOf(buildOutlinePrompt("Judul Pilihan"));
    expect(sys).toContain("KETERIKATAN PADA JUDUL");
  });

  it("mewajibkan satu bagian yang menuntut data terverifikasi", () => {
    const sys = systemOf(buildOutlinePrompt("Judul"));
    expect(sys).toContain("WAJIB ADA SATU BAGIAN BERBASIS DATA");
  });

  it("melarang nama proyek di heading", () => {
    const sys = systemOf(buildOutlinePrompt("Judul"));
    expect(sys).toMatch(/Jangan menaruh nama proyek di heading/i);
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

describe("buildArticlePrompt — kebijakan tautan", () => {
  it("melarang tautan antar artikel dan halaman internal lain", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toMatch(/JANGAN menautkan artikel lain/i);
    expect(sys).toMatch(/JANGAN menautkan halaman internal lain/i);
  });

  it("mewajibkan paragraf penutup dengan tepat satu tautan ke halaman utama", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toContain("PARAGRAF PENUTUP");
    expect(sys).toContain("https://granddutacitysouthofjakarta.com");
    expect(sys).toMatch(/Tepat satu tautan ke halaman utama/i);
  });

  it("melarang CTA bergaya template lama", () => {
    // Kalimat template inilah yang sedang ditinggalkan; model tidak boleh
    // mereproduksinya.
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toContain("Tertarik memiliki hunian di");
    expect(sys).toMatch(/DILARANG:[\s\S]*Tertarik memiliki hunian di/);
  });

  it("tidak lagi menerima daftar artikel terkait sebagai argumen", () => {
    // Tanda tangan fungsi berubah: parameter relatedArticles dihapus, argumen
    // keempat sekarang sources. Bila suatu saat dikembalikan, test ini gagal.
    expect(buildArticlePrompt.length).toBeLessThanOrEqual(5);
  });
});

describe("buildArticlePrompt — sitasi sumber & grounding", () => {
  it("tanpa sumber: melarang tautan eksternal & angka statistik", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000, []));
    expect(sys).toContain("TIDAK ADA data hasil riset");
    expect(sys).toMatch(/TANPA tautan eksternal/i);
  });

  it("dengan sumber: URL dicantumkan dan sitasi diwajibkan", () => {
    const sys = systemOf(
      buildArticlePrompt("Judul", outline, 1000, [source("https://www.bps.go.id/")]),
    );
    expect(sys).toContain("https://www.bps.go.id/");
    expect(sys).toContain("DATA HASIL RISET SISTEM");
    expect(sys).toContain("KEWAJIBAN SITASI");
    expect(sys).toMatch(/WAJIB mengutip minimal 1 dan maksimal 2 sumber/i);
  });

  it("menyertakan panduan cara mengutip agar tautan menyatu dalam kalimat", () => {
    const sys = systemOf(
      buildArticlePrompt("Judul", outline, 1000, [source("https://www.bps.go.id/")]),
    );
    expect(sys).toContain("CARA MEMAKAI DATA DAN MENGUTIP SUMBER");
    expect(sys).toMatch(/daftar "Referensi"/i);
  });

  it("melarang memaksakan sumber yang tidak relevan", () => {
    const sys = systemOf(
      buildArticlePrompt("Judul", outline, 1000, [source("https://www.bps.go.id/")]),
    );
    expect(sys).toMatch(/tidak relevan dengan topik artikel, JANGAN memaksakannya/i);
  });

  it("melarang menautkan pengembang/marketplace properti lain", () => {
    const sys = systemOf(
      buildArticlePrompt("Judul", outline, 1000, [source("https://www.bps.go.id/")]),
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
      "brief unik penulis 4242",
    );
    expect(userOf(msgs)).toContain("brief unik penulis 4242");
  });
});

describe("buildArticlePrompt — batasan penyebutan proyek", () => {
  it("menyatakan batas jumlah penyebutan dan melarang transisi paksa", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toMatch(/maksimal 2-3 kali/i);
    expect(sys).toMatch(/TULISAN JURNALISTIK PROPERTI, bukan brosur/i);
    expect(sys).toMatch(/Jangan pernah memaksakan transisi menuju proyek/i);
  });
});

describe("disiplin keluaran — larangan yang punya pemeriksa otomatis", () => {
  // Setiap larangan di blok ini diverifikasi `src/lib/ai/output-quality.ts`.
  // Memberitahu model bahwa keluarannya akan diperiksa lebih efektif daripada
  // larangan tanpa konsekuensi.
  it("prompt artikel dan editor menerima disiplin keluaran", () => {
    for (const [label, sys] of [
      ["artikel", systemOf(buildArticlePrompt("Judul", outline, 1000))],
      ["editor", systemOf(buildEditorPrompt("Judul", "<p>draft</p>"))],
    ] as const) {
      expect(sys, `${label} kehilangan DISIPLIN KELUARAN`).toContain(
        "DISIPLIN KELUARAN",
      );
      expect(sys).toMatch(/diverifikasi otomatis/i);
    }
  });

  it("melarang aksara non-Latin secara eksplisit", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toMatch(/aksara non-Latin/i);
    expect(sys).toMatch(/Tionghoa/);
  });

  it("melarang code fence dan campuran markdown", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toMatch(/code fence/i);
    expect(sys).toMatch(/JANGAN mencampur markdown/i);
  });

  it("melarang placeholder dan kalimat meta model", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toMatch(/Placeholder dalam bentuk apa pun/i);
    expect(sys).toMatch(/Sebagai model bahasa/i);
  });

  it("memerintahkan menulis ulang, bukan menyalin ringkasan sumber", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toContain("MENULIS ULANG, BUKAN MENYALIN");
    expect(sys).toMatch(/rangkaian delapan kata/i);
  });

  it("mewajibkan tag ditutup dan tabel seragam", () => {
    const sys = systemOf(buildArticlePrompt("Judul", outline, 1000));
    expect(sys).toMatch(/Setiap tag yang dibuka WAJIB ditutup/i);
    expect(sys).toMatch(/jumlah sel yang sama/i);
  });
});

describe("buildEditorPrompt — layer editor kedua", () => {
  it("berperan sebagai editor dan mempertahankan href persis", () => {
    const sys = systemOf(buildEditorPrompt("Judul", "<p>draft</p>"));
    expect(sys).toContain("EDITOR");
    expect(sys).toMatch(/JANGAN mengubah, menambah, atau menghapus tautan/i);
    expect(sys).toMatch(/href/i);
  });

  it("mewajibkan tautan CTA ke halaman utama dipertahankan", () => {
    // Instruksi lama menyuruh editor JANGAN menambah tautan homepage karena
    // sistem yang menanganinya. Sekarang penulis yang membuatnya, jadi editor
    // harus menjaganya — bukan membersihkannya.
    const sys = systemOf(buildEditorPrompt("Judul", "<p>draft</p>"));
    expect(sys).toMatch(/tautan itu WAJIB tetap ada/i);
    expect(sys).not.toMatch(/sistem menambahkannya otomatis/i);
  });

  it("meminta editor memeriksa penyebutan proyek yang berlebihan", () => {
    const sys = systemOf(buildEditorPrompt("Judul", "<p>draft</p>"));
    expect(sys).toMatch(/Periksa penyebutan proyek/i);
  });

  it("menyertakan draft yang harus dirapikan di pesan user", () => {
    const msgs = buildEditorPrompt("Judul", "<p>isi draft unik 12345</p>");
    expect(userOf(msgs)).toContain("isi draft unik 12345");
  });
});
