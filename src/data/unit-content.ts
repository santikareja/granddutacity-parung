/**
 * ============================================================================
 * KONTEN KAYA HALAMAN TIPE RUMAH — /tipe-rumah/[slug]
 * ============================================================================
 *
 * CARA MELENGKAPI (dibuat supaya mudah diisi belakangan):
 *
 *   1. GALERI FOTO   -> isi `gallery` unit yang bersangkutan.
 *      Selama masih `[]`, halaman OTOMATIS memakai render fasad dari
 *      `units.ts` sebagai gambar tunggal. Begitu Anda menambah entri kedua,
 *      thumbnail dan navigasi galeri muncul sendiri.
 *      Jangan lupa: setiap gambar yang tampil WAJIB terdaftar di
 *      `src/data/images.ts` (kontrak image sitemap). Entri galeri di sini
 *      sudah dibangkitkan ke registry itu secara otomatis.
 *
 *   2. VIDEO         -> isi `video` unit, atau biarkan `null`.
 *      Bila `null`, halaman jatuh ke video CLUSTER (lihat CLUSTER_VIDEO).
 *      Bila cluster juga belum punya video, seksi video tidak dirender sama
 *      sekali — TIDAK menampilkan pemutar kosong ke calon pembeli.
 *      Menerima URL mp4 Cloudinary maupun URL YouTube.
 *
 *   3. DENAH         -> BUKAN di sini. Denah ada di `units.ts`
 *      (`floorPlanImage`) karena ia dipakai juga oleh schema dan halaman
 *      cluster. Satu tempat saja.
 *
 *   4. DESKRIPSI     -> `overview` (paragraf panjang), `highlights`
 *      (keunggulan tipe), `suitedFor` (cocok untuk siapa).
 *      Bila `overview` `[]`, halaman memakai `unit.description` dari
 *      `units.ts` sebagai paragraf tunggal.
 *
 *   5. FASILITAS / AKSES / SITEPLAN -> project-wide, di bagian bawah berkas
 *      ini. TIDAK per unit, dan itu keputusan sadar (baca catatan SEO).
 *
 * ----------------------------------------------------------------------------
 * CATATAN SEO YANG PENTING — kenapa fasilitas & akses hanya RINGKASAN
 * ----------------------------------------------------------------------------
 * Fasilitas kawasan dan aksesibilitas identik untuk kesepuluh tipe. Menyalin
 * blok panjang yang sama ke 10 halaman akan:
 *   - membuat kesepuluh halaman saling mirip (pola doorway page), dan
 *   - berebut dengan halaman yang MEMANG memiliki query itu, terutama
 *     `/lokasi-akses-gdc-parung` yang sudah memegang klaster
 *     pencarian lokasi/akses, serta `/galeri` dan
 *     `/update-stok-siteplan-grand-duta-city-parung`.
 *
 * Karena itu halaman tipe hanya menampilkan RINGKASAN pendek plus tautan ke
 * halaman pemiliknya. Yang membuat tiap halaman tipe unik tetap datanya
 * sendiri: spesifikasi, harga, denah, galeri, dan tabel banding terhadap
 * tetangga cluster yang berbeda-beda.
 *
 * SITEPLAN sengaja diambil PER CLUSTER, bukan satu gambar untuk semua: Ladera
 * dan Cascada punya siteplan berbeda, jadi ia menambah pembeda alih-alih
 * duplikasi.
 * ============================================================================
 */

import type { ClusterKey, Unit } from "@/data/units";

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

export type UnitGalleryImage = {
  url: string;
  /** Alt deskriptif. WAJIB diisi — jangan kosongkan demi SEO & pembaca layar. */
  alt: string;
  caption?: string;
};

export type UnitVideo = {
  /** URL mp4 Cloudinary ATAU URL YouTube (watch / youtu.be / embed). */
  url: string;
  /** Gambar poster. `null` = pakai render fasad unit. */
  poster: string | null;
  title: string;
};

