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
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-[10px] md:text-xs tracking-widest uppercase text-white/50", className)}>
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
            className="hover:text-brand-accent transition-colors flex items-center"
          >
            <Home className="w-3 h-3 md:w-3.5 md:h-3.5" aria-hidden="true" />
            <span className="sr-only">Beranda Grand Duta City Parung</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 text-white/30" />
              {isLast || !item.href ? (
                <span className="text-white/90 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-brand-accent transition-colors">
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
