/**
 * SUMBER TUNGGAL DATA UNIT — Fase 3 spec `seo-cannibalization-and-pseo`.
 *
 * MENGGANTIKAN tiga salinan yang saling bertentangan:
 *   1. `propertyTypes` di src/lib/data.ts        (7 record, katalog bersama)
 *   2. array lokal di src/components/sections/tipe-rumah.tsx (6 record, sudah drift)
 *   3. JSX hardcode per tipe di src/app/(site)/cluster-ladera/page.tsx
 *
 * Nilai di bawah adalah hasil REKONSILIASI YANG DIKONFIRMASI PEMILIK terhadap
 * dokumen resmi Product Knowledge dan Pricelist GDC SOJ. Jangan mengubah angka
 * di sini tanpa rujukan dokumen resmi — tiga salinan tadi lahir justru karena
 * angka diedit di tempat pemakaian, bukan di sumbernya.
 *
 * RIWAYAT KOREKSI (dari dokumen resmi):
 *   - Manoa T-58: 2 kamar tidur + 2 kamar mandi. `tipe-rumah.tsx` sebelumnya
 *     menulis 1 KT dan schema homepage menulis "1 kamar tidur" — keduanya SALAH.
 *   - Malta 47/72: string harga tampil "800 Juta-an", mewakili Harga Jual Tunai
 *     Keras terendah Rp 845.550.000. Halaman Ladera sebelumnya menulis
 *     "Rp 900 Juta-an" — SALAH, karena angka itu justru mendekati harga KPR
 *     (Rp 971.403.600 - Rp 1.021.929.900) sehingga menyesatkan pembaca.
 *   - Jumlah lantai: ditambahkan sebagai field. Sebelumnya hanya tersirat di
 *     prosa `desc` sehingga tidak bisa dipakai schema maupun filter.
 *
 * MASIH MENUNGGU DATA PEMILIK (sengaja `null`, JANGAN ditebak):
 *   - `bedrooms`/`bathrooms`/`carports` untuk Verona 39, Frontera 89, dan T-62.
 *   - `floors` untuk T-62.
 *   - `floorPlanImage` untuk Verona 39, Frontera 89, Keila 47, dan T-62.
 *     (Malta 47 dan Tuscan 66 sudah terisi dari aset yang memang sudah tayang
 *     di /cluster-ladera.)
 *   - `status` per tipe: pemilik menegaskan ketersediaan WAJIB merujuk siteplan
 *     terbaru, bukan hardcode. Karena itu nilai default `"check-siteplan"`
 *     dipakai alih-alih mengarang "tersedia".
 */

/** Cluster tempat unit berada. */
export type ClusterKey = "ladera" | "cascada";

/**
 * Status ketersediaan.
 *
 * `check-siteplan` BUKAN placeholder malas — ia keputusan sadar. Pemilik
 * menegaskan ketersediaan aktual hanya sah bila merujuk visualisasi siteplan
 * terbaru, dan hardcode lama (hanya Keila yang ditandai sold dari 7 unit) jauh
 * dari akurat karena mayoritas jalur utama Cascada sudah SOLD. Mengaku
 * "tersedia" tanpa data adalah klaim yang tidak bisa dipertanggungjawabkan,
 * termasuk di structured data.
 */
export type UnitStatus = "sold-out" | "coming-soon" | "check-siteplan";

export type Unit = {
  /** Dipakai sebagai URL segment di /tipe-rumah/[slug] (Fase 7). */
  id: string;
  /** Nama tipe, mis. "MANOA". */
  name: string;
  /** Kode tipe pada pricelist resmi, mis. "T-58". */
  typeCode: string;
  /** Label tipe untuk tampilan, mis. "Type 58". */
  typeCategory: string;
  cluster: ClusterKey;
  /** Luas bangunan (m2). */
  lb: number;
  /** Luas tanah nominal (m2). Kavling tertentu bisa lebih luas — lihat pricelist. */
  lt: number;
  /** null = belum ada data resmi. */
  bedrooms: number | null;
  /** true bila denah punya ruang ekstra ("2+1"). */
  extraRoom: boolean;
  bathrooms: number | null;
  carports: number | null;
  /** Jumlah lantai menurut denah arsitektur Product Knowledge. */
  floors: number | null;
  /**
   * Kavling hook (sudut). Bukan label pemasaran: unit hook punya luas tanah
   * jauh di atas tipe lain dan dua sisi terbuka, jadi ia karakteristik produk
   * yang nyata. "Rumah hook" juga istilah yang dipakai pembeli saat mencari.
   */
  isHook: boolean;
    status: UnitStatus;
  /** String harga tampil untuk kartu. Mewakili Harga Jual Tunai Keras terendah. */
  priceLabel: string;
  facadeImage: string;
  floorPlanImage: string | null;
  description: string;
  /**
   * false = tipe nyata dan ada di pricelist, tapi TIDAK dirender sebagai kartu
   * katalog. Dipakai agar Fase 7 (halaman /tipe-rumah/[slug]) bisa memakainya
   * tanpa mengubah tampilan halaman existing di Fase 3.
   */
  showInCatalog: boolean;
};

