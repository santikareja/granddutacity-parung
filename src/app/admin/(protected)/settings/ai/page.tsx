import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import { listProvidersForClient } from "@/lib/v2-admin/ai-providers";
import { hasAiConfig } from "@/lib/ai/env";
import AiSettingsClient, { type ProviderForClient } from "./ai-settings-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AiSettingsPage() {
  // Kredensial AI hanya untuk admin; layout sudah memastikan ada sesi.
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin");

  let providers: ProviderForClient[] = [];
  let loadError: string | null = null;

  try {
    providers = await listProvidersForClient();
  } catch (error) {
    console.error("[v2-admin/settings/ai] gagal memuat provider:", error);
    loadError = "Gagal memuat daftar provider dari database.";
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
      <AiSettingsClient
        initialProviders={providers}
        aiEnvFallbackActive={hasAiConfig()}
      />
    </>
  );
}
