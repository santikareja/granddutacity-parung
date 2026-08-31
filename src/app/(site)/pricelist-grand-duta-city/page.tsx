import type { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import PricelistPage from "@/components/sections/pricelist-content";
import { CLUSTER_LABEL, getUnitById, unitSpecSentence } from "@/data/units";
import {
  SCHEMA_ID,
  breadcrumbNode,
  graph,
  ref,
  residenceNode,
  unitAvailability,
} from "@/lib/schema";
import { OG_SITE_NAME } from "@/lib/seo";

const SITE_URL = "https://granddutacitysouthofjakarta.com";
const PAGE_URL = `${SITE_URL}/pricelist-grand-duta-city`;
const OG_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Marketing_Galeri_GDC_tfvw3v.webp";

// Halaman ini SENGAJA mempertahankan frasa "Grand Duta City Parung" di title:
// "pricelist grand duta city parung" adalah query berbeda yang memang harus
// dimenangkan halaman ini, bukan homepage. Yang dicabut adalah suffix brand
// menggantung (yang membuat frasa muncul dua kali, total 82 karakter) dan
// keyword "grand duta city south of jakarta" yang bersaing dengan homepage.
const PAGE_TITLE = "Pricelist Grand Duta City Parung 2026 | Harga Resmi";
const PAGE_DESCRIPTION =
  "Pricelist resmi Grand Duta City Parung 2026: harga tunai keras, harga KPR, DP, dan plafond per tipe unit Cluster Ladera dan Cascada, plus simulasi cicilan.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "pricelist grand duta city parung",
    "harga grand duta city parung",
    "harga cluster ladera",
    "harga cluster cascada",
    "simulasi kpr gdc parung",
    "gdc parung",
  ],
  alternates: { canonical: PAGE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    }
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: OG_SITE_NAME,
    locale: "id_ID",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Marketing Galeri Grand Duta City Parung." }],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const jsonLdBreadcrumb = breadcrumbNode(
  [{ name: "Pricelist Grand Duta City", path: "/pricelist-grand-duta-city" }],
  PAGE_URL,
);

const jsonLdWebPage = {
  "@type": "WebPage",
  "@id": `${PAGE_URL}#webpage`,
  name: "Pricelist Grand Duta City Parung | Harga Ladera & Cascada",
  description: "Lihat pricelist Grand Duta City Parung terbaru untuk Cluster Ladera dan Cascada, lengkap dengan tipe unit, kisaran harga, dan informasi simulasi KPR.",
  url: PAGE_URL,
  inLanguage: "id",
  // Referensi murni. Sebelumnya node WebSite di sini TANPA `@id` sama sekali,
  // jadi ia entitas anonim yang tidak pernah tersambung ke graf.
  isPartOf: ref(SCHEMA_ID.website),
  about: ref(SCHEMA_ID.project),
  // Sebelumnya breadcrumb DISALIN penuh ke dalam node ini SEKALIGUS diemit
  // sebagai blok terpisah, jadi ada dua definisi untuk satu breadcrumb.
  breadcrumb: ref(`${PAGE_URL}#breadcrumb`),
  primaryImageOfPage: {
    "@type": "ImageObject",
    "@id": `${PAGE_URL}#primaryimage`,
    url: OG_IMAGE,
    contentUrl: OG_IMAGE,
  },
};

// Penjual adalah entitas yang SAMA dengan `#salesoffice` di homepage. Sebelumnya
// halaman ini mendefinisikan ulang `RealEstateAgent` tanpa `@id`, sehingga
// Google melihat kantor pemasaran kedua yang tidak pernah menyatu dengan yang
// di homepage.
//
// REFERENSI BERTIPE, bukan `@id` polos. Node `#salesoffice` didefinisikan
// lengkap di homepage, BUKAN di halaman ini. Konsumen yang merayapi halaman ini
// sendirian hanya melihat `{"@id": "..."}` tanpa petunjuk jenis entitasnya —
// Site Audit Semrush menandainya sebagai markup error pada properti `seller`.
// Menyertakan `@type` membuat referensi lintas halaman bisa dipahami sendiri
// tanpa harus menunggu node aslinya di-resolve, dan tetap merujuk entitas yang
// sama karena `@id`-nya identik.
const SELLER = { "@type": "RealEstateAgent", ...ref(SCHEMA_ID.salesOffice) };

/**
 * Harga Jual Tunai Keras TERENDAH per tipe menurut pricelist resmi.
 *
 * Halaman inilah SATU-SATUNYA tempat angka harga masuk structured data.
 * Halaman cluster sengaja tidak memuat `price` karena harga di pricelist adalah
 * rentang per kavling; menempelkan satu angka di sana pasti salah untuk
 * sebagian kavling (dan sempat terjadi: Malta diberi "900000000" di Ladera).
 */
