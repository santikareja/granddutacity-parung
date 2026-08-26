import Link from "next/link";

import { getSessionUser } from "@/lib/v2-auth/session";
import { getDashboardStats, getRecentArticles } from "@/lib/v2-admin/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Salam mengikuti waktu WIB, bukan timezone server (Vercel berjalan UTC).
const getGreeting = (): string => {
  const jakartaHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date()),
  );
  const hour = Number.isNaN(jakartaHour) ? 12 : jakartaHour % 24;
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 19) return "Selamat sore";
  return "Selamat malam";
};

const formatRelative = (date: Date): string => {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
};

const STAT_CARDS = [
  { key: "published", label: "Published", accent: "text-emerald-600" },
  { key: "draft", label: "Draft", accent: "text-amber-600" },
  { key: "media", label: "Media", accent: "text-violet-600" },
  { key: "categories", label: "Kategori", accent: "text-rose-600" },
  { key: "tags", label: "Tag", accent: "text-teal-600" },
] as const;

const QUICK_ACTIONS = [
  {
    href: "/admin/ai-studio",
    title: "AI Studio",
    desc: "Topik → judul → outline → artikel",
    primary: true,
  },
  {
    href: "/admin/articles",
    title: "Kelola Artikel",
    desc: "Edit, publish, atur SEO",
    primary: false,
  },
  {
    href: "/admin/settings/ai",
    title: "Konfigurasi AI",
    desc: "Provider, API key, model",
    primary: false,
  },
];

export default async function V2AdminDashboard() {
  const [user, { stats, error }, recent] = await Promise.all([
    getSessionUser(),
    getDashboardStats(),
    getRecentArticles(6),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5A524]">
          {getGreeting()}
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
          {user?.name || "Admin"}
        </h1>
        <p className="mt-1.5 text-sm text-[#475467]">
          <strong className="font-semibold text-[#0f172a]">{stats.published}</strong>{" "}
          artikel tayang &middot;{" "}
          <strong className="font-semibold text-[#0f172a]">{stats.draft}</strong> draft
          &middot;{" "}
          <strong className="font-semibold text-[#0f172a]">{stats.media}</strong> media
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <section aria-label="Statistik konten">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
            >
              <p className={`text-2xl font-bold ${card.accent}`}>
                {stats[card.key]}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Aksi cepat">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col gap-1 rounded-xl border p-4 transition hover:-translate-y-0.5 ${
                action.primary
                  ? "border-[#F5A524] bg-[#fff5ea]"
                  : "border-[#e2e8f0] bg-white hover:border-[#F5A524]"
              }`}
            >
              <span className="text-sm font-semibold">{action.title}</span>
              <span className="text-xs text-[#64748b]">{action.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
          <h2 className="text-base font-semibold">Artikel Terbaru</h2>
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-[#A85D16] hover:underline"
          >
            Lihat semua &rarr;
          </Link>
        </div>

        {recent.length > 0 ? (
          <ul className="divide-y divide-[#eef2f7]">
            {recent.map((article) => (
              <li
                key={article.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="block truncate text-sm font-medium hover:text-[#A85D16]"
                  >
                    {article.title || "(tanpa judul)"}
                  </Link>
                  <p className="mt-0.5 text-xs text-[#64748b]">
                    {formatRelative(article.updatedAt)}
                    {article.aiGenerated ? " · dibuat AI" : ""}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    article.status === "published"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {article.status === "published" ? "Live" : "Draft"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[#94a3b8]">
            Belum ada artikel, atau data gagal dimuat.
          </p>
        )}
      </section>
    </div>
  );
}
