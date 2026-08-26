// Audit trail durable (admin_audit_log) untuk perubahan konten admin.
// Server-side only.
//
// PENTING:
//   - Pencatatan bersifat BEST-EFFORT: kegagalan menulis audit TIDAK boleh
//     menggagalkan operasi bisnis (create/update/delete artikel). Semua error
//     ditelan (try/catch) dan tidak pernah dilempar.
//   - Guard `DATABASE_URI`: di lingkungan tanpa DB (mis. unit test) langsung
//     skip agar tidak mencoba koneksi yang akan menggantung/gagal.
//   - JANGAN pernah menyimpan kredensial pada `summary`. Pemanggil bertanggung
//     jawab mengirim ringkasan yang aman (mis. {title, slug, status}).

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { adminAuditLog, type AdminAuditLog } from "@/db/schema";

export type AuditAction =
  | "article:create"
  | "article:update"
  | "article:delete"
  | "article:status";

export type AuditEntity = "artikel";

export type RecordAuditInput = {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: number | null;
  userId?: number | null;
  userEmail?: string | null;
  summary?: Record<string, unknown> | null;
};

// Sisipkan satu baris audit best-effort. Mengembalikan void; tidak pernah
// melempar. Aman dipanggil fire-and-forget (void recordAudit(...)).
export const recordAudit = async ({
  action,
  entity,
  entityId,
  userId,
  userEmail,
  summary,
}: RecordAuditInput): Promise<void> => {
  if (!process.env.DATABASE_URI) return;

  try {
    await db.insert(adminAuditLog).values({
      action,
      entity,
      entityId: entityId ?? null,
      userId: userId ?? null,
      userEmail: userEmail ?? null,
      summary: summary ?? null,
    });
  } catch (err) {
    // Best-effort: jangan pernah menggagalkan operasi karena audit.
    console.error("[v2-admin] gagal mencatat audit:", err);
  }
};

export type ListAuditInput = {
  limit?: number;
  entity?: AuditEntity;
  entityId?: number;
};

// Daftar entri audit terbaru untuk halaman monitoring. Best-effort: bila DB
// bermasalah mengembalikan array kosong, bukan melempar.
export const listAuditLog = async ({
  limit = 50,
  entity,
  entityId,
}: ListAuditInput = {}): Promise<AdminAuditLog[]> => {
  try {
    const conditions = [];
    if (entity) conditions.push(eq(adminAuditLog.entity, entity));
    if (typeof entityId === "number") {
      conditions.push(eq(adminAuditLog.entityId, entityId));
    }

    const base = db.select().from(adminAuditLog);
    const filtered =
      conditions.length > 0 ? base.where(and(...conditions)) : base;

    return await filtered.orderBy(desc(adminAuditLog.createdAt)).limit(limit);
  } catch (err) {
    console.error("[v2-admin] gagal memuat audit log:", err);
    return [];
  }
};
