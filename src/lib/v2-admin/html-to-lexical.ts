// Konversi HTML terstruktur (dari AI) → Lexical state, TANPA dependensi Payload.
// Server-side only (memakai jsdom untuk parsing).
//
// Bentuk node yang dihasilkan harus identik dengan yang dipakai Payload agar
// artikel hasil AI bisa dibuka editor v2 dan dirender frontend tanpa perbedaan.

import { JSDOM } from "jsdom";

import type { LexNode, LexicalState } from "./lexical";

// Bitmask format teks Lexical.
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

const DANGEROUS_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "link",
  "meta",
  "base",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "template",
  "noscript",
]);

const BLOCKED_URL_SCHEMES = /^(javascript|data|vbscript|file):/i;

const textNode = (text: string, format: number): LexNode => ({
  type: "text",
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  version: 1,
});

const elementBase = {
  direction: "ltr" as const,
  format: "" as const,
  indent: 0,
  version: 1,
};

// Kumpulkan node inline (text/link) dari anak sebuah elemen blok.
const collectInline = (
  node: Node,
  format: number,
  out: LexNode[],
): void => {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) {
      // Text node: normalkan whitespace tapi jangan buang spasi antar-kata.
      const raw = (child.textContent ?? "").replace(/\s+/g, " ");
      if (raw.trim().length > 0 || raw === " ") {
        out.push(textNode(raw, format));
      }
      continue;
    }

    if (child.nodeType !== 1) continue;

    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    if (DANGEROUS_TAGS.has(tag)) continue;

    switch (tag) {
      case "strong":
      case "b":
        collectInline(el, format | FORMAT_BOLD, out);
        break;
      case "em":
      case "i":
        collectInline(el, format | FORMAT_ITALIC, out);
        break;
      case "u":
        collectInline(el, format | FORMAT_UNDERLINE, out);
        break;
      case "s":
      case "del":
      case "strike":
        collectInline(el, format | FORMAT_STRIKETHROUGH, out);
        break;
      case "code":
        collectInline(el, format | FORMAT_CODE, out);
        break;
      case "br":
        out.push({ type: "linebreak", version: 1 });
        break;
      case "a": {
        const href = el.getAttribute("href") ?? "";
        const children: LexNode[] = [];
        collectInline(el, format, children);

        if (children.length === 0) break;

        // URL berbahaya → turunkan menjadi teks biasa, jangan buat tautan.
        if (!href || BLOCKED_URL_SCHEMES.test(href.trim())) {
          out.push(...children);
          break;
        }

        const isExternal = /^https?:\/\//i.test(href) &&
          !href.includes("granddutacitysouthofjakarta.com");

        out.push({
          ...elementBase,
          type: "link",
          fields: {
            linkType: "custom",
            newTab: isExternal,
            url: href.trim(),
          },
          version: 3,
          children,
        });
        break;
      }
      default:
        // Elemen inline lain yang tidak dikenal: ambil isinya saja.
        collectInline(el, format, out);
        break;
    }
  }
};

const buildInlineChildren = (el: Element): LexNode[] => {
  const out: LexNode[] = [];
  collectInline(el, 0, out);
  return out;
};

const buildListItems = (listEl: Element): LexNode[] => {
  const items: LexNode[] = [];
  let index = 1;

  for (const child of Array.from(listEl.children)) {
    if (child.tagName.toLowerCase() !== "li") continue;

    const children = buildInlineChildren(child);
    if (children.length === 0) continue;

    items.push({
      ...elementBase,
      type: "listitem",
      value: index,
      children,
    });
    index += 1;
  }

  return items;
};

// Konversi satu elemen blok menjadi node Lexical. Mengembalikan null bila
// elemen tidak menghasilkan konten.
const convertBlock = (el: Element): LexNode | null => {
  const tag = el.tagName.toLowerCase();

  if (DANGEROUS_TAGS.has(tag)) return null;

  switch (tag) {
    // H1 diturunkan ke H2: judul artikel sudah menjadi H1 di halaman publik.
    case "h1":
    case "h2":
    case "h3":
    case "h4": {
      const children = buildInlineChildren(el);
      if (children.length === 0) return null;
      return {
        ...elementBase,
        type: "heading",
        tag: tag === "h1" ? "h2" : tag,
        children,
      };
    }

    case "ul":
    case "ol": {
      const items = buildListItems(el);
      if (items.length === 0) return null;
      return {
        ...elementBase,
        type: "list",
        listType: tag === "ul" ? "bullet" : "number",
        tag,
        start: 1,
        children: items,
      };
    }

    case "blockquote": {
      const children = buildInlineChildren(el);
      if (children.length === 0) return null;
      return { ...elementBase, type: "quote", children };
    }

    case "p":
    default: {
      const children = buildInlineChildren(el);
      if (children.length === 0) return null;
      return {
        ...elementBase,
        type: "paragraph",
        textFormat: 0,
        textStyle: "",
        children,
      };
    }
  }
};

export const htmlToLexicalState = (html: string): LexicalState => {
  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;

  const children: LexNode[] = [];

  for (const child of Array.from(body.children)) {
    const tag = child.tagName.toLowerCase();

    // Bila AI membungkus semuanya dalam <div>/<section>, telusuri isinya.
    if (tag === "div" || tag === "section" || tag === "article") {
      for (const inner of Array.from(child.children)) {
        const node = convertBlock(inner);
        if (node) children.push(node);
      }
      continue;
    }

    const node = convertBlock(child);
    if (node) children.push(node);
  }

  // Pastikan selalu ada minimal satu blok agar editor tidak kosong total.
  if (children.length === 0) {
    children.push({ ...elementBase, type: "paragraph", children: [] });
  }

  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children,
    },
  };
};
