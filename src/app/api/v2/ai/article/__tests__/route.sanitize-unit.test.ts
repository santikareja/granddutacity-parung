// Task 5 — Unit test tambahan (kode SUDAH diperbaiki; semua HARUS LOLOS).
//
// Melengkapi cakupan Testing Strategy → Unit Tests di design.md:
//   - Field `html` handler untuk tiap kategori bug condition (tag berbahaya,
//     atribut on*, skema URL aktif) menghasilkan output bersih.
//   - Edge: HTML kosong tetap menghasilkan 502.
//   - Edge: <h1> dinormalkan menjadi <h2> pada field `html`.
//   - `content` identik antara jalur asli
//     `ensureCta(htmlToLexicalState(stripCodeFence(raw)))` dan hasil handler
//     untuk input yang sama.
//
// Fokus pada cakupan tambahan yang belum diuji di route.bug-condition.test.ts /
// route.preservation.test.ts (mis. pembandingan `content` eksplisit ke jalur
// asli, dan normalisasi heading level-tag pada field `html`).
//
// _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2_

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildArticleRequest,
  chatCompletionMock,
  mockAiHtml,
  requireApiUserMock,
  resetAiArticleMocks,
  resolveAiConfigWithModelMock,
  validArticleBody,
} from "@/test/helpers/ai-article-mocks";

// Fungsi asli (TIDAK di-mock) untuk membangun `content` jalur asli.
import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { ensureCta } from "@/lib/v2-admin/lexical";

// Arahkan dependensi eksternal handler ke mock terkontrol.
vi.mock("@/lib/ai/client", () => ({
  chatCompletion: chatCompletionMock,
}));

vi.mock("@/lib/v2-admin/ai-runtime", () => ({
  resolveAiConfigWithModel: resolveAiConfigWithModelMock,
}));

vi.mock("@/lib/v2-auth/api-guard", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/v2-auth/api-guard")>();
  return { ...actual, requireApiUser: requireApiUserMock };
});

// Impor handler SETELAH vi.mock agar memakai versi ter-mock.
const { POST } = await import("../route");

// --- Predikat bug condition (mengikuti isBugCondition di bugfix.md) ----------

const containsDangerousTag = (html: string): boolean =>
  /<\s*(script|iframe|style|object|embed|svg|math|link|meta|base|form|input|button|textarea|select|template|noscript)\b/i.test(
    html,
  );

const containsInlineEventHandler = (html: string): boolean =>
  /\son\w+\s*=/i.test(html);

