// Server-side only: wrapper fetch ke provider OpenAI-compatible (chat/completions).
// Menerima config eksplisit (dari DB provider atau env). Menolak dengan
// AiDisabledError jika config tidak tersedia agar pemanggil bisa mengembalikan
// respons "disabled" (bukan crash).

import type { AiConfig } from "./env";

export class AiDisabledError extends Error {
  constructor(message = "Layanan AI belum dikonfigurasi (tidak ada provider/env AI).") {
    super(message);
    this.name = "AiDisabledError";
  }
}

export class AiRequestError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionOptions = {
  config: AiConfig;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Minta provider mengembalikan JSON object bila didukung. */
  responseFormatJson?: boolean;
  signal?: AbortSignal;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
};

// Timeout longgar (5 menit): generasi artikel panjang bisa lama. Tidak ada
// timeout buatan yang lebih pendek — hanya kegagalan/timeout jaringan yang
// menghentikan panggilan.
const DEFAULT_TIMEOUT_MS = 300_000;

export const chatCompletion = async ({
  config,
  messages,
  temperature = 0.7,
  maxTokens,
  responseFormatJson = false,
  signal,
}: ChatCompletionOptions): Promise<string> => {
  if (!config || !config.baseUrl || !config.apiKey || !config.model) {
    throw new AiDisabledError();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  // Gabungkan abort eksternal (mis. dari req) dengan timeout internal.
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
        ...(responseFormatJson
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AiRequestError(
        `Provider AI merespons ${response.status}: ${detail.slice(0, 500)}`,
        response.status >= 400 && response.status < 500 ? 400 : 502,
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new AiRequestError("Respons AI kosong.", 502);
    }

    return content.trim();
  } catch (error) {
    if (error instanceof AiDisabledError || error instanceof AiRequestError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiRequestError("Permintaan ke provider AI timeout/dibatalkan.", 504);
    }
    throw new AiRequestError(
      error instanceof Error ? error.message : "Gagal memanggil provider AI.",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
};

// Ekstrak JSON dari respons AI yang mungkin dibungkus code fence ```json ... ```
// atau teks tambahan. Melempar AiRequestError jika tidak ada JSON valid.
export const parseJsonFromAi = <T>(raw: string): T => {
  const trimmed = raw.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  // Coba parse langsung dulu.
  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Fallback: ambil substring dari kurung pertama sampai terakhir.
    const firstBrace = candidate.search(/[[{]/);
    const lastBrace = Math.max(
      candidate.lastIndexOf("}"),
      candidate.lastIndexOf("]"),
    );
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sliced = candidate.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sliced) as T;
      } catch {
        // fallthrough
      }
    }
    throw new AiRequestError("Respons AI bukan JSON valid.", 502);
  }
};
