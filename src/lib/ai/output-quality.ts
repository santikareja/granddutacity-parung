// Pemeriksa MUTU KELUARAN AI — fungsi murni, server & client aman.
//
// KENAPA MODUL INI ADA
//
// `HOUSE_STYLE` di brand-facts.ts melarang lebih dari 20 frasa klise, dan prompt
// artikel menuntut format HTML yang ketat. Sebelum modul ini, tidak ada satu pun
// yang MEMVERIFIKASI larangan itu dipatuhi: prompt adalah instruksi, dan model
// kecil melanggarnya secara diam-diam. Satu-satunya lapisan yang ada
// (`sanitizeAiHtml`) hanya membuang tag berbahaya — ia tidak tahu apa pun soal
// aksara asing, code fence yang bocor, placeholder yang tertinggal, atau
// paragraf yang menjiplak ringkasan sumber.
//
// PEMBAGIAN TINGKAT KEPARAHAN
//
//   HARD  — keluaran objektif rusak dan tidak layak dipakai apa pun konteksnya.
//           Contoh: ada aksara Tionghoa, code fence bocor, nol heading,
//           placeholder "[isi di sini]". Dipakai di `parse` callback penulis
//           sehingga model gagal dan sistem BEROTASI ke model berikutnya —
//           bukan menyimpan sampah lalu menandainya.
//   SOFT  — keluaran layak tapi mutunya di bawah standar. Contoh: frasa klise,
//           paragraf seragam, penyebutan brand berlebihan. Ditandai sebagai
//           `needsReview` supaya penulis manusia memutuskan.
//
// Pembagian ini disengaja: memblokir hal subjektif membuat generate sering gagal
// tanpa alasan jelas, sementara membiarkan hal objektif rusak lolos berarti
// artikel bermasalah bisa tayang.

/** Satu temuan pada keluaran AI. */
export type OutputDefect = {
  severity: "hard" | "soft";
  code: string;
  message: string;
  /** Contoh potongan yang memicu temuan, untuk ditampilkan ke penulis. */
  samples: string[];
};

const MAX_SAMPLES = 5;

const collapse = (value: string): string => value.replace(/\s+/g, " ").trim();

/** Teks terlihat dari HTML: tag dibuang, entity dasar dipulihkan. */
export const visibleText = (html: string): string =>
  collapse(
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'"),
  );

const uniqueSamples = (values: string[]): string[] => [
  ...new Set(values.map((v) => collapse(v)).filter(Boolean)),
].slice(0, MAX_SAMPLES);

// ---------------------------------------------------------------------------
// 1. Aksara asing
// ---------------------------------------------------------------------------

/**
 * Rentang aksara yang TIDAK PERNAH sah di artikel properti berbahasa Indonesia.
 *
 * Model multibahasa kadang menyelipkan token non-Latin — paling sering aksara
 * Tionghoa (Han) — ketika kehabisan konteks atau saat rotasi memakai model yang
 * dilatih dominan pada korpus lain. Satu karakter saja sudah membuat artikel
 * tampak rusak bagi pembaca.
 *
 * Emoji SENGAJA tidak dimasukkan ke sini: ia bukan aksara asing dan sudah
 * ditangani sebagai cacat format tersendiri.
 */
const FOREIGN_SCRIPTS: { name: string; pattern: RegExp }[] = [
  // Han (Tionghoa/Kanji), termasuk Extension A dan bentuk kompatibilitas.
  { name: "Tionghoa/Kanji", pattern: /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g },
  // Hiragana & Katakana.
  { name: "Jepang (kana)", pattern: /[\u3040-\u30FF\u31F0-\u31FF]/g },
  // Hangul.
  { name: "Korea (hangul)", pattern: /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/g },
  // Sirilik.
  { name: "Sirilik", pattern: /[\u0400-\u04FF\u0500-\u052F]/g },
  // Arab (huruf; bukan tanda baca Arab yang kadang muncul di kutipan).
  { name: "Arab", pattern: /[\u0620-\u064A\u0660-\u066F\u0671-\u06D3]/g },
  // Thai, Devanagari, Ibrani, Yunani.
  { name: "Thai", pattern: /[\u0E00-\u0E7F]/g },
  { name: "Devanagari", pattern: /[\u0900-\u097F]/g },
  { name: "Ibrani", pattern: /[\u0590-\u05FF]/g },
  { name: "Yunani", pattern: /[\u0370-\u03FF]/g },
  // Tanda baca lebar penuh CJK yang sering lolos meski hurufnya Latin.
  { name: "tanda baca CJK", pattern: /[\u3000-\u303F\uFF01-\uFF65]/g },
];