export type UnitContent = {
  /** Paragraf deskripsi. `[]` = pakai `unit.description`. */
  overview: readonly string[];
  /** Keunggulan khas TIPE ini (bukan kawasan). Sumber keunikan halaman. */
  highlights: readonly string[];
  /** Profil pembeli yang paling cocok. Membantu konversi. */
  suitedFor: readonly string[];
  /** Galeri foto. `[]` = fallback ke render fasad. */
  gallery: readonly UnitGalleryImage[];
  /** `null` = fallback ke video cluster, atau seksi disembunyikan. */
  video: UnitVideo | null;
};

const EMPTY: UnitContent = {
  overview: [],
  highlights: [],
  suitedFor: [],
  gallery: [],
  video: null,
};

// ---------------------------------------------------------------------------
// Konten per unit
// ---------------------------------------------------------------------------
//
// Semua angka di `overview`/`highlights` HARUS cocok dengan `src/data/units.ts`.
// Jangan menuliskan fasilitas atau klaim yang tidak ada dokumennya.

export const unitContent: Record<string, UnitContent> = {
  // ── CLUSTER LADERA ──────────────────────────────────────────────────────
  "verona-39": {
    overview: [
      "Verona adalah tipe paling terjangkau di Cluster Ladera dan sekaligus titik masuk termurah ke kawasan Grand Duta City. Dengan luas bangunan 39 m² di atas kavling 60 m², tipe ini dirancang satu lantai penuh sehingga seluruh ruang terpakai tanpa tangga yang memakan area.",
      "Dua kamar tidur, satu kamar mandi, dan satu carport membuatnya pas untuk pasangan muda atau keluarga kecil yang ingin memiliki rumah di kawasan berkembang lebih awal, ketika harga masih di kisaran 600 juta-an.",
    ],
    highlights: [
      "Harga masuk terendah di seluruh kawasan",
      "Satu lantai — tanpa tangga, ramah anak dan orang tua",
      "Fasad American Classic sama dengan tipe Ladera yang lebih besar",
    ],
    suitedFor: [
      "Pasangan muda yang membeli rumah pertama",
      "Pembeli yang mengejar harga masuk terendah di kawasan",
      "Investor yang menargetkan unit paling likuid untuk disewakan",
    ],
    gallery: [],
    video: null,
  },

  "malta-47": {
    overview: [
      "Malta menaikkan luas bangunan ke 47 m² di atas kavling 72 m² sambil tetap bertahan satu lantai. Nilai jual utamanya adalah ekstra ruang fleksibel di samping dua kamar tidur utama — bisa dipakai sebagai kamar anak, ruang kerja, atau gudang.",
      "Carport-nya menampung dua mobil, jauh lebih lega dibanding tipe di bawahnya, sehingga cocok untuk keluarga yang sudah punya lebih dari satu kendaraan namun belum membutuhkan rumah dua lantai.",
    ],
    highlights: [
      "Ekstra ruang fleksibel (2+1) tanpa naik ke dua lantai",
      "Carport 2 mobil di kavling 72 m²",
      "Denah satu lantai dengan plafon tinggi",
    ],
    suitedFor: [
      "Keluarga muda dengan satu hingga dua anak",
      "Pembeli yang butuh ruang kerja dari rumah",
      "Pemilik dua kendaraan yang tetap ingin rumah satu lantai",
    ],
    gallery: [],
    video: null,
  },

  "tuscan-66": {
    overview: [
      "Tuscan adalah tipe terfavorit di Cluster Ladera. Luas bangunan 66 m² tersusun dalam dua lantai di atas kavling 72 m², menghasilkan ruang keluarga yang jauh lebih lega dibanding tipe satu lantai dengan kavling serupa.",
      "Tiga kamar tidur dan dua kamar mandi memisahkan area orang tua dan anak secara wajar, sementara fasad American Classic dua lantai memberi tampilan paling menonjol di antara tipe Ladera.",
    ],
    highlights: [
      "Tiga kamar tidur dengan dua kamar mandi",
      "Dua lantai — ruang keluarga terpisah dari area privat",
      "Tersedia varian kavling hook dengan tanah lebih luas",
    ],
    suitedFor: [
      "Keluarga dengan dua anak atau lebih",
      "Pembeli yang mengutamakan ruang keluarga luas",
      "Keluarga yang menginginkan kamar tamu terpisah",
    ],
    gallery: [],
    video: null,
  },

  "frontera-89": {
    overview: [
      "Frontera adalah tipe terbesar di Cluster Ladera: luas bangunan 89 m² di atas kavling 90 m², tersusun dua lantai dengan balkon. Ini satu-satunya tipe Ladera yang menyediakan empat kamar tidur plus satu ruang tambahan.",
      "Konfigurasi kamar mandinya 3+1, termasuk kamar mandi servis terpisah. Kombinasi ini menjadikannya pilihan untuk keluarga besar atau keluarga yang tinggal bersama orang tua dan asisten rumah tangga.",
    ],
    highlights: [
      "Empat kamar tidur plus satu ruang tambahan",
      "Kamar mandi 3+1 dengan kamar mandi servis terpisah",
      "Kavling terluas di Cluster Ladera (90 m²) dengan balkon",
    ],
    suitedFor: [
      "Keluarga besar dengan tiga anak atau lebih",
      "Keluarga multigenerasi yang tinggal bersama orang tua",
      "Pembeli yang membutuhkan area servis terpisah",
    ],
    gallery: [],
    video: null,
  },

  // ── CLUSTER CASCADA ─────────────────────────────────────────────────────
  "aira-42": {
    overview: [
      "Aira+ adalah tipe kompak di Cluster Cascada dengan luas bangunan 42 m² di atas kavling 60 m². Berbeda dari Ladera yang bertema American Classic, Cascada mengusung Modern Tropical yang memaksimalkan pencahayaan dan sirkulasi udara alami.",
      "Satu lantai dengan dua kamar tidur dan satu kamar mandi, dirancang agar setiap meter persegi terpakai efektif tanpa terasa sempit.",
    ],
    highlights: [
      "Desain tropis minimalis dengan sirkulasi udara alami",
      "Satu lantai, dua kamar tidur",
      "Tipe kompak dengan nilai sewa yang kompetitif",
    ],
    suitedFor: [
      "Pasangan muda dan keluarga kecil",
      "Pembeli yang menyukai desain tropis modern",
      "Investor unit sewa jangka panjang",
    ],
    gallery: [],
    video: null,
  },

  "keila-47": {
    overview: [
      "Keila menawarkan luas bangunan 47 m² di atas kavling 72 m² dengan ekstra ruang fleksibel (2+1) dalam satu lantai. Tipe ini sudah terjual habis.",
      "Halaman ini dipertahankan sebagai referensi spesifikasi. Bila Anda mencari konfigurasi serupa, Malta 47/72 di Cluster Ladera memiliki luas dan jumlah ruang yang sama.",
    ],
    highlights: [
      "Ekstra ruang fleksibel dalam denah satu lantai",
      "Kavling 72 m² bertema Modern Tropical",
      "Sudah terjual habis — tersedia alternatif dengan ukuran sama",
    ],
    suitedFor: [
      "Referensi spesifikasi bagi pencari tipe 47",
      "Pembeli yang ingin membandingkan dengan Malta 47/72",
    ],
    gallery: [],
    video: null,
  },

  "manoa-58": {
    overview: [
      "Manoa mengangkat konsep resort modern di Cluster Cascada. Luas bangunan 58 m² tersusun dua lantai di atas kavling 60 m², sehingga area terbuka tetap ada meski kavlingnya tidak lebar.",
      "Dua kamar tidur dengan dua kamar mandi memberi kenyamanan setara tipe yang lebih besar, dan high ceiling-nya membuat ruang terasa lebih lapang dari angka di atas kertas.",
    ],
    highlights: [
      "High ceiling yang membuat ruang terasa lebih lapang",
      "Dua kamar mandi untuk dua kamar tidur",
      "Dua lantai di kavling 60 m² — area terbuka tetap terjaga",
    ],
    suitedFor: [
      "Keluarga kecil yang mengutamakan privasi antar lantai",
      "Pembeli yang menyukai konsep resort modern",
      "Pasangan yang bekerja dari rumah",
    ],
    gallery: [],
    video: null,
  },

  "t-62": {
    overview: [
      "T-62 adalah satu-satunya unit hook di Cluster Cascada. Luas tanahnya 112,8 m², jauh di atas tipe lain di cluster yang sama, dengan dua sisi terbuka yang memberi pencahayaan dan sirkulasi udara lebih baik.",
      "Luas bangunannya 62 m². Jumlah kamar dan lantai belum dikonfirmasi pada dokumen resmi yang kami pegang, jadi angka tersebut sengaja tidak dicantumkan — hubungi marketing untuk denah terbaru.",
    ],
    highlights: [
      "Satu-satunya unit hook di Cluster Cascada",
      "Luas tanah 112,8 m², terluas di clusternya",
      "Dua sisi terbuka untuk cahaya dan udara",
    ],
    suitedFor: [
      "Pembeli yang mencari kavling sudut dengan tanah lebih luas",
      "Keluarga yang ingin ruang pengembangan ke samping",
    ],
    gallery: [],
    video: null,
  },

  "victoria-69": {
    overview: [
      "Victoria menyeimbangkan estetika dan fungsi dengan luas bangunan 69 m² dua lantai di atas kavling 72 m². Tiga kamar tidur dan dua kamar mandi menjadikannya tipe keluarga yang paling proporsional di Cluster Cascada.",
      "Carport dua mobil dan pembagian lantai yang jelas antara area bersama dan area privat membuatnya nyaman untuk keluarga yang masih bertumbuh.",
    ],
    highlights: [
      "Tiga kamar tidur, dua kamar mandi, dua lantai",
      "Carport 2 mobil",
      "Proporsi bangunan dan tanah yang seimbang",
    ],
    suitedFor: [
      "Keluarga dengan dua anak yang masih bertumbuh",
      "Pembeli yang butuh carport dua mobil di Cascada",
      "Keluarga yang menginginkan ruang tamu terpisah",
    ],
    gallery: [],
    video: null,
  },

  "alexandra-88": {
    overview: [
      "Alexandra adalah tipe termewah di Cluster Cascada dengan luas bangunan 88 m² di atas kavling 105 m² — tanah terluas di antara tipe standar Cascada. Dua lantai dengan tiga kamar tidur dan dua kamar mandi.",
      "Sisa lahan yang lebih besar memberi ruang untuk taman atau perluasan di kemudian hari, sesuatu yang tidak dimiliki tipe lain di cluster ini.",
    ],
    highlights: [
      "Kavling 105 m², terluas di antara tipe standar Cascada",
      "Sisa lahan lega untuk taman atau perluasan",
      "Tiga kamar tidur dua lantai bertema Modern Tropical",
    ],
    suitedFor: [
      "Keluarga mapan yang mengutamakan luas tanah",
      "Pembeli yang berencana memperluas bangunan",
      "Keluarga yang menginginkan taman pribadi",
    ],
    gallery: [],
    video: null,
  },
};

