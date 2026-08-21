"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

interface InlineVideoCardProps {
  src: string;
  poster: string;
  ariaLabel: string;
  className?: string;
  videoClassName?: string;
}

export function InlineVideoCard({
  src,
  poster,
  ariaLabel,
  className,
  videoClassName,
}: InlineVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Set once the user explicitly pauses, so scrolling back into view does not
  // override that choice.
  const pausedByUserRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let isVisible = false;

    const tryPlay = async () => {
      if (!isVisible || document.hidden || pausedByUserRef.current) {
        return;
      }

      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };

    const suspend = () => {
      video.pause();
      setIsPlaying(false);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        suspend();
        return;
      }
      void tryPlay();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    // Only decode while on screen: an offscreen video still forces a compositor
    // frame per video frame, which competes with scrolling elsewhere on the page.
    if (!("IntersectionObserver" in window)) {
      isVisible = true;
      void tryPlay();

      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting;

          if (isVisible) {
            void tryPlay();
          } else {
            suspend();
          }
        }
      },
      { rootMargin: "15% 0px" },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const togglePlayback = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      pausedByUserRef.current = false;

      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    pausedByUserRef.current = true;
    video.pause();
    setIsPlaying(false);
  };

  return (
    <div
      className={cn(
        "group relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-4",
        className
      )}
    >
      <button
        type="button"
        onClick={togglePlayback}
        className="absolute inset-0 z-10"
        aria-label={isPlaying ? "Pause video" : "Play video"}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_38%)]" />

      <div className="pointer-events-none absolute left-5 top-5 z-20 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70 backdrop-blur-md">
        Video
      </div>

      <video
        ref={videoRef}
        className={cn("relative z-[1] h-auto w-full rounded-[24px] object-contain", videoClassName)}
        muted
        loop
        playsInline
        controls={false}
        preload="metadata"
        poster={poster}
        aria-label={ariaLabel}
      >
        <source src={src} type="video/mp4" />
      </video>

      <button
        type="button"
        onClick={togglePlayback}
        className="absolute bottom-6 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-[0_14px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.04] hover:bg-black/60"
        aria-label={isPlaying ? "Pause video" : "Play video"}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
      </button>
    </div>
  );
}
