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

export function clImg(
  publicIdWithVersion: string,
  opts: { w: number; h?: number; q?: number } = { w: 800 },
) {
  const { w, h, q = 75 } = opts;
  const crop = h ? `w_${w},h_${h},c_fill,g_auto` : `w_${w}`;

  return publicIdWithVersion.replace(
    "/upload/",
    `/upload/${crop},q_${q},f_auto/`,
  );
}
