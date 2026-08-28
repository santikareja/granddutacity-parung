// Klien Tumblr API v2 (OAuth 1.0a) tanpa dependensi eksternal. Server-side only.
//
// Kenapa tidak pakai tumblr.js: menghindari risiko interop ESM/CJS di Next 16
// dan perubahan versi dependensi. Penandatanganan OAuth 1.0a HMAC-SHA1 cukup
// ringkas untuk diimplementasi dengan `node:crypto` dan mudah diuji.
//
// PENTING: JANGAN pernah mengembalikan kredensial (consumer secret / token
// secret) ke pemanggil atau ke log. Hanya kembalikan ringkasan aman.

import { createHmac, randomBytes } from "node:crypto";

import { getTumblrConfig, type TumblrConfig } from "@/lib/ai/env";

// Host produksi tempat artikel benar-benar tayang. URL yang bukan absolut https
// ke host ini dianggap belum live (mis. staging/preview) dan cross-post dilewati.
const PRODUCTION_HOST = "granddutacitysouthofjakarta.com";

// Batas aman panjang deskripsi link post.
const DESCRIPTION_MAX = 500;

const TUMBLR_API_BASE = "https://api.tumblr.com";
const REQUEST_TIMEOUT_MS = 15_000;

export type TumblrPostResult = {
  success: boolean;
  postId?: string;
  error?: string;
  // true bila dilewati karena input tidak valid (bukan kegagalan jaringan).
  skipped?: boolean;
};

export type TumblrVerifyResult = {
  ok: boolean;
  configured: boolean;
  userName?: string;
  blogs?: { name: string; url: string }[];
  status?: number;
  error?: string;
};

type TumblrRequestResult = {
  ok: boolean;
  status: number;
  postId?: string;
  message?: string;
  raw: unknown;
};

export type TumblrClient = {
  blogName: string;
  request: (
    method: "GET" | "POST",
    path: string,
    params?: Record<string, string>,
  ) => Promise<TumblrRequestResult>;
};

// --- Helper murni (diekspor untuk pengujian) --------------------------------

// RFC 3986 percent-encoding. encodeURIComponent tidak meng-encode ! * ' ( ),
// sedangkan OAuth 1.0a mewajibkannya.
export const percentEncode = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

// Rapikan deskripsi: pangkas dan potong ke batas aman bila terlalu panjang.
export const normalizeExcerpt = (raw: string | null | undefined): string => {
  const trimmed = raw?.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return trimmed.length > DESCRIPTION_MAX
    ? `${trimmed.slice(0, DESCRIPTION_MAX - 1)}…`
    : trimmed;
};

// URL dianggap live jika absolut https, ke host produksi, dan punya path artikel
// (bukan sekadar root). Mencegah posting URL staging/preview atau homepage.
export const isLiveArticleUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === PRODUCTION_HOST &&
      parsed.pathname.replace(/\/+$/, "").length > 1
    );
  } catch {
    return false;
  }
};

// Identifier blog Tumblr menerima hostname; normalkan "namablog" → "namablog.tumblr.com".
const normalizeBlogIdentifier = (blogName: string): string => {
  const trimmed = blogName.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return trimmed.includes(".") ? trimmed : `${trimmed}.tumblr.com`;
};

// --- OAuth 1.0a -------------------------------------------------------------

