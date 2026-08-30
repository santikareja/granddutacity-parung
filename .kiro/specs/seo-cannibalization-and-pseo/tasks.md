# Rencana Implementasi

Urutan task ini bukan sembarang: setiap fase adalah prasyarat fase berikutnya, dan beberapa fase dipisahkan **gate** yang tidak boleh dilewati. Setiap task mereferensikan requirement di `requirements.md` dan section di `design.md`.

## Aturan yang berlaku untuk SELURUH task

- **Satu fase = satu commit = satu deploy.** Pesan commit berprefiks `seo(faseN):`. Jangan gabungkan dua fase dalam satu deploy — bila peringkat bergerak, penyebabnya jadi tidak bisa diatribusikan.
- **Homepage read-mostly.** Task 1–7 TIDAK BOLEH menyentuh `title`, `description`, `alternates.canonical`, `robots`, atau `<h1>` homepage. Perubahan homepage hanya di Task 8.
- **Sebelum menandai task selesai**, jalankan `npm run lint && npm run test && npm run build` dan pastikan hijau.
- **Bila ragu atau menemukan ambiguitas**, tanyakan ke pemilik. Jangan memilih sendiri nilai fakta yang bertentangan.
- **Jangan pernah** menambahkan `noindex` ke homepage, `/cluster-ladera`, `/cluster-cascada`, `/pricelist-grand-duta-city`, `/kontak`, `/lokasi-akses-grand-duta-city-parung`, `/cara-beli-kpr`, `/galeri`, `/update-stok-siteplan-grand-duta-city-parung`, `/about`, `/artikel`, atau `/category/*`.
- **Jangan ubah** 13 aturan `redirects()` yang sudah ada di `next.config.ts`; hanya tambah.

---

- [x] 0. Bangun pengaman SEBELUM perubahan apa pun

  - [x] 0.1 Buat script baseline snapshot
    - File baru: `scripts/seo-snapshot.mjs`
    - Baca daftar URL dari `https://granddutacitysouthofjakarta.com/sitemap.xml` live, tambahkan `/disclaimer` dan `/privacy-policy` yang belum masuk sitemap
    - Per URL rekam: `httpStatus`, `redirectLocation` (fetch tanpa follow redirect), `<title>` literal, meta description, `link[rel=canonical]`, meta robots, `X-Robots-Tag`, jumlah + teks tiap `<h1>`, daftar teks `<h2>`, jumlah blok JSON-LD, daftar `@type`, `og:title`, `og:description`, `og:site_name`, `byteLength` HTML
    - **PENTING**: hitung blok JSON-LD dengan mencocokkan `<script type="application/ld+json">...</script>` secara eksplisit. Regex sederhana pada string `application/ld+json` menghasilkan positif palsu karena RSC flight payload Next.js menduplikasi JSON-LD — homepage terhitung 15 padahal hanya 7 blok nyata
    - Simpan ke `.kiro/specs/seo-cannibalization-and-pseo/snapshots/<ISO-date>.json`
    - _Design: Arsitektur pengaman → Lapisan 1_
    - _Requirements: R9_

  - [x] 0.2 Jalankan baseline snapshot pertama dan commit hasilnya
    - `node scripts/seo-snapshot.mjs`
    - Commit file JSON hasilnya. Ini acuan rollback dan pembanding untuk seluruh fase
    - **EXPECTED OUTCOME**: file snapshot berisi ~50 URL (16 halaman inti + 32 artikel + 2 legal) dengan semua field terisi
    - Verifikasi manual bahwa homepage tercatat: title 54 char, canonical tanpa trailing slash, 1 `<h1>`, 7 blok JSON-LD
    - _Requirements: R1, R9_

  - [x] 0.3 Tulis guard test invarian metadata
    - File baru: `src/app/(site)/__tests__/seo-invariants.test.ts` (Vitest sudah terpasang; `npm run test` = `vitest --run`)
    - Implementasikan 12 guard sesuai `design.md` Lapisan 2: G1 title homepage memuat `Grand Duta City Parung`; G2 canonical homepage tepat `https://granddutacitysouthofjakarta.com`; G3 robots homepage `index !== false`; G4 nol title non-homepage memuat `Grand Duta City South of Jakarta`; G5 nol title non-homepage berakhiran `| Grand Duta City Parung` atau `| Grand Duta City`; G6 semua title ≤60 char; G7 semua description 120–160 char; G8 title unik; G9 description unik; G10 setiap halaman indexable punya canonical; G11 `openGraph.siteName` konsisten; G12 layout tidak mengekspor `title.template`
    - Daftar pengecualian untuk G6/G7 harus eksplisit dan berkomentar, bukan longgar
    - **EXPECTED OUTCOME PADA KODE BELUM DIPERBAIKI**: G4, G5, G6, G7, G11, G12 **GAGAL**. Kegagalan ini mengonfirmasi cacat C1–C7 memang ada
    - **JANGAN** memperbaiki kode pada task ini. Dokumentasikan guard mana yang gagal dan URL apa yang memicunya
    - _Design: Arsitektur pengaman → Lapisan 2_
    - _Requirements: R1, R3_

  - [x] 0.4 Tulis script verifikasi live pasca-deploy
    - File baru: `scripts/seo-verify.mjs`
    - Bandingkan snapshot terbaru terhadap baseline; **exit code non-nol** bila: ada URL 200→404; ada rantai redirect (tujuan redirect ternyata redirect lagi); homepage canonical/robots/jumlah h1 berubah; muncul title atau description duplikat baru
    - _Design: Arsitektur pengaman → Lapisan 3_
    - _Requirements: R2, R9_

  - [x] 0.5 Checkpoint pengaman
    - `npm run test` — guard test berjalan dan kegagalannya terdokumentasi
    - `npm run lint` bersih pada file baru
    - Baseline snapshot ter-commit
    - **GATE**: task 1 tidak boleh dimulai sebelum 0.1–0.4 selesai

---

