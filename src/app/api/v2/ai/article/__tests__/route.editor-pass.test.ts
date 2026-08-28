// Test layer editor kedua pada POST /api/v2/ai/article (Bagian A).
//
// Yang dikunci:
//   - Alur normal menjalankan DUA pass (penulis lalu editor): chatCompletion
//     dipanggil dua kali, dan keluaran final berasal dari editor (edited=true).
//   - Best-effort: bila pass editor gagal (mis. keluaran kosong), handler TIDAK
//     menggagalkan permintaan — ia memakai draft penulis (edited=false, 200).

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildArticleRequest,
  chatCompletionMock,
  getInternalLinkCandidatesMock,
  requireApiUserMock,
  resetAiArticleMocks,
  resolveAiCandidatesMock,
  validArticleBody,
} from "@/test/helpers/ai-article-mocks";

vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, chatCompletion: chatCompletionMock };
});

vi.mock("@/lib/v2-admin/ai-rotation", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/v2-admin/ai-rotation")>();
  return { ...actual, resolveAiCandidates: resolveAiCandidatesMock };
});

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

const { POST } = await import("../route");

describe("POST /api/v2/ai/article — layer editor kedua", () => {
  beforeEach(() => {
    resetAiArticleMocks();
  });

  it("menjalankan dua pass dan memakai keluaran editor (edited=true)", async () => {
    chatCompletionMock
      .mockResolvedValueOnce("<h2>Draft Penulis</h2><p>Versi awal.</p>")
      .mockResolvedValue("<h2>Versi Editor</h2><p>Versi rapi dan natural.</p>");

    const response = await POST(buildArticleRequest(validArticleBody()));
    const data = (await response.json()) as {
      html: string;
      edited: boolean;
    };

    expect(response.status).toBe(200);
    expect(chatCompletionMock).toHaveBeenCalledTimes(2);
    expect(data.edited).toBe(true);
    expect(data.html).toContain("Versi Editor");
    expect(data.html).not.toContain("Draft Penulis");
  });

  it("fallback ke draft penulis bila pass editor gagal (edited=false, tetap 200)", async () => {
    // Penulis sukses; editor mengembalikan kosong -> semua kandidat editor gagal
    // -> handler memakai draft penulis alih-alih menggagalkan permintaan.
    chatCompletionMock
      .mockResolvedValueOnce("<h2>Draft Penulis</h2><p>Versi awal yang valid.</p>")
      .mockResolvedValue("");

    const response = await POST(buildArticleRequest(validArticleBody()));
    const data = (await response.json()) as {
      html: string;
      edited: boolean;
    };

    expect(response.status).toBe(200);
    expect(data.edited).toBe(false);
    expect(data.html).toContain("Draft Penulis");
  });
});
