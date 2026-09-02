-- Task 1.6 — Perbaiki seo_meta_title dan seo_meta_description artikel
-- Dibuat: 2026-08-26 dari audit baseline snapshot 2026-08-30
--
-- CARA PAKAI:
--   Supabase : SQL Editor → paste → RUN
--   Neon     : SQL Editor → paste → Run
--   psql     : psql $DATABASE_URL -f scripts/seo-fix-article-meta.sql
--
-- Script ini IDEMPOTEN: menggunakan WHERE seo_meta_title != nilai_baru OR ...
-- sehingga aman dijalankan berulang kali tanpa duplikasi perubahan.
--
-- HANYA mengubah: seo_meta_title, seo_meta_description, updated_at
-- TIDAK menyentuh: title, slug, content, status, dan kolom lainnya.
--
-- Semua title ≤ 60 karakter | Semua description 120–160 karakter
-- Tidak ada frasa "Grand Duta City Parung" atau "Grand Duta City South of Jakarta"
-- sebagai brand tag berdiri sendiri — sesuai guard G4/G5 spec seo-cannibalization.

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 14 ARTIKEL DIPERTAHANKAN
-- ────────────────────────────────────────────────────────────────────────────

-- (1) cara-memilih-rumah-parung  [TITLE_LONG 65 + DESC_LONG 166]
UPDATE artikel SET
  seo_meta_title       = 'Cara Memilih Rumah di Parung agar Tidak Salah Beli',
  seo_meta_description = 'Panduan memilih rumah di Parung: pertimbangkan lokasi, akses tol, fasilitas kawasan, dan rekam jejak developer sebelum memutuskan beli.',
  updated_at           = NOW()
WHERE slug = 'cara-memilih-rumah-parung'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Cara Memilih Rumah di Parung agar Tidak Salah Beli'
    OR seo_meta_description IS DISTINCT FROM 'Panduan memilih rumah di Parung: pertimbangkan lokasi, akses tol, fasilitas kawasan, dan rekam jejak developer sebelum memutuskan beli.'
  );

-- (2) harga-tiket-masuk-di-the-beach-gdc  [TITLE_LONG 68]
UPDATE artikel SET
  seo_meta_title       = 'Harga Tiket Masuk The Beach GDC Terbaru 2026',
  seo_meta_description = 'Kolam renang bertema pantai di Grand Duta City Parung. Harga tiket, jam buka, fasilitas, dan tips berkunjung ke The Beach GDC Parung.',
  updated_at           = NOW()
WHERE slug = 'harga-tiket-masuk-di-the-beach-gdc'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Harga Tiket Masuk The Beach GDC Terbaru 2026'
    OR seo_meta_description IS DISTINCT FROM 'Kolam renang bertema pantai di Grand Duta City Parung. Harga tiket, jam buka, fasilitas, dan tips berkunjung ke The Beach GDC Parung.'
  );

-- (3) perumahan-di-bogor  [TITLE_LONG 66 + DESC_LONG 214]
UPDATE artikel SET
  seo_meta_title       = 'Perumahan di Bogor Terbaik 2026: Harga & Lokasi',
  seo_meta_description = 'Rekomendasi perumahan terbaik di Bogor mulai harga terjangkau. Panduan memilih lokasi, fasilitas, dan kawasan hunian di Bogor untuk keluarga.',
  updated_at           = NOW()
WHERE slug = 'perumahan-di-bogor'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Perumahan di Bogor Terbaik 2026: Harga & Lokasi'
    OR seo_meta_description IS DISTINCT FROM 'Rekomendasi perumahan terbaik di Bogor mulai harga terjangkau. Panduan memilih lokasi, fasilitas, dan kawasan hunian di Bogor untuk keluarga.'
  );

-- (4) 7-alasan-memilih-rumah-cluster  [DESC_LONG 173]
UPDATE artikel SET
  seo_meta_description = 'Keunggulan tinggal di rumah cluster Parung: kota mandiri 200 Ha, akses 4 exit tol ke Jakarta, dan dua tema cluster berbeda sesuai selera.',
  updated_at           = NOW()
WHERE slug = '7-alasan-memilih-rumah-cluster-di-parung-untuk-hunian-keluarga'
  AND seo_meta_description IS DISTINCT FROM 'Keunggulan tinggal di rumah cluster Parung: kota mandiri 200 Ha, akses 4 exit tol ke Jakarta, dan dua tema cluster berbeda sesuai selera.';

