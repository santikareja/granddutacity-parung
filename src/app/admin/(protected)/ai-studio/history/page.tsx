import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { listAiTasks } from "@/lib/v2-admin/ai-tasks";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
} from "@/components/admin/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Label ramah untuk kolom `type`.
const TYPE_LABELS: Record<string, string> = {
  titles: "Judul",
  outline: "Outline",
  article: "Artikel",
  seo: "SEO",
  "text-tool": "Alat Teks",
  "image-meta": "Meta Gambar",
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-admin-success-soft text-admin-success",
  failed: "bg-admin-danger-soft text-admin-danger",
  processing: "bg-admin-warning-soft text-admin-warning",
  pending: "bg-admin-surface-muted text-admin-fg-muted",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AiHistoryPage() {
  const tasks = await listAiTasks(100);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-admin-accent">
            <Sparkles className="h-3.5 w-3.5" />
            AI Content Studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-admin-fg">
            Riwayat Tugas AI
          </h1>
          <p className="mt-1.5 text-sm text-admin-fg-muted">
            Catatan ringkas setiap permintaan AI (tanpa menyimpan kredensial).
          </p>
        </div>
        <AdminButton variant="secondary" asChild>
          <Link href="/admin/ai-studio">
            <ArrowLeft className="h-4 w-4" />
            AI Studio
          </Link>
        </AdminButton>
      </header>

      {tasks.length === 0 ? (
        <AdminCard>
          <AdminEmptyState title="Belum ada riwayat tugas AI." />
        </AdminCard>
      ) : (
        <AdminCard className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-admin-border bg-admin-surface-muted text-xs uppercase tracking-wide text-admin-fg-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Jenis</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3 font-medium text-admin-fg">
                    {TYPE_LABELS[task.type] ?? task.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        STATUS_STYLES[task.status] ??
                        "bg-admin-surface-muted text-admin-fg-muted"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-admin-fg-muted">
                    {task.createdAt
                      ? dateFormatter.format(new Date(task.createdAt))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-admin-fg-muted">
                    {task.error ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}
    </div>
  );
}
