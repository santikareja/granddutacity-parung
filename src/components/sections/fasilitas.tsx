"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { TreePine, Shield, Waves, Coffee, Wifi, Smile, MapPin, Sparkles, ArrowUpRight } from "lucide-react";
import { facilities, type FacilityIconKey } from "@/data/facilities";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Reveal } from "@/components/ui/reveal";

function FacilityImage({ src, alt, title, className }: { src: string; alt: string; title: string; className?: string }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div 
        className={cn(
          "group relative w-full rounded-3xl p-1.5 bg-[#090D0A]/5 border border-[#090D0A]/8 shadow-[0_15px_35px_rgba(9,13,10,0.06)] hover:shadow-[0_20px_45px_rgba(9,13,10,0.12)] transition-all duration-500 cursor-pointer overflow-hidden select-none",
          className
        )}
        onClick={() => setIsLightboxOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-full h-full rounded-[calc(1.5rem-0.375rem)] overflow-hidden bg-black/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          <Image 
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 480px) 340px, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isHovered && "scale-108"
            )}
          />
          {/* Gradient Scrim for readable text without solid background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090D0A]/85 via-[#090D0A]/20 to-transparent pointer-events-none" />

          {/* Clean Facility Title without Background Box */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 flex items-end justify-between z-10 pointer-events-none">
            <span className="text-[#F8F6F0] text-[10px] sm:text-xs tracking-[0.12em] sm:tracking-[0.16em] uppercase font-sans font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {title}
            </span>
            <span className="w-6 h-6 rounded-full bg-white/25 lg:bg-white/20 lg:backdrop-blur-md hidden sm:flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
              🔍
            </span>
          </div>
        </div>
      </div>

      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        src={src}
        alt={alt}
        title={title}
      />
    </>
  );
}

// Daftar fasilitas kini berasal dari src/data/facilities.ts (Fase 5) supaya
// kartu yang dilihat pengunjung dan `amenityFeature` pada schema `Place` di
// homepage memakai SATU sumber. Array lama menyimpan elemen JSX langsung,
// sehingga tidak bisa diimpor server component untuk keperluan schema.
const FACILITY_ICONS: Record<FacilityIconKey, ReactNode> = {
  tree: <TreePine className="w-4 h-4" />,
  waves: <Waves className="w-4 h-4" />,
  smile: <Smile className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  coffee: <Coffee className="w-4 h-4" />,
  wifi: <Wifi className="w-4 h-4" />,
  "map-pin": <MapPin className="w-4 h-4" />,
};

export function Fasilitas() {
  return (
    <section id="fasilitas" className="py-16 sm:py-24 md:py-36 bg-[#F8F6F0] text-[#090D0A] overflow-hidden relative border-t border-[#090D0A]/6">

      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-16 items-start">

          {/* Left Column: Narrative Content */}
          <Reveal from="left" className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] mb-3 sm:mb-4 w-max">
                <Sparkles className="w-3 h-3 text-[#D49A3D]" />
                <span>Resort Living Experience</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.18] sm:leading-[1.1] text-[#090D0A] mb-4 sm:mb-5">
                Close to Nature <br />
                <span className="italic font-normal text-[#B45309]">&amp; Modern CBD</span>
              </h2>

              <div className="w-12 sm:w-16 h-0.5 bg-[#D49A3D] mb-4 sm:mb-6" />

              <p className="text-[#090D0A]/75 text-xs sm:text-base md:text-lg font-normal leading-[1.8] sm:leading-[1.85]">
                Nikmati udara sejuk pegunungan, lingkungan berkontur yang asri, dan fasilitas township bertaraf internasional. Dirancang untuk menunjang kualitas hidup harmonis bagi Anda dan keluarga tercinta.
              </p>
            </div>

            {/* Facility List Matrix */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1 sm:pt-2">
              {facilities.map((fac, idx) => (
                <Reveal
                  key={idx}
                  from="left"
                  delay={45 * idx}
                  className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white border border-[#090D0A]/5 hover:border-[#D49A3D]/40 transition-colors shadow-xs"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#090D0A]/5 group-hover:bg-[#C8521A] text-[#B45309] group-hover:text-white flex items-center justify-center transition-colors duration-300 shrink-0">
                    {FACILITY_ICONS[fac.icon]}
                  </div>
                  <span className="text-[#090D0A]/80 text-[11px] sm:text-sm font-medium group-hover:text-[#090D0A] transition-colors leading-snug">
                    {fac.title}
                  </span>
                </Reveal>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 w-full sm:w-auto">
              <a
                href="https://wa.me/628131742034?text=Halo%2C%20saya%20mau%20tanya%20detail%20fasilitas%20%26%20kawasan%20Grand%20Duta%20City%20Parung%20South%20of%20Jakarta."
                target="_blank"
                rel="noopener noreferrer"
                data-wa-placement="fasilitas"
                className="group relative inline-flex items-center justify-center gap-3 pl-6 pr-2 py-3.5 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-xs sm:text-sm tracking-[0.16em] uppercase font-sans font-bold shadow-[0_8px_24px_rgba(200,82,26,0.35)] active:scale-[0.98] transition-all duration-300 text-center"
              >
                <span>Tanya Fasilitas</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-white">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </a>
              <a
                href="https://drive.google.com/file/d/11PoocIZ17I9Qogpiz_T5-fOV6-h05tFD/view"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-[#090D0A]/20 hover:border-[#B45309] text-[#090D0A]/80 hover:text-[#B45309] text-xs sm:text-sm tracking-[0.16em] uppercase font-sans font-semibold active:scale-[0.98] transition-all duration-300 text-center"
              >
                Unduh E-Brosur
              </a>
            </div>
          </Reveal>

          {/* Right Column: Luxury Bento Collage with Double-Bezel Frames */}
          <Reveal
            from="right"
            delay={120}
            className="lg:col-span-7 grid grid-cols-2 gap-2.5 sm:gap-4.5 h-auto sm:h-[540px] lg:h-[600px] w-full"
          >
            <div className="space-y-2.5 sm:space-y-4.5 mt-4 sm:mt-10">
              <FacilityImage 
                src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775495564/The_Beach_GDC_Parung_g47puk.webp"
                alt="The Beach Grand Duta City Parung"
                title="The Beach Lagoon"
                className="h-[135px] sm:h-[230px] lg:h-[270px]"
              />
              <FacilityImage 
                src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775495561/Central_Park_GDC_cfpyrb.webp"
                alt="Central Park Grand Duta City"
                title="Central Park"
                className="h-[155px] sm:h-[270px] lg:h-[300px]"
              />
            </div>

            <div className="space-y-2.5 sm:space-y-4.5">
              <FacilityImage 
                src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775546113/Area_CBD_GDC_Parung_smdlbw.webp"
                alt="CBD Grand Duta City South of Jakarta"
                title="Commercial CBD"
                className="h-[170px] sm:h-[290px] lg:h-[330px]"
              />
              <FacilityImage 
                src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775546113/Garden_Cafe_h3bnyc.webp"
                alt="Garden Cafe Grand Duta City"
                title="Garden Cafe & F&B"
                className="h-[125px] sm:h-[220px] lg:h-[250px]"
              />
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
