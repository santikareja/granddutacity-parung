import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    INSERT INTO "categories" ("name", "slug", "description")
    VALUES
      ('Panduan Properti', 'panduan-properti', 'Panduan untuk proses membeli rumah, KPR, dan keputusan properti.'),
      ('Kawasan', 'kawasan', 'Ulasan kawasan, akses, infrastruktur, dan fasilitas sekitar.'),
      ('Seputar GDC', 'seputar-gdc', 'Update resmi seputar Grand Duta City, cluster, dan fasilitas.')
    ;

    ALTER TABLE "artikel_rels" ADD COLUMN "categories_id" integer;
    ALTER TABLE "_artikel_v_rels" ADD COLUMN "categories_id" integer;
    ALTER TABLE "media" ADD COLUMN "name" varchar;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;

    UPDATE "media"
    SET "name" = COALESCE(NULLIF("filename", ''), 'Media #' || "id"::text)
    WHERE "name" IS NULL;

    INSERT INTO "artikel_rels" ("order", "parent_id", "path", "categories_id")
    SELECT
      1,
      "artikel"."id",
      'kategori',
      "categories"."id"
    FROM "artikel"
    INNER JOIN "categories" ON "categories"."slug" = "artikel"."kategori"::text
    WHERE "artikel"."kategori" IS NOT NULL;

    INSERT INTO "_artikel_v_rels" ("order", "parent_id", "path", "categories_id")
    SELECT
      1,
      "_artikel_v"."id",
      'kategori',
      "categories"."id"
    FROM "_artikel_v"
    INNER JOIN "categories" ON "categories"."slug" = "_artikel_v"."version_kategori"::text
    WHERE "_artikel_v"."version_kategori" IS NOT NULL;

    ALTER TABLE "media" ALTER COLUMN "name" SET NOT NULL;

    CREATE UNIQUE INDEX "categories_name_idx" ON "categories" USING btree ("name");
    CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
    CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
    CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
    ALTER TABLE "artikel_rels" ADD CONSTRAINT "artikel_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_artikel_v_rels" ADD CONSTRAINT "_artikel_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "artikel_rels_categories_id_idx" ON "artikel_rels" USING btree ("categories_id");
    CREATE INDEX "_artikel_v_rels_categories_id_idx" ON "_artikel_v_rels" USING btree ("categories_id");
    CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");

    ALTER TABLE "artikel" DROP COLUMN "kategori";
    ALTER TABLE "_artikel_v" DROP COLUMN "version_kategori";
    DROP TYPE "public"."enum_artikel_kategori";
    DROP TYPE "public"."enum__artikel_v_version_kategori";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_artikel_kategori" AS ENUM('panduan-properti', 'kawasan', 'seputar-gdc');
    CREATE TYPE "public"."enum__artikel_v_version_kategori" AS ENUM('panduan-properti', 'kawasan', 'seputar-gdc');

    ALTER TABLE "artikel" ADD COLUMN "kategori" "enum_artikel_kategori";
    ALTER TABLE "_artikel_v" ADD COLUMN "version_kategori" "enum__artikel_v_version_kategori";

    UPDATE "artikel"
    SET "kategori" = "legacy"."kategori"
    FROM (
      SELECT DISTINCT ON ("artikel_rels"."parent_id")
        "artikel_rels"."parent_id",
        CASE
          WHEN "categories"."slug" = 'panduan-properti' THEN 'panduan-properti'::"enum_artikel_kategori"
          WHEN "categories"."slug" = 'kawasan' THEN 'kawasan'::"enum_artikel_kategori"
          WHEN "categories"."slug" = 'seputar-gdc' THEN 'seputar-gdc'::"enum_artikel_kategori"
          ELSE NULL
        END AS "kategori"
      FROM "artikel_rels"
      INNER JOIN "categories" ON "categories"."id" = "artikel_rels"."categories_id"
      WHERE "artikel_rels"."path" = 'kategori'
        AND "artikel_rels"."categories_id" IS NOT NULL
      ORDER BY "artikel_rels"."parent_id", "artikel_rels"."order" NULLS LAST, "artikel_rels"."id"
    ) AS "legacy"
    WHERE "artikel"."id" = "legacy"."parent_id";

    UPDATE "_artikel_v"
    SET "version_kategori" = "legacy"."kategori"
    FROM (
      SELECT DISTINCT ON ("_artikel_v_rels"."parent_id")
        "_artikel_v_rels"."parent_id",
        CASE
          WHEN "categories"."slug" = 'panduan-properti' THEN 'panduan-properti'::"enum__artikel_v_version_kategori"
          WHEN "categories"."slug" = 'kawasan' THEN 'kawasan'::"enum__artikel_v_version_kategori"
          WHEN "categories"."slug" = 'seputar-gdc' THEN 'seputar-gdc'::"enum__artikel_v_version_kategori"
          ELSE NULL
        END AS "kategori"
      FROM "_artikel_v_rels"
      INNER JOIN "categories" ON "categories"."id" = "_artikel_v_rels"."categories_id"
      WHERE "_artikel_v_rels"."path" = 'kategori'
        AND "_artikel_v_rels"."categories_id" IS NOT NULL
      ORDER BY "_artikel_v_rels"."parent_id", "_artikel_v_rels"."order" NULLS LAST, "_artikel_v_rels"."id"
    ) AS "legacy"
    WHERE "_artikel_v"."id" = "legacy"."parent_id";

    ALTER TABLE "artikel_rels" DROP CONSTRAINT "artikel_rels_categories_fk";
    ALTER TABLE "_artikel_v_rels" DROP CONSTRAINT "_artikel_v_rels_categories_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";

    DROP INDEX "artikel_rels_categories_id_idx";
    DROP INDEX "_artikel_v_rels_categories_id_idx";
    DROP INDEX "payload_locked_documents_rels_categories_id_idx";

    ALTER TABLE "artikel_rels" DROP COLUMN "categories_id";
    ALTER TABLE "_artikel_v_rels" DROP COLUMN "categories_id";
    ALTER TABLE "media" DROP COLUMN "name";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";

    ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "categories" CASCADE;
  `)
}
