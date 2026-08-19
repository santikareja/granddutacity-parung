import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, ArrowUpRight, Clock, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#090D0A] text-[#F8F6F0] border-t border-white/8 [content-visibility:auto] [contain-intrinsic-size:1px_560px] relative z-20">

      {/* Top Luxury CTA Band */}
      <div className="border-b border-white/8 py-10 sm:py-18 relative overflow-hidden">
        {/* Subtle glow accent */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#D49A3D]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] uppercase font-sans font-bold text-[#D49A3D] mb-2.5 sm:mb-3 w-max">
              <span>Konsultasi &amp; Jadwal Survey</span>
            </div>
            <h2 className="font-serif text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#F8F6F0]">
              Wujudkan Rumah Impian Keluarga <br />
              <span className="italic font-normal text-[#D49A3D]">di Grand Duta City Parung</span>
            </h2>
          </div>

          <a
            href="https://wa.me/628131742034?text=Halo%2C%20saya%20tertarik%20dengan%20Promo%20Grand%20Duta%20City%20South%20of%20Jakarta.%20Mohon%20info%20ketersediaan%20unit%20%26%20jadwal%20survey%20lokasi."
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center gap-3.5 pl-6 sm:pl-8 pr-2 sm:pr-2.5 py-3 sm:py-4 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-xs sm:text-sm tracking-[0.16em] sm:tracking-[0.18em] uppercase font-sans font-bold shadow-[0_12px_36px_rgba(200,82,26,0.5)] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto shrink-0"
          >
            <span>Klaim Promo Tanpa DP</span>
            <span className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-white">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </a>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 py-10 sm:py-18 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-8">

        {/* Column 1: Brand & Credentials (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          <Link href="/" className="block group relative w-[135px] sm:w-[155px] aspect-[16/5]">
            <Image
              src="/logo.svg"
              alt="Grand Duta City Parung"
              fill
              sizes="(max-width: 768px) 135px, 155px"
              className="object-contain transition-opacity duration-300 group-hover:opacity-85"
            />
          </Link>
          <p className="text-[#F8F6F0]/55 text-xs sm:text-sm font-normal leading-[1.8] max-w-sm">
            Grand Duta City Parung | South of Jakarta Kota mandiri 200 Ha persembahan Duta Putra Land (sejak 1983). Kawasan hunian terintegrasi dengan Central Park, The Beach Lagoon, dan pusat bisnis CBD di koridor emas Parung, Bogor.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#D49A3D] font-sans font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Developer Terpercaya Lebih Dari 35 Tahun</span>
          </div>
        </div>

        {/* Column 2: Navigasi Cluster & Tipe (Col 3) */}
        <div className="lg:col-span-3 space-y-4">
          <p className="text-[#D49A3D] text-[10px] tracking-[0.25em] uppercase font-sans font-bold">
            Cluster &amp; Unit
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Cluster Ladera (Classic Modern)", href: "/cluster-ladera" },
              { label: "Cluster Cascada (Tropical Resort)", href: "/cluster-cascada" },
              { label: "Pricelist & Brosur", href: "/pricelist-grand-duta-city" },
              { label: "Update Stok & Siteplan", href: "/update-stok-siteplan-grand-duta-city-parung" },
              { label: "Cara Beli & Simulasi KPR", href: "/cara-beli-kpr" },
              { label: "Galeri Foto Kawasan", href: "/galeri" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-[#F8F6F0]/60 hover:text-[#F5A524] text-xs sm:text-sm font-normal transition-colors duration-200 flex items-center justify-between group"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Informasi Kawasan & Legal (Col 2) */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-[#D49A3D] text-[10px] tracking-[0.25em] uppercase font-sans font-bold">
            Informasi
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Lokasi & Akses Tol", href: "/lokasi-akses-grand-duta-city-parung" },
              { label: "Tentang Developer", href: "/about" },
              { label: "Blog Properti", href: "/artikel" },
              { label: "Topik Artikel", href: "/category" },
              { label: "Hubungi Marketing", href: "/kontak" },
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Disclaimer Legal", href: "/disclaimer" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-[#F8F6F0]/60 hover:text-[#F5A524] text-xs sm:text-sm font-normal transition-colors duration-200 flex items-center justify-between group"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Kontak Marketing Gallery (Col 3) */}
        <div className="lg:col-span-3 space-y-4">
          <p className="text-[#D49A3D] text-[10px] tracking-[0.25em] uppercase font-sans font-bold">
            Marketing Gallery
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#D49A3D] shrink-0 mt-1" />
              <span className="text-[#F8F6F0]/60 text-xs sm:text-sm leading-relaxed">
                Jl. Raya Parung No.47, Jabon Mekar, Kec. Parung, Kabupaten Bogor, Jawa Barat 16330
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#D49A3D] shrink-0" />
              <a 
                href="https://wa.me/628131742034" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#F8F6F0]/80 hover:text-[#F5A524] text-xs sm:text-sm font-semibold transition-colors duration-200"
              >
                +62 813‑1742‑034 (Official)
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#D49A3D] shrink-0" />
              <span className="text-[#F8F6F0]/60 text-xs sm:text-sm">
                Buka Setiap Hari: 09.00 - 18.00 WIB
              </span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="border-t border-white/8 py-6">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-14 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[#F8F6F0]/40 text-[11px] font-normal tracking-wide">
            &copy; {new Date().getFullYear()} Grand Duta City Parung - South of Jakarta. Hak Cipta Dilindungi.
          </p>
          <p className="text-[#F8F6F0]/30 text-[10px] tracking-[0.2em] uppercase font-sans">
            granddutacitysouthofjakarta.com
          </p>
        </div>
      </div>
    </footer>
  );
}
