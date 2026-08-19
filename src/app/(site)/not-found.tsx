import type { Metadata } from "next";
import NotFoundClient from "@/components/NotFoundClient";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan (404) | Grand Duta City",
  description:
    "Halaman yang Anda cari tidak tersedia. Kembali ke beranda atau jelajahi artikel dan informasi properti Grand Duta City South of Jakarta.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://granddutacitysouthofjakarta.com",
  },
};

export default function NotFound() {
  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://granddutacitysouthofjakarta.com/#webpage",
        url: "https://granddutacitysouthofjakarta.com",
        name: "Halaman Tidak Ditemukan (404) | Grand Duta City",
        description:
          "Halaman yang Anda cari tidak tersedia. Kembali ke beranda.",
        inLanguage: "id-ID",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Beranda",
            item: "https://granddutacitysouthofjakarta.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "404 Not Found",
          },
        ],
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
