import { NextResponse } from "next/server";

import { requireApiAdmin, apiError } from "@/lib/v2-auth/api-guard";
import {
  decryptProviderKey,
  getProviderWithSecret,
} from "@/lib/v2-admin/ai-providers";

export const runtime = "nodejs";

// Deteksi model tersedia dari provider OpenAI-compatible: GET {baseUrl}/models.
//
// Dua mode:
//   - { providerId }          → key didekripsi dari DB (provider sudah tersimpan)
//   - { baseUrl, apiKey }     → dipakai langsung (form belum disimpan)
// API key TIDAK pernah dikembalikan ke client.

const DETECT_TIMEOUT_MS = 30_000;

// Normalisasi berbagai bentuk respons daftar model.
const extractModelIds = (payload: unknown): string[] => {
  const list =
    (payload as { data?: unknown })?.data ??
    (payload as { models?: unknown })?.models ??
    payload;

  if (!Array.isArray(list)) return [];

  return Array.from(
    new Set(
      list
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const id =
              (item as { id?: unknown }).id ?? (item as { name?: unknown }).name;
            return typeof id === "string" ? id : null;
          }
          return null;
        })
        .filter((id): id is string => Boolean(id && id.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b));
};

export async function POST(request: Request) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  let body: { providerId?: unknown; baseUrl?: unknown; apiKey?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Body tidak valid.");
  }

  let baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
  let apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  // Key berupa mask atau kosong → ambil dari DB berdasarkan providerId.
  const needsDbKey = !apiKey || apiKey.startsWith("••");
  const providerId =
    typeof body.providerId === "number"
      ? body.providerId
      : typeof body.providerId === "string" && body.providerId.trim()
        ? Number(body.providerId)
        : null;

  if (needsDbKey && providerId && Number.isInteger(providerId)) {
    try {
      const provider = await getProviderWithSecret(providerId);
      if (provider) {
        if (!baseUrl) baseUrl = provider.baseUrl;
        apiKey = decryptProviderKey(provider.apiKey);
      }
    } catch (error) {
      console.error("[api/v2/ai-providers/detect-models] baca DB gagal:", error);
    }
  }

  if (!baseUrl || !apiKey) {
    return apiError(
      "Base URL dan API Key wajib tersedia untuk mendeteksi model. Simpan provider dulu, lalu coba lagi.",
    );
  }

  let normalizedBase: string;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return apiError("Base URL harus memakai skema http atau https.");
    }
    normalizedBase = baseUrl.replace(/\/+$/, "");
  } catch {
    return apiError("Base URL bukan URL yang valid.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DETECT_TIMEOUT_MS);

  try {
    const response = await fetch(`${normalizedBase}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return apiError(
        `Provider merespons ${response.status}. ${detail.slice(0, 200)}`,
        response.status === 401 || response.status === 403 ? 400 : 502,
      );
    }

    const data = await response.json();
    const models = extractModelIds(data);

    if (models.length === 0) {
      return apiError(
        "Provider tidak mengembalikan daftar model. Periksa Base URL (biasanya berakhiran /v1).",
        502,
      );
    }

    return NextResponse.json({ models });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return apiError("Timeout saat menghubungi provider.", 504);
    }
    console.error("[api/v2/ai-providers/detect-models] gagal:", error);
    return apiError(
      error instanceof Error ? error.message : "Gagal mendeteksi model.",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
