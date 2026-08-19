const specifications = [
  { label: "Pondasi", value: "Batu Kali, Pondasi Tapak" },
  { label: "Struktur Bangunan", value: "Beton Bertulang" },
  { label: "Dinding", value: "Bata Merah Diplester, Diaci, dan Dicat (Double Wall)" },
  { label: "Lantai", value: "Homogeneous Tile" },
  { label: "Atap", value: "Genteng Beton" },
  { label: "Kerangka Atap", value: "Rangka Baja Ringan" },
  { label: "Plafon", value: "Gypsum Board" },
  { label: "Pintu", value: "Kusen Aluminium, Daun Pintu Engineering Wood Finish Cat" },
  { label: "Jendela", value: "Kusen Aluminium, Jendela Aluminium dan Kaca" },
  { label: "Dapur", value: "Meja Beton, Keramik, dan Kitchen Sink" },
  { label: "Sanitary", value: "Ex. TOTO" },
  { label: "Lantai Carport", value: "Keramik Kombinasi Rabat Beton dan Koral Sikat" },
  { label: "Facade Ornament", value: "Woodplank, Keramik" },
  { label: "Daya Listrik", value: "PLN 2.200 Watt" },
];

export function ClusterSpecs() {
  return (
    <section className="relative bg-[#0b120c] py-24 text-[#F5F1E8] [content-visibility:auto] [contain-intrinsic-size:1px_1100px]">
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(white_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-6 md:px-14 relative z-10">
        <div className="mb-16 text-center">
          <p className="text-[#F5A524] text-[10px] md:text-sm tracking-[0.4em] uppercase font-sans font-semibold mb-4">
            Quality Material
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#F5F1E8] mb-6">
            Spesifikasi Bangunan
          </h2>
          <div className="w-12 h-px bg-[#F5A524] mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {specifications.map((spec, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[#F5F1E8]/[0.02] border border-[#F5F1E8]/5 hover:border-[#F5A524]/30 transition-colors"
            >
              <p className="font-sans text-[10px] tracking-widest text-[#F5A524] uppercase font-medium mb-3">
                {spec.label}
              </p>
              <p className="font-serif text-sm md:text-base text-[#F5F1E8]/80 leading-relaxed font-light">
                {spec.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
