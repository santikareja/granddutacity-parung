// Task 1 — Verifikasi infrastruktur pengujian & helper mock berjalan.
//
// File ini SENGAJA hanya memvalidasi bahwa:
//   1. Vitest berjalan (mode single-run) dengan alias path "@/..." ter-resolve.
//   2. Mock untuk chatCompletion, requireApiUser, dan resolveAiConfigWithModel
//      dapat mengendalikan handler POST /api/v2/ai/article tanpa dependensi
//      eksternal (DB/sesi/provider AI).
//
// Test bug-condition (task 2) dan preservation (task 3) ditulis terpisah.

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
    expect(chatCompletionMock).toHaveBeenCalledTimes(1);
    expect(data.html).toContain("Halo");
    expect(data.content).toBeTruthy();
  });

  it("mock requireApiUser & resolveAiConfigWithModel membypass DB/sesi", async () => {
    mockAiHtml("<p>ok</p>");

    await POST(buildArticleRequest(validArticleBody()));

    expect(requireApiUserMock).toHaveBeenCalled();
    expect(resolveAiConfigWithModelMock).toHaveBeenCalled();
  });
});
