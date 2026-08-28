# Requirements Document

## Introduction

Pada 27 Agustus 2026 seluruh fitur AI di CMS berhenti bekerja dengan pesan: "Semua model yang tersedia gagal. Model yang dicoba: gpt-5-6-terra, DeepSeek-V4-Flash-0731, DeepSeek-V4-Pro." disertai potongan HTML halaman error Cloudflare.

Investigasi memastikan penyebab utamanya ada di sisi provider: host `ai.tioo.eu.org` membalas HTTP 530 / Cloudflare Error 1033 (Tunnel error) pada semua path dan method, dengan maupun tanpa autentikasi, dalam ~0,1 detik. Tunnel `cloudflared` ke origin tidak terhubung, sehingga request tidak pernah mencapai model mana pun.

Namun insiden tersebut menyingkap tiga kelemahan nyata pada lapisan rotasi kita (`src/lib/v2-admin/ai-rotation.ts` dan `src/lib/ai/client.ts`):

1. Provider cadangan tidak pernah dicoba pada tugas artikel. Kandidat disusun provider-major (semua model provider pertama lebih dulu), lalu dipotong `slice(0, maxCandidates)`. Karena `AI_BUDGETS.long.maxCandidates` bernilai 3 dan provider pertama menyumbang tepat 3 model, tidak ada slot tersisa untuk provider lain. Docstring modul menjanjikan rotasi "lalu provider lain", tetapi pemotongan itu membuat janji tersebut tidak pernah terpenuhi untuk `article`, `image-meta`, dan `text-tool`.
2. Anggaran waktu terbakar pada host yang sudah pasti mati. Kegagalan level-host (530/1033, DNS gagal, koneksi ditolak, TLS gagal) diulang untuk setiap model pada `baseUrl` yang sama. Ketiga percobaan pasti gagal dan menghabiskan jatah waktu yang seharusnya dipakai mencoba provider sehat.
3. Isi respons mentah bocor ke pesan yang dilihat penulis. `client.ts` menyusun pesan dengan `detail.slice(0, 500)` dari `response.text()`, sehingga halaman HTML Cloudflare tampil di UI admin. Pesan seperti itu tidak bisa ditindaklanjuti penulis dan menyulitkan operator membedakan gangguan provider dari bug aplikasi.

Tujuan fitur ini adalah membuat sistem AI tetap berfungsi saat satu provider tumbang dan membuat kegagalan yang tersisa terbaca serta dapat ditindaklanjuti, tanpa menurunkan kualitas keluaran ketika semua provider sehat.

## Glossary

- **Kandidat (candidate)**: satu kombinasi `baseUrl` + `apiKey` + `model` yang siap dicoba, dihasilkan oleh `resolveAiCandidates()`.
- **Provider**: satu baris pada tabel `ai_providers` yang memuat `baseUrl`, `apiKey` terenkripsi, `defaultModel`, dan daftar `models` aktif. Satu provider dapat menyumbang banyak kandidat.
- **Rotasi (rotation)**: proses `runAiTask()` mencoba kandidat satu per satu sampai ada yang memenuhi kontrak `parse`.
- **Urutan provider-major**: cara penyusunan kandidat saat ini, yaitu menuntaskan seluruh model milik satu provider sebelum berpindah ke provider berikutnya. Inilah yang membuat pemotongan `slice(0, maxCandidates)` menghabiskan semua slot pada satu provider.
- **Kegagalan level-host**: kegagalan yang menandakan `baseUrl` itu sendiri tidak dapat dihubungi sehingga model apa pun di belakangnya pasti gagal. Contoh: HTTP 502, 503, 504, 530 dari edge atau gateway, kegagalan resolusi DNS, koneksi ditolak, dan kegagalan handshake TLS.
- **Kegagalan spesifik-model**: kegagalan yang hanya berlaku untuk satu model sementara host tetap sehat. Contoh: model tidak dikenal, context terlalu panjang, `response_format` tidak didukung, atau keluaran melanggar kontrak `parse`.
- **Cloudflare Error 1033**: kode diagnostik Cloudflare yang menyertai HTTP 530 dan berarti tunnel ke server origin tidak terhubung. Menandakan gangguan di sisi provider, bukan pada request kita.
- **Anggaran waktu (budget)**: batas `perAttemptMs`, `totalMs`, dan `maxCandidates` per jenis tugas, didefinisikan pada `AI_BUDGETS` dan selalu lebih kecil dari `maxDuration` route.

