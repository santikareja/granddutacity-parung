// Enkripsi API key provider AI sebelum disimpan ke DB. AES-256-GCM dengan kunci
// diturunkan dari PAYLOAD_SECRET (scrypt). Server-side only — jangan impor dari client.
//
// Format ciphertext: "enc::v1::<saltB64>::<ivB64>::<tagB64>::<dataB64>"
// Salt per-record membuat kunci turunan unik walau PAYLOAD_SECRET sama.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const PREFIX = "enc::v1";
const ALGO = "aes-256-gcm";

const getMasterSecret = (): string => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret || secret.length < 8) {
    // Selaras dengan guard di payload.config.ts: tanpa secret kuat, enkripsi
    // tidak aman. Lempar agar pemanggil bisa menampilkan error, bukan menyimpan
    // key dalam bentuk lemah.
    throw new Error(
      "PAYLOAD_SECRET tidak tersedia/terlalu pendek untuk mengenkripsi API key.",
    );
  }
  return secret;
};

const deriveKey = (salt: Buffer): Buffer =>
  scryptSync(getMasterSecret(), salt, 32);

export const isEncrypted = (value: string): boolean =>
  typeof value === "string" && value.startsWith(`${PREFIX}::`);

export const encryptSecret = (plaintext: string): string => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(salt);

  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    PREFIX,
    salt.toString("base64"),
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join("::");
};

export const decryptSecret = (payload: string): string => {
  if (!isEncrypted(payload)) {
    // Nilai belum terenkripsi (mis. data lama / input mentah) — kembalikan apa adanya.
    return payload;
  }

  const parts = payload.split("::");
  // ["enc", "v1", salt, iv, tag, data]
  if (parts.length !== 6) {
    throw new Error("Format ciphertext API key tidak valid.");
  }

  const salt = Buffer.from(parts[2], "base64");
  const iv = Buffer.from(parts[3], "base64");
  const tag = Buffer.from(parts[4], "base64");
  const data = Buffer.from(parts[5], "base64");

  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

// Placeholder yang ditampilkan ke client (mask) agar API key asli tidak pernah
// dikirim keluar. Menyertakan 4 karakter terakhir untuk membantu identifikasi.
export const maskSecret = (plaintextOrCipher: string): string => {
  let plain = plaintextOrCipher;
  try {
    plain = decryptSecret(plaintextOrCipher);
  } catch {
    plain = "";
  }
  const last4 = plain.slice(-4);
  return last4 ? `••••••••${last4}` : "••••••••";
};

export const isMasked = (value: string): boolean =>
  typeof value === "string" && value.startsWith("••••");
