// Task 5 — Property-Based Test tambahan (kode SUDAH diperbaiki; HARUS LOLOS).
//
// Melengkapi Testing Strategy → Property-Based Tests di design.md:
//   P-A. HTML aman acak → `content` tidak berubah & konten aman tetap tampil.
//   P-B. HTML dengan markup aktif acak → field `html` selalu bersih.
//   P-C. sanitizeAiHtml idempoten pada field `html` (mensanitasi output yang
//        sudah bersih tidak mengubahnya, modulo normalisasi heading).
//
// fast-check TIDAK terpasang di proyek. Konsisten dengan
// route.preservation.test.ts, dipakai PRNG deterministik (LCG) dengan seed
// tetap agar reproducible lintas run.
//
// _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

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

// Fungsi asli untuk membangun `content` jalur asli & untuk uji idempotensi.
import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { ensureCta } from "@/lib/v2-admin/lexical";
import { sanitizeAiHtml } from "@/lib/ai/sanitize-html";

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

const { POST } = await import("../route");

// --- Predikat bug condition --------------------------------------------------

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

const stripCodeFence = (raw: string): string => {
  const match = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (match ? match[1] : raw).trim();
};

const expectedContentFor = (rawAiOutput: string): unknown =>
  ensureCta(htmlToLexicalState(stripCodeFence(rawAiOutput)));

const runHandler = async (
  rawAiOutput: string,
): Promise<{ status: number; data: { html: string; content: unknown } }> => {
  mockAiHtml(rawAiOutput);
  const response = await POST(buildArticleRequest(validArticleBody()));
  const data = (await response.json()) as { html: string; content: unknown };
  return { status: response.status, data };
};

// --- PRNG deterministik (LCG), pola sama seperti route.preservation.test.ts ---

const makeRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

const pick = <T,>(rng: () => number, arr: T[]): T =>
  arr[Math.floor(rng() * arr.length) % arr.length];

const WORDS = [
  "hunian",
  "cluster",
  "fasilitas",
  "kolam",
  "taman",
  "akses",
  "keluarga",
  "nyaman",
  "strategis",
  "modern",
];

const words = (rng: () => number, n: number): string =>
  Array.from({ length: n }, () => pick(rng, WORDS)).join(" ");

// --- Generator blok AMAN -----------------------------------------------------

type SafeBlock = { html: string; texts: string[]; urls: string[] };

const genHeading = (rng: () => number): SafeBlock => {
  const t = words(rng, 2 + Math.floor(rng() * 2));
  return { html: `<h2>${t}</h2>`, texts: [t], urls: [] };
};

const genParagraph = (rng: () => number): SafeBlock => {
  const t = words(rng, 4 + Math.floor(rng() * 4));
  return { html: `<p>${t}</p>`, texts: [t], urls: [] };
};

const genList = (rng: () => number): SafeBlock => {
  const a = words(rng, 2);
  const b = words(rng, 2);
  const tag = rng() < 0.5 ? "ul" : "ol";
  return {
    html: `<${tag}><li>${a}</li><li>${b}</li></${tag}>`,
    texts: [a, b],
    urls: [],
  };
};

const genLink = (rng: () => number): SafeBlock => {
  const scheme = rng() < 0.5 ? "http" : "https";
  const domain = pick(rng, ["contoh.id", "example.com", "example.org"]);
  const url = `${scheme}://${domain}`;
  const label = words(rng, 2);
  return {
    html: `<p><a href="${url}">${label}</a></p>`,
    texts: [label],
    urls: [url],
  };
};

const SAFE_GENERATORS = [genHeading, genParagraph, genList, genLink];

const genSafeHtml = (rng: () => number): SafeBlock => {
  const count = 2 + Math.floor(rng() * 4);
  const blocks = Array.from({ length: count }, () =>
    pick(rng, SAFE_GENERATORS)(rng),
  );
  return {
    html: blocks.map((b) => b.html).join(""),
    texts: blocks.flatMap((b) => b.texts),
    urls: blocks.flatMap((b) => b.urls),
  };
};

// --- Generator markup AKTIF (memicu bug condition) ---------------------------

