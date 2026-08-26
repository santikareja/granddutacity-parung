"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/v2-admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/v2/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Login gagal.");
        }

        // Cegah open redirect: hanya izinkan path internal /v2-admin.
        const safeNext = nextPath.startsWith("/v2-admin") ? nextPath : "/v2-admin";
        router.replace(safeNext);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login gagal.");
        setLoading(false);
      }
    },
    [email, password, nextPath, router],
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="v2-email"
          className="block text-sm font-medium text-neutral-300"
        >
          Email
        </label>
        <input
          id="v2-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#F5A524]/60 focus:ring-2 focus:ring-[#F5A524]/20"
          placeholder="admin@granddutacity.com"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="v2-password"
          className="block text-sm font-medium text-neutral-300"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="v2-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pr-20 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#F5A524]/60 focus:ring-2 focus:ring-[#F5A524]/20"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-neutral-400 transition hover:text-[#F5A524]"
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#F5A524] px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Masuk ke Dashboard"}
      </button>
    </form>
  );
}