## Requirements

### Requirement 1: Failover lintas provider dijamin

**User Story:** Sebagai admin yang menulis artikel, saya ingin sistem otomatis berpindah ke provider AI lain yang sehat ketika provider utama tumbang, sehingga pekerjaan saya tidak berhenti.

#### Acceptance Criteria

1.1 WHEN terdapat lebih dari satu provider aktif dan provider berprioritas tertinggi tidak dapat dihubungi THEN sistem SHALL mencoba minimal satu kandidat dari provider berbeda sebelum menyatakan seluruh percobaan gagal
1.2 WHEN daftar kandidat dibatasi oleh `maxCandidates` THEN sistem SHALL menjamin sedikitnya satu slot untuk setiap provider aktif berikutnya, alih-alih mengisi seluruh slot dengan model dari satu provider
1.3 WHEN hanya tersedia satu provider aktif THEN sistem SHALL tetap mencoba beberapa model milik provider tersebut seperti perilaku saat ini
1.4 WHEN konfigurasi env (`getAiConfig()`) tersedia sebagai jaring terakhir THEN sistem SHALL tetap menyertakannya sebagai kandidat terakhir meskipun slot provider DB sudah terisi
1.5 WHEN semua provider sehat THEN urutan percobaan pertama SHALL tetap model pilihan eksplisit pengguna, lalu default provider, sehingga kualitas keluaran tidak menurun

### Requirement 2: Host yang tidak dapat dihubungi tidak dicoba berulang

**User Story:** Sebagai admin, saya ingin sistem berhenti mengulang percobaan ke server yang jelas mati, sehingga saya cepat mendapat hasil dari provider lain daripada menunggu lama lalu gagal.

#### Acceptance Criteria

2.1 WHEN sebuah percobaan gagal karena kondisi level-host (HTTP 5xx dari edge/gateway seperti 502/503/504/530, kegagalan DNS, koneksi ditolak, atau kegagalan TLS) THEN sistem SHALL menandai `baseUrl` tersebut tidak dapat dihubungi untuk sisa request berjalan
2.2 WHEN sebuah `baseUrl` sudah ditandai tidak dapat dihubungi THEN sistem SHALL melewati semua kandidat lain yang memakai `baseUrl` sama dan langsung mencoba kandidat dari `baseUrl` berbeda
2.3 WHEN kegagalan bersifat spesifik-model (model tidak dikenal, context terlalu panjang, `response_format` tidak didukung, atau keluaran melanggar kontrak `parse`) THEN sistem SHALL CONTINUE TO mencoba model lain pada `baseUrl` yang sama seperti perilaku saat ini
2.4 WHEN seluruh `baseUrl` yang tersedia sudah ditandai tidak dapat dihubungi THEN sistem SHALL berhenti lebih awal tanpa menunggu sisa anggaran waktu habis
2.5 WHEN anggaran waktu total hampir habis THEN sistem SHALL CONTINUE TO menghormati `MIN_ATTEMPT_MS` dan tidak memulai percobaan yang pasti timeout

### Requirement 3: Pesan kegagalan bersih dan dapat ditindaklanjuti

**User Story:** Sebagai admin non-teknis, saya ingin pesan error yang menjelaskan apa yang terjadi dan apa langkah saya, bukan potongan kode HTML.

#### Acceptance Criteria

