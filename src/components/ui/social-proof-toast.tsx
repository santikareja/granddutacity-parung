"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const DISPLAY_DURATION_MS = 4500;
const FIRST_APPEAR_MS = 45_000;
const INTERVAL_MS = 60_000;

const SOCIAL_PROOFS: readonly string[] = [
  "Blok J19 No. 1, Ladera — baru saja dipesan.",
  "Blok H16 No. 1, Cascada — baru saja dipesan.",
  "Blok J19 No. 2, Ladera — baru saja dipesan.",
  "Blok H16 No. 2, Cascada — baru saja dipesan.",
  "Blok J19 No. 3, Ladera — baru saja dipesan.",
  "Blok H16 No. 5, Cascada — baru saja dipesan.",
  "Blok J19 No. 4, Ladera — baru saja dipesan.",
  "Blok H16 No. 10, Cascada — baru saja dipesan.",
  "Blok J19 No. 5, Ladera — baru saja dipesan.",
  "Blok H17 No. 1, Cascada — baru saja dipesan.",
  "Blok J19 No. 18, Ladera — baru saja dipesan.",
  "Blok H17 No. 12, Cascada — baru saja dipesan.",
  "Blok J18 No. 5, Ladera — baru saja dipesan.",
  "Blok H17 No. 15, Cascada — baru saja dipesan.",
  "Blok J18 No. 6, Ladera — baru saja dipesan.",
  "Blok H18 No. 2, Cascada — baru saja dipesan.",
  "Blok J18 No. 7, Ladera — baru saja dipesan.",
  "Blok H18 No. 5, Cascada — baru saja dipesan.",
  "Blok J18 No. 8, Ladera — baru saja dipesan.",
  "Blok H18 No. 8, Cascada — baru saja dipesan.",
  "Blok J17 No. 1, Ladera — baru saja dipesan.",
  "Blok H15 No. 1, Cascada — baru saja dipesan.",
  "Blok J17 No. 2, Ladera — baru saja dipesan.",
  "Blok H15 No. 7, Cascada — baru saja dipesan.",
  "Blok J16 No. 10, Ladera — baru saja dipesan.",
  "Blok H14 No. 1, Cascada — baru saja dipesan.",
  "Blok J16 No. 11, Ladera — baru saja dipesan.",
  "Blok H14 No. 8, Cascada — baru saja dipesan.",
  "Blok J15 No. 18, Ladera — baru saja dipesan.",
  "Blok H12 No. 15, Cascada — baru saja dipesan.",
];

function pickRandomIndex(currentIndex: number): number {
  if (SOCIAL_PROOFS.length === 1) return 0;
  let index = Math.floor(Math.random() * SOCIAL_PROOFS.length);
  while (index === currentIndex) {
    index = Math.floor(Math.random() * SOCIAL_PROOFS.length);
  }
  return index;
}

export function SocialProofToast() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const lastIndexRef = useRef<number>(-1);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const isArticlePath = useMemo(
    () => pathname === "/artikel" || pathname.startsWith("/artikel/"),
    [pathname],
  );

  useEffect(() => {
    const clearTimers = () => {
      if (showTimerRef.current !== null) {
        window.clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };

    const pickRandomMessage = () => {
      const index = pickRandomIndex(lastIndexRef.current);
      return { index, message: SOCIAL_PROOFS[index] };
    };

    const scheduleNext = (delay: number) => {
      showTimerRef.current = window.setTimeout(() => {
        const next = pickRandomMessage();
        lastIndexRef.current = next.index;
        setCurrentMessage(next.message);
        setIsVisible(true);

        hideTimerRef.current = window.setTimeout(() => {
          setIsVisible(false);
          scheduleNext(INTERVAL_MS - DISPLAY_DURATION_MS);
        }, DISPLAY_DURATION_MS);
      }, delay);
    };

    clearTimers();

    if (!isArticlePath) {
      scheduleNext(FIRST_APPEAR_MS);
    }

    return clearTimers;
  }, [isArticlePath]);

  if (isArticlePath) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-[90] flex justify-start sm:bottom-8 sm:left-24 sm:right-auto">
      <AnimatePresence>
        {isVisible && currentMessage ? (
          <motion.aside
            key={currentMessage}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-white/12 bg-[#090D0A]/90 shadow-[0_15px_35px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:max-w-xs p-3.5"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D49A3D]/20 border border-[#D49A3D]/30 flex items-center justify-center shrink-0 text-[#D49A3D]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D49A3D] font-sans">
                  Booking Terverifikasi
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#F8F6F0] font-medium">
                  {currentMessage}
                </p>
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}