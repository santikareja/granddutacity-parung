// Guard autentikasi untuk route API v2. Server-side only (Node runtime).
//
// Semua endpoint /api/v2/* yang menyentuh data atau kredensial WAJIB memanggil
// requireApiUser() di baris pertama handler-nya.

import { NextResponse } from "next/server";

import { verifyCsrf } from "@/lib/v2-admin/csrf";
import { observeOperationalEvent } from "@/lib/v2-admin/observability";
import type { SessionUser } from "./auth";
import { getSessionUser } from "./session";

export type ApiGuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

export const requireApiUser = async (): Promise<ApiGuardResult> => {
  const user = await getSessionUser();

  if (!user) {
    // Observabilitas best-effort (indikasi ringan, per-instance).
    observeOperationalEvent({ status: 401, action: "auth" });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Tidak terautentikasi." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, user };
};

// Operasi sensitif (kredensial, hapus data) dibatasi ke role admin.
export const requireApiAdmin = async (): Promise<ApiGuardResult> => {
  const result = await requireApiUser();
  if (!result.ok) return result;

  if (result.user.role !== "admin") {
    observeOperationalEvent({ status: 403, action: "auth" });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Butuh hak akses admin." },
        { status: 403 },
      ),
    };
  }

  return result;
};

// Guard untuk endpoint MUTASI (POST/PATCH/PUT/DELETE): requireApiUser + CSRF.
// Butuh `request` untuk membaca header x-csrf-token dan Origin. requireApiUser
// yang lama sengaja tidak diubah karena dipakai oleh handler GET.
export const requireApiMutation = async (
  request: Request,
): Promise<ApiGuardResult> => {
  const result = await requireApiUser();
  if (!result.ok) return result;

  if (!verifyCsrf(request, result.user.id)) {
    observeOperationalEvent({ status: 403, action: "auth" });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "CSRF tidak valid." },
        { status: 403 },
      ),
    };
  }

  return result;
};

// Varian mutasi yang juga mensyaratkan role admin.
export const requireApiAdminMutation = async (
  request: Request,
): Promise<ApiGuardResult> => {
  const result = await requireApiAdmin();
  if (!result.ok) return result;

  if (!verifyCsrf(request, result.user.id)) {
    observeOperationalEvent({ status: 403, action: "auth" });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "CSRF tidak valid." },
        { status: 403 },
      ),
    };
  }

  return result;
};

export const apiError = (message: string, status = 400): NextResponse =>
  NextResponse.json({ error: message }, { status });
