"use client";

import { useCallback, useState } from "react";

import {
  AdminClientError,
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
} from "@/lib/v2-admin/api-client";

export type TagRow = {
  id: number;
  name: string;
  slug: string | null;
  articleCount: number;
};

type Props = {
  initialItems: TagRow[];
  canManage: boolean;
};

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";

const labelClass = "block text-sm font-medium text-[#334155]";

const primaryBtn =
  "rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0951c] disabled:cursor-not-allowed disabled:opacity-50";

const ghostBtn =
  "rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm text-[#475467] transition hover:bg-[#f1f5f9] disabled:opacity-50";

const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof AdminClientError ? err.message : fallback;

export default function TagsClient({ initialItems, canManage }: Props) {
  const [items, setItems] = useState<TagRow[]>(initialItems);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await adminGet<{ tags: TagRow[] }>("/api/v2/tags");
      setItems(data.tags ?? []);
    } catch (err) {
      setError(errorMessage(err, "Gagal memuat ulang daftar tag."));
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError("Nama tag wajib diisi.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await adminPost("/api/v2/tags", { body: { name: name.trim() } });
      setName("");
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "Gagal membuat tag."));
    } finally {
      setCreating(false);
    }
  }, [name, refresh]);

  const startEdit = useCallback((row: TagRow) => {
    setEditingId(row.id);
    setEditName(row.name);
    setError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName("");
  }, []);

  const handleUpdate = useCallback(
    async (id: number) => {
      if (!editName.trim()) {
        setError("Nama tag wajib diisi.");
        return;
      }
      setBusyId(id);
      setError(null);
      try {
        await adminPatch(`/api/v2/tags/${id}`, {
          body: { name: editName.trim() },
        });
        cancelEdit();
        await refresh();
      } catch (err) {
        setError(errorMessage(err, "Gagal memperbarui tag."));
      } finally {
        setBusyId(null);
      }
    },
    [editName, cancelEdit, refresh],
  );

  const handleDelete = useCallback(
    async (row: TagRow) => {
      if (!window.confirm(`Hapus tag "${row.name}"? Tindakan ini permanen.`)) {
        return;
      }
      setBusyId(row.id);
      setError(null);
      try {
        await adminDelete(`/api/v2/tags/${row.id}`);
        await refresh();
      } catch (err) {
        setError(errorMessage(err, "Gagal menghapus tag."));
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#0f172a]">Tag</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Kelola tag artikel. Slug dibuat otomatis dari nama.
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

      {canManage ? (
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#334155]">Tambah tag</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className={labelClass} htmlFor="tag-name">
                Nama
              </label>
              <input
                id="tag-name"
                className={`mt-1.5 ${inputClass}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. Investasi"
                disabled={creating}
              />
            </div>
            <button
              type="button"
              className={primaryBtn}
              onClick={() => void handleCreate()}
              disabled={creating}
            >
              {creating ? "Menyimpan…" : "Tambah tag"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#64748b]">
            Belum ada tag.
          </p>
        ) : (
          <ul className="divide-y divide-[#eef2f7]">
            {items.map((row) => {
              const isEditing = editingId === row.id;
              const isBusy = busyId === row.id;
              return (
                <li key={row.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        className={`flex-1 ${inputClass}`}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nama"
                        disabled={isBusy}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={primaryBtn}
                          onClick={() => void handleUpdate(row.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? "Menyimpan…" : "Simpan"}
                        </button>
                        <button
                          type="button"
                          className={ghostBtn}
                          onClick={cancelEdit}
                          disabled={isBusy}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-[#0f172a]">{row.name}</p>
                        <p className="mt-0.5 text-xs text-[#94a3b8]">
                          {row.slug ? `/${row.slug} · ` : ""}
                          {row.articleCount} artikel
                        </p>
                      </div>
                      {canManage ? (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className={ghostBtn}
                            onClick={() => startEdit(row)}
                            disabled={isBusy}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            onClick={() => void handleDelete(row)}
                            disabled={isBusy}
                          >
                            {isBusy ? "…" : "Hapus"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
