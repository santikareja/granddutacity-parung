/**
 * Guard untuk `scripts/seo-fix-cannibal-content.cjs`.
 *
 * Script itu menulis kolom `artikel.content` di produksi, jadi transformasinya
 * harus terbukti benar SEBELUM dijalankan dengan `--apply`. Tiga aturan yang
 * paling mudah salah dan paling merugikan bila salah:
 *
 *   1. Anchor text tautan TIDAK BOLEH ikut diubah. CTA ke homepage
 *      ("Tertarik memiliki hunian di <a>Grand Duta City Parung</a>?") adalah
 *      sinyal yang MENDUKUNG homepage; mengubahnya justru memperburuk masalah
 *      yang sedang diperbaiki.
 *   2. Kemunculan PERTAMA di prosa dipertahankan, sisanya diganti. Artikel tetap
 *      wajar dibaca dan tetap menyebut nama proyek sekali.
 *   3. Heading selalu diganti, tanpa jatah kemunculan pertama.
 *
 * Ditambah idempotensi: menjalankan ulang tidak boleh mengubah apa pun lagi.
 */

import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- script target adalah CommonJS (.cjs), sesuai konvensi scripts/ di repo ini
const script = require("../../../scripts/seo-fix-cannibal-content.cjs") as {
  applyReplacements: (value: string) => string;
  countReserved: (value: string) => number;
  rewriteContent: (content: unknown) => {
    content: unknown;
    changes: Array<{ scope: string; before: string; after: string }>;
    straddled: string[];
  };
  rewriteHeadingsOnly: (content: unknown) => unknown;
};

type Node = Record<string, unknown>;

const text = (value: string): Node => ({
  type: "text",
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text: value,
  version: 1,
});

const paragraph = (children: Node[]): Node => ({
  type: "paragraph",
  format: "",
  indent: 0,
  version: 1,
  direction: "ltr",
  children,
});

const heading = (tag: string, children: Node[]): Node => ({
  type: "heading",
  tag,
  format: "",
  indent: 0,
  version: 1,
  direction: "ltr",
  children,
});

const link = (url: string, children: Node[]): Node => ({
  type: "link",
  fields: { linkType: "custom", newTab: false, url },
  format: "",
  indent: 0,
  version: 3,
  direction: "ltr",
  children,
});

const state = (children: Node[]) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children,
  },
});

const allText = (node: unknown): string => {
  if (!node || typeof node !== "object") return "";
  const record = node as Node;
  const own = typeof record.text === "string" ? record.text : "";
  const kids = Array.isArray(record.children)
    ? (record.children as unknown[]).map(allText).join("")
    : "";
  return own + kids;
};

describe("applyReplacements", () => {
  it("mengganti frasa terpanjang lebih dulu sehingga tidak menghasilkan bentuk campuran", () => {
    // Bila "Grand Duta City Parung" diproses lebih dulu, hasilnya jadi
    // "GDC Parung South of Jakarta" — bentuk yang tidak ada di daftar mana pun.
    expect(
      script.applyReplacements("Kawasan Grand Duta City Parung South of Jakarta hadir"),
    ).toBe("Kawasan GDC Parung South of Jakarta hadir");
  });

  it("mengganti kedua frasa target milik homepage", () => {
    expect(script.applyReplacements("Grand Duta City Parung")).toBe("GDC Parung");
    expect(script.applyReplacements("Grand Duta City South of Jakarta")).toBe(
      "GDC South of Jakarta",
    );
  });

  it("membiarkan 'Grand Duta City' tanpa kualifikasi wilayah", () => {
    // Frasa ini bukan target yang diperebutkan homepage; mengubahnya adalah
    // koreksi berlebih yang memperbanyak diff tanpa manfaat SEO.
    expect(script.applyReplacements("Fasilitas Kawasan Grand Duta City")).toBe(
      "Fasilitas Kawasan Grand Duta City",
    );
  });
});

describe("rewriteContent — anchor text tautan", () => {
  it("tidak pernah mengubah teks di dalam node link", () => {
    const input = state([
      paragraph([
        text("Tertarik memiliki hunian di "),
        link("https://granddutacitysouthofjakarta.com", [
          text("Grand Duta City Parung"),
        ]),
        text("? Jelajahi pilihan cluster sekarang."),
      ]),
    ]);

    const result = script.rewriteContent(input);

    expect(result.changes).toEqual([]);
    expect(allText((result.content as { root: Node }).root)).toContain(
      "Grand Duta City Parung",
    );
  });

  it("tidak menghitung blok berisi tautan sebagai kasus perlu tinjauan manual", () => {
    const input = state([
      paragraph([
        text("Kunjungi "),
        link("https://granddutacitysouthofjakarta.com", [
          text("Grand Duta City "),
          text("Parung"),
        ]),
        text(" hari ini."),
      ]),
    ]);

    expect(script.rewriteContent(input).straddled).toEqual([]);
  });
});

