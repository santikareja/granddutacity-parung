// Pencarian & impor foto stok (Unsplash/Pexels) untuk CMS kustom.
// Server-side only: API key provider tidak pernah dikirim ke client.
//
// Pengamanan yang dipertahankan dari implementasi sebelumnya:
//   - URL gambar dari client WAJIB lolos allowlist host (mencegah SSRF)
//   - redirect diblokir agar allowlist tidak bisa dilewati lewat 302
//   - Client-ID Unsplash hanya dikirim ke api.unsplash.com

export type StockProvider = "unsplash" | "pexels";

export type StockPhoto = {
  id: string;
  provider: StockProvider;
  thumbUrl: string;
  fullUrl: string;
  author: string;
  authorUrl: string;
  description: string;
  width: number | null;
  height: number | null;
  downloadLocation?: string;
};

const UNSPLASH_API = "https://api.unsplash.com";
const PEXELS_API = "https://api.pexels.com/v1";
const UNSPLASH_API_HOST = "api.unsplash.com";

const ALLOWED_IMAGE_HOSTS: Record<StockProvider, string[]> = {
  unsplash: ["images.unsplash.com", "plus.unsplash.com"],
  pexels: ["images.pexels.com"],
};

export const isAllowedImageUrl = (
  rawUrl: string,
  provider: StockProvider,
): boolean => isAllowedUrl(rawUrl, ALLOWED_IMAGE_HOSTS[provider]);

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

export const hasUnsplash = (): boolean => Boolean(process.env.UNSPLASH_ACCESS_KEY);
export const hasPexels = (): boolean => Boolean(process.env.PEXELS_API_KEY);

type UnsplashPhoto = {
  id: string;
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
  urls: { small: string; regular: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
};

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  alt: string | null;
  photographer: string;
  photographer_url: string;
  src: { medium: string; large2x: string };
};

export const searchStock = async (
  provider: StockProvider,
  query: string,
  page = 1,
): Promise<StockPhoto[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    if (provider === "unsplash") {
      const key = process.env.UNSPLASH_ACCESS_KEY;
      if (!key) throw new Error("Unsplash belum dikonfigurasi.");

      const response = await fetch(
        `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=24`,
        {
          headers: { Authorization: `Client-ID ${key}` },
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error(`Unsplash merespons ${response.status}.`);

      const data = (await response.json()) as { results?: UnsplashPhoto[] };
      return (data.results ?? []).map((photo) => ({
        id: photo.id,
        provider: "unsplash" as const,
        thumbUrl: photo.urls.small,
        fullUrl: photo.urls.regular,
        author: photo.user.name,
        authorUrl: photo.user.links.html,
        description: photo.description || photo.alt_description || "",
        width: photo.width ?? null,
        height: photo.height ?? null,
        downloadLocation: photo.links.download_location,
      }));
    }

    const key = process.env.PEXELS_API_KEY;
    if (!key) throw new Error("Pexels belum dikonfigurasi.");

    const response = await fetch(
      `${PEXELS_API}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=24`,
      { headers: { Authorization: key }, signal: controller.signal },
    );
    if (!response.ok) throw new Error(`Pexels merespons ${response.status}.`);

    const data = (await response.json()) as { photos?: PexelsPhoto[] };
    return (data.photos ?? []).map((photo) => ({
      id: String(photo.id),
      provider: "pexels" as const,
      thumbUrl: photo.src.medium,
      fullUrl: photo.src.large2x,
      author: photo.photographer,
      authorUrl: photo.photographer_url,
      description: photo.alt || "",
      width: photo.width ?? null,
      height: photo.height ?? null,
    }));
  } finally {
    clearTimeout(timeout);
  }
};

// Guideline lisensi Unsplash: hit endpoint download saat foto benar-benar dipakai.
// Host diverifikasi lebih dulu karena request ini membawa Client-ID rahasia.
export const triggerUnsplashDownload = async (
  downloadLocation: string | undefined,
): Promise<void> => {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !downloadLocation) return;
  if (!isAllowedUrl(downloadLocation, [UNSPLASH_API_HOST])) return;

  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${key}` },
    });
  } catch {
    // Non-fatal: kegagalan trigger tidak boleh menggagalkan impor.
  }
};

// Unduh berkas gambar dari CDN provider. `redirect: "error"` mencegah bypass
// allowlist lewat pengalihan ke host internal.
export const downloadStockImage = async (
  url: string,
  provider: StockProvider,
): Promise<{ buffer: Buffer; mimeType: string }> => {
  if (!isAllowedImageUrl(url, provider)) {
    throw new Error("URL foto tidak diizinkan (harus https dari CDN provider).");
  }

  const response = await fetch(url, { redirect: "error" });
  if (!response.ok) {
    throw new Error(`Gagal mengunduh foto (${response.status}).`);
  }

  const mimeType = response.headers.get("content-type") || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    throw new Error("Konten yang diunduh bukan gambar.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, mimeType };
};