-- (5) 5-hal-yang-gen-z-harus-tahu  [TITLE_LONG 74]
UPDATE artikel SET
  seo_meta_title       = '5 Hal Gen Z Harus Tahu Sebelum Beli Rumah Pertama',
  seo_meta_description = 'Panduan Gen Z beli rumah pertama: cara baca pasar properti, cek legalitas, nilai lokasi, dan profil developer sebelum tanda tangan KPR.',
  updated_at           = NOW()
WHERE slug = '5-hal-yang-gen-z-harus-tahu-sebelum-beli-rumah-pertama'
  AND (
    seo_meta_title       IS DISTINCT FROM '5 Hal Gen Z Harus Tahu Sebelum Beli Rumah Pertama'
    OR seo_meta_description IS DISTINCT FROM 'Panduan Gen Z beli rumah pertama: cara baca pasar properti, cek legalitas, nilai lokasi, dan profil developer sebelum tanda tangan KPR.'
  );

-- (6) rumah-di-kawasan-strategis  [TITLE_LONG 91]
UPDATE artikel SET
  seo_meta_title       = 'Rumah di Kawasan Strategis: Ciri & Tips Memilih',
  seo_meta_description = 'Tujuh ciri kawasan perumahan yang strategis, tips memilih lokasi ideal, dan potensi investasi properti di Jabodetabek untuk hunian keluarga.',
  updated_at           = NOW()
WHERE slug = 'rumah-di-kawasan-strategis'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Rumah di Kawasan Strategis: Ciri & Tips Memilih'
    OR seo_meta_description IS DISTINCT FROM 'Tujuh ciri kawasan perumahan yang strategis, tips memilih lokasi ideal, dan potensi investasi properti di Jabodetabek untuk hunian keluarga.'
  );

-- (7) desain-rumah-minimalis-modern  [TITLE_LONG 76]
UPDATE artikel SET
  seo_meta_title       = 'Desain Rumah Minimalis Modern: 15 Inspirasi 2026',
  seo_meta_description = 'Lima belas inspirasi desain rumah minimalis modern 2026 — tipe 36 hingga 2 lantai, gaya tropis dan Japandi. Panduan lengkap beserta tips membangun.',
  updated_at           = NOW()
WHERE slug = 'desain-rumah-minimalis-modern'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Desain Rumah Minimalis Modern: 15 Inspirasi 2026'
    OR seo_meta_description IS DISTINCT FROM 'Lima belas inspirasi desain rumah minimalis modern 2026 — tipe 36 hingga 2 lantai, gaya tropis dan Japandi. Panduan lengkap beserta tips membangun.'
  );

-- (8) renovasi-rumah-tua-jadi-modern  [TITLE_LONG 72]
UPDATE artikel SET
  seo_meta_title       = 'Renovasi Rumah Tua Jadi Modern Tanpa Bongkar Total',
  seo_meta_description = 'Panduan transformasi rumah tua menjadi modern: desain, estimasi biaya, pilihan material, dan tips tampilan kekinian tanpa harus bongkar struktur.',
  updated_at           = NOW()
WHERE slug = 'renovasi-rumah-tua-jadi-modern'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Renovasi Rumah Tua Jadi Modern Tanpa Bongkar Total'
    OR seo_meta_description IS DISTINCT FROM 'Panduan transformasi rumah tua menjadi modern: desain, estimasi biaya, pilihan material, dan tips tampilan kekinian tanpa harus bongkar struktur.'
  );

-- (9) konsep-desain-rumah-eco-friendly  [TITLE_LONG 92]
UPDATE artikel SET
  seo_meta_title       = 'Konsep Desain Rumah Eco-Friendly: Panduan Hunian Hijau',
  seo_meta_description = 'Panduan desain rumah eco-friendly: efisiensi energi, material ramah lingkungan, dan estetika yang tetap menarik untuk hunian masa kini yang sehat.',
  updated_at           = NOW()
WHERE slug = 'konsep-desain-rumah-eco-friendly'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Konsep Desain Rumah Eco-Friendly: Panduan Hunian Hijau'
    OR seo_meta_description IS DISTINCT FROM 'Panduan desain rumah eco-friendly: efisiensi energi, material ramah lingkungan, dan estetika yang tetap menarik untuk hunian masa kini yang sehat.'
  );

-- (10) desain-rumah-dengan-efisiensi-energi-yang-tinggi  [TITLE_LONG 95]
UPDATE artikel SET
  seo_meta_title       = 'Desain Rumah Efisiensi Energi Tinggi: Panduan 2026',
  seo_meta_description = 'Konsep desain rumah ramah lingkungan dengan efisiensi energi tinggi: material hemat energi, sistem ventilasi alami, dan panel surya untuk hunian.',
  updated_at           = NOW()
