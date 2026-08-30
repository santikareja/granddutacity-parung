# Design — Perbaikan Kanibalisasi Kata Kunci & Programmatic SEO

## Prinsip desain

Spec ini menyentuh aset organik yang sudah hidup. Tiga prinsip mengikat seluruh desain:

1. **Asimetri risiko.** Kerugian dari menurunkan peringkat homepage jauh lebih besar daripada keuntungan dari optimasi tambahan. Karena itu homepage diperlakukan sebagai *read-mostly*: fase awal hanya mencabut pesaingnya, tanpa menyentuhnya.
2. **Satu perubahan, satu sinyal.** Bila dua fase dideploy bersamaan lalu peringkat turun, penyebabnya tidak bisa diatribusikan dan rollback jadi menebak. Karena itu satu fase = satu commit = satu deploy.
3. **Invarian dikodekan, bukan diingat.** Semua aturan di `requirements.md` R1 dan R3 diterjemahkan menjadi test yang gagal secara otomatis. Review manual tidak dipercaya untuk menjaga 21 halaman.

## Arsitektur pengaman (dibangun SEBELUM perubahan apa pun)

### Lapisan 1 — Baseline snapshot

Script sekali-jalan yang merekam kondisi live sebelum ada perubahan, jadi acuan rollback dan diff.

**File:** `scripts/seo-snapshot.mjs`

```
Input : daftar URL (dibaca dari /sitemap.xml live + 2 URL legal)
Output: .kiro/specs/seo-cannibalization-and-pseo/snapshots/<ISO-date>.json

Per URL merekam:
  - httpStatus, redirectLocation (fetch tanpa follow)
  - <title> literal
  - meta description
  - link[rel=canonical]
  - meta robots + X-Robots-Tag
  - jumlah <h1> + teks tiap <h1> (tag di-strip, whitespace dinormalkan)
  - daftar teks <h2>
  - jumlah blok <script type="application/ld+json"> NYATA (bukan hit di RSC payload)
  - daftar @type dari tiap blok, terurut
  - og:title, og:description, og:site_name
  - byteLength HTML
```

Catatan implementasi penting: pencarian `application/ld+json` dengan regex sederhana pada HTML Next.js menghasilkan **positif palsu** karena RSC flight payload (`self.__next_f.push`) mengandung string JSON-LD yang sama. Homepage terhitung 15 kemunculan padahal hanya ada 7 blok nyata. Script harus mencocokkan `<script type="application/ld+json">...</script>` secara eksplisit.

Snapshot dijalankan: (a) satu kali sebelum Fase 1, (b) sesudah setiap fase. Diff antar snapshot adalah bukti verifikasi untuk R9.

### Lapisan 2 — Guard test invarian metadata

**File:** `src/app/(site)/__tests__/seo-invariants.test.ts` (Vitest, sudah tersedia di proyek — `npm run test` = `vitest --run`)

Test mengimpor `metadata`/`generateMetadata` dari tiap route lalu mengasersi:

| Guard | Asersi | Requirement |
|---|---|---|
| G1 | Title homepage memuat `Grand Duta City Parung` | R1 |
| G2 | Canonical homepage tepat `https://granddutacitysouthofjakarta.com` | R1 |
| G3 | Robots homepage `index !== false` | R1 |
| G4 | Tidak ada title non-homepage memuat `Grand Duta City South of Jakarta` | R3 |
| G5 | Tidak ada title non-homepage diakhiri `| Grand Duta City Parung` atau `| Grand Duta City` | R3 |
| G6 | Semua title ≤ 60 karakter | R3 |
| G7 | Semua description 120–160 karakter | R3 |
| G8 | Semua title unik (Set.size === array.length) | R3 |
| G9 | Semua description unik | R3 |
| G10 | Setiap halaman indexable punya `alternates.canonical` | R2 |
| G11 | `openGraph.siteName` sama di semua halaman yang menyetelnya | C5 |
| G12 | Layout tidak lagi mengekspor `title.template` | C1 |

G6 dan G7 dijalankan dengan daftar pengecualian eksplisit dan berkomentar, bukan longgar — agar pengecualian baru harus sengaja ditambahkan.

Test ini adalah mekanisme utama yang memenuhi "tidak ada kesalahan yang memperburuk ranking": pelanggaran tertangkap di `npm run test`, sebelum deploy.

### Lapisan 3 — Smoke test live pasca-deploy

**File:** `scripts/seo-verify.mjs`

Membandingkan snapshot terbaru terhadap baseline dan **gagal dengan exit code non-nol** bila:
- ada URL berubah 200 → 404
- ada rantai redirect (tujuan redirect ternyata juga redirect)
- homepage canonical / robots / jumlah h1 berubah
- ada title atau description duplikat baru

### Lapisan 4 — Rollback

Setiap fase = satu commit atomik dengan pesan berprefiks `seo(faseN):`. Rollback = `git revert <sha>` lalu deploy. Karena tidak ada perubahan skema DB di Fase 1–6, rollback murni kode dan tidak berisiko data.

Untuk Fase 8 (metadata homepage), rollback disiapkan sebagai patch terpisah `snapshots/homepage-metadata-baseline.patch` supaya bisa dipulihkan tanpa mengembalikan fase lain.

## Fase 1 — Cabut kanibalisasi (homepage TIDAK disentuh)

### Perubahan akar

