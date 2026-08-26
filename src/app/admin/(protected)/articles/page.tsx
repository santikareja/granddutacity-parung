import { getSessionUser } from "@/lib/v2-auth/session";
import { listArticles } from "@/lib/v2-admin/articles";
import ArticlesClient, { type ArticleRow } from "./articles-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = {
  page?: string;
  search?: string;
  status?: string;
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();

  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search ?? "";
  const status =
    params.status === "draft" || params.status === "published"
      ? params.status
      : "all";

  let items: ArticleRow[] = [];
  let total = 0;
  let totalPages = 1;
  let error: string | null = null;

  try {
    const result = await listArticles({ page, search, status });
    // Date perlu diserialisasi sebelum menyeberang ke client component.
    items = result.items.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
      updatedAt: item.updatedAt.toISOString(),
      aiGenerated: item.aiGenerated,
      categoryNames: item.categoryNames,
    }));
    total = result.total;
    totalPages = result.totalPages;
  } catch (err) {
    console.error("[v2-admin/articles] gagal memuat:", err);
    error = "Gagal memuat daftar artikel dari database.";
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="mx-auto mb-4 max-w-6xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <ArticlesClient
        initialItems={items}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        status={status}
        canDelete={user?.role === "admin"}
      />
    </>
  );
}
