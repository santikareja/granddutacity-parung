"use client";

import { useCallback, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminEmptyState,
  AdminInput,
  AdminLabel,
} from "@/components/admin/ui";
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
        <h1 className="text-xl font-semibold text-admin-fg">Kategori</h1>
        <p className="mt-1 text-sm text-admin-fg-muted">
          Kelola kategori artikel. Slug dibuat otomatis dari nama.
        </p>
      </header>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      {canManage ? (
        <AdminCard>
          <AdminCardBody>
            <h2 className="text-sm font-semibold text-admin-fg">
              Tambah kategori
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <AdminLabel htmlFor="cat-name">Nama</AdminLabel>
                <AdminInput
                  id="cat-name"
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="mis. Properti"
                  disabled={creating}
                />
              </div>
              <div>
                <AdminLabel htmlFor="cat-desc">
                  Deskripsi <span className="text-admin-fg-dim">(opsional)</span>
                </AdminLabel>
                <AdminInput
                  id="cat-desc"
                  className="mt-1.5"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat"
                  disabled={creating}
                />
              </div>
            </div>
            <div>
              <AdminButton
                type="button"
                variant="primary"
                onClick={() => void handleCreate()}
                disabled={creating}
              >
                <Plus className="h-4 w-4" />
                {creating ? "Menyimpan…" : "Tambah kategori"}
              </AdminButton>
            </div>
          </AdminCardBody>
        </AdminCard>
      ) : null}

      <AdminCard className="overflow-hidden">
        {items.length === 0 ? (
          <AdminEmptyState title="Belum ada kategori." />
        ) : (
          <ul className="divide-y divide-admin-border">
            {items.map((row) => {
              const isEditing = editingId === row.id;
              const isBusy = busyId === row.id;
              return (
                <li key={row.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AdminInput
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nama"
                          disabled={isBusy}
                        />
                        <AdminInput
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Deskripsi (opsional)"
                          disabled={isBusy}
                        />
                      </div>
                      <div className="flex gap-2">
                        <AdminButton
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => void handleUpdate(row.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? "Menyimpan…" : "Simpan"}
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isBusy}
                        >
                          <X className="h-3.5 w-3.5" />
                          Batal
                        </AdminButton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-admin-fg">{row.name}</p>
                        <p className="mt-0.5 text-xs text-admin-fg-dim">
                          /{row.slug} · {row.articleCount} artikel
                        </p>
                        {row.description ? (
                          <p className="mt-1 text-sm text-admin-fg-muted">
                            {row.description}
                          </p>
                        ) : null}
                      </div>
                      {canManage ? (
                        <div className="flex shrink-0 gap-2">
                          <AdminButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => startEdit(row)}
                            disabled={isBusy}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </AdminButton>
                          <AdminButton
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => void handleDelete(row)}
                            disabled={isBusy}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {isBusy ? "…" : "Hapus"}
                          </AdminButton>
                        </div>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
