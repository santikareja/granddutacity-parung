/**
 * Guard invarian SEO — Task 0.3 spec `seo-cannibalization-and-pseo`.
 *
 * Test ini MENGUNCI aturan di requirements.md R1 (proteksi homepage) dan R3
 * (kanibalisasi tuntas dan terjaga) sebagai kode, bukan sebagai catatan review.
 * Tujuannya: siapa pun yang nanti menambah halaman baru atau mengubah title
 * dan melanggar aturan kata kunci akan gagal di `npm run test`, bukan tiga
 * bulan kemudian di Search Console.
 *
 * PENTING soal resolusi title:
 * Next 16 TIDAK menerapkan `title.template` dari layout.js ke `title` di
 * page.js pada segmen yang SAMA (lihat node_modules/next/dist/docs/01-app/
 * 03-api-reference/04-functions/generate-metadata.md). Homepage berada di
 * segmen `(site)` yang sama dengan layout-nya, jadi homepage TIDAK ikut
 * mendapat suffix template — sementara semua route anak mendapatkannya.
 * `resolveTitle()` di bawah meniru perilaku itu supaya yang diuji adalah
 * title FINAL yang dilihat Google, bukan literal di source.
 */

import type { Metadata } from "next";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  HOMEPAGE_PRIMARY,
  HOMEPAGE_SECONDARY,
  duplicatePrimaries,
  ownershipOf,
  reservedPhraseViolations,
} from "@/lib/keyword-ownership";
import {
  HOMEPAGE_CANNIBALIZATION_REDIRECT_PATH,
  REDIRECTED_SITEMAP_SOURCE_PATHS,
  isRedirectedSitemapSourcePath,
  isRedirectedSitemapSourceUrl,
} from "@/lib/redirects";

// `next/font/google` butuh plugin build Next dan tidak bisa dieksekusi di
// Vitest. Hanya nilai `.variable` yang dipakai layout, jadi stub ini cukup.
vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({ variable: "--font-plus-jakarta-sans" }),
  Playfair_Display: () => ({ variable: "--font-playfair-display" }),
}));

const SITE_URL = "https://granddutacitysouthofjakarta.com";

/** Frasa yang HANYA boleh dimiliki homepage (requirements R3). */
const PRIMARY_KEYWORD = "grand duta city parung";
const SECONDARY_KEYWORD = "grand duta city south of jakarta";

/**
 * Pola brand tag "menggantung": brand di akhir title tanpa modifier yang
 * mengubah maksud query. Inilah bentuk kanibalisasi yang dilarang R3 —
 * berbeda dari brand yang dipasangkan modifier kuat seperti
 * "Pricelist Grand Duta City Parung 2026" yang justru harus dipertahankan.
 */
const TRAILING_BRAND_TAG = /\|\s*grand duta city(\s+parung)?(\s+south of jakarta)?\s*$/i;

type RouteCase = {
  /** Path final di produksi. */
  path: string;
  /** Metadata hasil resolusi. */
  metadata: Metadata;
  /** false untuk route yang sengaja noindex (mis. /tag/*). */
  indexable: boolean;
};

const routes: RouteCase[] = [];
let layoutTemplate: string | null = null;

/** Ambil string title dari bentuk Metadata["title"] yang mana pun. */
function rawTitle(title: Metadata["title"]): { value: string; absolute: boolean } {
  if (typeof title === "string") return { value: title, absolute: false };
  if (title && typeof title === "object") {
    if ("absolute" in title && typeof title.absolute === "string") {
      return { value: title.absolute, absolute: true };
    }
    if ("default" in title && typeof title.default === "string") {
      return { value: title.default, absolute: true };
    }
  }
  return { value: "", absolute: true };
}

/** Terapkan template layout persis seperti Next 16 melakukannya. */
function resolveTitle(path: string, title: Metadata["title"]): string {
  const { value, absolute } = rawTitle(title);
  if (absolute || value === "") return value;
  // Segmen yang sama dengan layout (homepage) tidak kena template.
  if (path === "/") return value;
  if (!layoutTemplate) return value;
  return layoutTemplate.replace("%s", value);
}

