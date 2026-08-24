"use client";

import { useEffect } from "react";

/**
 * Loader Google Analytics yang ditunda sampai idle.
 *
 * GoogleAnalytics bawaan @next/third-parties memuat gtag.js (~164 KiB) dengan
 * strategy "afterInteractive", sehingga tetap bersaing dengan LCP di critical
 * path. Komponen ini:
 *  1. Memasang stub window.gtag + dataLayer secara sinkron saat mount, agar
 *     semua event (mis. klik WhatsApp) tetap terkirim — dataLayer akan
 *     direplay otomatis begitu gtag.js selesai dimuat.
 *  2. Menyuntikkan script gtag.js hanya SETELAH event `load` selesai DAN
 *     main-thread idle (fallback timeout), sehingga tidak membebani
 *     LCP/TBT pada load awal.
 */
export function DeferredAnalytics({ gaId }: { gaId: string }) {
  useEffect(() => {
    // 1) Queue API dipasang lebih dulu (tanpa network).
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = (...args) => {
        window.dataLayer.push(args);
      };
    }
    window.gtag("js", new Date());
    window.gtag("config", gaId);

    let cancelled = false;
    let idleHandle = 0;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined = undefined;

    const injectScript = () => {
      if (cancelled) return;
      if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        return;
      }
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(script);
    };

    const scheduleWhenIdle = () => {
      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(injectScript, { timeout: 8000 });
      } else {
        fallbackTimer = setTimeout(injectScript, 2000);
      }
    };

    // 2) Tunggu window load dulu supaya bandwidth & CPU milik konten utama,
    //    lalu jadwalkan injeksi saat thread idle.
    if (document.readyState === "complete") {
      scheduleWhenIdle();
    } else {
      window.addEventListener("load", scheduleWhenIdle, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleWhenIdle);
      if ("cancelIdleCallback" in window && idleHandle) {
        window.cancelIdleCallback(idleHandle);
      }
      if (fallbackTimer) clearTimeout(fallbackTimer);    };
  }, [gaId]);

  return null;
}
