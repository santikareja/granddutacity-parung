import Link from "next/link";

import { listAiTasks } from "@/lib/v2-admin/ai-tasks";

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
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  processing: "bg-amber-50 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
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
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5A524]">
            AI Content Studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Riwayat Tugas AI
          </h1>
          <p className="mt-1.5 text-sm text-[#475467]">
            Catatan ringkas setiap permintaan AI (tanpa menyimpan kredensial).
          </p>
        </div>
        <Link
          href="/admin/ai-studio"
          className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm transition hover:bg-[#f1f5f9]"
        >
          ← AI Studio
        </Link>
      </header>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-10 text-center text-sm text-[#64748b]">
          Belum ada riwayat tugas AI.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs uppercase tracking-wide text-[#64748b]">
              <tr>
                <th className="px-4 py-3 font-semibold">Jenis</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f7]">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3 font-medium text-[#334155]">
                    {TYPE_LABELS[task.type] ?? task.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#475467]">
                    {task.createdAt
                      ? dateFormatter.format(new Date(task.createdAt))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748b]">
                    {task.error ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
