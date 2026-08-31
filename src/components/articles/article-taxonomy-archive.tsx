import type { Metadata } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/ui/header-2";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  ogImage,
  originalImage,
  thumbImage,
} from "@/lib/cloudinary";
import {
  SORT_LABELS,
  articleTagDefinitions,
  buildItemListElements,
  getCategoryPagePath,
  getTagPath,
  toAbsoluteUrl,
  type ArticleArchiveEntry,
  type ArticleCategoryDefinition,
  type ArticleSortKey,
  type ArticleTagDefinition,
} from "@/lib/articles";
import { SCHEMA_ID, ref } from "@/lib/schema";
import { OG_SITE_NAME } from "@/lib/seo";
import { ArticleCard } from "./article-card";

// Sebelumnya literal "Grand Duta City Parung South of Jakarta" — varian kedua
// dari tiga nilai siteName yang beredar di situs. Kini mengacu ke satu sumber
// agar entitas brand tidak terpecah (guard G11).
const SITE_NAME = OG_SITE_NAME;

type PaginationMeta = {
  pageNumber: number;
  totalPages: number;
  totalItems: number;
  itemOffset: number;
  basePath: string;
  currentPath: string;
  prevPath?: string;
  nextPath?: string;
};

type CategoryArchivePageProps = {
  category: ArticleCategoryDefinition;
  articles: ArticleArchiveEntry[];
  featuredArticle?: ArticleArchiveEntry;
  relatedTags: ArticleTagDefinition[];
  relatedCategories: ArticleCategoryDefinition[];
  sortKey: ArticleSortKey;
  sortHrefBuilder: (sortKey: ArticleSortKey) => string;
  pagination: PaginationMeta;
  canonicalPath: string;
  noIndex: boolean;
};

type TagArchivePageProps = {
  tag: ArticleTagDefinition;
  articles: ArticleArchiveEntry[];
  relatedCategories: ArticleCategoryDefinition[];
  pagination: PaginationMeta;
  canonicalPath: string;
};

function PaginationHeadLinks({
  prevPath,
  nextPath,
}: {
  prevPath?: string;
  nextPath?: string;
}) {
  if (!prevPath && !nextPath) {
    return null;
  }

  return (
    <Head>
      {prevPath ? <link rel="prev" href={toAbsoluteUrl(prevPath)} /> : null}
      {nextPath ? <link rel="next" href={toAbsoluteUrl(nextPath)} /> : null}
    </Head>
  );
}

