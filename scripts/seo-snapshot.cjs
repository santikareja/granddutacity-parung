#!/usr/bin/env node
/**
 * Baseline snapshot SEO — Task 0.1/0.2 spec `seo-cannibalization-and-pseo`.
 *
 * Merekam kondisi SEO setiap URL publik ke satu file JSON. Dipakai untuk:
 *   1. Bukti rollback: kondisi "sebelum" tersimpan permanen.
 *   2. Pembanding pasca-deploy via `scripts/seo-verify.cjs`.
 *
 * Pemakaian:
 *   node ./scripts/seo-snapshot.cjs                          -> snapshot produksi
 *   node ./scripts/seo-snapshot.cjs --label sesudah-fase1    -> suffix nama file
 *   node ./scripts/seo-snapshot.cjs --out baseline.json      -> nama file eksplisit
 *
 * Verifikasi PRA-DEPLOY terhadap build lokal (`npm run build && npm run start`):
 *   node ./scripts/seo-snapshot.cjs --base http://localhost:3000 --static-only \
 *     --out local-sesudah-fase1.json
 *
 * `--static-only` WAJIB untuk localhost: route artikel bergantung DB, dan tanpa
 * kredensial DB semuanya jatuh ke fallback "Artikel Tidak Ditemukan" sehingga
 * tidak sebanding dengan produksi. Prefiks nama file `local-` membuat
 * scripts/seo-verify.cjs mengabaikannya saat memilih pembanding otomatis.
 *
 * CATATAN PENTING soal JSON-LD:
 * Next.js menaruh RSC flight payload di dalam <script>self.__next_f.push(...)</script>,
 * dan payload itu MENGANDUNG string JSON-LD yang sama dengan yang dirender. Mencari
 * substring "application/ld+json" secara naif menghasilkan positif palsu — homepage
 * terhitung 15 padahal hanya 7 blok nyata. Script ini mencocokkan elemen
 * <script type="application/ld+json"> ... </script> secara eksplisit lalu JSON.parse,
 * sehingga hitungannya adalah jumlah blok yang benar-benar dibaca crawler.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- script Node CommonJS (.cjs) dijalankan langsung via `node`, wajib pakai require() */
const fs = require("node:fs");
const path = require("node:path");

const PROD_BASE = "https://granddutacitysouthofjakarta.com";

const SNAP_DIR = path.resolve(
  __dirname,
  "..",
  ".kiro",
  "specs",
  "seo-cannibalization-and-pseo",
  "snapshots",
);

// URL indexable yang TIDAK ada di sitemap.xml (temuan audit C19). Tetap
// di-snapshot karena Task 6.3 akan memasukkannya ke sitemap, dan kita perlu
// kondisi "sebelum"-nya.
const EXTRA_PATHS = ["/disclaimer", "/privacy-policy"];

/**
 * Route yang dirender dari kode, BUKAN dari database. Hanya ini yang sah
 * dibandingkan saat menjalankan snapshot terhadap build lokal.
 */
const STATIC_PATHS = new Set([
  "/",
  "/about",
  "/artikel",
  "/category",
  "/category/panduan-properti",
  "/category/kawasan",
  "/category/seputar-gdc",
  "/author/santika-reza",
  "/cluster-ladera",
  "/cluster-cascada",
  "/pricelist-grand-duta-city",
  "/galeri",
  "/kontak",
  "/cara-beli-kpr",
  "/lokasi-akses-gdc-parung",
  "/update-stok-siteplan-grand-duta-city-parung",
  "/disclaimer",
  "/privacy-policy",
]);

const getArg = (name, fallback) => {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
};

// ---------------------------------------------------------------------------
// Helper HTML
// ---------------------------------------------------------------------------

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&#x27;": "'",
  "&#x2F;": "/",
};

/**
 * Decode entity HTML yang umum + numeric reference.
 * Wajib: `&amp;` dirender sebagai 1 karakter `&`, jadi tanpa decode panjang
 * title/description terhitung salah dan guard G6/G7 jadi tidak akurat.
 */
