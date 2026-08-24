"use client";

import { BedDouble, Bath, Maximize, Heart, ArrowUpRight, CarFront } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

interface ProductRevealCardProps {
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  description: string;
  typeCategory?: string;
  cluster?: string;
  soldOut?: boolean;
  specs: {
    bed: number | string;
    bath: number | string;
    carport: number | string;
    lb: number | string;
    lt: number | string;
  };
  onAdd?: () => void;
  onFavorite?: () => void;
  enableAnimations?: boolean;
  className?: string;
}

function subscribeMedia(query: string) {
  return (callback: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  };
}

// Media query hooks tanpa setState-in-effect (aman hydration: snapshot
// server selalu false, klien menyesuaikan setelah mount).
const subscribeTouch = subscribeMedia("(hover: none), (pointer: coarse)");
const getTouch = () => window.matchMedia("(hover: none), (pointer: coarse)").matches;
const subscribeReduce = subscribeMedia("(prefers-reduced-motion: reduce)");
const getReduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ProductRevealCard({
  name,
  price,
  originalPrice,
  image,
  description,
  typeCategory,
  cluster,
  soldOut,
  specs,
  onAdd,
  onFavorite,
  className,
}: ProductRevealCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  // Hover/tap interaksi kartu dianimasikan murni dengan CSS (group-hover +
  // transition) â€” menggantikan varian spring framer-motion yang membebani
  // evaluasi JS di main thread.
  const isTouchDevice = useSyncExternalStore(subscribeTouch, getTouch, () => false);
  const reduceMotion = useSyncExternalStore(subscribeReduce, getReduce, () => false);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    onFavorite?.();
  };

  const clusterHref =
    cluster === "Cluster Ladera"
      ? "/cluster-ladera"
      : "/cluster-cascada";

  const overlayOpen = isTouchDevice && isOverlayOpen;

  return (
    <div
      data-slot="product-reveal-card"
      onClick={() => isTouchDevice && setIsOverlayOpen((prev) => !prev)}
      className={cn(
        "group relative w-full h-[490px] sm:h-[560px] md:h-[590px] rounded-[2rem] sm:rounded-[2.25rem] p-1.5 sm:p-2 bg-[#090D0A]/5 border border-[#090D0A]/8 shadow-[0_15px_35px_rgba(9,13,10,0.06)] hover:shadow-[0_25px_50px_rgba(9,13,10,0.14)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 select-none motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className
      )}
    >
      {/* Inner Core Container */}
      <div className="relative w-full h-full rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2.25rem-0.5rem)] overflow-hidden bg-[#090D0A] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
        
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element -- gambar sudah dioptimalkan Cloudinary per kartu */}
        <img
          src={image}
          alt={`Fasad Rumah ${name} ${cluster || ''}`}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.06]",
            soldOut && "grayscale-[50%] opacity-75",
            reduceMotion && "!transform-none"
          )}
        />

        {/* Sold Out Overlay */}
        {soldOut && (
          <div className="absolute inset-0 bg-black/50 z-[15] flex items-center justify-center pointer-events-none">
            <div className="border-2 border-red-500/80 px-6 py-2 rounded-xl -rotate-12 backdrop-blur-md bg-black/40 shadow-2xl">
              <span className="text-2xl sm:text-3xl font-serif font-bold tracking-widest text-red-400">
                SOLD OUT
              </span>
            </div>
          </div>
        )}

        {/* Cinematic Scrim Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090D0A]/95 via-[#090D0A]/40 to-transparent pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between z-20">
          <div className="flex flex-wrap gap-1.5 items-center">
            {cluster && (
              <span className="px-2.5 sm:px-3 py-1 rounded-full bg-black/65 lg:bg-black/50 lg:backdrop-blur-md border border-white/15 text-white text-[8px] sm:text-[9px] font-sans font-bold tracking-[0.14em] sm:tracking-[0.16em] uppercase">
                {cluster}
              </span>
            )}
            {typeCategory && (
              <span className="px-2 sm:px-2.5 py-1 rounded-full bg-[#D49A3D] text-[#090D0A] text-[8px] sm:text-[9px] font-sans font-bold tracking-wider uppercase">
                {typeCategory}
              </span>
            )}
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFavorite();
            }}
            aria-label="Simpan Unit Favorit"
            className={cn(
              "p-1.5 sm:p-2 rounded-full lg:backdrop-blur-md border transition-all duration-300 cursor-pointer",
              isFavorite
                ? "bg-[#C8521A] text-white border-[#C8521A]"
                : "bg-black/45 lg:bg-black/30 text-white/80 border-white/20 hover:bg-black/50"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
          </button>
        </div>

        {/* Bottom Card Default View */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white z-10 flex flex-col justify-end transition-opacity duration-300 pointer-events-none",
            !isTouchDevice && "group-hover:opacity-0",
            overlayOpen && "opacity-0"
          )}
        >
          <div className="mb-1.5 sm:mb-2">
            <p className="font-serif text-xl sm:text-3xl font-bold tracking-tight text-[#F8F6F0]">
              Tipe {name}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base sm:text-xl font-bold text-[#F5A524] font-sans tracking-wide">
                Mulai {price}
              </span>
              {originalPrice && (
                <span className="text-[11px] text-white/50 line-through font-light">
                  {originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Specs Matrix Pills */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-white/15 w-full mt-1.5">
            <div className="flex items-center gap-1.5 text-white/90">
              <Maximize className="w-3.5 h-3.5 text-[#D49A3D] shrink-0" />
              <span className="text-[11px] sm:text-xs font-sans font-medium">LB {specs.lb} / LT {specs.lt}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <BedDouble className="w-3.5 h-3.5 text-[#D49A3D] shrink-0" />
              <span className="text-[11px] sm:text-xs font-sans font-medium">{specs.bed} K.Tidur</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <Bath className="w-3.5 h-3.5 text-[#D49A3D] shrink-0" />
              <span className="text-[11px] sm:text-xs font-sans font-medium">{specs.bath} K.Mandi</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <CarFront className="w-3.5 h-3.5 text-[#D49A3D] shrink-0" />
              <span className="text-[11px] sm:text-xs font-sans font-medium">{specs.carport} Carport</span>
            </div>
          </div>
        </div>

        {/* Hover / Tap Reveal Overlay with Button-in-Button CTA.
            Slide-up murni CSS: group-hover untuk desktop, state klik untuk
            perangkat sentuh. The blur is desktop-only: this overlay is always
            mounted (just translated out of frame), and a backdrop-filter keeps
            a live composited layer per card even while hidden. At 95% opacity
            the blur is barely visible anyway. */}
        <div
          className={cn(
            "absolute inset-0 bg-[#090D0A]/95 lg:backdrop-blur-2xl p-5 sm:p-7 flex flex-col justify-between z-30 text-left",
            "translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
            "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            overlayOpen && "!translate-y-0 !opacity-100"
          )}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold text-[#D49A3D]">
                  {cluster}
                </span>
                <p className="font-serif text-2xl font-bold text-[#F8F6F0]">Tipe {name}</p>
              </div>
              <span className="text-sm font-bold text-[#F5A524]">
                {price}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#F8F6F0]/80 leading-relaxed font-normal mb-5">
              {description}
            </p>

            {/* Spec Matrix Detail */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/8 space-y-2">
              <div className="flex justify-between text-xs text-[#F8F6F0]/90">
                <span className="text-white/50">Luas Bangunan/Tanah:</span>
                <span className="font-semibold">{specs.lb} mÂ² / {specs.lt} mÂ²</span>
              </div>
              <div className="flex justify-between text-xs text-[#F8F6F0]/90">
                <span className="text-white/50">Kamar Tidur:</span>
                <span className="font-semibold">{specs.bed} Kamar</span>
              </div>
              <div className="flex justify-between text-xs text-[#F8F6F0]/90">
                <span className="text-white/50">Kamar Mandi:</span>
                <span className="font-semibold">{specs.bath} Kamar Mandi</span>
              </div>
              <div className="flex justify-between text-xs text-[#F8F6F0]/90">
                <span className="text-white/50">Kapasitas Carport:</span>
                <span className="font-semibold">{specs.carport} Mobil</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.();
              }}
              disabled={soldOut}
              className={cn(
                "group/btn relative w-full flex items-center justify-between pl-5 pr-2 py-2.5 rounded-full text-xs font-sans font-bold uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer",
                soldOut
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-[#C8521A] hover:bg-[#DE5E1E] text-white shadow-[0_4px_20px_rgba(200,82,26,0.4)] active:scale-[0.98]"
              )}
            >
              <span>{soldOut ? "Unit Terjual" : "Tanya Promo Unit"}</span>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform text-white">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <a
              href={clusterHref}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-full py-2.5 rounded-full border border-white/20 hover:border-[#D49A3D] bg-transparent text-xs font-sans font-semibold uppercase tracking-[0.16em] text-[#F8F6F0] hover:text-[#D49A3D] transition-colors"
            >
              Info {cluster}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
