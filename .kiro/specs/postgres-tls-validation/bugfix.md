# Dokumen Persyaratan Bugfix

## Pendahuluan

Koneksi TLS ke database Postgres di-deploy dengan `rejectUnauthorized: false` sebagai fallback default ketika environment variable `DATABASE_SSL_CA` tidak diset. Ini berarti sertifikat server database **tidak divalidasi**, membuka risiko serangan Man-in-the-Middle (MITM) pada jalur antara server aplikasi dan database.

Bug ini ada di dua lokasi:
- `src/db/index.ts` (pool koneksi CMS kustom)
- `src/payload.config.ts` (pool koneksi Payload CMS)

Dampaknya medium — pada deployment modern (Vercel ↔ Supabase/Neon) traffic sudah terenkripsi di level infrastruktur, namun ini melanggar prinsip defense-in-depth dan berpotensi melanggar compliance requirement.

Perbaikan ini **tidak memaksa** `rejectUnauthorized: true` tanpa CA (karena akan memutus koneksi pada deployment existing), melainkan fokus pada: peringatan startup yang jelas, dokumentasi env var, dan memastikan logika validasi penuh berjalan benar saat CA tersedia.

## Analisis Bug

### Perilaku Saat Ini (Cacat)

1.1 KETIKA aplikasi di-deploy ke environment non-lokal (production/staging) DAN `DATABASE_SSL_CA` tidak diset, MAKA sistem menggunakan `{ rejectUnauthorized: false }` untuk koneksi pool di `src/db/index.ts` tanpa peringatan apapun di log — sertifikat server DB tidak divalidasi.

1.2 KETIKA aplikasi di-deploy ke environment non-lokal DAN `DATABASE_SSL_CA` tidak diset, MAKA sistem menggunakan `{ rejectUnauthorized: false }` untuk koneksi pool Payload CMS di `src/payload.config.ts` tanpa peringatan apapun di log — sertifikat server DB tidak divalidasi.

1.3 KETIKA operator memeriksa `.env.example`, MAKA tidak ada dokumentasi tentang `DATABASE_SSL_CA` sehingga operator tidak mengetahui bahwa variable ini perlu diset untuk keamanan TLS penuh.

### Perilaku yang Diharapkan (Benar)

2.1 KETIKA aplikasi di-deploy ke environment non-lokal DAN `DATABASE_SSL_CA` tidak diset, MAKA sistem HARUS meng-log WARNING yang jelas di startup (sekali, bukan per-koneksi) yang menginformasikan bahwa validasi sertifikat TLS dimatikan dan merekomendasikan pengaturan `DATABASE_SSL_CA`.

2.2 KETIKA aplikasi di-deploy ke environment non-lokal DAN `DATABASE_SSL_CA` tidak diset, MAKA logika fallback `{ rejectUnauthorized: false }` tetap digunakan (agar deployment existing tidak putus), namun disertai warning log sesuai 2.1.

2.3 KETIKA `DATABASE_SSL_CA` diset, MAKA sistem HARUS menggunakan validasi sertifikat penuh (`rejectUnauthorized: true` dengan CA certificate) untuk semua pool koneksi (sudah benar di kode saat ini — perlu dijaga).

2.4 KETIKA operator memeriksa `.env.example`, MAKA file tersebut HARUS mendokumentasikan `DATABASE_SSL_CA` beserta deskripsi, contoh nilai, dan rekomendasi keamanan.

### Perilaku yang Tidak Berubah (Pencegahan Regresi)

3.1 KETIKA koneksi database mengarah ke host lokal (localhost/127.0.0.1), MAKA sistem HARUS TETAP tidak menggunakan SSL sama sekali (perilaku existing).

3.2 KETIKA `DATABASE_SSL_CA` diset dan host non-lokal, MAKA sistem HARUS TETAP menggunakan `{ ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true }` pada kedua pool koneksi.

3.3 KETIKA pool koneksi di `src/db/index.ts` mengalami error pada klien idle, MAKA sistem HARUS TETAP menangani event 'error' dan meng-log pesan kesalahan tanpa mematikan proses.

3.4 KETIKA environment `NODE_ENV` bukan production, MAKA pool database HARUS TETAP di-cache di `globalThis` untuk menghindari menguras slot koneksi saat hot reload.

---

### Derivasi Kondisi Bug

**Fungsi Kondisi Bug** — Mengidentifikasi input yang memicu bug:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ConnectionConfig
  OUTPUT: boolean
  
  // Bug terjadi ketika host non-lokal DAN CA tidak tersedia
  RETURN NOT isLocalHost(X.connectionString) AND X.DATABASE_SSL_CA IS EMPTY
END FUNCTION
```

**Spesifikasi Properti** — Perilaku yang benar untuk input bug:

```pascal
// Properti: Fix Checking — Warning Log saat TLS Tidak Tervalidasi
FOR ALL X WHERE isBugCondition(X) DO
  result ← initializeDbConnection'(X)
  ASSERT warningLogEmitted(result, "TLS certificate validation disabled")
  AND result.sslConfig.rejectUnauthorized = false  // tetap fallback, tidak putus
END FOR
```

**Tujuan Preservasi** — Kode yang diperbaiki berperilaku identik untuk input non-bug:

```pascal
// Properti: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT initializeDbConnection(X) = initializeDbConnection'(X)
END FOR
```

Ini memastikan bahwa:
- Koneksi lokal tetap tanpa SSL
- Koneksi dengan CA tetap menggunakan validasi penuh
- Pool caching dan error handling tidak terpengaruh
