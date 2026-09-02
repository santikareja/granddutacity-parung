"use client";

import Image from "next/image";
import Link from "next/link";
import { clImg } from "@/lib/cloudinary";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { betterLivingImages } from "@/data/homepage-images";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function BetterLiving() {
  return (
    <section className="py-16 sm:py-24 md:py-36 bg-[#F8F6F0] text-[#090D0A] relative overflow-hidden border-t border-[#090D0A]/6">
      
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 lg:gap-16 items-center">
          
          {/* Left: Narrative Content */}
          <Reveal className="lg:col-span-6 flex flex-col gap-3.5 sm:gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] w-max">
              <Sparkles className="w-3 h-3 text-[#D49A3D]" />
              <span>Future Proof Investment</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.18] sm:leading-[1.1] text-[#090D0A]">
              Better Living <br />
              <span className="italic font-normal text-[#B45309]">For Generations</span>
            </h2>

            <div className="w-12 sm:w-16 h-0.5 bg-[#D49A3D]" />

            <p className="text-[#090D0A]/75 text-xs sm:text-base md:text-lg font-normal leading-[1.8] sm:leading-[1.85] max-w-lg">
              Grand Duta City South of Jakarta dirancang untuk setiap fase kehidupan keluarga Anda — dari momen pertama si kecil hingga masa purna karya yang menenangkan. Hunian berarsitektur tropis modern di Parung Bogor dengan nilai investasi yang terus bertumbuh lintas generasi.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
              <a
                href="https://wa.me/628131742034?text=Halo%2C%20saya%20mau%20cek%20tipe%20rumah%20%26%20harga%20Grand%20Duta%20City%20Parung%20South%20of%20Jakarta."
                target="_blank"
                rel="noopener noreferrer"
                data-wa-placement="better-living"
                className="group relative inline-flex items-center justify-center gap-3 pl-6 pr-2 py-3.5 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-xs sm:text-sm tracking-[0.16em] uppercase font-sans font-bold shadow-[0_8px_24px_rgba(200,82,26,0.35)] active:scale-[0.98] transition-all duration-300 text-center"
              >
                <span>Cek Harga & Tipe</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-white">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </a>
              <Link
                href="/pricelist-grand-duta-city"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-[#090D0A]/20 hover:border-[#B45309] text-[#090D0A]/80 hover:text-[#B45309] text-xs sm:text-sm tracking-[0.16em] uppercase font-sans font-semibold active:scale-[0.98] transition-all duration-300 text-center"
              >
                Lihat Pricelist
              </Link>
            </div>
          </Reveal>

          {/* Right: Double-Bezel Interactive Slider */}
          <Reveal
            from="right"
            delay={120}
            className="lg:col-span-6 w-full h-full relative"
          >
            <div className="rounded-[2rem] sm:rounded-[2.5rem] p-1.5 sm:p-2 bg-[#090D0A]/5 border border-[#090D0A]/10 shadow-[0_20px_50px_rgba(9,13,10,0.08)]">
              <Carousel
                opts={{
                  align: "center",
                  loop: true,
                }}
                className="w-full rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2.5rem-0.5rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
              >
                <CarouselContent>
                  {betterLivingImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-[#090D0A]">
                        <Image
                          src={clImg(image.url, { w: 1000, q: "auto" })}
                          alt={image.alt}
                          fill
                          // Cloudinary sudah membatasi sumber ke 1000 px dan
                          // memilih format/kualitas; srcset Next hanya menambah
                          // HTML untuk carousel yang maksimal 560 CSS px.
                          unoptimized
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-3 sm:left-4 bg-white/90 border border-black/10 text-[#090D0A] hover:bg-[#090D0A] hover:text-white h-9 w-9 sm:h-10 sm:w-10" />
                <CarouselNext className="right-3 sm:right-4 bg-white/90 border border-black/10 text-[#090D0A] hover:bg-[#090D0A] hover:text-white h-9 w-9 sm:h-10 sm:w-10" />
              </Carousel>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
