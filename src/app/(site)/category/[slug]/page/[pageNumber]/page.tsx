import { notFound } from "next/navigation";
import {
  CATEGORY_PAGE_SIZE,
  getArticlesByCategory,
  getCategoryDefinition,
  getCategoryPagePath,
  getFeaturedArticle,
  getRelatedCategories,
  getTagsForArticles,
  paginateArticles,
  resolveSortKey,
  sortArticles,
  type ArticleCategorySlug,
} from "@/lib/articles";
import {
  CategoryArchivePage,
  buildCategoryArchiveMetadata,
} from "@/components/articles/article-taxonomy-archive";

type Props = {
  params: Promise<{ slug: string; pageNumber: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
};

function buildSortHref(
  slug: ArticleCategorySlug,
  pageNumber: number,
  sortKey: string,
) {
  const cleanPath = getCategoryPagePath(slug, pageNumber);
  return sortKey === "rekomendasi" ? cleanPath : `${cleanPath}?sort=${sortKey}`;
}

export async function generateMetadata({ params }: Props) {
  const { slug, pageNumber } = await params;
  const category = getCategoryDefinition(slug);
  const page = Number(pageNumber);

  if (!category || !Number.isInteger(page) || page <= 1) {
    return {};
  }

  return buildCategoryArchiveMetadata({
    category,
    currentPath: getCategoryPagePath(slug as ArticleCategorySlug, page),
    canonicalPath: getCategoryPagePath(slug as ArticleCategorySlug, 1),
    noIndex: true,
  });
}

export default async function CategoryArchivePaginationRoute({
  params,
  searchParams,
}: Props) {
  const { slug, pageNumber } = await params;
  const resolvedSearchParams = await searchParams;
  const category = getCategoryDefinition(slug);
  const page = Number(pageNumber);

  if (!category || !Number.isInteger(page) || page <= 1) {
    notFound();
  }

  const categorySlug = slug as ArticleCategorySlug;
  const sortKey = resolveSortKey(resolvedSearchParams.sort);
  const allArticles = sortArticles(getArticlesByCategory(categorySlug), sortKey);
  const featured = getFeaturedArticle(categorySlug);
  const listingArticles = featured
    ? allArticles.filter((article) => article.id !== featured.id)
    : allArticles;
  const totalPages = Math.max(
    1,
    Math.ceil(listingArticles.length / CATEGORY_PAGE_SIZE),
  );

  if (page > totalPages) {
    notFound();
  }

  const paginationData = paginateArticles(
    listingArticles,
    page,
    CATEGORY_PAGE_SIZE,
  );

  return (
    <CategoryArchivePage
      category={category}
      articles={paginationData.items}
      relatedTags={getTagsForArticles(allArticles)}
      relatedCategories={getRelatedCategories(categorySlug)}
      sortKey={sortKey}
      sortHrefBuilder={(nextSort) => buildSortHref(categorySlug, page, nextSort)}
      pagination={{
        pageNumber: page,
        totalPages,
        totalItems: paginationData.totalItems,
        itemOffset: (page - 1) * CATEGORY_PAGE_SIZE,
        basePath: getCategoryPagePath(categorySlug, 1),
        currentPath: getCategoryPagePath(categorySlug, page),
        prevPath: page > 1 ? getCategoryPagePath(categorySlug, page - 1) : undefined,
        nextPath:
          page < totalPages ? getCategoryPagePath(categorySlug, page + 1) : undefined,
      }}
      canonicalPath={getCategoryPagePath(categorySlug, 1)}
      noIndex
    />
  );
}
