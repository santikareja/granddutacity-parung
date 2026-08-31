/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Sapu bersih mojibake double-encoded UTF-8 di seluruh src/.
 *
 * Kelas bug ini muncul saat file UTF-8 pernah dibaca sebagai Windows-1252 lalu
 * disimpan ulang sebagai UTF-8, sehingga satu karakter jadi dua-tiga byte
 * sampah. Efeknya terlihat langsung oleh pengunjung: "m²" jadi "mÂ²",
 * "—" jadi "â€”".
 *
 * Sudah ditemukan di dua tempat sebelum script ini dibuat:
 *   - faq-kpr.tsx  : em-dash dan en-dash di 6 Q&A homepage (diperbaiki Fase 3)
 *   - product-reveal-card.tsx : "m²" pada label luas bangunan/tanah
 *
 * Pemakaian:
 *   node ./scripts/fix-mojibake.cjs            -> laporan saja (dry run)
 *   node ./scripts/fix-mojibake.cjs --write    -> terapkan perbaikan
 *
 * Jalankan dry run ini setiap kali selesai mengedit file yang memuat karakter
 * non-ASCII lewat tooling Windows — itu jalur paling umum bug ini masuk.
 */
const fs = require("node:fs");
const path = require("node:path");

// Urutan penting: pola tiga-byte harus diperiksa sebelum pola dua-byte,
// supaya "â€”" tidak tertangkap sebagian oleh aturan "Â".
const REPLACEMENTS = [
  ["\u00E2\u20AC\u201D", "\u2014"], // â€" -> em dash
  ["\u00E2\u20AC\u201C", "\u2013"], // â€" -> en dash
  ["\u00E2\u20AC\u2122", "\u2019"], // â€™ -> right single quote
  ["\u00E2\u20AC\u0153", "\u201C"], // â€œ -> left double quote
  ["\u00E2\u20AC\u009D", "\u201D"], // -> right double quote
  ["\u00E2\u20AC\u00A6", "\u2026"], // â€¦ -> ellipsis
  ["\u00E2\u20AC\u00A2", "\u2022"], // â€¢ -> bullet
  ["\u00C2\u00B2", "\u00B2"], // Â² -> superscript two
  ["\u00C2\u00B3", "\u00B3"], // Â³ -> superscript three
  ["\u00C2\u00B7", "\u00B7"], // Â· -> middle dot
  ["\u00C2\u00A0", "\u00A0"], // Â  -> nbsp
  ["\u00C2\u00AE", "\u00AE"], // Â® -> registered
  ["\u00C2\u00B0", "\u00B0"], // Â° -> degree
];

const EXT = new Set([".ts", ".tsx", ".css", ".md", ".json"]);
const write = process.argv.includes("--write");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, out);
    } else if (EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

let totalFiles = 0;
let totalHits = 0;

for (const file of walk("src")) {
  const original = fs.readFileSync(file, "utf8");
  let updated = original;
  const found = [];

  for (const [bad, good] of REPLACEMENTS) {
    let count = 0;
    let idx = updated.indexOf(bad);
    while (idx !== -1) {
      count += 1;
      idx = updated.indexOf(bad, idx + bad.length);
    }
    if (count > 0) {
      found.push(`${JSON.stringify(bad)} x${count} -> ${JSON.stringify(good)}`);
      updated = updated.split(bad).join(good);
    }
  }

  if (found.length > 0) {
    totalFiles += 1;
    totalHits += found.length;
    console.log(`\n${file.replace(/\\/g, "/")}`);
    found.forEach((line) => console.log(`  ${line}`));
    if (write) {
      fs.writeFileSync(file, updated, "utf8");
      console.log("  -> DIPERBAIKI");
    }
  }
}

console.log(
  `\n${totalFiles} file, ${totalHits} pola mojibake. ${write ? "Sudah diperbaiki." : "Dry run — jalankan dengan --write untuk menerapkan."}`,
);
