// Guard autentikasi untuk route API v2. Server-side only (Node runtime).
//
// Semua endpoint /api/v2/* yang menyentuh data atau kredensial WAJIB memanggil
// requireApiUser() di baris pertama handler-nya.

import { NextResponse } from "next/server";

import type { SessionUser } from "./auth";
import { getSessionUser } from "./session";

export type ApiGuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

export const requireApiUser = async (): Promise<ApiGuardResult> => {
  const user = await getSessionUser();

  if (!user) {
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

export const apiError = (message: string, status = 400): NextResponse =>
  NextResponse.json({ error: message }, { status });
