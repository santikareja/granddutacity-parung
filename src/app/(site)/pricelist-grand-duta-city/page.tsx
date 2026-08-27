import type { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import PricelistPage from "@/components/sections/pricelist-content";

const SITE_URL = "https://granddutacitysouthofjakarta.com";
const PAGE_URL = `${SITE_URL}/pricelist-grand-duta-city`;
const OG_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Marketing_Galeri_GDC_tfvw3v.webp";

export const metadata: Metadata = {
  title: "Pricelist Grand Duta City Parung | Harga Ladera & Cascada",
  description: "Lihat pricelist Grand Duta City Parung terbaru untuk Cluster Ladera dan Cascada, lengkap dengan tipe unit, kisaran harga, dan informasi simulasi KPR.",
  keywords: [
    "pricelist grand duta city",
    "harga grand duta city parung",
    "harga cluster ladera",
    "harga cluster cascada",
    "simulasi kpr grand duta city",
    "grand duta city south of jakarta",
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
    title: "Pricelist Grand Duta City Parung | Harga Ladera & Cascada",
    description: "Lihat pricelist Grand Duta City Parung terbaru untuk Cluster Ladera dan Cascada, lengkap dengan tipe unit, kisaran harga, dan informasi simulasi KPR.",
    url: PAGE_URL,
    siteName: "Grand Duta City Parung South of Jakarta",
    locale: "id_ID",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Marketing Galeri Grand Duta City Parung." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricelist Grand Duta City Parung | Harga Ladera & Cascada",
    description: "Lihat pricelist Grand Duta City Parung terbaru untuk Cluster Ladera dan Cascada, lengkap dengan tipe unit, kisaran harga, dan informasi simulasi KPR.",
    images: [OG_IMAGE],
  },
};

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Pricelist Grand Duta City", item: PAGE_URL },
  ],
};

const jsonLdWebPage = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Pricelist Grand Duta City Parung | Harga Ladera & Cascada",
  description: "Lihat pricelist Grand Duta City Parung terbaru untuk Cluster Ladera dan Cascada, lengkap dengan tipe unit, kisaran harga, dan informasi simulasi KPR.",
  url: PAGE_URL,
  inLanguage: "id",
  isPartOf: { "@type": "WebSite", url: SITE_URL, name: "Grand Duta City Parung South of Jakarta" },
  breadcrumb: jsonLdBreadcrumb,
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: OG_IMAGE,
  },
};

const SELLER = {
  "@type": "RealEstateAgent",
  name: "Grand Duta City Parung South of Jakarta",
  url: SITE_URL,
  telephone: "+628131742034",
};

const jsonLdOfferCatalog = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "Pricelist Grand Duta City Parung 2026",
  description: "Daftar harga unit Cluster Ladera dan Cluster Cascada Grand Duta City South of Jakarta",
  url: PAGE_URL,
  provider: SELLER,
  itemListElement: [
    {
      "@type": "Offer",
      name: "Ladera Tipe Verona 39/60",
      description: "Tipe Verona 39/60 Cluster Ladera Grand Duta City, LB 39 / LT 60 m²",
      itemOffered: {
        "@type": "SingleFamilyResidence",
        name: "Verona 39/60",
        floorSize: { "@type": "QuantitativeValue", value: 39, unitCode: "MTK" },
      },
      price: "695052700",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-ladera`,
      seller: SELLER,
    },
    {
      "@type": "Offer",
      name: "Ladera Tipe Malta 47/72",
      description: "Tipe Malta 47/72 Cluster Ladera Grand Duta City, LB 47 / LT mulai 72 m²",
      itemOffered: {
        "@type": "SingleFamilyResidence",
        name: "Malta 47/72",
        floorSize: { "@type": "QuantitativeValue", value: 47, unitCode: "MTK" },
      },
      price: "845550000",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-ladera`,
      seller: SELLER,
    },
    {
      "@type": "Offer",
      name: "Ladera Tipe Tuscan 66/72",
      description: "Tipe Tuscan 66/72 Cluster Ladera Grand Duta City, LB 66 / LT mulai 72 m²",
      itemOffered: {
        "@type": "SingleFamilyResidence",
        name: "Tuscan 66/72",
        floorSize: { "@type": "QuantitativeValue", value: 66, unitCode: "MTK" },
      },
      price: "1111500000",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-ladera`,
      seller: SELLER,
    },
    {
      "@type": "Offer",
      name: "Cluster Cascada Tipe 39",
      description: "Tipe 39 Cluster Cascada Grand Duta City, LB 39 / LT 65–69 m²",
      price: "773200000",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-cascada`,
      seller: SELLER,
    },
    {
      "@type": "Offer",
      name: "Cluster Cascada Alexandra Tipe 88",
      description: "Tipe 88 (Alexandra) Cluster Cascada Grand Duta City, LB 88 / LT mulai 105 m²",
      itemOffered: {
        "@type": "SingleFamilyResidence",
        name: "Alexandra 88",
        floorSize: { "@type": "QuantitativeValue", value: 88, unitCode: "MTK" },
      },
      price: "1610302700",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-cascada`,
      seller: SELLER,
    },
  ],
};

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Apa saja promo Grand Duta City Parung saat ini?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Grand Duta City Parung memberikan Free AJB, Free SHM, Free BPHTB, dan PPN DTP 100% selama Program Pemerintah berlaku. Selain itu tersedia subsidi DP 10% langsung dari developer dan subsidi KPR hingga Rp 35 juta.",
      },
    },
    {
      "@type": "Question",
      name: "Apa saja skema pembayaran yang tersedia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tersedia tiga skema pembayaran: Tunai Keras, KPR Bank, dan Cash Bertahap 12 Bulan. Skema Cash Bertahap mensyaratkan DP 20% dan sisanya diangsur bertahap dalam 12 bulan.",
      },
    },
    {
      "@type": "Question",
      name: "Berapa harga termurah di Grand Duta City Parung?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Harga termurah saat ini adalah tipe Verona 39/60 di Cluster Ladera mulai Rp 695 jutaan (tunai keras). Cluster Cascada tersedia mulai tipe 39 di kisaran Rp 773 jutaan.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah tipe Frontera 89/90 sudah bisa dipesan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tipe Frontera 89/90 berstatus Segera Hadir. Pricelist resminya belum dirilis, sehingga harga akan diumumkan kemudian.",
      },
    },
    {
      "@type": "Question",
      name: "Apa saja yang sudah termasuk dalam harga unit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Harga unit sudah termasuk Izin Mendirikan Bangunan (IMB), penyambungan daya listrik 2.200 W, dan pemasangan jaringan air PDAM.",
      },
    },
  ],
};

const jsonLdDataset = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Dataset Harga Unit Grand Duta City Parung 2026",
  description:
    "Data harga unit residensial Cluster Ladera (Verona 39/60, Malta 47/72, Tuscan 66/72) dan Cluster Cascada (Tipe 39, Aira 42, Tipe 47, Manoa 58, Tipe 62, Victoria 69, Alexandra 88) Grand Duta City South of Jakarta di Parung, Bogor.",
  url: PAGE_URL,
  creator: {
    "@type": "Organization",
    name: "PT. Duta Putra Mahkota",
    url: SITE_URL,
  },
  license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  variableMeasured: ["Harga Tunai Keras", "Harga KPR", "Down Payment", "Booking Fee", "Plafond KPR"],
};

export default function PricelistGrandDutaCity() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOfferCatalog) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdDataset) }} />
      <Header />
      <main className="relative w-full overflow-hidden">
        <PricelistPage />
      </main>
      <Footer />
    </>
  );
}
