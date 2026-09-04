// Unit test pemeriksa mutu keluaran AI.
//
// KENAPA TEST INI PENTING
// `HOUSE_STYLE` melarang lebih dari 20 frasa klise dan prompt menuntut format
// HTML ketat, tetapi sebelum modul output-quality tidak ada yang MEMVERIFIKASI
// larangan itu dipatuhi. Prompt adalah instruksi; model kecil melanggarnya
// diam-diam. Test di bawah mengunci pemeriksanya benar-benar menangkap
// pelanggaran, dan sama pentingnya: TIDAK menangkap yang bukan pelanggaran.
//
// Pembagian tingkat keparahan diuji eksplisit karena di situlah risiko desainnya:
//   - Terlalu galak -> generate sering gagal tanpa alasan jelas.
//   - Terlalu longgar -> artikel rusak bisa tayang.

import { describe, expect, it } from "vitest";

import {
  assessAiOutput,
  BANNED_PHRASES,
  detectAiTells,
  detectForeignScript,
  detectFormatDefects,
  detectVerbatimCopying,
  hardDefectMessage,
  visibleText,
} from "@/lib/ai/output-quality";
import { HOUSE_STYLE } from "@/lib/ai/brand-facts";

/** Bangun HTML artikel panjang yang bersih, untuk uji negatif. */
const cleanArticle = (extra = ""): string => {
  const paragraphs = [
    "<p>Pembeli rumah pertama sering terjebak pada harga, padahal biaya di luar harga rumah bisa menambah beban puluhan juta. Ada BPHTB, biaya notaris, provisi bank, dan asuransi yang jarang dihitung sejak awal.</p>",
    "<p>Angka yang perlu dipegang bukan harga rumah, melainkan total kas yang harus keluar sampai akad. Hitung itu dulu.</p>",
    "<p>Bank menilai kemampuan bayar dari penghasilan bersih, bukan penghasilan kotor. Cicilan yang disetujui biasanya dibatasi sekitar sepertiga penghasilan, dan batas itu sudah termasuk cicilan lain yang masih berjalan seperti kredit kendaraan atau kartu kredit yang belum lunas.</p>",
    "<p>Periksa sertifikat sebelum membayar tanda jadi. Status SHM berbeda jauh dari HGB, dan perbedaannya menentukan apa yang Anda benar-benar miliki setelah akad selesai ditandatangani di hadapan notaris.</p>",
    "<p>Survei sebaiknya dilakukan dua kali pada waktu berbeda: pagi saat jam sibuk, dan sore ketika lalu lintas kembali padat.</p>",
  ];
  return `<h2>Menghitung Kemampuan Angsuran</h2>${paragraphs.join("")}<h3>Dokumen yang Perlu Disiapkan</h3><p>Siapkan slip gaji tiga bulan terakhir, rekening koran, dan NPWP. Bank akan meminta ketiganya sebelum memproses pengajuan lebih jauh, jadi mengumpulkannya lebih awal memangkas waktu tunggu.</p>${extra}`;
};

describe("visibleText", () => {
  it("membuang tag dan memulihkan entity dasar", () => {
    expect(visibleText("<p>Harga &amp; biaya <strong>naik</strong></p>")).toBe(
      "Harga & biaya naik",
    );
  });

  it("meratakan spasi berlebih", () => {
    expect(visibleText("<p>a</p>\n\n   <p>b</p>")).toBe("a b");
  });
});

