"use client";

import { useState } from "react";
import { ChevronDown, Calculator, ArrowUpRight, HelpCircle } from "lucide-react";
import Image from "next/image";

const faqs = [
  {
    q: "Berapa harga rumah di Grand Duta City Parung South of Jakarta?",
    a: "Harga rumah di Grand Duta City Parung mulai dari Rp 700 jutaan untuk Cluster Ladera (Tipe Malta 47/72) hingga Rp 1,6 Milyar-an untuk unit premium di Cluster Cascada (Tipe Alexandra 88/105). Cicilan KPR mulai sekitar Rp 4 jutaan per bulan dengan tenor hingga 25 tahun. Hubungi marketing untuk pricelist terbaru dan ketersediaan unit promo."
  },
  {
    q: "Apa saja syarat dan keuntungan Promo Tanpa DP bulan ini?",
    a: "Program Promo Tanpa DP berlaku untuk pemesanan unit baru di Cluster Ladera dan Cascada bulan berjalan, dengan proses KPR melalui 8 bank mitra (BCA, Mandiri, BTN, BRI, BNI, dll). Cukup siapkan dokumen pribadi (KTP, KK, slip gaji/SPT), dan tim marketing kami akan bantu pre-approval gratis. Konsultasi via WhatsApp untuk simulasi cicilan & bocoran promo aktif."
  },
  {
    q: "Di mana lokasi Grand Duta City Parung dan bagaimana akses tolnya?",
    a: "Berlokasi di Jl. Raya Parung No.47, Jabon Mekar, Kec. Parung, Kabupaten Bogor â€” hanya 20 menit ke TB Simatupang & Antasari Jakarta Selatan, dan kurang dari 15 menit ke 4 exit tol utama: Pamulang, Krukut, Sawangan, dan Bojong Gede. Akses ke Tol Desari, Tol Andara, Tol Pamulang, dan Tol BORR membuat hunian ini sangat strategis untuk komuter Jakarta-Depok-Bogor-BSD."
  },
  {
    q: "Fasilitas eksklusif apa saja di kawasan Grand Duta City SOJ?",
    a: "Penghuni menikmati fasilitas kelas premium: The Beach (kolam tematik), Cluster Private Pool, Central Park, Ruang Terbuka Hijau 80 Ha, Playground, Pusat Kuliner FnB, Garden Cafe, Boulevard utama, Keamanan 24/7 dengan CCTV, One Gate System, serta jaringan kabel bawah tanah untuk estetika kawasan yang rapi modern."
  },
  {
    q: "Apakah kawasan Grand Duta City Parung aman dari banjir?",
    a: "Ya. Kawasan dirancang dengan polder system terpadu berskala kota mandiri dan elevasi tanah optimal di dataran tinggi Parung Bogor. Drainase induk dan area resapan dirancang untuk menjamin lingkungan bebas banjir bahkan saat curah hujan tinggi."
  },
  {
    q: "Bagaimana prospek investasi properti di Grand Duta City Parung?",
    a: "Sangat menjanjikan. Kawasan ini dilewati jalur rencana Tol JORR 3 yang akan mendongkrak capital gain signifikan, menjadikannya sunrise property terbaik di koridor selatan Jakarta. Kombinasi 200 Ha kota mandiri, infrastruktur lengkap, dan posisi strategis 20 menit dari CBD Jakarta Selatan menempatkan GDC SOJ sebagai pilihan investasi properti Bogor dengan potensi apresiasi tinggi 5â€“10 tahun ke depan."
  }
];

