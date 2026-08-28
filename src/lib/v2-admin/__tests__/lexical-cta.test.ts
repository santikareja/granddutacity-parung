// Unit test variasi anchor CTA homepage pada ensureCta (Bagian A).
//
// Yang dikunci:
//   - CTA yang ditambahkan memakai salah satu dari CTA_ANCHORS.
//   - Deterministik: input sama -> keluaran sama (penting agar alur simpan &
//     test lain yang membandingkan keluaran tetap stabil).
//   - Idempoten untuk SEMUA varian anchor: state yang sudah punya CTA (anchor
//     varian apa pun) tidak ditambahi CTA kedua.

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

// Ambil node link CTA terakhir untuk memeriksa anchor & url.
const lastLink = (state: unknown): LexNode | null => {
  const root = (state as { root?: { children?: LexNode[] } }).root;
  const blocks = root?.children ?? [];
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const link = (blocks[i].children ?? []).find((c) => c.type === "link");
    if (link) return link;
  }
  return null;
};

const anchorTextOf = (link: LexNode | null): string =>
  (link?.children ?? []).map((c) => c.text ?? "").join("");

describe("ensureCta — variasi anchor homepage", () => {
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
          {
            type: "link",
            fields: { linkType: "custom", newTab: false, url: CTA_URL },
            format: "",
            indent: 0,
            version: 3,
            direction: "ltr",
            children: [text(anchor)],
          },
          text("? Jelajahi sekarang."),
        ]),
      ]);
      const out = ensureCta(withCta);
      expect(out).toEqual(withCta);
    }
  });
});
