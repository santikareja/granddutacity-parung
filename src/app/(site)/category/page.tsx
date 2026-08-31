import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/ui/header-2";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ArticleCard } from "@/components/articles/article-card";
import { ogImage, thumbImage } from "@/lib/cloudinary";
import {
  articleCategoryDefinitions,
  articleCategorySlugs,
  getCategoryArticleCount,
  getCategoryPath,
  getLatestArticles,
  toAbsoluteUrl,
} from "@/lib/articles";
import { SCHEMA_ID, breadcrumbNode, graph, ref } from "@/lib/schema";

const PAGE_URL = "https://granddutacitysouthofjakarta.com/category";
// Brand tag menggantung dicabut (title 57 -> 39). Description diperpanjang dari
// 116 ke dalam rentang 120-160.
const PAGE_TITLE = "Topik Artikel Properti — Semua Kategori";
const PAGE_DESCRIPTION =
  "Jelajahi tiga topik editorial properti: panduan beli rumah dan KPR, ulasan kawasan Parung serta Bogor Selatan, dan informasi terbaru seputar proyek GDC Parung.";
const OG_IMAGE = ogImage(
  articleCategoryDefinitions["panduan-properti"].imagePublicId,
);

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Topik Artikel Properti Grand Duta City",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const latestArticles = getLatestArticles(6);

const schemas = graph([
  {
    "@type": "CollectionPage",
    // `@id` sebelumnya PERSIS `PAGE_URL` tanpa fragment, sementara
    // /category/[slug] memakai `#collection`. Dua konvensi untuk peran node
    // yang sama membuat graf sulit ditelusuri; kini keduanya seragam.
    "@id": `${PAGE_URL}#collection`,
    url: PAGE_URL,
    name: "Semua Kategori Artikel",
    description: "Daftar kategori artikel properti dari Grand Duta City South of Jakarta.",
    inLanguage: "id-ID",
    // Referensi murni: `@type` dihapus supaya node ini tidak dianggap
    // mendefinisikan ulang WebSite milik homepage.
    isPartOf: ref(SCHEMA_ID.website),
    breadcrumb: ref(`${PAGE_URL}#breadcrumb`),
    mainEntity: ref(`${PAGE_URL}#itemlist`),
  },
  breadcrumbNode(
    [
      { name: "Artikel", path: "/artikel" },
      { name: "Semua Kategori", path: "/category" },
    ],
    PAGE_URL,
  ),
  {
    "@type": "ItemList",
    "@id": `${PAGE_URL}#itemlist`,
    name: "Kategori Artikel Grand Duta City",
    url: PAGE_URL,
    numberOfItems: articleCategorySlugs.length,
    itemListElement: articleCategorySlugs.map((slug, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: articleCategoryDefinitions[slug].name,
      url: toAbsoluteUrl(getCategoryPath(slug)),
      })),
  },
]);

export default function CategoryHubPage() {
  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-brand-light">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />

        <section className="relative overflow-hidden bg-[#0B120C] pt-32 pb-20 md:pt-40 md:pb-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.16),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(245,241,232,0.08),transparent_18%),linear-gradient(180deg,rgba(11,18,12,0.92),rgba(11,18,12,1))]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#F5A524]/30 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="mb-8">
              <Breadcrumb
                items={[
                  { label: "Artikel", href: "/artikel" },
                  { label: "Semua Kategori" },
                ]}
              />
            </div>

            <p className="text-[10px] uppercase tracking-[0.45em] text-[#F5A524]">
              Editorial Hub / Topik Artikel
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] text-[#F5F1E8] md:text-6xl lg:text-7xl">
              Topik Artikel
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#F5F1E8]/72 md:text-lg">
              Pilih topik yang ingin Anda pelajari seputar properti dan{" "}
              <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>.
            </p>
          </div>
        </section>

        <section className="bg-brand-light">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20 lg:px-14">
            <div className="mb-8 flex items-end justify-between gap-6 border-b border-[#0B120C]/8 pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                  Semua Kategori
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0B120C] md:text-4xl">
                  Pilih topik yang paling sesuai dengan informasi yang sedang Anda cari
                </h2>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {articleCategorySlugs.map((slug) => {
                const category = articleCategoryDefinitions[slug];
                const articleCount = getCategoryArticleCount(slug);

                return (
                  <article
                    key={slug}
                    className="group overflow-hidden rounded-[32px] border border-[#0B120C]/8 bg-white shadow-[0_18px_60px_rgba(11,18,12,0.06)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(11,18,12,0.1)]"
                  >
                    <Link href={getCategoryPath(slug)} className="block">
                      <div className="relative aspect-[5/4] overflow-hidden">
                        <Image
                          src={thumbImage(category.imagePublicId)}
                          alt={category.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B120C]/55 via-[#0B120C]/10 to-transparent" />
                      </div>
                    </Link>

                    <div className="flex h-full flex-col px-6 py-6 md:px-7">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-[#A85D16]">
                        {category.shortName}
                      </p>
                      <h3 className="mt-4 font-serif text-3xl leading-tight text-[#0B120C]">
                        <Link
                          href={getCategoryPath(slug)}
                          className="transition-colors hover:text-[#A85D16]"
                        >
                          {category.name}
                        </Link>
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-[#0B120C]/68">
                        {category.description}
                      </p>

                      <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#0B120C]/8 pt-5">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[#0B120C]/45">
                          {articleCount} artikel
                        </span>
                        <Link
                          href={getCategoryPath(slug)}
                          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0B120C] transition-colors hover:text-[#A85D16]"
                        >
                          Lihat Semua
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-brand-light">
          <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10 md:pb-20 lg:px-14">
            <div className="mb-8 flex items-end justify-between gap-6 border-b border-[#0B120C]/8 pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                  Artikel Terbaru
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0B120C] md:text-4xl">
                  Baca artikel terbaru dari seluruh kategori
                </h2>
              </div>
              <Link
                href="/artikel"
                className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0B120C] transition-colors hover:text-[#A85D16] md:inline-flex"
              >
                Lihat Semua Artikel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {latestArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-light pb-20 md:pb-24">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="overflow-hidden rounded-[32px] bg-[#0B120C] text-[#F5F1E8] shadow-[0_28px_70px_rgba(11,18,12,0.18)]">
              <div className="grid gap-10 px-6 py-8 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:px-10">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[#F5A524]">
                    Langkah Berikutnya
                  </p>
                  <h2 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
                    Cari unit di Grand Duta City?
                  </h2>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#F5F1E8]/72">
                    Setelah membaca topik yang paling relevan, lanjutkan ke pricelist
                    untuk melihat pilihan unit dan gambaran harga terbaru.
                  </p>
                </div>

                <div className="grid gap-4 self-start">
                  <Link
                    href="/pricelist-grand-duta-city"
                    className="group rounded-[24px] border border-white/10 bg-white/[0.05] px-5 py-5 transition-colors hover:border-[#F5A524]/35 hover:bg-white/[0.08]"
                  >
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[#F5A524]">
                      Promo & Harga
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="font-serif text-2xl leading-tight">
                        Lihat Pricelist Grand Duta City
                      </span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