describe("rewriteContent — prosa", () => {
  it("mempertahankan kemunculan pertama dan mengganti sisanya", () => {
    const input = state([
      paragraph([text("Grand Duta City Parung adalah kota mandiri 200 hektar.")]),
      paragraph([text("Harga unit Grand Duta City Parung dimulai 600 juta-an.")]),
      paragraph([text("Fasilitas Grand Duta City Parung meliputi The Beach.")]),
    ]);

    const result = script.rewriteContent(input);
    const children = (result.content as { root: { children: Node[] } }).root.children;

    expect(children[0].children).toEqual([
      text("Grand Duta City Parung adalah kota mandiri 200 hektar."),
    ]);
    expect(allText(children[1])).toBe(
      "Harga unit GDC Parung dimulai 600 juta-an.",
    );
    expect(allText(children[2])).toBe("Fasilitas GDC Parung meliputi The Beach.");
    expect(result.changes.map((change) => change.scope)).toEqual(["prosa", "prosa"]);
  });

  it("jatah kemunculan pertama berlaku per artikel, bukan per frasa", () => {
    const input = state([
      paragraph([text("Grand Duta City Parung dikembangkan Duta Putra Land.")]),
      paragraph([text("Grand Duta City South of Jakarta punya dua cluster.")]),
    ]);

    const children = (
      script.rewriteContent(input).content as { root: { children: Node[] } }
    ).root.children;

    expect(allText(children[0])).toContain("Grand Duta City Parung");
    expect(allText(children[1])).toBe("GDC South of Jakarta punya dua cluster.");
  });
});

describe("rewriteContent — heading", () => {
  it("mengganti frasa di heading tanpa memakai jatah kemunculan pertama", () => {
    const input = state([
      heading("h2", [text("Mengenal Grand Duta City South of Jakarta")]),
      paragraph([text("Kawasan Grand Duta City Parung berada di Parung, Bogor.")]),
    ]);

    const result = script.rewriteContent(input);
    const children = (result.content as { root: { children: Node[] } }).root.children;

    expect(allText(children[0])).toBe("Mengenal GDC South of Jakarta");
    // Paragraf tetap utuh: jatah prosa belum terpakai oleh heading di atasnya.
    expect(allText(children[1])).toContain("Grand Duta City Parung");
    expect(result.changes[0].scope).toBe("heading");
  });

  it("heading bersarang di dalam tautan tetap tidak disentuh", () => {
    const input = state([
      heading("h2", [
        link("/cluster-cascada", [text("Cluster Grand Duta City Parung")]),
      ]),
    ]);

    expect(script.rewriteContent(input).changes).toEqual([]);
  });
});

describe("rewriteContent — idempotensi", () => {
  it("pemanggilan kedua tidak menghasilkan perubahan tambahan", () => {
    const input = state([
      heading("h2", [text("17. Grand Duta City South of Jakarta")]),
      paragraph([text("Grand Duta City Parung menawarkan dua cluster.")]),
      paragraph([text("Cluster Grand Duta City Parung terluas 200 hektar.")]),
    ]);

    const once = script.rewriteContent(input);
    const twice = script.rewriteContent(once.content);

    expect(twice.changes).toEqual([]);
    expect(twice.content).toEqual(once.content);
  });
});

describe("rewriteHeadingsOnly", () => {
  it("hanya menyentuh heading dan membiarkan seluruh prosa apa adanya", () => {
    const input = state([
      heading("h2", [text("Mengenal Grand Duta City South of Jakarta")]),
      paragraph([text("Grand Duta City Parung disebut berulang di sini.")]),
      paragraph([text("Grand Duta City Parung lagi, dan tetap dibiarkan.")]),
    ]);

    const children = (
      script.rewriteHeadingsOnly(input) as { root: { children: Node[] } }
    ).root.children;

    expect(allText(children[0])).toBe("Mengenal GDC South of Jakarta");
    expect(allText(children[1])).toContain("Grand Duta City Parung");
    expect(allText(children[2])).toContain("Grand Duta City Parung");
  });
});

describe("countReserved", () => {
  it("menghitung kedua frasa target tanpa peduli huruf besar/kecil", () => {
    expect(
      script.countReserved(
        "GRAND DUTA CITY PARUNG dan grand duta city south of jakarta",
      ),
    ).toBe(2);
  });

  it("nol untuk teks tanpa frasa target", () => {
    expect(script.countReserved("GDC Parung dan GDC South of Jakarta")).toBe(0);
  });
});
