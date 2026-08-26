"use client";

import { useCallback, useState } from "react";

import { AdminClientError, adminPatch } from "@/lib/v2-admin/api-client";

type Props = {
  name: string;
  email: string;
  role: string;
};

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";

const labelClass = "block text-sm font-medium text-[#334155]";

const primaryBtn =
  "rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0951c] disabled:cursor-not-allowed disabled:opacity-50";

const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof AdminClientError ? err.message : fallback;

export default function AccountClient({ name, email, role }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Password saat ini wajib diisi.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setSaving(true);
    try {
      await adminPatch("/api/v2/account/password", {
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password berhasil diganti.");
    } catch (err) {
      setError(errorMessage(err, "Gagal mengganti password."));
    } finally {
      setSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#0f172a]">Akun</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Informasi akun dan ganti password.
        </p>
      </header>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#334155]">Informasi akun</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#94a3b8]">Nama</dt>
            <dd className="mt-0.5 text-sm text-[#0f172a]">{name}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#94a3b8]">Email</dt>
            <dd className="mt-0.5 text-sm text-[#0f172a]">{email}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#94a3b8]">Role</dt>
            <dd className="mt-0.5 text-sm capitalize text-[#0f172a]">{role}</dd>
          </div>
        </dl>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </p>
      ) : null}

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#334155]">Ganti password</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass} htmlFor="current-password">
              Password saat ini
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              className={`mt-1.5 ${inputClass}`}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="new-password">
              Password baru <span className="text-[#94a3b8]">(min. 8 karakter)</span>
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className={`mt-1.5 ${inputClass}`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirm-password">
              Konfirmasi password baru
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className={`mt-1.5 ${inputClass}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <button
              type="button"
              className={primaryBtn}
              onClick={() => void handleSubmit()}
              disabled={saving}
            >
              {saving ? "Menyimpan…" : "Ganti password"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
