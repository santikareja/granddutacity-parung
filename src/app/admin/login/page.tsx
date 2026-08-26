import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Masuk | CMS Grand Duta City Parung",
  robots: { index: false, follow: false },
};

export default async function V2LoginPage() {
  // Sudah login → langsung ke dashboard.
  const user = await getSessionUser();
  if (user) redirect("/admin");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-admin-login-bg px-4 py-12">
      {/* Ambient glow — dekorasi statis, tidak menghalangi konten atau kontras teks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-admin-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-admin-accent/10 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-admin-accent text-base font-bold text-admin-accent-fg shadow-admin-lg">
            GD
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-admin-accent">
            Content Management System
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-admin-login-fg">
            Grand Duta City Parung
          </h1>
          <p className="mt-1.5 text-sm text-admin-login-fg-muted">
            Masuk dengan akun admin Anda.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-admin-lg backdrop-blur-xl">
          <Suspense
            fallback={
              <p className="text-sm text-admin-login-fg-muted">Memuat formulir…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-admin-login-fg-muted/80">
          &copy; 2026 Grand Duta City Parung
        </p>
      </div>
    </main>
  );
}
