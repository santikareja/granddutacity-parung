#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- script Node CommonJS (.cjs) dijalankan langsung via `node` */
/**
 * Diagnostik DATABASE_URI — AMAN, tidak pernah mencetak kredensial.
 *
 * Hanya menampilkan STRUKTUR koneksi (protokol, hostname, port, nama database,
 * ada/tidaknya user & password) supaya masalah seperti
 * "getaddrinfo ENOTFOUND base" bisa dilacak tanpa membocorkan rahasia.
 *
 * Pemakaian:
 *   node ./scripts/diagnose-db-uri.cjs
 *   node ./scripts/diagnose-db-uri.cjs --test-connect   (coba konek sungguhan)
 */

const fs = require("node:fs");
const path = require("node:path");

// Baca file env secara manual agar bisa membandingkan .env vs .env.local.
const readEnvFile = (filename) => {
  const filePath = path.resolve(__dirname, "..", filename);
  if (!fs.existsSync(filePath)) return null;

  const result = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Buang kutip pembungkus bila ada.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
};

// Ringkas nilai jadi info struktural yang aman dicetak.
const describeUri = (value) => {
  if (value === undefined) return "  (tidak diset)";
  if (value === "") return "  (string KOSONG)";

  const notes = [];
  notes.push(`  panjang        : ${value.length} karakter`);

  // Deteksi masalah umum tanpa membocorkan isi.
  if (/\s/.test(value)) notes.push("  ⚠ mengandung SPASI / baris baru");
  if (/^["']|["']$/.test(value)) notes.push("  ⚠ masih terbungkus kutip ganda");
  if (/^(postgres|postgresql):\/\//i.test(value) === false) {
    notes.push(
      "  ⚠ TIDAK diawali 'postgres://' atau 'postgresql://' — ini penyebab umum host salah-parse",
    );
  }
  if (/<|>|\[|\]|YOUR|PASSWORD|xxx|placeholder/i.test(value)) {
    notes.push("  ⚠ tampak masih berisi PLACEHOLDER (mis. [YOUR-PASSWORD])");
  }

  try {
    const u = new URL(value);
    notes.push(`  protokol       : ${u.protocol}`);
    notes.push(`  hostname       : ${u.hostname || "(kosong)"}`);
    notes.push(`  port           : ${u.port || "(default)"}`);
    notes.push(`  database       : ${u.pathname.replace(/^\//, "") || "(kosong)"}`);
    notes.push(`  username       : ${u.username ? "ADA" : "(kosong)"}`);
    notes.push(`  password       : ${u.password ? "ADA" : "(kosong)"}`);
    if (u.search) notes.push(`  query          : ${u.search}`);
    if (!u.hostname || u.hostname === "base") {
      notes.push("  ❌ hostname tidak wajar — inilah sumber ENOTFOUND");
    }
  } catch (err) {
    notes.push(`  ❌ new URL() GAGAL: ${err.message}`);
    notes.push(
      "     Artinya nilai ini bukan URI valid; pg akan salah menebak host.",
    );
  }

  return notes.join("\n");
};

const main = async () => {
  console.log("=== Diagnostik DATABASE_URI (tanpa membocorkan kredensial) ===\n");

  const files = [".env.local", ".env"];
  const found = {};

  for (const file of files) {
    const parsed = readEnvFile(file);
    console.log(`--- ${file} ---`);
    if (!parsed) {
      console.log("  (file tidak ada)\n");
      continue;
    }
    const value = parsed.DATABASE_URI;
    found[file] = value;
    console.log(describeUri(value));
    console.log("");
  }

  // Next.js memprioritaskan .env.local di atas .env.
  const effective = found[".env.local"] ?? found[".env"];
  const sourceFile =
    found[".env.local"] !== undefined ? ".env.local" : ".env";

  console.log("--- Kesimpulan ---");
  console.log(
    `Next.js memakai nilai dari: ${sourceFile} (.env.local menimpa .env)`,
  );

  if (
    found[".env.local"] !== undefined &&
    found[".env"] !== undefined &&
    found[".env.local"] !== found[".env"]
  ) {
    console.log(
      "⚠ Nilai di .env.local dan .env BERBEDA. Yang dipakai .env.local.",
    );
  }

  if (!effective) {
    console.log("❌ DATABASE_URI tidak ditemukan di kedua file.");
    process.exit(1);
  }

  let hostOk = false;
  try {
    const u = new URL(effective);
    hostOk = Boolean(u.hostname) && u.hostname !== "base";
  } catch {
    hostOk = false;
  }

  if (!hostOk) {
    console.log(
      "\n❌ DATABASE_URI TIDAK VALID. Perbaiki menjadi format:\n" +
        "   postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require\n" +
        "   (Supabase: Project Settings → Database → Connection string → URI)\n" +
        "   Catatan: bila password memuat karakter khusus (@ : / ? # & %),\n" +
        "   password WAJIB di-URL-encode.",
    );
    process.exit(2);
  }

  console.log("✅ Struktur URI terlihat valid.");

  if (!process.argv.includes("--test-connect")) {
    console.log(
      "\nJalankan ulang dengan --test-connect untuk mencoba koneksi sungguhan.",
    );
    return;
  }

  console.log("\nMencoba koneksi ke Postgres…");
  const { Pool } = require("pg");
  const isLocal = /(localhost|127\.0\.0\.1)/i.test(effective);
  const pool = new Pool({
    connectionString: effective,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
    connectionTimeoutMillis: 10_000,
  });

  try {
    const res = await pool.query(
      "SELECT current_database() AS db, current_user AS usr",
    );
    console.log(
      `✅ Koneksi BERHASIL. database=${res.rows[0].db} user=${res.rows[0].usr}`,
    );

    const tables = await pool.query(
      `SELECT COUNT(*)::int AS c FROM information_schema.tables WHERE table_schema='public' AND table_name='artikel'`,
    );
    console.log(
      tables.rows[0].c > 0
        ? "✅ Tabel 'artikel' ditemukan."
        : "⚠ Tabel 'artikel' TIDAK ditemukan — mungkin perlu `npm run migrate`.",
    );
  } catch (err) {
    console.log(`❌ Koneksi GAGAL: ${err.message}`);
    process.exitCode = 3;
  } finally {
    await pool.end().catch(() => {});
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
