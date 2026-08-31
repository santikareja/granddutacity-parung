# Temuan Baseline — hasil Task 0

Direkam 30 Agustus 2026 terhadap produksi, sebelum satu baris kode diubah.
Snapshot mentah: `snapshots/2026-08-30-baseline-pra-fase1.json` (51 URL).

## Invarian homepage — kondisi yang WAJIB dipertahankan (R1)

| Field | Nilai baseline |
|---|---|
| `title` | `Grand Duta City Parung \| Promo Hunian South of Jakarta` (**54** karakter) |
| `description` | **148** karakter — sudah di dalam rentang 120–160, jadi G7 tidak memaksa perubahan homepage |
| `canonical` | `https://granddutacitysouthofjakarta.com` (tanpa trailing slash) |
| `robots` | `index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1` |
| `h1` | **1** buah: `Grand Duta City Parung South of Jakarta` |
| blok JSON-LD | **7** blok nyata |

Catatan metodologis: hitungan 7 blok JSON-LD ini membetulkan angka 15 yang muncul saat audit
awal. Next.js menduplikasi JSON-LD ke dalam RSC flight payload (`self.__next_f.push`), jadi
pencarian substring `application/ld+json` menghasilkan positif palsu. `seo-snapshot.cjs`
mencocokkan elemen `<script type="application/ld+json">…</script>` lalu `JSON.parse`,
sehingga angkanya adalah jumlah yang benar-benar dibaca crawler.

## Hasil guard test pada kode belum diperbaiki

`npm run test` → 17 test file existing tetap hijau (166 test lolos). Guard baru:
**7 gagal, 7 lolos** — tepat seperti yang diharapkan Task 0.3.

### LOLOS (7) — invarian yang sudah aman sejak awal

`G1` title homepage memuat kata kunci utama · `G1b` title homepage tidak kena suffix template ·
`G2` canonical homepage tepat · `G3` homepage tidak noindex · `G8` nol title duplikat ·
`G9` nol description duplikat · `G10` semua route punya canonical.

### GAGAL (7) — bukti cacat C1–C7 memang ada

**G4 — frasa kata kunci kedua di halaman non-homepage (1 pelanggar)**

| Route | Title |
|---|---|
| `/galeri` | `Galeri Foto - Grand Duta City South of Jakarta \| Grand Duta City Parung` |

Ini pelanggar tunggal paling berbahaya: satu-satunya halaman yang memuat **kedua** kata kunci target.

**G5 — brand tag menggantung di akhir title (13 pelanggar)**

`/about` · `/galeri` · `/cluster-ladera` · `/pricelist-grand-duta-city` · `/kontak` ·
`/category` · `/author/santika-reza` · `/artikel` · `/cara-beli-kpr` ·
`/lokasi-akses-grand-duta-city-parung` · `/update-stok-siteplan-grand-duta-city-parung` ·
`/category/panduan-properti` · `/category/kawasan`

**G5b — frasa kata kunci utama muncul DUA KALI dalam satu title (6 pelanggar)**

`/cluster-ladera` · `/pricelist-grand-duta-city` · `/kontak` · `/artikel` · `/cara-beli-kpr` ·
`/lokasi-akses-grand-duta-city-parung`

**G6 — title > 60 karakter (14 pelanggar)**

| Route | Char |
|---|---|
| `/artikel` | 102 |
| `/author/santika-reza` | 95 |
| `/cluster-ladera` | 88 |
| `/lokasi-akses-grand-duta-city-parung` | 88 |
| `/kontak` | 85 |
| `/pricelist-grand-duta-city` | 82 |
| `/cara-beli-kpr` | 82 |
| `/about` | 76 |
| `/category/kawasan` | 75 |
| `/galeri` | 71 |
| `/category/panduan-properti` | 68 |
| `/cluster-cascada` | 65 |
| `/update-stok-siteplan-grand-duta-city-parung` | 63 |
| `/category/seputar-gdc` | 63 |

**G7 — description di luar rentang 120–160 (6 pelanggar)**

| Route | Char | Arah |
|---|---|---|
| `/category/panduan-properti` | 193 | terlalu panjang |
| `/author/santika-reza` | 183 | terlalu panjang |
| `/category/kawasan` | 180 | terlalu panjang |
| `/category/seputar-gdc` | 164 | terlalu panjang |
| `/update-stok-siteplan-grand-duta-city-parung` | 118 | terlalu pendek |
| `/category` | 116 | terlalu pendek |

**G11 — `openGraph.siteName` ada 3 varian berbeda** (mengonfirmasi C5).

**G12 — layout masih mengekspor** `template: "%s | Grand Duta City Parung"` (akar C1).

## Temuan BARU yang tidak ada di laporan audit

Snapshot menangkap tiga hal yang tidak terlihat saat audit manual:

1. **Dua halaman punya `<h1>` ganda** — `/rumah-di-kawasan-strategis` dan
   `/listing-properti-panduan-lengkap`. Keduanya artikel CMS, jadi kemungkinan besar konten
   Lexical-nya memakai heading level 1 di body sementara template sudah merender `<h1>` judul.
   Perlu dicek di `ArticleRichContent` apakah `<h1>` dari konten dinormalkan ke `<h2>`.
   `seo-verify.cjs` sudah mencatat dua ini sebagai kondisi baseline, dan akan MENGGAGALKAN
   fase bila jumlahnya bertambah (F6).

2. **`/perumahan-di-bogor` description = 214 karakter**, terpanjang di seluruh situs.
   Artikel CMS tidak masuk cakupan guard test unit, jadi ini hanya tertangkap lewat snapshot.

3. **Panjang title/description sebenarnya lebih pendek dari hasil pengukuran audit** karena
   entity HTML. `&amp;` dirender sebagai 1 karakter `&`, jadi `/artikel` sebenarnya 102 bukan
   104, dan `/category/seputar-gdc` 164 bukan 168. `seo-snapshot.cjs` melakukan decode entity
   sebelum menghitung, sehingga angka di dokumen ini adalah yang dipakai Google.

## Deviasi dari spec

- Script dibuat sebagai `.cjs`, bukan `.mjs` seperti tertulis di `design.md`. Alasan: 4 script
  existing di `scripts/` semuanya `.cjs` dan `package.json` tidak menyetel `"type": "module"`.
  Mengikuti konvensi repo lebih baik daripada mengikuti nama file di spec.
- `seo-invariants.test.ts` memakai 14 asersi, bukan 12. Dua tambahan: `G1b` (title homepage
  tidak pernah kena suffix template, mengunci fakta yang membuat Fase 1 aman) dan `G5b`
  (frasa kata kunci utama tidak muncul dua kali dalam satu title — mendeteksi bentuk
  kanibalisasi yang paling merugikan dan tidak tertangkap G5 saja).
