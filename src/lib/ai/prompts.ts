// Prompt builder untuk seluruh fitur AI CMS.
//
// PRINSIP DESAIN
// 1. Setiap prompt dibangun dari blok bersama di brand-facts.ts (persona,
//    disiplin fakta, gaya penulisan, kontrak keluaran). Ini yang membuat
//    kualitas tetap setara ketika sistem berotasi ke model lain: aturannya tidak
//    bergantung pada "kepintaran bawaan" satu model tertentu.
// 2. Kontrak keluaran selalu ditulis eksplisit di dalam prompt, tidak hanya
//    mengandalkan parameter response_format provider yang dukungannya beragam.
// 3. Semua larangan ditulis konkret dan bisa diperiksa ("jangan memakai frasa X")
//    alih-alih imbauan abstrak ("tulislah dengan natural"), karena hanya bentuk
//    konkret yang dipatuhi model kecil.
// 4. BLOK DISUNTIKKAN SESUAI KEBUTUHAN TUGAS, bukan semuanya ke semua prompt.
//    Ini perubahan penting 4 September 2026: sebelumnya lembar fakta brand ikut
//    masuk ke prompt judul dan outline, dan pengukuran menunjukkan keduanya
//    menerima 15 sebutan brand per prompt. Model kecil membaca pengulangan itu
//    sebagai instruksi implisit, lalu menyelipkan nama proyek ke judul apa pun.
//    Sekarang hanya prompt artikel dan editor yang menerima lembar fakta.

import {
  AI_PERSONA,
  BRAND_FACT_SHEET,
  BRAND_SHORT_NAME,
  CITATION_CRAFT,
  CTA_CRAFT,
  FACT_DISCIPLINE,
  HOMEPAGE_KEYWORD_GUARD,
  HOUSE_STYLE,
  OUTPUT_DISCIPLINE,
  jsonContract,
} from "./brand-facts";
import type { ChatMessage } from "./client";
import type { ToolSource } from "./factual/sources";

/**
 * Fondasi NETRAL: persona + disiplin fakta, nol sebutan brand.
 *
 * Dipakai tugas yang tidak menulis tentang proyek (judul, outline, SEO, alat
 * teks, metadata gambar).
 */
const NEUTRAL_FOUNDATION = `${AI_PERSONA}

${FACT_DISCIPLINE}`;

/**
 * Fondasi PENULISAN ARTIKEL: fondasi netral + lembar fakta proyek.
 *
 * Hanya untuk tugas yang benar-benar menulis isi artikel, karena hanya di situ
 * fakta proyek relevan.
 */
const ARTICLE_FOUNDATION = `${NEUTRAL_FOUNDATION}

${BRAND_FACT_SHEET}`;

// ---------------------------------------------------------------------------
// Judul
// ---------------------------------------------------------------------------

export const DEFAULT_TITLE_COUNT = 5;

/** Batas keras panjang judul. Di atas 60 karakter, Google memotongnya di SERP. */
export const TITLE_MAX_CHARS = 60;
export const TITLE_MIN_CHARS = 45;

