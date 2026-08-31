"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, ArrowUpRight } from "lucide-react";

import { ProductRevealCard } from "@/components/ui/product-reveal-card";
import { trackWhatsAppClick } from "@/lib/analytics";
import { clImg } from "@/lib/cloudinary";
import {
  CLUSTER_LABEL,
  PROJECT_ELECTRICAL,
  PROJECT_LEGALITY,
  bathroomLabel,
  bedroomLabel,
  catalogUnits,
  unitFacadeAlt,
  unitPagePath,
  unitSizeLabel,
} from "@/data/units";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

// Diturunkan dari SUMBER TUNGGAL src/data/units.ts (Fase 3 spec
// seo-cannibalization-and-pseo). Sebelumnya ada array 6 record di sini yang
// sudah DRIFT dari katalog bersama — antara lain menulis Manoa T-58 sebagai
// 1 kamar tidur padahal denah resmi 2 KT, dan memakai id `air-plus-42`
// sementara katalog memakai `aira-42`.
//
// Dua perilaku lama dipertahankan dengan sengaja:
//   - anggaran byte gambar: kartu kembali ke rasio 3:4 dengan FOTO PENUH, jadi
//     transformasinya 480x640 (307k piksel). Ini di atas 480x480 (230k) yang
//     dipakai versi paling awal, dan itu disengaja: kini fotonya ADALAH kartunya,
//     bukan thumbnail kecil di atas blok teks, sehingga ketajaman lebih terasa.
//     Tetap lazy dan tetap q55 supaya kenaikannya terkendali.
//   - kartu sold-out disembunyikan: carousel homepage untuk menarik minat,
//     bukan arsip. Unit sold-out tetap tampil di halaman cluster masing-masing.
//
// URUTAN kartu ditentukan `catalogUnits`, yang menaruh CATALOG_LEAD_IDS
// (Verona, Malta, Tuscan, Frontera) di depan sesuai permintaan pemilik.
const propertyTypes = catalogUnits
  .filter((unit) => unit.status !== "sold-out")
  .map((unit) => ({
    id: unit.id,
    name: unit.name,
    sizeLabel: unitSizeLabel(unit),
    href: unitPagePath(unit),
    typeCategory: unit.typeCategory,
    cluster: CLUSTER_LABEL[unit.cluster],
    price: unit.priceLabel,
    image: clImg(unit.facadeImage, { w: 480, h: 640, q: 55 }),
    alt: unitFacadeAlt(unit),
    specs: {
      bed: bedroomLabel(unit),
      bath: bathroomLabel(unit),
      carport: unit.carports ?? "-",
      lb: unit.lb,
      lt: unit.lt,
    },
    desc: unit.description,
  }));

const clusterTabs = [
  { id: "all", label: "Semua Unit" },
  { id: "Cluster Ladera", label: "Cluster Ladera" },
  { id: "Cluster Cascada", label: "Cluster Cascada" },
];