export function FaqKpr() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // KPR Calculator State
  const [harga, setHarga] = useState<number>(900000000);
  const [dpPercent, setDpPercent] = useState<number>(10);
  const [bunga, setBunga] = useState<number>(4.75);
  const [tenor, setTenor] = useState<number>(15);

  // KPR Calculation Logic
  const dpAmount = harga * (dpPercent / 100);
  const pokokKredit = harga - dpAmount;
  const i = (bunga / 100) / 12;
  const n = tenor * 12;
  const cicilanPerBulan = i > 0 
    ? pokokKredit * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
    : pokokKredit / n;

  const formatRp = (val: number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(val);
  };

  return (
    <section id="faq-kpr" className="py-16 sm:py-24 md:py-36 bg-[#F8F6F0] text-[#090D0A] relative border-t border-[#090D0A]/6 overflow-hidden">
      {/* FAQPage schema is rendered server-side in src/app/(site)/page.tsx for optimal crawlability */}

      {/* Texture Background */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#090d0a_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 lg:gap-16 items-start">
          
          {/* Left Column: FAQ Accordion */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="mb-6 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D0A]/5 border border-[#090D0A]/8 text-[9px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.2em] font-sans font-bold uppercase text-[#B45309] mb-3 sm:mb-4 w-max">
                <HelpCircle className="w-3 h-3 text-[#D49A3D]" />
                <span>Pusat Informasi &amp; Panduan</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold leading-[1.18] sm:leading-[1.15] text-[#090D0A]">
                Pertanyaan yang Sering <br />
                <span className="italic font-normal text-[#B45309]">Diajukan Calon Pembeli</span>
              </h2>
              <div className="w-12 sm:w-16 h-0.5 bg-[#D49A3D] mt-4 sm:mt-6" />
            </div>

            <div className="space-y-3 sm:space-y-3.5">
              {faqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <div
                    key={i}
                    className="border border-[#090D0A]/8 bg-white rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_4px_20px_rgba(9,13,10,0.02)] hover:shadow-[0_10px_30px_rgba(9,13,10,0.06)]"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="w-full flex items-center justify-between p-4 sm:p-6 text-left cursor-pointer"
                    >
                      <span className="font-sans font-semibold text-xs sm:text-base md:text-[17px] leading-snug text-[#090D0A] pr-3 sm:pr-4">
                        {faq.q}
                      </span>
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#090D0A]/5 flex items-center justify-center shrink-0 text-[#B45309] transition-transform duration-300"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </button>
                    {/* Akordeon CSS: grid-template-rows 0frâ†’1fr menganimasikan
                        tinggi tanpa JS (menggantikan AnimatePresence height) */}
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 sm:px-6 sm:pb-6 text-[#090D0A]/75 font-normal text-xs sm:text-sm md:text-base leading-[1.8] border-t border-[#090D0A]/5 pt-3.5 sm:pt-4">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Double-Bezel KPR Calculator */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="rounded-[2rem] sm:rounded-[2.5rem] p-1.5 sm:p-2 bg-[#090D0A]/5 border border-[#090D0A]/10 shadow-[0_25px_60px_rgba(9,13,10,0.08)] lg:sticky lg:top-28">
              <div className="rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2.5rem-0.5rem)] p-4 sm:p-8 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                
                {/* Promo Thumbnail */}
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl sm:rounded-2xl mb-5 sm:mb-6 border border-[#090D0A]/8 shadow-sm">
                  <Image
                    src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775663927/Promo_Grand_Duta_City_SOuth_of_Jakarta_Harga_sbgtyx.webp"
                    alt="Promo Harga Grand Duta City"
                    fill
                    sizes="(max-width: 480px) 290px, (max-width: 768px) 50vw, 40vw"
                    className="object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#C8521A] text-white text-[8px] sm:text-[9px] font-sans font-bold tracking-widest uppercase shadow-md">
                    Promo Tanpa DP
                  </div>
                </div>

                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-[#B45309]/10 border border-[#B45309]/20 flex items-center justify-center shrink-0 text-[#B45309]">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#090D0A]">Kalkulator Simulasi KPR</h3>
                    <p className="font-sans text-[10px] text-[#090D0A]/50 tracking-wider uppercase font-semibold mt-0.5">Estimasi Angsuran Bulanan</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Property Price */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#090D0A]/80 mb-2 font-sans">
                      <span>Harga Properti</span>
                      <span className="text-[#B45309] font-bold">{formatRp(harga)}</span>
                    </div>
                    <input 
                      type="range" 
                      aria-label="Harga Properti"
                      min={700000000} 
                      max={2000000000} 
                      step={10000000}
                      value={harga}
                      onChange={(e) => setHarga(Number(e.target.value))}
                      className="w-full h-2 bg-[#090D0A]/10 rounded-full appearance-none outline-none accent-[#C8521A] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* DP Percentage */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#090D0A]/70 mb-1.5 font-sans">
                        Uang Muka (%)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          aria-label="Persentase Uang Muka"
                          value={dpPercent}
                          onChange={(e) => setDpPercent(Number(e.target.value))}
                          className="w-full bg-[#F8F6F0] border border-[#090D0A]/10 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold text-[#090D0A] focus:outline-none focus:border-[#C8521A] transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#090D0A]/40 text-xs pointer-events-none">%</span>
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#090D0A]/70 mb-1.5 font-sans">
                        Bunga p.a (%)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          aria-label="Suku Bunga Persen"
                          step="0.01"
                          value={bunga}
                          onChange={(e) => setBunga(Number(e.target.value))}
                          className="w-full bg-[#F8F6F0] border border-[#090D0A]/10 rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold text-[#090D0A] focus:outline-none focus:border-[#C8521A] transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#090D0A]/40 text-xs pointer-events-none">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tenor Range */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[#090D0A]/80 mb-2 font-sans">
                      <span>Tenor Pinjaman</span>
                      <span className="text-[#B45309] font-bold">{tenor} Tahun</span>
                    </div>
                    <input 
                      type="range" 
                      aria-label="Tenor Pinjaman"
                      min={5} 
                      max={25} 
                      step={1}
                      value={tenor}
                      onChange={(e) => setTenor(Number(e.target.value))}
                      className="w-full h-2 bg-[#090D0A]/10 rounded-full appearance-none outline-none accent-[#C8521A] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#090D0A]/40 mt-1.5 font-sans font-medium">
                      <span>5 Thn</span>
                      <span>15 Thn</span>
                      <span>25 Thn</span>
                    </div>
                  </div>

                  {/* Calculated Result Box */}
                  <div className="pt-4 border-t border-[#090D0A]/10 mt-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#090D0A]/50 mb-1 font-sans font-bold">
                      Estimasi Cicilan KPR
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-2xl sm:text-3xl font-bold text-[#090D0A]">
                        {formatRp(cicilanPerBulan)}
                      </span>
                      <span className="text-[#090D0A]/50 text-xs font-sans">/ bulan</span>
                    </div>
                  </div>

                  {/* Button-in-Button WhatsApp Inquiry */}
                  <a
                    href="https://wa.me/628131742034"
                    onClick={(e) => {
                      e.preventDefault();
                      const msg = `Halo, saya tertarik dengan Promo Tanpa DP di Grand Duta City South of Jakarta. Dari kalkulator KPR saya cek estimasi cicilan ${formatRp(cicilanPerBulan)}/bln (harga ${formatRp(harga)}, DP ${dpPercent}%, tenor ${tenor} thn). Mohon info promo & ketersediaan unit terbaru.`;
                      window.open(`https://wa.me/628131742034?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="group relative w-full flex items-center justify-between pl-6 pr-2 py-3.5 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-xs font-sans font-bold uppercase tracking-[0.16em] shadow-[0_8px_24px_rgba(200,82,26,0.35)] active:scale-[0.98] transition-all duration-300 cursor-pointer text-center mt-2"
                  >
                    <span>Klaim Promo Tanpa DP</span>
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-white">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </a>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
