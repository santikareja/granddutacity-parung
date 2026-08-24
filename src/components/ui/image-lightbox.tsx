"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
}

export function ImageLightbox({ isOpen, onClose, src, alt, title }: ImageLightboxProps) {
  // Portal butuh document — snapshot server false, klien true (tanpa setState-in-effect)
  const mounted = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!mounted) return null;

  return createPortal(
    isOpen ? (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none"
          style={{ animation: "fadeIn 0.2s ease-out both" }}
          onClick={handleBackdropClick}
        >
          <div
            className="relative w-full max-w-5xl h-[70vh] sm:h-[80vh] flex flex-col justify-center"
            style={{ animation: "waPanelIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Desktop Close Button (Top-Right) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup lightbox"
              className="hidden sm:flex absolute -top-12 right-0 md:top-3 md:right-3 z-20 w-10 h-10 bg-white/15 hover:bg-white/25 border border-white/20 hover:border-white/40 rounded-full items-center justify-center text-white transition-all duration-200 cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image Container */}
            <div className="relative w-full h-full bg-black/40 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 85vw"
              />
            </div>

            {/* Title (if provided) */}
            {title && (
              <div
                className="mt-2.5 sm:mt-3 text-center px-4"
                style={{ animation: "heroFadeUp 0.4s ease-out 0.1s both" }}
              >
                <p className="text-white/90 text-xs sm:text-base font-medium drop-shadow-md">{title}</p>
              </div>
            )}

            {/* Mobile Close Button (Bottom-Center below image) */}
            <div className="flex sm:hidden justify-center items-center mt-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup lightbox"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/20 text-white text-xs font-sans font-medium backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      ) : null,
    document.body
  );
}
