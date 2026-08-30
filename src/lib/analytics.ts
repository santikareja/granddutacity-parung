export type AnalyticsEventParams = Record<string, string | number>;

export const trackEvent = (
  eventName: string,
  params?: AnalyticsEventParams
) => {
  if (
    !eventName ||
    typeof window === "undefined" ||
    typeof window.gtag !== "function"
  ) {
    return;
  }

  window.gtag("event", eventName, params);
};

// ---------------------------------------------------------------------------
// Konversi WhatsApp (Fase 2 spec seo-cannibalization-and-pseo)
// ---------------------------------------------------------------------------

/**
 * Nama event GA4 untuk klik CTA WhatsApp.
 *
 * Situs ini punya 25+ CTA WhatsApp di 16 komponen dan SEMUANYA sebelumnya
 * tidak terlacak (`trackEvent` ada di file ini tapi nol pemanggil). Akibatnya
 * target "10 chat per hari" tidak bisa diukur, dan tidak diketahui halaman
 * atau kata kunci mana yang menghasilkan chat. Satu nama event dengan
 * parameter pembeda dipilih alih-alih 25 nama event terpisah supaya laporan
 * GA4 bisa diagregasi sekaligus dipecah per halaman/posisi.
 */
export const WHATSAPP_EVENT = "whatsapp_click";

export type WhatsAppClickContext = {
  /** Path halaman asal klik, mis. "/cluster-ladera". */
  page: string;
  /** Posisi CTA di halaman, mis. "hero", "promo-popup", "kpr-calculator". */
  placement: string;
  /** Slug tipe unit bila CTA spesifik unit, mis. "malta-47-72". */
  unit?: string;
  /** Harga unit dalam IDR bila diketahui — dipakai sebagai nilai konversi GA4. */
  value?: number;
};

/**
 * Kirim event konversi klik WhatsApp.
 *
 * `value` + `currency` disertakan bila harga unit diketahui supaya GA4 dapat
 * melaporkan NILAI konversi, bukan hanya jumlahnya. Ini yang memungkinkan
 * pertanyaan "tipe unit mana yang paling menghasilkan closing" dijawab data.
 */
export const trackWhatsAppClick = ({
  page,
  placement,
  unit,
  value,
}: WhatsAppClickContext) => {
  const params: AnalyticsEventParams = { page, placement };

  if (unit) params.unit = unit;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    params.value = value;
    params.currency = "IDR";
  }

  trackEvent(WHATSAPP_EVENT, params);
};