export const buildTitlesPrompt = (
  topic: string,
  count: number = DEFAULT_TITLE_COUNT,
): ChatMessage[] => [
  {
    role: "system",
    content: `${NEUTRAL_FOUNDATION}

${HOMEPAGE_KEYWORD_GUARD}

TUGAS
Hasilkan tepat ${count} opsi judul artikel dari ide topik yang diberikan pengguna.

BATAS PANJANG (BATAS KERAS — judul yang melewatinya dianggap gagal)
- Setiap judul ${TITLE_MIN_CHARS}-${TITLE_MAX_CHARS} karakter, termasuk spasi dan tanda baca.
- HITUNG karakternya satu per satu sebelum menjawab. Judul ${TITLE_MAX_CHARS + 1} karakter atau lebih terpotong di hasil pencarian dan kehilangan bagian terpentingnya.
- Bila sebuah judul terlalu panjang, pangkas kata yang tidak menambah makna. Jangan menyingkat dengan tanda titik tiga.

KRITERIA SETIAP JUDUL
- Keyword utama muncul di sepertiga awal judul, secara alami.
- Menjanjikan satu manfaat atau jawaban yang jelas. Pembaca harus tahu apa yang akan ia dapat.
- Spesifik pada topik yang diminta, bukan judul umum yang bisa dipakai proyek properti mana pun.
- Tanpa tanda kutip, tanpa tanda seru, tanpa emoji, tanpa ALL CAPS.
- Tanpa angka harga/cicilan (topik volatil).
- Tanpa nama merek di belakang judul. Jangan menambahkan " | nama proyek" atau sejenisnya; sistem menanganinya terpisah bila perlu.

WAJIB: variasikan format antar judul. Dari ${count} judul, sertakan minimal:
- 1 LISTICLE berangka. Pola: "7 Hal yang ...", "5 Kesalahan ...", "10 Pertanyaan ...".
- 1 HOW-TO. Pola: "Cara ...", "Begini Cara ...".
- 1 PANDUAN. Pola: "Panduan Memilih ...", "Panduan Lengkap ...".
- 1 PERTANYAAN yang benar-benar diketik orang di pencarian. Pola: "Apakah ...", "Berapa Lama ...", "Kapan Sebaiknya ...".
Sisa judul pilih bebas dari: perbandingan (X vs Y), studi kasus, atau sudut pandang lokasi/lingkungan.
Jangan ada dua judul dengan pola pembuka atau angle yang sama.

KELAYAKAN GOOGLE DISCOVER (judul yang muncul di feed, bukan hanya hasil pencarian)
- Bangkitkan rasa ingin tahu yang JUJUR: janjinya harus benar-benar dijawab artikel. Jangan clickbait, jangan melebih-lebihkan, jangan menahan informasi ("Anda tidak akan percaya...").
- Sentuh sudut yang manusiawi: keputusan, pertimbangan, pengalaman tinggal, atau kesalahan umum yang ingin dihindari pembaca.
- Lebih baik judul yang terasa seperti ditulis editor manusia daripada judul kaku penuh keyword. Natural mengalahkan kaku.
- Hindari pola template AI ("Panduan Lengkap X: Semua yang Perlu Anda Tahu"). Buat pembuka yang segar.
- Boleh memakai sudut lokasi/waktu yang spesifik dan tetap relevan lama (evergreen), bukan yang cepat basi.

${jsonContract(`{"titles": ["judul 1", "judul 2", ..., "judul ${count}"]}`, [
  `Array "titles" berisi tepat ${count} string.`,
  `Setiap judul ${TITLE_MIN_CHARS}-${TITLE_MAX_CHARS} karakter. Periksa ulang panjangnya sebelum menjawab.`,
  "Urutkan dari judul terkuat ke terlemah menurut penilaianmu.",
])}`,
  },
  {
    role: "user",
    content: `Ide topik: ${topic}`,
  },
];

// ---------------------------------------------------------------------------
// Outline
// ---------------------------------------------------------------------------

