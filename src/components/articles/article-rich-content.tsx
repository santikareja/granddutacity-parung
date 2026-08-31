import Link from "next/link";
import { createElement } from "react";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

import type { PublicMedia } from "@/types/content";
import { SmartImage } from "@/components/ui/smart-image";

import { LexicalRenderer, type JSXConverter } from "./lexical-renderer";

type UploadNode = {
  type: "upload";
  value?: PublicMedia | number | null;
  fields?: {
    alignment?: "left" | "center" | "right";
    captionOverride?: string;
    alt?: string;
  };
};

const resolveMediaUrl = (media: PublicMedia) => {
  return media.transformedUrl || media.cloudinaryUrl || media.url || media.thumbnailURL || media.originalUrl || null;
};

type ArticleRichContentProps = {
  data: SerializedEditorState<SerializedLexicalNode>;
  readAlsoItems?: {
    title: string;
    href: string;
    thumbnail: string;
    thumbnailAlt: string;
  }[];
};

type RichTextNode = {
  type?: string;
  children?: RichTextNode[];
  text?: string;
  [key: string]: unknown;
};

type ReadAlsoNode = {
  type: "readAlso";
  readAlsoIndex?: number;
};

const getFigureAlignmentClass = (alignment?: "left" | "center" | "right") => {
  if (alignment === "left") return "mr-auto max-w-2xl";
  if (alignment === "right") return "ml-auto max-w-2xl";
  return "mx-auto max-w-3xl";
};

const UploadNodeConverter: JSXConverter = ({ node }) => {
  const uploadNode = node as UploadNode;

  if (!uploadNode?.value || typeof uploadNode.value !== "object") {
    return null;
  }

  const media = uploadNode.value;
  const url = resolveMediaUrl(media);

  if (!url) {
    return null;
  }

  const alignmentClass = getFigureAlignmentClass(uploadNode.fields?.alignment);
  const alt = uploadNode.fields?.alt || media.alt || media.name || "Article image";
  const caption = uploadNode.fields?.captionOverride || media.caption;

  return (
    <figure className={`my-8 w-full ${alignmentClass}`}>
      <SmartImage
        alt={alt}
        className="h-auto w-full rounded-lg border border-[#0b120c]/10"
        height={media.height || undefined}
        src={url}
        width={media.width || undefined}
      />
      {caption ? (
        <figcaption className="mt-2 text-sm leading-relaxed text-[#475467]">{caption}</figcaption>
      ) : null}
    </figure>
  );
};

const hasRenderableParagraphText = (node: RichTextNode) => {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return false;
  }

  return node.children.some((child) => {
    if (typeof child.text === "string" && child.text.trim().length > 0) {
      return true;
    }

    return Array.isArray(child.children)
      ? child.children.some(
          (grandChild) => typeof grandChild.text === "string" && grandChild.text.trim().length > 0,
        )
      : false;
  });
};

function injectReadAlsoNodes(
  data: ArticleRichContentProps["data"],
  readAlsoItems: NonNullable<ArticleRichContentProps["readAlsoItems"]>,
) {
  if (!Array.isArray(data?.root?.children) || readAlsoItems.length === 0) {
    return data;
  }

  let paragraphCounter = 0;
  let readAlsoCounter = 0;
  const nextChildren: RichTextNode[] = [];

  for (const child of data.root.children as RichTextNode[]) {
    nextChildren.push(child);

    if (child.type === "paragraph" && hasRenderableParagraphText(child)) {
      paragraphCounter += 1;

      if (paragraphCounter % 3 === 0) {
        nextChildren.push({
          type: "readAlso",
          readAlsoIndex: readAlsoCounter,
          version: 1,
        });
        readAlsoCounter += 1;
      }
    }
  }

  return {
    ...data,
    root: {
      ...data.root,
      children: nextChildren as SerializedLexicalNode[],
    },
  };
}

/**
 * Turunkan `<h1>` di ISI artikel menjadi `<h2>`.
 *
 * MASALAH NYATA yang ditemukan di produksi: `/rumah-di-kawasan-strategis` dan
 * `/listing-properti-panduan-lengkap` mengirim DUA `<h1>` ke Google — satu dari
 * template halaman (judul artikel, yang benar) dan satu lagi dari isi artikel
 * yang ditulis editor di CMS. Pada halaman kedua, keduanya bahkan berbunyi
 * persis sama.
 *
 * Dua `<h1>` membuat Google harus menebak mana topik utama halaman. Untuk situs
 * yang sedang berjuang memenangkan query brand, membuang kejelasan hierarki
 * seperti ini tidak ada gunanya.
 *
 * Kenapa diperbaiki DI SINI, bukan di `lexical-renderer.tsx`:
 * renderer itu adalah port 1:1 dari serializer Payload dan punya kontrak
 * byte-identik yang diuji golden fixture. Menurunkan heading adalah KEPUTUSAN
 * EDITORIAL milik halaman artikel, bukan perilaku serializer. Jadi port-nya
 * tetap setia, kebijakannya diterapkan di lapisan pemakai.
 *
 * Default `h2` (bukan `h1`) juga disengaja: converter asli memakai `"h1"`
 * sebagai fallback ketika `node.tag` tidak terbaca — fallback paling berbahaya
 * yang mungkin, karena node heading rusak akan diam-diam menjadi `<h1>` kedua.
 */
const BodyHeadingConverter: JSXConverter = ({ node, nodesToJSX }) => {
  const children = nodesToJSX({ nodes: (node as { children?: unknown[] }).children as never });
  const rawTag = (node as { tag?: unknown }).tag;
  const tag = typeof rawTag === "string" ? rawTag.toLowerCase() : "h2";
  const safeTag = tag === "h1" ? "h2" : tag;
  // eslint-disable-next-line react/no-children-prop -- tag dinamis, sama seperti converter asli
  return createElement(safeTag, { children });
};

export function ArticleRichContent({ data, readAlsoItems = [] }: ArticleRichContentProps) {
  const enrichedData = injectReadAlsoNodes(data, readAlsoItems);

  const ReadAlsoConverter: JSXConverter = ({ node }) => {
    const readAlsoNode = node as ReadAlsoNode;

    if (readAlsoItems.length === 0) return null;

    const index = readAlsoNode.readAlsoIndex || 0;
    const item = readAlsoItems[index % readAlsoItems.length];
    if (!item) return null;

    return (
      <div className="my-7 rounded-xl border border-[#F5A524]/35 bg-[#FFF3E6] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A61B1B]">Baca juga</p>
        <Link href={item.href} className="mt-2 flex items-center gap-3">
          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-md border border-[#0B120C]/10">
            <SmartImage alt={item.thumbnailAlt} className="h-full w-full object-cover" src={item.thumbnail} />
          </div>
          <p className="line-clamp-2 text-sm leading-5 font-bold text-[#C81E1E] transition-colors hover:text-[#F5A524]">{item.title}</p>
        </Link>
      </div>
    );
  };

  return (
    <div className="article-rich-content max-w-none">
      <LexicalRenderer
        converters={({ defaultConverters }) => ({
          ...defaultConverters,
          heading: BodyHeadingConverter,
          upload: UploadNodeConverter,
          readAlso: ReadAlsoConverter,
        })}
        data={enrichedData}
      />
    </div>
  );
}
