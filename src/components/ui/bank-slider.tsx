"use client";

import Image from "next/image";

const bankLogos = [
  { name: "Bank Mandiri", src: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665175/logo_bank_mandiri_qgjt3s.webp", cls: "-translate-y-1.5" },
  { name: "Bank BSI", src: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665177/logo_bank_bsi_wkyt1u.webp", cls: "-translate-y-1.5" },
  { name: "Bank BRI", src: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665175/logo_bank_bri_mflp14.webp", cls: "" },
  { name: "Bank BTN", src: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665063/logo_bank_btn_1_pmehp1.webp", cls: "" },
  { name: "Bank OCBC NISP", src: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665107/logo_bank_ocbp_nisp_bquiz4.webp", cls: "-ml-8 sm:-ml-12" }
];

export function BankSlider({
  gradientColorFrom = "from-[#F8F6F0]",
  textColor = "text-[#090D0A]/50",
  className = ""
}: {
  gradientColorFrom?: string,
  textColor?: string,
  className?: string
}) {
  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 px-3">
        <span className="w-4 sm:w-6 h-px bg-[#D49A3D]/40 shrink-0" />
        <p className={`text-[10px] sm:text-[11px] font-sans tracking-[0.12em] sm:tracking-[0.25em] text-center uppercase font-semibold ${textColor}`}>
          Didukung 8 Bank Mitra Terpercaya · Pre-Approval KPR Cepat
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
          {[...bankLogos, ...bankLogos].map((logo, index) => (
            <div
              key={index}
              className={`relative w-22 sm:w-28 h-8 sm:h-9 shrink-0 grayscale opacity-65 hover:grayscale-0 hover:opacity-100 transition-all duration-300 ${logo.cls}`}
            >
              <Image
                src={logo.src}
                alt={`Logo ${logo.name}`}
                fill
                sizes="112px"
                className="object-contain object-left"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
