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
 * PEMBARUAN DATA PEMILIK (30 Agustus 2026) — Verona 39 dan Frontera 89:
 *   Pemilik mengirim spesifikasi lengkap kedua tipe beserta render fasad
 *   masing-masing. Konsekuensinya:
 *     - Verona 39 turun harga tampil dari "700 Juta-an" ke "600 Juta-an".
 *       Ini MENGUBAH harga terendah proyek, sehingga klaim "mulai Rp 700
 *       jutaan" yang tersebar di meta description, FAQ, `priceRange` schema,
 *       dan llms.txt ikut dikoreksi ke 600. Lihat catatan di masing-masing
 *       berkas.
 *     - Frontera 89 TIDAK lagi "coming-soon": ia punya harga (1,6 Milyar-an)
 *       dan spesifikasi penuh, jadi statusnya jadi `check-siteplan` dan
 *       halaman /tipe-rumah/frontera-89 dibuka dari noindex.
 *     - Keduanya kini `showInCatalog: true` atas permintaan pemilik, dan
 *       keduanya berhenti memakai render tipe lain sebagai placeholder.
 *
 * PEMBARUAN DENAH (30 Agustus 2026): pemilik mengirim floor plan resmi untuk
 * keempat tipe Ladera (Verona, Malta, Tuscan, Frontera). URL denah Malta dan
 * Tuscan yang LAMA (denah-lantai-tipe-*-cluster-ladera-...) diganti aset baru
 * ini, dan Verona serta Frontera yang tadinya `null` kini terisi.
 *
 * MASIH MENUNGGU DATA PEMILIK (sengaja `null`, JANGAN ditebak):
 *   - `bedrooms`/`bathrooms`/`carports`/`floors` untuk T-62.
 *   - `floorPlanImage` untuk Keila 47 dan T-62.
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
  /**
   * true bila denah punya kamar mandi pembantu terpisah ("3+1"), analog
   * `extraRoom`. Dipisah dari `bathrooms` dan BUKAN dijadikan `bathrooms: 4`
   * karena structured data (`numberOfBathroomsTotal`) sebaiknya menghitung
   * kamar mandi utama; "+1" adalah kamar mandi servis, bukan fasilitas yang
   * setara. Konvensi ini sama dengan yang sudah dipakai `extraRoom` pada Malta.
   */
  extraBathroom: boolean;
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

/**
 * Spesifikasi yang berlaku SERAGAM untuk seluruh tipe rumah tapak.
 *
 * Pemilik mengirim "Listrik 2200 VA" dan "Legalitas SHM" sebagai bagian dari
 * detail keempat tipe Ladera, dan nilainya identik di keempatnya (juga cocok
 * dengan Product Knowledge yang menyebut PLN 2.200 VA untuk kawasan). Karena
 * itu ia disimpan sebagai konstanta project-wide, BUKAN field per unit:
 * menyalin nilai yang sama ke 10 record hanya menciptakan 10 tempat yang bisa
 * menyimpang, dan menampilkannya berulang di tiap kartu justru mengencerkan
 * pembeda antar tipe.
 */
