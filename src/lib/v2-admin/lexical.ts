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

// --- Kompatibilitas node `link` Payload <-> Lexical -------------------------
//
// MASALAH: korpus artikel ini (dan buildCtaParagraph di atas) menyimpan tautan
// dalam bentuk Payload: `{ type: "link", fields: { linkType, newTab, url } }`.
// Sementara `LinkNode` bawaan @lexical/link memakai `SerializedLinkNode` yang
// hanya mengenal `{ url, target, rel, title }` di level atas dan MEMBUANG key
// yang tidak dikenalnya saat exportJSON.
//
// Akibatnya, tanpa penyesuaian: buka artikel di editor → LinkNode memuat url
// kosong (karena membaca `serialized.url` yang tidak ada) → simpan → `fields`
// hilang dan seluruh href tautan artikel yang sudah tayang menjadi kosong,
// termasuk backlink CTA wajib ke homepage.
//
// Solusi: transformasi di dua batas. Tidak menyentuh internal Lexical sama
// sekali, sehingga aman dan bisa diuji sebagai fungsi murni.

const LINK_TYPES = new Set(["link", "autolink"]);

const mapNodes = (
  nodes: LexNode[],
  transform: (node: LexNode) => LexNode,
): LexNode[] => nodes.map(transform);

const transformTree = (
  node: LexNode,
  visit: (node: LexNode) => LexNode,
): LexNode => {
  const visited = visit(node);
  if (!Array.isArray(visited.children)) return visited;
  return {
    ...visited,
    children: mapNodes(visited.children, (child) => transformTree(child, visit)),
  };
};

const transformState = (
  state: unknown,
  visit: (node: LexNode) => LexNode,
): unknown => {
  if (!state || typeof state !== "object" || !("root" in state)) return state;
  const root = (state as { root?: { children?: LexNode[] } }).root;
  if (!root || !Array.isArray(root.children)) return state;

  return {
    ...(state as Record<string, unknown>),
    root: {
      ...root,
      children: mapNodes(root.children, (child) => transformTree(child, visit)),
    },
  };
};

/**
 * Siapkan state dari database untuk dimuat editor Lexical.
 *
 * Menaikkan `fields.url` menjadi `url`/`target`/`rel` di level atas agar
 * `LinkNode` bawaan membacanya dengan benar. `fields` tetap dibawa (tidak
 * merugikan; Lexical mengabaikannya).
 */
export const prepareStateForEditor = (state: unknown): unknown =>
  transformState(state, (node) => {
    if (!node.type || !LINK_TYPES.has(node.type)) return node;

    const fields = (node.fields ?? {}) as {
      url?: unknown;
      newTab?: unknown;
      linkType?: unknown;
    };
    const fieldUrl = typeof fields.url === "string" ? fields.url : "";
    const existingUrl = typeof node.url === "string" ? node.url : "";
    const url = existingUrl || fieldUrl;
    if (!url) return node;

    const newTab =
      fields.newTab === true ||
      node.target === "_blank" ||
      node.newTab === true;

    return {
      ...node,
      url,
      target: newTab ? "_blank" : null,
      rel: newTab ? "noopener noreferrer" : null,
    };
  });

/**
 * Siapkan state dari editor untuk disimpan ke database.
 *
 * Membangun kembali `fields` gaya Payload dari `url`/`target` level atas, karena
 * itulah yang dibaca renderer publik (lexical-renderer.tsx membaca
 * `node.fields.url`). Node yang sudah punya `fields.url` dibiarkan apa adanya.
 */
export const prepareStateForStorage = (state: unknown): unknown =>
  transformState(state, (node) => {
    if (!node.type || !LINK_TYPES.has(node.type)) return node;

    const fields = (node.fields ?? {}) as {
      url?: unknown;
      newTab?: unknown;
      linkType?: unknown;
    };
    const topUrl = typeof node.url === "string" ? node.url : "";
    const fieldUrl = typeof fields.url === "string" ? fields.url : "";

    // Prioritaskan url dari editor: itu yang mencerminkan hasil penyuntingan.
    const url = topUrl || fieldUrl;
    if (!url) return node;

    const newTab = node.target === "_blank" || fields.newTab === true;
    const linkType =
      typeof fields.linkType === "string" && fields.linkType
        ? fields.linkType
        : "custom";

    return {
      ...node,
      fields: { ...fields, linkType, newTab, url },
    };
  });

export type OutlineSectionInput = {
  heading: string;
  subheadings?: string[];
};

const headingNode = (tag: "h2" | "h3", text: string): LexNode => ({
  type: "heading",
  tag,
  format: "",
  indent: 0,
  version: 1,
  direction: "ltr",
  children: [textNode(text)],
});

const emptyParagraph = (): LexNode => ({
  type: "paragraph",
  format: "",
  indent: 0,
  version: 1,
  direction: "ltr",
  textFormat: 0,
  textStyle: "",
  children: [],
});

/**
 * Ubah outline (hasil AI, sudah disetujui penulis) menjadi Lexical state.
 *
 * Sengaja TIDAK memakai htmlToLexicalState: fungsi itu bergantung pada jsdom
 * sehingga hanya bisa jalan di server, sedangkan panel AI Assist menerapkan
 * outline ke editor langsung dari browser.
 *
 * Setiap heading diikuti paragraf kosong agar penulis punya tempat mengisi isi
 * tiap bagian.
 */
export const outlineToLexicalState = (
  sections: OutlineSectionInput[],
): LexicalState => {
  const children: LexNode[] = [];

  for (const section of sections) {
    const heading = section.heading?.trim();
    if (!heading) continue;

    children.push(headingNode("h2", heading));
    children.push(emptyParagraph());

    for (const sub of section.subheadings ?? []) {
      const subHeading = sub?.trim();
      if (!subHeading) continue;
      children.push(headingNode("h3", subHeading));
      children.push(emptyParagraph());
    }
  }

  if (children.length === 0) children.push(emptyParagraph());

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
