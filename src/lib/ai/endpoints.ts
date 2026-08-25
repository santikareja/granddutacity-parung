// Custom Payload endpoints untuk AI Content Studio: /api/ai/*.
// Auth via req.user (hanya user login), rate-limit ringan. Config AI diambil dari
// provider default di DB (ai-providers) dengan fallback ke env AI_*.
// Semua server-side; API key tidak pernah diekspos ke client.

import type { Endpoint, PayloadRequest } from "payload";

import { chatCompletion, parseJsonFromAi } from "@/lib/ai/client";
import { decryptSecret } from "@/lib/ai/crypto";
import { resolveAiConfig, type ResolvedAiConfig } from "@/lib/ai/runtime";
import {
  errorResponse,
  getBody,
  guardAiEndpoint,
  handleAiError,
  jsonResponse,
} from "@/lib/ai/endpoint-helpers";
import {
  buildArticlePrompt,
  buildImageMetaPrompt,
  buildOutlinePrompt,
  buildSeoPrompt,
  buildTitlesPrompt,
  type OutlineSection,
} from "@/lib/ai/prompts";
import { htmlToArticleLexical, sanitizeAiHtml } from "@/lib/ai/html-to-lexical";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Ambil config AI aktif; kembalikan Response 503 bila belum terkonfigurasi.
const requireAiConfig = async (
  req: PayloadRequest,
): Promise<ResolvedAiConfig | Response> => {
  const config = await resolveAiConfig(req.payload);
  if (!config) {
    return errorResponse(
      "Layanan AI belum dikonfigurasi. Tambahkan provider di menu Konfigurasi AI atau set env AI_*.",
      503,
    );
  }
  return config;
};

// GET /api/ai/status — cek ketersediaan layanan AI (dipakai UI untuk enable/disable).
const statusEndpoint: Endpoint = {
  path: "/ai/status",
  method: "get",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;
    const config = await resolveAiConfig(req.payload);
    return jsonResponse({ enabled: config !== null, source: config?.source ?? null });
  },
};

// Normalisasi berbagai bentuk daftar model OpenAI-compatible.
const extractModelIds = (payload: unknown): string[] => {
  const list =
    (payload as { data?: unknown })?.data ??
    (payload as { models?: unknown })?.models ??
    payload;

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const id = (item as { id?: unknown }).id ?? (item as { name?: unknown }).name;
        return typeof id === "string" ? id : null;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id))
    .sort((a, b) => a.localeCompare(b));
};

