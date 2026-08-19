"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "./image-lightbox";

interface ClickableSiteplanImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  title?: string;
}

export function ClickableSiteplanImage({
  src,
  alt,
  className = "",
  fill = false,
  priority = false,
  sizes,
  title,
}: ClickableSiteplanImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full h-full relative cursor-zoom-in group select-none"
      >
        <Image
          src={src}
          alt={alt}
          fill={fill}
          priority={priority}
          sizes={sizes}
          className={`${className} transition-transform duration-700 ease-out group-hover:scale-[1.02]`}
        />
        {/* Hover zoom indicator */}
        <div className="absolute bottom-4 left-4 bg-[#0b120c]/80 backdrop-blur-md border border-[#F5F1E8]/10 px-3 py-1.5 rounded-lg text-[10px] text-[#F5F1E8] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A524] animate-pulse"></span>
          Klik untuk memperbesar
        </div>
      </div>

      <ImageLightbox
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        src={src}
        alt={alt}
        title={title || alt}
      />
    </>
  );
}
