"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  FolderTree,
  Tags,
  Images,
  Sparkles,
  Settings,
  SlidersHorizontal,
  KeyRound,
  UserCircle,
  Users,
  Activity,
  ExternalLink,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

// Item dikelompokkan per fungsi (bukan daftar rata) supaya sidebar mudah
// dipindai — sesuai pola CMS modern di referensi (Konten / AI / Sistem).
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Ringkasan",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Konten",
    items: [
      { href: "/admin/articles", label: "Artikel", icon: Newspaper },
      { href: "/admin/categories", label: "Kategori", icon: FolderTree },
      { href: "/admin/tags", label: "Tag", icon: Tags },
      { href: "/admin/media", label: "Media", icon: Images },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/admin/ai-studio", label: "AI Studio", icon: Sparkles },
      { href: "/admin/settings/ai", label: "Konfigurasi AI", icon: SlidersHorizontal },
      {
        href: "/admin/settings/ai/models",
        label: "Model per Tugas",
        icon: SlidersHorizontal,
        adminOnly: true,
      },
      {
        href: "/admin/settings/agent-tokens",
        label: "Agent Tokens",
        icon: KeyRound,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/settings", label: "Pengaturan", icon: Settings },
      { href: "/admin/account", label: "Akun", icon: UserCircle },
      { href: "/admin/users", label: "Pengguna", icon: Users, adminOnly: true },
      { href: "/admin/monitoring", label: "Monitoring", icon: Activity, adminOnly: true },
    ],
  },
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
      router.replace("/admin/login");
    } catch {
      setSigningOut(false);
    }
  }, [router]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === href;
    // "Pengaturan" (umum) tidak boleh ikut aktif saat berada di subtree
    // "/settings/ai" yang punya item nav sendiri ("Konfigurasi AI").
    if (href === "/admin/settings") {
      return (
        pathname === href ||
        (pathname.startsWith(`${href}/`) &&
          !pathname.startsWith("/admin/settings/ai") &&
          !pathname.startsWith("/admin/settings/agent-tokens"))
      );
    }
    // "Konfigurasi AI" tidak boleh ikut aktif saat berada di subtree
    // "/settings/ai/models" yang punya item nav sendiri.
    if (href === "/admin/settings/ai") {
      return (
        pathname === href ||
        (pathname.startsWith(`${href}/`) &&
          !pathname.startsWith("/admin/settings/ai/models"))
      );
    }
    return pathname.startsWith(href);
  };

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 border-b border-admin-border px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-admin-accent text-sm font-bold text-admin-accent-fg">
          GD
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-admin-accent">
            CMS Studio
          </p>
          <h1 className="truncate text-sm font-semibold leading-tight text-admin-fg">
            Grand Duta City Parung
          </h1>
        </div>
      </div>

      <nav className="admin-scrollbar flex-1 space-y-5 overflow-y-auto p-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (item) => !item.adminOnly || user.role === "admin",
          );
          if (items.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-admin-fg-dim">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-admin-accent-soft font-semibold text-admin-accent-soft-fg"
                          : "text-admin-fg-muted hover:bg-admin-surface-hover hover:text-admin-fg"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-admin-border p-4">
        <a
          href="https://granddutacitysouthofjakarta.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-admin-fg-muted transition hover:bg-admin-surface-hover hover:text-admin-fg"
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>Lihat Website</span>
        </a>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-admin-bg text-admin-fg">
      {/* Overlay mobile: menutup nav saat area gelap disentuh. */}
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-admin-border bg-admin-surface transition-transform duration-200 md:static md:w-64 md:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : ""
        }`}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-glass sticky top-0 z-20 flex h-16 items-center justify-between px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-border text-admin-fg-muted md:hidden"
            aria-label={mobileNavOpen ? "Tutup navigasi" : "Buka navigasi"}
          >
            {mobileNavOpen ? (
              <X className="h-4.5 w-4.5" />
            ) : (
              <Menu className="h-4.5 w-4.5" />
            )}
          </button>

          <div className="min-w-0 flex-1" />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-admin-fg">
                {user.name}
              </p>
              <p className="text-xs capitalize text-admin-fg-muted">{user.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-admin-accent-soft text-sm font-bold text-admin-accent-soft-fg">
              {initial}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-admin-border px-3 text-sm text-admin-fg-muted transition hover:bg-admin-surface-hover disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {signingOut ? "Keluar…" : "Keluar"}
              </span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
