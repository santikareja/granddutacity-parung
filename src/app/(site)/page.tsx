import type { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import dynamic from "next/dynamic";

// Video section for YouTube embed
const VideoSection = dynamic(() => import("@/components/sections/video-section").then((mod) => ({ default: mod.VideoSection })));
const WhyGdc = dynamic(() => import("@/components/sections/why-gdc").then((mod) => ({ default: mod.WhyGdc })));
const BankPartners = dynamic(() => import("@/components/sections/bank-partners").then((mod) => ({ default: mod.BankPartners })));
const BetterLiving = dynamic(() => import("@/components/sections/better-living").then((mod) => ({ default: mod.BetterLiving })));
const LokasiScroll = dynamic(() => import("@/components/sections/lokasi-scroll").then((mod) => ({ default: mod.LokasiScroll })));
const About = dynamic(() => import("@/components/sections/about").then((mod) => ({ default: mod.About })));
const Fasilitas = dynamic(() => import("@/components/sections/fasilitas").then((mod) => ({ default: mod.Fasilitas })));
const TipeRumah = dynamic(() => import("@/components/sections/tipe-rumah").then((mod) => ({ default: mod.TipeRumah })));
const HighlightSlider = dynamic(() => import("@/components/sections/highlight-slider").then((mod) => ({ default: mod.HighlightSlider })));
const FaqKpr = dynamic(() => import("@/components/sections/faq-kpr").then((mod) => ({ default: mod.FaqKpr })));

const OG_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776807674/Tampak_Depan_Rumah_Grand_Duta_City_Parung_SOJ_ymztgv.webp";
const OG_IMAGE_ALT = "Tampak Depan Rumah Mewah Minimalis di Grand Duta City Parung South of Jakarta";
const SITE_URL = "https://granddutacitysouthofjakarta.com";

export const metadata: Metadata = {
  title: "Grand Duta City Parung | Promo Hunian South of Jakarta",
  description:
    "Grand Duta City Parung — hunian premium di South of Jakarta. Mulai Rp 700 jutaan, Promo Tanpa DP, KPR 8 bank, 20 menit ke CBD Jaksel via tol Desari.",
  keywords: [
    // Primary Keywords - Front loaded untuk SEO
    "grand duta city parung",
    "perumahan grand duta city parung",
    "grand duta city parung bogor",
    "hunian grand duta city parung",
    "gdc parung",
    // Secondary Keywords
    "grand duta city south of jakarta",
    "grand duta city soj",
    "gdc soj",
    "grand duta city south of jakarta parung",
    // Location Keywords
    "perumahan parung bogor",
    "hunian parung",
    "rumah parung south of jakarta",
    "perumah south of jakarta",
    // Conversion Keywords
    "harga grand duta city parung",
    "promo grand duta city parung",
    "kpr grand duta city parung",
    "cluster ladera cascada parung",
    "cicilan grand duta city parung",
    "siteplan grand duta city parung",
    // Virtual Tour Keywords
    "virtual tour grand duta city parung",
    "video grand duta city",
    "tour grand duta city parung",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Grand Duta City Parung — Hunian Premium South of Jakarta | Promo Tanpa DP",
    description:
      "Kota mandiri 200 Ha di Parung, South of Jakarta by Duta Putra Land. Hunian mulai Rp 700 jutaan, Promo Tanpa DP, 20 menit ke CBD Jaksel via tol. Cluster Ladera & Cascada tersedia.",
    url: SITE_URL,
    siteName: "Grand Duta City Parung",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Tampak Depan Rumah Mewah di Grand Duta City Parung South of Jakarta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grand Duta City Parung — Hunian Premium South of Jakarta | Promo Tanpa DP",
    description:
      "Kota mandiri 200 Ha di Parung, South of Jakarta by Duta Putra Land. Hunian mulai Rp 700 jutaan, Promo Tanpa DP, 20 menit ke CBD Jaksel via tol.",
    images: [
      {
        url: OG_IMAGE,
        alt: "Hunian Modern di Grand Duta City Parung South of Jakarta",
      },
    ],
  },
};

const SITE_NAME = "Grand Duta City Parung South of Jakarta";
const SITE_NAME_ALT = "GDC SOJ Parung";
const PHONE = "+628131742034";
const ADDRESS = {
  streetAddress: "Jl. Raya Parung No.47, Jabon Mekar",
  addressLocality: "Parung",
  addressRegion: "Jawa Barat",
  postalCode: "16330",
  addressCountry: "ID",
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: SITE_NAME_ALT,
  url: SITE_URL,
  description:
    "Kawasan hunian Grand Duta City South of Jakarta di Parung, Bogor. Info Cluster Ladera & Cascada, harga, lokasi, siteplan, dan stok terbaru.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?s={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const schemaImages = [
  {
    "@type": "ImageObject",
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Malta_qnowfx.webp",
    caption: "Desain Fasad Rumah Tipe Malta di Cluster Cascada Grand Duta City Parung",
  },
  {
    "@type": "ImageObject",
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800277/Tipe_Aira_ah9nsa.webp",
    caption: "Tampilan Eksterior Rumah Modern Minimalis Tipe Aira Grand Duta City Bogor",
  },
  {
    "@type": "ImageObject",
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Victoria_-_Tuscan_gj1kcd.webp",
    caption: "Rumah 2 Lantai Mewah Tipe Victoria Tuscan Grand Duta City South of Jakarta",
  },
  {
    "@type": "ImageObject",
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Alexandra_mtw8xh.webp",
    caption: "Hunian Eksklusif 2 Lantai Tipe Alexandra di Grand Duta City Parung",
  },
];

const jsonLdAgent = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: SITE_NAME,
  alternateName: SITE_NAME_ALT,
  url: SITE_URL,
  logo: "https://granddutacitysouthofjakarta.com/logo.svg",
  image: schemaImages,
  telephone: PHONE,
  email: "contact@granddutacitysouthofjakarta.com",
  address: {
    "@type": "PostalAddress",
    ...ADDRESS,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -6.462459,
    longitude: 106.729392,
  },
  hasMap: "https://maps.app.goo.gl/hCasFSyKPXv5nwY5A",
  sameAs: [
    "https://www.instagram.com/granddutacityparungsoj/",
    "https://www.facebook.com/granddutacityparungsoj",
    "https://www.youtube.com/@marketinggdcparung",
    "https://dutaputraland.com/main/public/",
  ],
  areaServed: {
    "@type": "City",
    name: "Parung, Bogor",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  priceRange: "Rp 700.000.000 - Rp 1.600.000.000",
};

// Shared helpers for Merchant Listing compliance
const MERCHANT_SELLER = { "@type": "Organization", name: "Grand Duta City South of Jakarta", url: SITE_URL };
const PRICE_VALID_UNTIL = `${new Date().getFullYear()}-12-31`;
const NO_SHIPPING = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "IDR" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "ID" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
  },
};
const NO_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "ID",
  returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
};

