import { NextResponse } from "next/server";

import { requireApiAdmin, apiError } from "@/lib/v2-auth/api-guard";
import {
  createProvider,
  listProvidersForClient,
} from "@/lib/v2-admin/ai-providers";

export const runtime = "nodejs";

// GET /api/v2/ai-providers — daftar provider (api_key SUDAH dimask).
export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    const providers = await listProvidersForClient();
    return NextResponse.json({ providers });
  } catch (error) {
    console.error("[api/v2/ai-providers] GET gagal:", error);
    return apiError("Gagal memuat daftar provider.", 500);
  }
}

type CreateBody = {
  name?: unknown;
  baseUrl?: unknown;
  apiKey?: unknown;
  models?: unknown;
  availableModels?: unknown;
  defaultModel?: unknown;
  isDefault?: unknown;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];

// POST /api/v2/ai-providers — buat provider baru.
export async function POST(request: Request) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return apiError("Body tidak valid.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  if (!name) return apiError("Nama provider wajib diisi.");
  if (!baseUrl) return apiError("Base URL wajib diisi.");
  if (!apiKey) return apiError("API Key wajib diisi.");

  // Validasi Base URL: harus URL absolut https/http agar fetch tidak gagal aneh.
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return apiError("Base URL harus memakai skema http atau https.");
    }
  } catch {
    return apiError("Base URL bukan URL yang valid.");
  }

  try {
    const provider = await createProvider({
      name,
      baseUrl,
      apiKey,
      models: asStringArray(body.models),
      availableModels: asStringArray(body.availableModels),
      defaultModel:
        typeof body.defaultModel === "string" ? body.defaultModel : null,
      isDefault: body.isDefault === true,
    });

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/ai-providers] POST gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal membuat provider.",
      500,
    );
  }
}
