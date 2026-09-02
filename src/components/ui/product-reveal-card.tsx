"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowUpRight, ScrollText, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * KARTU TIPE RUMAH — carousel beranda (`sections/tipe-rumah.tsx`) dan grid
 * halaman cluster (`sections/cluster-units.tsx`).
 *
 * KEMBALI KE KONSEP REVEAL (30 Agustus 2026, permintaan pemilik).
 *
 * Ringkas riwayatnya supaya tidak diputar balik lagi tanpa sadar: kartu ini
 * pernah diubah menjadi "foto 4:3 di atas, seluruh detail selalu terlihat di
 * bawah". Pemilik menilai versi reveal yang lebih lama terasa lebih elegan, dan
 * memintanya kembali dengan tampilan awal yang bahkan LEBIH bersih.
 *
 * Aturan tampilannya sekarang:
 *   - RASIO 3:4 dan FOTO PENUH satu kartu. Foto sengaja ter-crop; itu yang
 *     membuat kartunya terlihat minimalis dan fokus ke bangunannya.
 *   - KEADAAN AWAL hanya: foto, nama tipe, dan tipe bangunan (badge cluster +
 *     kode tipe). TANPA harga, TANPA spesifikasi, TANPA tombol.
 *   - SELURUH detail (harga, spesifikasi, listrik/legalitas, dan dua tombol)
 *     baru muncul saat kartu di-hover di desktop atau DIKLIK di perangkat
 *     sentuh.
 *
 * Yang TIDAK dikembalikan dari versi reveal lama, dan alasannya:
 *   - Tombol favorit (hati). Statusnya hanya `useState` lokal dan hilang saat
 *     halaman dimuat ulang, jadi ia menjanjikan fitur yang tidak ada.
 *   - `backdrop-blur` pada lapisan overlay. Overlay selalu ter-mount (hanya
 *     digeser keluar layar), dan backdrop-filter menyisakan satu lapisan
 *     komposit hidup per kartu bahkan saat tak terlihat. Pada opasitas 95%
 *     blur-nya praktis tak terlihat, jadi biayanya tidak sepadan.
 *
 * Tombol sekunder menuju HALAMAN TIPE (`/tipe-rumah/<id>`), bukan halaman
 * cluster, dengan `prefetch={false}`: tanpa itu App Router akan prefetch
 * delapan halaman statis begitu kartu masuk viewport.
 */
interface ProductRevealCardProps {
  name: string;
  /** Label ukuran ringkas, mis. "39/60". */
  sizeLabel?: string;
  price: string;
  originalPrice?: string;
  image: string;
  /** WAJIB deskriptif; diisi pemanggil dari data unit nyata. */
  alt: string;
  /** Tujuan halaman detail tipe. */
  href?: string;
  description: string;
  typeCategory?: string;
  cluster?: string;
  soldOut?: boolean;
  /** Spesifikasi project-wide, ditampilkan di dalam overlay. */
  electrical?: string;
  legality?: string;
  specs: {
    bed: number | string;
    bath: number | string;
    carport: number | string;
    lb: number | string;
    lt: number | string;
  };
  onAdd?: () => void;
  className?: string;
}

function subscribeMedia(query: string) {
  return (callback: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  };
}

// Hook media query tanpa setState-in-effect (aman hidrasi: snapshot server
// selalu false, klien menyesuaikan setelah mount).
const subscribeTouch = subscribeMedia("(hover: none), (pointer: coarse)");
const getTouch = () => window.matchMedia("(hover: none), (pointer: coarse)").matches;
const subscribeReduce = subscribeMedia("(prefers-reduced-motion: reduce)");
const getReduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Satu baris spesifikasi di dalam overlay. */
function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-white/50">{label}</span>
      <span className="font-semibold text-[#F8F6F0]">{value}</span>
    </div>
  );
}

