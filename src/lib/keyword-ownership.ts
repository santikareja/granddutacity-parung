/**
 * PETA KEPEMILIKAN KATA KUNCI — satu query, satu halaman pemilik.
 *
 * Dibuat setelah pemilik menegaskan bahwa kanibalisasi antar halaman harus NOL,
 * bukan sekadar "dikurangi". Audit produksi menemukan 15 dari 51 halaman memuat
 * "grand duta city parung" di title dan 8 di antaranya memuatnya DUA KALI dalam
 * satu title, karena `title.template` di layout menempelkan brand ke hampir
 * setiap halaman. Ketika 15 halaman mengklaim satu nama brand, Google harus
 * memilih mana jawabannya — dan homepage bisa kalah dari halaman sendiri.
 *
 * Berkas ini mengubah pencegahannya dari niat baik menjadi kontrak yang diuji:
 * setiap route indexable WAJIB terdaftar di sini dengan tepat SATU `primary`,
 * dan `seo-invariants.test.ts` gagal bila ada dua route berbagi `primary`,
 * atau ada route baru yang belum terdaftar.
 *
 * BEDA `primary` DAN `supporting`:
 *   - `primary`  = query yang halaman ini HARUS menangi. Eksklusif. Tidak boleh
 *                  dimiliki dua halaman.
 *   - `supporting` = frasa yang wajar muncul di beberapa halaman (mis. "kpr",
 *                  "parung bogor"). Tumpang tindih di sini TIDAK dianggap
 *                  kanibalisasi karena maksud pencariannya berbeda.
 */

/**
 * Kata kunci utama homepage.
 *
 * Pemilik memilih "grand duta city parung" sebagai target UTAMA karena volume
 * pencarian bulanannya jauh lebih tinggi daripada varian "south of jakarta".
 * Konsekuensinya dikunci oleh guard G13: title homepage harus DIBUKA dengan
 * frasa ini, bukan menaruhnya di tengah atau akhir.
 */
export const HOMEPAGE_PRIMARY = "grand duta city parung";

/** Kata kunci kedua homepage. Tetap milik homepage, bobotnya di bawah primary. */
export const HOMEPAGE_SECONDARY = "grand duta city south of jakarta";

/** Kedua frasa di atas tidak boleh jadi `primary` halaman mana pun selain "/". */
export const RESERVED_PHRASES = [HOMEPAGE_PRIMARY, HOMEPAGE_SECONDARY] as const;

/**
 * Modifier yang mengubah MAKSUD query sehingga frasa brand boleh dipakai ulang.
 *
 * "pricelist grand duta city parung" adalah query yang BERBEDA dari
 * "grand duta city parung" — orang yang mencarinya sudah tahu proyeknya dan
 * ingin daftar harga. Halaman itu justru HARUS memenangkannya. Yang dilarang
 * adalah frasa brand berdiri sendiri tanpa modifier, karena itu berhadapan
 * langsung dengan homepage.
 */
export const QUALIFYING_MODIFIERS = [
  "pricelist",
  "harga",
  "lokasi",
  "akses",
  "update stok",
  "siteplan",
  "cara beli",
  "kpr",
  "kontak",
  "galeri",
  "artikel",
  "blog",
  "tipe",
  "cluster",
  "denah",
  "developer",
  "promo",
  "review",
  "ulasan",
] as const;

export type KeywordOwnership = {
  /** Path final di produksi. */
  path: string;
  /** Satu-satunya query yang halaman ini harus menangi. Eksklusif. */
  primary: string;
  /** Frasa pendukung; tumpang tindih antar halaman diperbolehkan. */
  supporting?: string[];
  /** Kenapa keputusan ini diambil, bila tidak jelas dari primary-nya. */
  note?: string;
};

