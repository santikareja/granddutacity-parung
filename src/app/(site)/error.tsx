"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isNotFound = error.message?.toLowerCase().includes("not found") || error.digest === "NEXT_NOT_FOUND";

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#090D0A] text-[#F8F6F0] px-6 relative overflow-hidden">
      {/* Ambient accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C8521A]/8 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center text-center max-w-md mx-auto">
        {/* Error code */}
        <p className="font-serif font-bold text-[clamp(72px,16vw,128px)] leading-none text-transparent bg-clip-text bg-gradient-to-br from-[#F5A524] to-[#D49A3D] drop-shadow-[0_0_18px_rgba(245,165,36,0.18)]">
          {isNotFound ? "404" : "500"}
        </p>

        <div className="w-12 h-0.5 bg-[#D49A3D] my-6" />

        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          {isNotFound ? "Halaman Tidak Ditemukan" : "Sedang Ada Sedikit Gangguan"}
        </h1>

        <p className="text-[#F8F6F0]/60 text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
          {isNotFound
            ? "Halaman yang Anda cari mungkin sudah dipindahkan atau tidak tersedia. Kembali ke beranda untuk menjelajahi informasi Grand Duta City Parung."
            : "Terjadi kesalahan tak terduga saat memuat halaman. Silakan coba muat ulang, atau kembali ke beranda untuk informasi hunian Grand Duta City Parung South of Jakarta."}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {!isNotFound && (
            <button
              onClick={reset}
              className="group inline-flex items-center justify-center gap-2.5 pl-6 pr-2 py-3 rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white text-xs tracking-[0.16em] uppercase font-sans font-bold shadow-[0_10px_30px_rgba(200,82,26,0.35)] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto"
            >
              <span>Coba Muat Ulang</span>
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <RefreshCw className="w-3.5 h-3.5" />
              </span>
            </button>
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full border border-white/25 hover:border-[#F5A524] bg-white/5 hover:bg-white/10 text-[#F8F6F0] hover:text-[#F5A524] text-xs tracking-[0.16em] uppercase font-sans font-bold active:scale-[0.98] transition-all duration-300 w-full sm:w-auto"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Direct consult CTA */}
        <a
          href="https://wa.me/628131742034?text=Halo%2C%20saya%20mengalami%20kesulitan%20mengakses%20halaman%20Grand%20Duta%20City%20Parung.%20Mohon%20bantuan%20informasinya."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-[#F8F6F0]/45 hover:text-[#F5A524] text-[11px] tracking-wider font-sans transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          <span>Atau hubungi marketing via WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
