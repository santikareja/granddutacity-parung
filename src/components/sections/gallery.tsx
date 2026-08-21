"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

const galleryImages = [
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Ruang_Terbuka_Hijau_ukddtl.webp",
    title: "Ruang Terbuka Hijau",
    tag: "Nature",
    span: "col-span-2 row-span-2",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Interior_Kamar_agtj4a.webp",
    title: "Interior Kamar",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Interior_Dapur_hv8vfm.webp",
    title: "Interior Dapur",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Interior_Kamar_Anak_p2p4j6.webp",
    title: "Interior Kamar Anak",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Kamar_Utama_ledb1e.webp",
    title: "Interior Kamar Utama",
    tag: "Interior",
    span: "col-span-1 row-span-2",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Ruang_Keluarga_2_u3yltc.webp",
    title: "Interior Ruang Keluarga",
    tag: "Interior",
    span: "col-span-2 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Ruang_Tengah_d1o1jl.webp",
    title: "Interior Ruang Tengah",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Area_Terbuka_xnhqef.webp",
    title: "Area Terbuka",
    tag: "Exterior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Co_Working_Space_uykj46.webp",
    title: "Co-Working Space",
    tag: "Facility",
    span: "col-span-2 row-span-2",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Gerbang_Cluster_atyzxs.webp",
    title: "Gerbang Cluster",
    tag: "Exterior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Cluster_Private_Pool_cyvher.webp",
    title: "Cluster Private Pool",
    tag: "Facility",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Kamar_Tamu_omsnqw.webp",
    title: "Interior Kamar Tamu",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Interior_Rumah_Type_72_laavtn.webp",
    title: "Interior Rumah Type 72",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Playground_bwlxwp.webp",
    title: "Playground",
    tag: "Facility",
    span: "col-span-2 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/The_Beach_Malam_bfnhas.webp",
    title: "The Beach Malam Hari",
    tag: "Facility",
    span: "col-span-1 row-span-2",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/FnB_Area_omncw4.webp",
    title: "FnB Area",
    tag: "Facility",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Cluster_Private_Pool_2_rq49ve.webp",
    title: "Poolside Lounge",
    tag: "Facility",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Main_Gate_sdap2y.webp",
    title: "Main Gate",
    tag: "Exterior",
    span: "col-span-2 row-span-2",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Roti_Bakar_88_ngajcz.webp",
    title: "Roti Bakar 88",
    tag: "Facility",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Main_Gate_Malam_d75u3t.webp",
    title: "Main Gate Malam Hari",
    tag: "Exterior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Rumah_Type_42_ibh5qn.webp",
    title: "Interior Rumah Type 42",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Dapur_Utama_iujkih.webp",
    title: "Kitchen Area",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Rumah_Victoria_vi49lm.webp",
    title: "Interior Rumah Victoria",
    tag: "Interior",
    span: "col-span-2 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Boulevard_znvd7b.webp",
    title: "Boulevard",
    tag: "Exterior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Marketing_Galeri_n0hwsx.webp",
    title: "Marketing Gallery",
    tag: "Facility",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Garden_Cafe_frlfck.webp",
    title: "Garden Cafe",
    tag: "Facility",
    span: "col-span-1 row-span-2",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Kamar_Anak_2_k2eqqk.webp",
    title: "Bedroom Interior",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Suasana_The_Beach_gftttj.webp",
    title: "Suasana The Beach",
    tag: "Facility",
    span: "col-span-2 row-span-2",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Ruang_Keluarga_jolh5c.webp",
    title: "Family Living Area",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Lingkungan_Cluster_iwnukl.webp",
    title: "Lingkungan Cluster",
    tag: "Exterior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Marketing_Galeri_GDC_tfvw3v.webp",
    title: "Marketing Gallery GDC",
    tag: "Facility",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Interior_Rumah_Type_60_hciqbx.webp",
    title: "Interior Rumah Type 60",
    tag: "Interior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Interior_Ruang_Tamu_gchkdg.webp",
    title: "Living Room",
    tag: "Interior",
    span: "col-span-2 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/The_Beach_Siang_ykxjoz.webp",
    title: "The Beach Siang Hari",
    tag: "Facility",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Suasana_Sore_Hari_nbrr6z.webp",
    title: "Suasana Sore Hari",
    tag: "Exterior",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Interior_Taman_Belakang_xpuoew.webp",
    title: "Backyard Garden",
    tag: "Exterior",
    span: "col-span-2 row-span-2",
  },
];

export function Gallery() {
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (!selectedImage) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage]);

  return (
    <section id="galeri" className="py-16 md:py-24 bg-[#0b120c] text-[#F5F1E8]">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-14 lg:px-20">

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-[200px] gap-4">
          {galleryImages.map((image, idx) => {
            const isAboveFold = idx < 6;
            return (
            <Reveal
              key={idx}
              delay={(idx % 4) * 70}
              className={cn(
                "group relative overflow-hidden rounded-2xl cursor-pointer bg-white/5 border border-white/8 shadow-md hover:shadow-xl transition-all duration-300",
                image.span
              )}
              onClick={() => setSelectedImage(image)}
            >
              <Image
                src={image.url}
                alt={image.title}
                fill
                priority={isAboveFold}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-brand-accent text-[9px] tracking-[0.3em] uppercase font-sans font-bold mb-1">
                  {image.tag}
                </span>
                <span className="text-[#F5F1E8] font-serif text-lg font-bold leading-tight">
                  {image.title}
                </span>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                <Maximize2 className="w-5 h-5 text-[#F5F1E8]/70" />
              </div>
            </Reveal>
            );
          })}

        </div>

        {/* Lightbox Modal via Portal */}
        {mounted && createPortal(
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 p-3 sm:p-6 md:p-10 select-none"
                onClick={() => setSelectedImage(null)}
              >
                {/* Desktop Close Button */}
                <motion.button
                  className="hidden sm:flex absolute top-6 right-6 z-20 text-[#F5F1E8]/60 hover:text-[#F5F1E8] w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 items-center justify-center transition-colors cursor-pointer shadow-md"
                  onClick={() => setSelectedImage(null)}
                  aria-label="Tutup foto"
                >
                  <X className="w-6 h-6" />
                </motion.button>

                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-5xl h-[70vh] sm:h-[80vh] flex flex-col justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black/50 border border-white/10 shadow-2xl">
                    <Image
                      src={selectedImage.url}
                      alt={selectedImage.title}
                      fill
                      className="object-contain"
                      priority
                      sizes="(max-width: 640px) 95vw, (max-width: 1200px) 90vw, 85vw"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/85 via-black/30 to-transparent text-[#F5F1E8] pointer-events-none">
                      <p className="text-brand-accent text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-sans font-bold mb-1">
                        {selectedImage.tag}
                      </p>
                      <h3 className="font-serif text-lg sm:text-2xl font-semibold">
                        {selectedImage.title}
                      </h3>
                    </div>
                  </div>

                  {/* Mobile Close Button (Bottom-Center below image) */}
                  <div className="flex sm:hidden justify-center items-center mt-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      aria-label="Tutup galeri"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/20 text-white text-xs font-sans font-medium backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Tutup</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </section>
  );
}
