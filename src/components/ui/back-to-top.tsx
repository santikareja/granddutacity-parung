"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useScroll } from "@/components/ui/use-scroll";

export function BackToTop() {
  const visible = useScroll(350);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleClick}
          aria-label="Kembali ke atas"
          className="group fixed bottom-5 left-5 md:bottom-8 md:left-8 z-50 flex flex-col items-center gap-2 cursor-pointer"
        >
          {/* Icon Button — opaque below lg: a position:fixed backdrop-filter has to
              re-blur the content passing underneath it on every scroll frame. */}
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/15 hover:border-[#D49A3D] bg-[#0B120C] lg:bg-[#090D0A]/85 lg:backdrop-blur-xl flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:scale-105 active:scale-95 text-[#F8F6F0]">
            <ArrowUp className="w-4 h-4 text-[#D49A3D] transition-transform duration-300 group-hover:-translate-y-0.5" />
          </div>

          <span
            className="hidden md:block text-[#F8F6F0]/40 group-hover:text-[#D49A3D] text-[8px] tracking-[0.4em] uppercase font-sans font-bold transition-colors duration-300"
          >
            TOP
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
