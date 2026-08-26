// Helper bersama untuk menguji handler `POST /api/v2/ai/article`.
//
// Handler tersebut bergantung pada tiga dependensi eksternal yang tidak boleh
// dijalankan sungguhan di dalam test:
//   - `chatCompletion` (@/lib/ai/client)       → memanggil provider AI via fetch
//   - `requireApiUser` (@/lib/v2-auth/api-guard) → butuh sesi/cookie
//   - `resolveAiConfigWithModel` (@/lib/v2-admin/ai-runtime) → membaca DB (Drizzle)
//
// Modul ini menyediakan mock fn yang dapat dikontrol + fixture + builder request.
// File test yang memakainya cukup memasang `vi.mock(...)` pada ketiga modul di
// atas dan mengarahkannya ke mock fn di sini (binding import sudah ter-hoist
// sehingga aman direferensikan dari factory `vi.mock`).
//
// Contoh pemakaian pada file test:
//
//   import {
//     chatCompletionMock,
//     requireApiUserMock,
//     resolveAiConfigWithModelMock,
//     resetAiArticleMocks,
//     mockAiHtml,
//     buildArticleRequest,
//   } from "@/test/helpers/ai-article-mocks";
//
//   vi.mock("@/lib/ai/client", () => ({ chatCompletion: chatCompletionMock }));
//   vi.mock("@/lib/v2-admin/ai-runtime", () => ({
//     resolveAiConfigWithModel: resolveAiConfigWithModelMock,
//   }));
//   vi.mock("@/lib/v2-auth/api-guard", async (importOriginal) => {
//     const actual = await importOriginal<typeof import("@/lib/v2-auth/api-guard")>();
//     return { ...actual, requireApiUser: requireApiUserMock };
//   });

import { vi } from "vitest";

import type { ChatMessage } from "@/lib/ai/client";
import type { ResolvedAiConfig } from "@/lib/v2-admin/ai-runtime";
import type { SessionUser } from "@/lib/v2-auth/auth";

type ChatCompletionArgs = {
  config: unknown;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

// Mock terkontrol untuk keluaran provider AI. Set output-nya lewat `mockAiHtml`.
export const chatCompletionMock =
  vi.fn<(opts: ChatCompletionArgs) => Promise<string>>();

// Mock guard autentikasi. Secara default mengembalikan user admin yang valid.
export const requireApiUserMock = vi.fn();

// Mock resolusi konfigurasi AI. Secara default mengembalikan config env palsu.
export const resolveAiConfigWithModelMock = vi.fn();

// Fixture: user admin terautentikasi.
export const FAKE_SESSION_USER: SessionUser = {
  id: 1,
  email: "admin@test.local",
  name: "Admin Test",
  role: "admin",
};

// Fixture: hasil guard sukses.
export const FAKE_GUARD_OK = { ok: true as const, user: FAKE_SESSION_USER };

// Fixture: konfigurasi AI aktif (tanpa menyentuh DB/env sungguhan).
export const FAKE_AI_CONFIG: ResolvedAiConfig = {
  baseUrl: "https://ai.test/v1",
  apiKey: "test-api-key",
  model: "test-model",
  source: "env",
};

// Reset + pasang perilaku default. Panggil di `beforeEach`.
export const resetAiArticleMocks = (): void => {
  chatCompletionMock.mockReset();
  requireApiUserMock.mockReset();
  resolveAiConfigWithModelMock.mockReset();

  requireApiUserMock.mockResolvedValue(FAKE_GUARD_OK);
  resolveAiConfigWithModelMock.mockResolvedValue(FAKE_AI_CONFIG);
};

// Kontrol keluaran HTML mentah dari provider AI untuk sebuah test.
export const mockAiHtml = (html: string): void => {
  chatCompletionMock.mockResolvedValue(html);
};

// Bangun `Request` POST ke handler artikel dengan body JSON.
export const buildArticleRequest = (body: unknown): Request =>
  new Request("http://localhost/api/v2/ai/article", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

// Body request valid minimal (judul + outline disetujui) untuk jalur sukses.
export const validArticleBody = (): {
  title: string;
  outline: { heading: string; subheadings: string[] }[];
} => ({
  title: "Judul Artikel Uji",
  outline: [{ heading: "Bagian 1", subheadings: ["Sub 1"] }],
});