3.1 WHEN provider membalas dengan body non-JSON (misalnya HTML halaman error proxy/CDN) THEN sistem SHALL NOT menampilkan potongan HTML mentah tersebut pada pesan yang dilihat pengguna
3.2 WHEN provider membalas HTTP 530 atau body-nya teridentifikasi sebagai halaman error Cloudflare THEN pesan pengguna SHALL menyatakan bahwa gateway provider tidak dapat dihubungi beserta kode diagnostiknya (misalnya 530 atau 1033)
3.3 WHEN seluruh kandidat gagal THEN pesan agregat SHALL menyebutkan jumlah provider dan model yang dicoba serta kategori kegagalan terakhir, tanpa membocorkan isi body respons
3.4 WHEN kegagalan disebabkan konfigurasi di sisi kita (misalnya API key ditolak dengan 401/403) THEN pesan SHALL membedakannya secara eksplisit dari gangguan ketersediaan provider
3.5 WHEN pesan error dibentuk THEN sistem SHALL NOT menyertakan nilai API key, header Authorization, atau data kredensial apa pun

### Requirement 4: Diagnostik cukup untuk membedakan gangguan provider dari bug aplikasi

**User Story:** Sebagai operator, saya ingin langsung tahu apakah gangguan berasal dari provider atau dari kode kita, tanpa harus menelusuri manual seperti pada insiden ini.

#### Acceptance Criteria

4.1 WHEN sebuah percobaan gagal THEN sistem SHALL mencatat pada log server: nama provider, `baseUrl` tanpa kredensial, model, kode status, kategori kegagalan, dan durasi percobaan
4.2 WHEN seluruh percobaan gagal THEN log SHALL memuat ringkasan yang menunjukkan apakah kegagalan terkonsentrasi pada satu `baseUrl` (indikasi gangguan provider) atau tersebar di beberapa provider (indikasi masalah sistemik di sisi kita)
4.3 WHEN sebuah percobaan berhasil setelah rotasi THEN sistem SHALL CONTINUE TO melaporkan model yang akhirnya dipakai ke pemanggil seperti perilaku saat ini melalui `AiTaskResult.model` dan `rotated`
4.4 WHEN status kesehatan provider ditampilkan di UI Konfigurasi AI THEN informasi tersebut SHALL cukup untuk mengidentifikasi provider yang sedang tidak dapat dihubungi

### Requirement 5: Tidak ada regresi pada perilaku yang sudah benar

**User Story:** Sebagai pemilik sistem, saya ingin perbaikan ketahanan ini tidak merusak alur AI yang sudah berjalan baik.

#### Acceptance Criteria

5.1 WHEN provider utama sehat pada percobaan pertama THEN sistem SHALL CONTINUE TO menyelesaikan tugas dengan tepat satu panggilan `chatCompletion`, tanpa tambahan permintaan jaringan
5.2 WHEN tidak ada provider maupun konfigurasi env sama sekali THEN sistem SHALL CONTINUE TO melempar `AiDisabledError` dengan pesan `AI_NOT_CONFIGURED_MESSAGE`
5.3 WHEN permintaan dibatalkan dari luar karena klien memutus koneksi THEN sistem SHALL CONTINUE TO tidak merotasi model dan mengembalikan status 499
5.4 WHEN keluaran model gagal divalidasi oleh `parse` THEN sistem SHALL CONTINUE TO memperlakukannya sebagai kegagalan model dan merotasi, sehingga keluaran yang melanggar kontrak tidak pernah sampai ke penulis
5.5 WHEN anggaran waktu tiap tugas dipakai THEN sistem SHALL CONTINUE TO menjaga total waktu rotasi di bawah `maxDuration` route masing-masing
5.6 WHEN suite pengujian dijalankan THEN seluruh 73 pengujian yang ada SHALL tetap lulus

## Out of Scope

- Memperbaiki atau memantau infrastruktur provider pihak ketiga. Menghidupkan kembali tunnel Cloudflare adalah tanggung jawab operator provider dan tidak dapat diselesaikan dari kode ini.
- Menambah provider AI baru atau mengubah kontrak prompt dan kualitas keluaran.
- Membangun dasbor pemantauan uptime provider secara penuh. Requirement 4 hanya menuntut diagnostik yang memadai, bukan sistem monitoring tersendiri.
