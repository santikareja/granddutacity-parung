import { NextResponse } from "next/server";

import { requireApiUser, apiError } from "@/lib/v2-auth/api-guard";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  hasCloudinaryConfig,
  uploadMedia,
} from "@/lib/v2-admin/media-upload";

export const runtime = "nodejs";
// Upload gambar besar butuh waktu lebih panjang dari default.
export const maxDuration = 120;

// POST /api/v2/media/upload — multipart/form-data: file, alt, name?, caption?
export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  if (!hasCloudinaryConfig()) {
    return apiError(
      "Cloudinary belum dikonfigurasi. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.",
      503,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("Body harus berupa multipart/form-data.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError("Berkas gambar wajib dilampirkan.");
  }

  if (file.size === 0) return apiError("Berkas kosong.");
  if (file.size > MAX_UPLOAD_BYTES) {
    return apiError(
      `Ukuran berkas melebihi batas ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
      413,
    );
  }

  // Validasi tipe di server: header dari client tidak bisa dipercaya sendirian,
  // tetapi Cloudinary juga menolak berkas non-gambar sebagai lapis kedua.
  if (!ALLOWED_MIME.has(file.type)) {
    return apiError(
      `Tipe berkas ${file.type || "tidak dikenal"} tidak diizinkan. Gunakan JPG, PNG, WebP, GIF, atau AVIF.`,
      415,
    );
  }

  const alt = String(formData.get("alt") ?? "").trim();
  if (!alt) {
    return apiError("Alt text wajib diisi untuk SEO dan aksesibilitas.");
  }

  const nameRaw = formData.get("name");
  const captionRaw = formData.get("caption");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadMedia({
      buffer,
      // Bersihkan nama berkas dari karakter yang bisa menyulitkan URL.
      filename:
        file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100) || "gambar",
      mimeType: file.type,
      alt,
      name: typeof nameRaw === "string" ? nameRaw : null,
      caption: typeof captionRaw === "string" ? captionRaw : null,
      source: "upload",
    });

    return NextResponse.json({ media: result }, { status: 201 });
  } catch (error) {
    console.error("[api/v2/media/upload] gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mengunggah gambar.",
      500,
    );
  }
}
