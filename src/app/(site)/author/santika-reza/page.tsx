import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ExternalLink,
  Globe,
  NotebookText,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { ArticleCard } from "@/components/articles/article-card";
import { Header } from "@/components/ui/header-2";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { cloudinaryUrl, originalImage } from "@/lib/cloudinary";
import {
  getArticlesByAuthor,
  getAuthorArticleCount,
  getAuthorDefinition,
  sortArticles,
} from "@/lib/articles";

const AUTHOR_SLUG = "santika-reza";
const PAGE_URL = "https://granddutacitysouthofjakarta.com/author/santika-reza";
const author = getAuthorDefinition(AUTHOR_SLUG);
const authorArticles = sortArticles(getArticlesByAuthor(AUTHOR_SLUG), "terbaru");
const authorImage = originalImage(author.imagePublicId);
const authorOgImage = cloudinaryUrl(
  author.imagePublicId,
  "w_400,h_400,c_fill,f_auto,q_auto",
);

export const metadata: Metadata = {
  title: "Santika Reza - Praktisi & Penulis Marketing Properti | Grand Duta City",
  description:
    "Santika Reza adalah praktisi, penulis, dan spesialis marketing properti di Grand Duta City South of Jakarta. Temukan semua artikel dan panduan properti yang ditulis oleh Santika Reza.",
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
    title: "Santika Reza - Praktisi & Penulis Marketing Properti",
    description:
      "Artikel dan panduan properti oleh Santika Reza, praktisi marketing properti di Grand Duta City South of Jakarta.",
    url: PAGE_URL,
    type: "profile",
    siteName: "Grand Duta City South of Jakarta",
    firstName: "Santika",
    lastName: "Reza",
    images: [
      {
        url: authorOgImage,
        width: 400,
        height: 400,
        alt: "Santika Reza - Praktisi Marketing Properti",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Santika Reza - Praktisi & Penulis Marketing Properti",
    description:
      "Artikel properti oleh Santika Reza dari Grand Duta City South of Jakarta.",
    images: [authorOgImage],
  },
};

const authorSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${PAGE_URL}#person`,
  name: author.name,
  url: PAGE_URL,
  jobTitle: author.role,
  description: author.description,
  image: {
    "@type": "ImageObject",
    url: authorImage,
    width: 400,
    height: 400,
  },
  worksFor: {
    "@type": "Organization",
    name: "Grand Duta City South of Jakarta",
    url: "https://granddutacitysouthofjakarta.com",
  },
  knowsAbout: author.knowsAbout,
  sameAs: author.sameAs,
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Beranda",
      item: "https://granddutacitysouthofjakarta.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Artikel",
      item: "https://granddutacitysouthofjakarta.com/artikel",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: author.name,
      item: PAGE_URL,
    },
  ],
};

const schemas = [authorSchema, breadcrumbSchema];

const profileLinks = [
  {
    label: "LinkedIn",
    href: author.linkedinUrl,
    icon: BriefcaseBusiness,
    description: "Lihat profil profesional Santika Reza di LinkedIn.",
  },
  {
    label: "Muckrack",
    href: author.muckrackUrl,
    icon: NotebookText,
    description: "Telusuri jejak publikasi dan profil medianya di Muckrack.",
  },
  {
    label: "Website",
    href: author.websiteUrl,
    icon: Globe,
    description: "Kunjungi website pribadi Santika Reza untuk profil dan karya lain.",
  },
];

export default function AuthorSantikaRezaPage() {
  const articleCount = getAuthorArticleCount(AUTHOR_SLUG);

  return (
    <>
      <Header />
      <main className="relative overflow-hidden bg-brand-light">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />

        <section className="relative overflow-hidden bg-[#0B120C] pt-32 pb-20 md:pt-40 md:pb-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(245,241,232,0.1),transparent_18%),linear-gradient(180deg,rgba(11,18,12,0.92),rgba(11,18,12,1))]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="mb-8">
              <Breadcrumb
                items={[
                  { label: "Artikel", href: "/artikel" },
                  { label: author.name },
                ]}
              />
            </div>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-center">
              <div className="mx-auto w-full max-w-[300px]">
                <div className="relative aspect-square overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                  <Image
                    src={authorImage}
                    alt={`Foto ${author.name}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 280px, 300px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="max-w-4xl">
                <p className="text-[10px] uppercase tracking-[0.42em] text-[#F5A524]">
                  Author Profile
                </p>
                <h1 className="mt-5 font-serif text-5xl leading-[0.98] text-[#F5F1E8] md:text-6xl">
                  {author.name}
                </h1>
                <p className="mt-4 text-base uppercase tracking-[0.22em] text-[#F5F1E8]/62">
                  {author.role}
                </p>
                <p className="mt-6 max-w-3xl text-base leading-8 text-[#F5F1E8]/74 md:text-lg">
                  {author.shortBio}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  {profileLinks.map(({ label, href, icon: Icon, description }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={description}
                      className="group inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm text-[#F5F1E8] transition-colors hover:border-[#F5A524]/40 hover:text-[#F5A524]"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ))}
                </div>

                <div className="mt-8 inline-flex rounded-full border border-[#F5A524]/25 bg-[#F5A524]/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#F5A524]">
                  {articleCount} artikel terbit di Grand Duta City
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-brand-light py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[32px] border border-[#0B120C]/8 bg-white px-6 py-8 shadow-[0_18px_60px_rgba(11,18,12,0.06)] md:px-8">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                  Tentang Penulis
                </p>
                <h2 className="mt-4 font-serif text-3xl leading-tight text-[#0B120C] md:text-4xl">
                  Tentang {author.name}
                </h2>
                <p className="mt-6 max-w-3xl text-sm leading-8 text-[#0B120C]/72 md:text-base">
                  {author.fullBio}
                </p>
                <a
                  href={author.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0B120C] transition-colors hover:text-[#A85D16]"
                >
                  Kunjungi Website Pribadi
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <aside className="rounded-[32px] border border-[#0B120C]/8 bg-[#0B120C] px-6 py-8 text-[#F5F1E8] shadow-[0_20px_60px_rgba(11,18,12,0.14)] md:px-7">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#F5A524]">
                  Fokus Tulisan
                </p>
                <h2 className="mt-4 font-serif text-3xl leading-tight">
                  Topik yang paling sering dibahas
                </h2>
                <div className="mt-7 flex flex-wrap gap-3">
                  {author.knowsAbout.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[#F5F1E8]/76"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <Link
                  href="/artikel"
                  className="mt-10 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5F1E8] transition-colors hover:text-[#F5A524]"
                >
                  Jelajahi Semua Artikel
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-brand-light pb-16 md:pb-20">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-14">
            <div className="mb-8 flex items-end justify-between gap-6 border-b border-[#0B120C]/8 pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                  Artikel Penulis
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0B120C] md:text-4xl">
                  Artikel oleh {author.name}
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
              {authorArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
