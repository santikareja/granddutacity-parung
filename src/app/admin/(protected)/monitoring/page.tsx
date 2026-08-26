import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import { getMonitoringSnapshot } from "@/lib/v2-admin/observability";
import { listAuditLog } from "@/lib/v2-admin/audit";

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
      accent: "text-amber-600",
      desc: "Akses ditolak",
    },
    {
      label: "5xx",
      value: snapshot.serverErrorCount,
      accent: "text-red-600",
      desc: "Kesalahan server",
    },
    {
      label: "AI gagal",
      value: snapshot.aiTaskFailureCount,
      accent: "text-rose-600",
      desc: "Tugas AI gagal",
    },
    {
      label: "Total event",
      value: snapshot.totalEvents,
      accent: "text-sky-600",
      desc: "Terpantau (24 jam)",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5A524]">
          Observability
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
          Monitoring &amp; Audit
        </h1>
        <p className="mt-1.5 text-sm text-[#475467]">
          Indikasi operasional ringan{" "}
          <span className="text-[#64748b]">
            ({formatDateTime(new Date(snapshot.fromIso))} &rarr;{" "}
            {formatDateTime(new Date(snapshot.toIso))})
          </span>{" "}
          dan riwayat perubahan konten.
        </p>
      </header>

      <section aria-label="Ringkasan operasional">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
            >
              <p className={`text-2xl font-bold ${card.accent}`}>{card.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                {card.label}
              </p>
              <p className="mt-0.5 text-xs text-[#94a3b8]">{card.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#94a3b8]">
          Catatan: angka di atas berasal dari buffer in-memory per-instance dan
          bersifat sementara (ephemeral) di serverless — sekadar indikasi ringan,
          bukan sumber kebenaran lintas instance. Audit di bawah bersifat durable.
        </p>
      </section>

      {snapshot.topEndpoints.length > 0 ? (
        <section
          aria-label="Endpoint teratas"
          className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
        >
          <h2 className="text-base font-semibold">Endpoint teratas</h2>
          <ul className="mt-3 space-y-2">
            {snapshot.topEndpoints.map((ep) => (
              <li
                key={ep.action}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-mono text-[#475467]">{ep.action}</span>
                <span className="font-semibold text-[#0f172a]">{ep.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
        <div className="border-b border-[#eef2f7] px-5 py-4">
          <h2 className="text-base font-semibold">Audit Trail</h2>
          <p className="mt-0.5 text-xs text-[#64748b]">
            50 perubahan konten terakhir (durable, dari database).
          </p>
        </div>

        {auditEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#eef2f7] text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  <th className="px-5 py-3">Waktu</th>
                  <th className="px-5 py-3">Aksi</th>
                  <th className="px-5 py-3">Entitas</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Ringkasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {auditEntries.map((entry) => (
                  <tr key={entry.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-3 text-[#64748b]">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-medium">
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[#475467]">
                      {entry.entity}
                      {typeof entry.entityId === "number"
                        ? `#${entry.entityId}`
                        : ""}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[#475467]">
                      {entry.userEmail ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[#475467]">
                      {formatSummary(entry.summary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[#94a3b8]">
            Belum ada entri audit, atau data gagal dimuat.
          </p>
        )}
      </section>
    </div>
  );
}