```ts
// src/app/(site)/layout.tsx — SEBELUM (baris 31-34)
title: {
  default: "Grand Duta City Parung — Hunian Premium South of Jakarta",
  template: "%s | Grand Duta City Parung",
},

// SESUDAH — hanya template dihapus, default dipertahankan
title: {
  default: "Grand Duta City Parung — Hunian Premium South of Jakarta",
},
```

**Mengapa ini aman untuk homepage:** Next 16 tidak menerapkan `title.template` dari `layout.js` ke `title` di `page.js` pada segmen yang sama. Homepage (`(site)/page.tsx`) dan layout (`(site)/layout.tsx`) berada di segmen yang sama, jadi template memang tidak pernah diterapkan. Terkonfirmasi dua arah: dokumentasi (`generate-metadata.md:287`) dan HTML live (title homepage tidak bersuffix). Menghapus template = nol perubahan pada homepage.

`default` dipertahankan sebagai jaring aman untuk route tanpa `metadata` sendiri (`error.tsx` adalah client component tanpa metadata).

### Tabel title & H1

Semua title ditulis sebagai string biasa. Halaman yang sudah memakai `title: { absolute: ... }` tetap dibiarkan bentuknya, hanya isinya diganti.

| Route | Title live sekarang | Char | → Title baru | Char | H1 baru |
|---|---|---|---|---|---|
| `/` | Grand Duta City Parung \| Promo Hunian South of Jakarta | 54 | **TIDAK DIUBAH DI FASE INI** | 54 | tidak diubah |
| `/cluster-ladera` | Cluster Ladera Grand Duta City Parung \| Ladera South of Jakarta \| Grand Duta City Parung | 88 | `Cluster Ladera GDC Parung: Tipe, Harga & Stok Unit` | 50 | `Cluster Ladera — Verona, Malta & Tuscan` |
| `/cluster-cascada` | Cluster Cascada Grand Duta City Parung \| Cascada South of Jakarta | 66 | `Cluster Cascada GDC Parung: Tipe, Harga & Stok Unit` | 51 | `Cluster Cascada — Aira, Manoa, Victoria & Alexandra` |
| `/pricelist-grand-duta-city` | Pricelist Grand Duta City Parung \| Harga Ladera & Cascada \| Grand Duta City Parung | 90 | `Pricelist Grand Duta City Parung 2026 \| Harga Resmi` | 51 | `Pricelist Resmi 2026 — Ladera & Cascada` |
| `/kontak` | Kontak Marketing Grand Duta City Parung \| Survey & Informasi \| Grand Duta City Parung | 88 | `Kontak Marketing GDC Parung \| Jadwal Survey Unit` | 49 | `Kontak Marketing GDC Parung` |
| `/lokasi-akses-grand-duta-city-parung` | Lokasi Grand Duta City Parung \| Akses ke Bogor, Depok & Jakarta \| Grand Duta City Parung | 94 | `Lokasi GDC Parung: 4 Exit Tol ke Jakarta & Depok` | 48 | `Lokasi & Akses GDC Parung ke Jakarta, Depok, Bogor` |
| `/cara-beli-kpr` | Cara Beli Rumah di Grand Duta City Parung \| KPR & Tahapan \| Grand Duta City Parung | 87 | `Cara Beli Rumah GDC Parung: Alur KPR & Dokumen` | 47 | `Cara Beli Rumah & Proses KPR di GDC Parung` |
| `/artikel` | Artikel Properti Grand Duta City Parung 2026 \| Panduan Beli Rumah & Investasi \| Grand Duta City Parung | 104 | `Blog Properti Parung Bogor: Panduan Beli Rumah 2026` | 51 | `Blog & Panduan Properti Parung Bogor` |
| **`/galeri`** | **Galeri Foto - Grand Duta City South of Jakarta \| Grand Duta City Parung** | 71 | `Galeri Foto & Video Kawasan GDC Parung` | 38 | `Galeri Foto & Video Kawasan GDC Parung` |
| `/update-stok-…parung` | Update Stok & Siteplan Grand Duta City \| Grand Duta City Parung | 63 | `Update Stok Unit & Siteplan GDC Parung 2026` | 43 | `Update Stok Unit & Siteplan GDC Parung` |
| `/about` | About Developer - Duta Putra Land \| Grand Duta City \| Grand Duta City Parung | 76 | `Duta Putra Land: Developer Properti Sejak 1983` | 46 | `Duta Putra Land` (tetap) |
| `/privacy-policy` | Kebijakan Privasi Grand Duta City Parung | 40 | `Kebijakan Privasi` | 17 | tetap |
| `/disclaimer` | Disclaimer \| Informasi Penting Situs | 36 | tetap | 36 | tetap |
| `/category` | Topik Artikel Properti — Semua Kategori \| Grand Duta City | 58 | `Topik Artikel Properti — Semua Kategori` | 39 | tetap |
| `/category/seputar-gdc` | Seputar GDC — Informasi & Update Grand Duta City Parung Terbaru | 63 | `Seputar GDC: Update Stok, Fasilitas & Cluster` | 45 | tetap |
| `/category/panduan-properti` | Panduan Properti: Tips Beli Rumah, KPR & Investasi \| Grand Duta City | 68 | `Panduan Properti: Tips Beli Rumah, KPR & Investasi` | 50 | tetap |
| `/category/kawasan` | Kawasan Properti — Ulasan Area Parung, Bogor & Sekitarnya \| Grand Duta City | 75 | `Ulasan Kawasan Properti Parung, Bogor & Sekitarnya` | 49 | tetap |
| `/author/santika-reza` | Santika Reza - Praktisi & Penulis Marketing Properti \| Grand Duta City \| Grand Duta City Parung | 96 | `Santika Reza — Praktisi Marketing Properti` | 42 | tetap |

