"use client";

import { useCallback, useState } from "react";
import { UserPlus } from "lucide-react";

import {
  AdminClientError,
  adminGet,
  adminPost,
} from "@/lib/v2-admin/api-client";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminEmptyState,
  AdminInput,
  AdminLabel,
  AdminSelect,
} from "@/components/admin/ui";

export type UserRole = "admin" | "ai-agent";

export type UserRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

type Props = {
  initialItems: UserRow[];
};

const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof AdminClientError ? err.message : fallback;

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export default function UsersClient({ initialItems }: Props) {
  const [items, setItems] = useState<UserRow[]>(initialItems);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await adminGet<{ users: UserRow[] }>("/api/v2/users");
      setItems(data.users ?? []);
    } catch (err) {
      setError(errorMessage(err, "Gagal memuat ulang daftar pengguna."));
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await adminPost("/api/v2/users", {
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        },
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("admin");
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "Gagal membuat pengguna."));
    } finally {
      setCreating(false);
    }
  }, [name, email, password, role, refresh]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-admin-fg">Pengguna</h1>
        <p className="mt-1 text-sm text-admin-fg-muted">
          Kelola akun yang dapat mengakses panel. Hanya admin yang bisa membuat
          pengguna baru.
        </p>
      </header>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      <AdminCard>
        <AdminCardBody>
          <h2 className="text-sm font-semibold text-admin-fg">Tambah pengguna</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="user-name">Nama</AdminLabel>
              <AdminInput
                id="user-name"
                className="mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. Budi Santoso"
                disabled={creating}
              />
            </div>
            <div>
              <AdminLabel htmlFor="user-email">Email</AdminLabel>
              <AdminInput
                id="user-email"
                type="email"
                autoComplete="off"
                className="mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
                disabled={creating}
              />
            </div>
            <div>
              <AdminLabel htmlFor="user-password">
                Password{" "}
                <span className="text-admin-fg-dim">(min. 8 karakter)</span>
              </AdminLabel>
              <AdminInput
                id="user-password"
                type="password"
                autoComplete="new-password"
                className="mt-1.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={creating}
              />
            </div>
            <div>
              <AdminLabel htmlFor="user-role">Role</AdminLabel>
              <AdminSelect
                id="user-role"
                className="mt-1.5"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={creating}
              >
                <option value="admin">admin</option>
                <option value="ai-agent">ai-agent</option>
              </AdminSelect>
            </div>
          </div>
          <div>
            <AdminButton
              type="button"
              variant="primary"
              onClick={() => void handleCreate()}
              disabled={creating}
            >
              <UserPlus className="h-4 w-4" />
              {creating ? "Menyimpan…" : "Tambah pengguna"}
            </AdminButton>
          </div>
        </AdminCardBody>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        {items.length === 0 ? (
          <AdminEmptyState title="Belum ada pengguna." />
        ) : (
          <ul className="divide-y divide-admin-border">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-admin-fg">{row.name}</p>
                  <p className="mt-0.5 text-xs text-admin-fg-dim">{row.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <AdminBadge tone="accent" className="capitalize">
                    {row.role}
                  </AdminBadge>
                  <span className="text-xs text-admin-fg-dim">
                    {formatDate(row.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
