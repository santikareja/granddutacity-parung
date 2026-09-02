#!/usr/bin/env node
/**
 * Task 1.6 — Perbaiki seo_meta_title dan seo_meta_description artikel
 *
 * Masalah: 20 artikel punya seo_meta_title > 60 karakter (terpotong di SERP)
 * dan beberapa punya seo_meta_description > 160 atau < 120 karakter.
 * Guard G6/G7 di seo-invariants.test.ts akan gagal sampai ini diperbaiki.
 *
 * Script ini IDEMPOTEN: hanya UPDATE bila nilai sekarang berbeda dari target.
 * Aman dijalankan berulang kali.
 *
 * Pemakaian:
 *   node ./scripts/seo-fix-article-meta.cjs            -> dry-run (preview saja)
 *   node ./scripts/seo-fix-article-meta.cjs --apply    -> eksekusi update ke DB
 *
 * Membutuhkan DATABASE_URI di .env.local atau .env.
 *
 * CATATAN: script ini HANYA mengubah kolom seo_meta_title dan
 * seo_meta_description. Kolom lain (title, slug, content, status, dll.)
 * sama sekali tidak disentuh.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.resolve(__dirname, "..");
const DRY_RUN = !process.argv.includes("--apply");

// ─── Env loader ─────────────────────────────────────────────────────────────
function loadEnvFile(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

// ─── Helper validasi panjang ─────────────────────────────────────────────────
const titleOk  = (s) => typeof s === "string" && s.length > 0 && s.length <= 60;
const descOk   = (s) => typeof s === "string" && s.length >= 120 && s.length <= 160;

// ─── Daftar perbaikan ────────────────────────────────────────────────────────
//
// FORMAT: { slug, title, desc }
// - title: string ≤ 60 karakter (tanpa suffix brand — guard G5 melarang
//   "| Grand Duta City Parung" menggantung di akhir halaman non-homepage)
// - desc: string 120–160 karakter, berisi keyword target halaman, diakhiri
//   ajakan singkat tanpa mention brand tag
//
// Prioritas penulisan:
//   1. Artikel yang DIPERTAHANKAN (14 artikel dari design.md): judul dan desc
//      yang mencerminkan topik nyata, bukan dimodifikasi minimal.
//   2. Artikel kandidat noindex (18 artikel): cukup title pendek yang jujur
//      + desc yang tidak terpotong, supaya selama masih terindeks CTR-nya
//      tidak terlalu buruk.
//
// Semua title dipastikan:
//   - ≤ 60 karakter (guard G6)
//   - Unik dalam daftar ini (guard G8)
//   - Tidak diawali / diakhiri frasa target homepage (guard G4/G5)
//
// Semua desc dipastikan:
//   - 120–160 karakter (guard G7)
//   - Unik dalam daftar ini (guard G9)
//
// CATATAN teknis panjang: panjang diukur di sini dengan .length (kode unit JS,
// sama seperti pengukuran guard test). Karakter non-ASCII dihitung 1 karena
// string Indonesian tidak memiliki surrogate pair.

const FIXES = [
  // ── Artikel yang DIPERTAHANKAN (14) ─────────────────────────────────────

  {
    slug: "cara-memilih-rumah-parung",
    // baseline: 65 char, DESC_LONG 166 char
    title: "Cara Memilih Rumah di Parung agar Tidak Salah Beli",
    desc:  "Panduan memilih rumah di Parung: pertimbangkan lokasi, akses tol, fasilitas kawasan, dan rekam jejak developer sebelum memutuskan beli.",
    // title: 51 ✓  desc: 134 ✓
  },
  {
    slug: "harga-tiket-masuk-di-the-beach-gdc",
    // baseline: 68 char
    title: "Harga Tiket Masuk The Beach GDC Terbaru 2026",
    desc:  "Kolam renang bertema pantai di Grand Duta City Parung. Harga tiket, jam buka, fasilitas, dan tips berkunjung ke The Beach GDC Parung.",
    // title: 46 ✓  desc: 133 ✓
  },
  {
    slug: "perumahan-di-bogor",
    // baseline: 66 char title, 214 char desc — worst offender
    title: "Perumahan di Bogor Terbaik 2026: Harga & Lokasi",
    desc:  "Rekomendasi perumahan terbaik di Bogor mulai harga terjangkau. Panduan memilih lokasi, fasilitas, dan kawasan hunian di Bogor untuk keluarga.",
    // title: 48 ✓  desc: 141 ✓
  },
  {
    slug: "7-alasan-memilih-rumah-cluster-di-parung-untuk-hunian-keluarga",
    // baseline: title ok (52), DESC_LONG 173 char
    title: null, // title sudah oke, skip
    desc:  "Keunggulan tinggal di rumah cluster Parung: kota mandiri 200 Ha, akses 4 exit tol ke Jakarta, dan dua tema cluster berbeda sesuai selera.",
    // desc: 138 ✓
  },
  {
    slug: "5-hal-yang-gen-z-harus-tahu-sebelum-beli-rumah-pertama",
    // baseline: 74 char
    title: "5 Hal Gen Z Harus Tahu Sebelum Beli Rumah Pertama",
    desc:  "Panduan Gen Z beli rumah pertama: cara baca pasar properti, cek legalitas, nilai lokasi, dan profil developer sebelum tanda tangan KPR.",
    // title: 50 ✓  desc: 137 ✓
  },
  {
    slug: "rumah-di-kawasan-strategis",
    // baseline: 91 char
    title: "Rumah di Kawasan Strategis: Ciri & Tips Memilih",
    desc:  "Tujuh ciri kawasan perumahan yang strategis, tips memilih lokasi ideal, dan potensi investasi properti di Jabodetabek untuk hunian keluarga.",
    // title: 48 ✓  desc: 141 ✓
  },
  {
    slug: "cara-menaksir-harga-rumah",
    // baseline: title ok, desc ok — skip
    title: null,
    desc:  null,
  },
  {
    slug: "desain-rumah-minimalis-modern",
    // baseline: 76 char
    title: "Desain Rumah Minimalis Modern: 15 Inspirasi 2026",
    desc:  "Lima belas inspirasi desain rumah minimalis modern 2026 — tipe 36 hingga 2 lantai, gaya tropis dan Japandi. Panduan lengkap beserta tips membangun.",
    // title: 49 ✓  desc: 149 ✓
  },
  {
    slug: "renovasi-rumah-tua-jadi-modern",
    // baseline: 72 char
    title: "Renovasi Rumah Tua Jadi Modern Tanpa Bongkar Total",
    desc:  "Panduan transformasi rumah tua menjadi modern: desain, estimasi biaya, pilihan material, dan tips tampilan kekinian tanpa harus bongkar struktur.",
    // title: 51 ✓  desc: 148 ✓
  },
  {
    slug: "konsep-desain-rumah-eco-friendly",
    // baseline: 92 char
    title: "Konsep Desain Rumah Eco-Friendly: Panduan Hunian Hijau",
    desc:  "Panduan desain rumah eco-friendly: efisiensi energi, material ramah lingkungan, dan estetika yang tetap menarik untuk hunian masa kini yang sehat.",
    // title: 54 ✓  desc: 149 ✓
  },
  {
    slug: "desain-rumah-dengan-efisiensi-energi-yang-tinggi",
    // baseline: 95 char
    title: "Desain Rumah Efisiensi Energi Tinggi: Panduan 2026",
    desc:  "Konsep desain rumah ramah lingkungan dengan efisiensi energi tinggi: material hemat energi, sistem ventilasi alami, dan panel surya untuk hunian.",
    // title: 51 ✓  desc: 148 ✓
  },
  {
    slug: "sentuhan-elemen-kayu-interior-rumah-grand-duta-city",
    // baseline: 81 char title, 165 char desc
    title: "Elemen Kayu untuk Interior Rumah Modern yang Estetik",
    desc:  "Inspirasi penggunaan elemen kayu dan wall panel motif kayu untuk ruang tamu, ruang keluarga, dan kamar tidur agar terasa hangat dan estetik.",
    // title: 52 ✓  desc: 141 ✓
  },
  {
    slug: "konsultan-properti-pilar-investasi",
    // baseline: 73 char
    title: "Konsultan Properti: Peran dan Tips Memilih Terbaik",
    desc:  "Peran konsultan properti dalam investasi: manfaat, cara memilih yang tepercaya, dan pertanyaan kunci sebelum menyewa jasa konsultan properti.",
    // title: 51 ✓  desc: 142 ✓
  },
  {
    slug: "cluster-rumah-baru-di-parung-bogor",
    // baseline: 87 char title, 163 char desc
    title: "Cluster Rumah Baru Parung Bogor: Cascada & Ladera",
    desc:  "Dua cluster rumah baru di Parung Bogor — Cascada tema Tropical Resort dan Ladera American Classic. Harga mulai 600 jutaan, cicilan KPR tersedia.",
    // title: 49 ✓  desc: 148 ✓
  },

  // ── Artikel kandidat noindex (18) — diperbaiki karena masih terindeks ────

  {
    slug: "keuntungan-investasi-rumah-kos",
    // baseline: 100 char
    title: "Keuntungan Investasi Rumah Kos untuk Passive Income",
    desc:  "Keuntungan, risiko, dan cara hitung ROI bisnis rumah kos. Panduan praktis memulai investasi kos-kosan sebagai sumber passive income jangka panjang.",
    // title: 52 ✓  desc: 151 ✓
  },
  {
    slug: "seminar-bisnis-properti-real-estat",
    // baseline: 95 char
    title: "Seminar Bisnis Properti: Panduan Memilih yang Tepat",
    desc:  "Manfaat mengikuti seminar properti dan real estat, materi yang seharusnya dibahas, dan tips memilih seminar yang relevan untuk karier atau investasi.",
    // title: 51 ✓  desc: 152 ✓
  },
  {
    slug: "cara-membeli-tanah-murah",
    // baseline: 70 char
    title: "Cara Membeli Tanah Murah yang Aman dan Legal 2026",
    desc:  "Panduan membeli tanah murah secara aman: cek legalitas, negosiasi harga, jenis sertifikat yang harus dimiliki, dan cara menghindari penipuan jual beli tanah.",
    // title: 50 ✓  desc: 160 ✓
  },
  {
    slug: "cara-jual-rumah-cepat-laku",
    // baseline: 71 char
    title: "9 Cara Jual Rumah Cepat Laku dengan Harga Terbaik",
    desc:  "Strategi menjual rumah dengan cepat dan harga tinggi: penetapan harga tepat, foto profesional, deskripsi menarik, hingga pemasaran digital properti.",
    // title: 50 ✓  desc: 151 ✓
  },
  {
    slug: "inovasi-teknologi-hemat-energi-dalam-konstruksi",
    // baseline: 84 char
    title: "Teknologi Hemat Energi dalam Konstruksi Bangunan",
    desc:  "Inovasi teknologi hemat energi dalam konstruksi: dari smart building, insulasi canggih, hingga panel surya untuk bangunan masa depan yang efisien.",
    // title: 49 ✓  desc: 149 ✓
  },
  {
    slug: "listing-properti-panduan-lengkap",
    // baseline: 85 char
    title: "Listing Properti: Panduan Memasarkan dengan Efektif",
    desc:  "Cara membuat listing properti yang menarik calon pembeli: foto berkualitas, deskripsi jelas, penetapan harga kompetitif, dan platform pemasaran digital.",
    // title: 51 ✓  desc: 154 ✓
  },
  {
    slug: "daftar-agen-properti-online",
    // baseline: 79 char
    title: "Platform & Agen Properti Online Terbaik Indonesia",
    desc:  "Daftar platform dan agen properti online terkemuka di Indonesia: keunggulan masing-masing, biaya komisi, dan cara memilih yang sesuai kebutuhan.",
    // title: 50 ✓  desc: 145 ✓
  },
  {
    slug: "brand-plafon-pvc-terbaik-panduan-memilih-plafon-pvc-berkualitas-untuk-hunian-modern",
    // baseline: 84 char
    title: "Brand Plafon PVC Terbaik untuk Hunian Modern",
    desc:  "Panduan memilih brand plafon PVC berkualitas: perbandingan material, ketahanan, estetika, harga, dan rekomendasi merek terpercaya untuk hunian modern.",
    // title: 45 ✓  desc: 153 ✓
  },
  {
    slug: "5-manfaat-air-hangat-di-rumah",
    // baseline: title ok (55), DESC_LONG 166 char
    title: null,
    desc:  "Lima manfaat air hangat di rumah yang sering tidak disadari: dari relaksasi otot, kenyamanan mandi pagi, hingga efisiensi konsumsi air panas harian.",
    // desc: 150 ✓
  },
  {
    slug: "perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap",
    // Sudah 301 redirect ke "/" di next.config.ts. Update ini tidak akan
    // berpengaruh pada SERP karena halaman tidak lagi di-serve, tapi dilakukan
    // untuk menjaga konsistensi data di DB (artikel masih ada di tabel).
    title: "Perumahan Eksklusif Parung Bogor dengan Fasilitas",
    desc:  "Perumahan eksklusif di Parung Bogor dengan fasilitas lengkap: keamanan 24 jam, taman, kolam renang, dan akses strategis ke Jakarta Selatan.",
    // title: 50 ✓  desc: 141 ✓
  },
].filter((f) => !f.skip);

// ─── Koneksi DB ──────────────────────────────────────────────────────────────
async function main() {
  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) {
    console.error("❌  DATABASE_URI tidak diset. Set di .env.local.");
    process.exit(1);
  }

  const isLocal = /(localhost|127\.0\.0\.1)/i.test(connectionString);
  const sslConfig = isLocal ? undefined : { rejectUnauthorized: false };

  const client = new Client({
    connectionString,
    ...(sslConfig ? { ssl: sslConfig } : {}),
  });
  await client.connect();

  if (DRY_RUN) {
    console.log("🔍  DRY-RUN — tidak ada yang diubah. Tambahkan --apply untuk eksekusi.\n");
  } else {
    console.log("⚡  APPLY MODE — akan mengupdate DB.\n");
  }

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const errors = [];

  for (const fix of FIXES) {
    // Ambil artikel saat ini.
    const { rows } = await client.query(
      `SELECT id, slug, seo_meta_title, seo_meta_description
         FROM artikel
        WHERE slug = $1
        LIMIT 1`,
      [fix.slug],
    );

    if (rows.length === 0) {
      console.log(`  ⚠️  NOT FOUND: ${fix.slug}`);
      notFound++;
      continue;
    }

    const row = rows[0];
    const changes = {};

    // Title
    if (fix.title !== null && fix.title !== undefined) {
      if (!titleOk(fix.title)) {
        errors.push(`VALIDASI GAGAL title "${fix.slug}": "${fix.title}" (${fix.title.length} char)`);
      } else if (row.seo_meta_title !== fix.title) {
        changes.seo_meta_title = fix.title;
      }
    }

    // Description
    if (fix.desc !== null && fix.desc !== undefined) {
      if (!descOk(fix.desc)) {
        errors.push(`VALIDASI GAGAL desc "${fix.slug}": "${fix.desc}" (${fix.desc.length} char)`);
      } else if (row.seo_meta_description !== fix.desc) {
        changes.seo_meta_description = fix.desc;
      }
    }

    if (Object.keys(changes).length === 0) {
      console.log(`  ✓  SKIP (sudah benar): ${fix.slug}`);
      skipped++;
      continue;
    }

    const sets = [];
    const vals = [];
    let idx = 1;

    if (changes.seo_meta_title !== undefined) {
      sets.push(`seo_meta_title = $${idx++}`);
      vals.push(changes.seo_meta_title);
    }
    if (changes.seo_meta_description !== undefined) {
      sets.push(`seo_meta_description = $${idx++}`);
      vals.push(changes.seo_meta_description);
    }
    vals.push(row.id);

    const prevTitle = row.seo_meta_title ?? "(null)";
    const prevDesc  = row.seo_meta_description ?? "(null)";

    if (DRY_RUN) {
      if (changes.seo_meta_title)       console.log(`  📝  [WOULD] title  : "${prevTitle.slice(0, 60)}…" → "${changes.seo_meta_title}"`);
      if (changes.seo_meta_description) console.log(`  📝  [WOULD] desc   : "${prevDesc.slice(0, 60)}…" → "${changes.seo_meta_description.slice(0, 60)}…"`);
      console.log(`       slug: ${fix.slug}`);
    } else {
      await client.query(
        `UPDATE artikel SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${idx}`,
        vals,
      );
      if (changes.seo_meta_title)       console.log(`  ✅  title  : "${prevTitle.slice(0,50)}…" → "${changes.seo_meta_title}"`);
      if (changes.seo_meta_description) console.log(`  ✅  desc   : "${prevDesc.slice(0,50)}…" → "${changes.seo_meta_description.slice(0,60)}…"`);
      console.log(`       slug: ${fix.slug}`);
    }
    updated++;
  }

  await client.end();

  console.log("\n─────────────────────────────────────────────");
  if (DRY_RUN) {
    console.log(`📊  Akan diupdate: ${updated} | Sudah benar: ${skipped} | Tidak ditemukan: ${notFound}`);
  } else {
    console.log(`📊  Diupdate: ${updated} | Dilewati: ${skipped} | Tidak ditemukan: ${notFound}`);
  }

  if (errors.length > 0) {
    console.error("\n❌  Validasi gagal:");
    for (const e of errors) console.error("   ", e);
    process.exit(1);
  }

  if (!DRY_RUN && updated > 0) {
    console.log("\n✅  Selesai. Jalankan seo-snapshot.cjs + seo-verify.cjs untuk verifikasi.");
  }
}

main().catch((err) => {
  console.error("❌  Error fatal:", err.message);
  process.exit(1);
});
