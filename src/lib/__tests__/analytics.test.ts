// @vitest-environment jsdom
/**
 * Test pelacakan konversi WhatsApp — Fase 2 spec `seo-cannibalization-and-pseo`.
 *
 * Butuh environment jsdom karena `trackEvent` memeriksa `window.gtag`;
 * environment default proyek ini `node` (lihat vitest.config.mts).
 *
 * Yang dikunci:
 *   1. `trackEvent` tetap tidak melakukan apa pun bila gtag belum siap
 *      (perilaku existing yang harus dipertahankan).
 *   2. `trackWhatsAppClick` mengirim nama event dan parameter yang benar.
 *   3. `value`/`currency` HANYA disertakan bila harga valid — parameter `value`
 *      GA4 tanpa `currency` tidak dilaporkan sebagai nilai konversi, dan
 *      mengirim value 0/NaN akan mengotori laporan.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { WHATSAPP_EVENT, trackEvent, trackWhatsAppClick } from "@/lib/analytics";

const gtag = vi.fn();

beforeEach(() => {
  gtag.mockReset();
  (window as unknown as { gtag: unknown }).gtag = gtag;
});

describe("trackEvent — perilaku existing dipertahankan", () => {
  it("tidak mengirim apa pun bila nama event kosong", () => {
    trackEvent("");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("tidak melempar error bila gtag belum terpasang", () => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    expect(() => trackEvent("apa_saja")).not.toThrow();
  });

  it("meneruskan nama event dan params ke gtag", () => {
    trackEvent("uji", { a: "b", n: 1 });
    expect(gtag).toHaveBeenCalledWith("event", "uji", { a: "b", n: 1 });
  });
});

describe("trackWhatsAppClick", () => {
  it("mengirim page dan placement sebagai parameter wajib", () => {
    trackWhatsAppClick({ page: "/cluster-ladera", placement: "hero-primary" });

    expect(gtag).toHaveBeenCalledWith("event", WHATSAPP_EVENT, {
      page: "/cluster-ladera",
      placement: "hero-primary",
    });
  });

  it("menyertakan unit bila CTA spesifik unit", () => {
    trackWhatsAppClick({
      page: "/pricelist-grand-duta-city",
      placement: "pricelist-kpr-simulator",
      unit: "Malta 47/72",
    });

    expect(gtag).toHaveBeenCalledWith("event", WHATSAPP_EVENT, {
      page: "/pricelist-grand-duta-city",
      placement: "pricelist-kpr-simulator",
      unit: "Malta 47/72",
    });
  });

  it("menyertakan value BESERTA currency IDR bila harga valid", () => {
    trackWhatsAppClick({
      page: "/",
      placement: "kpr-calculator",
      value: 971_000_000,
    });

    expect(gtag).toHaveBeenCalledWith("event", WHATSAPP_EVENT, {
      page: "/",
      placement: "kpr-calculator",
      value: 971_000_000,
      currency: "IDR",
    });
  });

  it.each([
    ["nol", 0],
    ["negatif", -1],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])("mengabaikan value %s agar laporan GA4 tidak kotor", (_label, value) => {
    trackWhatsAppClick({ page: "/", placement: "hero-primary", value });

    expect(gtag).toHaveBeenCalledWith("event", WHATSAPP_EVENT, {
      page: "/",
      placement: "hero-primary",
    });
  });
});