/** Konten unit dengan fallback aman. Unit yang belum terdaftar tidak error. */
export const getUnitContent = (unitId: string): UnitContent =>
  unitContent[unitId] ?? EMPTY;

// ---------------------------------------------------------------------------
// Project-wide: siteplan, video cluster, ringkasan akses
// ---------------------------------------------------------------------------

/** Siteplan per cluster — berbeda antar cluster, jadi ikut jadi pembeda. */
export const CLUSTER_SITEPLAN: Record<ClusterKey, { url: string; alt: string }> = {
  ladera: {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763617/0047-1-1024x576_z9e3f1.webp",
    alt: "Siteplan Cluster Ladera Grand Duta City Parung",
  },
  cascada: {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818893/Cascada_Update_Stock_9_Maret_2026-1_vcrnzw.webp",
    alt: "Siteplan Cluster Cascada Grand Duta City Parung",
  },
};

/**
 * Video per cluster, dipakai bila unit belum punya video sendiri.
 * Cascada masih `null` — begitu asetnya ada, cukup isi di sini dan kelima
 * halaman tipe Cascada langsung menampilkannya.
 */
export const CLUSTER_VIDEO: Record<ClusterKey, UnitVideo | null> = {
  ladera: {
    url: "https://res.cloudinary.com/dzhvfbuks/video/upload/v1775875427/Video_Cluster_Ladera_Grand_Duta_City_South_of_Jakarta_w9kaq3.mp4",
    poster:
      "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671249/Cluster_Ladera_Gate_t1vylp.webp",
    // "GDC Parung", bukan frasa brand utuh: nilai ini dirender sebagai `<h2>`
    // di empat halaman tipe Ladera (lihat tipe-rumah/[slug]/page.tsx), dan
    // heading bermuatan frasa target homepage di halaman lain adalah bentuk
    // kanibalisasi yang sama dengan yang dicabut dari footer sitewide.
    title: "Video Cluster Ladera GDC Parung",
  },
  cascada: null,
};

