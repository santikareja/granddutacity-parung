import { redirect } from "next/navigation";
import { AlertTriangle, ServerCrash, Bot, Activity } from "lucide-react";

import { getSessionUser } from "@/lib/v2-auth/session";
import { getMonitoringSnapshot } from "@/lib/v2-admin/observability";
import { listAuditLog } from "@/lib/v2-admin/audit";
import { AdminCard, AdminEmptyState, AdminStatCard } from "@/components/admin/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  "article:create": "Buat artikel",
  "article:update": "Ubah artikel",
  "article:delete": "Hapus artikel",
  "article:status": "Ubah status",
};

const formatDateTime = (date: Date): string =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);

// Ringkas objek summary jsonb menjadi teks "key: value" yang ringkas & aman.
const formatSummary = (summary: unknown): string => {
  if (!summary || typeof summary !== "object") return "—";
  const entries = Object.entries(summary as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
};

export default async function MonitoringPage() {
  // Halaman monitoring hanya untuk admin (berisi indikasi keamanan/operasional).
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin");

  const snapshot = getMonitoringSnapshot();
  const auditEntries = await listAuditLog({ limit: 50 });

  const cards = [
    {
      label: "401 / 403",
      value: snapshot.unauthorizedCount,
      desc: "Akses ditolak",
      icon: AlertTriangle,
      tone: "warning" as const,
    },
    {
      label: "5xx",
      value: snapshot.serverErrorCount,
      desc: "Kesalahan server",
      icon: ServerCrash,
      tone: "danger" as const,
    },
    {
      label: "AI gagal",
      value: snapshot.aiTaskFailureCount,
      desc: "Tugas AI gagal",
      icon: Bot,
      tone: "danger" as const,
    },
    {
      label: "Total event",
      value: snapshot.totalEvents,
      desc: "Terpantau (24 jam)",
      icon: Activity,
      tone: "info" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-admin-accent">
          Observability
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-admin-fg">
          Monitoring &amp; Audit
        </h1>
        <p className="mt-1.5 text-sm text-admin-fg-muted">
          Indikasi operasional ringan{" "}
          <span className="text-admin-fg-dim">
            ({formatDateTime(new Date(snapshot.fromIso))} &rarr;{" "}
            {formatDateTime(new Date(snapshot.toIso))})
          </span>{" "}
          dan riwayat perubahan konten.
        </p>
      </header>

      <section aria-label="Ringkasan operasional">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label}>
              <AdminStatCard
                label={card.label}
                value={card.value}
                icon={card.icon}
                tone={card.tone}
              />
              <p className="mt-1.5 px-1 text-xs text-admin-fg-dim">{card.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-admin-fg-dim">
          Catatan: angka di atas berasal dari buffer in-memory per-instance dan
          bersifat sementara (ephemeral) di serverless — sekadar indikasi ringan,
          bukan sumber kebenaran lintas instance. Audit di bawah bersifat durable.
        </p>
      </section>

      {snapshot.topEndpoints.length > 0 ? (
        <AdminCard className="p-5" aria-label="Endpoint teratas">
          <h2 className="text-base font-semibold text-admin-fg">Endpoint teratas</h2>
          <ul className="mt-3 space-y-2">
            {snapshot.topEndpoints.map((ep) => (
              <li
                key={ep.action}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-mono text-admin-fg-muted">{ep.action}</span>
                <span className="font-semibold text-admin-fg">{ep.count}</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      <AdminCard>
        <div className="border-b border-admin-border px-5 py-4">
          <h2 className="text-base font-semibold text-admin-fg">Audit Trail</h2>
          <p className="mt-0.5 text-xs text-admin-fg-muted">
            50 perubahan konten terakhir (durable, dari database).
          </p>
        </div>

        {auditEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-border text-[11px] font-semibold uppercase tracking-wider text-admin-fg-muted">
                  <th className="px-5 py-3">Waktu</th>
                  <th className="px-5 py-3">Aksi</th>
                  <th className="px-5 py-3">Entitas</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Ringkasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {auditEntries.map((entry) => (
                  <tr key={entry.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-3 text-admin-fg-muted">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-admin-fg">
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-admin-fg-muted">
                      {entry.entity}
                      {typeof entry.entityId === "number"
                        ? `#${entry.entityId}`
                        : ""}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-admin-fg-muted">
                      {entry.userEmail ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-admin-fg-muted">
                      {formatSummary(entry.summary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada entri audit, atau data gagal dimuat."
          />
        )}
      </AdminCard>
    </div>
  );
}
