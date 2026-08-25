import type { AdminViewServerProps } from "payload";

import { hasPexelsConfig, hasUnsplashConfig } from "@/lib/ai/env";
import { resolveAiConfig } from "@/lib/ai/runtime";
import AiStudioClient from "./AiStudioClient";

export default async function AiStudioView({ initPageResult }: AdminViewServerProps) {
  const { payload } = initPageResult.req;
  const config = payload.config;
  const adminRoute = config.routes.admin;
  const apiRoute = config.routes.api;

  const aiConfig = await resolveAiConfig(payload);

  // Kategori dipakai wizard agar draft langsung punya `kategori` (required field);
  // gagal query (mis. DB belum siap) tidak boleh mematikan halaman.
  let categories: { id: number; name: string }[] = [];
  try {
    const result = await payload.find({
      collection: "categories",
      limit: 100,
      pagination: false,
      sort: "name",
    });
    categories = result.docs.map((doc) => ({ id: doc.id, name: doc.name }));
  } catch {
    categories = [];
  }

  return (
    <AiStudioClient
      adminRoute={adminRoute}
      apiRoute={apiRoute}
      aiEnabled={aiConfig !== null}
      categories={categories}
      stockProviders={{
        unsplash: hasUnsplashConfig(),
        pexels: hasPexelsConfig(),
      }}
    />
  );
}
