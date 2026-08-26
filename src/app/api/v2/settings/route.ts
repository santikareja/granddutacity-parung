import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiError,
  requireApiAdminMutation,
  requireApiUser,
} from "@/lib/v2-auth/api-guard";
import {
  getAllSettings,
  getSettingsByGroup,
  updateSettings,
  type SettingValueInput,
} from "@/lib/settings";

export const runtime = "nodejs";

// GET /api/v2/settings[?group=general] — daftar settings (semua atau per grup).
export async function GET(request: Request) {
  const guard = await requireApiUser();
  if (!guard.ok) return guard.response;

  try {
    const group = new URL(request.url).searchParams.get("group");
    const settings = group
      ? await getSettingsByGroup(group)
      : await getAllSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[api/v2/settings] GET gagal:", error);
    return apiError("Gagal memuat settings.", 500);
  }
}

// Body menerima dua bentuk untuk `settings`:
//   - array: [{ key, value }]
//   - objek: { key: value }
const settingItemSchema = z.object({
  key: z.string().trim().min(1, "Key wajib diisi."),
  value: z.string().nullable().optional(),
});

const bodySchema = z.object({
  settings: z.union([
    z.array(settingItemSchema),
    z.record(z.string(), z.string().nullable()),
  ]),
});

// Normalisasi kedua bentuk menjadi SettingValueInput[].
const normalize = (
  settings: z.infer<typeof bodySchema>["settings"],
): SettingValueInput[] => {
  if (Array.isArray(settings)) {
    return settings.map((item) => ({ key: item.key, value: item.value ?? null }));
  }
  return Object.entries(settings).map(([key, value]) => ({
    key,
    value: value ?? null,
  }));
};

// PUT /api/v2/settings — upsert settings (admin-only + CSRF).
export async function PUT(request: Request) {
  const guard = await requireApiAdminMutation(request);
  if (!guard.ok) return guard.response;

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

  const records = normalize(parsed.data.settings);

  try {
    await updateSettings(records);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/v2/settings] PUT gagal:", error);
    return apiError("Gagal menyimpan settings.", 500);
  }
}
