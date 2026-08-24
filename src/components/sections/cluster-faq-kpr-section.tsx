"use client";

import { useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import Image from "next/image";

import { BankSlider } from "@/components/ui/bank-slider";

type FaqItem = {
  question: string;
  answer: string;
};

interface ClusterFaqKprSectionProps {
  eyebrow: string;
  title: string;
  faqs: FaqItem[];
  initialPrice: number;
  minPrice: number;
  maxPrice: number;
  priceStep?: number;
  clusterName: string;
  whatsappText: string;
  promoImage?: string;
  promoImageAlt?: string;
  sectionId?: string;
}

const DEFAULT_PROMO_IMAGE =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775663927/Promo_Grand_Duta_City_SOuth_of_Jakarta_Harga_sbgtyx.webp";
const DEFAULT_PROMO_ALT = "Promo KPR Grand Duta City South of Jakarta";
const WHATSAPP_NUMBER = "628131742034";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ClusterFaqKprSection({
  eyebrow,
  title,
  faqs,
  initialPrice,
  minPrice,
  maxPrice,
  priceStep = 10000000,
  clusterName,
  whatsappText,
  promoImage = DEFAULT_PROMO_IMAGE,
  promoImageAlt = DEFAULT_PROMO_ALT,
  sectionId,
}: ClusterFaqKprSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [harga, setHarga] = useState(initialPrice);
  const [dpPercent, setDpPercent] = useState(10);
  const [bunga, setBunga] = useState(4.75);
  const [tenor, setTenor] = useState(15);

  const dpAmount = harga * (dpPercent / 100);
  const pokokKredit = harga - dpAmount;
  const bungaBulanan = (bunga / 100) / 12;
  const jumlahBulan = tenor * 12;
  const cicilanPerBulan =
    bungaBulanan > 0
      ? pokokKredit *
        (bungaBulanan * Math.pow(1 + bungaBulanan, jumlahBulan)) /
        (Math.pow(1 + bungaBulanan, jumlahBulan) - 1)
      : pokokKredit / jumlahBulan;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const handleDpChange = (nextValue: string) => {
    const parsedValue = Number(nextValue);
    setDpPercent(Number.isFinite(parsedValue) ? clamp(parsedValue, 0, 90) : 10);
  };

  const handleBungaChange = (nextValue: string) => {
    const parsedValue = Number(nextValue);
    setBunga(Number.isFinite(parsedValue) ? clamp(parsedValue, 0, 25) : 4.75);
  };

  return (
    <section
      id={sectionId}
      className="relative border-t border-[#0b120c]/5 bg-[#F5F1E8] py-24 text-[#0b120c] scroll-mt-28"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(#0b120c_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative z-10 mx-auto max-w-screen-xl px-6 md:px-14">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <div className="mb-12">
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.5em] text-[#F5A524]">
                {eyebrow}
              </p>
              <h2 className="font-serif text-3xl font-semibold leading-tight text-[#0b120c] md:text-5xl">
                {title}
              </h2>
              <div className="mt-6 h-px w-12 bg-[#F5A524]" />
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8]/70 transition-all hover:bg-[#F5F1E8] hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-6 text-left"
                    >
                      <span className="pr-6 font-sans text-[15px] font-medium tracking-wide text-[#0b120c] md:text-[17px]">
                        {faq.question}
                      </span>
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0b120c]/10 transition-transform duration-300"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        <ChevronDown className="h-4 w-4 text-[#F5A524]" />
                      </div>
                    </button>

                    {/* Akordeon CSS: grid-template-rows 0fr→1fr tanpa JS */}
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
                      style={{
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-6 text-[14px] leading-[1.8] text-[#0b120c]/72 md:text-[15px]">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <BankSlider className="mt-16 border-t border-[#0b120c]/10 pt-10" />
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-[#0b120c]/10 bg-[#F5F1E8] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.05)] md:p-8 lg:sticky lg:top-32">
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#F5A524]/5 blur-[60px]" />

              <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#0b120c]/5 shadow-sm">
                <Image
                  src={promoImage}
                  alt={promoImageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 44vw, 420px"
                  className="object-cover"
                />
              </div>

              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F5A524]/10 bg-[#F5A524]/5">
                  <Calculator className="h-5 w-5 text-[#F5A524]" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#0b120c]">Simulasi KPR</h3>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-[#0b120c]/40">
                    Estimasi Pembiayaan {clusterName}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor={`${sectionId ?? "faq"}-harga`}
                    className="mb-2 flex justify-between text-xs font-medium tracking-wide text-[#0b120c]/70"
                  >
                    <span>Harga Properti</span>
                    <span className="font-semibold text-[#0b120c]">{formatCurrency(harga)}</span>
                  </label>
                  <input
                    id={`${sectionId ?? "faq"}-harga`}
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={priceStep}
                    value={harga}
                    onChange={(event) => setHarga(clamp(Number(event.target.value), minPrice, maxPrice))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#0b120c]/10 accent-[#F5A524] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`${sectionId ?? "faq"}-dp`}
                      className="mb-2 block text-xs font-medium tracking-wide text-[#0b120c]/70"
                    >
                      Uang Muka (%)
                    </label>
                    <div className="relative">
                      <input
                        id={`${sectionId ?? "faq"}-dp`}
                        type="number"
                        min={0}
                        max={90}
                        value={dpPercent}
                        onChange={(event) => handleDpChange(event.target.value)}
                        className="w-full rounded-lg border border-[#0b120c]/10 bg-[#0b120c]/[0.02] px-3 py-2.5 text-sm text-[#0b120c] transition-colors focus:border-[#F5A524]/50 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#0b120c]/40">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`${sectionId ?? "faq"}-bunga`}
                      className="mb-2 block text-xs font-medium tracking-wide text-[#0b120c]/70"
                    >
                      Bunga p.a (%)
                    </label>
                    <div className="relative">
                      <input
                        id={`${sectionId ?? "faq"}-bunga`}
                        type="number"
                        min={0}
                        max={25}
                        step="0.01"
                        value={bunga}
                        onChange={(event) => handleBungaChange(event.target.value)}
                        className="w-full rounded-lg border border-[#0b120c]/10 bg-[#0b120c]/[0.02] px-3 py-2.5 text-sm text-[#0b120c] transition-colors focus:border-[#F5A524]/50 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#0b120c]/40">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`${sectionId ?? "faq"}-tenor`}
                    className="mb-2 flex justify-between text-xs font-medium tracking-wide text-[#0b120c]/70"
                  >
                    <span>Tenor Pinjaman</span>
                    <span className="text-[#0b120c]">{tenor} Tahun</span>
                  </label>
                  <input
                    id={`${sectionId ?? "faq"}-tenor`}
                    type="range"
                    min={5}
                    max={25}
                    step={1}
                    value={tenor}
                    onChange={(event) => setTenor(clamp(Number(event.target.value), 5, 25))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#0b120c]/10 accent-[#F5A524] outline-none"
                  />
                  <div className="mt-2 flex justify-between text-[10px] text-[#0b120c]/30">
                    <span>5 Thn</span>
                    <span>25 Thn</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#0b120c]/10 pt-6">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#0b120c]/40">
                    Estimasi Cicilan
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-semibold text-[#0b120c]">
                      {formatCurrency(cicilanPerBulan)}
                    </span>
                    <span className="text-xs tracking-wider text-[#0b120c]/40">/ bln</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#0b120c]/60">
                    Estimasi ini membantu Anda membaca kisaran cicilan sebelum konsultasi lebih lanjut
                    dengan tim marketing dan bank partner.
                  </p>
                </div>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex w-full items-center justify-center rounded-xl border border-[#F5A524] p-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#F5A524] transition-all duration-300 hover:bg-[#F5A524] hover:text-[#F5F1E8]"
                >
                  Konsultasi Simulasi KPR
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
