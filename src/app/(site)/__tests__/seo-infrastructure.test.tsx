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
      "/lokasi-akses-grand-duta-city-parung",
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
