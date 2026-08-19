import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { Gallery } from "@/components/sections/gallery";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Galeri Foto - Grand Duta City South of Jakarta",
  description: "Jelajahi koleksi foto eksklusif kawasan Grand Duta City South of Jakarta. Tampilkan interior mewah, area fasilitas, dan lingkungan hunian premium.",
  alternates: {
    canonical: "https://granddutacitysouthofjakarta.com/galeri",
  },
};

export default function GaleriPage() {
  return (
    <>
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
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight text-[#F5F1E8] mb-6">
              Galeri Foto
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