const decodeEntities = (value) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&[a-z]+;|&#x?[0-9a-f]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);

const stripTags = (value) => value.replace(/<[^>]*>/g, " ");

const collapse = (value) => value.replace(/\s+/g, " ").trim();

const textOf = (html) => collapse(decodeEntities(stripTags(html)));

const firstGroup = (html, regex) => {
  const match = html.match(regex);
  return match ? decodeEntities(collapse(match[1])) : null;
};

/** Ambil isi atribut `content` dari <meta> berdasarkan name/property. */
const metaContent = (html, key) => {
  // Atribut bisa dalam urutan apa pun: content sebelum atau sesudah name.
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]*content="([^"]*)"`, "i"),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]*(?:name|property)="${key}"`, "i"),
  ];
  for (const pattern of patterns) {
    const value = firstGroup(html, pattern);
    if (value !== null) return value;
  }
  return null;
};

const canonicalOf = (html) => {
  const patterns = [
    /<link[^>]+rel="canonical"[^>]*href="([^"]*)"/i,
    /<link[^>]+href="([^"]*)"[^>]*rel="canonical"/i,
  ];
  for (const pattern of patterns) {
    const value = firstGroup(html, pattern);
    if (value !== null) return value;
  }
  return null;
};

const headingsOf = (html, tag) => {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  return [...html.matchAll(regex)].map((match) => textOf(match[1])).filter(Boolean);
};

/**
 * Kumpulkan blok JSON-LD NYATA (bukan yang terduplikasi di RSC flight payload).
 * Mengembalikan { count, types, ids, parseErrors }.
 */
const jsonLdOf = (html) => {
  const regex =
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [...html.matchAll(regex)].map((match) => match[1]);

  const types = [];
  const ids = [];
  let parseErrors = 0;

  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;

    if (typeof node["@type"] === "string") types.push(node["@type"]);
    else if (Array.isArray(node["@type"])) types.push(...node["@type"]);

    if (typeof node["@id"] === "string") ids.push(node["@id"]);

    Object.values(node).forEach(walk);
  };

  for (const block of blocks) {
    try {
      walk(JSON.parse(decodeEntities(block)));
    } catch {
      parseErrors += 1;
    }
  }

  return {
    count: blocks.length,
    types: [...new Set(types)].sort(),
    ids: [...new Set(ids)].sort(),
    parseErrors,
  };
};

// ---------------------------------------------------------------------------
// Pengambilan daftar URL
// ---------------------------------------------------------------------------

/** Ambil path dari sitemap PRODUKSI (sumber kebenaran daftar URL indexable). */
async function collectPaths() {
  const res = await fetch(`${PROD_BASE}/sitemap.xml`, {
    headers: { "user-agent": "gdc-seo-snapshot" },
  });
  if (!res.ok) {
    throw new Error(`Gagal mengambil sitemap.xml: HTTP ${res.status}`);
  }

  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => m[1].trim());

  const paths = locs.map((loc) => {
    const pathname = loc.replace(PROD_BASE, "").trim();
    return pathname === "" ? "/" : pathname;
  });

  for (const extra of EXTRA_PATHS) {
    if (!paths.includes(extra)) paths.push(extra);
  }

  return [...new Set(paths)];
}

// ---------------------------------------------------------------------------
// Snapshot satu URL
// ---------------------------------------------------------------------------

