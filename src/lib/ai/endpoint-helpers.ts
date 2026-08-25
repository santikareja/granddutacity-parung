// Helper bersama untuk custom endpoint AI & stok: auth via req.user, parsing
// body JSON, respons error terstandar, dan rate-limit ringan per user (in-memory).
// Server-side only.

import type { PayloadRequest } from "payload";
import { addDataAndFileToRequest } from "payload";

import { AiDisabledError, AiRequestError } from "./client";

export const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const errorResponse = (message: string, status = 400): Response =>
  jsonResponse({ error: message }, status);

// Hanya user Payload yang login boleh mengakses endpoint AI/stok.
export const requireUser = (req: PayloadRequest): Response | null => {
  if (!req.user) {
    return errorResponse("Tidak terautentikasi.", 401);
  }
  return null;
};

// Rate-limit ringan: N request per jendela waktu per user. Cukup untuk mencegah
// penyalahgunaan tanpa infrastruktur eksternal. Reset per proses.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = (req: PayloadRequest): Response | null => {
  const userId = req.user?.id != null ? String(req.user.id) : "anon";
  const now = Date.now();
  const bucket = rateBuckets.get(userId);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }

  if (bucket.count >= RATE_LIMIT) {
    return errorResponse("Terlalu banyak permintaan. Coba lagi sebentar.", 429);
  }

  bucket.count += 1;
  return null;
};

// Ambil body JSON dari request custom endpoint (data tidak otomatis terisi).
export const getBody = async <T extends Record<string, unknown>>(
  req: PayloadRequest,
): Promise<T> => {
  await addDataAndFileToRequest(req);
  return (req.data as T) || ({} as T);
};

// Ubah error layanan AI menjadi Response yang sesuai.
export const handleAiError = (error: unknown): Response => {
  if (error instanceof AiDisabledError) {
    return errorResponse(error.message, 503);
  }
  if (error instanceof AiRequestError) {
    return errorResponse(error.message, error.status);
  }
  return errorResponse(
    error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.",
    500,
  );
};

// Guard umum untuk endpoint AI: auth + rate limit. Return Response bila gagal.
export const guardAiEndpoint = (req: PayloadRequest): Response | null => {
  const authError = requireUser(req);
  if (authError) return authError;

  const rateError = checkRateLimit(req);
  if (rateError) return rateError;

  return null;
};
