# Design — Migrasi Payload CMS → Custom CMS (Hybrid)

## Strategi umum

Migrasi bertahap dengan Payload dan custom CMS hidup berdampingan sampai sisi publik terbukti lepas dari Payload. Data layer (Drizzle + tabel existing) dan editor (Lexical) tidak diganti. Payload baru dilepas di fase akhir setelah verifikasi.

Urutan diatur agar tiap fase adalah increment yang bisa didemokan dan tidak merusak yang berjalan:
1. Fondasi & pengaman (Task 1-2) — tak ada perubahan fungsional publik.
2. Menutup ketergantungan Payload untuk kerja harian (Task 3-5).
3. Melepas Payload dari runtime publik (Task 6) — gerbang SEO.
4. Fitur DB-driven & workflow (Task 7-8).
5. Produktivitas AI (Task 9-10).
6. Observability (Task 11).
7. Pelepasan Payload + satu panel (Task 12).

## Keputusan desain kunci

### Data & skema
- Semua migrasi aditif (`ADD COLUMN`, `CREATE TABLE IF NOT EXISTS`, `ALTER TYPE ADD VALUE`). Tidak ada `DROP` destruktif sampai Task 12 (setelah backup).
- `src/db/schema.ts` dibersihkan dari drift (`kategori`, enum kategori, index `*_drizzle`).
- Tabel baru: `site_settings`, `ai_role_models`, `agent_api_tokens`, `ai_tasks`. Kolom baru di `media` (`cloudinary_public_id`), `artikel` (`scheduled_at`, `reading_time`, `author_id` opsional).

### Auth & keamanan
- Pertahankan PBKDF2(25000,512,sha256) + session cookie HMAC. Tidak pindah bcrypt/NextAuth (menghindari reset password massal).
- CSRF: `HMAC-SHA256(APP_SECRET, userId)` header `x-csrf-token`, verifikasi origin + timing-safe. Diterapkan di guard mutasi.
- Rate limiter bersama (in-memory per instance, cukup sebagai lapis pertama).
- Sanitasi HTML AI: reuse `sanitizeAiHtml` (dari fix XSS sebelumnya).

### Editor
- Lexical dipertahankan; format `artikel.content` tak berubah agar 30+ artikel lama tetap terbuka.
- Dependency Lexical/Cloudinary dipin eksplisit sebelum Payload dicabut.

### Sisi publik
- `src/lib/public/queries.ts` (Drizzle) menggantikan `getPayload()`. Join `artikel_rels` (path kategori/tags) + `media`.
- Tipe domain `src/types/content.ts` menggantikan `@/payload-types` di komponen frontend.
- Union-by-slug dengan `articleArchiveEntries` dipertahankan; 5 slug statis tetap menang via route statis Next.js.

### Satu panel & anti-404
- `/v2-admin` → `/admin` via rename + `redirects()` permanen `/v2-admin/:path* → /admin/:path*`.
- Snapshot fixture (HTML artikel, sitemap, JSON-LD) jadi kontrak; Task 6 & 12 wajib mempertahankannya identik.
- Semua `redirects()` existing (wp-admin, tag lama, dll.) tidak disentuh.

## Correctness properties
- P1 (Preservation SEO): untuk semua slug published, output render Drizzle == output render Payload (byte-identik pada fixture).
- P2 (Integritas relasi): kategori/tag tiap artikel setelah migrasi == sebelum.
- P3 (Keamanan): semua endpoint mutasi menolak request tanpa auth/CSRF; kredensial AI tak pernah plaintext ke client.
- P4 (Idempotensi tulis): createArticle/updateArticle menjaga status/_status sinkron dan CTA tidak dobel.

## Testing strategy
- Snapshot test sisi publik (fixture Task 1) sebagai gerbang Task 6 & 12.
- Integrasi CRUD taksonomi/media dengan guard.
- Unit CAS scheduled publish (dua run paralel tak dobel).
- Reuse suite Vitest existing untuk AI (sanitasi).
- Verifikasi akhir: `getPayload` grep nol di luar folder yang dihapus.

## Risiko & mitigasi
- Rotasi `PAYLOAD_SECRET` merusak dekripsi API key AI → jangan rotasi nilai; hanya rename env dengan pembacaan ganda.
- Hapus Payload sebelum publik diport → dilarang; Task 12 bergantung pada Task 6 lulus.
- Drift schema menyebabkan query error → dibereskan Task 1 sebelum apa pun.
