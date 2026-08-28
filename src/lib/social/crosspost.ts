// Orkestrasi cross-post artikel ke Tumblr saat dipublish. Server-side only.
//
// Dipanggil non-blocking (via `after()` di route) setelah artikel benar-benar
// bertransisi ke status published. Semua kegagalan ditelan: cross-post TIDAK
// boleh menggagalkan proses publish utama.

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { artikel } from "@/db/schema";
import { hasTumblrConfig } from "@/lib/ai/env";
import { logAiTask } from "@/lib/v2-admin/ai-tasks";
import { lexicalToPlaintext } from "@/lib/v2-admin/lexical";
import { isLiveArticleUrl, normalizeExcerpt, postToTumblr } from "./tumblr";

// Mirror normalizeArticleUrl di (site)/[slug]/page.tsx: artikel tayang di root.
const SITE_URL = "https://granddutacitysouthofjakarta.com";

const buildLiveUrl = (slug: string | null | undefined): string | null => {
  const normalized = slug?.replace(/^\/+|\/+$/g, "");
  return normalized ? `${SITE_URL}/${normalized}` : null;
};

// Turunkan ringkasan dari excerpt tersimpan; bila kosong, ambil 1-2 kalimat
// pertama dari konten Lexical. normalizeExcerpt menangani pemotongan panjang.
const deriveDescription = (
  excerpt: string | null | undefined,
  content: unknown,
): string => {
  const provided = excerpt?.trim();
  if (provided) return normalizeExcerpt(provided);

  const plain = lexicalToPlaintext(content).replace(/\s+/g, " ").trim();
  if (!plain) return "";

  const sentences = plain.match(/[^.!?]+[.!?]+/g);
  const summary = sentences ? sentences.slice(0, 2).join(" ").trim() : plain;
  return normalizeExcerpt(summary);
};

// Cross-post satu artikel (by id) ke Tumblr. Aman dipanggil fire-and-forget.
export const crossPostArticleToTumblr = async (
  articleId: number,
  opts: { userId?: number } = {},
): Promise<void> => {
  // Disabled state: env belum lengkap → lewati tanpa mengotori log.
  if (!hasTumblrConfig()) return;

  let row:
    | {
        title: string | null;
        slug: string | null;
        excerpt: string | null;
        content: unknown;
        status: string | null;
      }
    | undefined;

  try {
    const rows = await db
      .select({
        title: artikel.title,
        slug: artikel.slug,
        excerpt: artikel.excerpt,
        content: artikel.content,
        status: artikel.status,
      })
      .from(artikel)
      .where(eq(artikel.id, articleId))
      .limit(1);
    row = rows[0];
  } catch (error) {
    console.error(`[tumblr] gagal memuat artikel ${articleId}:`, error);
    return;
  }

  if (!row) return;
  // Hanya artikel yang benar-benar published yang layak di-cross-post.
  if (row.status !== "published") return;

  const title = row.title?.trim();
  if (!title) {
    console.warn(`[tumblr] artikel ${articleId} tanpa judul; dilewati.`);
    await logAiTask({
      type: "tumblr-crosspost",
      status: "failed",
      input: { articleId },
      error: "Judul kosong; cross-post dilewati.",
      userId: opts.userId,
    });
    return;
  }

  const url = buildLiveUrl(row.slug);
  if (!url || !isLiveArticleUrl(url)) {
    console.warn(`[tumblr] artikel ${articleId} URL belum live; dilewati.`);
    await logAiTask({
      type: "tumblr-crosspost",
      status: "failed",
      input: { articleId, title },
      error: "URL artikel belum live; cross-post dilewati.",
      userId: opts.userId,
    });
    return;
  }

  const description = deriveDescription(row.excerpt, row.content);
  const result = await postToTumblr({ title, url, excerpt: description });

  await logAiTask({
    type: "tumblr-crosspost",
    status: result.success ? "completed" : "failed",
    input: { articleId, title, url },
    output: result.success ? { postId: result.postId, blogName: "tumblr" } : undefined,
    error: result.success ? undefined : result.error,
    userId: opts.userId,
  });

  if (result.success) {
    console.info(`[tumblr] artikel ${articleId} → post ${result.postId ?? "?"}`);
  } else {
    console.warn(`[tumblr] artikel ${articleId} gagal cross-post: ${result.error}`);
  }
};
