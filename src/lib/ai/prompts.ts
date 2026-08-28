// Prompt builder untuk seluruh fitur AI CMS.
//
// PRINSIP DESAIN
// 1. Setiap prompt dibangun dari blok bersama di brand-facts.ts (persona, aturan
//    anti-halusinasi, gaya penulisan, kontrak keluaran). Ini yang membuat
//    kualitas tetap setara ketika sistem berotasi ke model lain: aturannya tidak
//    bergantung pada "kepintaran bawaan" satu model tertentu.
// 2. Kontrak keluaran selalu ditulis eksplisit di dalam prompt, tidak hanya
//    mengandalkan parameter response_format provider yang dukungannya beragam.
// 3. Semua larangan ditulis konkret dan bisa diperiksa ("jangan memakai frasa X")
//    alih-alih imbauan abstrak ("tulislah dengan natural"), karena hanya bentuk
//    konkret yang dipatuhi model kecil.

import {
  ANTI_HALLUCINATION,
  AI_PERSONA,
  BRAND_NAME,
  HOUSE_STYLE,
  jsonContract,
} from "./brand-facts";
import type { ChatMessage } from "./client";
import type { ToolSource } from "./factual/sources";

// Kandidat tautan internal ke artikel lain, disuplai route dari artikel yang
// benar-benar sudah published. AI TIDAK boleh mengarang slug; ia hanya boleh
// memakai path dari daftar ini. Kosong = tidak ada tautan artikel.
export type RelatedArticle = { title: string; path: string };

// Blok dasar yang dipakai hampir semua tugas.
const FOUNDATION = `${AI_PERSONA}

${ANTI_HALLUCINATION}`;

// ---------------------------------------------------------------------------
// Judul
// ---------------------------------------------------------------------------

export const DEFAULT_TITLE_COUNT = 5;

