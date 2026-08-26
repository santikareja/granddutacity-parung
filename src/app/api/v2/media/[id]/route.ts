import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiError,
  requireApiAdminMutation,
  requireApiMutation,
} from "@/lib/v2-auth/api-guard";
import { deleteMedia, updateMedia } from "@/lib/v2-admin/media";

export const runtime = "nodejs";

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const updateBodySchema = z
  .object({
    alt: z.string().trim().min(1, "Alt text tidak boleh kosong."),
    caption: z.string().trim().nullish(),
    name: z.string().trim().nullish(),
  })
  .partial()
  .refine(
    (data) =>
      data.alt !== undefined ||
      data.caption !== undefined ||
      data.name !== undefined,
    { message: "Tidak ada perubahan yang dikirim." },
  );

// PATCH /api/v2/media/:id — ubah metadata media (user login + CSRF).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiMutation(request);
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID media tidak valid.");

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Body tidak valid.");
  }

  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const media = await updateMedia(id, {
      alt: parsed.data.alt,
      // caption/name diteruskan apa adanya: undefined = tidak diubah,
      // null/"" = dikosongkan (updateMedia menormalkan "" menjadi null).
      caption: parsed.data.caption,
      name: parsed.data.name,
    });
    if (!media) return apiError("Media tidak ditemukan.", 404);
    return NextResponse.json({ media });
  } catch (error) {
    console.error("[api/v2/media/:id] PATCH gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal memperbarui media.",
      500,
    );
  }
}

// DELETE /api/v2/media/:id — hapus media + aset Cloudinary (admin-only + CSRF).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID media tidak valid.");

  try {
    const removed = await deleteMedia(id);
    if (!removed) return apiError("Media tidak ditemukan.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/v2/media/:id] DELETE gagal:", error);
    return apiError("Gagal menghapus media.", 500);
  }
}