WHERE slug = 'desain-rumah-dengan-efisiensi-energi-yang-tinggi'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Desain Rumah Efisiensi Energi Tinggi: Panduan 2026'
    OR seo_meta_description IS DISTINCT FROM 'Konsep desain rumah ramah lingkungan dengan efisiensi energi tinggi: material hemat energi, sistem ventilasi alami, dan panel surya untuk hunian.'
  );

-- (11) sentuhan-elemen-kayu-interior-rumah-grand-duta-city  [TITLE_LONG 81 + DESC_LONG 165]
UPDATE artikel SET
  seo_meta_title       = 'Elemen Kayu untuk Interior Rumah Modern yang Estetik',
  seo_meta_description = 'Inspirasi penggunaan elemen kayu dan wall panel motif kayu untuk ruang tamu, ruang keluarga, dan kamar tidur agar terasa hangat dan estetik.',
  updated_at           = NOW()
WHERE slug = 'sentuhan-elemen-kayu-interior-rumah-grand-duta-city'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Elemen Kayu untuk Interior Rumah Modern yang Estetik'
    OR seo_meta_description IS DISTINCT FROM 'Inspirasi penggunaan elemen kayu dan wall panel motif kayu untuk ruang tamu, ruang keluarga, dan kamar tidur agar terasa hangat dan estetik.'
  );

-- (12) konsultan-properti-pilar-investasi  [TITLE_LONG 73]
UPDATE artikel SET
  seo_meta_title       = 'Konsultan Properti: Peran dan Tips Memilih Terbaik',
  seo_meta_description = 'Peran konsultan properti dalam investasi: manfaat, cara memilih yang tepercaya, dan pertanyaan kunci sebelum menyewa jasa konsultan properti.',
  updated_at           = NOW()
WHERE slug = 'konsultan-properti-pilar-investasi'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Konsultan Properti: Peran dan Tips Memilih Terbaik'
    OR seo_meta_description IS DISTINCT FROM 'Peran konsultan properti dalam investasi: manfaat, cara memilih yang tepercaya, dan pertanyaan kunci sebelum menyewa jasa konsultan properti.'
  );

-- (13) cluster-rumah-baru-di-parung-bogor  [TITLE_LONG 87 + DESC_LONG 163]
UPDATE artikel SET
  seo_meta_title       = 'Cluster Rumah Baru Parung Bogor: Cascada & Ladera',
  seo_meta_description = 'Dua cluster rumah baru di Parung Bogor — Cascada tema Tropical Resort dan Ladera American Classic. Harga mulai 600 jutaan, cicilan KPR tersedia.',
  updated_at           = NOW()
WHERE slug = 'cluster-rumah-baru-di-parung-bogor'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Cluster Rumah Baru Parung Bogor: Cascada & Ladera'
    OR seo_meta_description IS DISTINCT FROM 'Dua cluster rumah baru di Parung Bogor — Cascada tema Tropical Resort dan Ladera American Classic. Harga mulai 600 jutaan, cicilan KPR tersedia.'
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 18 ARTIKEL KANDIDAT NOINDEX (masih terindeks, tetap diperbaiki)
-- ────────────────────────────────────────────────────────────────────────────

-- (14) keuntungan-investasi-rumah-kos  [TITLE_LONG 100]
UPDATE artikel SET
  seo_meta_title       = 'Keuntungan Investasi Rumah Kos untuk Passive Income',
  seo_meta_description = 'Keuntungan, risiko, dan cara hitung ROI bisnis rumah kos. Panduan praktis memulai investasi kos-kosan sebagai sumber passive income jangka panjang.',
  updated_at           = NOW()
WHERE slug = 'keuntungan-investasi-rumah-kos'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Keuntungan Investasi Rumah Kos untuk Passive Income'
    OR seo_meta_description IS DISTINCT FROM 'Keuntungan, risiko, dan cara hitung ROI bisnis rumah kos. Panduan praktis memulai investasi kos-kosan sebagai sumber passive income jangka panjang.'
  );

-- (15) seminar-bisnis-properti-real-estat  [TITLE_LONG 95]
UPDATE artikel SET
  seo_meta_title       = 'Seminar Bisnis Properti: Panduan Memilih yang Tepat',
  seo_meta_description = 'Manfaat mengikuti seminar properti dan real estat, materi yang seharusnya dibahas, dan tips memilih seminar yang relevan untuk karier atau investasi.',
  updated_at           = NOW()
