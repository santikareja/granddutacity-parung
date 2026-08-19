"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  articleCategories,
  sortArticles,
  type ArticleArchiveEntry,
} from "@/lib/articles";
import { ArticleCard } from "./article-card";

type SortKey = "rekomendasi" | "terbaru" | "populer";

type ArticleArchiveClientProps = {
  articles: ArticleArchiveEntry[];
};

const sortLabels: Record<SortKey, string> = {
  rekomendasi: "Rekomendasi",
  terbaru: "Terbaru",
  populer: "Populer",
};

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all duration-300",
        active
          ? "border-[#0B120C] bg-[#0B120C] text-[#F5F1E8]"
          : "border-[#0B120C]/12 bg-white/70 text-[#0B120C]/70 hover:border-[#F5A524]/40 hover:text-[#0B120C]",
      )}
    >
      {label}
    </button>
  );
}

function SortChip({
  sortKey,
  active,
  onClick,
}: {
  sortKey: SortKey;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all duration-300",
        active
          ? "border-[#F5A524] bg-[#F5A524] text-[#0B120C]"
          : "border-[#0B120C]/12 bg-transparent text-[#0B120C]/60 hover:border-[#0B120C]/30 hover:text-[#0B120C]",
      )}
    >
      {sortLabels[sortKey]}
    </button>
  );
}

