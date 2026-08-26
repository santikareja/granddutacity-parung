"use client";

import { useCallback, useState } from "react";

import {
  AdminClientError,
  adminGet,
  adminPost,
} from "@/lib/v2-admin/api-client";

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

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";

const labelClass = "block text-sm font-medium text-[#334155]";

const primaryBtn =
  "rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0951c] disabled:cursor-not-allowed disabled:opacity-50";

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
        <h1 className="text-xl font-semibold text-[#0f172a]">Pengguna</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Kelola akun yang dapat mengakses panel. Hanya admin yang bisa membuat
          pengguna baru.
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

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#334155]">Tambah pengguna</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="user-name">
              Nama
            </label>
            <input
              id="user-name"
              className={`mt-1.5 ${inputClass}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. Budi Santoso"
              disabled={creating}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-email">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              autoComplete="off"
              className={`mt-1.5 ${inputClass}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              disabled={creating}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-password">
              Password <span className="text-[#94a3b8]">(min. 8 karakter)</span>
            </label>
            <input
              id="user-password"
              type="password"
              autoComplete="new-password"
              className={`mt-1.5 ${inputClass}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={creating}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              className={`mt-1.5 ${inputClass}`}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={creating}
            >
              <option value="admin">admin</option>
              <option value="ai-agent">ai-agent</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            className={primaryBtn}
            onClick={() => void handleCreate()}
            disabled={creating}
          >
            {creating ? "Menyimpan…" : "Tambah pengguna"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#64748b]">
            Belum ada pengguna.
          </p>
        ) : (
          <ul className="divide-y divide-[#eef2f7]">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#0f172a]">{row.name}</p>
                  <p className="mt-0.5 text-xs text-[#94a3b8]">{row.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-[#fff5ea] px-2.5 py-0.5 text-xs font-medium capitalize text-[#A85D16]">
                    {row.role}
                  </span>
                  <span className="text-xs text-[#94a3b8]">
                    {formatDate(row.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
