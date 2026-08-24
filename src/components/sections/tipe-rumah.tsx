"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Sparkles, ArrowUpRight } from "lucide-react";

import { ProductRevealCard } from "@/components/ui/product-reveal-card";
import { clImg } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const propertyTypes = [
  // Cluster Ladera
  {
    id: "tuscan-66",
    name: "TUSCAN",
    typeCategory: "Type 66",
    cluster: "Cluster Ladera",
    tag: "Cluster Ladera",
    price: "1.1 Milyar-an",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Tuscan_drllpk.webp", { w: 480, h: 480, q: 55 }),
    specs: { bed: 3, bath: 2, carport: 2, lb: 66, lt: 72 },
    desc: "Tipe hunian 2 lantai elegan di Cluster Ladera, tipe terfavorit dengan ruang keluarga luas bergaya Modern American Classic."
  },
  {
    id: "malta-47",
    name: "MALTA",
    typeCategory: "Type 47",
    cluster: "Cluster Ladera",
    tag: "Cluster Ladera",
    price: "800 Juta-an",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Malta_tkq7di.webp", { w: 480, h: 480, q: 55 }),
    specs: { bed: "2+1", bath: 1, carport: 2, lb: 47, lt: 72 },
    desc: "Tipe praktis dengan ekstra ruang fleksibel di Cluster Ladera, sangat ideal untuk keluarga muda yang mengutamakan efisiensi."
  },
  // Cluster Cascada
  {
    id: "alexandra-88",
    name: "ALEXANDRA",
    typeCategory: "Type 88",
    cluster: "Cluster Cascada",
    tag: "Cluster Cascada",
    price: "1.4 Milyar-an",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Alexandra_hhvq3f.webp", { w: 480, h: 480, q: 55 }),
    specs: { bed: 3, bath: 2, carport: 2, lb: 88, lt: 105 },
    desc: "Hunian termewah di Cluster Cascada dengan kavling tanah terluas (105 m²), menghadirkan kenyamanan penuh bagi keluarga mapan."
  },
  {
    id: "air-plus-42",
    name: "AIRA+",
    typeCategory: "Type 42",
    cluster: "Cluster Cascada",
    tag: "Cluster Cascada",
    price: "800 Juta-an",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp", { w: 480, h: 480, q: 55 }),
    specs: { bed: 2, bath: 1, carport: 1, lb: 42, lt: 60 },
    desc: "Desain tropis minimalis di Cluster Cascada, memaksimalkan pencahayaan dan sirkulasi alami dalam hunian kompak bernilai tinggi."
  },
  {
    id: "manoa-58",
    name: "MANOA",
    typeCategory: "Type 58",
    cluster: "Cluster Cascada",
    tag: "Cluster Cascada",
    price: "800 Juta-an",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp", { w: 480, h: 480, q: 55 }),
    specs: { bed: 1, bath: 2, carport: 1, lb: 58, lt: 60 },
    desc: "Konsep hunian resort modern di Cluster Cascada dengan fokus pada privasi, ruang terbuka menenangkan, dan high ceiling."
  },
  {
    id: "victoria-69",
    name: "VICTORIA",
    typeCategory: "Type 69",
    cluster: "Cluster Cascada",
    tag: "Cluster Cascada",
    price: "1.1 Milyar-an",
    image: clImg("https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Victoria_scolcc.webp", { w: 480, h: 480, q: 55 }),
    specs: { bed: 3, bath: 2, carport: 2, lb: 69, lt: 72 },
    desc: "Perpaduan sempurna antara estetika dan fungsionalitas di Cluster Cascada, menyediakan ruang tumbuh terbaik untuk keluarga."
  },
];

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

  const handleWhatsApp = (unitName: string) => {
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
                    typeCategory={unit.typeCategory}
                    cluster={unit.cluster}
                    price={unit.price}
                    image={unit.image}
                    description={unit.desc}
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
              Dapatkan konsultasi gratis, simulasi cicilan resmi KPR 8 bank rekanan, dan promo tanpa DP langsung dari marketing in-house.
            </p>
            <a 
              href="https://wa.me/628131742034?text=Halo%2C%20saya%20tertarik%20dengan%20unit%20di%20Grand%20Duta%20City%20Parung%20South%20of%20Jakarta.%20Mohon%20info%20ketersediaan%20unit%20%26%20harga%20promo%20bulan%20ini."
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 pl-5 pr-2 sm:pl-7 sm:pr-2.5 py-3 sm:py-4 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.16em] uppercase font-sans font-bold shadow-[0_10px_30px_rgba(200,82,26,0.4)] active:scale-[0.98] transition-all duration-300"
            >
              <span>Konsultasi Gratis</span>
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-white">
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            </a>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