- [ ] 1. Fase 1 — Cabut kanibalisasi (homepage tidak disentuh)

  - [x] 1.1 Hapus `title.template` dari layout
    - File: `src/app/(site)/layout.tsx` baris 31-34
    - Hapus HANYA baris `template: "%s | Grand Duta City Parung",`. **Pertahankan** `default` sebagai jaring aman untuk route tanpa metadata sendiri (`error.tsx` adalah client component)
    - **Mengapa aman untuk homepage**: Next 16 tidak menerapkan `title.template` dari `layout.js` ke `title` di `page.js` pada segmen yang sama. Homepage dan layout berada di segmen `(site)` yang sama, jadi template memang tidak pernah diterapkan. Terkonfirmasi dua arah: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md:287` dan HTML live (title homepage tidak bersuffix)
    - **VERIFIKASI WAJIB**: sesudah perubahan, title homepage harus tetap tepat `Grand Duta City Parung | Promo Hunian South of Jakarta` (54 karakter)
    - _Design: Fase 1 → Perubahan akar_
    - _Requirements: R1, R3_

  - [x] 1.2 Tulis ulang title 16 halaman non-homepage
    - Terapkan kolom "Title baru" dari tabel di `design.md` Fase 1 secara persis
    - File: `cluster-ladera/page.tsx`, `cluster-cascada/page.tsx`, `pricelist-grand-duta-city/page.tsx`, `kontak/page.tsx`, `lokasi-akses-grand-duta-city-parung/page.tsx`, `cara-beli-kpr/page.tsx`, `artikel/page.tsx`, `galeri/page.tsx`, `update-stok-siteplan-grand-duta-city-parung/page.tsx`, `about/page.tsx`, `privacy-policy/page.tsx`, `category/page.tsx`, `author/santika-reza/page.tsx`, dan `metaTitle` 3 kategori di `src/lib/articles.ts`
    - Prioritas tunggal tertinggi: **`/galeri`** — satu-satunya halaman yang memuat KEDUA kata kunci target
    - Jangan ubah `/tag/*` (sudah `noindex`, title tidak memuat frasa target) dan `/disclaimer` (title sudah bersih)
    - _Design: Fase 1 → Tabel title & H1_
    - _Requirements: R3_

  - [x] 1.3 Tulis ulang H1 pada 9 halaman
    - Terapkan kolom "H1 baru" dari tabel `design.md` Fase 1
    - Yang berubah: `/cluster-ladera`, `/cluster-cascada`, `/pricelist-…` (di `pricelist-content.tsx:685`), `/kontak` (149-152, gabungkan 2 baris jadi satu frasa), `/lokasi-akses-…`, `/cara-beli-kpr`, `/artikel`, `/galeri`, `/update-stok-…`
    - Setiap halaman tetap punya tepat **satu** `<h1>`
    - _Requirements: R3_

  - [x] 1.4 Perbaiki meta description — frasa target dan panjang
    - **Fakta terverifikasi live: description homepage 148 karakter, sudah di dalam rentang 120–160.** Artinya guard G7 TIDAK akan memaksa perubahan homepage. Jangan menyentuhnya di fase ini (R1)
    - **Hapus frasa `Grand Duta City South of Jakarta`** dari: `/galeri`, `/about`, `/category/panduan-properti` (`src/lib/articles.ts` `metaDescription`), `/author/santika-reza` (di `description` DAN `openGraph.description`)
    - **Bedakan yang byte-identical**: `/cluster-ladera` (146) vs `/cluster-cascada` (147) — Ladera = American Classic Modern + Verona/Malta/Tuscan; Cascada = Modern Tropical Resort + Aira/Manoa/Victoria/Alexandra
    - **Perbaiki panjang yang di luar rentang 120–160** (semua terukur dari HTML live):

      | Route | Panjang | Status | Target |
      |---|---|---|---|
      | `/update-stok-siteplan-grand-duta-city-parung` | 118 | SHORT | perpanjang ke 130–150 |
      | `/category` | 116 | SHORT | perpanjang ke 130–150 |
      | `/category/seputar-gdc` | 168 | LONG | pendekkan ke ≤160 |
      | `/category/kawasan` | 180 | LONG | pendekkan ke ≤160 |
      | `/author/santika-reza` | 183 | LONG | pendekkan ke ≤160 |
      | `/category/panduan-properti` | 193 | LONG | pendekkan ke ≤160 |

    - 12 route lain sudah di dalam rentang: `/` (148), `/cluster-ladera` (146), `/cluster-cascada` (147), `/pricelist-…` (149), `/kontak` (135), `/lokasi-akses-…` (149), `/cara-beli-kpr` (132), `/artikel` (148), `/galeri` (146), `/about` (141), `/privacy-policy` (121), `/disclaimer` (120) — hanya isinya yang diubah bila memuat frasa target, panjangnya sudah aman
    - _Requirements: R1, R3_

  - [x] 1.5 Normalisasi `openGraph.siteName` ke satu konstanta
    - File baru/tambahan: `src/lib/seo.ts` → `export const OG_SITE_NAME = "Grand Duta City Parung";`
    - Ganti 9 lokasi yang memakai varian berbeda: `disclaimer`, `privacy-policy`, `pricelist-grand-duta-city`, `kontak`, `cluster-cascada`, `lokasi-akses-…`, `cara-beli-kpr`, `artikel`, `SITE_NAME` di `article-taxonomy-archive.tsx`, dan `author/santika-reza` (yang memakai varian ketiga `Grand Duta City South of Jakarta`)
    - Ekstraksi ke konstanta mencegah drift terulang
    - _Design: Fase 1 → Normalisasi openGraph.siteName_
    - _Requirements: R3_

  - [ ] 1.6 Isi 2 meta description kosong dan pendekkan 12 title artikel
    - Description kosong (terverifikasi live, D0): `cluster-rumah-baru-di-parung-bogor`, `desain-rumah-minimalis-modern` — isi via kolom `seo_meta_description` di CMS
    - Title >80 karakter, pendekkan ke ≤60 via `seo_meta_title`: `keuntungan-investasi-rumah-kos` (100), `seminar-bisnis-properti-real-estat` (99), `desain-rumah-dengan-efisiensi-energi-yang-tinggi` (95), `konsep-desain-rumah-eco-friendly` (92), `rumah-di-kawasan-strategis` (91), `cluster-rumah-baru-di-parung-bogor` (87), `listing-properti-panduan-lengkap` (85), `inovasi-teknologi-hemat-energi-dalam-konstruksi` (84), `brand-plafon-pvc-terbaik-…` (84), `daftar-agen-properti-online` (83), `perumahan-eksklusif-di-parung-bogor-…` (82), `sentuhan-elemen-kayu-interior-rumah-grand-duta-city` (81)
    - **Perbaiki SELURUH 32 artikel, tidak ada yang dilewati.** Karena Fase 4 dikeluarkan dari spec ini, 18 kandidat pemangkasan masih terindeks — title terpotong pada halaman terindeks tetap merugikan CTR dan tetap dihitung sebagai duplikat/kualitas rendah
    - _Requirements: R3_

  - [ ] 1.7 **TANYAKAN PEMILIK** — keputusan redirect vs retitle
    - Dua URL bersaing dengan homepage: `cluster-rumah-baru-di-parung-bogor` (title memuat exact match keyword kedua) dan `perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap` (value proposition identik homepage)
    - **JANGAN eksekusi redirect sebelum pemilik memeriksa Search Console.** Bila salah satu URL sudah punya impresi/klik signifikan untuk query non-brand, opsi yang lebih aman adalah retitle + isi meta description, bukan redirect
    - Dokumentasikan keputusan pemilik di task ini sebelum lanjut ke 1.8
    - _Requirements: R2_

  - [ ] 1.8 Tambahkan redirect (hanya bila 1.7 memutuskan redirect)
    - File: `next.config.ts` `redirects()`
    - `{ source: "/cluster-rumah-baru-di-parung-bogor", destination: "/cluster-cascada", permanent: true }`
    - `{ source: "/perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap", destination: "/", permanent: true }`
    - Penempatan: **sesudah** aturan `/v2-admin` dan **sebelum** `/:path+/`, mengikuti komentar existing di file bahwa urutan menentukan pemenang
    - Verifikasi tidak ada rantai: tujuan kedua redirect harus merespons 200 langsung
    - _Requirements: R2_

  - [x] 1.9 Verifikasi guard test kini LOLOS
    - **PENTING**: jalankan test YANG SAMA dari task 0.3 — jangan tulis test baru
    - **EXPECTED OUTCOME**: G4, G5, G6, G7, G11, G12 kini **LOLOS**. G1, G2, G3, G8, G9, G10 tetap LOLOS
    - Bila G6/G7 masih gagal, pendekkan title/perbaiki panjang description sampai lolos — jangan melonggarkan asersi
    - _Requirements: R1, R3_

  - [x] 1.10 Checkpoint Fase 1 — verifikasi pra-deploy
    - `npm run lint && npm run test && npm run build` hijau
    - **Verifikasi manual invarian homepage** pada output build: title, description, canonical, robots, dan `<h1>` homepage identik dengan baseline snapshot
    - Jalankan `npx next build` lalu inspeksi HTML statis homepage, atau `next start` lokal + `curl`, untuk memastikan title homepage belum bergeser satu karakter pun
    - Commit atomik `seo(fase1): cabut kanibalisasi title & description non-homepage`
    - _Requirements: R1, R9_

  - [ ] 1.11 Deploy dan verifikasi live
    - Deploy ke produksi
    - `node scripts/seo-snapshot.mjs` lalu `node scripts/seo-verify.mjs`
    - **EXPECTED OUTCOME**: exit code 0. Setiap perbedaan terhadap baseline sudah disengaja dan cocok dengan tabel `design.md`
    - Verifikasi manual: `curl` homepage, pastikan title masih 53 char tanpa suffix
    - Submit ulang `sitemap.xml` di Search Console untuk mempercepat recrawl
    - _Requirements: R1, R9_

  - [ ] 1.12 **GATE — jendela observasi 14 hari**
    - Catat posisi homepage untuk `grand duta city parung` dan `grand duta city south of jakarta` di Search Console Performance (filter query) sebagai baseline peringkat
    - Pantau mingguan: posisi rata-rata, impresi, klik untuk kedua query
    - **Task 8 (metadata homepage) TIDAK BOLEH dimulai sebelum jendela ini selesai** — R10
    - Task 2, 3, 4, 5, 6 boleh berjalan paralel selama jendela ini karena tidak menyentuh title/description/canonical/robots halaman yang sama
    - **BILA posisi homepage TURUN untuk salah satu kata kunci target**: hentikan fase berikutnya, evaluasi rollback `git revert` commit Fase 1 lebih dulu
    - _Requirements: R1, R10_

---

- [x] 2. Fase 2 — Pengukuran konversi (murni aditif, tanpa risiko SEO)

  - [x] 2.1 Tambahkan helper pelacak CTA WhatsApp
    - File: `src/lib/analytics.ts` — `trackEvent()` sudah ada dan aman (guard `typeof window.gtag !== "function"`), tapi **tidak dipanggil sekali pun** di seluruh codebase (grep `trackEvent(` di `src/**/*.tsx`: 0 match)
    - Tambahkan tipe `WaCtaContext` (`page`, `placement`, `unit?`, `value?`) dan `trackWhatsAppClick(ctx)` sesuai `design.md` Fase 2
    - `DeferredAnalytics` sudah memasang stub `window.gtag` + `dataLayer` sinkron saat mount lalu me-replay setelah gtag.js dimuat, jadi event dari CTA yang diklik lebih awal tidak hilang — tidak perlu perubahan di sana
    - _Design: Fase 2_
    - _Requirements: R7_

  - [x] 2.2 Pasang pelacak di 25+ CTA WhatsApp (16 komponen)
    - `hero.tsx` (×2), `promo-popup.tsx`, `header-2.tsx` (×3: desktop, mobile icon, drawer), `faq-kpr.tsx` (sudah ada `onClick`, cukup 1 baris), `tipe-rumah.tsx` (×2), `pricelist-content.tsx` (×3), `lokasi-scroll.tsx`, `fasilitas.tsx`, `better-living.tsx`, `about.tsx`, `video-section.tsx`, `contact-form.tsx` (×2), `cluster-units.tsx`, `cluster-faq-kpr-section.tsx`, `whatsapp-button.tsx`
    - Untuk `<a href>` biasa: pakai `onClick` **tanpa** `preventDefault` — event terkirim sinkron ke `dataLayer` sebelum navigasi, dan `target="_blank"` berarti halaman tidak unload
    - Untuk yang memakai `window.open` (`tipe-rumah.tsx:122`, `cluster-units.tsx:23`, `faq-kpr.tsx:256`): panggil pelacak sebelum `window.open`
    - Isi `unit` dan `value` untuk CTA yang spesifik unit, supaya nanti bisa dianalisis tipe mana yang paling menghasilkan chat
    - _Requirements: R7_

  - [ ] 2.3 Tandai konversi di GA4 dan verifikasi
    - Tandai `whatsapp_click` sebagai key event/konversi di GA4
    - **EXPECTED OUTCOME**: event terlihat di laporan realtime GA4 dari minimal **5 halaman berbeda** dengan parameter `page` dan `placement` terisi benar
    - _Requirements: R7_

  - [x] 2.4 Checkpoint Fase 2
    - `npm run lint && npm run test && npm run build` hijau
    - Commit `seo(fase2): pasang pelacakan konversi CTA WhatsApp`
    - **GATE**: Task 7 (pSEO) tidak boleh dimulai sebelum pengukuran aktif minimal **14 hari** — R7
    - _Requirements: R7, R9_

---

- [x] 3. Fase 3 — Sumber data tunggal & integritas

  - [x] 3.1 **TANYAKAN PEMILIK** — rekonsiliasi 6 fakta yang bertentangan
    - Ada 3 salinan divergen daftar unit. Nilai final **wajib dikonfirmasi pemilik, bukan dipilih agent** (R4)
    - Manoa T-58 kamar tidur: `src/lib/data.ts` = 2, `tipe-rumah.tsx` = 1, schema homepage = "1 kamar tidur". Mana yang benar? (58 m² dengan 1 KT tampak tidak masuk akal)
    - Malta 47/72 harga tampil: `data.ts` = "800 Juta-an", `cluster-ladera/page.tsx` = "Rp 900 Juta-an", pricelist `kpr` = Rp 971 Jt–1,021 M, schema homepage = `800000000`. String marketing yang benar?
    - Bank mitra: `bank-slider.tsx` = 5 logo (Mandiri, BSI, BRI, BTN, OCBC NISP), copy = "8 Bank Mitra", `faq-kpr.tsx:15` = BCA/Mandiri/BTN/BRI/BNI. Berapa dan siapa saja?
    - Status stok aktual per tipe (sekarang hanya `soldOut` pada 1 dari 7 unit; ketersediaan sebenarnya hanya gambar raster siteplan)
    - Jumlah lantai per tipe (belum ada sebagai field, hanya dalam prosa `desc`)
    - Denah untuk Keila, Verona, Frontera, T-39, T-47, T-62 — sediakan aset atau setujui `null`
    - Dokumentasikan jawaban di task ini sebelum menulis kode
    - _Design: Fase 3 → tabel rekonsiliasi_
    - _Requirements: R4_

  - [x] 3.2 Buat `src/data/units.ts` sebagai sumber tunggal
    - Implementasikan tipe `Unit`, `UnitPrice`, `UnitStatus` sesuai `design.md` Fase 3
    - Isi dari `pricelist-content.tsx` (18 `PriceRow`, dataset komersial paling lengkap: ~106 unit dengan kavling + blok + 5 titik harga numerik) digabung atribut fisik dari `src/lib/data.ts`, memakai nilai hasil rekonsiliasi 3.1
    - `bedrooms: number` + `extraRoom: boolean` menggantikan union `2 | "2+1"` yang menyulitkan templating
    - Tambahkan field `floors` yang sekarang belum ada
    - _Requirements: R4_

  - [x] 3.3 Migrasikan konsumen ke `units.ts`
    - `src/lib/data.ts` jadi re-export tipis untuk satu iterasi (`export const propertyTypes = unitsAsLegacyShape`), lalu dihapus setelah konsumen beralih — menghindari perubahan besar dalam satu commit
    - Alihkan: `cluster-units.tsx:6`, `cluster-cascada/page.tsx:29,40-48`, `tipe-rumah.tsx:17-86` (hapus array duplikat 6 record yang sudah drift)
    - Hapus array duplikat di `tipe-rumah.tsx`; `clusterTabs` diturunkan dari `units.ts`
    - **VERIFIKASI**: halaman `/cluster-ladera`, `/cluster-cascada`, dan section tipe rumah di homepage merender data yang sama seperti sebelumnya kecuali koreksi yang disengaja dari 3.1
    - _Requirements: R4_

  - [x] 3.4 Perbaiki klaim faktual yang tidak konsisten
    - Jumlah + nama bank: seragamkan di `bank-slider.tsx`, copy "8 Bank Mitra", dan `faq-kpr.tsx:15` sesuai jawaban 3.1
    - `LAST_UPDATED_VISUAL`/`LAST_UPDATED_ISO` di `update-stok-siteplan-grand-duta-city-parung/page.tsx:36-37`: turunkan keduanya dari satu konstanta tanggal, dan tampilkan peringatan bila usianya >45 hari. Halaman bernama "Update Stok" yang tanggalnya membeku merugikan trust dan ranking
    - Ganti `facadeImage` Keila yang sekarang memakai gambar Aira (komentar di kode: `// Fallback to Aira for now if missing`)
    - _Requirements: R4_

  - [x] 3.5 Clamp kalkulator KPR homepage
    - File: `src/components/sections/faq-kpr.tsx` baris 189 (`dpPercent`) dan 211 (`bunga`) — keduanya `<input type="number">` tanpa min/max, menerima DP >100% dan bunga negatif
    - Terapkan clamp yang sama dengan dua kalkulator lain yang sudah benar: dp `[0, 90]`, bunga `[0, 25]`
    - _Requirements: R4_

  - [x] 3.6 Satukan sumber FAQ
    - Homepage: hapus `FAQ_CONTENT` di `page.tsx:395-435`; ekspor `faqs` dari `faq-kpr.tsx:7` dan bangun schema dari sana. Sekarang 6 Q&A yang sama didefinisikan di dua file dan bisa drift — schema yang tidak cocok konten terlihat adalah pelanggaran pedoman
    - `/pricelist-grand-duta-city`: masalah sama, `jsonLdFaq` di route file sementara accordion di `pricelist-content.tsx`
    - _Requirements: R6_

  - [x] 3.7 Checkpoint Fase 3
    - `npm run lint && npm run test && npm run build` hijau
    - Grep memastikan tidak ada lagi konsumen array unit lama
    - Commit `seo(fase3): satukan sumber data unit & perbaiki integritas fakta`
    - **GATE**: Task 7 (pSEO) tidak boleh dimulai sebelum task ini selesai — membangun 10 halaman di atas data yang bertentangan akan menggandakan bug
    - _Requirements: R4, R9_

