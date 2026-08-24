"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import React, { useState } from "react";
import { clImg } from "@/lib/cloudinary";
import { Reveal } from "@/components/ui/reveal";
import { 
  Navigation2, 
  Wallet, 
  ShieldCheck, 
  Building2, 
  TrendingUp, 
  Sparkles,
  ArrowUpRight
} from "lucide-react";

const imageList = [
  { url: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Harga_Promo_Grand_Duta_City_South_of_Jakarta_pbj2gv.webp", { w: 680, h: 850, q: "auto" }), alt: "Harga Promo Grand Duta City South of Jakarta Parung" },
  { url: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Kawasan_Grand_Duta_City_Parung_vusyk3.webp", { w: 680, h: 850, q: "auto" }), alt: "Kawasan Perumahan Grand Duta City Parung" },
  { url: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Lingkungan_Perumahan_Grand_Duta_City_South_of_Jakarta_uyfgbi.webp", { w: 680, h: 850, q: "auto" }), alt: "Lingkungan Perumahan Grand Duta City South of Jakarta" },
  { url: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Fasad_GDC_ptpex3.webp", { w: 680, h: 850, q: "auto" }), alt: "Fasad Rumah Grand Duta City Parung" },
  { url: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Lingkungan_GDC_Parung_aw7ljq.webp", { w: 680, h: 850, q: "auto" }), alt: "Lingkungan Asri GDC Parung" },
  { url: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/GDC_Parung_lbfaw3.webp", { w: 680, h: 850, q: "auto" }), alt: "Fasilitas Grand Duta City Parung" },
];

function StackedImageSlider() {
  const [index, setIndex] = useState(0);

  const handleClick = () => {
    setIndex((prev) => (prev + 1) % imageList.length);
  };

  return (
    <div
      className="relative w-full aspect-[4/5] cursor-pointer group pt-8 select-none"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Klik untuk melihat foto dokumentasi selanjutnya"
    >
      {imageList.map((img, i) => {
        const position = (i - index + imageList.length) % imageList.length;

        const isFront = position === 0;
        const isSecond = position === 1;
        const isThird = position === 2;
        const isHidden = position > 2;

        return (
          <motion.div
            key={img.url}
            initial={false}
            animate={{
              y: isFront ? 0 : isSecond ? -14 : isThird ? -26 : -38,
              x: isFront ? 0 : isSecond ? 14 : isThird ? -14 : 0,
              rotate: isFront ? 0 : isSecond ? 3 : isThird ? -2.5 : 0,
              scale: isFront ? 1 : isSecond ? 0.94 : isThird ? 0.88 : 0.82,
              zIndex: imageList.length - position,
              opacity: isHidden ? 0 : 1,
            }}
            transition={{ duration: 0.5, type: "spring", stiffness: 350, damping: 25 }}
            style={{ transformOrigin: "bottom center" }}
            className="absolute top-8 left-4 right-4 bottom-2 rounded-[2rem] p-2 bg-[#090D0A]/5 border border-[#090D0A]/10 shadow-[0_20px_40px_rgba(9,13,10,0.14)]"
          >
            <div className="relative w-full h-full rounded-[calc(2rem-0.5rem)] overflow-hidden bg-black/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <Image
                src={img.url}
                alt={img.alt}
                fill
                // Kartu dibatasi max-w 320/420px — ukuran realistis, bukan 50vw.
                sizes="(max-width: 351px) calc(100vw - 2rem), 420px"
                loading="lazy"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              />
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/75 lg:bg-black/60 lg:backdrop-blur-md text-[10px] text-white/90 uppercase tracking-widest font-sans font-medium">
                {i + 1} / {imageList.length} · Tap Next
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const reasons = [
  {
    icon: Navigation2,
    tag: "Konektivitas",
    title: "Akses Tol Strategis",
    desc: "Hanya 15 menit ke 4 exit tol utama: Pamulang (Desari), Krukut, Sawangan, dan Bojong Gede.",
    colSpan: "lg:col-span-4",
  },
  {
    icon: Wallet,
    tag: "Finansial",
    title: "Mulai 700 Jutaan",
    desc: "Cicilan KPR mulai Rp 4 jutaan/bulan dengan Promo Tanpa DP* dan pre-approval 8 bank rekanan.",
    colSpan: "lg:col-span-4",
  },
  {
    icon: ShieldCheck,
    tag: "Keamanan",
    title: "Aman & Bebas Banjir",
    desc: "One Gate System, CCTV 24/7, dan polder system terpadu berskala kota di elevasi tanah optimal.",
    colSpan: "lg:col-span-4",
  },
  {
    icon: Building2,
    tag: "Reputasi",
    title: "Developer 35+ Tahun",
    desc: "Duta Putra Land — dedikasi lebih dari 35 tahun membangun mahakarya kota mandiri di Indonesia.",
    colSpan: "lg:col-span-6",
  },
  {
    icon: TrendingUp,
    tag: "Investasi",
    title: "Capital Gain Tinggi",
    desc: "Sunrise property terbaik di koridor selatan Jakarta yang dilewati rencana Tol JORR 3 untuk apresiasi maksimal.",
    colSpan: "lg:col-span-6",
  },
];

export function WhyGdc() {
  return (
    <section
      id="why-gdc"
      aria-labelledby="why-gdc-heading"
      className="py-16 sm:py-24 md:py-36 bg-[#F8F6F0] text-[#090D0A] overflow-hidden relative z-20"
    >
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 relative z-10">
        
        {/* Top Hero Grid: Narrative + Stacked Interactive Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center mb-12 sm:mb-20">
          
          {/* Left Column: Narrative Content */}
          <Reveal className="lg:col-span-7 flex flex-col justify-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] mb-3 sm:mb-6 w-max">
              <Sparkles className="w-3 h-3 text-[#D49A3D]" />
              <span>Investasi Properti Bogor Terbaik</span>
            </div>

            <h2
              id="why-gdc-heading"
              className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold leading-[1.18] sm:leading-[1.12] text-[#090D0A] mb-4 sm:mb-5"
            >
              Kenapa Memilih Hunian{" "}
              <span className="italic font-normal text-[#B45309]">Grand Duta City Parung?</span>
            </h2>

            <div className="w-12 sm:w-16 h-0.5 bg-[#D49A3D] mb-5 sm:mb-6" />

            <p className="text-[#090D0A]/75 text-xs sm:text-base md:text-lg font-normal leading-[1.8] sm:leading-[1.85] max-w-xl mb-6 sm:mb-8">
              Kawasan kota mandiri terluas <span className="font-bold text-[#090D0A]">200 Ha</span> di koridor emas Parung, menghubungkan Jakarta Selatan, Depok, BSD, dan Bogor. Dilengkapi masterplan terpadu area hijau 80 Ha, The Beach, Central Park, dan akses cepat menuju 4 exit tol utama.
            </p>

            {/* Micro Stats Bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3.5 sm:p-5 rounded-2xl bg-white border border-[#090D0A]/8 shadow-[0_10px_30px_rgba(9,13,10,0.04)]">
              <div>
                <p className="font-serif text-lg sm:text-2xl lg:text-3xl font-bold text-[#B45309]">200 Ha</p>
                <p className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#090D0A]/60 font-sans mt-0.5">Kota Mandiri</p>
              </div>
              <div className="border-l border-[#090D0A]/10 pl-2.5 sm:pl-4">
                <p className="font-serif text-lg sm:text-2xl lg:text-3xl font-bold text-[#B45309]">4 Tol</p>
                <p className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#090D0A]/60 font-sans mt-0.5">Akses Exit Tol</p>
              </div>
              <div className="border-l border-[#090D0A]/10 pl-2.5 sm:pl-4">
                <p className="font-serif text-base sm:text-2xl lg:text-3xl font-bold text-[#B45309] whitespace-nowrap">DP Rp.0</p>
                <p className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#090D0A]/60 font-sans mt-0.5">Promo Aktif</p>
              </div>
            </div>
          </Reveal>

          {/* Right Column: Stacked Image Card */}
          <Reveal
            from="fade"
            delay={120}
            className="lg:col-span-5 relative w-full max-w-[320px] sm:max-w-[420px] mx-auto lg:ml-auto"
          >
            <StackedImageSlider />
          </Reveal>
        </div>

        {/* Asymmetrical Bento Grid for Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
          {reasons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal
                key={item.title}
                delay={70 * idx}
                className={`${item.colSpan} group relative rounded-[1.75rem] sm:rounded-[2rem] p-1 bg-[#090D0A]/[0.02] border border-[#090D0A]/8 hover:border-[#D49A3D]/40 shadow-[0_10px_30px_rgba(9,13,10,0.03)] hover:shadow-[0_20px_40px_rgba(212,154,61,0.12)] transition-all duration-500`}
              >
                <div className="h-full rounded-[calc(1.75rem-0.25rem)] sm:rounded-[calc(2rem-0.375rem)] p-5 sm:p-7 bg-white flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-[#090D0A]/5 group-hover:bg-[#C8521A] text-[#B45309] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                        <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-bold text-[#090D0A]/40 group-hover:text-[#B45309] transition-colors">
                        {item.tag}
                      </span>
                    </div>

                    <p className="font-serif text-lg sm:text-xl font-bold text-[#090D0A] mb-2 group-hover:text-[#B45309] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[#090D0A]/70 text-xs sm:text-sm font-normal leading-[1.75]">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#090D0A]/5 flex items-center justify-between text-[11px] font-sans font-semibold text-[#090D0A]/60 group-hover:text-[#B45309] transition-colors">
                    <span>Pelajari Keunggulan</span>
                    <ArrowUpRight className="w-3.5 h-3.5 -translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
