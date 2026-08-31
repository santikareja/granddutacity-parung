/**
 * SHIM KOMPATIBILITAS — jangan tambah data di sini.
 *
 * Sebelum Fase 3 spec `seo-cannibalization-and-pseo`, file ini memuat 7 record
 * `propertyTypes` yang ditulis tangan. Ia menjadi salah satu dari TIGA salinan
 * data unit yang saling bertentangan (dua lainnya: array lokal di
 * `tipe-rumah.tsx` dan JSX hardcode di `cluster-ladera/page.tsx`).
 *
 * Sumber tunggal sekarang: `src/data/units.ts`.
 *
 * File ini dipertahankan sementara sebagai turunan agar konsumen lama
 * (`cluster-units.tsx`, `cluster-cascada/page.tsx`) tidak perlu diubah dalam
 * commit yang sama — perubahan besar dalam satu commit menyulitkan rollback
 * bila peringkat bergerak. Setelah seluruh konsumen beralih ke `units.ts`,
 * hapus file ini.
 *
 * Bentuk objek di bawah SENGAJA meniru struktur lama (`specs.bed` bisa string
 * "2+1", `soldOut` boolean, `image`, `desc`) supaya `ProductRevealCard` dan
 * pemakai lain merender persis seperti sebelumnya.
 */

import {
  CLUSTER_LABEL,
  bathroomLabel,
  bedroomLabel,
  catalogUnits,
  unitFacadeAlt,
  unitPagePath,
  unitSizeLabel,
  type Unit,
} from "@/data/units";
import { clImg } from "@/lib/cloudinary";

export type LegacyPropertyType = {
  id: string;
  name: string;
  typeCategory: string;
  cluster: string;
  tag: string;
  price: string;
  soldOut?: boolean;
  image: string;
  /** Alt deskriptif per unit, dipakai langsung sebagai atribut alt gambar. */
  alt: string;
  /** Label ukuran ringkas "47/72", ikut di judul kartu. */
  sizeLabel: string;
  /** Halaman detail tipe. */
  href: string;
  specs: {
    bed: number | string;
    bath: number | string;
    carport: number | string;
    lb: number | string;
    lt: number | string;
  };
  desc: string;
};

const toLegacy = (unit: Unit): LegacyPropertyType => ({
  id: unit.id,
  name: unit.name,
  typeCategory: unit.typeCategory,
  cluster: CLUSTER_LABEL[unit.cluster],
  tag: CLUSTER_LABEL[unit.cluster],
  price: unit.priceLabel,
  // Hanya `sold-out` yang boleh memunculkan badge. `check-siteplan` TIDAK
  // diterjemahkan menjadi "tersedia" — ketersediaan aktual wajib merujuk
  // siteplan terbaru, bukan disimpulkan dari ketiadaan penanda.
  ...(unit.status === "sold-out" ? { soldOut: true } : {}),
  // Sebelumnya URL Cloudinary ASLI dikirim apa adanya ke kartu, jadi halaman
  // cluster mengunduh render ukuran penuh untuk kotak selebar ~380px. Ukurannya
  // diseragamkan dengan carousel beranda: 480x640, yaitu rasio 3:4 yang sama
  // dengan kartunya, sehingga tidak ada piksel yang diunduh lalu dibuang crop.
  image: clImg(unit.facadeImage, { w: 480, h: 640, q: 55 }),
  alt: unitFacadeAlt(unit),
  sizeLabel: unitSizeLabel(unit),
  href: unitPagePath(unit),
  specs: {
    bed: bedroomLabel(unit),
    // bathroomLabel sudah mengembalikan "-" untuk data yang belum ada, jadi
    // `?? "-"` di sini akan mati sia-sia.
    bath: bathroomLabel(unit),
    carport: unit.carports ?? "-",
    lb: unit.lb,
    lt: unit.lt,
  },
  desc: unit.description,
});

export const propertyTypes: LegacyPropertyType[] = catalogUnits.map(toLegacy);
