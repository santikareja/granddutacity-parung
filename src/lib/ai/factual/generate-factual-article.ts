// Orkestrator artikel faktual (provider-agnostic, tahan rotasi model).
// Server-side only.
//
// Alur:
//   1. Model memilih tool + query (JSON) — buildToolPlanPrompt.
//   2. Sistem mengeksekusi tool: BPS dan/atau web (Tavily → fallback SerpApi).
//   3. Model menulis artikel HANYA dari hasil tool — buildFactualArticlePrompt.
//   4. validateArticleQuality menilai hasil → tandai needsReview bila perlu.
//
// TIDAK menyimpan ke tabel artikel. Hasil dikembalikan ke editor admin agar
// penulis meninjau lalu menyimpan lewat alur simpan yang sudah ada (kontrol
// manual). Metadata + sitasi dicatat terpisah oleh route ke ai_tasks.

import { AiRequestError, parseJsonFromAi } from "@/lib/ai/client";
import {
  AI_BUDGETS,
  resolveAiCandidates,
  runAiTask,
  type AiCandidate,
} from "@/lib/v2-admin/ai-rotation";
import { htmlToLexicalState } from "@/lib/v2-admin/html-to-lexical";
import { ensureCta } from "@/lib/v2-admin/lexical";
import { sanitizeAiHtml } from "@/lib/ai/sanitize-html";

import {
  buildFactualArticlePrompt,
  buildToolPlanPrompt,
  type PlannedTool,
} from "./prompts";
import { searchBpsData, searchWeb, type ToolSource } from "./sources";
import {
  validateArticleQuality,
  type QualityResult,
} from "./validate";

const stripCodeFence = (raw: string): string => {
  const match = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (match ? match[1] : raw).trim();
};

const countWords = (html: string): number =>
  html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

// Normalisasi keluaran plan model menjadi daftar tool yang valid & aman.
const parseToolPlan = (raw: string): PlannedTool[] => {
  const parsed = parseJsonFromAi<{ tools?: unknown }>(raw);
  const list = Array.isArray(parsed?.tools) ? parsed.tools : [];
  const tools: PlannedTool[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const name = (item as { name?: unknown }).name;

    if (name === "search_bps_data") {
      const kw = (item as { indicator_keyword?: unknown }).indicator_keyword;
      if (typeof kw === "string" && kw.trim()) {
        const tahun = (item as { tahun?: unknown }).tahun;
        tools.push({
          name: "search_bps_data",
          indicator_keyword: kw.trim(),
          tahun: typeof tahun === "string" ? tahun.trim() : undefined,
        });
      }
    } else if (name === "search_web_tavily") {
      const query = (item as { query?: unknown }).query;
      if (typeof query === "string" && query.trim()) {
        const max = (item as { max_results?: unknown }).max_results;
        tools.push({
          name: "search_web_tavily",
          query: query.trim(),
          max_results: typeof max === "number" ? max : undefined,
        });
      }
    }
    // name lain (termasuk fallback SerpApi) diabaikan: bukan pilihan model.
  }

  // Maksimal 2 tool.
  return tools.slice(0, 2);
};

export type FactualToolUsage = {
  name: PlannedTool["name"];
  query: string;
  provider_used: "bps" | "tavily" | "serpapi" | null;
  fallback_used: boolean;
  result_count: number;
};

export type FactualArticleResult = {
  html: string;
  content: unknown;
  wordCount: number;
  sources: ToolSource[];
  toolsUsed: FactualToolUsage[];
  fallbackUsed: boolean;
  validation: QualityResult;
  model: string;
  providerName?: string;
  rotated: boolean;
};

export type GenerateFactualArticleOptions = {
  topic: string;
  category?: string;
  targetWords?: number;
  providerId?: number;
  model?: string;
  signal?: AbortSignal;
};

