"use client";

import { useCallback, useState } from "react";
import { Ban, Check, Copy, KeyRound } from "lucide-react";

import { adminDelete, adminGet, adminPost } from "@/lib/v2-admin/api-client";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminCheckbox,
  AdminEmptyState,
  AdminInput,
  AdminLabel,
  AdminPageHeader,
} from "@/components/admin/ui";

export type AgentTokenForClient = {
  id: number;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

// Scope yang tersedia untuk dipilih. Sinkron dengan KNOWN_SCOPES di API.
const AVAILABLE_SCOPES: { value: string; label: string }[] = [
  { value: "articles:write", label: "articles:write — buat artikel" },
];

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

type TokenStatus = { label: string; className: string };

const statusOf = (token: AgentTokenForClient): TokenStatus => {
  if (token.revokedAt || !token.isActive) {
    return { label: "Dicabut", className: "bg-red-50 text-red-700" };
  }
  if (token.expiresAt && new Date(token.expiresAt).getTime() <= Date.now()) {
    return { label: "Kedaluwarsa", className: "bg-[#f1f5f9] text-[#64748b]" };
  }
  return { label: "Aktif", className: "bg-emerald-50 text-emerald-700" };
};

export default function AgentTokensClient({
  initialTokens,
}: {
  initialTokens: AgentTokenForClient[];
}) {
  const [tokens, setTokens] = useState(initialTokens);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["articles:write"]);
  const [expiresAt, setExpiresAt] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Plaintext token hasil pembuatan terakhir — ditampilkan SEKALI saja.
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const data = await adminGet<{ tokens: AgentTokenForClient[] }>(
      "/api/v2/agent-tokens",
    );
    setTokens(data.tokens ?? []);
  }, []);

  const toggleScope = (value: string) => {
    setScopes((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value],
    );
  };

  const create = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCreating(true);
      setError(null);
      setNotice(null);
      setNewToken(null);
      setCopied(false);

      try {
        const data = await adminPost<{ token: string }>(
          "/api/v2/agent-tokens",
          {
            body: {
              name,
              scopes,
              expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
            },
          },
        );

        setNewToken(data.token);
        setName("");
        setExpiresAt("");
        setScopes(["articles:write"]);
        await refresh();
        setNotice("Token dibuat. Salin sekarang — token tidak akan tampil lagi.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat token.");
      } finally {
        setCreating(false);
      }
    },
    [name, scopes, expiresAt, refresh],
  );

  const copyToken = useCallback(async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
    } catch {
      setError("Gagal menyalin. Salin manual dari kotak di atas.");
    }
  }, [newToken]);

  const revoke = useCallback(
    async (token: AgentTokenForClient) => {
      if (
        !window.confirm(
          `Cabut token "${token.name}" (${token.tokenPrefix}…)? Agent yang memakainya akan langsung ditolak.`,
        )
      ) {
        return;
      }

      setError(null);
      setNotice(null);
      try {
        await adminDelete(`/api/v2/agent-tokens/${token.id}`);
        await refresh();
        setNotice("Token dicabut.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mencabut token.");
      }
    },
    [refresh],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminPageHeader
        title="Agent Tokens"
        description="Token untuk agent eksternal memposting artikel via API tanpa sesi browser. Database hanya menyimpan hash SHA-256 — token asli hanya tampil sekali saat dibuat."
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {notice ? <AdminAlert variant="success">{notice}</AdminAlert> : null}

      {newToken ? (
        <div className="rounded-2xl border border-admin-warning/25 bg-admin-warning-soft p-5">
          <p className="text-sm font-semibold text-admin-warning">
            Token baru — salin sekarang!
          </p>
          <p className="mt-1 text-xs text-admin-warning">
            Ini satu-satunya kesempatan melihat token ini. Setelah halaman
            ditutup, token tidak bisa ditampilkan lagi (hanya hash yang
            disimpan).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-admin-warning/25 bg-admin-surface px-3 py-2 font-mono text-xs text-admin-fg">
              {newToken}
            </code>
            <AdminButton type="button" variant="dark" onClick={() => void copyToken()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Tersalin" : "Salin"}
            </AdminButton>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewToken(null);
              setCopied(false);
            }}
            className="mt-3 text-xs font-medium text-admin-warning underline"
          >
            Saya sudah menyimpannya, sembunyikan
          </button>
        </div>
      ) : null}

      <AdminCard>
        <form onSubmit={create}>
          <AdminCardBody>
            <h2 className="text-base font-semibold text-admin-fg">Buat Token Baru</h2>

            <div className="space-y-1.5">
              <AdminLabel htmlFor="token-name">Nama</AdminLabel>
              <AdminInput
                id="token-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agen konten n8n"
              />
            </div>

            <div className="space-y-1.5">
              <AdminLabel>Scopes</AdminLabel>
              <div className="space-y-1.5">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label
                    key={scope.value}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-admin-fg"
                  >
                    <AdminCheckbox
                      checked={scopes.includes(scope.value)}
                      onChange={() => toggleScope(scope.value)}
                    />
                    <span className="font-mono text-xs">{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <AdminLabel htmlFor="token-expires">Kedaluwarsa (opsional)</AdminLabel>
              <AdminInput
                id="token-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-admin-fg-muted">
                Kosongkan agar token tidak pernah kedaluwarsa.
              </p>
            </div>

            <div className="border-t border-admin-border pt-4">
              <AdminButton
                type="submit"
                variant="primary"
                disabled={creating || scopes.length === 0}
              >
                <KeyRound className="h-4 w-4" />
                {creating ? "Membuat…" : "Buat Token"}
              </AdminButton>
            </div>
          </AdminCardBody>
        </form>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-admin-border px-5 py-3">
          <h2 className="text-sm font-semibold text-admin-fg">Token Terdaftar</h2>
        </div>
        {tokens.length === 0 ? (
          <AdminEmptyState
            title="Belum ada token"
            description="Buat token pertama di atas."
          />
        ) : (
          <ul className="divide-y divide-admin-border">
            {tokens.map((token) => {
              const status = statusOf(token);
              const statusTone =
                status.label === "Aktif"
                  ? "success"
                  : status.label === "Dicabut"
                    ? "danger"
                    : "neutral";
              const revocable = token.isActive && !token.revokedAt;
              return (
                <li
                  key={token.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-admin-fg">
                        {token.name}
                      </p>
                      <AdminBadge tone={statusTone}>{status.label}</AdminBadge>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-admin-fg-muted">
                      {token.tokenPrefix}…
                    </p>
                    <p className="mt-0.5 text-xs text-admin-fg-muted">
                      Scopes: {token.scopes.join(", ") || "—"} · Terakhir dipakai:{" "}
                      {formatDate(token.lastUsedAt)}
                      {token.expiresAt
                        ? ` · Kedaluwarsa: ${formatDate(token.expiresAt)}`
                        : ""}
                    </p>
                  </div>

                  {revocable ? (
                    <AdminButton
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => void revoke(token)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Cabut
                    </AdminButton>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
