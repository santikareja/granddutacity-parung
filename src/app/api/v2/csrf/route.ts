import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/v2-auth/api-guard";
import { issueCsrfToken } from "@/lib/v2-admin/csrf";

// Node runtime wajib: penerbitan token memakai crypto Node + verifikasi sesi.
export const runtime = "nodejs";

// GET /api/v2/csrf — kembalikan token CSRF untuk user yang sedang login.
// Klien memanggil ini sekali lalu menyertakan token pada header x-csrf-token di
// setiap request mutasi.
export async function GET() {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  return NextResponse.json({ csrfToken: issueCsrfToken(guard.user.id) });
}