const TUNAI_KERAS_TERENDAH: Record<string, string> = {
  "verona-39": "695052700",
  "malta-47": "845550000",
  "tuscan-66": "1111500000",
  "alexandra-88": "1610302700",
};

/**
 * `itemOffered` kini memakai `residenceNode()` dari sumber data unit, bukan
 * objek inline. Dua alasan: node inline TIDAK punya `@id` sehingga jadi entitas
 * hunian anonim yang tidak pernah menyatu dengan yang di halaman cluster, dan
 * spesifikasinya hanya memuat `floorSize` sehingga jumlah kamar hilang.
 */
const unitOffers = Object.entries(TUNAI_KERAS_TERENDAH).map(([unitId, price]) => {
  const unit = getUnitById(unitId);
  if (!unit) throw new Error(`Unit "${unitId}" tidak ada di src/data/units.ts`);
  return {
    "@type": "Offer",
    name: `${CLUSTER_LABEL[unit.cluster]} Tipe ${unit.name} ${unit.lb}/${unit.lt}`,
    description: unitSpecSentence(unit),
    availability: unitAvailability(unit),
    price,
    priceCurrency: "IDR",
    url: `${SITE_URL}/cluster-${unit.cluster}`,
    itemOffered: residenceNode(unit),
    seller: SELLER,
  };
});

const jsonLdOfferCatalog = {
  "@type": "OfferCatalog",
  "@id": `${PAGE_URL}#offercatalog`,
  name: "Pricelist Grand Duta City Parung 2026",
  description: "Daftar harga unit Cluster Ladera dan Cluster Cascada Grand Duta City South of Jakarta",
  url: PAGE_URL,
  provider: SELLER,
  itemListElement: [
    ...unitOffers,
    {
      "@type": "Offer",
      // Tipe 39 Cascada ada di pricelist resmi tetapi BELUM terdaftar di
      // src/data/units.ts, jadi tidak ada node hunian untuk dirujuk. Baris ini
      // dibiarkan sebagai penawaran tanpa `itemOffered` — lebih baik daripada
      // mengarang entitas hunian yang datanya tidak dikonfirmasi.
      name: "Cluster Cascada Tipe 39",
      description: "Tipe 39 Cluster Cascada Grand Duta City, LB 39 / LT 65-69 m2",
      price: "773200000",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-cascada`,
      seller: SELLER,
    },
  ],
};

// `FAQPage` DIHAPUS (Fase 5 spec seo-cannibalization-and-pseo).
//
// Google menghapus FAQ rich result sepenuhnya pada 7 Mei 2026, jadi blok ini
// nol imbal hasil di SERP. Ada masalah kedua: pertanyaannya ditulis DI SINI
// sementara accordion yang dilihat pengunjung ada di
// components/sections/pricelist-content.tsx, sehingga keduanya bisa menyimpang
// dan membuat structured data tidak lagi mencerminkan konten yang terlihat.

const jsonLdDataset = {
  "@type": "Dataset",
  "@id": `${PAGE_URL}#dataset`,
  name: "Dataset Harga Unit Grand Duta City Parung 2026",
  description:
    "Data harga unit residensial Cluster Ladera (Verona 39/60, Malta 47/72, Tuscan 66/72) dan Cluster Cascada (Tipe 39, Aira 42, Tipe 47, Manoa 58, Tipe 62, Victoria 69, Alexandra 88) Grand Duta City South of Jakarta di Parung, Bogor.",
  url: PAGE_URL,
  // Sebelumnya: Organization anonim bernama "PT. Duta Putra Mahkota" dengan
  // `url` PERSIS SITE_URL. URL yang sama berarti entitas yang sama, jadi node
  // itu hanya melahirkan pesaing anonim bagi `#organization`. Nama legalnya
  // sekarang tercatat sebagai `legalName` di node kanonik di layout.
  creator: ref(SCHEMA_ID.organization),
  publisher: ref(SCHEMA_ID.organization),
  license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  variableMeasured: ["Harga Tunai Keras", "Harga KPR", "Down Payment", "Booking Fee", "Plafond KPR"],
};

// Empat blok terpisah digabung jadi satu `@graph` (Fase 5).
const pageSchema = graph([
  jsonLdBreadcrumb,
  jsonLdWebPage,
  jsonLdOfferCatalog,
  jsonLdDataset,
]);

export default function PricelistGrandDutaCity() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <Header />
      <main className="relative w-full overflow-hidden">
        <PricelistPage />
      </main>
      <Footer />
    </>
  );
}
