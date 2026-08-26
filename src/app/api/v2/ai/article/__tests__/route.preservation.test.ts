// Task 3 — Test Preservation (SEBELUM fix diterapkan).
//
// Property 2 (Preservation): untuk keluaran AI yang TIDAK memenuhi bug
// condition (tidak ada tag berbahaya, atribut on*, atau skema URL aktif),
// perilaku handler harus tetap sama — field `content` identik, konten aman
// tetap tampil utuh di field `html` (modulo normalisasi jinak <h1>→<h2>),
// alur simpan draft tidak berubah, dan `stripCodeFence()` tetap diterapkan.
//
// METODOLOGI observation-first: assertion di sini dibangun dari perilaku yang
// diamati pada kode BELUM diperbaiki dan dirancang agar TETAP LOLOS setelah fix.
//
// Baseline yang dikunci:
//   - `content` handler === ensureCta(htmlToLexicalState(rawHtml)) dengan input
//     mentah yang sama. Ini benar sebelum fix (html=raw, content dari raw) dan
//     tetap benar setelah fix (content tetap dibangun dari rawHtml, hanya field
//     `html` yang disanitasi). Assertion ini karena itu robust di kedua kondisi.
//   - Elemen aman (heading, paragraf, list, tautan http/https) memunculkan
//     TEKS-nya di field `html` pada kedua kondisi. Untuk assertion level-tag
//     dipakai <h2> (yang tidak berubah oleh sanitizeAiHtml). Untuk <h1> hanya
//     TEKS-nya yang diasersi (tidak hilang; hanya level heading diselaraskan).
//   - Path error tidak berubah: judul kosong → 400, outline kosong → 400,
//     keluaran AI kosong → 502, provider belum terkonfigurasi → 503.
//   - stripCodeFence() tetap membuang pembungkus ```html ... ```.
//
// _Requirements: 3.1, 3.2, 3.3, 3.4_

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildArticleRequest,
  mockAiHtml,
  resetAiArticleMocks,
  resolveAiCandidatesMock,
  validArticleBody,
} from "@/test/helpers/ai-article-mocks";

// Fungsi asli (TIDAK di-mock) untuk menghitung `content` yang diharapkan.
import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { ensureCta } from "@/lib/v2-admin/lexical";

import {
  chatCompletionMock,
  requireApiUserMock,
} from "@/test/helpers/ai-article-mocks";

// Arahkan dependensi eksternal handler ke mock terkontrol.
// Timpa hanya `chatCompletion`; export lain (AiRequestError dll) tetap asli.
vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, chatCompletion: chatCompletionMock };
});

// Handler memakai rotasi model. Hanya penyusun kandidat yang di-mock (baca DB);
// logika rotasinya sendiri dibiarkan asli.
vi.mock("@/lib/v2-admin/ai-rotation", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/v2-admin/ai-rotation")>();
  return { ...actual, resolveAiCandidates: resolveAiCandidatesMock };
});

vi.mock("@/lib/v2-auth/api-guard", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/v2-auth/api-guard")>();
  return { ...actual, requireApiUser: requireApiUserMock };
});

// Impor handler SETELAH vi.mock agar memakai versi ter-mock.
const { POST } = await import("../route");

// Replika `stripCodeFence` dari route.ts agar test dapat menghitung input
// mentah yang benar-benar di-feed ke htmlToLexicalState (buang code fence
// + trim). Digunakan untuk membangun `content` yang diharapkan.
const stripCodeFence = (raw: string): string => {
  const match = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (match ? match[1] : raw).trim();
};

// `content` yang diharapkan dari sebuah keluaran AI mentah: identik dengan
// jalur handler `ensureCta(htmlToLexicalState(rawHtml))`.
const expectedContentFor = (rawAiOutput: string): unknown =>
  ensureCta(htmlToLexicalState(stripCodeFence(rawAiOutput)));

// Jalankan handler untuk sebuah keluaran AI mentah, kembalikan respons + data.
const runHandler = async (
  rawAiOutput: string,
): Promise<{ status: number; data: { html: string; content: unknown } }> => {
  mockAiHtml(rawAiOutput);
  const response = await POST(buildArticleRequest(validArticleBody()));
  const data = (await response.json()) as { html: string; content: unknown };
  return { status: response.status, data };
};

