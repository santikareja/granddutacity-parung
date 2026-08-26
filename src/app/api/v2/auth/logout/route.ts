import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/v2-auth/auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  // Hapus cookie sesi.
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
