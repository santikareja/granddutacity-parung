"use client";

import { useEffect, useState } from "react";
import type { LenisOptions } from "lenis";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Impor dinamis + ssr:false. Sebelumnya `ReactLenis` diimpor statis, sehingga
// bundle Lenis ikut diunduh dan diparse di mobile padahal komponennya tidak
// pernah dirender di sana (lihat guard smoothWheelEnabled di bawah). Dengan
// dynamic(), chunk-nya baru diminta saat komponen benar-benar dirender —
// yaitu hanya di perangkat berpenunjuk presisi (desktop).
// `LenisOptions` tetap impor tipe: dihapus saat kompilasi, nol biaya runtime.
const ReactLenis = dynamic(
  () => import("lenis/react").then((mod) => mod.ReactLenis),
  { ssr: false },
);

// Lenis is intentionally desktop-only.
//
// On touch devices the browser scrolls on the compositor thread with the OS
// momentum curve, which is both cheaper and smoother than re-driving scroll
// from a JS rAF loop. Lenis' `syncTouch` did exactly that: every frame of a
// swipe had to wait on the main thread, so any React render, image decode, or
// video frame turned into a dropped scroll frame (the stutter reported on
// mobile). Native scrolling has no such coupling.
const desktopOptions: LenisOptions = {
  smoothWheel: true,
  gestureOrientation: "vertical",
  overscroll: true,
  autoResize: true,
  anchors: true,
  lerp: 0.105,
  syncTouch: false,
  wheelMultiplier: 0.9,
  touchMultiplier: 1,
};

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [smoothWheelEnabled, setSmoothWheelEnabled] = useState(false);

  useEffect(() => {
    // A fine pointer with hover is the only input mode that benefits from
    // wheel smoothing; everything else (touch, reduced motion) uses native
    // scrolling.
    const desktopQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setSmoothWheelEnabled(desktopQuery.matches && !reducedMotionQuery.matches);
    };

    update();
    desktopQuery.addEventListener("change", update);
    reducedMotionQuery.addEventListener("change", update);

    return () => {
      desktopQuery.removeEventListener("change", update);
      reducedMotionQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    // Ensure no stale scroll-lock state persists across route transitions.
    document.body.style.overflow = "";
  }, [pathname]);

  useEffect(() => {
    if (!smoothWheelEnabled) return;

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      document.body.style.overflow = "";

      // Trigger a resize tick so Lenis re-syncs to the browser-restored scroll position.
      // (Lenis.resize() sets animatedScroll/targetScroll = actualScroll, reading native scrollY.)
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [smoothWheelEnabled]);

  if (!smoothWheelEnabled) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={desktopOptions}>
      {children}
    </ReactLenis>
  );
}
