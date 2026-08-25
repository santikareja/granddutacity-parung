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

export const hasUnsplashConfig = (): boolean =>
  Boolean(process.env.UNSPLASH_ACCESS_KEY);

export const hasPexelsConfig = (): boolean =>
  Boolean(process.env.PEXELS_API_KEY);

export const hasAnyStockConfig = (): boolean =>
  hasUnsplashConfig() || hasPexelsConfig();
