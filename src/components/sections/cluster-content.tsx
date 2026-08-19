"use client";

import { motion } from "framer-motion";

interface ContentBlock {
  title?: string;
  paragraphs: React.ReactNode[];
}

interface ClusterContentProps {
  title: string;
  blocks: ContentBlock[];
}

export function ClusterContent({ title, blocks }: ClusterContentProps) {
  return (
    <section className="py-20 bg-[#0b120c] text-[#F5F1E8] relative z-10 border-t border-[#F5F1E8]/5">
      <div className="max-w-screen-xl mx-auto px-6 md:px-14">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#F5A524] mb-6">
            {title}
          </h2>
          <div className="w-12 h-px bg-[#F5A524]" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {blocks.map((block, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="flex flex-col gap-4"
            >
              {block.title && (
                <h3 className="font-serif text-xl md:text-2xl text-[#F5A524] font-medium mb-2">
                  {block.title}
                </h3>
              )}
              {block.paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-[#F5F1E8]/70 font-sans font-light leading-relaxed text-[15px] md:text-base">
                  {para}
                </p>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
