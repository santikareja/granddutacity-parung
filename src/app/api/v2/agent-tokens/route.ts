import { NextResponse } from "next/server";

import { apiError, requireApiAdmin, requireApiAdminMutation } from "@/lib/v2-auth/api-guard";
import { createToken, listTokensForClient } from "@/lib/v2-admin/agent-tokens";

// crypto (SHA-256 / randomBytes) butuh Node runtime.
export const runtime = "nodejs";

// Scope yang dikenal sistem. Membatasi input agar tidak ada scope typo/liar.
const KNOWN_SCOPES = ["articles:write"] as const;

// GET /api/v2/agent-tokens — daftar token (TANPA hash/plaintext).
export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    const tokens = await listTokensForClient();
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("[api/v2/agent-tokens] GET gagal:", error);
    return apiError("Gagal memuat daftar token.", 500);
  }
}

type CreateBody = {
  name?: unknown;
  scopes?: unknown;
  expiresAt?: unknown;
};

const asScopes = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (v): v is string =>
          typeof v === "string" &&
          (KNOWN_SCOPES as readonly string[]).includes(v),
      )
    : [];

// POST /api/v2/agent-tokens — buat token. Membalas plaintext token SEKALI + record.
export async function POST(request: Request) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return apiError("Body tidak valid.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return apiError("Nama token wajib diisi.");

  const scopes = asScopes(body.scopes);
  if (scopes.length === 0) {
    return apiError(
      `Minimal satu scope valid wajib dipilih (${KNOWN_SCOPES.join(", ")}).`,
    );
  }

  try {
    const { token, record } = await createToken({
      name,
      scopes,
      expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : null,
      createdById: guard.user.id,
    });

    // `token` plaintext dikirim SEKALI di sini — tidak pernah bisa diambil lagi.
    return NextResponse.json({ token, record }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/agent-tokens] POST gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal membuat token.",
      500,
    );
  }
}