export const buildTitlesPrompt = (
  topic: string,
  count: number = DEFAULT_TITLE_COUNT,
): ChatMessage[] => [
  {
    role: "system",
    content: `${FOUNDATION}

TUGAS
Hasilkan tepat ${count} opsi judul artikel dari ide topik yang diberikan pengguna.

KRITERIA SETIAP JUDUL
- Panjang 45-60 karakter. Judul lebih panjang terpotong di hasil pencarian.
- Keyword utama muncul di sepertiga awal judul, secara alami.
- Menjanjikan satu manfaat atau jawaban yang jelas. Pembaca harus tahu apa yang akan ia dapat.
- Spesifik pada topik yang diminta, bukan judul umum yang bisa dipakai proyek properti mana pun.
- Tanpa tanda kutip, tanpa tanda seru, tanpa emoji, tanpa ALL CAPS.
- Tanpa angka harga/cicilan (topik volatil).

KELAYAKAN GOOGLE DISCOVER (judul yang muncul di feed, bukan hanya hasil pencarian)
- Bangkitkan rasa ingin tahu yang JUJUR: janjinya harus benar-benar dijawab artikel. Jangan clickbait, jangan melebih-lebihkan, jangan menahan informasi ("Anda tidak akan percaya...").
- Sentuh sudut yang manusiawi: keputusan, pertimbangan, pengalaman tinggal, atau kesalahan umum yang ingin dihindari pembaca.
- Lebih baik judul yang terasa seperti ditulis editor manusia daripada judul kaku penuh keyword. Natural mengalahkan kaku.
- Hindari pola template AI ("Panduan Lengkap X: Semua yang Perlu Anda Tahu"). Buat pembuka yang segar.
- Boleh memakai sudut lokasi/waktu yang spesifik dan tetap relevan lama (evergreen), bukan yang cepat basi.

WAJIB: variasikan format antar judul. Dari ${count} judul, sertakan minimal:
- 1 listicle berangka, contoh pola: "7 Hal yang ..." atau "5 Alasan ..."
- 1 how-to, contoh pola: "Cara ..."
- 1 panduan, contoh pola: "Panduan Lengkap ..." atau "Panduan Memilih ..."
Sisanya pilih bebas dari: pertanyaan yang benar-benar diketik orang di pencarian, perbandingan, atau sudut pandang lokasi/lingkungan.
Jangan ada dua judul dengan pola pembuka atau angle yang sama.

${jsonContract(`{"titles": ["judul 1", "judul 2", ..., "judul ${count}"]}`, [
  `Array "titles" berisi tepat ${count} string.`,
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
    content: `${FOUNDATION}

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
- Jangan membuat bagian penutup berisi promosi; sistem menambahkan CTA sendiri.

KEKUATAN SEO
- Sebar variasi keyword dan pertanyaan nyata yang diketik pembaca, bukan pengulangan keyword yang sama.
- Heading berupa frasa yang bermakna, bukan satu kata.

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
  relatedArticles: RelatedArticle[] = [],
  sources: ToolSource[] = [],
  topic = "",
): ChatMessage[] => {
  // Daftar artikel yang boleh ditautkan (maksimal beberapa agar prompt ringkas).
  const relatedList = relatedArticles
    .slice(0, 6)
    .map((a) => `  ${a.path} — ${a.title}`)
    .join("\n");

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
      content: `${FOUNDATION}

${HOUSE_STYLE}

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
- Sertakan hal yang perlu dipertimbangkan atau dicek pembaca, bukan hanya sisi positif. Ini yang membedakan artikel kredibel dari brosur.
- Boleh menyebut karakter kawasan dan nama cluster/tipe yang ada di daftar fakta. Jangan menyebut angka harga, cicilan, luas, atau stok.

${
  sourcesList
    ? `DATA FAKTUAL YANG TERSEDIA (hasil pencarian sistem — HANYA ini yang boleh menjadi dasar angka & klaim faktual)
${sourcesList}

CARA MEMAKAI DATA
- Setiap angka, persentase, atau klaim faktual yang kamu tulis WAJIB dapat dilacak ke salah satu sumber di atas. Bila sebuah klaim tidak didukung data di atas, tulis secara kualitatif tanpa angka, atau lewati klaim itu.
- Jalin data ke dalam argumen. Jangan menempelkan blok "menurut data ..." yang terputus dari pembahasan.
- Kaitkan data makro dengan implikasi praktis bagi pembaca yang sedang mempertimbangkan hunian. Data mentah tanpa tafsir tidak bernilai.
- Sebutkan tahun data bila relevan agar pembaca tahu kebaruannya.`
    : `TIDAK ADA data eksternal yang tersedia untuk topik ini. Tulis artikel secara KUALITATIF: tanpa angka statistik spesifik, tanpa persentase, dan TANPA tautan eksternal apa pun.`
}

KEBIJAKAN TAUTAN (batas keras — patuhi persis)

A. TAUTAN INTERNAL — total maksimal 3 di seluruh artikel, minimal 1.
- Sistem OTOMATIS menambahkan 1 tautan ke homepage di akhir artikel. Itu sudah memenuhi syarat minimal 1 dan sudah dihitung sebagai 1 dari 3.
- Karena itu kamu boleh menulis MAKSIMAL 2 tautan internal lagi di dalam isi, dan HANYA ke path dari daftar di bawah.
- JANGAN menulis tautan ke homepage/beranda sendiri. Sistem menanganinya; menulisnya sendiri membuat tautan ganda.
- Sisipkan hanya bila benar-benar relevan dengan kalimat tempatnya berada. Nol tautan tambahan lebih baik daripada tautan yang dipaksakan.
- Pakai PERSIS path dari daftar. Dilarang mengarang path/slug.
- Anchor teks deskriptif dan menyatu dalam kalimat. Dilarang "klik di sini", "baca selengkapnya", atau menautkan seluruh kalimat.
${
  relatedList
    ? `\nDAFTAR ARTIKEL YANG BOLEH DITAUTKAN (pilih maksimal dua, hanya bila relevan):\n${relatedList}`
    : "\nTIDAK ADA artikel internal yang tersedia untuk ditautkan. Tulis artikel TANPA tautan internal tambahan di dalam isi."
}

B. TAUTAN EKSTERNAL — maksimal 2, dan HANYA ke source_url pada daftar DATA FAKTUAL di atas.
- Pakai URL lengkap PERSIS seperti tertulis di daftar sumber. Dilarang menyingkat, menebak, atau memodifikasi URL.
- Tautkan hanya untuk mendukung angka/klaim faktual, disisipkan natural di dalam kalimat. Contoh gaya: "Berdasarkan data <a href="URL">Badan Pusat Statistik</a>, indeks harga properti residensial ...".
- DILARANG KERAS menautkan domain apa pun yang tidak ada di daftar sumber. Secara khusus dilarang menautkan situs pengembang properti lain, portal jual-beli properti, marketplace, atau blog acak — itu merugikan situs ini.
- JANGAN membuat daftar "Referensi"/"Sumber" terpisah di akhir artikel. Tautan harus menyatu dalam kalimat.
- Bila daftar DATA FAKTUAL kosong, tulis TANPA tautan eksternal sama sekali.

KONTRAK KELUARAN (WAJIB)
- Balas HANYA dengan potongan HTML isi artikel. Tanpa penjelasan, tanpa catatan, tanpa code fence, tanpa markdown.
- JANGAN memakai <h1>. Judul artikel sudah menjadi H1 di halaman.
- JANGAN memakai <html>, <head>, <body>, <script>, <style>, <iframe>, atau atribut style/class.
- Tag yang boleh dipakai: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a href="/..."> untuk internal, <a href="https://..."> HANYA untuk source_url dari daftar sumber, <table>, <thead>, <tbody>, <tr>, <th>, <td>.
- Bila menyajikan perbandingan, pakai <table> lengkap dengan <thead> berisi <th>, dan <tbody> berisi <td>. Setiap baris harus punya jumlah sel yang sama. Isi tabel tidak boleh berupa angka harga.
- Daftar bertingkat ditulis sebagai <ul> di dalam <li>, bukan dengan indentasi teks.
- JANGAN menulis paragraf penutup berisi ajakan ke homepage; sistem menambahkan CTA itu otomatis. Menulisnya sendiri akan membuat CTA ganda.`,
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
    content: `${AI_PERSONA}

${ANTI_HALLUCINATION}

${HOUSE_STYLE}

TUGAS
Kamu adalah EDITOR. Kamu menerima draft HTML artikel dari penulis. Rapikan dan tingkatkan kualitasnya sampai layak tayang di media properti profesional, lalu kembalikan versi final.

YANG HARUS KAMU LAKUKAN
- Buang setiap pola khas tulisan mesin sesuai GAYA PENULISAN di atas: frasa klise, pembuka basi, transisi yang ditempel, kalimat rangkuman yang mengulang, panjang paragraf yang seragam.
- Perkuat kalimat lemah, pangkas kata pengisi, dan variasikan panjang kalimat agar berirama manusiawi.
- Pastikan setiap bagian benar-benar menjawab headingnya dan mengalir wajar ke bagian berikutnya.
- Jaga akurasi: JANGAN menambah angka, nama, klaim, atau fakta baru yang tidak ada di draft. Bila draft memuat klaim yang jelas melanggar aturan fakta, hapus klaim itu — jangan menggantinya dengan karangan.

YANG DILARANG DIUBAH
- JANGAN mengubah, menambah, atau menghapus tautan <a>. Pertahankan setiap atribut href PERSIS seperti di draft, termasuk jumlahnya. Bila draft tidak punya tautan, jangan menambah tautan.
- JANGAN menambah tautan ke homepage/beranda. Sistem menanganinya otomatis.
- JANGAN mengubah makna atau urutan bagian. Redaksi heading boleh dihaluskan, tetapi maknanya tetap.
- JANGAN memperpendek artikel secara drastis. Panjang akhir harus setara draft (toleransi wajar), bukan ringkasan.

KONTRAK KELUARAN (WAJIB)
- Balas HANYA dengan potongan HTML isi artikel final. Tanpa penjelasan, tanpa catatan, tanpa code fence, tanpa markdown.
- JANGAN memakai <h1>, <html>, <head>, <body>, <script>, <style>, <iframe>, atau atribut style/class.
- Tag yang boleh dipakai: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a> (internal maupun eksternal, href dipertahankan apa adanya), <table>, <thead>, <tbody>, <tr>, <th>, <td>.
- JANGAN menulis paragraf penutup berisi ajakan ke homepage; sistem menambahkannya otomatis.`,
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
    content: `${FOUNDATION}

TUGAS
Buat setelan SEO LENGKAP untuk artikel berdasarkan judul dan ringkasan isinya.

ATURAN TIAP FIELD

metaTitle — judul untuk hasil pencarian
- Panjang ideal 50-60 karakter. JANGAN melebihi 60 karakter; di atas itu Google memotongnya dan menggantinya dengan tanda titik tiga.
- Letakkan keyword utama di BAGIAN DEPAN judul.
- Buat menarik untuk diklik: janjikan manfaat atau jawaban yang jelas, bukan judul datar.
- Tambahkan " | ${BRAND_NAME}" di bagian belakang HANYA bila total keseluruhan masih di bawah 60 karakter. Bila tidak muat, hilangkan nama merek — panjang lebih penting.
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
    content: `${AI_PERSONA}

${ANTI_HALLUCINATION}

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
    content: `${AI_PERSONA}

${ANTI_HALLUCINATION}

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
- Bila deskripsi foto sangat umum atau kosong, buat metadata yang umum pula. JANGAN mengaitkannya dengan Cluster Ladera/Cascada atau tipe unit tertentu tanpa dasar — itu halusinasi yang merugikan pembaca.
- Bahasa Indonesia, nada redaksional, bukan bahasa iklan.

${jsonContract(`{"name": "...", "alt": "...", "caption": "..."}`)}`,
  },
  {
    role: "user",
    content: `Konteks artikel: ${context}
Deskripsi foto dari penyedia: ${photoDescription || "(tidak ada deskripsi — buat metadata yang umum dan aman)"}`,
  },
];
