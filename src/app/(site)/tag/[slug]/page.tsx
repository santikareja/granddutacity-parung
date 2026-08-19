import { notFound } from "next/navigation";
import {
  TAG_PAGE_SIZE,
  getArticlesByTag,
  getCategoryDefinition,
  getTagDefinition,
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
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tag = getTagDefinition(slug);

  if (!tag) {
    return {};
  }

  const articles = sortArticles(
    getArticlesByTag(slug as ArticleTagSlug),
    "rekomendasi",
  );

  return buildTagArchiveMetadata({
    tag,
    canonicalPath: getTagPagePath(slug as ArticleTagSlug, 1),
    currentPath: getTagPagePath(slug as ArticleTagSlug, 1),
    ogImageUrl:
      articles[0]?.coverImage ??
      "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776105396/Panduan_Properti_bg5b0y.webp",
  });
}

export default async function TagArchiveRoute({ params }: Props) {
  const { slug } = await params;
  const tag = getTagDefinition(slug);

  if (!tag) {
    notFound();
  }

  const tagSlug = slug as ArticleTagSlug;
  const allArticles = sortArticles(getArticlesByTag(tagSlug), "rekomendasi");
  const paginationData = paginateArticles(allArticles, 1, TAG_PAGE_SIZE);
  const relatedCategories = Array.from(
    new Set(allArticles.map((article) => article.categorySlug)),
  ).map((categorySlug) => getCategoryDefinition(categorySlug));

  return (
    <TagArchivePage
      tag={tag}
      articles={paginationData.items}
      relatedCategories={relatedCategories}
      pagination={{
        pageNumber: 1,
        totalPages: paginationData.totalPages,
        totalItems: paginationData.totalItems,
        itemOffset: 0,
        basePath: getTagPagePath(tagSlug, 1),
        currentPath: getTagPagePath(tagSlug, 1),
        nextPath:
          paginationData.totalPages > 1 ? getTagPagePath(tagSlug, 2) : undefined,
      }}
      canonicalPath={getTagPagePath(tagSlug, 1)}
    />
  );
}