/** Tema arsitektur per cluster — dipakai di ringkasan halaman tipe. */
export const CLUSTER_THEME: Record<ClusterKey, string> = {
  ladera: "American Classic Modern",
  cascada: "Modern Tropical Resort",
};

/**
 * RINGKASAN aksesibilitas — sengaja pendek.
 *
 * Uraian lengkap (peta, jarak per exit tol, rute alternatif) ADALAH milik
 * `/lokasi-akses-gdc-parung`. Empat butir di bawah cuma memberi
 * konteks secukupnya lalu mengarahkan ke sana, supaya 10 halaman tipe tidak
 * berebut query lokasi dengan halaman itu.
 */
export const ACCESS_SUMMARY: readonly { label: string; value: string }[] = [
  { label: "CBD Jakarta Selatan", value: "20 menit via tol" },
  { label: "Exit tol terdekat", value: "Kurang dari 15 menit" },
  { label: "Akses tol", value: "Desari, Andara, Pamulang, BORR" },
  { label: "Alamat", value: "Jl. Raya Parung, Jabon Mekar, Bogor" },
];

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Galeri yang benar-benar dirender.
 *
 * Bila `gallery` unit masih kosong, kembalikan SATU gambar fasad supaya
 * halaman tetap terlihat utuh — bukan kotak abu-abu bertulisan "placeholder",
 * yang justru merusak kepercayaan calon pembeli. Thumbnail baru muncul saat
 * ada dua gambar atau lebih.
 */
