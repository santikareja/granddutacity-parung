// Rotasi model AI otomatis. Server-side only.
//
// MASALAH YANG DISELESAIKAN
// Sebelumnya setiap endpoint AI memakai SATU model hasil resolveAiConfig(), dan
// chatCompletion memberi satu model waktu sampai 5 menit. Bila model itu
// menggantung, seluruh request habis di situ: penulis menunggu lama lalu
// mendapat 504, tanpa pernah mencoba model lain yang mungkin sehat.
//
// CARA KERJA SEKARANG
//   1. resolveAiCandidates() menyusun DAFTAR kandidat berurutan (model pilihan
//      user lebih dulu, lalu default provider, lalu model aktif lain, lalu
//      provider lain, terakhir konfigurasi env).
//   2. runAiTask() mencoba kandidat satu per satu dengan batas waktu PER
//      PERCOBAAN, di bawah satu anggaran waktu total yang selalu lebih kecil
//      dari maxDuration route. Jadi tidak ada satu model pun yang bisa
//      menghabiskan seluruh jatah waktu request.
//   3. Hasil setiap percobaan divalidasi lewat `parse`. Kegagalan validasi
//      diperlakukan sama seperti kegagalan jaringan: rotasi ke model berikutnya.
//      Inilah yang menjaga kualitas tetap setara saat model berganti — model
//      yang mengembalikan JSON rusak, artikel kosong, atau keluaran yang
//      melanggar kontrak tidak akan pernah lolos ke penulis.

import { desc } from "drizzle-orm";

import { db } from "@/db";
import { aiProviders } from "@/db/schema";
import {
  AiDisabledError,
  AiRequestError,
  chatCompletion,
  type ChatMessage,
} from "@/lib/ai/client";
import { getAiConfig } from "@/lib/ai/env";
import { decryptProviderKey, normalizeModelIds } from "./ai-providers";
import type { ResolvedAiConfig } from "./ai-runtime";

export type AiCandidate = ResolvedAiConfig;

export type AiAttempt = {
  model: string;
  providerName?: string;
  ok: boolean;
  ms: number;
  error?: string;
};

export type AiBudget = {
  /** Batas satu percobaan. Model yang lebih lambat dari ini dianggap gagal. */
  perAttemptMs: number;
  /** Batas seluruh rangkaian percobaan. Harus < maxDuration route. */
  totalMs: number;
  /** Batas jumlah kandidat yang disusun. */
  maxCandidates: number;
};

/**
 * Preset anggaran waktu, diselaraskan dengan `maxDuration` masing-masing route.
 * Angka total selalu menyisakan margin agar route bisa mengembalikan pesan
 * error yang berguna, bukan mati diputus platform.
 */
export const AI_BUDGETS = {
  /** Tugas JSON pendek: titles, outline, seo. Route maxDuration 300. */
  fast: { perAttemptMs: 45_000, totalMs: 170_000, maxCandidates: 4 },
  /** Tugas sangat pendek pada route maxDuration 120: text-tool, image-meta. */
  quick: { perAttemptMs: 28_000, totalMs: 95_000, maxCandidates: 3 },
  /** Penulisan artikel panjang satu pass. Route maxDuration 300. */
  long: { perAttemptMs: 130_000, totalMs: 275_000, maxCandidates: 3 },
  /**
   * Artikel dua pass (penulis lalu editor) pada route maxDuration 300.
   * writer.totalMs + editor.totalMs harus < maxDuration agar route sempat
   * mengembalikan respons. 190 + 95 = 285 < 300.
   */
  articleWriter: { perAttemptMs: 120_000, totalMs: 190_000, maxCandidates: 3 },
  articleEditor: { perAttemptMs: 70_000, totalMs: 95_000, maxCandidates: 2 },
  /**
   * Artikel faktual (route maxDuration 300): perencanaan tool + penulisan,
   * dengan sisa waktu untuk panggilan tool eksternal. 60 + 170 + ~45s tool
   * tetap di bawah 300.
   */
  factualPlan: { perAttemptMs: 30_000, totalMs: 60_000, maxCandidates: 2 },
  factualArticle: { perAttemptMs: 120_000, totalMs: 170_000, maxCandidates: 2 },
} as const satisfies Record<string, AiBudget>;

