// Autentikasi untuk CMS kustom (v2-admin). Server-side only.
//
// Sengaja KOMPATIBEL dengan skema auth Payload agar akun admin yang sudah ada
// tetap bisa login tanpa reset password:
//   - Payload menyimpan `salt` + `hash` di tabel users
//   - hash = pbkdf2(password, salt, 25000, 512, 'sha256') dalam hex
// Verifikasi memakai perbandingan waktu-konstan untuk mencegah timing attack.
//
// Sesi TIDAK memakai tabel users_sessions milik Payload: kita pakai cookie
// bertanda tangan (HMAC-SHA256 dengan PAYLOAD_SECRET) yang stateless, sehingga
// tidak mengganggu sesi Payload dan tidak butuh tabel baru.

import { createHmac, pbkdf2, randomBytes, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

const PBKDF2_ITERATIONS = 25_000;
const PBKDF2_KEYLEN = 512;
const PBKDF2_DIGEST = "sha256";

export const SESSION_COOKIE = "gdc_v2_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 jam

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "ai-agent";
};

const getSecret = (): string => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret || secret.length < 8) {
    throw new Error(
      "PAYLOAD_SECRET wajib diset dan cukup panjang untuk menandatangani sesi v2-admin.",
    );
  }
  return secret;
};

const pbkdf2Async = (password: string, salt: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    pbkdf2(
      password,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST,
      (err, derived) => (err ? reject(err) : resolve(derived)),
    );
  });

// Verifikasi password terhadap salt+hash gaya Payload.
export const verifyPassword = async (
  password: string,
  salt: string | null,
  expectedHashHex: string | null,
): Promise<boolean> => {
  if (!salt || !expectedHashHex) return false;

  const derived = await pbkdf2Async(password, salt);
  const expected = Buffer.from(expectedHashHex, "hex");

  // Panjang berbeda => pasti tidak cocok; timingSafeEqual melempar bila beda panjang.
  if (derived.length !== expected.length) return false;

  return timingSafeEqual(derived, expected);
};

// Buat hash baru bergaya Payload (dipakai bila CMS kustom mengubah password).
export const createPasswordHash = async (
  password: string,
): Promise<{ salt: string; hash: string }> => {
  const salt = randomBytes(32).toString("hex");
  const derived = await pbkdf2Async(password, salt);
  return { salt, hash: derived.toString("hex") };
};

// ---------------------------------------------------------------------------
// Token sesi: "<userId>.<expiresAtMs>.<hmac>"
// ---------------------------------------------------------------------------

const signPayload = (payload: string): string =>
  createHmac("sha256", getSecret()).update(payload).digest("hex");

export const createSessionToken = (userId: number): string => {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
};

export const verifySessionToken = (token: string): number | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userIdRaw, expiresAtRaw, signature] = parts;
  const payload = `${userIdRaw}.${expiresAtRaw}`;

  let expectedSig: string;
  try {
    expectedSig = signPayload(payload);
  } catch {
    return null;
  }

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  const userId = Number(userIdRaw);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

// ---------------------------------------------------------------------------
// Operasi user
// ---------------------------------------------------------------------------

export const authenticateUser = async (
  email: string,
  password: string,
): Promise<SessionUser | null> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      salt: users.salt,
      hash: users.hash,
      lockUntil: users.lockUntil,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  // Hormati lock akun milik Payload bila ada.
  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) return null;

  const valid = await verifyPassword(password, user.salt, user.hash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: (user.role ?? "admin") as SessionUser["role"],
  };
};

export const getUserById = async (id: number): Promise<SessionUser | null> => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: (user.role ?? "admin") as SessionUser["role"],
  };
};