describe("detectForeignScript — aksara non-Latin", () => {
  it("menangkap aksara Tionghoa", () => {
    const defect = detectForeignScript("<p>Kawasan ini 房地产 berkembang.</p>");
    expect(defect).not.toBeNull();
    expect(defect?.severity).toBe("hard");
    expect(defect?.code).toBe("foreign_script");
    expect(defect?.message).toMatch(/Tionghoa/);
  });

  it("menangkap satu karakter Han pun", () => {
    // Satu karakter sudah membuat artikel tampak rusak bagi pembaca.
    expect(detectForeignScript("<p>Harga rumah 的 naik.</p>")).not.toBeNull();
  });

  it("menangkap kana, hangul, sirilik, Arab, Thai, dan Yunani", () => {
    for (const sample of [
      "<p>Rumah ですね di kawasan.</p>",
      "<p>Kawasan 안녕 baru.</p>",
      "<p>Harga привет naik.</p>",
      "<p>Kawasan مرحبا baru.</p>",
      "<p>Rumah สวัสดี baru.</p>",
      "<p>Nilai λόγος tanah.</p>",
    ]) {
      expect(detectForeignScript(sample), sample).not.toBeNull();
    }
  });

  it("menangkap tanda baca lebar penuh CJK meski hurufnya Latin", () => {
    expect(detectForeignScript("<p>Harga naik（sekitar）tahun ini.</p>")).not.toBeNull();
  });

  it("tidak menganggap teks Indonesia normal sebagai aksara asing", () => {
    expect(detectForeignScript(cleanArticle())).toBeNull();
  });

  it("tidak terpicu huruf beraksen atau tanda kutip tipografis", () => {
    expect(
      detectForeignScript("<p>Café, naïve, “kutipan”, dan tanda – pisah.</p>"),
    ).toBeNull();
  });
});

describe("detectFormatDefects — cacat berat", () => {
  const codesOf = (html: string, severity: "hard" | "soft"): string[] =>
    detectFormatDefects(html)
      .filter((d) => d.severity === severity)
      .map((d) => d.code);

  it("menangkap code fence yang bocor", () => {
    expect(codesOf("```html\n<p>isi</p>", "hard")).toContain("code_fence");
  });

  it("menangkap markdown yang tercampur HTML", () => {
    for (const [label, html] of [
      ["heading", "## Judul Bagian\n<p>isi</p>"],
      ["bold", "<p>Ini **sangat penting** untuk dicek</p>"],
      ["bullet", "- butir pertama\n<p>isi</p>"],
      ["tautan", "<p>Lihat [situs resmi](https://contoh.id) untuk detail</p>"],
    ] as const) {
      expect(codesOf(html, "hard"), label).toContain("markdown_leak");
    }
  });

  it("menangkap placeholder yang belum diisi", () => {
    for (const html of [
      "<p>[isi bagian ini nanti]</p>",
      "<p>Lorem ipsum dolor sit amet</p>",
      "<p>TODO lengkapi data</p>",
      "<p>Harga {{harga_unit}} juta</p>",
    ]) {
      expect(codesOf(html, "hard"), html).toContain("placeholder");
    }
  });

  it("menangkap kalimat model yang bicara tentang tugasnya", () => {
    for (const html of [
      "<p>Berikut adalah artikel yang Anda minta.</p>",
      "<p>Semoga membantu.</p>",
      "<p>Sebagai model bahasa AI, saya tidak bisa memberikan angka pasti.</p>",
    ]) {
      expect(codesOf(html, "hard"), html).toContain("meta_commentary");
    }
  });

  it("tidak menandai kalimat sah yang mirip pola meta di tengah artikel", () => {
    // "Berikut hasil perhitungannya" adalah cara wajar memperkenalkan tabel
    // simulasi angsuran. Menolaknya berarti peringatan palsu yang berujung
    // rotasi model dan generate gagal — biaya yang jauh lebih besar daripada
    // manfaatnya.
    const middle =
      cleanArticle() +
      "<p>Berikut hasil perhitungan angsuran untuk tiga skenario tenor yang paling sering dipakai pembeli rumah pertama di kawasan ini.</p>" +
      "<p>Ini adalah pertimbangan yang jarang disebut agen, padahal dampaknya besar pada kas bulanan Anda selama bertahun-tahun ke depan.</p>" +
      "<p>Setelah semua angka terkumpul, langkah berikutnya adalah membandingkan penawaran dari beberapa bank sekaligus agar Anda punya posisi negosiasi.</p>";
    expect(codesOf(middle, "hard")).not.toContain("meta_commentary");
  });

  it("tetap menangkap preamble model di awal keluaran panjang", () => {
    const withPreamble = `<p>Berikut adalah artikel lengkap yang Anda minta.</p>${cleanArticle()}`;
    expect(codesOf(withPreamble, "hard")).toContain("meta_commentary");
  });

  it("tetap menangkap postamble model di akhir keluaran panjang", () => {
    const withPostamble = `${cleanArticle()}<p>Semoga membantu dalam proses pengambilan keputusan Anda.</p>`;
    expect(codesOf(withPostamble, "hard")).toContain("meta_commentary");
  });

  it("menangkap heading kosong", () => {
    expect(codesOf(`${cleanArticle()}<h2></h2>`, "hard")).toContain("empty_heading");
  });

  it("menangkap tag tidak berpasangan pada keluaran panjang", () => {
    // Paragraf terakhir tidak ditutup: tanda keluaran terpotong di tengah.
    const truncated = cleanArticle().replace(/<\/p>$/, "");
    expect(codesOf(truncated, "hard")).toContain("unbalanced_tag");
  });

  it("menangkap artikel panjang tanpa heading", () => {
    const noHeading = cleanArticle().replace(/<h[23]\b[^>]*>[\s\S]*?<\/h[23]>/gi, "");
    expect(codesOf(noHeading, "hard")).toContain("no_heading");
  });

  it("keluaran bersih tidak menghasilkan cacat berat", () => {
    expect(codesOf(cleanArticle(), "hard")).toEqual([]);
  });
});

