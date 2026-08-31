"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  CarFront,
  Maximize,
  ScrollText,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * KARTU TIPE RUMAH — dipakai carousel beranda (`sections/tipe-rumah.tsx`) dan
 * grid halaman cluster (`sections/cluster-units.tsx`).
 *
 * DIRANCANG ULANG 30 Agustus 2026 atas permintaan pemilik ("rapi, profesional,
 * mobile friendly, menarik"). Empat keputusan yang perlu dipertahankan:
 *
 * 1. FOTO DAPAT AREA 4:3 SENDIRI, bukan latar belakang penuh kartu.
 *    Versi sebelumnya memasang fasad sebagai `absolute inset-0 object-cover` di
 *    dalam bingkai setinggi 490-590px, dengan sumber 480x480 (persegi). Artinya
 *    render fasad — yang bentuknya melebar — dipotong keras atas-bawah, jadi
 *    rumah yang mau dijual justru terpotong. Untuk situs penjualan rumah itu
 *    pertukaran yang salah. Sekarang rasio kartu mengikuti rasio gambar.
 *
 * 2. INFORMASI SELALU TERLIHAT, tidak lagi di balik overlay hover/tap.
 *    Overlay lama menyembunyikan seluruh spesifikasi sampai kartu di-hover, dan
 *    di perangkat sentuh butuh satu tap yang justru MENUTUP fotonya. Pengunjung
 *    mobile (mayoritas trafik) harus menebak dulu bahwa kartu bisa ditap.
 *    Efek sampingnya bagus untuk performa: overlay itu selalu ter-mount dengan
 *    `backdrop-blur-2xl`, yang menyisakan satu lapisan komposit hidup per kartu
 *    bahkan saat tak terlihat.
 *
 * 3. TIAP KARTU MENAUT HALAMAN TIPE-nya (`/tipe-rumah/<id>`).
 *    Sebelumnya kesepuluh halaman tipe hanya bisa dicapai lewat satu tautan
 *    teks di bawah carousel. `prefetch={false}` dipasang sengaja: tanpa itu
 *    App Router akan prefetch 8 halaman statis begitu kartu masuk viewport, dan
 *    itulah biaya nyata yang dikhawatirkan saat kartu sengaja dibiarkan tanpa
 *    tautan di Fase 7. Dengan prefetch dimatikan, manfaat tautan internalnya
 *    didapat tanpa tambahan permintaan jaringan.
 *
 * 4. TOMBOL FAVORIT DIHAPUS.
 *    Statusnya hanya `useState` lokal dan hilang begitu halaman dimuat ulang,
 *    jadi ia menjanjikan fitur yang tidak ada. Di halaman jualan, kontrol yang
 *    tidak melakukan apa pun mengurangi kepercayaan, bukan menambah.
 */
interface ProductRevealCardProps {
  name: string;
  /** Label ukuran ringkas, mis. "39/60". Ikut di judul supaya tiap kartu unik. */
  sizeLabel?: string;
  price: string;
  originalPrice?: string;
  image: string;
  /**
   * WAJIB dan deskriptif. Diisi pemanggil dari data unit nyata supaya tiap alt
   * berbeda satu sama lain; sebelumnya di-generate di dalam komponen sebagai
   * `Fasad Rumah ${name} ${cluster}` yang seragam dan menyisakan spasi
   * menggantung saat cluster kosong.
   */
  alt: string;
  /** Tujuan halaman detail tipe. */
  href?: string;
  description: string;
  typeCategory?: string;
  cluster?: string;
  soldOut?: boolean;
  /** Spesifikasi berlaku project-wide; ditampilkan kecil sebagai penutup. */
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

/** Satu sel spesifikasi. Ikon murni dekoratif, maknanya dibawa teks. */
function SpecCell({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BedDouble;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#B45309]/10 text-[#B45309]">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold leading-tight text-[#090D0A] sm:text-xs">
          {value}
        </span>
        <span className="block text-[9px] uppercase tracking-wider text-[#090D0A]/45 sm:text-[10px]">
          {label}
        </span>
      </span>
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
  const clusterHref =
    cluster === "Cluster Ladera" ? "/cluster-ladera" : "/cluster-cascada";

  const title = sizeLabel ? `Tipe ${name} ${sizeLabel}` : `Tipe ${name}`;

  // Judul jadi tautan hanya bila tujuannya diberikan, supaya komponen tetap
  // aman dipakai di tempat yang belum punya halaman detail.
  const heading = href ? (
    <Link
      href={href}
      prefetch={false}
      className="transition-colors hover:text-[#B45309] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45309]"
    >
      {title}
    </Link>
  ) : (
    title
  );

  return (
    <article
      data-slot="product-reveal-card"
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border border-[#090D0A]/10 bg-white shadow-[0_10px_30px_rgba(9,13,10,0.06)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(9,13,10,0.13)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {/* ── Area foto: rasio tetap 4:3 supaya fasad utuh, tinggi kartu seragam ── */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#090D0A]/5">
        {/* eslint-disable-next-line @next/next/no-img-element -- sudah dioptimalkan Cloudinary per kartu, di luar loader next/image */}
        <img
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none",
            soldOut && "opacity-70 grayscale-[60%]",
          )}
        />

        {/* Gradien tipis hanya di kepala gambar, supaya badge tetap terbaca di
            render berlangit terang tanpa menggelapkan rumahnya. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent"
        />

        <div className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-1.5">
          {cluster && (
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white sm:text-[9px]">
              {cluster}
            </span>
          )}
          {typeCategory && (
            <span className="rounded-full bg-[#D49A3D] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[#090D0A] sm:text-[9px]">
              {typeCategory}
            </span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="-rotate-12 rounded-xl border-2 border-red-400/80 bg-black/50 px-5 py-1.5 font-serif text-xl font-bold tracking-widest text-red-300 sm:text-2xl">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* ── Isi kartu ── */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-serif text-lg font-bold leading-tight text-[#090D0A] sm:text-xl">
          {heading}
        </h3>

        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-sans text-base font-bold text-[#B45309] sm:text-lg">
            {soldOut ? price : `Mulai ${price}`}
          </span>
          {originalPrice && (
            <span className="text-[11px] font-light text-[#090D0A]/45 line-through">
              {originalPrice}
            </span>
          )}
        </p>

        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#090D0A]/65 sm:text-xs">
          {description}
        </p>

        {/* Matriks spesifikasi 2x2: dua kolom bertahan sampai layar tersempit,
            jadi tidak ada kolom tunggal memanjang di ponsel. */}
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[#090D0A]/8 pt-4">
          <SpecCell
            icon={Maximize}
            value={`${specs.lb} / ${specs.lt} m²`}
            label="LB / LT"
          />
          <SpecCell icon={BedDouble} value={String(specs.bed)} label="K. Tidur" />
          <SpecCell icon={Bath} value={String(specs.bath)} label="K. Mandi" />
          <SpecCell icon={CarFront} value={String(specs.carport)} label="Carport" />
        </div>

        {(electrical || legality) && (
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#090D0A]/50">
            {electrical && (
              <span className="inline-flex items-center gap-1">
                <Zap className="size-3" aria-hidden="true" />
                Listrik {electrical}
              </span>
            )}
            {legality && (
              <span className="inline-flex items-center gap-1">
                <ScrollText className="size-3" aria-hidden="true" />
                Legalitas {legality}
              </span>
            )}
          </p>
        )}

        {/* `mt-auto` menahan blok tombol di dasar kartu, jadi tombol seluruh
            kartu dalam satu baris carousel tetap sejajar walau panjang
            deskripsinya berbeda. */}
        <div className="mt-auto space-y-2 pt-5">
          <button
            type="button"
            onClick={onAdd}
            disabled={soldOut}
            aria-label={
              soldOut
                ? `${title} sudah terjual`
                : `Tanya promo dan ketersediaan ${title} via WhatsApp`
            }
            className={cn(
              "group/btn flex w-full items-center justify-between rounded-full py-2.5 pl-5 pr-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-300 sm:text-xs",
              soldOut
                ? "cursor-not-allowed bg-[#090D0A]/8 text-[#090D0A]/40"
                : "cursor-pointer bg-[#C8521A] text-white shadow-[0_4px_18px_rgba(200,82,26,0.35)] hover:bg-[#DE5E1E] active:scale-[0.98]",
            )}
          >
            <span>{soldOut ? "Unit Terjual" : "Tanya Promo Unit"}</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-white/20 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </button>

          <Link
            href={href ?? clusterHref}
            prefetch={false}
            className="flex w-full items-center justify-center rounded-full border border-[#090D0A]/15 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#090D0A]/75 transition-colors hover:border-[#B45309] hover:text-[#B45309] sm:text-xs"
          >
            {href ? "Denah & Spesifikasi" : `Info ${cluster}`}
          </Link>
        </div>
      </div>
    </article>
  );
}
