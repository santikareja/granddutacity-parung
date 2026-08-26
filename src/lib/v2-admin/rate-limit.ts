// Rate limiter in-memory berbagi pakai untuk endpoint v2-admin.
//
// Berbasis Map di level proses (per instance). Cukup sebagai pertahanan lapis
// pertama terhadap brute force / abuse; BUKAN pengganti WAF atau rate limiter
// terdistribusi. State hilang saat proses restart dan tidak dibagi antar
// instance serverless — itu diterima untuk kebutuhan ini.

type Bucket = { count: number; resetAt: number };

export type RateLimitOptions = {
  // Jumlah maksimum attempt dalam satu window.
  limit: number;
  // Panjang window dalam milidetik.
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  // Detik hingga window reset; hanya diisi saat ok === false.
  retryAfterSec?: number;
};

// Ambang pembersihan: bila Map melampaui ini, entri yang sudah kedaluwarsa
// dipurge agar memori tidak tumbuh tanpa batas oleh key yang tak pernah kembali.
const CLEANUP_THRESHOLD = 5000;

const buckets = new Map<string, Bucket>();

// Buang entri yang windownya sudah lewat. Dipanggil hanya saat Map membengkak
// agar biaya iterasi tidak dibayar pada jalur normal.
const purgeExpired = (now: number): void => {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
};

const retryAfterSec = (resetAt: number, now: number): number =>
  Math.max(1, Math.ceil((resetAt - now) / 1000));

// Konsumsi satu attempt untuk `key`, lalu laporkan apakah masih diizinkan.
// Attempt pertama dalam window baru selalu ok.
export const checkRateLimit = (
  key: string,
  opts: RateLimitOptions,
): RateLimitResult => {
  const now = Date.now();

  if (buckets.size > CLEANUP_THRESHOLD) purgeExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }

  if (bucket.count >= opts.limit) {
    return { ok: false, retryAfterSec: retryAfterSec(bucket.resetAt, now) };
  }

  bucket.count += 1;
  return { ok: true };
};

// Cek status `key` TANPA mengonsumsi attempt. Berguna untuk memeriksa lebih
// dulu tanpa memengaruhi hitungan.
export const peekRateLimit = (
  key: string,
  opts: RateLimitOptions,
): RateLimitResult => {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) return { ok: true };

  if (bucket.count >= opts.limit) {
    return { ok: false, retryAfterSec: retryAfterSec(bucket.resetAt, now) };
  }

  return { ok: true };
};