const jsonLdProductList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Tipe Rumah Grand Duta City South of Jakarta",
  description: "Pilihan unit hunian di Cluster Ladera dan Cascada, Grand Duta City Parung South of Jakarta.",
  url: SITE_URL,
  numberOfItems: 6,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "Product",
        name: "Cluster Ladera – Tipe Malta 47/72",
        category: "Rumah Tapak",
        description: "Hunian 2+1 kamar tidur, Type 47, luas tanah 72 m². Cluster Ladera Grand Duta City Parung.",
        image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Malta_qnowfx.webp",
        brand: { "@type": "Brand", name: "Duta Putra Land" },
        offers: {
          "@type": "Offer",
          price: "800000000",
          priceCurrency: "IDR",
          priceValidUntil: PRICE_VALID_UNTIL,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/cluster-ladera`,
          seller: MERCHANT_SELLER,
          shippingDetails: NO_SHIPPING,
          hasMerchantReturnPolicy: NO_RETURN_POLICY,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: {
        "@type": "Product",
        name: "Cluster Ladera – Tipe Tuscan 66/72",
        category: "Rumah Tapak",
        description: "Hunian 3 kamar tidur, Type 66, luas tanah 72 m². Cluster Ladera Grand Duta City Parung.",
        image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Tuscan_drllpk.webp",
        brand: { "@type": "Brand", name: "Duta Putra Land" },
        offers: {
          "@type": "Offer",
          price: "1100000000",
          priceCurrency: "IDR",
          priceValidUntil: PRICE_VALID_UNTIL,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/cluster-ladera`,
          seller: MERCHANT_SELLER,
          shippingDetails: NO_SHIPPING,
          hasMerchantReturnPolicy: NO_RETURN_POLICY,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 3,
      item: {
        "@type": "Product",
        name: "Cluster Cascada – Tipe Aira+ 42/60",
        category: "Rumah Tapak",
        description: "Hunian 2 kamar tidur, Type 42, luas tanah 60 m². Cluster Cascada Grand Duta City Parung.",
        image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800277/Tipe_Aira_ah9nsa.webp",
        brand: { "@type": "Brand", name: "Duta Putra Land" },
        offers: {
          "@type": "Offer",
          price: "800000000",
          priceCurrency: "IDR",
          priceValidUntil: PRICE_VALID_UNTIL,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/cluster-cascada`,
          seller: MERCHANT_SELLER,
          shippingDetails: NO_SHIPPING,
          hasMerchantReturnPolicy: NO_RETURN_POLICY,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 4,
      item: {
        "@type": "Product",
        name: "Cluster Cascada – Tipe Manoa 58/60",
        category: "Rumah Tapak",
        description: "Hunian 1 kamar tidur, Type 58, luas tanah 60 m². Cluster Cascada Grand Duta City Parung.",
        image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
        brand: { "@type": "Brand", name: "Duta Putra Land" },
        offers: {
          "@type": "Offer",
          price: "800000000",
          priceCurrency: "IDR",
          priceValidUntil: PRICE_VALID_UNTIL,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/cluster-cascada`,
          seller: MERCHANT_SELLER,
          shippingDetails: NO_SHIPPING,
          hasMerchantReturnPolicy: NO_RETURN_POLICY,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 5,
      item: {
        "@type": "Product",
        name: "Cluster Cascada – Tipe Victoria 69/72",
        category: "Rumah Tapak",
        description: "Hunian 3 kamar tidur, Type 69, luas tanah 72 m². Cluster Cascada Grand Duta City Parung.",
        image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Victoria_-_Tuscan_gj1kcd.webp",
        brand: { "@type": "Brand", name: "Duta Putra Land" },
        offers: {
          "@type": "Offer",
          price: "1100000000",
          priceCurrency: "IDR",
          priceValidUntil: PRICE_VALID_UNTIL,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/cluster-cascada`,
          seller: MERCHANT_SELLER,
          shippingDetails: NO_SHIPPING,
          hasMerchantReturnPolicy: NO_RETURN_POLICY,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 6,
      item: {
        "@type": "Product",
        name: "Cluster Cascada – Tipe Alexandra 88/105",
        category: "Rumah Tapak",
        description: "Hunian 3 kamar tidur, Type 88, luas tanah 105 m². Cluster Cascada Grand Duta City Parung.",
        image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Alexandra_mtw8xh.webp",
        brand: { "@type": "Brand", name: "Duta Putra Land" },
        offers: {
          "@type": "Offer",
          price: "1400000000",
          priceCurrency: "IDR",
          priceValidUntil: PRICE_VALID_UNTIL,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/cluster-cascada`,
          seller: MERCHANT_SELLER,
          shippingDetails: NO_SHIPPING,
          hasMerchantReturnPolicy: NO_RETURN_POLICY,
        },
      },
    },
  ],
};

