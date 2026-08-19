"use client";

import { useEffect, useState } from "react";
import type { LenisOptions } from "lenis";
import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";

const baseOptions: LenisOptions = {
  smoothWheel: true,
  gestureOrientation: "vertical",
  overscroll: true,
  autoResize: true,
  anchors: true,
};

const desktopOptions: LenisOptions = {
  ...baseOptions,
  lerp: 0.105,
  syncTouch: false,
  wheelMultiplier: 0.9,
  touchMultiplier: 1,
};

const touchOptions: LenisOptions = {
  ...baseOptions,
  lerp: 0.085,
  syncTouch: true,
  syncTouchLerp: 0.11,
  touchInertiaExponent: 1.45,
  touchMultiplier: 1.12,
  wheelMultiplier: 0.95,
};

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [inputMode, setInputMode] = useState<"desktop" | "touch" | "native">("native");
  const [lenisKey, setLenisKey] = useState(0);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");

    const update = () => {
      if (desktopQuery.matches) {
        setInputMode("desktop");
        return;
      }

      if (touchQuery.matches) {
        setInputMode("touch");
        return;
      }

      setInputMode("native");
    };

    update();
    desktopQuery.addEventListener("change", update);
    touchQuery.addEventListener("change", update);

    return () => {
      desktopQuery.removeEventListener("change", update);
      touchQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    // Ensure no stale scroll-lock state persists across route transitions.
    document.body.style.overflow = "";

    // Force Lenis remount per route to avoid stale internal state on back navigation.
    setLenisKey((prev) => prev + 1);
  }, [pathname]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      document.body.style.overflow = "";
      setLenisKey((prev) => prev + 1);

      // Trigger a resize tick so layout/scroll measurements are recalculated.
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const lenisOptions =
    inputMode === "desktop"
      ? desktopOptions
      : inputMode === "touch"
        ? touchOptions
        : null;

  if (!lenisOptions) {
    return <>{children}</>;
  }

  return (
    <ReactLenis key={`${pathname}-${inputMode}-${lenisKey}`} root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}
