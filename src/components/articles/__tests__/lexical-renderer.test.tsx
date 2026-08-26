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
