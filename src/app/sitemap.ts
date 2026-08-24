import type { MetadataRoute } from "next";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { getCategorySitemapEntries } from "@/lib/articles";

const BASE_URL = "https://granddutacitysouthofjakarta.com";

// Daftar artikel published dari CMS ikut masuk sitemap agar Google menemukan
// URL /{slug} tanpa bergantung pada internal link saja.
//
// Query dibungkus try/catch: saat build di environment tanpa kredensial DB
// (mis. laptop baru), sitemap tetap ter-generate dengan halaman statis dan
// tidak menggagalkan build. Di Vercel (env lengkap), artikel ikut terindeks.
async function getArtikelSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const payload = await getPayload({ config: configPromise });

    const result = await payload.find({
      collection: "artikel",
      depth: 0,
      draft: false,
      limit: 500,
      pagination: false,
      sort: "-publishedAt",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    return result.docs
      .filter((doc) => Boolean(doc.slug))
      .map((doc) => ({
        url: `${BASE_URL}/${doc.slug}`,
        lastModified: doc.publishedAt ? new Date(doc.publishedAt) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.warn(
      "[sitemap] Artikel CMS dilewati (database tidak tersedia saat build):",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artikelEntries] = await Promise.all([getArtikelSitemapEntries()]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricelist-grand-duta-city`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/artikel`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/category`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/author/santika-reza`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/cluster-ladera`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cluster-cascada`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/galeri`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/cara-beli-kpr`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/update-stok-siteplan-grand-duta-city-parung`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/lokasi-akses-grand-duta-city-parung`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/kontak`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...getCategorySitemapEntries(),
  ];

  // Dedupe berdasarkan URL: slug CMS yang kebetulan sama dengan halaman statis
  // (mis. mirror konten cara-beli-kpr) tidak boleh muncul dua kali.
  const seenUrls = new Set(staticEntries.map((entry) => entry.url));

  return [
    ...staticEntries,
    ...artikelEntries.filter((entry) => {
      if (seenUrls.has(entry.url)) return false;
      seenUrls.add(entry.url);
      return true;
    }),
  ];
}
