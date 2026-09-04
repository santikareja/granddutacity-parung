// Perencanaan grounding DETERMINISTIK — memilih satu sumber data berdasarkan
// judul + outline, tanpa panggilan model tambahan.
//
// KENAPA TIDAK MEMAKAI AI UNTUK MEMILIH TOOL:
//   1. Latensi. Satu panggilan model ekstra sebelum menulis artikel menambah
//      waktu di jalur yang sudah mendekati batas maxDuration 300s, dan pernah
//      menjadi penyebab kegagalan generate.
//   2. Determinisme. Pemilihan berbasis kata kunci bisa diuji; keputusan model
//      berubah-ubah antar rotasi dan tidak bisa dijamin.
//   3. Konteks. Router ini melihat judul DAN seluruh heading outline, jadi query
//      yang dihasilkan justru lebih menempel pada artikel yang akan ditulis
//      dibanding hasil planning model yang hanya menerima topik singkat.
//
// Kontrak: tepat SATU tool primer dipilih. Pemanggil (ground.ts) yang menangani
// fallback ke tool lain bila yang primer tidak menghasilkan sumber.

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Kata kunci yang menandakan topik butuh ANGKA MAKRO RESMI → arahkan ke BPS.
 * Sengaja spesifik: kata umum seperti "rumah" atau "properti" tidak masuk,
 * karena topik seperti itu lebih terlayani oleh pencarian web.
 */
const STATISTIC_SIGNALS: readonly string[] = [
  "statistik",
  "data resmi",
  "inflasi",
  "indeks harga",
  "ihpr",
  "indeks",
  "pertumbuhan ekonomi",
  "ekonomi makro",
  "pdb",
  "pdrb",
  "suku bunga",
  "jumlah penduduk",
  "populasi",
  "kepadatan penduduk",
  "sensus",
  "survei",
  "upah",
  "pendapatan per kapita",
  "tingkat hunian",
  "backlog perumahan",
  "kebutuhan rumah",
  "angka kemiskinan",
  "urbanisasi",
  "demografi",
];

/**
 * Kata dekoratif yang dibuang dari query pencarian.
 *
 * Judul artikel dioptimalkan untuk MENARIK PEMBACA, bukan untuk mesin pencari
 * data. "7 Kesalahan yang Sering Terjadi saat Mengajukan KPR" sebagai query
 * menghasilkan blog listicle, bukan aturan resmi soal KPR. Yang dicari adalah
 * entitas dan topiknya: "kpr pengajuan syarat".
 */
const TITLE_DECORATIONS: readonly RegExp[] = [
  /^\d+\s+(hal|alasan|cara|tips|langkah|fakta|kesalahan|pertimbangan|pilihan|rekomendasi|pertanyaan)\s+(yang\s+)?/i,
  /^panduan\s+(lengkap|memilih|praktis)\s*/i,
  /^panduan\s+/i,
  /^cara\s+/i,
  /^begini\s+cara\s+/i,
  /^tips\s+/i,
  /^mengenal\s+/i,
  /^inilah\s+/i,
  /^ketahui\s+/i,
  /^apakah\s+/i,
  /^berapa\s+(lama\s+|banyak\s+)?/i,
  /^kapan\s+(sebaiknya\s+)?/i,
  /^kenapa\s+/i,
  /^mengapa\s+/i,
  /^bagaimana\s+/i,
  /\s*[:|–-]\s*(semua|apa)\s+yang\s+perlu\s+anda\s+tahu\s*$/i,
  /\s*[:|–-]\s*panduan\s+lengkap.*$/i,
];

/**
 * Istilah yang mengarahkan pencarian ke materi RESMI, bukan blog.
 *
 * Ditambahkan ke query karena hasil pencarian mentah untuk topik properti
 * didominasi portal listing dan blog agen — dan seluruhnya ditolak allowlist
 * otoritas di authority.ts. Akibatnya artikel sering berakhir tanpa satu pun
 * sumber meski pencarian "berhasil". Menyertakan istilah ini menaikkan peluang
 * hasil teratas berasal dari domain yang memang lolos saringan.
 */
const AUTHORITY_HINT = "data resmi statistik";

const STOPWORDS = new Set([
  "yang", "dan", "atau", "untuk", "dengan", "dari", "pada", "di", "ke", "ini",
  "itu", "adalah", "akan", "bisa", "dapat", "anda", "kita", "saja", "agar",
  "sebagai", "dalam", "oleh", "juga", "tidak", "lebih", "harus", "perlu",
  "apa", "bagaimana", "kenapa", "mengapa", "kapan", "mana", "sebelum",
]);

