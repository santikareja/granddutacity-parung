"use client";

import { useState, useEffect } from "react";

interface TypewriterProps {
  texts: string[];
  delay?: number;
  className?: string;
}

export function Typewriter({ texts, delay = 1500, className = "" }: TypewriterProps) {
  const [index, setIndex] = useState(0);
  // Mulai dari frasa pertama yang SUDAH LENGKAP (SSR-friendly). Jika diawali
  // string kosong, blok teks tumbuh via JS-timer dan baru selesai ter-paint
  // beberapa detik setelah muat — menjadi elemen LCP terlambat yang merusak
  // skor (terbukti menaikkan LCP simulasi ke ~4.5s). Efek ketik tetap jalan:
  // frasa pertama tampil utama dulu, lalu siklus hapus-ketik berlanjut.
  const [displayText, setDisplayText] = useState(texts[0] ?? "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(100);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleType = () => {
      const currentFullText = texts[index];

      if (!isDeleting) {
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        setSpeed(80); // Speed of typing

        if (displayText.length === currentFullText.length) {
          // Pause at the end of the text
          timer = setTimeout(() => setIsDeleting(true), delay);
          return;
        }
      } else {
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        setSpeed(40); // Faster deleting

        if (displayText.length === 0) {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % texts.length);
          setSpeed(100);
          return;
        }
      }

      timer = setTimeout(handleType, speed);
    };

    timer = setTimeout(handleType, speed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, index, texts, speed, delay]);

  return (
    <div className={`relative h-6 flex items-center justify-center ${className}`}>
      <span className="whitespace-nowrap text-slate-200 font-light md:font-medium tracking-[0.2em] text-[8px] md:text-[10px] uppercase min-h-[1.2rem]">
        {displayText}
        <span className="inline-block w-[1.5px] h-3 bg-slate-200 ml-1 mb-[-1px] animate-cursor-pulse" aria-hidden="true" />
      </span>
    </div>
  );
}
