-- ============================================================================
-- Migrasi AI Content Studio + Konfigurasi AI — untuk dijalankan MANUAL di
-- Supabase SQL Editor (Dashboard > SQL Editor > New query > tempel > Run).
--
-- Setara dengan menjalankan dua file migrasi Payload:
--   1) 20260825_040000_add_ai_studio_fields
--   2) 20260825_050000_add_ai_providers
--
-- SIFAT: 100% aditif & idempoten. Hanya menambah kolom nullable / tabel / enum
-- baru dengan IF NOT EXISTS. TIDAK menghapus atau mengubah data lama. Aman
-- dijalankan ulang (menjalankan dua kali tidak merusak apa pun).
--
-- Dibungkus satu transaksi: kalau ada bagian gagal, semua di-rollback otomatis.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- BAGIAN 1 — AI Content Studio: kolom aiTopic/aiOutline + sumber media
-- ----------------------------------------------------------------------------

-- enum untuk Media.source (upload/unsplash/pexels)
DO $$ BEGIN
  CREATE TYPE "public"."enum_media_source" AS ENUM('upload', 'unsplash', 'pexels');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Artikel: jejak audit AI (tabel utama)
ALTER TABLE "artikel" ADD COLUMN IF NOT EXISTS "ai_topic" varchar;
ALTER TABLE "artikel" ADD COLUMN IF NOT EXISTS "ai_outline" jsonb;

-- Artikel versions (drafts/autosave)
ALTER TABLE "_artikel_v" ADD COLUMN IF NOT EXISTS "version_ai_topic" varchar;
ALTER TABLE "_artikel_v" ADD COLUMN IF NOT EXISTS "version_ai_outline" jsonb;

-- Media: sumber + atribusi lisensi foto stok
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "source" "enum_media_source" DEFAULT 'upload';
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "source_id" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "attribution_url" varchar;

-- ----------------------------------------------------------------------------
-- BAGIAN 2 — Konfigurasi AI: tabel ai_providers + relasi locked-documents
-- ----------------------------------------------------------------------------

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

-- Kolom relasi agar dokumen ai_providers bisa dikunci (locking) admin Payload
ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ai_providers_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_providers_fk"
    FOREIGN KEY ("ai_providers_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_ai_providers_id_idx"
  ON "payload_locked_documents_rels" USING btree ("ai_providers_id");

-- ----------------------------------------------------------------------------
-- BAGIAN 3 — Catat kedua migrasi ke payload_migrations agar Payload sinkron.
-- Batch = (batch tertinggi saat ini) + 1. INSERT hanya bila belum tercatat,
-- jadi aman dijalankan ulang.
-- ----------------------------------------------------------------------------

INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT v.name,
       (SELECT COALESCE(MAX(batch), 0) + 1 FROM "payload_migrations" WHERE batch <> -1),
       now(),
       now()
FROM (VALUES
  ('20260825_040000_add_ai_studio_fields'),
  ('20260825_050000_add_ai_providers')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" pm WHERE pm.name = v.name
);

COMMIT;

-- ============================================================================
-- VERIFIKASI (opsional — jalankan terpisah setelah COMMIT untuk cek hasil):
--
-- SELECT name, batch FROM payload_migrations ORDER BY id;
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='artikel' AND column_name IN ('ai_topic','ai_outline');
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='media' AND column_name IN ('source','source_id','attribution_url');
-- SELECT to_regclass('public.ai_providers') AS ai_providers_table;
-- ============================================================================