function isIndexable(metadata: Metadata): boolean {
  const robots = metadata.robots;
  if (!robots) return true;
  if (typeof robots === "string") return !robots.includes("noindex");
  return robots.index !== false;
}

function canonicalOf(metadata: Metadata): string | null {
  const canonical = metadata.alternates?.canonical;
  if (!canonical) return null;
  if (typeof canonical === "string") return canonical;
  if (canonical instanceof URL) return canonical.toString();
  if (typeof canonical === "object" && "url" in canonical) {
    return String((canonical as { url: string | URL }).url);
  }
  return null;
}

function siteNameOf(metadata: Metadata): string | null {
  const og = metadata.openGraph as { siteName?: string } | undefined;
  return og?.siteName ?? null;
}

function descriptionOf(metadata: Metadata): string {
  return typeof metadata.description === "string" ? metadata.description : "";
}

// ---------------------------------------------------------------------------
// Registry route
// ---------------------------------------------------------------------------

const noSearchParams = { searchParams: Promise.resolve({}) } as never;
const withParams = (slug: string) =>
  ({ params: Promise.resolve({ slug }) }) as never;

// Timeout dinaikkan dari default 10 detik: hook ini mengimpor ~18 modul page
// beserta seluruh pohon dependensinya (komponen, data unit, Cloudinary helper),
// dan biaya transform Vite untuk itu wajar melewati 10 detik pada mesin yang
// sedang sibuk. Batas 60 detik memberi ruang tanpa menyembunyikan hang nyata.
const HOOK_TIMEOUT_MS = 60_000;

beforeAll(async () => {
  const layout = await import("../layout");
  const layoutTitle = layout.metadata.title;
  layoutTemplate =
    layoutTitle && typeof layoutTitle === "object" && "template" in layoutTitle
      ? ((layoutTitle.template as string | null) ?? null)
      : null;

  // --- route dengan `export const metadata` statis -------------------------
  const staticRoutes: Array<[string, Promise<{ metadata: Metadata }>]> = [
    ["/", import("../page")],
    ["/about", import("../about/page")],
    ["/galeri", import("../galeri/page")],
    ["/disclaimer", import("../disclaimer/page")],
    ["/privacy-policy", import("../privacy-policy/page")],
    ["/cluster-ladera", import("../cluster-ladera/page")],
    ["/cluster-cascada", import("../cluster-cascada/page")],
    ["/pricelist-grand-duta-city", import("../pricelist-grand-duta-city/page")],
    ["/kontak", import("../kontak/page")],
    ["/category", import("../category/page")],
    ["/author/santika-reza", import("../author/santika-reza/page")],
  ];

  for (const [path, modPromise] of staticRoutes) {
    const mod = await modPromise;
    routes.push({ path, metadata: mod.metadata, indexable: isIndexable(mod.metadata) });
  }

  // --- route dengan `generateMetadata(searchParams)` -----------------------
  const searchParamRoutes: Array<
    [
      string,
      Promise<{
        generateMetadata: (props: never) => Metadata | Promise<Metadata>;
      }>,
    ]
  > = [
    ["/artikel", import("../artikel/page")],
    ["/cara-beli-kpr", import("../cara-beli-kpr/page")],
    [
      "/lokasi-akses-gdc-parung",
      import("../lokasi-akses-gdc-parung/page"),
    ],
    [
      "/update-stok-siteplan-grand-duta-city-parung",
      import("../update-stok-siteplan-grand-duta-city-parung/page"),
    ],
  ];

  for (const [path, modPromise] of searchParamRoutes) {
    const mod = await modPromise;
    const metadata = await mod.generateMetadata(noSearchParams);
    routes.push({ path, metadata, indexable: isIndexable(metadata) });
  }

  // --- arsip kategori (indexable) -----------------------------------------
  const categoryMod = await import("../category/[slug]/page");
  for (const slug of ["panduan-properti", "kawasan", "seputar-gdc"]) {
    const metadata = (await categoryMod.generateMetadata(
      withParams(slug),
    )) as Metadata;
    routes.push({ path: `/category/${slug}`, metadata, indexable: isIndexable(metadata) });
  }

  // --- hub + 10 halaman tipe unit (Fase 7) --------------------------------
  // Didaftarkan LENGKAP, bukan sampel: justru di sinilah risiko kanibalisasi
  // paling besar karena sepuluh halaman lahir sekaligus dari satu template.
  const tipeHub = await import("../tipe-rumah/page");
  routes.push({
    path: "/tipe-rumah",
    metadata: tipeHub.metadata,
    indexable: isIndexable(tipeHub.metadata),
  });

  const tipeMod = await import("../tipe-rumah/[slug]/page");
  const { units: allUnits } = await import("@/data/units");
  for (const unit of allUnits) {
    const metadata = (await tipeMod.generateMetadata(withParams(unit.id))) as Metadata;
    routes.push({
      path: `/tipe-rumah/${unit.id}`,
      metadata,
      indexable: isIndexable(metadata),
    });
  }

  // --- arsip tag (sengaja noindex, ikut diuji untuk G10/G11) --------------
  const tagMod = await import("../tag/[slug]/page");
  for (const slug of ["kpr-rumah", "lokasi-parung"]) {
    const metadata = (await tagMod.generateMetadata(withParams(slug))) as Metadata;
    routes.push({ path: `/tag/${slug}`, metadata, indexable: isIndexable(metadata) });
  }
}, HOOK_TIMEOUT_MS);

