import { getSessionUser } from "@/lib/v2-auth/session";
import { listCategoriesWithCount } from "@/lib/v2-admin/taxonomy";
import CategoriesClient, { type CategoryRow } from "./categories-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await getSessionUser();

  let items: CategoryRow[] = [];
  let error: string | null = null;

  try {
    const categories = await listCategoriesWithCount();
    items = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      articleCount: category.articleCount,
    }));
  } catch (err) {
    console.error("[v2-admin/categories] gagal memuat:", err);
    error = "Gagal memuat daftar kategori dari database.";
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="mx-auto mb-4 max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <CategoriesClient
        initialItems={items}
        canManage={user?.role === "admin"}
      />
    </>
  );
}
