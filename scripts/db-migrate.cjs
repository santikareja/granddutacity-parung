#!/usr/bin/env node
/**
 * Runner migrasi SQL mandiri — TANPA Payload.
 *
 * Menggantikan `payload migrate` untuk Custom CMS v2. Menjalankan file .sql di
 * `src/db/sql/` urut nama, mencatat yang sudah diterapkan pada tabel ledger
 * `db_migrations`, satu transaksi per file (ROLLBACK bila gagal).
 *
 * Pemakaian:
 *   node ./scripts/db-migrate.cjs            -> terapkan file yang belum ada di ledger
 *   node ./scripts/db-migrate.cjs --force    -> jalankan ulang SEMUA file, abaikan ledger
 *                                               (aman: semua SQL di src/db/sql wajib idempoten)
 *   node ./scripts/db-migrate.cjs --list     -> tampilkan status tiap file tanpa mengeksekusi
 *
 * Membutuhkan DATABASE_URI (dibaca dari .env.local, lalu .env, lalu environment).
 *
 * CATATAN R1 (integritas data): file SQL di src/db/sql/ HANYA boleh berisi
 * operasi aditif & idempoten. Runner ini tidak pernah melakukan `drizzle-kit push`.
 *
 * Skrip DESTRUKTIF (mis. DROP tabel warisan Payload) tinggal di
 * `src/db/sql/optional/` dan TIDAK dibaca runner ini — lihat readSqlFiles().
 */

/* eslint-disable @typescript-eslint/no-require-imports -- script Node CommonJS (.cjs) dijalankan langsung via `node`, wajib pakai require() */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SQL_DIR = path.join(ROOT, "src", "db", "sql");
const LEDGER_TABLE = "db_migrations";

// --- Env loader sederhana (pola sama dengan scripts/db-baseline.cjs) ---------
// Urutan pemuatan: .env.local dulu, lalu .env. Karena setiap key hanya diset
// bila belum ada, .env.local MENANG atas .env, dan environment nyata menang
// atas keduanya.
function loadEnvFile(file) {
  const envPath = path.join(ROOT, file);
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

// --- Validasi koneksi ------------------------------------------------------
// Nilai DATABASE_URI TIDAK PERNAH dicetak (mengandung kredensial).
function resolveConnectionString() {
  const connectionString = process.env.DATABASE_URI || "";

  if (!connectionString) {
    console.error(
      "DATABASE_URI tidak diset. Set di .env.local (atau .env) / environment sebelum menjalankan migrasi.",
    );
    process.exit(1);
  }

  try {
    new URL(connectionString);
  } catch {
    console.error(
      "DATABASE_URI tidak valid sebagai URL koneksi Postgres. " +
        "Format yang diharapkan: postgres://USER:PASSWORD@HOST:PORT/DATABASE " +
        "(nilai tidak dicetak karena mengandung kredensial).",
    );
    process.exit(1);
  }

  return connectionString;
}

// SSL: pola sama db-baseline.cjs — koneksi non-lokal dipaksa SSL; verifikasi CA
// hanya bila DATABASE_SSL_CA disediakan.
function buildSslOptions(connectionString) {
  const isLocal = /(localhost|127\.0\.0\.1)/i.test(connectionString);
  if (isLocal) return {};
  return process.env.DATABASE_SSL_CA
    ? { ssl: { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true } }
    : { ssl: { rejectUnauthorized: false } };
}

function readSqlFiles() {
  if (!fs.existsSync(SQL_DIR)) {
    console.error(`Folder migrasi tidak ditemukan: ${path.relative(ROOT, SQL_DIR)}`);
    process.exit(1);
  }

  // NON-REKURSIF DAN HANYA FILE, disengaja.
  //
  // `src/db/sql/optional/` menampung skrip DESTRUKTIF (mis. DROP tabel warisan
  // Payload) yang HANYA boleh dijalankan manual setelah backup. Karena runner
  // ini tidak pernah turun ke subfolder — dan `withFileTypes` memastikan entri
  // direktori dibuang secara eksplisit — isi `optional/` TIDAK akan ikut
  // terjalankan oleh `npm run migrate`.
  const files = fs
    .readdirSync(SQL_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));

  if (files.length === 0) {
    console.error(`Tidak ada file .sql di ${path.relative(ROOT, SQL_DIR)}`);
    process.exit(1);
  }

  return files;
}

async function ensureLedger(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${LEDGER_TABLE}" (
      "id" serial PRIMARY KEY,
      "name" varchar NOT NULL UNIQUE,
      "applied_at" timestamptz DEFAULT now()
    )
  `);
}

async function readLedger(client) {
  const res = await client.query(`SELECT "name" FROM "${LEDGER_TABLE}"`);
  return new Set(res.rows.map((row) => row.name));
}

async function main() {
  const force = process.argv.includes("--force");
  const listOnly = process.argv.includes("--list");

  const connectionString = resolveConnectionString();
  const files = readSqlFiles();

  const { Client } = require("pg");
  const client = new Client({
    connectionString,
    ...buildSslOptions(connectionString),
  });

  await client.connect();

  const applied = [];
  const skipped = [];

  try {
    await ensureLedger(client);
    const ledger = await readLedger(client);

    if (listOnly) {
      console.log("File migrasi di src/db/sql/:");
      for (const file of files) {
        console.log(`  ${ledger.has(file) ? "[applied]" : "[pending]"} ${file}`);
      }
      return 0;
    }

    if (force) {
      console.log("Mode --force: ledger diabaikan, semua file dijalankan ulang (SQL idempoten).");
    }

    for (const file of files) {
      if (!force && ledger.has(file)) {
        skipped.push(file);
        console.log(`SKIP    ${file} (sudah tercatat di ${LEDGER_TABLE})`);
        continue;
      }

      const sqlText = fs.readFileSync(path.join(SQL_DIR, file), "utf8");

      try {
        await client.query("BEGIN");
        await client.query(sqlText);
        await client.query(
          `INSERT INTO "${LEDGER_TABLE}" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING`,
          [file],
        );
        await client.query("COMMIT");
        applied.push(file);
        console.log(`APPLIED ${file}`);
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error(`GAGAL   ${file} — transaksi di-ROLLBACK, tidak ada perubahan tersimpan.`);
        console.error(`        ${err.message}`);
        return 1;
      }
    }

    console.log("-".repeat(56));
    console.log(`Ringkasan: ${applied.length} diterapkan, ${skipped.length} dilewati.`);
    if (applied.length > 0) console.log(`  Diterapkan: ${applied.join(", ")}`);
    if (skipped.length > 0) console.log(`  Dilewati  : ${skipped.join(", ")}`);

    return 0;
  } finally {
    await client.end();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
