-- =============================================================================
-- 0002_unit_content.sql — konten halaman tipe rumah yang bisa diedit dari admin
-- =============================================================================
--
-- Dijalankan oleh `npm run migrate` (scripts/db-migrate.cjs).
--
-- TUJUAN
--   Memindahkan konten halaman /tipe-rumah/<slug> (galeri foto, embed video,
--   deskripsi, harga tampil, aksesibilitas) dari literal di kode ke database,
--   supaya pemilik bisa memperbaruinya dari /admin tanpa deploy.
--
-- HUBUNGAN DENGAN src/data/units.ts DAN src/data/unit-content.ts
--   Kedua berkas itu TETAP menjadi DEFAULT. Tabel ini hanya menyimpan
--   PENIMPAAN (override) per unit, dan kolomnya boleh NULL berarti "pakai
--   default dari kode". Konsekuensi yang disengaja:
--     * situs tetap tayang utuh saat tabel ini kosong,
--     * `next build` tidak bergantung pada database,
--     * menghapus satu baris di sini = kembali ke nilai default, bukan halaman
--       kosong.
--
--   `unit_id` SENGAJA bukan foreign key: daftar unit hidup di kode
--   (src/data/units.ts), bukan di database. Menjadikannya FK ke tabel yang
--   tidak ada hanya akan memindahkan sumber kebenaran ke tempat yang salah.
--
-- ATURAN (R1 — integritas data), sama dengan 0001:
--   * HANYA operasi aditif. Tidak ada DROP/UPDATE/DELETE.
--   * SEMUA statement IDEMPOTEN — aman dijalankan berulang (`--force`).
-- =============================================================================

CREATE TABLE IF NOT EXISTS "unit_content" (
  "id" serial PRIMARY KEY NOT NULL,

  -- Slug unit dari src/data/units.ts, mis. "verona-39". Unik: satu baris per unit.
  "unit_id" varchar NOT NULL,

  -- Penimpaan teks & harga. NULL = pakai default dari kode.
  "price_label" varchar,
  "facade_image" varchar,
  "floor_plan_image" varchar,

  -- jsonb, semuanya NULL-able dengan makna "belum ditimpa":
  --   overview     : array string (paragraf deskripsi)
  --   highlights   : array string (keunggulan tipe)
  --   suited_for   : array string (cocok untuk siapa)
  --   gallery      : array objek { url, alt, caption? }
  --   access_items : array objek { label, value } (waktu tempuh & akses)
  "overview" jsonb,
  "highlights" jsonb,
  "suited_for" jsonb,
  "gallery" jsonb,
  "access_items" jsonb,

  -- Embed video. `video_url` menerima mp4 Cloudinary maupun URL YouTube.
  "video_url" varchar,
  "video_poster" varchar,
  "video_title" varchar,

  -- false = simpan sebagai draf; halaman publik tetap memakai default kode.
  -- Memberi pemilik ruang menyiapkan konten tanpa langsung menayangkannya.
  "is_published" boolean DEFAULT true NOT NULL,

  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

-- Satu baris per unit. Dipakai juga oleh `ON CONFLICT ("unit_id")` pada upsert.
CREATE UNIQUE INDEX IF NOT EXISTS "unit_content_unit_id_idx"
  ON "unit_content" USING btree ("unit_id");

-- Urutan "terakhir diubah" di daftar admin.
CREATE INDEX IF NOT EXISTS "unit_content_updated_at_idx"
  ON "unit_content" USING btree ("updated_at");
