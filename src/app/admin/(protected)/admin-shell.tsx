"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
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
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon,
} from "lucide-react";

// Preferensi lipat sidebar disimpan agar penulis tidak perlu mengaturnya ulang
// setiap kali membuka panel.
const COLLAPSE_KEY = "gdc-admin-sidebar-collapsed";

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
      { href: "/admin/unit-content", label: "Konten Tipe Rumah", icon: Home },
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
  const [collapsed, setCollapsed] = useState(false);

  // Dibaca setelah mount, bukan saat render, agar HTML server dan klien identik.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hanya ada di browser; membacanya saat render akan memecah hidrasi
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Mode privat/kuota penuh: cukup jangan simpan, jangan gagalkan UI.
      }
      return next;
    });
  }, []);

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

  // Mode lipat hanya berlaku pada layar md ke atas. Di mobile sidebar tampil
  // sebagai drawer penuh, jadi melipatnya tidak ada gunanya.
  const renderSidebar = (iconOnly: boolean) => (
    <>
      <div
        className={`flex items-center border-b border-admin-border py-5 ${
          iconOnly ? "justify-center px-3" : "gap-3 px-5"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-admin-accent text-sm font-bold text-admin-accent-fg">
          GD
        </div>
        {iconOnly ? null : (
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-admin-accent">
              CMS Studio
            </p>
            <h1 className="truncate text-sm font-semibold leading-tight text-admin-fg">
              Grand Duta City Parung
            </h1>
          </div>
        )}
      </div>

      <nav
        className={`admin-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto ${
          iconOnly ? "px-2 py-4" : "p-4"
        }`}
      >
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (item) => !item.adminOnly || user.role === "admin",
          );
          if (items.length === 0) return null;

          return (
            <div key={group.label}>
              {iconOnly ? (
                // Garis pemisah menggantikan label grup agar pengelompokan
                // tetap terbaca tanpa teks.
                <div className="mx-2 mb-2 h-px bg-admin-border" />
              ) : (
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-admin-fg-dim">
                  {group.label}
                </p>
              )}
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
                      // title dipakai sebagai tooltip saat teksnya disembunyikan.
                      title={iconOnly ? item.label : undefined}
                      className={`flex items-center rounded-lg text-sm transition ${
                        iconOnly
                          ? "justify-center px-2 py-2.5"
                          : "gap-2.5 px-3 py-2"
                      } ${
                        active
                          ? "bg-admin-accent-soft font-semibold text-admin-accent-soft-fg"
                          : "text-admin-fg-muted hover:bg-admin-surface-hover hover:text-admin-fg"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      {iconOnly ? (
                        <span className="sr-only">{item.label}</span>
                      ) : (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={`border-t border-admin-border ${iconOnly ? "p-2" : "p-4"}`}>
        <a
          href="https://granddutacitysouthofjakarta.com"
          target="_blank"
          rel="noopener noreferrer"
          title={iconOnly ? "Lihat Website" : undefined}
          className={`flex items-center rounded-lg text-sm text-admin-fg-muted transition hover:bg-admin-surface-hover hover:text-admin-fg ${
            iconOnly ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2"
          }`}
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
          {iconOnly ? (
            <span className="sr-only">Lihat Website</span>
          ) : (
            <span>Lihat Website</span>
          )}
        </a>
      </div>
    </>
  );

  return (
    // h-dvh + overflow-hidden DISENGAJA.
    //
    // Sebelumnya di sini `min-h-screen`, sementara area konten memakai
    // `overflow-auto`. Kombinasi itu merusak `position: sticky` di dalam konten:
    // `overflow-auto` menjadikan div konten sebagai sticky root, tetapi karena
    // tingginya tidak pernah dibatasi (induk hanya min-height) div itu tidak
    // pernah menggulir — yang menggulir adalah dokumen. Akibatnya toolbar editor
    // ber-`sticky top-0` ikut hanyut ke atas dan tampak "tidak sticky".
    //
    // Dengan tinggi viewport yang tegas, div konten benar-benar menjadi
    // kontainer scroll, sehingga sticky di dalamnya bekerja. Sidebar dan topbar
    // juga tetap di tempat pada halaman yang panjang. `dvh` dipakai agar aman
    // terhadap bilah alamat browser mobile.
    <div className="flex h-dvh overflow-hidden bg-admin-bg text-admin-fg">
      {/* Overlay mobile: menutup nav saat area gelap disentuh. */}
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      ) : null}

      {/* Drawer mobile: selalu lebar penuh, tidak terpengaruh mode lipat. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-admin-border bg-admin-surface transition-transform duration-200 md:hidden ${
          mobileNavOpen ? "translate-x-0" : ""
        }`}
      >
        {renderSidebar(false)}
      </aside>

      {/* Sidebar desktop: bisa dilipat menjadi ikon saja. */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-admin-border bg-admin-surface transition-[width] duration-200 md:flex ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {renderSidebar(collapsed)}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-glass z-20 flex h-16 shrink-0 items-center justify-between px-4 md:px-6">
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

          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-admin-border text-admin-fg-muted transition hover:bg-admin-surface-hover hover:text-admin-fg md:flex"
            aria-label={collapsed ? "Perluas sidebar" : "Lipat sidebar"}
            title={collapsed ? "Perluas sidebar" : "Lipat sidebar"}
            aria-pressed={collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" />
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

        {/* min-h-0 wajib: tanpa itu, flex item menolak menyusut di bawah tinggi
            kontennya dan overflow-y-auto tidak akan pernah menggulir.
            Padding sengaja dipindah ke wrapper DALAM, bukan di kontainer scroll:
            offset `sticky top-0` dihitung dari padding box scrollport, jadi
            padding di sini akan menyisakan celah tempat konten menyembul di atas
            toolbar editor yang sedang menempel. */}
        <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
