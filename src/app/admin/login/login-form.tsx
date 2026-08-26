"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

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

        // Cegah open redirect: hanya izinkan path internal /admin.
        const safeNext = nextPath.startsWith("/admin") ? nextPath : "/admin";
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
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-admin-accent/60 focus:ring-2 focus:ring-admin-accent/20"
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
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pr-11 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-admin-accent/60 focus:ring-2 focus:ring-admin-accent/20"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-neutral-400 transition hover:text-admin-accent"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
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
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-admin-accent px-4 py-2.5 text-sm font-semibold text-admin-accent-fg transition hover:bg-admin-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Memproses..." : "Masuk ke Dashboard"}
      </button>
    </form>
  );
}
