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
          <Link href="/" className="hover:text-brand-accent transition-colors flex items-center">
            <Home className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="sr-only">Home</span>
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