describe("detectFormatDefects — batas penilaian struktur", () => {
  // Ini penjaga terhadap kesalahan desain: memblokir potongan HTML pendek
  // membuat pemeriksa mutu menyandera jalur lain (pratinjau, uji sanitasi) yang
  // sah memakai HTML kecil.
  it("potongan pendek tanpa heading TIDAK dianggap cacat berat", () => {
    const short = "<p>Satu paragraf pendek saja.</p>";
    const hard = detectFormatDefects(short).filter((d) => d.severity === "hard");
    expect(hard).toEqual([]);
  });

  it("tag void seperti <img> tidak dihitung sebagai tag tidak berpasangan", () => {
    const hard = detectFormatDefects(`${cleanArticle('<p><img src="x.webp" alt="a"></p>')}`)
      .filter((d) => d.severity === "hard")
      .map((d) => d.code);
    expect(hard).not.toContain("unbalanced_tag");
  });
});

describe("detectFormatDefects — tag yang ditangani sanitasi", () => {
  // Tag aktif adalah urusan `sanitizeAiHtml`, lapisan keamanan yang sudah
  // terbukti lewat rangkaian test tersendiri. Menjadikannya cacat berat berarti
  // permintaan ditolak sebelum sanitasi pernah berjalan.
  it("melaporkan <script>/<style>/<h1> sebagai catatan mutu, bukan cacat berat", () => {
    const withActive = `<h1>Judul</h1>${cleanArticle()}<script>evil()</script>`;
    const defects = detectFormatDefects(withActive);
    const hard = defects.filter((d) => d.severity === "hard").map((d) => d.code);
    const soft = defects.filter((d) => d.severity === "soft").map((d) => d.code);

    expect(hard).not.toContain("sanitized_tag");
    expect(soft).toContain("sanitized_tag");
  });
});

describe("detectFormatDefects — catatan mutu", () => {
  const softCodes = (html: string): string[] =>
    detectFormatDefects(html)
      .filter((d) => d.severity === "soft")
      .map((d) => d.code);

  it("menangkap emoji", () => {
    expect(softCodes(`${cleanArticle("<p>Rumah nyaman 🏡 sekali</p>")}`)).toContain(
      "emoji",
    );
  });

  it("menangkap tanda seru", () => {
    expect(softCodes(`${cleanArticle("<p>Segera hubungi kami!</p>")}`)).toContain(
      "exclamation",
    );
  });

  it("menangkap tabel dengan jumlah sel tidak seragam", () => {
    const ragged = `${cleanArticle()}<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>`;
    expect(softCodes(ragged)).toContain("table_ragged");
  });

  it("tabel dengan sel seragam tidak ditandai", () => {
    const even = `${cleanArticle()}<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>`;
    expect(softCodes(even)).not.toContain("table_ragged");
  });
});