const containsActiveUrlScheme = (html: string): boolean =>
  /(href|src)\s*=\s*['"]?\s*(?:javascript|data|vbscript):/i.test(html);

const expectSanitized = (html: string): void => {
  expect(containsDangerousTag(html)).toBe(false);
  expect(containsInlineEventHandler(html)).toBe(false);
  expect(containsActiveUrlScheme(html)).toBe(false);
};

// Replika stripCodeFence dari route.ts untuk menghitung input mentah jalur asli.
const stripCodeFence = (raw: string): string => {
  const match = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (match ? match[1] : raw).trim();
};

// `content` yang diharapkan dari jalur asli.
const expectedContentFor = (rawAiOutput: string): unknown =>
  ensureCta(htmlToLexicalState(stripCodeFence(rawAiOutput)));

// Jalankan handler untuk keluaran AI mentah, kembalikan status + data.
const runHandler = async (
  rawAiOutput: string,
): Promise<{ status: number; data: { html: string; content: unknown } }> => {
  mockAiHtml(rawAiOutput);
  const response = await POST(buildArticleRequest(validArticleBody()));
  const data = (await response.json().catch(() => ({}))) as {
    html: string;
    content: unknown;
  };
  return { status: response.status, data };
};

describe("Unit — field `html` bersih per kategori bug condition (Task 5)", () => {
  beforeEach(() => {
    resetAiArticleMocks();
  });

  // --- Kategori 1 — Tag berbahaya (Req 2.1) --------------------------------
  describe("tag berbahaya (Req 2.1)", () => {
    const DANGEROUS = [
      { name: "script", html: "<script>evil()</script>" },
      { name: "iframe", html: '<iframe src="https://evil.example"></iframe>' },
      { name: "style", html: "<style>body{display:none}</style>" },
      { name: "object", html: '<object data="x.swf"></object>' },
      { name: "embed", html: '<embed src="x.swf">' },
      { name: "form + input", html: "<form><input name=x></form>" },
    ];

    for (const c of DANGEROUS) {
      it(`membuang <${c.name}> dari field \`html\``, async () => {
        const { status, data } = await runHandler(
          `<h2>Aman</h2>${c.html}<p>Isi.</p>`,
        );
        expect(status).toBe(200);
        expectSanitized(data.html);
        expect(data.html).toContain("Aman");
        expect(data.html).toContain("Isi.");
      });
    }
  });

  // --- Kategori 2 — Atribut event handler on* (Req 2.2) --------------------
  describe("atribut event handler inline (Req 2.2)", () => {
    const HANDLERS = [
      { name: "onerror", html: "<img src=x onerror=alert(1)>" },
      { name: "onload", html: '<img src="y" onload="steal()">' },
      { name: "onclick", html: "<p onclick='hack()'>klik</p>" },
      { name: "onmouseover", html: '<div onmouseover="x()">hover</div>' },
    ];

    for (const c of HANDLERS) {
      it(`membuang atribut ${c.name} dari field \`html\``, async () => {
        const { status, data } = await runHandler(`<p>Depan</p>${c.html}`);
        expect(status).toBe(200);
        expect(data.html).not.toMatch(/\son\w+\s*=/i);
        expectSanitized(data.html);
      });
    }
  });

  // --- Kategori 3 — Skema URL aktif (Req 2.3) ------------------------------
  describe("skema URL aktif (Req 2.3)", () => {
    const SCHEMES = [
      { name: "javascript:", html: '<a href="javascript:alert(1)">x</a>' },
      { name: "vbscript:", html: '<a href="vbscript:msgbox(1)">x</a>' },
      {
        name: "data: pada src",
        html: '<img src="data:text/html,<script>alert(1)</script>">',
      },
    ];

    for (const c of SCHEMES) {
      it(`membuang skema ${c.name} dari field \`html\``, async () => {
        const { status, data } = await runHandler(`<p>Teks</p>${c.html}`);
        expect(status).toBe(200);
        expectSanitized(data.html);
      });
    }
  });

  // --- Edge — HTML kosong tetap 502 (Req path error tak berubah) -----------
  describe("edge: keluaran AI kosong tetap 502", () => {
    it("string kosong → 502", async () => {
      const { status } = await runHandler("");
      expect(status).toBe(502);
    });

    it("hanya whitespace → 502", async () => {
      const { status } = await runHandler("   \n\t  ");
      expect(status).toBe(502);
    });

    it("code fence kosong → 502", async () => {
      const { status } = await runHandler("```html\n\n```");
      expect(status).toBe(502);
    });
  });

  // --- Edge — <h1> dinormalkan menjadi <h2> pada field `html` --------------
  describe("edge: normalisasi <h1> → <h2> pada field `html`", () => {
    it("tag <h1> menjadi <h2> dan teks tetap ada", async () => {
      const { status, data } = await runHandler(
        "<h1>Judul Utama</h1><p>Paragraf isi.</p>",
      );
      expect(status).toBe(200);
      expect(data.html).not.toMatch(/<\s*h1\b/i);
      expect(data.html).toMatch(/<h2\b/i);
      expect(data.html).toContain("Judul Utama");
      expect(data.html).toContain("Paragraf isi.");
    });

    it("<h1> dengan atribut ikut dinormalkan menjadi <h2>", async () => {
      const { status, data } = await runHandler(
        '<h1 class="title">Berjudul</h1><p>Isi.</p>',
      );
      expect(status).toBe(200);
      expect(data.html).not.toMatch(/<\s*h1\b/i);
      expect(data.html).toMatch(/<h2\b/i);
      expect(data.html).toContain("Berjudul");
    });
  });

  // --- `content` identik dengan jalur asli untuk input yang sama (Req 3.2) --
  describe("`content` identik dengan jalur asli ensureCta(htmlToLexicalState(stripCodeFence(raw)))", () => {
    const SAMPLES: { name: string; raw: string }[] = [
      {
        name: "heading + paragraf aman",
        raw: "<h2>Judul</h2><p>Paragraf isi biasa.</p>",
      },
      {
        name: "list + tautan https",
        raw: '<h2>Fasilitas</h2><ul><li>Kolam</li><li>Taman</li></ul><p><a href="https://contoh.id">info</a></p>',
      },
      {
        name: "input berbahaya (content tetap dari raw yang sama)",
        raw: "<h2>Judul</h2><script>evil()</script><img src=x onerror=alert(1)><p>Isi.</p>",
      },
      {
        name: "dibungkus code fence",
        raw: "```html\n<h2>Ter-fence</h2><p>Isi.</p>\n```",
      },
    ];

    for (const s of SAMPLES) {
      it(`content === jalur asli — ${s.name}`, async () => {
        const { status, data } = await runHandler(s.raw);
        expect(status).toBe(200);
        expect(data.content).toEqual(expectedContentFor(s.raw));
        // Kesetaraan byte via serialisasi JSON penuh.
        expect(JSON.stringify(data.content)).toBe(
          JSON.stringify(expectedContentFor(s.raw)),
        );
      });
    }
  });
});
