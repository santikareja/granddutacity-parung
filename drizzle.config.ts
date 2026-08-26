import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// PENTING: skema di src/db/schema.ts adalah PEMETAAN dari skema Postgres yang
// SUDAH ADA (dibuat oleh migrasi Payload), bukan sumber kebenaran baru.
// Selama masa transisi Payload -> CMS kustom, JANGAN jalankan `drizzle-kit push`
// atau `generate` lalu apply ke database produksi: itu bisa mencoba menyelaraskan
// skema dan menghasilkan DROP/ALTER destruktif terhadap tabel Payload.
// Config ini disediakan untuk `drizzle-kit studio` (inspeksi read-only) dan
// pekerjaan skema di masa depan setelah Payload benar-benar dilepas.
export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URI || "",
  },
  // Batasi ke schema publik agar studio tidak mengintrospeksi skema sistem.
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