export const buildOutlinePrompt = (
  title: string,
  topic = "",
): ChatMessage[] => [
  {
    role: "system",
    content: `${NEUTRAL_FOUNDATION}

${HOMEPAGE_KEYWORD_GUARD}

TUGAS
Susun kerangka (outline) artikel dari judul yang sudah dipilih pengguna.

KETERIKATAN PADA JUDUL (WAJIB)
- Kerangka ini HARUS menjadi turunan langsung dari judul. Setiap bagian wajib membantu menuntaskan janji judul.
- Jangan berpindah topik, jangan memperluas cakupan ke hal yang tidak dijanjikan judul.
- Bila judul menyebut angka (mis. "7 Hal"), jumlah bagian inti harus konsisten dengan angka itu.

STRUKTUR
- 5-8 bagian H2. Setiap H2 boleh memiliki 0-4 sub-bagian H3.
- Alur harus terasa wajar bagi pembaca yang sedang mempertimbangkan keputusan:
  konteks/pertanyaan awal → pembahasan inti bertahap → hal yang perlu dipertimbangkan → langkah lanjut.
- Setiap H2 hanya membahas satu gagasan. Jangan ada dua bagian yang tumpang tindih.
- Semua bagian harus menjawab janji di judul. Jangan menambah bagian yang tidak dijanjikan judul.
- Jangan membuat bagian penutup berisi promosi. Paragraf penutup ditulis di tahap artikel, bukan sebagai bagian kerangka.

WAJIB ADA SATU BAGIAN BERBASIS DATA
- Sertakan minimal satu bagian yang menuntut angka, tren, atau temuan yang bisa dirujuk ke sumber resmi (mis. kondisi pasar, tren harga kawasan, data demografi, biaya rata-rata, aturan yang berlaku).
- Sistem akan mencari data untuk bagian itu dari lembaga resmi dan media kredibel, lalu memberikannya ke tahap penulisan. Kerangka yang seluruhnya berisi opini membuat artikel kehilangan otoritas.
- Rumuskan headingnya agar jelas apa yang dicari, bukan sekadar "Data dan Fakta".

KEKUATAN SEO
- Sebar variasi keyword dan pertanyaan nyata yang diketik pembaca, bukan pengulangan keyword yang sama.
- Heading berupa frasa yang bermakna, bukan satu kata.
- Jangan menaruh nama proyek di heading. Heading yang mengklaim nama proyek membuat artikel bersaing dengan halaman utama situs.

KEKUATAN GEO (agar mudah dikutip mesin AI seperti ChatGPT/Perplexity/AI Overview)
- Sertakan minimal satu bagian yang menjawab satu pertanyaan spesifik secara langsung dan bisa dikutip utuh.
- Sertakan minimal satu bagian yang cocok disajikan sebagai perbandingan atau daftar terstruktur.
- Setiap heading harus dapat dipahami sendiri tanpa membaca heading lain, karena mesin AI mengutip per bagian.

BATASAN
- Ini kerangka, bukan artikel. Tiap heading maksimal ~9 kata dan bukan kalimat lengkap berparagraf.
- Jangan menuliskan isi paragraf.

${jsonContract(
  `{"sections": [{"heading": "Judul H2", "subheadings": ["Judul H3", "Judul H3"]}]}`,
  [
    'Array "sections" berisi 5-8 objek.',
    '"subheadings" selalu ada sebagai array; pakai array kosong bila tidak ada sub-bagian.',
  ],
)}`,
  },
  {
    role: "user",
    // Topik asli disertakan sebagai konteks niat penulis. Judul tetap yang
    // mengikat; topik hanya menjelaskan sudut yang dimaksud saat judul dibuat.
    content: topic.trim()
      ? `Judul artikel: ${title}

Topik/brief asli penulis (konteks niat, jangan menggantikan judul): ${topic.trim()}`
      : `Judul artikel: ${title}`,
  },
];

export type OutlineSection = { heading: string; subheadings?: string[] };

// ---------------------------------------------------------------------------
// Artikel penuh
// ---------------------------------------------------------------------------

export const DEFAULT_ARTICLE_WORDS = 1200;
export const MIN_ARTICLE_WORDS = 400;
export const MAX_ARTICLE_WORDS = 3000;

