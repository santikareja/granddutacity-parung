// Custom Payload endpoints untuk pipeline gambar stok: /api/stock/*.
// - GET  /api/stock/search  → proxy pencarian Unsplash/Pexels (key server-side)
// - POST /api/stock/import  → unduh foto terpilih, buat doc media (Cloudinary+WebP)
// Auth via req.user. Key provider tidak pernah diekspos ke client.

import type { Endpoint, PayloadRequest } from "payload";

import { chatCompletion, parseJsonFromAi } from "@/lib/ai/client";
import {
  getStockConfig,
  hasPexelsConfig,
  hasUnsplashConfig,
} from "@/lib/ai/env";
import { resolveAiConfig } from "@/lib/ai/runtime";
import {
  errorResponse,
  getBody,
  guardAiEndpoint,
  jsonResponse,
} from "@/lib/ai/endpoint-helpers";
import { buildImageMetaPrompt } from "@/lib/ai/prompts";

type StockProvider = "unsplash" | "pexels";

export type NormalizedPhoto = {
  id: string;
  provider: StockProvider;
  thumbUrl: string;
  fullUrl: string;
  author: string;
  authorUrl: string;
  description: string;
  width?: number;
  height?: number;
  // Unsplash: endpoint yang wajib di-hit saat foto dipakai (guideline lisensi).
  downloadLocation?: string;
};

const UNSPLASH_API = "https://api.unsplash.com";
const PEXELS_API = "https://api.pexels.com/v1";

// Body /stock/import berisi URL yang dikirim client, jadi URL TIDAK boleh
// di-fetch mentah: tanpa allowlist, endpoint ini menjadi SSRF (server bisa
// dipaksa menembak metadata cloud / service internal) dan header Authorization
// Unsplash bisa dibocorkan ke host asing.
const ALLOWED_IMAGE_HOSTS: Record<StockProvider, string[]> = {
  unsplash: ["images.unsplash.com", "plus.unsplash.com"],
  pexels: ["images.pexels.com"],
};

const UNSPLASH_API_HOST = "api.unsplash.com";

const isAllowedUrl = (rawUrl: string, allowedHosts: string[]): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  return allowedHosts.includes(parsed.hostname.toLowerCase());
};

type UnsplashPhoto = {
  id: string;
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
  urls: { small: string; regular: string; full: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
};

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  alt: string | null;
  photographer: string;
  photographer_url: string;
  src: { medium: string; large2x: string; original: string };
};

const searchUnsplash = async (
  q: string,
  page: number,
  key: string,
): Promise<NormalizedPhoto[]> => {
  const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=12`;
  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
  });
  if (!response.ok) {
    throw new Error(`Unsplash merespons ${response.status}`);
  }
  const data = (await response.json()) as { results?: UnsplashPhoto[] };
  return (data.results || []).map((photo) => ({
    id: photo.id,
    provider: "unsplash" as const,
    thumbUrl: photo.urls.small,
    fullUrl: photo.urls.regular,
    author: photo.user.name,
    authorUrl: photo.user.links.html,
    description: photo.description || photo.alt_description || "",
    width: photo.width,
    height: photo.height,
    downloadLocation: photo.links.download_location,
  }));
};

const searchPexels = async (
  q: string,
  page: number,
  key: string,
): Promise<NormalizedPhoto[]> => {
  const url = `${PEXELS_API}/search?query=${encodeURIComponent(q)}&page=${page}&per_page=12`;
  const response = await fetch(url, {
    headers: { Authorization: key },
  });
  if (!response.ok) {
    throw new Error(`Pexels merespons ${response.status}`);
  }
  const data = (await response.json()) as { photos?: PexelsPhoto[] };
  return (data.photos || []).map((photo) => ({
    id: String(photo.id),
    provider: "pexels" as const,
    thumbUrl: photo.src.medium,
    fullUrl: photo.src.large2x,
    author: photo.photographer,
    authorUrl: photo.photographer_url,
    description: photo.alt || "",
    width: photo.width,
    height: photo.height,
  }));
};

// GET /api/stock/status — provider mana yang aktif (untuk enable/disable UI).
const stockStatusEndpoint: Endpoint = {
  path: "/stock/status",
  method: "get",
  handler: (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;
    return jsonResponse({
      unsplash: hasUnsplashConfig(),
      pexels: hasPexelsConfig(),
    });
  },
};

// GET /api/stock/search?provider=&q=&page=
const stockSearchEndpoint: Endpoint = {
  path: "/stock/search",
  method: "get",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;

    const provider = req.searchParams?.get("provider") as StockProvider | null;
    const q = req.searchParams?.get("q") || "";
    const page = Math.max(1, Number(req.searchParams?.get("page")) || 1);

    if (provider !== "unsplash" && provider !== "pexels") {
      return errorResponse("Parameter 'provider' harus 'unsplash' atau 'pexels'.", 400);
    }
    if (!q.trim()) {
      return errorResponse("Parameter 'q' wajib diisi.", 400);
    }

    const { unsplashKey, pexelsKey } = getStockConfig();

    try {
      let photos: NormalizedPhoto[] = [];
      if (provider === "unsplash") {
        if (!unsplashKey) {
          return errorResponse("Unsplash belum dikonfigurasi.", 503);
        }
        photos = await searchUnsplash(q.trim(), page, unsplashKey);
      } else {
        if (!pexelsKey) {
          return errorResponse("Pexels belum dikonfigurasi.", 503);
        }
        photos = await searchPexels(q.trim(), page, pexelsKey);
      }
      return jsonResponse({ photos });
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Gagal mencari foto stok.",
        502,
      );
    }
  },
};

// Trigger download endpoint Unsplash (guideline lisensi) — best effort.
// Host diverifikasi lebih dulu karena request ini membawa Client-ID rahasia.
const triggerUnsplashDownload = async (
  downloadLocation: string | undefined,
  key: string,
): Promise<void> => {
  if (!downloadLocation) return;
  if (!isAllowedUrl(downloadLocation, [UNSPLASH_API_HOST])) return;

  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${key}` },
    });
  } catch {
    // Non-fatal: kegagalan trigger download tidak boleh menggagalkan import.
  }
};

