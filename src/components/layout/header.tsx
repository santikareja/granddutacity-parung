"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "BERANDA", href: "/" },
  { label: "TENTANG", href: "#tentang-kami" },
  { label: "KEUNGGULAN", href: "#keunggulan" },
  { label: "FASILITAS", href: "#fasilitas" },
  { label: "TIPE UNIT", href: "#tipe-unit" },
  { label: "LOKASI", href: "/lokasi-akses-grand-duta-city-parung" },
  { label: "KONTAK", href: "https://wa.me/628131742034" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-700",
        isScrolled
          ? "bg-[#0a0a0a]/85 backdrop-blur-xl py-4 border-b border-white/5"
          : "bg-transparent py-7"
      )}
    >
      <div className="max-w-screen-2xl mx-auto px-8 md:px-14 flex items-center justify-between">

        {/* Logo — Desktop: 160px, Mobile: 130px */}
        <Link href="/" className="group flex items-center">
          <Image
            src="/logo.svg"
            alt="Grand Duta City Parung"
            width={160}
            height={50}
            priority
            loading="eager"
            className="w-[130px] md:w-[160px] h-auto object-contain transition-opacity group-hover:opacity-80"
          />
        </Link>

        {/* Navigation — center, uppercase small tracking */}
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[10px] tracking-[0.2em] text-white/70 hover:text-white font-sans font-medium uppercase transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-brand-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Ghost CTA */}
        <a
          href="https://wa.me/628131742034"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-2 border border-white/30 hover:border-brand-accent text-white hover:text-brand-accent px-6 py-2.5 text-[10px] tracking-[0.25em] uppercase font-medium transition-all duration-300"
        >
          Reservasi
        </a>
      </div>
    </header>
  );
}
