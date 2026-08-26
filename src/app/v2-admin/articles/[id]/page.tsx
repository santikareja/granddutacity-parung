import { notFound } from "next/navigation";

import {
  getArticleById,
  listCategories,
  listTags,
} from "@/lib/v2-admin/articles";
import ArticleForm, { type ArticleFormData } from "../article-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;

  // Rute /new ditangani halaman terpisah; ini khusus id numerik.
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [article, categories, tags] = await Promise.all([
    getArticleById(id),
    listCategories().catch(() => []),
    listTags().catch(() => []),
  ]);

  if (!article) notFound();

  const initial: ArticleFormData = {
    id: article.id,
    title: article.title ?? "",
    slug: article.slug ?? "",
    excerpt: article.excerpt ?? "",
    content: article.content,
    featuredImageId: article.featuredImageId,
    status: article.status === "published" ? "published" : "draft",
    seoMetaTitle: article.seoMetaTitle ?? "",
    seoMetaDescription: article.seoMetaDescription ?? "",
    seoFocusKeyword: article.seoFocusKeyword ?? "",
    categoryIds: article.categoryIds,
    tagIds: article.tagIds,
    aiGenerated: Boolean(article.aiGenerated),
    aiTopic: article.aiTopic,
  };

  return <ArticleForm initial={initial} categories={categories} tags={tags} />;
}
