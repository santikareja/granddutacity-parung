import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import { chatCompletion, parseJsonFromAi } from "@/lib/ai/client";
import { resolveAiConfig } from "@/lib/v2-admin/ai-runtime";
import { buildImageMetaPrompt } from "@/lib/ai/prompts";
import {
  downloadStockImage,
  triggerUnsplashDownload,
  type StockProvider,
} from "@/lib/v2-admin/stock-photos";
import { hasCloudinaryConfig, uploadMedia } from "@/lib/v2-admin/media-upload";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST /api/v2/media/stock/import — { provider, photo, context? }
// Mengunduh foto di server, membuat metadata (alt/caption) dengan AI bila
// tersedia, lalu mengunggah ke Cloudinary dan mencatatnya di tabel media.
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  if (!hasCloudinaryConfig()) {
    return apiError("Cloudinary belum dikonfigurasi.", 503);
  }

  let body: {
    provider?: unknown;
    photo?: unknown;
    context?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  const provider = body.provider;
  if (provider !== "unsplash" && provider !== "pexels") {
    return apiError("Parameter provider tidak valid.");
  }

  const photo = body.photo as
    | {
        id?: unknown;
        fullUrl?: unknown;
        author?: unknown;
        authorUrl?: unknown;
        description?: unknown;
        downloadLocation?: unknown;
      }
    | undefined;

  const fullUrl = typeof photo?.fullUrl === "string" ? photo.fullUrl : "";
  if (!fullUrl) return apiError("Data foto tidak valid.");

  const author = typeof photo?.author === "string" ? photo.author : "";
  const description =
    typeof photo?.description === "string" ? photo.description : "";
  // Batasi charset id agar aman dipakai pada nama berkas.
  const safeId = String(photo?.id ?? "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);

  try {
    if (provider === "unsplash") {
      await triggerUnsplashDownload(
        typeof photo?.downloadLocation === "string"
          ? photo.downloadLocation
          : undefined,
      );
    }

    const { buffer, mimeType } = await downloadStockImage(
      fullUrl,
      provider as StockProvider,
    );

    // Metadata AI bersifat best-effort; kegagalan tidak menggagalkan impor.
    let name = description || `Foto ${provider} ${safeId}`;
    let alt = description || (author ? `Foto oleh ${author}` : "Foto stok");
    let caption: string | null = null;

    const aiConfig = await resolveAiConfig();
    if (aiConfig) {
      try {
        const raw = await chatCompletion({
          config: aiConfig,
          messages: buildImageMetaPrompt(
            typeof body.context === "string" && body.context.trim()
              ? body.context.trim()
              : "Artikel properti Grand Duta City Parung",
            description,
          ),
          temperature: 0.6,
          responseFormatJson: true,
        });
        const meta = parseJsonFromAi<{
          name?: string;
          alt?: string;
          caption?: string;
        }>(raw);

        if (meta.name?.trim()) name = meta.name.trim();
        if (meta.alt?.trim()) alt = meta.alt.trim();
        if (meta.caption?.trim()) caption = meta.caption.trim();
      } catch (error) {
        console.error("[media/stock/import] metadata AI gagal:", error);
      }
    }

    const ext = mimeType.includes("png") ? "png" : "jpg";
    const result = await uploadMedia({
      buffer,
      filename: `${provider}-${safeId || Date.now()}.${ext}`,
      mimeType,
      alt,
      name,
      caption,
      source: provider as StockProvider,
      sourceId: safeId || null,
      attributionUrl:
        typeof photo?.authorUrl === "string" ? photo.authorUrl : null,
    });

    return NextResponse.json({ media: result }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/media/stock/import] gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mengimpor foto stok.",
      500,
    );
  }
}
