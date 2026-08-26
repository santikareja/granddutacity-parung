import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, requireApiAdminMutation } from "@/lib/v2-auth/api-guard";
import { deleteTag, updateTag } from "@/lib/v2-admin/taxonomy";

export const runtime = "nodejs";

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const tagBodySchema = z.object({
  name: z.string().trim().min(1, "Nama tag wajib diisi."),
});

// PATCH /api/v2/tags/:id — ubah tag (admin-only + CSRF).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID tag tidak valid.");

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Body tidak valid.");
  }

  const parsed = tagBodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const tag = await updateTag(id, { name: parsed.data.name });
    if (!tag) return apiError("Tag tidak ditemukan.", 404);
    return NextResponse.json({ tag });
  } catch (error) {
    console.error("[api/v2/tags/:id] PATCH gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal memperbarui tag.",
    );
  }
}

// DELETE /api/v2/tags/:id — hapus tag (admin-only + CSRF).
// Ditolak (409) bila masih dipakai artikel.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID tag tidak valid.");

  try {
    const removed = await deleteTag(id);
    if (!removed) return apiError("Tag tidak ditemukan.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && /masih dipakai/i.test(error.message)) {
      return apiError(error.message, 409);
    }
    console.error("[api/v2/tags/:id] DELETE gagal:", error);
    return apiError("Gagal menghapus tag.", 500);
  }
}
