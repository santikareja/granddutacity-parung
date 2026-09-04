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

// Variasi anchor CTA homepage. Semuanya menunjuk ke SITE_URL yang sama; yang
// berbeda hanya teksnya, supaya backlink internal tidak memakai anchor identik
// di setiap artikel (anchor yang terlalu seragam terbaca tidak natural). Index
// 0 dipertahankan sebagai default demi kompatibilitas dengan artikel lama.
//
// Daftar ini dipakai HANYA oleh CTA cadangan yang dibuat sistem. Sejak
// 4 September 2026 AI menulis CTA-nya sendiri dengan anchor bebas yang menyatu
// ke kalimat, jadi `ensureCta` tidak lagi boleh mensyaratkan anchor dari daftar
// ini untuk mengenali CTA — lihat catatan di `containsCtaLink`.
export const CTA_ANCHORS = [
  "Grand Duta City Parung",
  "Website Resmi",
  "GDC Parung",
] as const;
export const CTA_ANCHOR = CTA_ANCHORS[0];

const CTA_LEAD = "Tertarik memiliki hunian di ";
const CTA_TAIL =
  "? Jelajahi pilihan cluster, harga terbaru, dan fasilitasnya sekarang.";

// Pemilihan anchor deterministik dari isi artikel. Deterministik penting: alur
// simpan memanggil ensureCta berkali-kali dan test membandingkan keluaran, jadi
// input yang sama harus selalu menghasilkan anchor yang sama (bukan acak).
const pickCtaAnchor = (seedText: string): string => {
  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return CTA_ANCHORS[hash % CTA_ANCHORS.length];
};

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

