"use client";

import { motion } from "framer-motion";
import { Building2, Navigation, Mountain, Droplet, Timer, ShieldCheck } from "lucide-react";

const advantages = [
  {
    title: "Developer Terpercaya",
    desc: "Dikembangkan oleh Duta Putra Land, berpengalaman membangun CBD, Superblok, Mall, dan Residential sejak 1983.",
    icon: <Building2 className="w-5 h-5" />,
    num: "01",
  },
  {
    title: "Lokasi Super Strategis",
    desc: "Di Jl. Raya Jakarta-Bogor. Hanya 20 menit dari Antasari & TB Simatupang. Dekat 4 exit tol utama.",
    icon: <Navigation className="w-5 h-5" />,
    num: "02",
  },
  {
    title: "Elevasi Tinggi",
    desc: "Berada di kontur dataran tinggi. Udara lebih sejuk, pemandangan luas, dan bebas banjir.",
    icon: <Mountain className="w-5 h-5" />,
    num: "03",
  },
  {
    title: "Minimalis Tropis Modern",
    desc: "Desain arsitektur yang adaptif dengan iklim tropis. Estetika fasad yang tak lekang oleh waktu.",
    icon: <Droplet className="w-5 h-5" />,
    num: "04",
  },
  {
    title: "15–20 Menit ke CBD Jaksel",
    desc: "Akses toll-to-toll super cepat mendekatkan Anda ke pusat bisnis Jakarta Selatan tanpa macet.",
    icon: <Timer className="w-5 h-5" />,
    num: "05",
  },
  {
    title: "Keamanan Terjamin",
    desc: "Sistem keamanan 24 jam terintegrasi Smart Home System untuk perlindungan ekstra keluarga Anda.",
    icon: <ShieldCheck className="w-5 h-5" />,
    num: "06",
  },
];

export function Keunggulan() {
  return (
    <section id="keunggulan" className="py-28 md:py-36 bg-[#F5F1E8] text-[#0b120c] relative overflow-hidden">

      {/* Subtle texture overrides for light theme */}
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#0b120c_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

      {/* Soft gradient glow top right */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#F5F1E8]/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

      <div className="max-w-screen-xl mx-auto px-8 md:px-14 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20"
        >
          <div>
            <p className="text-[#F5A524] text-[10px] tracking-[0.5em] uppercase font-sans font-semibold mb-5">
              Nilai Tambah
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-[#0b120c]">
              Keunggulan<br />
              <span className="italic font-normal text-[#0b120c]/60">Grand Duta City</span>
            </h2>
          </div>
          <p className="text-[#0b120c]/70 text-sm font-light leading-relaxed max-w-xs lg:max-w-sm mb-2">
            Investasi masa depan terbaik di kawasan selatan Jakarta, didukung spesifikasi dan infrastruktur kelas satu.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className="group bg-[#f7f5f0]/80 backdrop-blur-xl hover:bg-[#F5F1E8] border border-[#F5F1E8]/60 p-10 transition-all duration-500 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]"
            >
              {/* Hover green gradient left border */}
              <div className="absolute left-0 top-0 w-1 h-0 bg-gradient-to-b from-[#F5A524] to-transparent group-hover:h-full transition-all duration-700" />

              <div className="flex items-start justify-between mb-8">
                <div className="w-11 h-11 border border-[#0b120c]/10 group-hover:border-[#F5A524]/50 flex items-center justify-center text-[#F5A524]/70 group-hover:text-[#F5A524] transition-colors duration-300 bg-[#F5F1E8]/50">
                  {item.icon}
                </div>
                <span className="font-serif text-[#0b120c]/5 group-hover:text-[#F5A524]/10 text-5xl font-semibold transition-colors duration-300">
                  {item.num}
                </span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#0b120c] mb-3 group-hover:text-[#F5A524] transition-colors duration-300">
                {item.title}
              </h3>
              <p className="text-[#0b120c]/70 text-sm font-light leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
