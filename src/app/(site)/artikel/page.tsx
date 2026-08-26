import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ArticleArchiveClient } from "@/components/articles/article-archive-client";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import type { Artikel, Media, Tag } from "@/payload-types";
import {
  articleArchiveEntries,
  type ArticleArchiveEntry,
  type ArticleCategorySlug,
  type ArticleTagSlug,
  articleCategories,
  articleCategoryDefinitions,
  articleCategorySlugs,
  getCategoryPath,
} from "@/lib/articles";

const SITE_URL = "https://granddutacitysouthofjakarta.com";
const PAGE_URL = `${SITE_URL}/artikel`;
const OG_IMAGE =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775877869/cara-beli-kpr-grand-duta-city-parung_cf7tep.webp";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  const pageNumber = typeof pageParam === "string" ? parseInt(pageParam, 10) : 1;
  const isFirstPage = !pageNumber || isNaN(pageNumber) || pageNumber <= 1;

  // Spam defense: query param selain `page` (mis. ?q=, ?utm= injection) → noindex.
  // Seluruh halaman paginasi (page > 1) → noindex,follow (hemat crawl budget, cegah duplikat/spam).
  const paramKeys = Object.keys(resolvedSearchParams);
  const hasUnexpectedParams = paramKeys.some((key) => key !== "page");
  const shouldIndex = isFirstPage && !hasUnexpectedParams;

  const pageTitle = isFirstPage
    ? "Artikel Properti Grand Duta City Parung 2026 | Panduan Beli Rumah & Investasi"
    : `Artikel Properti Grand Duta City Parung – Halaman ${pageNumber} | Panduan Beli Rumah & Investasi`;

  // Konsolidasi canonical ke halaman 1 (PAGE_URL) untuk semua varian paginasi/spam.
  const canonicalUrl = PAGE_URL;

  return {
    title: pageTitle,
    description:
      "Kumpulan artikel edukasi properti tentang cara beli rumah, KPR, lokasi, dan tips memilih agen di Grand Duta City Parung dan sekitarnya. Update 2026.",
    keywords: [
      "artikel properti",
      "artikel grand duta city parung",
      "panduan beli rumah parung",
      "cara beli rumah",
      "kpr",
      "investasi properti",
      "informasi lokasi grand duta city",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title: pageTitle,
      description:
        "Kumpulan artikel edukasi properti tentang cara beli rumah, KPR, lokasi, dan tips memilih agen di Grand Duta City Parung dan sekitarnya. Update 2026.",
      url: canonicalUrl,
      siteName: "Grand Duta City Parung South of Jakarta",
      locale: "id_ID",
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description:
        "Kumpulan artikel edukasi properti tentang cara beli rumah, KPR, lokasi, dan tips memilih agen di Grand Duta City Parung dan sekitarnya. Update 2026.",
      images: [OG_IMAGE],
    },
  };
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Beranda",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Artikel",
      item: PAGE_URL,
    },
  ],
};

const getItemListSchema = (articles: ArticleArchiveEntry[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": `${PAGE_URL}#itemlist`,
  name: "Daftar artikel seputar Grand Duta City Parung dan properti",
  itemListOrder: "https://schema.org/ItemListUnordered",
  numberOfItems: articles.length,
  itemListElement: articles.map((article, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}${article.href}`,
    name: article.title,
  })),
});

const getCollectionPageSchema = (
  articles: ArticleArchiveEntry[],
  canonicalUrl: string,
) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${canonicalUrl}#webpage`,
  url: canonicalUrl,
  name: "Artikel Properti Grand Duta City Parung",
  description:
    "Kumpulan artikel edukasi properti tentang cara beli rumah, KPR, lokasi, dan tips investasi di Grand Duta City Parung.",
  inLanguage: "id-ID",
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: "Grand Duta City Parung",
  },
  breadcrumb: {
    "@id": `${PAGE_URL}#breadcrumb`,
  },
  mainEntity: {
    "@type": "ItemList",
    "@id": `${canonicalUrl}#itemlist`,
    itemListElement: articles.map((article, index) => ({
      "@type": "BlogPosting",
      headline: article.title,
      url: `${SITE_URL}${article.href}`,
      position: index + 1,
      image: article.coverImage ? [article.coverImage] : undefined,
    })),
  },
  about: articleCategories.map((category) => ({
    "@type": "Thing",
    name: category,
  })),
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: OG_IMAGE,
    description: "Hero visual halaman artikel properti Grand Duta City Parung",
  },
});

