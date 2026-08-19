"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ClusterHeroProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  fullScreenDesktop?: boolean;
}

export function ClusterHero({
  title,
  subtitle,
  backgroundImage,
  fullScreenDesktop = false,
}: ClusterHeroProps) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-[#0b120c] h-[70vh] min-h-[600px]",
        fullScreenDesktop && "lg:h-[100dvh]"
      )}
    >
      {/* Background Image */}
      <Image 
        src={backgroundImage}
        alt={`Grand Duta City - ${title}`}
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
      
      {/* Gradients to blend into Dark Mode */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b120c]/30 to-[#0b120c]" />
      
      <div className="relative z-10 text-center px-6 max-w-4xl pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-[#F5A524] text-[10px] md:text-sm tracking-[0.4em] uppercase font-sans font-semibold mb-6 drop-shadow-md">
            {subtitle}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#F5F1E8] mb-6 drop-shadow-xl">
            {title}
          </h1>
          <div className="w-16 h-1 bg-[#F5A524] mx-auto rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
