"use client";

import { useEffect, type RefObject } from "react";

/**
 * Keeps a muted background/decorative video paused unless it is actually on
 * screen and the tab is visible.
 *
 * A decoding `<video>` pushes a new compositor frame for every one of its
 * frames, even when it is scrolled far out of view. Several of those running at
 * once is enough to starve the scroll on mid-range mobile hardware, which shows
 * up as stutter rather than as a slow page. Gating playback on intersection
 * keeps that cost proportional to what the user can see.
 *
 * `prefers-reduced-motion` disables playback entirely.
 */
export function useViewportVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  { rootMargin = "15% 0px" }: { rootMargin?: string } = {},
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    let isVisible = false;

    const play = () => {
      if (!isVisible || document.hidden) return;
      // Autoplay rejection (e.g. power-saving mode) is expected; the poster stays.
      video.play().catch(() => {});
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      play();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    if (!("IntersectionObserver" in window)) {
      isVisible = true;
      play();
      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting;

          if (isVisible) {
            play();
          } else {
            video.pause();
          }
        }
      },
      { rootMargin },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [videoRef, rootMargin]);
}
