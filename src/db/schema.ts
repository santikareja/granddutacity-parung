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
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
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

// CATATAN: `enum_artikel_kategori` dan `enum__artikel_v_version_kategori` SUDAH
// di-DROP oleh migrasi 20260417_133623 (kategori dipindah ke tabel artikel_rels).
// Enum tersebut sengaja tidak dideklarasikan di sini agar Drizzle tidak
// mereferensikan objek Postgres yang tidak ada.

export const artikelVersionStatusEnum = pgEnum(
  "enum__artikel_v_version_status",
  ["draft", "published"],
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
  // public_id Cloudinary (migrasi 20260826_090000) — dipakai untuk menghapus
  // aset saat baris media dihapus. Nullable: baris lama diisi via derivasi URL.
  cloudinaryPublicId: varchar("cloudinary_public_id"),
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
    // Kolom `kategori` sudah di-DROP (migrasi 20260417). Kategori kini via artikel_rels.
    seoMetaTitle: varchar("seo_meta_title"),
    seoMetaDescription: varchar("seo_meta_description"),
    seoFocusKeyword: varchar("seo_focus_keyword"),
    // `status` = field kustom yang dibaca frontend/sitemap.
    status: artikelStatusEnum("status").default("draft"),
    publishedAt: timestamp("published_at", { precision: 3, withTimezone: true }),
    // Estimasi waktu baca (menit), dihitung otomatis dari konten saat menyimpan.
    readingTime: integer("reading_time"),
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
  // Index nyata (artikel_slug_idx unik, artikel__status_idx) sudah dibuat oleh
  // migrasi Payload. Tidak dideklarasikan ulang di sini agar tidak memunculkan
  // index bayangan yang tak pernah ada di DB.
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
// site_settings (Task 7: settings DB-driven key/value + metadata)
// ---------------------------------------------------------------------------
//
// `key` unik (site_settings_key_idx). `type`: text|json|url|image|html.
// `group`: general|seo|social|contact. Kolom `group` adalah kata reserved di
// SQL, tetapi aman sebagai nama kolom Postgres karena selalu di-quote oleh
// Drizzle: varchar("group").

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull(),
  value: text("value"),
  type: varchar("type").default("text").notNull(),
  group: varchar("group").default("general").notNull(),
  label: varchar("label"),
  description: varchar("description"),
  updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// ai_role_models (Task 9A: model AI per tugas; api_key terenkripsi AES-256-GCM)
// ---------------------------------------------------------------------------
//
// `role` unik (ai_role_models_role_idx): 'text' | 'image' | 'scanning'.
// `api_key` ciphertext "enc::v1::..." — JANGAN pernah kirim ke client.

export const aiRoleModels = pgTable("ai_role_models", {
  id: serial("id").primaryKey(),
  role: varchar("role").notNull(),
  provider: varchar("provider").default("openai_compatible").notNull(),
  // Ciphertext AES-256-GCM — JANGAN pernah kirim ke client.
  apiKey: varchar("api_key").notNull(),
  baseUrl: varchar("base_url"),
  model: varchar("model"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// agent_api_tokens (Task 9B: token untuk agent eksternal; hanya hash SHA-256)
// ---------------------------------------------------------------------------
//
// `token_hash` unik (agent_api_tokens_token_hash_idx). Plaintext token TIDAK
// disimpan — hanya ditampilkan sekali saat pembuatan. `token_prefix` (12 char)
// bukan rahasia, hanya untuk identifikasi di UI. `scopes` jsonb array string.

export const agentApiTokens = pgTable("agent_api_tokens", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  // SHA-256 hex dari token mentah — JANGAN pernah kirim ke client.
  tokenHash: varchar("token_hash").notNull(),
  tokenPrefix: varchar("token_prefix").notNull(),
  scopes: jsonb("scopes"),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at", { precision: 3, withTimezone: true }),
  expiresAt: timestamp("expires_at", { precision: 3, withTimezone: true }),
  revokedAt: timestamp("revoked_at", { precision: 3, withTimezone: true }),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// ai_tasks (Task 10: log tugas AI untuk riwayat/audit)
// ---------------------------------------------------------------------------
//
// `type`: titles|outline|article|seo|text-tool|image-meta.
// `status`: pending|processing|completed|failed.
// `input`/`output` jsonb ringkas — JANGAN pernah menyimpan API key di sini.
// Index `ai_tasks_created_at_idx` untuk urutan riwayat terbaru.

export const aiTasks = pgTable("ai_tasks", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(),
  status: varchar("status").default("completed").notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  error: varchar("error"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// admin_audit_log — Task 11: audit trail durable perubahan konten admin.
//
// `action`: 'article:create'|'article:update'|'article:delete'|'article:status'.
// `entity`: 'artikel' (dapat diperluas). `summary` jsonb ringkas — JANGAN simpan
// kredensial. Index (entity, entity_id) & created_at ada di migrasi.
// ---------------------------------------------------------------------------

export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action").notNull(),
  entity: varchar("entity").notNull(),
  entityId: integer("entity_id"),
  userId: integer("user_id"),
  userEmail: varchar("user_email"),
  summary: jsonb("summary"),
  createdAt: timestamp("created_at", { precision: 3, withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// unit_content — konten halaman /tipe-rumah/<slug> yang bisa diedit dari admin.
//
// Migrasi: src/db/sql/0002_unit_content.sql. `unit_id` unik
// (unit_content_unit_id_idx) dan dipakai sebagai target ON CONFLICT saat upsert.
//
// SEMUA kolom konten NULL-able, dan itu disengaja: NULL berarti "pakai default
// dari kode" (src/data/units.ts + src/data/unit-content.ts). Dengan begitu situs
// tetap utuh saat tabel kosong, dan `next build` tidak bergantung pada database.
//
// `unit_id` BUKAN foreign key — daftar unit hidup di kode, bukan di database.
// ---------------------------------------------------------------------------

export const unitContent = pgTable("unit_content", {
  id: serial("id").primaryKey(),
  unitId: varchar("unit_id").notNull(),
  priceLabel: varchar("price_label"),
  facadeImage: varchar("facade_image"),
  floorPlanImage: varchar("floor_plan_image"),
  // Array string.
  overview: jsonb("overview"),
  highlights: jsonb("highlights"),
  suitedFor: jsonb("suited_for"),
  // Array objek { url, alt, caption? }.
  gallery: jsonb("gallery"),
  // Array objek { label, value }.
  accessItems: jsonb("access_items"),
  videoUrl: varchar("video_url"),
  videoPoster: varchar("video_poster"),
  videoTitle: varchar("video_title"),
  isPublished: boolean("is_published").default(true).notNull(),
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
export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;
export type AiRoleModel = typeof aiRoleModels.$inferSelect;
export type NewAiRoleModel = typeof aiRoleModels.$inferInsert;
export type AgentApiToken = typeof agentApiTokens.$inferSelect;
export type NewAgentApiToken = typeof agentApiTokens.$inferInsert;
export type AiTask = typeof aiTasks.$inferSelect;
export type NewAiTask = typeof aiTasks.$inferInsert;
export type UnitContentRow = typeof unitContent.$inferSelect;
export type NewUnitContentRow = typeof unitContent.$inferInsert;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLog.$inferInsert;
