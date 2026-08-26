// Upload media ke Cloudinary untuk CMS kustom. Server-side only.
//
// Menulis ke tabel `media` yang sama dengan Payload. Kolom `url` diisi secure_url
// Cloudinary dengan transformasi f_auto (WebP otomatis) agar frontend — yang
// membaca kolom `url` — langsung mendapat gambar teroptimasi.
//
// CATATAN: kolom cloudinary_public_id dsl. milik plugin Payload TIDAK ada di
// skema DB (hanya ada di payload-types), jadi kita tidak menulisnya.

import { v2 as cloudinary } from "cloudinary";

import { db } from "@/db";
import { media } from "@/db/schema";

const CLOUDINARY_FOLDER = "grand-duta-city";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const hasCloudinaryConfig = (): boolean =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

let configured = false;

const ensureConfigured = (): void => {
  if (configured) return;
  if (!hasCloudinaryConfig()) {
    throw new Error(
      "Cloudinary belum dikonfigurasi (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).",
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
};

type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};

const uploadBuffer = (
  buffer: Buffer,
  filename: string,
): Promise<CloudinaryUploadResult> => {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: "image",
        // Biarkan Cloudinary membuat public_id unik agar tidak menimpa gambar lain.
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: filename,
      },
      (error, result) => {
        if (error) {
          reject(new Error(error.message || "Upload ke Cloudinary gagal."));
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary tidak mengembalikan hasil upload."));
          return;
        }
        resolve(result as CloudinaryUploadResult);
      },
    );

    stream.on("error", (error: Error) => reject(error));
    stream.end(buffer);
  });
};

// Sisipkan f_auto,q_auto ke URL agar dilayani sebagai WebP/AVIF sesuai browser.
const withAutoFormat = (secureUrl: string): string =>
  secureUrl.includes("/upload/")
    ? secureUrl.replace("/upload/", "/upload/f_auto,q_auto/")
    : secureUrl;

export type UploadMediaInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  alt: string;
  name?: string | null;
  caption?: string | null;
  source?: "upload" | "unsplash" | "pexels";
  sourceId?: string | null;
  attributionUrl?: string | null;
};

export const uploadMedia = async (
  input: UploadMediaInput,
): Promise<{ id: number; url: string }> => {
  const result = await uploadBuffer(input.buffer, input.filename);
  const url = withAutoFormat(result.secure_url);

  const rows = await db
    .insert(media)
    .values({
      name: input.name?.trim() || input.filename,
      alt: input.alt.trim(),
      caption: input.caption?.trim() || null,
      url,
      filename: `${result.public_id.split("/").pop()}.${result.format ?? "jpg"}`,
      mimeType: input.mimeType,
      // Kolom numeric Postgres menerima string.
      filesize: result.bytes != null ? String(result.bytes) : null,
      width: result.width != null ? String(result.width) : null,
      height: result.height != null ? String(result.height) : null,
      source: input.source ?? "upload",
      sourceId: input.sourceId ?? null,
      attributionUrl: input.attributionUrl ?? null,
      updatedAt: new Date(),
    })
    .returning({ id: media.id });

  return { id: rows[0].id, url };
};
