#!/usr/bin/env node
/**
 * Baseline integritas data untuk migrasi Payload -> Custom CMS.
 *
 * Mencatat jumlah baris (row count) setiap tabel penting ke file JSON.
 * Dipakai sebagai titik acuan: jalankan SEBELUM migrasi dan bandingkan
 * SESUDAH setiap fase untuk memastikan tidak ada data yang hilang.
 *
 * Pemakaian:
 *   node ./scripts/db-baseline.cjs                 -> tulis baseline ke .kiro/specs/payload-to-custom-cms/baseline.json
 *   node ./scripts/db-baseline.cjs --compare       -> bandingkan kondisi DB sekarang dengan baseline.json
 *
 * Membutuhkan DATABASE_URI di environment (.env.local).
 */

/* eslint-disable @typescript-eslint/no-require-imports -- script Node CommonJS (.cjs) dijalankan langsung via `node`, wajib pakai require() */
const fs = require("node:fs");
const path = require("node:path");

// Muat env dari .env.local bila ada (tanpa dependency tambahan).
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const TABLES = [
  "artikel",
  "artikel_rels",
  "_artikel_v",
  "_artikel_v_rels",
  "media",
  "categories",
  "tags",
  "users",
  "users_sessions",
  "ai_providers",
  "payload_locked_documents",
  "payload_preferences",
  "payload_migrations",
];

const OUT_PATH = path.resolve(
  __dirname,
  "..",
  ".kiro",
  "specs",
  "payload-to-custom-cms",
  "baseline.json",
);

async function collectCounts(pool) {
  const counts = {};
  for (const table of TABLES) {
    try {
      const res = await pool.query(`SELECT COUNT(*)::int AS c FROM "${table}"`);
      counts[table] = res.rows[0].c;
    } catch (err) {
      counts[table] = `ERROR: ${err.message}`;
    }
  }
  return counts;
}

async function main() {
  const connectionString = process.env.DATABASE_URI || "";
  if (!connectionString) {
    console.error("DATABASE_URI tidak diset. Set di .env.local atau environment.");
    process.exit(1);
  }

  const { Pool } = require("pg");
  const isLocal = /(localhost|127\.0\.0\.1)/i.test(connectionString);
  const pool = new Pool({
    connectionString,
    ...(isLocal
      ? {}
      : process.env.DATABASE_SSL_CA
        ? { ssl: { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true } }
        : { ssl: { rejectUnauthorized: false } }),
  });

  try {
    const counts = await collectCounts(pool);
    const compare = process.argv.includes("--compare");

    if (compare) {
      if (!fs.existsSync(OUT_PATH)) {
        console.error("baseline.json belum ada. Jalankan tanpa --compare dulu.");
        process.exit(1);
      }
      const baseline = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
      let drift = false;
      console.log("Tabel                          baseline   sekarang   status");
      console.log("-".repeat(64));
      for (const table of TABLES) {
        const before = baseline.counts[table];
        const now = counts[table];
        const ok = before === now;
        if (!ok) drift = true;
        console.log(
          `${table.padEnd(30)} ${String(before).padStart(8)} ${String(now).padStart(10)}   ${ok ? "OK" : "BERUBAH"}`,
        );
      }
      console.log("-".repeat(64));
      console.log(drift ? "PERINGATAN: ada perubahan row count." : "Semua tabel konsisten dengan baseline.");
      process.exit(drift ? 2 : 0);
    }

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(
      OUT_PATH,
      JSON.stringify({ capturedAt: new Date().toISOString(), counts }, null, 2),
    );
    console.log(`Baseline ditulis ke ${OUT_PATH}`);
    console.table(counts);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
