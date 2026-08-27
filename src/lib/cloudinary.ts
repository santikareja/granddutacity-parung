const CLOUD_NAME = "dzhvfbuks";
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

export const CATEGORY_IMAGES = {
  "panduan-properti": "v1776105396/Panduan_Properti_bg5b0y.webp",
  kawasan: "v1776105396/Lokasi_Kawasan_rzduuw.webp",
  "seputar-gdc": "v1776105396/Seputar_GDC_syygpl.webp",
} as const;

export function cloudinaryUrl(
  publicId: string,
  transforms = "f_auto,q_auto",
) {
  return `${BASE_URL}/${transforms}/${publicId}`;
}

export function ogImage(publicId: string) {
  return cloudinaryUrl(publicId, "w_1200,h_630,c_fill,f_auto,q_auto");
}

export function thumbImage(publicId: string) {
  return cloudinaryUrl(publicId, "w_800,h_450,c_fill,f_auto,q_auto");
}

export function originalImage(publicId: string) {
  return `${BASE_URL}/${publicId}`;
}

/**
 * Ubah URL Cloudinary tersimpan menjadi varian tampilan: crop ke rasio tertentu
 * (default 4:3) dengan smart gravity, batasi lebar, dan sajikan format modern
 * (WebP/AVIF via f_auto) berkualitas adaptif (q_auto). Ini memangkas berat
 * gambar dan menyeragamkan rasio kartu, sehingga halaman lebih ringan.
 *
 * URL non-Cloudinary atau tanpa segmen `/upload/` (mis. placeholder lokal)
 * dikembalikan apa adanya. Transformasi lama yang mungkin sudah menempel pada
 * URL (mis. `f_auto,q_auto` bawaan simpan, atau `w_,h_,c_fill` dari clImg)
 * dibuang lebih dulu agar tidak bertumpuk.
 *
 * CATATAN: JANGAN pakai untuk gambar di dalam isi artikel (denah/siteplan/
 * infografik) — crop paksa 4:3 akan memotong informasi penting. Helper ini
 * untuk thumbnail kartu dan gambar utama saja.
 */
export function cloudinaryDisplay(
  url: string | null | undefined,
  opts: { width: number; ratio?: string } = { width: 640 },
): string {
  if (!url) return "";

  const marker = "/upload/";
  const at = url.indexOf(marker);
  if (at === -1) return url; // bukan URL upload Cloudinary → biarkan

  const prefix = url.slice(0, at + marker.length);
  let rest = url.slice(at + marker.length);

  // Buang segmen transformasi lama bila ada (bukan versi `v123`, dan tampak
  // seperti daftar transform: diawali kunci pendek seperti f_/q_/w_/c_).
  const firstSlash = rest.indexOf("/");
  if (firstSlash > 0) {
    const seg = rest.slice(0, firstSlash);
    const looksLikeTransform =
      !/^v\d+$/.test(seg) && /(^|,)[a-z]{1,3}_/.test(seg);
    if (looksLikeTransform) rest = rest.slice(firstSlash + 1);
  }

  const ratio = opts.ratio ?? "4:3";
  const transform = `f_auto,q_auto,c_fill,g_auto,ar_${ratio},w_${opts.width}`;
  return `${prefix}${transform}/${rest}`;
}

export function clImg(
  publicIdWithVersion: string,
  opts: { w: number; h?: number; q?: number | "auto" } = { w: 800 },
) {
  const { w, h, q = 75 } = opts;
  // q_auto: Cloudinary memilih kualitas per-gambar secara adaptif (biasanya
  // lebih kecil dari q tetap tanpa penurunan kualitas yang tampak).
  const quality = `q_${q}`;
  const crop = h ? `w_${w},h_${h},c_fill,g_auto` : `w_${w}`;

  return publicIdWithVersion.replace(
    "/upload/",
    `/upload/${crop},${quality},f_auto/`,
  );
}
