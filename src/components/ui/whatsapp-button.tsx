"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, MessageCircle } from "lucide-react";

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
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-[calc(100vw-36px)] sm:w-[330px] max-w-[350px] rounded-[2rem] p-1.5 bg-[#090D0A]/85 backdrop-blur-2xl border border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
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
                  className="group flex items-center justify-center gap-2.5 w-full bg-[#C8521A] hover:bg-[#DE5E1E] text-white font-sans font-bold text-xs tracking-[0.16em] uppercase py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-[#C8521A]/30 active:scale-[0.98]"
                >
                  <span>Mulai Konsultasi</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        onClick={toggleOpen}
        aria-label="Chat WhatsApp Official"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center justify-center border border-white/20 cursor-pointer ${!open ? "animate-float-soft" : ""}`}
        style={{ background: "linear-gradient(135deg, #C8521A 0%, #B45309 100%)" }}
      >
        <AnimatePresence>
          {!open && hasNotification && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 z-[60] flex h-5 w-5"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A524] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-[#F5A524] border-2 border-[#090D0A] items-center justify-center text-[10px] font-bold text-[#090D0A] shadow-sm">
                1
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center text-white">
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-5 h-5 text-white" />
              </motion.span>
            ) : (
              <motion.span
                key="whatsapp"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}
