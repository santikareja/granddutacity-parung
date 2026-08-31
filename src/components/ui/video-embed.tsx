"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

import { isYouTube, toYouTubeEmbed } from "@/data/unit-content";
import { cn } from "@/lib/utils";

/**
 * Pemutar video klik-untuk-mainkan.
 *
 * Berbeda dari `AmbientVideo` yang dekoratif (muted, autoplay, looping),
 * komponen ini untuk video yang memang ingin DITONTON: ada kontrol dan suara.
 *
 * Kenapa lazy dan bukan langsung merender iframe/video:
 * iframe YouTube menarik ratusan KB skrip pihak ketiga begitu ia ada di DOM,
 * bahkan sebelum diputar. Di halaman tipe rumah yang elemen LCP-nya adalah
 * galeri foto di atasnya, itu biaya yang dibayar semua pengunjung padahal
 * hanya sebagian yang menonton. Selama belum diklik, yang dirender cuma
 * poster (gambar biasa) plus satu tombol.
 */
export function VideoEmbed({
  url,
  poster,
  title,
  aspect = "landscape",
  className,
}: {
  url: string;
  poster: string;
  title: string;
  /**
   * `portrait` = 9:16 untuk rekaman vertikal (yang dipakai halaman tipe rumah),
   * `landscape` = 16:9. Rasionya dipilih eksplisit alih-alih dibiarkan
   * menyesuaikan isi, supaya tidak ada pergeseran tata letak saat video mulai
   * dimuat (penyumbang CLS).
   */
  aspect?: "portrait" | "landscape";
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const youtube = isYouTube(url);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-[#0b120c]/10 bg-[#0b120c]",
        aspect === "portrait" ? "aspect-[9/16]" : "aspect-video",
        className,
      )}
    >
      {!playing ? (
        <>
          <Image
            src={poster}
            alt={`Pratinjau ${title}`}
            fill
            loading="lazy"
            sizes="(max-width: 1024px) 100vw, 760px"
            className="object-cover opacity-70"
          />
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Putar ${title}`}
            className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5A524]"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-[#F5A524] shadow-lg transition-transform duration-300 hover:scale-105 sm:size-20">
              {/* Ikon play digeser sedikit ke kanan supaya massa visual segitiga
                  terlihat berada di tengah lingkaran. */}
              <Play
                className="ml-0.5 size-6 fill-[#0b120c] text-[#0b120c] sm:size-7"
                aria-hidden="true"
              />
            </span>
            <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#F5F1E8]">
              Putar video
            </span>
          </button>
        </>
      ) : youtube ? (
        <iframe
          src={`${toYouTubeEmbed(url)}&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <video
          src={url}
          poster={poster}
          title={title}
          controls
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full bg-black object-contain"
        />
      )}
    </div>
  );
}
