"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Navigation2, MapPin, ArrowUpRight, Clock, Car, Compass } from "lucide-react";
import { createPortal } from "react-dom";
import { Reveal } from "@/components/ui/reveal";

const accessPoints = [
  { time: "5 Mnt", destination: "RS Dompet Dhuafa & SMA Dwiwarna", icon: Clock },
  { time: "15 Mnt", destination: "4 Exit Tol (Pamulang, Krukut, Sawangan, Bojong Gede)", icon: Car },
  { time: "20 Mnt", destination: "The Park Sawangan & CBD TB Simatupang Jaksel", icon: Compass },
  { time: "30 Mnt", destination: "Universitas Pamulang & Pondok Cabe Golf", icon: Navigation2 },
  { time: "40 Mnt", destination: "Bintaro Xchange Mall, PIM & RS Siloam", icon: MapPin },
];

export function LokasiScroll() {
  // Portal butuh document — snapshot server false, klien true (tanpa setState-in-effect)
  const mounted = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false
  );
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [zoomScale, setZoomScale] = React.useState(1);
  const [translate, setTranslate] = React.useState({ x: 0, y: 0 });

  const touchStateRef = React.useRef({
    isPinching: false,
    isPanning: false,
    startDistance: 0,
    startScale: 1,
    startMidpoint: { x: 0, y: 0 },
    startTranslate: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
  });

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const getTouchMidpoint = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const resetZoom = React.useCallback(() => {
    setZoomScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touches = event.touches;
    if (touches.length === 2) {
      const midpoint = getTouchMidpoint(touches);
      touchStateRef.current = {
        ...touchStateRef.current,
        isPinching: true,
        isPanning: false,
        startDistance: getTouchDistance(touches),
        startScale: zoomScale,
        startMidpoint: midpoint,
        startTranslate: translate,
      };
      return;
    }

    if (touches.length === 1 && zoomScale > 1) {
      touchStateRef.current = {
        ...touchStateRef.current,
        isPanning: true,
        panStart: {
          x: touches[0].clientX - translate.x,
          y: touches[0].clientY - translate.y,
        },
      };
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touches = event.touches;
    if (touches.length === 2 && touchStateRef.current.isPinching) {
      event.preventDefault();
      const currentDistance = getTouchDistance(touches);
      const scaleRatio = currentDistance / touchStateRef.current.startDistance;
      const nextScale = clamp(touchStateRef.current.startScale * scaleRatio, 1, 3);
      setZoomScale(nextScale);

      const currentMidpoint = getTouchMidpoint(touches);
      const maxOffset = ((nextScale - 1) * 220);
      setTranslate({
        x: clamp(
          touchStateRef.current.startTranslate.x + (currentMidpoint.x - touchStateRef.current.startMidpoint.x),
          -maxOffset,
          maxOffset,
        ),
        y: clamp(
          touchStateRef.current.startTranslate.y + (currentMidpoint.y - touchStateRef.current.startMidpoint.y),
          -maxOffset,
          maxOffset,
        ),
      });
      return;
    }

    if (touches.length === 1 && touchStateRef.current.isPanning && zoomScale > 1) {
      event.preventDefault();
      const maxOffset = ((zoomScale - 1) * 220);
      setTranslate({
        x: clamp(touches[0].clientX - touchStateRef.current.panStart.x, -maxOffset, maxOffset),
        y: clamp(touches[0].clientY - touchStateRef.current.panStart.y, -maxOffset, maxOffset),
      });
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.isPinching = false;
    touchStateRef.current.isPanning = false;
    if (zoomScale <= 1.02) {
      resetZoom();
    }
  };

  // Tutup lightbox + reset zoom dalam satu aksi (dipakai semua tombol tutup)
  const closeLightbox = React.useCallback(() => {
    setIsLightboxOpen(false);
    resetZoom();
  }, [resetZoom]);

  React.useEffect(() => {
    if (!isLightboxOpen) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onEsc);
    };
  }, [isLightboxOpen, closeLightbox]);

  return (
    <section id="lokasi" className="py-16 sm:py-24 md:py-36 bg-[#F8F6F0] text-[#090D0A] relative z-20 overflow-hidden border-t border-[#090D0A]/6">
      
      {/* Texture Background */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 relative z-10">
        
        {/* Header Section */}
        <Reveal className="mb-8 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] mb-3 sm:mb-4 w-max">
            <Navigation2 className="w-3 h-3 text-[#D49A3D]" />
            <span>Konektivitas Tanpa Batas</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold leading-[1.18] sm:leading-[1.15] text-[#090D0A]">
            Kemudahan Akses di Pusat Pertumbuhan <br />
            <span className="italic font-normal text-[#B45309]">
              Koridor Selatan Jakarta
            </span>
          </h2>
        </Reveal>

        {/* Asymmetric 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-start relative">
          
          {/* Column 1: Map Card with Double-Bezel Architecture */}
          <Reveal from="left" className="lg:col-span-6 w-full lg:sticky lg:top-28">
            <div className="rounded-[2rem] sm:rounded-[2.25rem] p-1.5 sm:p-2 bg-[#090D0A]/5 border border-[#090D0A]/10 shadow-[0_20px_45px_rgba(9,13,10,0.08)]">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="group relative w-full aspect-[4/3] rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2.25rem-0.5rem)] overflow-hidden bg-white text-left cursor-zoom-in shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]"
                aria-label="Buka peta lokasi dalam tampilan penuh"
              >
                <Image
                  src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1776804065/map_lokasi_gdc_parung_bogor_anhrcm.webp"
                  alt="Map Lokasi Grand Duta City Parung"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  draggable={false}
                />
                
                {/* Floating Map Zoom Badge */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 rounded-full bg-[#090D0A]/85 lg:bg-[#090D0A]/70 lg:backdrop-blur-md px-3 sm:px-3.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-white font-sans font-medium border border-white/20 shadow-md">
                  🔍 Klik Untuk Zoom
                </div>
              </button>
            </div>
          </Reveal>

          {/* Column 2: Accessibility Travel-Time Hub */}
          <Reveal
            from="right"
            delay={100}
            className="lg:col-span-6 flex flex-col justify-center space-y-6"
          >
            <div className="rounded-[2rem] sm:rounded-[2.25rem] p-5 sm:p-8 md:p-10 bg-white border border-[#090D0A]/8 shadow-[0_20px_50px_rgba(9,13,10,0.06)] relative overflow-hidden">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#090D0A] mb-3 sm:mb-4">
                Strategis Menghubungkan 4 Kota Utama
              </h3>

              <p className="text-[#090D0A]/75 text-xs sm:text-base leading-[1.8] font-normal mb-6 sm:mb-8">
                Terletak di jalan protokol Jl. Raya Parung, kawasan ini menjadi magnet investasi sunrise di koridor Jakarta Selatan–Bogor dengan keterhubungan langsung ke jaringan jalan tol utama.
              </p>

              {/* Transit Distance Matrix */}
              <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {accessPoints.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#F8F6F0] border border-[#090D0A]/5 hover:border-[#D49A3D]/40 transition-colors"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white flex items-center justify-center text-[#B45309] shadow-xs shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm text-[#090D0A]/80 font-medium leading-snug">
                          {item.destination}
                        </span>
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#D49A3D]/15 text-[#B45309] text-[9px] sm:text-[10px] font-bold tracking-wider font-sans whitespace-nowrap shrink-0">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <a
                  href="https://wa.me/628131742034?text=Halo%2C%20saya%20mau%20tanya%20detail%20akses%20%26%20lokasi%20Grand%20Duta%20City%20Parung%20South%20of%20Jakarta."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center justify-center gap-3 pl-6 pr-2 py-3.5 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-xs sm:text-sm tracking-[0.16em] uppercase font-sans font-bold shadow-[0_8px_24px_rgba(200,82,26,0.35)] active:scale-[0.98] transition-all duration-300 text-center"
                >
                  <span>Tanya Akses Tol</span>
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-white">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </a>
                <Link
                  href="/lokasi-akses-grand-duta-city-parung"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-[#090D0A]/20 hover:border-[#B45309] text-[#090D0A]/80 hover:text-[#B45309] text-xs sm:text-sm tracking-[0.16em] uppercase font-sans font-semibold active:scale-[0.98] transition-all duration-300 text-center"
                >
                  Lihat Lokasi Detail
                </Link>
              </div>
            </div>
          </Reveal>

        </div>
      </div>

      {/* Lightbox Modal via Portal */}
      {mounted && createPortal(
        isLightboxOpen ? (
            <div
              className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md p-3 sm:p-6 md:p-8 flex flex-col items-center justify-center select-none"
              style={{ animation: "fadeIn 0.25s ease-out both" }}
              onClick={closeLightbox}
              role="dialog"
              aria-modal="true"
              aria-label="Lightbox peta lokasi"
            >
              <div
                className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl overflow-hidden border border-white/20 bg-[#090D0A] shadow-[0_25px_70px_rgba(0,0,0,0.8)]"
                style={{ animation: "waPanelIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both" }}
                onClick={(event) => event.stopPropagation()}
              >
                {/* Desktop Close Button (Top-Right) */}
                <button
                  type="button"
                  aria-label="Tutup lightbox"
                  onClick={closeLightbox}
                  className="hidden sm:inline-flex absolute top-4 right-4 z-20 h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/80 cursor-pointer shadow-md"
                >
                  <X className="h-5 w-5" />
                </button>

                <div
                  className="relative w-full aspect-[4/3] overflow-hidden touch-none"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                >
                  {/* Pan & zoom peta: transform CSS + transition (tanpa spring JS) */}
                  <div
                    className="absolute inset-0 transition-transform duration-300 ease-out"
                    style={{
                      transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoomScale})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <Image
                      src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1776804065/map_lokasi_gdc_parung_bogor_anhrcm.webp"
                      alt="Map Lokasi Grand Duta City Parung"
                      fill
                      sizes="(max-width: 640px) 95vw, (max-width: 1280px) 90vw, 1200px"
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Close Button (Bottom-Center below map) */}
              <div className="flex sm:hidden justify-center items-center mt-3 shrink-0">
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label="Tutup peta lokasi"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/20 text-white text-xs font-sans font-medium backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Tutup Peta</span>
                </button>
              </div>
            </div>
          ) : null,
          document.body
        )}
    </section>
  );
}
