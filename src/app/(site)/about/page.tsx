import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { AboutDeveloper } from "@/components/sections/about-developer";
import {
  SCHEMA_ID,
  breadcrumbNode,
  graph,
  ref,
  serializeJsonLd,
} from "@/lib/schema";

const ABOUT_URL = "https://granddutacitysouthofjakarta.com/about";

// Halaman ini menyasar query DEVELOPER ("duta putra land", "developer properti
// sejak 1983"), bukan query PROYEK. Brand proyek dicabut dari title dan frasa
// "Grand Duta City South of Jakarta" dicabut dari description (Fase 1).
export const metadata: Metadata = {
  title: "Duta Putra Land: Developer Properti Sejak 1983",
  description:
    "Profil Duta Putra Land, pengembang real estate Indonesia sejak 1983: rekam jejak, filosofi Best Living For Generations, dan proyek kota mandiri di Parung.",
  alternates: {
    canonical: ABOUT_URL,
  },
};

/**
 * `BreadcrumbList` ditambahkan 4 September 2026.
 *
 * Halaman ini SUDAH merender breadcrumb yang terlihat ("Beranda › Tentang
 * Developer" di `about-developer.tsx`) tetapi tidak pernah mengemit
 * `BreadcrumbList`. Pola yang sama pernah ditemukan di seluruh halaman artikel
 * dan sudah diperbaiki; `/about` adalah satu-satunya sisa terakhirnya — dari 65
 * halaman non-homepage, hanya ia yang tidak punya breadcrumb terstruktur.
 *
 * Dua akibatnya: halaman ini kehilangan peluang breadcrumb rich result yang
 * masih aktif di SERP, dan homepage kehilangan satu sinyal yang menyatakannya
 * sebagai akar hierarki situs (item posisi 1 tiap breadcrumb selalu "Beranda").
 *
 * `name` entry sengaja "Tentang Developer" — SAMA dengan label breadcrumb
 * visualnya. Google meminta breadcrumb terstruktur mencerminkan jalur yang
 * dilihat pengguna, bukan daftar terpisah yang bisa menyimpang.
 *
 * `graph()` menggantikan dokumen tunggal supaya kedua node berada di satu
 * dokumen dan `AboutPage` bisa merujuk breadcrumb lewat `@id` — pola yang sama
 * dengan halaman lain di situs ini.
 */
const pageSchema = graph([
  breadcrumbNode([{ name: "Tentang Developer", path: "/about" }], ABOUT_URL),
  {
    "@type": "AboutPage",
    "@id": `${ABOUT_URL}#webpage`,
    name: "About Developer - Duta Putra Land",
    description:
      "Duta Putra Land adalah perusahaan developer real estate Indonesia yang berdiri sejak 1983 dan mengembangkan Grand Duta City Parung.",
    url: ABOUT_URL,
    inLanguage: "id-ID",
    isPartOf: ref(SCHEMA_ID.website),
    about: ref(SCHEMA_ID.organization),
    breadcrumb: ref(`${ABOUT_URL}#breadcrumb`),
    publisher: ref(SCHEMA_ID.organization),
  },
]);

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-[#0b120c]">
        {/* Schema.org JSON-LD for SEO AboutPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(pageSchema),
          }}
        />
        <AboutDeveloper />
      </main>
      <Footer />
    </>
  );
}
