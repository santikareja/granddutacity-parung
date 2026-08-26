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
  INTERNAL_LINKS,
  jsonContract,
} from "./brand-facts";
import type { ChatMessage } from "./client";

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

export const buildOutlinePrompt = (title: string): ChatMessage[] => [
  {
    role: "system",
    content: `${FOUNDATION}

TUGAS
Susun kerangka (outline) artikel dari judul yang sudah dipilih pengguna.

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
    content: `Judul artikel: ${title}`,
  },
];

export type OutlineSection = { heading: string; subheadings?: string[] };

// ---------------------------------------------------------------------------
// Artikel penuh
// ---------------------------------------------------------------------------

export const DEFAULT_ARTICLE_WORDS = 1200;
export const MIN_ARTICLE_WORDS = 400;
export const MAX_ARTICLE_WORDS = 3000;

const ALLOWED_LINK_PATHS = INTERNAL_LINKS.map((link) => link.path).join(", ");

export const buildArticlePrompt = (
  title: string,
  outline: OutlineSection[],
  targetWords: number = DEFAULT_ARTICLE_WORDS,
): ChatMessage[] => {
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

TAUTAN INTERNAL
- Sisipkan 2-4 tautan internal yang benar-benar relevan dengan kalimatnya, memakai anchor teks deskriptif (bukan "klik di sini").
- Path yang boleh dipakai HANYA: ${ALLOWED_LINK_PATHS}
- Jangan menautkan ke domain luar.

KONTRAK KELUARAN (WAJIB)
- Balas HANYA dengan potongan HTML isi artikel. Tanpa penjelasan, tanpa catatan, tanpa code fence, tanpa markdown.
- JANGAN memakai <h1>. Judul artikel sudah menjadi H1 di halaman.
- JANGAN memakai <html>, <head>, <body>, <script>, <style>, <iframe>, atau atribut style/class.
- Tag yang boleh dipakai: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a href="/...">, <table>, <thead>, <tbody>, <tr>, <th>, <td>.
- Bila menyajikan perbandingan, pakai <table> lengkap dengan <thead> berisi <th>, dan <tbody> berisi <td>. Setiap baris harus punya jumlah sel yang sama. Isi tabel tidak boleh berupa angka harga.
- Daftar bertingkat ditulis sebagai <ul> di dalam <li>, bukan dengan indentasi teks.
- JANGAN menulis paragraf penutup berisi ajakan ke homepage; sistem menambahkan CTA itu otomatis. Menulisnya sendiri akan membuat CTA ganda.`,
    },
    {
      role: "user",
      content: `Judul: ${title}

Kerangka yang disetujui:
${outlineText}

Target panjang: ${targetWords} kata.`,
    },
  ];
};

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
Buat setelan SEO untuk artikel berdasarkan judul dan ringkasan isinya.

ATURAN TIAP FIELD
- metaTitle: 50-60 karakter. Mengandung keyword utama di bagian awal. Boleh diakhiri " | ${BRAND_NAME}" HANYA bila total masih di bawah 60 karakter.
- metaDescription: 145-160 karakter. Merangkum isi nyata artikel dan memberi alasan mengklik. Bukan sekadar mengulang judul. Tanpa angka harga.
- slug: huruf kecil semua, kata dipisah tanda hubung, hanya a-z dan 0-9, tanpa kata sambung berlebihan, maksimal 6 kata.
- focusKeyword: satu frasa 2-4 kata yang paling mungkin diketik pembaca untuk menemukan artikel ini.

PENTING
- Semua field harus mencerminkan isi artikel yang diberikan, bukan tema umum properti.
- Jangan mengarang keyword yang tidak dibahas artikel.

${jsonContract(
  `{"metaTitle": "...", "metaDescription": "...", "slug": "...", "focusKeyword": "..."}`,
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
Buat metadata untuk sebuah gambar yang akan dipakai di artikel.

ATURAN TIAP FIELD
- name: nama internal singkat dan deskriptif untuk memudahkan pencarian di media library. Maksimal 8 kata.
- alt: alt text deskriptif untuk SEO dan pembaca layar. Maksimal 125 karakter. Jelaskan APA yang terlihat di gambar. Jangan memulai dengan "gambar" atau "foto".
- caption: satu kalimat keterangan. Boleh string kosong bila gambar tidak butuh keterangan.

PENTING
- Deskripsikan hanya apa yang disebut deskripsi foto. Jangan mengarang objek, lokasi, atau nama fasilitas yang tidak disebutkan.
- Bila deskripsi foto sangat umum, buat alt text yang umum pula. Jangan mengaitkannya dengan cluster atau tipe unit tertentu tanpa dasar.

${jsonContract(`{"name": "...", "alt": "...", "caption": "..."}`)}`,
  },
  {
    role: "user",
    content: `Konteks artikel: ${context}
Deskripsi foto dari penyedia: ${photoDescription || "(tidak ada deskripsi)"}`,
  },
];
