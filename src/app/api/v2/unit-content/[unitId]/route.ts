import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getUnitById, unitPagePath } from "@/data/units";
import {
  apiError,
  requireApiAdminMutation,
  requireApiUser,
} from "@/lib/v2-auth/api-guard";
import {
  getUnitContentDraft,
  upsertUnitContent,
} from "@/lib/v2-admin/unit-content";

export const runtime = "nodejs";

/**
 * KONTEN HALAMAN TIPE RUMAH — baca & simpan dari dashboard admin.
 *
 * SINKRONISASI OTOMATIS
 * Halaman /tipe-rumah/<slug> di-prerender (generateStaticParams), jadi menyimpan
 * ke database saja TIDAK akan mengubah apa yang dilihat pengunjung. Karena itu
 * setiap penyimpanan memanggil `revalidatePath` untuk setiap halaman yang
 * benar-benar menampilkan data unit tersebut.
 *
 * Menurut dokumen Next 16 (node_modules/next/dist/docs/01-app/03-api-reference/
 * 04-functions/revalidatePath.md), di Route Handler `revalidatePath` MENANDAI
 * path untuk divalidasi ulang dan pembaruan terjadi pada kunjungan berikutnya.
 * Itu perilaku yang diinginkan di sini: tidak ada badai regenerasi saat simpan,
 * dan pengunjung berikutnya sudah mendapat versi terbaru.
 *
 * Path literal dipakai (mis. `/tipe-rumah/verona-39`) sehingga parameter `type`
 * tidak diperlukan — itu hanya wajib untuk pola bersegmen dinamis.
 */

const galleryItemSchema = z.object({
  url: z.string().trim().url("URL foto galeri tidak valid."),
  alt: z.string().trim().max(300).optional().default(""),
  caption: z.string().trim().max(500).optional(),
});

const accessItemSchema = z.object({
  label: z.string().trim().min(1, "Label akses wajib diisi.").max(120),
  value: z.string().trim().min(1, "Nilai akses wajib diisi.").max(200),
});

/**
 * URL gambar/video: string kosong DIIZINKAN dan berarti "kosongkan penimpaan
 * ini, kembali ke default kode". Karena itu bukan `.url()` polos.
 */
const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .max(1000)
    .refine((value) => value === "" || /^https?:\/\//i.test(value), { message })
    .nullable()
    .optional();

const bodySchema = z.object({
  priceLabel: z.string().trim().max(120).nullable().optional(),
  facadeImage: optionalUrl("URL foto fasad tidak valid."),
  floorPlanImage: optionalUrl("URL denah tidak valid."),
  overview: z.array(z.string().trim().max(2000)).max(12).optional().default([]),
  highlights: z.array(z.string().trim().max(300)).max(12).optional().default([]),
  suitedFor: z.array(z.string().trim().max(300)).max(12).optional().default([]),
  gallery: z.array(galleryItemSchema).max(24).optional().default([]),
  accessItems: z.array(accessItemSchema).max(20).optional().default([]),
  videoUrl: optionalUrl("URL video tidak valid."),
  videoPoster: optionalUrl("URL poster video tidak valid."),
  videoTitle: z.string().trim().max(200).nullable().optional(),
  isPublished: z.boolean().optional().default(true),
});

type Params = { params: Promise<{ unitId: string }> };

// GET — draf untuk form admin (nilai DB, atau default kode sebagai titik awal).
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  const { unitId } = await params;
  const draft = await getUnitContentDraft(unitId);
  if (!draft) return apiError("Tipe unit tidak ditemukan.", 404);

  return NextResponse.json({ draft });
}

// PUT — simpan konten + tandai halaman terkait untuk divalidasi ulang.
export async function PUT(request: Request, { params }: Params) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

  const { unitId } = await params;
  const unit = getUnitById(unitId);
  if (!unit) return apiError("Tipe unit tidak ditemukan.", 404);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Body tidak valid.");
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;

  try {
    const row = await upsertUnitContent(unitId, {
      priceLabel: data.priceLabel ?? null,
      facadeImage: data.facadeImage ?? null,
      floorPlanImage: data.floorPlanImage ?? null,
      overview: data.overview,
      highlights: data.highlights,
      suitedFor: data.suitedFor,
      gallery: data.gallery,
      accessItems: data.accessItems,
      videoUrl: data.videoUrl ?? null,
      videoPoster: data.videoPoster ?? null,
      videoTitle: data.videoTitle ?? null,
      isPublished: data.isPublished,
    });

    // Halaman yang MENAMPILKAN data unit ini. Daftar ini sengaja eksplisit:
    // memvalidasi ulang terlalu sedikit membuat pemilik melihat data lama dan
    // menyangka simpannya gagal.
    const revalidated = [
      unitPagePath(unit), // halaman tipe itu sendiri
      "/tipe-rumah", // hub: judul, ukuran, harga per tipe
      `/cluster-${unit.cluster}`, // kartu tipe di halaman cluster
      "/", // carousel kartu tipe di beranda
      "/sitemap.xml",
      "/images.xml", // galeri ikut terdaftar di image sitemap
    ];
    for (const path of revalidated) revalidatePath(path);

    return NextResponse.json({
      unitContent: row,
      revalidated,
    });
  } catch (error) {
    console.error("[api/v2/unit-content] PUT gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal menyimpan konten unit.",
      500,
    );
  }
}
