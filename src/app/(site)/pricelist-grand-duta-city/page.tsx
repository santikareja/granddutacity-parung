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

const jsonLdOfferCatalog = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "Pricelist Grand Duta City Parung 2025",
  description: "Daftar harga unit Cluster Ladera dan Cluster Cascada Grand Duta City South of Jakarta",
  url: PAGE_URL,
  provider: {
    "@type": "RealEstateAgent",
    name: "Grand Duta City Parung South of Jakarta",
    url: SITE_URL,
    telephone: "+628131742034",
  },
  itemListElement: [
    {
      "@type": "Offer",
      name: "Cluster Ladera T-66",
      description: "Tipe 66 Cluster Ladera Grand Duta City, LB 66 / LT mulai 72 m²",
      price: "1172910600",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-ladera`,
      seller: { "@type": "RealEstateAgent", name: "Grand Duta City Parung South of Jakarta" },
    },
    {
      "@type": "Offer",
      name: "Cluster Ladera T-47",
      description: "Tipe 47 Cluster Ladera Grand Duta City, LB 47 / LT mulai 72 m²",
      price: "850813200",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-ladera`,
      seller: { "@type": "RealEstateAgent", name: "Grand Duta City Parung South of Jakarta" },
    },
    {
      "@type": "Offer",
      name: "Cluster Cascada T-39",
      description: "Tipe 39 Cluster Cascada Grand Duta City, LB 39 / LT 65 m²",
      price: "778463200",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-cascada`,
      seller: { "@type": "RealEstateAgent", name: "Grand Duta City Parung South of Jakarta" },
    },
    {
      "@type": "Offer",
      name: "Cluster Cascada T-88",
      description: "Tipe 88 Cluster Cascada Grand Duta City, LB 88 / LT mulai 105 m²",
      price: "1365768500",
      priceCurrency: "IDR",
      url: `${SITE_URL}/cluster-cascada`,
      seller: { "@type": "RealEstateAgent", name: "Grand Duta City Parung South of Jakarta" },
    },
  ],
};

const jsonLdDataset = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Dataset Harga Unit Grand Duta City Parung 2025",
  description:
    "Data harga unit residensial Cluster Ladera (T-47, T-66) dan Cluster Cascada (T-39, T-42, T-47, T-58, T-62, T-69, T-88) Grand Duta City South of Jakarta di Parung, Bogor.",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdDataset) }} />
      <Header />
      <main className="relative w-full overflow-hidden">
        <PricelistPage />
      </main>
      <Footer />
    </>
  );
}
