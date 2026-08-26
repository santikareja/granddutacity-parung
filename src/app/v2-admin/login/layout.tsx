import type { Metadata } from "next";

// Layout login sengaja terpisah (route group tidak dipakai agar URL tetap
// /v2-admin/login) — halaman ini tidak boleh memakai shell sidebar yang
// mensyaratkan sesi.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function V2LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