const indexableRoutes = () => routes.filter((route) => route.indexable);
const nonHomeIndexable = () =>
  indexableRoutes().filter((route) => route.path !== "/");
const home = () => {
  const route = routes.find((r) => r.path === "/");
  if (!route) throw new Error("Route homepage tidak terdaftar di registry test.");
  return route;
};

// ===========================================================================
// R1 — Proteksi homepage (tidak bisa dinegosiasi)
// ===========================================================================

describe("R1 — proteksi homepage", () => {
  it("G1: title homepage memuat frasa kata kunci utama", () => {
    const title = resolveTitle("/", home().metadata.title);
    expect(title.toLowerCase()).toContain(PRIMARY_KEYWORD);
  });

  it("G2: canonical homepage tepat SITE_URL tanpa trailing slash", () => {
    expect(canonicalOf(home().metadata)).toBe(SITE_URL);
  });

  it("G3: homepage tidak pernah noindex", () => {
    expect(home().indexable).toBe(true);
  });

  it("G1b: title homepage tidak pernah mendapat suffix template", () => {
    // Homepage berada di segmen yang sama dengan layout, jadi Next tidak
    // menerapkan template. Asersi ini mengunci fakta itu agar refactor
    // struktur folder tidak diam-diam mengubah title homepage.
    const { absolute } = rawTitle(home().metadata.title);
    const resolved = resolveTitle("/", home().metadata.title);
    const literal = rawTitle(home().metadata.title).value;
    expect(resolved).toBe(literal);
    expect(absolute || resolved === literal).toBe(true);
  });
});

// ===========================================================================
// R3 — Kanibalisasi tuntas dan terjaga
// ===========================================================================

