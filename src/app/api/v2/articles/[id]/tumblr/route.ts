// POST /api/v2/articles/[id]/tumblr — cross-post manual ke Tumblr.
//
// Melengkapi cross-post otomatis yang berjalan saat artikel bertransisi ke
// published. Tombol manual dibutuhkan untuk dua situasi nyata:
//   1. Cross-post otomatis gagal (Tumblr down / rate limit) dan perlu diulang.
//   2. Artikel sudah lama tayang sebelum fitur ini ada.
//
// Anti-duplikat: bila sudah ada catatan cross-post SUKSES untuk artikel ini,
// endpoint menolak dengan 409 kecuali dipanggil dengan { force: true }.

import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { aiTasks } from "@/db/schema";
import { apiError, requireApiMutation } from "@/lib/v2-auth/api-guard";
import { crossPostArticleToTumblr } from "@/lib/social/crosspost";

// node:crypto (tanda tangan OAuth) + Drizzle → Node runtime wajib.
export const runtime = "nodejs";
export const maxDuration = 60;

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Cari cross-post sukses sebelumnya untuk artikel ini. Best-effort: kegagalan
// query tidak boleh memblokir aksi (kembalikan null = anggap belum pernah).
const findPreviousPost = async (
  articleId: number,
): Promise<{ postId?: string } | null> => {
  if (!process.env.DATABASE_URI) return null;
  try {
    const rows = await db
      .select({ output: aiTasks.output })
      .from(aiTasks)
      .where(
        and(
          eq(aiTasks.type, "tumblr-crosspost"),
          eq(aiTasks.status, "completed"),
          sql`${aiTasks.input}->>'articleId' = ${String(articleId)}`,
        ),
      )
      .orderBy(desc(aiTasks.createdAt))
      .limit(1);

    const output = rows[0]?.output as { postId?: unknown } | null | undefined;
    if (!output) return null;
    return {
      postId: typeof output.postId === "string" ? output.postId : undefined,
    };
  } catch (error) {
    console.error("[api/v2/articles/:id/tumblr] gagal cek riwayat:", error);
    return null;
  }
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiMutation(request);
  if (!guard.ok) return guard.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return apiError("ID artikel tidak valid.");

  // Body opsional: { force?: boolean }.
  let force = false;
  try {
    const body = (await request.json()) as { force?: unknown };
    force = body?.force === true;
  } catch {
    // Tanpa body juga sah.
  }

  if (!force) {
    const previous = await findPreviousPost(id);
    if (previous) {
      return NextResponse.json(
        {
          error: `Artikel ini sudah pernah di-cross-post ke Tumblr${
            previous.postId ? ` (ID ${previous.postId})` : ""
          }. Kirim ulang hanya bila memang diperlukan.`,
          alreadyPosted: true,
          postId: previous.postId,
        },
        { status: 409 },
      );
    }
  }

  const outcome = await crossPostArticleToTumblr(id, { userId: guard.user.id });

  if (outcome.status === "posted") {
    return NextResponse.json(outcome);
  }

  // skipped (input belum layak) → 400; failed (gangguan Tumblr) → 502.
  return NextResponse.json(
    { ...outcome, error: outcome.message },
    { status: outcome.status === "skipped" ? 400 : 502 },
  );
}
