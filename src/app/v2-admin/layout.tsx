import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import AdminShell from "./admin-shell";

// Node runtime wajib: verifikasi sesi memakai crypto Node + pool pg.
export const runtime = "nodejs";

// Halaman admin tidak boleh di-cache atau di-prerender: isinya per-sesi.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS Grand Duta City Parung",
  description: "Content Management System Grand Duta City Parung",
  robots: { index: false, follow: false },
};

export default async function V2AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lapis kedua setelah middleware: verifikasi tanda tangan token + ambil user
  // dari DB. Middleware hanya memeriksa keberadaan cookie (Edge runtime).
  const user = await getSessionUser();

  if (!user) {
    redirect("/v2-admin/login");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
