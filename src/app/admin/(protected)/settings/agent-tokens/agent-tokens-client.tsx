"use client";

import { useCallback, useState } from "react";

import { adminDelete, adminGet, adminPost } from "@/lib/v2-admin/api-client";

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

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";

const labelClass = "block text-sm font-medium text-[#334155]";

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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Agent Tokens</h1>
        <p className="mt-1 text-sm text-[#475467]">
          Token untuk agent eksternal memposting artikel via API tanpa sesi
          browser. Database hanya menyimpan hash SHA-256 — token asli hanya
          tampil sekali saat dibuat.
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

      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      {newToken ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            Token baru — salin sekarang!
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Ini satu-satunya kesempatan melihat token ini. Setelah halaman
            ditutup, token tidak bisa ditampilkan lagi (hanya hash yang
            disimpan).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-[#0f172a]">
              {newToken}
            </code>
            <button
              type="button"
              onClick={() => void copyToken()}
              className="rounded-lg bg-[#0f172a] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#1e293b]"
            >
              {copied ? "Tersalin ✓" : "Salin"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewToken(null);
              setCopied(false);
            }}
            className="mt-3 text-xs font-medium text-amber-900 underline"
          >
            Saya sudah menyimpannya, sembunyikan
          </button>
        </div>
      ) : null}

      <form
        onSubmit={create}
        className="space-y-5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm"
      >
        <h2 className="text-base font-semibold">Buat Token Baru</h2>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="token-name">
            Nama
          </label>
          <input
            id="token-name"
            className={inputClass}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agen konten n8n"
          />
        </div>

        <div className="space-y-1.5">
          <span className={labelClass}>Scopes</span>
          <div className="space-y-1.5">
            {AVAILABLE_SCOPES.map((scope) => (
              <label
                key={scope.value}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={scopes.includes(scope.value)}
                  onChange={() => toggleScope(scope.value)}
                  className="h-4 w-4 accent-[#F5A524]"
                />
                <span className="font-mono text-xs">{scope.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="token-expires">
            Kedaluwarsa (opsional)
          </label>
          <input
            id="token-expires"
            type="datetime-local"
            className={inputClass}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <p className="text-xs text-[#64748b]">
            Kosongkan agar token tidak pernah kedaluwarsa.
          </p>
        </div>

        <div className="border-t border-[#eef2f7] pt-4">
          <button
            type="submit"
            disabled={creating || scopes.length === 0}
            className="rounded-lg bg-[#F5A524] px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
          >
            {creating ? "Membuat…" : "Buat Token"}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
        <div className="border-b border-[#eef2f7] px-5 py-3">
          <h2 className="text-sm font-semibold">Token Terdaftar</h2>
        </div>
        {tokens.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#64748b]">
            Belum ada token. Buat token pertama di atas.
          </p>
        ) : (
          <ul className="divide-y divide-[#eef2f7]">
            {tokens.map((token) => {
              const status = statusOf(token);
              const revocable = token.isActive && !token.revokedAt;
              return (
                <li
                  key={token.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {token.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-[#64748b]">
                      {token.tokenPrefix}…
                    </p>
                    <p className="mt-0.5 text-xs text-[#64748b]">
                      Scopes: {token.scopes.join(", ") || "—"} · Terakhir dipakai:{" "}
                      {formatDate(token.lastUsedAt)}
                      {token.expiresAt
                        ? ` · Kedaluwarsa: ${formatDate(token.expiresAt)}`
                        : ""}
                    </p>
                  </div>

                  {revocable ? (
                    <button
                      type="button"
                      onClick={() => void revoke(token)}
                      className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      Cabut
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