async function snapshotPath(base, pathname) {
  const url = base + pathname;

  let res;
  try {
    // `redirect: "manual"` supaya status 3xx + Location terekam apa adanya.
    // Ini yang memungkinkan seo-verify.cjs mendeteksi rantai redirect.
    res = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": "gdc-seo-snapshot" },
    });
  } catch (err) {
    return { path: pathname, error: err.message };
  }

  const entry = {
    path: pathname,
    httpStatus: res.status,
    redirectLocation: res.headers.get("location") ?? null,
    xRobotsTag: res.headers.get("x-robots-tag") ?? null,
  };

  if (res.status >= 300 && res.status < 400) return entry;

  const html = await res.text();

  const h1 = headingsOf(html, "h1");
  const jsonLd = jsonLdOf(html);

  const title = firstGroup(html, /<title>([\s\S]*?)<\/title>/i);
  const description = metaContent(html, "description");

  return {
    ...entry,
    byteLength: Buffer.byteLength(html, "utf8"),
    title,
    titleLength: title ? title.length : 0,
    description,
    descriptionLength: description ? description.length : 0,
    canonical: canonicalOf(html),
    robots: metaContent(html, "robots"),
    h1Count: h1.length,
    h1: h1,
    h2: headingsOf(html, "h2"),
    ogTitle: metaContent(html, "og:title"),
    ogDescription: metaContent(html, "og:description"),
    ogSiteName: metaContent(html, "og:site_name"),
    jsonLdCount: jsonLd.count,
    jsonLdTypes: jsonLd.types,
    jsonLdIds: jsonLd.ids,
    jsonLdParseErrors: jsonLd.parseErrors,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const base = getArg("--base", PROD_BASE).replace(/\/+$/, "");
  const label = getArg("--label", null);
  const stamp = new Date().toISOString().slice(0, 10);
  const outName =
    getArg("--out", null) ?? `${stamp}${label ? `-${label}` : ""}.json`;

  console.log(`Base    : ${base}`);
  console.log("Mengambil daftar URL dari sitemap produksi...");

  const staticOnly = process.argv.includes("--static-only");
  const allPaths = await collectPaths();
  const paths = staticOnly
    ? allPaths.filter((pathname) => STATIC_PATHS.has(pathname))
    : allPaths;

  if (staticOnly) {
    console.log(
      `Mode --static-only: ${paths.length} route berbasis kode ` +
        `(${allPaths.length - paths.length} route artikel DB dilewati).\n`,
    );
  } else {
    console.log(
      `Ditemukan ${paths.length} URL (termasuk ${EXTRA_PATHS.length} URL legal di luar sitemap).\n`,
    );
  }

  const pages = [];
  for (const pathname of paths) {
    const entry = await snapshotPath(base, pathname);
    pages.push(entry);

    if (entry.error) {
      console.log(`[ERR ] ${pathname} -> ${entry.error}`);
    } else if (entry.httpStatus >= 300 && entry.httpStatus < 400) {
      console.log(`[${entry.httpStatus}] ${pathname} -> ${entry.redirectLocation}`);
    } else {
      console.log(
        `[${entry.httpStatus}] T${entry.titleLength} D${entry.descriptionLength} ` +
          `H1x${entry.h1Count} LD${entry.jsonLdCount}  ${pathname}`,
      );
    }
  }

  fs.mkdirSync(SNAP_DIR, { recursive: true });
  const file = path.join(SNAP_DIR, outName);
  fs.writeFileSync(
    file,
    `${JSON.stringify({ takenAt: new Date().toISOString(), base, pageCount: pages.length, pages }, null, 2)}\n`,
  );

  // Ringkasan invarian homepage — dicetak eksplisit karena R1 menjadikannya
  // syarat yang tidak bisa dinegosiasi di seluruh fase.
  const home = pages.find((page) => page.path === "/");
  console.log("\n--- Invarian homepage (R1) ---");
  if (home) {
    console.log(`  title      : ${home.title} (${home.titleLength} char)`);
    console.log(`  description: ${home.descriptionLength} char`);
    console.log(`  canonical  : ${home.canonical}`);
    console.log(`  robots     : ${home.robots}`);
    console.log(`  h1 (${home.h1Count})   : ${home.h1.join(" | ")}`);
    console.log(`  blok JSON-LD: ${home.jsonLdCount} -> ${home.jsonLdTypes.join(", ")}`);
  } else {
    console.log("  TIDAK DITEMUKAN — snapshot tidak valid.");
  }

  console.log(`\nTersimpan: ${path.relative(process.cwd(), file)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
