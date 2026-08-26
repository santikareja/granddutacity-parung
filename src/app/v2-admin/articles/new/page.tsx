import { listCategories, listTags } from "@/lib/v2-admin/articles";
import { createEmptyState } from "@/lib/v2-admin/lexical";
import ArticleForm, { type ArticleFormData } from "../article-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const [categories, tags] = await Promise.all([
    listCategories().catch(() => []),
    listTags().catch(() => []),
  ]);

  const initial: ArticleFormData = {
    id: null,
    title: "",
    slug: "",
    excerpt: "",
    content: createEmptyState(),
    featuredImageId: null,
    status: "draft",
    seoMetaTitle: "",
    seoMetaDescription: "",
    seoFocusKeyword: "",
    categoryIds: [],
    tagIds: [],
    aiGenerated: false,
    aiTopic: null,
  };

  return <ArticleForm initial={initial} categories={categories} tags={tags} />;
}
