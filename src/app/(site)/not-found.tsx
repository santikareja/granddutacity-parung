import type { Metadata } from "next";
import NotFoundClient from "@/components/NotFoundClient";
import { SITE_URL } from "@/lib/seo";

const PAGE_TITLE = "Halaman Tidak Ditemukan (404)";

/**
 * `alternates.canonical` DIHAPUS (3 September 2026).
 *
 * Sebelumnya halaman ini mengarahkan canonical ke homepage. Itu menyatakan
 * "halaman 404 ini adalah duplikat dari homepage" — klaim yang tidak benar dan
 * berbahaya justru untuk homepage: setiap URL mati yang dirayapi menyumbang
 * sinyal bahwa URL kanonik situs berjudul "Halaman Tidak Ditemukan (404)".
 *
 * Halaman ini sudah `noindex`, jadi tidak ada yang perlu dikanonikalisasi. Next
 * juga menyuntikkan `<meta name="robots" content="noindex">` sendiri saat
 * `notFound()` dipanggil (lihat node_modules/next/dist/docs — API notFound).
 */
export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    "Halaman yang Anda cari tidak tersedia. Kembali ke beranda atau jelajahi artikel dan panduan properti di kawasan Parung, Bogor.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  /**
   * `@id` node ini WAJIB berbeda dari `SCHEMA_ID.homepage`.
   *
   * Sebelumnya ia memakai `${SITE_URL}/#webpage` — `@id` yang SAMA dengan node
   * `WebPage` homepage — sekaligus menyetel `url` ke homepage. Dua node berbeda
   * dengan `@id` identik berarti Google harus menggabungkannya, dan salah satu
   * di antaranya bernama "Halaman Tidak Ditemukan (404)". Untuk situs yang
   * sedang berjuang memenangkan query brand-nya sendiri, mencampuradukkan
   * halaman entitas dengan halaman error adalah kerugian tanpa imbalan.
   *
   * `url` juga dilepas: halaman 404 tidak punya URL kanonik tunggal — ia
   * dirender di URL apa pun yang tidak ditemukan.
   */
  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#notfound`,
        name: PAGE_TITLE,
        description:
          "Halaman yang Anda cari tidak tersedia. Kembali ke beranda.",
        inLanguage: "id-ID",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      <NotFoundClient />
    </>
  );
}