export const PROJECT_ELECTRICAL = "2200 VA";
export const PROJECT_LEGALITY = "SHM";

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
    // Dikonfirmasi pemilik 30 Agustus 2026: 2 KT, 1 KM, 1 carport.
    bedrooms: 2,
    extraRoom: false,
    bathrooms: 1,
    extraBathroom: false,
    carports: 1,
    floors: 1,
        isHook: false,
        status: "check-siteplan",
    // Dikoreksi pemilik dari "700 Juta-an". Verona kini HARGA TERENDAH proyek,
    // jadi angka ini yang dirujuk klaim "mulai Rp 600 jutaan" di seluruh situs.
    priceLabel: "600 Juta-an",
    // Render fasad Verona sendiri. Sebelumnya memakai render Aira sebagai
    // placeholder — placeholder itu kini HILANG, bukan cuma tertimpa.
    facadeImage: `${CLOUDINARY}/v1788194325/Tipe_Verona_39_60.webp`,
    floorPlanImage: `${CLOUDINARY}/v1788198743/Floor_Plan_Tipe_Verona_Grand_Duta_City_Bogor_1.webp`,
    description:
      "Tipe kompak satu lantai di Cluster Ladera dengan 2 kamar tidur, pilihan paling terjangkau untuk keluarga muda yang ingin masuk kawasan lebih awal.",
    showInCatalog: true,
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
    extraBathroom: false,
    carports: 2,
    floors: 1,
        isHook: false,
        status: "check-siteplan",
    // Dikonfirmasi pemilik: mewakili Tunai Keras terendah Rp 845.550.000.
    priceLabel: "800 Juta-an",
    // Render fasad diperbarui pemilik 30 Agustus 2026 (aset bernama per tipe).
    facadeImage: `${CLOUDINARY}/v1788194325/Tipe_Malta_47_72.webp`,
    // Denah resmi baru dari pemilik (30 Agustus 2026).
    floorPlanImage: `${CLOUDINARY}/v1788198743/Floor_Plan_Tipe_Malta_Grand_Duta_City_Parung_Bogor.webp`,
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
    extraBathroom: false,
    carports: 2,
    floors: 2,
        isHook: false,
        status: "check-siteplan",
    priceLabel: "1.1 Milyar-an",
    // Render fasad diperbarui pemilik 30 Agustus 2026 (aset bernama per tipe).
    facadeImage: `${CLOUDINARY}/v1788194324/Tipe_Tuscan_66_72.webp`,
    // Denah resmi baru dari pemilik (30 Agustus 2026).
    floorPlanImage: `${CLOUDINARY}/v1788198744/Floor_Plan_Tipe_Tuscan_Grand_Duta_City_South_of_Jakarta.webp`,
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
    // Dikonfirmasi pemilik 30 Agustus 2026: 4+1 KT, 3+1 KM, 2 carport.
    bedrooms: 4,
    extraRoom: true,
    bathrooms: 3,
    extraBathroom: true,
    carports: 2,
    floors: 2,
    // TIDAK lagi "coming-soon": pemilik sudah merilis harga dan spesifikasi
    // penuh, jadi ketersediaannya kembali ke aturan umum — rujuk siteplan.
        isHook: false,
        status: "check-siteplan",
    priceLabel: "1.6 Milyar-an",
    // Render fasad Frontera sendiri. Sebelumnya memakai render Tuscan sebagai
    // placeholder — placeholder itu kini HILANG.
    facadeImage: `${CLOUDINARY}/v1788194324/Type_Frontera_89_90.webp`,
    floorPlanImage: `${CLOUDINARY}/v1788198744/Floor_Plan_Tipe_Frontera_Grand_Duta_City_South_of_Jakarta.webp`,
    description:
      "Tipe terbesar di Cluster Ladera, 2 lantai dengan 4+1 kamar tidur dan 3+1 kamar mandi untuk keluarga besar yang butuh ruang tumbuh maksimal.",
    showInCatalog: true,
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
    extraBathroom: false,
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
    extraBathroom: false,
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
    extraBathroom: false,
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
    extraBathroom: false,
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
    extraBathroom: false,
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
    extraBathroom: false,
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
 * Alt gambar fasad. SATU tempat, karena foto yang sama tampil di kartu beranda
 * dan grid halaman cluster — dua alt berbeda untuk gambar yang sama adalah
 * sinyal yang membingungkan sekaligus pekerjaan ganda saat datanya berubah.
 *
 * Isinya menggambarkan apa yang BENAR-BENAR terlihat (fasad, jumlah lantai)
 * ditambah identitas unit, bukan tumpukan kata kunci. Kode ukuran ikut masuk
 * karena "tipe tuscan 66" memang bentuk yang diketik orang saat mencari, dan ia
 * sekaligus membuat setiap alt berbeda satu sama lain.
 */
