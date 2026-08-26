import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, requireApiMutation } from "@/lib/v2-auth/api-guard";
import { changeOwnPassword } from "@/lib/v2-admin/users";

// PBKDF2 (crypto Node) dipakai untuk hashing → wajib runtime nodejs.
export const runtime = "nodejs";

const bodySchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter."),
});

// PATCH /api/v2/account/password — setiap user login boleh ganti password SENDIRI.
export async function PATCH(request: Request) {
  const guard = await requireApiMutation(request);
  if (!guard.ok) return guard.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Body tidak valid.");
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const result = await changeOwnPassword(
      guard.user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );

    if (!result.ok) {
      return apiError(result.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/v2/account/password] PATCH gagal:", error);
    return apiError("Gagal mengganti password.", 500);
  }
}
