"use client";

import { useCallback, useState } from "react";
import { KeyRound } from "lucide-react";

import { AdminClientError, adminPatch } from "@/lib/v2-admin/api-client";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminInput,
  AdminLabel,
} from "@/components/admin/ui";

type Props = {
  name: string;
  email: string;
  role: string;
};

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
        <h1 className="text-xl font-semibold text-admin-fg">Akun</h1>
        <p className="mt-1 text-sm text-admin-fg-muted">
          Informasi akun dan ganti password.
        </p>
      </header>

      <AdminCard>
        <AdminCardBody>
          <h2 className="text-sm font-semibold text-admin-fg">Informasi akun</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-admin-fg-dim">Nama</dt>
              <dd className="mt-0.5 text-sm text-admin-fg">{name}</dd>
            </div>
            <div>
              <dt className="text-xs text-admin-fg-dim">Email</dt>
              <dd className="mt-0.5 text-sm text-admin-fg">{email}</dd>
            </div>
            <div>
              <dt className="text-xs text-admin-fg-dim">Role</dt>
              <dd className="mt-0.5 text-sm capitalize text-admin-fg">{role}</dd>
            </div>
          </dl>
        </AdminCardBody>
      </AdminCard>

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {success ? <AdminAlert variant="success">{success}</AdminAlert> : null}

      <AdminCard>
        <AdminCardBody>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-admin-fg">
            <KeyRound className="h-4 w-4 text-admin-fg-muted" />
            Ganti password
          </h2>
          <div className="space-y-4">
            <div>
              <AdminLabel htmlFor="current-password">
                Password saat ini
              </AdminLabel>
              <AdminInput
                id="current-password"
                type="password"
                autoComplete="current-password"
                className="mt-1.5"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <AdminLabel htmlFor="new-password">
                Password baru{" "}
                <span className="text-admin-fg-dim">(min. 8 karakter)</span>
              </AdminLabel>
              <AdminInput
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="mt-1.5"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <AdminLabel htmlFor="confirm-password">
                Konfirmasi password baru
              </AdminLabel>
              <AdminInput
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="mt-1.5"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <AdminButton
                type="button"
                variant="primary"
                onClick={() => void handleSubmit()}
                disabled={saving}
              >
                {saving ? "Menyimpan…" : "Ganti password"}
              </AdminButton>
            </div>
          </div>
        </AdminCardBody>
      </AdminCard>
    </div>
  );
}