WHERE slug = 'seminar-bisnis-properti-real-estat'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Seminar Bisnis Properti: Panduan Memilih yang Tepat'
    OR seo_meta_description IS DISTINCT FROM 'Manfaat mengikuti seminar properti dan real estat, materi yang seharusnya dibahas, dan tips memilih seminar yang relevan untuk karier atau investasi.'
  );

-- (16) cara-membeli-tanah-murah  [TITLE_LONG 70]
UPDATE artikel SET
  seo_meta_title       = 'Cara Membeli Tanah Murah yang Aman dan Legal 2026',
  seo_meta_description = 'Panduan membeli tanah murah secara aman: cek legalitas, negosiasi harga, jenis sertifikat yang harus dimiliki, dan cara menghindari penipuan jual beli tanah.',
  updated_at           = NOW()
WHERE slug = 'cara-membeli-tanah-murah'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Cara Membeli Tanah Murah yang Aman dan Legal 2026'
    OR seo_meta_description IS DISTINCT FROM 'Panduan membeli tanah murah secara aman: cek legalitas, negosiasi harga, jenis sertifikat yang harus dimiliki, dan cara menghindari penipuan jual beli tanah.'
  );

-- (17) cara-jual-rumah-cepat-laku  [TITLE_LONG 71]
UPDATE artikel SET
  seo_meta_title       = '9 Cara Jual Rumah Cepat Laku dengan Harga Terbaik',
  seo_meta_description = 'Strategi menjual rumah dengan cepat dan harga tinggi: penetapan harga tepat, foto profesional, deskripsi menarik, hingga pemasaran digital properti.',
  updated_at           = NOW()
WHERE slug = 'cara-jual-rumah-cepat-laku'
  AND (
    seo_meta_title       IS DISTINCT FROM '9 Cara Jual Rumah Cepat Laku dengan Harga Terbaik'
    OR seo_meta_description IS DISTINCT FROM 'Strategi menjual rumah dengan cepat dan harga tinggi: penetapan harga tepat, foto profesional, deskripsi menarik, hingga pemasaran digital properti.'
  );

-- (18) inovasi-teknologi-hemat-energi-dalam-konstruksi  [TITLE_LONG 84]
UPDATE artikel SET
  seo_meta_title       = 'Teknologi Hemat Energi dalam Konstruksi Bangunan',
  seo_meta_description = 'Inovasi teknologi hemat energi dalam konstruksi: dari smart building, insulasi canggih, hingga panel surya untuk bangunan masa depan yang efisien.',
  updated_at           = NOW()
WHERE slug = 'inovasi-teknologi-hemat-energi-dalam-konstruksi'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Teknologi Hemat Energi dalam Konstruksi Bangunan'
    OR seo_meta_description IS DISTINCT FROM 'Inovasi teknologi hemat energi dalam konstruksi: dari smart building, insulasi canggih, hingga panel surya untuk bangunan masa depan yang efisien.'
  );

-- (19) listing-properti-panduan-lengkap  [TITLE_LONG 85]
UPDATE artikel SET
  seo_meta_title       = 'Listing Properti: Panduan Memasarkan dengan Efektif',
  seo_meta_description = 'Cara membuat listing properti yang menarik calon pembeli: foto berkualitas, deskripsi jelas, penetapan harga kompetitif, dan platform pemasaran digital.',
  updated_at           = NOW()
WHERE slug = 'listing-properti-panduan-lengkap'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Listing Properti: Panduan Memasarkan dengan Efektif'
    OR seo_meta_description IS DISTINCT FROM 'Cara membuat listing properti yang menarik calon pembeli: foto berkualitas, deskripsi jelas, penetapan harga kompetitif, dan platform pemasaran digital.'
  );

-- (20) daftar-agen-properti-online  [TITLE_LONG 79]
UPDATE artikel SET
  seo_meta_title       = 'Platform & Agen Properti Online Terbaik Indonesia',
  seo_meta_description = 'Daftar platform dan agen properti online terkemuka di Indonesia: keunggulan masing-masing, biaya komisi, dan cara memilih yang sesuai kebutuhan.',
  updated_at           = NOW()
WHERE slug = 'daftar-agen-properti-online'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Platform & Agen Properti Online Terbaik Indonesia'
    OR seo_meta_description IS DISTINCT FROM 'Daftar platform dan agen properti online terkemuka di Indonesia: keunggulan masing-masing, biaya komisi, dan cara memilih yang sesuai kebutuhan.'
  );

