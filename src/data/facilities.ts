/**
 * SUMBER TUNGGAL FASILITAS KAWASAN — Fase 5 spec `seo-cannibalization-and-pseo`.
 *
 * Diekstrak dari array lokal di `src/components/sections/fasilitas.tsx` supaya
 * daftar yang sama bisa dipakai DUA konsumen tanpa diduplikasi:
 *   1. kartu fasilitas yang dilihat pengunjung
 *   2. `amenityFeature` pada schema `Place` di homepage
 *
 * Array lama memuat elemen JSX (`icon: <TreePine />`) sehingga tidak bisa
 * diimpor server component tanpa menarik seluruh komponen client. Di sini icon
 * disimpan sebagai KUNCI string; komponen yang merender memetakannya ke JSX.
 */

export type FacilityIconKey =
  | "tree"
  | "waves"
  | "smile"
  | "shield"
  | "coffee"
  | "wifi"
  | "map-pin";

export type Facility = {
  title: string;
  icon: FacilityIconKey;
};

export const facilities: readonly Facility[] = [
  { title: "Area Hijau 80 Ha", icon: "tree" },
  { title: "Cluster Private Pool", icon: "waves" },
  { title: "Children Playground", icon: "smile" },
  { title: "Keamanan 24/7 & CCTV", icon: "shield" },
  { title: "The Beach & Lagoon", icon: "waves" },
  { title: "Pusat Kuliner & FnB", icon: "coffee" },
  { title: "Co-Working Space", icon: "wifi" },
  { title: "Main Boulevard Row 30m", icon: "map-pin" },
];