`/tag/*` tidak diubah — sudah `noindex` dan title-nya (`Tag: {name} - Grand Duta City`) tidak memuat frasa target.

### Deskripsi yang harus diperbaiki

Panjang di kolom "Char" terukur langsung dari HTML live. Rentang target guard G7: 120–160.

| Route | Char | Masalah | Perbaikan |
|---|---|---|---|
| `/` | 148 | — | **TIDAK DISENTUH.** Sudah di dalam rentang, jadi G7 tidak memaksa perubahan homepage |
| `/galeri` | 146 | memuat `Grand Duta City South of Jakarta` | Tulis ulang tanpa frasa itu, fokus ke isi galeri |
| `/about` | 141 | memuat `Grand Duta City South of Jakarta` | Ganti jadi `Grand Duta City Parung` |
| `/cluster-ladera` | 146 | byte-identical dengan Cascada | Bedakan: American Classic Modern, tipe Verona/Malta/Tuscan |
| `/cluster-cascada` | 147 | byte-identical dengan Ladera | Bedakan: Modern Tropical Resort, tipe Aira/Manoa/Victoria/Alexandra |
| `/category/panduan-properti` | **193** | memuat frasa target + terlalu panjang | Ganti frasa + pendekkan ke ≤160 |
| `/category/kawasan` | **180** | terlalu panjang | Pendekkan ke ≤160 |
| `/category/seputar-gdc` | **168** | terlalu panjang | Pendekkan ke ≤160 |
| `/author/santika-reza` | **183** | memuat frasa target + terlalu panjang + og:siteName varian ketiga | Ganti frasa di `description` dan `openGraph.description`, pendekkan, seragamkan siteName |
| `/update-stok-…parung` | **118** | terlalu pendek | Perpanjang ke 130–150 |
| `/category` | **116** | terlalu pendek | Perpanjang ke 130–150 |

Sisanya sudah di dalam rentang dan tidak perlu diubah panjangnya: `/pricelist-…` (149), `/kontak` (135), `/lokasi-akses-…` (149), `/cara-beli-kpr` (132), `/artikel` (148), `/privacy-policy` (121), `/disclaimer` (120).

### Normalisasi `openGraph.siteName`

Satu nilai kanonik untuk seluruh situs: **`Grand Duta City Parung`** (nilai yang sudah ada di layout). Terapkan ke 8 lokasi yang menyetel nilai berbeda: `disclaimer`, `privacy-policy`, `pricelist-grand-duta-city`, `kontak`, `cluster-cascada`, `lokasi-akses-…`, `cara-beli-kpr`, `artikel`, dan `SITE_NAME` di `article-taxonomy-archive.tsx`. Ganti juga `author/santika-reza` yang memakai varian ketiga.

Sebaiknya diekstrak ke satu konstanta `src/lib/seo.ts` → `export const OG_SITE_NAME = "Grand Duta City Parung";` agar drift tidak terulang.

### Redirect (ditambahkan ke `next.config.ts` `redirects()`)

```ts
// Duplikat tipis halaman cluster; title memuat exact match keyword kedua.
{ source: "/cluster-rumah-baru-di-parung-bogor", destination: "/cluster-cascada", permanent: true },
// Value proposition identik homepage.
{ source: "/perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap", destination: "/", permanent: true },
```

**Prasyarat R5/R2:** kedua URL ini harus dicek dulu di Search Console. Bila salah satunya sudah punya impresi/klik signifikan untuk query non-brand, opsi yang lebih aman adalah **retitle + isi meta description**, bukan redirect. Keputusan ini milik pemilik, bukan agent.

Penempatan: **sesudah** aturan `/v2-admin` dan **sebelum** aturan `/:path+/`, mengikuti komentar existing di file bahwa urutan menentukan pemenang.

### Yang TIDAK dilakukan di Fase 1

- Metadata homepage (title, description, canonical, keywords, OG) — nol perubahan.
- Schema apa pun.
- `noindex` apa pun.
- Sitemap.

## Fase 2 — Pengukuran konversi

`src/lib/analytics.ts` sudah menyediakan `trackEvent(eventName, params)` yang aman (guard `typeof window.gtag !== "function"`). `DeferredAnalytics` memasang stub `window.gtag` + `dataLayer` sinkron saat mount lalu me-replay setelah gtag.js dimuat, jadi event dari CTA yang diklik lebih awal tidak hilang.

Yang dibangun: satu komponen/util pembungkus supaya 25+ CTA tidak masing-masing memasang handler ad-hoc.

```ts
// src/lib/analytics.ts — tambahan
export type WaCtaContext = {
  page: string;       // "/", "/cluster-ladera", "/tipe-rumah/malta-47-72"
  placement: string;  // "hero", "promo-popup", "header-desktop", "kpr-calculator", …
  unit?: string;      // "malta-47-72" bila CTA spesifik unit
  value?: number;     // harga KPR unit, untuk nilai konversi
};

export const trackWhatsAppClick = (ctx: WaCtaContext) =>
  trackEvent("whatsapp_click", { ...ctx });
```

