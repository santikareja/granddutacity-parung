import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { listArticles } from "@/lib/v2-admin/articles";
import { createArticle } from "@/lib/v2-admin/article-write";
import { recordAudit } from "@/lib/v2-admin/audit";
import { crossPostArticleToTumblr } from "@/lib/social/crosspost";

export const runtime = "nodejs";

// Segarkan cache ISR halaman publik agar artikel yang baru dibuat/diubah
// langsung terlihat, tanpa menunggu jendela revalidate (5 menit).
const revalidateArticle = (slug: string | null | undefined): void => {
  try {
    if (slug) revalidatePath(`/${slug}`);
    revalidatePath("/artikel");
  } catch (error) {
    // Revalidasi gagal tidak boleh menggagalkan penyimpanan artikel.
    console.error("[api/v2/articles] revalidate gagal:", error);
  }
};

const asNumberArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((v) => Number.isInteger(v) && v > 0)
    : [];

// GET /api/v2/articles?page=&search=&status=
export async function GET(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const search = url.searchParams.get("search") ?? "";
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam === "draft" || statusParam === "published" ? statusParam : "all";

  try {
    const result = await listArticles({ page, search, status });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/v2/articles] GET gagal:", error);
    return apiError("Gagal memuat daftar artikel.", 500);
  }
}

// POST /api/v2/articles — buat artikel baru.
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Body tidak valid.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return apiError("Judul wajib diisi.");

  try {
    const created = await createArticle({
      title,
      slug: typeof body.slug === "string" ? body.slug : null,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : null,
      content: body.content,
      featuredImageId:
        typeof body.featuredImageId === "number" ? body.featuredImageId : null,
      status: body.status === "published" ? "published" : "draft",
      publishedAt: typeof body.publishedAt === "string" ? body.publishedAt : null,
      seoMetaTitle:
        typeof body.seoMetaTitle === "string" ? body.seoMetaTitle : null,
      seoMetaDescription:
        typeof body.seoMetaDescription === "string"
          ? body.seoMetaDescription
          : null,
      seoFocusKeyword:
        typeof body.seoFocusKeyword === "string" ? body.seoFocusKeyword : null,
      categoryIds: asNumberArray(body.categoryIds),
      tagIds: asNumberArray(body.tagIds),
      aiGenerated: body.aiGenerated === true,
      aiTopic: typeof body.aiTopic === "string" ? body.aiTopic : null,
      aiOutline: body.aiOutline ?? null,
    });

    // Audit best-effort (fire-and-forget): tidak menyentuh response.
    void recordAudit({
      action: "article:create",
      entity: "artikel",
      entityId: created.id,
      userId: guard.user.id,
      userEmail: guard.user.email,
      summary: {
        title,
        status: body.status === "published" ? "published" : "draft",
      },
    });

    // Artikel baru yang langsung dipublish harus segera tampil di URL live-nya.
    if (created.slug && body.status === "published") {
      revalidateArticle(created.slug);
    }

    // Cross-post Tumblr non-blocking untuk artikel yang langsung dipublish.
    if (created.justPublished) {
      after(() => crossPostArticleToTumblr(created.id, { userId: guard.user.id }));
    }

    return NextResponse.json({ article: created }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/articles] POST gagal:", error);
    const message =
      error instanceof Error ? error.message : "Gagal membuat artikel.";
    // Gagal validasi kesiapan publish adalah kesalahan input → 400.
    const status = message.startsWith("Belum siap dipublish") ? 400 : 500;
    return apiError(message, status);
  }
}
