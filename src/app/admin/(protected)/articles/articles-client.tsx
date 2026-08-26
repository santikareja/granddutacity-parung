"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, ExternalLink, ArrowLeft, ArrowRight } from "lucide-react";

import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
} from "@/components/admin/ui";

export type ArticleRow = {
  id: number;
  title: string | null;
  slug: string | null;
  status: "draft" | "published" | null;
  publishedAt: string | null;
  updatedAt: string;
  aiGenerated: boolean | null;
  categoryNames: string[];
};

type Props = {
  initialItems: ArticleRow[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  status: "all" | "draft" | "published";
  canDelete: boolean;
};

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));

export default function ArticlesClient({
  initialItems,
  total,
  page,
  totalPages,
  search,
  status,
  canDelete,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [searchInput, setSearchInput] = useState(search);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyFilter = useCallback(
    (nextStatus: string, nextSearch: string) => {
      const params = new URLSearchParams();
      if (nextStatus !== "all") params.set("status", nextStatus);
      if (nextSearch.trim()) params.set("search", nextSearch.trim());
      router.push(`/admin/articles${params.toString() ? `?${params}` : ""}`);
    },
    [router],
  );

  const toggleStatus = useCallback(
    async (article: ArticleRow) => {
      const nextStatus = article.status === "published" ? "draft" : "published";
      setBusyId(article.id);
      setError(null);

      try {
        const response = await fetch(`/api/v2/articles/${article.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusOnly: true, status: nextStatus }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Gagal mengubah status.");

        setItems((prev) =>
          prev.map((item) =>
            item.id === article.id ? { ...item, status: nextStatus } : item,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengubah status.");
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const remove = useCallback(async (article: ArticleRow) => {
    if (
      !window.confirm(
        `Hapus artikel "${article.title || "(tanpa judul)"}"? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      return;
    }

    setBusyId(article.id);
    setError(null);

    try {
      const response = await fetch(`/api/v2/articles/${article.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal menghapus artikel.");
      setItems((prev) => prev.filter((item) => item.id !== article.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus artikel.");
    } finally {
      setBusyId(null);
    }
  }, []);

  const buildPageHref = (targetPage: number): string => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    if (targetPage > 1) params.set("page", String(targetPage));
    return `/admin/articles${params.toString() ? `?${params}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <AdminPageHeader
        title="Artikel"
        description={`${total} artikel total`}
        actions={
          <>
            <AdminButton variant="soft" asChild>
              <Link href="/admin/ai-studio">
                <Sparkles className="h-4 w-4" />
                Buat dengan AI
              </Link>
            </AdminButton>
            <AdminButton variant="primary" asChild>
              <Link href="/admin/articles/new">
                <Plus className="h-4 w-4" />
                Artikel Baru
              </Link>
            </AdminButton>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyFilter(status, searchInput);
          }}
          className="flex flex-1 gap-2"
        >
          <AdminInput
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari judul atau slug…"
            className="min-w-0 flex-1"
          />
          <AdminButton type="submit" variant="secondary">
            Cari
          </AdminButton>
        </form>

        <div className="flex gap-1 rounded-lg border border-admin-border bg-admin-surface p-1">
          {(["all", "published", "draft"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => applyFilter(option, searchInput)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                status === option
                  ? "bg-admin-accent-soft font-semibold text-admin-accent-soft-fg"
                  : "text-admin-fg-muted hover:bg-admin-surface-hover"
              }`}
            >
              {option === "all" ? "Semua" : option === "published" ? "Live" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      <AdminCard className="overflow-hidden">
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-border text-[11px] font-semibold uppercase tracking-wider text-admin-fg-muted">
                  <th className="px-5 py-3">Judul</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Diperbarui</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {items.map((article) => (
                  <tr key={article.id} className="align-top">
                    <td className="max-w-xs px-5 py-4">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="block truncate font-medium text-admin-fg hover:text-admin-accent"
                      >
                        {article.title || "(tanpa judul)"}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-admin-fg-muted">
                        /{article.slug || "-"}
                        {article.aiGenerated ? " · AI" : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {article.categoryNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {article.categoryNames.map((name) => (
                            <AdminBadge key={name} tone="neutral">
                              {name}
                            </AdminBadge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-admin-fg-dim">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <AdminBadge tone={article.status === "published" ? "success" : "warning"}>
                        {article.status === "published" ? "Live" : "Draft"}
                      </AdminBadge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-admin-fg-muted">
                      {formatDate(article.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <AdminButton
                          size="sm"
                          variant="secondary"
                          onClick={() => void toggleStatus(article)}
                          disabled={busyId === article.id}
                        >
                          {article.status === "published" ? "Jadikan draft" : "Publish"}
                        </AdminButton>

                        {article.status === "published" && article.slug ? (
                          <AdminButton size="sm" variant="ghost" asChild>
                            <a
                              href={`https://granddutacitysouthofjakarta.com/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </AdminButton>
                        ) : null}

                        {canDelete ? (
                          <AdminButton
                            size="sm"
                            variant="danger"
                            onClick={() => void remove(article)}
                            disabled={busyId === article.id}
                          >
                            Hapus
                          </AdminButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            title="Tidak ada artikel"
            description="Tidak ada artikel yang cocok dengan filter ini."
          />
        )}
      </AdminCard>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between" aria-label="Paginasi">
          {page > 1 ? (
            <AdminButton variant="secondary" asChild>
              <Link href={buildPageHref(page - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Sebelumnya
              </Link>
            </AdminButton>
          ) : (
            <span />
          )}

          <span className="text-sm text-admin-fg-muted">
            Halaman {page} dari {totalPages}
          </span>

          {page < totalPages ? (
            <AdminButton variant="secondary" asChild>
              <Link href={buildPageHref(page + 1)}>
                Berikutnya
                <ArrowRight className="h-4 w-4" />
              </Link>
            </AdminButton>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