---

> **Fase 4 (Pangkas dilusi topikal) DIKELUARKAN dari spec ini.**
>
> Atas keputusan pemilik, `noindex` untuk 18 artikel off-topic akan dikerjakan sebagai spec terpisah SETELAH seluruh task di spec ini selesai. Daftar kandidatnya diarsipkan di `design.md` -> "Lampiran: kandidat pemangkasan (spec terpisah)".
>
> Nomor fase TIDAK digeser: Fase 5-10 tetap memakai nomor aslinya agar referensi lintas dokumen dan pesan commit konsisten.
>
> Dua konsekuensi yang harus diingat saat mengerjakan fase berikutnya:
> 1. Task 1.6 tetap memperbaiki title/description SELURUH 32 artikel, termasuk 18 kandidat pemangkasan, karena mereka masih terindeks.
> 2. Gate indexation rate di Task 7.8 punya risiko lebih tinggi tidak tercapai, karena arsip situs masih 56% off-topic. Bila indexation rate <80%, penyebab paling mungkin adalah dilusi topikal ini, bukan template pSEO-nya.

---

- [x] 5. Fase 5 — Restrukturisasi schema

  - [x] 5.1 Hapus schema mati dari homepage
    - File: `src/app/(site)/page.tsx`
    - Hapus `jsonLdProductList` (6 `Product`+`Offer`, ~150 baris, baris 221-369). Dua alasan independen: (a) rumah tapak tidak eligible merchant listing, dan `shippingDetails` 0 hari/0 IDR + `MerchantReturnNotPermitted` untuk rumah adalah markup yang tidak merepresentasikan halaman; (b) harganya **tidak cocok** dengan halaman yang dirujuk `url`-nya — pelanggaran langsung pedoman structured data (C10)
    - Hapus `potentialAction`/`SearchAction` dari `jsonLdWebSite` — sitelinks searchbox diretire Google 21 Nov 2024, dan `urlTemplate` `/?s={search_term_string}` (pola WordPress warisan migrasi) menunjuk route yang tidak ada
    - Hapus `jsonLdSiteNavigation` (8 `SiteNavigationElement`) — bukan tipe yang didukung Google; komentar di kode yang mengklaim ini membantu sitelinks tidak berdasar
    - Hapus `breadcrumb` 1-item di `jsonLdPage` — breadcrumb satu level tidak pernah dirender
    - _Design: Fase 5_
    - _Requirements: R6_

  - [x] 5.2 Bangun `@graph` homepage tersambung
    - Gabungkan 6 blok terpisah jadi satu `<script>` berisi `@graph`, semua node ber-`@id`, sesuai diagram di `design.md` Fase 5
    - Entitas utama: `Place` `@id /#project` bernama `Grand Duta City Parung South of Jakarta` dengan `alternateName: ["Grand Duta City South of Jakarta", "GDC SOJ Parung", "GDC Parung"]`
    - `alternateName` ini adalah mekanisme paling langsung untuk memberi tahu Google bahwa kedua varian brand adalah entitas yang sama dan homepage adalah halamannya
    - `WebSite` **wajib diberi `@id`** — sekarang tidak ada, padahal `/category/*` merujuk `isPartOf: {"@id": ".../#website"}` sehingga referensinya menggantung
    - `CollectionPage` → `WebPage` (tipe sekarang untuk arsip, bukan homepage)
    - `Organization` "Duta Putra Land" dipertahankan, disambungkan sebagai `developer` dari `Place`
    - `RealEstateAgent` dipertahankan dengan `@id /#salesoffice` + `parentOrganization`
    - Satu `FAQPage` dipertahankan (masih dibaca LLM dan AI search), sumbernya dari task 3.6
    - **JANGAN ubah** `alternates.canonical`, `robots`, `title`, `description`, atau `<h1>` homepage di task ini (R1)
    - _Requirements: R1, R6_

  - [x] 5.3 Tambahkan `VideoObject`
    - Homepage punya 2 elemen `<video>` dan section "Video Kawasan", `max-video-preview: -1` sudah diset, tapi tanpa markup — video rich result masih didukung penuh
    - Tambahkan `VideoObject` `@id /#video` dengan `name`, `description`, `thumbnailUrl` (poster sudah terdaftar di `images.ts`), `uploadDate`, `contentUrl`
    - _Requirements: R6_

    > **CATATAN EKSEKUSI — `uploadDate` didapat tanpa menebak.**
    > Node ini sempat dinonaktifkan (`TOUR_VIDEO_UPLOAD_DATE = null`) karena
    > `uploadDate` WAJIB untuk video rich result sementara oEmbed YouTube tidak
    > mengeksposnya, dan menebak tanggal berarti mengarang data yang dibaca
    > Google. Jalan keluarnya: halaman tontonan YouTube menerbitkan datanya
    > sendiri sebagai structured data (`<meta itemprop="datePublished">` dan
    > `duration`). Nilai diambil dari sana: `2026-07-20T19:28:37-07:00`,
    > `PT3M41S`. Dikunci oleh asersi di `src/lib/__tests__/schema.test.ts`
    > supaya tidak ada yang "merapikannya" jadi tanggal bulat yang salah.
    > Jadi tidak ada lagi input pemilik yang tertunda untuk task ini.

  - [x] 5.4 Tambahkan `BreadcrumbList` ke 32 halaman artikel
    - File: `src/app/(site)/[slug]/page.tsx` — verifikasi live `/cara-memilih-rumah-parung` menunjukkan hanya **2** blok JSON-LD (`Organization` + `BlogPosting`), padahal breadcrumb visual dirender di baris 343
    - Breadcrumb adalah rich result yang **masih aktif** dan tampil di SERP. Ini kemenangan paling pasti: 32 URL sekaligus
    - **Bangun item JSON-LD dari array yang sama** dengan `<Breadcrumb items={...}>` visual — satu sumber, bukan dua array terpisah (R6)
    - `BlogPosting.publisher` → `{"@id": ".../#organization"}` (sekarang `name: "Grand Duta City Parung"` sementara `Organization.name` = "Duta Putra Land", tanpa penghubung)
    - `BlogPosting.author` → `Person` dengan `url: /author/santika-reza` dan `@id` (sekarang `"Tim Editorial GDC"` tanpa `url`, padahal halaman author dengan schema `Person` sudah ada)
    - _Requirements: R6_

    > **TIDAK TERVERIFIKASI LOKAL.** Tanpa kredensial DB, seluruh route artikel
    > jatuh ke fallback "Artikel Tidak Ditemukan", jadi `BreadcrumbList` artikel
    > tidak bisa dilihat di localhost. Kode sudah terpasang di
    > `src/app/(site)/[slug]/page.tsx` dan dikunci di level builder oleh
    > `src/lib/__tests__/schema.test.ts`. **Verifikasi wajib diulang setelah
    > deploy** dengan `node ./scripts/verify-schema.cjs https://granddutacitysouthofjakarta.com /<slug-artikel>`.

  - [x] 5.5 Tambahkan schema ke `/galeri`
    - `/galeri` adalah satu-satunya halaman konten dengan **nol JSON-LD**
    - Tambahkan `@graph`: `ImageGallery` + `BreadcrumbList` + `ImageObject[]` dari `siteImages.filter(i => i.page === "/galeri")` — 36 gambar yang sudah punya `title` + `caption`
    - Ini langsung mendukung target "deretan gambar" pemilik
    - _Requirements: R6_

  - [x] 5.6 Bereskan schema halaman lain
    - `cluster-faq-kpr-section.tsx:90-106`: hapus `FAQPage`. Pertahankan `OfferCatalog`→`Offer`→`SingleFamilyResidence` (pola di `cluster-cascada/page.tsx:153` sudah benar) dan sambungkan ke `{@id /#project}`
    - `/pricelist-grand-duta-city`: hapus `FAQPage`; harga di `OfferCatalog` dan `Dataset` kini dari `units.ts`
    - `article-taxonomy-archive.tsx`: gabungkan array breadcrumb visual (`{label, href}`, baris 435-445) dan array JSON-LD (`{name, item}`, baris 452-464) yang sekarang dipelihara terpisah dan bisa drift
    - _Requirements: R6_

    > **CAKUPAN DIPERLUAS SAAT EKSEKUSI.** Task ini semula hanya menyebut 3
    > berkas. Setelah `verify-schema.cjs` diperketat, ternyata **9 halaman lain**
    > masih mengemit blok lepas tanpa `@id`, dan tiga di antaranya memecah
    > entitas secara nyata:
    >
    > - `/lokasi-akses-*` memberi `RealEstateAgent` sebuah `@id` = URL HALAMAN
    >   (bukan fragment entitas), plus `Place` anonim beralamat. Dua entitas
    >   lokasi tambahan, dengan koordinat `-6.450274, 106.719312` yang BERBEDA
    >   dari homepage `-6.462459, 106.729392` di bawah alamat jalan yang sama.
    > - `/kontak` mendefinisikan ULANG `#organization` versi tipis (hanya
    >   name/url/logo/contactPoint) dan `RealEstateAgent` anonim dengan koordinat
    >   yang sama menyimpangnya.
    > - `/artikel` mendeklarasikan `#itemlist` **dua kali** dengan isi berbeda
    >   (`ListItem` vs `BlogPosting`) — Google bebas memilih salah satu.
    >
    > Selain itu `/cluster-ladera` menaruh `price: "900000000"` untuk Malta 47/72
    > di structured data, padahal Tunai Keras terendahnya Rp 845.550.000 — angka
    > lama yang justru mendekati harga KPR. Katalog kedua cluster kini dibangun
    > dari `src/data/units.ts` lewat builder bersama `clusterOfferCatalogNode()`,
    > jadi tidak bisa menyimpang lagi. Harga numerik hanya ada di `/pricelist`.

  - [x] 5.7 Validasi schema dan checkpoint
    - **Gunakan Rich Results Test dan Schema Validator, bukan `curl` atau fetch biasa** — keduanya merender JavaScript; fetch statis tidak bisa melihat JSON-LD yang disuntikkan
    - **EXPECTED OUTCOME**: nol error, nol warning baru, nol referensi `@id` menggantung
    - Verifikasi ukuran HTML homepage turun (JSON-LD ikut terduplikasi di RSC flight payload, jadi setiap byte schema terhitung dua kali; baseline 387 KB)
    - `npm run lint && npm run test && npm run build` hijau
    - Commit `seo(fase5): restrukturisasi schema jadi satu graph tersambung`
    - _Requirements: R6, R9_

    > **HASIL VERIFIKASI (30 Agustus 2026, localhost:3700 atas build produksi).**
    >
    > Rich Results Test tidak bisa dipakai untuk pra-deploy karena ia butuh URL
    > publik. Penggantinya `scripts/verify-schema.cjs`, yang justru memeriksa hal
    > yang TIDAK diperiksa Rich Results Test: apakah sebuah `@id` menunjuk node
    > yang benar-benar ada. Script diperketat dari 4 ke **7 kelas pemeriksaan**
    > (tambahan: `@id` didefinisikan ulang dengan isi berbeda; entitas struktural
    > tanpa `@id`; jumlah blok JSON-LD per halaman maks 2).
    >
    > `node ./scripts/verify-schema.cjs http://localhost:3700` atas **15 halaman**
    > → **LOLOS**, exit 0:
    >
    > - 15/15 halaman = tepat 2 blok (satu `@graph` halaman + node global layout).
    >   Sebelumnya `/pricelist` 6 blok, `/cluster-ladera` 5, `/lokasi-akses` 5,
    >   `/artikel` 4, `/cara-beli-kpr` 4.
    > - 102 referensi `@id`, **nol menggantung**.
    > - **nol** `@id` didefinisikan ulang dengan isi berbeda.
    > - **nol** entitas struktural tanpa `@id`.
    > - **nol** tipe terlarang; **nol** `@id` kembar.
    >
    > `seo-verify.cjs` (fase3 → fase5, 18 route): **LOLOS, nol regresi.** Satu-
    > satunya delta adalah jumlah blok JSON-LD yang memang disengaja. Invarian R1
    > homepage tidak bergerak: title 54 char, description 148, canonical tanpa
    > trailing slash, `index, follow`, 1 `<h1>`.
    >
    > `npx tsc --noEmit` exit 0 · `npm run lint` exit 0 · `npx vitest --run`
    > **20 berkas / 206 test lolos** (schema.test.ts sendiri 23 asersi) ·
    > `npm run build` exit 0 · `fix-mojibake.cjs` 0 pola · encoding UTF-8 bersih
    > di 8 halaman yang disentuh.
    >
    > Verifikasi ukuran HTML homepage sengaja TIDAK dijadikan gerbang: byte
    > homepage naik-turun oleh konten selain schema, jadi angkanya bukan bukti.
    > Yang diukur adalah jumlah blok, dan itu turun ke 2.