export const detectForeignScript = (html: string): OutputDefect | null => {
  const text = visibleText(html);
  const found: string[] = [];
  const names: string[] = [];

  for (const { name, pattern } of FOREIGN_SCRIPTS) {
    const matches = text.match(pattern);
    if (!matches || matches.length === 0) continue;
    names.push(name);
    // Sertakan konteks di sekitar kemunculan pertama agar penulis bisa mencarinya.
    const index = text.search(pattern);
    const start = Math.max(0, index - 40);
    found.push(`${name}: "…${text.slice(start, index + 40)}…"`);
  }

  if (found.length === 0) return null;

  return {
    severity: "hard",
    code: "foreign_script",
    message: `Keluaran memuat aksara non-Latin (${names.join(", ")}). Artikel berbahasa Indonesia tidak boleh memuatnya.`,
    samples: uniqueSamples(found),
  };
};

// ---------------------------------------------------------------------------
// 2. Cacat format
// ---------------------------------------------------------------------------

/** Tag blok yang wajib berpasangan. */
const PAIRED_TAGS = [
  "h2",
  "h3",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "blockquote",
  "a",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
] as const;

/**
 * Tag yang DILARANG di isi artikel tetapi SUDAH ditangani `sanitizeAiHtml`.
 *
 * KENAPA INI BUKAN CACAT BERAT — baca sebelum memindahkannya.
 *
 * Arsitektur repo ini menempatkan `sanitizeAiHtml` sebagai batas keamanan:
 * komentarnya menyatakan konten dari provider AI adalah untrusted, jadi tag
 * aktif dibuang di sana. Ada rangkaian test yang sengaja menyuapkan `<script>`,
 * `<iframe>`, `<style>`, dan `onerror=` ke handler untuk membuktikan sanitasi
 * bekerja.
 *
 * Menjadikan tag ini cacat berat berarti permintaan ditolak SEBELUM sanitasi
 * pernah dijalankan — lapisan keamanan yang sudah terbukti jadi tidak pernah
 * dipakai, dan rotasi model bisa terkuras habis oleh model yang kebetulan gemar
 * menyisipkan `<style>`. Membuang lalu melanjutkan lebih tangguh daripada
 * menolak.
 *
 * `<h1>` juga di sini: sanitasi menurunkannya menjadi `<h2>`, dan itu perilaku
 * yang disengaja.
 *
 * Tetap DILAPORKAN sebagai catatan mutu supaya penulis tahu model melanggar
 * kontrak keluaran, tanpa memblokir.
 */
const SANITIZED_TAGS = [
  "html",
  "head",
  "body",
  "h1",
  "script",
  "style",
  "iframe",
  "form",
  "input",
  "button",
  "object",
  "embed",
  "svg",
] as const;

/**
 * Sisa markdown yang bocor ke keluaran HTML.
 *
 * Model sering "lupa" bahwa kontrak keluarannya HTML dan mencampur markdown.
 * Hasilnya tanda bintang atau tagar mentah terbaca pembaca sebagai sampah.
 */
const MARKDOWN_LEAKS: { code: string; label: string; pattern: RegExp }[] = [
  { code: "md_heading", label: "heading markdown (## Judul)", pattern: /(^|\n)\s{0,3}#{1,6}\s+\S/g },
  { code: "md_bold", label: "penebalan markdown (**teks**)", pattern: /\*\*[^*\n]{2,}\*\*/g },
  { code: "md_italic", label: "miring markdown (_teks_)", pattern: /(^|\s)_[^_\n]{2,}_(\s|$)/g },
  { code: "md_bullet", label: "daftar markdown (- item)", pattern: /(^|\n)\s{0,3}[-*+]\s+\S/g },
  { code: "md_link", label: "tautan markdown ([teks](url))", pattern: /\[[^\]\n]{1,80}\]\([^)\n]{1,200}\)/g },
];

