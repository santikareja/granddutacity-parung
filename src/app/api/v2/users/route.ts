import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiError,
  requireApiAdmin,
  requireApiAdminMutation,
} from "@/lib/v2-auth/api-guard";
import { createUser, listUsers } from "@/lib/v2-admin/users";

// PBKDF2 (crypto Node) dipakai untuk hashing → wajib runtime nodejs.
export const runtime = "nodejs";

// ANTI-ESKALASI: pembuatan & daftar user HANYA admin. Role "ai-agent" tidak
// boleh pernah lolos guard ini, dan tidak ada jalur untuk mengubah role diri
// sendiri (role hanya ditetapkan admin saat createUser).
const createBodySchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi."),
  // Format email divalidasi & dinormalisasi (trim + lowercase) di createUser
  // agar aturannya satu sumber; di sini cukup pastikan tidak kosong.
  email: z.string().trim().min(1, "Email wajib diisi."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  role: z.enum(["admin", "ai-agent"]),
});

// GET /api/v2/users — daftar user (admin-only). Tidak pernah menyertakan salt/hash.
export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[api/v2/users] GET gagal:", error);
    return apiError("Gagal memuat daftar pengguna.", 500);
  }
}

// POST /api/v2/users — buat user baru (admin-only + CSRF).
export async function POST(request: Request) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Body tidak valid.");
  }

  const parsed = createBodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const user = await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/users] POST gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal membuat pengguna.",
    );
  }
}