export function TipeRumah() {
  const [activeTab, setActiveTab] = useState("all");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const filteredUnits = useMemo(() => {
    if (activeTab === "all") return propertyTypes;
    return propertyTypes.filter((u) => u.cluster === activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  // CTA per kartu unit memakai window.open, bukan anchor, jadi tidak bisa
  // ditandai `data-wa-placement` tanpa merambatkan prop ke dalam kartu.
  // Karena komponen ini sudah client component, pelacaknya dipanggil langsung.
  const handleWhatsApp = (unitName: string) => {
    trackWhatsAppClick({
      page: window.location.pathname,
      placement: "tipe-rumah-card",
      unit: unitName,
    });
    const message = encodeURIComponent(`Halo, saya tertarik dengan unit Tipe ${unitName} di Grand Duta City South of Jakarta. Boleh minta info promo & simulasi cicilan terbaru?`);
    window.open(`https://wa.me/628131742034?text=${message}`, "_blank");
  };

  return (
    <section id="tipe-unit" className="py-16 sm:py-24 md:py-36 bg-[#F8F6F0] text-[#090D0A] relative overflow-hidden border-t border-[#090D0A]/6">
      
      {/* Subtle texture background */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 sm:px-8 md:px-14 lg:px-16">
          <Reveal className="flex flex-col gap-2.5 sm:gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] w-max">
              <Sparkles className="w-3 h-3 text-[#D49A3D]" />
              <span>Modern Tropical Architecture</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold leading-[1.18] sm:leading-[1.15] text-[#090D0A]">
              Tipe Rumah Grand Duta City Parung <br />
              <span className="italic font-normal text-[#B45309]">Sesuai Kebutuhan Anda</span>
            </h2>

            <p className="max-w-lg text-[#090D0A]/70 text-xs sm:text-base font-normal leading-[1.8] mt-1">
              Koleksi unit eksklusif di Cluster Ladera dan Cascada dengan spesifikasi premium standar kota mandiri Duta Putra Land.
            </p>
            <p className="max-w-lg text-[#090D0A]/70 text-xs sm:text-sm font-normal leading-[1.8] mt-2">
              Pilihan terbaik hunian di Parung, South of Jakarta dengan fasilitas kota mandiri 200 Ha dan akses strategis 20 menit ke CBD Jaksel.
            </p>
          </Reveal>
          
          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 max-w-full">
            {/* Cluster Filter Pills */}
            <div className="inline-flex p-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 max-w-full overflow-x-auto no-scrollbar">
              {clusterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-sans font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#090D0A] text-white shadow-md"
                      : "text-[#090D0A]/60 hover:text-[#090D0A]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Desktop Carousel Arrows */}
            <div className="hidden sm:flex shrink-0 gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => carouselApi?.scrollPrev()}
                disabled={!canScrollPrev}
                aria-label="Previous property slide"
                className="rounded-full border-[#090D0A]/15 text-[#090D0A] hover:bg-[#090D0A] hover:text-white disabled:opacity-30 disabled:pointer-events-none h-11 w-11 cursor-pointer transition-all duration-300"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => carouselApi?.scrollNext()}
                disabled={!canScrollNext}
                aria-label="Next property slide"
                className="rounded-full border-[#090D0A]/15 text-[#090D0A] hover:bg-[#090D0A] hover:text-white disabled:opacity-30 disabled:pointer-events-none h-11 w-11 cursor-pointer transition-all duration-300"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Carousel Component */}
        <div className="w-full">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: "start",
              skipSnaps: false,
              dragFree: false,
            }}
          >
            <CarouselContent className="ml-3 sm:ml-6 md:ml-12 lg:ml-16 pr-4 sm:pr-0">
              {filteredUnits.map((unit) => (
                <CarouselItem
                  key={unit.id}
                  className="pl-3 sm:pl-4 basis-[86%] sm:basis-[60%] md:basis-1/2 lg:basis-1/3"
                >
                  <ProductRevealCard
                    name={unit.name}
                    sizeLabel={unit.sizeLabel}
                    href={unit.href}
                    typeCategory={unit.typeCategory}
                    cluster={unit.cluster}
                    price={unit.price}
                    image={unit.image}
                    alt={unit.alt}
                    description={unit.desc}
                    electrical={PROJECT_ELECTRICAL}
                    legality={PROJECT_LEGALITY}
                    specs={unit.specs}
                    onAdd={() => handleWhatsApp(unit.name)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          
          {/* Mobile Dot Navigation */}
          <div className="mt-6 sm:mt-8 flex justify-center gap-1.5 md:hidden">
            {filteredUnits.map((_, index) => (
              <button
                key={index}
                className="p-1.5 focus:outline-none flex items-center justify-center cursor-pointer"
                onClick={() => carouselApi?.scrollTo(index)}
                aria-label={`Lihat unit ${index + 1}`}
              >
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === index ? "w-7 bg-[#C8521A]" : "w-2 bg-[#090D0A]/20"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Global Bottom CTA with Button-in-Button Architecture */}
        <Reveal className="mt-16 sm:mt-20 md:mt-24 text-center px-4">
          <div className="max-w-2xl mx-auto p-8 sm:p-10 rounded-[2.5rem] bg-white border border-[#090D0A]/8 shadow-[0_20px_50px_rgba(9,13,10,0.06)]">
            <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-[#B45309] mb-3 font-sans font-bold">
              Ketersediaan Unit &amp; Promo Terbatas Bulan Ini
            </p>
            <p className="font-serif text-xl sm:text-2xl md:text-3xl text-[#090D0A] mb-6 leading-snug font-bold">
              Ingin tahu tipe unit yang paling pas untuk anggaran Anda?
            </p>
            <p className="text-xs sm:text-sm text-[#090D0A]/70 mb-7 max-w-lg mx-auto font-normal">
              Dapatkan konsultasi gratis, simulasi cicilan resmi KPR 7 bank rekanan, dan promo tanpa DP langsung dari marketing in-house.
            </p>
            <a 
              href="https://wa.me/628131742034?text=Halo%2C%20saya%20tertarik%20dengan%20unit%20di%20Grand%20Duta%20City%20Parung%20South%20of%20Jakarta.%20Mohon%20info%20ketersediaan%20unit%20%26%20harga%20promo%20bulan%20ini."
              target="_blank"
              rel="noopener noreferrer"
              data-wa-placement="tipe-rumah-section-cta"
              className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 pl-5 pr-2 sm:pl-7 sm:pr-2.5 py-3 sm:py-4 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.16em] uppercase font-sans font-bold shadow-[0_10px_30px_rgba(200,82,26,0.4)] active:scale-[0.98] transition-all duration-300"
            >
              <span>Konsultasi Gratis</span>
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-white">
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            </a>

            {/* Tautan ke hub /tipe-rumah.
                Sejak 30 Agustus 2026 tiap KARTU juga menaut halaman tipenya
                langsung (lihat product-reveal-card.tsx). Kekhawatiran lama —
                bahwa menyisipkan <Link> per kartu membebani metrik homepage —
                dijawab dengan `prefetch={false}`, bukan dengan meniadakan
                tautannya. Tautan hub di sini tetap dipertahankan karena ia
                menjangkau juga tipe yang TIDAK muncul di carousel (unit
                sold-out disaring dari kartu). */}
            <p className="mt-6 text-xs sm:text-sm text-[#090D0A]/60 font-normal">
              Ingin membandingkan spesifikasi dan denah per tipe?{" "}
              <Link
                href="/tipe-rumah"
                className="font-semibold text-[#B45309] underline decoration-[#B45309]/30 underline-offset-2 hover:decoration-[#B45309]"
              >
                Lihat 10 tipe rumah GDC Parung
              </Link>
            </p>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
