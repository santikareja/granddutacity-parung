-- ###########################################################################
-- ##                                                                       ##
-- ##   DESTRUKTIF — JANGAN DIJALANKAN OTOMATIS. MANUAL SAJA.               ##
-- ##                                                                       ##
-- ###########################################################################
--
-- Skrip ini MENGHAPUS TABEL beserta SELURUH ISINYA. Tidak ada jalan kembali
-- tanpa backup. Skrip ini SENGAJA diletakkan di `src/db/sql/optional/` supaya
-- TIDAK ikut dieksekusi oleh `scripts/db-migrate.cjs` (runner hanya membaca
-- file `*.sql` langsung di dalam `src/db/sql/`, non-rekursif, dan hanya entri
-- yang benar-benar file).
--
-- STATUS SAAT INI (Task 12B-2): Payload CMS sudah DICABUT dari kode
-- (panel, collections, config, dan REST /api/[...slug] sudah dihapus), namun
-- tabel di bawah DIBIARKAN UTUH di database sesuai aturan R1 (integritas data).
-- Aplikasi TIDAK lagi membaca/menulis tabel-tabel ini.
--
-- PRASYARAT SEBELUM MENJALANKAN (semua wajib):
--   1. Backup penuh sudah dibuat DAN sudah diuji restore-nya, mis.:
--        pg_dump --format=custom --no-owner --file=backup-pre-drop.dump "$DATABASE_URI"
--   2. Sudah dipastikan tidak ada lagi kebutuhan pada riwayat versi artikel
--      (`_artikel_v*`) — Custom CMS v2 TIDAK memakai versioning.
--   3. Panel /admin (Custom CMS) sudah berjalan normal minimal beberapa hari:
--      login, CRUD artikel/kategori/tag/media, AI Studio, cron publish.
--   4. Row count tabel yang MASIH DIPAKAI (`artikel`, `artikel_rels`, `media`,
--      `categories`, `tags`, `users`, `ai_providers`, `site_settings`, dst.)
--      sudah dicocokkan dengan baseline.
--
-- CARA MENJALANKAN (manual, sadar risiko):
--   psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f src/db/sql/optional/9001_drop_payload_tables.sql
--
-- CATATAN `users_sessions`: tabel ini milik mekanisme sesi Payload. Custom CMS v2
-- memakai cookie stateless bertanda tangan HMAC (src/lib/v2-auth/auth.ts),
-- jadi menghapusnya TIDAK memutus sesi admin yang sedang aktif. Tabel `users`
-- sendiri TETAP DIPAKAI (login) — JANGAN pernah menghapus `users`.
--
-- Semua DROP di bawah memakai IF EXISTS + CASCADE dan dibungkus satu transaksi,
-- sehingga kegagalan di tengah tidak meninggalkan skema setengah jadi.

BEGIN;

-- Versioning artikel (tidak dipakai Custom CMS v2). Child dulu, lalu parent.
DROP TABLE IF EXISTS "_artikel_v_rels" CASCADE;
DROP TABLE IF EXISTS "_artikel_v" CASCADE;

-- Tabel internal Payload.
DROP TABLE IF EXISTS "payload_locked_documents_rels" CASCADE;
DROP TABLE IF EXISTS "payload_locked_documents" CASCADE;
DROP TABLE IF EXISTS "payload_preferences_rels" CASCADE;
DROP TABLE IF EXISTS "payload_preferences" CASCADE;
DROP TABLE IF EXISTS "payload_migrations" CASCADE;
DROP TABLE IF EXISTS "payload_kv" CASCADE;

-- Sesi bawaan Payload (Custom CMS v2 memakai cookie stateless).
DROP TABLE IF EXISTS "users_sessions" CASCADE;

COMMIT;

-- Setelah COMMIT, opsional: rapikan ruang & statistik.
--   VACUUM (ANALYZE);