// POST /api/ai/detect-models — { providerId? , baseUrl?, apiKey? } → { models: string[] }
// Bila providerId diberikan, dekripsi key dari DB. Bila baseUrl+apiKey diberikan
// (form belum tersimpan), pakai langsung. apiKey mentah tidak pernah dikembalikan.
const detectModelsEndpoint: Endpoint = {
  path: "/ai/detect-models",
  method: "post",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;

    try {
      const body = await getBody<{
        providerId?: number | string;
        baseUrl?: string;
        apiKey?: string;
      }>(req);

      let baseUrl = body.baseUrl?.trim() || "";
      let apiKey = body.apiKey?.trim() || "";

      // Bila key dari form berupa mask, atau providerId diberikan, ambil dari DB.
      const needsDbLookup =
        Boolean(body.providerId) || (!apiKey || apiKey.startsWith("••"));

      if (needsDbLookup && body.providerId) {
        try {
          const provider = await req.payload.db.findOne<{
            id: number;
            baseUrl?: string | null;
            apiKey?: string | null;
          }>({
            collection: "ai-providers",
            where: { id: { equals: Number(body.providerId) } },
          });
          if (provider) {
            if (!baseUrl && provider.baseUrl) baseUrl = provider.baseUrl.trim();
            if (provider.apiKey) {
              try {
                apiKey = decryptSecret(provider.apiKey);
              } catch {
                apiKey = "";
              }
            }
          }
        } catch {
          // abaikan; tervalidasi di bawah
        }
      }

      if (!baseUrl || !apiKey || apiKey.startsWith("••")) {
        return errorResponse(
          "Base URL dan API Key wajib diisi untuk mendeteksi model.",
          400,
        );
      }

      const normalizedBase = baseUrl.replace(/\/+$/, "");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(`${normalizedBase}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          return errorResponse(
            `Provider merespons ${response.status}: ${detail.slice(0, 300)}`,
            response.status >= 400 && response.status < 500 ? 400 : 502,
          );
        }

        const data = await response.json();
        const models = extractModelIds(data);

        if (models.length === 0) {
          return errorResponse(
            "Provider tidak mengembalikan daftar model. Cek Base URL / API Key.",
            502,
          );
        }

        return jsonResponse({ models });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return errorResponse("Timeout saat mendeteksi model dari provider.", 504);
      }
      return handleAiError(error);
    }
  },
};

// POST /api/ai/titles — { topic } → { titles: string[] }
const titlesEndpoint: Endpoint = {
  path: "/ai/titles",
  method: "post",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;

    const config = await requireAiConfig(req);
    if (config instanceof Response) return config;

    try {
      const { topic } = await getBody<{ topic?: string }>(req);
      if (!topic || topic.trim().length === 0) {
        return errorResponse("Parameter 'topic' wajib diisi.", 400);
      }

      const raw = await chatCompletion({
        config,
        messages: buildTitlesPrompt(topic.trim()),
        temperature: 0.9,
        responseFormatJson: true,
      });

      const parsed = parseJsonFromAi<{ titles?: unknown }>(raw);
      const titles = Array.isArray(parsed.titles)
        ? parsed.titles
            .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
            .slice(0, 7)
        : [];

      if (titles.length === 0) {
        return errorResponse("AI tidak menghasilkan judul yang valid.", 502);
      }

      return jsonResponse({ titles });
    } catch (error) {
      return handleAiError(error);
    }
  },
};

// POST /api/ai/outline — { title } → { sections: OutlineSection[] }
const outlineEndpoint: Endpoint = {
  path: "/ai/outline",
  method: "post",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;

    const config = await requireAiConfig(req);
    if (config instanceof Response) return config;

    try {
      const { title } = await getBody<{ title?: string }>(req);
      if (!title || title.trim().length === 0) {
        return errorResponse("Parameter 'title' wajib diisi.", 400);
      }

      const raw = await chatCompletion({
        config,
        messages: buildOutlinePrompt(title.trim()),
        temperature: 0.7,
        responseFormatJson: true,
      });

      const parsed = parseJsonFromAi<{ sections?: unknown }>(raw);
      const sections: OutlineSection[] = Array.isArray(parsed.sections)
        ? parsed.sections
            .map((section): OutlineSection | null => {
              if (!section || typeof section !== "object") return null;
              const heading = (section as { heading?: unknown }).heading;
              if (typeof heading !== "string" || heading.trim().length === 0) {
                return null;
              }
              const subheadingsRaw = (section as { subheadings?: unknown }).subheadings;
              const subheadings = Array.isArray(subheadingsRaw)
                ? subheadingsRaw.filter(
                    (s): s is string => typeof s === "string" && s.trim().length > 0,
                  )
                : [];
              return { heading: heading.trim(), subheadings };
            })
            .filter((s): s is OutlineSection => s !== null)
        : [];

      if (sections.length === 0) {
        return errorResponse("AI tidak menghasilkan outline yang valid.", 502);
      }

      return jsonResponse({ sections });
    } catch (error) {
      return handleAiError(error);
    }
  },
};

// POST /api/ai/article — { title, outline } → { html, lexical }
const articleEndpoint: Endpoint = {
  path: "/ai/article",
  method: "post",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;

    const config = await requireAiConfig(req);
    if (config instanceof Response) return config;

    try {
      const { title, outline } = await getBody<{
        title?: string;
        outline?: OutlineSection[];
      }>(req);

      if (!title || title.trim().length === 0) {
        return errorResponse("Parameter 'title' wajib diisi.", 400);
      }
      if (!Array.isArray(outline) || outline.length === 0) {
        return errorResponse("Parameter 'outline' wajib berupa array non-kosong.", 400);
      }

      const raw = await chatCompletion({
        config,
        messages: buildArticlePrompt(title.trim(), outline),
        temperature: 0.8,
        maxTokens: 4000,
      });

      const html = sanitizeAiHtml(raw);
      if (html.length === 0) {
        return errorResponse("AI menghasilkan artikel kosong.", 502);
      }

      // Konversi ke Lexical state agar bisa langsung dipakai field content.
      const lexical = await htmlToArticleLexical(html, req.payload.config);

      return jsonResponse({ html, lexical });
    } catch (error) {
      return handleAiError(error);
    }
  },
};

// POST /api/ai/seo — { title, content } → { metaTitle, metaDescription, slug, focusKeyword }
const seoEndpoint: Endpoint = {
  path: "/ai/seo",
  method: "post",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;

    const config = await requireAiConfig(req);
    if (config instanceof Response) return config;

    try {
      const { title, content } = await getBody<{
        title?: string;
        content?: string;
      }>(req);

      if (!title || title.trim().length === 0) {
        return errorResponse("Parameter 'title' wajib diisi.", 400);
      }

      const raw = await chatCompletion({
        config,
        messages: buildSeoPrompt(title.trim(), content || title),
        temperature: 0.5,
        responseFormatJson: true,
      });

      const parsed = parseJsonFromAi<{
        metaTitle?: unknown;
        metaDescription?: unknown;
        slug?: unknown;
        focusKeyword?: unknown;
      }>(raw);

      const metaTitle =
        typeof parsed.metaTitle === "string" ? parsed.metaTitle.trim() : "";
      const metaDescription =
        typeof parsed.metaDescription === "string"
          ? parsed.metaDescription.trim()
          : "";
      const focusKeyword =
        typeof parsed.focusKeyword === "string" ? parsed.focusKeyword.trim() : "";
      const slug =
        typeof parsed.slug === "string" && parsed.slug.trim().length > 0
          ? slugify(parsed.slug)
          : slugify(title);

      return jsonResponse({ metaTitle, metaDescription, slug, focusKeyword });
    } catch (error) {
      return handleAiError(error);
    }
  },
};

// POST /api/ai/image-meta — { context, photo } → { name, alt, caption }
const imageMetaEndpoint: Endpoint = {
  path: "/ai/image-meta",
  method: "post",
  handler: async (req: PayloadRequest) => {
    const guard = guardAiEndpoint(req);
    if (guard) return guard;

    const config = await requireAiConfig(req);
    if (config instanceof Response) return config;

    try {
      const { context, photo } = await getBody<{
        context?: string;
        photo?: string;
      }>(req);

      const raw = await chatCompletion({
        config,
        messages: buildImageMetaPrompt(context || "Artikel properti", photo || ""),
        temperature: 0.6,
        responseFormatJson: true,
      });

      const parsed = parseJsonFromAi<{
        name?: unknown;
        alt?: unknown;
        caption?: unknown;
      }>(raw);

      return jsonResponse({
        name: typeof parsed.name === "string" ? parsed.name.trim() : "",
        alt: typeof parsed.alt === "string" ? parsed.alt.trim() : "",
        caption: typeof parsed.caption === "string" ? parsed.caption.trim() : "",
      });
    } catch (error) {
      return handleAiError(error);
    }
  },
};

export const aiEndpoints: Endpoint[] = [
  statusEndpoint,
  detectModelsEndpoint,
  titlesEndpoint,
  outlineEndpoint,
  articleEndpoint,
  seoEndpoint,
  imageMetaEndpoint,
];