export const buildArticlePrompt = (
  title: string,
  outline: OutlineSection[],
  targetWords: number = DEFAULT_ARTICLE_WORDS,
  sources: ToolSource[] = [],
  topic = "",
): ChatMessage[] => {
  // Sumber data faktual yang sudah tersaring otoritasnya oleh sistem. Model
  // hanya melihat daftar ini, jadi ia tidak mungkin menautkan domain pesaing.
  const sourcesList = sources
    .map(
      (source, index) =>
        `  [${index + 1}] ${source.source_name} — ${source.source_url}\n      ${source.data_summary}${
          source.tahun_data ? ` (tahun data: ${source.tahun_data})` : ""
        }`,
    )
    .join("\n");

  const outlineText = outline
    .map((section, index) => {
      const subs = (section.subheadings || [])
        .map((sub) => `   - ${sub}`)
        .join("\n");
      return `${index + 1}. ${section.heading}${subs ? `\n${subs}` : ""}`;
    })
    .join("\n");

  // Toleransi ±10% agar model tidak memotong kalimat di tengah demi mengejar
  // angka persis.
  const lower = Math.round(targetWords * 0.9);
  const upper = Math.round(targetWords * 1.1);

  // Perkiraan alokasi per bagian membantu model membagi panjang secara merata
  // alih-alih menulis panjang di awal lalu kehabisan tenaga di akhir.
  const perSection = Math.max(
    80,
    Math.round(targetWords / Math.max(1, outline.length)),
  );

  return [
    {
      role: "system",
      content: `${ARTICLE_FOUNDATION}

${HOUSE_STYLE}

${OUTPUT_DISCIPLINE}

${HOMEPAGE_KEYWORD_GUARD}

TUGAS
Tulis artikel lengkap berdasarkan judul dan kerangka yang sudah disetujui pengguna.

PANJANG
- Target ${targetWords} kata. Rentang yang diterima ${lower}-${upper} kata.
- Bagi panjang secara proporsional: sekitar ${perSection} kata per bagian H2.
- Jangan menulis pendek lalu berhenti sebelum kerangka selesai. Semua bagian kerangka wajib ditulis.
- Jangan menggemukkan tulisan dengan pengulangan untuk mencapai target. Kalau kehabisan bahan pada satu bagian, tambahkan pertimbangan praktis yang relevan, bukan kalimat kosong.

ISI
- Ikuti urutan kerangka. Setiap H2 dan H3 di kerangka menjadi heading di artikel, boleh disempurnakan redaksinya tetapi maknanya tidak boleh berubah.
- Bagian pembuka: langsung ke persoalan pembaca dalam 2-3 kalimat pertama. Tanpa basa-basi.
- Beri kedalaman: jelaskan sebab-akibat, bukan hanya menyebut fitur. Fitur harus dikaitkan dengan dampaknya bagi penghuni.
- Pakai pengetahuan properti yang kamu miliki: mekanisme pembiayaan, hal legal yang perlu diperiksa, tanda kualitas bangunan, cara menilai kawasan. Inilah yang membedakan tulisan penulis berpengalaman dari rangkuman internet.
- Sertakan hal yang perlu dipertimbangkan atau dicek pembaca, bukan hanya sisi positif. Ini yang membedakan artikel kredibel dari brosur.

${
  sourcesList
    ? `DATA HASIL RISET SISTEM (HANYA ini yang boleh menjadi dasar angka & klaim faktual)
${sourcesList}

${CITATION_CRAFT}

KEWAJIBAN SITASI
- WAJIB mengutip minimal 1 dan maksimal 2 sumber di atas sebagai tautan di dalam kalimat.
- Pakai URL lengkap PERSIS seperti tertulis di daftar. Dilarang menyingkat, menebak, atau memodifikasi URL.
- Setiap angka, persentase, atau klaim faktual yang kamu tulis WAJIB dapat dilacak ke salah satu sumber di atas. Bila sebuah klaim tidak didukung data di atas, tulis secara kualitatif tanpa angka, atau lewati klaim itu.
- Bila sebuah sumber ternyata tidak relevan dengan topik artikel, JANGAN memaksakannya. Lebih baik mengutip satu sumber yang benar-benar nyambung daripada dua yang dipaksakan.
- DILARANG KERAS menautkan domain apa pun yang tidak ada di daftar di atas. Secara khusus dilarang menautkan situs pengembang properti lain, portal jual-beli properti, marketplace, atau blog acak — itu merugikan situs ini.`
    : `TIDAK ADA data hasil riset yang tersedia untuk topik ini. Tulis artikel secara KUALITATIF: tanpa angka statistik spesifik, tanpa persentase, dan TANPA tautan eksternal apa pun.`
}

KEBIJAKAN TAUTAN
- Tautan yang diizinkan HANYA dua jenis: (a) kutipan sumber data di atas, dan (b) satu tautan ke halaman utama di paragraf penutup.
- JANGAN menautkan artikel lain di situs ini. Tautan antar artikel yang dipaksakan terbaca tidak natural dan tidak menambah nilai bagi pembaca.
- JANGAN menautkan halaman internal lain (cluster, pricelist, kontak, dan sejenisnya). Bila pembaca perlu ke sana, halaman utama sudah menjadi pintunya.

${CTA_CRAFT}

KONTRAK KELUARAN (WAJIB)
- Balas HANYA dengan potongan HTML isi artikel. Tanpa penjelasan, tanpa catatan, tanpa code fence, tanpa markdown.
- JANGAN memakai <h1>. Judul artikel sudah menjadi H1 di halaman.
- JANGAN memakai <html>, <head>, <body>, <script>, <style>, <iframe>, atau atribut style/class.
- Tag yang boleh dipakai: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a href="...">, <table>, <thead>, <tbody>, <tr>, <th>, <td>.
- Bila menyajikan perbandingan, pakai <table> lengkap dengan <thead> berisi <th>, dan <tbody> berisi <td>. Setiap baris harus punya jumlah sel yang sama. Isi tabel tidak boleh berupa angka harga.
- Daftar bertingkat ditulis sebagai <ul> di dalam <li>, bukan dengan indentasi teks.
- Elemen terakhir keluaranmu HARUS paragraf penutup berisi tautan ke halaman utama, sesuai aturan PARAGRAF PENUTUP di atas.`,
    },
    {
      role: "user",
      content: `Judul: ${title}
${topic.trim() ? `\nTopik/brief asli penulis (konteks, bukan pengganti judul): ${topic.trim()}\n` : ""}
Kerangka yang disetujui (WAJIB diikuti urutan dan cakupannya):
${outlineText}

Target panjang: ${targetWords} kata.

Artikel harus menuntaskan janji judul di atas menggunakan kerangka itu. Jangan menulis artikel tentang hal lain.`,
    },
  ];
};