// Sisa waktu minimum yang masih layak untuk mencoba satu model lagi. Di bawah
// ini, mencoba hanya akan menghasilkan timeout kedua tanpa manfaat.
const MIN_ATTEMPT_MS = 8_000;

/** Pesan tunggal agar semua endpoint AI konsisten saat provider belum diisi. */
export const AI_NOT_CONFIGURED_MESSAGE =
  "Layanan AI belum dikonfigurasi. Tambahkan provider (Base URL + API Key) dan tandai satu sebagai default di Konfigurasi AI.";

const candidateKey = (config: AiCandidate): string =>
  `${config.baseUrl}::${config.model}`;

/**
 * Susun daftar kandidat model berurutan dari prioritas tertinggi ke terendah.
 *
 * Urutan ini penting: percobaan pertama harus selalu model yang paling
 * diinginkan (pilihan eksplisit user, lalu default provider), sehingga rotasi
 * tidak menurunkan kualitas kecuali benar-benar terpaksa.
 */
export const resolveAiCandidates = async (options?: {
  providerId?: number;
  model?: string;
  maxCandidates?: number;
}): Promise<AiCandidate[]> => {
  const requestedProviderId = options?.providerId;
  const requestedModel = options?.model?.trim() || "";
  const limit = Math.max(1, options?.maxCandidates ?? 4);

  const candidates: AiCandidate[] = [];
  const seen = new Set<string>();

  const push = (config: AiCandidate): void => {
    if (!config.baseUrl || !config.apiKey || !config.model) return;
    const key = candidateKey(config);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(config);
  };

  try {
    const rows = await db
      .select()
      .from(aiProviders)
      .orderBy(desc(aiProviders.isDefault), desc(aiProviders.updatedAt));

    // Provider yang diminta eksplisit dinaikkan ke depan.
    const ordered = requestedProviderId
      ? [
          ...rows.filter((row) => row.id === requestedProviderId),
          ...rows.filter((row) => row.id !== requestedProviderId),
        ]
      : rows;

    for (const provider of ordered) {
      if (!provider.baseUrl || !provider.apiKey) continue;

      const apiKey = decryptProviderKey(provider.apiKey);
      if (!apiKey) continue;

      const baseUrl = provider.baseUrl.replace(/\/+$/, "");
      const activeModels = normalizeModelIds(provider.models);
      const defaultModel = provider.defaultModel?.trim() || "";

      // Model yang dipilih user hanya berlaku untuk provider yang dimaksud
      // (atau provider teratas bila user tidak menyebut provider).
      const isRequestedProvider = requestedProviderId
        ? provider.id === requestedProviderId
        : provider === ordered[0];

      const models = [
        ...(requestedModel && isRequestedProvider ? [requestedModel] : []),
        ...(defaultModel ? [defaultModel] : []),
        ...activeModels,
      ];

      for (const model of models) {
        push({
          baseUrl,
          apiKey,
          model,
          source: "db",
          providerId: provider.id,
          providerName: provider.name,
        });
      }
    }
  } catch (error) {
    // DB bermasalah tidak boleh mematikan fitur AI: masih ada fallback env.
    console.error("[ai-rotation] gagal membaca provider dari DB:", error);
  }

  // Konfigurasi env sebagai jaring terakhir.
  const envConfig = getAiConfig();
  if (envConfig) push({ ...envConfig, source: "env" });

  return candidates.slice(0, limit);
};

