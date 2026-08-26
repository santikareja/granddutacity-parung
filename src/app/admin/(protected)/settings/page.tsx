import { getSessionUser } from "@/lib/v2-auth/session";
import { getAllSettings, type SettingRecord } from "@/lib/settings";
import SettingsClient from "./settings-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();

  let items: SettingRecord[] = [];
  let error: string | null = null;

  try {
    const all = await getAllSettings();
    items = Object.values(all);
  } catch (err) {
    console.error("[v2-admin/settings] gagal memuat:", err);
    error = "Gagal memuat pengaturan dari database.";
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="mx-auto mb-4 max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <SettingsClient
        initialItems={items}
        canManage={user?.role === "admin"}
      />
    </>
  );
}
