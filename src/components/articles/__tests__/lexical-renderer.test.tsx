// Gerbang kontrak SEO untuk renderer artikel publik (Task 12B-1, Fase 2).
//
// Setiap file di `__fixtures__/golden/*.html` DIREKAM dari renderer Payload
// (`RichText` + `defaultConverters` dari @payloadcms/richtext-lexical/react)
// ketika Payload masih terpasang. Test ini merender fixture yang sama memakai
// serializer in-house (`LexicalRenderer` via `ArticleRichContent`) dan menuntut
// HTML-nya SAMA PERSIS.
//
// Test ini TIDAK mengimpor apa pun dari Payload — hanya membaca golden .html.
// Bila ada yang gagal: JANGAN me-regenerate golden. Perbaiki serializer-nya,
// karena golden adalah baseline HTML artikel yang sudah terindeks.
//
// ─── SATU PENYIMPANGAN YANG DISENGAJA DARI ATURAN DI ATAS ───────────────────
// `golden/heading.html` DIPERBARUI dengan sadar: `<h1>Judul H1</h1>` menjadi
// `<h2>Judul H1</h2>`.
//
// Alasannya bukan kosmetik. Audit produksi menemukan dua halaman artikel
// (`/rumah-di-kawasan-strategis` dan `/listing-properti-panduan-lengkap`)
// mengirim DUA `<h1>` ke Google: satu dari template halaman (judul artikel) dan
// satu lagi dari isi artikel yang ditulis editor. Di halaman kedua, keduanya
// berbunyi persis sama. `ArticleRichContent` kini menurunkan setiap `<h1>` di
// isi artikel menjadi `<h2>` (lihat `BodyHeadingConverter` beserta alasannya).
//
// Jadi golden di-update HANYA untuk mencatat perubahan yang memang diinginkan,
// bukan untuk menutupi regresi serializer. Serializer-nya sendiri
// (`lexical-renderer.tsx`) TIDAK diubah dan tetap port 1:1 Payload — penurunan
// heading adalah kebijakan lapisan pemakai. Aturan "jangan regenerate" tetap
// berlaku penuh untuk 19 fixture lainnya.
// ───────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArticleRichContent } from "../article-rich-content";
import { LEXICAL_FIXTURES } from "../__fixtures__/fixtures";

const GOLDEN_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "golden");

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Checkbox list Payload memakai `uuid()` acak untuk memasangkan
 * `<input id>` dengan `<label for>`, jadi output Payload SENDIRI tidak
 * deterministik antar-render. Untuk fixture itu (dan HANYA itu) uuid
 * dinormalisasi di kedua sisi sebelum dibandingkan; sisa markup tetap
 * dibandingkan karakter demi karakter.
 */
const normalize = (html: string, nonDeterministicIds: boolean) =>
  nonDeterministicIds ? html.replace(UUID_PATTERN, "__UUID__") : html;

describe("LexicalRenderer vs golden Payload output", () => {
  it("mencakup semua golden file yang direkam", () => {
    expect(LEXICAL_FIXTURES.length).toBeGreaterThan(0);
    expect(new Set(LEXICAL_FIXTURES.map((fixture) => fixture.name)).size).toBe(
      LEXICAL_FIXTURES.length,
    );
  });

  for (const fixture of LEXICAL_FIXTURES) {
    it(`identik dengan golden: ${fixture.name} (${fixture.covers.join(", ")})`, () => {
      const golden = readFileSync(join(GOLDEN_DIR, `${fixture.name}.html`), "utf8");
      const actual = renderToStaticMarkup(
        <ArticleRichContent data={fixture.data} readAlsoItems={fixture.readAlsoItems} />,
      );

      expect(normalize(actual, fixture.nonDeterministicIds === true)).toBe(
        normalize(golden, fixture.nonDeterministicIds === true),
      );
    });
  }
});

// ===========================================================================
// Hierarki heading: isi artikel TIDAK BOLEH melahirkan <h1> kedua
//
// Template halaman artikel sudah menyediakan satu <h1> kanonik (judul artikel).
// Setiap <h1> tambahan dari isi CMS memaksa Google menebak topik utama halaman.
// Dua halaman produksi terbukti mengalaminya sebelum perbaikan ini.
// ===========================================================================

describe("hierarki heading isi artikel", () => {
  const render = (children: unknown[]) =>
    renderToStaticMarkup(
      <ArticleRichContent
        data={
          {
            root: { type: "root", children, direction: null, format: "", indent: 0, version: 1 },
          } as never
        }
      />,
    );

  const headingNode = (tag: string | undefined, text: string) => ({
    type: "heading",
    tag,
    version: 1,
    children: [{ type: "text", text, version: 1, detail: 0, format: 0, mode: "normal", style: "" }],
  });

  it("menurunkan h1 dari isi artikel menjadi h2", () => {
    const html = render([headingNode("h1", "Judul dari editor")]);
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2>Judul dari editor</h2>");
  });

  it("membiarkan h2 sampai h6 apa adanya", () => {
    for (const tag of ["h2", "h3", "h4", "h5", "h6"]) {
      const html = render([headingNode(tag, `Isi ${tag}`)]);
      expect(html).toContain(`<${tag}>Isi ${tag}</${tag}>`);
    }
  });

  it("node heading tanpa tag jatuh ke h2, BUKAN h1", () => {
    // Converter asli memakai "h1" sebagai fallback — node rusak akan diam-diam
    // menjadi <h1> kedua. Asersi ini mengunci fallback yang aman.
    const html = render([headingNode(undefined, "Tag hilang")]);
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2>Tag hilang</h2>");
  });

  it("tag dengan kapitalisasi berbeda tetap diturunkan", () => {
    const html = render([headingNode("H1", "Kapital")]);
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<H1");
    expect(html).toContain("<h2>Kapital</h2>");
  });
});
