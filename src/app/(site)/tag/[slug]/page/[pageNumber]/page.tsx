import { notFound } from "next/navigation";
import {
  TAG_PAGE_SIZE,
  getArticlesByTag,
  getCategoryDefinition,
  getTagDefinition,
  getTagPageCount,
  getTagPagePath,
  paginateArticles,
  sortArticles,
  type ArticleTagSlug,
} from "@/lib/articles";
import {
  TagArchivePage,
  buildTagArchiveMetadata,
} from "@/components/articles/article-taxonomy-archive";

type Props = {
  params: Promise<{ slug: string; pageNumber: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug, pageNumber } = await params;
  const tag = getTagDefinition(slug);
  const page = Number(pageNumber);

  if (!tag || !Number.isInteger(page) || page <= 1) {
    return {};
  }

  const articles = sortArticles(
    getArticlesByTag(slug as ArticleTagSlug),
    "rekomendasi",
  );

  return buildTagArchiveMetadata({
    tag,
    canonicalPath: getTagPagePath(slug as ArticleTagSlug, page),
    currentPath: getTagPagePath(slug as ArticleTagSlug, page),
    ogImageUrl:
      articles[0]?.coverImage ??
      "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776105396/Panduan_Properti_bg5b0y.webp",
  });
}

export default async function TagArchivePaginationRoute({ params }: Props) {
  const { slug, pageNumber } = await params;
  const tag = getTagDefinition(slug);
  const page = Number(pageNumber);

  if (!tag || !Number.isInteger(page) || page <= 1) {
    notFound();
  }

  const tagSlug = slug as ArticleTagSlug;
  const allArticles = sortArticles(getArticlesByTag(tagSlug), "rekomendasi");
  const totalPages = getTagPageCount(tagSlug);

  if (page > totalPages) {
    notFound();
  }

  const paginationData = paginateArticles(allArticles, page, TAG_PAGE_SIZE);
  const relatedCategories = Array.from(
    new Set(allArticles.map((article) => article.categorySlug)),
  ).map((categorySlug) => getCategoryDefinition(categorySlug));

  return (
    <TagArchivePage
      tag={tag}
      articles={paginationData.items}
      relatedCategories={relatedCategories}
      pagination={{
        pageNumber: page,
        totalPages,
        totalItems: paginationData.totalItems,
        itemOffset: (page - 1) * TAG_PAGE_SIZE,
        basePath: getTagPagePath(tagSlug, 1),
        currentPath: getTagPagePath(tagSlug, page),
        prevPath: page > 1 ? getTagPagePath(tagSlug, page - 1) : undefined,
        nextPath: page < totalPages ? getTagPagePath(tagSlug, page + 1) : undefined,
      }}
      canonicalPath={getTagPagePath(tagSlug, page)}
    />
  );
}
