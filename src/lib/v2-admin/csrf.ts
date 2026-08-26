// Proteksi CSRF untuk endpoint mutasi panel admin. Server-side only (Node runtime).
//
// Strategi: double-submit token bertanda tangan + validasi Origin.
//   - Token = HMAC-SHA256(APP_SECRET, `${userId}`) hex. Terikat ke user,
//     stateless, dan tidak bisa ditebak tanpa secret. Cookie sesi httpOnly tidak
//     terbaca JS, jadi token dikirim eksplisit via header x-csrf-token yang
//     hanya bisa dipasang oleh kode first-party (bukan form cross-site).
//   - Validasi Origin menutup celah bila header kustom entah bagaimana lolos:
//     Origin (bila ada) host-nya wajib cocok dengan host request.
//
// Secret dibaca dari APP_SECRET (fallback warisan PAYLOAD_SECRET) dengan pola
// yang sama seperti src/lib/v2-auth/auth.ts (lempar bila tidak diset / < 8 karakter).

import { createHmac, timingSafeEqual } from "crypto";

// Pembacaan ganda APP_SECRET -> PAYLOAD_SECRET (fallback warisan).
//
// PENTING: nilai secret ini TIDAK BOLEH DIROTASI. Nilai yang sama juga menjadi
// kunci dekripsi API key provider AI (src/lib/ai/crypto.ts) dan penandatangan
// cookie sesi (src/lib/v2-auth/auth.ts). Rotasi = API key AI tak bisa didekripsi
// + seluruh sesi aktif invalid.
const getSecret = (): string => {
  const secret = process.env.APP_SECRET ?? process.env.PAYLOAD_SECRET;
  if (!secret || secret.length < 8) {
    throw new Error(
      "APP_SECRET wajib diset dan cukup panjang untuk menandatangani token CSRF " +
        "(fallback PAYLOAD_SECRET juga tidak tersedia).",
    );
  }
  return secret;
};

// Terbitkan token CSRF untuk sebuah user. Deterministik: token sama untuk user
// yang sama selama secret tidak berubah, sehingga aman di-cache di klien.
export const issueCsrfToken = (userId: number): string =>
  createHmac("sha256", getSecret()).update(`${userId}`).digest("hex");

// Perbandingan waktu-konstan yang aman terhadap panjang berbeda.
const safeEqualHex = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

// Ambil host (tanpa protokol/port-aware) dari sebuah URL/otoritas string.
const hostOf = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    // Punya skema → parse penuh.
    return new URL(value).host.toLowerCase();
  } catch {
    // Nilai berupa otoritas telanjang (mis. header Host: "example.com:443").
    const trimmed = value.trim().toLowerCase();
    return trimmed || null;
  }
};

// Kumpulkan daftar host yang dianggap sah untuk request ini.
const allowedHosts = (request: Request): Set<string> => {
  const hosts = new Set<string>();

  const hostHeader = hostOf(request.headers.get("host"));
  if (hostHeader) hosts.add(hostHeader);

  const forwarded = hostOf(request.headers.get("x-forwarded-host"));
  if (forwarded) hosts.add(forwarded);

  const serverUrl = hostOf(process.env.NEXT_PUBLIC_SERVER_URL);
  if (serverUrl) hosts.add(serverUrl);

  return hosts;
};

// Verifikasi request mutasi: token CSRF valid untuk user + Origin cocok.
// Mengembalikan false (tolak) bila salah satu syarat gagal.
export const verifyCsrf = (request: Request, userId: number): boolean => {
  // 1) Header token wajib ada dan cocok dengan token yang diharapkan.
  const provided = request.headers.get("x-csrf-token");
  if (!provided) return false;

  let expected: string;
  try {
    expected = issueCsrfToken(userId);
  } catch {
    return false;
  }

  if (!safeEqualHex(provided, expected)) return false;

  // 2) Validasi Origin. Untuk metode mutasi, ketiadaan Origin ditolak.
  const origin = request.headers.get("origin");
  const originHost = hostOf(origin);
  if (!originHost) return false;

  return allowedHosts(request).has(originHost);
};