const dedupeSources = (sources: ToolSource[]): ToolSource[] => {
  const seen = new Set<string>();
  const out: ToolSource[] = [];
  for (const s of sources) {
    const key = s.source_url.trim().toLowerCase().replace(/\/+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
};

export const generateFactualArticle = async (
  options: GenerateFactualArticleOptions,
): Promise<FactualArticleResult> => {
  const topic = options.topic.trim();
  const category = (options.category ?? "").trim();
  const targetWords = Math.min(
    2000,
    Math.max(600, Math.trunc(options.targetWords ?? 1100)),
  );

  if (!topic) {
    throw new AiRequestError("Topik wajib diisi.", 400, false);
  }

  const candidates: AiCandidate[] = await resolveAiCandidates({
    providerId: options.providerId,
    model: options.model,
    maxCandidates: AI_BUDGETS.factualArticle.maxCandidates,
  });

  if (candidates.length === 0) {
    throw new AiRequestError(
      "Layanan AI belum dikonfigurasi. Tambahkan provider di Konfigurasi AI.",
      503,
      false,
    );
  }

  // --- Tahap 1: rencana tool (best-effort; gagal → tanpa tool) ---
  let plan: PlannedTool[] = [];
  try {
    const planResult = await runAiTask<PlannedTool[]>({
      candidates,
      messages: buildToolPlanPrompt(topic, category),
      budget: AI_BUDGETS.factualPlan,
      temperature: 0.2,
      responseFormatJson: true,
      signal: options.signal,
      taskLabel: "factual-plan",
      parse: parseToolPlan,
    });
    plan = planResult.value;
  } catch (planError) {
    console.warn(
      "[factual] perencanaan tool gagal, lanjut tanpa tool:",
      planError instanceof Error ? planError.message : planError,
    );
  }

  // --- Tahap 2: eksekusi tool ---
  const sources: ToolSource[] = [];
  const toolsUsed: FactualToolUsage[] = [];
  let anyFallback = false;

  for (const tool of plan) {
    if (tool.name === "search_bps_data") {
      const bps = await searchBpsData(tool.indicator_keyword, tool.tahun);
      sources.push(...bps);
      toolsUsed.push({
        name: "search_bps_data",
        query: tool.indicator_keyword,
        provider_used: bps.length > 0 ? "bps" : null,
        fallback_used: false,
        result_count: bps.length,
      });
    } else {
      const web = await searchWeb(tool.query, tool.max_results ?? 3);
      sources.push(...web.sources);
      anyFallback = anyFallback || web.fallbackUsed;
      toolsUsed.push({
        name: "search_web_tavily",
        query: tool.query,
        provider_used: web.providerUsed,
        fallback_used: web.fallbackUsed,
        result_count: web.sources.length,
      });
    }
  }

  const finalSources = dedupeSources(sources);

  // --- Tahap 3: penulisan artikel ---
  const articleResult = await runAiTask<string>({
    candidates,
    messages: buildFactualArticlePrompt(
      topic,
      category,
      finalSources,
      targetWords,
    ),
    budget: AI_BUDGETS.factualArticle,
    temperature: 0.7,
    maxTokens: Math.min(16_000, Math.max(4_000, Math.round(targetWords * 3.2))),
    signal: options.signal,
    taskLabel: "factual-article",
    parse: (raw) => {
      const html = stripCodeFence(raw);
      if (!html) throw new AiRequestError("AI menghasilkan artikel kosong.", 502);
      return html;
    },
  });

  const finalHtml = articleResult.value;
  const content = ensureCta(htmlToLexicalState(finalHtml));
  const html = sanitizeAiHtml(finalHtml);
  const validation = validateArticleQuality(finalHtml, finalSources, {
    minWords: Math.round(targetWords * 0.7),
    maxWords: Math.round(targetWords * 1.4),
  });

  return {
    html,
    content,
    wordCount: countWords(finalHtml),
    sources: finalSources,
    toolsUsed,
    fallbackUsed: anyFallback,
    validation,
    model: articleResult.model,
    providerName: articleResult.providerName,
    rotated: articleResult.rotated,
  };
};
