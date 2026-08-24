"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ArrowUpRight, Sparkles } from "lucide-react";

// Popup HANYA dibuka setelah interaksi nyata pengguna (tap/klik/keyboard).
//
// Pemicu berbasis timer (dulu 14s) terbukti merusak LCP: saat popup ter-paint,
// gambarnya yang paling luas di viewport sehingga tercatat sebagai elemen LCP
// baru pada detik ke-14+ — menggantikan kandidat LCP hero yang sudah cepat.
// Interaksi pertama tidak pernah terjadi pada Lighthouse/PSI, jadi metrik lab
// kembali mengukur konten utama halaman; pengunjung nyata tetap melihat promo.
const OPEN_AFTER_INTERACTION_MS = 800;
const SESSION_KEY = "gdc-promo-popup-shown";
const WA_NUMBER = "628131742034";
const WA_MESSAGE = encodeURIComponent(
  "Halo, saya mau ambil promo sekarang untuk Grand Duta City Parung. Mohon kirim detail promo, simulasi cicilan, dan langkah booking unit.",
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;
const PROMO_IMAGE_URL =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776701051/Promo_Tanpa_DP_Grand_Duta_City_Parung_ttsrvs.jpg";

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasShown = window.sessionStorage.getItem(SESSION_KEY);
    if (hasShown === "1") return;

    let scheduled = false;

    const scheduleOpen = () => {
      if (scheduled) return;
      scheduled = true;
      window.removeEventListener("pointerdown", scheduleOpen);
      window.removeEventListener("keydown", scheduleOpen);
      timerRef.current = window.setTimeout(() => {
        setIsOpen(true);
        window.sessionStorage.setItem(SESSION_KEY, "1");
      }, OPEN_AFTER_INTERACTION_MS);
    };

    window.addEventListener("pointerdown", scheduleOpen);
    window.addEventListener("keydown", scheduleOpen);

    return () => {
      window.removeEventListener("pointerdown", scheduleOpen);
      window.removeEventListener("keydown", scheduleOpen);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm select-none"
      style={{ animation: "fadeIn 0.25s ease-out both" }}
      onClick={() => setIsOpen(false)}
      role="presentation"
    >
      <aside
        className="relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-[2.25rem] p-1.5 bg-[#090D0A]/90 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.7)] ring-1 ring-black/50"
        style={{ animation: "waPanelIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Promo Eksklusif Grand Duta City Parung"
      >
            <div className="rounded-[calc(2.25rem-0.375rem)] overflow-hidden bg-[#131B15] relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/80 cursor-pointer shadow-md"
                aria-label="Tutup popup promo"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative w-full overflow-hidden bg-[#090D0A]">
                <Image
                  src={PROMO_IMAGE_URL}
                  alt="Promo Tanpa DP Grand Duta City Parung"
                  width={1080}
                  height={1350}
                  sizes="(max-width: 640px) 94vw, 420px"
                  className="h-auto w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#131B15] to-transparent" />
              </div>

              <div className="px-6 pb-6 pt-2 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#D49A3D] mb-3">
                  <Sparkles className="w-3 h-3" />
                  <span>Promo Terbatas Bulan Ini</span>
                </div>

                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center justify-center gap-3 w-full rounded-full bg-[#C8521A] hover:bg-[#DE5E1E] px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-[#C8521A]/30 active:scale-[0.98] transition-all"
                >
                  <span>Klaim Promo Sekarang</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
      </aside>
    </div>
  );
}