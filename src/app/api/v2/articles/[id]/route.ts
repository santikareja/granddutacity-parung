import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireApiUser, requireApiAdmin, apiError } from "@/lib/v2-auth/api-guard";
import { getArticleById } from "@/lib/v2-admin/articles";
import {
  deleteArticle,
  setArticleStatus,
  updateArticle,
} from "@/lib/v2-admin/article-write";
import { recordAudit } from "@/lib/v2-admin/audit";

export const runtime = "nodejs";

// Segarkan cache ISR halaman publik agar perubahan artikel langsung terlihat,
// tanpa menunggu jendela revalidate (5 menit).
const revalidateArticle = (slug: string | null | undefined): void => {
  try {
    if (slug) revalidatePath(`/${slug}`);
    revalidatePath("/artikel");
  } catch (error) {
    console.error("[api/v2/articles/:id] revalidate gagal:", error);
  }
};

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const asNumberArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((v) => Number.isInteger(v) && v > 0)
    : [];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID artikel tidak valid.");

  try {
    const article = await getArticleById(id);
    if (!article) return apiError("Artikel tidak ditemukan.", 404);
    return NextResponse.json({ article });
  } catch (error) {
    console.error("[api/v2/articles/:id] GET gagal:", error);
    return apiError("Gagal memuat artikel.", 500);
  }
}

// PATCH — dua mode:
//   { statusOnly: true, status } → ubah status saja (aksi cepat dari list)
//   payload lengkap              → update seluruh field
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID artikel tidak valid.");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Body tidak valid.");
  }

  const status = body.status === "published" ? "published" : "draft";

  try {
    if (body.statusOnly === true) {
      const updated = await setArticleStatus(id, status);
      if (!updated) return apiError("Artikel tidak ditemukan.", 404);

      revalidateArticle(updated.slug);

      // Audit best-effort (fire-and-forget): tidak menyentuh response.
      void recordAudit({
        action: "article:status",
        entity: "artikel",
        entityId: id,
        userId: guard.user.id,
        userEmail: guard.user.email,
        summary: { status },
      });

      return NextResponse.json({ ok: true, status });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return apiError("Judul wajib diisi.");

    const updated = await updateArticle(id, {
      title,
      slug: typeof body.slug === "string" ? body.slug : null,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : null,
      content: body.content,
      featuredImageId:
        typeof body.featuredImageId === "number" ? body.featuredImageId : null,
      status,
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

    if (!updated) return apiError("Artikel tidak ditemukan.", 404);

    revalidateArticle(updated.slug);

    // Audit best-effort (fire-and-forget): tidak menyentuh response.
    void recordAudit({
      action: "article:update",
      entity: "artikel",
      entityId: id,
      userId: guard.user.id,
      userEmail: guard.user.email,
      summary: { title, status },
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("[api/v2/articles/:id] PATCH gagal:", error);
    const message =
      error instanceof Error ? error.message : "Gagal memperbarui artikel.";
    // Gagal validasi kesiapan publish adalah kesalahan input → 400.
    const status = message.startsWith("Belum siap dipublish") ? 400 : 500;
    return apiError(message, status);
  }
}

// DELETE — menghapus artikel bersifat destruktif, batasi ke admin.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID artikel tidak valid.");

  try {
    const removed = await deleteArticle(id);
    if (!removed) return apiError("Artikel tidak ditemukan.", 404);

    // Halaman artikel yang dihapus harus berhenti tampil dari cache.
    revalidateArticle(removed.slug);

    // Audit best-effort (fire-and-forget): tidak menyentuh response.
    void recordAudit({
      action: "article:delete",
      entity: "artikel",
      entityId: id,
      userId: guard.user.id,
      userEmail: guard.user.email,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/v2/articles/:id] DELETE gagal:", error);
    return apiError("Gagal menghapus artikel.", 500);
  }
}
