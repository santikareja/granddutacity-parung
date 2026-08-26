# Rencana Implementasi — Migrasi Payload → Custom CMS

- [x] 1. Fondasi keamanan & jaring pengaman data
  - Script `scripts/db-baseline.ts`: catat row count per tabel (baseline verifikasi integritas).
  - Buat fixture snapshot output publik: HTML render 1 artikel DB, `sitemap.xml`, JSON-LD.
  - Bersihkan drift `src/db/schema.ts`: hapus kolom `kategori`, `artikelKategoriEnum`, `artikelVersionKategoriEnum`, index `*_drizzle` yang tak dimigrasi.
  - Pin dependency langsung: `lexical`, `@lexical/react|rich-text|list|link|utils|selection`, `cloudinary` (versi = terpasang transitif). Tambah `zod`.
  - _Requirements: R1, R2, R7_

- [x] 2. CSRF, admin API client, rate limiter, perbaikan redirect loop login
  - `src/lib/v2-admin/csrf.ts` + `GET /api/v2/csrf`; verifikasi di guard mutasi.
  - `src/lib/v2-admin/api-client.ts` (auto CSRF, timeout, retry GET 1x, error terstruktur).
  - Rate limiter bersama (ganti ad-hoc di login).
  - Pindahkan `/v2-admin/login` keluar subtree layout ber-guard (route group).
  - _Requirements: R5_

- [x] 3. CRUD Kategori & Tag
  - API `categories` + `tags` (list/create/update/delete, auto-slug, hitung pemakaian, tolak delete jika terpakai). Mutasi admin-only.
  - Halaman `/v2-admin/categories` dan `/v2-admin/tags` (CRUD inline).
  - _Requirements: R4, R5_

- [x] 4. Media lengkap + featured image picker
  - Migrasi aditif `media.cloudinary_public_id` + backfill dari URL.
  - Edit alt/caption/name; delete DB + aset Cloudinary; pagination + search server-side.
  - Featured image picker di form artikel (reuse MediaPickerDialog).
  - _Requirements: R1, R4_

- [x] 5. Akun & manajemen user
  - Ganti password sendiri (pakai `createPasswordHash`); list/buat user admin-only; cegah eskalasi role.
  - _Requirements: R4, R5_

- [x] 6. Port sisi publik ke Drizzle (gerbang SEO)
  - `src/lib/public/queries.ts` (Drizzle) menggantikan getPayload di `(site)/artikel`, `(site)/[slug]`, `sitemap.ts`, category/tag/author.
  - `src/types/content.ts` lepas dari `@/payload-types` di komponen frontend.
  - Snapshot Task 1 harus identik byte-per-byte; semua slug DB + 5 slug statis tetap 200.
  - _Requirements: R2, R5, R7_

- [x] 7. Settings DB-driven
  - Migrasi tabel `site_settings`; `src/lib/settings.ts` (unstable_cache + revalidateTag); UI settings (umum, kontak/WA, SEO default, sosial); seed dari nilai existing.
  - _Requirements: R4_

- [x] 8. Workflow publishing + penjadwalan
  - Migrasi aditif `scheduled_at`, `reading_time`, `ALTER TYPE enum_artikel_status ADD VALUE 'scheduled'`.
  - Validasi publish (judul ≥10, konten ≥120 kata, excerpt/metaDesc, kategori, featured image). Reading time otomatis.
  - Cron `POST /api/v2/cron/publish-scheduled` (secret header, CAS anti dobel, backoff 1 jam) + `vercel.json`. UI penjadwalan.
  - _Requirements: R6_

- [x] 9. AI role model per tugas + agent API token
  - Tabel `ai_role_models` (text/image/scanning, terenkripsi). Tabel `agent_api_tokens` (SHA-256, scopes, expiry, revoke) + `POST /api/agent/articles`. UI kelola token.
  - _Requirements: R6, R5_

- [x] 10. AI editor tools + AI Studio v2
  - Rewrite/expand/shorten/proofread teks terpilih; AI Studio kirim provider/model per request, tambah section outline, sisip gambar + SEO inline. Log `ai_tasks`.
  - _Requirements: R6, R5_

- [x] 11. Observability & audit
  - `logAdminInfo/Warn/Error` (requestId/action/userId/status); dashboard monitoring 24 jam; audit trail perubahan artikel.
  - _Requirements: R7_

- [x] 12. Satu panel — lepas Payload + rename ke /admin
  - Backup DB. Hapus `(payload)/`, `collections/`, `payload.config.*`, `scripts/payload-cli.cjs`, `payload/`, modul AI generasi lama. Hapus dependency `payload`/`@payloadcms/*`/`payload-storage-cloudinary`.
  - Rename `/v2-admin` → `/admin` + redirect permanen. Rename env `PAYLOAD_SECRET` → `APP_SECRET` (pembacaan ganda, jangan rotasi nilai). Drop `_artikel_v`/`payload_*` setelah backup.
  - Snapshot publik tetap identik; `/admin` satu-satunya panel; semua URL 200.
  - _Requirements: R1, R2, R3, R7_
