#!/usr/bin/env node
/**
 * Cabut kanibalisasi frasa homepage dari KONTEN artikel di database.
 *
 * ── MASALAH YANG DISELESAIKAN ───────────────────────────────────────────────
 *
 * Audit produksi 3 September 2026 (crawl 66 URL sitemap) menemukan homepage
 * turun ke halaman 2 untuk "grand duta city parung", sementara
 * `/cara-memilih-rumah-parung` dan `/lokasi-akses-gdc-parung`
 * berperingkat di atasnya. Guard G4–G19 semuanya HIJAU: title, description, dan
 * `<h1>` seluruh halaman non-homepage sudah bersih. Kanibalisasi yang tersisa
 * ada di dua tempat yang tidak satu pun guard itu periksa, dan keduanya hidup di
 * dalam kolom `artikel.content` (Lexical JSON), bukan di kode:
 *
 *   1. HEADING DI DALAM BODY ARTIKEL. Contoh nyata yang terdeteksi live:
 *        /rumah-di-kawasan-strategis
 *          H2 "Grand Duta City South of Jakarta: Hunian Strategis di Koridor…"
 *        /cluster-rumah-baru-di-parung-bogor
 *          H2 "Mengenal Grand Duta City South of Jakarta"
 *        /perumahan-di-bogor
 *          H2 "17. Grand Duta City South of Jakarta"
 *        /10-pilihan-rumah-di-parung-terbaik-2026
 *          H3 "1. Grand Duta City (GDC) South of Jakarta"
 *      Heading adalah pernyataan struktur dokumen: ia memberi tahu Google topik
 *      sebuah seksi. Heading berisi frasa target di halaman lain = halaman lain
 *      mengklaim topik itu.
 *
 *   2. PENUMPUKAN FRASA DI PROSA. `/cara-memilih-rumah-parung` menyebut
 *      "Grand Duta City Parung" 13x dan "…South of Jakarta" 2x dalam 1.664 kata
 *      isi artikel — densitas 0,90%, LEBIH TINGGI daripada homepage (0,82%).
 *      Untuk query brand, halaman dengan pembahasan entitas paling tebal yang
 *      dipilih Google, dan hari ini itu bukan homepage.
 *
 * ── APA YANG DILAKUKAN SCRIPT INI ───────────────────────────────────────────
 *
 * Mengganti dua frasa milik homepage dengan varian pendek yang SUDAH sah di
 * situs ini (terdaftar sebagai `alternateName` entitas proyek di
 * src/lib/schema.ts, dan sudah dipakai title produksi seperti "Lokasi GDC
 * Parung: 4 Exit Tol ke Jakarta & Depok"):
 *
 *     "Grand Duta City Parung"           -> "GDC Parung"
 *     "Grand Duta City South of Jakarta" -> "GDC South of Jakarta"
 *
 * Dengan tiga batasan yang membuat perubahan ini aman dan tidak berlebihan:
 *
 *   a. HEADING: semua kemunculan diganti. Tidak ada alasan halaman lain
 *      menjadikan frasa target homepage sebagai judul seksi.
 *   b. PROSA: kemunculan PERTAMA di setiap artikel DIPERTAHANKAN. Artikel tetap
 *      boleh menyebut nama proyek secara utuh sekali; yang dicabut adalah
 *      penumpukannya. Ini menjaga tulisan tetap wajar dibaca manusia.
 *   c. NODE `link` TIDAK PERNAH DISENTUH. Anchor text CTA ke homepage —
 *      "Tertarik memiliki hunian di <a>Grand Duta City Parung</a>?" yang
 *      dipasang `ensureCta()` — justru sinyal yang MENDUKUNG homepage, dan
 *      dihitung 9x exact-match pada audit. Mencabutnya akan merugikan.
 *
 * Frasa "Grand Duta City" tanpa "Parung"/"South of Jakarta" (mis. "Fasilitas
 * Kawasan Grand Duta City") SENGAJA DIBIARKAN: ia bukan frasa target yang
 * diperebutkan, dan mengubahnya adalah koreksi berlebih.
 *
 * ── PEMAKAIAN ───────────────────────────────────────────────────────────────
 *
 *   node ./scripts/seo-fix-cannibal-content.cjs            -> dry-run (default)
 *   node ./scripts/seo-fix-cannibal-content.cjs --apply     -> tulis ke DB
 *   node ./scripts/seo-fix-cannibal-content.cjs --slug=x    -> batasi 1 artikel
 *   node ./scripts/seo-fix-cannibal-content.cjs --headings-only
 *
 * IDEMPOTEN: menjalankan ulang setelah `--apply` tidak menghasilkan perubahan
 * apa pun, karena frasa targetnya sudah tidak ada lagi di posisi yang dilarang.
 *
 * HANYA mengubah kolom `content` dan `updated_at`. `title`, `slug`,
 * `seo_meta_*`, `status`, dan `_status` tidak disentuh.
 *
 * Membutuhkan DATABASE_URI di .env.local atau .env.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- script Node CommonJS (.cjs) dijalankan langsung via `node`, mengikuti konvensi scripts/ di repo ini */
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");
const HEADINGS_ONLY = process.argv.includes("--headings-only");
const SLUG_FILTER = (() => {
  const arg = process.argv.find((value) => value.startsWith("--slug="));
  return arg ? arg.slice("--slug=".length) : null;
})();

