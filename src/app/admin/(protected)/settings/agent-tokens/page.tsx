import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import { listTokensForClient } from "@/lib/v2-admin/agent-tokens";
import AgentTokensClient, {
  type AgentTokenForClient,
} from "./agent-tokens-client";

// crypto/Drizzle → Node runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AgentTokensPage() {
  // Token agent adalah kredensial mesin; kelola hanya oleh admin.
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin");

  let tokens: AgentTokenForClient[] = [];
  let loadError: string | null = null;

  try {
    tokens = await listTokensForClient();
  } catch (error) {
    console.error("[v2-admin/settings/agent-tokens] gagal memuat token:", error);
    loadError = "Gagal memuat daftar token dari database.";
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
      <AgentTokensClient initialTokens={tokens} />
    </>
  );
}