describe("detectAiTells — verifikasi larangan HOUSE_STYLE", () => {
  it("setiap frasa di BANNED_PHRASES benar-benar tertangkap", () => {
    // Tanpa test ini, menambah frasa ke daftar tidak menjamin ia diperiksa.
    for (const phrase of BANNED_PHRASES) {
      const codes = detectAiTells(`<p>Kalimat dengan ${phrase} di dalamnya.</p>`).map(
        (d) => d.code,
      );
      expect(codes, `frasa "${phrase}" tidak tertangkap`).toContain("banned_phrase");
    }
  });

  it("frasa utama yang dilarang HOUSE_STYLE ada di daftar pemeriksa", () => {
    // Larangan yang ditulis di prompt tapi tidak diperiksa sama dengan tidak ada
    // larangan. Ini mengunci keduanya tetap sinkron.
    const styleText = HOUSE_STYLE.toLowerCase();
    const missing = [
      "di era modern ini",
      "penting untuk dicatat",
      "tidak dapat dipungkiri",
      "sebagai kesimpulan",
      "solusi tepat",
      "investasi cerdas",
      "mari kita bahas",
      "surga tersembunyi",
      "menakjubkan",
      "luar biasa",
    ].filter(
      (phrase) =>
        styleText.includes(phrase) &&
        !BANNED_PHRASES.some((banned) => banned === phrase),
    );
    expect(missing, "frasa dilarang HOUSE_STYLE tapi tidak diperiksa").toEqual([]);
  });

  it("menangkap transisi yang dipakai lebih dari sekali", () => {
    const html =
      "<p>Selain itu harganya naik.</p><p>Selain itu aksesnya membaik.</p>";
    const defect = detectAiTells(html).find((d) => d.code === "overused_transition");
    expect(defect).toBeDefined();
    expect(defect?.samples.join(" ")).toMatch(/selain itu/i);
  });

  it("menangkap pola 'bukan hanya X tetapi juga Y' berulang", () => {
    const html =
      "<p>Ini bukan hanya soal harga tetapi juga lokasi.</p>" +
      "<p>Rumah bukan hanya tempat tinggal tetapi juga aset.</p>";
    expect(detectAiTells(html).map((d) => d.code)).toContain("not_only_pattern");
  });

  it("sekali pakai pola itu tidak ditandai", () => {
    const html = "<p>Ini bukan hanya soal harga tetapi juga lokasi.</p>";
    expect(detectAiTells(html).map((d) => d.code)).not.toContain("not_only_pattern");
  });

  it("menangkap paragraf dengan panjang terlalu seragam", () => {
    // Enam paragraf yang panjangnya hampir identik: ritme mesin.
    const uniform = Array.from(
      { length: 6 },
      (_, i) =>
        `<p>Paragraf nomor ${i + 1} berisi delapan kata yang panjangnya sama persis.</p>`,
    ).join("");
    expect(detectAiTells(uniform).map((d) => d.code)).toContain("uniform_paragraphs");
  });

  it("ambang keseragaman tidak menandai tulisan manusia yang wajar", () => {
    // Kalibrasi terukur: CV 0.03-0.08 = mesin, CV 0.25 = tulisan manusia wajar.
    // Ambang 0.15 harus memisahkan keduanya. Ini penjaga terhadap peringatan
    // palsu, yang paling cepat membuat penulis berhenti mempercayai pemeriksa.
    const buildParagraphs = (wordCounts: number[]): string =>
      wordCounts
        .map((n) => `<p>${Array.from({ length: n }, () => "kata").join(" ")}</p>`)
        .join("");

    // CV ~0.25 — variasi wajar.
    expect(
      detectAiTells(buildParagraphs([31, 18, 37, 27, 19, 26])).map((d) => d.code),
    ).not.toContain("uniform_paragraphs");

    // CV ~0.03 — ritme mesin.
    expect(
      detectAiTells(buildParagraphs([42, 44, 41, 43, 45, 42])).map((d) => d.code),
    ).toContain("uniform_paragraphs");
  });

  it("tidak menilai keseragaman pada artikel dengan sedikit paragraf", () => {
    // Empat paragraf terlalu sedikit untuk kesimpulan statistik.
    const few = "<p>satu dua tiga</p><p>satu dua tiga</p><p>satu dua tiga</p><p>satu dua tiga</p>";
    expect(detectAiTells(few).map((d) => d.code)).not.toContain("uniform_paragraphs");
  });

  it("paragraf dengan panjang bervariasi tidak ditandai", () => {
    expect(detectAiTells(cleanArticle()).map((d) => d.code)).not.toContain(
      "uniform_paragraphs",
    );
  });

  it("menangkap lebih dari dua paragraf yang dibuka kata sama", () => {
    const html =
      "<p>Kawasan ini tumbuh.</p><p>Kawasan itu berkembang.</p><p>Kawasan lain menyusul.</p>";
    expect(detectAiTells(html).map((d) => d.code)).toContain("repeated_opener");
  });

  it("artikel bersih tidak menghasilkan catatan pola AI", () => {
    expect(detectAiTells(cleanArticle())).toEqual([]);
  });
});

