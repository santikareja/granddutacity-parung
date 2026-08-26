// Aturan kesiapan publish & estimasi waktu baca untuk CMS kustom.
// Server-side & client-safe (murni fungsi, tanpa akses DB).
//
// Dipakai oleh:
//   - article-write.ts  → validasi saat publish manual (status='published').

import { lexicalToPlaintext } from "./lexical";

const WORDS_PER_MINUTE = 200;
const MIN_TITLE_LENGTH = 10;
const MIN_WORD_COUNT = 120;

// Hitung jumlah kata dari plaintext Lexical.
const countWords = (content: unknown): number => {
  const plain = lexicalToPlaintext(content).replace(/\s+/g, " ").trim();
  if (!plain) return 0;
  return plain.split(" ").filter((w) => w.length > 0).length;
};

// Estimasi waktu baca (menit), minimal 1.
export const computeReadingTime = (content: unknown): number => {
  const words = countWords(content);
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

export type PublishReadinessInput = {
  title?: string | null;
  content?: unknown;
  excerpt?: string | null;
  seoMetaDescription?: string | null;
  categoryIds?: number[];
  featuredImageId?: number | null;
};

// Kembalikan daftar masalah (bahasa Indonesia). Array kosong = siap publish.
export const validatePublishReadiness = (
  input: PublishReadinessInput,
): string[] => {
  const issues: string[] = [];

  const title = (input.title ?? "").trim();
  if (title.length < MIN_TITLE_LENGTH) {
    issues.push(`Judul minimal ${MIN_TITLE_LENGTH} karakter.`);
  }

  const words = countWords(input.content);
  if (words < MIN_WORD_COUNT) {
    issues.push(`Konten minimal ${MIN_WORD_COUNT} kata (saat ini ${words}).`);
  }

  const hasExcerpt = Boolean(input.excerpt?.trim());
  const hasMetaDesc = Boolean(input.seoMetaDescription?.trim());
  if (!hasExcerpt && !hasMetaDesc) {
    issues.push("Isi excerpt atau meta description terlebih dahulu.");
  }

  if (!input.categoryIds || input.categoryIds.length < 1) {
    issues.push("Pilih minimal satu kategori.");
  }

  if (!input.featuredImageId) {
    issues.push("Tetapkan gambar utama.");
  }

  return issues;
};
