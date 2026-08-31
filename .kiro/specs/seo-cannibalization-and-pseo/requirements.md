# Requirements — Perbaikan Kanibalisasi Kata Kunci & Programmatic SEO

## Pendahuluan

Situs `granddutacitysouthofjakarta.com` (Next.js 16 App Router, Vercel) adalah microsite satu proyek properti: Grand Duta City Parung South of Jakarta, dikembangkan Duta Putra Land.

**Target bisnis pemilik:**
- Homepage masuk **3 besar** untuk kata kunci utama `grand duta city parung` dan kata kunci kedua `grand duta city south of jakarta`.
- **Tidak ada halaman lain** yang bersaing dengan homepage di dua kata kunci tersebut.
- Peluang besar memunculkan **sitelink** dan **rich result** (deretan gambar, breadcrumb, video).
- **2 closing unit per bulan** dan **10 chat masuk per hari**.

**Hasil audit (basis spec ini):** kanibalisasi bukan masalah konten, melainkan efek satu bug konfigurasi di `src/app/(site)/layout.tsx:32` yang menempelkan suffix `" | Grand Duta City Parung"` ke title 9 halaman. Ditambah dilusi topikal (18 dari 32 artikel menyasar audiens salah), entitas brand terpecah di 3 string, dan 8 konflik integritas data yang sudah bocor ke structured data.

## Kondisi awal terverifikasi

Semua poin di bawah diverifikasi langsung dari source code **dan** HTML live pada 30 Agustus 2026.

### Fondasi yang sudah benar (JANGAN diubah)
- Redirect: `http→https` 308, `www→non-www` 308, `trailing slash→non-slash` 308. `trailingSlash: false` di `next.config.ts`.
- Canonical self-referencing di seluruh halaman, konsisten protokol + domain.
- Homepage canonical = `https://granddutacitysouthofjakarta.com` (tanpa trailing slash), cocok dengan `<loc>` di sitemap.
- `/tag/*` sudah `noindex, follow`. Paginasi `/category/[slug]/page/[n]` sudah `noindex` + canonical ke halaman 1. `/artikel?page=n` dikonsolidasi ke canonical halaman 1.
- `robots.ts`: allow `/`, disallow `/api/` + `/admin/`; mengizinkan crawler AI (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, CCBot, Google-Extended).
- Verifikasi Google Search Console terpasang (`verification.google` di layout).
- `max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1` di layout robots.
- TTFB 113–235 ms, `x-vercel-cache: HIT`.
- 46 `<img>` di homepage, 46 punya `alt` (1 sengaja kosong).
- Image sitemap `/images.xml` berfungsi: 148 gambar teregistrasi di `src/data/images.ts` untuk 11 halaman.

### Cacat terverifikasi