Titik pemasangan (16 komponen): `hero.tsx` ×2, `promo-popup.tsx`, `header-2.tsx` ×3, `faq-kpr.tsx` (sudah ada `onClick`, cukup tambah 1 baris), `tipe-rumah.tsx` ×2, `pricelist-content.tsx` ×3, `lokasi-scroll.tsx`, `fasilitas.tsx`, `better-living.tsx`, `about.tsx`, `video-section.tsx`, `contact-form.tsx` ×2, `cluster-units.tsx`, `cluster-faq-kpr-section.tsx`, `whatsapp-button.tsx`.

Untuk `<a href>` biasa (bukan `window.open`), pakai `onClick` tanpa `preventDefault` — event terkirim ke `dataLayer` secara sinkron sebelum navigasi tab baru, dan `target="_blank"` berarti halaman tidak unload.

Fase ini murni aditif → tidak ada risiko SEO, tidak ada jendela tunggu.

## Fase 3 — Sumber data tunggal

```ts
// src/data/units.ts
export type UnitStatus = "available" | "limited" | "sold-out" | "coming-soon";

export type UnitPrice = {
  tunaiKeras: number;
  kpr: number;
  dp10: number;
  bookingFee: number;
  plafond: number;
};

export type Unit = {
  slug: string;              // "malta-47-72" — dipakai sebagai URL segment
  name: string;              // "Malta"
  typeCode: string;          // "T-47"
  cluster: "ladera" | "cascada";
  lb: number;
  lt: number;
  bedrooms: number;
  extraRoom: boolean;        // menggantikan union `2 | "2+1"`
  bathrooms: number;
  carports: number;
  floors: number;            // BARU — sekarang hanya ada di prosa `desc`
  status: UnitStatus;
  price: UnitPrice | null;   // null untuk coming-soon
  priceRanges?: { cash: [number, number]; land: [number, number] };  // tipe kind:"range"
  hook?: { cashRange: [number, number]; landRange: [number, number]; units: number };
  blocks: string[];          // ["J.17", "J.18", "J.19"]
  kavling: string;
  unitCount: number;
  facadeImage: string;
  floorPlanImage: string | null;
  description: string;
};
```

Rekonsiliasi yang **wajib dikonfirmasi pemilik** sebelum kode ditulis:

| Fakta | Nilai yang bertentangan | Perlu keputusan |
|---|---|---|
| Manoa T-58 kamar tidur | 2 / 1 / 1 | Mana yang benar? (58 m² dengan 1 KT tampak tidak masuk akal) |
| Malta 47/72 harga tampil | 800 Jt-an / Rp 900 Juta-an / KPR Rp 971 Jt–1,021 M | String marketing mana yang benar, dan harus konsisten dengan pricelist |
| Bank mitra | 5 logo / "8 bank" / 5 nama berbeda di FAQ | Berapa dan siapa saja? |
| Status stok per tipe | hanya `soldOut` pada 1 dari 7 unit | Status aktual tiap tipe |
| Jumlah lantai per tipe | tidak ada sebagai field | Per tipe |
| Denah yang hilang | Keila, Verona, Frontera, T-39, T-47, T-62 | Sediakan aset atau tandai `null` |

Migrasi konsumen: `src/lib/data.ts` menjadi re-export tipis (`export const propertyTypes = unitsAsLegacyShape`) untuk satu iterasi, lalu dihapus setelah `cluster-units.tsx`, `cluster-cascada/page.tsx`, dan `tipe-rumah.tsx` beralih ke `units.ts`. Ini menghindari perubahan besar dalam satu commit.

Perbaikan menyertai di fase ini:
- `LAST_UPDATED_ISO`/`LAST_UPDATED_VISUAL` diturunkan dari satu konstanta tanggal, dan halaman menampilkan peringatan bila usianya >45 hari.
- Clamp `dpPercent` (0–90) dan `bunga` (0–25) pada kalkulator `faq-kpr.tsx`, menyamakan dengan dua kalkulator lain yang sudah benar.
- FAQ homepage: `FAQ_CONTENT` di `page.tsx` dihapus, schema dibangun dari `faqs` di `faq-kpr.tsx` yang diekspor. Sama untuk `/pricelist-grand-duta-city`.

## Fase 4 — DIKELUARKAN DARI SPEC INI

Pemangkasan dilusi topikal ditunda ke spec terpisah atas keputusan pemilik, dikerjakan setelah seluruh task spec ini selesai. Lihat `requirements.md` → R5 untuk konsekuensinya terhadap ekspektasi hasil dan terhadap gate indexation rate di Fase 7.

Nomor fase tidak digeser: Fase 5–10 tetap memakai nomor aslinya supaya referensi lintas dokumen dan pesan commit tetap konsisten.

### Lampiran: kandidat pemangkasan (spec terpisah)

Diarsipkan di sini supaya tidak perlu diaudit ulang nanti. Semua title sudah diverifikasi dari HTML live.

