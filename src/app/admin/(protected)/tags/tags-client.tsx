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
        <h1 className="text-xl font-semibold text-admin-fg">Tag</h1>
        <p className="mt-1 text-sm text-admin-fg-muted">
          Kelola tag artikel. Slug dibuat otomatis dari nama.
        </p>
      </header>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      {canManage ? (
        <AdminCard>
          <AdminCardBody>
            <h2 className="text-sm font-semibold text-admin-fg">Tambah tag</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <AdminLabel htmlFor="tag-name">Nama</AdminLabel>
                <AdminInput
                  id="tag-name"
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="mis. Investasi"
                  disabled={creating}
                />
              </div>
              <AdminButton
                type="button"
                variant="primary"
                onClick={() => void handleCreate()}
                disabled={creating}
              >
                <Plus className="h-4 w-4" />
                {creating ? "Menyimpan…" : "Tambah tag"}
              </AdminButton>
            </div>
          </AdminCardBody>
        </AdminCard>
      ) : null}

      <AdminCard className="overflow-hidden">
        {items.length === 0 ? (
          <AdminEmptyState title="Belum ada tag." />
        ) : (
          <ul className="divide-y divide-admin-border">
            {items.map((row) => {
              const isEditing = editingId === row.id;
              const isBusy = busyId === row.id;
              return (
                <li key={row.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <AdminInput
                        className="flex-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nama"
                        disabled={isBusy}
                      />
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
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-admin-fg">{row.name}</p>
                        <p className="mt-0.5 text-xs text-admin-fg-dim">
                          {row.slug ? `/${row.slug} · ` : ""}
                          {row.articleCount} artikel
                        </p>
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