-- (21) brand-plafon-pvc-terbaik  [TITLE_LONG 84]
UPDATE artikel SET
  seo_meta_title       = 'Brand Plafon PVC Terbaik untuk Hunian Modern',
  seo_meta_description = 'Panduan memilih brand plafon PVC berkualitas: perbandingan material, ketahanan, estetika, harga, dan rekomendasi merek terpercaya untuk hunian modern.',
  updated_at           = NOW()
WHERE slug = 'brand-plafon-pvc-terbaik-panduan-memilih-plafon-pvc-berkualitas-untuk-hunian-modern'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Brand Plafon PVC Terbaik untuk Hunian Modern'
    OR seo_meta_description IS DISTINCT FROM 'Panduan memilih brand plafon PVC berkualitas: perbandingan material, ketahanan, estetika, harga, dan rekomendasi merek terpercaya untuk hunian modern.'
  );

-- (22) 5-manfaat-air-hangat-di-rumah  [DESC_LONG 166]
UPDATE artikel SET
  seo_meta_description = 'Lima manfaat air hangat di rumah yang sering tidak disadari: dari relaksasi otot, kenyamanan mandi pagi, hingga efisiensi konsumsi air panas harian.',
  updated_at           = NOW()
WHERE slug = '5-manfaat-air-hangat-di-rumah'
  AND seo_meta_description IS DISTINCT FROM 'Lima manfaat air hangat di rumah yang sering tidak disadari: dari relaksasi otot, kenyamanan mandi pagi, hingga efisiensi konsumsi air panas harian.';

-- (23) perumahan-eksklusif (sudah 301 redirect, DB tetap dirapikan)
UPDATE artikel SET
  seo_meta_title       = 'Perumahan Eksklusif Parung Bogor dengan Fasilitas',
  seo_meta_description = 'Perumahan eksklusif di Parung Bogor dengan fasilitas lengkap: keamanan 24 jam, taman, kolam renang, dan akses strategis ke Jakarta Selatan.',
  updated_at           = NOW()
WHERE slug = 'perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap'
  AND (
    seo_meta_title       IS DISTINCT FROM 'Perumahan Eksklusif Parung Bogor dengan Fasilitas'
    OR seo_meta_description IS DISTINCT FROM 'Perumahan eksklusif di Parung Bogor dengan fasilitas lengkap: keamanan 24 jam, taman, kolam renang, dan akses strategis ke Jakarta Selatan.'
  );

COMMIT;

-- ────────────────────────────────────────────────────────────────────────────
-- Verifikasi pasca-eksekusi — jalankan ini untuk mengonfirmasi hasil:
-- ────────────────────────────────────────────────────────────────────────────
-- SELECT slug,
--        char_length(seo_meta_title)       AS title_len,
--        char_length(seo_meta_description) AS desc_len,
--        seo_meta_title,
--        seo_meta_description
--   FROM artikel
--  WHERE slug IN (
--    'cara-memilih-rumah-parung',
--    'harga-tiket-masuk-di-the-beach-gdc',
--    'perumahan-di-bogor',
--    '7-alasan-memilih-rumah-cluster-di-parung-untuk-hunian-keluarga',
--    '5-hal-yang-gen-z-harus-tahu-sebelum-beli-rumah-pertama',
--    'rumah-di-kawasan-strategis',
--    'desain-rumah-minimalis-modern',
--    'renovasi-rumah-tua-jadi-modern',
--    'konsep-desain-rumah-eco-friendly',
--    'desain-rumah-dengan-efisiensi-energi-yang-tinggi',
--    'sentuhan-elemen-kayu-interior-rumah-grand-duta-city',
--    'konsultan-properti-pilar-investasi',
--    'cluster-rumah-baru-di-parung-bogor',
--    'keuntungan-investasi-rumah-kos',
--    'seminar-bisnis-properti-real-estat',
--    'cara-membeli-tanah-murah',
--    'cara-jual-rumah-cepat-laku',
--    'inovasi-teknologi-hemat-energi-dalam-konstruksi',
--    'listing-properti-panduan-lengkap',
--    'daftar-agen-properti-online',
--    'brand-plafon-pvc-terbaik-panduan-memilih-plafon-pvc-berkualitas-untuk-hunian-modern',
--    '5-manfaat-air-hangat-di-rumah',
--    'perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap'
-- )
-- ORDER BY slug;
--
-- Semua title_len harus ≤ 60, semua desc_len harus 120–160.