const resolveMediaUrl = (media?: Media | number | null) => {
  if (!media || typeof media === "number") return null;
  return media.transformedUrl || media.cloudinaryUrl || media.url || media.thumbnailURL || media.originalUrl || null;
};

const normalizeCategorySlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const isCategorySlug = (value: string): value is ArticleCategorySlug =>
  articleCategorySlugs.includes(value as ArticleCategorySlug);

const resolveArticleCategory = (
  entry: Artikel,
  fallbackArchive?: (typeof articleArchiveEntries)[number],
) => {
  const fallbackCategory = fallbackArchive
    ? {
        category: fallbackArchive.category,
        categorySlug: fallbackArchive.categorySlug,
      }
    : {
        category: articleCategoryDefinitions["seputar-gdc"].name,
        categorySlug: "seputar-gdc" as const,
      };

  if (!Array.isArray(entry.kategori) || entry.kategori.length === 0) {
    return fallbackCategory;
  }

  for (const item of entry.kategori) {
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const rel = item as { name?: unknown; slug?: unknown };
    const name = typeof rel.name === "string" ? rel.name.trim() : "";
    const rawSlug = typeof rel.slug === "string" ? rel.slug : "";
    const normalizedSlug = normalizeCategorySlug(rawSlug || name);

    if (isCategorySlug(normalizedSlug)) {
      return {
        category: articleCategoryDefinitions[normalizedSlug].name,
        categorySlug: normalizedSlug,
      };
    }

    if (name) {
      const matchingSlug = articleCategorySlugs.find(
        (slug) =>
          articleCategoryDefinitions[slug].name.toLowerCase() ===
          name.toLowerCase(),
      );

      if (matchingSlug) {
        return {
          category: articleCategoryDefinitions[matchingSlug].name,
          categorySlug: matchingSlug,
        };
      }

      return {
        category: name,
        categorySlug: fallbackCategory.categorySlug,
      };
    }
  }

  return fallbackCategory;
};

