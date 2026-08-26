# Requirements — Migrasi Payload CMS → Custom CMS (Hybrid)

## Pendahuluan

Project ini memiliki dua CMS yang hidup berdampingan di atas database Postgres yang sama:
- **Payload CMS** (panel `/admin`) — masih dipakai untuk mengelola kategori/tag dan sebagai runtime pembaca artikel di sisi publik.
- **Custom CMS v2** (panel `/v2-admin`) — sudah berfungsi untuk artikel, media, AI Studio, dan provider AI, memakai Drizzle langsung ke tabel yang sama.

Tujuan migrasi: **melepas Payload sepenuhnya tanpa kehilangan satu data pun**, dengan satu panel admin final di `/admin`, sekaligus memperkuat produktivitas AI untuk generate dan posting artikel.

## Keputusan arsitektur (dikonfirmasi pemilik)

1. **Hybrid** — pertahankan Drizzle + Lexical + auth existing (PBKDF2 kompatibel Payload + session HMAC). Dokumen `custom_admin_dashboard_architecture` dipakai sebagai daftar fitur target, BUKAN spesifikasi teknis yang disalin (dokumen itu memakai Prisma/NextAuth/TipTap/cuid untuk project lain).
2. **Halaman statis tetap kode** — semua halaman kustom (cluster, pricelist, kontak, galeri, dll.) tetap komponen React, tidak dijadikan DB-driven.
3. **Tanpa versi artikel** — tabel `_artikel_v`/`_artikel_v_rels` boleh di-drop setelah backup di fase akhir.
4. **Satu panel admin** — kondisi final hanya `/admin` yang bisa diakses; panel Payload lama dihapus.
5. **Nol URL mati** — setiap slug artikel dan setiap route statis harus tetap 200; redirect lama dipertahankan.

## Kondisi awal terverifikasi

- Skema DB nyata (sumber: `src/migrations/**`): tabel `artikel`, `artikel_rels`, `_artikel_v`, `_artikel_v_rels`, `media`, `categories`, `tags`, `users`, `users_sessions`, `ai_providers`, `payload_*`. Konten artikel = Lexical JSON di `artikel.content`. Kategori/tag/relatedArtikel via tabel polimorfik `artikel_rels` (kolom `path`).
- Drift: `src/db/schema.ts` masih mendeklarasikan kolom `artikel.kategori` + enum terkait yang SUDAH di-drop migrasi `20260417_133623`.
- `lexical`, `@lexical/*`, `cloudinary` masuk transitif via paket Payload — bukan dependency langsung.
- Sisi publik (`(site)/artikel`, `(site)/[slug]`, `sitemap.ts`) masih memanggil `getPayload()` runtime.
- Taksonomi presentasional (metaTitle/intro/CTA per kategori, 13 tag, bio author) + 4 artikel arsip hidup sebagai kode di `src/lib/articles.ts`, digabung union-by-slug dengan artikel DB.
- 5 slug arsip (`cara-beli-kpr`, `cluster-cascada`, `cluster-ladera`, `lokasi-akses-...`, `update-stok-siteplan-...`) adalah route statis nyata; hanya `10-ciri-agen-properti-terbaik` yang murni artikel DB via `[slug]`.

## Requirements

### R1 — Integritas data
- WHEN perubahan apa pun diterapkan THEN tidak ada baris data existing yang hilang atau berubah tak sengaja.
- WHEN skema diubah THEN HANYA lewat migrasi SQL aditif eksplisit; DILARANG `drizzle-kit push` ke produksi.
- WHEN fase selesai THEN row count per tabel sesuai baseline (kecuali penambahan yang disengaja).

### R2 — Nol URL mati (SEO preservation)
- WHEN sisi publik diport ke Drizzle THEN output HTML artikel, `sitemap.xml`, dan JSON-LD identik dengan baseline.
- WHEN Payload dilepas THEN setiap slug artikel DB dan setiap route statis tetap merespons 200.
- WHEN panel di-rename THEN seluruh `redirects()` existing dipertahankan.

### R3 — Satu panel admin
- WHEN migrasi selesai THEN hanya `/admin` (custom) yang dapat diakses; panel Payload dihapus.
- WHEN pengguna membuka `/v2-admin/*` THEN diarahkan permanen ke `/admin/*`.

### R4 — Kelola konten mandiri
- WHEN editor bekerja harian THEN kategori, tag, dan media dapat dikelola penuh tanpa membuka Payload.
- WHEN artikel dibuat/diubah THEN invarian warisan hook Payload dijaga: sinkron `status`/`_status`, CTA idempoten, auto-slug, auto featured image, auto `publishedAt`.

### R5 — Keamanan
- WHEN endpoint mutasi dipanggil THEN wajib lolos guard auth + CSRF + rate limit.
- WHEN kredensial AI disimpan THEN tetap terenkripsi AES-256-GCM; plaintext tak pernah ke client.
- WHEN sisi publik dirender THEN tidak ada XSS (reuse pola sanitasi yang sudah ada).

### R6 — Produktivitas AI
- WHEN pengguna memakai AI THEN tersedia generate judul/outline/artikel/SEO (existing) plus rewrite/expand/shorten/proofread.
- WHEN agent eksternal memposting THEN via agent API token (hash SHA-256, scope, expiry, revoke) tanpa sesi browser.
- WHEN artikel dijadwalkan THEN cron mempublish otomatis dengan pola CAS anti dobel-publish.

### R7 — Verifikasi berlapis
- WHEN fase ditutup THEN `npm run lint && npm run test && npm run build` hijau.
- WHEN Payload dilepas THEN `getPayload` nol referensi di luar folder yang dihapus.
