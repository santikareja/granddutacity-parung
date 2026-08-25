import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// AI Content Studio — hanya penambahan kolom nullable + enum baru (aditif, aman).
// Artikel & media lama tidak tersentuh; tidak ada operasi destruktif di `up`.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_media_source" AS ENUM('upload', 'unsplash', 'pexels');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "artikel" ADD COLUMN IF NOT EXISTS "ai_topic" varchar;
    ALTER TABLE "artikel" ADD COLUMN IF NOT EXISTS "ai_outline" jsonb;

    ALTER TABLE "_artikel_v" ADD COLUMN IF NOT EXISTS "version_ai_topic" varchar;
    ALTER TABLE "_artikel_v" ADD COLUMN IF NOT EXISTS "version_ai_outline" jsonb;

    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "source" "enum_media_source" DEFAULT 'upload';
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "source_id" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "attribution_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "artikel" DROP COLUMN IF EXISTS "ai_topic";
    ALTER TABLE "artikel" DROP COLUMN IF EXISTS "ai_outline";

    ALTER TABLE "_artikel_v" DROP COLUMN IF EXISTS "version_ai_topic";
    ALTER TABLE "_artikel_v" DROP COLUMN IF EXISTS "version_ai_outline";

    ALTER TABLE "media" DROP COLUMN IF EXISTS "source";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "source_id";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "attribution_url";

    DROP TYPE IF EXISTS "public"."enum_media_source";
  `)
}