export function ProductRevealCard({
  name,
  sizeLabel,
  price,
  originalPrice,
  image,
  alt,
  href,
  description,
  typeCategory,
  cluster,
  soldOut,
  electrical,
  legality,
  specs,
  onAdd,
  className,
}: ProductRevealCardProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const isTouchDevice = useSyncExternalStore(subscribeTouch, getTouch, () => false);
  const reduceMotion = useSyncExternalStore(subscribeReduce, getReduce, () => false);

  const clusterHref =
    cluster === "Cluster Ladera" ? "/cluster-ladera" : "/cluster-cascada";
  const detailHref = href ?? clusterHref;
  const overlayOpen = isTouchDevice && isOverlayOpen;

  return (
    <article
      data-slot="product-reveal-card"
      onClick={() => isTouchDevice && setIsOverlayOpen((prev) => !prev)}
      className={cn(
        "group relative w-full select-none overflow-hidden rounded-[1.75rem] border border-[#090D0A]/8 bg-[#090D0A] shadow-[0_15px_35px_rgba(9,13,10,0.08)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_25px_50px_rgba(9,13,10,0.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        // Rasio 3:4 menggantikan tinggi tetap: kartu ikut lebar kolom carousel
        // tanpa perlu breakpoint tinggi manual.
        "aspect-[3/4]",
        className,
      )}
    >
      {/* Foto penuh satu kartu */}
      {/* eslint-disable-next-line @next/next/no-img-element -- sudah dioptimalkan Cloudinary per kartu, di luar loader next/image */}
      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.06]",
          soldOut && "opacity-75 grayscale-[50%]",
          reduceMotion && "!transform-none",
        )}
      />

      {/* Scrim sinematik: menjaga nama tipe tetap terbaca di atas foto apa pun */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090D0A]/95 via-[#090D0A]/25 to-[#090D0A]/25"
      />

      {soldOut && (
        <div className="absolute inset-0 z-[15] flex items-center justify-center bg-black/50">
          <span className="-rotate-12 rounded-xl border-2 border-red-500/80 bg-black/40 px-6 py-2 font-serif text-2xl font-bold tracking-widest text-red-400 sm:text-3xl">
            SOLD OUT
          </span>
        </div>
      )}

      {/* Badge atas: cluster + tipe bangunan */}
      <div className="absolute inset-x-3.5 top-3.5 z-20 flex flex-wrap items-center gap-1.5 sm:inset-x-4 sm:top-4">
        {cluster && (
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-white sm:px-3 sm:text-[9px]">
            {cluster}
          </span>
        )}
        {typeCategory && (
          <span className="rounded-full bg-[#D49A3D] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[#090D0A] sm:px-2.5 sm:text-[9px]">
            {typeCategory}
          </span>
        )}
      </div>

      {/* KEADAAN AWAL — hanya nama tipe. Tidak ada harga, spesifikasi, tombol. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 transition-opacity duration-300 sm:p-6",
          !isTouchDevice && "group-hover:opacity-0",
          overlayOpen && "opacity-0",
        )}
      >
        <p className="font-serif text-2xl font-bold tracking-tight text-[#F8F6F0] sm:text-3xl">
          Tipe {name}
        </p>
        {sizeLabel && (
          <p className="mt-1 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D49A3D]">
            {sizeLabel} m²
          </p>
        )}
        {/* Petunjuk halus khusus perangkat sentuh: tanpa ini, tidak ada apa pun
            yang memberi tahu bahwa kartu bisa ditap untuk melihat detail. */}
        {isTouchDevice && !soldOut && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-white/55">
            Tap untuk detail
          </p>
        )}
      </div>

      {/* OVERLAY — muncul saat hover (desktop) atau tap (sentuh) */}
      <div
        className={cn(
          "absolute inset-0 z-30 flex flex-col justify-between bg-[#090D0A]/95 p-5 text-left sm:p-6",
          "translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          overlayOpen && "!translate-y-0 !opacity-100",
        )}
      >
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="mb-3 border-b border-white/10 pb-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D49A3D]">
              {cluster}
            </span>
            <p className="font-serif text-xl font-bold text-[#F8F6F0] sm:text-2xl">
              Tipe {name} {sizeLabel}
            </p>
            <p className="mt-1 font-sans text-base font-bold text-[#F5A524]">
              {soldOut ? price : `Mulai ${price}`}
              {originalPrice && (
                <span className="ml-2 text-[11px] font-light text-white/45 line-through">
                  {originalPrice}
                </span>
              )}
            </p>
          </div>

          <p className="mb-3 line-clamp-3 text-[11px] leading-relaxed text-[#F8F6F0]/75 sm:text-xs">
            {description}
          </p>

          <div className="space-y-1.5 rounded-xl border border-white/8 bg-white/5 p-3">
            <SpecRow label="Bangunan / Tanah" value={`${specs.lb} / ${specs.lt} m²`} />
            <SpecRow label="Kamar tidur" value={String(specs.bed)} />
            <SpecRow label="Kamar mandi" value={String(specs.bath)} />
            <SpecRow label="Carport" value={`${specs.carport} mobil`} />
          </div>

          {(electrical || legality) && (
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/50">
              {electrical && (
                <span className="inline-flex items-center gap-1">
                  <Zap className="size-3" aria-hidden="true" />
                  {electrical}
                </span>
              )}
              {legality && (
                <span className="inline-flex items-center gap-1">
                  <ScrollText className="size-3" aria-hidden="true" />
                  {legality}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="mt-3 shrink-0 space-y-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.();
            }}
            disabled={soldOut}
            aria-label={
              soldOut
                ? `Tipe ${name} sudah terjual`
                : `Tanya promo Tipe ${name} via WhatsApp`
            }
            className={cn(
              "group/btn flex w-full items-center justify-between rounded-full py-2.5 pl-5 pr-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-300 sm:text-xs",
              soldOut
                ? "cursor-not-allowed bg-white/10 text-white/40"
                : "cursor-pointer bg-[#C8521A] text-white shadow-[0_4px_18px_rgba(200,82,26,0.4)] hover:bg-[#DE5E1E] active:scale-[0.98]",
            )}
          >
            <span>{soldOut ? "Unit Terjual" : "Tanya Promo Unit"}</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-white/20 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </button>

          <Link
            href={detailHref}
            prefetch={false}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-center rounded-full border border-white/20 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F8F6F0] transition-colors hover:border-[#D49A3D] hover:text-[#D49A3D] sm:text-xs"
          >
            Lihat Detail Unit
          </Link>
        </div>
      </div>

      {/* Ringkasan aksesibel tetap dipertahankan, tetapi ikon SVG dekoratif
          yang sebelumnya ikut tersembunyi tidak menambah konteks pembaca layar
          dan menggandakan 32 SVG pada delapan kartu homepage. */}
      <span className="sr-only">
        Luas bangunan {specs.lb} meter persegi, luas tanah {specs.lt} meter persegi. {specs.bed} kamar tidur. {specs.bath} kamar mandi. Carport {specs.carport} mobil.
      </span>
    </article>
  );
}
