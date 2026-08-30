/**
 * SUMBER TUNGGAL BANK MITRA KPR — Fase 3 spec `seo-cannibalization-and-pseo`.
 *
 * Audit menemukan klaim jumlah bank yang saling bertentangan di 8 tempat:
 *   - `bankLogos` di bank-slider.tsx memuat 5 logo (Mandiri, BSI, BRI, BTN, OCBC NISP)
 *   - copy di 5 komponen menulis "8 Bank Mitra"
 *   - FAQ homepage menyebut "BCA, Mandiri, BTN, BRI, BNI, dll" — BCA dan BNI
 *     tidak ada di slider, sementara BSI dan OCBC NISP tidak disebut di FAQ
 *
 * Pada halaman yang menyangkut keputusan finansial, angka yang bisa dibantah
 * pembaca adalah masalah kepercayaan, bukan sekadar ketidakrapian data.
 *
 * Daftar di bawah DIKONFIRMASI PEMILIK: 7 bank.
 *
 * PERLU KONFIRMASI ULANG: entri `bsn`. Pemilik menuliskannya sebagai
 * "BSN (Bank Syariah Nasional)", sementara slider logo yang sudah ada memakai
 * "Bank BSI" dan nama institusi yang lazim di Indonesia adalah Bank Syariah
 * Indonesia (BSI). Nama pemilik dipakai apa adanya di sini dan TIDAK
 * "dibetulkan" sendiri, karena menampilkan nama bank yang salah di halaman
 * publik lebih merugikan daripada menunda. Mohon dipastikan sebelum deploy.
 */

export type BankPartner = {
  /** Slug internal. */
  id: string;
  /** Nama yang ditampilkan. */
  name: string;
  /**
   * URL logo, atau null bila asetnya belum ada. Pemilik akan menyediakan logo
   * baru untuk BCA dan Danamon. Selama null, slider menampilkan nama dalam
   * bentuk chip teks supaya jumlah yang terlihat tetap 7 dan tidak
   * bertentangan dengan copy.
   */
  logo: string | null;
  /** Penyesuaian posisi vertikal/horizontal logo di slider. */
  className?: string;
};

const CLOUDINARY = "https://res.cloudinary.com/dzhvfbuks/image/upload";

export const bankPartners: readonly BankPartner[] = [
  {
    id: "btn",
    name: "Bank BTN",
    logo: `${CLOUDINARY}/v1775665063/logo_bank_btn_1_pmehp1.webp`,
  },
  {
    id: "bca",
    name: "Bank BCA",
    // Menunggu aset dari pemilik.
    logo: null,
  },
  {
    id: "bsn",
    // Lihat catatan di header file: perlu konfirmasi BSN vs BSI.
    name: "Bank BSN",
    logo: `${CLOUDINARY}/v1775665177/logo_bank_bsi_wkyt1u.webp`,
    className: "-translate-y-1.5",
  },
  {
    id: "danamon",
    name: "Bank Danamon",
    // Menunggu aset dari pemilik.
    logo: null,
  },
  {
    id: "ocbc-nisp",
    name: "Bank OCBC NISP",
    logo: `${CLOUDINARY}/v1775665107/logo_bank_ocbp_nisp_bquiz4.webp`,
    className: "-ml-8 sm:-ml-12",
  },
  {
    id: "mandiri",
    name: "Bank Mandiri",
    logo: `${CLOUDINARY}/v1775665175/logo_bank_mandiri_qgjt3s.webp`,
    className: "-translate-y-1.5",
  },
  {
    id: "bri",
    name: "Bank BRI",
    logo: `${CLOUDINARY}/v1775665175/logo_bank_bri_mflp14.webp`,
  },
];

/** Jumlah bank mitra. Dipakai seluruh copy agar tidak ada angka hardcode lagi. */
export const BANK_PARTNER_COUNT = bankPartners.length;

/** Daftar nama untuk kalimat, mis. dipakai di FAQ dan structured data. */
export const bankPartnerNames = bankPartners
  .map((bank) => bank.name.replace(/^Bank /, ""))
  .join(", ");
