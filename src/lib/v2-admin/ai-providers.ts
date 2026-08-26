// Repository provider AI untuk CMS kustom. Server-side only.
//
// Menggantikan collection Payload `ai-providers` dengan query Drizzle langsung,
// tetapi memakai TABEL YANG SAMA (`ai_providers`) dan format ciphertext yang sama
// (AES-256-GCM di src/lib/ai/crypto.ts), sehingga provider yang sudah tersimpan
// tetap terbaca dan Payload/v2-admin bisa hidup berdampingan selama transisi.
//
// ATURAN KEAMANAN: fungsi yang namanya berakhiran `ForClient` sudah memask
// api_key. JANGAN pernah mengirim hasil `getProviderWithSecret` ke client.

import { desc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { aiProviders } from "@/db/schema";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/ai/crypto";

export type ProviderForClient = {
  id: number;
  name: string;
  baseUrl: string;
  apiKeyMasked: string;
  availableModels: string[];
  models: string[];
  defaultModel: string | null;
  isDefault: boolean;
  updatedAt: string;
};

// Normalisasi kolom jsonb `models`/`available_models` menjadi array Model ID.
// Menerima bentuk lama `{ modelId }[]` (dari era collection Payload) agar data
// yang sudah tersimpan tetap valid.
export const normalizeModelIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "modelId" in item) {
        const id = (item as { modelId?: unknown }).modelId;
        return typeof id === "string" ? id.trim() : "";
      }
      return "";
    })
    .filter((id) => id.length > 0);
};

const toClient = (row: typeof aiProviders.$inferSelect): ProviderForClient => ({
  id: row.id,
  name: row.name,
  baseUrl: row.baseUrl,
  apiKeyMasked: maskSecret(row.apiKey),
  availableModels: normalizeModelIds(row.availableModels),
  models: normalizeModelIds(row.models),
  defaultModel: row.defaultModel,
  isDefault: Boolean(row.isDefault),
  updatedAt: row.updatedAt.toISOString(),
});

export const listProvidersForClient = async (): Promise<ProviderForClient[]> => {
  const rows = await db
    .select()
    .from(aiProviders)
    .orderBy(desc(aiProviders.isDefault), desc(aiProviders.updatedAt));
  return rows.map(toClient);
};

export const getProviderForClient = async (
  id: number,
): Promise<ProviderForClient | null> => {
  const rows = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.id, id))
    .limit(1);
  return rows[0] ? toClient(rows[0]) : null;
};

// Ambil baris mentah termasuk ciphertext. HANYA untuk pemakaian server.
export const getProviderWithSecret = async (
  id: number,
): Promise<typeof aiProviders.$inferSelect | null> => {
  const rows = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.id, id))
    .limit(1);
  return rows[0] ?? null;
};

// Dekripsi api_key sebuah provider. Mengembalikan string kosong bila gagal
// (mis. PAYLOAD_SECRET berubah) agar pemanggil bisa menampilkan pesan jelas.
export const decryptProviderKey = (cipher: string): string => {
  try {
    const plain = decryptSecret(cipher);
    // Jaga-jaga bila ada baris lama yang sempat tersimpan dalam bentuk mask.
    return plain.startsWith("••") ? "" : plain;
  } catch {
    return "";
  }
};

// Pastikan hanya satu provider berstatus default.
const clearOtherDefaults = async (keepId: number): Promise<void> => {
  await db
    .update(aiProviders)
    .set({ isDefault: false })
    .where(ne(aiProviders.id, keepId));
};

export type ProviderInput = {
  name: string;
  baseUrl: string;
  /** Plaintext. Kosong/undefined saat update = pertahankan key lama. */
  apiKey?: string;
  models?: string[];
  availableModels?: string[];
  defaultModel?: string | null;
  isDefault?: boolean;
};

export const createProvider = async (
  input: ProviderInput,
): Promise<ProviderForClient> => {
  if (!input.apiKey || input.apiKey.trim().length === 0) {
    throw new Error("API Key wajib diisi saat membuat provider baru.");
  }

  const rows = await db
    .insert(aiProviders)
    .values({
      name: input.name.trim(),
      baseUrl: input.baseUrl.trim().replace(/\/+$/, ""),
      apiKey: encryptSecret(input.apiKey.trim()),
      models: input.models ?? [],
      availableModels: input.availableModels ?? [],
      defaultModel: input.defaultModel?.trim() || input.models?.[0] || null,
      isDefault: input.isDefault ?? false,
      updatedAt: new Date(),
    })
    .returning();

  const created = rows[0];
  if (input.isDefault) await clearOtherDefaults(created.id);

  return toClient(created);
};

export const updateProvider = async (
  id: number,
  input: ProviderInput,
): Promise<ProviderForClient | null> => {
  const existing = await getProviderWithSecret(id);
  if (!existing) return null;

  // API key hanya ditimpa bila user benar-benar mengirim key baru.
  // Nilai mask dari UI TIDAK boleh dienkripsi ulang — itu akan merusak key asli.
  const shouldReplaceKey =
    typeof input.apiKey === "string" &&
    input.apiKey.trim().length > 0 &&
    !input.apiKey.trim().startsWith("••");

  const rows = await db
    .update(aiProviders)
    .set({
      name: input.name.trim(),
      baseUrl: input.baseUrl.trim().replace(/\/+$/, ""),
      ...(shouldReplaceKey
        ? { apiKey: encryptSecret((input.apiKey as string).trim()) }
        : {}),
      ...(input.models ? { models: input.models } : {}),
      ...(input.availableModels
        ? { availableModels: input.availableModels }
        : {}),
      defaultModel: input.defaultModel?.trim() || null,
      isDefault: input.isDefault ?? false,
      updatedAt: new Date(),
    })
    .where(eq(aiProviders.id, id))
    .returning();

  const updated = rows[0];
  if (!updated) return null;

  if (input.isDefault) await clearOtherDefaults(id);

  return toClient(updated);
};

export const deleteProvider = async (id: number): Promise<boolean> => {
  const rows = await db
    .delete(aiProviders)
    .where(eq(aiProviders.id, id))
    .returning({ id: aiProviders.id });
  return rows.length > 0;
};
