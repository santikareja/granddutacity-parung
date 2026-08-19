import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_artikel_kategori" AS ENUM('panduan-properti', 'kawasan', 'seputar-gdc');
  CREATE TYPE "public"."enum_artikel_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__artikel_v_version_kategori" AS ENUM('panduan-properti', 'kawasan', 'seputar-gdc');
  CREATE TYPE "public"."enum__artikel_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'ai-agent');
  CREATE TABLE "artikel" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"featured_image_id" integer,
  	"kategori" "enum_artikel_kategori",
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_focus_keyword" varchar,
  	"status" "enum_artikel_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"ai_generated" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_artikel_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "artikel_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"artikel_id" integer
  );
  
  CREATE TABLE "_artikel_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_featured_image_id" integer,
  	"version_kategori" "enum__artikel_v_version_kategori",
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_status" "enum__artikel_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_ai_generated" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__artikel_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_artikel_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"artikel_id" integer
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'admin',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"artikel_id" integer,
  	"media_id" integer,
  	"tags_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "artikel" ADD CONSTRAINT "artikel_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artikel_rels" ADD CONSTRAINT "artikel_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artikel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artikel_rels" ADD CONSTRAINT "artikel_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artikel_rels" ADD CONSTRAINT "artikel_rels_artikel_fk" FOREIGN KEY ("artikel_id") REFERENCES "public"."artikel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artikel_v" ADD CONSTRAINT "_artikel_v_parent_id_artikel_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artikel"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_artikel_v" ADD CONSTRAINT "_artikel_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_artikel_v_rels" ADD CONSTRAINT "_artikel_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_artikel_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artikel_v_rels" ADD CONSTRAINT "_artikel_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_artikel_v_rels" ADD CONSTRAINT "_artikel_v_rels_artikel_fk" FOREIGN KEY ("artikel_id") REFERENCES "public"."artikel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artikel_fk" FOREIGN KEY ("artikel_id") REFERENCES "public"."artikel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "artikel_slug_idx" ON "artikel" USING btree ("slug");
  CREATE INDEX "artikel_featured_image_idx" ON "artikel" USING btree ("featured_image_id");
  CREATE INDEX "artikel_seo_seo_focus_keyword_idx" ON "artikel" USING btree ("seo_focus_keyword");
  CREATE INDEX "artikel_updated_at_idx" ON "artikel" USING btree ("updated_at");
  CREATE INDEX "artikel_created_at_idx" ON "artikel" USING btree ("created_at");
  CREATE INDEX "artikel__status_idx" ON "artikel" USING btree ("_status");
  CREATE INDEX "artikel_rels_order_idx" ON "artikel_rels" USING btree ("order");
  CREATE INDEX "artikel_rels_parent_idx" ON "artikel_rels" USING btree ("parent_id");
  CREATE INDEX "artikel_rels_path_idx" ON "artikel_rels" USING btree ("path");
  CREATE INDEX "artikel_rels_tags_id_idx" ON "artikel_rels" USING btree ("tags_id");
  CREATE INDEX "artikel_rels_artikel_id_idx" ON "artikel_rels" USING btree ("artikel_id");
  CREATE INDEX "_artikel_v_parent_idx" ON "_artikel_v" USING btree ("parent_id");
  CREATE INDEX "_artikel_v_version_version_slug_idx" ON "_artikel_v" USING btree ("version_slug");
  CREATE INDEX "_artikel_v_version_version_featured_image_idx" ON "_artikel_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_artikel_v_version_seo_version_seo_focus_keyword_idx" ON "_artikel_v" USING btree ("version_seo_focus_keyword");
  CREATE INDEX "_artikel_v_version_version_updated_at_idx" ON "_artikel_v" USING btree ("version_updated_at");
  CREATE INDEX "_artikel_v_version_version_created_at_idx" ON "_artikel_v" USING btree ("version_created_at");
  CREATE INDEX "_artikel_v_version_version__status_idx" ON "_artikel_v" USING btree ("version__status");
  CREATE INDEX "_artikel_v_created_at_idx" ON "_artikel_v" USING btree ("created_at");
  CREATE INDEX "_artikel_v_updated_at_idx" ON "_artikel_v" USING btree ("updated_at");
  CREATE INDEX "_artikel_v_latest_idx" ON "_artikel_v" USING btree ("latest");
  CREATE INDEX "_artikel_v_autosave_idx" ON "_artikel_v" USING btree ("autosave");
  CREATE INDEX "_artikel_v_rels_order_idx" ON "_artikel_v_rels" USING btree ("order");
  CREATE INDEX "_artikel_v_rels_parent_idx" ON "_artikel_v_rels" USING btree ("parent_id");
  CREATE INDEX "_artikel_v_rels_path_idx" ON "_artikel_v_rels" USING btree ("path");
  CREATE INDEX "_artikel_v_rels_tags_id_idx" ON "_artikel_v_rels" USING btree ("tags_id");
  CREATE INDEX "_artikel_v_rels_artikel_id_idx" ON "_artikel_v_rels" USING btree ("artikel_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "tags_name_idx" ON "tags" USING btree ("name");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_artikel_id_idx" ON "payload_locked_documents_rels" USING btree ("artikel_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "artikel" CASCADE;
  DROP TABLE "artikel_rels" CASCADE;
  DROP TABLE "_artikel_v" CASCADE;
  DROP TABLE "_artikel_v_rels" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_artikel_kategori";
  DROP TYPE "public"."enum_artikel_status";
  DROP TYPE "public"."enum__artikel_v_version_kategori";
  DROP TYPE "public"."enum__artikel_v_version_status";
  DROP TYPE "public"."enum_users_role";`)
}
