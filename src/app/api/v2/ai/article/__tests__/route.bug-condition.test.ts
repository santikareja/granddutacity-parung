// Task 2 — Test eksplorasi Bug Condition (SEBELUM fix diterapkan).
//
// Property 1 (Bug Condition): field `html` pratinjau AI Studio HARUS tersanitasi.
//
// Handler `POST /api/v2/ai/article` mengembalikan `{ html, content }`. Field
// `html` diisi dari `stripCodeFence(raw)` — keluaran HTML mentah provider AI
// TANPA sanitasi — lalu dirender di klien via `dangerouslySetInnerHTML`. Ini
// adalah celah DOM-based XSS.
//
// CRITICAL: Test ini DIHARAPKAN GAGAL pada kode yang BELUM diperbaiki. Kegagalan
// mengonfirmasi bug memang ada (field `html` masih memuat markup aktif). Setelah
// fix (task 4) test yang SAMA harus LOLOS.
//
// Assertion mengikuti Property: Fix Checking di bugfix.md:
//   NOT containsDangerousTag AND NOT containsInlineEventHandler
//   AND NOT containsActiveUrlScheme
//
// _Requirements: 1.1, 1.2, 1.3, 1.4_

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildArticleRequest,
  chatCompletionMock,
  mockAiHtml,
  requireApiUserMock,
  resetAiArticleMocks,
  resolveAiCandidatesMock,
  validArticleBody,
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

// --- Predikat bug condition (mengikuti isBugCondition di bugfix.md) ----------

// containsDangerousTag: <script>, <iframe>, <style>, <object>, dll.
const containsDangerousTag = (html: string): boolean =>
  /<\s*(script|iframe|style|object|embed|svg|math|link|meta|base|form|input|button|textarea|select|template|noscript)\b/i.test(
    html,
  );

// containsInlineEventHandler: atribut on* (onerror, onload, onclick, ...).
const containsInlineEventHandler = (html: string): boolean =>
  /\son\w+\s*=/i.test(html);

// containsActiveUrlScheme: href/src dengan javascript:/data:/vbscript:.
const containsActiveUrlScheme = (html: string): boolean =>
  /(href|src)\s*=\s*['"]?\s*(?:javascript|data|vbscript):/i.test(html);

// Assertion gabungan Property: Fix Checking.
const expectSanitized = (html: string): void => {
  expect(containsDangerousTag(html)).toBe(false);
  expect(containsInlineEventHandler(html)).toBe(false);
  expect(containsActiveUrlScheme(html)).toBe(false);
};

// Jalankan handler dan ambil field `html` dari respons.
const runHandlerHtml = async (aiHtml: string): Promise<string> => {
  mockAiHtml(aiHtml);
  const response = await POST(buildArticleRequest(validArticleBody()));
  expect(response.status).toBe(200);
  const data = (await response.json()) as { html: string };
  return data.html;
};

describe("Bug Condition — field `html` pratinjau harus tersanitasi (Task 2)", () => {
  beforeEach(() => {
    resetAiArticleMocks();
  });

  // Kasus 1 — Tag berbahaya (Req 1.1).
  it("membuang tag berbahaya (<script>, <iframe>) dari field `html`", async () => {
    const html = await runHandlerHtml(
      "<h2>Judul</h2>" +
        "<script>fetch('/steal?c='+document.cookie)</script>" +
        '<iframe src="https://evil.example/x"></iframe>' +
        "<p>Isi artikel.</p>",
    );

    expect(html).not.toMatch(/<\s*script/i);
    expect(html).not.toMatch(/<\s*iframe/i);
    expectSanitized(html);
  });

  // Kasus 2 — Atribut event handler inline (Req 1.2).
  it("membuang atribut event handler inline (onerror) dari field `html`", async () => {
    const html = await runHandlerHtml(
      "<p>Sebelum</p><img src=x onerror=alert(document.cookie)><p>Sesudah</p>",
    );

    expect(html).not.toMatch(/\son\w+\s*=/i);
    expectSanitized(html);
  });

  // Kasus 3 — Skema URL aktif (Req 1.3).
  it("membuang skema URL aktif (javascript:) dari field `html`", async () => {
    const html = await runHandlerHtml(
      '<p>Tautan: <a href="javascript:alert(1)">klik</a></p>',
    );

    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/(?:^|[^a-z])(?:data|vbscript):/i);
    expectSanitized(html);
  });

  // Kasus 4 — Edge kombinasi: markup aktif + konten aman (Req 1.1-1.4).
  it("membuang bagian aktif namun mempertahankan bagian aman", async () => {
    const html = await runHandlerHtml(
      "<h2>Panduan Aman</h2>" +
        "<p>Paragraf tepercaya dengan " +
        '<a href="https://contoh.id">tautan sah</a>.</p>' +
        '<img src=x onerror="steal()">' +
        "<script>evil()</script>" +
        '<a href="javascript:void(0)">jahat</a>' +
        "<ul><li>Butir satu</li><li>Butir dua</li></ul>",
    );

    // Bagian aktif dibuang.
    expectSanitized(html);

    // Bagian aman tetap utuh.
    expect(html).toContain("Panduan Aman");
    expect(html).toContain("Paragraf tepercaya");
    expect(html).toContain("https://contoh.id");
    expect(html).toContain("Butir satu");
    expect(html).toContain("Butir dua");
  });
});
