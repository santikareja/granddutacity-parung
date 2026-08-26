import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  authenticateUser,
  createSessionToken,
} from "@/lib/v2-auth/auth";
import { checkRateLimit } from "@/lib/v2-admin/rate-limit";

// Node runtime wajib: pbkdf2 & pool pg tidak tersedia di Edge.
export const runtime = "nodejs";

// Rate limit sederhana per-IP untuk menahan brute force. Memakai rate limiter
// bersama (in-memory per instance) — cukup sebagai pertahanan lapis pertama,
// bukan pengganti WAF.
const ATTEMPT_LIMIT = 8;
const ATTEMPT_WINDOW_MS = 5 * 60_000;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const rate = checkRateLimit(`login:${ip}`, {
    limit: ATTEMPT_LIMIT,
    windowMs: ATTEMPT_WINDOW_MS,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi beberapa menit." },
      { status: 429 },
    );
  }

  let email = "";
  let password = "";

  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
    email = typeof body.email === "string" ? body.email : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const user = await authenticateUser(email, password);

    // Pesan error sengaja generik: jangan bocorkan apakah email terdaftar.
    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken(user.id),
      SESSION_COOKIE_OPTIONS,
    );

    return response;
  } catch (error) {
    console.error("[v2-admin/login] gagal:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat login." },
      { status: 500 },
    );
  }
}
