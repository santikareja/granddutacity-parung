// Konversi HTML terstruktur (dari AI) → Lexical state, TANPA dependensi Payload.
// Server-side only (memakai jsdom untuk parsing).
//
// Bentuk node yang dihasilkan harus identik dengan yang dipakai Payload agar
// artikel hasil AI bisa dibuka editor v2 dan dirender frontend tanpa perbedaan.
// Acuan bentuk node: src/components/articles/__fixtures__/lexical-states/*.json
// (fixture golden yang direkam dari renderer Payload asli).

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

// Tag yang harus diperlakukan sebagai blok saat ditemukan di dalam kontainer
// (sel tabel, <li>, <blockquote>). Tanpa daftar ini, sebuah <ul> di dalam <li>
// akan ikut dipipihkan menjadi teks oleh collectInline.
const BLOCK_LEVEL_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "blockquote",
  "table",
  "hr",
  "div",
  "section",
  "article",
  "figure",
  "pre",
]);

// Kontainer yang hanya membungkus: isinya dinaikkan ke level induk.
const TRANSPARENT_TAGS = new Set(["div", "section", "article", "figure"]);

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

const paragraphNode = (children: LexNode[]): LexNode => ({
  ...elementBase,
  type: "paragraph",
  textFormat: 0,
  textStyle: "",
  children,
});

// Konversi satu node DOM inline (teks atau elemen inline) menjadi node Lexical.
const collectInlineNode = (
  child: Node,
  format: number,
  out: LexNode[],
): void => {
  if (child.nodeType === 3) {
    // Text node: normalkan whitespace tapi jangan buang spasi antar-kata.
    const raw = (child.textContent ?? "").replace(/\s+/g, " ");
    if (raw.trim().length > 0 || raw === " ") {
      out.push(textNode(raw, format));
    }
    return;
  }

  if (child.nodeType !== 1) return;

  const el = child as Element;
  const tag = el.tagName.toLowerCase();

  if (DANGEROUS_TAGS.has(tag)) return;

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

      const isExternal =
        /^https?:\/\//i.test(href) &&
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
};

// Kumpulkan node inline (text/link) dari anak sebuah elemen blok.
const collectInline = (node: Node, format: number, out: LexNode[]): void => {
  for (const child of Array.from(node.childNodes)) {
    collectInlineNode(child, format, out);
  }
};

const buildInlineChildren = (el: Element): LexNode[] => {
  const out: LexNode[] = [];
  collectInline(el, 0, out);
  return out;
};

/**
 * Ubah isi sebuah kontainer menjadi deretan node BLOK.
 *
 * Teks/elemen inline yang berdiri sendiri dikumpulkan menjadi paragraf, dan
 * setiap elemen block-level dikonversi terpisah. Dipakai untuk sel tabel dan
 * <blockquote> yang isinya bisa campur.
 */
const convertContainerToBlocks = (el: Element): LexNode[] => {
  const blocks: LexNode[] = [];
  let inlineBuffer: LexNode[] = [];

  const flushInline = () => {
    if (inlineBuffer.length === 0) return;
    blocks.push(paragraphNode(inlineBuffer));
    inlineBuffer = [];
  };

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 1) {
      const tag = (child as Element).tagName.toLowerCase();
      if (BLOCK_LEVEL_TAGS.has(tag)) {
        flushInline();
        appendBlocks(child as Element, blocks);
        continue;
      }
    }
    collectInlineNode(child, 0, inlineBuffer);
  }

  flushInline();
  return blocks;
};

/**
 * Bangun item list, termasuk list bersarang.
 *
 * Bentuk yang dihasilkan mengikuti konvensi Lexical: sebuah `listitem` boleh
 * memuat node teks DAN node `list` anak. `listitem.indent` menyimpan kedalaman,
 * sedangkan `list.indent` selalu 0 (lihat fixture list-nested.json).
 */
const buildListItems = (listEl: Element, depth: number): LexNode[] => {
  const items: LexNode[] = [];
  let index = 1;

  for (const child of Array.from(listEl.children)) {
    if (child.tagName.toLowerCase() !== "li") continue;

    const inline: LexNode[] = [];
    const nestedLists: LexNode[] = [];

    for (const inner of Array.from(child.childNodes)) {
      if (inner.nodeType === 1) {
        const innerTag = (inner as Element).tagName.toLowerCase();
        if (innerTag === "ul" || innerTag === "ol") {
          const nested = convertList(inner as Element, depth + 1);
          if (nested) nestedLists.push(nested);
          continue;
        }
      }
      collectInlineNode(inner, 0, inline);
    }

    // Whitespace antara teks <li> dan <ul> bersarang menghasilkan node teks
    // berisi satu spasi. Node itu tidak membawa makna dan hanya menyisakan
    // spasi ganda di akhir teks item, jadi dibuang.
    while (
      nestedLists.length > 0 &&
      inline.length > 0 &&
      inline[inline.length - 1]?.type === "text" &&
      typeof inline[inline.length - 1]?.text === "string" &&
      (inline[inline.length - 1].text as string).trim().length === 0
    ) {
      inline.pop();
    }

    const children = [...inline, ...nestedLists];
    if (children.length === 0) continue;

    items.push({
      ...elementBase,
      type: "listitem",
      value: index,
      indent: depth,
      children,
    });
    index += 1;
  }

  return items;
};