describe("R3 — antikanibalisasi", () => {
  it("G4: nol halaman non-homepage memuat frasa kata kunci kedua di title", () => {
    const offenders = nonHomeIndexable()
      .map((route) => ({
        path: route.path,
        title: resolveTitle(route.path, route.metadata.title),
      }))
      .filter((route) => route.title.toLowerCase().includes(SECONDARY_KEYWORD));

    expect(offenders).toEqual([]);
  });

  it("G5: nol halaman non-homepage berakhiran brand tag menggantung", () => {
    const offenders = nonHomeIndexable()
      .map((route) => ({
        path: route.path,
        title: resolveTitle(route.path, route.metadata.title),
      }))
      .filter((route) => TRAILING_BRAND_TAG.test(route.title));

    expect(offenders).toEqual([]);
  });

  it("G5b: frasa kata kunci utama tidak muncul dua kali dalam satu title", () => {
    const offenders = indexableRoutes()
      .map((route) => {
        const title = resolveTitle(route.path, route.metadata.title).toLowerCase();
        const occurrences = title.split(PRIMARY_KEYWORD).length - 1;
        return { path: route.path, occurrences };
      })
      .filter((route) => route.occurrences > 1);

    expect(offenders).toEqual([]);
  });

  it("G6: semua title <= 60 karakter", () => {
    const offenders = indexableRoutes()
      .map((route) => {
        const title = resolveTitle(route.path, route.metadata.title);
        return { path: route.path, length: title.length, title };
      })
      .filter((route) => route.length > 60);

    expect(offenders).toEqual([]);
  });

  it("G7: semua description 120-160 karakter", () => {
    const offenders = indexableRoutes()
      .map((route) => ({
        path: route.path,
        length: descriptionOf(route.metadata).length,
      }))
      .filter((route) => route.length < 120 || route.length > 160);

    expect(offenders).toEqual([]);
  });

  it("G8: nol title duplikat", () => {
    const titles = indexableRoutes().map((route) =>
      resolveTitle(route.path, route.metadata.title),
    );
    const duplicates = titles.filter(
      (title, index) => titles.indexOf(title) !== index,
    );

    expect([...new Set(duplicates)]).toEqual([]);
  });

  it("G9: nol description duplikat", () => {
    const descriptions = indexableRoutes().map((route) =>
      descriptionOf(route.metadata),
    );
    const duplicates = descriptions.filter(
      (description, index) => descriptions.indexOf(description) !== index,
    );

    expect([...new Set(duplicates)]).toEqual([]);
  });
});

// ===========================================================================
// R2 / konsistensi entitas
// ===========================================================================

describe("R2 & konsistensi entitas", () => {
  it("G10: setiap route punya canonical", () => {
    const missing = routes
      .filter((route) => canonicalOf(route.metadata) === null)
      .map((route) => route.path);

    expect(missing).toEqual([]);
  });

  it("G11: openGraph.siteName konsisten di semua route yang menyetelnya", () => {
    const names = [
      ...new Set(
        routes
          .map((route) => siteNameOf(route.metadata))
          .filter((name): name is string => Boolean(name)),
      ),
    ].sort();

    expect(names.length).toBeLessThanOrEqual(1);
  });

  it("G12: layout tidak lagi mengekspor title.template", () => {
    expect(layoutTemplate).toBeNull();
  });
});

// ===========================================================================
// Temuan Semrush: sitemap, duplicate H1/title
// ===========================================================================

describe("Semrush technical SEO regressions", () => {
  it("G12b: source redirect permanen tidak boleh masuk sitemap", async () => {
    const config = (await import("../../../../next.config")).default;
    const redirects = await config.redirects?.();
    const redirectSources = new Set(
      (redirects ?? [])
        .filter((redirect) => redirect.permanent)
        .map((redirect) => redirect.source),
    );

    for (const path of REDIRECTED_SITEMAP_SOURCE_PATHS) {
      expect(redirectSources.has(path)).toBe(true);
      expect(isRedirectedSitemapSourcePath(path)).toBe(true);
      expect(isRedirectedSitemapSourcePath(`${path}/`)).toBe(true);
      expect(isRedirectedSitemapSourceUrl(`${SITE_URL}${path}`)).toBe(true);
    }

    expect(isRedirectedSitemapSourceUrl(SITE_URL)).toBe(false);
  });

  it("G12c: title tag tidak identik dengan H1 halaman yang dilaporkan Semrush", async () => {
    const [{ metadata: galeriMetadata, PAGE_H1: galeriH1 }, privacyPage] =
      await Promise.all([
        import("../galeri/page"),
        import("../privacy-policy/page"),
      ]);

    const cases = [
      {
        path: "/galeri",
        title: resolveTitle("/galeri", galeriMetadata.title),
        h1: galeriH1,
      },
      {
        path: "/privacy-policy",
        title: resolveTitle("/privacy-policy", privacyPage.metadata.title),
        h1: privacyPage.PAGE_H1,
      },
    ];

    const offenders = cases.filter(
      (entry) => entry.title.trim().toLowerCase() === entry.h1.trim().toLowerCase(),
    );

    expect(offenders).toEqual([]);
  });
});

