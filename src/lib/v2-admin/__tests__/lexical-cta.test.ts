// Unit test CTA homepage pada ensureCta.
//
// PERAN ensureCta BERUBAH 4 September 2026. Sebelumnya ia satu-satunya penulis
// CTA: prompt melarang AI menulis penutup, dan paragraf template identik
// ditempelkan di sini. Sekarang AI menulis CTA-nya sendiri dengan anchor bebas
// yang menyatu ke kalimat, dan ensureCta menjadi JARING PENGAMAN.
//
// Yang dikunci:
//   - CTA cadangan memakai salah satu dari CTA_ANCHORS dan url homepage.
//   - Deterministik: input sama -> keluaran sama.
//   - Idempoten untuk anchor varian apa pun.
//   - CTA TULISAN AI dikenali meski anchor-nya di luar CTA_ANCHORS. Ini
//     regresi paling berbahaya: bila tidak dikenali, artikel mendapat dua
//     paragraf penutup.

import { describe, expect, it } from "vitest";

import {
  CTA_ANCHORS,
  CTA_URL,
  ensureCta,
  type LexNode,
} from "@/lib/v2-admin/lexical";

const paragraph = (children: LexNode[]): LexNode => ({
  type: "paragraph",
  format: "",
  indent: 0,
  version: 1,
  direction: "ltr",
  children,
});

const text = (value: string): LexNode => ({
  type: "text",
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text: value,
  version: 1,
});

/** Tautan bentuk Payload (`fields.url`) — bentuk korpus artikel & renderer. */
const storedLink = (url: string, anchor: string): LexNode => ({
  type: "link",
  fields: { linkType: "custom", newTab: false, url },
  format: "",
  indent: 0,
  version: 3,
  direction: "ltr",
  children: [text(anchor)],
});

/** Tautan bentuk Lexical (`url` level atas) — bentuk setelah disunting editor. */
const editorLink = (url: string, anchor: string): LexNode => ({
  type: "link",
  url,
  target: null,
  rel: null,
  format: "",
  indent: 0,
  version: 3,
  direction: "ltr",
  children: [text(anchor)],
});

const stateWith = (children: LexNode[]): { root: LexNode } => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children,
  },
});

const blocksOf = (state: unknown): LexNode[] =>
  (state as { root?: { children?: LexNode[] } }).root?.children ?? [];

// Ambil node link CTA terakhir untuk memeriksa anchor & url.
const lastLink = (state: unknown): LexNode | null => {
  const blocks = blocksOf(state);
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const link = (blocks[i].children ?? []).find((c) => c.type === "link");
    if (link) return link;
  }
  return null;
};

const anchorTextOf = (link: LexNode | null): string =>
  (link?.children ?? []).map((c) => c.text ?? "").join("");

describe("ensureCta — CTA cadangan bila AI tidak menulis penutup", () => {
  it("menambahkan CTA dengan anchor salah satu dari CTA_ANCHORS dan url homepage", () => {
    const out = ensureCta(stateWith([paragraph([text("Isi artikel tentang hunian.")])]));
    const link = lastLink(out);
    expect(link).not.toBeNull();
    const url = (link as { fields?: { url?: string } }).fields?.url;
    expect(url).toBe(CTA_URL);
    expect(CTA_ANCHORS as readonly string[]).toContain(anchorTextOf(link));
  });

  it("deterministik: input sama menghasilkan anchor yang sama", () => {
    const input = () => stateWith([paragraph([text("Konten identik untuk uji determinisme.")])]);
    const a = anchorTextOf(lastLink(ensureCta(input())));
    const b = anchorTextOf(lastLink(ensureCta(input())));
    expect(a).toBe(b);
  });

  it("idempoten: memanggil ulang tidak menambah CTA kedua", () => {
    const once = ensureCta(stateWith([paragraph([text("Artikel apa pun.")])]));
    const twice = ensureCta(once);
    expect(twice).toEqual(once);
  });

  it("mengenali CTA yang sudah ada untuk SETIAP varian anchor (tidak menduplikasi)", () => {
    for (const anchor of CTA_ANCHORS) {
      const withCta = stateWith([
        paragraph([text("Paragraf isi.")]),
        paragraph([
          text("Tertarik memiliki hunian di "),
          storedLink(CTA_URL, anchor),
          text("? Jelajahi sekarang."),
        ]),
      ]);
      expect(ensureCta(withCta)).toEqual(withCta);
    }
  });
});

