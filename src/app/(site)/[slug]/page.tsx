import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleRichContent } from "@/components/articles/article-rich-content";
import { ArticleTableOfContents } from "@/components/articles/article-toc";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Header } from "@/components/ui/header-2";
import { SmartImage } from "@/components/ui/smart-image";
import { cloudinaryDisplay } from "@/lib/cloudinary";
import {
  articleArchiveEntries,
  getAuthorDefinition,
  getTagDefinition,
  sortArticles,
} from "@/lib/articles";
import {
  getPublishedArticleBySlug,
  getPublishedArticleSummaries,
} from "@/lib/public/queries";
import { SCHEMA_ID, breadcrumbNode, graph, ref } from "@/lib/schema";
import type { PublicArticle, PublicMedia, PublicTag } from "@/types/content";

// ISR: render sekali lalu sajikan dari cache selama 5 menit. Pembukaan artikel
// yang sama berikutnya tidak lagi menyentuh database, sehingga jauh lebih cepat.
// Rentang 5 menit cukup singkat agar artikel/urutan baru tetap cepat muncul.
export const revalidate = 300;

const SITE_URL = "https://granddutacitysouthofjakarta.com";
const SIDEBAR_PROMO_BANNER =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776683121/Sidebar_Banner_Promo_evqpmg.webp";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type MiniArticleItem = {
  title: string;
  href: string;
  thumbnail: string;
  thumbnailAlt: string;
  description?: string;
  updatedLabel?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const isMedia = (value: PublicArticle["featuredImage"]): value is PublicMedia =>
  typeof value === "object" && value !== null;

const resolveMediaUrl = (media?: PublicMedia | null) => {
  if (!media) return null;
  return media.transformedUrl || media.cloudinaryUrl || media.url || media.thumbnailURL || media.originalUrl || null;
};

const normalizeArticleUrl = (slug: string) => {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  return normalizedSlug ? `${SITE_URL}/${normalizedSlug}` : SITE_URL;
};

const isTagObject = (value: NonNullable<PublicArticle["tags"]>[number]): value is PublicTag =>
  typeof value === "object" && value !== null;

const isArtikelObject = (value: number | PublicArticle): value is PublicArticle =>
  typeof value === "object" && value !== null;

const toMiniFromArchive = (entry: (typeof articleArchiveEntries)[number]): MiniArticleItem => ({
  title: entry.title,
  href: entry.href,
  thumbnail: entry.coverImage,
  thumbnailAlt: entry.coverAlt,
  description: entry.excerpt,
  updatedLabel: entry.updatedLabel,
});