// ---------------------------------------------------------------------------
// Editor pass (layer kedua)
// ---------------------------------------------------------------------------
//
// Draft dari penulis diberikan ke peran editor untuk dirapikan: membuang pola
// khas AI, memperbaiki alur, dan menaikkan kualitas TANPA mengubah fakta,
// struktur heading, atau tautan. Ini yang membuat keluaran akhir terbaca
// natural meski model penulisnya berganti-ganti karena rotasi.

export const buildEditorPrompt = (
  title: string,
  draftHtml: string,
): ChatMessage[] => [
  {
    role: "system",
    content: `${ARTICLE_FOUNDATION}

${HOUSE_STYLE}

${OUTPUT_DISCIPLINE}

${HOMEPAGE_KEYWORD_GUARD}

TUGAS
Kamu adalah EDITOR. Kamu menerima draft HTML artikel dari penulis. Rapikan dan tingkatkan kualitasnya sampai layak tayang di majalah properti nasional, lalu kembalikan versi final.

YANG HARUS KAMU LAKUKAN
- Buang setiap pola khas tulisan mesin sesuai GAYA PENULISAN di atas: frasa klise, pembuka basi, transisi yang ditempel, kalimat rangkuman yang mengulang, panjang paragraf yang seragam.
- Perkuat kalimat lemah, pangkas kata pengisi, dan variasikan panjang kalimat agar berirama manusiawi.
- Pastikan setiap bagian benar-benar menjawab headingnya dan mengalir wajar ke bagian berikutnya.
- Periksa penyebutan proyek: bila nama proyek muncul lebih dari 2-3 kali di badan artikel atau diselipkan di bagian yang membahas konsep umum, ganti dengan rujukan yang lebih wajar atau hapus penyebutannya.
- Periksa paragraf penutup: ia harus terbaca sebagai kelanjutan isi artikel, bukan blok promosi. Bila terasa seperti template, tulis ulang kalimatnya — tetapi PERTAHANKAN tautannya.
- Jaga akurasi: JANGAN menambah angka, nama, klaim, atau fakta baru yang tidak ada di draft. Bila draft memuat klaim yang jelas melanggar aturan fakta, hapus klaim itu — jangan menggantinya dengan karangan.

YANG DILARANG DIUBAH
- JANGAN mengubah, menambah, atau menghapus tautan <a>. Pertahankan setiap atribut href PERSIS seperti di draft, termasuk jumlahnya. Teks anchor boleh dihaluskan agar mengalir, tetapi href tidak boleh berubah.
- Bila draft memuat tautan ke halaman utama di paragraf penutup, tautan itu WAJIB tetap ada. Ia backlink yang disengaja, bukan sisa yang perlu dibersihkan.
- Bila draft TIDAK punya tautan, jangan menambah tautan.
- JANGAN mengubah makna atau urutan bagian. Redaksi heading boleh dihaluskan, tetapi maknanya tetap.
- JANGAN memperpendek artikel secara drastis. Panjang akhir harus setara draft (toleransi wajar), bukan ringkasan.

KONTRAK KELUARAN (WAJIB)
- Balas HANYA dengan potongan HTML isi artikel final. Tanpa penjelasan, tanpa catatan, tanpa code fence, tanpa markdown.
- JANGAN memakai <h1>, <html>, <head>, <body>, <script>, <style>, <iframe>, atau atribut style/class.
- Tag yang boleh dipakai: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a> (href dipertahankan apa adanya), <table>, <thead>, <tbody>, <tr>, <th>, <td>.`,
  },
  {
    role: "user",
    content: `Judul: ${title}

Draft HTML untuk dirapikan:
${draftHtml}`,
  },
];

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export const buildSeoPrompt = (
  title: string,
  plainContent: string,
): ChatMessage[] => [
  {
    role: "system",
    content: `${NEUTRAL_FOUNDATION}

${HOMEPAGE_KEYWORD_GUARD}

TUGAS
Buat setelan SEO LENGKAP untuk artikel berdasarkan judul dan ringkasan isinya.

ATURAN TIAP FIELD

metaTitle — judul untuk hasil pencarian
- Panjang ideal 50-60 karakter. JANGAN melebihi 60 karakter; di atas itu Google memotongnya dan menggantinya dengan tanda titik tiga.
- Letakkan keyword utama di BAGIAN DEPAN judul.
- Buat menarik untuk diklik: janjikan manfaat atau jawaban yang jelas, bukan judul datar.
- Bila ingin menambahkan nama merek di belakang, pakai " | ${BRAND_SHORT_NAME}" dan HANYA bila total keseluruhan masih di bawah 60 karakter. Jangan pernah memakai nama merek versi panjang di sini.
- Tanpa tanda kutip, tanpa tanda seru, tanpa ALL CAPS.

metaDescription — ringkasan di hasil pencarian
- Panjang ideal 150-160 karakter. JANGAN melebihi 160 karakter.
- Masukkan keyword utama secara natural, bukan ditempel di awal secara kaku.
- Berikan ringkasan yang jelas tentang isi artikel, bukan mengulang metaTitle.
- Akhiri dengan ajakan singkat, misalnya "Baca selengkapnya", "Pelajari di sini", atau "Cek panduannya".
- Karena versi seluler kadang hanya menampilkan 120-140 karakter, letakkan informasi terpenting di awal.
- Tanpa angka harga atau cicilan.

excerpt — ringkasan yang tampil di kartu artikel situs
- MAKSIMAL 160 karakter. Ini batas keras kolom database.
- 1-2 kalimat yang membuat pembaca ingin membuka artikel.
- Boleh mirip metaDescription tetapi TIDAK identik: excerpt ditulis untuk pembaca yang sudah ada di situs, jadi tanpa ajakan gaya hasil pencarian dan lebih mengalir.
- Tanpa angka harga atau cicilan.

slug — potongan URL
- Huruf kecil semua, kata dipisah tanda hubung, hanya a-z dan 0-9.
- Maksimal 6 kata, tanpa kata sambung berlebihan (dan, di, untuk, yang).
- Mengandung keyword utama.

focusKeyword
- Satu frasa 2-4 kata yang paling mungkin benar-benar diketik pembaca untuk menemukan artikel ini.
- Pilih frasa yang mencerminkan TOPIK artikel, bukan nama proyek. Nama proyek adalah kata kunci halaman utama.

PENTING
- Semua field harus mencerminkan isi artikel yang diberikan, bukan tema umum properti.
- Jangan mengarang keyword atau klaim yang tidak dibahas artikel.
- Hitung panjang karakter dengan cermat sebelum menjawab. Field yang melebihi batas dianggap gagal.

${jsonContract(
  `{"metaTitle": "...", "metaDescription": "...", "excerpt": "...", "slug": "...", "focusKeyword": "..."}`,
)}`,
  },
  {
    role: "user",
    content: `Judul: ${title}

Ringkasan isi artikel:
${plainContent.slice(0, 2500)}`,
  },
];

