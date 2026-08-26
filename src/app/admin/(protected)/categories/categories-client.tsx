"use client";

import { useCallback, useState } from "react";

import {
  AdminClientError,
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
} from "@/lib/v2-admin/api-client";

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
};

type Props = {
  initialItems: CategoryRow[];
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

export default function CategoriesClient({ initialItems, canManage }: Props) {
  const [items, setItems] = useState<CategoryRow[]>(initialItems);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status edit inline per baris.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await adminGet<{ categories: CategoryRow[] }>(
        "/api/v2/categories",
      );
      setItems(data.categories ?? []);
    } catch (err) {
      setError(errorMessage(err, "Gagal memuat ulang daftar kategori."));
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await adminPost("/api/v2/categories", {
        body: { name: name.trim(), description: description.trim() || undefined },
      });
      setName("");
      setDescription("");
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "Gagal membuat kategori."));
    } finally {
      setCreating(false);
    }
  }, [name, description, refresh]);

  const startEdit = useCallback((row: CategoryRow) => {
    setEditingId(row.id);
    setEditName(row.name);
    setEditDescription(row.description ?? "");
    setError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }, []);

  const handleUpdate = useCallback(
    async (id: number) => {
      if (!editName.trim()) {
        setError("Nama kategori wajib diisi.");
        return;
      }
      setBusyId(id);
      setError(null);
      try {
        await adminPatch(`/api/v2/categories/${id}`, {
          body: {
            name: editName.trim(),
            description: editDescription.trim() || undefined,
          },
        });
        cancelEdit();
        await refresh();
      } catch (err) {
        setError(errorMessage(err, "Gagal memperbarui kategori."));
      } finally {
        setBusyId(null);
      }
    },
    [editName, editDescription, cancelEdit, refresh],
  );

  const handleDelete = useCallback(
    async (row: CategoryRow) => {
      if (
        !window.confirm(`Hapus kategori "${row.name}"? Tindakan ini permanen.`)
      ) {
        return;
      }
      setBusyId(row.id);
      setError(null);
      try {
        await adminDelete(`/api/v2/categories/${row.id}`);
        await refresh();
      } catch (err) {
        setError(errorMessage(err, "Gagal menghapus kategori."));
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#0f172a]">Kategori</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Kelola kategori artikel. Slug dibuat otomatis dari nama.
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
          <h2 className="text-sm font-semibold text-[#334155]">
            Tambah kategori
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="cat-name">
                Nama
              </label>
              <input
                id="cat-name"
                className={`mt-1.5 ${inputClass}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. Properti"
                disabled={creating}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="cat-desc">
                Deskripsi <span className="text-[#94a3b8]">(opsional)</span>
              </label>
              <input
                id="cat-desc"
                className={`mt-1.5 ${inputClass}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat"
                disabled={creating}
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className={primaryBtn}
              onClick={() => void handleCreate()}
              disabled={creating}
            >
              {creating ? "Menyimpan…" : "Tambah kategori"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#64748b]">
            Belum ada kategori.
          </p>
        ) : (
          <ul className="divide-y divide-[#eef2f7]">
            {items.map((row) => {
              const isEditing = editingId === row.id;
              const isBusy = busyId === row.id;
              return (
                <li key={row.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          className={inputClass}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nama"
                          disabled={isBusy}
                        />
                        <input
                          className={inputClass}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Deskripsi (opsional)"
                          disabled={isBusy}
                        />
                      </div>
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
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-[#0f172a]">{row.name}</p>
                        <p className="mt-0.5 text-xs text-[#94a3b8]">
                          /{row.slug} · {row.articleCount} artikel
                        </p>
                        {row.description ? (
                          <p className="mt-1 text-sm text-[#64748b]">
                            {row.description}
                          </p>
                        ) : null}
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