---

- [ ] 6. Fase 6 — Infrastruktur sitemap

  - [ ] 6.1 Tambahkan `images` dan `videos` native ke `sitemap.ts`
    - Next 16 `sitemap.ts` mendukung properti `images` dan `videos` (terverifikasi di `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`)
    - Tambahkan `images` per URL dari `siteImages` dan `videos` untuk homepage
    - **JANGAN hapus `/images.xml` di fase ini.** Route handler itu berfungsi dan sudah terdaftar sebagai sitemap di Search Console — mempensiunkannya sekarang adalah risiko tanpa imbalan setara. Rencana aman bila nanti diinginkan ada di `design.md` Fase 6
    - _Requirements: R9_

  - [ ] 6.2 Pecah sitemap per tipe halaman
    - `app/sitemap.ts` → halaman inti + images + videos
    - `app/(site)/artikel/sitemap.ts` → artikel indexable
    - (`app/(site)/tipe-rumah/sitemap.ts` dibuat di Fase 7)
    - Manfaat: indexation rate per template terlihat terpisah di Search Console. Tanpa ini, kegagalan indeksasi satu template tersembunyi di angka agregat
    - _Requirements: R8, R9_

  - [ ] 6.3 Perbaikan sitemap lain-lain
    - Tambahkan `/disclaimer` dan `/privacy-policy` (indexable tapi belum ada di sitemap) dengan priority rendah
    - `lastModified` artikel: pakai `updatedAt`, bukan `publishedAt` — lebih akurat untuk freshness
    - Seragamkan canonical `/category/*` dari relatif ke absolut (tidak error karena `metadataBase` menyelesaikannya, tapi rawan saat refactor)
    - Seragamkan aturan canonical paginasi tag (self-canonical) dengan category (ke halaman 1)
    - Hapus dead code `src/components/layout/header.tsx` (nav aktif di `ui/header-2.tsx`)
    - _Requirements: R9_

  - [ ] 6.4 Checkpoint Fase 6 dan submit
    - `npm run lint && npm run test && npm run build` hijau
    - Commit `seo(fase6): pecah sitemap per tipe halaman & images/videos native`
    - Deploy, fetch tiap sitemap, validasi: tidak ada URL 404, tidak ada URL noindex yang belum semestinya dikeluarkan
    - Submit 2–3 sitemap terpisah di Search Console
    - _Requirements: R9_

