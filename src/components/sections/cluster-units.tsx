"use client";

import { ProductRevealCard } from "@/components/ui/product-reveal-card";
import { Reveal } from "@/components/ui/reveal";
import { propertyTypes } from "@/lib/data";

interface PricingProps {
  title: string;
  methods: string[];
}

interface ClusterUnitsProps {
  clusterName: string; // e.g. "Cluster Cascada"
  pricing?: PricingProps;
  sectionId?: string;
}

export function ClusterUnits({ clusterName, pricing, sectionId }: ClusterUnitsProps) {
  const units = propertyTypes.filter((p) => p.cluster === clusterName);

  const handleWhatsApp = (unitName: string) => {
    const message = encodeURIComponent(`Halo, saya tertarik dengan unit ${unitName} di ${clusterName}. Boleh minta info lebih detail?`);
    window.open(`https://wa.me/628131742034?text=${message}`, "_blank");
  };

  return (
    <section id={sectionId} className="py-24 bg-[#F5F1E8] text-[#0b120c] relative scroll-mt-28">
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#0b120c_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-6 md:px-14 relative z-10">
        <Reveal className="text-center mb-16">
          <p className="text-[#F5A524] text-[10px] md:text-sm tracking-[0.4em] uppercase font-sans font-semibold mb-6">
            Pilihan Unit
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-6 text-[#0b120c]">
            Tipe Rumah {clusterName.replace("Cluster ", "")}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {units.map((unit, idx) => (
            <Reveal key={unit.id} delay={90 * idx}>
              <ProductRevealCard
                name={unit.name}
                typeCategory={unit.typeCategory}
                cluster={unit.cluster}
                price={unit.price}
                image={unit.image}
                description={unit.desc}
                soldOut={unit.soldOut}
                specs={unit.specs}
                onAdd={() => handleWhatsApp(unit.name)}
              />
            </Reveal>
          ))}
        </div>

        {pricing && (
          <Reveal className="border-t border-[#0b120c]/10 pt-16 max-w-4xl mx-auto text-center">
            <h3 className="font-serif text-2xl md:text-4xl text-[#0b120c] font-semibold mb-10">
              {pricing.title}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
              {pricing.methods.map((method, idx) => (
                <div key={idx} className="px-6 py-4 bg-[#F5F1E8] border border-[#0b120c]/10 rounded-full shadow-sm">
                  <p className="font-sans text-sm tracking-wider uppercase font-medium text-[#F5A524]">
                    {method}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
