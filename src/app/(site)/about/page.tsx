import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { AboutDeveloper } from "@/components/sections/about-developer";
import { SCHEMA_ID, ref, serializeJsonLd } from "@/lib/schema";

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

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${ABOUT_URL}#webpage`,
  name: "About Developer - Duta Putra Land",
  description:
    "Duta Putra Land adalah perusahaan developer real estate Indonesia yang berdiri sejak 1983 dan mengembangkan Grand Duta City Parung.",
  url: ABOUT_URL,
  inLanguage: "id-ID",
  isPartOf: ref(SCHEMA_ID.website),
  about: ref(SCHEMA_ID.organization),
  publisher: ref(SCHEMA_ID.organization),
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-[#0b120c]">
        {/* Schema.org JSON-LD for SEO AboutPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(aboutPageJsonLd),
          }}
        />
        <AboutDeveloper />
      </main>
      <Footer />
    </>
  );
}
