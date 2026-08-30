#!/usr/bin/env node
/**
 * Verifikasi regresi SEO — Task 0.4 spec `seo-cannibalization-and-pseo`.
 *
 * Membandingkan dua snapshot dari `scripts/seo-snapshot.cjs` dan KELUAR DENGAN
 * KODE 2 bila menemukan regresi. Ini gerbang terakhir sebelum sebuah fase
 * dinyatakan selesai (requirements R2, R9).
 *
 * Pemakaian:
 *   node ./scripts/seo-snapshot.cjs --label sesudah-fase1
 *   node ./scripts/seo-verify.cjs                          -> baseline vs snapshot terbaru
 *   node ./scripts/seo-verify.cjs --base-file 2026-08-30-baseline-pra-fase1.json --head-file X.json
 *
 * REGRESI (exit 2):
 *   F1  URL berubah 200 -> 404/410                     (R2: nol URL mati)
 *   F2  rantai redirek: tujuan redirek ternyata redirek (R2)
 *   F3  invarian homepage berubah: canonical/robots/jumlah h1  (R1)
 *   F4  muncul title duplikat baru                     (R3)
 *   F5  muncul description duplikat baru               (R3)
 *   F6  jumlah halaman ber-<h1> ganda bertambah        (satu H1 per halaman)
 *   F7  URL hilang dari snapshot tanpa redirek         (R2)
 *
 * PERUBAHAN YANG DISENGAJA (dilaporkan, tidak menggagalkan):
 *   title, description, h1, jumlah/`@type` JSON-LD, byteLength.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- script Node CommonJS (.cjs) dijalankan langsung via `node`, wajib pakai require() */
const fs = require("node:fs");
const path = require("node:path");

const SNAP_DIR = path.resolve(
  __dirname,
  "..",
  ".kiro",
  "specs",
  "seo-cannibalization-and-pseo",
  "snapshots",
);

const getArg = (name, fallback) => {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
};

function loadSnapshots() {
  if (!fs.existsSync(SNAP_DIR)) {
    throw new Error(`Direktori snapshot belum ada: ${SNAP_DIR}`);
  }

  // Snapshot berprefiks "local-" DIABAIKAN saat pemilihan otomatis.
  // Alasan: snapshot dari localhost tidak sebanding dengan produksi karena
  // route artikel bergantung DB — tanpa kredensial DB semuanya jatuh ke
  // fallback "Artikel Tidak Ditemukan" dan akan terdeteksi sebagai puluhan
  // title duplikat baru (F4) padahal itu artefak lingkungan, bukan regresi.
  // Untuk membandingkannya secara sengaja, sebut file-nya via --head-file.
  const files = fs
    .readdirSync(SNAP_DIR)
    .filter((name) => name.endsWith(".json"))
    .filter((name) => !name.startsWith("local-"))
    .sort();

  if (files.length === 0) {
    throw new Error("Belum ada snapshot. Jalankan scripts/seo-snapshot.cjs lebih dulu.");
  }

  const baseName =
    getArg("--base-file", null) ??
    files.find((name) => name.includes("baseline")) ??
    files[0];

  const headName =
    getArg("--head-file", null) ??
    [...files].reverse().find((name) => name !== baseName);

  if (!headName) {
    throw new Error(
      "Hanya ada satu snapshot. Jalankan scripts/seo-snapshot.cjs lagi setelah deploy untuk membandingkan.",
    );
  }

  const read = (name) =>
    JSON.parse(fs.readFileSync(path.join(SNAP_DIR, name), "utf8"));

  const base = read(baseName);
  const head = read(headName);

  // PORT diabaikan saat membandingkan base: `next start` yang di-restart
  // memakai port baru setiap kali (workaround untuk terminal yang menyajikan
  // `.next` basi), jadi localhost:3100 vs localhost:3600 adalah LINGKUNGAN YANG
  // SAMA. Yang berbahaya adalah membandingkan localhost dengan produksi, dan
  // itu ditentukan hostname, bukan port.
  const hostOf = (value) => {
    try {
      return new URL(value).hostname;
    } catch {
      return value;
    }
  };

  if (
    hostOf(base.base) !== hostOf(head.base) &&
    !process.argv.includes("--allow-base-mismatch")
  ) {
    throw new Error(
      `Base berbeda: baseline "${base.base}" vs terbaru "${head.base}".\n` +
        "Membandingkan localhost dengan produksi menghasilkan alarm palsu karena\n" +
        "route artikel bergantung DB. Pakai --allow-base-mismatch bila memang disengaja.",
    );
  }

  return { baseName, headName, base, head };
}

