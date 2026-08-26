import { listCategories } from "@/lib/v2-admin/articles";
import { resolveAiConfig } from "@/lib/v2-admin/ai-runtime";
import AiStudioClient from "./ai-studio-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AiStudioPage() {
  const [config, categories] = await Promise.all([
    resolveAiConfig(),
    listCategories().catch(() => []),
  ]);

  return (
    <AiStudioClient
      aiEnabled={config !== null}
      aiModel={config?.model ?? null}
      aiProviderName={config?.providerName ?? null}
      categories={categories}
    />
  );
}
