"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const timeline = [
  {
    period: "1983 - 1990",
    categories: [
      { name: "RESIDENTIAL", items: ["Pondok Duta", "Pondok Hijau", "Duta Indah", "Taman Kedaung"] }
    ]
  },
  {
    period: "1990 - 1995",
    categories: [
      { name: "NEW TOWN", items: ["Kota Legenda", "Grand Wisata"] },
      { name: "RESIDENTIAL", items: ["Nerada", "Vila Dago", "Duta Garden"] }
    ]
  },
  {
    period: "1995 - 2000",
    categories: [
      { name: "OFFICE", items: ["DEA Tower 1", "Arkadia Office Park"] },
      { name: "NEW TOWN", items: ["Telaga Kahuripan", "Grand Wisata", "Kota Legenda"] },
      { name: "RESIDENTIAL", items: ["Vila Dago", "Pondok Ungu", "Candrabraga", "Nerada", "Duta Bintaro"] }
    ]
  },
  {
    period: "2000 - 2010",
    categories: [
      { name: "APARTMENT", items: ["Palm Court", "Arkadia Apartment", "Gading Icon"] },
      { name: "OFFICE", items: ["Secure Building Halim", "DEA Tower 2", "Arkadia Office Park"] },
      { name: "NEW TOWN", items: ["Grand Wisata", "Telaga Kahuripan"] },
      { name: "RESIDENTIAL", items: ["Bukit Dago", "Duta Garden", "Bukit Golf", "Pondok Ungu"] }
    ]
  },
  {
    period: "2010 - 2020",
    categories: [
      { name: "SUPERBLOCK", items: ["Cilandak Business Square (CIBIS)", "West One City"] },
      { name: "APARTMENT", items: ["La Vie Apartment", "Palm Court", "Gading Icon", "Bintaro Park View"] },
      { name: "OFFICE", items: ["Talavera Office Park", "Talavera Suites", "DEA Tower 2", "DEA Tower 1", "Arkadia Office Park"] },
      { name: "NEW TOWN", items: ["Harvest City", "Telaga Kahuripan", "Grand Wisata"] },
      { name: "RESIDENTIAL", items: ["Grand Duta City", "Bukit Dago", "Duta Garden", "Bukit Golf"] }
    ]
  }
];

