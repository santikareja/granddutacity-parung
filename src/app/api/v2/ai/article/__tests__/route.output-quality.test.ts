// Test integrasi pemeriksa mutu pada POST /api/v2/ai/article.
//
// KENAPA TEST INI ADA
// Modul output-quality diuji unit terpisah, tetapi PERILAKU YANG PALING BERISIKO
// ada di integrasinya: cacat berat melempar di dalam `parse`, dan `runAiTask`
// memperlakukan itu sebagai kegagalan model lalu BEROTASI. Efek sampingnya harus
// dipastikan benar:
//
//   - Keluaran cacat memicu rotasi, dan bila model berikutnya bersih, permintaan
//     tetap BERHASIL. Ini yang membuat pemeriksa menaikkan mutu alih-alih
//     menambah kegagalan.
//   - Bila SEMUA kandidat cacat, permintaan gagal dengan pesan yang menyebut
//     penyebabnya — bukan menyimpan artikel rusak lalu menandainya.
//   - Editor yang merusak keluaran ditolak, dan handler jatuh ke draft penulis
//     yang sudah lolos.
//   - Catatan mutu (subjektif) TIDAK memblokir dan sampai ke klien.

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildArticleRequest,
  chatCompletionMock,
  requireApiUserMock,
  resetAiArticleMocks,
  resolveAiCandidatesMock,
  FAKE_AI_CONFIG,
  validArticleBody,
} from "@/test/helpers/ai-article-mocks";

vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, chatCompletion: chatCompletionMock };
});

vi.mock("@/lib/v2-admin/ai-rotation", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/v2-admin/ai-rotation")>();
  return { ...actual, resolveAiCandidates: resolveAiCandidatesMock };
});

vi.mock("@/lib/v2-auth/api-guard", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/v2-auth/api-guard")>();
  return { ...actual, requireApiUser: requireApiUserMock };
});

const { POST } = await import("../route");

/** Artikel bersih sepanjang >150 kata agar pemeriksaan struktur aktif. */
const CLEAN_HTML =
  "<h2>Menghitung Kemampuan Angsuran</h2>" +
  "<p>Bank menilai kemampuan bayar dari penghasilan bersih, bukan penghasilan kotor. Cicilan yang disetujui biasanya dibatasi sekitar sepertiga penghasilan bulanan, dan batas itu sudah mencakup cicilan lain yang masih berjalan.</p>" +
  "<p>Hitung dulu sebelum melihat pilihan unit.</p>" +
  "<p>Kesalahan yang sering terjadi adalah menyiapkan uang muka sampai pas, lalu kehabisan kas ketika biaya notaris, BPHTB, dan provisi bank jatuh tempo bersamaan sekitar dua minggu sebelum akad kredit ditandatangani.</p>" +
  "<h3>Dokumen yang Perlu Disiapkan</h3>" +
  "<p>Siapkan slip gaji tiga bulan terakhir, rekening koran, dan NPWP. Bank meminta ketiganya sebelum memproses pengajuan lebih jauh.</p>" +
  "<p>Mengumpulkannya lebih awal memangkas waktu tunggu secara nyata.</p>";

/** Keluaran dengan aksara Tionghoa: cacat berat. */
const FOREIGN_HTML = CLEAN_HTML.replace(
  "penghasilan bersih",
  "penghasilan 收入 bersih",
);

/** Keluaran dengan markdown tercampur: cacat berat. */
const MARKDOWN_HTML = `## Judul Markdown\n${CLEAN_HTML}`;

/** Keluaran dengan placeholder: cacat berat. */
const PLACEHOLDER_HTML = `${CLEAN_HTML}<p>[tambahkan data suku bunga di sini]</p>`;

/** Keluaran layak tapi penuh klise: hanya catatan mutu. */
const CLICHE_HTML =
  "<h2>Pendahuluan</h2>" +
  "<p>Di era modern ini, memilih hunian adalah keputusan besar yang membutuhkan pertimbangan matang dari berbagai aspek penting bagi keluarga.</p>" +
  "<p>Penting untuk dicatat bahwa lokasi menentukan kenyamanan harian seluruh anggota keluarga yang tinggal di dalamnya selama bertahun-tahun.</p>" +
  "<p>Selain itu, kualitas bangunan merupakan solusi tepat untuk memastikan investasi cerdas Anda memberikan nilai maksimal di masa depan nanti.</p>" +
  "<h3>Kesimpulan Akhir</h3>" +
  "<p>Sebagai kesimpulan, memilih hunian yang tepat memerlukan pertimbangan menyeluruh terhadap lokasi, fasilitas, dan kualitas bangunan tersebut.</p>";

type ArticleResponse = {
  html?: string;
  edited?: boolean;
  error?: string;
  outputQuality?: {
    summary?: string;
    notes?: { code: string; message: string; samples: string[] }[];
  };
};

