import { NextResponse } from "next/server";

import { apiError, requireApiAdminMutation } from "@/lib/v2-auth/api-guard";
import { deleteRoleModel, isAiRole } from "@/lib/v2-admin/ai-role-models";

export const runtime = "nodejs";

// DELETE /api/v2/ai/role-models/:role — hapus konfigurasi role model.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ role: string }> },
) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  const { role } = await params;
  if (!isAiRole(role)) {
    return apiError("Role harus salah satu dari: text, image, scanning.");
  }

  try {
    const removed = await deleteRoleModel(role);
    if (!removed) return apiError("Role model tidak ditemukan.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/v2/ai/role-models/:role] DELETE gagal:", error);
    return apiError("Gagal menghapus role model.", 500);
  }
}
