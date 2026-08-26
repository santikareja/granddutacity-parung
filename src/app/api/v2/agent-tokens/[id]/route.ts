import { NextResponse } from "next/server";

import { apiError, requireApiAdminMutation } from "@/lib/v2-auth/api-guard";
import { revokeToken } from "@/lib/v2-admin/agent-tokens";

export const runtime = "nodejs";

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Mencabut token: DELETE dan PATCH sama-sama memanggil revokeToken (soft revoke,
// bukan hapus baris — jejak audit tetap ada).
const handleRevoke = async (
  request: Request,
  params: Promise<{ id: string }>,
) => {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID token tidak valid.");

  try {
    const revoked = await revokeToken(id);
    if (!revoked) return apiError("Token tidak ditemukan.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/v2/agent-tokens/:id] revoke gagal:", error);
    return apiError("Gagal mencabut token.", 500);
  }
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRevoke(request, params);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRevoke(request, params);
}
