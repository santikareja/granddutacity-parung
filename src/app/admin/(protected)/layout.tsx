import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import AdminShell from "./admin-shell";

// Node runtime wajib: verifikasi sesi memakai crypto Node + pool pg.
export const runtime = "nodejs";

// Halaman admin tidak boleh di-cache atau di-prerender: isinya per-sesi.
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lapis kedua setelah proxy: verifikasi tanda tangan token + ambil user
  // dari DB. Proxy hanya memeriksa keberadaan cookie (Edge runtime).
  //
  // Guard ini sengaja dipasang di route group (protected) — BUKAN di
  // admin/layout.tsx induk — supaya /admin/login (yang berada di luar
  // group ini) tidak ikut terjaga dan tidak memicu redirect loop bagi
  // pengunjung anonim.
  const user = await getSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
