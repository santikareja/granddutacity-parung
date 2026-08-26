// Resolusi konfigurasi AI aktif untuk CMS kustom (v2-admin). Server-side only.
//
// Berbeda dari src/lib/ai/runtime.ts (yang memakai payload.db), modul ini memakai
// Drizzle langsung sehingga tidak bergantung pada Payload. Prioritas resolusi:
//   1. Provider default di tabel ai_providers (api_key didekripsi)
//   2. Provider pertama yang ada
//   3. Fallback env AI_BASE_URL / AI_API_KEY / AI_MODEL

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { aiProviders } from "@/db/schema";
import type { AiConfig } from "@/lib/ai/env";
import { getAiConfig } from "@/lib/ai/env";
import { decryptProviderKey, normalizeModelIds } from "./ai-providers";
import {
  decryptRoleModelKey,
  getRoleModel,
  type AiRole,
} from "./ai-role-models";

export type ResolvedAiConfig = AiConfig & {
  source: "db" | "env";
  providerId?: number;
  providerName?: string;
};

export const resolveAiConfig = async (
  /** Paksa provider tertentu (mis. saat user memilih model di AI Studio). */
  providerId?: number,
): Promise<ResolvedAiConfig | null> => {
  try {
    const rows = providerId
      ? await db
          .select()
          .from(aiProviders)
          .where(eq(aiProviders.id, providerId))
          .limit(1)
      : await db
          .select()
          .from(aiProviders)
          .orderBy(desc(aiProviders.isDefault), desc(aiProviders.updatedAt))
          .limit(1);

    const provider = rows[0];

    if (provider?.baseUrl && provider?.apiKey) {
      const apiKey = decryptProviderKey(provider.apiKey);

      if (apiKey) {
        const activeModels = normalizeModelIds(provider.models);
        const model = provider.defaultModel?.trim() || activeModels[0] || "";

        if (model) {
          return {
            baseUrl: provider.baseUrl.replace(/\/+$/, ""),
            apiKey,
            model,
            source: "db",
            providerId: provider.id,
            providerName: provider.name,
          };
        }
      }
    }
  } catch (error) {
    // DB bermasalah/tabel belum ada: jangan crash, coba fallback env.
    console.error("[v2-admin] gagal resolve provider AI dari DB:", error);
  }

  const envConfig = getAiConfig();
  if (envConfig) return { ...envConfig, source: "env" };

  return null;
};

// Resolusi konfigurasi AI untuk sebuah PERAN tugas (Task 9A). Bila ada role
// model aktif dengan base_url + api_key + model yang lengkap untuk peran itu,
// gunakan; jika tidak, fallback ke resolveAiConfig() umum.
//
// Integrasi ringan: fungsi baru ini TIDAK mengubah pemanggil existing yang
// sudah memakai resolveAiConfig/resolveAiConfigWithModel.
export const resolveAiConfigForRole = async (
  role: AiRole,
): Promise<ResolvedAiConfig | null> => {
  try {
    const row = await getRoleModel(role);

    if (row?.isActive && row.baseUrl && row.apiKey && row.model) {
      const apiKey = decryptRoleModelKey(row.apiKey);
      const model = row.model.trim();

      if (apiKey && model) {
        return {
          baseUrl: row.baseUrl.replace(/\/+$/, ""),
          apiKey,
          model,
          source: "db",
        };
      }
    }
  } catch (error) {
    // Tabel belum ada / DB bermasalah: jangan crash, fallback ke config umum.
    console.error(
      `[v2-admin] gagal resolve role model AI untuk "${role}":`,
      error,
    );
  }

  return resolveAiConfig();
};

// Resolusi dengan override model tertentu (model harus milik provider terkait).
export const resolveAiConfigWithModel = async (
  providerId?: number,
  model?: string,
): Promise<ResolvedAiConfig | null> => {
  const config = await resolveAiConfig(providerId);
  if (!config) return null;
  if (!model || !model.trim()) return config;
  return { ...config, model: model.trim() };
};
