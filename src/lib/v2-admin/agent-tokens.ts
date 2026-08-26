// Repository token API untuk agent eksternal (Task 9B). Server-side only.
//
// KEAMANAN: DB hanya menyimpan HASH SHA-256 dari token. Plaintext token hanya
// dikembalikan SEKALI dari createToken() dan tidak pernah disimpan. `tokenPrefix`
// (12 char pertama) bukan rahasia; hanya untuk identifikasi di UI.

import { createHash, randomBytes } from "crypto";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { agentApiTokens } from "@/db/schema";

const TOKEN_PREFIX_LEN = 12;

export type AgentTokenForClient = {
  id: number;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

const normalizeScopes = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

const toClient = (
  row: typeof agentApiTokens.$inferSelect,
): AgentTokenForClient => ({
  id: row.id,
  name: row.name,
  tokenPrefix: row.tokenPrefix,
  scopes: normalizeScopes(row.scopes),
  isActive: Boolean(row.isActive),
  lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
  expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
});

export const hashToken = (rawToken: string): string =>
  createHash("sha256").update(rawToken, "utf8").digest("hex");

// Token acak: prefix "gdc_" + 32 byte hex (total 68 char). Cukup entropi (256-bit).
export const generateToken = (): {
  token: string;
  tokenHash: string;
  tokenPrefix: string;
} => {
  const token = `gdc_${randomBytes(32).toString("hex")}`;
  return {
    token,
    tokenHash: hashToken(token),
    tokenPrefix: token.slice(0, TOKEN_PREFIX_LEN),
  };
};

export type CreateTokenInput = {
  name: string;
  scopes: string[];
  expiresAt?: string | null;
  createdById?: number | null;
};

// Buat token baru. Mengembalikan plaintext token SEKALI (tidak disimpan) +
// record ForClient (tanpa hash).
export const createToken = async (
  input: CreateTokenInput,
): Promise<{ token: string; record: AgentTokenForClient }> => {
  const name = input.name.trim();
  if (!name) throw new Error("Nama token wajib diisi.");

  const scopes = normalizeScopes(input.scopes);
  if (scopes.length === 0) {
    throw new Error("Minimal satu scope wajib dipilih.");
  }

  let expiresAt: Date | null = null;
  if (input.expiresAt) {
    const parsed = new Date(input.expiresAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Tanggal kedaluwarsa tidak valid.");
    }
    expiresAt = parsed;
  }

  const { token, tokenHash, tokenPrefix } = generateToken();

  const rows = await db
    .insert(agentApiTokens)
    .values({
      name,
      tokenHash,
      tokenPrefix,
      scopes,
      isActive: true,
      expiresAt,
      createdById: input.createdById ?? null,
      updatedAt: new Date(),
    })
    .returning();

  return { token, record: toClient(rows[0]) };
};

// Daftar token (TANPA hash/plaintext). Aman dikirim ke client.
export const listTokensForClient = async (): Promise<AgentTokenForClient[]> => {
  const rows = await db
    .select()
    .from(agentApiTokens)
    .orderBy(desc(agentApiTokens.createdAt));
  return rows.map(toClient);
};

// Cabut token: nonaktifkan + set revokedAt. Idempoten.
export const revokeToken = async (id: number): Promise<boolean> => {
  const rows = await db
    .update(agentApiTokens)
    .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(agentApiTokens.id, id))
    .returning({ id: agentApiTokens.id });
  return rows.length > 0;
};

export type VerifiedAgentToken = { id: number; scopes: string[] };

// Verifikasi token mentah: hash → cari baris aktif & belum dicabut & belum
// kedaluwarsa. Bila valid, update lastUsedAt (best-effort) lalu kembalikan
// {id, scopes}. Selain itu null.
export const verifyAgentToken = async (
  rawToken: string,
): Promise<VerifiedAgentToken | null> => {
  const token = rawToken.trim();
  if (!token) return null;

  const tokenHash = hashToken(token);

  const rows = await db
    .select()
    .from(agentApiTokens)
    .where(
      and(
        eq(agentApiTokens.tokenHash, tokenHash),
        eq(agentApiTokens.isActive, true),
        isNull(agentApiTokens.revokedAt),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Cek kedaluwarsa: null = tak pernah kedaluwarsa; else harus di masa depan.
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  // Update lastUsedAt best-effort — kegagalan tidak boleh menolak request valid.
  try {
    await db
      .update(agentApiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(agentApiTokens.id, row.id));
  } catch (error) {
    console.error("[agent-tokens] gagal update lastUsedAt:", error);
  }

  return { id: row.id, scopes: normalizeScopes(row.scopes) };
};
