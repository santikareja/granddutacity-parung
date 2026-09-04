import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import nextConfig from "../../../../next.config";
import rootSitemap from "../../sitemap";
import robots from "../../robots";
import articleSitemap from "../artikel/sitemap";
import { GET as imageSitemap } from "../images.xml/route";
import { Header } from "@/components/ui/header-2";
import { WhyGdc } from "@/components/sections/why-gdc";
import {
  REDIRECTED_SITEMAP_SOURCE_PATHS,
  isRedirectedSitemapSourceUrl,
} from "@/lib/redirects";
import { SITE_URL } from "@/lib/seo";

vi.mock("next/image", async () => {
  const ReactModule = await import("react");
  return {
    default: (props: React.ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
      unoptimized?: boolean;
    }) => {
      const imageProps = { ...props };
      delete imageProps.fill;
      delete imageProps.priority;
      delete imageProps.unoptimized;
      return ReactModule.createElement("img", imageProps);
    },
  };
});

const canonicalHost = new URL(SITE_URL).hostname;

const expectCanonicalSitemapUrl = (url: string) => {
  const parsed = new URL(url);
  expect(parsed.protocol).toBe("https:");
  expect(parsed.hostname).toBe(canonicalHost);
  expect(parsed.search).toBe("");
  expect(parsed.hash).toBe("");
  expect(parsed.pathname).toBe(parsed.pathname.toLowerCase());
  if (parsed.pathname !== "/") {
    expect(parsed.pathname.endsWith("/")).toBe(false);
  }
};