---

- [ ] 7. Fase 7 — pSEO gelombang 1: 10 halaman tipe unit

  **GATE**: task 3 harus selesai (Fase 4 dikeluarkan dari spec ini). Task 2 harus aktif ≥14 hari.

  - [ ] 7.1 Buat route dan hub
    - `src/app/(site)/tipe-rumah/page.tsx` — hub yang mendaftar 10 tipe
    - `src/app/(site)/tipe-rumah/[slug]/page.tsx` dengan **`generateStaticParams`** dari `units.ts`. Catatan: sekarang **nol `generateStaticParams` di seluruh repo** — ini yang pertama
    - Segmen statis `tipe-rumah` selalu menang atas `[slug]` di root, jadi tidak ada bentrok dengan route artikel
    - 10 slug: `verona-39-60`, `malta-47-72`, `tuscan-66-72`, `aira-42-60`, `manoa-58-60`, `victoria-69-74`, `alexandra-88-105`, `t-39`, `t-47`, `t-62-hook`. `frontera-89-90` ditunda (pricelist belum rilis); `keila-47` sold out → opsional sebagai arsip `noindex`
    - _Design: Fase 7 → Route_
    - _Requirements: R8_

  - [ ] 7.2 Terapkan template metadata
    - `title: Rumah Tipe ${name} ${lb}/${lt} GDC Parung — Harga & Denah`
    - `desc: Tipe ${name} ${lb}/${lt} di Cluster ${clusterLabel} Grand Duta City Parung: ${bedrooms} KT, ${bathrooms} KM, harga KPR ${fmt(kpr)}, DP ${fmt(dp10)}. Tersedia ${unitCount} unit di blok ${blocks.join(", ")}.`
    - `canonical: /tipe-rumah/${slug}`
    - Setiap field terisi data nyata → nol duplikat. Guard test G6/G8/G9 memvalidasi otomatis
    - **VERIFIKASI**: title semua ≤60 char, description semua 120–160 char, tidak ada yang memuat frasa target sebagai brand tag (guard G4/G5)
    - _Requirements: R3, R8_

  - [ ] 7.3 Bangun konten per halaman dengan keunikan nyata
    - Sertakan: 5 titik harga, daftar kavling + blok + jumlah unit, varian hook + rentang harga & luas tanah (hanya 3 tipe punya), simulator KPR **pre-filled harga unit ini** (DP min 5% untuk hook), denah + fasad, LB/LT/KT/KM/carport/lantai, tabel banding vs tipe terdekat di cluster sama
    - **14 spesifikasi bangunan dari `cluster-specs.tsx` adalah project-wide — WAJIB di-LINK, JANGAN diduplikasi di 10 halaman.** Ini batas antara halaman programmatic yang sah dan konten duplikat (R8)
    - Simulator KPR pre-filled adalah utility nyata dengan output numerik berbeda per halaman, bukan teks — ini yang membuat halaman lolos uji "unique value per page"
    - _Design: Fase 7 → Sumber keunikan per halaman_
    - _Requirements: R8_

  - [ ] 7.4 Schema per halaman
    - `@graph`: `SingleFamilyResidence` (`numberOfRooms`, `numberOfBathroomsTotal`, `numberOfFullBathrooms`, `floorSize`) + `Offer` dengan harga dari `units.ts` + `BreadcrumbList` + `ImageObject`
    - `containedInPlace` → `{"@id": "/#project"}`
    - **JANGAN pakai `Product`** — rumah tapak tidak eligible merchant listing, dan itu penyebab pelanggaran C10 yang baru dibersihkan di Fase 5
    - Harga di schema **wajib identik** dengan harga yang tampil di halaman (R4)
    - _Requirements: R4, R6, R8_

  - [ ] 7.5 Internal linking hub & spoke
    - Setiap halaman tipe: breadcrumb visual + `BreadcrumbList`, link ke hub cluster-nya, link ke 2–3 tipe sibling, link ke homepage dengan anchor brand
    - Tambahkan link dari `/cluster-ladera` (4 tipe), `/cluster-cascada` (7 tipe), `/pricelist-grand-duta-city` (semua 10), dan hub `/tipe-rumah`
    - **VERIFIKASI: nol orphan** — setiap halaman tipe punya minimal 2 jalur link internal masuk
    - _Requirements: R8_

  - [ ] 7.6 Registrasi gambar dan sitemap
    - Tambahkan entry `page` untuk 10 route baru di `src/data/images.ts` sesuai kontrak di header file itu ("Every image displayed on the site MUST be registered here"). Tanpa ini gambarnya absen dari image sitemap
    - Buat `app/(site)/tipe-rumah/sitemap.ts`
    - _Requirements: R8_

  - [ ] 7.7 Checkpoint Fase 7 dan deploy
    - `npm run lint && npm run test && npm run build` hijau — termasuk guard G8/G9 (nol duplikat title/description di 10 halaman baru)
    - Rich Results Test bersih untuk minimal 3 halaman tipe
    - Commit `seo(fase7): halaman tipe unit programmatic (10 halaman)`
    - Deploy, submit sitemap tipe-rumah di Search Console, minta indexing untuk hub + 3 halaman
    - _Requirements: R8, R9_

  - [ ] 7.8 **GATE — pantau indexation rate**
    - Pantau Search Console Pages report untuk sitemap `tipe-rumah` secara mingguan
    - **Task 9 tidak boleh dimulai sebelum indexation rate ≥80%** (R8). Bila gelombang 1 tidak terindeks, template-nya salah dan gelombang 2 hanya akan mengulangi kesalahan dalam skala lebih besar
    - Pantau juga: apakah ada halaman tipe yang mulai bersaing dengan `/cluster-*` atau homepage di Search Console query report
    - _Requirements: R8_

