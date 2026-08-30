import type { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import dynamic from "next/dynamic";

import {
  SCHEMA_ID,
  clusterNodes,
  faqNode,
  graph,
  primaryImageNode,
  projectPlaceNode,
  ref,
  salesOfficeNode,
  websiteNode,
} from "@/lib/schema";

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

const SITE_URL = "https://granddutacitysouthofjakarta.com";

// Social preview asset (1200x630) — dipakai eksklusif untuk OpenGraph & Twitter Card.
const OG_IMAGE = "/og-grand-duta-city-parung.jpg";
const OG_IMAGE_ALT = "Tampak Depan Rumah Mewah Minimalis di Grand Duta City Parung South of Jakarta";

// Fallback asset (1200x1200) — dipakai untuk JSON-LD WebSite/WebPage yang mewajibkan URL absolut.
const FALLBACK_IMAGE = `${SITE_URL}/perumahan-grand-duta-city-parung.jpg`;
const FALLBACK_IMAGE_ALT = "Suasana kawasan perumahan modern Grand Duta City Parung Bogor South of Jakarta";

export const metadata: Metadata = {
  metadataBase: new URL("https://granddutacitysouthofjakarta.com"),
  title: "Grand Duta City Parung | Promo Hunian South of Jakarta",
  // PENGECUALIAN R1 YANG DIDEKLARASIKAN (Fase 3).
  //
  // R1 melarang perubahan metadata homepage sebelum Fase 8. Satu kata diubah di
  // sini — "8 bank" menjadi "7 bank" — karena jumlah bank mitra yang benar
  // adalah 7 (dikonfirmasi pemilik) dan membiarkan klaim yang salah di
  // description halaman utama adalah masalah kepercayaan, bukan gaya penulisan.
  //
  // Mengapa ini aman: panjang description TIDAK berubah (148 karakter, tetap di
  // dalam rentang guard G7), tidak ada kata kunci yang bergeser, dan `title`,
  // `alternates.canonical`, `robots`, serta `<h1>` sama sekali tidak disentuh.
  description:
    "Grand Duta City Parung — hunian premium di South of Jakarta. Mulai Rp 700 jutaan, Promo Tanpa DP, KPR 7 bank, 20 menit ke CBD Jaksel via tol Desari.",
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
        secureUrl: `${SITE_URL}${OG_IMAGE}`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: OG_IMAGE_ALT,
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
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
};






// Gambar unit untuk `ImageObject` di graf. Caption deskriptif dipertahankan
// karena itulah yang membuat gambar punya peluang muncul sebagai hasil gambar.
const unitImageNodes = [
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

/**
 * Video tur kawasan di YouTube (channel Marketing Grand Duta City Parung).
 * Judul diambil dari oEmbed resmi YouTube, bukan ditulis ulang.
 */
const TOUR_VIDEO_ID = "AZLiHEyd9Yo";
const TOUR_VIDEO_TITLE =
  "Grand Duta City Parung South of Jakarta Progress Terbaru | 0813-1742-034";

/**
 * Tanggal unggah dan durasi video, DIAMBIL DARI YOUTUBE, bukan ditebak.
 *
 * `uploadDate` adalah field WAJIB untuk video rich result, dan oEmbed YouTube
 * tidak mengeksposnya — itu sebabnya node ini sempat dinonaktifkan. Tapi halaman
 * tontonan YouTube sendiri menerbitkan datanya sebagai structured data:
 * `<meta itemprop="datePublished">` dan `<meta itemprop="duration">`. Nilai di
 * bawah dibaca langsung dari sana, jadi ia data YouTube, bukan karangan kita.
 *
 * Diverifikasi 30 Agustus 2026 terhadap
 * https://www.youtube.com/watch?v=AZLiHEyd9Yo
 *   datePublished : 2026-07-20T19:28:37-07:00
 *   duration      : PT3M41S (221 detik)
 *
 * Offset -07:00 adalah cara YouTube merender instan tersebut; instan yang sama
 * dalam WIB adalah 2026-07-21T09:28:37+07:00. Disimpan apa adanya supaya bisa
 * dicocokkan ulang dengan sumbernya.
 */
const TOUR_VIDEO_UPLOAD_DATE = "2026-07-20T19:28:37-07:00";
const TOUR_VIDEO_DURATION = "PT3M41S";

const tourVideoNode = {
  "@type": "VideoObject",
  "@id": SCHEMA_ID.video,
  name: TOUR_VIDEO_TITLE,
  description:
    "Tur kawasan Grand Duta City Parung South of Jakarta: gerbang cluster, boulevard utama, The Beach Lagoon, Central Park, dan progres pembangunan terbaru.",
  thumbnailUrl: [`https://i.ytimg.com/vi/${TOUR_VIDEO_ID}/hqdefault.jpg`],
  uploadDate: TOUR_VIDEO_UPLOAD_DATE,
  duration: TOUR_VIDEO_DURATION,
  embedUrl: `https://www.youtube-nocookie.com/embed/${TOUR_VIDEO_ID}`,
  contentUrl: `https://www.youtube.com/watch?v=${TOUR_VIDEO_ID}`,
  inLanguage: "id-ID",
  isPartOf: ref(SCHEMA_ID.website),
  about: ref(SCHEMA_ID.project),
  publisher: ref(SCHEMA_ID.organization),
};

/**
 * `WebPage` homepage — menggantikan `CollectionPage`.
 *
 * `CollectionPage` menandakan halaman arsip/listing; homepage bukan itu.
 * `mainEntity` menunjuk entitas proyek, sehingga Google tahu halaman INI adalah
 * halaman kanonik untuk entitas tersebut — inilah tautan yang menopang klaim
 * kedua kata kunci target milik homepage.
 */
const homepageNode = {
  "@type": "WebPage",
  "@id": SCHEMA_ID.homepage,
  url: SITE_URL,
  name: "Grand Duta City Parung South of Jakarta | Promo Tanpa DP, Mulai 700 Jt",
  description:
    "Grand Duta City Parung South of Jakarta (GDC SOJ) — kota mandiri 200 Ha by Duta Putra Land. Hunian mulai Rp 700 jutaan, Promo Tanpa DP, KPR 7 bank, 20 menit ke CBD Jaksel via tol.",
  inLanguage: "id-ID",
  isPartOf: ref(SCHEMA_ID.website),
  about: ref(SCHEMA_ID.project),
  mainEntity: ref(SCHEMA_ID.project),
  primaryImageOfPage: ref(SCHEMA_ID.primaryImage),
  image: unitImageNodes,
  video: ref(SCHEMA_ID.video),
  // Breadcrumb 1-item yang lama dihapus: Google tidak pernah merender
  // breadcrumb satu level, jadi ia hanya menambah byte.
  significantLink: [
    `${SITE_URL}/cluster-ladera`,
    `${SITE_URL}/cluster-cascada`,
    `${SITE_URL}/pricelist-grand-duta-city`,
    `${SITE_URL}/lokasi-akses-grand-duta-city-parung`,
    `${SITE_URL}/update-stok-siteplan-grand-duta-city-parung`,
    `${SITE_URL}/cara-beli-kpr`,
    `${SITE_URL}/galeri`,
    `${SITE_URL}/kontak`,
  ],
};

/**
 * SATU dokumen `@graph` menggantikan enam blok `<script>` terpisah.
 *
 * Selain memperbaiki graf yang terputus, ini juga memperkecil HTML: Next
 * menduplikasi JSON-LD ke dalam RSC flight payload, jadi setiap byte schema
 * terhitung DUA KALI pada halaman ini.
 *
 * `Organization` tidak diikutkan di sini — ia sudah diemit global di
 * `(site)/layout.tsx` dengan `@id` yang sama, dan node di bawah merujuknya.
 */
const jsonLdGraph = graph([
  websiteNode(),
  projectPlaceNode(),
  ...clusterNodes(),
  salesOfficeNode(),
  primaryImageNode(FALLBACK_IMAGE, FALLBACK_IMAGE_ALT),
  homepageNode,
  faqNode(),
  tourVideoNode,
]);

export default function Home() {
  return (
    <>
      {/* Satu blok JSON-LD berisi seluruh graf (lihat src/lib/schema.ts). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
      <Header />
      <main className="relative w-full overflow-hidden">
        {/* SEO gambar ditangani metadata + JSON-LD saja — dilarang menyisipkan
            <Image> tersembunyi (sr-only/priority) di sini: preload-nya berebut
            bandwidth dengan poster video hero dan menunda LCP mobile secara
            signifikan (lihat catatan konvensi proyek). */}
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
