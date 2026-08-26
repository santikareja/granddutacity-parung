// Koneksi database untuk CMS kustom (v2-admin). Server-side only.
//
// Memakai pool `pg` tunggal yang di-cache pada globalThis: di serverless/dev
// dengan hot reload, membuat pool baru setiap modul dievaluasi akan menguras
// slot koneksi Postgres (Supabase punya batas ketat).

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URI || "";

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error(
    "DATABASE_URI wajib diset untuk CMS kustom (Vercel > Settings > Environment Variables).",
  );
}

// SSL aktif untuk host non-lokal (Supabase/Neon/RDS). Jika provider menyediakan
// CA certificate lewat DATABASE_SSL_CA, sertifikat divalidasi penuh.
const isLocal = /(localhost|127\.0\.0\.1)/i.test(connectionString);
const sslConfig = isLocal
  ? undefined
  : process.env.DATABASE_SSL_CA
    ? { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true }
    : { rejectUnauthorized: false };

type GlobalWithPool = typeof globalThis & {
  __gdcPgPool?: Pool;
};

const globalForDb = globalThis as GlobalWithPool;

const pool =
  globalForDb.__gdcPgPool ??
  new Pool({
    connectionString,
    ...(sslConfig ? { ssl: sslConfig } : {}),
    // Batas konservatif: fungsi serverless berumur pendek, banyak instance.
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__gdcPgPool = pool;
}

// Pool `pg` memancarkan 'error' untuk klien idle yang terputus. Tanpa listener,
// Node menganggapnya unhandled dan mematikan proses.
pool.on("error", (error) => {
  console.error("[db] Kesalahan pada klien idle Postgres:", error.message);
});

export const db = drizzle(pool, { schema });

export { schema };
