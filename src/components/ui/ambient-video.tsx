"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";
import { useViewportVideo } from "@/components/ui/use-viewport-video";

interface AmbientVideoProps {
  src: string;
  poster?: string;
  ariaLabel: string;
  title?: string;
  className?: string;
}

/**
 * Muted, looping decorative video that only decodes while it is on screen.
 * Use this instead of a bare `<video autoPlay loop muted>` so offscreen
 * playback cannot compete with scrolling.
 */
export function AmbientVideo({
  src,
  poster,
  ariaLabel,
  title,
  className,
}: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useViewportVideo(videoRef);

  return (
    <video
      ref={videoRef}
      className={cn("w-full h-full object-cover", className)}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={ariaLabel}
      title={title}
      poster={poster}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
