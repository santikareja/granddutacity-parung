import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { Gallery } from "@/components/sections/gallery";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { siteImages } from "@/data/images";
import { SCHEMA_ID, breadcrumbNode, graph, ref } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

export const PAGE_TITLE = "Galeri GDC Parung: Foto, Video & Fasilitas";
export const PAGE_H1 = "Galeri Foto & Video Kawasan GDC Parung";

// Frasa "Grand Duta City South of Jakarta" DICABUT dari title dan description
// halaman ini (Fase 1). Sebelumnya halaman ini satu-satunya di situs yang
// memuat KEDUA kata kunci target homepage, dan exact match-nya lebih bersih
// daripada homepage — jadi ia pesaing internal paling langsung.
export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    "Lihat galeri foto kawasan GDC Parung: fasad rumah, The Beach Lagoon, Central Park, boulevard, area komersial, dan progres pembangunan cluster terbaru.",
  alternates: {
    canonical: "https://granddutacitysouthofjakarta.com/galeri",
  },
};

const PAGE_URL = `${SITE_URL}/galeri`;

/**
 * `ImageGallery` + `ImageObject` (Fase 5 spec seo-cannibalization-and-pseo).
 *
 * Sebelumnya `/galeri` adalah SATU-SATUNYA halaman konten di situs ini tanpa
 * JSON-LD sama sekali — padahal ia halaman yang paling langsung mendukung
 * target pemilik untuk memunculkan deretan gambar di hasil penelusuran.
 *
 * Gambar diambil dari `src/data/images.ts`, registry yang sudah menjadi sumber
 * image sitemap. Jadi tidak ada daftar gambar kedua yang bisa menyimpang, dan
 * setiap gambar sudah membawa `title` serta `caption` deskriptif.
 */
const galleryImages = siteImages.filter((image) => image.page === "/galeri");

const galeriGraph = graph([
  {
    "@type": "ImageGallery",
    "@id": `${PAGE_URL}#gallery`,
    url: PAGE_URL,
    name: "Galeri Foto & Video Kawasan GDC Parung",
    description:
      "Dokumentasi visual kawasan Grand Duta City Parung: fasad tipe rumah, The Beach Lagoon, Central Park, boulevard utama, area komersial, dan progres pembangunan.",
    inLanguage: "id-ID",
    isPartOf: ref(SCHEMA_ID.website),
    about: ref(SCHEMA_ID.project),
    breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
    numberOfItems: galleryImages.length,
    associatedMedia: galleryImages.map((image) => ({
      "@type": "ImageObject",
      contentUrl: image.url,
      url: image.url,
      name: image.title,
      caption: image.caption,
      representativeOfPage: false,
    })),
  },
  breadcrumbNode([{ name: "Galeri", path: "/galeri" }], PAGE_URL),
]);

export default function GaleriPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(galeriGraph) }}
      />
      <Header />
      <main>
        {/* Page Hero */}
        <section className="pt-36 pb-16 bg-[#0b120c] text-[#F5F1E8]">
          <div className="max-w-screen-xl mx-auto px-6 md:px-14 lg:px-20 text-center flex flex-col items-center">
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Galeri" }
              ]} />
            </div>
            <p className="text-brand-accent text-[10px] tracking-[0.6em] uppercase font-sans font-medium mb-5">
              Visual Showcase
            </p>
            {/* H1 dipertegas dengan modifier (Galeri Foto & Video Kawasan)
                supaya halaman ini menyasar query visual, bukan query brand
                yang jadi milik homepage. */}
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight text-[#F5F1E8] mb-6">
              {PAGE_H1}
            </h1>
            <p className="text-[#F5F1E8]/50 text-base md:text-lg font-light max-w-xl mx-auto leading-relaxed">
              Jelajahi setiap sudut kawasan hunian prestisius{" "}
              <Link href="/" className="text-brand-accent hover:underline">Grand Duta City Parung</Link>, dari arsitektur modern hingga fasilitas eksklusif kelas dunia.
            </p>
          </div>
        </section>

        <Gallery />
      </main>
      <Footer />
    </>
  );
}
