# Audit Semrush — 31 Agustus 2026

Dijalankan setelah deploy Fase 1–5 + kunci antikanibalisasi (`main` di
`4dee66d`). Database Semrush: `id`. Semua data diambil langsung dari Semrush
MCP (bukan file lokal — Semrush hanya bisa mengaudit domain live yang sudah
dirayapi).

## 1. Posisi saat ini (situs sendiri)

| Kata kunci | Volume/bulan | Posisi | URL |
|---|---|---|---|
| grand duta city south of jakarta | 260 | **4** | `/` |
| grand duta city parung | 1.300 | **8** | `/` |
| grand duta city | 4.400 | 15 | `/` |

Konsisten dengan yang dilaporkan pemilik. Semrush belum merayapi ulang
deploy Fase 1–5 (tayang beberapa jam sebelum audit ini), jadi baris
kanibalisasi 9-halaman yang tercatat Semrush (`/lokasi-akses` posisi 32,
`/disclaimer` 65, dst.) adalah DATA LAMA dari sebelum Fase 1. Diverifikasi
langsung ke produksi: title/H1 kesembilan halaman itu SUDAH tidak memuat
frasa target sejak deploy `84e9fba`. Semrush akan memperbarui setelah crawl
berikutnya (siklus mereka, bukan sesuatu yang bisa dipicu manual dari sisi
kita).

## 2. TEMUAN UTAMA — kemungkinan negative SEO via spam backlink

19 backlink dari 16 domain berbeda, seluruhnya dengan teks anchor identik:

> "High Quality Dofollow Backlinks DA 50 PA 40 Premium PBN Network Service
> granddutacitysouthofjakarta.com Rank First Page Google Fast SEO Link
> Building Buy Backlinks Online Cheap"

Karakteristik:
- Semua **dofollow** (kolom `nofollow` = false)
- Domain sumber tidak relevan sama sekali: casino/betting
  (`casinooftheking.com`, `betwinnermirror.com`), toko generik
  (`onlineshoppingidea.com`, `nivira.shop`), scraper/archive
  (`archive-hu.com`, `masihnyata.com`)
- Judul halaman sumber seragam: "🏆🏆Boost your Google rankings with Premium
  PBN & Link Building🏆🏆"
- **Timeline**: mulai 2 Juli 2026, memuncak akhir Agustus 2026 — bertepatan
  dengan periode penurunan ranking yang dilaporkan pemilik
- Total referring domain naik dari 84 (Jan 2026) ke 138 (sekarang);
  Authority Score Semrush situs justru naik 8→14 di periode yang sama,
  jadi Semrush kemungkinan sudah mendiskon bobot link ini — tapi itu tidak
  membuktikan Google Search melakukan hal yang sama

**Ini kemungkinan negative SEO**: pihak ketiga (kompetitor atau vendor jasa
"SEO gelap" yang tidak diminta) menautkan spam ke domain target dengan anchor
mencurigakan, dengan tujuan Google mengasosiasikan situs dengan jaringan link
kualitas rendah. Bukan link yang diminta atau dibayar pemilik.

**Draf disavow** sudah disiapkan di `disavow-2026-08-31.txt` (16 domain).
BELUM diunggah — ini keputusan pemilik, bukan agent, karena disavow yang
salah sasaran bisa menghapus nilai link yang justru netral/positif. Google
juga menyatakan mereka umumnya sudah mengabaikan spam kualitas rendah secara
otomatis, jadi disavow adalah langkah pencegahan, bukan jaminan perbaikan.

**Rekomendasi ke pemilik**: tinjau draf, lalu unggah di Search Console →
Links → Disavow links (butuh akses langsung, tidak bisa dilakukan API/MCP).

## 3. TEMUAN UTAMA — brand dikuasai 3+ domain lain, bukan cuma 1

Audit sebelumnya (tanpa Semrush) hanya menemukan `granddutacity-official.com`.
Data SERP aktual menunjukkan lanskap yang lebih ramai:

| Domain | Posisi "grand duta city parung" | Posisi "...south of jakarta" | Authority Score | Traffic organik est. |
|---|---|---|---|---|
| **situs kita** | 6–8 | 4 | **14** (tertinggi) | 917/bln |
| granddutacitysoj.com | 3 | **1** | 9 | 748/bln |
| granddutacityparung.net | 2 & 4 | 12 | 8 | 158/bln |
| southofjakarta.com | — | redirect → granddutacitysoj.com (entitas sama) | — | — |
| granddutacity-official.com | tidak masuk top 15 langsung, tapi menang di "grand duta city bekasi" | — | belum diukur | — |

