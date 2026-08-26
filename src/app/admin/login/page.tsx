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
    <main className="flex min-h-screen items-center justify-center bg-[#0d1117] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A524]">
            Content Management System
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Grand Duta City Parung
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            Masuk dengan akun admin Anda.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur">
          <Suspense
            fallback={
              <p className="text-sm text-neutral-400">Memuat formulir…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          &copy; 2026 Grand Duta City Parung
        </p>
      </div>
    </main>
  );
}
