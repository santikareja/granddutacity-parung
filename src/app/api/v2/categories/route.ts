import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiError,
  requireApiAdminMutation,
  requireApiUser,
} from "@/lib/v2-auth/api-guard";
import {
  createCategory,
  listCategoriesWithCount,
} from "@/lib/v2-admin/taxonomy";

export const runtime = "nodejs";

const categoryBodySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi."),
  description: z.string().trim().optional(),
});

// GET /api/v2/categories — daftar kategori beserta jumlah artikel.
export async function GET() {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  try {
    const categories = await listCategoriesWithCount();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[api/v2/categories] GET gagal:", error);
    return apiError("Gagal memuat daftar kategori.", 500);
  }
}

// POST /api/v2/categories — buat kategori baru (admin-only + CSRF).
export async function POST(request: Request) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

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
    const category = await createCategory({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/categories] POST gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal membuat kategori.",
    );
  }
}