```ts
// src/lib/seo-pruned-slugs.ts — UNTUK SPEC TERPISAH, JANGAN DIBUAT DI SPEC INI
export const PRUNED_SLUGS = new Set([
  "jurnal-akuntansi-perusahaan-properti",
  "struktur-organisasi-perusahaan-properti-dan-tugasnya",
  "jabatan-di-perusahaan-properti",
  "contoh-profil-perusahaan-properti",
  "visi-dan-misi-perusahaan-properti",
  "seminar-bisnis-properti-real-estat",
  "listing-properti-panduan-lengkap",
  "daftar-agen-properti-online",
  "10-ciri-agen-properti-terbaik",
  "rumahtemu-masa-depan-marketplace-properti-2026",
  "how-to-set-up-a-long-term-home-office-in-a-bali-villa",
  "brand-plafon-pvc-terbaik-panduan-memilih-plafon-pvc-berkualitas-untuk-hunian-modern",
  "5-manfaat-air-hangat-di-rumah",
  "inovasi-teknologi-hemat-energi-dalam-konstruksi",
  "keuntungan-investasi-rumah-kos",
  "cara-jual-rumah-cepat-laku",
  "tips-menjual-tanah-kavling",
  "cara-membeli-tanah-murah",
]);
```

Catatan metodologis untuk spec terpisah nanti (jangan hilang): `noindex` dulu, URL **tetap di sitemap**. Mengeluarkan dari sitemap bersamaan dengan noindex membuat Google mengurangi frekuensi crawl ke URL tersebut, sehingga directive `noindex` lebih lama diproses. Baru setelah Search Console mengonfirmasi status "Excluded by noindex", URL dikeluarkan dari sitemap. Gunakan `follow: true`, bukan 404/410.

14 artikel yang akan dipertahankan: `harga-tiket-masuk-di-the-beach-gdc`, `perumahan-di-bogor`, `cara-memilih-rumah-parung`, `7-alasan-memilih-rumah-cluster-di-parung-untuk-hunian-keluarga`, `5-hal-yang-gen-z-harus-tahu-sebelum-beli-rumah-pertama`, `rumah-di-kawasan-strategis`, `cara-menaksir-harga-rumah`, `desain-rumah-minimalis-modern`, `renovasi-rumah-tua-jadi-modern`, `konsep-desain-rumah-eco-friendly`, `desain-rumah-dengan-efisiensi-energi-yang-tinggi`, `sentuhan-elemen-kayu-interior-rumah-grand-duta-city`, `konsultan-properti-pilar-investasi`, dan `cluster-rumah-baru-di-parung-bogor` (bila pemilik memilih retitle alih-alih redirect di Task 1.7).

## Fase 5 — Restrukturisasi schema

### Graf homepage (satu `@graph`, semua ber-`@id`)

```
Place            @id /#project        ← ENTITAS UTAMA
  name           "Grand Duta City Parung South of Jakarta"
  alternateName  ["Grand Duta City South of Jakarta", "GDC SOJ Parung", "GDC Parung"]
  address, geo, hasMap, photo
  amenityFeature[]   ← dari facilities (8 item)
  containsPlace  [{@id /#cluster-ladera}, {@id /#cluster-cascada}]
  developer      {@id /#organization}

Place            @id /#cluster-ladera    name "Cluster Ladera"
Place            @id /#cluster-cascada   name "Cluster Cascada"

Organization     @id /#organization   ← developer, dipertahankan
  name "Duta Putra Land", foundingDate "1983", sameAs[], logo

RealEstateAgent  @id /#salesoffice
  parentOrganization {@id /#organization}
  telephone, openingHoursSpecification, priceRange, areaServed

WebSite          @id /#website        ← @id WAJIB (sekarang tidak ada)
  publisher {@id /#organization}
  (TANPA potentialAction/SearchAction)

WebPage          @id /#webpage
  about {@id /#project}, isPartOf {@id /#website}
  primaryImageOfPage {@id /#primaryimage}

ImageObject      @id /#primaryimage

FAQPage          @id /#faq            ← satu-satunya yang dipertahankan
  mainEntity dari sumber tunggal `faqs` di faq-kpr.tsx

VideoObject      @id /#video          ← BARU
  name, description, thumbnailUrl, uploadDate, contentUrl
```

`alternateName` yang memuat kedua varian brand adalah mekanisme paling langsung untuk memberi tahu Google bahwa "Grand Duta City South of Jakarta" dan "Grand Duta City Parung" adalah entitas yang sama, dan homepage adalah halamannya.

Yang dihapus dari `page.tsx`: `jsonLdProductList` (6 Product+Offer, ~150 baris), `potentialAction` di `jsonLdWebSite`, `jsonLdSiteNavigation`, `breadcrumb` 1-item di `jsonLdPage`, dan `CollectionPage` diganti `WebPage`. `jsonLdAgent` (`RealEstateAgent`) dipertahankan tapi masuk ke `@graph` dengan `@id`.

Efek samping menguntungkan: HTML homepage 387 KB akan turun. JSON-LD ikut terduplikasi di RSC flight payload, jadi setiap byte schema terhitung dua kali.

### Perubahan per route lain

