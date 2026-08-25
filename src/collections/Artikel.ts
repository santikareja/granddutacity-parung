import type { CollectionConfig } from "payload";
import {
  EXPERIMENTAL_TableFeature,
  HTMLConverterFeature,
  lexicalEditor,
  UploadFeature,
} from "@payloadcms/richtext-lexical";

type RichNode = {
  type?: string;
  value?: unknown;
  children?: RichNode[];
};

const resolveMediaIdFromUploadNode = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "id" in value) {
    const rawId = (value as { id?: unknown }).id;
    if (typeof rawId === "number") return rawId;
  }

  return null;
};

const findFirstUploadMediaId = (node: RichNode | null | undefined): number | null => {
  if (!node) return null;

  if (node.type === "upload") {
    const mediaId = resolveMediaIdFromUploadNode(node.value);
    if (mediaId) return mediaId;
  }

  if (!Array.isArray(node.children) || node.children.length === 0) {
    return null;
  }

  for (const child of node.children) {
    const mediaId = findFirstUploadMediaId(child);
    if (mediaId) return mediaId;
  }

  return null;
};

const extractFeaturedImageFromContent = (content: unknown): number | null => {
  if (!content || typeof content !== "object" || !("root" in content)) {
    return null;
  }

  const root = (content as { root?: RichNode }).root;
  return findFirstUploadMediaId(root);
};

// CTA wajib di akhir setiap artikel: hyperlink ke homepage dengan anchor persis
// "Grand Duta City Parung". Di-enforce server-side agar berlaku baik untuk
// artikel manual maupun hasil AI, dan tidak bergantung pada kepatuhan AI.
const CTA_URL = "https://granddutacitysouthofjakarta.com";
const CTA_ANCHOR = "Grand Duta City Parung";
const CTA_LEAD = "Tertarik memiliki hunian di ";

type LexicalTextNode = {
  type: "text";
  detail: number;
  format: number;
  mode: "normal";
  style: string;
  text: string;
  version: number;
};

type LexicalLinkNode = {
  type: "link";
  fields: { linkType: "custom"; newTab: boolean; url: string };
  children: LexicalTextNode[];
  direction: "ltr" | "rtl" | null;
  format: "";
  indent: number;
  version: number;
};

type LexicalParagraphNode = {
  type: "paragraph";
  children: (LexicalTextNode | LexicalLinkNode)[];
  direction: "ltr" | "rtl" | null;
  format: "";
  indent: number;
  version: number;
  textFormat?: number;
};

const makeTextNode = (text: string): LexicalTextNode => ({
  type: "text",
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text,
  version: 1,
});

const buildCtaParagraph = (): LexicalParagraphNode => ({
  type: "paragraph",
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
  children: [
    makeTextNode(CTA_LEAD),
    {
      type: "link",
      fields: { linkType: "custom", newTab: false, url: CTA_URL },
      direction: "ltr",
      format: "",
      indent: 0,
      version: 3,
      children: [makeTextNode(CTA_ANCHOR)],
    },
    makeTextNode(
      "? Jelajahi pilihan cluster, harga terbaru, dan fasilitasnya sekarang.",
    ),
  ],
});

// Gabungkan semua teks di dalam subtree sebuah node (dipakai untuk mencocokkan
// anchor CTA lintas beberapa text node).
const collectNodeText = (node: RichNode | null | undefined): string => {
  if (!node) return "";
  const own = typeof (node as { text?: unknown }).text === "string"
    ? ((node as { text: string }).text)
    : "";
  const childText = Array.isArray(node.children)
    ? node.children.map(collectNodeText).join("")
    : "";
  return own + childText;
};

