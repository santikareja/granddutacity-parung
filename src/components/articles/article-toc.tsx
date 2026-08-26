"use client";

import { useEffect, useMemo, useState } from "react";

type TocItem = {
  id: string;
  numberLabel: string;
  text: string;
  level: "h2" | "h3";
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export function ArticleTableOfContents({ targetId = "article-content" }: { targetId?: string }) {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    const container = document.getElementById(targetId);
    if (!container) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi dengan DOM container yang di-query di luar React (bukan derivable saat render)
      setItems([]);
      return;
    }

    const headingNodes = Array.from(container.querySelectorAll<HTMLElement>("h2, h3"));
    const slugCounter = new Map<string, number>();
    let h2Counter = 0;
    let h3Counter = 0;

    const nextItems = headingNodes
      .map((heading) => {
        const text = heading.textContent?.trim() || "";
        const level = heading.tagName.toLowerCase() as "h2" | "h3";

        if (!text || (level !== "h2" && level !== "h3")) {
          return null;
        }

        const baseSlug = slugify(text) || "bagian-artikel";
        const count = slugCounter.get(baseSlug) || 0;
        slugCounter.set(baseSlug, count + 1);
        const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

        heading.id = heading.id || id;

        if (level === "h2") {
          h2Counter += 1;
          h3Counter = 0;
        } else {
          if (h2Counter === 0) {
            h2Counter = 1;
          }
          h3Counter += 1;
        }

        const numberLabel = level === "h2" ? `${h2Counter}` : `${h2Counter}.${h3Counter}`;

        return {
          id: heading.id,
          numberLabel,
          text,
          level,
        };
      })
      .filter((item): item is TocItem => Boolean(item));

    setItems(nextItems);
  }, [targetId]);

  const shouldRender = useMemo(() => items.length >= 2, [items.length]);

  if (!shouldRender) {
    return null;
  }

  return (
    <nav
      aria-label="Daftar Isi"
      className="mb-8 rounded-2xl border border-[#0B120C]/12 bg-white/80 p-5 shadow-[0_10px_28px_rgba(11,18,12,0.06)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0B120C]/62">Daftar Isi</p>
      <ul className="mt-4 space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className={item.level === "h3" ? "pl-4" : undefined}>
            <a
              href={`#${item.id}`}
              className="inline-block rounded-sm px-1 py-0.5 text-sm leading-6 text-[#0B120C]/84 transition-colors hover:text-[#A85D16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A524]/55"
            >
              <span className="mr-2 font-semibold text-[#0B120C]">{item.numberLabel}</span>
              <span>{item.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