export default async function ArtikelPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  const pageNumber = typeof pageParam === "string" ? parseInt(pageParam, 10) : 1;
  const canonicalUrl = pageNumber > 1 ? `${PAGE_URL}?page=${pageNumber}` : PAGE_URL;

  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "artikel",
    depth: 2,
    draft: false,
    limit: 100,
    sort: "-publishedAt",
    where: {
      status: {
        equals: "published",
      },
    },
  });

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const dbArticles = result.docs.map((entry) => {
    const fallbackArchive = articleArchiveEntries.find(a => a.slug === entry.slug);
    const thumb = resolveMediaUrl(entry.featuredImage) || fallbackArchive?.coverImage || "";
    const isMediaObj = typeof entry.featuredImage === "object" && entry.featuredImage !== null;

    const { category: categoryName, categorySlug } = resolveArticleCategory(
      entry,
      fallbackArchive,
    );

    const tagList = Array.isArray(entry.tags) 
      ? entry.tags.map(t => typeof t === 'object' && t !== null && 'name' in t ? (t as Tag).slug || (t as Tag).name : '').filter(Boolean)
      : fallbackArchive?.tags || [];

    return {
      id: entry.id.toString(),
      slug: entry.slug,
      href: `/${entry.slug}`,
      title: entry.title,
      excerpt: entry.excerpt || fallbackArchive?.excerpt || "",
      description: entry.seo?.metaDescription || entry.excerpt || fallbackArchive?.description || "",
      category: categoryName,
      categorySlug,
      authorSlug: fallbackArchive?.authorSlug || "santika-reza",
      tags: tagList as ArticleTagSlug[],
      coverImage: thumb,
      coverAlt: isMediaObj ? ((entry.featuredImage as Media).alt || entry.title) : (fallbackArchive?.coverAlt || entry.title),
      updatedAt: entry.updatedAt || entry.createdAt,
      updatedLabel: fallbackArchive?.updatedLabel || formatDate(entry.publishedAt || entry.createdAt),
      readingTime: fallbackArchive?.readingTime || "5 menit baca",
      featured: false,
      popularityRank: fallbackArchive?.popularityRank || 5,
      recommendationRank: fallbackArchive?.recommendationRank || 5,
      searchTerms: fallbackArchive?.searchTerms || [entry.title.toLowerCase()],
    };
  });
  
  const dbSlugs = new Set(dbArticles.map(a => a.slug));
  const remainingHardcoded = articleArchiveEntries.filter(a => !dbSlugs.has(a.slug));
  const allArticles = [...dbArticles, ...remainingHardcoded];

  return (
    <>
      <Header />
  <main className="relative w-full overflow-hidden bg-brand-light">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getItemListSchema(allArticles)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getCollectionPageSchema(allArticles, canonicalUrl)),
          }}
        />

        <section className="relative overflow-hidden bg-[#0B120C] pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.16),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(245,241,232,0.08),transparent_18%),linear-gradient(180deg,rgba(11,18,12,0.92),rgba(11,18,12,1))]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#F5A524]/30 to-transparent" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 md:px-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,360px)] lg:px-14">
            <div>
              <div className="mb-8">
                <Breadcrumb items={[{ label: "Artikel" }]} />
              </div>

              <p className="text-[10px] uppercase tracking-[0.45em] text-[#F5A524]">
                Journal / Artikel
              </p>
              <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] text-[#F5F1E8] md:text-6xl lg:text-7xl">
                Artikel & Panduan Properti Grand Duta City Parung
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#F5F1E8]/72 md:text-lg">
                Temukan section editorial yang membantu Anda membaca{" "}
                <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>{" "}
                dari tiga sudut yang berbeda: panduan pembelian, konteks
                kawasan, dan update project terbaru.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/pricelist-grand-duta-city"
                  className="inline-flex items-center justify-center rounded-full bg-[#F5A524] px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0B120C] transition-colors hover:bg-brand-light"
                >
                  Lihat Pricelist
                </Link>
                <Link
                  href="/kontak"
                  className="inline-flex items-center justify-center rounded-full border border-[#F5F1E8]/16 bg-transparent px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5F1E8] transition-colors hover:border-[#F5A524]/30 hover:text-[#F5A524]"
                >
                  Hubungi Marketing
                </Link>
              </div>
            </div>

            <aside className="self-end rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-7">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#F5A524]">
                Editorial Notes
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 border-b border-white/10 pb-6">
                <div>
                  <p className="font-serif text-3xl text-[#F5F1E8]">
                    {allArticles.length}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#F5F1E8]/55">
                    Artikel
                  </p>
                </div>
                <div>
                  <p className="font-serif text-3xl text-[#F5F1E8]">
                    {articleCategories.length}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#F5F1E8]/55">
                    Kategori
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {articleCategorySlugs.map((slug) => (
                  <Link
                    key={slug}
                    href={getCategoryPath(slug)}
                    className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F5F1E8]/78 transition-colors hover:border-[#F5A524]/30 hover:text-[#F5A524]"
                  >
                    {articleCategoryDefinitions[slug].name}
                  </Link>
                ))}
              </div>

              <p className="mt-6 text-sm leading-7 text-[#F5F1E8]/68">
                Setiap kategori kini punya archive editorial sendiri agar
                pengunjung bisa menelusuri topik secara lebih fokus, sementara
                halaman ini tetap berfungsi sebagai pintu masuk seluruh artikel.
              </p>
            </aside>
          </div>
        </section>

        <ArticleArchiveClient
          articles={allArticles.filter((article) => !article.featured)}
        />
      </main>
      <Footer />
    </>
  );
}
