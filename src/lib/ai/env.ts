// Server-side only. Baca env AI & stok foto satu tempat, dengan guard yang sama
// seperti hasCloudinaryConfig di payload.config.ts (disabled state, bukan crash).
// JANGAN pernah impor modul ini dari komponen client.

export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type StockProviderConfig = {
  unsplashKey?: string;
  pexelsKey?: string;
};

export const getAiConfig = (): AiConfig | null => {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    model,
  };
};

export const hasAiConfig = (): boolean => getAiConfig() !== null;

export const getStockConfig = (): StockProviderConfig => ({
  unsplashKey: process.env.UNSPLASH_ACCESS_KEY,
  pexelsKey: process.env.PEXELS_API_KEY,
});

// --- Sumber data faktual (artikel berbasis data) ---------------------------
// Semua opsional: bila kosong, tool terkait dilewati dengan rapi (bukan crash).
export type FactualSourceConfig = {
  bpsAppId?: string;
  tavilyKey?: string;
  serpapiKey?: string;
};

export const getFactualSourceConfig = (): FactualSourceConfig => ({
  bpsAppId: process.env.BPS_APP_ID?.trim() || undefined,
  tavilyKey: process.env.TAVILY_API_KEY?.trim() || undefined,
  serpapiKey: process.env.SERPAPI_API_KEY?.trim() || undefined,
});

export const hasBpsConfig = (): boolean =>
  Boolean(process.env.BPS_APP_ID?.trim());

export const hasTavilyConfig = (): boolean =>
  Boolean(process.env.TAVILY_API_KEY?.trim());

export const hasSerpapiConfig = (): boolean =>
  Boolean(process.env.SERPAPI_API_KEY?.trim());

// Fitur artikel faktual butuh minimal satu sumber web (Tavily atau SerpApi).
export const hasFactualConfig = (): boolean =>
  hasTavilyConfig() || hasSerpapiConfig() || hasBpsConfig();

export const hasUnsplashConfig = (): boolean =>
  Boolean(process.env.UNSPLASH_ACCESS_KEY);

export const hasPexelsConfig = (): boolean =>
  Boolean(process.env.PEXELS_API_KEY);

export const hasAnyStockConfig = (): boolean =>
  hasUnsplashConfig() || hasPexelsConfig();
