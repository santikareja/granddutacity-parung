import { notFound } from "next/navigation";

import {
  getArticleById,
  listCategories,
  listTags,
} from "@/lib/v2-admin/articles";
import { resolveAiConfig } from "@/lib/v2-admin/ai-runtime";
import { hasCloudinaryConfig } from "@/lib/v2-admin/media-upload";
import { hasPexels, hasUnsplash } from "@/lib/v2-admin/stock-photos";
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

  const [article, categories, tags, aiConfig] = await Promise.all([
    getArticleById(id),
    listCategories().catch(() => []),
    listTags().catch(() => []),
    // Kegagalan resolusi AI tidak boleh menggagalkan halaman editor.
    resolveAiConfig().catch(() => null),
  ]);

  if (!article) notFound();

  const initial: ArticleFormData = {
    id: article.id,
    title: article.title ?? "",
    slug: article.slug ?? "",
    excerpt: article.excerpt ?? "",
    content: article.content,
    featuredImageId: article.featuredImageId,
    featuredImageUrl: article.featuredImageUrl,
    status: article.status === "published" ? "published" : "draft",
    seoMetaTitle: article.seoMetaTitle ?? "",
    seoMetaDescription: article.seoMetaDescription ?? "",
    seoFocusKeyword: article.seoFocusKeyword ?? "",
    categoryIds: article.categoryIds,
    tagIds: article.tagIds,
    aiGenerated: Boolean(article.aiGenerated),
    aiTopic: article.aiTopic,
  };

  return (
    <ArticleForm
      initial={initial}
      categories={categories}
      tags={tags}
      mediaCapabilities={{
        cloudinaryReady: hasCloudinaryConfig(),
        stockProviders: { unsplash: hasUnsplash(), pexels: hasPexels() },
      }}
      aiEnabled={aiConfig !== null}
      aiModel={aiConfig?.model ?? null}
    />
  );
}
