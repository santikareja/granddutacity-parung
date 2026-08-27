"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { Typewriter } from "@/components/ui/typewriter";

/* ── Video sources per breakpoint ── */
const VIDEO_SOURCES = {
  mobile: {
    webm: "https://res.cloudinary.com/dzhvfbuks/video/upload/f_webm,q_auto:good,w_480,fps_24,br_500k/v1775447530/GDC_Parung_Video_nsvvg6.webm",
    mp4: "https://res.cloudinary.com/dzhvfbuks/video/upload/q_auto:good,w_480,fps_24,br_500k/v1775447530/GDC_Parung_Video_nsvvg6.mp4",
    poster: "https://res.cloudinary.com/dzhvfbuks/video/upload/so_0,w_480,q_auto,f_auto/v1775447530/GDC_Parung_Video_nsvvg6.jpg",
  },
  desktop: {
    webm: "https://res.cloudinary.com/dzhvfbuks/video/upload/f_webm,q_auto:best,w_1280,fps_24,br_2000k/v1775449335/Grand_Duta_City_Parung_South_of_Jakarta_lsds7k.webm",
    mp4: "https://res.cloudinary.com/dzhvfbuks/video/upload/q_auto:best,w_1280,fps_24,br_2000k/v1775449335/Grand_Duta_City_Parung_South_of_Jakarta_lsds7k.mp4",
    poster: "https://res.cloudinary.com/dzhvfbuks/video/upload/so_0,w_1280,q_auto,f_auto/v1775449335/Grand_Duta_City_Parung_South_of_Jakarta_lsds7k.jpg",
  },
} as const;

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const posterImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const fadeEl = fadeRef.current;
    const posterImg = posterImgRef.current;
    if (!video || !fadeEl || !posterImg) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const sources = isMobile ? VIDEO_SOURCES.mobile : VIDEO_SOURCES.desktop;
    let looping = false;
    // Suppresses playback while the hero is scrolled out of view so decoding
    // never competes with scrolling further down the page.
    let offscreen = false;

    // Poster statis kini berupa <img> terpisah (bukan atribut poster video):
    // layer inilah kandidat LCP utama — ter-paint dari HTML SSR dengan
    // fetchpriority tinggi, jauh sebelum JS/video siap. Video transparan
    // di belakangnya; begitu frame pertama siap, poster memudar.
    posterImg.src = sources.poster;
    video.preload = "metadata";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    video.innerHTML = "";

    const webmSrc = document.createElement("source");
    webmSrc.src = sources.webm;
    webmSrc.type = "video/webm";
    video.appendChild(webmSrc);

    const mp4Src = document.createElement("source");
    mp4Src.src = sources.mp4;
    mp4Src.type = "video/mp4";
    video.appendChild(mp4Src);

    const resumePlayback = () => {
      if (offscreen || document.hidden) return;
      video.play().catch(() => { });
    };

    const onReady = () => {
      // Mulai pemutaran segera (frame tampil di belakang poster yang masih
      // opaque), TAPI jangan redupkan poster sebelum poster benar-benar
      // ter-decode dan ter-paint: jika difade saat byte-nya belum datang,
      // ia tak pernah menjadi kandidat LCP dan elemen LCP jatuh ke gambar
      // jauh di bawah fold yang baru ter-paint saat halaman digulir.
      requestAnimationFrame(resumePlayback);
      const fadeWhenPainted = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            posterImg.style.opacity = "0";
          });
        });
      };
      if (typeof posterImg.decode === "function") {
        posterImg.decode().then(fadeWhenPainted).catch(fadeWhenPainted);
      } else {
        fadeWhenPainted();
      }
    };
    const onLoadedData = () => {
      if (video.readyState >= 3) onReady();
    };
    video.addEventListener("canplaythrough", onReady, { once: true });
    video.addEventListener("loadeddata", onLoadedData, { once: true });

    const restartVideo = () => {
      if (looping) return;
      looping = true;
      fadeEl.style.opacity = "1";

      setTimeout(() => {
        video.currentTime = 0;
        resumePlayback();

        setTimeout(() => {
          fadeEl.style.opacity = "0";
          looping = false;
        }, 80);
      }, 150);
    };

    const onTimeUpdate = () => {
      if (!video.duration || looping) return;
      const remaining = video.duration - video.currentTime;

      if (remaining < 0.3 && remaining > 0.1) {
        fadeEl.style.opacity = "1";
      }
      if (remaining <= 0.1) {
        restartVideo();
      }
    };

    const onEnded = () => {
      looping = false;
      restartVideo();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      } else {
        resumePlayback();
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // A decoding <video> forces a fresh compositor frame ~24x per second even
    // when it is nowhere near the viewport, which starves the scroll. Pausing
    // it once the hero leaves the screen frees that budget for the sections
    // the user is actually looking at.
    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            offscreen = !entry.isIntersecting;

            if (offscreen) {
              video.pause();
            } else {
              resumePlayback();
            }
          }
        },
        { rootMargin: "10% 0px" },
      );
      observer.observe(video);
    }

    video.load();

    return () => {
      observer?.disconnect();
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-[#090D0A] flex flex-col justify-center py-16 sm:py-24 md:py-0"
    >
      {/* Fast loop overlay */}
      <div
        ref={fadeRef}
        aria-hidden
        className="absolute inset-0 z-[3] bg-[#090D0A] pointer-events-none"
        style={{ opacity: 0, transition: "opacity 150ms ease-in-out" }}
      />

      {/* Poster preload — media-scoped agar tiap perangkat hanya mengunduh
          satu varian, dan masuk critical path dengan prioritas tinggi */}
      <link rel="preload" as="image" href={VIDEO_SOURCES.mobile.poster} media="(max-width: 767px)" fetchPriority="high" />
      <link rel="preload" as="image" href={VIDEO_SOURCES.desktop.poster} media="(min-width: 768px)" fetchPriority="high" />

      {/* Background video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          id="hero-video"
          muted
          playsInline
          aria-hidden="true"
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02]"
        />
        {/* Static poster layer (kandidat LCP utama) — di atas video,
            memudar saat frame pertama siap. Lihat efek di atas. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- poster sudah dioptimalkan Cloudinary (w_480,q_auto,f_auto) dan URL-nya sama dengan yang dipakai video; next/image justru menambah hop /_next/image */}
        <img
          ref={posterImgRef}
          aria-hidden="true"
          alt=""
          src={VIDEO_SOURCES.mobile.poster}
          fetchPriority="high"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full scale-[1.02] object-cover object-center"
          style={{ opacity: 1, transition: "opacity 500ms ease-in-out" }}
        />
      </div>

      {/* Luxury Cinematic Scrim Overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#090D0A]/80 via-[#090D0A]/35 to-[#090D0A]/85 pointer-events-none" />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(9,13,10,0.6) 0%, rgba(9,13,10,0.3) 50%, transparent 80%)",
        }}
      />

      {/* Left Sidebar Branding */}
      <div
        className="absolute left-8 top-1/2 -translate-y-1/2 z-20 hidden xl:flex flex-col items-center gap-6"
        style={{ animation: "fadeIn 0.6s ease-out 0.5s both" }}
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#F8F6F0]/20 to-transparent" />
        <span
          className="text-[#F8F6F0]/40 text-[10px] tracking-[0.4em] uppercase font-sans font-medium"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          VIP Inquiries
        </span>
        <a
          href="https://wa.me/628131742034"
          className="text-[#D49A3D] hover:text-[#F5A524] text-[11px] tracking-[0.18em] font-sans font-semibold transition-colors duration-300"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          +62 813‑1742‑034
        </a>
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#F8F6F0]/20 to-transparent" />
      </div>

      {/* Right Sidebar Branding */}
      <div
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col items-center gap-6"
        style={{ animation: "fadeIn 0.6s ease-out 0.5s both" }}
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#F8F6F0]/20 to-transparent" />
        <span
          className="text-[#F8F6F0]/40 text-[10px] tracking-[0.4em] uppercase font-sans font-medium whitespace-nowrap"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Masterpiece by Duta Putra Land
        </span>
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#F8F6F0]/20 to-transparent" />
      </div>

      {/* Center Hero Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col justify-center items-center text-center px-4 sm:px-6 md:px-12 pt-12 sm:pt-16 md:pt-16 lg:pt-20">
        <div className="flex flex-col items-center w-full">

          {/* Feature Highlights Typewriter */}
          <Typewriter
            texts={[
              "Kota Mandiri 200 Ha · Grand Duta City Parung",
              "Perumahan Premium South of Jakarta",
              "Smart Home System & Underfloor Cable",
              "Cluster Private Pool & The Beach Lagoon",
              "One Gate System & 24/7 Security Patrol",
              "20 Menit ke CBD Jaksel via Tol Desari",
              "Promo Spesial Tanpa DP & Bunga KPR Rendah",
              "Kawasan Hijau Alami 80 Hektar",
            ]}
            delay={2800}
            className="mb-2 text-[11px] sm:text-sm text-[#D49A3D] font-medium tracking-wide"
          />

        {/* Massive Display Headline */}
         <div className="mb-4 sm:mb-6">
             <h1
               className="flex flex-col items-center gap-1 sm:gap-2 [text-shadow:0_4px_24px_rgba(0,0,0,0.8)]"
               style={{ animation: "heroFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.04s both" }}
             >
             <span
                className="font-serif font-bold text-[#F8F6F0] uppercase tracking-[-0.01em] sm:tracking-[0.02em] leading-[1.05]"
               style={{ fontSize: "clamp(1.75rem, 5.5vw, 4.5rem)" }}
             >
                Grand Duta City Parung
              </span>
              {" "}
             <span
               className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F5A524] via-[#F8C165] to-[#D49A3D] tracking-[0.01em] leading-tight"
               style={{ fontSize: "clamp(1.15rem, 3vw, 2.5rem)" }}
             >
                South of Jakarta
              </span>
            </h1>
          </div>

          {/* Supporting Copy — CSS animation instead of framer-motion to
               eliminate LCP render delay (this <p> is the LCP element).
               Delay ditekan seminimal mungkin: fill-mode "both" menahan teks di
               opacity 0 selama delay, jadi setiap milidetik delay langsung
               menunda LCP/Speed Index. */}
          <p
            className="text-[#F8F6F0]/90 text-[13px] sm:text-base md:text-lg font-normal max-w-2xl mb-5 sm:mb-8 leading-[1.7] [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] px-2"
            style={{ animation: "heroFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both" }}
          >
            Investasi &amp; hunian prestisius di Grand Duta City Parung — kota mandiri 200 Ha persembahan{" "}
            <span className="text-[#F8F6F0] font-semibold">Duta Putra Land</span>. Cicilan mulai{" "}
            <span className="text-[#F5A524] font-semibold">Rp 4 jutaan/bln</span>, Promo Tanpa DP, 20 menit ke CBD Jakarta Selatan.
          </p>

          {/* Double-Bezel Button-in-Button CTA Cluster — CSS animation to
               avoid blocking LCP with framer-motion hydration. */}
          <div
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0"
            style={{ animation: "heroFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both" }}
          >
            {/* Primary Island Button-in-Button CTA */}
            <a
              href="https://wa.me/628131742034?text=Halo%2C%20saya%20mau%20ambil%20promo%20spesial%20di%20Grand%20Duta%20City%20Parung%20South%20of%20Jakarta.%20Mohon%20info%20selengkapnya."
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2.5 pl-5 pr-1.5 py-2.5 sm:pl-6 sm:pr-2 sm:py-3.5 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-[11px] sm:text-xs tracking-[0.12em] sm:tracking-[0.14em] uppercase font-sans font-bold shadow-[0_12px_36px_rgba(200,82,26,0.5)] hover:shadow-[0_16px_45px_rgba(200,82,26,0.65)] active:scale-[0.98] transition-all duration-300"
            >
              <span>Saya Mau Promo</span>
              <span className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-300">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              </span>
            </a>

            {/* Secondary Glassmorphic CTA */}
            <a
              href="#tipe-unit"
              className="inline-flex w-full sm:w-auto items-center justify-center px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-full border border-white/25 hover:border-[#F5A524] bg-white/10 lg:bg-white/5 hover:bg-white/10 lg:backdrop-blur-xl text-[#F8F6F0] hover:text-[#F5A524] text-[11px] sm:text-xs tracking-[0.12em] sm:tracking-[0.14em] uppercase font-sans font-semibold active:scale-[0.98] transition-all duration-300"
            >
              Lihat Tipe Unit
            </a>
          </div>

          {/* Floating Trust Strip */}
          <div
            className="mt-6 sm:mt-10 inline-flex flex-wrap items-center justify-center gap-x-3.5 sm:gap-x-6 gap-y-1.5 py-1.5 px-4 sm:py-2 sm:px-5 rounded-full bg-[#090D0A]/75 lg:bg-[#090D0A]/60 lg:backdrop-blur-md border border-white/10 text-[#F8F6F0]/80 text-[9px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.14em] uppercase font-sans font-medium"
            style={{ animation: "heroFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.26s both" }}
          >
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D49A3D]" />
              <span>Developer 35+ Tahun</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:inline-block" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D49A3D]" />
              <span>KPR 8 Bank Mitra</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:inline-block" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D49A3D]" />
              <span>Bebas Banjir · One Gate System</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
