// Observability admin: logging terstruktur + ring buffer operasional ringan.
// Server-side only.
//
// Dua kemampuan:
//   1. logAdminInfo/Warn/Error — menulis JSON terstruktur ke stdout/stderr.
//      Murah, tanpa dependensi, dan terbaca rapi di log Vercel. Aman dipanggil
//      di mana saja; tidak pernah melempar.
//   2. Ring buffer in-memory event operasional (observeOperationalEvent) +
//      ringkasan (getMonitoringSnapshot) untuk indikasi cepat 401/403, 5xx,
//      dan kegagalan tugas AI di dashboard monitoring.
//
// KETERBATASAN RING BUFFER (penting):
//   Ring buffer ini PER-INSTANCE dan EPHEMERAL. Di serverless (Vercel) setiap
//   instance/lambda punya memori sendiri dan bisa di-recycle kapan saja, jadi
//   angka snapshot BUKAN sumber kebenaran lintas instance — hanya indikasi
//   ringan untuk instance yang sedang melayani. Sumber kebenaran yang durable
//   adalah audit DB (admin_audit_log) dan log terstruktur di platform.

import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Structured logging
// ---------------------------------------------------------------------------

export type AdminLogEvent = {
  action: string;
  userId?: number | null;
  status?: number | string | null;
  requestId?: string | null;
  [key: string]: unknown;
};

type LogLevel = "info" | "warn" | "error";

// Buat requestId acak untuk korelasi antar-log dalam satu permintaan.
export const newRequestId = (): string => {
  try {
    return randomUUID();
  } catch {
    // Fallback amat jarang (crypto tak tersedia): tetap unik-cukup.
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
};

const emit = (level: LogLevel, event: AdminLogEvent): void => {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      scope: "v2-admin",
      ...event,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  } catch {
    // Logging tak boleh pernah menggagalkan alur; abaikan error serialisasi.
  }
};

export const logAdminInfo = (event: AdminLogEvent): void => emit("info", event);
export const logAdminWarn = (event: AdminLogEvent): void => emit("warn", event);
export const logAdminError = (event: AdminLogEvent): void =>
  emit("error", event);

// ---------------------------------------------------------------------------
// Ring buffer operasional (per-instance, ephemeral)
// ---------------------------------------------------------------------------

export type OperationalEvent = {
  // HTTP-like status (401/403/500...) atau penanda status logis.
  status?: number | string | null;
  // Label endpoint/operasi kasar (mis. 'auth', 'article', 'ai:article').
  action: string;
};

type StoredEvent = {
  at: number;
  status: number | null;
  action: string;
};

const RING_CAP = 500;

// Disimpan di globalThis agar bertahan lintas hot-reload dev & antar modul
// dalam satu instance (tetap ephemeral & per-instance di serverless).
type GlobalWithRing = typeof globalThis & {
  __gdcObsRing?: StoredEvent[];
};
const globalForObs = globalThis as GlobalWithRing;
const ring: StoredEvent[] = (globalForObs.__gdcObsRing ??= []);

const toStatusNumber = (status?: number | string | null): number | null => {
  if (typeof status === "number") return Number.isFinite(status) ? status : null;
  if (typeof status === "string") {
    const n = Number(status);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

// Catat satu event operasional ke ring buffer. Best-effort; tidak melempar.
export const observeOperationalEvent = (event: OperationalEvent): void => {
  try {
    ring.push({
      at: Date.now(),
      status: toStatusNumber(event.status),
      action: event.action || "unknown",
    });
    // Jaga cap: buang yang tertua bila melebihi kapasitas.
    if (ring.length > RING_CAP) ring.splice(0, ring.length - RING_CAP);
  } catch {
    // Abaikan; observabilitas tak boleh mengganggu alur utama.
  }
};

export type MonitoringSnapshot = {
  fromIso: string;
  toIso: string;
  totalEvents: number;
  unauthorizedCount: number; // 401 / 403
  serverErrorCount: number; // >= 500
  aiTaskFailureCount: number; // action diawali 'ai' dengan status gagal/>=500
  topEndpoints: { action: string; count: number }[];
};

// Ringkas isi ring buffer dalam jendela waktu tertentu (default 24 jam).
export const getMonitoringSnapshot = ({
  windowMs = 24 * 60 * 60 * 1000,
}: { windowMs?: number } = {}): MonitoringSnapshot => {
  const to = Date.now();
  const from = to - windowMs;

  let recent: StoredEvent[] = [];
  try {
    recent = ring.filter((e) => e.at >= from);
  } catch {
    recent = [];
  }

  let unauthorizedCount = 0;
  let serverErrorCount = 0;
  let aiTaskFailureCount = 0;
  const endpointCounts = new Map<string, number>();

  for (const e of recent) {
    if (e.status === 401 || e.status === 403) unauthorizedCount += 1;
    if (typeof e.status === "number" && e.status >= 500) serverErrorCount += 1;

    // Event AI hanya dicatat pada titik kegagalan (lihat pemanggil), jadi
    // setiap event ber-action diawali 'ai' dihitung sebagai kegagalan tugas AI.
    if (e.action.startsWith("ai")) aiTaskFailureCount += 1;

    endpointCounts.set(e.action, (endpointCounts.get(e.action) ?? 0) + 1);
  }

  const topEndpoints = Array.from(endpointCounts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    fromIso: new Date(from).toISOString(),
    toIso: new Date(to).toISOString(),
    totalEvents: recent.length,
    unauthorizedCount,
    serverErrorCount,
    aiTaskFailureCount,
    topEndpoints,
  };
};
