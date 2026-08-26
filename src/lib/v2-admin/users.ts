// Operasi baca/tulis akun & user untuk CMS kustom.
// Server-side only (Node runtime) — dipanggil dari route /api/v2 dan halaman
// server v2-admin. Modul ini memakai crypto Node (PBKDF2) untuk hashing.
//
// ATURAN KEAMANAN:
//   - salt/hash TIDAK PERNAH ikut di-select untuk dikirim ke client. Kolom itu
//     hanya dibaca secara internal (changeOwnPassword) dan tak pernah direturn.
//   - Hash password baru WAJIB pakai createPasswordHash (PBKDF2 25000/512/sha256,
//     kompatibel Payload) — JANGAN bcrypt — agar akun tetap bisa login lintas panel.
//   - Pembuatan/pengelolaan user & role adalah operasi admin; enforcement ada di
//     guard route (requireApiAdmin*). Repo ini hanya validasi data.

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createPasswordHash, verifyPassword } from "@/lib/v2-auth/auth";

export type UserRole = "admin" | "ai-agent";

export type UserListItem = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

export type CreatedUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

const MIN_PASSWORD_LENGTH = 8;
const VALID_ROLES: readonly UserRole[] = ["admin", "ai-agent"];

// Validasi email sederhana (bukan RFC lengkap): satu '@', ada domain berdot,
// tanpa spasi. Cukup untuk mencegah typo kasar; keunikan ditegakkan DB.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_DUPLICATE_MSG = "Email sudah dipakai.";

// Postgres melempar error dengan .code = '23505' saat unique constraint dilanggar.
const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === "23505";

const normalizeRole = (role: string): UserRole => {
  if (!VALID_ROLES.includes(role as UserRole)) {
    throw new Error("Role tidak valid.");
  }
  return role as UserRole;
};

// Daftar user. TIDAK pernah select salt/hash. Urut berdasarkan nama.
export const listUsers = async (): Promise<UserListItem[]> => {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: (row.role ?? "admin") as UserRole,
    createdAt: row.createdAt,
  }));
};

// Buat user baru (operasi admin). Mengembalikan data aman tanpa salt/hash.
export const createUser = async (
  input: CreateUserInput,
): Promise<CreatedUser> => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role = normalizeRole(input.role);

  if (!name) {
    throw new Error("Nama wajib diisi.");
  }
  if (!EMAIL_RE.test(email)) {
    throw new Error("Format email tidak valid.");
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(EMAIL_DUPLICATE_MSG);
  }

  const { salt, hash } = await createPasswordHash(input.password);

  try {
    const rows = await db
      .insert(users)
      .values({ name, email, role, salt, hash, updatedAt: new Date() })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    const created = rows[0];
    return {
      id: created.id,
      name: created.name,
      email: created.email,
      role: (created.role ?? "admin") as UserRole,
    };
  } catch (error) {
    // Menangkap race di mana dua request menyisipkan email sama bersamaan.
    if (isUniqueViolation(error)) throw new Error(EMAIL_DUPLICATE_MSG);
    throw error;
  }
};

// Ganti password milik sendiri: verifikasi password lama sebelum menyetel baru.
// salt/hash hanya dibaca internal dan tidak pernah keluar dari fungsi ini.
export const changeOwnPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> => {
  const rows = await db
    .select({ salt: users.salt, hash: users.hash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user) {
    return { ok: false, error: "Pengguna tidak ditemukan." };
  }

  const valid = await verifyPassword(currentPassword, user.salt, user.hash);
  if (!valid) {
    return { ok: false, error: "Password saat ini salah." };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    };
  }

  const { salt, hash } = await createPasswordHash(newPassword);

  await db
    .update(users)
    .set({ salt, hash, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { ok: true };
};