/**
 * Placeholder yang menandakan model berhenti di tengah dan menyerahkan sisanya
 * ke manusia. Ini keluaran gagal, bukan draft.
 */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\[(isi|tulis|tambahkan|lengkapi|masukkan|sisipkan)[^\]]{0,60}\]/gi,
  /\[(insert|add|your|placeholder|todo|tbd)[^\]]{0,60}\]/gi,
  /\b(lorem ipsum|dolor sit amet)\b/gi,
  /\bXXX+\b/g,
  /\bTODO\b/g,
  /\{\{[^}]{1,60}\}\}/g,
];

/**
 * Kalimat meta: model berbicara tentang tugasnya, bukan menulis artikel.
 *
 * DIPERIKSA HANYA DI AWAL DAN AKHIR keluaran, bukan sepanjang artikel.
 *
 * Alasannya konkret: pola seperti "Berikut hasil perhitungannya" adalah cara
 * yang WAJAR memperkenalkan tabel simulasi angsuran di artikel properti, dan
 * "Ini adalah artikel pertama dari seri" juga kalimat sah. Memeriksanya di
 * seluruh badan artikel akan menolak tulisan yang justru bagus — peringatan
 * palsu yang mahal, karena konsekuensinya rotasi model dan generate gagal.
 *
 * Preamble dan postamble model selalu muncul di tepi keluaran. Membatasi
 * pemeriksaan ke sana menangkap kasus nyata tanpa mengorbankan kalimat sah.
 */
const META_COMMENTARY: RegExp[] = [
  /\b(berikut|ini)\s+(adalah\s+)?(artikel|draft|versi)\s+(yang|nya|lengkap|final)/gi,
  /\bsemoga (membantu|bermanfaat)\b/gi,
  /\bsebagai (model|asisten) (bahasa|ai)\b/gi,
  /\b(saya|aku) (tidak |belum )?(bisa|dapat|akan) (menulis|membantu|memberikan)\b/gi,
  /\b(catatan|note)\s*:\s*(saya|artikel ini|sebagai)/gi,
];

/** Panjang tepi keluaran yang diperiksa untuk kalimat meta model. */
const META_EDGE_CHARS = 400;

/**
 * Ambang kata sebelum ketiadaan struktur dianggap cacat berat.
 *
 * Keluaran pendek yang tidak punya heading bukan "artikel tanpa struktur" — ia
 * cuma pendek, dan kependekan sudah dilaporkan terpisah sebagai peringatan oleh
 * route. Yang benar-benar rusak adalah keluaran PANJANG yang datang sebagai satu
 * blok teks tanpa pembagian apa pun.
 *
 * Ambang ini juga menjaga pemeriksa tidak menolak potongan HTML kecil yang sah
 * dipakai di jalur lain (mis. pratinjau, uji sanitasi), sehingga pemeriksaan
 * mutu tidak menyandera lapisan keamanan yang sudah bekerja.
 */
const STRUCTURE_CHECK_MIN_WORDS = 150;