export type GroundingPrimary = "bps" | "web";

export type GroundingPlan = {
  /** Tool yang dicoba lebih dulu. */
  primary: GroundingPrimary;
  /** Query untuk pencarian web (Tavily/SerpApi). */
  webQuery: string;
  /** Kata kunci indikator untuk BPS. */
  bpsKeyword: string;
  /** Penjelasan singkat kenapa tool ini dipilih — dicatat ke log/UI. */
  reason: string;
};
const normalize = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

// Hilangkan pola judul dekoratif, sisakan inti topik.
const stripDecoration = (title: string): string => {
  let out = title.trim();
  for (const pattern of TITLE_DECORATIONS) {
    out = out.replace(pattern, "");
  }
  return out.trim() || title.trim();
};

// Ambil kata bermakna (buang stopword & token pendek), pertahankan urutan.
const significantWords = (text: string): string[] => {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const raw of normalize(text).split(/[^a-z0-9]+/)) {
    if (raw.length < 4) continue;
    if (STOPWORDS.has(raw)) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    words.push(raw);
  }
  return words;
};

export type PlanGroundingInput = {
  title: string;
  outline?: { heading: string; subheadings?: string[] }[];
  topic?: string;
  category?: string;
};

/**
 * Tentukan rencana grounding dari judul + outline (+ topik/kategori bila ada).
 *
 * Query web dibangun dari inti judul, diberi tahun berjalan supaya mesin pencari
 * mengutamakan materi terkini, dan diberi petunjuk otoritas supaya hasil
 * teratasnya lebih mungkin lolos allowlist di authority.ts.
 *
 * Heading outline ikut menyumbang kata kunci (ditambahkan 4 September 2026).
 * Sebelumnya query hanya berasal dari judul, dan judul yang bagus untuk pembaca
 * justru sering miskin kata kunci pencarian data — "Rumah Pertama: Kapan
 * Waktunya?" tidak menghasilkan sumber apa pun. Heading biasanya memuat istilah
 * teknis yang lebih dikenali mesin pencari, jadi menyertakan dua kata bermakna
 * dari heading membuat query lebih menempel pada substansi artikel.
 */
export const planGrounding = (input: PlanGroundingInput): GroundingPlan => {
  const title = input.title.trim();
  const topic = (input.topic ?? "").trim();
  const category = (input.category ?? "").trim();
  const headings = (input.outline ?? [])
    .map((section) => section.heading?.trim())
    .filter((heading): heading is string => Boolean(heading));

  // Haystack untuk deteksi sinyal statistik: judul + topik + semua heading.
  // Outline ikut diperiksa karena sering justru di situ muncul bagian
  // "Data dan tren" walau judulnya bergaya panduan.
  const haystack = normalize([title, topic, category, ...headings].join(" "));
  const matchedSignal = STATISTIC_SIGNALS.find((signal) =>
    haystack.includes(signal),
  );

  const core = stripDecoration(title);
  const coreWords = new Set(significantWords(core));

  // Dua kata bermakna dari heading yang BELUM ada di inti judul. Dibatasi dua
  // supaya query tetap fokus: query panjang justru mengurangi presisi hasil.
  const headingTerms = significantWords(headings.join(" "))
    .filter((word) => !coreWords.has(word))
    .slice(0, 2);

  // Query web: inti judul + istilah heading + tahun berjalan + petunjuk otoritas.
  const hasYear = /\b(19|20)\d{2}\b/.test(core);
  const webQuery = [
    core,
    ...headingTerms,
    hasYear ? "" : String(CURRENT_YEAR),
    AUTHORITY_HINT,
  ]
    .filter(Boolean)
    .join(" ");

  // Kata kunci BPS: pakai sinyal statistik yang terdeteksi bila ada (itu nama
  // indikator yang paling mungkin dikenali BPS); kalau tidak, pakai 3 kata
  // bermakna pertama dari inti judul.
  const bpsKeyword =
    matchedSignal ?? significantWords(core).slice(0, 3).join(" ") ?? core;

  if (matchedSignal) {
    return {
      primary: "bps",
      webQuery,
      bpsKeyword,
      reason: `Topik menyinggung data statistik ("${matchedSignal}"), jadi BPS dicoba lebih dulu.`,
    };
  }

  return {
    primary: "web",
    webQuery,
    bpsKeyword: bpsKeyword || core,
    reason:
      "Topik bersifat tren/konteks pasar, jadi pencarian web dicoba lebih dulu.",
  };
};
