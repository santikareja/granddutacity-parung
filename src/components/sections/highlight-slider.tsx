"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles, ArrowUpRight } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { clImg } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import Link from "next/link";

const slides = [
  {
    id: 1,
    tag: "EXTERIOR",
    title: "Main Gate Grand Duta City",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Main_Gate_sdap2y.webp", { w: 600, h: 450 }),
  },
  {
    id: 2,
    tag: "FACILITY",
    title: "Suasana The Beach",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Suasana_The_Beach_gftttj.webp", { w: 600, h: 450 }),
  },
  {
    id: 3,
    tag: "NATURE",
    title: "Ruang Terbuka Hijau",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Ruang_Terbuka_Hijau_ukddtl.webp", { w: 600, h: 450 }),
  },
  {
    id: 4,
    tag: "LIFESTYLE",
    title: "Garden Cafe Meeting Point",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Garden_Cafe_frlfck.webp", { w: 600, h: 450 }),
  },
  {
    id: 5,
    tag: "FACILITY",
    title: "Cluster Private Pool",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Cluster_Private_Pool_cyvher.webp", { w: 600, h: 450 }),
  },
  {
    id: 6,
    tag: "INTERIOR",
    title: "Interior Kamar Utama",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Kamar_Utama_ledb1e.webp", { w: 600, h: 450 }),
  },
  {
    id: 7,
    tag: "EXTERIOR",
    title: "Boulevard Grand Duta City",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Boulevard_znvd7b.webp", { w: 600, h: 450 }),
  },
  {
    id: 8,
    tag: "FACILITY",
    title: "Co-Working Space",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Co_Working_Space_uykj46.webp", { w: 600, h: 450 }),
  },
  {
    id: 9,
    tag: "LIFESTYLE",
    title: "The Beach Malam Hari",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/The_Beach_Malam_bfnhas.webp", { w: 600, h: 450 }),
  },
  {
    id: 10,
    tag: "EXTERIOR",
    title: "Lingkungan Cluster",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Lingkungan_Cluster_iwnukl.webp", { w: 600, h: 450 }),
  },
];

export function HighlightSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false }, [
    Autoplay({ delay: 4500, stopOnInteraction: false }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; slideId: number }>({ isOpen: false, slideId: 0 });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const currentSlide = slides.find((s) => s.id === lightboxState.slideId);

  return (
    <section id="highlight-slider" className="py-16 sm:py-24 md:py-36 bg-[#F8F6F0] text-[#090D0A] relative overflow-hidden border-t border-[#090D0A]/6">
      {/* Texture Background */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 lg:px-16 relative z-10">
        
        {/* Header Bar */}
        <div className="mb-8 sm:mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] mb-2 sm:mb-3 w-max">
              <Sparkles className="w-3 h-3 text-[#D49A3D]" />
              <span>Lifestyle Highlights</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-[#090D0A] leading-[1.18] sm:leading-[1.15]">
              Eksplorasi Suasana <br />
              <span className="italic font-normal text-[#B45309]">Kawasan Eksklusif</span>
            </h2>
          </motion.div>
          
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={scrollPrev}
              aria-label="Previous slide"
              className="w-9 h-9 sm:w-11 sm:h-11 border border-[#090D0A]/15 hover:border-[#D49A3D] flex items-center justify-center text-[#090D0A] hover:text-[#D49A3D] hover:bg-white rounded-full shadow-xs transition-all duration-300 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next slide"
              className="w-9 h-9 sm:w-11 sm:h-11 border border-[#090D0A]/15 hover:border-[#D49A3D] flex items-center justify-center text-[#090D0A] hover:text-[#D49A3D] hover:bg-white rounded-full shadow-xs transition-all duration-300 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3.5 sm:gap-5 md:gap-6">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className="relative flex-[0_0_82%] sm:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0 aspect-[4/3] group/slide rounded-[1.75rem] sm:rounded-[2rem] p-1.5 bg-[#090D0A]/5 border border-[#090D0A]/8 shadow-[0_12px_30px_rgba(9,13,10,0.06)] hover:shadow-[0_20px_45px_rgba(9,13,10,0.12)] transition-all duration-500 cursor-pointer overflow-hidden select-none"
                  onClick={() => setLightboxState({ isOpen: true, slideId: slide.id })}
                >
                  <div className="relative w-full h-full rounded-[calc(1.75rem-0.25rem)] sm:rounded-[calc(2rem-0.375rem)] overflow-hidden bg-black/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority={index < 4}
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/slide:scale-108"
                      sizes="(max-width: 480px) 370px, (max-width: 768px) 50vw, 33vw"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090D0A]/90 via-[#090D0A]/20 to-transparent pointer-events-none" />
                    
                    {/* Card Content Overlay */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4 z-20 pointer-events-none">
                      <span className="text-[#D49A3D] text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.25em] uppercase font-sans font-bold block mb-0.5 sm:mb-1">
                        {slide.tag}
                      </span>
                      <p className="text-[#F8F6F0] font-serif text-sm sm:text-lg font-bold leading-snug drop-shadow-md">
                        {slide.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar: Progress Dots + Gallery Link */}
          <div className="mt-6 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex justify-center gap-1.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Go to highlight slide ${index + 1}`}
                  className="p-1.5 focus:outline-none flex items-center justify-center cursor-pointer"
                >
                  <div 
                    className={cn(
                      "h-1.5 transition-all duration-500 rounded-full",
                      index === selectedIndex ? "w-7 bg-[#C8521A]" : "w-2 bg-[#090D0A]/20"
                    )}
                  />
                </button>
              ))}
            </div>

            <Link
              href="/galeri"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[#090D0A]/20 hover:border-[#B45309] text-[#090D0A]/80 hover:text-[#B45309] text-xs font-sans font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em] transition-all duration-300"
            >
              <span>Lihat Semua Dokumentasi Galeri</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {currentSlide && (
        <ImageLightbox
          isOpen={lightboxState.isOpen}
          onClose={() => setLightboxState({ isOpen: false, slideId: 0 })}
          src={currentSlide.image}
          alt={currentSlide.title}
          title={currentSlide.title}
        />
      )}
    </section>
  );
}
