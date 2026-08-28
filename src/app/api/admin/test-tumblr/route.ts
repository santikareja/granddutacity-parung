// Endpoint test manual koneksi Tumblr OAuth 1.0a. Dibatasi ke admin.
//
// Panggil (GET) dari sesi admin untuk memverifikasi kredensial sebelum publish
// artikel pertama. Tidak pernah mengembalikan kredensial — hanya nama user &
// daftar blog yang terhubung.

import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/v2-auth/api-guard";
import { verifyTumblrCredentials } from "@/lib/social/tumblr";

// node:crypto (tanda tangan OAuth) → Node runtime wajib.
export const runtime = "nodejs";

export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const result = await verifyTumblrCredentials();

  if (!result.configured) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
