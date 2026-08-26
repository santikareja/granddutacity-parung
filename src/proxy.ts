import { NextResponse, type NextRequest } from "next/server";

// Proteksi rute /v2-admin.
//
// Catatan versi: Next.js di repo ini sudah menandai konvensi `middleware`
// sebagai deprecated dan menggantinya dengan `proxy` (lihat
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
//
// Proxy berjalan di Edge dan bisa di-deploy ke CDN, jadi ia TIDAK boleh
// bergantung pada modul/global bersama. Karena itu di sini kita hanya memeriksa
// KEBERADAAN cookie sesi (cek murah, tanpa DB/crypto Node) dan nama cookie
// ditulis literal alih-alih diimpor dari modul auth. Verifikasi tanda tangan
// token + pengambilan user dilakukan di layout server /v2-admin yang berjalan di
// Node runtime. Dua lapis ini mencegah halaman admin ter-render untuk pengunjung
// anonim, sekaligus memastikan token palsu tetap ditolak di server.
const SESSION_COOKIE = "gdc_v2_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Halaman login harus tetap dapat diakses tanpa sesi.
  if (pathname === "/v2-admin/login") {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/v2-admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/v2-admin", "/v2-admin/((?!login).*)"],
};