// ---------------------------------------------------------------------------
// Alat teks di editor
// ---------------------------------------------------------------------------

export type TextToolMode = "rewrite" | "expand" | "shorten" | "proofread";

const TEXT_TOOL_INSTRUCTIONS: Record<TextToolMode, string> = {
  rewrite:
    "Tulis ulang teks agar lebih jernih dan enak dibaca TANPA mengubah makna, fakta, atau angka apa pun. Perbaiki alur kalimat dan pilihan kata. Jangan menambah informasi baru.",
  expand:
    "Kembangkan teks menjadi lebih rinci dan berguna, tetap padu dengan konteks aslinya. Kembangkan dengan penjelasan sebab-akibat dan pertimbangan praktis. DILARANG menambah angka, nama, atau klaim baru yang tidak ada di teks asli.",
  shorten:
    "Ringkas teks menjadi lebih padat tanpa membuang poin penting maupun mengubah maknanya. Buang pengulangan dan kata pengisi lebih dulu.",
  proofread:
    "Perbaiki HANYA ejaan, tata bahasa, dan tanda baca. Jangan mengubah makna, gaya, urutan gagasan, pilihan kata yang sudah benar, maupun angka.",
};

export const buildTextToolPrompt = (
  mode: TextToolMode,
  text: string,
): ChatMessage[] => [
  {
    role: "system",
    content: `${NEUTRAL_FOUNDATION}

TUGAS
${TEXT_TOOL_INSTRUCTIONS[mode]}

KONTRAK KELUARAN (WAJIB)
- Balas HANYA dengan teks hasil akhir.
- Tanpa HTML, tanpa markdown, tanpa tanda kutip pembungkus.
- Tanpa penjelasan, tanpa komentar, tanpa label seperti "Hasil:" atau "Berikut:".
- Pertahankan bahasa asli teks. Bila teks berbahasa Indonesia, hasilnya Indonesia.
- Pertahankan setiap angka dan nama yang sudah ada di teks asli persis seperti aslinya.`,
  },
  {
    role: "user",
    content: text,
  },
];

