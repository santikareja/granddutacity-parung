import { RichText, type JSXConverter } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

import type { Media } from "@/payload-types";
import { SmartImage } from "@/components/ui/smart-image";

type UploadNode = {
  type: "upload";
  value?: Media | number | null;
  fields?: {
    alignment?: "left" | "center" | "right";
    captionOverride?: string;
    alt?: string;
  };
};

const resolveMediaUrl = (media: Media) => {
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
      <RichText
        converters={({ defaultConverters }) => ({
          ...defaultConverters,
          upload: UploadNodeConverter,
          readAlso: ReadAlsoConverter,
        })}
        data={enrichedData}
      />
    </div>
  );
}