// ─── Env loader (pola sama dengan scripts/seo-fix-article-meta.cjs) ──────────
//
// Dipanggil dari main(), BUKAN di top-level: fungsi transformasi di bawah diuji
// unit (src/lib/__tests__/seo-cannibal-content.test.ts), dan mengimpor modul ini
// tidak boleh menyuntik variabel environment ke proses test.
function loadEnvFile(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

/**
 * Urutan PENTING: frasa terpanjang lebih dulu. "Grand Duta City Parung South of
 * Jakarta" memuat "Grand Duta City Parung", jadi bila yang pendek diproses lebih
 * dulu hasilnya jadi "GDC Parung South of Jakarta" — bentuk yang tidak ada di
 * daftar mana pun dan menyulitkan verifikasi.
 */
const REPLACEMENTS = [
  { from: "Grand Duta City Parung South of Jakarta", to: "GDC Parung South of Jakarta" },
  { from: "Grand Duta City South of Jakarta", to: "GDC South of Jakarta" },
  { from: "Grand Duta City Parung", to: "GDC Parung" },
];

/** Frasa yang keberadaannya dihitung untuk laporan sebelum/sesudah. */
const RESERVED = ["grand duta city parung", "grand duta city south of jakarta"];

const countReserved = (value) => {
  const haystack = value.toLowerCase();
  return RESERVED.reduce(
    (total, phrase) => total + (haystack.split(phrase).length - 1),
    0,
  );
};

const applyReplacements = (value) =>
  REPLACEMENTS.reduce((acc, rule) => acc.split(rule.from).join(rule.to), value);

const containsReserved = (value) => countReserved(value) > 0;

const collectText = (node) => {
  if (!node || typeof node !== "object") return "";
  const own = typeof node.text === "string" ? node.text : "";
  const kids = Array.isArray(node.children)
    ? node.children.map(collectText).join("")
    : "";
  return own + kids;
};

/**
 * Tulis ulang satu editor state Lexical.
 *
 * Mengembalikan `{ content, changes, straddled }`:
 *   - `changes`   : daftar {scope, before, after} untuk laporan.
 *   - `straddled` : blok yang teks gabungannya memuat frasa target padahal tidak
 *                   ada satu pun text node tunggal yang memuatnya (frasa terpecah
 *                   antar node karena sebagian di-bold). Kasus ini DILAPORKAN,
 *                   bukan ditebak-tebak perbaikannya — memodifikasi pemecahan
 *                   format secara otomatis bisa merusak tampilan artikel.
 */
function rewriteContent(content) {
  if (!content || typeof content !== "object" || !content.root) {
    return { content, changes: [], straddled: [] };
  }

  const changes = [];
  const straddled = [];
  // Kemunculan pertama di prosa dipertahankan. Counter ini berjalan dalam urutan
  // baca (depth-first, mengikuti urutan children) supaya "pertama" berarti
  // benar-benar yang paling atas di artikel.
  let proseAllowanceUsed = false;

  const visit = (node, insideHeading, insideLink) => {
    if (Array.isArray(node)) {
      return node.map((child) => visit(child, insideHeading, insideLink));
    }
    if (!node || typeof node !== "object") return node;

    const type = typeof node.type === "string" ? node.type : "";
    const nextInsideHeading = insideHeading || type === "heading";
    // `autolink` ikut dikecualikan: bentuknya sama dengan `link` di korpus ini.
    const nextInsideLink = insideLink || type === "link" || type === "autolink";

    if (typeof node.text === "string" && containsReserved(node.text)) {
      // Anchor text tautan tidak pernah disentuh — lihat catatan (c) di header.
      if (nextInsideLink) return node;

      if (nextInsideHeading) {
        const after = applyReplacements(node.text);
        changes.push({ scope: "heading", before: node.text, after });
        return { ...node, text: after };
      }

      if (!proseAllowanceUsed) {
        // Kemunculan pertama dibiarkan utuh; jatah untuk artikel ini terpakai.
        proseAllowanceUsed = true;
        return node;
      }

      const after = applyReplacements(node.text);
      changes.push({ scope: "prosa", before: node.text, after });
      return { ...node, text: after };
    }

    if (Array.isArray(node.children)) {
      // Deteksi frasa yang terpecah antar text node (mis. sebagian di-bold).
      const blockText = collectText(node);
      const childHasPhrase = node.children.some(
        (child) => typeof child.text === "string" && containsReserved(child.text),
      );
      const grandchildHasPhrase = node.children.some(
        (child) => Array.isArray(child.children) && containsReserved(collectText(child)),
      );
      if (
        containsReserved(blockText) &&
        !childHasPhrase &&
        !grandchildHasPhrase &&
        !nextInsideLink
      ) {
        straddled.push(blockText.slice(0, 160));
      }

      return {
        ...node,
        children: node.children.map((child) =>
          visit(child, nextInsideHeading, nextInsideLink),
        ),
      };
    }

    return node;
  };

  const nextRoot = visit(content.root, false, false);
  return { content: { ...content, root: nextRoot }, changes, straddled };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const { Client } = require("pg");

  const connectionString = process.env.DATABASE_URI;
  if (!connectionString || connectionString.length < 20) {
    console.error(
      "DATABASE_URI tidak ditemukan (atau masih placeholder) di .env.local / .env.\n" +
        "Script ini membaca dan menulis tabel `artikel`, jadi ia butuh kredensial DB produksi.",
    );
    process.exit(1);
  }

  console.log(
    APPLY
      ? "MODE: --apply (perubahan DITULIS ke database)\n"
      : "MODE: dry-run (tidak ada yang ditulis; tambahkan --apply untuk eksekusi)\n",
  );
  if (HEADINGS_ONLY) console.log("Cakupan dibatasi: HANYA heading.\n");

  const client = new Client({
    connectionString,
    // Provider DB terkelola (Supabase/Neon) mewajibkan TLS. Validasi CA
    // mengikuti DATABASE_SSL_CA bila tersedia, sama seperti runtime aplikasi.
    ssl: process.env.DATABASE_SSL_CA
      ? { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const params = SLUG_FILTER ? [SLUG_FILTER] : [];
    const rows = (
      await client.query(
        `SELECT id, slug, content
           FROM artikel
          WHERE content IS NOT NULL
            ${SLUG_FILTER ? "AND slug = $1" : ""}
          ORDER BY slug`,
        params,
      )
    ).rows;

    console.log(`Artikel dibaca: ${rows.length}\n`);

    let touched = 0;
    let headingChanges = 0;
    let proseChanges = 0;
    const straddledReport = [];

    if (APPLY) await client.query("BEGIN");

    for (const row of rows) {
      const before = countReserved(JSON.stringify(row.content));
      const result = rewriteContent(row.content);

      const relevant = HEADINGS_ONLY
        ? result.changes.filter((change) => change.scope === "heading")
        : result.changes;

      if (result.straddled.length > 0) {
        straddledReport.push({ slug: row.slug, blocks: result.straddled });
      }

      if (relevant.length === 0) continue;

      // Saat --headings-only, bangun ulang konten hanya dengan perubahan heading
      // agar mode ini benar-benar konservatif, bukan sekadar menyaring laporan.
      const nextContent = HEADINGS_ONLY
        ? rewriteHeadingsOnly(row.content)
        : result.content;

      const after = countReserved(JSON.stringify(nextContent));
      touched += 1;
      headingChanges += relevant.filter((c) => c.scope === "heading").length;
      proseChanges += relevant.filter((c) => c.scope === "prosa").length;

      console.log(`${row.slug}  (frasa target: ${before} -> ${after})`);
      for (const change of relevant) {
        console.log(`   [${change.scope}] ${change.before.slice(0, 110)}`);
        console.log(`        -> ${change.after.slice(0, 110)}`);
      }

      if (APPLY) {
        await client.query(
          "UPDATE artikel SET content = $1, updated_at = NOW() WHERE id = $2",
          [nextContent, row.id],
        );
      }
    }

    if (APPLY) await client.query("COMMIT");

    console.log("\n─── Ringkasan ───");
    console.log(`  artikel tersentuh : ${touched}`);
    console.log(`  heading diperbaiki: ${headingChanges}`);
    console.log(`  prosa diperbaiki  : ${proseChanges}`);

    if (straddledReport.length > 0) {
      console.log(
        `\n  PERLU TINJAUAN MANUAL (${straddledReport.length} artikel): frasa target terpecah\n` +
          "  antar beberapa text node karena sebagian diberi format (bold/italic).\n" +
          "  Script tidak mengubahnya otomatis agar formatnya tidak rusak — sunting\n" +
          "  di editor admin bila perlu:",
      );
      for (const item of straddledReport) {
        console.log(`    ${item.slug}`);
        item.blocks.forEach((block) => console.log(`       "${block}"`));
      }
    }

    if (!APPLY) {
      console.log("\n  Tidak ada yang ditulis. Jalankan ulang dengan --apply bila hasil di atas sudah sesuai.");
    }
  } catch (error) {
    if (APPLY) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("\nGagal — transaksi di-ROLLBACK, database tidak berubah.");
    }
    throw error;
  } finally {
    await client.end();
  }
}

/** Varian konservatif: hanya heading, prosa dibiarkan apa adanya. */
function rewriteHeadingsOnly(content) {
  if (!content || typeof content !== "object" || !content.root) return content;

  const visit = (node, insideHeading, insideLink) => {
    if (Array.isArray(node)) {
      return node.map((child) => visit(child, insideHeading, insideLink));
    }
    if (!node || typeof node !== "object") return node;

    const type = typeof node.type === "string" ? node.type : "";
    const nextInsideHeading = insideHeading || type === "heading";
    const nextInsideLink = insideLink || type === "link" || type === "autolink";

    if (typeof node.text === "string") {
      if (nextInsideHeading && !nextInsideLink && containsReserved(node.text)) {
        return { ...node, text: applyReplacements(node.text) };
      }
      return node;
    }

    if (Array.isArray(node.children)) {
      return {
        ...node,
        children: node.children.map((child) =>
          visit(child, nextInsideHeading, nextInsideLink),
        ),
      };
    }

    return node;
  };

  return { ...content, root: visit(content.root, false, false) };
}

// Fungsi transformasi diekspor supaya bisa diuji unit tanpa database
// (src/lib/__tests__/seo-cannibal-content.test.ts). `main()` hanya berjalan bila
// file ini dieksekusi langsung, bukan saat di-`require` oleh test.
module.exports = {
  REPLACEMENTS,
  applyReplacements,
  countReserved,
  rewriteContent,
  rewriteHeadingsOnly,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
