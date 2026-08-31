import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  articleTagDefinitions,
  getAuthorDefinition,
  getAuthorPath,
  getCategoryPath,
  getTagPath,
  type ArticleArchiveEntry,
} from "@/lib/articles";

type ArticleCardProps = {
  article: ArticleArchiveEntry;
  hideCategoryLink?: boolean;
  compact?: boolean;
  className?: string;
};

export function ArticleCard({
  article,
  hideCategoryLink = false,
  compact = false,
  className,
}: ArticleCardProps) {
  const categoryHref = getCategoryPath(article.categorySlug);
  const authorHref = getAuthorPath(article.authorSlug);
  const authorName = getAuthorDefinition(article.authorSlug)?.name ?? "Tim Editorial GDC";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#0B120C]/8 bg-white/75 shadow-[0_14px_34px_rgba(11,18,12,0.05)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(11,18,12,0.08)]",
        className,
      )}
    >
      <div className="relative">
        <Link
          href={article.href}
          className={cn(
            "relative block overflow-hidden",
            compact ? "aspect-[16/10]" : "aspect-[4/3]",
          )}
        >
          <Image
            src={article.coverImage}
            alt={article.coverAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B120C]/65 via-[#0B120C]/15 to-[#0B120C]/15" />
        </Link>

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            {hideCategoryLink ? (
              <span className="inline-flex rounded-full border border-white/25 bg-[#0B120C]/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5F1E8]">
                {article.category}
              </span>
            ) : (
              <Link
                href={categoryHref}
                className="pointer-events-auto inline-flex rounded-full border border-white/25 bg-[#0B120C]/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5F1E8] transition-colors hover:border-[#F5A524]/50 hover:bg-[#F5A524]/20"
              >
                {article.category}
              </Link>
            )}

            <span className="inline-flex rounded-full border border-white/18 bg-[#0B120C]/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F5F1E8]/90">
              {article.readingTime}
            </span>
          </div>

          {article.tags.length > 0 ? (
            <div className="flex justify-end gap-2">
              {article.tags.slice(0, compact ? 2 : 3).map((tag) => {
                const tagDefinition =
                  articleTagDefinitions[tag as keyof typeof articleTagDefinitions];

                // Tag dari DB yang TIDAK punya definisi arsip dirender sebagai
                // chip biasa, BUKAN tautan.
                //
                // Sebelumnya fallback di sini membuat `/tag/<slug>` untuk tag
                // apa pun. Karena arsipnya tidak ada, URL itu 308-redirect —
                // dan audit tautan internal menemukan 4 di antaranya tayang di
                // /artikel (`perumahan`, `investasi`, `desain`, `brand`;
                // keempatnya nol kemunculan di articleTagDefinitions).
                //
                // Setiap tautan internal ke URL yang me-redirect memaksa Google
                // satu hop ekstra sebelum sampai tujuan, memboroskan crawl
                // budget dan menipiskan link equity. Label tag tetap
                // ditampilkan supaya informasi topiknya tidak hilang bagi
                // pembaca.
                if (!tagDefinition) {
                  return (
                    <span
                      key={String(tag)}
                      className="inline-flex rounded-full border border-white/18 bg-[#0B120C]/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/90"
                    >
                      {String(tag)}
                    </span>
                  );
                }

                return (
                  <Link
                    key={String(tag)}
                    href={getTagPath(tag as keyof typeof articleTagDefinitions)}
                    className="pointer-events-auto inline-flex rounded-full border border-white/18 bg-[#0B120C]/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/90 transition-colors hover:border-[#F5A524]/45 hover:bg-[#F5A524]/20"
                  >
                    {tagDefinition.name}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "px-5 py-5" : "px-6 py-6 md:px-7")}>
        <div className={cn("mb-3 text-[#0B120C]/50", compact ? "text-[10px] tracking-[0.12em]" : "text-[11px] tracking-[0.14em]")}>
          Terakhir diperbarui: {article.updatedLabel}
        </div>

        <h3 className={cn("font-serif leading-tight text-[#0B120C]", compact ? "text-[1.38rem] line-clamp-2" : "text-[1.65rem] line-clamp-3")}>
          <Link href={article.href} className="transition-colors hover:text-[#A85D16]">
            {article.title}
          </Link>
        </h3>

        <p className={cn("flex-1 text-[#0B120C]/68", compact ? "mt-3 text-[13px] leading-6 line-clamp-3" : "mt-4 text-sm leading-7 line-clamp-4")}>
          {article.excerpt}
        </p>

        <div className={cn("mt-5 border-t border-[#0B120C]/8 pt-4 text-[#0B120C]/55", compact ? "text-[10px] tracking-[0.12em]" : "text-[11px] tracking-[0.14em]")}>
          Ditulis oleh{" "}
          <Link
            href={authorHref}
            className="font-semibold text-[#0B120C] transition-colors hover:text-[#A85D16]"
          >
            {authorName}
          </Link>
        </div>
      </div>
    </article>
  );
}
