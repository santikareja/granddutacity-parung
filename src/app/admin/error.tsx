"use client";

// Error boundary untuk seluruh area /admin.
//
// Tanpa file ini, error render apa pun di panel admin naik sampai ke error
// boundary bawaan Next.js ("This page couldn't load") yang mengganti seluruh
// dokumen — tanpa CSS panel, tanpa navigasi, dan tanpa keterangan penyebab.
// Itu membuat satu nilai data menyimpang bisa menutup akses ke satu halaman CMS
// sepenuhnya. Boundary ini menjaga error tetap lokal dan bisa dibaca.
//
// Catatan: error dari Client Component membawa pesan aslinya, sedangkan error
// dari Server Component hanya membawa `digest` untuk dicocokkan dengan log
// server. Keduanya ditampilkan bila tersedia.

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

import { AdminButton } from "@/components/admin/ui";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[admin] Gagal merender halaman:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-admin-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin-danger-soft text-admin-danger">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-admin-fg">
          Halaman ini gagal dimuat
        </h1>
        <p className="mt-1.5 text-sm text-admin-fg-muted">
          Terjadi kesalahan saat menampilkan halaman. Data Anda tidak terhapus.
          Coba muat ulang; bila tetap gagal, catat detail di bawah.
        </p>

        {error.message ? (
          <p className="mt-4 rounded-lg border border-admin-border bg-admin-surface-muted px-3 py-2 font-mono text-xs break-words text-admin-fg-dim">
            {error.message}
          </p>
        ) : null}

        {error.digest ? (
          <p className="mt-2 font-mono text-[11px] text-admin-fg-dim">
            digest: {error.digest}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <AdminButton variant="primary" onClick={() => retry()}>
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </AdminButton>
          <AdminButton variant="secondary" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