// Cari link node menuju homepage dengan anchor persis "Grand Duta City Parung"
// di dalam subtree. Dipakai untuk deteksi idempoten sebelum menambah CTA.
const containsCtaLink = (node: RichNode | null | undefined): boolean => {
  if (!node) return false;

  if (node.type === "link") {
    const url = (node as { fields?: { url?: unknown } }).fields?.url;
    if (typeof url === "string") {
      const normalizedUrl = url.replace(/\/+$/, "");
      const anchorText = collectNodeText(node).trim();
      if (normalizedUrl === CTA_URL && anchorText.includes(CTA_ANCHOR)) {
        return true;
      }
    }
  }

  if (!Array.isArray(node.children)) return false;
  return node.children.some(containsCtaLink);
};

const isEmptyBlock = (node: RichNode | null | undefined): boolean => {
  if (!node) return true;
  return collectNodeText(node).trim().length === 0;
};

// Idempotensi kritikal: autosave (interval 3s) memicu beforeChange berulang.
// Kita hanya menambah CTA jika blok non-kosong terakhir belum berupa CTA. Setelah
// sekali ditambah, blok terakhir menjadi CTA sehingga re-save menjadi no-op.
const enforceCtaAtEnd = (content: unknown): unknown => {
  if (!content || typeof content !== "object" || !("root" in content)) {
    return content;
  }

  const root = (content as { root?: { children?: RichNode[] } }).root;
  if (!root || !Array.isArray(root.children)) {
    return content;
  }

  const children = root.children;

  let lastMeaningfulIndex = -1;
  for (let i = children.length - 1; i >= 0; i -= 1) {
    if (!isEmptyBlock(children[i])) {
      lastMeaningfulIndex = i;
      break;
    }
  }

  if (lastMeaningfulIndex >= 0 && containsCtaLink(children[lastMeaningfulIndex])) {
    return content;
  }

  const nextChildren = [...children, buildCtaParagraph() as unknown as RichNode];

  return {
    ...(content as Record<string, unknown>),
    root: {
      ...root,
      children: nextChildren,
    },
  };
};