export const detectFormatDefects = (html: string): OutputDefect[] => {
  const defects: OutputDefect[] = [];
  const text = visibleText(html);
  const wordCount = text.split(" ").filter(Boolean).length;
  const longEnoughToJudgeStructure = wordCount >= STRUCTURE_CHECK_MIN_WORDS;

  // Code fence yang bocor. Route sudah mencoba melepasnya, jadi bila masih ada
  // di sini bentuknya tidak lengkap — biasanya fence pembuka tanpa penutup.
  const fences = html.match(/```/g);
  if (fences && fences.length > 0) {
    defects.push({
      severity: "hard",
      code: "code_fence",
      message: "Keluaran masih memuat penanda code fence (```), tanda pembungkus markdown tidak lengkap.",
      samples: uniqueSamples([html.slice(Math.max(0, html.indexOf("```") - 30), html.indexOf("```") + 40)]),
    });
  }

  // Struktur hanya dinilai pada keluaran sepanjang artikel sungguhan.
  if (longEnoughToJudgeStructure && !/<h[23]\b/i.test(html)) {
    defects.push({
      severity: "hard",
      code: "no_heading",
      message: `Keluaran ${wordCount} kata tanpa satu pun <h2>/<h3>. Artikel sepanjang ini tidak boleh berupa satu blok teks.`,
      samples: [],
    });
  }

  if (longEnoughToJudgeStructure && !/<p\b/i.test(html)) {
    defects.push({
      severity: "hard",
      code: "no_paragraph",
      message: `Keluaran ${wordCount} kata tanpa satu pun <p>. Ini bukan HTML artikel yang valid.`,
      samples: [],
    });
  }

  // Tag yang dibuang sanitasi. Dilaporkan, tidak memblokir — lihat catatan di
  // SANITIZED_TAGS.
  const sanitizedFound = SANITIZED_TAGS.filter((tag) =>
    new RegExp(`<${tag}\\b`, "i").test(html),
  );
  if (sanitizedFound.length > 0) {
    defects.push({
      severity: "soft",
      code: "sanitized_tag",
      message: `Keluaran memuat tag di luar kontrak: ${sanitizedFound.map((t) => `<${t}>`).join(", ")}. Sistem membuangnya, tetapi model melanggar instruksi.`,
      samples: [],
    });
  }

  // Tag tidak berpasangan.
  //
  // Hanya dinilai pada keluaran sepanjang artikel, dan hanya untuk tag yang
  // BERTAHAN setelah sanitasi. Dua pembatasan ini disengaja: `<img src=x>` yang
  // void, atau `<script>` tanpa penutup yang justru dibuang sanitasi, tidak
  // boleh dihitung sebagai keluaran terpotong.
  if (longEnoughToJudgeStructure) {
    const unbalanced: string[] = [];
    for (const tag of PAIRED_TAGS) {
      const open = (html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) ?? []).length;
      const close = (html.match(new RegExp(`</${tag}\\s*>`, "gi")) ?? []).length;
      if (open !== close) unbalanced.push(`<${tag}>: ${open} buka, ${close} tutup`);
    }
    if (unbalanced.length > 0) {
      defects.push({
        severity: "hard",
        code: "unbalanced_tag",
        message: "Tag HTML tidak berpasangan; keluaran kemungkinan terpotong di tengah.",
        samples: uniqueSamples(unbalanced),
      });
    }
  }

  // Placeholder.
  const placeholders: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    placeholders.push(...(html.match(pattern) ?? []));
  }
  if (placeholders.length > 0) {
    defects.push({
      severity: "hard",
      code: "placeholder",
      message: "Keluaran memuat placeholder yang belum diisi. Artikel tidak selesai ditulis.",
      samples: uniqueSamples(placeholders),
    });
  }

  // Markdown bocor.
  const leaks: string[] = [];
  const leakLabels: string[] = [];
  for (const { label, pattern } of MARKDOWN_LEAKS) {
    const matches = html.match(pattern);
    if (!matches || matches.length === 0) continue;
    leakLabels.push(label);
    leaks.push(...matches.slice(0, 2));
  }
  if (leaks.length > 0) {
    defects.push({
      severity: "hard",
      code: "markdown_leak",
      message: `Keluaran mencampur markdown dengan HTML (${leakLabels.join(", ")}). Kontraknya HTML saja.`,
      samples: uniqueSamples(leaks),
    });
  }

  // Komentar meta model, hanya di tepi keluaran (lihat catatan META_COMMENTARY).
  const edges =
    text.length <= META_EDGE_CHARS * 2
      ? text
      : `${text.slice(0, META_EDGE_CHARS)} ${text.slice(-META_EDGE_CHARS)}`;
  const meta: string[] = [];
  for (const pattern of META_COMMENTARY) {
    meta.push(...(edges.match(pattern) ?? []));
  }
  if (meta.length > 0) {
    defects.push({
      severity: "hard",
      code: "meta_commentary",
      message: "Keluaran memuat kalimat model yang berbicara tentang tugasnya, bukan isi artikel.",
      samples: uniqueSamples(meta),
    });
  }

  // Heading kosong.
  const emptyHeadings = [...html.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi)].filter(
    (m) => visibleText(m[1]).length === 0,
  );
  if (emptyHeadings.length > 0) {
    defects.push({
      severity: "hard",
      code: "empty_heading",
      message: `Ada ${emptyHeadings.length} heading tanpa teks.`,
      samples: [],
    });
  }

  // Tabel dengan jumlah sel tidak konsisten.
  for (const table of html.match(/<table\b[\s\S]*?<\/table>/gi) ?? []) {
    const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
    const counts = rows.map(
      (row) => (row[1].match(/<(?:td|th)\b/gi) ?? []).length,
    );
    const distinct = [...new Set(counts.filter((c) => c > 0))];
    if (distinct.length > 1) {
      defects.push({
        severity: "soft",
        code: "table_ragged",
        message: `Tabel punya jumlah sel tidak seragam per baris (${distinct.join(", ")}). Tampilannya akan rusak.`,
        samples: [],
      });
      break;
    }
  }

  // Emoji dan tanda seru — dilarang HOUSE_STYLE, mudah diperiksa.
  const emoji = text.match(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu,
  );
  if (emoji && emoji.length > 0) {
    defects.push({
      severity: "soft",
      code: "emoji",
      message: "Keluaran memuat emoji atau simbol dekoratif; gaya redaksional tidak memakainya.",
      samples: uniqueSamples(emoji),
    });
  }

  const bangs = (text.match(/!/g) ?? []).length;
  if (bangs > 0) {
    defects.push({
      severity: "soft",
      code: "exclamation",
      message: `Ada ${bangs} tanda seru. Gaya redaksional melarangnya.`,
      samples: [],
    });
  }

  return defects;
};

