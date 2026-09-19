import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  variant?: "dark" | "light";
}

export function Breadcrumb({ items, className, variant = "dark" }: BreadcrumbProps) {
  const isLight = variant === "light";
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-[10px] md:text-xs tracking-widest uppercase",
        isLight ? "text-[#090D0A]/70" : "text-white/50",
        className
      )}
    >
      <ol className="flex items-center space-x-2">
        <li>
          {/* Tautan ini muncul di 48 halaman dan sebelumnya hanya ikon rumah
              dengan teks layar-baca "Home". Dua masalah sekaligus: pembaca layar
              mendapat label berbahasa Inggris di halaman `lang="id"`, dan Google
              mendapat 48 tautan internal ke homepage yang tidak menyampaikan
              apa pun tentang halaman tujuannya.

              Teks layar-baca memang untuk mendeskripsikan tujuan tautan, jadi
              menyebut nama situsnya BUKAN pengoptimalan berlebihan — itu justru
              label yang benar. Efek sampingnya: setiap halaman kini memberi satu
              anchor bermuatan brand ke homepage, sinyal langsung soal halaman
              mana pemilik nama brand tersebut. */}
          <Link
            href="/"
            className={cn(
              "transition-colors flex items-center",
              isLight ? "hover:text-[#D97706] text-[#090D0A]/70" : "hover:text-brand-accent text-white/50"
            )}
          >
            <Home className="w-3 h-3 md:w-3.5 md:h-3.5" aria-hidden="true" />
            <span className="sr-only">Beranda Grand Duta City Parung</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight
                className={cn(
                  "w-3 h-3 md:w-3.5 md:h-3.5",
                  isLight ? "text-[#090D0A]/40" : "text-white/30"
                )}
              />
              {isLast || !item.href ? (
                <span
                  className={cn(
                    "font-medium",
                    isLight ? "text-[#090D0A]" : "text-white/90"
                  )}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "transition-colors",
                    isLight ? "hover:text-[#D97706] text-[#090D0A]/70" : "hover:text-brand-accent text-white/50"
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