function PaginationNav({ pagination }: { pagination: PaginationMeta }) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi halaman archive"
      className="mt-16 flex flex-col gap-4 border-t border-[#0B120C]/8 pt-8 md:flex-row md:items-center md:justify-between"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#0B120C]/45">
        Halaman {pagination.pageNumber} dari {pagination.totalPages}
      </p>

      <div className="flex flex-wrap gap-3">
        {pagination.prevPath ? (
          <Link
            href={pagination.prevPath}
            className="inline-flex items-center gap-2 rounded-full border border-[#0B120C]/12 bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B120C] transition-colors hover:border-[#0B120C] hover:bg-[#0B120C] hover:text-[#F5F1E8]"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Link>
        ) : null}

        {pagination.nextPath ? (
          <Link
            href={pagination.nextPath}
            className="inline-flex items-center gap-2 rounded-full bg-[#0B120C] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F5F1E8] transition-colors hover:bg-[#A85D16]"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

function CategoryCTA({ category }: { category: ArticleCategoryDefinition }) {
  return (
    <div className="overflow-hidden rounded-[32px] bg-[#0B120C] text-[#F5F1E8] shadow-[0_28px_70px_rgba(11,18,12,0.18)]">
      <div className="grid gap-10 px-6 py-8 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:px-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#F5A524]">
            Langkah Berikutnya
          </p>
          <h3 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
            {category.ctaTitle}
          </h3>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#F5F1E8]/72">
            {category.ctaBody}
          </p>
        </div>

        <div className="grid gap-4 self-start">
          <Link
            href={category.ctaPrimary.href}
            className="group rounded-[24px] border border-white/10 bg-white/[0.05] px-5 py-5 transition-colors hover:border-[#F5A524]/35 hover:bg-white/[0.08]"
          >
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#F5A524]">
              Pilihan Utama
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="font-serif text-2xl leading-tight">
                {category.ctaPrimary.label}
              </span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {category.ctaSecondary ? (
            <Link
              href={category.ctaSecondary.href}
              className="group rounded-[24px] border border-white/10 bg-white/[0.05] px-5 py-5 transition-colors hover:border-[#F5A524]/35 hover:bg-white/[0.08]"
            >
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#F5A524]">
                Pendamping
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="font-serif text-2xl leading-tight">
                  {category.ctaSecondary.label}
                </span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SortLinks({
  activeSort,
  buildHref,
}: {
  activeSort: ArticleSortKey;
  buildHref: (sortKey: ArticleSortKey) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(SORT_LABELS) as ArticleSortKey[]).map((sortKey) => {
        const active = activeSort === sortKey;

        return (
          <Link
            key={sortKey}
            href={buildHref(sortKey)}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex items-center rounded-full border border-[#F5A524] bg-[#F5A524] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B120C]"
                : "inline-flex items-center rounded-full border border-[#0B120C]/12 bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B120C]/60 transition-colors hover:border-[#0B120C]/30 hover:text-[#0B120C]"
            }
          >
            {SORT_LABELS[sortKey]}
          </Link>
        );
      })}
    </div>
  );
}

export function buildCategoryArchiveMetadata({
  category,
  currentPath,
  canonicalPath,
  noIndex,
}: {
  category: ArticleCategoryDefinition;
  currentPath: string;
  canonicalPath: string;
  noIndex: boolean;
}): Metadata {
  const og = ogImage(category.imagePublicId);

  return {
    title: {
      absolute: category.metaTitle,
    },
    description: category.metaDescription,
    category: "real estate",
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: !noIndex,
      follow: true,
      googleBot: {
        index: !noIndex,
        follow: true,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title: category.openGraphTitle,
      description: category.openGraphDescription,
      url: currentPath,
      siteName: SITE_NAME,
      locale: "id_ID",
      type: "website",
      images: [
        {
          url: og,
          width: 1200,
          height: 630,
          // Frasa "Grand Duta City South of Jakarta" dicabut: alt OG image di 3
          // halaman kategori sebelumnya mengulang kata kunci kedua homepage.
          alt: `${category.name} - Grand Duta City Parung`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: category.openGraphTitle,
      description: category.openGraphDescription,
      images: [og],
    },
  };
}

export function buildTagArchiveMetadata({
  tag,
  canonicalPath,
  currentPath,
  ogImageUrl,
}: {
  tag: ArticleTagDefinition;
  canonicalPath: string;
  currentPath: string;
  ogImageUrl: string;
}): Metadata {
  return {
    title: {
      absolute: `Tag: ${tag.name} - Grand Duta City`,
    },
    description: tag.description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title: `Tag: ${tag.name} - Grand Duta City`,
      description: tag.description,
      url: currentPath,
      siteName: SITE_NAME,
      locale: "id_ID",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${tag.name} - Grand Duta City`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Tag: ${tag.name} - Grand Duta City`,
      description: tag.description,
      images: [ogImageUrl],
    },
  };
}

export function renderCategoryArchiveJsonLd({
  category,
  canonicalPath,
  pagination,
  pageArticles,
  breadcrumbItems,
}: {
  category: ArticleCategoryDefinition;
  canonicalPath: string;
  pagination: PaginationMeta;
  pageArticles: ArticleArchiveEntry[];
  breadcrumbItems: Array<{ name: string; item: string }>;
}) {
  const pageUrl = toAbsoluteUrl(canonicalPath);
  const collectionId = `${pageUrl}#collection`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const itemListId = `${pageUrl}#itemlist`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": collectionId,
        url: pageUrl,
        name: category.name,
        description: category.description,
        inLanguage: "id-ID",
        image: {
          "@type": "ImageObject",
          url: originalImage(category.imagePublicId),
          width: 1200,
          height: 630,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: originalImage(category.imagePublicId),
        },
        // Referensi MURNI ke node WebSite tunggal, bukan mendefinisikan ulang.
        //
        // Sebelumnya di sini ada `"@id": ${toAbsoluteUrl("/")}#website` yang
        // menghasilkan "https://...com#website" TANPA garis miring, sementara
        // homepage memakai "https://...com/#website" DENGAN garis miring. Dua
        // string berbeda = dua entitas WebSite berbeda di mata Google, yang
        // persis kebalikan dari tujuan konsolidasi entitas.
        isPartOf: ref(SCHEMA_ID.website),
        about: category.about,
        breadcrumb: {
          "@id": breadcrumbId,
        },
        mainEntity: {
          "@id": itemListId,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.item,
        })),
      },
      {
        "@type": "ItemList",
        "@id": itemListId,
        name: `${category.name} - daftar artikel`,
        url: pageUrl,
        numberOfItems: pagination.totalItems,
        itemListElement: buildItemListElements(pageArticles, pagination.itemOffset),
      },
    ],
  };
}

