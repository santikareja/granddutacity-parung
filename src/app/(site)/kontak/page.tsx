import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Camera,
  Globe,
  Play,
  ArrowRight, 
  Map as MapIcon,
  CalendarDays
} from "lucide-react";
import { ContactForm } from "@/components/sections/contact-form";
import { SCHEMA_ID, breadcrumbNode, graph, ref } from "@/lib/schema";
import { OG_SITE_NAME } from "@/lib/seo";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const PAGE_URL = "https://granddutacitysouthofjakarta.com/kontak";
const IMAGE_URL = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775884994/kontak-marketing-grand-duta-city-south-of-jakarta-parung_m4csyj.webp";

/**
 * H1 dipecah jadi dua bagian karena tata letaknya butuh <br/> + span italic
 * (lihat JSX di bawah). `PAGE_H1` menggabungnya jadi satu string untuk guard
 * G19 (seo-invariants.test.ts) — JSX WAJIB merender kedua konstanta ini, bukan
 * literal terpisah, supaya tidak ada risiko teks yang diuji menyimpang dari
 * yang benar-benar tayang.
 */
const PAGE_H1_LEAD = "Kontak Marketing";
const PAGE_H1_TAIL = "GDC Parung";
export const PAGE_H1 = `${PAGE_H1_LEAD} ${PAGE_H1_TAIL}`;

// Title dipendekkan dari 85 -> 48 karakter (brand muncul dua kali sebelumnya).
// Keyword "marketing grand duta city parung south of jakarta" dicabut karena
// memuat frasa target homepage.
const PAGE_TITLE = "Kontak Marketing GDC Parung | Jadwal Survey Unit";
const PAGE_DESCRIPTION =
  "Hubungi tim marketing GDC Parung via WhatsApp untuk jadwal survey lokasi, cek stok unit terbaru, pricelist resmi, simulasi KPR, dan proses booking unit.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "kontak marketing gdc parung",
    "nomor marketing gdc parung",
    "whatsapp marketing gdc parung",
    "jadwal survey gdc parung",
    "marketing gallery parung bogor",
  ],
  alternates: {
    canonical: PAGE_URL,
  },
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
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: OG_SITE_NAME,
    locale: "id_ID",
    type: "website",
    images: [{ url: IMAGE_URL, width: 1200, height: 630, alt: "Kontak Marketing Grand Duta City Parung" }],
  },
};

/**
 * SATU `@graph` menggantikan empat blok lepas (Fase 5).
 *
 * DUA konflik nyata dibereskan di sini:
 *
 *  1. Halaman ini MENDEFINISIKAN ULANG `#organization` dengan versi tipis
 *     (hanya name/url/logo/contactPoint). Karena `@id`-nya sama dengan node
 *     lengkap di homepage, Google menerima dua deskripsi berbeda untuk satu
 *     entitas dan bebas memilih yang mana pun — termasuk yang tipis. Sekarang
 *     halaman ini hanya MERUJUK.
 *
 *  2. `RealEstateAgent` di sini anonim (tanpa `@id`) dan memuat koordinat
 *     -6.450274, 106.719312 — BERBEDA dari kantor pemasaran di homepage
 *     (-6.462459, 106.729392) padahal alamat jalannya identik. Satu alamat
 *     dengan dua titik peta adalah data yang saling meniadakan, dan sinyal
 *     lokasi adalah salah satu yang paling menentukan untuk query lokal.
 *     Sekarang keduanya satu node: `#salesoffice`.
 */