// ---------------------------------------------------------------------------
// 3. Pola khas AI (verifikasi larangan HOUSE_STYLE)
// ---------------------------------------------------------------------------

/**
 * Frasa yang dilarang HOUSE_STYLE, kini benar-benar diperiksa.
 *
 * Daftar ini WAJIB tetap sinkron dengan larangan di brand-facts.ts. Guard test
 * memeriksa keduanya cocok, karena larangan yang tidak diperiksa sama dengan
 * tidak ada larangan.
 */
export const BANNED_PHRASES: readonly string[] = [
  // Pembuka basi.
  "di era modern ini",
  "dalam dunia yang serba cepat",
  "seiring berkembangnya zaman",
  "memilih hunian adalah keputusan besar",
  "di era digital",
  "seiring waktu berjalan",
  // Frasa pengisi.
  "penting untuk dicatat",
  "perlu diketahui bahwa",
  "tak dapat disangkal",
  "tidak dapat dipungkiri",
  "perlu digarisbawahi",
  // Penutup basi.
  "sebagai kesimpulan",
  "kesimpulannya",
  "secara keseluruhan",
  // Bahasa iklan kosong.
  "solusi tepat",
  "pilihan tepat",
  "jawaban atas kebutuhan anda",
  "investasi cerdas",
  "tak perlu ragu lagi",
  // Bicara tentang artikel.
  "mari kita bahas",
  "dalam artikel ini kita akan",
  "artikel ini akan membahas",
  // Metafora klise.
  "surga tersembunyi",
  "oase di tengah kota",
  "permata tersembunyi",
  // Kata sifat kosong.
  "menakjubkan",
  "luar biasa",
  "tiada duanya",
  "tak tertandingi",
];

/**
 * Ambang keseragaman panjang paragraf (koefisien variasi = simpangan baku /
 * rata-rata).
 *
 * DIKALIBRASI DENGAN PENGUKURAN, bukan ditebak. Nilai CV pada pola nyata:
 *
 *   0.00  semua paragraf tepat 40 kata      -> mesin
 *   0.03  40-45 kata, ritme khas AI          -> mesin
 *   0.08  35-45 kata                         -> masih terlalu rata
 *   0.25  18-37 kata, tulisan manusia wajar  -> SAH
 *   0.68  4-45 kata, variasi kuat            -> sangat baik
 *
 * Ambang pertama yang saya pakai (0.25) menandai tulisan manusia yang wajar
 * sebagai seragam — persis jenis peringatan palsu yang membuat penulis berhenti
 * mempercayai pemeriksa. 0.15 memisahkan dengan bersih: ia menangkap 0.03-0.08
 * tanpa menyentuh 0.25.
 */
