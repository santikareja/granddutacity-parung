"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Play, Clock, Users } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const VIDEO_ID = "AZLiHEyd9Yo";
const VIDEO_TITLE = "Video Kawasan Grand Duta City Parung - Hunian Premium South of Jakarta";

/**
 * YouTube Facade Pattern — menampilkan thumbnail terlebih dahulu,
 * iframe baru dimuat setelah pengguna klik tombol play.
 * Menghilangkan semua third-party cookies dari initial page load.
 */
export function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Gunakan youtube-nocookie.com untuk privacy-enhanced mode
  const embedUrl = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&showinfo=0&modestbranding=1&autoplay=1`;

  // YouTube thumbnail (maxresdefault untuk kualitas tertinggi)
  const thumbnailUrl = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

  return (
    <section 
      id="virtual-tour" 
      aria-labelledby="virtual-tour-heading"
      className="py-12 sm:py-16 md:py-24 bg-[#F8F6F0] text-[#090D0A] relative overflow-hidden border-t border-[#090D0A]/6"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 relative z-10">
        
        {/* Section Header */}
        <Reveal className="text-center mb-8 sm:mb-14 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] mb-4 sm:mb-6 w-max">
            <Play className="w-3 h-3 text-[#D49A3D]" />
            <span>Video Kawasan</span>
          </div>

          <h2 
            id="virtual-tour-heading"
            className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold leading-[1.18] sm:leading-[1.15] text-[#090D0A] mb-4 sm:mb-6"
          >
            Video Kawasan Grand Duta City Parung
          </h2>

          <p className="max-w-2xl text-[#090D0A]/70 text-xs sm:text-base font-normal leading-[1.8] mb-6 sm:mb-8">
            Jelajahi keindahan dan fasilitas premium Grand Duta City Parung melalui video kawasan. 
            Lihat langsung keindahannya langsung dari rumah Anda dan rasakan pengalaman mewah di area hunian terbesar Parung, 
            South of Jakarta dengan fasilitas kota mandiri 200 Ha.
          </p>

          {/* Video Stats */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[9px] sm:text-[11px] text-[#090D0A]/60 font-sans font-semibold tracking-wider">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D49A3D]" />
              <span>3 Menit Tour</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D49A3D]" />
              <span>Virtual HD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-[#D49A3D]" />
              <span>Aerial View</span>
            </div>
          </div>
        </Reveal>

        {/* Video Container */}
        <Reveal delay={120} className="relative w-full max-w-4xl mx-auto">
          {/* Video Wrapper with Premium Frame */}
          <div className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-[#090D0A]/5 border border-[#090D0A]/10 shadow-[0_25px_60px_rgba(9,13,10,0.12)] p-1.5 sm:p-2">
            
            {/* Inner Container */}
            <div className="relative w-full rounded-[calc(1.5rem-0.375rem)] sm:rounded-[calc(2rem-0.5rem)] overflow-hidden bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              
              {/* YouTube Facade → loads iframe only on click */}
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                {isPlaying ? (
                  <iframe
                    src={embedUrl}
                    title={VIDEO_TITLE}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full rounded-[calc(1.5rem-0.375rem)] sm:rounded-[calc(2rem-0.5rem)] border-0"
                  />
                ) : (
                  <button
                    type="button"
                    aria-label={`Putar video: ${VIDEO_TITLE}`}
                    onClick={handlePlay}
                    className="absolute inset-0 w-full h-full cursor-pointer group/play bg-[#090D0A] rounded-[calc(1.5rem-0.375rem)] sm:rounded-[calc(2rem-0.5rem)] overflow-hidden border-0 p-0"
                  >
                    {/* YouTube Thumbnail — via next/image: WebP responsif + cache panjang dari origin sendiri,
                        bukan JPEG 1280x720 dari i.ytimg.com yang TTL-nya hanya 2 jam. */}
                    <Image
                      src={thumbnailUrl}
                      alt={VIDEO_TITLE}
                      width={1280}
                      height={720}
                      sizes="(max-width: 960px) 100vw, 896px"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover opacity-85 group-hover/play:opacity-100 transition-opacity duration-300"
                    />

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090D0A]/60 via-[#090D0A]/20 to-transparent" />

                    {/* Center play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] group-hover/play:scale-110 group-hover/play:bg-white transition-all duration-300">
                        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 sm:w-8 sm:h-8 ml-1 text-[#FF0000]">
                          <path d="M8 5.14v14.72a1 1 0 001.5.86l11.4-7.36a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>

                    {/* "Tap to play" hint on mobile */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#090D0A]/70 backdrop-blur-sm text-white text-[10px] sm:text-xs tracking-wider font-sans font-medium sm:opacity-0 sm:group-hover/play:opacity-100 transition-opacity">
                      Klik untuk memutar video
                    </div>
                  </button>
                )}
              </div>

              {/* Overlay Gradient for Visual Enhancement */}
              <div className="absolute inset-0 pointer-events-none rounded-[calc(1.5rem-0.375rem)] sm:rounded-[calc(2rem-0.5rem)] bg-gradient-to-t from-transparent via-transparent to-[#090D0A]/5" />
            </div>

            {/* Floating Play Button Enhancement (when not playing) */}
            <div className="absolute top-4 right-4 z-10">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#090D0A]/90 lg:bg-[#090D0A]/80 lg:backdrop-blur-sm border border-white/15 text-white text-[10px] tracking-widest font-sans font-medium shadow-lg">
                <Play className="w-3 h-3" />
                <span>YOUTUBE</span>
              </div>
            </div>
          </div>
          
        </Reveal>

        {/* Call to Action */}
        <Reveal delay={200} className="text-center mt-12 sm:mt-16">
          <p className="text-[#090D0A]/70 text-xs sm:text-sm font-normal leading-[1.8] mb-6">
            Tertarik dengan Grand Duta City Parung?{" "}
            <span className="text-[#B45309] font-semibold">Hubungi marketing kami</span>{" "}
            untuk konsultasi langsung dan booking unit favorit Anda.
          </p>
          <a 
            href={`https://wa.me/628131742034?text=Halo%2C%20saya%20tertarik%20dengan%20video%20kawasan%20Grand%20Duta%20City%20Parung.%20Mohon%20info%20ketersediaan%20unit%20dan%20adwalkan%20site%20visit.`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 px-5 py-3 sm:px-7 sm:py-4 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white text-[10px] sm:text-sm tracking-[0.16em] uppercase font-sans font-bold shadow-[0_10px_30px_rgba(37,211,102,0.4)] active:scale-[0.98] transition-all duration-300"
          >
            <span>Site Visit Sekarang</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-4 sm:h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
          </a>
        </Reveal>

      </div>
    </section>
  );
}