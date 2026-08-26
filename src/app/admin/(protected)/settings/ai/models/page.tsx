import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import { listRoleModelsForClient } from "@/lib/v2-admin/ai-role-models";
import RoleModelsClient, {
  type RoleModelForClient,
} from "./role-models-client";

// crypto (mask) butuh Node runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AiRoleModelsPage() {
  // Konfigurasi kredensial AI hanya untuk admin.
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin");

  let roleModels: RoleModelForClient[] = [];
  let loadError: string | null = null;

  try {
    roleModels = await listRoleModelsForClient();
  } catch (error) {
    console.error("[v2-admin/settings/ai/models] gagal memuat role model:", error);
    loadError = "Gagal memuat konfigurasi model per tugas dari database.";
  }

  return (
    <>
      {loadError ? (
        <p
          role="alert"
          className="mx-auto mb-4 max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {loadError}
        </p>
      ) : null}
      <RoleModelsClient initialRoleModels={roleModels} />
    </>
  );
}