// ---------------------------------------------------------------------------
// Metadata gambar
// ---------------------------------------------------------------------------

export const buildImageMetaPrompt = (
  context: string,
  photoDescription: string,
): ChatMessage[] => [
  {
    role: "system",
    content: `${NEUTRAL_FOUNDATION}

TUGAS
Buat metadata profesional untuk sebuah gambar yang akan dipakai di artikel properti.

ATURAN TIAP FIELD

name — judul internal untuk media library
- 4-8 kata, deskriptif, mudah dicari kembali oleh tim redaksi.
- Pola yang disukai: objek utama + konteks. Misalnya "Fasad Rumah Dua Lantai Kawasan Hijau".
- Tanpa nama berkas mentah, tanpa deretan angka acak, tanpa format slug bertanda hubung.

alt — alt text untuk SEO dan pembaca layar
- Maksimal 125 karakter. Satu frasa padat, bukan paragraf.
- Jelaskan APA yang terlihat, bukan kesimpulan atau perasaan. Pembaca layar membacakannya apa adanya.
- JANGAN memulai dengan "Gambar", "Foto", "Ilustrasi", atau "Tampilan".
- Sebut kata kunci relevan hanya bila memang terlihat. Jangan menumpuk keyword.

caption — keterangan di bawah gambar
- Satu kalimat yang MENAMBAH informasi, bukan mengulang alt text.
- Boleh string kosong bila gambar tidak butuh keterangan.
- JANGAN menuliskan kredit fotografer, nama penyedia foto, atau simbol hak cipta. Sistem menambahkan atribusi secara otomatis dan terpisah; menulisnya sendiri akan membuat kredit ganda.

PENTING
- Deskripsikan HANYA apa yang disebut deskripsi foto atau yang jelas tersirat dari nama berkas.
- Bila deskripsi foto sangat umum atau kosong, buat metadata yang umum pula. JANGAN mengaitkannya dengan cluster atau tipe unit tertentu tanpa dasar — itu halusinasi yang merugikan pembaca.
- Bahasa Indonesia, nada redaksional, bukan bahasa iklan.

${jsonContract(`{"name": "...", "alt": "...", "caption": "..."}`)}`,
  },
  {
    role: "user",
    content: `Konteks artikel: ${context}
Deskripsi foto dari penyedia: ${photoDescription || "(tidak ada deskripsi — buat metadata yang umum dan aman)"}`,
  },
];