const pageSchema = graph([
  breadcrumbNode([{ name: "Kontak", path: "/kontak" }], PAGE_URL),
  {
    "@type": "ContactPage",
    "@id": `${PAGE_URL}#webpage`,
    name: "Kontak Marketing Grand Duta City Parung",
    description:
      "Halaman kontak resmi untuk informasi dan marketing Grand Duta City Parung South of Jakarta.",
    url: PAGE_URL,
    inLanguage: "id",
    isPartOf: ref(SCHEMA_ID.website),
    about: ref(SCHEMA_ID.project),
    breadcrumb: ref(`${PAGE_URL}#breadcrumb`),
    mainEntity: ref(SCHEMA_ID.salesOffice),
    primaryImageOfPage: {
      "@type": "ImageObject",
      "@id": `${PAGE_URL}#primaryimage`,
      url: IMAGE_URL,
      contentUrl: IMAGE_URL,
      caption: "Kontak Marketing Grand Duta City Parung",
    },
  },
]);

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-[#0b120c] font-sans pb-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />

        {/* Hero Section */}
        <section className="relative min-h-[480px] sm:min-h-[550px] md:h-[65vh] flex items-center justify-center pt-24 pb-16">
          <Image 
            src={IMAGE_URL}
            alt="Kontak Marketing Grand Duta City Parung"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b120c]/85 via-[#0b120c]/45 to-[#0b120c]" />
          
          <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col items-center">
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Kontak" }
              ]} />
            </div>
            <span className="text-[#F5A524] text-xs md:text-sm tracking-[0.4em] uppercase font-bold mb-4 block animate-in fade-in slide-in-from-bottom-4 duration-700">
               Informasi & Reservasi
            </span>
            {/* H1 sebelumnya membaca "Kontak Marketing Grand Duta City Parung"
                — persis mengulang frasa target homepage. Diringkas ke "GDC
                Parung"; frasa penuhnya tetap ada di paragraf bawah sebagai
                anchor internal ke "/". */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#F5F1E8] mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {PAGE_H1_LEAD} <br />
              <span className="text-[#F5A524] italic">{PAGE_H1_TAIL}</span>
            </h1>
            <p className="text-[#F5F1E8]/70 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Hubungi tim marketing{" "}
              <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>{" "}
              untuk informasi Cluster Ladera, Cluster Cascada, harga terbaru, siteplan, dan jadwal survey lokasi.
            </p>
          </div>
        </section>

        {/* Contact Grid & Form */}
        <section className="relative z-10 mt-2 sm:-mt-6 md:-mt-8 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Contact Info - Left */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0b120c] border border-[#F5F1E8]/5 p-6 sm:p-10 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-serif text-[#F5F1E8] mb-8 border-b border-[#F5F1E8]/10 pb-4">Info Kantor Pemasaran</h2>
                
                <div className="space-y-8">
                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-light/5 flex items-center justify-center shrink-0 border border-[#F5F1E8]/10">
                      <Phone className="w-5 h-5 text-[#F5A524]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#F5F1E8]/40 mb-1">WhatsApp Fast Response</p>
                      <a href="https://wa.me/628131742034" data-wa-placement="kontak-phone-number" className="text-lg sm:text-xl text-[#F5F1E8] hover:text-[#F5A524] transition-colors font-medium">0813 1742 034</a>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-light/5 flex items-center justify-center shrink-0 border border-[#F5F1E8]/10">
                      <Mail className="w-5 h-5 text-[#F5A524]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#F5F1E8]/40 mb-1">Email Informasi</p>
                      <a href="mailto:contact@granddutacitysouthofjakarta.com" className="text-base sm:text-lg text-[#F5F1E8] hover:text-[#F5A524] transition-colors break-all">contact@granddutacitysouthofjakarta.com</a>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-light/5 flex items-center justify-center shrink-0 border border-[#F5F1E8]/10">
                      <MapPin className="w-5 h-5 text-[#F5A524]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#F5F1E8]/40 mb-1">Lokasi Gallery</p>
                      <p className="text-[#F5F1E8]/80 leading-relaxed">
                        Jl. Raya Parung No. 47, Jabon Mekar, Kec. Parung, Kabupaten Bogor, Jawa Barat 16330.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-light/5 flex items-center justify-center shrink-0 border border-[#F5F1E8]/10">
                      <Clock className="w-5 h-5 text-[#F5A524]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#F5F1E8]/40 mb-1">Jam Operasional</p>
                      <p className="text-[#F5F1E8]/80 font-medium">Setiap Hari: 09:00 - 18:00 WIB</p>
                      <p className="text-[#F5F1E8]/40 text-[11px] mt-1">(Termasuk Sabtu, Minggu & Hari Libur)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-[#F5F1E8]/10 flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-3">
                  <a href="https://www.instagram.com/granddutacityparungsoj/" target="_blank" rel="noopener noreferrer" className="text-[#F5F1E8]/50 hover:text-[#F5F1E8] transition-colors flex items-center gap-2 group">
                    <Camera className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-widest font-bold group-hover:text-[#F5A524]">Instagram</span>
                  </a>
                  <a href="https://www.youtube.com/@marketinggdcparung" target="_blank" rel="noopener noreferrer" className="text-[#F5F1E8]/50 hover:text-[#F5F1E8] transition-colors flex items-center gap-2 group">
                    <Play className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-widest font-bold group-hover:text-[#F5A524]">YouTube</span>
                  </a>
                  <a href="https://dutaputraland.com/main/public/" target="_blank" rel="noopener noreferrer" className="text-[#F5F1E8]/50 hover:text-[#F5F1E8] transition-colors flex items-center gap-2 group">
                    <Globe className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-widest font-bold group-hover:text-[#F5A524]">Developer</span>
                  </a>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <a href="https://maps.app.goo.gl/JwizUuN2ssKZH9tZ9" target="_blank" rel="noreferrer" className="bg-[#F5A524] hover:bg-[#DE5E1E] hover:text-white text-[#0b120c] p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all group flex flex-col justify-between min-h-[110px] sm:h-32">
                  <MapIcon className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest leading-tight">Petunjuk <br />Arah Lokasi</span>
                </a>
                <Link href="/cara-beli-kpr" className="bg-brand-light/5 hover:bg-brand-light/10 border border-[#F5F1E8]/10 text-[#F5F1E8] p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all group flex flex-col justify-between min-h-[110px] sm:h-32">
                   <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5A524] mb-2" />
                   <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest leading-tight">Pelajari <br />Proses KPR</span>
                </Link>
              </div>
            </div>

            {/* Form - Right */}
            <div className="lg:col-span-7">
               <div className="mb-6 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#F5A524] animate-pulse" />
                 <h2 className="text-[#F5F1E8]/80 text-sm uppercase tracking-[0.3em] font-medium">Form Inquiry & Survey</h2>
               </div>
               <ContactForm />
            </div>

          </div>
        </section>

        {/* Map Section */}
        <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-serif text-[#F5F1E8] mb-4">Lokasi Marketing Gallery</h2>
              <p className="text-[#F5F1E8]/50">Kunjungi Marketing Gallery kami untuk melihat show unit secara langsung.</p>
           </div>
           
           <div className="w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden border border-[#F5F1E8]/5 shadow-2xl relative">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253732.32226734902!2d106.42872768671872!3d-6.449526399999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69e700089c4763%3A0x5592c1a5a0984a0b!2sGrand%20Duta%20City!5e0!3m2!1sid!2sid!4v1787166835189!5m2!1sid!2sid" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale opacity-80 contrast-125 saturate-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
              />
           </div>
        </section>

        {/* Internal Links - Footer of content */}
        <section className="py-16 bg-[#0b120c] border-y border-[#F5F1E8]/5">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h3 className="text-center text-[#F5F1E8]/50 text-xs uppercase tracking-[0.5em] mb-12">Informasi Penting Lainnya</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              <Link href="/cluster-ladera" className="flex flex-col items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-[#F5F1E8]/10 flex items-center justify-center group-hover:border-[#F5A524] transition-colors">
                  <ArrowRight className="w-4 h-4 text-[#F5A524]" />
                </div>
                <span className="text-[10px] text-[#F5F1E8]/60 group-hover:text-[#F5F1E8] uppercase tracking-widest font-bold text-center px-1">Ladera</span>
              </Link>

              <Link href="/cluster-cascada" className="flex flex-col items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-[#F5F1E8]/10 flex items-center justify-center group-hover:border-[#F5A524] transition-colors">
                  <ArrowRight className="w-4 h-4 text-[#F5A524]" />
                </div>
                <span className="text-[10px] text-[#F5F1E8]/60 group-hover:text-[#F5F1E8] uppercase tracking-widest font-bold text-center px-1">Cascada</span>
              </Link>

              <Link href="/pricelist-grand-duta-city" className="flex flex-col items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-[#F5F1E8]/10 flex items-center justify-center group-hover:border-[#F5A524] transition-colors">
                  <ArrowRight className="w-4 h-4 text-[#F5A524]" />
                </div>
                <span className="text-[10px] text-[#F5F1E8]/60 group-hover:text-[#F5F1E8] uppercase tracking-widest font-bold text-center px-1">Lihat Harga Terbaru</span>
              </Link>

              <Link href="/update-stok-siteplan-grand-duta-city-parung" className="flex flex-col items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-[#F5F1E8]/10 flex items-center justify-center group-hover:border-[#F5A524] transition-colors">
                  <ArrowRight className="w-4 h-4 text-[#F5A524]" />
                </div>
                <span className="text-[10px] text-[#F5F1E8]/60 group-hover:text-[#F5F1E8] uppercase tracking-widest font-bold text-center">Lihat Update Stok Unit</span>
              </Link>

              <Link href="/cara-beli-kpr" className="flex flex-col items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-[#F5F1E8]/10 flex items-center justify-center group-hover:border-[#F5A524] transition-colors">
                  <ArrowRight className="w-4 h-4 text-[#F5A524]" />
                </div>
                <span className="text-[10px] text-[#F5F1E8]/60 group-hover:text-[#F5F1E8] uppercase tracking-widest font-bold text-center">Pelajari Proses KPR</span>
              </Link>

              <Link href="/lokasi-akses-gdc-parung" className="flex flex-col items-center gap-4 group">
                <div className="w-12 h-12 rounded-full border border-[#F5F1E8]/10 flex items-center justify-center group-hover:border-[#F5A524] transition-colors">
                  <ArrowRight className="w-4 h-4 text-[#F5A524]" />
                </div>
                <span className="text-[10px] text-[#F5F1E8]/60 group-hover:text-[#F5F1E8] uppercase tracking-widest font-bold text-center px-1">Lihat Lokasi Proyek</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Floating Contact CTA Mobile only button could go here, but Header has it */}
      </main>
      <Footer />
    </>
  );
}