const genDangerousTag = (rng: () => number): string => {
  const t = words(rng, 3);
  const variants = [
    `<script>fetch('/steal?c='+document.cookie)</script>`,
    `<iframe src="https://evil.example/${t.replace(/\s/g, "")}"></iframe>`,
    `<style>body{background:url(javascript:alert(1))}</style>`,
    `<object data="x.swf"></object>`,
    `<embed src="x.swf">`,
    `<form><input name="x"></form>`,
  ];
  return pick(rng, variants);
};

const genEventHandler = (rng: () => number): string => {
  const variants = [
    `<img src=x onerror=alert(document.cookie)>`,
    `<img src="y" onload="steal()">`,
    `<p onclick='hack()'>klik</p>`,
    `<div onmouseover="x()">hover</div>`,
    `<a href="#" onfocus=evil()>fokus</a>`,
  ];
  return pick(rng, variants);
};

const genActiveScheme = (rng: () => number): string => {
  const variants = [
    `<a href="javascript:alert(1)">klik</a>`,
    `<a href="vbscript:msgbox(1)">x</a>`,
    `<img src="data:text/html,<script>alert(1)</script>">`,
    `<a href='javascript:void(0)'>y</a>`,
  ];
  return pick(rng, variants);
};

const ACTIVE_GENERATORS = [genDangerousTag, genEventHandler, genActiveScheme];

// Sisipkan markup aktif acak di antara beberapa blok aman.
const genActiveHtml = (rng: () => number): SafeBlock => {
  const safe = genSafeHtml(rng);
  const activeCount = 1 + Math.floor(rng() * 3);
  const active = Array.from({ length: activeCount }, () =>
    pick(rng, ACTIVE_GENERATORS)(rng),
  );
  // Gabungkan aman + aktif berselang-seling.
  return {
    html: safe.html + active.join(""),
    texts: safe.texts,
    urls: safe.urls,
  };
};

describe("PBT — properti sanitasi field `html` & preservasi `content` (Task 5)", () => {
  beforeEach(() => {
    resetAiArticleMocks();
  });

  // P-A — HTML aman acak → content tak berubah & konten aman tampil.
  it("P-A: HTML aman acak → `content` identik & konten aman tetap tampil", async () => {
    const rng = makeRng(0x1a2b3c4d);
    const RUNS = 60;

    for (let i = 0; i < RUNS; i += 1) {
      const { html: safeHtml, texts, urls } = genSafeHtml(rng);
      const { status, data } = await runHandler(safeHtml);

      expect(status).toBe(200);
      expect(data.content).toEqual(expectedContentFor(safeHtml));
      for (const t of texts) expect(data.html).toContain(t);
      for (const u of urls) expect(data.html).toContain(u);
      // Konten aman tidak memicu penghapusan apa pun yang tidak diinginkan.
      expectSanitized(data.html);
    }
  });

  // P-B — HTML dengan markup aktif acak → field `html` selalu bersih.
  it("P-B: HTML markup aktif acak → field `html` selalu bersih", async () => {
    const rng = makeRng(0x7f0055aa);
    const RUNS = 60;

    for (let i = 0; i < RUNS; i += 1) {
      const { html: activeHtml } = genActiveHtml(rng);
      const { status, data } = await runHandler(activeHtml);

      expect(status).toBe(200);
      expectSanitized(data.html);
    }
  });

  // P-C — sanitizeAiHtml idempoten pada field `html`.
  it("P-C: sanitizeAiHtml idempoten pada field `html` (modulo normalisasi heading)", async () => {
    const rng = makeRng(0x0badf00d);
    const RUNS = 60;

    for (let i = 0; i < RUNS; i += 1) {
      // Campur aman + aktif agar mencakup kedua permukaan.
      const source =
        rng() < 0.5 ? genSafeHtml(rng).html : genActiveHtml(rng).html;
      const { status, data } = await runHandler(source);

      expect(status).toBe(200);
      // Output handler sudah tersanitasi; mensanitasi ulang tidak mengubahnya.
      expect(sanitizeAiHtml(data.html)).toBe(data.html);
    }
  });
});