describe("SEO infrastructure hardening", () => {
  it("redirects www duplicate host to canonical non-www host", async () => {
    const redirects = await nextConfig.redirects?.();

    const wwwRedirect = redirects?.find((redirect) =>
      redirect.source === "/:path*" &&
      redirect.has?.some(
        (condition) =>
          condition.type === "host" &&
          condition.value === "www.granddutacitysouthofjakarta.com",
      ),
    );

    expect(wwwRedirect).toMatchObject({
      destination: `${SITE_URL}/:path*`,
      statusCode: 301,
    });
  });

  it("robots keeps public pages crawlable and blocks private surfaces for every bot group", () => {
    const spec = robots();
    const rules = Array.isArray(spec.rules) ? spec.rules : [spec.rules];

    expect(spec.sitemap).toEqual([
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/artikel/sitemap.xml`,
      `${SITE_URL}/images.xml`,
    ]);

    for (const rule of rules) {
      expect(rule.allow).toBe("/");
      expect(rule.disallow).toEqual(expect.arrayContaining(["/api/", "/admin/"]));
    }
  });

  it("root sitemap emits only canonical HTTPS non-www URLs without query, hash, or trailing slash duplicates", async () => {
    const entries = await rootSitemap();
    const urls = entries.map((entry) => entry.url);

    expect(new Set(urls).size).toBe(urls.length);

    for (const url of urls) {
      expectCanonicalSitemapUrl(url);
      expect(isRedirectedSitemapSourceUrl(url)).toBe(false);
    }

    for (const path of REDIRECTED_SITEMAP_SOURCE_PATHS) {
      expect(urls).not.toContain(`${SITE_URL}${path}`);
    }
  });

  it("article sitemap also excludes redirected source URLs", async () => {
    const entries = await articleSitemap();
    const urls = entries.map((entry) => entry.url);

    for (const url of urls) {
      expectCanonicalSitemapUrl(url);
      expect(isRedirectedSitemapSourceUrl(url)).toBe(false);
    }
  });

  it("image sitemap emits canonical page loc URLs, including homepage without trailing slash", async () => {
    const response = await imageSitemap();
    const xml = await response.text();
    const pageLocs = Array.from(xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)).map(
      (match) => match[1],
    );

    expect(pageLocs).toContain(SITE_URL);
    expect(pageLocs).not.toContain(`${SITE_URL}/`);

    for (const url of pageLocs) {
      expectCanonicalSitemapUrl(url);
    }
  });

  it("header exposes strategic internal pages as crawlable anchor hrefs", () => {
    const html = renderToStaticMarkup(React.createElement(Header));
    const criticalLinks = [
      "/cluster-ladera",
      "/cluster-cascada",
      "/pricelist-grand-duta-city",
      "/lokasi-akses-gdc-parung",
      "/update-stok-siteplan-grand-duta-city-parung",
      "/cara-beli-kpr",
      "/galeri",
      "/kontak",
    ];

    for (const href of criticalLinks) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it("homepage gallery stack keeps all 10 documentation images and ALT text in server-rendered markup", () => {
    const html = renderToStaticMarkup(React.createElement(WhyGdc));
    const expectedAlts = [
      "Harga Promo Grand Duta City South of Jakarta Parung",
      "Kawasan Perumahan Grand Duta City Parung",
      "Lingkungan Perumahan Grand Duta City South of Jakarta",
      "Fasad Rumah Grand Duta City Parung",
      "Lingkungan Asri GDC Parung",
      "Fasilitas Grand Duta City Parung",
      "Fasad Rumah Cluster Grand Duta City South of Jakarta Parung",
      "Fasilitas Kawasan Grand Duta City Parung",
      "Rencana Future Development Kawasan Grand Duta City Parung",
      "Promo KPR Grand Duta City Parung Tanpa DP",
    ];

    expect(html.match(/<img\b/g) ?? []).toHaveLength(expectedAlts.length);
    for (const alt of expectedAlts) {
      expect(html).toContain(`alt="${alt}"`);
    }
  });
});

// ===========================================================================
// G22 — sinyal GAMBAR PRATINJAU hasil penelusuran
//
// Dokumentasi Image SEO Google (diperbarui 2 Maret 2026) menyebut tiga sumber
// untuk memilih gambar pratinjau: `primaryImageOfPage`, properti `image` pada
// entitas utama (`mainEntity`/`mainEntityOfPage`), dan `og:image`. Google juga
// menyatakan pemilihannya otomatis, dan bahwa "the presentation of the images
// also influences whether an image is indexed at all".
//
// Audit produksi 3 September 2026 menemukan hasil penelusuran homepage
// menampilkan thumbnail YouTube, bukan gambar situs. Sebabnya terukur: dari 53
// tag `<img>` di HTML homepage, TIDAK SATU PUN memuat aset yang saat itu
// ditunjuk sebagai gambar preferred. Keduanya hanya hidup di metadata dan tidak
// terdaftar di `/images.xml`, sementara thumbnail YouTube dirender sebagai
// `<img>` nyata sekaligus dideklarasikan di `VideoObject`.
//
// Guard di bawah mengunci tiga hal yang mudah rusak kembali:
//   1. gambar preferred WAJIB benar-benar dirender di halaman,
//   2. ia tidak boleh berupa materi promo bertulisan atau logo,
//   3. ketiga saluran sinyal terisi dan saling konsisten.
// ===========================================================================

describe("G22 — gambar preferred hadir di halaman, bukan hanya di metadata", () => {
  it("primaryImageOfPage menunjuk gambar yang dirender carousel Better Living", async () => {
    const [{ BetterLiving }, { HOMEPAGE_PREFERRED_IMAGE, betterLivingImages }] =
      await Promise.all([
        import("@/components/sections/better-living"),
        import("@/data/homepage-images"),
      ]);

    // Sumbernya harus satu: preferred image wajib berasal dari daftar yang
    // dirender, bukan aset lepas.
    expect(betterLivingImages).toContain(HOMEPAGE_PREFERRED_IMAGE);

    const html = renderToStaticMarkup(React.createElement(BetterLiving));
    // Carousel melewatkan URL ke Cloudinary transform, jadi yang dicocokkan
    // adalah public ID-nya — bagian yang tidak berubah.
    const publicId = HOMEPAGE_PREFERRED_IMAGE.url.split("/").pop() ?? "";
    expect(publicId.length).toBeGreaterThan(0);
    expect(
      html.includes(publicId),
      `Gambar preferred (${publicId}) tidak dirender BetterLiving. Gambar yang hanya ada di JSON-LD/og:image adalah kandidat lemah bagi Google.`,
    ).toBe(true);
    expect(html).toContain(`alt="${HOMEPAGE_PREFERRED_IMAGE.alt}"`);
  });

  it("gambar preferred adalah Tipe Victoria, dan tidak bergeser saat urutan daftar diubah", async () => {
    const { HOMEPAGE_PREFERRED_IMAGE } = await import("@/data/homepage-images");

    // `HOMEPAGE_PREFERRED_IMAGE` dirujuk lewat indeks (`betterLivingImages[2]`),
    // dan urutan daftar itu juga menentukan urutan carousel serta `Place.image`.
    // Tanpa asersi ini, mengurutkan ulang daftar akan diam-diam memindahkan
    // gambar preferred ke aset lain. Pilihan Victoria adalah keputusan pemilik
    // (4 September 2026), jadi perubahannya harus disengaja — bukan efek samping.
    expect(HOMEPAGE_PREFERRED_IMAGE.url).toContain("Tipe_Victoria_-_Tuscan_gj1kcd");
    expect(HOMEPAGE_PREFERRED_IMAGE.alt).toContain("Tipe Victoria");
  });

  it("gambar preferred bukan aset promo bertulisan atau logo", async () => {
    const { betterLivingImages } = await import("@/data/homepage-images");

    // Google: "Avoid using a generic image (for example, your site logo) or an
    // image with text". Dua aset di /public adalah materi promo bertulisan
    // "DP Rp. 0" berlogo; keduanya sah untuk og:image, tapi tidak boleh menjadi
    // sumber gambar preferred.
    const FORBIDDEN = [
      "og-grand-duta-city-parung",
      "perumahan-grand-duta-city-parung",
      "logo",
      "Promo_",
      "Harga_Promo",
    ];

    const offenders = betterLivingImages.filter((image) =>
      FORBIDDEN.some((needle) => image.url.includes(needle)),
    );

    expect(
      offenders.map((image) => image.url),
      "Aset promo bertulisan/logo tidak boleh masuk daftar gambar preferred.",
    ).toEqual([]);
  });

  it("ketiga saluran sinyal gambar terisi dan konsisten", async () => {
    const [
      { SCHEMA_ID, primaryImageNode, projectPlaceNode },
      {
        BETTER_LIVING_IMAGE_SIZE,
        HOMEPAGE_PREFERRED_IMAGE,
        betterLivingImages,
        structuredDataImages,
      },
    ] = await Promise.all([
      import("@/lib/schema"),
      import("@/data/homepage-images"),
    ]);

    // Saluran 1: primaryImageOfPage.
    const primary = primaryImageNode(
      HOMEPAGE_PREFERRED_IMAGE.url,
      HOMEPAGE_PREFERRED_IMAGE.alt,
      BETTER_LIVING_IMAGE_SIZE,
    ) as Record<string, unknown>;
    expect(primary["@id"]).toBe(SCHEMA_ID.primaryImage);
    expect(primary.url).toBe(HOMEPAGE_PREFERRED_IMAGE.url);
    expect(primary.representativeOfPage).toBe(true);
    // Resolusi eksplisit: salah satu kriteria pemilihan Google.
    expect(primary.width).toBe(1024);
    expect(primary.height).toBe(1024);

    // Saluran 2: `image` pada entitas utama (Place = mainEntity homepage).
    const place = projectPlaceNode() as {
      image?: { url: string; width?: number; height?: number }[];
    };
    expect(
      Array.isArray(place.image),
      "Place /#project adalah mainEntity homepage; properti `image` di sini adalah saluran kedua yang disebut dokumentasi Google.",
    ).toBe(true);
    expect(place.image).toHaveLength(betterLivingImages.length);
    // Urutan array senada dengan primaryImageOfPage: preferred lebih dulu.
    expect(place.image?.[0]?.url).toBe(HOMEPAGE_PREFERRED_IMAGE.url);
    expect(place.image?.map((image) => image.url)).toEqual(
      structuredDataImages.map((image) => image.url),
    );
    for (const image of place.image ?? []) {
      expect(image.width).toBe(1024);
      expect(image.height).toBe(1024);
    }

    // Tidak boleh ada gambar yang hilang atau terduplikasi saat diurut ulang.
    expect(new Set(structuredDataImages.map((image) => image.url)).size).toBe(
      betterLivingImages.length,
    );
  });

  it("setiap gambar preferred terdaftar di sitemap gambar untuk homepage", async () => {
    const [{ betterLivingImages }, { siteImages }] = await Promise.all([
      import("@/data/homepage-images"),
      import("@/data/images"),
    ]);

    const homepageUrls = new Set(
      siteImages.filter((image) => image.page === "/").map((image) => image.url),
    );

    const missing = betterLivingImages
      .map((image) => image.url)
      .filter((url) => !homepageUrls.has(url));

    expect(
      missing,
      "Sitemap gambar adalah jalur penemuan ketiga selain <img> dan structured data.",
    ).toEqual([]);
  });

  it("sitemap gambar homepage tidak mendaftarkan gambar yang tidak dirender", async () => {
    const { siteImages } = await import("@/data/images");

    // Poster hero desktop hanya dipakai `<link rel=preload>` bermedia
    // `(min-width: 768px)`, tidak pernah menjadi `<img src>` — Google tidak bisa
    // mengindeksnya sebagai gambar halaman. Aset promo `..._qhnsec.webp` juga
    // sudah tidak dirender di homepage.
    const NOT_RENDERED = [
      "Grand_Duta_City_Parung_South_of_Jakarta_lsds7k",
      "Promo_KPR_Rumah_Tanpa_DP_Bogor_qhnsec",
    ];

    const offenders = siteImages
      .filter((image) => image.page === "/")
      .map((image) => image.url)
      .filter((url) => NOT_RENDERED.some((needle) => url.includes(needle)));

    expect(offenders).toEqual([]);
  });

  it("VideoObject memakai thumbnail resolusi tertinggi yang tersedia", async () => {
    // Video result adalah jalur SERP tersendiri, terpisah dari pratinjau gambar
    // hasil teks. Selama ia dipertahankan, thumbnail-nya harus setajam mungkin:
    // maxresdefault (1280x720) diverifikasi ada, hqdefault (480x360) jadi
    // cadangan.
    const { default: fs } = await import("node:fs");
    const source = fs.readFileSync("src/app/(site)/page.tsx", "utf8");

    expect(source).toContain("maxresdefault.jpg");
    const thumbBlock = source.slice(
      source.indexOf("thumbnailUrl: ["),
      source.indexOf("uploadDate: TOUR_VIDEO_UPLOAD_DATE"),
    );
    expect(thumbBlock.indexOf("maxresdefault")).toBeLessThan(
      thumbBlock.indexOf("hqdefault"),
    );
  });
});

// ===========================================================================
// G23 — konsistensi BreadcrumbList
//
// Breadcrumb adalah rich result yang MASIH AKTIF di SERP, dan item posisi 1
// setiap breadcrumb selalu "Beranda" -> homepage. Jadi setiap halaman yang
// mengemit breadcrumb ikut menyatakan homepage sebagai akar hierarki situs.
//
// Audit produksi 4 September 2026 (crawl 66 URL) menemukan dua cacat:
//
//   1. TIGA halaman menulis `BreadcrumbList` inline dengan `item: ${SITE_URL}/`
//      — memakai garis miring — sementara `breadcrumbNode()` dan 61 breadcrumb
//      lain memakai `SITE_URL` tanpa garis miring, bentuk yang sama dengan
//      canonical homepage. Sinyal "Beranda adalah akar" terbelah dua bentuk URL.
//
//   2. `/about` merender breadcrumb yang TERLIHAT tetapi tidak mengemit
//      `BreadcrumbList` sama sekali — satu-satunya dari 65 halaman non-homepage.
//
// Guard di bawah menjaga keduanya tidak kembali, dan sengaja menguji SUMBER
// (bukan HTML live) supaya pelanggaran tertangkap sebelum deploy.
// ===========================================================================

describe("G23 — BreadcrumbList konsisten lewat builder bersama", () => {
  /** Halaman yang secara sah TIDAK punya `BreadcrumbList`. */
  const EXEMPT = new Set([
    // Homepage adalah top level path SEKALIGUS halaman itu sendiri. Panduan
    // Google mengecualikan keduanya, jadi jejaknya nol item — di bawah minimum
    // dua ListItem, sehingga tidak pernah dirender sebagai rich result.
    "/",
    // Route berikut mendelegasikan breadcrumb-nya ke komponen bersama
    // (article-taxonomy-archive.tsx / [slug]/page.tsx), bukan menyusun sendiri.
    "/artikel/[slug]",
    "/category/[slug]",
    "/category/[slug]/page/[pageNumber]",
    "/tag/[slug]",
    "/tag/[slug]/page/[pageNumber]",
  ]);

  const routeOf = (file: string) => {
    const route = file
      .replace(/\\/g, "/")
      .replace(/^src\/app\/\(site\)/, "")
      .replace(/\/page\.tsx$/, "");
    return route === "" ? "/" : route;
  };

  const pageFiles = async () => {
    const { default: fs } = await import("node:fs");
    const { default: path } = await import("node:path");
    const root = "src/app/(site)";
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "__tests__") continue;
          walk(full);
        } else if (entry.name === "page.tsx") {
          out.push(full);
        }
      }
    };
    walk(root);
    return out;
  };

  it("tidak ada halaman yang menulis BreadcrumbList inline alih-alih memakai breadcrumbNode()", async () => {
    const { default: fs } = await import("node:fs");
    const files = await pageFiles();

    const offenders = files.filter((file) => {
      const source = fs.readFileSync(file, "utf8");
      // Inline = mendeklarasikan tipe sendiri TANPA memanggil builder.
      return (
        /"@type":\s*"BreadcrumbList"/.test(source) &&
        !/breadcrumbNode\(/.test(source)
      );
    });

    expect(
      offenders.map(routeOf),
      "Breadcrumb inline melewati breadcrumbNode() dan bisa memakai bentuk URL Beranda yang berbeda dari canonical homepage.",
    ).toEqual([]);
  });

  it("setiap halaman non-exempt mengemit BreadcrumbList", async () => {
    const { default: fs } = await import("node:fs");
    const files = await pageFiles();

    const missing = files
      .map((file) => ({ file, route: routeOf(file) }))
      .filter(({ route }) => !EXEMPT.has(route))
      .filter(({ file }) => {
        const source = fs.readFileSync(file, "utf8");
        return (
          !/breadcrumbNode\(/.test(source) &&
          !/"@type":\s*"BreadcrumbList"/.test(source)
        );
      })
      .map(({ route }) => route);

    expect(
      missing,
      "Halaman ini merender breadcrumb visual tapi tidak mengemit BreadcrumbList — kehilangan rich result sekaligus satu sinyal akar untuk homepage.",
    ).toEqual([]);
  });

  it("breadcrumbNode() memakai bentuk URL Beranda yang identik dengan canonical homepage", async () => {
    const { breadcrumbNode } = await import("@/lib/schema");
    const { SITE_URL } = await import("@/lib/seo");

    const node = breadcrumbNode(
      [{ name: "Contoh", path: "/contoh" }],
      `${SITE_URL}/contoh`,
    );
    const beranda = node.itemListElement[0];

    expect(beranda.item).toBe(SITE_URL);
    // Garis miring di ujung membuat item ini menjadi URL kedua yang bersaing
    // dengan canonical homepage.
    expect(beranda.item.endsWith("/")).toBe(false);
    expect(node.itemListElement.length).toBeGreaterThanOrEqual(2);
  });

  it("/about mengemit breadcrumb yang cocok dengan label breadcrumb visualnya", async () => {
    const { default: fs } = await import("node:fs");

    // Google meminta breadcrumb terstruktur mencerminkan jalur yang dilihat
    // pengguna. Dua sumber terpisah bisa menyimpang, jadi labelnya diikat.
    const visual = fs.readFileSync(
      "src/components/sections/about-developer.tsx",
      "utf8",
    );
    const page = fs.readFileSync("src/app/(site)/about/page.tsx", "utf8");

    expect(visual).toContain('label: "Tentang Developer"');
    expect(page).toContain('name: "Tentang Developer"');
    expect(page).toContain("breadcrumbNode(");
  });
});