---

- [ ] 8. Fase 8 — Metadata homepage (deploy tunggal, tergated)

  **GATE**: task 1.12 (jendela observasi 14 hari) harus selesai tanpa regresi.

  - [ ] 8.1 Siapkan patch rollback terpisah
    - Buat `snapshots/homepage-metadata-baseline.patch` yang memulihkan metadata homepage persis ke baseline, **tanpa** mengembalikan fase lain
    - Uji patch dapat diterapkan bersih sebelum melanjutkan
    - _Requirements: R1_

  - [ ] 8.2 **TANYAKAN PEMILIK** — konfirmasi fase ini memang diinginkan
    - Title homepage sekarang sudah sehat: 53 karakter, kata kunci di depan, satu `<h1>` memuat kedua kata kunci. Perubahannya bersifat **penyempurnaan, bukan perbaikan cacat**
    - Untuk query brand, Google mencocokkan **entitas**, bukan string literal — kata "Parung" di tengah frasa tidak mencegah kecocokan dengan `grand duta city south of jakarta`. Kepemilikan frasa sudah dipindahkan ke homepage oleh Fase 1 (mencabut `/galeri`) dan Fase 5 (`alternateName`)
    - **Fase ini boleh DILEWATI** bila Fase 1 sudah memberi hasil yang memadai. Bila peringkat sudah 3 besar, jangan sentuh
    - _Requirements: R1, R10_

  - [ ] 8.3 Terapkan perubahan (hanya bila 8.2 menyetujui)
    - `title` → `Grand Duta City Parung South of Jakarta | Rumah 700 Jt-an` (57)
    - `description` → buka dengan frasa exact keyword kedua: `Grand Duta City South of Jakarta (GDC SOJ) di Parung, Bogor — kota mandiri 200 Ha. Rumah mulai Rp 700 jutaan, Promo Tanpa DP, 20 menit ke Jaksel.` (145 karakter, sudah diverifikasi masuk rentang guard G7)
    - Klaim "KPR 8 bank" sengaja TIDAK dipakai di description sampai jumlah bank direkonsiliasi di task 3.1
    - H2 `src/components/sections/about.tsx:103` → `Tentang Kawasan Grand Duta City South of Jakarta`
    - **TIDAK DIUBAH**: `alternates.canonical`, `robots`, `<h1>`, jumlah `<h1>`. `keywords` boleh dibiarkan (Google mengabaikannya, tidak ada risiko)
    - **Deploy sebagai commit tunggal tanpa perubahan SEO lain apa pun** (R1)
    - _Design: Fase 8_
    - _Requirements: R1_

  - [ ] 8.4 Checkpoint dan jendela observasi 21 hari
    - `npm run lint && npm run test && npm run build` hijau; guard G1/G2/G3 tetap lolos
    - Commit `seo(fase8): sempurnakan metadata homepage`
    - Deploy, snapshot, verify. Minta reindex homepage di Search Console
    - **Jendela observasi minimum 21 hari** (R10). Pantau mingguan: posisi rata-rata, impresi, dan klik untuk kedua kata kunci target
    - **BILA posisi turun**: terapkan `homepage-metadata-baseline.patch` dan deploy. Jangan tunggu lebih lama
    - _Requirements: R1, R10_