const CLOUDINARY = "https://res.cloudinary.com/dzhvfbuks/image/upload";

export const units: readonly Unit[] = [
  // ── CLUSTER LADERA ────────────────────────────────────────────────────────
  {
    id: "verona-39",
    name: "VERONA",
    typeCode: "T-39",
    typeCategory: "Type 39",
    cluster: "ladera",
    lb: 39,
    lt: 60,
    bedrooms: null,
    extraRoom: false,
    bathrooms: null,
    carports: null,
    floors: 1,
        isHook: false,
        status: "check-siteplan",
    priceLabel: "700 Juta-an",
    facadeImage: `${CLOUDINARY}/v1775577163/Type_Aira_no2g1u.webp`,
    floorPlanImage: null,
    description:
      "Tipe kompak satu lantai di Cluster Ladera, pilihan paling terjangkau untuk keluarga muda yang ingin masuk kawasan lebih awal.",
    // Belum pernah dirender sebagai kartu; hanya ada di pricelist dan halaman stok.
    showInCatalog: false,
  },
  {
    id: "malta-47",
    name: "MALTA",
    typeCode: "T-47",
    typeCategory: "Type 47",
    cluster: "ladera",
    lb: 47,
    lt: 72,
    bedrooms: 2,
    extraRoom: true,
    bathrooms: 1,
    carports: 2,
    floors: 1,
        isHook: false,
        status: "check-siteplan",
    // Dikonfirmasi pemilik: mewakili Tunai Keras terendah Rp 845.550.000.
    priceLabel: "800 Juta-an",
    facadeImage: `${CLOUDINARY}/v1775577152/Type_Malta_tkq7di.webp`,
    // Aset denah ini SUDAH tayang di /cluster-ladera sejak sebelum Fase 3,
    // hanya belum pernah terdaftar di sumber data sehingga tidak bisa dipakai
    // schema. Bukan aset baru.
    floorPlanImage: `${CLOUDINARY}/v1775883012/denah-lantai-tipe-malta-cluster-ladera-grand-duta-city-south-of-jakarta_ru5oze.webp`,
    description:
      "Tipe praktis dengan ekstra ruang fleksibel di Cluster Ladera, sangat ideal untuk keluarga muda yang mengutamakan efisiensi.",
    showInCatalog: true,
  },
  {
    id: "tuscan-66",
    name: "TUSCAN",
    typeCode: "T-66",
    typeCategory: "Type 66",
    cluster: "ladera",
    lb: 66,
    lt: 72,
    bedrooms: 3,
    extraRoom: false,
    bathrooms: 2,
    carports: 2,
    floors: 2,
        isHook: false,
        status: "check-siteplan",
    priceLabel: "1.1 Milyar-an",
    facadeImage: `${CLOUDINARY}/v1775577152/Type_Tuscan_drllpk.webp`,
    // Idem Malta: aset sudah tayang di /cluster-ladera, kini terdaftar.
    floorPlanImage: `${CLOUDINARY}/v1775883012/denah-lantai-tipe-tuscan-cluster-ladera-grand-duta-city-south-of-jakarta_muqubx.webp`,
    description:
      "Tipe hunian 2 lantai elegan di Cluster Ladera, tipe terfavorit dengan ruang keluarga luas bergaya Modern American Classic.",
    showInCatalog: true,
  },
  {
    id: "frontera-89",
    name: "FRONTERA",
    typeCode: "T-89",
    typeCategory: "Type 89",
    cluster: "ladera",
    lb: 89,
    lt: 90,
    bedrooms: null,
    extraRoom: false,
    bathrooms: null,
    carports: null,
    floors: 2,
    // Pricelist resmi menyebut "Segera Hadir" — belum dirilis.
        isHook: false,
        status: "coming-soon",
    priceLabel: "Segera Hadir",
    facadeImage: `${CLOUDINARY}/v1775577152/Type_Tuscan_drllpk.webp`,
    floorPlanImage: null,
    description:
      "Tipe terbesar di Cluster Ladera. Pricelist resmi belum dirilis; hubungi marketing untuk indikasi harga dan jadwal peluncuran.",
    showInCatalog: false,
  },

  // ── CLUSTER CASCADA ───────────────────────────────────────────────────────
  {
    id: "aira-42",
    name: "AIRA+",
    typeCode: "T-42",
    typeCategory: "Type 42",
    cluster: "cascada",
    lb: 42,
    lt: 60,
    bedrooms: 2,
    extraRoom: false,
    bathrooms: 1,
    carports: 1,
    floors: 1,
        isHook: false,
        status: "check-siteplan",
    priceLabel: "800 Juta-an",
    facadeImage: `${CLOUDINARY}/v1775577163/Type_Aira_no2g1u.webp`,
    floorPlanImage: `${CLOUDINARY}/v1775917837/cluster-cascada-tipe-aira_q7et6h.webp`,
    description:
      "Desain tropis minimalis di Cluster Cascada, memaksimalkan pencahayaan dan sirkulasi alami dalam hunian kompak bernilai tinggi.",
    showInCatalog: true,
  },
  {
    id: "keila-47",
    name: "KEILA",
    typeCode: "T-47",
    typeCategory: "Type 47",
    cluster: "cascada",
    lb: 47,
    lt: 72,
    bedrooms: 2,
    extraRoom: true,
    bathrooms: 1,
    carports: 1,
    floors: 1,
        isHook: false,
        status: "sold-out",
    priceLabel: "700 Juta",
    // CATATAN: aset fasad Keila belum ada; sengaja memakai render Aira dengan
    // penanda eksplisit ini, bukan komentar "fallback" yang mudah terlewat.
    facadeImage: `${CLOUDINARY}/v1775577163/Type_Aira_no2g1u.webp`,
    floorPlanImage: null,
    description:
      "Desain inovatif di Cluster Cascada dengan ruang multifungsi yang menyesuaikan gaya hidup keluarga.",
    showInCatalog: true,
  },
  {
    id: "manoa-58",
    name: "MANOA",
    typeCode: "T-58",
    typeCategory: "Type 58",
    cluster: "cascada",
    lb: 58,
    lt: 60,
    // Dikonfirmasi pemilik dari denah resmi: 2 KT + 2 KM, BUKAN 1 KT.
    bedrooms: 2,
    extraRoom: false,
    bathrooms: 2,
    carports: 1,
    floors: 2,
        isHook: false,
        status: "check-siteplan",
    priceLabel: "800 Juta-an",
    facadeImage: `${CLOUDINARY}/v1775577152/Type_Manoa_j8uvcr.webp`,
    floorPlanImage: `${CLOUDINARY}/v1775917835/cluster-cascada-tipe-manoa_xdmt5m.webp`,
    description:
      "Konsep hunian resort modern di Cluster Cascada dengan fokus pada privasi, ruang terbuka menenangkan, dan high ceiling.",
    showInCatalog: true,
  },
  {
    id: "t-62",
    name: "T-62",
    typeCode: "T-62",
    typeCategory: "Type 62",
    cluster: "cascada",
    lb: 62,
    lt: 112.8,
    bedrooms: null,
    extraRoom: false,
    bathrooms: null,
    carports: null,
    floors: null,
        isHook: true,
        status: "check-siteplan",
    priceLabel: "1.3 Milyar-an",
    facadeImage: `${CLOUDINARY}/v1775577152/Type_Manoa_j8uvcr.webp`,
    floorPlanImage: null,
    description:
      "Satu-satunya unit hook di Cluster Cascada, dengan luas tanah 112,8 m2 yang jauh di atas tipe lain.",
    showInCatalog: false,
  },
  {
    id: "victoria-69",
    name: "VICTORIA",
    typeCode: "T-69",
    typeCategory: "Type 69",
    cluster: "cascada",
    lb: 69,
    // CATATAN KONFLIK: pricelist resmi mencatat luas tanah 74 m2 untuk seluruh
    // baris T-69, sementara katalog lama dan copy FAQ memakai "69/72". Nilai
    // nominal 72 DIPERTAHANKAN di sini agar spesifikasi yang dilihat pengunjung
    // tidak berubah atas dasar yang belum dikonfirmasi. Perlu keputusan pemilik.
    lt: 72,
    bedrooms: 3,
    extraRoom: false,
    bathrooms: 2,
    carports: 2,
    floors: 2,
        isHook: false,
        status: "check-siteplan",
    priceLabel: "1.1 Milyar-an",
    facadeImage: `${CLOUDINARY}/v1775577163/Type_Victoria_scolcc.webp`,
    floorPlanImage: `${CLOUDINARY}/v1775917834/cluster-cascada-tipe-victoria_xntjns.webp`,
    description:
      "Perpaduan sempurna antara estetika dan fungsionalitas di Cluster Cascada, menyediakan ruang tumbuh terbaik untuk keluarga.",
    showInCatalog: true,
  },
  {
    id: "alexandra-88",
    name: "ALEXANDRA",
    typeCode: "T-88",
    typeCategory: "Type 88",
    cluster: "cascada",
    lb: 88,
    lt: 105,
    bedrooms: 3,
    extraRoom: false,
    bathrooms: 2,
    carports: 2,
    floors: 2,
        isHook: false,
        status: "check-siteplan",
    priceLabel: "1.4 Milyar-an",
    facadeImage: `${CLOUDINARY}/v1775577152/Type_Alexandra_hhvq3f.webp`,
    floorPlanImage: `${CLOUDINARY}/v1775917838/cluster-cascada-tipe-alexandra_urmnh4.webp`,
    description:
      "Hunian termewah di Cluster Cascada dengan kavling tanah terluas (105 m²), menghadirkan kenyamanan penuh bagi keluarga mapan.",
    showInCatalog: true,
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export const CLUSTER_LABEL: Record<ClusterKey, string> = {
  ladera: "Cluster Ladera",
  cascada: "Cluster Cascada",
};

export const getUnitById = (id: string): Unit | undefined =>
  units.find((unit) => unit.id === id);

/**
 * Path halaman tipe unit. SATU tempat, karena `@id` dan `Offer.url` di
 * `src/lib/schema.ts` sudah memakai pola ini dan sudah tayang di produksi.
 * Mengubah pola di sini WAJIB diikuti route-nya, kalau tidak structured data
 * akan menunjuk URL 404 lagi.
 */
export const unitPagePath = (unit: Unit): string => `/tipe-rumah/${unit.id}`;

/**
 * Nama tipe untuk tampilan. `name` disimpan KAPITAL semua ("VERONA") karena
 * begitulah penulisannya di pricelist resmi, tapi judul halaman yang seluruhnya
 * kapital terbaca seperti berteriak. "AIRA+" dan "T-62" ditangani apa adanya:
 * keduanya bukan kata biasa.
 */
export const unitDisplayName = (unit: Unit): string => {
  if (unit.name === "T-62") return "T-62";
  const [head, ...rest] = unit.name.toLowerCase().split("");
  const titled = head.toUpperCase() + rest.join("");
  return titled.replace(/\+$/, "+");
};

/** Label ukuran ringkas, mis. "58/60". Dipakai di judul dan tabel banding. */
export const unitSizeLabel = (unit: Unit): string => `${unit.lb}/${unit.lt}`;

/**
 * Tipe lain di cluster yang sama, untuk tabel banding di halaman tipe.
 * Inilah sumber keunikan per halaman yang membuat 10 halaman ini BUKAN
 * doorway page: setiap halaman membandingkan dirinya dengan tetangga yang
 * berbeda, dengan angka yang berbeda.
 */
export const getSiblingUnits = (unit: Unit): Unit[] =>
  units.filter((other) => other.cluster === unit.cluster && other.id !== unit.id);

export const getUnitsByCluster = (cluster: ClusterKey): Unit[] =>
  units.filter((unit) => unit.cluster === cluster);

/** Unit yang dirender sebagai kartu katalog. */
export const catalogUnits: readonly Unit[] = units.filter(
  (unit) => unit.showInCatalog,
);

/**
 * Rangkuman kamar untuk tampilan, mis. "2+1" atau "3".
 * Mengembalikan "-" bila data resmi belum tersedia — lebih baik jujur kosong
 * daripada menampilkan angka yang ditebak.
 */
export const bedroomLabel = (unit: Unit): string => {
  if (unit.bedrooms === null) return "-";
  return unit.extraRoom ? `${unit.bedrooms}+1` : String(unit.bedrooms);
};

/** Deskripsi ringkas untuk structured data dan meta description. */
export const unitSpecSentence = (unit: Unit): string => {
  const parts: string[] = [];
  if (unit.bedrooms !== null) parts.push(`${bedroomLabel(unit)} kamar tidur`);
  if (unit.bathrooms !== null) parts.push(`${unit.bathrooms} kamar mandi`);
  if (unit.floors !== null) parts.push(`${unit.floors} lantai`);
  const spec = parts.length > 0 ? `${parts.join(", ")}. ` : "";
  return `${spec}Luas bangunan ${unit.lb} m2, luas tanah ${unit.lt} m2. ${CLUSTER_LABEL[unit.cluster]} Grand Duta City Parung.`;
};
