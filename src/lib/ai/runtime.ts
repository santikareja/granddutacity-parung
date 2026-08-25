// Resolusi konfigurasi AI saat runtime. Prioritas:
//   1. Provider default di DB (collection ai-providers) — API key didekripsi.
//   2. Fallback ke env AI_* (kompat lama).
// Server-side only.

import type { Payload } from "payload";

import { decryptSecret } from "./crypto";
import { getAiConfig, type AiConfig } from "./env";

export type ResolvedAiConfig = AiConfig & {
  source: "db" | "env";
  providerId?: number;
};

type AiProviderRow = {
  id: number;
  baseUrl?: string | null;
  apiKey?: string | null;
  defaultModel?: string | null;
  models?: unknown;
};

// Normalisasi field `models` (jsonb) menjadi array Model ID.
const normalizeModelIds = (models: unknown): string[] => {
  if (!Array.isArray(models)) return [];
  return models
    .map((m) => {
      if (typeof m === "string") return m.trim();
      // Kompat lama: array of { modelId }.
      if (m && typeof m === "object" && "modelId" in m) {
        const id = (m as { modelId?: unknown }).modelId;
        return typeof id === "string" ? id.trim() : "";
      }
      return "";
    })
    .filter((id) => id.length > 0);
};

// Ambil provider dari DB lewat db adapter (findOne) agar TIDAK melewati field
// hook afterRead yang memask apiKey — kita butuh ciphertext mentah untuk dekripsi.
// Mengembalikan null bila tabel belum ada / query gagal / tidak ada provider.
const getProviderRow = async (payload: Payload): Promise<AiProviderRow | null> => {
  try {
    const preferred = await payload.db.findOne<AiProviderRow & { id: number }>({
      collection: "ai-providers",
      where: { isDefault: { equals: true } },
    });
    if (preferred) return preferred;

    // Tidak ada default → pakai provider pertama yang ada.
    const any = await payload.db.findOne<AiProviderRow & { id: number }>({
      collection: "ai-providers",
      where: {},
    });
    return any ?? null;
  } catch {
    return null;
  }
};

export const resolveAiConfig = async (
  payload: Payload,
): Promise<ResolvedAiConfig | null> => {
  const provider = await getProviderRow(payload);

  if (provider?.baseUrl && provider?.apiKey) {
    let apiKey = "";
    try {
      apiKey = decryptSecret(provider.apiKey);
    } catch {
      apiKey = "";
    }

    if (apiKey && !apiKey.startsWith("••")) {
      const activeModels = normalizeModelIds(provider.models);
      const model = provider.defaultModel?.trim() || activeModels[0] || "";

      if (model) {
        return {
          baseUrl: provider.baseUrl.replace(/\/+$/, ""),
          apiKey,
          model,
          source: "db",
          providerId: provider.id,
        };
      }
    }
  }

  // Fallback: env AI_*.
  const envConfig = getAiConfig();
  if (envConfig) {
    return { ...envConfig, source: "env" };
  }

  return null;
};

export const hasResolvedAiConfig = async (payload: Payload): Promise<boolean> =>
  (await resolveAiConfig(payload)) !== null;