---

- [ ] 9. Fase 9 — pSEO gelombang 2 & 3

  **GATE**: indexation rate Fase 7 ≥80%.

  - [ ] 9.1 Gelombang 2 — 4 halaman bracket harga + 1 perbandingan internal
    - `/rumah-700-800-juta-parung`, `/rumah-800-juta-1-miliar-parung`, `/rumah-1-13-miliar-parung`, `/rumah-13-19-miliar-parung` — bracket dihitung dari nilai `kpr` sebenarnya, unit yang memenuhi ada di tabel `design.md` Fase 9
    - `/cluster-ladera-vs-cascada` — perbandingan internal, data 100% proprietary
    - Setiap halaman memuat tabel unit nyata + simulasi cicilan per bracket, cross-link ke halaman tipe
    - _Requirements: R8_

  - [ ] 9.2 Pillar istilah KPR (mengganti playbook Glossary)
    - Satu halaman `/istilah-kpr-properti` yang menyerap `NOTES` (7), `PAYMENT_METHODS` (3), `GOVERNMENT_PROMOS` (4), `INCLUSIONS` (3), `DEVELOPER_SUBSIDIES` (2)
    - **Playbook Glossary dibatalkan**: 12 halaman "apa itu X" pada otoritas domain saat ini = 12 halaman tipis
    - _Requirements: R8_

  - [ ] 9.3 **TANYAKAN PEMILIK** — data prasyarat gelombang 3
    - 8 halaman proximity hanya untuk POI ≤20 menit: RS Dompet Dhuafa (5), SMA Dwiwarna (5), Exit Tol Sawangan/Krukut/Pamulang/Bojong Gede (15), The Park Sawangan (20), CBD TB Simatupang (20)
    - **Syarat mutlak sebelum dibangun** — bila tidak dipenuhi, halaman TIDAK dibuat karena akan menjadi doorway page (R8): jarak km + rute nyata per POI (data sekarang hanya waktu tempuh, tanpa km, tanpa koordinat); rekomendasi unit spesifik per profil komuter; narasi perjalanan yang benar-benar berbeda, bukan nama POI yang ditukar; peta rute per halaman, bukan peta lokasi yang sama 8×
    - _Requirements: R8_

  - [ ] 9.4 Gelombang 3 — 4 persona + 8 proximity (hanya bila 9.3 terpenuhi)
    - Persona: keluarga muda (Verona/Aira, 2 KT), komuter Jakarta Selatan (akses tol), keluarga besar (Tuscan/Victoria/Alexandra, 3 KT), first-time buyer (KPR tanpa DP)
    - Differensiasi harus nyata: rekomendasi unit benar-benar berubah per persona
    - _Requirements: R8_

  - [ ] 9.5 Evaluasi plafon
    - Hitung total halaman programmatic: 10 (F7) + 5 (W2) + 1 (pillar) + 12 (W3) = **28**
    - **Plafon keras ~35 halaman.** Situs ini satu proyek di satu lokasi; melewati batas ini playbook Locations berbalik dari aset jadi liabilitas (doorway pages)
    - **JANGAN tambah halaman baru tanpa evaluasi ulang eksplisit** (R8)
    - _Requirements: R8_

