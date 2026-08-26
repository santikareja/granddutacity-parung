import { NextResponse } from "next/server";

import { apiError, requireApiAdmin, requireApiAdminMutation } from "@/lib/v2-auth/api-guard";
import {
  isAiRole,
  listRoleModelsForClient,
  upsertRoleModel,
} from "@/lib/v2-admin/ai-role-models";

// crypto (AES-256-GCM) butuh Node runtime.
export const runtime = "nodejs";

// GET /api/v2/ai/role-models — daftar role model (api_key SUDAH dimask).
export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    const roleModels = await listRoleModelsForClient();
    return NextResponse.json({ roleModels });
  } catch (error) {
    console.error("[api/v2/ai/role-models] GET gagal:", error);
    return apiError("Gagal memuat daftar role model.", 500);
  }
}

type UpsertBody = {
  role?: unknown;
  baseUrl?: unknown;
  apiKey?: unknown;
  model?: unknown;
  isActive?: unknown;
};

// Upsert by role. PUT & POST berbagi handler karena semantik upsert.
const handleUpsert = async (request: Request) => {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  let body: UpsertBody;
  try {
    body = (await request.json()) as UpsertBody;
  } catch {
    return apiError("Body tidak valid.");
  }

  if (!isAiRole(body.role)) {
    return apiError("Role harus salah satu dari: text, image, scanning.");
  }

  const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";

  // Validasi Base URL bila diisi.
  if (baseUrl) {
    try {
      const parsed = new URL(baseUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return apiError("Base URL harus memakai skema http atau https.");
      }
    } catch {
      return apiError("Base URL bukan URL yang valid.");
    }
  }

  try {
    const roleModel = await upsertRoleModel({
      role: body.role,
      baseUrl: baseUrl || null,
      apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
      model: typeof body.model === "string" ? body.model : null,
      isActive: body.isActive === undefined ? undefined : body.isActive === true,
    });
    return NextResponse.json({ roleModel });
  } catch (error) {
    console.error("[api/v2/ai/role-models] upsert gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal menyimpan role model.",
      500,
    );
  }
};

export const PUT = handleUpsert;
export const POST = handleUpsert;
