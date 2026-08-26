// Utilitas Lexical bersama untuk CMS kustom (server & client aman).
//
// Format `content` di DB adalah Lexical editor state yang dibuat Payload. Semua
// tulis/baca dari CMS kustom WAJIB memakai bentuk node yang sama agar 30+ artikel
// lama dan renderer frontend (ArticleRichContent) tetap bekerja.

export type LexNode = {
  type?: string;
  children?: LexNode[];
  text?: string;
  [key: string]: unknown;
};

export type LexicalState = {
  root: {
    type: "root";
    format: string;
    indent: number;
    version: number;
    direction: "ltr" | "rtl" | null;
    children: LexNode[];
  };
};

export const CTA_URL = "https://granddutacitysouthofjakarta.com";
export const CTA_ANCHOR = "Grand Duta City Parung";
const CTA_LEAD = "Tertarik memiliki hunian di ";
const CTA_TAIL =
  "? Jelajahi pilihan cluster, harga terbaru, dan fasilitasnya sekarang.";

export const createEmptyState = (): LexicalState => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        children: [],
      },
    ],
  },
});

const textNode = (text: string, format = 0): LexNode => ({
  type: "text",
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  version: 1,
});

const buildCtaParagraph = (): LexNode => ({
  type: "paragraph",
  format: "",
  indent: 0,
  version: 1,
  direction: "ltr",
  children: [
    textNode(CTA_LEAD),
    {
      type: "link",
      fields: { linkType: "custom", newTab: false, url: CTA_URL },
      format: "",
      indent: 0,
      version: 3,
      direction: "ltr",
      children: [textNode(CTA_ANCHOR)],
    },
    textNode(CTA_TAIL),
  ],
});

// Gabungkan seluruh teks dalam subtree (untuk mencocokkan anchor lintas node).
export const collectText = (node: LexNode | null | undefined): string => {
  if (!node) return "";
  const own = typeof node.text === "string" ? node.text : "";
  const kids = Array.isArray(node.children)
    ? node.children.map(collectText).join("")
    : "";
  return own + kids;
};

const containsCtaLink = (node: LexNode | null | undefined): boolean => {
  if (!node) return false;

  if (node.type === "link") {
    const url = (node as { fields?: { url?: unknown } }).fields?.url;
    if (typeof url === "string") {
      const normalized = url.replace(/\/+$/, "");
      if (normalized === CTA_URL && collectText(node).includes(CTA_ANCHOR)) {
        return true;
      }
    }
  }

  return Array.isArray(node.children) ? node.children.some(containsCtaLink) : false;
};

const isEmptyBlock = (node: LexNode | null | undefined): boolean =>
  collectText(node).trim().length === 0;

// Pastikan CTA ada di akhir artikel, IDEMPOTEN: aman dipanggil berulang pada
// setiap penyimpanan tanpa menumpuk paragraf CTA.
export const ensureCta = (state: unknown): unknown => {
  if (!state || typeof state !== "object" || !("root" in state)) return state;

  const root = (state as { root?: { children?: LexNode[] } }).root;
  if (!root || !Array.isArray(root.children)) return state;

  const children = root.children;

  let lastMeaningful = -1;
  for (let i = children.length - 1; i >= 0; i -= 1) {
    if (!isEmptyBlock(children[i])) {
      lastMeaningful = i;
      break;
    }
  }

  if (lastMeaningful >= 0 && containsCtaLink(children[lastMeaningful])) {
    return state;
  }

  return {
    ...(state as Record<string, unknown>),
    root: { ...root, children: [...children, buildCtaParagraph()] },
  };
};

// Ambil ID media dari node upload pertama (untuk auto featured image).
export const findFirstUploadMediaId = (
  node: LexNode | null | undefined,
): number | null => {
  if (!node) return null;

  if (node.type === "upload") {
    const value = (node as { value?: unknown }).value;
    if (typeof value === "number") return value;
    if (value && typeof value === "object" && "id" in value) {
      const id = (value as { id?: unknown }).id;
      if (typeof id === "number") return id;
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findFirstUploadMediaId(child);
      if (found) return found;
    }
  }

  return null;
};

export const extractFeaturedImageId = (state: unknown): number | null => {
  if (!state || typeof state !== "object" || !("root" in state)) return null;
  return findFirstUploadMediaId((state as { root?: LexNode }).root);
};

// Plaintext ringkas dari state (untuk konteks prompt AI & excerpt otomatis).
export const lexicalToPlaintext = (state: unknown): string => {
  if (!state || typeof state !== "object" || !("root" in state)) return "";
  const root = (state as { root?: { children?: LexNode[] } }).root;
  if (!root || !Array.isArray(root.children)) return "";

  return root.children
    .map((child) => collectText(child).trim())
    .filter((t) => t.length > 0)
    .join("\n\n");
};

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