Detail per domain:

- **`granddutacitysoj.com`** — ANCAMAN TERBESAR. Posisi **#1** untuk
  "grand duta city" (4.400/bln) dan "grand duta city south of jakarta"
  (260/bln, KATA KUNCI KEDUA TARGET PEMILIK), posisi #3 untuk
  "grand duta city parung". SPA Nuxt.js, title generik "Grand Duta City
  South of Jakarta", nol `<h1>` terdeteksi di HTML awal (kemungkinan
  dirender client-side). `southofjakarta.com` redirect ke domain ini — jadi
  keduanya satu entitas, bukan dua pesaing terpisah.
- **`granddutacityparung.net`** — 1.472 kata, menyebut "Duta Putra Land"
  (developer yang sama), harga "600 Jutaan" (LEBIH RENDAH dari harga resmi
  700 jutaan di situs kita — potensi kebingungan harga bagi calon pembeli),
  nomor WhatsApp BERBEDA (`6281288968678` vs `628131742034` milik pemilik).
  Kemungkinan agen/marketing lain yang memasarkan proyek yang sama dengan
  data yang sudah usang atau tidak resmi.
- **`granddutacity.com`** — bukan pesaing brand langsung (menyasar proyek
  Bekasi), tapi trafik organiknya BESAR: 10.146/bln, 502 keyword. Menunjukkan
  betapa dominannya asosiasi "Grand Duta City" dengan proyek Bekasi di mata
  Google — konteks yang menjelaskan mengapa "grand duta city" polos (posisi
  15) jauh lebih sulit dimenangkan dibanding dua frasa yang lebih spesifik.

**Poin positif**: Authority Score situs kita (14) LEBIH TINGGI dari
`granddutacitysoj.com` (9) dan `granddutacityparung.net` (8). Bukan kalah
otoritas — kalah relevansi entitas/title untuk momen crawl tertentu, dan
Fase 1–5 sudah memperbaiki itu di sisi kita. Yang belum bisa dikendalikan
dari kode: domain lain terus memperbarui kontennya juga.

## 4. Profil backlink situs sendiri

- Authority Score: **14**, 404 backlink, 138 referring domain, 202 dofollow
- Referring domain berkualitas: `zillow.com` (AS 98), `pinhome.id` (AS 59),
  `tapera.go.id` (AS 56, domain pemerintah — sikumbang.tapera.go.id juga
  muncul di top 5 SERP untuk kedua kata kunci target, ini aset yang bagus)
- Anchor text dominan sudah benar: "granddutacitysouthofjakarta.com" (94
  domain), "grand duta city parung" (9 domain) — TIDAK over-optimized

## 5. Peluang keyword yang belum digarap (dari organic research)

Ranking tapi trafik masih nol/rendah, volume cukup besar:

- "model rumah terbaru" — posisi 40, volume 5.400/bln → `/desain-rumah-minimalis-modern`
- "model rumah minimalis" — posisi 53, volume 8.100/bln → halaman yang sama
- "perusahaan properti" — posisi 35, volume 590/bln → `/jabatan-di-perusahaan-properti`
- "merk plafon pvc" — posisi 40, volume 720/bln → artikel plafon PVC

Halaman-halaman ini SUDAH ada dan sudah terindeks untuk keyword bervolume
tinggi tapi posisinya di luar top 30 — kandidat kuat untuk perbaikan on-page
(bukan kanibalisasi, murni soal kualitas konten & optimasi).

## 6. Kesimpulan dan urutan tindakan

1. **Sudah beres** (Fase 1–5 + guard G13–G17): kanibalisasi internal 15→3
   halaman, homepage tidak lagi CollectionPage/Product, entitas brand
   tersambung. Perlu waktu untuk Semrush & Google merayapi ulang.
2. **Perlu keputusan pemilik**: tinjau dan unggah draf disavow (item 2).
3. **Perlu keputusan strategis pemilik**: apakah `granddutacityparung.net`
   perlu ditegur/diklarifikasi (nomor WhatsApp beda, harga beda) — ini
   berpotensi membingungkan calon pembeli dan bukan sekadar isu SEO.
4. **Google Business Profile** — masih belum dikerjakan, masih rekomendasi
   dengan dampak tertinggi yang tersisa untuk melawan `granddutacitysoj.com`
   di posisi #1.
5. Opsional, dampak sedang: optimasi 4 halaman di item 5 untuk keyword
   bervolume besar yang sudah ranking tapi belum optimal.