const byPath = (snapshot) =>
  new Map(snapshot.pages.map((page) => [page.path, page]));

const isRedirect = (page) => page.httpStatus >= 300 && page.httpStatus < 400;
const isGone = (page) => page.httpStatus === 404 || page.httpStatus === 410;

/** Ubah Location absolut/relatif menjadi path untuk dibandingkan antar-map. */
const locationToPath = (location, base) => {
  if (!location) return null;
  try {
    return new URL(location, base).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return location;
  }
};

const duplicatesOf = (pages, field) => {
  const seen = new Map();
  for (const page of pages) {
    const value = page[field];
    if (!value) continue;
    if (!seen.has(value)) seen.set(value, []);
    seen.get(value).push(page.path);
  }
  return [...seen.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([value, paths]) => ({ value, paths }));
};

function main() {
  const { baseName, headName, base, head } = loadSnapshots();

  console.log(`Baseline : ${baseName}  (${base.pageCount} URL, ${base.takenAt})`);
  console.log(`Terbaru  : ${headName}  (${head.pageCount} URL, ${head.takenAt})\n`);

  const baseMap = byPath(base);
  const headMap = byPath(head);
  const failures = [];
  const changes = [];

  // --- F1 & F7: URL mati --------------------------------------------------
  for (const [pathname, before] of baseMap) {
    const after = headMap.get(pathname);

    if (!after) {
      failures.push(`F7 ${pathname} — hilang dari snapshot terbaru tanpa redirek`);
      continue;
    }
    if (!isGone(before) && isGone(after)) {
      failures.push(
        `F1 ${pathname} — berubah ${before.httpStatus} -> ${after.httpStatus} (URL mati)`,
      );
    }
    if (before.httpStatus !== after.httpStatus) {
      changes.push(
        `    status  ${pathname}: ${before.httpStatus} -> ${after.httpStatus}` +
          (after.redirectLocation ? ` (${after.redirectLocation})` : ""),
      );
    }
  }

  // --- F2: rantai redirek -------------------------------------------------
  for (const [pathname, page] of headMap) {
    if (!isRedirect(page)) continue;
    const target = locationToPath(page.redirectLocation, head.base);
    const targetPage = headMap.get(target);
    if (targetPage && isRedirect(targetPage)) {
      failures.push(
        `F2 ${pathname} -> ${target} -> ${targetPage.redirectLocation} (rantai redirek)`,
      );
    }
    if (targetPage && isGone(targetPage)) {
      failures.push(`F2 ${pathname} -> ${target} (tujuan redirek ${targetPage.httpStatus})`);
    }
  }

  // --- F3: invarian homepage ---------------------------------------------
  const homeBefore = baseMap.get("/");
  const homeAfter = headMap.get("/");

  if (!homeAfter) {
    failures.push("F3 homepage tidak ada di snapshot terbaru");
  } else if (homeBefore) {
    for (const field of ["canonical", "robots", "h1Count"]) {
      if (String(homeBefore[field]) !== String(homeAfter[field])) {
        failures.push(
          `F3 homepage.${field} berubah: "${homeBefore[field]}" -> "${homeAfter[field]}" (dilarang R1)`,
        );
      }
    }
    // Title/description homepage BOLEH berubah, tapi hanya di Fase 8. Karena
    // itu perubahannya dilaporkan menonjol, bukan disembunyikan di daftar
    // perubahan biasa.
    for (const field of ["title", "description"]) {
      if (homeBefore[field] !== homeAfter[field]) {
        changes.push(
          `    [!] homepage.${field} BERUBAH — pastikan ini memang Fase 8:\n` +
            `        sebelum: ${homeBefore[field]}\n` +
            `        sesudah: ${homeAfter[field]}`,
        );
      }
    }
  }

  // --- F4 & F5: duplikat baru --------------------------------------------
  const liveHead = head.pages.filter((page) => page.httpStatus === 200);
  const liveBase = base.pages.filter((page) => page.httpStatus === 200);

  for (const [code, field] of [
    ["F4", "title"],
    ["F5", "description"],
  ]) {
    const before = new Set(duplicatesOf(liveBase, field).map((d) => d.value));
    for (const dup of duplicatesOf(liveHead, field)) {
      if (!before.has(dup.value)) {
        failures.push(
          `${code} ${field} duplikat BARU pada ${dup.paths.join(", ")}: "${dup.value}"`,
        );
      }
    }
  }

  // --- F6: H1 ganda -------------------------------------------------------
  const multiH1 = (pages) =>
    pages.filter((page) => (page.h1Count ?? 0) > 1).map((page) => page.path);
  const h1Before = multiH1(liveBase);
  const h1After = multiH1(liveHead);

  for (const pathname of h1After) {
    if (!h1Before.includes(pathname)) {
      failures.push(`F6 ${pathname} — kini punya lebih dari satu <h1>`);
    }
  }
  const h1Fixed = h1Before.filter((pathname) => !h1After.includes(pathname));

  // --- Perubahan yang disengaja ------------------------------------------
  for (const [pathname, before] of baseMap) {
    const after = headMap.get(pathname);
    if (!after || pathname === "/") continue;

    for (const field of ["title", "description", "canonical", "robots", "ogSiteName"]) {
      if (before[field] !== after[field]) {
        changes.push(`    ${field} ${pathname}:\n      - ${before[field]}\n      + ${after[field]}`);
      }
    }
    if ((before.jsonLdCount ?? 0) !== (after.jsonLdCount ?? 0)) {
      changes.push(
        `    jsonLd ${pathname}: ${before.jsonLdCount} -> ${after.jsonLdCount} blok`,
      );
    }
    if ((before.h1Count ?? 0) !== (after.h1Count ?? 0)) {
      changes.push(`    h1Count ${pathname}: ${before.h1Count} -> ${after.h1Count}`);
    }
  }

  // --- URL baru -----------------------------------------------------------
  const added = [...headMap.keys()].filter((pathname) => !baseMap.has(pathname));

  // --- Laporan ------------------------------------------------------------
  if (added.length > 0) {
    console.log(`URL baru (${added.length}):`);
    added.forEach((pathname) => console.log(`    + ${pathname}`));
    console.log("");
  }

  if (h1Fixed.length > 0) {
    console.log(`H1 ganda yang sudah diperbaiki (${h1Fixed.length}):`);
    h1Fixed.forEach((pathname) => console.log(`    ok ${pathname}`));
    console.log("");
  }

  if (changes.length > 0) {
    console.log(`Perubahan terdeteksi (${changes.length}) — pastikan semuanya disengaja:`);
    changes.forEach((line) => console.log(line));
    console.log("");
  } else {
    console.log("Tidak ada perubahan metadata terdeteksi.\n");
  }

  if (failures.length > 0) {
    console.log(`REGRESI (${failures.length}):`);
    failures.forEach((line) => console.log(`  X ${line}`));
    console.log("\nGAGAL — perbaiki atau rollback sebelum menutup fase.");
    process.exit(2);
  }

  console.log("LOLOS — tidak ada regresi. Semua perubahan di atas bersifat disengaja.");
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