describe("ensureCta — mengenali CTA yang DITULIS AI (anchor bebas)", () => {
  // Ini inti perubahan 4 September 2026. Deteksi lama mensyaratkan url homepage
  // DAN anchor dari CTA_ANCHORS; anchor tulisan AI menyatu ke kalimat sehingga
  // tidak pernah cocok, dan ensureCta menambahkan paragraf CTA kedua.
  const AI_ANCHORS = [
    "kawasan seluas 200 hektar ini",
    "situs resminya",
    "profil lengkap kawasan",
    "proyek di koridor Parung ini",
    "daftar unit yang tersedia",
  ];

  it("tidak menambah CTA kedua untuk anchor bebas apa pun", () => {
    for (const anchor of AI_ANCHORS) {
      const withAiCta = stateWith([
        paragraph([text("Pembahasan utama artikel.")]),
        paragraph([
          text("Sebelum memutuskan, bandingkan dulu pilihan unit di "),
          storedLink(CTA_URL, anchor),
          text(" agar hitungan angsuran tadi punya angka nyata."),
        ]),
      ]);
      const out = ensureCta(withAiCta);
      expect(out, `anchor "${anchor}" tidak dikenali sebagai CTA`).toEqual(
        withAiCta,
      );
      expect(blocksOf(out)).toHaveLength(2);
    }
  });

  it("mengenali href relatif '/' — bentuk yang ditulis AI di HTML", () => {
    // AI menulis CTA dalam HTML. Bila ia memakai <a href="/">, konverter
    // menyimpan url sebagai "/" apa adanya, bukan URL absolut.
    const withRelative = stateWith([
      paragraph([text("Isi artikel.")]),
      paragraph([
        text("Periksa ketersediaan unit di "),
        storedLink("/", "kawasan ini"),
        text(" sebelum menjadwalkan survei."),
      ]),
    ]);
    expect(ensureCta(withRelative)).toEqual(withRelative);
  });

  it("mengenali url di level atas (bentuk setelah disunting di editor)", () => {
    const withEditorForm = stateWith([
      paragraph([text("Isi artikel.")]),
      paragraph([
        text("Lihat pilihan unitnya di "),
        editorLink(CTA_URL, "halaman resmi kawasan"),
        text("."),
      ]),
    ]);
    expect(ensureCta(withEditorForm)).toEqual(withEditorForm);
  });

  it("mengenali url homepage dengan garis miring di ujung", () => {
    const withTrailingSlash = stateWith([
      paragraph([text("Isi artikel.")]),
      paragraph([text("Cek "), storedLink(`${CTA_URL}/`, "situs resmi"), text(".")]),
    ]);
    expect(ensureCta(withTrailingSlash)).toEqual(withTrailingSlash);
  });

  it("tetap menambahkan CTA bila tautan homepage hanya ada di TENGAH artikel", () => {
    // Tautan di tengah tidak menggantikan peran penutup, jadi pengaman tetap
    // bekerja. Ini yang membuat backlink homepage tidak pernah hilang.
    const linkInMiddle = stateWith([
      paragraph([
        text("Kawasan yang dibahas ada di "),
        storedLink(CTA_URL, "GDC Parung"),
        text(" dan sekitarnya."),
      ]),
      paragraph([text("Bagian penutup tanpa tautan sama sekali.")]),
    ]);
    const out = ensureCta(linkInMiddle);
    expect(blocksOf(out)).toHaveLength(3);
    expect((lastLink(out) as { fields?: { url?: string } }).fields?.url).toBe(
      CTA_URL,
    );
  });

  it("tidak menganggap tautan sumber eksternal sebagai CTA", () => {
    const withExternalOnly = stateWith([
      paragraph([text("Isi artikel.")]),
      paragraph([
        text("Data "),
        storedLink("https://www.bps.go.id/", "Badan Pusat Statistik"),
        text(" menunjukkan tren tersebut."),
      ]),
    ]);
    const out = ensureCta(withExternalOnly);
    // CTA cadangan harus ditambahkan: tidak ada tautan homepage di penutup.
    expect(blocksOf(out)).toHaveLength(3);
  });

  it("mengabaikan blok kosong di akhir saat mencari penutup", () => {
    const withTrailingEmpty = stateWith([
      paragraph([text("Isi artikel.")]),
      paragraph([
        text("Bandingkan pilihannya di "),
        storedLink(CTA_URL, "kawasan ini"),
        text("."),
      ]),
      paragraph([]),
    ]);
    expect(ensureCta(withTrailingEmpty)).toEqual(withTrailingEmpty);
  });
});
