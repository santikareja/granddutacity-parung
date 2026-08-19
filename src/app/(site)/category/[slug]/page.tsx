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
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
};

function buildSortHref(slug: ArticleCategorySlug, sortKey: string) {
  const cleanPath = getCategoryPagePath(slug, 1);
  return sortKey === "rekomendasi" ? cleanPath : `${cleanPath}?sort=${sortKey}`;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryDefinition(slug);

  if (!category) {
    return {};
  }

  return buildCategoryArchiveMetadata({
    category,
    currentPath: getCategoryPagePath(slug as ArticleCategorySlug, 1),
    canonicalPath: getCategoryPagePath(slug as ArticleCategorySlug, 1),
    noIndex: false,
  });
}

export default async function CategoryArchiveRoute({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const category = getCategoryDefinition(slug);

  if (!category) {
    notFound();
  }

  const categorySlug = slug as ArticleCategorySlug;
  const sortKey = resolveSortKey(resolvedSearchParams.sort);
  const allArticles = sortArticles(getArticlesByCategory(categorySlug), sortKey);
  const featured = getFeaturedArticle(categorySlug);
  const listingArticles = featured
    ? allArticles.filter((article) => article.id !== featured.id)
    : allArticles;
  const paginationData = paginateArticles(
    listingArticles,
    1,
    CATEGORY_PAGE_SIZE,
  );
  const canonicalPath = getCategoryPagePath(categorySlug, 1);
  const totalPages = Math.max(
    1,
    Math.ceil(listingArticles.length / CATEGORY_PAGE_SIZE),
  );

  return (
    <CategoryArchivePage
      category={category}
      articles={paginationData.items}
      featuredArticle={featured}
      relatedTags={getTagsForArticles(allArticles)}
      relatedCategories={getRelatedCategories(categorySlug)}
      sortKey={sortKey}
      sortHrefBuilder={(nextSort) => buildSortHref(categorySlug, nextSort)}
      pagination={{
        pageNumber: 1,
        totalPages,
        totalItems: listingArticles.length,
        itemOffset: 0,
        basePath: canonicalPath,
        currentPath: canonicalPath,
        nextPath: totalPages > 1 ? getCategoryPagePath(categorySlug, 2) : undefined,
      }}
      canonicalPath={canonicalPath}
      noIndex={false}
    />
  );
}
