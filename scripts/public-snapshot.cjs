#!/usr/bin/env node
/**
 * Snapshot output publik untuk gerbang SEO (Task 6 & 12).
 *
 * Mengambil HTML sejumlah URL publik penting + sitemap.xml, menormalkannya
 * (buang atribut volatile Next.js/nonce), lalu menyimpannya. Dipakai untuk
 * membuktikan bahwa porting Payload -> Drizzle dan pelepasan Payload TIDAK
 * mengubah output yang dilihat mesin pencari.
 *
 * Pemakaian (butuh server berjalan, mis. `npm run dev` atau preview):
 *   node ./scripts/public-snapshot.cjs --base http://localhost:3000            -> simpan baseline
 *   node ./scripts/public-snapshot.cjs --base http://localhost:3000 --compare  -> bandingkan
 *
 * Tambahkan URL artikel DB nyata via --urls "/slug-a,/slug-b".
 */

/* eslint-disable @typescript-eslint/no-require-imports -- script Node CommonJS (.cjs) dijalankan langsung via `node`, wajib pakai require() */
const fs = require("node:fs");
const path = require("node:path");

const SNAP_DIR = path.resolve(
  __dirname,
  "..",
  ".kiro",
  "specs",
  "payload-to-custom-cms",
  "snapshots",
);

// URL wajib: arsip, sitemap, 5 route statis, dan detail artikel DB murni.
const DEFAULT_URLS = [
  "/artikel",
  "/sitemap.xml",
  "/cara-beli-kpr",
  "/cluster-cascada",
  "/cluster-ladera",
  "/lokasi-akses-grand-duta-city-parung",
  "/update-stok-siteplan-grand-duta-city-parung",
  "/10-ciri-agen-properti-terbaik", // satu-satunya artikel DB murni (via [slug])
  "/category/panduan-properti",
  "/author/santika-reza",
];

const getArg = (name, fallback) => {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
};

// Normalisasi: buang penanda volatile agar diff fokus ke konten SEO nyata.
const normalize = (html) =>
  html
    .replace(/nonce="[^"]*"/g, 'nonce=""')
    .replace(/<script[^>]*src="\/_next\/[^"]*"[^>]*><\/script>/g, "")
    .replace(/\?dpl=[a-z0-9]+/gi, "")
    .replace(/data-nscp="[^"]*"/g, "")
    .replace(/\s+$/gm, "")
    .trim();

const slug = (u) => (u === "/" ? "root" : u.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, ""));

async function main() {
  const base = getArg("--base", "http://localhost:3000").replace(/\/+$/, "");
  const compare = process.argv.includes("--compare");
  const extra = getArg("--urls", "");
  const urls = [...DEFAULT_URLS, ...extra.split(",").map((s) => s.trim()).filter(Boolean)];

  fs.mkdirSync(SNAP_DIR, { recursive: true });
  let mismatch = false;

  for (const url of urls) {
    let body;
    let status;
    try {
      const res = await fetch(base + url, { headers: { "user-agent": "snapshot-bot" } });
      status = res.status;
      body = normalize(await res.text());
    } catch (err) {
      console.error(`GAGAL fetch ${url}: ${err.message}`);
      mismatch = true;
      continue;
    }

    const file = path.join(SNAP_DIR, `${slug(url)}.html`);

    if (compare) {
      if (!fs.existsSync(file)) {
        console.log(`[BARU]   ${url} (belum ada baseline)`);
        mismatch = true;
        continue;
      }
      const before = fs.readFileSync(file, "utf8");
      if (before === body) {
        console.log(`[OK]     ${url} (${status})`);
      } else {
        console.log(`[BEDA]   ${url} (${status}) -> output berubah dari baseline`);
        mismatch = true;
      }
    } else {
      fs.writeFileSync(file, body);
      console.log(`[SIMPAN] ${url} (${status}) -> ${path.basename(file)}`);
    }
  }

  if (compare) {
    console.log(mismatch ? "\nPERINGATAN: ada output publik yang berubah." : "\nSemua output publik identik dengan baseline.");
    process.exit(mismatch ? 2 : 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
