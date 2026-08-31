"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";

import { ImageLightbox } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";

export type UnitGalleryItem = {
  url: string;
  alt: string;
  caption?: string;
};

/**
 * Galeri foto tipe rumah bergaya listing marketplace: satu gambar utama besar
 * plus deretan thumbnail.
 *
 * Dua keputusan yang perlu dipertahankan:
 *
 *   1. THUMBNAIL HANYA MUNCUL BILA ADA >1 GAMBAR. Sebagian tipe belum punya
 *      foto sama sekali dan hanya memakai render fasad sebagai fallback (lihat
 *      `resolveUnitGallery`). Merender satu thumbnail tunggal di bawah gambar
 *      yang sama persis hanya menambah kebisingan, dan deretan kotak abu-abu
 *      "coming soon" justru menurunkan kepercayaan calon pembeli.
 *
 *   2. HANYA GAMBAR PERTAMA yang `priority`. Sisanya lazy. Gambar utama di
 *      halaman tipe adalah kandidat LCP, jadi ia perlu dimuat lebih awal —
 *      tetapi memuat seluruh galeri sekaligus akan mengambil bandwidth dari
 *      elemen LCP itu sendiri.
 */
export function UnitGallery({
  images,
  priority = false,
  className,
}: {
  images: readonly UnitGalleryItem[];
  priority?: boolean;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) return null;

  // Indeks dijaga di dalam rentang: `images` bisa berubah panjang saat aset
  // baru ditambahkan tanpa komponen di-remount.
  const safeIndex = Math.min(activeIndex, images.length - 1);
  const active = images[safeIndex];
  const hasThumbnails = images.length > 1;

  return (
    <div className={cn("w-full", className)}>
      {/* Gambar utama */}
      <figure className="m-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#0b120c]/10 bg-[#0b120c]/5 sm:aspect-[16/10]">
          <Image
            src={active.url}
            alt={active.alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 760px"
            className="object-cover"
          />

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Perbesar foto: ${active.alt}`}
            className="absolute inset-0 flex cursor-zoom-in items-end justify-end p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5A524]"
          >
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b120c]/80 px-3 py-1.5 text-[10px] font-medium text-[#F5F1E8]">
              <Expand className="size-3" aria-hidden="true" />
              Perbesar
            </span>
          </button>

          {hasThumbnails && (
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#0b120c]/80 px-2.5 py-1 text-[10px] font-semibold text-[#F5F1E8]">
              {safeIndex + 1} / {images.length}
            </span>
          )}
        </div>

        {active.caption && (
          <figcaption className="mt-3 text-xs leading-relaxed text-[#0b120c]/60">
            {active.caption}
          </figcaption>
        )}
      </figure>

      {/* Thumbnail — bisa digeser di ponsel, tidak memaksa grid sempit */}
      {hasThumbnails && (
        <ul className="no-scrollbar mt-3 flex list-none gap-2 overflow-x-auto p-0 sm:gap-3">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Tampilkan foto ${index + 1}: ${image.alt}`}
                aria-current={index === safeIndex}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-xl border-2 transition-all sm:size-20",
                  index === safeIndex
                    ? "border-[#F5A524]"
                    : "border-transparent opacity-65 hover:opacity-100",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  loading="lazy"
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={active.url}
        alt={active.alt}
        title={active.caption ?? active.alt}
      />
    </div>
  );
}