| Route | Perubahan |
|---|---|
| `(site)/layout.tsx` | `Organization` tetap sebagai satu-satunya schema global, tidak berubah selain `@id` sudah benar |
| `/[slug]` (32 halaman) | **TAMBAH `BreadcrumbList`** yang itemnya dibangun dari array yang sama dengan `<Breadcrumb items={...}>` visual (satu sumber, tidak dua array terpisah). `BlogPosting.publisher` → `{"@id": ".../#organization"}`. `BlogPosting.author` → `Person` dengan `url: /author/santika-reza` dan `@id` |
| `/galeri` | **TAMBAH** `@graph`: `ImageGallery` + `BreadcrumbList` + `ImageObject[]` dari `siteImages.filter(i => i.page === "/galeri")` (36 gambar, sudah punya title + caption) |
| `/cluster-ladera`, `/cluster-cascada` | `FAQPage` dihapus dari `ClusterFaqKprSection`. `OfferCatalog`→`Offer`→`SingleFamilyResidence` dipertahankan (pola di `cluster-cascada/page.tsx:153` sudah benar) dan disambungkan ke `{@id /#project}` |
| `/pricelist-grand-duta-city` | `FAQPage` dihapus. `OfferCatalog` + `Dataset` dipertahankan, harganya kini dari `units.ts` |
| `/category/*` | `isPartOf: {"@id": ".../#website"}` sekarang menunjuk node yang benar-benar ada (setelah `WebSite` diberi `@id`) |
| `article-taxonomy-archive.tsx` | Array breadcrumb visual (`{label, href}`) dan array JSON-LD (`{name, item}`) yang sekarang dipelihara terpisah digabung jadi satu sumber |

## Fase 6 — Infrastruktur sitemap

Next 16 `sitemap.ts` mendukung properti `images` dan `videos` secara native (terverifikasi di `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`).

Pemecahan sitemap per tipe halaman via nested `sitemap.ts` pada route segment:

```
app/sitemap.ts                     → 18 halaman inti (16 sekarang + 2 legal) + images + videos
app/(site)/tipe-rumah/sitemap.ts   → 10 halaman tipe (Fase 7)
app/(site)/artikel/sitemap.ts      → artikel yang indexable
```

Manfaat: indexation rate per template terlihat terpisah di Search Console. Tanpa ini, kegagalan indeksasi satu template tersembunyi di angka agregat.

**`/images.xml` TIDAK dipensiunkan di fase ini.** Route handler itu berfungsi dan sudah terdaftar sebagai sitemap di Search Console. Mempensiunkannya adalah risiko tanpa imbalan setara. Rencana aman bila nanti diinginkan: (1) tambahkan `images` native ke `sitemap.ts`, (2) verifikasi Google mengambil gambar dari sitemap utama selama ≥30 hari, (3) baru hapus route + entry di `robots.ts` + hapus dari Search Console, dalam satu deploy.

Perubahan lain: tambahkan `/disclaimer` + `/privacy-policy`; `lastModified` artikel dari `updatedAt`, bukan `publishedAt`.

## Fase 7 — pSEO gelombang 1: halaman tipe unit

### Aset dan lanskap

Data proprietary terverifikasi: 18 `PriceRow` × 12 field, mencakup **~106 unit dengan nomor kavling dan blok spesifik** serta 5 titik harga numerik masing-masing (Ladera 70 unit: 4+2 Verona, 33+11 Malta, 16+4 Tuscan; Cascada 36 unit + 2 rentang).

Lanskap kompetitif: koridor Parung–Sawangan–Depok dikuasai **portal programmatic** — pinhome.id dengan pola `/poi/perumahan-{nama}`, plus rumah123, 99.co, lamudi. Konsekuensi strategis: jangan bertarung di keluasan inventaris (tidak akan menang di "rumah dijual di Depok"), menangi **kedalaman per unit**. Portal punya listing, tapi tidak punya pricelist resmi tingkat kavling.

### Route

`src/app/(site)/tipe-rumah/[slug]/page.tsx` dengan `generateStaticParams` dari `units.ts`. Segmen statis `tipe-rumah` selalu menang atas `[slug]` di root, jadi tidak ada bentrok dengan route artikel.

10 halaman: `verona-39-60`, `malta-47-72`, `tuscan-66-72`, `aira-42-60`, `manoa-58-60`, `victoria-69-74`, `alexandra-88-105`, `t-39`, `t-47`, `t-62-hook`. `frontera-89-90` menunggu pricelist. `keila-47` sold out → opsional sebagai halaman arsip `noindex`.

Plus halaman hub `/tipe-rumah` yang mendaftar 10 tipe.

### Template metadata

```ts
title: `Rumah Tipe ${name} ${lb}/${lt} GDC Parung — Harga & Denah`
desc:  `Tipe ${name} ${lb}/${lt} di Cluster ${clusterLabel} Grand Duta City Parung: ${bedrooms} KT, ${bathrooms} KM, harga KPR ${fmt(kpr)}, DP ${fmt(dp10)}. Tersedia ${unitCount} unit di blok ${blocks.join(", ")}.`
canonical: `/tipe-rumah/${slug}`
```

Setiap field terisi data nyata → nol duplikat title/description. Guard test G6/G8/G9 memvalidasi ini otomatis.

### Sumber keunikan per halaman (memenuhi R8)

| Elemen | Sumber | Unik? |
|---|---|---|
| 5 titik harga | `UnitPrice` | ✅ semua berbeda |
| Kavling + blok + jumlah unit | `kavling`, `blocks`, `unitCount` | ✅ Malta punya 4 tingkat harga di 4 grup blok |
| Varian hook + rentang harga & luas tanah | `hook` | ✅ hanya 3 tipe punya |
| Simulator KPR pre-filled harga unit ini | `calculateMonthlyInstallment` + `kpr`; DP min 5% untuk hook | ✅ output numerik berbeda — utility nyata, bukan teks |
| Denah + fasad | `floorPlanImage`, `facadeImage` | ✅ |
| LB/LT/KT/KM/carport/lantai | `Unit` | ✅ |
| Tabel banding vs tipe terdekat di cluster sama | dihitung dari `units.ts` | ✅ |
| 14 spesifikasi bangunan | `cluster-specs.tsx` | ❌ project-wide → **di-LINK, tidak diduplikasi** |