export type AiTaskResult<T> = {
  value: T;
  /** Model yang akhirnya berhasil. Ditampilkan ke penulis untuk transparansi. */
  model: string;
  providerName?: string;
  attempts: AiAttempt[];
  /** true bila kandidat pertama gagal dan sistem berpindah model. */
  rotated: boolean;
};

/**
 * Jalankan satu tugas AI dengan rotasi model.
 *
 * `parse` bertugas ganda: mengubah teks mentah menjadi hasil akhir DAN
 * memvalidasinya. Melempar di dalam `parse` berarti "keluaran model ini tidak
 * memenuhi kontrak" dan memicu percobaan ke model berikutnya.
 */
export const runAiTask = async <T>(options: {
  candidates: AiCandidate[];
  messages: ChatMessage[];
  budget: AiBudget;
  parse: (raw: string) => T;
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
  signal?: AbortSignal;
  /** Label untuk log, mis. "article" atau "titles". */
  taskLabel?: string;
}): Promise<AiTaskResult<T>> => {
  const {
    candidates,
    messages,
    budget,
    parse,
    temperature,
    maxTokens,
    responseFormatJson,
    signal,
    taskLabel = "ai",
  } = options;

  if (candidates.length === 0) {
    throw new AiDisabledError();
  }

  const startedAt = Date.now();
  const attempts: AiAttempt[] = [];
  let lastError: AiRequestError | null = null;

  for (const [index, candidate] of candidates.entries()) {
    const elapsed = Date.now() - startedAt;
    const remaining = budget.totalMs - elapsed;

    if (remaining < MIN_ATTEMPT_MS) {
      console.warn(
        `[ai-rotation:${taskLabel}] anggaran waktu habis setelah ${attempts.length} percobaan; ${candidates.length - index} kandidat tidak dicoba.`,
      );
      break;
    }

    const attemptTimeout = Math.min(budget.perAttemptMs, remaining);
    const attemptStart = Date.now();

    try {
      const raw = await chatCompletion({
        config: candidate,
        messages,
        temperature,
        maxTokens,
        responseFormatJson,
        signal,
        timeoutMs: attemptTimeout,
      });

      // Validasi ikut menentukan sukses: keluaran yang melanggar kontrak
      // diperlakukan sebagai kegagalan model, bukan diteruskan ke penulis.
      const value = parse(raw);

      attempts.push({
        model: candidate.model,
        providerName: candidate.providerName,
        ok: true,
        ms: Date.now() - attemptStart,
      });

      if (index > 0) {
        console.warn(
          `[ai-rotation:${taskLabel}] berhasil setelah rotasi ke model "${candidate.model}" (percobaan ke-${index + 1}).`,
        );
      }

      return {
        value,
        model: candidate.model,
        providerName: candidate.providerName,
        attempts,
        rotated: index > 0,
      };
    } catch (error) {
      // Tidak ada konfigurasi sama sekali: tidak ada gunanya mencoba lagi.
      if (error instanceof AiDisabledError) throw error;

      const asRequestError =
        error instanceof AiRequestError
          ? error
          : new AiRequestError(
              error instanceof Error
                ? error.message
                : "Keluaran model tidak valid.",
              502,
            );

      attempts.push({
        model: candidate.model,
        providerName: candidate.providerName,
        ok: false,
        ms: Date.now() - attemptStart,
        error: asRequestError.message,
      });

      lastError = asRequestError;

      console.warn(
        `[ai-rotation:${taskLabel}] model "${candidate.model}" gagal (${asRequestError.status}): ${asRequestError.message}`,
      );

      // Abort dari luar: hormati, jangan bakar kandidat lain.
      if (!asRequestError.retryable) throw asRequestError;
    }
  }

  const tried = attempts.map((a) => a.model).join(", ") || "tidak ada";
  throw new AiRequestError(
    `Semua model yang tersedia gagal. Model yang dicoba: ${tried}. Kegagalan terakhir: ${lastError?.message ?? "tidak diketahui"}`,
    lastError?.status ?? 502,
  );
};
