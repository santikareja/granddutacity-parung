import { BankSlider } from "@/components/ui/bank-slider";

export function BankPartners() {
  return (
    <section
      id="mitra-bank"
      aria-label="Mitra Pembiayaan KPR Grand Duta City Parung"
      className="relative bg-[#F2F2F0] py-10 sm:py-14 border-b border-[#090D0A]/8 overflow-hidden"
    >
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center justify-center px-4 sm:px-6">
        <BankSlider
          gradientColorFrom="from-[#F2F2F0]"
          textColor="text-[#090D0A]/50 text-center font-semibold"
        />
      </div>
    </section>
  );
}
