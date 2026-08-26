"use client";

import { useMemo, useState } from "react";

type SmartImageProps = {
  src?: string | null;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
};

const DEFAULT_FALLBACK = "/marketing-agent.png";

export function SmartImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  className,
  width,
  height,
}: SmartImageProps) {
  const normalizedSrc = useMemo(() => src || fallbackSrc, [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- butuh fallback onError ke placeholder lokal saat src CMS gagal load; next/image tidak menyediakan pola ini dengan sederhana
    <img
      alt={alt}
      className={className}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      src={currentSrc}
      width={width}
    />
  );
}