const buildAuthorizationHeader = (
  config: TumblrConfig,
  method: string,
  url: string,
  signatureParams: Record<string, string>,
): string => {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.token,
    oauth_version: "1.0",
  };

  // Basis tanda tangan mencakup parameter OAuth + parameter body/query.
  const allParams = { ...oauthParams, ...signatureParams };
  const paramString = Object.keys(allParams)
    .map((key) => [percentEncode(key), percentEncode(allParams[key])] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(config.consumerSecret)}&${percentEncode(
    config.tokenSecret,
  )}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return `OAuth ${Object.keys(headerParams)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(headerParams[key])}"`)
    .join(", ")}`;
};

const extractMessage = (raw: unknown): string | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const meta = (raw as { meta?: { msg?: string } }).meta;
  const response = (raw as { response?: { errors?: { detail?: string }[] } }).response;
  const detail = response?.errors?.[0]?.detail;
  return detail || meta?.msg || undefined;
};

const extractPostId = (raw: unknown): string | undefined => {
  const response = (raw as { response?: { id_string?: string; id?: number | string } })
    ?.response;
  if (!response) return undefined;
  if (response.id_string) return String(response.id_string);
  if (response.id !== undefined && response.id !== null) return String(response.id);
  return undefined;
};

// --- Klien ------------------------------------------------------------------

export const createTumblrClient = (
  config?: TumblrConfig | null,
): TumblrClient | null => {
  const cfg = config ?? getTumblrConfig();
  if (!cfg) return null;

  const request = async (
    method: "GET" | "POST",
    path: string,
    params: Record<string, string> = {},
  ): Promise<TumblrRequestResult> => {
    const url = `${TUMBLR_API_BASE}${path}`;
    // Untuk POST form-encoded, parameter body ikut ditandatangani. Untuk GET
    // tanpa query, tidak ada parameter tambahan.
    const signatureParams = method === "POST" ? params : {};
    const authorization = buildAuthorizationHeader(cfg, method, url, signatureParams);

    const headers: Record<string, string> = { Authorization: authorization };
    const init: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };

    if (method === "POST") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      init.body = new URLSearchParams(params).toString();
    }

    const res = await fetch(url, init);
    const raw = await res.json().catch(() => null);
    const metaStatus = (raw as { meta?: { status?: number } } | null)?.meta?.status;
    const ok = res.ok && (metaStatus === undefined || metaStatus < 300);

    return {
      ok,
      status: metaStatus ?? res.status,
      postId: extractPostId(raw),
      message: extractMessage(raw),
      raw,
    };
  };

  return { blogName: normalizeBlogIdentifier(cfg.blogName), request };
};

// Buat "link post" berisi judul, URL artikel, dan ringkasan. Tidak pernah
// melempar: selalu mengembalikan hasil terstruktur agar aman dipanggil di
// jalur publish.
export const postToTumblr = async (
  article: { title: string; url: string; excerpt?: string | null },
  config?: TumblrConfig | null,
): Promise<TumblrPostResult> => {
  const client = createTumblrClient(config);
  if (!client) {
    return { success: false, skipped: true, error: "Tumblr belum dikonfigurasi." };
  }

  const title = article.title?.trim();
  if (!title) {
    return { success: false, skipped: true, error: "Judul kosong; cross-post dilewati." };
  }
  if (!isLiveArticleUrl(article.url)) {
    return {
      success: false,
      skipped: true,
      error: "URL artikel belum live; cross-post dilewati.",
    };
  }

  const description = normalizeExcerpt(article.excerpt);
  const params: Record<string, string> = { type: "link", title, url: article.url };
  if (description) params.description = description;

  try {
    const result = await client.request(
      "POST",
      `/v2/blog/${client.blogName}/post`,
      params,
    );
    if (!result.ok) {
      return {
        success: false,
        error: `Tumblr merespons ${result.status}${result.message ? `: ${result.message}` : ""}`,
      };
    }
    return { success: true, postId: result.postId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
    return { success: false, error: `Gagal menghubungi Tumblr: ${message}` };
  }
};

// Verifikasi koneksi OAuth dengan memanggil endpoint info user. Dipakai oleh
// endpoint test manual sebelum publish artikel pertama.
export const verifyTumblrCredentials = async (
  config?: TumblrConfig | null,
): Promise<TumblrVerifyResult> => {
  const client = createTumblrClient(config);
  if (!client) {
    return {
      ok: false,
      configured: false,
      error: "Tumblr belum dikonfigurasi (env belum lengkap).",
    };
  }

  try {
    const result = await client.request("GET", "/v2/user/info");
    if (!result.ok) {
      return {
        ok: false,
        configured: true,
        status: result.status,
        error: `Tumblr merespons ${result.status}${result.message ? `: ${result.message}` : ""}`,
      };
    }

    const user = (result.raw as {
      response?: { user?: { name?: string; blogs?: { name?: string; url?: string }[] } };
    })?.response?.user;

    return {
      ok: true,
      configured: true,
      userName: user?.name,
      blogs: (user?.blogs ?? [])
        .filter((b) => b.name)
        .map((b) => ({ name: b.name as string, url: b.url ?? "" })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
    return { ok: false, configured: true, error: `Gagal menghubungi Tumblr: ${message}` };
  }
};
