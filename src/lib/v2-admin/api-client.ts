// Helper fetch sisi-klien untuk panel v2-admin.
//
// Menyediakan wrapper tipis di atas fetch dengan:
//   - Timeout default 10 detik via AbortController (digabung dengan signal
//     eksternal bila diberikan).
//   - CSRF otomatis untuk request non-GET: token diambil sekali dari
//     GET /api/v2/csrf lalu di-cache di memori (module-level). Bila server
//     menolak dengan 403 CSRF, cache di-invalidasi dan request diulang 1x.
//   - Retry 1x untuk GET pada network error / 5xx dengan backoff 200ms.
//   - Error terstruktur (AdminClientError) dengan pesan yang diekstrak dari
//     payload.error / payload.message / payload.issues[0].message.
//
// Catatan: modul ini memakai API browser (fetch, AbortController) dan
// dimaksudkan hanya untuk dipakai dari komponen klien.

export type AdminClientErrorCode =
  | "HTTP_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "ABORTED";

export class AdminClientError extends Error {
  readonly code: AdminClientErrorCode;
  readonly status?: number;

  constructor(code: AdminClientErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AdminClientError";
    this.code = code;
    this.status = status;
  }
}

export type AdminRequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export type AdminMutationOptions = AdminRequestOptions & {
  body?: unknown;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const GET_RETRY_BACKOFF_MS = 200;
const CSRF_ENDPOINT = "/api/v2/csrf";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Ekstrak pesan error yang ramah dari payload JSON server.
const extractMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === "object") {
    const p = payload as {
      error?: unknown;
      message?: unknown;
      issues?: unknown;
    };
    if (typeof p.error === "string" && p.error) return p.error;
    if (typeof p.message === "string" && p.message) return p.message;
    if (Array.isArray(p.issues) && p.issues.length > 0) {
      const first = p.issues[0] as { message?: unknown };
      if (first && typeof first.message === "string" && first.message) {
        return first.message;
      }
    }
  }
  return fallback;
};

type TimeoutHandle = {
  signal: AbortSignal;
  cleanup: () => void;
  timedOut: { value: boolean };
};

// Gabungkan timeout internal dengan signal eksternal opsional. Tidak memakai
// AbortSignal.any/AbortSignal.timeout demi kompatibilitas Safari 16.4.
const withTimeout = (
  external: AbortSignal | undefined,
  timeoutMs: number,
): TimeoutHandle => {
  const controller = new AbortController();
  const timedOut = { value: false };

  const timer = setTimeout(() => {
    timedOut.value = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();

  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const cleanup = () => {
    clearTimeout(timer);
    if (external) external.removeEventListener("abort", onExternalAbort);
  };

  return { signal: controller.signal, cleanup, timedOut };
};

// Satu kali percobaan request. Melempar AdminClientError pada kegagalan.
const performRequest = async <T>(
  method: string,
  url: string,
  opts: AdminMutationOptions,
): Promise<T> => {
  const hasBody = opts.body !== undefined;
  const { signal, cleanup, timedOut } = withTimeout(
    opts.signal,
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
        ...opts.headers,
      },
      body: hasBody ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    cleanup();
    if (timedOut.value) {
      throw new AdminClientError("TIMEOUT", "Permintaan melebihi batas waktu.");
    }
    if (opts.signal?.aborted) {
      throw new AdminClientError("ABORTED", "Permintaan dibatalkan.");
    }
    throw new AdminClientError(
      "NETWORK_ERROR",
      "Gagal terhubung ke server.",
    );
  }

  // Header sudah diterima: hentikan timeout agar pembacaan body tidak dibatalkan.
  cleanup();

  let payload: unknown = null;
  try {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
  } catch {
    if (opts.signal?.aborted) {
      throw new AdminClientError("ABORTED", "Permintaan dibatalkan.");
    }
    throw new AdminClientError(
      "NETWORK_ERROR",
      "Gagal membaca respons server.",
    );
  }

  if (!response.ok) {
    throw new AdminClientError(
      "HTTP_ERROR",
      extractMessage(payload, `Permintaan gagal (HTTP ${response.status}).`),
      response.status,
    );
  }

  return payload as T;
};

// --- CSRF token cache (module-level) --------------------------------------

let csrfTokenCache: string | null = null;
let csrfInFlight: Promise<string> | null = null;

const getCsrfToken = async (): Promise<string> => {
  if (csrfTokenCache) return csrfTokenCache;
  if (csrfInFlight) return csrfInFlight;

  csrfInFlight = adminGet<{ csrfToken: string }>(CSRF_ENDPOINT)
    .then((data) => {
      csrfTokenCache = data.csrfToken;
      return data.csrfToken;
    })
    .finally(() => {
      csrfInFlight = null;
    });

  return csrfInFlight;
};

const invalidateCsrfToken = (): void => {
  csrfTokenCache = null;
};

const isCsrfRejection = (error: unknown): boolean =>
  error instanceof AdminClientError &&
  error.code === "HTTP_ERROR" &&
  error.status === 403 &&
  /csrf/i.test(error.message);

// --- Public API ------------------------------------------------------------

export const adminGet = async <T>(
  url: string,
  opts: AdminRequestOptions = {},
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await performRequest<T>("GET", url, opts);
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof AdminClientError &&
        (error.code === "NETWORK_ERROR" ||
          (error.code === "HTTP_ERROR" &&
            error.status !== undefined &&
            error.status >= 500));

      if (attempt === 0 && retryable) {
        await delay(GET_RETRY_BACKOFF_MS);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

const mutate = async <T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  opts: AdminMutationOptions = {},
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const token = await getCsrfToken();
    try {
      return await performRequest<T>(method, url, {
        ...opts,
        headers: { ...opts.headers, "x-csrf-token": token },
      });
    } catch (error) {
      lastError = error;
      if (attempt === 0 && isCsrfRejection(error)) {
        invalidateCsrfToken();
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

export const adminPost = <T>(
  url: string,
  opts: AdminMutationOptions = {},
): Promise<T> => mutate<T>("POST", url, opts);

export const adminPut = <T>(
  url: string,
  opts: AdminMutationOptions = {},
): Promise<T> => mutate<T>("PUT", url, opts);

export const adminPatch = <T>(
  url: string,
  opts: AdminMutationOptions = {},
): Promise<T> => mutate<T>("PATCH", url, opts);

export const adminDelete = <T>(
  url: string,
  opts: AdminMutationOptions = {},
): Promise<T> => mutate<T>("DELETE", url, opts);
