"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type ArticleRow = {
  id: number;
  title: string | null;
  slug: string | null;
  status: "draft" | "published" | null;
  publishedAt: string | null;
  updatedAt: string;
  aiGenerated: boolean | null;
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
      router.push(`/v2-admin/articles${params.toString() ? `?${params}` : ""}`);
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
    return `/v2-admin/articles${params.toString() ? `?${params}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Artikel</h1>
          <p className="mt-1 text-sm text-[#475467]">{total} artikel total</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/v2-admin/ai-studio"
            className="rounded-lg border border-[#F5A524] bg-[#fff5ea] px-4 py-2 text-sm font-semibold text-[#A85D16] transition hover:bg-[#ffedd8]"
          >
            Buat dengan AI
          </Link>
          <Link
            href="/v2-admin/articles/new"
            className="rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f]"
          >
            + Artikel Baru
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyFilter(status, searchInput);
          }}
          className="flex flex-1 gap-2"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari judul atau slug…"
            className="min-w-0 flex-1 rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2 text-sm outline-none focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20"
          />
          <button
            type="submit"
            className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm transition hover:bg-[#f1f5f9]"
          >
            Cari
          </button>
        </form>

        <div className="flex gap-1 rounded-lg border border-[#e2e8f0] bg-white p-1">
          {(["all", "published", "draft"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => applyFilter(option, searchInput)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                status === option
                  ? "bg-[#fff5ea] font-semibold text-[#A85D16]"
                  : "text-[#475467] hover:bg-[#f1f5f9]"
              }`}
            >
              {option === "all" ? "Semua" : option === "published" ? "Live" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
        {items.length > 0 ? (
          <ul className="divide-y divide-[#eef2f7]">
            {items.map((article) => (
              <li
                key={article.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/v2-admin/articles/${article.id}`}
                    className="block truncate text-sm font-medium hover:text-[#A85D16]"
                  >
                    {article.title || "(tanpa judul)"}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-[#64748b]">
                    /{article.slug || "-"} &middot; diperbarui{" "}
                    {formatDate(article.updatedAt)}
                    {article.aiGenerated ? " · AI" : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      article.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {article.status === "published" ? "Live" : "Draft"}
                  </span>

                  <button
                    type="button"
                    onClick={() => void toggleStatus(article)}
                    disabled={busyId === article.id}
                    className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm transition hover:bg-[#f1f5f9] disabled:opacity-50"
                  >
                    {article.status === "published" ? "Jadikan draft" : "Publish"}
                  </button>

                  {article.status === "published" && article.slug ? (
                    <a
                      href={`https://granddutacitysouthofjakarta.com/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm transition hover:bg-[#f1f5f9]"
                    >
                      Lihat
                    </a>
                  ) : null}

                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => void remove(article)}
                      disabled={busyId === article.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-[#94a3b8]">
            Tidak ada artikel yang cocok dengan filter ini.
          </p>
        )}
      </section>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between" aria-label="Paginasi">
          {page > 1 ? (
            <Link
              href={buildPageHref(page - 1)}
              className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm transition hover:bg-[#f1f5f9]"
            >
              &larr; Sebelumnya
            </Link>
          ) : (
            <span />
          )}

          <span className="text-sm text-[#64748b]">
            Halaman {page} dari {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={buildPageHref(page + 1)}
              className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm transition hover:bg-[#f1f5f9]"
            >
              Berikutnya &rarr;
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