export function renderTagArchiveJsonLd({
  canonicalPath,
  tagName,
}: {
  canonicalPath: string;
  tagName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${toAbsoluteUrl(canonicalPath)}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: toAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Artikel",
        item: toAbsoluteUrl("/artikel"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Tag: ${tagName}`,
        item: toAbsoluteUrl(canonicalPath),
      },
    ],
  };
}

export function CategoryArchivePage({
  category,
  articles,
  featuredArticle,
  relatedTags,
  relatedCategories,
  sortKey,
  sortHrefBuilder,
  pagination,
  canonicalPath,
  noIndex,
}: CategoryArchivePageProps) {
  const heroImage = thumbImage(category.imagePublicId);
  const breadcrumbItems =
    pagination.pageNumber > 1
      ? [
          { label: "Artikel", href: "/artikel" },
          { label: category.name, href: canonicalPath },
          { label: `Halaman ${pagination.pageNumber}` },
        ]
      : [
          { label: "Artikel", href: "/artikel" },
          { label: category.name },
        ];

  const jsonLd = renderCategoryArchiveJsonLd({
    category,
    canonicalPath,
    pagination,
    pageArticles: articles,
    breadcrumbItems: [
      { name: "Beranda", item: toAbsoluteUrl("/") },
      { name: "Artikel", item: toAbsoluteUrl("/artikel") },
      { name: category.name, item: toAbsoluteUrl(canonicalPath) },
      ...(pagination.pageNumber > 1
        ? [
            {
              name: `Halaman ${pagination.pageNumber}`,
              item: toAbsoluteUrl(pagination.currentPath),
            },
          ]
        : []),
    ],
  });

  const renderMiddleCta =
    category.ctaPlacement === "middle" || category.ctaPlacement === "both";
  const renderBottomCta =
    category.ctaPlacement === "bottom" || category.ctaPlacement === "both";

  return (
    <>
      <PaginationHeadLinks
        prevPath={pagination.prevPath}
        nextPath={pagination.nextPath}
      />
      <Header />
      <main className="relative w-full overflow-hidden bg-[#F5F1E8]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <section className="relative overflow-hidden bg-[#0B120C] pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(245,241,232,0.08),transparent_20%),linear-gradient(180deg,rgba(11,18,12,0.94),rgba(11,18,12,1))]" />
            <div className="absolute inset-y-0 right-0 hidden w-[36%] bg-[linear-gradient(135deg,rgba(245,165,36,0.18),transparent_58%)] lg:block" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#F5A524]/30 to-transparent" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 md:px-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:px-14">
            <div>
              <div className="mb-8">
                <Breadcrumb items={breadcrumbItems} />
              </div>

              <p className="text-[10px] uppercase tracking-[0.45em] text-[#F5A524]">
                {category.eyebrow}
              </p>
              <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] text-[#F5F1E8] md:text-6xl lg:text-7xl">
                {category.name}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#F5F1E8]/72 md:text-lg">
                {category.intro}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5F1E8]/60">
                Semua artikel di topik ini membahas kawasan hunian{" "}
                <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>{" "}
                South of Jakarta.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                {relatedCategories.map((item) => (
                  <Link
                    key={item.slug}
                    href={getCategoryPagePath(item.slug, 1)}
                    className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F5F1E8]/78 transition-colors hover:border-[#F5A524]/30 hover:text-[#F5A524]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {noIndex ? (
                <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-[#F5F1E8]/42">
                  Halaman arsip lanjutan tetap bisa diikuti crawler, tetapi tidak
                  diindeks.
                </p>
              ) : null}
            </div>

            <aside className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md">
              <div className="relative aspect-[5/4]">
                <Image
                  src={heroImage}
                  alt={`${category.name} editorial`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B120C] via-[#0B120C]/28 to-transparent" />
              </div>

              <div className="px-6 py-6 md:px-7">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#F5A524]">
                  Editorial Notes
                </p>
                <h2 className="mt-4 font-serif text-3xl leading-tight text-[#F5F1E8]">
                  {category.trustTitle}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/68">
                  {category.trustBody}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div>
                    <p className="font-serif text-3xl text-[#F5F1E8]">
                      {pagination.totalItems}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#F5F1E8]/55">
                      Artikel
                    </p>
                  </div>
                  <div>
                    <p className="font-serif text-3xl text-[#F5F1E8]">
                      {relatedTags.length}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#F5F1E8]/55">
                      Topik
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {featuredArticle ? (
          <section className="border-b border-[#0B120C]/8 bg-[#F5F1E8]">
            <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20 lg:px-14">
              <div className="mb-8 flex items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                    {category.featuredLabel}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0B120C] md:text-4xl">
                    Artikel utama untuk section ini
                  </h2>
                </div>
                <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#0B120C]/45 md:inline-flex">
                  <Sparkles className="h-4 w-4 text-[#F5A524]" />
                  Fokus editorial
                </div>
              </div>

              <article className="grid overflow-hidden rounded-[36px] border border-[#0B120C]/10 bg-white shadow-[0_30px_90px_rgba(11,18,12,0.08)] lg:grid-cols-12">
                <Link
                  href={featuredArticle.href}
                  className="relative block min-h-[320px] lg:col-span-7 lg:min-h-[420px]"
                >
                  <Image
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.coverAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B120C]/45 via-[#0B120C]/10 to-transparent" />
                </Link>

                <div className="flex flex-col justify-between px-6 py-7 md:px-8 md:py-8 lg:col-span-5 lg:px-10 lg:py-10">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex rounded-full border border-[#F5A524]/35 bg-[#F5A524]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#A85D16]">
                        {featuredArticle.category}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#0B120C]/45">
                        {featuredArticle.updatedLabel}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#0B120C]/45">
                        {featuredArticle.readingTime}
                      </span>
                    </div>

                    <h3 className="mt-6 font-serif text-3xl leading-tight text-[#0B120C] md:text-[2.6rem]">
                      <Link
                        href={featuredArticle.href}
                        className="transition-colors hover:text-[#A85D16]"
                      >
                        {featuredArticle.title}
                      </Link>
                    </h3>

                    <p className="mt-5 max-w-xl text-base leading-8 text-[#0B120C]/68">
                      {featuredArticle.description}
                    </p>

                    {featuredArticle.tags.length > 0 ? (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {featuredArticle.tags.map((tagSlug) => (
                          <Link
                            key={tagSlug}
                            href={getTagPath(tagSlug)}
                            className="inline-flex rounded-full border border-[#0B120C]/10 bg-[#0B120C]/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0B120C]/62 transition-colors hover:border-[#A85D16]/30 hover:text-[#A85D16]"
                          >
                            {articleTagDefinitions[tagSlug].name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <Link
                      href={featuredArticle.href}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0B120C] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5F1E8] transition-colors hover:bg-[#A85D16]"
                    >
                      Baca Artikel
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={category.ctaPrimary.href}
                      className="inline-flex items-center gap-2 rounded-full border border-[#0B120C]/12 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#0B120C] transition-colors hover:border-[#0B120C] hover:bg-[#0B120C] hover:text-[#F5F1E8]"
                    >
                      {category.ctaPrimary.label}
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          </section>
        ) : null}

        <section className="bg-[#F5F1E8]">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20 lg:px-14">
            <div className="mb-10 flex flex-col gap-6 border-b border-[#0B120C]/8 pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                  Arsip Editorial
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0B120C] md:text-4xl">
                  {category.sectionNote}
                </h2>
              </div>

              <SortLinks activeSort={sortKey} buildHref={sortHrefBuilder} />
            </div>

            {relatedTags.length > 0 ? (
              <div className="mb-8 flex flex-wrap gap-3">
                {relatedTags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={getTagPath(tag.slug)}
                    className="inline-flex rounded-full border border-[#0B120C]/10 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B120C]/70 transition-colors hover:border-[#F5A524]/35 hover:text-[#A85D16]"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            ) : null}

            {articles.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    hideCategoryLink
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-[#0B120C]/16 bg-white/70 px-6 py-14 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                  Sedang Dikurasi
                </p>
                <h3 className="mt-3 font-serif text-3xl text-[#0B120C]">
                  Arsip ini akan bertambah
                </h3>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#0B120C]/65">
                  Section ini sudah disiapkan sebagai pusat editorial untuk topik
                  {` ${category.name.toLowerCase()}`}. Artikel baru akan muncul di
                  sini saat publikasi berikutnya terbit.
                </p>
              </div>
            )}

            {renderMiddleCta ? (
              <div className="mt-16">
                <CategoryCTA category={category} />
              </div>
            ) : null}

            <div className="mt-16 border-t border-[#0B120C]/8 pt-8">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                Topik Lain
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {relatedCategories.map((item) => (
                  <Link
                    key={item.slug}
                    href={getCategoryPagePath(item.slug, 1)}
                    className="inline-flex items-center rounded-full border border-[#0B120C]/12 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B120C] transition-colors hover:border-[#A85D16]/30 hover:text-[#A85D16]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <PaginationNav pagination={pagination} />

            {renderBottomCta ? (
              <div className="mt-16">
                <CategoryCTA category={category} />
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export function TagArchivePage({
  tag,
  articles,
  relatedCategories,
  pagination,
  canonicalPath,
}: TagArchivePageProps) {
  const jsonLd = renderTagArchiveJsonLd({
    canonicalPath,
    tagName: tag.name,
  });

  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-[#F5F1E8]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <section className="relative overflow-hidden bg-[#0B120C] pt-32 pb-20 md:pt-40 md:pb-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.16),transparent_28%),linear-gradient(180deg,rgba(11,18,12,0.94),rgba(11,18,12,1))]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#F5A524]/30 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 md:px-10 lg:px-14">
            <div className="mb-8">
              <Breadcrumb
                items={[
                  { label: "Artikel", href: "/artikel" },
                  { label: `Tag: ${tag.name}` },
                ]}
              />
            </div>

            <p className="text-[10px] uppercase tracking-[0.45em] text-[#F5A524]">
              Tag Archive / noindex, follow
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] text-[#F5F1E8] md:text-6xl">
              Tag: {tag.name}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#F5F1E8]/72 md:text-lg">
              {tag.intro}
            </p>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#F5F1E8]/58">
              Halaman tag tetap bisa diakses dan diikuti crawler untuk membantu
              internal linking, tetapi tidak ditujukan untuk diindeks sebagai
              landing page SEO. Kembali ke halaman utama{" "}
              <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {relatedCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={getCategoryPagePath(category.slug, 1)}
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F5F1E8]/78 transition-colors hover:border-[#F5A524]/30 hover:text-[#F5A524]"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F1E8]">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20 lg:px-14">
            {articles.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-[#0B120C]/16 bg-white/70 px-6 py-14 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                  Belum Ada Artikel
                </p>
                <h3 className="mt-3 font-serif text-3xl text-[#0B120C]">
                  Tag ini belum memiliki arsip
                </h3>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#0B120C]/65">
                  Coba jelajahi kategori editorial untuk menemukan artikel yang
                  paling relevan dengan kebutuhan Anda.
                </p>
              </div>
            )}

            <PaginationNav pagination={pagination} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
