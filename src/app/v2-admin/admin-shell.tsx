"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/v2-admin", label: "Dashboard" },
  { href: "/v2-admin/articles", label: "Artikel" },
  { href: "/v2-admin/media", label: "Media" },
  { href: "/v2-admin/ai-studio", label: "AI Studio" },
  { href: "/v2-admin/settings/ai", label: "Konfigurasi AI" },
];

type AdminShellProps = {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
};

export default function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await fetch("/api/v2/auth/logout", { method: "POST" });
      router.replace("/v2-admin/login");
    } catch {
      setSigningOut(false);
    }
  }, [router]);

  const isActive = (href: string) =>
    href === "/v2-admin" ? pathname === href : pathname.startsWith(href);

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f7f9fc] text-[#0f172a]">
      <aside
        className={`${
          mobileNavOpen ? "flex" : "hidden"
        } fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-[#e2e8f0] bg-white md:flex md:static`}
      >
        <div className="border-b border-[#eef2f7] px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5A524]">
            CMS Studio
          </p>
          <h1 className="mt-1 text-base font-semibold leading-tight">
            Grand Duta City Parung
          </h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={`block rounded-lg px-3.5 py-2 text-sm transition ${
                isActive(item.href)
                  ? "bg-[#fff5ea] font-semibold text-[#A85D16]"
                  : "text-[#475467] hover:bg-[#f1f5f9]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#eef2f7] p-4">
          <a
            href="https://granddutacitysouthofjakarta.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg px-3.5 py-2 text-sm text-[#475467] transition hover:bg-[#f1f5f9]"
          >
            Lihat Website &rarr;
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm md:hidden"
            aria-label="Buka navigasi"
          >
            Menu
          </button>

          <div className="min-w-0 flex-1" />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs capitalize text-[#64748b]">{user.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff5ea] text-sm font-bold text-[#A85D16]">
              {initial}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm text-[#475467] transition hover:bg-[#f1f5f9] disabled:opacity-50"
            >
              {signingOut ? "Keluar…" : "Keluar"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
