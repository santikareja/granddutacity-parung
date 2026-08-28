import { NextResponse, after } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { artikel } from "@/db/schema";
import { requireAgentToken } from "@/lib/v2-auth/agent-guard";
import { createArticle } from "@/lib/v2-admin/article-write";
import { crossPostArticleToTumblr } from "@/lib/social/crosspost";
import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { sanitizeAiHtml } from "@/lib/ai/sanitize-html";
import { checkRateLimit } from "@/lib/v2-admin/rate-limit";
import type { ArticleStatus } from "@/lib/v2-admin/articles";

// crypto (verifikasi token) + Drizzle → Node runtime wajib.
export const runtime = "nodejs";

// Batas ringan per token: 30 artikel / menit. Cukup mencegah abuse tanpa
// menghambat pemakaian normal agent.
const RATE_LIMIT = { limit: 30, windowMs: 60_000 };

type Seo = {
  metaTitle?: unknown;
  metaDescription?: unknown;
  focusKeyword?: unknown;
  // Alias yang umum dipakai agent.
  title?: unknown;
  description?: unknown;
  keyword?: unknown;
};

type AgentArticleBody = {
  title?: unknown;
  content?: unknown;
  excerpt?: unknown;
  categoryIds?: unknown;
  tagIds?: unknown;
  featuredImageId?: unknown;
  status?: unknown;
  aiGenerated?: unknown;
  seo?: unknown;
};

const asIntArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0)
    : [];

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

// content bisa berupa:
//   - string HTML → disanitasi lalu dikonversi ke Lexical state
//   - objek Lexical state → dipakai apa adanya
// Selain itu → null (createArticle menerima content opsional).
const resolveContent = (raw: unknown): unknown => {
  if (typeof raw === "string") {
    const cleaned = sanitizeAiHtml(raw);
    return htmlToLexicalState(cleaned);
  }
  if (raw && typeof raw === "object") return raw;
  return undefined;
};

export async function POST(request: Request) {
  const guard = await requireAgentToken(request, "articles:write");
  if (!guard.ok) return guard.response;

  // Rate limit per token (bukan per IP): jejak abuse mengikuti kredensial.
  const rate = checkRateLimit(`agent:${guard.tokenId}`, RATE_LIMIT);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      },
    );
  }

  let body: AgentArticleBody;
  try {
    body = (await request.json()) as AgentArticleBody;
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const title = asString(body.title);
  if (!title) {
    return NextResponse.json(
      { error: "Judul (title) wajib diisi." },
      { status: 400 },
    );
  }

  const status: ArticleStatus = body.status === "published" ? "published" : "draft";

  const seo = (body.seo && typeof body.seo === "object" ? body.seo : {}) as Seo;
  const seoMetaTitle = asString(seo.metaTitle) ?? asString(seo.title);
  const seoMetaDescription =
    asString(seo.metaDescription) ?? asString(seo.description);
  const seoFocusKeyword = asString(seo.focusKeyword) ?? asString(seo.keyword);

  const featuredImageId = Number(body.featuredImageId);

  try {
    const created = await createArticle({
      title,
      content: resolveContent(body.content),
      excerpt: asString(body.excerpt),
      categoryIds: asIntArray(body.categoryIds),
      tagIds: asIntArray(body.tagIds),
      featuredImageId:
        Number.isInteger(featuredImageId) && featuredImageId > 0
          ? featuredImageId
          : null,
      status,
      seoMetaTitle,
      seoMetaDescription,
      seoFocusKeyword,
      // Kolom `source` tidak ada di skema; tandai lewat aiGenerated bila diminta.
      aiGenerated: body.aiGenerated === true,
    });

    // createArticle hanya mengembalikan id; ambil slug (dihasilkan server) untuk balasan.
    const rows = await db
      .select({ slug: artikel.slug })
      .from(artikel)
      .where(eq(artikel.id, created.id))
      .limit(1);

    // Cross-post Tumblr non-blocking bila artikel dibuat langsung published.
    if (created.justPublished) {
      after(() => crossPostArticleToTumblr(created.id));
    }

    return NextResponse.json(
      { id: created.id, slug: rows[0]?.slug ?? null },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/agent/articles] POST gagal:", error);
    // Error validasi publish dari createArticle → 400 (input agent salah).
    const message =
      error instanceof Error ? error.message : "Gagal membuat artikel.";
    const isValidation = /belum siap dipublish/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: isValidation ? 400 : 500 },
    );
  }
}