const buildCtaParagraph = (anchor: string = CTA_ANCHOR): LexNode => ({
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
      children: [textNode(anchor)],
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

/**
 * Apakah URL ini menunjuk homepage situs?
 *
 * Menerima DUA bentuk, dan itu disengaja: AI menulis CTA-nya dalam HTML, lalu
 * `htmlToLexicalState` menyimpan href apa adanya. Bila AI menulis
 * `<a href="/">`, url tersimpan sebagai `"/"`; bila ia menulis URL penuh, url
 * tersimpan sebagai absolut. Keduanya homepage yang sama, jadi keduanya harus
 * dikenali — kalau tidak, `ensureCta` menambahkan CTA kedua.
 */
const isHomepageUrl = (raw: string): boolean => {
  const value = raw.trim();
  if (!value) return false;
  if (value === "/") return true;
  const withoutTrailing = value.replace(/\/+$/, "");
  return withoutTrailing === CTA_URL || withoutTrailing === CTA_URL.replace(/^https:/, "http:");
};

/**
 * Apakah blok ini sudah memuat tautan ke homepage?
 *
 * Deteksi berbasis URL SAJA (diubah 4 September 2026). Versi sebelumnya
 * mensyaratkan URL homepage DAN teks anchor yang cocok dengan salah satu
 * `CTA_ANCHORS`. Syarat kedua itu benar selama hanya sistem yang menulis CTA,
 * tetapi menjadi bug begitu AI menulis CTA-nya sendiri: anchor tulisan AI
 * menyatu ke kalimat ("kawasan ini", "situs resminya", "profil kawasan"), tidak
 * ada di daftar, sehingga `ensureCta` menganggap CTA belum ada dan MENAMBAH
 * paragraf CTA kedua. Artikel jadi punya dua penutup.
 *
 * URL sudah cukup sebagai penanda: satu-satunya alasan sebuah paragraf penutup
 * menautkan homepage adalah karena ia CTA. Anchor-nya tidak menambah kepastian,
 * hanya membatasi kebebasan redaksional.
 */
const containsCtaLink = (node: LexNode | null | undefined): boolean => {
  if (!node) return false;

  if (node.type === "link" || node.type === "autolink") {
    // URL tautan bisa tersimpan di `fields.url` (bentuk Payload, dipakai korpus
    // artikel dan renderer publik) atau di `url` level atas (bentuk Lexical
    // setelah disunting di editor). Keduanya harus dikenali.
    const fieldUrl = (node as { fields?: { url?: unknown } }).fields?.url;
    const topUrl = (node as { url?: unknown }).url;

    for (const candidate of [fieldUrl, topUrl]) {
      if (typeof candidate === "string" && isHomepageUrl(candidate)) return true;
    }
  }

  return Array.isArray(node.children) ? node.children.some(containsCtaLink) : false;
};

const isEmptyBlock = (node: LexNode | null | undefined): boolean =>
  collectText(node).trim().length === 0;

/**
 * Jaring pengaman backlink homepage.
 *
 * PERAN BERUBAH 4 September 2026. Sebelumnya fungsi ini adalah SATU-SATUNYA
 * penulis CTA: prompt secara eksplisit melarang AI menulis ajakan penutup, dan
 * paragraf template yang identik di semua artikel ditempelkan di sini. Hasilnya
 * CTA yang tidak tahu apa pun tentang isi artikel di atasnya.
 *
 * Sekarang AI menulis CTA-nya sendiri sebagai kelanjutan argumen artikel, dan
 * fungsi ini menjadi CADANGAN: ia hanya menambahkan paragraf bila artikel benar
 * -benar berakhir tanpa tautan ke homepage. Backlink internal ke homepage adalah
 * sinyal SEO yang tidak boleh hilang hanya karena satu generasi AI lupa, jadi
 * pengaman ini tetap ada.
 *
 * Tetap IDEMPOTEN: aman dipanggil berulang pada setiap penyimpanan.
 *
 * Pemeriksaan dilakukan pada BLOK TERAKHIR yang berisi teks, bukan seluruh
 * dokumen. Ini disengaja: tautan homepage di tengah artikel tidak menggantikan
 * peran penutup, dan artikel lama yang menautkan homepage di paragraf awal tetap
 * berhak mendapat CTA di akhir.
 */
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

  // Anchor dipilih deterministik dari isi artikel yang sudah ada (sebelum CTA
  // ditambahkan), sehingga stabil di setiap pemanggilan ulang.
  const seed = children.map(collectText).join(" ");
  const anchor = pickCtaAnchor(seed);

  return {
    ...(state as Record<string, unknown>),
    root: { ...root, children: [...children, buildCtaParagraph(anchor)] },
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

// --- Inventaris tautan -------------------------------------------------------
//
// Penulis perlu bisa MELIHAT tautan apa saja yang terpasang di artikel: sebelum
// ini href hanya tersimpan di dalam state Lexical dan tidak pernah ditampilkan,
// sehingga tautan salah (mis. ke domain pesaing) lolos tanpa disadari.
//
// Fungsi murni, aman dipanggil dari komponen client (tidak menyentuh jsdom/DB).

export type ArticleLinkKind = "homepage" | "internal" | "external";

export type ArticleLink = {
  url: string;
  /** Teks anchor yang terlihat pembaca. */
  anchor: string;
  kind: ArticleLinkKind;
};

const HOMEPAGE_HOSTS = new Set([
  "granddutacitysouthofjakarta.com",
  "www.granddutacitysouthofjakarta.com",
]);

// Klasifikasi tautan. CTA ke homepage sengaja dipisah dari "internal" biasa
// supaya penulis bisa memastikan kuota tautan internal (maksimal 3, minimal 1
// yaitu homepage) benar-benar terpenuhi.
const classifyUrl = (url: string): ArticleLinkKind => {
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) return "internal";

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (!HOMEPAGE_HOSTS.has(host)) return "external";
    // Domain sendiri: root = CTA homepage, path lain = tautan internal absolut.
    return parsed.pathname.replace(/\/+$/, "").length === 0
      ? "homepage"
      : "internal";
  } catch {
    // Bukan URL absolut yang valid dan bukan path root-relative.
    return "external";
  }
};

// Ambil url dari node link, mendukung kedua bentuk: `fields.url` (gaya Payload,
// bentuk penyimpanan) dan `url` di level atas (bentuk editor Lexical).
const linkUrlOf = (node: LexNode): string => {
  const top = typeof node.url === "string" ? node.url : "";
  if (top) return top;
  const fields = (node.fields ?? {}) as { url?: unknown };
  return typeof fields.url === "string" ? fields.url : "";
};

const walkLinks = (node: LexNode | null | undefined, out: ArticleLink[]): void => {
  if (!node) return;

  if (node.type && LINK_TYPES.has(node.type)) {
    const url = linkUrlOf(node).trim();
    if (url) {
      out.push({
        url,
        anchor: collectText(node).trim(),
        kind: classifyUrl(url),
      });
    }
    // Tautan tidak bersarang di dalam tautan; tidak perlu turun lebih jauh.
    return;
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) walkLinks(child, out);
  }
};

/**
 * Kumpulkan seluruh tautan di dalam sebuah Lexical state, berurutan sesuai
 * kemunculannya di artikel. Duplikat TIDAK dihapus: dua tautan ke URL yang sama
 * memang dua tautan, dan penulis perlu melihatnya untuk menilai spam.
 */
export const extractLinks = (state: unknown): ArticleLink[] => {
  if (!state || typeof state !== "object" || !("root" in state)) return [];
  const root = (state as { root?: { children?: LexNode[] } }).root;
  if (!root || !Array.isArray(root.children)) return [];

  const out: ArticleLink[] = [];
  for (const child of root.children) walkLinks(child, out);
  return out;
};

/** Ringkasan jumlah tautan per jenis — dipakai untuk badge di UI editor. */
export const summarizeLinks = (
  links: ArticleLink[],
): { homepage: number; internal: number; external: number; total: number } => ({
  homepage: links.filter((l) => l.kind === "homepage").length,
  internal: links.filter((l) => l.kind === "internal").length,
  external: links.filter((l) => l.kind === "external").length,
  total: links.length,
});
