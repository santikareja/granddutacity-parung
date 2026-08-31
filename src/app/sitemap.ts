import type { MetadataRoute } from "next";
import { getCategorySitemapEntries } from "@/lib/articles";
import { getArticleSitemapEntries } from "@/lib/public/queries";
import { unitPagePath, units } from "@/data/units";

const BASE_URL = "https://granddutacitysouthofjakarta.com";

/**
 * Halaman tipe unit (Fase 7).
 *
 * `frontera-89` DIKELUARKAN karena halaman itu `noindex` selama pricelist
 * resminya belum dirilis. Memasukkan URL noindex ke sitemap adalah sinyal yang
 * saling bertentangan: sitemap berarti "tolong indeks ini", meta robots berarti
 * "jangan". Daftar pengecualian ini WAJIB sinkron dengan `NOINDEX_UNITS` di
 * app/(site)/tipe-rumah/[slug]/page.tsx.
 */
const NOINDEX_UNIT_IDS = new Set(["frontera-89"]);

function getUnitTypeSitemapEntries(): MetadataRoute.Sitemap {
  return units
    .filter((unit) => !NOINDEX_UNIT_IDS.has(unit.id))
    .map((unit) => ({
      url: `${BASE_URL}${unitPagePath(unit)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      // Di bawah halaman cluster (0.9) tapi di atas artikel (0.7): halaman tipe
      // adalah tujuan komersial, bukan konten editorial.
      priority: 0.75,
    }));
}

// Daftar artikel published dari CMS ikut masuk sitemap agar Google menemukan
// URL /{slug} tanpa bergantung pada internal link saja.
//
// Query dibungkus try/catch di lapisan lib (getArticleSitemapEntries): saat
// build di environment tanpa kredensial DB (mis. laptop baru), sitemap tetap
// ter-generate dengan halaman statis dan tidak menggagalkan build. Di Vercel
// (env lengkap), artikel ikut terindeks.
async function getArtikelSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries = await getArticleSitemapEntries();

  return entries.map((entry) => ({
    url: `${BASE_URL}/${entry.slug}`,
    lastModified: entry.publishedAt ? new Date(entry.publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
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
    {
      url: `${BASE_URL}/tipe-rumah`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...getUnitTypeSitemapEntries(),
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