const UNIFORM_PARAGRAPH_CV_THRESHOLD = 0.15;

/** Jumlah paragraf minimum sebelum keseragaman bermakna secara statistik. */
const UNIFORM_PARAGRAPH_MIN_COUNT = 5;

/** Kata transisi yang dibatasi HOUSE_STYLE maksimal sekali masing-masing. */
const LIMITED_TRANSITIONS: readonly string[] = [
  "selain itu",
  "lebih lanjut",
  "namun demikian",
  "di sisi lain",
  "tak hanya itu",
];

export const detectAiTells = (html: string): OutputDefect[] => {
  const defects: OutputDefect[] = [];
  const text = visibleText(html);
  const lower = text.toLowerCase();

  // Frasa terlarang.
  const banned = BANNED_PHRASES.filter((phrase) => lower.includes(phrase));
  if (banned.length > 0) {
    defects.push({
      severity: "soft",
      code: "banned_phrase",
      message: `Ada ${banned.length} frasa klise yang dilarang gaya penulisan.`,
      samples: uniqueSamples(banned),
    });
  }

  // Transisi yang dipakai berlebihan.
  const overused = LIMITED_TRANSITIONS.map((word) => ({
    word,
    count: lower.split(word).length - 1,
  })).filter((item) => item.count > 1);
  if (overused.length > 0) {
    defects.push({
      severity: "soft",
      code: "overused_transition",
      message: "Kata transisi dipakai lebih dari sekali; gaya penulisan membatasinya.",
      samples: uniqueSamples(overused.map((i) => `"${i.word}" ${i.count}x`)),
    });
  }

  // Pola "bukan hanya X, tetapi juga Y" — maksimal sekali.
  const notOnly = (lower.match(/bukan (hanya|sekadar)[^.]{0,80}(tetapi|tapi) juga/g) ?? [])
    .length;
  if (notOnly > 1) {
    defects.push({
      severity: "soft",
      code: "not_only_pattern",
      message: `Pola "bukan hanya X, tetapi juga Y" dipakai ${notOnly}x. Maksimal sekali.`,
      samples: [],
    });
  }

  // Paragraf dengan panjang seragam: penanda ritme mesin.
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => visibleText(m[1]))
    .filter((p) => p.length > 0);
  if (paragraphs.length >= UNIFORM_PARAGRAPH_MIN_COUNT) {
    const lengths = paragraphs.map((p) => p.split(" ").length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const sd = Math.sqrt(
      lengths.reduce((sum, n) => sum + (n - mean) ** 2, 0) / lengths.length,
    );
    const cv = mean > 0 ? sd / mean : 1;
    if (cv < UNIFORM_PARAGRAPH_CV_THRESHOLD) {
      defects.push({
        severity: "soft",
        code: "uniform_paragraphs",
        message: `Panjang paragraf terlalu seragam (rata-rata ${Math.round(mean)} kata, sebaran ${sd.toFixed(1)}, variasi ${cv.toFixed(2)}). Variasikan agar berirama manusiawi.`,
        samples: [],
      });
    }
  }

  // Paragraf berturut-turut dibuka kata yang sama.
  const openers = paragraphs.map((p) => p.split(" ")[0]?.toLowerCase() ?? "");
  const openerCount = new Map<string, number>();
  for (const opener of openers) {
    if (!opener) continue;
    openerCount.set(opener, (openerCount.get(opener) ?? 0) + 1);
  }
  const repeatedOpeners = [...openerCount.entries()].filter(([, n]) => n > 2);
  if (repeatedOpeners.length > 0) {
    defects.push({
      severity: "soft",
      code: "repeated_opener",
      message: "Lebih dari dua paragraf dibuka dengan kata yang sama.",
      samples: uniqueSamples(repeatedOpeners.map(([w, n]) => `"${w}" ${n}x`)),
    });
  }

  return defects;
};

// ---------------------------------------------------------------------------
// 4. Penjiplakan verbatim dari sumber
// ---------------------------------------------------------------------------

