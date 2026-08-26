import { getSessionUser } from "@/lib/v2-auth/session";
import { listTagsWithCount } from "@/lib/v2-admin/taxonomy";
import TagsClient, { type TagRow } from "./tags-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const user = await getSessionUser();

  let items: TagRow[] = [];
  let error: string | null = null;

  try {
    const tags = await listTagsWithCount();
    items = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      articleCount: tag.articleCount,
    }));
  } catch (err) {
    console.error("[v2-admin/tags] gagal memuat:", err);
    error = "Gagal memuat daftar tag dari database.";
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
      <TagsClient initialItems={items} canManage={user?.role === "admin"} />
    </>
  );
}
