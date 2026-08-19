import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { AboutDeveloper } from "@/components/sections/about-developer";

export const metadata: Metadata = {
  title: "About Developer - Duta Putra Land | Grand Duta City",
  description: "Duta Putra Land - Perusahaan Developer Real Estate Indonesia yang telah berdiri sejak 1983. Pengembang dari Grand Duta City South of Jakarta.",
  alternates: {
    canonical: "https://granddutacitysouthofjakarta.com/about",
  },
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
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AboutPage",
              "name": "About Developer - Duta Putra Land",
              "description": "Duta Putra Land - Perusahaan Developer Real Estate Indonesia yang telah berdiri sejak 1983. Pengembang dari Grand Duta City South of Jakarta.",
              "url": "https://granddutacitysouthofjakarta.com/about",
              "publisher": {
                "@type": "Organization",
                "name": "Duta Putra Land",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://granddutacitysouthofjakarta.com/logo.svg"
                }
              }
            })
          }}
        />
        <AboutDeveloper />
      </main>
      <Footer />
    </>
  );
}