function SidebarArticleList({ title, items }: { title: string; items: MiniArticleItem[] }) {
  return (
    <section className="rounded-2xl border border-[#0B120C]/8 bg-white/65 p-5 shadow-[0_10px_30px_rgba(11,18,12,0.06)] backdrop-blur-sm">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B120C]/70">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <Link key={`${title}-${item.href}`} href={item.href} className="group flex gap-3">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-[#0B120C]/10">
              <SmartImage
                alt={item.thumbnailAlt}
                className="h-full w-full object-cover"
                src={cloudinaryDisplay(item.thumbnail, { width: 200 })}
              />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm leading-5 text-[#0B120C] transition-colors group-hover:text-[#A85D16]">
                {item.title}
              </p>
              {item.updatedLabel ? (
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#0B120C]/45">{item.updatedLabel}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return {
      title: "Artikel Tidak Ditemukan",
    };
  }

  // absolute: mencegah template layout "%s | Grand Duta City Parung" menumpuk
  // suffix kedua di belakang title yang sudah mengandung branding.
  const title = article.seo?.metaTitle || `${article.title} | Grand Duta City Parung`;
  const description = article.seo?.metaDescription || article.excerpt || "Artikel Grand Duta City";
  const url = normalizeArticleUrl(article.slug);
  const featuredImage = isMedia(article.featuredImage) ? article.featuredImage : null;
  const ogImage = resolveMediaUrl(featuredImage) || undefined;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: { absolute: title },
      description,
      url,
      type: "article",
      images: ogImage
        ? [
            {
              url: ogImage,
              width: featuredImage?.width || 1200,
              height: featuredImage?.height || 630,
              alt: featuredImage?.alt || article.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function ArtikelDetailRootSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const [article, publishedArticles] = await Promise.all([
    getPublishedArticleBySlug(slug),
    // Ringkasan (tanpa kolom konten/taksonomi) — cukup untuk sidebar, artikel
    // terkait, dan navigasi sebelum/berikutnya.
    getPublishedArticleSummaries(50),
  ]);

  if (!article) {
    notFound();
  }

  const featuredImage = isMedia(article.featuredImage) ? article.featuredImage : null;
  const featuredImageUrl = resolveMediaUrl(featuredImage);
  const canonicalUrl = normalizeArticleUrl(article.slug);
  const archiveMeta = articleArchiveEntries.find((entry) => entry.slug === article.slug);
  const archiveBySlug = new Map(articleArchiveEntries.map((entry) => [entry.slug, entry]));
  const authorName = archiveMeta ? getAuthorDefinition(archiveMeta.authorSlug)?.name || "Tim Editorial GDC" : "Tim Editorial GDC";
  const authorHref = archiveMeta?.authorSlug ? `/author/${archiveMeta.authorSlug}` : null;
  const readingTime = archiveMeta?.readingTime || "5 menit baca";
  const cmsTagNames = (article.tags || [])
    .filter(isTagObject)
    .map((tag) => tag.name)
    .filter(Boolean)
    .slice(0, 3);
  const mobileTagNames =
    cmsTagNames.length > 0
      ? cmsTagNames
      : (archiveMeta?.tags || [])
          .map((tagSlug) => getTagDefinition(tagSlug)?.name)
          .filter((value): value is string => Boolean(value))
          .slice(0, 3);

  const latestOrdered = sortArticles(articleArchiveEntries, "terbaru");
  const popularOrdered = sortArticles(articleArchiveEntries, "populer");
  const archiveIndex = latestOrdered.findIndex((entry) => entry.slug === article.slug);
  const cmsIndex = publishedArticles.findIndex((entry) => entry.slug === article.slug);
  const previousFromCms = cmsIndex >= 0 ? publishedArticles[cmsIndex + 1] : undefined;
  const nextFromCms = cmsIndex > 0 ? publishedArticles[cmsIndex - 1] : undefined;

  const toMiniFromCms = (entry: PublicArticle): MiniArticleItem | null => {
    const fallbackArchive = archiveBySlug.get(entry.slug);
    const thumb = isMedia(entry.featuredImage) ? resolveMediaUrl(entry.featuredImage) : fallbackArchive?.coverImage;
    if (!thumb) return null;

    return {
      title: entry.title,
      href: `/${entry.slug}`,
      thumbnail: thumb,
      thumbnailAlt: isMedia(entry.featuredImage)
        ? entry.featuredImage.alt || entry.title
        : fallbackArchive?.coverAlt || entry.title,
      description: entry.excerpt || fallbackArchive?.excerpt,
      updatedLabel: fallbackArchive?.updatedLabel,
    };
  };

  const latestSidebarFromCms = publishedArticles
    .filter((entry) => entry.slug !== article.slug)
    .map(toMiniFromCms)
    .filter((entry): entry is MiniArticleItem => Boolean(entry));
  const latestSidebar = latestSidebarFromCms.length >= 5
    ? latestSidebarFromCms.slice(0, 5)
    : [
        ...latestSidebarFromCms,
        ...latestOrdered
          .filter((entry) => entry.slug !== article.slug)
          .map(toMiniFromArchive)
          .filter((entry) => !latestSidebarFromCms.some((cmsItem) => cmsItem.href === entry.href)),
      ].slice(0, 5);
  const popularSidebar = popularOrdered.filter((entry) => entry.slug !== article.slug).slice(0, 5).map(toMiniFromArchive);
  const seputarGDCSidebar = latestOrdered
    .filter((entry) => entry.slug !== article.slug && entry.categorySlug === "seputar-gdc")
    .slice(0, 3)
    .map(toMiniFromArchive);

  const relatedItems: MiniArticleItem[] = [];
  const dedupe = new Set<string>();
  const relatedFromCms = (article.relatedArtikel || [])
    .filter(isArtikelObject)
    .map(toMiniFromCms)
    .filter((entry): entry is MiniArticleItem => Boolean(entry));

  for (const entry of relatedFromCms) {
    if (!dedupe.has(entry.href) && entry.href !== `/${article.slug}`) {
      dedupe.add(entry.href);
      relatedItems.push(entry);
    }
  }

  const fallbackRelated = latestOrdered
    .filter((entry) => entry.slug !== article.slug)
    .map(toMiniFromArchive);

  for (const entry of fallbackRelated) {
    if (relatedItems.length >= 4) break;
    if (!dedupe.has(entry.href)) {
      dedupe.add(entry.href);
      relatedItems.push(entry);
    }
  }

  const fallbackRelatedFromCms = publishedArticles
    .filter((entry) => entry.slug !== article.slug)
    .map(toMiniFromCms)
    .filter((entry): entry is MiniArticleItem => Boolean(entry));

  for (const entry of fallbackRelatedFromCms) {
    if (relatedItems.length >= 4) break;
    if (!dedupe.has(entry.href)) {
      dedupe.add(entry.href);
      relatedItems.push(entry);
    }
  }

  if (relatedItems.length < 4) {
    const permissivePool = [...fallbackRelatedFromCms, ...fallbackRelated, ...latestSidebar];
    for (const entry of permissivePool) {
      if (relatedItems.length >= 4) break;
      if (entry.href !== `/${article.slug}`) {
        relatedItems.push(entry);
      }
    }
  }

  const previousArticle =
    (previousFromCms ? toMiniFromCms(previousFromCms) : null) ||
    (archiveIndex >= 0 && latestOrdered[archiveIndex + 1]
      ? toMiniFromArchive(latestOrdered[archiveIndex + 1])
      : null);

  const nextArticle =
    (nextFromCms ? toMiniFromCms(nextFromCms) : null) ||
    (archiveIndex > 0 && latestOrdered[archiveIndex - 1]
      ? toMiniFromArchive(latestOrdered[archiveIndex - 1])
      : null);

  const readAlsoItems = (relatedItems.length > 0 ? relatedItems : latestSidebar).slice(0, 4);
  const schemaImage = featuredImageUrl || `${SITE_URL}/marketing-agent.png`;
  const datePublished = new Date(article.publishedAt || article.createdAt).toISOString();
  const dateModified = new Date(article.updatedAt || article.publishedAt || article.createdAt).toISOString();

  // SATU sumber untuk breadcrumb visual DAN JSON-LD. Sebelumnya halaman ini
  // merender breadcrumb yang terlihat tetapi TIDAK mengemit `BreadcrumbList`
  // sama sekali — padahal breadcrumb adalah rich result yang masih aktif dan
  // tampil di SERP. Ini berlaku untuk SELURUH 32 halaman artikel.
  const breadcrumbEntries = [
    { name: "Artikel", path: "/artikel" },
    { name: article.title, path: `/${article.slug}` },
  ];

  const articleGraph = graph([
    {
      "@type": "BlogPosting",
      "@id": `${canonicalUrl}#article`,
      headline: article.title,
      description:
        article.seo?.metaDescription || article.excerpt || "Artikel Grand Duta City Parung",
      image: [schemaImage],
      datePublished,
      dateModified,
      inLanguage: "id-ID",
      // `author` kini menunjuk halaman penulis yang memang ada dan punya schema
      // `Person` sendiri. Sebelumnya hanya nama tanpa `url`, sehingga sinyal
      // E-E-A-T terbuang padahal halamannya sudah dibuat.
      author: authorHref
        ? {
            "@type": "Person",
            "@id": `${SITE_URL}${authorHref}#person`,
            name: authorName,
            url: `${SITE_URL}${authorHref}`,
          }
        : { "@type": "Person", name: authorName },
      // Merujuk `@id` Organization global di layout, bukan mendeklarasikan
      // penerbit baru bernama "Grand Duta City Parung" yang membuat Google
      // melihat dua entitas berbeda.
      publisher: ref(SCHEMA_ID.organization),
      isPartOf: ref(SCHEMA_ID.website),
      mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
    },
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: article.title,
      inLanguage: "id-ID",
      isPartOf: ref(SCHEMA_ID.website),
      breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: schemaImage,
      },
    },
    breadcrumbNode(breadcrumbEntries, canonicalUrl),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleGraph) }}
      />
      <Header />
      {/* overflow-x-clip, BUKAN overflow-hidden: keduanya mencegah scroll
          horizontal, tetapi `overflow: hidden` menjadikan elemen ini scroll
          container sehingga `position: sticky` di dalamnya (sidebar) tidak
          pernah aktif. `overflow: clip` mengekang sumbu-x tanpa membuat scroll
          container, jadi sticky tetap bekerja. Didukung target browser proyek. */}
      <main className="relative w-full overflow-x-clip bg-brand-light">
        <section className="relative overflow-hidden bg-[#0B120C] pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.16),transparent_28%),linear-gradient(180deg,rgba(11,18,12,0.94),rgba(11,18,12,1))]" />
          <div className="relative mx-auto max-w-4xl px-6 md:px-10">
            {/* Dibangun dari `breadcrumbEntries` yang SAMA dengan JSON-LD di
                atas, jadi keduanya tidak bisa menyimpang. Item terakhir tanpa
                href supaya dirender sebagai aria-current="page". */}
            <Breadcrumb
              items={breadcrumbEntries.map((entry, index) => ({
                label: entry.name,
                href: index < breadcrumbEntries.length - 1 ? entry.path : undefined,
              }))}
            />
            <h1 className="mt-6 font-serif text-4xl leading-tight text-[#F5F1E8] md:text-5xl">{article.title}</h1>
            <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-[#F5F1E8]/60 md:text-sm md:tracking-[0.2em]">
              Dipublikasikan {formatDate(article.publishedAt || article.createdAt)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.12em] text-[#F5F1E8]/72 md:mt-3 md:text-xs md:tracking-[0.14em]">
              <span>
                Author:{" "}
                {authorHref ? (
                  <Link href={authorHref} className="text-[#F5F1E8] hover:text-[#F5A524] hover:underline transition-colors">{authorName}</Link>
                ) : (
                  authorName
                )}
              </span>
              <span>{readingTime}</span>
              {mobileTagNames.length > 0 ? <span>Tag: {mobileTagNames.join(", ")}</span> : null}
            </div>
            {article.excerpt ? (
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#F5F1E8]/75 md:text-lg">{article.excerpt}</p>
            ) : null}
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
            <article className="min-w-0">
              {featuredImageUrl && featuredImage ? (
                <figure className="mb-10">
                  {/* Gambar utama di-crop 4:3 (1280x960) agar konsisten dan
                      ringan. width/height mengikuti rasio itu supaya ruang yang
                      dipesan tepat dan tidak ada pergeseran layout (CLS). */}
                  <SmartImage
                    alt={featuredImage.alt || article.title}
                    className="h-auto w-full rounded-lg border border-[#0b120c]/10"
                    height={960}
                    src={cloudinaryDisplay(featuredImageUrl, { width: 1280 })}
                    width={1280}
                  />
                  {featuredImage.caption ? (
                    <figcaption className="mt-3 text-sm leading-relaxed text-[#475467]">{featuredImage.caption}</figcaption>
                  ) : null}
                </figure>
              ) : null}

              <ArticleTableOfContents targetId="article-content" />

              <div id="article-content">
                <ArticleRichContent data={article.content} readAlsoItems={readAlsoItems} />
              </div>

              <section className="mt-12 border-t border-[#0B120C]/10 pt-8">
                <div className="grid gap-4 md:grid-cols-2">
                  {previousArticle ? (
                    <Link
                      href={previousArticle.href}
                      className="rounded-xl border border-[#0B120C]/10 bg-white/70 p-4 transition-colors hover:border-[#A85D16]/35"
                    >
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#0B120C]/50">Artikel Sebelumnya</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#0B120C]">{previousArticle.title}</p>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {nextArticle ? (
                    <Link
                      href={nextArticle.href}
                      className="rounded-xl border border-[#0B120C]/10 bg-white/70 p-4 text-right transition-colors hover:border-[#A85D16]/35"
                    >
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#0B120C]/50">Artikel Berikutnya</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#0B120C]">{nextArticle.title}</p>
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#0B120C]/16 bg-white/55 p-4 text-right">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#0B120C]/40">Artikel Berikutnya</p>
                      <p className="mt-2 text-sm text-[#0B120C]/45">Belum ada artikel berikutnya.</p>
                    </div>
                  )}
                </div>

                {relatedItems.length > 0 ? (
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0B120C]/65">Artikel Terkait</h3>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      {relatedItems.slice(0, 4).map((item, index) => (
                        <Link
                          key={`related-${item.href}-${index}`}
                          href={item.href}
                          className="group overflow-hidden rounded-2xl border border-[#0B120C]/10 bg-white/85 shadow-[0_10px_25px_rgba(11,18,12,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#A85D16]/35 hover:shadow-[0_18px_34px_rgba(11,18,12,0.1)]"
                        >
                          <div className="h-40 overflow-hidden border-b border-[#0B120C]/8">
                            <SmartImage
                              alt={item.thumbnailAlt}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              src={cloudinaryDisplay(item.thumbnail, { width: 640 })}
                            />
                          </div>
                          <div className="p-4">
                            <p className="line-clamp-2 text-base font-semibold leading-6 text-[#0B120C] transition-colors group-hover:text-[#A85D16]">
                              {item.title}
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#0B120C]/62">
                              {item.description || "Baca insight properti terbaru untuk membantu keputusan beli rumah Anda dengan lebih percaya diri."}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </article>

            <aside className="mt-10 lg:mt-0">
              {/* Sticky pada layar lg+: sidebar ikut turun saat artikel digulir
                  sehingga kolom kanan tidak kosong. top-24 memberi jarak di
                  bawah header yang fixed. Grid item aside meregang setinggi
                  artikel, jadi elemen sticky punya ruang untuk bergerak. */}
              <div className="space-y-5 lg:sticky lg:top-24">

                <Link
                  href="/pricelist-grand-duta-city"
                  className="group block overflow-hidden rounded-2xl border border-[#0B120C]/10 bg-white/80 shadow-[0_10px_30px_rgba(11,18,12,0.08)]"
                >
                  <SmartImage
                    src={SIDEBAR_PROMO_BANNER}
                    alt="Promo Grand Duta City"
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </Link>
                {seputarGDCSidebar.length > 0 ? (
                  <SidebarArticleList title="Seputar GDC" items={seputarGDCSidebar} />
                ) : null}
                <SidebarArticleList title="Artikel Populer" items={popularSidebar} />
                <SidebarArticleList title="Artikel Terbaru" items={latestSidebar} />
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