export function ArticleArchiveClient({
  articles,
}: ArticleArchiveClientProps) {
  const topFeaturedArticles = articles.slice(0, 3);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [sortKey, setSortKey] = useState<SortKey>("terbaru");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawPage = Number.parseInt(params.get("page") ?? "1", 10);
    setCurrentPage(Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage);

    const onPopState = () => {
      const nextParams = new URLSearchParams(window.location.search);
      const nextRawPage = Number.parseInt(nextParams.get("page") ?? "1", 10);
      setCurrentPage(Number.isNaN(nextRawPage) || nextRawPage < 1 ? 1 : nextRawPage);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const resetPaginationUrl = () => {
    window.history.pushState(null, "", window.location.pathname);
  };

  const updatePageInUrl = (page: number) => {
    if (page <= 1) {
      resetPaginationUrl();
      return;
    }

    window.history.pushState(null, "", `?page=${page}`);
  };

  const ITEMS_PER_PAGE = 9;
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const visibleArticles = useMemo(() => {
    const filtered = articles.filter((article) => {
      const matchesCategory =
        activeCategory === "Semua" || article.category === activeCategory;
      const searchableText = [
        article.title,
        article.excerpt,
        article.description,
        article.category,
        ...article.searchTerms,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        deferredQuery.length === 0 || searchableText.includes(deferredQuery);

      return matchesCategory && matchesQuery;
    });

    return sortArticles(filtered, sortKey);
  }, [activeCategory, articles, deferredQuery, sortKey]);

  const totalPages = Math.max(1, Math.ceil(visibleArticles.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedArticles = visibleArticles.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  );

  const paginationPages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, 2, totalPages - 1, totalPages]);
    for (let page = safeCurrentPage - 1; page <= safeCurrentPage + 1; page += 1) {
      if (page > 2 && page < totalPages - 1) {
        pages.add(page);
      }
    }

    return [...pages].sort((a, b) => a - b);
  }, [safeCurrentPage, totalPages]);

  const hasFilters = query.length > 0 || activeCategory !== "Semua";

  return (
    <>
      {topFeaturedArticles.length > 0 ? (
        <section className="border-b border-[#0B120C]/8 bg-[#F5F1E8]">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20 lg:px-14">
            <div className="mb-8 flex items-center justify-between gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                  Pilihan Editor
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0B120C] md:text-4xl">
                  Artikel unggulan minggu ini
                </h2>
              </div>
              <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#0B120C]/45 md:inline-flex">
                <Sparkles className="h-4 w-4 text-[#F5A524]" />
                Fokus editorial
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {topFeaturedArticles.map((featuredArticle) => (
                <Link
                  key={'featured-' + featuredArticle.id}
                  href={featuredArticle.href}
                  className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-[24px] md:h-96"
                >
                  <Image
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.coverAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B120C]/90 via-[#0B120C]/40 to-transparent" />
                  
                  <div className="relative z-10 p-6 md:p-8">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-[#F5A524]/35 bg-[#F5A524]/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F5F1E8]">
                        {featuredArticle.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl leading-tight text-[#F5F1E8] line-clamp-2 md:text-[1.75rem]">
                      {featuredArticle.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#F5F1E8]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20 lg:px-14">
          <div className="mb-10 flex flex-col gap-6 border-b border-[#0B120C]/8 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                Eksplorasi Artikel
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0B120C] md:text-4xl">
                Jelajahi artikel tentang project dan properti
              </h2>
            </div>

            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#0B120C]/45">
              <Filter className="h-4 w-4 text-[#F5A524]" />
              Filter visual untuk artikel project dan artikel properti
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <label className="relative block">
              <span className="sr-only">Cari artikel</span>
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0B120C]/35" />
              <input
                type="search"
                value={query}
                onChange={(event) =>
                  startTransition(() => {
                    setQuery(event.target.value);
                    setCurrentPage(1);
                    resetPaginationUrl();
                  })
                }
                placeholder="Cari topik, panduan KPR, atau update proyek"
                className="h-14 w-full rounded-full border border-[#0B120C]/12 bg-white/75 pl-12 pr-5 text-sm text-[#0B120C] outline-none transition-colors placeholder:text-[#0B120C]/35 focus:border-[#F5A524] focus:bg-white"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {(["rekomendasi", "terbaru", "populer"] as SortKey[]).map(
                (value) => (
                  <SortChip
                    key={value}
                    sortKey={value}
                    active={sortKey === value}
                    onClick={() => startTransition(() => {
                      setSortKey(value);
                      setCurrentPage(1);
                      resetPaginationUrl();
                    })}
                  />
                ),
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <CategoryChip
              label="Semua"
              active={activeCategory === "Semua"}
              onClick={() => startTransition(() => {
                setActiveCategory("Semua");
                setCurrentPage(1);
                resetPaginationUrl();
              })}
            />
            {articleCategories.map((category) => (
              <CategoryChip
                key={category}
                label={category}
                active={activeCategory === category}
                onClick={() =>
                  startTransition(() => {
                    setActiveCategory(category);
                    setCurrentPage(1);
                    resetPaginationUrl();
                  })
                }
              />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[#0B120C]/45">
            <span>{visibleArticles.length} artikel ditampilkan</span>
            <span className="h-1 w-1 rounded-full bg-[#0B120C]/20" />
            <span>Sort: {sortLabels[sortKey]}</span>
            <span className="h-1 w-1 rounded-full bg-[#0B120C]/20" />
            <span>
              Halaman {safeCurrentPage} / {totalPages}
            </span>
            {hasFilters ? (
              <>
                <span className="h-1 w-1 rounded-full bg-[#0B120C]/20" />
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      setQuery("");
                      setActiveCategory("Semua");
                      setSortKey("terbaru");
                      setCurrentPage(1);
                      resetPaginationUrl();
                    })
                  }
                  className="font-semibold text-[#A85D16] transition-colors hover:text-[#0B120C]"
                >
                  Reset filter
                </button>
              </>
            ) : null}
          </div>

          {visibleArticles.length > 0 ? (
            <>
              <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {paginatedArticles.map((article) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article}
                    compact
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-16 flex justify-center">
                  <nav
                    aria-label="Pagination artikel"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0B120C]/10 bg-white/85 p-1.5 shadow-[0_14px_40px_rgba(11,18,12,0.1)] backdrop-blur-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(() => {
                          const nextPage = Math.max(1, safeCurrentPage - 1);
                          setCurrentPage(nextPage);
                          updatePageInUrl(nextPage);
                        })
                      }
                      disabled={safeCurrentPage === 1}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-[#0B120C]/60 transition-all hover:border-[#0B120C]/15 hover:bg-[#0B120C]/[0.04] hover:text-[#0B120C] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {paginationPages.map((page, index) => {
                      const prevPage = paginationPages[index - 1];
                      const hasGap = prevPage !== undefined && page - prevPage > 1;

                      return (
                        <div key={`page-${page}`} className="flex items-center gap-1.5">
                          {hasGap ? (
                            <span className="px-1 text-sm font-semibold text-[#0B120C]/35">...</span>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              startTransition(() => {
                                setCurrentPage(page);
                                updatePageInUrl(page);
                              })
                            }
                            aria-current={safeCurrentPage === page ? "page" : undefined}
                            className={cn(
                              "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-all",
                              safeCurrentPage === page
                                ? "bg-[#0B120C] text-[#F5F1E8] shadow-[0_10px_28px_rgba(11,18,12,0.28)]"
                                : "text-[#0B120C]/70 hover:bg-[#F5A524]/15 hover:text-[#0B120C]",
                            )}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        startTransition(() => {
                          const nextPage = Math.min(totalPages, safeCurrentPage + 1);
                          setCurrentPage(nextPage);
                          updatePageInUrl(nextPage);
                        })
                      }
                      disabled={safeCurrentPage === totalPages}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-[#0B120C]/60 transition-all hover:border-[#0B120C]/15 hover:bg-[#0B120C]/[0.04] hover:text-[#0B120C] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="mt-12 rounded-[28px] border border-dashed border-[#0B120C]/16 bg-white/70 px-6 py-14 text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#A85D16]">
                Tidak ditemukan
              </p>
              <h3 className="mt-3 font-serif text-3xl text-[#0B120C]">
                Belum ada artikel yang cocok
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#0B120C]/65">
                Coba kata kunci yang lebih umum atau kembalikan filter ke semua
                kategori supaya daftar artikel kembali tampil.
              </p>
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    setQuery("");
                    setActiveCategory("Semua");
                    setSortKey("terbaru");
                    setCurrentPage(1);
                    resetPaginationUrl();
                  })
                }
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0B120C] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5F1E8] transition-colors hover:bg-[#A85D16]"
              >
                Tampilkan Semua Artikel
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-16 overflow-hidden rounded-[32px] bg-[#0B120C] text-[#F5F1E8] shadow-[0_28px_70px_rgba(11,18,12,0.18)]">
            <div className="grid gap-10 px-6 py-8 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:px-10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#F5A524]">
                  Langkah Berikutnya
                </p>
                <h3 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
                  Setelah membaca artikel, lanjutkan ke langkah yang paling Anda butuhkan.
                </h3>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[#F5F1E8]/72">
                  Jika Anda sudah punya gambaran cluster, cek pricelist terbaru.
                  Jika masih membandingkan kebutuhan, konsultasikan langsung
                  dengan tim marketing agar pilihan unit, skema KPR, dan akses
                  lokasinya bisa disesuaikan.
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

                <Link
                  href="/kontak"
                  className="group rounded-[24px] border border-white/10 bg-white/[0.05] px-5 py-5 transition-colors hover:border-[#F5A524]/35 hover:bg-white/[0.08]"
                >
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[#F5A524]">
                    Konsultasi
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="font-serif text-2xl leading-tight">
                      Hubungi Tim Marketing
                    </span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