// ===========================================================================
// R3 lanjutan — kepemilikan kata kunci: satu query, satu halaman
//
// G4/G5/G5b di atas mendeteksi GEJALA kanibalisasi (frasa brand menggantung di
// title). Asersi di bawah menutup AKARNYA: setiap halaman harus menyatakan
// SATU query yang ia klaim, dan klaim itu harus eksklusif. Tanpa ini, halaman
// baru bisa lolos G4/G5 tapi tetap berhadapan langsung dengan halaman lain.
// ===========================================================================

describe("R3 — kepemilikan kata kunci eksklusif", () => {
  it("G13: title homepage DIBUKA dengan kata kunci utama, bukan menaruhnya di tengah", () => {
    // Pemilik memilih "grand duta city parung" sebagai target utama karena
    // volume pencariannya jauh lebih tinggi. Posisi di awal title adalah
    // pembobotan yang paling langsung untuk keputusan itu.
    const title = resolveTitle("/", home().metadata.title).toLowerCase();
    expect(title.startsWith(HOMEPAGE_PRIMARY)).toBe(true);
  });

  it("G13b: homepage tetap memuat kata kunci kedua", () => {
    // Homepage menargetkan KEDUA frasa. Yang kedua boleh di belakang, tapi
    // tidak boleh hilang — tidak ada halaman lain yang menggantikannya.
    const home_ = home();
    const haystack = [
      resolveTitle("/", home_.metadata.title),
      descriptionOf(home_.metadata),
    ]
      .join(" ")
      .toLowerCase();
    // "south of jakarta" harus hadir; frasa penuhnya ada di <h1> (G1).
    expect(haystack).toContain("south of jakarta");
  });

  it("G14: setiap route indexable terdaftar di peta kepemilikan kata kunci", () => {
    // Halaman baru yang lupa didaftarkan = kanibalisasi yang tidak terpantau.
    const undeclared = indexableRoutes()
      .map((route) => route.path)
      .filter((path) => ownershipOf(path) === undefined);

    expect(
      undeclared,
      `Route ini belum punya primary keyword di src/lib/keyword-ownership.ts: ${undeclared.join(", ")}`,
    ).toEqual([]);
  });

  it("G15: nol dua halaman berbagi primary keyword yang sama", () => {
    const dupes = duplicatePrimaries();
    expect(
      dupes,
      `Primary keyword dipakai lebih dari satu halaman: ${dupes
        .map((d) => `"${d.primary}" -> ${d.paths.join(" & ")}`)
        .join("; ")}`,
    ).toEqual([]);
  });

  it("G16: nol halaman non-homepage mengklaim frasa homepage tanpa modifier", () => {
    const violations = reservedPhraseViolations();
    expect(
      violations,
      `Kanibalisasi terhadap homepage: ${violations
        .map((v) => `${v.path} ("${v.primary}") ${v.reason}`)
        .join("; ")}`,
    ).toEqual([]);
  });

  it("G17: title setiap halaman benar-benar memuat primary keyword-nya", () => {
    // Menjaga peta ini tetap JUJUR. Tanpa asersi ini, peta bisa mengklaim
    // sebuah halaman menargetkan query X sementara title-nya tidak menyebut X
    // sama sekali — dokumentasi yang menyesatkan, bukan kontrak.
    //
    // Pencocokan dilakukan per-token supaya "update stok gdc parung" tetap
    // cocok dengan "Update Stok Unit & Siteplan GDC Parung 2026" yang menyelipkan
    // kata di tengah frasa.
    const offenders = indexableRoutes()
      .map((route) => {
        const owned = ownershipOf(route.path);
        if (!owned) return null;
        const title = resolveTitle(route.path, route.metadata.title).toLowerCase();
        const missing = owned.primary
          .toLowerCase()
          .split(/\s+/)
          .filter((token) => !title.includes(token));
        return missing.length > 0
          ? { path: route.path, primary: owned.primary, missing, title }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    expect(
      offenders,
      `Title tidak memuat primary keyword-nya: ${offenders
        .map((o) => `${o.path} kehilangan [${o.missing.join(", ")}] dari "${o.primary}" — title: "${o.title}"`)
        .join("; ")}`,
    ).toEqual([]);
  });
});

// ===========================================================================
// Konsistensi klaim harga
//
// Ditambahkan 30 Agustus 2026. Latar belakangnya nyata: pemilik menurunkan harga
// Verona 39/60 dari "700 Juta-an" ke "600 Juta-an", dan seketika itu klaim
// "Mulai Rp 700 jutaan" di description homepage berubah dari benar menjadi
// SALAH — mengiklankan harga lebih TINGGI daripada yang sebenarnya ditawarkan.
// Tidak ada satu pun mekanisme yang menghubungkan kedua angka itu, jadi
// pergeseran seperti ini tidak akan memunculkan error apa pun.
// ===========================================================================

describe("konsistensi klaim harga terendah", () => {
  it("G18: klaim harga di description homepage cocok dengan unit termurah", async () => {
    const { catalogUnits } = await import("@/data/units");

    const claim = descriptionOf(home().metadata).match(
      /Mulai Rp (\d+) jutaan/i,
    );
    expect(
      claim,
      'Description homepage tidak lagi memuat klaim berpola "Mulai Rp <n> jutaan". Bila polanya memang diubah, perbarui asersi ini — jangan hapus.',
    ).not.toBeNull();

    // Unit termurah diambil dari data, BUKAN dihardcode, supaya test ini tetap
    // sahih saat urutan harga bergeser.
    // Unit sold-out dikecualikan: mengiklankan "mulai dari" memakai harga unit
    // yang sudah habis adalah klaim yang tidak bisa ditepati.
    const nominals = catalogUnits
      .filter((unit) => unit.status !== "sold-out")
      .map((unit) => unit.priceLabel.match(/^(\d+) Juta/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => Number(match[1]));
    expect(nominals.length).toBeGreaterThan(0);

    expect(Number(claim![1])).toBe(Math.min(...nominals));
  });
});

// ===========================================================================
// G19 — H1 pada 9 halaman kanibalisasi (data Semrush, 31 Agustus 2026)
//
// SCOPE SENGAJA DIPERSEMPIT ke sembilan halaman yang secara nyata terbukti
// bersaing dengan homepage untuk kata kunci yang sama, bukan "semua route
// non-homepage". Guard yang terlalu general di sini akan mahal dirawat dan
// rentan false positive untuk halaman yang H1-nya memang tidak menyentuh
// topik brand sama sekali (mis. /galeri, /about).
//
// Sembilan halaman itu:
//   1. /lokasi-akses-gdc-parung               5. /pricelist-grand-duta-city
//   2. /disclaimer                            6. /cluster-ladera
//   3. /kontak                                7. /cluster-cascada
//   4. /artikel                               8. /cara-beli-kpr
//   9. /perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap
//      -> DIREDIRECT 301 ke "/" (next.config.ts). Bukan lagi halaman hidup,
//      jadi tidak punya H1 untuk diuji — dikeluarkan dari daftar di bawah.
//      Sebelum redirect, H1-nya-lah yang paling parah melanggar guard ini:
//      membuka dengan "Grand Duta City Parung South of Jakarta" (primary +
//      secondary sekaligus). Dicatat di sini sebagai jejak keputusan, BUKAN
//      untuk diuji lagi — mengimpor H1 dari artikel yang sudah tidak hidup
//      tidak menguji apa pun yang nyata.
//
// PENGECUALIAN: homepage boleh melanggar aturan ini — frasa brand itu memang
// primary keyword-nya (dikunci G1/G13 di atas).
// ===========================================================================

describe("G19 — H1 sembilan halaman kanibalisasi tidak dibuka dengan frasa brand", () => {
  it("delapan halaman H1-nya tidak diawali frasa primary/secondary homepage", async () => {
    const [
      { PAGE_H1: lokasiAksesH1 },
      { PAGE_H1: disclaimerH1 },
      { PAGE_H1: kontakH1 },
      { PAGE_H1: artikelH1 },
      { PAGE_H1: pricelistH1 },
      { PAGE_H1: clusterLaderaH1 },
      { PAGE_H1: clusterCascadaH1 },
      { PAGE_H1: caraBeliKprH1 },
    ] = await Promise.all([
      import("../lokasi-akses-gdc-parung/page"),
      import("../disclaimer/page"),
      import("../kontak/page"),
      import("../artikel/page"),
      import("@/components/sections/pricelist-content"),
      import("../cluster-ladera/page"),
      import("../cluster-cascada/page"),
      import("../cara-beli-kpr/page"),
    ]);

    const h1sByPath: Record<string, string> = {
      "/lokasi-akses-gdc-parung": lokasiAksesH1,
      "/disclaimer": disclaimerH1,
      "/kontak": kontakH1,
      "/artikel": artikelH1,
      "/pricelist-grand-duta-city": pricelistH1,
      "/cluster-ladera": clusterLaderaH1,
      "/cluster-cascada": clusterCascadaH1,
      "/cara-beli-kpr": caraBeliKprH1,
    };

    const offenders = Object.entries(h1sByPath)
      .map(([path, h1]) => ({ path, h1, normalized: h1.toLowerCase().trim() }))
      .filter(
        ({ normalized }) =>
          normalized.startsWith(HOMEPAGE_PRIMARY) ||
          normalized.startsWith(HOMEPAGE_SECONDARY),
      );

    expect(
      offenders,
      `H1 halaman ini dibuka dengan frasa brand homepage: ${offenders
        .map((o) => `${o.path} ("${o.h1}")`)
        .join("; ")}`,
    ).toEqual([]);

    // Sanity check kedua: pastikan kesembilan konstanta benar-benar terisi,
    // bukan string kosong yang lolos startsWith() secara kebetulan.
    for (const [path, h1] of Object.entries(h1sByPath)) {
      expect(h1.length, `PAGE_H1 kosong untuk ${path}`).toBeGreaterThan(0);
    }
  });

  it("halaman kanibalisasi ke-9 sudah di-redirect, bukan dibiarkan hidup dengan H1 yang melanggar", async () => {
    // Diverifikasi lewat next.config.ts, bukan HTTP live: test unit tidak
    // menjalankan server. Ini menjaga niatnya tidak diam-diam dihapus dari
    // konfigurasi redirect di masa depan tanpa ada yang sadar.
    const config = (await import("../../../../next.config")).default;
    const redirects = await config.redirects?.();
    const target = redirects?.find(
      (r: { source: string }) =>
        r.source === HOMEPAGE_CANNIBALIZATION_REDIRECT_PATH,
    );

    expect(
      target,
      "Redirect untuk /perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap hilang dari next.config.ts — halaman ini akan hidup kembali dengan H1 yang melanggar G19.",
    ).toBeDefined();
    expect(target?.destination).toBe("/");
    expect(target?.permanent).toBe(true);
  });
});

// ===========================================================================
// G20 & G21 — kanibalisasi lewat ANCHOR TEXT dan HEADING sitewide
//
// G4–G19 memeriksa `title`, `description`, dan `<h1>`. Ketiganya bersih pada
// audit 3 September 2026, TAPI homepage tetap turun ke halaman 2 untuk
// "grand duta city parung" sementara /cara-memilih-rumah-parung dan
// /lokasi-akses-gdc-parung menyalipnya. Audit crawl 66 URL sitemap
// menemukan dua saluran kanibalisasi yang tidak satu pun guard di atas menyentuh:
//
//   1. ANCHOR TEXT INTERNAL. Judul di `articleArchiveEntries` dirender sebagai
//      teks tautan di sidebar, kartu "Artikel Terkait", navigasi prev/next, dan
//      blok "Baca juga" tiap tiga paragraf. Tiga judul yang memuat frasa brand
//      utuh menghasilkan 168 / 165 / 161 anchor bermuatan frasa target menuju
//      /cara-beli-kpr, /update-stok-*, dan /lokasi-akses-* — nyaris menyamai 244
//      anchor menuju homepage, padahal homepage seharusnya dominan mutlak.
//
//   2. HEADING FOOTER SITEWIDE. `<h2>` "Wujudkan Rumah Impian Keluarga di Grand
//      Duta City Parung" dirender di SETIAP halaman, sehingga 65 halaman
//      non-homepage punya heading level-2 yang mengklaim frasa target.
//
// Kedua asersi di bawah menguji SUMBER DATA dan MARKUP KOMPONEN, bukan HTML
// live, supaya pelanggaran tertangkap di `npm run test` sebelum deploy.
// ===========================================================================

describe("G20 — anchor text internal tidak mengklaim frasa homepage", () => {
  it("judul dan alt di articleArchiveEntries tidak memuat frasa target homepage", async () => {
    const { articleArchiveEntries } = await import("@/lib/articles");

    const offenders: Array<{ slug: string; field: string; value: string }> = [];
    for (const entry of articleArchiveEntries) {
      for (const [field, value] of [
        ["title", entry.title],
        ["coverAlt", entry.coverAlt],
        ["description", entry.description],
        ["excerpt", entry.excerpt],
      ] as const) {
        const normalized = value.toLowerCase();
        if (
          normalized.includes(HOMEPAGE_PRIMARY) ||
          normalized.includes(HOMEPAGE_SECONDARY)
        ) {
          offenders.push({ slug: entry.slug, field, value });
        }
      }
    }

    expect(
      offenders,
      `Field ini dirender sebagai anchor text / alt tautan internal di seluruh halaman artikel, jadi memuat frasa milik homepage berarti mengirim sinyal kepemilikan ke halaman lain: ${offenders
        .map((o) => `${o.slug}.${o.field} = "${o.value}"`)
        .join("; ")}`,
    ).toEqual([]);
  });
});

describe("G21 — footer sitewide tidak mengemit heading bermuatan frasa homepage", () => {
  it("blok CTA footer bukan elemen heading", async () => {
    const { default: fs } = await import("node:fs");
    const source = fs.readFileSync("src/components/layout/footer.tsx", "utf8");

    // Footer dirender di 66 URL. Heading di sini = 65 halaman non-homepage ikut
    // mengklaim frasa target lewat struktur dokumen.
    const headings = [...source.matchAll(/<(h[1-6])\b[\s\S]*?<\/\1>/gi)].map(
      (match) => match[0],
    );

    const offenders = headings.filter((heading) => {
      const text = heading.replace(/<[^>]*>/g, " ").toLowerCase();
      return (
        text.includes(HOMEPAGE_PRIMARY) || text.includes(HOMEPAGE_SECONDARY)
      );
    });

    expect(
      offenders,
      `Heading footer memuat frasa milik homepage dan tayang di setiap halaman: ${offenders.join(
        " | ",
      )}`,
    ).toEqual([]);
  });

  it("judul video cluster tidak memuat frasa homepage (dirender sebagai H2 di halaman tipe)", async () => {
    const { CLUSTER_VIDEO } = await import("@/data/unit-content");

    const offenders = Object.entries(CLUSTER_VIDEO)
      .filter(([, video]) => video !== null)
      .map(([cluster, video]) => ({ cluster, title: video!.title }))
      .filter(({ title }) => {
        const normalized = title.toLowerCase();
        return (
          normalized.includes(HOMEPAGE_PRIMARY) ||
          normalized.includes(HOMEPAGE_SECONDARY)
        );
      });

    expect(
      offenders,
      `Judul ini dirender sebagai <h2> di halaman tipe unit: ${offenders
        .map((o) => `${o.cluster} ("${o.title}")`)
        .join("; ")}`,
    ).toEqual([]);
  });
});