describe("detectVerbatimCopying — penjiplakan ringkasan sumber", () => {
  const source = (summary: string) => ({
    data_summary: summary,
    source_name: "Badan Pusat Statistik",
  });

  it("menangkap kalimat yang disalin utuh dari ringkasan sumber", () => {
    const summary =
      "Indeks harga properti residensial pada kuartal ketiga tumbuh melambat dibanding periode sebelumnya karena permintaan menurun.";
    const html = `<p>${summary}</p>`;
    const defect = detectVerbatimCopying(html, [source(summary)]);
    expect(defect).not.toBeNull();
    expect(defect?.code).toBe("verbatim_source");
    expect(defect?.severity).toBe("soft");
  });

  it("tidak menandai artikel yang menuliskan ulang dengan kalimat sendiri", () => {
    const summary =
      "Indeks harga properti residensial pada kuartal ketiga tumbuh melambat dibanding periode sebelumnya karena permintaan menurun.";
    const html =
      "<p>Pertumbuhan harga rumah mengendur belakangan ini. Bagi pembeli, itu berarti ruang negosiasi sedikit lebih longgar daripada tahun lalu.</p>";
    expect(detectVerbatimCopying(html, [source(summary)])).toBeNull();
  });

  it("tidak terpicu frasa umum yang lebih pendek dari ambang", () => {
    // Tujuh kata: di bawah jendela delapan kata, jadi tidak dianggap jiplakan.
    expect(
      detectVerbatimCopying("<p>harga rumah di kawasan ini cenderung naik</p>", [
        source("harga rumah di kawasan ini cenderung naik terus"),
      ]),
    ).toBeNull();
  });

  it("mengembalikan null bila tidak ada sumber", () => {
    expect(detectVerbatimCopying(cleanArticle(), [])).toBeNull();
  });
});

describe("assessAiOutput — penilaian gabungan", () => {
  it("memisahkan cacat berat dari catatan mutu", () => {
    const html = `<p>Kawasan 房地产 ini bagus!</p>${cleanArticle()}`;
    const result = assessAiOutput(html);
    expect(result.hasHardDefect).toBe(true);
    expect(result.hard.map((d) => d.code)).toContain("foreign_script");
    expect(result.soft.map((d) => d.code)).toContain("exclamation");
    expect(result.all.length).toBe(result.hard.length + result.soft.length);
  });

  it("artikel bersih dinyatakan tanpa cacat", () => {
    const result = assessAiOutput(cleanArticle());
    expect(result.hasHardDefect).toBe(false);
    expect(result.all).toEqual([]);
    expect(result.summary).toMatch(/Tidak ada cacat/);
  });

  it("ringkasan menyebut jumlah cacat berat dan catatan mutu", () => {
    const result = assessAiOutput(`<p>Kawasan 房地产 ini!</p>${cleanArticle()}`);
    expect(result.summary).toMatch(/cacat berat/);
    expect(result.summary).toMatch(/catatan mutu/);
  });

  it("hardDefectMessage menyertakan contoh agar penyebabnya bisa dilacak", () => {
    const result = assessAiOutput("<p>Kawasan 房地产 ini.</p>");
    const message = hardDefectMessage(result);
    expect(message).toMatch(/aksara non-Latin/);
    expect(message).toMatch(/Contoh:/);
  });

  it("catatan penjiplakan ikut masuk saat sumber diberikan", () => {
    const summary =
      "Indeks harga properti residensial pada kuartal ketiga tumbuh melambat dibanding periode sebelumnya karena permintaan menurun.";
    const result = assessAiOutput(`${cleanArticle()}<p>${summary}</p>`, [
      { data_summary: summary, source_name: "BPS" },
    ]);
    expect(result.soft.map((d) => d.code)).toContain("verbatim_source");
  });
});