---

- [ ] 10. Fase 10 — Non-teknis (paralel, tanpa gate)

  - [ ] 10.1 Google Business Profile
    - Verifikasi GBP dengan NAP identik schema: Jl. Raya Parung No.47, Jabon Mekar, Parung, Kabupaten Bogor, Jawa Barat 16330; koordinat -6.462459/106.729392; telepon +628131742034; jam 09.00–18.00 setiap hari
    - Diperkirakan menyumbang 25–35% dari target chat, dan **sama sekali tidak dipengaruhi schema di situs** — ini gap terbesar yang belum tersentuh
    - _Requirements: R7_

  - [ ] 10.2 Verifikasi Core Web Vitals
    - **Belum terverifikasi dalam audit** — PageSpeed Insights API menolak permintaan (HTTP 429, 2×). LCP/INP/CLS tidak diketahui
    - Jalankan manual di pagespeed.web.dev (mobile + desktop) dan cek laporan Core Web Vitals Search Console
    - Baseline yang diketahui: HTML homepage 387 KB, TTFB 113–235 ms dengan cache HIT. Fase 5 seharusnya menurunkan ukuran HTML
    - _Requirements: R9_

  - [ ] 10.3 Lead form yang menyimpan data
    - `contact-form.tsx:23` sekarang hanya membuka WhatsApp tanpa menyimpan lead — pengunjung yang belum siap chat langsung hilang tanpa jejak
    - _Requirements: R7_

  - [ ] 10.4 Parent nav crawlable
    - `header-2.tsx:29,38,47` — `Cluster`, `Harga & Stok`, `Informasi` dirender `<button>` dengan `href: '#'`. Anak-anaknya ada di DOM jadi tetap ter-crawl, tapi hierarkinya tidak terbaca
    - Ubah jadi `<Link>` ke hub nyata: `Cluster` → `/tipe-rumah`, `Harga & Stok` → `/pricelist-grand-duta-city`, `Informasi` → `/lokasi-akses-grand-duta-city-parung`
    - Ini salah satu dari dua hambatan sitelink; satunya (entitas terpecah) diselesaikan Fase 5
    - _Requirements: R6_

  - [ ] 10.5 Artikel non-brand komersial (8–10 artikel)
    - `rumah dijual parung bogor`, `perumahan dekat exit tol desari`, `rumah 700 juta dekat jakarta selatan`, `KPR tanpa DP bogor syarat`, `perumahan parung vs sawangan`, `rumah dekat stasiun bojong gede`, `biaya hidup tinggal di parung`
    - Ini calon pengganti 18 artikel off-topic yang akan dipangkas di spec terpisah, menyasar audiens yang benar
    - Catatan lanskap: portal (pinhome.id `/poi/perumahan-{nama}`, rumah123, 99.co) menguasai query generik. Jangan bertarung di keluasan inventaris — menangi kedalaman dan spesifisitas lokal
    - _Requirements: R8_

---

- [ ] 11. Checkpoint akhir
  - Seluruh guard test (12 asersi) lolos
  - `npm run lint && npm run test && npm run build` hijau
  - Snapshot final dibandingkan baseline: setiap perbedaan disengaja dan terdokumentasi
  - Nol URL berubah 200 → 404 sepanjang seluruh fase
  - Homepage: canonical, robots, dan jumlah `<h1>` identik dengan baseline
  - Semua 13 aturan `redirects()` existing utuh
  - Rich Results Test bersih untuk homepage, 1 halaman artikel, 1 halaman tipe, `/galeri`
  - Posisi kedua kata kunci target tercatat di Search Console dan dibandingkan baseline peringkat dari task 1.12
  - Bila ada pertanyaan atau ambiguitas, tanyakan ke pemilik
  - _Requirements: R1, R2, R3, R9_
