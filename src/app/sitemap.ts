import type { MetadataRoute } from "next";
import { getCategorySitemapEntries } from "@/lib/articles";
import { getArticleSitemapEntries } from "@/lib/public/queries";
import { siteImages } from "@/data/images";
import { unitPagePath, units } from "@/data/units";
import { LOCATION_PAGE_PATH, isRedirectedSitemapSourceUrl } from "@/lib/redirects";
import { SITE_URL } from "@/lib/seo";

/**
 * Halaman tipe unit (Fase 7).
 *
 * Memasukkan URL noindex ke sitemap adalah sinyal yang saling bertentangan:
 * sitemap berarti "tolong indeks ini", meta robots berarti "jangan". Karena itu
 * daftar pengecualian ini WAJIB sinkron dengan `NOINDEX_UNITS` di
 * app/(site)/tipe-rumah/[slug]/page.tsx.
 *
 * KOSONG sejak 30 Agustus 2026: `frontera-89` dikeluarkan dari daftar ini
 * bersamaan dengan dibukanya noindex halaman tersebut, setelah pemilik
 * mengirim harga dan spesifikasi penuhnya. Kesepuluh halaman tipe kini masuk
 * sitemap.
 */
const NOINDEX_UNIT_IDS = new Set<string>([]);

function getUnitTypeSitemapEntries(): MetadataRoute.Sitemap {
  return units
    .filter((unit) => !NOINDEX_UNIT_IDS.has(unit.id))
    .map((unit) =>
      // Di bawah halaman cluster (0.9) tapi di atas artikel (0.7): halaman tipe
      // adalah tujuan komersial, bukan konten editorial. Fasad dan denah ikut
      // terlampir karena `imagesFor()` membacanya dari registry gambar.
      entry(unitPagePath(unit), 0.75, "weekly"),
    );
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
    url: `${SITE_URL}/${entry.slug}`,
    // `updatedAt` didahulukan (Fase 6). `publishedAt` membuat artikel yang baru
    // disunting tetap terlihat lama bagi Google, jadi sinyal freshness-nya
    // hilang tepat pada artikel yang paling aktif dirawat.
    lastModified: new Date(entry.updatedAt ?? entry.publishedAt ?? Date.now()),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}

/**
 * Gambar per halaman untuk properti `images` native Next 16.
 *
 * `/images.xml` SENGAJA DIPERTAHANKAN dan tidak dipensiunkan: route handler itu
 * berfungsi dan sudah terdaftar sebagai sitemap di Search Console. Mencabutnya
 * sekarang adalah risiko tanpa imbalan setara. Keduanya boleh hidup bersama —
 * Google tidak mempermasalahkan satu gambar muncul di dua sitemap.
 */
function imagesFor(path: string): string[] {
  return siteImages.filter((image) => image.page === path).map((image) => image.url);
}

/** Bangun entri sitemap sekaligus melampirkan gambar halaman itu bila ada. */
function entry(
  path: string,
  priority: number,
  changeFrequency: "weekly" | "monthly",
): MetadataRoute.Sitemap[number] {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  const images = imagesFor(path);
  return {
    url,
    lastModified: new Date(),
    changeFrequency,
    priority,
    ...(images.length > 0 ? { images } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artikelEntries] = await Promise.all([getArtikelSitemapEntries()]);

  const staticEntries: MetadataRoute.Sitemap = [
    // Homepage juga membawa `videos`: tur kawasan di YouTube. `uploadDate`-nya
    // dibaca dari structured data YouTube sendiri (lihat page.tsx homepage),
    // bukan ditebak.
    {
      ...entry("/", 1.0, "weekly"),
      videos: [
        {
          title: "Grand Duta City Parung South of Jakarta Progress Terbaru",
          thumbnail_loc: "https://i.ytimg.com/vi/AZLiHEyd9Yo/hqdefault.jpg",
          description:
            "Tur kawasan Grand Duta City Parung South of Jakarta: gerbang cluster, boulevard utama, The Beach Lagoon, Central Park, dan progres pembangunan terbaru.",
        },
      ],
    },
    entry("/pricelist-grand-duta-city", 0.85, "weekly"),
    entry("/artikel", 0.85, "weekly"),
    entry("/category", 0.65, "monthly"),
    entry("/author/santika-reza", 0.6, "monthly"),
    entry("/cluster-ladera", 0.9, "weekly"),
    entry("/cluster-cascada", 0.9, "weekly"),
    entry("/galeri", 0.7, "monthly"),
    entry("/about", 0.6, "monthly"),
    entry("/cara-beli-kpr", 0.8, "weekly"),
    entry("/update-stok-siteplan-grand-duta-city-parung", 0.8, "weekly"),
    // Slug lama (`/lokasi-akses-grand-duta-city-parung`) sekarang 301 ke sini
    // dan sudah terdaftar di REDIRECTED_SITEMAP_SOURCE_PATHS, jadi ia tidak
    // pernah ikut masuk sitemap lagi.
    entry(LOCATION_PAGE_PATH, 0.85, "weekly"),
    entry("/kontak", 0.8, "weekly"),
    entry("/tipe-rumah", 0.85, "weekly"),
    // Dua halaman legal ini INDEXABLE tapi belum pernah masuk sitemap.
    // Priority rendah karena bukan tujuan pencarian, tapi membiarkannya di luar
    // sitemap berarti Google hanya menemukannya lewat tautan footer.
    entry("/disclaimer", 0.3, "monthly"),
    entry("/privacy-policy", 0.3, "monthly"),
    ...getUnitTypeSitemapEntries(),
    ...getCategorySitemapEntries(),
  ];

  // Dedupe berdasarkan URL: slug CMS yang kebetulan sama dengan halaman statis
  // (mis. mirror konten cara-beli-kpr) tidak boleh muncul dua kali.
  const seenUrls = new Set(staticEntries.map((entry) => entry.url));

  return [
    ...staticEntries,
    ...artikelEntries.filter((entry) => {
      if (isRedirectedSitemapSourceUrl(entry.url)) return false;
      if (seenUrls.has(entry.url)) return false;
      seenUrls.add(entry.url);
      return true;
    }),
  ];
}