/**
 * Deteksi kalimat yang disalin apa adanya dari ringkasan sumber.
 *
 * BATAS KEMAMPUAN — baca sebelum mengandalkan fungsi ini.
 * Ini BUKAN pemeriksa plagiarisme. Pemeriksa plagiarisme sesungguhnya harus
 * membandingkan artikel dengan seluruh web dan menuntut layanan berbayar
 * (Copyscape, Originality.ai, dan sejenisnya) yang tidak terpasang di proyek ini.
 *
 * Yang DIPERIKSA di sini adalah satu-satunya jalur penjiplakan yang benar-benar
 * ada di pipeline: model menyalin ringkasan hasil pencarian (`data_summary`) ke
 * dalam artikel alih-alih menuliskannya kembali dengan kalimat sendiri.
 * Ringkasan itu berasal dari halaman pihak lain, jadi menyalinnya verbatim
 * berarti menyalin tulisan orang.
 *
 * Metodenya n-gram: potong artikel menjadi jendela 8 kata, lalu cari jendela yang
 * juga muncul utuh di ringkasan sumber. Delapan kata cukup panjang untuk tidak
 * memicu alarm pada frasa umum ("harga rumah di kawasan ini cenderung naik"),
 * dan cukup pendek untuk menangkap kalimat yang disalin.
 */
const SHINGLE_SIZE = 8;

const shingles = (text: string, size = SHINGLE_SIZE): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < size) return [];
  const out: string[] = [];
  for (let i = 0; i <= words.length - size; i += 1) {
    out.push(words.slice(i, i + size).join(" "));
  }
  return out;
};

export const detectVerbatimCopying = (
  html: string,
  sources: { data_summary: string; source_name: string }[],
): OutputDefect | null => {
  if (sources.length === 0) return null;

  const articleShingles = shingles(visibleText(html));
  if (articleShingles.length === 0) return null;

  const sourcePool = new Set<string>();
  for (const source of sources) {
    for (const shingle of shingles(source.data_summary)) {
      sourcePool.add(shingle);
    }
  }
  if (sourcePool.size === 0) return null;

  const copied = articleShingles.filter((shingle) => sourcePool.has(shingle));
  if (copied.length === 0) return null;

  return {
    severity: "soft",
    code: "verbatim_source",
    message: `Ada ${copied.length} rangkaian ${SHINGLE_SIZE} kata yang disalin utuh dari ringkasan sumber. Tulis ulang dengan kalimat sendiri.`,
    samples: uniqueSamples(copied),
  };
};

// ---------------------------------------------------------------------------
// 5. Penilaian gabungan
// ---------------------------------------------------------------------------

export type OutputAssessment = {
  /** Ada cacat objektif; keluaran tidak layak dipakai. */
  hasHardDefect: boolean;
  hard: OutputDefect[];
  soft: OutputDefect[];
  all: OutputDefect[];
  /** Ringkasan satu baris untuk pesan error / log. */
  summary: string;
};

export const assessAiOutput = (
  html: string,
  sources: { data_summary: string; source_name: string }[] = [],
): OutputAssessment => {
  const defects: OutputDefect[] = [];

  const foreign = detectForeignScript(html);
  if (foreign) defects.push(foreign);

  defects.push(...detectFormatDefects(html));
  defects.push(...detectAiTells(html));

  const verbatim = detectVerbatimCopying(html, sources);
  if (verbatim) defects.push(verbatim);

  const hard = defects.filter((d) => d.severity === "hard");
  const soft = defects.filter((d) => d.severity === "soft");

  const summary =
    defects.length === 0
      ? "Tidak ada cacat keluaran terdeteksi."
      : [
          hard.length > 0 ? `${hard.length} cacat berat` : "",
          soft.length > 0 ? `${soft.length} catatan mutu` : "",
        ]
          .filter(Boolean)
          .join(", ");

  return {
    hasHardDefect: hard.length > 0,
    hard,
    soft,
    all: defects,
    summary,
  };
};

/** Pesan error ringkas untuk memicu rotasi model. */
export const hardDefectMessage = (assessment: OutputAssessment): string =>
  assessment.hard
    .map((d) => (d.samples.length > 0 ? `${d.message} Contoh: ${d.samples[0]}` : d.message))
    .join(" | ");