export const keywordOwnership: readonly KeywordOwnership[] = [
  {
    path: "/",
    primary: HOMEPAGE_PRIMARY,
    supporting: [
      HOMEPAGE_SECONDARY,
      "gdc soj",
      "gdc parung",
      "perumahan parung bogor",
      "rumah 700 juta parung",
    ],
    note: "Satu-satunya halaman yang boleh menargetkan frasa brand tanpa modifier.",
  },

  // --- halaman produk: dibedakan oleh nama cluster, bukan nama brand -------
  {
    path: "/cluster-ladera",
    primary: "cluster ladera",
    supporting: ["tipe verona", "tipe malta", "tipe tuscan", "american classic"],
  },
  {
    path: "/cluster-cascada",
    primary: "cluster cascada",
    supporting: ["tipe aira", "tipe manoa", "tipe victoria", "tipe alexandra"],
  },

  // --- halaman transaksional: modifier komersial yang kuat -----------------
  {
    path: "/pricelist-grand-duta-city",
    primary: "pricelist grand duta city parung",
    supporting: ["harga rumah gdc parung", "simulasi kpr gdc parung"],
    note:
      "SENGAJA memuat frasa brand. 'pricelist grand duta city parung' adalah " +
      "query berbeda dengan maksud berbeda, dan halaman ini yang harus " +
      "memenangkannya — bukan homepage.",
  },
  {
    path: "/update-stok-siteplan-grand-duta-city-parung",
    primary: "update stok gdc parung",
    supporting: ["siteplan grand duta city parung", "unit tersedia gdc parung"],
  },
  {
    path: "/cara-beli-kpr",
    primary: "cara beli rumah gdc parung",
    supporting: ["kpr gdc parung", "syarat kpr", "booking fee"],
  },
  {
    path: "/lokasi-akses-grand-duta-city-parung",
    primary: "lokasi gdc parung",
    supporting: ["akses tol parung", "exit tol sawangan", "jarak parung ke jakarta"],
  },
  {
    path: "/kontak",
    primary: "kontak marketing gdc parung",
    supporting: ["jadwal survey gdc parung", "nomor marketing gdc"],
  },
  {
    path: "/galeri",
    primary: "galeri gdc parung",
    supporting: ["foto kawasan gdc", "video gdc parung"],
  },

  // --- halaman korporat dan editorial -------------------------------------
  {
    path: "/about",
    primary: "duta putra land",
    supporting: ["developer gdc parung", "profil pengembang"],
    note: "Menargetkan nama DEVELOPER, entitas berbeda dari nama proyek.",
  },
  {
    path: "/author/santika-reza",
    primary: "santika reza",
    supporting: ["praktisi marketing properti"],
  },
  {
    path: "/artikel",
    primary: "blog properti parung bogor",
    supporting: ["panduan beli rumah", "artikel properti"],
  },
  {
    path: "/category",
    primary: "topik artikel properti",
    supporting: ["kategori artikel"],
  },
  {
    path: "/category/panduan-properti",
    primary: "panduan properti",
    supporting: ["tips beli rumah", "investasi properti"],
  },
  {
    path: "/category/kawasan",
    primary: "ulasan kawasan properti parung",
    supporting: ["kawasan bogor", "perumahan sekitar parung"],
  },
  {
    path: "/category/seputar-gdc",
    primary: "seputar gdc",
    supporting: ["update fasilitas gdc", "kabar gdc parung"],
  },

  // --- halaman legal: tidak menargetkan query komersial --------------------
  {
    path: "/disclaimer",
    primary: "disclaimer situs",
  },
  {
    path: "/privacy-policy",
    primary: "kebijakan privasi",
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const norm = (value: string) => value.trim().toLowerCase();

export const ownershipOf = (path: string): KeywordOwnership | undefined =>
  keywordOwnership.find((entry) => entry.path === path);

/** Kelompok `primary` yang dipakai lebih dari satu halaman. Harus selalu kosong. */
export const duplicatePrimaries = (): Array<{ primary: string; paths: string[] }> => {
  const byPrimary = new Map<string, string[]>();
  for (const entry of keywordOwnership) {
    const key = norm(entry.primary);
    if (!byPrimary.has(key)) byPrimary.set(key, []);
    byPrimary.get(key)!.push(entry.path);
  }
  return [...byPrimary.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([primary, paths]) => ({ primary, paths }));
};

/** true bila frasa memuat minimal satu modifier yang mengubah maksud query. */
export const hasQualifyingModifier = (keyword: string): boolean => {
  const k = norm(keyword);
  return QUALIFYING_MODIFIERS.some((modifier) => k.includes(modifier));
};

/**
 * Halaman non-homepage yang mengklaim frasa milik homepage TANPA modifier.
 * Inilah definisi operasional "kanibalisasi" pada peta ini.
 */
export const reservedPhraseViolations = (): Array<{ path: string; primary: string; reason: string }> => {
  const out: Array<{ path: string; primary: string; reason: string }> = [];
  for (const entry of keywordOwnership) {
    if (entry.path === "/") continue;
    const primary = norm(entry.primary);
    for (const reserved of RESERVED_PHRASES) {
      if (primary === reserved) {
        out.push({
          path: entry.path,
          primary: entry.primary,
          reason: `identik dengan frasa milik homepage "${reserved}"`,
        });
      } else if (primary.includes(reserved) && !hasQualifyingModifier(primary)) {
        out.push({
          path: entry.path,
          primary: entry.primary,
          reason: `memuat "${reserved}" tanpa modifier yang mengubah maksud query`,
        });
      }
    }
  }
  return out;
};
