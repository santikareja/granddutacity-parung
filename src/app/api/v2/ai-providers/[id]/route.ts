import { NextResponse } from "next/server";

import { requireApiAdmin, apiError } from "@/lib/v2-auth/api-guard";
import {
  deleteProvider,
  getProviderForClient,
  updateProvider,
} from "@/lib/v2-admin/ai-providers";

export const runtime = "nodejs";

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : undefined;

// GET /api/v2/ai-providers/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID provider tidak valid.");

  try {
    const provider = await getProviderForClient(id);
    if (!provider) return apiError("Provider tidak ditemukan.", 404);
    return NextResponse.json({ provider });
  } catch (error) {
    console.error("[api/v2/ai-providers/:id] GET gagal:", error);
    return apiError("Gagal memuat provider.", 500);
  }
}

// PATCH /api/v2/ai-providers/:id — update. Kosongkan apiKey untuk mempertahankan key lama.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID provider tidak valid.");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Body tidak valid.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";

  if (!name) return apiError("Nama provider wajib diisi.");
  if (!baseUrl) return apiError("Base URL wajib diisi.");

  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return apiError("Base URL harus memakai skema http atau https.");
    }
  } catch {
    return apiError("Base URL bukan URL yang valid.");
  }

  try {
    const provider = await updateProvider(id, {
      name,
      baseUrl,
      apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
      models: asStringArray(body.models),
      availableModels: asStringArray(body.availableModels),
      defaultModel:
        typeof body.defaultModel === "string" ? body.defaultModel : null,
      isDefault: body.isDefault === true,
    });

    if (!provider) return apiError("Provider tidak ditemukan.", 404);
    return NextResponse.json({ provider });
  } catch (error) {
    console.error("[api/v2/ai-providers/:id] PATCH gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal memperbarui provider.",
      500,
    );
  }
}

// DELETE /api/v2/ai-providers/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID provider tidak valid.");

  try {
    const removed = await deleteProvider(id);
    if (!removed) return apiError("Provider tidak ditemukan.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/v2/ai-providers/:id] DELETE gagal:", error);
    return apiError("Gagal menghapus provider.", 500);
  }
}
