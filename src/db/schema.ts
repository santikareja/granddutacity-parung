// Pemetaan Drizzle untuk skema Postgres yang SUDAH ADA (dibuat oleh migrasi
// Payload CMS). Ini bukan sumber kebenaran skema: nama tabel/kolom mengikuti
// konvensi snake_case Payload persis, agar CMS kustom (v2-admin) membaca dan
// menulis data yang sama dengan Payload selama masa transisi.
//
// JANGAN mengubah nama kolom di sini tanpa migrasi DB yang sepadan.
// JANGAN menjalankan `drizzle-kit push` ke produksi selagi Payload masih dipakai.

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums (nama harus sama dengan yang ada di Postgres)
// ---------------------------------------------------------------------------

export const artikelStatusEnum = pgEnum("enum_artikel_status", [
  "draft",
  "published",
]);

export const artikelKategoriEnum = pgEnum("enum_artikel_kategori", [
  "panduan-properti",
  "kawasan",
  "seputar-gdc",
]);

export const artikelVersionStatusEnum = pgEnum(
  "enum__artikel_v_version_status",
  ["draft", "published"],
);

export const artikelVersionKategoriEnum = pgEnum(
  "enum__artikel_v_version_kategori",
  ["panduan-properti", "kawasan", "seputar-gdc"],
);

export const usersRoleEnum = pgEnum("enum_users_role", ["admin", "ai-agent"]);

export const mediaSourceEnum = pgEnum("enum_media_source", [
  "upload",
  "unsplash",
  "pexels",
]);

// ---------------------------------------------------------------------------
// media
// ---------------------------------------------------------------------------

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  name: varchar("name"),
  alt: varchar("alt").notNull(),
  caption: varchar("caption"),
  // Kolom sumber/atribusi foto stok (migrasi 20260825_040000).
  source: mediaSourceEnum("source").default("upload"),
  sourceId: varchar("source_id"),
  attributionUrl: varchar("attribution_url"),
  // Kolom upload bawaan Payload.
  url: varchar("url"),
  // Perhatikan penamaan aneh dari Payload: thumbnailURL -> thumbnail_u_r_l.
  thumbnailUrl: varchar("thumbnail_u_r_l"),
  filename: varchar("filename"),
  mimeType: varchar("mime_type"),
  filesize: numeric("filesize"),
  width: numeric("width"),
  height: numeric("height"),
  focalX: numeric("focal_x"),
  focalY: numeric("focal_y"),
  updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// categories
// ---------------------------------------------------------------------------

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull(),
  description: varchar("description"),
  updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// tags
// ---------------------------------------------------------------------------

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug"),
  updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// artikel (tabel utama)
// ---------------------------------------------------------------------------

export const artikel = pgTable(
  "artikel",
  {
    id: serial("id").primaryKey(),
    title: varchar("title"),
    slug: varchar("slug"),
    excerpt: varchar("excerpt"),
    // Lexical editor state.
    content: jsonb("content"),
    featuredImageId: integer("featured_image_id").references(() => media.id, {
      onDelete: "set null",
    }),
    kategori: artikelKategoriEnum("kategori"),
    seoMetaTitle: varchar("seo_meta_title"),
    seoMetaDescription: varchar("seo_meta_description"),
    seoFocusKeyword: varchar("seo_focus_keyword"),
    // `status` = field kustom yang dibaca frontend/sitemap.
    status: artikelStatusEnum("status").default("draft"),
    publishedAt: timestamp("published_at", { precision: 3, withTimezone: true }),
    aiGenerated: boolean("ai_generated").default(false),
    // Jejak audit AI Studio (migrasi 20260825_040000).
    aiTopic: varchar("ai_topic"),
    aiOutline: jsonb("ai_outline"),
    updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
      .defaultNow()
      .notNull(),
    // `_status` = mekanisme draft/publish internal Payload. Disinkronkan dengan
    // `status` oleh hook Artikel; CMS kustom WAJIB menulis keduanya agar konsisten.
    underscoreStatus: artikelStatusEnum("_status").default("draft"),
  },
  (table) => [
    index("artikel_slug_idx_drizzle").on(table.slug),
    index("artikel_status_idx_drizzle").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// artikel_rels — tabel relasi polimorfik Payload (tags & related artikel & categories)
// ---------------------------------------------------------------------------

export const artikelRels = pgTable("artikel_rels", {
  id: serial("id").primaryKey(),
  order: integer("order"),
  parentId: integer("parent_id")
    .notNull()
    .references(() => artikel.id, { onDelete: "cascade" }),
  // `path` menandai field mana yang direferensikan ("tags", "relatedArtikel", "kategori").
  path: varchar("path").notNull(),
  tagsId: integer("tags_id").references(() => tags.id, { onDelete: "cascade" }),
  artikelId: integer("artikel_id").references(() => artikel.id, {
    onDelete: "cascade",
  }),
  categoriesId: integer("categories_id").references(() => categories.id, {
    onDelete: "cascade",
  }),
});

// ---------------------------------------------------------------------------
// users (auth Payload: pbkdf2 salt+hash)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  role: usersRoleEnum("role").default("admin"),
  email: varchar("email").notNull(),
  resetPasswordToken: varchar("reset_password_token"),
  resetPasswordExpiration: timestamp("reset_password_expiration", {
    precision: 3,
    withTimezone: true,
  }),
  // Payload memakai pbkdf2(password, salt, 25000, 512, 'sha256') -> hash hex.
  salt: varchar("salt"),
  hash: varchar("hash"),
  loginAttempts: numeric("login_attempts").default("0"),
  lockUntil: timestamp("lock_until", { precision: 3, withTimezone: true }),
  updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// ai_providers (konfigurasi AI; api_key terenkripsi AES-256-GCM)
// ---------------------------------------------------------------------------

export const aiProviders = pgTable("ai_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  baseUrl: varchar("base_url").notNull(),
  // Ciphertext "enc::v1::<salt>::<iv>::<tag>::<data>" — JANGAN pernah kirim ke client.
  apiKey: varchar("api_key").notNull(),
  availableModels: jsonb("available_models"),
  models: jsonb("models"),
  defaultModel: varchar("default_model"),
  isDefault: boolean("is_default").default(false),
  updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// Relations (untuk query relational Drizzle)
// ---------------------------------------------------------------------------

export const artikelRelations = relations(artikel, ({ one, many }) => ({
  featuredImage: one(media, {
    fields: [artikel.featuredImageId],
    references: [media.id],
  }),
  rels: many(artikelRels),
}));

export const artikelRelsRelations = relations(artikelRels, ({ one }) => ({
  parent: one(artikel, {
    fields: [artikelRels.parentId],
    references: [artikel.id],
  }),
  tag: one(tags, {
    fields: [artikelRels.tagsId],
    references: [tags.id],
  }),
  category: one(categories, {
    fields: [artikelRels.categoriesId],
    references: [categories.id],
  }),
}));

// ---------------------------------------------------------------------------
// Tipe turunan
// ---------------------------------------------------------------------------

export type Artikel = typeof artikel.$inferSelect;
export type NewArtikel = typeof artikel.$inferInsert;
export type Media = typeof media.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type User = typeof users.$inferSelect;
export type AiProvider = typeof aiProviders.$inferSelect;
