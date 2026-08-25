import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Konfigurasi AI di dashboard: tabel ai-providers (baseUrl, apiKey terenkripsi,
// models jsonb array string, availableModels jsonb, defaultModel, isDefault) +
// relasi locked-documents. Aditif; tidak menyentuh data lama.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ai_providers_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_providers_fk"
        FOREIGN KEY ("ai_providers_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_ai_providers_id_idx"
      ON "payload_locked_documents_rels" USING btree ("ai_providers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ai_providers_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_ai_providers_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "ai_providers_id";

    DROP TABLE IF EXISTS "ai_providers" CASCADE;
  `)
}
