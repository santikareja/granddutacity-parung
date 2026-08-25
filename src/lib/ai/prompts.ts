// Prompt builder untuk alur AI Content Studio. Semua output Bahasa Indonesia,
// gaya majalah properti/real estate premium, SEO-friendly, hook kuat.
// Referensi brand & lokasi: Grand Duta City Parung, South of Jakarta, Bogor.

import type { ChatMessage } from "./client";

const BRAND = "Grand Duta City Parung";
const LOCATION = "Parung, Bogor Selatan (South of Jakarta)";

const QUALITY_GUARDRAILS = `Kamu adalah editor konten senior untuk majalah properti/real estate premium di Indonesia.
Standar kualitas: profesional, ringkas, hook kuat, SEO-friendly, tanpa clickbait murahan, tanpa jargon pemasaran berlebihan.
Konteks brand: ${BRAND}, perumahan di ${LOCATION}. Bahasa: Indonesia baku yang enak dibaca.`;

export const buildTitlesPrompt = (topic: string): ChatMessage[] => [
  {
    role: "system",
    content: `${QUALITY_GUARDRAILS}
Tugas: hasilkan tepat 7 opsi judul artikel dari ide topik yang diberikan.
Aturan judul:
- Maksimal ~60 karakter per judul.
- Hook kuat, spesifik, membangkitkan rasa ingin tahu tanpa lebay.
- Variasikan angle (angka, pertanyaan, panduan, insight lokasi properti Parung/South of Jakarta bila relevan).
- Hindari duplikasi angle antar judul.
Keluarkan HANYA JSON valid berbentuk: {"titles": ["judul1", ..., "judul7"]}. Tanpa teks lain.`,
  },
  {
    role: "user",
    content: `Ide topik: "${topic}"`,
  },
];

export const buildOutlinePrompt = (title: string): ChatMessage[] => [
  {
    role: "system",
    content: `${QUALITY_GUARDRAILS}
Tugas: susun outline artikel terstruktur dari judul yang dipilih.
Aturan outline:
- 4-7 bagian H2. Setiap H2 boleh memiliki 0-4 sub-poin H3.
- Alur logis: pembuka/konteks → isi utama → penutup/insight.
- Ringkas; tiap H2/H3 berupa frasa judul, bukan paragraf.
- Jangan menulis isi artikel, hanya kerangka.
Keluarkan HANYA JSON valid berbentuk:
{"sections": [{"heading": "Judul H2", "subheadings": ["H3 a", "H3 b"]}, ...]}. Tanpa teks lain.`,
  },
  {
    role: "user",
    content: `Judul: "${title}"`,
  },
];

export type OutlineSection = { heading: string; subheadings?: string[] };

export const buildArticlePrompt = (
  title: string,
  outline: OutlineSection[],
): ChatMessage[] => {
  const outlineText = outline
    .map((section, index) => {
      const subs = (section.subheadings || [])
        .map((sub) => `   - ${sub}`)
        .join("\n");
      return `${index + 1}. ${section.heading}${subs ? `\n${subs}` : ""}`;
    })
    .join("\n");

  return [
    {
      role: "system",
      content: `${QUALITY_GUARDRAILS}
Tugas: tulis artikel lengkap dari judul + outline yang disetujui.
Panjang: 900-1.200 kata, gaya majalah properti premium, informatif, mengalir.
Aturan output HTML:
- Keluarkan HANYA HTML terstruktur, TANPA <h1>, TANPA <html>/<head>/<body>.
- Gunakan <h2>/<h3> untuk heading, <p> untuk paragraf, <ul>/<ol>/<li> untuk daftar, <table> bila relevan.
- Boleh <strong>/<em> untuk penekanan wajar.
- Sisipkan internal link alami <a href="/..."> ke halaman situs bila relevan (mis. /pricelist-grand-duta-city, /lokasi-akses-grand-duta-city-parung, /kontak).
- JANGAN menulis paragraf CTA penutup ke homepage; sistem menambahkannya otomatis.
- Jangan membungkus output dalam code fence.`,
    },
    {
      role: "user",
      content: `Judul: "${title}"\n\nOutline:\n${outlineText}`,
    },
  ];
};

export const buildSeoPrompt = (
  title: string,
  plainContent: string,
): ChatMessage[] => [
  {
    role: "system",
    content: `${QUALITY_GUARDRAILS}
Tugas: hasilkan setelan SEO untuk artikel.
Aturan:
- metaTitle: <=60 karakter, mengandung keyword utama, boleh diakhiri "| ${BRAND}" bila muat.
- metaDescription: 145-160 karakter, deskriptif, mengundang klik, mengandung keyword.
- slug: huruf kecil, kata dipisah tanda hubung, tanpa diakritik/karakter khusus, ringkas.
- focusKeyword: 1 frasa keyword utama (2-4 kata).
Keluarkan HANYA JSON valid:
{"metaTitle": "...", "metaDescription": "...", "slug": "...", "focusKeyword": "..."}. Tanpa teks lain.`,
  },
  {
    role: "user",
    content: `Judul: "${title}"\n\nRingkasan isi artikel:\n${plainContent.slice(0, 2000)}`,
  },
];

export const buildImageMetaPrompt = (
  context: string,
  photoDescription: string,
): ChatMessage[] => [
  {
    role: "system",
    content: `${QUALITY_GUARDRAILS}
Tugas: buat metadata SEO untuk sebuah gambar artikel.
Aturan:
- name: nama internal singkat & deskriptif (untuk media library).
- alt: alt text deskriptif, SEO-friendly, <=125 karakter, tanpa "gambar/foto" berlebihan.
- caption: keterangan singkat 1 kalimat (boleh kosong bila tak perlu).
Keluarkan HANYA JSON valid:
{"name": "...", "alt": "...", "caption": "..."}. Tanpa teks lain.`,
  },
  {
    role: "user",
    content: `Konteks artikel: "${context}"\nDeskripsi foto: "${photoDescription}"`,
  },
];
