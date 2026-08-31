"use client";

import Image from "next/image";
import {
  BANK_PARTNER_COUNT,
  bankPartners,
} from "@/data/bank-partners";

/**
 * Daftar bank kini berasal dari SUMBER TUNGGAL `src/data/bank-partners.ts`
 * (Fase 3 spec seo-cannibalization-and-pseo).
 *
 * Sebelumnya array `bankLogos` lokal memuat 5 bank sementara copy di atasnya
 * mengklaim "8 Bank Mitra" — angka yang bisa langsung dibantah pembaca dengan
 * menghitung logo di layar. Jumlah sekarang diturunkan dari data
 * (`BANK_PARTNER_COUNT`), jadi copy tidak bisa lagi menyimpang dari isinya.
 *
 * Bank yang logonya belum tersedia dirender sebagai chip teks, bukan
 * disembunyikan, supaya jumlah yang terlihat tetap sama dengan yang diklaim.
 */
export function BankSlider({
  gradientColorFrom = "from-[#F8F6F0]",
  textColor = "text-[#090D0A]/50",
  className = ""
}: {
  gradientColorFrom?: string,
  textColor?: string,
  className?: string
}) {
  // Digandakan agar marquee CSS-nya mulus tanpa jeda.
  const marqueeItems = [...bankPartners, ...bankPartners];

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 px-3">
        <span className="w-4 sm:w-6 h-px bg-[#D49A3D]/40 shrink-0" />
        <p className={`text-[10px] sm:text-[11px] font-sans tracking-[0.12em] sm:tracking-[0.25em] text-center uppercase font-semibold ${textColor}`}>
          Didukung {BANK_PARTNER_COUNT} Bank Mitra Terpercaya · Pre-Approval KPR Cepat
        </p>
        <span className="w-4 sm:w-6 h-px bg-[#D49A3D]/40 shrink-0" />
      </div>

      <div className="relative flex w-full max-w-full sm:max-w-[640px] md:max-w-[760px] mx-auto overflow-hidden px-1">
        {/* Gradient Masks for smooth fade on edges */}
        <div className={`absolute inset-y-0 left-0 w-10 sm:w-24 bg-gradient-to-r ${gradientColorFrom} to-transparent z-10 pointer-events-none`} />
        <div className={`absolute inset-y-0 right-0 w-10 sm:w-24 bg-gradient-to-l ${gradientColorFrom} to-transparent z-10 pointer-events-none`} />

        {/* CSS-driven marquee (GPU transform, off main thread) */}
        <div
          className="flex gap-8 sm:gap-16 items-center shrink-0 w-max pr-8 sm:pr-16 animate-marquee-x"
          aria-hidden="true"
        >
          {marqueeItems.map((bank, index) => (
            <div
              key={`${bank.id}-${index}`}
              className={`relative w-22 sm:w-28 h-8 sm:h-9 shrink-0 grayscale opacity-65 hover:grayscale-0 hover:opacity-100 transition-all duration-300 ${bank.className ?? ""}`}
            >
              {bank.logo ? (
                <Image
                  src={bank.logo}
                  alt={`Logo ${bank.name}`}
                  fill
                  sizes="112px"
                  className="object-contain object-left"
                  loading="lazy"
                />
              ) : (
                <span
                  className={`flex h-full items-center whitespace-nowrap text-[11px] sm:text-xs font-sans font-semibold ${textColor}`}
                >
                  {bank.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