describe("POST /api/v2/ai/article — cacat berat memicu rotasi model", () => {
  beforeEach(() => {
    resetAiArticleMocks();
    // Tiga kandidat agar rotasi punya ruang.
    resolveAiCandidatesMock.mockResolvedValue([
      { ...FAKE_AI_CONFIG, model: "model-a" },
      { ...FAKE_AI_CONFIG, model: "model-b" },
      { ...FAKE_AI_CONFIG, model: "model-c" },
    ]);
  });

  it("aksara asing pada model pertama: rotasi, lalu berhasil dengan model kedua", async () => {
    chatCompletionMock
      .mockResolvedValueOnce(FOREIGN_HTML) // penulis model-a: ditolak
      .mockResolvedValue(CLEAN_HTML); // penulis model-b + editor: bersih

    const response = await POST(buildArticleRequest(validArticleBody()));
    const data = (await response.json()) as ArticleResponse;

    expect(response.status).toBe(200);
    expect(data.html).not.toContain("收入");
    // Model pertama dibakar, jadi setidaknya tiga panggilan: a (gagal), b, editor.
    expect(chatCompletionMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("markdown tercampur ditolak dan dirotasi", async () => {
    chatCompletionMock
      .mockResolvedValueOnce(MARKDOWN_HTML)
      .mockResolvedValue(CLEAN_HTML);

    const response = await POST(buildArticleRequest(validArticleBody()));
    expect(response.status).toBe(200);
    const data = (await response.json()) as ArticleResponse;
    expect(data.html).not.toContain("## Judul Markdown");
  });

  it("placeholder yang belum diisi ditolak dan dirotasi", async () => {
    chatCompletionMock
      .mockResolvedValueOnce(PLACEHOLDER_HTML)
      .mockResolvedValue(CLEAN_HTML);

    const response = await POST(buildArticleRequest(validArticleBody()));
    expect(response.status).toBe(200);
    const data = (await response.json()) as ArticleResponse;
    expect(data.html).not.toContain("[tambahkan data");
  });

  it("bila SEMUA kandidat cacat, gagal dengan pesan yang menyebut penyebabnya", async () => {
    // Ini perilaku yang disengaja: lebih baik gagal terang-terangan daripada
    // menyimpan artikel beraksara asing lalu menandainya untuk diperbaiki.
    chatCompletionMock.mockResolvedValue(FOREIGN_HTML);

    const response = await POST(buildArticleRequest(validArticleBody()));
    const data = (await response.json()) as ArticleResponse;

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.error).toMatch(/aksara non-Latin|cacat/i);
  });
});

describe("POST /api/v2/ai/article — editor diperiksa dengan standar sama", () => {
  beforeEach(() => {
    resetAiArticleMocks();
    resolveAiCandidatesMock.mockResolvedValue([
      { ...FAKE_AI_CONFIG, model: "model-a" },
      { ...FAKE_AI_CONFIG, model: "model-b" },
    ]);
  });

  it("editor yang menyelipkan aksara asing ditolak; draft penulis dipakai", async () => {
    // Tanpa pemeriksaan di pass editor, editor yang merusak justru menurunkan
    // mutu draft yang sudah lolos — dan kerusakannya baru terlihat setelah tayang.
    chatCompletionMock
      .mockResolvedValueOnce(CLEAN_HTML) // penulis: bersih
      .mockResolvedValue(FOREIGN_HTML); // semua kandidat editor: cacat

    const response = await POST(buildArticleRequest(validArticleBody()));
    const data = (await response.json()) as ArticleResponse;

    expect(response.status).toBe(200);
    expect(data.edited).toBe(false);
    expect(data.html).not.toContain("收入");
    expect(data.html).toContain("Menghitung Kemampuan Angsuran");
  });
});

describe("POST /api/v2/ai/article — catatan mutu tidak memblokir", () => {
  beforeEach(() => {
    resetAiArticleMocks();
  });

  it("artikel penuh klise tetap 200 dan catatan mutunya dikirim ke klien", async () => {
    chatCompletionMock.mockResolvedValue(CLICHE_HTML);

    const response = await POST(buildArticleRequest(validArticleBody()));
    const data = (await response.json()) as ArticleResponse;

    expect(response.status).toBe(200);
    expect(data.outputQuality?.notes?.length ?? 0).toBeGreaterThan(0);
    expect(data.outputQuality?.notes?.map((n) => n.code)).toContain(
      "banned_phrase",
    );
    expect(data.outputQuality?.summary).toMatch(/catatan mutu/);
  });

  it("artikel bersih melaporkan nol catatan mutu", async () => {
    chatCompletionMock.mockResolvedValue(CLEAN_HTML);

    const response = await POST(buildArticleRequest(validArticleBody()));
    const data = (await response.json()) as ArticleResponse;

    expect(response.status).toBe(200);
    expect(data.outputQuality?.notes).toEqual([]);
    expect(data.outputQuality?.summary).toMatch(/Tidak ada cacat/);
  });
});
