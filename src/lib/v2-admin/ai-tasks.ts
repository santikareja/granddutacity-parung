// Log tugas AI (ai_tasks) untuk riwayat/audit di AI Studio. Server-side only.
//
// PENTING:
//   - Logging bersifat BEST-EFFORT: kegagalan menulis log TIDAK boleh
//     menggagalkan permintaan AI. Semua kesalahan ditelan (try/catch).
//   - JANGAN pernah menyimpan API key / kredensial pada `input`/`output`.
//     Pemanggil bertanggung jawab mengirim ringkasan yang aman.

import { desc } from "drizzle-orm";

import { db } from "@/db";
import { aiTasks, type AiTask } from "@/db/schema";
import { observeOperationalEvent } from "./observability";

export type AiTaskType =
  | "titles"
  | "outline"
  | "article"
  | "seo"
  | "text-tool"
  | "image-meta";

export type AiTaskStatus = "pending" | "processing" | "completed" | "failed";

export type LogAiTaskInput = {
  type: AiTaskType;
  status?: AiTaskStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
  userId?: number;
};

// Sisipkan baris log best-effort. Mengembalikan void; tidak pernah melempar.
// Guard `DATABASE_URI`: di lingkungan tanpa DB (mis. unit test) langsung skip
// agar tidak mencoba koneksi yang akan menggantung/gagal.
export const logAiTask = async ({
  type,
  status = "completed",
  input,
  output,
  error,
  userId,
}: LogAiTaskInput): Promise<void> => {
  // Observabilitas ringan in-memory: catat kegagalan tugas AI untuk snapshot
  // monitoring. Dilakukan sebelum guard DB karena tidak menyentuh database.
  if (status === "failed") {
    observeOperationalEvent({ status: "failed", action: `ai:${type}` });
  }

  if (!process.env.DATABASE_URI) return;

  try {
    await db.insert(aiTasks).values({
      type,
      status,
      input: input ?? null,
      output: output ?? null,
      error: error ?? null,
      userId: userId ?? null,
    });
  } catch (err) {
    // Best-effort: jangan pernah menggagalkan alur AI karena logging.
    console.error("[v2-admin] gagal mencatat ai_task:", err);
  }
};

// Daftar riwayat tugas AI terbaru untuk halaman riwayat.
export const listAiTasks = async (limit = 50): Promise<AiTask[]> => {
  try {
    return await db
      .select()
      .from(aiTasks)
      .orderBy(desc(aiTasks.createdAt))
      .limit(limit);
  } catch (err) {
    console.error("[v2-admin] gagal memuat daftar ai_tasks:", err);
    return [];
  }
};
