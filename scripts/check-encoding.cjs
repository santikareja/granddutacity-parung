// Cek mojibake pada HTML yang benar-benar dikirim server.
// WAJIB lewat Node: Invoke-WebRequest di Windows PowerShell 5.1 mendekode body
// sebagai Latin-1, sehingga byte UTF-8 yang SAH untuk "²" (0xC2 0xB2) tampak
// seperti mojibake "Â²". Pengukuran itu tidak bisa dipercaya.

// Pasangan dari scripts/fix-mojibake.cjs: yang itu memeriksa SUMBER, yang ini
// memeriksa HTML yang BENAR-BENAR DIKIRIM. Jalankan setelah deploy.
//
//   node ./scripts/check-encoding.cjs https://granddutacitysouthofjakarta.com/
const TARGETS = process.argv.slice(2);
if (TARGETS.length === 0) {
  console.error("Pemakaian: node ./scripts/check-encoding.cjs <url> [url...]");
  process.exit(1);
}

const PATTERNS = [
  ["em dash rusak", "\u00E2\u20AC\u201D"],
  ["en dash rusak", "\u00E2\u20AC\u201C"],
  ["apostrof rusak", "\u00E2\u20AC\u2122"],
  ["superscript rusak", "\u00C2\u00B2"],
  ["middot rusak", "\u00C2\u00B7"],
  ["nbsp rusak", "\u00C2\u00A0"],
];

const GOOD = [
  ["em dash", "\u2014"],
  ["superscript dua", "\u00B2"],
  ["middot", "\u00B7"],
];

const countOf = (text, needle) => text.split(needle).length - 1;

(async () => {
  let totalBad = 0;

  for (const url of TARGETS) {
    const res = await fetch(url, { headers: { "user-agent": "gdc-encoding-check" } });
    const buffer = Buffer.from(await res.arrayBuffer());
    // Dekode eksplisit sebagai UTF-8 — ini titik krusialnya.
    const html = buffer.toString("utf8");

    console.log(`\n${url}  (HTTP ${res.status}, ${buffer.length} byte)`);
    console.log(`  charset header: ${res.headers.get("content-type")}`);

    for (const [label, needle] of PATTERNS) {
      const n = countOf(html, needle);
      if (n > 0) {
        totalBad += n;
        console.log(`  MOJIBAKE ${label}: ${n}`);
        const idx = html.indexOf(needle);
        console.log(`    konteks: ...${html.slice(Math.max(0, idx - 45), idx + 25).replace(/\s+/g, " ")}...`);
      }
    }

    const goodSummary = GOOD.map(([label, needle]) => `${label}=${countOf(html, needle)}`).join(", ");
    console.log(`  karakter benar: ${goodSummary}`);
  }

  console.log(
    totalBad === 0
      ? "\nHASIL: NOL mojibake pada HTML yang dikirim server."
      : `\nHASIL: ${totalBad} mojibake ditemukan.`,
  );
  process.exit(totalBad === 0 ? 0 : 2);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