const convertList = (el: Element, depth: number): LexNode | null => {
  const tag = el.tagName.toLowerCase() === "ol" ? "ol" : "ul";
  const items = buildListItems(el, depth);
  if (items.length === 0) return null;

  return {
    ...elementBase,
    type: "list",
    listType: tag === "ul" ? "bullet" : "number",
    tag,
    start: 1,
    children: items,
  };
};

// colspan/rowspan: hanya nilai bulat >= 1 yang diterima; sisanya jadi 1.
const spanAttr = (el: Element, name: string): number => {
  const parsed = Number.parseInt(el.getAttribute(name) ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  // Batas atas wajar agar HTML rusak tidak menghasilkan tabel raksasa.
  return Math.min(parsed, 100);
};

/**
 * Konversi <table> menjadi node table/tablerow/tablecell.
 *
 * Sebelumnya tabel tidak ditangani sama sekali sehingga jatuh ke cabang
 * `default` dan seluruh teks sel menyatu menjadi satu paragraf tanpa pemisah —
 * padahal prompt AI secara eksplisit menyuruh model memakai <table>. Renderer
 * publik (lexical-renderer.tsx) sudah punya converter tabel, jadi bentuk di
 * bawah ini langsung tampil benar di situs.
 */
const convertTable = (el: Element): LexNode | null => {
  const rowElements: { el: Element; inHead: boolean }[] = [];

  // <tr> bisa berada langsung di <table> atau di dalam thead/tbody/tfoot.
  const collectRows = (parent: Element, inHead: boolean): void => {
    for (const child of Array.from(parent.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === "thead") collectRows(child, true);
      else if (tag === "tbody" || tag === "tfoot") collectRows(child, false);
      else if (tag === "tr") rowElements.push({ el: child, inHead });
    }
  };
  collectRows(el, false);

  const rows: LexNode[] = [];

  rowElements.forEach((entry, rowIndex) => {
    const cells: LexNode[] = [];

    for (const cellEl of Array.from(entry.el.children)) {
      const tag = cellEl.tagName.toLowerCase();
      if (tag !== "td" && tag !== "th") continue;

      // headerState mengikuti bitmask @lexical/table:
      // 0 = biasa, 1 = header baris, 2 = header kolom.
      const headerState =
        tag === "th" ? (entry.inHead || rowIndex === 0 ? 1 : 2) : 0;

      // TableCellNode WAJIB punya anak berupa node blok; sel kosong tetap
      // mendapat satu paragraf kosong agar editor tidak melempar.
      const blocks = convertContainerToBlocks(cellEl);

      cells.push({
        ...elementBase,
        type: "tablecell",
        headerState,
        colSpan: spanAttr(cellEl, "colspan"),
        rowSpan: spanAttr(cellEl, "rowspan"),
        backgroundColor: null,
        children: blocks.length > 0 ? blocks : [paragraphNode([])],
      });
    }

    if (cells.length > 0) {
      rows.push({ ...elementBase, type: "tablerow", children: cells });
    }
  });

  if (rows.length === 0) return null;

  return { ...elementBase, type: "table", children: rows };
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
    case "h4":
    case "h5":
    case "h6": {
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
    case "ol":
      return convertList(el, 0);

    case "table":
      return convertTable(el);

    case "hr":
      return { type: "horizontalrule", version: 1 };

    case "blockquote": {
      const children = buildInlineChildren(el);
      if (children.length === 0) return null;
      return { ...elementBase, type: "quote", children };
    }

    case "p":
    default: {
      const children = buildInlineChildren(el);
      if (children.length === 0) return null;
      return paragraphNode(children);
    }
  }
};

/**
 * Tambahkan blok dari sebuah elemen ke `out`.
 *
 * Kontainer pembungkus (div/section/article/figure) ditelusuri secara rekursif
 * pada kedalaman berapa pun; sebelumnya hanya satu level yang ditelusuri
 * sehingga HTML terbungkus ganda kehilangan strukturnya.
 */
const appendBlocks = (el: Element, out: LexNode[]): void => {
  const tag = el.tagName.toLowerCase();

  if (DANGEROUS_TAGS.has(tag)) return;

  if (TRANSPARENT_TAGS.has(tag)) {
    for (const inner of Array.from(el.childNodes)) {
      if (inner.nodeType === 1) {
        appendBlocks(inner as Element, out);
        continue;
      }
      // Teks lepas di dalam pembungkus tetap dipertahankan sebagai paragraf.
      if (inner.nodeType === 3 && (inner.textContent ?? "").trim().length > 0) {
        const buffer: LexNode[] = [];
        collectInlineNode(inner, 0, buffer);
        if (buffer.length > 0) out.push(paragraphNode(buffer));
      }
    }
    return;
  }

  const node = convertBlock(el);
  if (node) out.push(node);
};

export const htmlToLexicalState = (html: string): LexicalState => {
  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;

  const children: LexNode[] = [];

  for (const child of Array.from(body.children)) {
    appendBlocks(child, children);
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