**C1 — Suffix title duplikat.** `layout.tsx:32` `template: "%s | Grand Duta City Parung"`. Next 16 tidak menerapkan template ke `page.js` pada segmen yang sama (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md:287`), sehingga homepage lolos tapi 9 halaman anak terkena. Title live terpanjang: `/artikel` = **104 karakter**, brand muncul 2×.

**C2 — `/galeri` memuat KEDUA kata kunci target.** Title live: `Galeri Foto - Grand Duta City South of Jakarta | Grand Duta City Parung`. Ini pesaing exact-match paling bersih untuk kata kunci kedua.

**C3 — 2 artikel bersaing langsung.**
- `/cluster-rumah-baru-di-parung-bogor`: title memuat exact match `Grand Duta City South of Jakarta`, meta description **kosong**, isi duplikat tipis dari 2 halaman cluster.
- `/perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap`: value proposition identik homepage.
- `/desain-rumah-minimalis-modern`: meta description **kosong**.

**C4 — Brand tanpa modifier di halaman tidak relevan.** `/privacy-policy` title = `Kebijakan Privasi Grand Duta City Parung`. `/about` title = `About Developer - Duta Putra Land | Grand Duta City | Grand Duta City Parung`.

**C5 — `openGraph.siteName` tidak konsisten** di 3 varian: `"Grand Duta City Parung"` (layout), `"Grand Duta City Parung South of Jakarta"` (7 halaman), `"Grand Duta City South of Jakarta"` (`/author/santika-reza`).

**C6 — Deskripsi duplikat.** `/cluster-ladera` dan `/cluster-cascada` punya meta description byte-identical.

**C7 — 12 title artikel >80 karakter** (terpanjang 100), terpotong di SERP.

**C8 — 18 dari 32 artikel menyasar agen properti/HR/akuntan/penjual**, bukan pembeli rumah di Parung. Satu artikel berbahasa Inggris di situs `lang="id"` tanpa hreflang.

**C9 — Konflik integritas data (3 salinan divergen daftar unit).**
| Fakta | `src/lib/data.ts` | `tipe-rumah.tsx` | `cluster-ladera/page.tsx` | `pricelist-content.tsx` | Schema homepage |
|---|---|---|---|---|---|
| Manoa T-58 kamar tidur | 2 | 1 | — | — | "1 kamar tidur" |
| Malta 47/72 harga | 800 Juta-an | 800 Juta-an | Rp 900 Juta-an | KPR 971 Jt – 1,021 M | `price: "800000000"` |
| ID tipe Aira | `aira-42` | `air-plus-42` | — | `T-42` | — |
| Keila 47 | ada, `soldOut: true` | tidak ada | — | tidak ada | tidak ada |
| Verona / Frontera | tidak ada | tidak ada | ada (JSX) | ada | tidak ada |

**C10 — Harga di structured data tidak cocok dengan halaman tujuan.** 6 blok `Product`+`Offer` di `page.tsx:221-369` mencantumkan 800 Jt / 1,1 M / 1,4 M dengan `url` ke halaman cluster yang menampilkan angka berbeda. Semua 6 memakai `availability: "InStock"` padahal Keila `soldOut: true` dan ketersediaan sebenarnya hanya gambar raster siteplan.

**C11 — Klaim faktual tidak konsisten.** `bank-slider.tsx:5` = 5 logo (Mandiri, BSI, BRI, BTN, OCBC NISP); copy = "8 Bank Mitra"; `faq-kpr.tsx:15` = BCA, Mandiri, BTN, BRI, BNI (BCA & BNI tidak ada di logo).

**C12 — Freshness stok hardcoded.** `LAST_UPDATED_VISUAL = "17 Agustus 2026"` string literal di halaman bernama "Update Stok".

**C13 — Schema mati / tidak eligible.**
- `FAQPage` ×4 — Google membatasi ke situs pemerintah/kesehatan (Agustus 2023), lalu menghapus fitur sepenuhnya 7 Mei 2026.
- `SearchAction` — sitelinks searchbox diretire 21 Nov 2024; `urlTemplate` = `/?s={search_term_string}` (pola WordPress warisan migrasi), dan route pencarian tidak ada.
- `SiteNavigationElement` ×8 — bukan tipe yang didukung Google.
- `Product`+`Offer` ×6 dengan `shippingDetails` 0 hari/0 IDR dan `MerchantReturnNotPermitted` untuk rumah tapak.
- `breadcrumb` 1 item di homepage — tidak pernah dirender.
- `CollectionPage` untuk homepage — tipe untuk arsip, bukan homepage.

**C14 — Schema yang hilang padahal didukung.**
- `BreadcrumbList` **tidak ada di 32 halaman artikel** (verifikasi live `/cara-memilih-rumah-parung`: hanya 2 blok JSON-LD), padahal breadcrumb visual dirender di `[slug]/page.tsx:343`.
- `VideoObject` tidak ada padahal homepage punya 2 `<video>`.
- `/galeri` **nol JSON-LD**.
- `WebSite` di homepage **tanpa `@id`**, tapi `/category/*` merujuk `isPartOf: {"@id": ".../#website"}` → referensi menggantung.
- `BlogPosting.publisher.name` = "Grand Duta City Parung" vs `Organization.name` = "Duta Putra Land", tanpa `@id` penghubung.
- `BlogPosting.author` = `"Tim Editorial GDC"` tanpa `url`, tidak menunjuk `/author/santika-reza` yang sudah punya schema `Person`.

**C15 — Entitas utama salah.** `Organization` global bernama "Duta Putra Land" dengan `alternateName` proyek. Situs ini tentang proyeknya, bukan developernya.

**C16 — Konversi tidak terukur.** `trackEvent()` ada di `src/lib/analytics.ts:3` dan **tidak dipanggil sekali pun** (grep `trackEvent(` di `src/**/*.tsx`: 0 match). Ada 25+ CTA WhatsApp di 16 komponen. `contact-form.tsx:23` hanya membuka WhatsApp tanpa menyimpan lead.

**C17 — Nav parent tidak crawlable.** `header-2.tsx:29,38,47` — `Cluster`, `Harga & Stok`, `Informasi` dirender `<button>` dengan `href: '#'`.

**C18 — Blokir teknis pSEO.** Nol `generateStaticParams` di seluruh repo. `/[slug]` article-only (`[slug]/page.tsx:115-121,165-167`). Tabel `artikel` tidak punya kolom tipe halaman/template.

**C19 — Lain-lain.** HTML homepage 387 KB. `/disclaimer` + `/privacy-policy` indexable tapi tidak di sitemap. Canonical `/category/*` relatif sementara halaman lain absolut. Paginasi tag self-canonical vs category ke halaman 1. `src/components/layout/header.tsx` dead code. `lastModified` artikel di sitemap pakai `publishedAt`, bukan `updatedAt`. Kalkulator KPR homepage tanpa clamp pada `dpPercent` dan `bunga`.

### Belum terverifikasi (harus dicek sebelum keputusan terkait)
- **Core Web Vitals lapangan.** PageSpeed Insights API menolak permintaan (HTTP 429, 2×). LCP/INP/CLS **belum diketahui**.
- **Peringkat & query aktual.** Tanpa akses Search Console, peringkat sekarang untuk dua kata kunci target tidak dapat dikonfirmasi.
- **Trafik per URL.** Artinya keputusan redirect/noindex belum bisa divalidasi terhadap trafik nyata.

## Keputusan arsitektur

1. **Homepage adalah aset paling berharga dan diperlakukan terakhir.** Fase pembersihan kanibalisasi tidak menyentuh metadata homepage sama sekali. Perubahan title/description homepage adalah fase terpisah, tergated, dan hanya dijalankan setelah efek fase sebelumnya terukur.
2. **Aturan kata kunci berbasis modifier, bukan penghapusan brand total.** Halaman non-homepage boleh memuat "Grand Duta City" hanya bila dipasangkan modifier kuat yang mengubah maksud query (pricelist, siteplan, lokasi, cluster X, cara beli, tipe X). Tidak boleh memuat `"Grand Duta City Parung"` atau `"Grand Duta City South of Jakarta"` sebagai brand tag berdiri sendiri atau di ujung title. Alasan: `pricelist grand duta city parung` adalah query berbeda yang memang harus dimenangkan halaman pricelist.
3. **Prune sebelum bangun.** Tidak ada halaman programmatic dibuat sebelum C8 (dilusi topikal) dan C9 (integritas data) selesai.
4. **Plafon programmatic SEO 32 halaman, keras.** Situs ini satu proyek di satu lokasi. Melewati ~35 halaman, playbook Locations berubah menjadi doorway pages menurut pedoman Google.
5. **Data pSEO hidup sebagai kode, bukan CMS.** Tabel `artikel` tidak punya kolom tipe halaman, dan data unit memang bukan konten editorial. Sumber tunggal = `src/data/units.ts`.
6. **Setiap fase adalah deploy terpisah dengan jendela observasi.** SEO bukan build — efeknya butuh waktu untuk terbaca. Menumpuk beberapa fase dalam satu deploy membuat regresi tidak bisa diatribusikan.
7. **Guard otomatis lebih dipercaya daripada review manual.** Invarian SEO dikodekan sebagai test yang jalan di `npm run test`, sehingga regresi tertangkap sebelum deploy.

## Requirements

### R1 — Proteksi homepage (prioritas tertinggi, tidak bisa dinegosiasi)

- WHEN perubahan apa pun diterapkan pada fase manapun THEN `alternates.canonical` homepage TETAP tepat `https://granddutacitysouthofjakarta.com` tanpa trailing slash.
- WHEN perubahan apa pun diterapkan THEN homepage TETAP `index: true, follow: true` dan TIDAK PERNAH memperoleh directive `noindex` walau sementara.
- WHEN perubahan apa pun diterapkan THEN homepage TETAP memiliki tepat **satu** `<h1>` yang memuat frasa `Grand Duta City Parung`.
- WHEN `title.template` dihapus dari layout THEN title homepage TIDAK berubah sama sekali (terverifikasi: template memang tidak pernah diterapkan ke homepage).
- WHEN metadata homepage diubah THEN perubahan itu berdiri sebagai deploy tunggal tanpa perubahan SEO lain, dan didahului baseline serta diikuti jendela observasi minimum 21 hari.
- WHEN homepage kehilangan peringkat setelah suatu fase THEN tersedia commit rollback tunggal yang memulihkan metadata homepage persis ke baseline.

### R2 — Nol URL mati

- WHEN redirect ditambahkan THEN tidak ada rantai redirect (A→B→C) dan tidak ada loop; setiap sumber redirect langsung ke tujuan final berstatus 200.
- WHEN sebuah URL di-redirect THEN tujuannya adalah halaman yang secara topik paling dekat, bukan homepage, KECUALI memang duplikat homepage.
- WHEN URL apa pun dihapus dari sitemap THEN URL tersebut TETAP merespons 200 atau 301, TIDAK PERNAH 404 tanpa redirect.
- WHEN seluruh fase selesai THEN semua 13 aturan `redirects()` existing di `next.config.ts` tetap utuh.

### R3 — Kanibalisasi tuntas dan terjaga

- WHEN fase pembersihan selesai THEN NOL halaman non-homepage memiliki title yang memuat `Grand Duta City Parung` atau `Grand Duta City South of Jakarta` sebagai brand tag berdiri sendiri atau di posisi akhir.
- WHEN fase pembersihan selesai THEN NOL halaman non-homepage memiliki title memuat frasa `Grand Duta City South of Jakarta`.
- WHEN fase pembersihan selesai THEN setiap title halaman ≤ 60 karakter dan setiap meta description antara 120–160 karakter.
- WHEN fase pembersihan selesai THEN NOL title duplikat dan NOL meta description duplikat antar halaman.
- WHEN halaman baru ditambahkan kapan pun di masa depan THEN test otomatis gagal bila melanggar aturan di atas.

### R4 — Integritas data sebelum templating

- WHEN `src/data/units.ts` dibuat THEN ia menjadi satu-satunya sumber data unit dan dua salinan divergen (`src/lib/data.ts`, array di `tipe-rumah.tsx`) dihapus atau menjadi re-export tipis.
- WHEN konflik fakta direkonsiliasi THEN nilai final dikonfirmasi pemilik, bukan dipilih agent.
- WHEN structured data memuat harga THEN harga itu identik dengan harga yang tampil di halaman yang dirujuk `url`-nya.
- WHEN structured data memuat `availability` THEN nilainya berasal dari field status unit yang nyata, bukan hardcode.
- WHEN klaim jumlah bank mitra ditampilkan THEN jumlah dan nama bank konsisten di semua tempat (slider logo, copy, FAQ).

### R5 — Dilusi topikal — DITUNDA KE SPEC TERPISAH

**Status: DI LUAR CAKUPAN spec ini.** Atas keputusan pemilik, pemangkasan 18 artikel off-topic (`noindex, follow`) dikeluarkan dari spec ini dan akan dikerjakan sebagai spec tersendiri **setelah seluruh task di spec ini selesai**.

Konsekuensi yang harus dipahami saat mengeksekusi spec ini:

- WHEN spec ini selesai THEN 18 artikel off-topic MASIH terindeks, jadi sinyal fokus topikal situs belum sepenuhnya pulih. Kenaikan peringkat dari spec ini datang dari pencabutan kanibalisasi, penguatan entitas, rich result, dan pSEO — bukan dari pemulihan fokus topikal.
- WHEN Task 7 (pSEO) dijalankan THEN ia berjalan di atas situs yang arsipnya masih 56% off-topic. Ini menaikkan risiko indexation rate gelombang 1 di bawah 80%. Bila itu terjadi, penyebab paling mungkin adalah dilusi topikal, bukan template pSEO-nya — dan pemangkasan harus dipercepat sebelum gelombang 2.
- WHEN artikel diperbaiki title/description-nya di Task 1.6 THEN 18 artikel kandidat pemangkasan TETAP diperbaiki juga, karena mereka masih terindeks dan title terpotong tetap merugikan.

Daftar kandidat 18 slug diarsipkan di `design.md` → "Lampiran: kandidat pemangkasan (spec terpisah)" agar tidak perlu diaudit ulang nanti.

### R6 — Schema yang benar dan graf tersambung

- WHEN schema direstrukturisasi THEN homepage mengemit satu `@graph` dengan semua node ber-`@id` dan NOL referensi `@id` menggantung.
- WHEN entitas utama ditetapkan THEN ia bertipe `Place` bernama `Grand Duta City Parung South of Jakarta` dengan `alternateName` memuat `Grand Duta City South of Jakarta`, `GDC SOJ Parung`, dan `GDC Parung`.
- WHEN `Organization` "Duta Putra Land" dipertahankan THEN ia terhubung ke entitas proyek lewat `@id`, bukan berdiri sendiri.
- WHEN schema mati dihapus THEN `Product`/`Offer`, `SearchAction`, `SiteNavigationElement`, breadcrumb 1-item, dan 3 dari 4 `FAQPage` dibuang; satu `FAQPage` di homepage dipertahankan karena masih dibaca LLM dan AI search.
- WHEN `BreadcrumbList` ditambahkan ke `/[slug]` THEN item breadcrumb JSON-LD identik dengan breadcrumb visual yang dirender.
- WHEN `FAQPage` dipertahankan THEN pertanyaan dan jawabannya berasal dari satu sumber yang sama dengan yang tampil ke pengunjung.
- WHEN setiap fase schema selesai THEN Rich Results Test bersih tanpa error dan tanpa warning baru.

### R7 — Pengukuran sebelum optimasi lanjutan

- WHEN fase pengukuran selesai THEN seluruh 25+ CTA WhatsApp mengirim event GA4 dengan parameter halaman, posisi CTA, dan tipe unit bila relevan.
- WHEN event terpasang THEN event tersebut ditandai sebagai konversi di GA4 dan terlihat di laporan realtime dari minimal 5 halaman berbeda.
- WHEN fase pSEO dimulai THEN pengukuran sudah aktif minimal 14 hari sehingga dampaknya dapat diatribusikan.

### R8 — Programmatic SEO tanpa doorway page

- WHEN halaman programmatic dibuat THEN setiap halaman memuat data yang tidak tersedia di halaman lain mana pun di situs.
- WHEN blok konten identik lintas halaman (mis. 14 spesifikasi bangunan project-wide) THEN blok itu di-link, bukan diduplikasi.
- WHEN halaman proximity dipertimbangkan THEN ia HANYA dibuat bila jarak km dan rute nyata sudah terkumpul; tanpa itu halaman tidak dibuat.
- WHEN gelombang pSEO berikutnya dimulai THEN indexation rate gelombang sebelumnya sudah ≥80% di Search Console.
- WHEN total halaman programmatic mendekati 35 THEN tidak ada halaman baru ditambahkan tanpa evaluasi ulang eksplisit.
- WHEN halaman programmatic dibuat THEN setiap halaman punya breadcrumb (visual + JSON-LD), link ke hub, link ke 2–3 sibling, dan tidak ada orphan.
- WHEN route pSEO baru dibuat THEN gambarnya diregistrasi di `src/data/images.ts` sesuai kontrak di header file itu.

### R9 — Verifikasi berlapis per fase

- WHEN fase ditutup THEN `npm run lint && npm run test && npm run build` hijau.
- WHEN fase ditutup THEN snapshot metadata live dibandingkan terhadap baseline dan setiap perbedaan sudah disengaja serta terdokumentasi.
- WHEN fase ditutup THEN tidak ada URL yang berubah status dari 200 menjadi 404.
- WHEN fase menyentuh sitemap THEN `sitemap.xml` di-fetch dan divalidasi: tidak ada URL noindex yang belum semestinya dikeluarkan, tidak ada URL 404.
- WHEN fase ditutup THEN commit-nya atomik dan reversibel dengan satu `git revert`.

### R10 — Jendela observasi antar fase

- WHEN fase yang menyentuh title/description/canonical/robots dideploy THEN fase berikutnya yang menyentuh area sama menunggu minimum **14 hari**.
- WHEN fase menyentuh metadata homepage THEN jendela observasinya minimum **21 hari**.
- WHEN fase murni aditif (menambah schema, menambah event tracking, menambah halaman baru) THEN tidak ada jendela tunggu wajib.
- WHEN dalam jendela observasi terdeteksi penurunan posisi homepage untuk dua kata kunci target THEN fase berikutnya ditunda dan rollback dievaluasi lebih dulu.