Baris terakhir adalah batas antara halaman programmatic yang sah dan konten duplikat, dan wajib dipatuhi.

### Schema per halaman

`@graph`: `SingleFamilyResidence` (`numberOfRooms`, `numberOfBathroomsTotal`, `numberOfFullBathrooms`, `floorSize`) + `Offer` dengan harga dari `units.ts` + `BreadcrumbList` + `ImageObject`. `isPartOf`/`containedInPlace` → `{"@id": "/#project"}`.

Bukan `Product` — rumah tapak tidak eligible merchant listing, dan itu penyebab pelanggaran C10.

### Internal linking (hub & spoke)

```
/                                    ← entitas utama
├── /cluster-ladera         [HUB] → 4 spoke
├── /cluster-cascada        [HUB] → 7 spoke
├── /tipe-rumah             [HUB] → 10 spoke
│     └── /tipe-rumah/{slug}
├── /pricelist-…            [HUB harga] → semua 10 tipe
├── /lokasi-akses-…         [HUB lokasi]
├── /cara-beli-kpr          [HUB KPR]
└── /artikel                [HUB editorial] → 14 artikel
```

Setiap spoke: breadcrumb visual + `BreadcrumbList`, link ke hub, link ke 2–3 sibling, link ke homepage dengan anchor brand. Nol orphan.

Registrasi gambar di `src/data/images.ts` wajib per route baru (kontrak di header file: "Every image displayed on the site MUST be registered here").

## Fase 8 — Metadata homepage (tergated, deploy tunggal)

Dijalankan **paling akhir** dan hanya bila Fase 1 sudah diobservasi ≥14 hari tanpa regresi.

Alasan ditempatkan terakhir: title homepage sekarang sudah sehat — 54 karakter, kata kunci di depan, satu `<h1>` yang memuat kedua kata kunci. Perubahannya bersifat penyempurnaan, bukan perbaikan cacat. Menggabungkannya dengan Fase 1 berarti bila peringkat bergerak, kita tidak tahu apakah karena pesaing internal dicabut atau karena title homepage diubah.

| Elemen | Sekarang | → Usulan |
|---|---|---|
| title | Grand Duta City Parung \| Promo Hunian South of Jakarta (54) | `Grand Duta City Parung South of Jakarta \| Rumah 700 Jt-an` (57) |
| description | Grand Duta City Parung — hunian premium di South of Jakarta. Mulai Rp 700 jutaan… (149) | Buka dengan frasa exact keyword kedua: `Grand Duta City South of Jakarta (GDC SOJ) di Parung, Bogor — kota mandiri 200 Ha. Rumah mulai Rp 700 jutaan, Promo Tanpa DP, 20 menit ke Jaksel.` (145) — panjangnya sudah diverifikasi masuk rentang 120–160 (guard G7). Klaim "KPR 8 bank" sengaja TIDAK dipakai sampai C11 direkonsiliasi di Fase 3 |
| H2 `about.tsx:103` | Tentang Kawasan Grand Duta City Parung | `Tentang Kawasan Grand Duta City South of Jakarta` |
| canonical | `https://granddutacitysouthofjakarta.com` | **TIDAK DIUBAH** |
| robots | index, follow | **TIDAK DIUBAH** |
| H1 | Grand Duta City Parung + South of Jakarta | **TIDAK DIUBAH** |
| `keywords` | 23 entri | Boleh dibiarkan — Google mengabaikannya, tidak ada risiko |

Catatan akurasi yang menentukan bobot fase ini: untuk query brand, Google mencocokkan **entitas**, bukan string literal. Kata "Parung" di tengah frasa tidak mencegah kecocokan dengan `grand duta city south of jakarta`. Jadi masalah sebenarnya bukan homepage kurang exact-match, melainkan halaman lain punya exact-match yang lebih bersih. Itu sudah diselesaikan Fase 1 + Fase 5 (`alternateName`). Fase 8 bersifat marginal, dan itulah alasan ia boleh dilewati bila Fase 1 sudah memberi hasil.

Rollback: patch terpisah `snapshots/homepage-metadata-baseline.patch`.

## Fase 9 — pSEO gelombang 2 & 3 (bergantung hasil)

Gate: indexation rate Fase 7 ≥80% di Search Console.

**Gelombang 2 (5 halaman):** 4 bracket harga dihitung dari nilai `kpr` sebenarnya + 1 perbandingan internal.

| URL | Rentang | Unit yang memenuhi |
|---|---|---|
| `/rumah-700-800-juta-parung` | ≤ 800 jt | Verona hook (764,9 jt), Verona (800 jt), T-39 (773–790 jt) |
| `/rumah-800-juta-1-miliar-parung` | 800 jt–1,05 M | Aira T-42 (907 jt), T-47 (844–869 jt), Malta ×4 (971 jt–1,021 M), Manoa T-58 (1,039 M) |
| `/rumah-1-13-miliar-parung` | 1,05–1,35 M | Victoria T-69 (1,273–1,295 M), Tuscan ×3 (1,282–1,324 M) |
| `/rumah-13-19-miliar-parung` | 1,35–1,9 M | T-62 HK (1,385 M), Alexandra T-88 ×4 (1,547–1,881 M) |
| `/cluster-ladera-vs-cascada` | — | Perbandingan internal, data 100% proprietary |