export const resolveUnitGallery = (
  unit: Unit,
  facadeAlt: string,
): readonly UnitGalleryImage[] => {
  const content = getUnitContent(unit.id);
  if (content.gallery.length > 0) return content.gallery;
  return [{ url: unit.facadeImage, alt: facadeAlt }];
};

/** Video unit, lalu video cluster, lalu tidak ada. */
export const resolveUnitVideo = (unit: Unit): UnitVideo | null =>
  getUnitContent(unit.id).video ?? CLUSTER_VIDEO[unit.cluster];

/** Paragraf deskripsi; jatuh ke `unit.description` bila belum diisi. */
export const resolveUnitOverview = (unit: Unit): readonly string[] => {
  const { overview } = getUnitContent(unit.id);
  return overview.length > 0 ? overview : [unit.description];
};

/**
 * Ubah URL YouTube apa pun menjadi URL embed. URL non-YouTube (mp4 Cloudinary)
 * dikembalikan apa adanya, dan pemanggil membedakannya lewat `isYouTube`.
 */
export const isYouTube = (url: string): boolean =>
  /(?:youtube\.com|youtu\.be)/i.test(url);

export const toYouTubeEmbed = (url: string): string => {
  const idMatch =
    url.match(/[?&]v=([\w-]{11})/) ??
    url.match(/youtu\.be\/([\w-]{11})/) ??
    url.match(/\/embed\/([\w-]{11})/);
  const id = idMatch?.[1];
  // Tanpa id yang bisa dikenali, biarkan URL asli — lebih baik gagal terlihat
  // daripada mengarang embed yang salah.
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : url;
};
