// Task 1 — Verifikasi infrastruktur pengujian & helper mock berjalan.
//
// File ini SENGAJA hanya memvalidasi bahwa:
//   1. Vitest berjalan (mode single-run) dengan alias path "@/..." ter-resolve.
//   2. Mock untuk chatCompletion, requireApiUser, dan resolveAiCandidates
//      dapat mengendalikan handler POST /api/v2/ai/article tanpa dependensi
//      eksternal (DB/sesi/provider AI).
//
// Test bug-condition (task 2) dan preservation (task 3) ditulis terpisah.

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildArticleRequest,
  chatCompletionMock,
  getInternalLinkCandidatesMock,
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

// Kandidat tautan internal membaca DB; mock agar test tidak menyentuh Drizzle.
vi.mock("@/lib/v2-admin/article-link-candidates", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/v2-admin/article-link-candidates")
    >();
  return {
    ...actual,
    getInternalLinkCandidates: getInternalLinkCandidatesMock,
  };
});

vi.mock("@/lib/v2-auth/api-guard", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/v2-auth/api-guard")>();
  return { ...actual, requireApiUser: requireApiUserMock };
});

// Impor handler SETELAH vi.mock agar memakai versi ter-mock.
const { POST } = await import("../route");

describe("infrastruktur pengujian AI Studio (Task 1)", () => {
  beforeEach(() => {
    resetAiArticleMocks();
  });

  it("Vitest berjalan dan alias path '@/...' ter-resolve", () => {
    expect(typeof buildArticleRequest).toBe("function");
    expect(typeof POST).toBe("function");
  });

  it("mock chatCompletion mengendalikan keluaran provider AI", async () => {
    mockAiHtml("<h2>Halo</h2><p>Isi artikel uji.</p>");

    const response = await POST(buildArticleRequest(validArticleBody()));
    const data = (await response.json()) as { html: string; content: unknown };

    expect(response.status).toBe(200);
    // Dua pass: penulis lalu editor. Keduanya memanggil chatCompletion.
    expect(chatCompletionMock).toHaveBeenCalledTimes(2);
    expect(data.html).toContain("Halo");
    expect(data.content).toBeTruthy();
  });

  it("mock requireApiUser & resolveAiCandidates membypass DB/sesi", async () => {
    mockAiHtml("<p>ok</p>");

    await POST(buildArticleRequest(validArticleBody()));

    expect(requireApiUserMock).toHaveBeenCalled();
    // Handler kini menyusun daftar kandidat model (untuk rotasi) alih-alih satu
    // config tunggal; inilah dependensi DB yang harus ter-mock.
    expect(resolveAiCandidatesMock).toHaveBeenCalled();
  });
});
