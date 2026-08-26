"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { ArrowUpRight, Building2, Award } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { useViewportVideo } from "@/components/ui/use-viewport-video";

const ABOUT_VIDEO_SRC =
  "https://res.cloudinary.com/dxgoshyei/video/upload/v1780901920/Membeli_rumah_pertama_itu_bukan_keputusan_kecil.Ada_banyak_hal_yang_perlu_dipertimbangkan_supaya_tdxtox.mp4";

export function About() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useViewportVideo(videoRef);

  // Defer the ~7 MB video download until the section is within 200% of the
  // viewport height. On Slow 4G this keeps the bandwidth free for above-the-fold
  // assets (hero video, fonts, CSS) that directly affect FCP / LCP.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!("IntersectionObserver" in window)) {
      video.src = ABOUT_VIDEO_SRC;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.src = ABOUT_VIDEO_SRC;
          video.load();
          observer.disconnect();
        }
      },
      { rootMargin: "200% 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="tentang-kami" className="py-16 sm:py-24 md:py-36 bg-[#F8F6F0] text-[#090D0A] relative overflow-hidden border-t border-[#090D0A]/6">

      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-16 items-center">

          {/* Left Column: 9:16 Vertical Video Frame with Double-Bezel Architecture */}
          <Reveal
            from="left"
            className="lg:col-span-5 relative w-full max-w-[320px] sm:max-w-md lg:max-w-none mx-auto order-2 lg:order-1"
          >
            {/* Double-Bezel Enclosure */}
            <div className="rounded-[2rem] sm:rounded-[2.25rem] p-1.5 sm:p-2 bg-[#090D0A]/5 border border-[#090D0A]/10 shadow-[0_25px_60px_rgba(9,13,10,0.12)]">
              <div className="relative w-full rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2.25rem-0.5rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" style={{ aspectRatio: "9/16" }}>
                <video
                  ref={videoRef}
                  loop
                  muted
                  playsInline
                  preload="none"
                  aria-label="Video Profile Developer Duta Putra Land"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Video Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090D0A]/70 via-transparent to-[#090D0A]/20 pointer-events-none" />

                {/* Floating Metallic Developer Credential Badge */}
                <Reveal
                  delay={280}
                  className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 bg-[#090D0A]/85 lg:backdrop-blur-xl border border-white/15 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] z-20"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#D49A3D]/20 border border-[#D49A3D]/30 flex items-center justify-center shrink-0 text-[#D49A3D]">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-[#D49A3D] text-[8px] sm:text-[9px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-sans font-bold">Master Developer</p>
                      <p className="font-serif text-[#F8F6F0] text-xs sm:text-base font-semibold leading-tight">Duta Putra Land</p>
                      <p className="text-[#F8F6F0]/50 text-[9px] sm:text-[10px] tracking-wider uppercase font-sans mt-0.5">Established Since 1983 · 35+ Years</p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          {/* Right Column: Editorial Storytelling */}
          <Reveal
            from="right"
            delay={100}
            className="lg:col-span-7 flex flex-col justify-start space-y-5 sm:space-y-8 order-1 lg:order-2"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] mb-3 sm:mb-4 w-max">
                <Building2 className="w-3 h-3 text-[#D49A3D]" />
                <span>Kawasan Mandiri Terpadu</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] sm:leading-[1.1] text-[#090D0A] mb-4 sm:mb-5">
                Tentang Kawasan <br />
                <span className="italic font-normal text-[#B45309]">Grand Duta City Parung</span>
              </h2>

              <div className="w-12 sm:w-16 h-0.5 bg-[#D49A3D] mb-4 sm:mb-6" />

             <div className="space-y-3.5 sm:space-y-4 text-[#090D0A]/75 text-xs sm:text-base md:text-lg leading-[1.8] sm:leading-[1.85] font-normal">
               <p>
                  Miliki hunian prestisius di Grand Duta City Parung — kota mandiri terluas{" "}
                  <span className="font-semibold text-[#090D0A]">200 Ha</span> di Parung, Kabupaten Bogor. Kawasan ini terintegrasi secara harmonis dengan area hijau 80 Ha, Central Park, The Beach Lagoon, dan pusat bisnis CBD modern dalam satu ekosistem terpadu.
                </p>
                <p>
                  Persembahan istimewa dari <span className="font-semibold text-[#090D0A]">Duta Putra Land</span> yang telah berpengalaman lebih dari 35 tahun membangun township ternama di Indonesia. Grand Duta City Parung terletak di koridor strategis Jakarta–Bogor yang dilewati rencana Tol JORR 3, hanya 20 menit ke CBD TB Simatupang Jakarta Selatan via Tol Desari & Pamulang.
                </p>
              </div>
            </div>

            {/* Stats matrix */}
            <div className="pt-4 sm:pt-6 border-t border-[#090D0A]/10 w-full">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-4 items-center">
                <div>
                  <p className="font-serif text-xl sm:text-3xl md:text-4xl text-[#B45309] font-bold">200 Ha</p>
                  <p className="text-[#090D0A]/60 text-[9px] sm:text-[11px] tracking-wider uppercase mt-1 font-sans">Township</p>
                </div>
                <div className="border-l border-r border-[#090D0A]/15 px-2 sm:px-4">
                  <p className="font-serif text-xl sm:text-3xl md:text-4xl text-[#B45309] font-bold">35+ Thn</p>
                  <p className="text-[#090D0A]/60 text-[9px] sm:text-[11px] tracking-wider uppercase mt-1 font-sans">Pengalaman</p>
                </div>
                <div className="pl-2 sm:pl-4">
                  <p className="font-serif text-xl sm:text-3xl md:text-4xl text-[#B45309] font-bold">20 Mnt</p>
                  <p className="text-[#090D0A]/60 text-[9px] sm:text-[11px] tracking-wider uppercase mt-1 font-sans">Ke Jaksel</p>
                </div>
              </div>
            </div>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
              <a
                href="https://wa.me/628131742034?text=Halo%2C%20saya%20mau%20konsultasi%20unit%20Grand%20Duta%20City%20Parung%20%28GDC%20SOJ%29.%20Mohon%20info%20harga%20%26%20promo%20terbaru."
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-3 pl-6 pr-2 py-3.5 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-xs sm:text-sm tracking-[0.16em] uppercase font-sans font-bold shadow-[0_8px_24px_rgba(200,82,26,0.35)] active:scale-[0.98] transition-all duration-300 text-center"
              >
                <span>Konsultasi Sekarang</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-white">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </a>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-[#090D0A]/20 hover:border-[#B45309] text-[#090D0A]/80 hover:text-[#B45309] text-xs sm:text-sm tracking-[0.16em] uppercase font-sans font-semibold active:scale-[0.98] transition-all duration-300 text-center"
              >
                Tentang Developer
              </Link>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
