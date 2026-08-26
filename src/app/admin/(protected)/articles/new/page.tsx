import { listCategories, listTags } from "@/lib/v2-admin/articles";
import { createEmptyState } from "@/lib/v2-admin/lexical";
import { resolveAiConfig } from "@/lib/v2-admin/ai-runtime";
import { hasCloudinaryConfig } from "@/lib/v2-admin/media-upload";
import { hasPexels, hasUnsplash } from "@/lib/v2-admin/stock-photos";
import ArticleForm, { type ArticleFormData } from "../article-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const [categories, tags, aiConfig] = await Promise.all([
    listCategories().catch(() => []),
    listTags().catch(() => []),
    // Kegagalan resolusi AI tidak boleh menggagalkan halaman editor; panel AI
    // cukup tampil dalam keadaan nonaktif.
    resolveAiConfig().catch(() => null),
  ]);

  const initial: ArticleFormData = {
    id: null,
    title: "",
    slug: "",
    excerpt: "",
    content: createEmptyState(),
    featuredImageId: null,
    featuredImageUrl: null,
    status: "draft",
    seoMetaTitle: "",
    seoMetaDescription: "",
    seoFocusKeyword: "",
    categoryIds: [],
    tagIds: [],
    aiGenerated: false,
    aiTopic: null,
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
