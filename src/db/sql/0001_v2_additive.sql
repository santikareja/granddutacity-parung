-- =============================================================================
-- 0001_v2_additive.sql — konsolidasi migrasi ADITIF untuk Custom CMS v2
-- =============================================================================
--
-- Dijalankan oleh `npm run migrate` (scripts/db-migrate.cjs), TANPA Payload.
-- Menggantikan jalur `payload migrate` untuk migrasi-migrasi v2 di bawah ini.
--
-- CAKUPAN (gabungan dari src/migrations/*.ts berikut):
--   20260825_040000_add_ai_studio_fields    -> enum enum_media_source, artikel.ai_topic/ai_outline,
--                                              _artikel_v.version_ai_topic/version_ai_outline,
--                                              media.source/source_id/attribution_url
--   20260825_050000_add_ai_providers        -> tabel ai_providers + index (+ kolom relasi Payload, opsional)
--   20260826_090000_add_media_public_id     -> media.cloudinary_public_id
--   20260826_100000_add_site_settings       -> tabel site_settings + index + seed
--   20260826_110000_add_article_scheduling  -> artikel.reading_time
--   20260826_120000_add_ai_role_models      -> tabel ai_role_models + unique index
--   20260826_130000_add_agent_api_tokens    -> tabel agent_api_tokens + unique index
--   20260826_140000_add_ai_tasks            -> tabel ai_tasks + index
--   20260826_150000_add_admin_audit_log     -> tabel admin_audit_log + index
--
-- SENGAJA TIDAK DICAKUP (JANGAN pernah ditambahkan ke file ini):
--   20260414_204941_init                    -> membuat seluruh skema awal; SUDAH pasti diterapkan
--                                              di DB produksi (situs berjalan). Berisi DROP/CREATE
--                                              destruktif bila diulang.
--   20260417_133623_add_categories_media_meta -> mengandung operasi destruktif (DROP COLUMN
--                                              artikel.kategori + DROP TYPE enum terkait); SUDAH
--                                              diterapkan. Mengulangnya tidak boleh.
--   20260419_101500 / 20260419_101501       -> SEED + fix satu artikel ("10-ciri-agen-properti-terbaik").
--                                              Data konten, bukan skema. Mengulangnya berisiko
--                                              menimpa/menduplikasi konten yang sudah diedit editor.
--
-- ATURAN (R1 — integritas data):
--   * HANYA operasi aditif. Tidak ada DROP TABLE/COLUMN/TYPE, tidak ada UPDATE/DELETE data.
--   * SEMUA statement IDEMPOTEN: aman dijalankan berulang, aman bila sebagian objek sudah ada.
--     - tabel  : CREATE TABLE IF NOT EXISTS
--     - kolom  : ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--     - index  : CREATE [UNIQUE] INDEX IF NOT EXISTS
--     - tipe   : DO-block + EXCEPTION WHEN duplicate_object
--     - constraint : DO-block + EXCEPTION WHEN duplicate_object
--     - seed   : INSERT ... ON CONFLICT DO NOTHING
--   * Statement yang menyentuh tabel milik Payload (`payload_locked_documents_rels`, `_artikel_v`)
--     dibungkus DO-block yang MENGABAIKAN `undefined_table`, karena tabel-tabel itu akan HILANG
--     setelah Payload dicabut (Task 12B). Dengan begitu file ini tetap bisa dijalankan ulang
--     (mis. `npm run migrate:force`) pada DB yang sudah bersih dari Payload.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) AI Content Studio — enum sumber media + kolom AI pada artikel & media
--    (asal: 20260825_040000_add_ai_studio_fields)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "public"."enum_media_source" AS ENUM('upload', 'unsplash', 'pexels');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "artikel" ADD COLUMN IF NOT EXISTS "ai_topic" varchar;
ALTER TABLE "artikel" ADD COLUMN IF NOT EXISTS "ai_outline" jsonb;

-- `_artikel_v` adalah tabel versi milik Payload; boleh di-drop di fase akhir.
-- Diabaikan bila tabelnya sudah tidak ada.
DO $$ BEGIN
  ALTER TABLE "_artikel_v" ADD COLUMN IF NOT EXISTS "version_ai_topic" varchar;
  ALTER TABLE "_artikel_v" ADD COLUMN IF NOT EXISTS "version_ai_outline" jsonb;
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "source" "enum_media_source" DEFAULT 'upload';
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "source_id" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "attribution_url" varchar;


-- -----------------------------------------------------------------------------
-- 2) Provider AI (baseUrl, apiKey terenkripsi AES-256-GCM, models, defaultModel)
--    (asal: 20260825_050000_add_ai_providers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ai_providers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "base_url" varchar NOT NULL,
  "api_key" varchar NOT NULL,
  "available_models" jsonb,
  "models" jsonb,
  "default_model" varchar,
  "is_default" boolean DEFAULT false,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ai_providers_updated_at_idx" ON "ai_providers" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "ai_providers_created_at_idx" ON "ai_providers" USING btree ("created_at");

-- Relasi ke tabel lock milik Payload. HANYA relevan selama Payload masih ada.
-- Tiap statement dibungkus DO-block terpisah agar kegagalan satu bagian
-- (mis. constraint sudah ada) tidak membatalkan bagian lainnya.
DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ai_providers_id" integer;
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_providers_fk"
    FOREIGN KEY ("ai_providers_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN undefined_column THEN null;
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_ai_providers_id_idx"
    ON "payload_locked_documents_rels" USING btree ("ai_providers_id");
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN undefined_column THEN null;
  WHEN duplicate_object THEN null;
END $$;


-- -----------------------------------------------------------------------------
-- 3) Cloudinary public_id pada media (agar aset bisa dihapus dari Cloudinary)
--    (asal: 20260826_090000_add_media_public_id)
-- -----------------------------------------------------------------------------
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "cloudinary_public_id" varchar;


-- -----------------------------------------------------------------------------
-- 4) Settings DB-driven (key/value + metadata) + seed nilai awal
--    (asal: 20260826_100000_add_site_settings)
--    Seed memakai ON CONFLICT ("key") DO NOTHING: tidak menimpa nilai yang
--    sudah diubah admin.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" varchar NOT NULL,
  "value" text,
  "type" varchar DEFAULT 'text' NOT NULL,
  "group" varchar DEFAULT 'general' NOT NULL,
  "label" varchar,
  "description" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_key_idx" ON "site_settings" USING btree ("key");
CREATE INDEX IF NOT EXISTS "site_settings_group_idx" ON "site_settings" USING btree ("group");

INSERT INTO "site_settings" ("key", "value", "type", "group", "label", "description") VALUES
  ('site_name', 'Grand Duta City Parung', 'text', 'general', 'Nama Situs', 'Nama situs yang tampil di header, footer, dan metadata.'),
  ('site_description', 'Hunian modern strategis di selatan Jakarta.', 'text', 'general', 'Deskripsi Situs', 'Deskripsi singkat situs untuk metadata dan pratinjau.'),
  ('site_url', 'https://granddutacitysouthofjakarta.com', 'url', 'general', 'URL Situs', 'Alamat kanonik situs (tanpa trailing slash).'),
  ('contact_email', 'contact@granddutacitysouthofjakarta.com', 'text', 'contact', 'Email Kontak', 'Alamat email utama untuk kontak.'),
  ('contact_whatsapp', '628131742034', 'text', 'contact', 'Nomor WhatsApp', 'Nomor WhatsApp (format internasional tanpa +).'),
  ('contact_address', 'Parung, Kabupaten Bogor, Jawa Barat', 'text', 'contact', 'Alamat', 'Alamat fisik yang ditampilkan pada situs.'),
  ('contact_work_hours', 'Setiap Hari: 09:00 - 18:00 WIB', 'text', 'contact', 'Jam Operasional', 'Jam operasional/kerja yang ditampilkan pada situs.'),
  ('social_instagram', 'https://www.instagram.com/granddutacityparungsoj/', 'url', 'social', 'Instagram', 'URL profil Instagram.'),
  ('social_youtube', 'https://www.youtube.com/@marketinggdcparung', 'url', 'social', 'YouTube', 'URL channel YouTube.'),
  ('seo_default_title', 'Grand Duta City Parung', 'text', 'seo', 'Judul SEO Default', 'Judul default untuk halaman tanpa judul SEO khusus.'),
  ('seo_default_description', 'Hunian modern strategis di selatan Jakarta.', 'text', 'seo', 'Deskripsi SEO Default', 'Meta description default untuk halaman tanpa deskripsi khusus.')
ON CONFLICT ("key") DO NOTHING;


-- -----------------------------------------------------------------------------
-- 5) Reading time (estimasi waktu baca artikel)
--    (asal: 20260826_110000_add_article_scheduling)
-- -----------------------------------------------------------------------------
ALTER TABLE "artikel" ADD COLUMN IF NOT EXISTS "reading_time" integer;


-- -----------------------------------------------------------------------------
-- 6) AI role model per tugas (text | image | scanning)
--    (asal: 20260826_120000_add_ai_role_models)
--    `api_key` = ciphertext AES-256-GCM. JANGAN plaintext.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ai_role_models" (
  "id" serial PRIMARY KEY NOT NULL,
  "role" varchar NOT NULL,
  "provider" varchar DEFAULT 'openai_compatible' NOT NULL,
  "api_key" varchar NOT NULL,
  "base_url" varchar,
  "model" varchar,
  "is_active" boolean DEFAULT true,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_role_models_role_idx" ON "ai_role_models" USING btree ("role");


-- -----------------------------------------------------------------------------
-- 7) Agent API token (hash SHA-256, scopes, expiry, revoke)
--    (asal: 20260826_130000_add_agent_api_tokens)
--    DB hanya menyimpan HASH; plaintext hanya tampil sekali saat pembuatan.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "agent_api_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "token_hash" varchar NOT NULL,
  "token_prefix" varchar NOT NULL,
  "scopes" jsonb,
  "is_active" boolean DEFAULT true,
  "last_used_at" timestamp(3) with time zone,
  "expires_at" timestamp(3) with time zone,
  "revoked_at" timestamp(3) with time zone,
  "created_by_id" integer,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_api_tokens_token_hash_idx" ON "agent_api_tokens" USING btree ("token_hash");


-- -----------------------------------------------------------------------------
-- 8) Log tugas AI (riwayat/audit AI Studio)
--    (asal: 20260826_140000_add_ai_tasks)
--    `input`/`output` jsonb ringkas — JANGAN pernah menyimpan API key.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ai_tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "type" varchar NOT NULL,
  "status" varchar DEFAULT 'completed' NOT NULL,
  "input" jsonb,
  "output" jsonb,
  "error" varchar,
  "user_id" integer,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ai_tasks_created_at_idx" ON "ai_tasks" USING btree ("created_at");


-- -----------------------------------------------------------------------------
-- 9) Audit trail perubahan konten admin
--    (asal: 20260826_150000_add_admin_audit_log)
--    `summary` jsonb ringkas — JANGAN simpan kredensial.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "admin_audit_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "action" varchar NOT NULL,
  "entity" varchar NOT NULL,
  "entity_id" integer,
  "user_id" integer,
  "user_email" varchar,
  "summary" jsonb,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "admin_audit_log_entity_entity_id_idx" ON "admin_audit_log" USING btree ("entity","entity_id");
CREATE INDEX IF NOT EXISTS "admin_audit_log_created_at_idx" ON "admin_audit_log" USING btree ("created_at");
