"use client";

import { useState, useEffect, useRef } from "react";
import { X, ArrowUpRight } from "lucide-react";

const WA_NUMBER = "628131742034";
const WA_MESSAGE = encodeURIComponent(
  "Halo, saya tertarik dengan properti Grand Duta City South of Jakarta. Boleh minta info promo terbaru?"
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleOpen = () => {
    setOpen(!open);
    if (!open) setHasNotification(false);
  };

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3 select-none">

      {/* Chat Panel with Double-Bezel Architecture */}
      {open && (
        <div
          className="w-[calc(100vw-36px)] sm:w-[330px] max-w-[350px] rounded-[2rem] p-1.5 bg-[#0B120C] lg:bg-[#090D0A]/85 lg:backdrop-blur-2xl border border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
          style={{ animation: "waPanelIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
            <div className="rounded-[calc(2rem-0.375rem)] overflow-hidden bg-[#131B15] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              {/* Header */}
              <div className="relative px-5 pt-5 pb-4 border-b border-white/8 bg-[#090D0A]/60">
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors duration-200 cursor-pointer"
                  aria-label="Tutup Panel Chat"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full ring-2 ring-[#D49A3D]/60 ring-offset-2 ring-offset-[#090D0A] bg-gradient-to-br from-[#1C261E] to-[#090D0A] flex items-center justify-center">
                      <span className="font-serif text-base font-bold text-[#D49A3D] leading-none">G</span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090D0A]" />
                  </div>

                  <div>
                    <p className="text-white font-serif text-sm font-semibold leading-tight">
                      Official Marketing GDC
                    </p>
                    <p className="text-[#D49A3D] text-[10px] tracking-[0.2em] uppercase font-sans mt-0.5 font-bold">
                      Grand Duta City SOJ
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-white/50 text-[9px] font-sans">Online sekarang</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Bubble */}
              <div className="px-5 py-4">
                <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-none px-4 py-3.5 shadow-sm">
                  <p className="text-[#F8F6F0]/85 text-xs leading-relaxed font-normal">
                    Halo! Selamat datang di <span className="text-[#F5A524] font-semibold">Grand Duta City South of Jakarta</span>.
                    <br /><br />
                    Butuh simulasi KPR atau info promo tanpa DP bulan ini? Tim kami siap membantu secara instan.
                  </p>
                  <p className="text-white/25 text-[9px] text-right mt-2 font-sans font-medium">Layanan In-House Marketing</p>
                </div>
              </div>

              {/* Action */}
              <div className="px-5 pb-5">
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#20BD5A] text-[#090D0A] font-sans font-bold text-xs tracking-[0.16em] uppercase py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-[#25D366]/30 active:scale-[0.98]"
                >
                  <span>Mulai Konsultasi</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={toggleOpen}
        aria-label="Chat WhatsApp Official"
        className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.45)] flex items-center justify-center border border-white/20 cursor-pointer bg-[#25D366] hover:bg-[#20BD5A] hover:scale-105 active:scale-95 transition-[background-color,transform] duration-200 ${!open ? "animate-float-soft" : ""}`}
      >
        {!open && hasNotification && (
          <div className="absolute -top-1 -right-1 z-[60] flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-400 border-2 border-[#090D0A] items-center justify-center text-[10px] font-bold text-[#090D0A] shadow-sm">
              1
            </span>
          </div>
        )}

        <div className="flex items-center justify-center text-white transition-transform duration-200" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <svg className="w-7 h-7 sm:w-8 sm:h-8 fill-current text-white" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.205 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.002 3.66 3.745-.993zm10.749-6.422c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.227 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}
