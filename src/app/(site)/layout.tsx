import type { Metadata } from "next";
import { DeferredAnalytics } from "@/components/providers/deferred-analytics";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { BackToTop } from "@/components/ui/back-to-top";
import { PromoPopup } from "@/components/ui/promo-popup";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { WhatsAppTracker } from "@/components/providers/whatsapp-tracker";
import { OG_SITE_NAME } from "@/lib/seo";
import "../globals.css";

// Keduanya variable font di Google Fonts. Tanpa array `weight`, next/font
// mengunduh SATU file variabel per style (bukan satu file per weight):
// 4 file sans + 6 file serif (3 weight x 2 style) -> 1 file sans + 2 file serif.
// 7 permintaan font berprioritas tinggi lenyap dari critical path, sehingga
// bandwidth pada koneksi lambat dipakai untuk poster hero (elemen LCP).
// Rentang weight tetap penuh, jadi tidak ada perubahan tampilan.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
  variable: "--font-serif",
});

export const metadata: Metadata = {
 // `title.template` DIHAPUS (Fase 1 spec seo-cannibalization-and-pseo).
  //
  // Sebelumnya: { default: "...", template: "%s | Grand Duta City Parung" }.
  // Next 16 tidak menerapkan template ke `title` di page.js pada segmen yang
  // SAMA, jadi homepage lolos sementara 13 route anak mendapat suffix brand —
  // padahal title mereka SUDAH memuat brand. Hasilnya frasa target homepage
  // muncul dua kali di 6 title (terpanjang /artikel = 102 karakter) dan
  // halaman-halaman itu bersaing dengan homepage di kata kunci yang sama.
  //
  // Ditulis sebagai string biasa, bukan `{ default }`: tipe `TemplateString`
  // Next mewajibkan `default` berpasangan dengan `template`. String biasa
  // berperilaku sama sebagai fallback — halaman yang punya title sendiri
  // menimpanya, halaman tanpa title (mis. error.tsx, sebuah client component)
  // mewarisinya.
  //
  // Konsekuensi: setiap halaman WAJIB menulis title-nya sendiri secara utuh.
  // Guard test G12 di src/app/(site)/__tests__/seo-invariants.test.ts gagal
  // bila template dikembalikan.
  title: "Grand Duta City Parung — Hunian Premium South of Jakarta",
  description:
    "Kawasan hunian Grand Duta City Parung di Parung, Bogor. Info Cluster Ladera & Cascada, harga, lokasi, siteplan, dan stok terbaru. Hunian premium South of Jakarta dengan akses strategis.",
  metadataBase: new URL("https://granddutacitysouthofjakarta.com"),
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
    ],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    siteName: OG_SITE_NAME,
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  verification: {
    google: "FivCctWsBAd8FOkGVRWg1A0ZGwkGk6q_7d_a471BiMY",
  },
};

// Preload hero video poster so it's available as an LCP candidate before JS runs
export const viewport = {
  themeColor: "#0b120c",
};

const SITE_URL = "https://granddutacitysouthofjakarta.com";

// Global Organization schema (Duta Putra Land) — mendukung eligibility Google Knowledge Panel.
// Dirender server-side di layout agar hadir di setiap halaman publik.
const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Duta Putra Land",
  // Nama legal dipindahkan ke sini dari /pricelist, yang sebelumnya
  // mendefinisikan Organization anonim "PT. Duta Putra Mahkota" dengan `url`
  // yang sama. Satu entitas, satu node.
  legalName: "PT. Duta Putra Mahkota",
  alternateName: "Grand Duta City Parung South of Jakarta",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.svg`,
    width: 512,
    height: 160,
    caption: "Logo Grand Duta City Parung by Duta Putra Land",
  },
  image: `${SITE_URL}/logo.svg`,
  description:
    "Duta Putra Land — developer real estate Indonesia sejak 1983, pengembang kota mandiri Grand Duta City Parung South of Jakarta seluas 200 Ha di Parung, Bogor.",
  foundingDate: "1983",
  foundingLocation: { "@type": "Place", name: "Jakarta, Indonesia" },
  slogan: "Best Living For Generations",
  brand: {
    "@type": "Brand",
    name: "Grand Duta City Parung South of Jakarta",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jl. Raya Parung No.47, Jabon Mekar",
    addressLocality: "Parung",
    addressRegion: "Jawa Barat",
    postalCode: "16330",
    addressCountry: "ID",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -6.462459,
    longitude: 106.729392,
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+628131742034",
      email: "contact@granddutacitysouthofjakarta.com",
      contactType: "sales",
      areaServed: "ID",
      availableLanguage: ["Indonesian", "English"],
      // `openingHoursSpecification` BUKAN properti `ContactPoint` — domainnya
      // `Place`/`LocalBusiness`. Properti yang benar untuk jam layanan sebuah
      // titik kontak adalah `hoursAvailable`.
      //
      // Kesalahan ini terdeteksi Site Audit Semrush sebagai "structured data
      // that contains markup errors" pada 62 halaman sekaligus — karena node
      // Organization ini diemit global dari layout, satu kesalahan menular ke
      // seluruh situs. Ini penyumbang terbesar dari 64 error markup.
      //
      // Catatan: `openingHoursSpecification` di `salesOfficeNode()`
      // (src/lib/schema.ts) TETAP BENAR dan tidak diubah, karena node itu
      // bertipe `RealEstateAgent` yang merupakan subtipe `LocalBusiness`.
      hoursAvailable: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "09:00",
          closes: "18:00",
        },
      ],
    },
  ],
  sameAs: [
    "https://www.instagram.com/granddutacityparungsoj/",
    "https://www.facebook.com/granddutacityparungsoj",
    "https://www.youtube.com/@marketinggdcparung",
    "https://dutaputraland.com/main/public/",
  ],
  areaServed: { "@type": "City", name: "Parung, Bogor" },
  knowsAbout: [
    "Real Estate",
    "Township",
    "Perumahan",
    "Parung",
    "Bogor",
    "South of Jakarta",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();

  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${playfair.variable} antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="relative font-sans min-h-screen bg-brand-light text-[#0B120C] flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <SmoothScrollProvider>
          <div className="relative grow">{children}</div>
        </SmoothScrollProvider>
        <PromoPopup />
        <BackToTop />
        <WhatsAppButton />
      </body>
      {gaId && gaId !== "G-XXXXXXXXXX" ? (
        <>
          <DeferredAnalytics gaId={gaId} />
          {/* Satu listener terdelegasi melacak SELURUH CTA WhatsApp di situs.
              Hanya dipasang bila GA aktif, jadi tidak ada beban JS sia-sia di
              environment tanpa GA_ID. */}
          <WhatsAppTracker />
        </>
      ) : null}
    </html>
  );
}