// POST /api/stock/import — { provider, photo, context }
const stockImportEndpoint: Endpoint = {
  path: "/stock/import",
  method: "post",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;

    try {
      const { provider, photo, context } = await getBody<{
        provider?: StockProvider;
        photo?: NormalizedPhoto;
        context?: string;
      }>(req);

      if (provider !== "unsplash" && provider !== "pexels") {
        return errorResponse("Parameter 'provider' tidak valid.", 400);
      }
      if (!photo || !photo.fullUrl) {
        return errorResponse("Parameter 'photo' tidak valid.", 400);
      }
      if (!isAllowedUrl(photo.fullUrl, ALLOWED_IMAGE_HOSTS[provider])) {
        return errorResponse(
          "URL foto tidak diizinkan (harus https dari host CDN provider stok).",
          400,
        );
      }

      const { unsplashKey } = getStockConfig();
      if (provider === "unsplash" && unsplashKey) {
        await triggerUnsplashDownload(photo.downloadLocation, unsplashKey);
      }

      // Unduh file gambar di server. Redirect diblokir agar host allowlist tidak
      // bisa dilewati lewat 302 ke alamat internal.
      const imageResponse = await fetch(photo.fullUrl, { redirect: "error" });
      if (!imageResponse.ok) {
        return errorResponse(`Gagal mengunduh foto (${imageResponse.status}).`, 502);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
      if (!contentType.startsWith("image/")) {
        return errorResponse("Konten yang diunduh bukan gambar.", 415);
      }
      const ext = contentType.includes("png") ? "png" : "jpg";
      // id berasal dari body client; batasi charset agar tidak menyusup ke nama file.
      const safeId = String(photo.id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
      const filename = `${provider}-${safeId || Date.now()}.${ext}`;

      // Metadata AI (name/alt/caption) — best effort; fallback ke deskripsi foto.
      let name = photo.description || `Foto ${provider} ${photo.id}`;
      let alt = photo.description || `Foto oleh ${photo.author}`;
      let caption = "";

      const aiConfig = await resolveAiConfig(req.payload);
      if (aiConfig) {
        try {
          const raw = await chatCompletion({
            config: aiConfig,
            messages: buildImageMetaPrompt(
              context || "Artikel properti Grand Duta City",
              photo.description || "",
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
        } catch {
          // Non-fatal: pakai fallback bila AI gagal.
        }
      }

      // Buat doc media via local API → plugin Cloudinary upload + WebP otomatis.
      const media = await req.payload.create({
        collection: "media",
        data: {
          name,
          alt,
          ...(caption ? { caption } : {}),
          source: provider,
          sourceId: photo.id,
          attributionUrl: photo.authorUrl,
        },
        file: {
          data: buffer,
          mimetype: contentType,
          name: filename,
          size: buffer.length,
        },
      });

      return jsonResponse({ media });
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Gagal mengimpor foto stok.",
        500,
      );
    }
  },
};

export const stockEndpoints: Endpoint[] = [
  stockStatusEndpoint,
  stockSearchEndpoint,
  stockImportEndpoint,
];
