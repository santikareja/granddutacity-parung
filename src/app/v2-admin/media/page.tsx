import { listMedia } from "@/lib/v2-admin/media";
import { hasCloudinaryConfig } from "@/lib/v2-admin/media-upload";
import { hasPexels, hasUnsplash } from "@/lib/v2-admin/stock-photos";
import MediaClient, { type MediaRow } from "./media-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  let items: MediaRow[] = [];
  let error: string | null = null;

  try {
    const rows = await listMedia(120);
    // Date perlu diserialisasi sebelum menyeberang ke client component.
    items = rows.map((row) => ({
      id: row.id,
      name: row.name,
      alt: row.alt,
      caption: row.caption,
      url: row.url,
      width: row.width,
      height: row.height,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("[v2-admin/media] gagal memuat media:", err);
    error = "Gagal memuat library media dari database.";
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
      <MediaClient
        initialItems={items}
        cloudinaryReady={hasCloudinaryConfig()}
        stockProviders={{ unsplash: hasUnsplash(), pexels: hasPexels() }}
      />
    </>
  );
}
