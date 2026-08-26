import type { Metadata } from "next";

import "../globals.css";

// Layout induk /admin sengaja passthrough tanpa guard sesi. Guard dipindah ke
// route group (protected)/layout.tsx sehingga /admin/login (di luar group
// tersebut) tidak ikut terjaga — mencegah redirect loop bagi pengunjung anonim.
// Route group (protected) TIDAK mengubah URL: /admin, /admin/articles,
// dst. tetap sama seperti sebelumnya.
export const metadata: Metadata = {
  title: "CMS Grand Duta City Parung",
  description: "Content Management System Grand Duta City Parung",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