// Beberapa contoh HTML aman (tidak memicu bug condition).
const SAFE_SAMPLES: { name: string; html: string }[] = [
  {
    name: "heading + paragraf",
    html: "<h2>Judul Utama</h2><p>Paragraf pertama dengan teks biasa.</p>",
  },
  {
    name: "tautan https",
    html: '<p>Kunjungi <a href="https://contoh.id">situs kami</a> untuk info lengkap.</p>',
  },
  {
    name: "list bullet",
    html: "<h2>Daftar Fasilitas</h2><ul><li>Butir satu</li><li>Butir dua</li></ul>",
  },
  {
    name: "tautan http & https bercampur",
    html: '<p>Lihat <a href="http://example.com">tautan http</a> dan <a href="https://example.org">tautan https</a>.</p>',
  },
  {
    name: "list bernomor + paragraf terformat",
    html: "<p>Langkah <strong>penting</strong>:</p><ol><li>Pertama</li><li>Kedua</li></ol>",
  },
];

describe("Preservation — konten aman, `content`, dan alur normal tak berubah (Task 3)", () => {
  beforeEach(() => {
    resetAiArticleMocks();
  });

  // --- Kasus 1 — Kesetaraan `content` (Req 3.2) ----------------------------
  describe("kesetaraan `content` (Req 3.2)", () => {
    for (const sample of SAFE_SAMPLES) {
      it(`content identik dengan ensureCta(htmlToLexicalState(rawHtml)) — ${sample.name}`, async () => {
        const { status, data } = await runHandler(sample.html);

        expect(status).toBe(200);
        // content tetap dibangun dari HTML mentah yang sama → identik.
        expect(data.content).toEqual(expectedContentFor(sample.html));
      });
    }

    it("content stabil pada snapshot serialisasi JSON (baseline terkunci)", async () => {
      const { data } = await runHandler(SAFE_SAMPLES[0].html);
      // Serialisasi penuh sebagai baseline kesetaraan byte content.
      expect(JSON.stringify(data.content)).toBe(
        JSON.stringify(expectedContentFor(SAFE_SAMPLES[0].html)),
      );
    });
  });

  // --- Kasus 2 — Konten aman utuh (modulo h1→h2) (Req 3.1) ------------------
  describe("konten aman utuh di field `html` (Req 3.1)", () => {
    it("heading <h2>, paragraf, dan teks tetap muncul", async () => {
      const { data } = await runHandler(SAFE_SAMPLES[0].html);
      expect(data.html).toContain("Judul Utama");
      expect(data.html).toContain("Paragraf pertama");
      expect(data.html).toMatch(/<h2\b/i);
      expect(data.html).toMatch(/<p\b/i);
    });

    it("tautan http/https yang sah tetap muncul", async () => {
      const { data } = await runHandler(SAFE_SAMPLES[3].html);
      expect(data.html).toContain("http://example.com");
      expect(data.html).toContain("https://example.org");
      expect(data.html).toContain("tautan http");
      expect(data.html).toContain("tautan https");
    });

    it("list dan itemnya tetap muncul", async () => {
      const { data } = await runHandler(SAFE_SAMPLES[2].html);
      expect(data.html).toContain("Butir satu");
      expect(data.html).toContain("Butir dua");
      expect(data.html).toMatch(/<li\b/i);
    });

    it("normalisasi jinak <h1>→<h2>: teks heading tidak hilang", async () => {
      // Pada kode belum diperbaiki html=raw (masih <h1>); setelah fix menjadi
      // <h2>. Yang dijamin di KEDUA kondisi: TEKS heading tetap ada (tidak ada
      // konten hilang, hanya level heading yang diselaraskan). Karena itu
      // assertion hanya menyentuh teks, bukan level tag.
      const { data } = await runHandler("<h1>Judul H1</h1><p>Isi paragraf.</p>");
      expect(data.html).toContain("Judul H1");
      expect(data.html).toContain("Isi paragraf");
    });
  });

  // --- Kasus 3 — Alur simpan draft (Req 3.3) -------------------------------
  describe("alur simpan draft (Req 3.3)", () => {
    it("content yang dikembalikan (= yang disimpan sebagai draft) tetap sama", async () => {
      // Di level handler, draft yang disimpan berasal dari field `content`
      // pada respons. Preservation: content ini identik dengan jalur asli.
      const { data } = await runHandler(SAFE_SAMPLES[1].html);
      const savedContent = data.content; // apa yang dikirim/dipakai simpan
      expect(savedContent).toEqual(expectedContentFor(SAFE_SAMPLES[1].html));

      // Idempoten: memanggil ensureCta lagi pada content yang disimpan tidak
      // menambah blok CTA baru (alur simpan berulang tak berubah perilaku).
      expect(ensureCta(savedContent)).toEqual(savedContent);
    });
  });

  // --- Kasus 4 — Code fence & error path (Req 3.4) -------------------------
  describe("code fence & error path (Req 3.4)", () => {
    it("stripCodeFence() tetap membuang pembungkus ```html ... ```", async () => {
      const wrapped =
        "```html\n<h2>Judul Ter-fence</h2><p>Isi di dalam fence.</p>\n```";
      const { status, data } = await runHandler(wrapped);

      expect(status).toBe(200);
      expect(data.html).not.toContain("```");
      expect(data.html).toContain("Judul Ter-fence");
      expect(data.html).toContain("Isi di dalam fence");
      // content juga dibangun dari HTML yang sudah dibuang fence-nya.
      expect(data.content).toEqual(expectedContentFor(wrapped));
    });

    it("judul kosong → apiError 400", async () => {
      mockAiHtml("<p>tidak dipakai</p>");
      const response = await POST(
        buildArticleRequest({ title: "   ", outline: validArticleBody().outline }),
      );
      expect(response.status).toBe(400);
    });

    it("outline kosong → apiError 400", async () => {
      mockAiHtml("<p>tidak dipakai</p>");
      const response = await POST(
        buildArticleRequest({ title: "Judul Sah", outline: [] }),
      );
      expect(response.status).toBe(400);
    });

    it("keluaran AI kosong → 502", async () => {
      const { status } = await runHandler("   ");
      expect(status).toBe(502);
    });

    it("provider belum terkonfigurasi (tidak ada kandidat model) → 503", async () => {
      // Dengan rotasi model, "provider belum terkonfigurasi" berarti daftar
      // kandidat kosong. Perilaku yang dikunci tetap sama: 503.
      resolveAiCandidatesMock.mockResolvedValue([]);
      mockAiHtml("<p>tidak dipakai</p>");
      const response = await POST(buildArticleRequest(validArticleBody()));
      expect(response.status).toBe(503);
    });
  });

  // --- Kasus 5 — PBT Preservation (Req 3.1, 3.2) ---------------------------
  //
  // Bangkitkan HTML aman acak (kombinasi heading, paragraf, list, tautan sah)
  // lalu verifikasi: (a) `content` identik dengan jalur asli, dan (b) teks
  // konten aman + tautan http/https tetap tampil di field `html`.
  //
  // Tidak memakai fast-check (tidak terpasang di proyek). Sebagai gantinya
  // dipakai PRNG deterministik (LCG) agar reproducible lintas run.
  describe("PBT preservation — HTML aman acak (Req 3.1, 3.2)", () => {
    // LCG deterministik (seed tetap → hasil reproducible).
    const makeRng = (seed: number) => {
      let state = seed >>> 0;
      return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0xffffffff;
      };
    };

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

    const pick = <T,>(rng: () => number, arr: T[]): T =>
      arr[Math.floor(rng() * arr.length) % arr.length];

    const words = (rng: () => number, n: number): string =>
      Array.from({ length: n }, () => pick(rng, WORDS)).join(" ");

    type Block = { html: string; texts: string[]; urls: string[] };

    const genHeading = (rng: () => number): Block => {
      const t = words(rng, 2 + Math.floor(rng() * 2));
      return { html: `<h2>${t}</h2>`, texts: [t], urls: [] };
    };

    const genParagraph = (rng: () => number): Block => {
      const t = words(rng, 4 + Math.floor(rng() * 4));
      return { html: `<p>${t}</p>`, texts: [t], urls: [] };
    };

    const genList = (rng: () => number): Block => {
      const a = words(rng, 2);
      const b = words(rng, 2);
      const tag = rng() < 0.5 ? "ul" : "ol";
      return {
        html: `<${tag}><li>${a}</li><li>${b}</li></${tag}>`,
        texts: [a, b],
        urls: [],
      };
    };

    const genLink = (rng: () => number): Block => {
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

    const GENERATORS = [genHeading, genParagraph, genList, genLink];

    const genSafeHtml = (
      rng: () => number,
    ): { html: string; texts: string[]; urls: string[] } => {
      const count = 2 + Math.floor(rng() * 4);
      const blocks: Block[] = Array.from({ length: count }, () =>
        pick(rng, GENERATORS)(rng),
      );
      return {
        html: blocks.map((b) => b.html).join(""),
        texts: blocks.flatMap((b) => b.texts),
        urls: blocks.flatMap((b) => b.urls),
      };
    };

    it("content tak berubah & konten aman tetap tampil lintas banyak input", async () => {
      const rng = makeRng(0x5eed1234);
      const RUNS = 60;

      for (let i = 0; i < RUNS; i += 1) {
        const { html: safeHtml, texts, urls } = genSafeHtml(rng);
        const { status, data } = await runHandler(safeHtml);

        expect(status).toBe(200);
        // (a) content identik dengan jalur asli.
        expect(data.content).toEqual(expectedContentFor(safeHtml));

        // (b) teks konten aman tetap tampil di field html.
        for (const t of texts) {
          expect(data.html).toContain(t);
        }
        // tautan http/https yang sah tetap tampil.
        for (const u of urls) {
          expect(data.html).toContain(u);
        }
      }
    });
  });
});