export function AboutDeveloper() {
  return (
    <div className="relative overflow-hidden bg-[#0b120c]">
      {/* Hero Background with Overlay */}
      <div className="absolute top-0 left-0 w-full h-[100dvh] z-0">
        <Image
          src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775669435/Developer_Grand_Duta_City_South_of_Jakarta_Parung_kbfjms.webp"
          alt="Background Developer Grand Duta City South of Jakarta"
          fill
          priority={false}
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b120c]/10 via-[#0b120c]/60 to-[#0b120c]" />
      </div>

      <div className="relative z-10 pt-32 pb-24 md:pt-48 md:pb-32 text-[#F5F1E8] px-6 md:px-14 lg:px-20 max-w-screen-2xl mx-auto">
        
        {/* Texture Background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(white_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

        {/* Intro Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto mb-24 relative z-10"
        >
          <div className="mb-6">
            <Breadcrumb items={[
              { label: "Tentang Developer" }
            ]} />
          </div>
          <p className="text-[#F5A524] text-[10px] md:text-xs tracking-[0.4em] uppercase font-sans font-semibold mb-6">
            About Developer
          </p>
          <div className="w-full max-w-[200px] md:max-w-[300px] aspect-[2/1] mb-10 relative">
            <Image 
              src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775669124/Logo_Duta_Putra_Land_rq0kzk.webp"
              alt="Logo Duta Putra Land"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-tight mb-8 text-[#F5A524]">
            Duta Putra Land
          </h1>
          <div className="w-px h-16 bg-gradient-to-b from-[#F5A524] to-transparent mb-8" />
          <p className="text-xl md:text-2xl font-light text-[#F5F1E8]/80 leading-relaxed font-serif max-w-3xl">
            "Pengembangan properti bukan tentang kompetisi. Ini tentang menciptakan sinergi untuk membangun nilai terbaik bagi masyarakat kita."
          </p>
        </motion.div>

        {/* Overview Section */}
        <section className="mb-32 relative z-10 border-t border-[#F5A524]/20 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6 flex items-center gap-4">
                Overview
                <div className="h-px bg-[#F5F1E8]/20 flex-1" />
              </h2>
              <p className="text-lg text-[#F5F1E8]/70 font-light leading-relaxed mb-10 font-sans">
                Perusahaan Developer Real Estate Indonesia yang telah berdiri sejak 1983.
              </p>
              
              <div className="flex flex-col gap-12">
                <div>
                  <p className="text-6xl md:text-7xl font-serif text-[#F5A524] font-semibold mb-4">40<span className="text-3xl md:text-4xl text-[#F5F1E8]/40 ml-2">TAHUN</span></p>
                  <p className="text-[#F5F1E8]/60 font-light leading-relaxed font-sans text-sm max-w-md">
                    Kami konsisten dalam berdedikasi untuk menciptakan ruang untuk hunian kontemporer, gaya hidup maju dan budaya kerja yang melambangkan kemajuan sosial.
                  </p>
                </div>
                
                <div>
                  <p className="text-6xl md:text-7xl font-serif text-[#F5A524] font-semibold mb-4">38<span className="text-3xl md:text-4xl text-[#F5F1E8]/40 ml-2">PROYEK</span></p>
                  <p className="text-[#F5F1E8]/60 font-light leading-relaxed font-sans text-sm max-w-md mb-6">
                    Portofolio besar proyek kami terdiri dari perumahan, kota baru, kantor, apartemen, dan superblok.
                  </p>
                  <div className="inline-block p-5 border border-[#F5F1E8]/10 bg-[#F5F1E8]/[0.02] rounded-xl backdrop-blur-sm">
                    <p className="text-xs text-[#F5F1E8]/40 uppercase tracking-widest mb-2 font-sans">Projek Terbaru Kami:</p>
                    <Link href="/" className="inline-flex items-center text-[#F5A524] hover:text-[#F5F1E8] transition-colors duration-300 font-serif text-xl border-b border-[#F5A524]/30 hover:border-[#F5F1E8] pb-1 group">
                      Grand Duta City Parung
                      <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full aspect-[4/5] md:aspect-square lg:aspect-[4/5] relative rounded-3xl overflow-hidden shadow-2xl border border-[#F5F1E8]/10"
            >
              <Image 
                src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775669252/Penghargaan_Duta_Putra_Land_zq8mzq.webp"
                alt="Penghargaan Duta Putra Land"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="mb-32 relative z-10 bg-gradient-to-br from-white/5 to-transparent p-8 md:p-16 rounded-3xl border border-[#F5F1E8]/5">
          <h2 className="font-sans text-[10px] md:text-xs tracking-[0.4em] uppercase text-[#F5A524] font-bold mb-6">
            Masa Depan Dimulai Sekarang
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            <p className="text-lg md:text-xl text-[#F5F1E8]/80 font-serif font-light leading-relaxed">
              Kami tetap teguh dalam mengejar kekuatan untuk menata ulang dan mendefinisikan kembali realitas dengan mengintegrasikan filosofi yang mengutamakan manusia dengan bahan yang ramah lingkungan, metodologi konstruksi berkelanjutan, dan kemajuan teknologi.
            </p>
            <p className="text-lg md:text-xl text-[#F5F1E8]/80 font-serif font-light leading-relaxed">
              Kami memelihara dan berinvestasi pada generasi baru dengan talenta cerdas yang akan terus menetapkan standar untuk desain spasial dan kreasi yang berpusat pada manusia.
            </p>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="relative z-10 pt-10">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6">
              Jejak Langkah Kami
            </h2>
            <p className="text-[#F5A524] text-xs md:text-sm tracking-[0.3em] uppercase font-sans">
              Timeline Perjalanan 1983 - 2020
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24 max-w-5xl mx-auto relative border-l-2 border-[#F5A524]/30 pl-8 md:pl-16">
            {/* Timeline Node */}
            <div className="absolute top-0 bottom-0 left-[-1px] w-[2px] bg-gradient-to-b from-[#F5A524] via-[#F5A524]/50 to-transparent" />

            {timeline.map((era, index) => (
              <motion.div 
                key={era.period}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="relative"
              >
                {/* Dot */}
                <div className="absolute top-2 -left-[41px] md:-left-[73px] w-5 h-5 rounded-full bg-[#0b120c] border-[4px] border-[#F5A524] z-10" />
                
                <h3 className="text-3xl md:text-5xl font-serif text-[#F5F1E8]/90 font-bold mb-8">
                  {era.period}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-x-12 gap-y-10 border-b border-[#F5F1E8]/5 pb-16">
                  {era.categories.map((cat, i) => (
                    <div key={i} className="flex flex-col">
                      <p className="text-[#F5A524] font-sans text-[10px] tracking-[0.25em] font-semibold uppercase mb-4">
                        {cat.name}
                      </p>
                      <ul className="space-y-3">
                        {cat.items.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-[#F5A524] mr-3 font-bold">•</span>
                            <span className="text-[#F5F1E8]/70 font-light text-sm md:text-base">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Our Project Summary */}
        <section className="mt-32 border border-[#F5F1E8]/10 bg-[#F5F1E8]/[0.02] backdrop-blur-sm rounded-3xl p-10 md:p-16 text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-[#F5F1E8] mb-10">Our Project</h2>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {['RESIDENTIAL', 'NEW TOWN', 'OFFICE', 'APARTMENT', 'SUPERBLOCK'].map((type) => (
              <div key={type} className="px-6 py-3 border border-[#F5A524]/50 rounded-full text-[#F5F1E8]/80 font-sans text-xs tracking-widest uppercase hover:bg-[#F5A524] hover:text-[#F5F1E8] transition-all cursor-default">
                {type}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
