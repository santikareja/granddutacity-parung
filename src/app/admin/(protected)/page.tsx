import Link from "next/link";
import {
  CheckCircle2,
  FileEdit,
  Images,
  FolderTree,
  Tags,
  Sparkles,
  Newspaper,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";

import { getSessionUser } from "@/lib/v2-auth/session";
import { getDashboardStats, getRecentArticles } from "@/lib/v2-admin/queries";
import {
  AdminAlert,
  AdminBadge,
  AdminCard,
  AdminStatCard,
} from "@/components/admin/ui";

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
  { key: "published", label: "Published", icon: CheckCircle2, tone: "success" },
  { key: "draft", label: "Draft", icon: FileEdit, tone: "warning" },
  { key: "media", label: "Media", icon: Images, tone: "info" },
  { key: "categories", label: "Kategori", icon: FolderTree, tone: "accent" },
  { key: "tags", label: "Tag", icon: Tags, tone: "neutral" },
] as const;

const QUICK_ACTIONS = [
  {
    href: "/admin/ai-studio",
    title: "AI Studio",
    desc: "Topik → judul → outline → artikel",
    icon: Sparkles,
    primary: true,
  },
  {
    href: "/admin/articles",
    title: "Kelola Artikel",
    desc: "Edit, publish, atur SEO",
    icon: Newspaper,
    primary: false,
  },
  {
    href: "/admin/settings/ai",
    title: "Konfigurasi AI",
    desc: "Provider, API key, model",
    icon: SlidersHorizontal,
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
      <header className="rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-admin-accent">
          {getGreeting()}
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-admin-fg">
          {user?.name || "Admin"}
        </h1>
        <p className="mt-1.5 text-sm text-admin-fg-muted">
          <strong className="font-semibold text-admin-fg">{stats.published}</strong>{" "}
          artikel tayang &middot;{" "}
          <strong className="font-semibold text-admin-fg">{stats.draft}</strong> draft
          &middot;{" "}
          <strong className="font-semibold text-admin-fg">{stats.media}</strong> media
        </p>
      </header>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      <section aria-label="Statistik konten">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {STAT_CARDS.map((card) => (
            <AdminStatCard
              key={card.key}
              label={card.label}
              value={stats[card.key]}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </div>
      </section>

      <section aria-label="Aksi cepat">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group flex flex-col gap-2 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-admin-sm ${
                  action.primary
                    ? "border-admin-accent/40 bg-admin-accent-soft"
                    : "border-admin-border bg-admin-surface hover:border-admin-accent/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      action.primary
                        ? "bg-admin-accent text-admin-accent-fg"
                        : "bg-admin-surface-muted text-admin-fg-muted"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  </span>
                  <ArrowRight className="h-4 w-4 text-admin-fg-dim opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-admin-fg">{action.title}</p>
                  <p className="text-xs text-admin-fg-muted">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <AdminCard>
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <h2 className="text-base font-semibold text-admin-fg">Artikel Terbaru</h2>
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-admin-accent hover:underline"
          >
            Lihat semua &rarr;
          </Link>
        </div>

        {recent.length > 0 ? (
          <ul className="divide-y divide-admin-border">
            {recent.map((article) => (
              <li
                key={article.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="block truncate text-sm font-medium text-admin-fg hover:text-admin-accent"
                  >
                    {article.title || "(tanpa judul)"}
                  </Link>
                  <p className="mt-0.5 text-xs text-admin-fg-muted">
                    {formatRelative(article.updatedAt)}
                    {article.aiGenerated ? " · dibuat AI" : ""}
                  </p>
                </div>

                <AdminBadge tone={article.status === "published" ? "success" : "warning"}>
                  {article.status === "published" ? "Live" : "Draft"}
                </AdminBadge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-admin-fg-dim">
            Belum ada artikel, atau data gagal dimuat.
          </p>
        )}
      </AdminCard>
    </div>
  );
}
