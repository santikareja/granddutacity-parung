import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiError,
  requireApiAdminMutation,
  requireApiUser,
} from "@/lib/v2-auth/api-guard";
import { createTag, listTagsWithCount } from "@/lib/v2-admin/taxonomy";

export const runtime = "nodejs";

const tagBodySchema = z.object({
  name: z.string().trim().min(1, "Nama tag wajib diisi."),
});

// GET /api/v2/tags — daftar tag beserta jumlah artikel.
export async function GET() {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  try {
    const tags = await listTagsWithCount();
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[api/v2/tags] GET gagal:", error);
    return apiError("Gagal memuat daftar tag.", 500);
  }
}

// POST /api/v2/tags — buat tag baru (admin-only + CSRF).
export async function POST(request: Request) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

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
    const tag = await createTag({ name: parsed.data.name });
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/tags] POST gagal:", error);
    return apiError(error instanceof Error ? error.message : "Gagal membuat tag.");
  }
}
