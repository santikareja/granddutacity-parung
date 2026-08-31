"use client";

import { useEffect } from "react";
import { trackWhatsAppClick } from "@/lib/analytics";

/**
 * Pelacak konversi CTA WhatsApp — Fase 2 spec `seo-cannibalization-and-pseo`.
 *
 * MENGAPA event delegation, bukan `onClick` di tiap CTA:
 * Ada 25+ CTA WhatsApp di 16 komponen, dan sebagian besar berada di komponen
 * SERVER (hero, fasilitas, better-living, about, lokasi-scroll, dst). Memasang
 * `onClick` di sana memaksa konversi ke client component — menambah bundle JS,
 * membebani hydration, dan berisiko mengganggu LCP yang sudah dioptimasi susah
 * payah di proyek ini (lihat catatan panjang di hero.tsx dan header-2.tsx).
 *
 * Satu listener di `document` menghapus seluruh biaya itu. Setiap CTA hanya
 * perlu atribut data:
 *   data-wa-placement="hero"        (wajib; fallback "unknown" bila lupa)
 *   data-wa-unit="malta-47-72"      (opsional, untuk CTA spesifik unit)
 *   data-wa-value="971000000"       (opsional, harga IDR sebagai nilai konversi)
 *
 * `capture: true` dipakai supaya event tercatat SEBELUM handler komponen
 * memanggil `window.open` atau sebelum navigasi anchor terjadi. Karena seluruh
 * CTA memakai `target="_blank"`, halaman tidak unload sehingga tidak ada risiko
 * event hilang di tengah pengiriman.
 *
 * Stub `window.gtag` + `dataLayer` sudah dipasang sinkron oleh
 * `DeferredAnalytics` saat mount, dan dataLayer direplay begitu gtag.js dimuat.
 * Jadi klik yang terjadi sebelum gtag.js siap tetap terkirim.
 */
export function WhatsAppTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Anchor wa.me, ATAU elemen apa pun yang sengaja ditandai. Penandaan
      // eksplisit diperlukan untuk CTA berbasis <button> yang memanggil
      // window.open (tipe-rumah, cluster-units, kalkulator KPR).
      const trigger = target.closest<HTMLElement>(
        'a[href*="wa.me"], [data-wa-placement]',
      );
      if (!trigger) return;

      // Elemen bertanda data-wa-placement yang BUKAN CTA WhatsApp tidak ada di
      // codebase ini, tapi jaga-jaga: hanya lacak bila ia anchor wa.me atau
      // memang ditandai sebagai pemicu WhatsApp.
      const href = trigger.getAttribute("href") ?? "";
      const isWhatsApp =
        href.includes("wa.me") || trigger.hasAttribute("data-wa-placement");
      if (!isWhatsApp) return;

      const rawValue = trigger.dataset.waValue;
      const parsedValue = rawValue ? Number(rawValue) : undefined;

      trackWhatsAppClick({
        page: window.location.pathname,
        placement: trigger.dataset.waPlacement ?? "unknown",
        unit: trigger.dataset.waUnit,
        value:
          typeof parsedValue === "number" && Number.isFinite(parsedValue)
            ? parsedValue
            : undefined,
      });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}