const jsonLdPage = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Grand Duta City Parung South of Jakarta | Promo Tanpa DP, Mulai 700 Jt",
  description:
    "Grand Duta City Parung South of Jakarta (GDC SOJ) — kota mandiri 200 Ha by Duta Putra Land. Hunian mulai Rp 700 jutaan, Promo Tanpa DP, KPR 8 bank, 20 menit ke CBD Jaksel via tol.",
  url: SITE_URL,
  image: schemaImages,
  inLanguage: "id",
  isPartOf: { "@type": "WebSite", url: SITE_URL, name: SITE_NAME },
  about: {
    "@type": "RealEstateListing",
    name: "Grand Duta City Parung South of Jakarta",
    address: {
      "@type": "PostalAddress",
      ...ADDRESS,
    },
  },
  hasPart: [
    { "@type": "WebPage", name: "Cluster Ladera", url: `${SITE_URL}/cluster-ladera` },
    { "@type": "WebPage", name: "Cluster Cascada", url: `${SITE_URL}/cluster-cascada` },
    { "@type": "WebPage", name: "Galeri", url: `${SITE_URL}/galeri` },
  ],
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    ],
  },
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: OG_IMAGE,
    description: OG_IMAGE_ALT,
  },
};

// FAQ content (source of truth for FAQPage schema, mirroring the FaqKpr section)
const FAQ_CONTENT = [
  {
    q: "Berapa harga rumah di Grand Duta City Parung South of Jakarta?",
    a: "Harga rumah di Grand Duta City Parung mulai dari Rp 700 jutaan untuk Cluster Ladera (Tipe Malta 47/72) hingga Rp 1,6 Milyar-an untuk unit premium di Cluster Cascada (Tipe Alexandra 88/105). Cicilan KPR mulai sekitar Rp 4 jutaan per bulan dengan tenor hingga 25 tahun. Hubungi marketing untuk pricelist terbaru dan ketersediaan unit promo.",
  },
  {
    q: "Apa saja syarat dan keuntungan Promo Tanpa DP bulan ini?",
    a: "Program Promo Tanpa DP berlaku untuk pemesanan unit baru di Cluster Ladera dan Cascada bulan berjalan, dengan proses KPR melalui 8 bank mitra (BCA, Mandiri, BTN, BRI, BNI, dll). Cukup siapkan dokumen pribadi (KTP, KK, slip gaji/SPT), dan tim marketing kami akan bantu pre-approval gratis. Konsultasi via WhatsApp untuk simulasi cicilan & bocoran promo aktif.",
  },
  {
    q: "Di mana lokasi Grand Duta City Parung dan bagaimana akses tolnya?",
    a: "Berlokasi di Jl. Raya Parung No.47, Jabon Mekar, Kec. Parung, Kabupaten Bogor — hanya 20 menit ke TB Simatupang & Antasari Jakarta Selatan, dan kurang dari 15 menit ke 4 exit tol utama: Pamulang, Krukut, Sawangan, dan Bojong Gede. Akses ke Tol Desari, Tol Andara, Tol Pamulang, dan Tol BORR membuat hunian ini sangat strategis untuk komuter Jakarta-Depok-Bogor-BSD.",
  },
  {
    q: "Fasilitas eksklusif apa saja di kawasan Grand Duta City SOJ?",
    a: "Penghuni menikmati fasilitas kelas premium: The Beach (kolam tematik), Cluster Private Pool, Central Park, Ruang Terbuka Hijau 80 Ha, Playground, Pusat Kuliner FnB, Garden Cafe, Boulevard utama, Keamanan 24/7 dengan CCTV, One Gate System, serta jaringan kabel bawah tanah untuk estetika kawasan yang rapi modern.",
  },
  {
    q: "Apakah kawasan Grand Duta City Parung aman dari banjir?",
    a: "Ya. Kawasan dirancang dengan polder system terpadu berskala kota mandiri dan elevasi tanah optimal di dataran tinggi Parung Bogor. Drainase induk dan area resapan dirancang untuk menjamin lingkungan bebas banjir bahkan saat curah hujan tinggi.",
  },
  {
    q: "Bagaimana prospek investasi properti di Grand Duta City Parung?",
    a: "Sangat menjanjikan. Kawasan ini dilewati jalur rencana Tol JORR 3 yang akan mendongkrak capital gain signifikan, menjadikannya sunrise property terbaik di koridor selatan Jakarta. Kombinasi 200 Ha kota mandiri, infrastruktur lengkap, dan posisi strategis 20 menit dari CBD Jakarta Selatan menempatkan GDC SOJ sebagai pilihan investasi properti Bogor dengan potensi apresiasi tinggi 5–10 tahun ke depan.",
  },
];

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  name: "FAQ Grand Duta City Parung South of Jakarta",
  url: SITE_URL,
  inLanguage: "id",
  mainEntity: FAQ_CONTENT.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