export const unitFacadeAlt = (unit: Unit): string => {
  const floorBit = unit.floors !== null ? ` ${unit.floors} lantai` : "";
  return `Fasad rumah Tipe ${unitDisplayName(unit)} ${unitSizeLabel(unit)}${floorBit} di ${CLUSTER_LABEL[unit.cluster]} Grand Duta City Parung`;
};

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

/**
 * Empat tipe yang WAJIB tampil lebih dulu di kartu katalog, atas permintaan
 * eksplisit pemilik (30 Agustus 2026).
 *
 * Dinyatakan eksplisit, bukan mengandalkan urutan `units` yang kebetulan sudah
 * benar, karena urutan array itu disusun untuk keterbacaan (dikelompokkan per
 * cluster) dan bukan janji apa pun. Menyusun ulang `units` suatu hari nanti
 * tidak boleh membatalkan keputusan pemasaran secara diam-diam. Dijaga test.
 */
export const CATALOG_LEAD_IDS: readonly string[] = [
  "verona-39",
  "malta-47",
  "tuscan-66",
  "frontera-89",
];

/**
 * Unit yang dirender sebagai kartu katalog, empat tipe unggulan di depan lalu
 * sisanya mengikuti urutan `units`.
 */
export const catalogUnits: readonly Unit[] = units
  .filter((unit) => unit.showInCatalog)
  .slice()
  .sort((a, b) => {
    const rank = (unit: Unit) => {
      const lead = CATALOG_LEAD_IDS.indexOf(unit.id);
      return lead === -1 ? CATALOG_LEAD_IDS.length : lead;
    };
    const delta = rank(a) - rank(b);
    // Selisih 0 berarti keduanya di luar daftar unggulan; kembalikan ke urutan
    // `units` supaya sort-nya stabil dan tidak bergantung implementasi engine.
    return delta !== 0 ? delta : units.indexOf(a) - units.indexOf(b);
  });

/**
 * Rangkuman kamar untuk tampilan, mis. "2+1" atau "3".
 * Mengembalikan "-" bila data resmi belum tersedia — lebih baik jujur kosong
 * daripada menampilkan angka yang ditebak.
 */
export const bedroomLabel = (unit: Unit): string => {
  if (unit.bedrooms === null) return "-";
  return unit.extraRoom ? `${unit.bedrooms}+1` : String(unit.bedrooms);
};

/**
 * Rangkuman kamar mandi untuk tampilan, mis. "3+1" atau "2". Kembar
 * `bedroomLabel`, dipisah karena "+1" kamar mandi (servis) dan "+1" kamar tidur
 * (ruang fleksibel) datang dari field yang berbeda dan bisa muncul sendiri-sendiri:
 * Malta punya ruang ekstra tanpa kamar mandi ekstra, Frontera punya keduanya.
 */
export const bathroomLabel = (unit: Unit): string => {
  if (unit.bathrooms === null) return "-";
  return unit.extraBathroom ? `${unit.bathrooms}+1` : String(unit.bathrooms);
};

/** Deskripsi ringkas untuk structured data dan meta description. */
export const unitSpecSentence = (unit: Unit): string => {
  const parts: string[] = [];
  if (unit.bedrooms !== null) parts.push(`${bedroomLabel(unit)} kamar tidur`);
  if (unit.bathrooms !== null) parts.push(`${bathroomLabel(unit)} kamar mandi`);
  if (unit.floors !== null) parts.push(`${unit.floors} lantai`);
  const spec = parts.length > 0 ? `${parts.join(", ")}. ` : "";
  return `${spec}Luas bangunan ${unit.lb} m2, luas tanah ${unit.lt} m2. ${CLUSTER_LABEL[unit.cluster]} Grand Duta City Parung.`;
};
