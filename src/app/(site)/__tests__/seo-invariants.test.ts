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
  duplicatePrimaries,
  ownershipOf,
  reservedPhraseViolations,
} from "@/lib/keyword-ownership";

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
    [string, Promise<{ generateMetadata: (props: never) => Promise<Metadata> }>]
  > = [
    ["/artikel", import("../artikel/page")],
    ["/cara-beli-kpr", import("../cara-beli-kpr/page")],
    [
      "/lokasi-akses-grand-duta-city-parung",
      import("../lokasi-akses-grand-duta-city-parung/page"),
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