// SiteNavigationElement — membantu Google memahami struktur situs untuk kandidat sitelinks
const jsonLdSiteNavigation = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Navigasi Utama Grand Duta City Parung",
  itemListElement: [
    { "@type": "SiteNavigationElement", position: 1, name: "Cluster Ladera", description: "Tipe rumah, denah, dan harga Cluster Ladera Grand Duta City Parung.", url: `${SITE_URL}/cluster-ladera` },
    { "@type": "SiteNavigationElement", position: 2, name: "Cluster Cascada", description: "Tipe rumah, denah, dan harga Cluster Cascada Grand Duta City Parung.", url: `${SITE_URL}/cluster-cascada` },
    { "@type": "SiteNavigationElement", position: 3, name: "Pricelist", description: "Daftar harga dan simulasi cicilan Grand Duta City Parung.", url: `${SITE_URL}/pricelist-grand-duta-city` },
    { "@type": "SiteNavigationElement", position: 4, name: "Update Stok & Siteplan", description: "Ketersediaan unit dan siteplan terbaru Grand Duta City Parung.", url: `${SITE_URL}/update-stok-siteplan-grand-duta-city-parung` },
    { "@type": "SiteNavigationElement", position: 5, name: "Lokasi & Akses", description: "Lokasi, peta, dan akses tol Grand Duta City Parung South of Jakarta.", url: `${SITE_URL}/lokasi-akses-grand-duta-city-parung` },
    { "@type": "SiteNavigationElement", position: 6, name: "Cara Beli & KPR", description: "Panduan cara beli dan KPR Grand Duta City Parung.", url: `${SITE_URL}/cara-beli-kpr` },
    { "@type": "SiteNavigationElement", position: 7, name: "Galeri", description: "Galeri foto dan video kawasan Grand Duta City Parung.", url: `${SITE_URL}/galeri` },
    { "@type": "SiteNavigationElement", position: 8, name: "Kontak", description: "Hubungi marketing Grand Duta City Parung South of Jakarta.", url: `${SITE_URL}/kontak` },
  ],
};

export default function Home() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdAgent) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProductList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSiteNavigation) }}
      />
      <Header />
      <main className="relative w-full overflow-hidden">
        <Hero />
        <BankPartners />
        <VideoSection />
        <WhyGdc />
        <About />
        <TipeRumah />
        <LokasiScroll />
        <Fasilitas />
        <BetterLiving />
        <HighlightSlider />
        <FaqKpr />
      </main>
      <Footer />
    </>
  );
}
