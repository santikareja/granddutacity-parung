"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "Beranda", emoji: "🏠" },
  { href: "/artikel", label: "Artikel", emoji: "📖" },
  { href: "/category/seputar-gdc", label: "Seputar GDC", emoji: "🏘️" },
  { href: "/pricelist-grand-duta-city", label: "Pricelist", emoji: "💰" },
];

const HouseIcon = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Atap */}
    <path
      d="M10 38L40 10L70 38"
      stroke="#D4A853"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Badan rumah */}
    <rect
      x="18"
      y="38"
      width="44"
      height="30"
      rx="2"
      stroke="#D4A853"
      strokeWidth="3"
    />
    {/* Pintu */}
    <rect
      x="32"
      y="52"
      width="16"
      height="16"
      rx="2"
      stroke="#D4A853"
      strokeWidth="2.5"
    />
    {/* Jendela kiri */}
    <rect
      x="22"
      y="44"
      width="10"
      height="9"
      rx="1.5"
      stroke="#D4A853"
      strokeWidth="2"
    />
    {/* Jendela kanan */}
    <rect
      x="48"
      y="44"
      width="10"
      height="9"
      rx="1.5"
      stroke="#D4A853"
      strokeWidth="2"
    />
    {/* Cerobong */}
    <rect
      x="52"
      y="14"
      width="8"
      height="14"
      rx="1"
      stroke="#D4A853"
      strokeWidth="2"
    />
  </svg>
);

const MotionLink = motion(Link);

export default function NotFoundClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
      // Prevent hydration mismatch by returning a static version before hydration
      return (
          <main className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-8 bg-zinc-950 text-white" role="main"></main>
      );
  }

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-8 bg-black overflow-hidden pointer-events-auto selection:bg-amber-500/30 text-white"
      role="main"
    >
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-amber-400/3 rounded-full blur-2xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>

      {/* House Icon Container */}
      <div className="relative mb-8 z-10 flex flex-col items-center">
        <div className="animate-float-icon">
          <HouseIcon />
        </div>
        {/* Subtle glow under icon */}
        <div className="absolute -bottom-4 w-16 h-4 bg-[#D4A853] opacity-30 blur-xl rounded-full animate-pulse"></div>
      </div>

      {/* 404 Text */}
      <div className="flex z-10 space-x-3">
        {["4", "0", "4"].map((digit, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: -60, rotateX: 90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{
              duration: 0.6,
              ease: "backOut",
              delay: 0.1 + index * 0.15, // 0.1, 0.25, 0.4
            }}
            className="font-bold text-[clamp(80px,18vw,160px)] leading-none text-transparent bg-clip-text bg-gradient-to-br from-[#D4A853] to-[#F0D080] drop-shadow-[0_0_15px_rgba(212,168,83,0.3)]"
          >
            {digit}
          </motion.span>
        ))}
      </div>

      {/* Headings */}
      <div className="text-center mt-6 z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
          className="text-2xl md:text-3xl font-semibold text-white mb-3"
        >
          Halaman Tidak Tersedia
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.75 }}
          className="text-sm md:text-base text-zinc-400 max-w-xs mx-auto"
        >
          Halaman yang Anda cari sepertinya sudah pindah atau tidak tersedia.
        </motion.p>
      </div>

      {/* Navigation Grid */}
      <nav
        className="grid grid-cols-2 gap-4 mt-12 mb-10 z-10 w-full max-w-lg"
        aria-label="Navigasi darurat"
      >
        {navLinks.map((link, index) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: 0.8 + index * 0.1, // 0.8, 0.9, 1.0, 1.1
            }}
          >
            <MotionLink
              href={link.href}
              className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-zinc-300 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 w-full h-full"
              whileHover={{
                scale: 1.04,
                backgroundColor: "#D4A853",
                color: "#000000",
                borderColor: "#D4A853",
              }}
            >
              <span aria-hidden="true">{link.emoji}</span>
              <span>{link.label}</span>
            </MotionLink>
          </motion.div>
        ))}
      </nav>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 1.2 }}
        className="z-10 w-full max-w-xs md:max-w-max"
      >
        <MotionLink
          href="/"
          className="flex items-center justify-center bg-[#D4A853] text-black font-bold px-8 py-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 w-full"
          whileHover={{ scale: 1.05, backgroundColor: "#E8C270" }}
          whileTap={{ scale: 0.97 }}
        >
          &larr; Kembali ke Beranda
        </MotionLink>
      </motion.div>
    </main>
  );
}