export const Artikel: CollectionConfig = {
  slug: "artikel",
  labels: {
    singular: "Artikel",
    plural: "Artikels",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "kategori", "status", "publishedAt"],
    group: "Konten",
  },
  access: {
    // Publik hanya boleh membaca artikel berstatus published. Tanpa constraint
    // ini, `GET /api/artikel?draft=true` mengekspos draft & autosave ke siapa pun.
    read: ({ req }) => {
      if (req.user) return true;
      return {
        status: {
          equals: "published",
        },
      };
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  versions: {
    drafts: { autosave: { interval: 3000 } },
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (data?.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }

        if (!data?.featuredImage && data?.content) {
          const mediaIdFromBody = extractFeaturedImageFromContent(data.content);
          if (mediaIdFromBody) {
            data.featuredImage = mediaIdFromBody;
          }
        }

        // Enforce CTA di akhir artikel (idempoten) — berlaku untuk artikel manual
        // maupun hasil AI. Aman dijalankan berulang saat autosave.
        if (data?.content) {
          data.content = enforceCtaAtEnd(data.content) as typeof data.content;
        }

        // Sinkronkan `status` (field kustom yang dibaca frontend, sitemap, access
        // control, dashboard) dengan `_status` bawaan Payload (drafts/versions),
        // agar keduanya tidak pernah berlawanan.
        //
        // Sumber kebenaran berbeda per operasi:
        // - CREATE (mis. AI Studio / migrasi seed) mengirim `status` langsung tanpa
        //   `_status`, jadi `status` yang memimpin.
        // - UPDATE (tombol Publish/Save Draft) menggerakkan `_status`; form admin
        //   ikut mengirim nilai lama `status` dari sidebar yang bisa basi, jadi
        //   `_status` yang memimpin agar aksi Publish tidak dianulir nilai basi.
        {
          const resolved =
            operation === "create"
              ? (data?.status ?? data?._status)
              : (data?._status ?? data?.status);
          if (resolved === "published" || resolved === "draft") {
            data.status = resolved;
            data._status = resolved;
          }
        }

        // Auto-fill publishedAt ketika status berubah menjadi 'published'
        if (data?.status === "published" && !data?.publishedAt) {
          data.publishedAt = new Date().toISOString();
        }

        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true, maxLength: 100 },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { position: "sidebar" },
    },
    {
      name: "excerpt",
      type: "textarea",
      maxLength: 160,
      admin: {
        description: "Ringkasan artikel - dipakai juga sebagai meta description default",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
      editor: lexicalEditor({
        admin: {
          placeholder: "Tulis konten artikel di sini...",
          hideGutter: false,
          hideAddBlockButton: false,
          hideInsertParagraphAtEnd: true,
          hideDraggableBlockElement: true,
        },
        features: ({ defaultFeatures }) => {
          const curatedDefaultFeatures = defaultFeatures.filter((feature) => {
            const key = (feature as { key?: string })?.key;
            return key !== "horizontalRule";
          });

          return [
            HTMLConverterFeature({
              
            }),
            ...curatedDefaultFeatures,
            EXPERIMENTAL_TableFeature(),
            UploadFeature({
              enabledCollections: ["media"],
              collections: {
                media: {
                  fields: [
                    {
                      name: "alignment",
                      label: "Posisi Gambar",
                      type: "select",
                      defaultValue: "center",
                      options: [
                        { label: "Kiri", value: "left" },
                        { label: "Tengah", value: "center" },
                        { label: "Kanan", value: "right" },
                      ],
                    },
                    {
                      name: "captionOverride",
                      label: "Caption di Artikel",
                      type: "text",
                    },
                  ],
                },
              },
            }),
          ];
        },
      }),
      admin: {
        description: "Editor konten gaya klasik (mirip WordPress Classic Editor)",
      },
    },
    { name: "featuredImage", type: "upload", relationTo: "media", required: true },
    {
      name: "kategori",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      required: true,
      label: "Category Artikel",
      admin: {
        description: "Pilih satu atau lebih category untuk artikel ini.",
      },
    },
    { name: "tags", type: "relationship", relationTo: "tags", hasMany: true },
    {
      name: "seo",
      type: "group",
      label: "Pengaturan SEO",
      fields: [
        {
          name: "generateSeoUi",
          type: "ui",
          admin: {
            components: {
              Field: "@/payload/admin/components/GenerateSeoButton",
            },
          },
        },
        {
          name: "metaTitle",
          type: "text",
          admin: { description: "Rekomendasi sekitar 60 karakter. Kosong = judul + | Grand Duta City" },
        },
        {
          name: "metaDescription",
          type: "textarea",
          admin: { description: "Rekomendasi 145-160 karakter. Kosong = pakai excerpt" },
        },
        {
          name: "focusKeyword",
          type: "text",
          required: true,
          index: true,
          admin: { description: "WAJIB - keyword utama artikel" },
        },
      ],
    },
    {
      name: "relatedArtikel",
      type: "relationship",
      relationTo: "artikel",
      hasMany: true,
      maxRows: 5,
      admin: { description: "Artikel terkait untuk internal link (diisi AI)" },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime" },
        description: "Otomatis terisi saat artikel di-publish. Bisa diedit jika perlu custom tanggal.",
      },
    },
    {
      name: "aiGenerated",
      type: "checkbox",
      defaultValue: false,
      label: "Dibuat oleh AI",
      admin: { position: "sidebar" },
    },
    {
      name: "aiTopic",
      type: "text",
      label: "Topik AI",
      admin: {
        position: "sidebar",
        description: "Jejak audit: ide topik yang dipakai AI Studio (opsional).",
      },
    },
    {
      name: "aiOutline",
      type: "json",
      label: "Outline AI",
      admin: {
        position: "sidebar",
        description: "Jejak audit: outline hasil AI Studio (opsional).",
      },
    },
  ],
};

