// Repository model AI per tugas (Task 9A). Server-side only.
//
// Tiap peran ('text' | 'image' | 'scanning') dipetakan ke satu konfigurasi
// provider (base_url, api_key, model). `api_key` disimpan sebagai ciphertext
// AES-256-GCM (format sama seperti ai_providers) dan TIDAK PERNAH dikirim ke
// client — fungsi berakhiran `ForClient` sudah memask key.

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { aiRoleModels } from "@/db/schema";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/ai/crypto";

export const AI_ROLES = ["text", "image", "scanning"] as const;
export type AiRole = (typeof AI_ROLES)[number];

export const isAiRole = (value: unknown): value is AiRole =>
  typeof value === "string" && (AI_ROLES as readonly string[]).includes(value);

export type RoleModelForClient = {
  role: AiRole;
  provider: string;
  baseUrl: string | null;
  apiKeyMasked: string;
  model: string | null;
  isActive: boolean;
  updatedAt: string;
};

const toClient = (
  row: typeof aiRoleModels.$inferSelect,
): RoleModelForClient => ({
  role: row.role as AiRole,
  provider: row.provider,
  baseUrl: row.baseUrl,
  apiKeyMasked: maskSecret(row.apiKey),
  model: row.model,
  isActive: Boolean(row.isActive),
  updatedAt: row.updatedAt.toISOString(),
});

// Daftar semua role model (api_key SUDAH dimask). Aman dikirim ke client.
export const listRoleModelsForClient = async (): Promise<
  RoleModelForClient[]
> => {
  const rows = await db
    .select()
    .from(aiRoleModels)
    .orderBy(asc(aiRoleModels.role));
  return rows.map(toClient);
};

// Ambil baris mentah (termasuk ciphertext) untuk sebuah role. HANYA server.
export const getRoleModel = async (
  role: AiRole,
): Promise<typeof aiRoleModels.$inferSelect | null> => {
  const rows = await db
    .select()
    .from(aiRoleModels)
    .where(eq(aiRoleModels.role, role))
    .limit(1);
  return rows[0] ?? null;
};

// Dekripsi api_key sebuah role model. String kosong bila gagal (mis. secret
// berubah) agar pemanggil bisa fallback dengan jelas.
export const decryptRoleModelKey = (cipher: string): string => {
  try {
    const plain = decryptSecret(cipher);
    return plain.startsWith("••") ? "" : plain;
  } catch {
    return "";
  }
};

export type RoleModelInput = {
  role: AiRole;
  baseUrl?: string | null;
  /** Plaintext. Kosong/mask saat update = pertahankan key lama. */
  apiKey?: string;
  model?: string | null;
  isActive?: boolean;
};

// Upsert by role: bila role sudah ada → update, else insert.
// Mengikuti pola updateProvider: key hanya ditimpa bila user mengirim key baru
// yang bukan nilai mask.
export const upsertRoleModel = async (
  input: RoleModelInput,
): Promise<RoleModelForClient> => {
  const existing = await getRoleModel(input.role);

  const baseUrl = input.baseUrl?.trim().replace(/\/+$/, "") || null;
  const model = input.model?.trim() || null;
  const isActive = input.isActive ?? true;

  const shouldReplaceKey =
    typeof input.apiKey === "string" &&
    input.apiKey.trim().length > 0 &&
    !input.apiKey.trim().startsWith("••");

  if (existing) {
    const rows = await db
      .update(aiRoleModels)
      .set({
        baseUrl,
        model,
        isActive,
        ...(shouldReplaceKey
          ? { apiKey: encryptSecret((input.apiKey as string).trim()) }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(aiRoleModels.role, input.role))
      .returning();
    return toClient(rows[0]);
  }

  // Insert baru wajib punya api_key (kolom NOT NULL).
  if (!shouldReplaceKey) {
    throw new Error("API Key wajib diisi saat membuat role model baru.");
  }

  const rows = await db
    .insert(aiRoleModels)
    .values({
      role: input.role,
      provider: "openai_compatible",
      apiKey: encryptSecret((input.apiKey as string).trim()),
      baseUrl,
      model,
      isActive,
      updatedAt: new Date(),
    })
    .returning();
  return toClient(rows[0]);
};

export const deleteRoleModel = async (role: AiRole): Promise<boolean> => {
  const rows = await db
    .delete(aiRoleModels)
    .where(eq(aiRoleModels.role, role))
    .returning({ id: aiRoleModels.id });
  return rows.length > 0;
};
