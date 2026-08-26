import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, requireApiAdminMutation } from "@/lib/v2-auth/api-guard";
import { deleteCategory, updateCategory } from "@/lib/v2-admin/taxonomy";

export const runtime = "nodejs";

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const categoryBodySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi."),
  description: z.string().trim().optional(),
});

// PATCH /api/v2/categories/:id — ubah kategori (admin-only + CSRF).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID kategori tidak valid.");

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Body tidak valid.");
  }

  const parsed = categoryBodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const category = await updateCategory(id, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    });
    if (!category) return apiError("Kategori tidak ditemukan.", 404);
    return NextResponse.json({ category });
  } catch (error) {
    console.error("[api/v2/categories/:id] PATCH gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal memperbarui kategori.",
    );
  }
}

// DELETE /api/v2/categories/:id — hapus kategori (admin-only + CSRF).
// Ditolak (409) bila masih dipakai artikel.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID kategori tidak valid.");

  try {
    const removed = await deleteCategory(id);
    if (!removed) return apiError("Kategori tidak ditemukan.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && /masih dipakai/i.test(error.message)) {
      return apiError(error.message, 409);
    }
    console.error("[api/v2/categories/:id] DELETE gagal:", error);
    return apiError("Gagal menghapus kategori.", 500);
  }
}