**Gelombang 3 (12 halaman, bersyarat data):** 4 persona + 8 proximity.

Proximity hanya untuk POI ≤20 menit: RS Dompet Dhuafa (5), SMA Dwiwarna (5), Exit Tol Sawangan/Krukut/Pamulang/Bojong Gede (15), The Park Sawangan (20), CBD TB Simatupang (20).

**Syarat mutlak sebelum dibangun** — bila tidak dipenuhi, halaman tidak dibuat karena akan menjadi doorway page:
- jarak km + rute nyata per POI (data sekarang hanya waktu tempuh, tanpa km, tanpa koordinat)
- rekomendasi unit spesifik per profil komuter
- narasi perjalanan yang benar-benar berbeda, bukan nama POI yang ditukar
- peta rute per halaman, bukan peta lokasi yang sama 8×

Playbook Glossary **dibatalkan**: 12 halaman "apa itu X" pada otoritas domain saat ini = 12 halaman tipis. Diganti satu pillar `/istilah-kpr-properti` yang menyerap `NOTES`, `PAYMENT_METHODS`, `GOVERNMENT_PROMOS`, `INCLUSIONS`.

**Plafon keras ~35 halaman.** 10 (F7) + 5 (W2) + 12 (W3) + 1 pillar = 28. Sisa ruang sangat sedikit. Melewati 35, playbook Locations berbalik dari aset jadi liabilitas.

## Fase 10 — Non-teknis (paralel, tanpa gate)

- Google Business Profile + konsistensi NAP dengan schema (Jl. Raya Parung No.47, -6.462459/106.729392). Untuk marketing gallery properti, local pack sering sumber klik WhatsApp terbesar dan tidak dipengaruhi schema situs.
- Lead form yang benar-benar menyimpan data (`contact-form.tsx` sekarang hanya redirect WhatsApp).
- Verifikasi Core Web Vitals manual di pagespeed.web.dev + laporan CWV Search Console. **Belum terverifikasi** dalam audit ini (PSI API 429).
- Parent nav crawlable: `header-2.tsx:29,38,47` ubah `<button href="#">` → `<Link>` ke hub nyata.
- 8–10 artikel non-brand komersial: `rumah dijual parung bogor`, `perumahan dekat exit tol desari`, `rumah 700 juta dekat jakarta selatan`, `KPR tanpa DP bogor syarat`, `perumahan parung vs sawangan`, `rumah dekat stasiun bojong gede`, `biaya hidup tinggal di parung`.
- Bersihkan dead code `src/components/layout/header.tsx`.

## Realitas target (konteks pengambilan keputusan)

10 chat/hari = ~300 chat/bulan. Volume pencarian brand `grand duta city parung` + varian realistis hanya ratusan per bulan. Bahkan di posisi #1 dengan CTR ~40%, kata kunci brand saja **tidak mungkin** menghasilkan 300 chat/bulan.

| Sumber | Perkiraan kontribusi | Ditangani fase |
|---|---|---|
| Query brand di 3 besar | 15–25% | 1, 5, 8 |
| Query non-brand + 28 halaman pSEO | 40–50% | 7, 9, 10 |
| Google Business Profile / local pack | 25–35% | 10 — **belum tersentuh** |
| Iklan berbayar | sisanya | di luar cakupan |

Estimasi jujur: 2 closing/bulan dari organik wajar dan bisa dicapai, lewat ~60–120 chat berkualitas/bulan, bukan 300. Bila 300 chat/bulan jadi KPI keras, itu butuh bauran organik + GBP + berbayar. Disarankan KPI organik dipisah sebagai *chat dari organic search*.

## Strategi verifikasi

| Lapisan | Alat | Kapan |
|---|---|---|
| Invarian metadata | `npm run test` (guard test 12 asersi) | Setiap commit |
| Lint + type | `npm run lint`, `npm run build` | Setiap commit |
| Diff live vs baseline | `node scripts/seo-snapshot.mjs` + `seo-verify.mjs` | Sesudah setiap deploy |
| Validitas schema | Rich Results Test + Schema Validator (JS dirender — `web_fetch`/`curl` tidak bisa melihat JSON-LD) | Fase 5, 7 |
| Indeksasi | Search Console, Pages report per sitemap | Mingguan selama jendela observasi |
| Peringkat 2 kata kunci target | Search Console Performance, filter query | Mingguan |
| Konversi | GA4 event `whatsapp_click` per halaman | Harian setelah Fase 2 |

## Yang harus disediakan pemilik

1. ~~Konfirmasi daftar 18 slug untuk `noindex`~~ — ditunda ke spec terpisah, tidak diperlukan untuk spec ini.
2. Keputusan redirect vs retitle untuk `cluster-rumah-baru-di-parung-bogor` dan `perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap`.
3. Rekonsiliasi 6 fakta di tabel Fase 3.
4. Aset yang belum ada: denah 6 tipe, jumlah lantai per tipe, status stok per tipe, jarak km ke 8 POI.
5. Akses Search Console — tanpa ini peringkat, query, dan indexation rate tidak dapat diverifikasi, hanya disimpulkan dari kode.
