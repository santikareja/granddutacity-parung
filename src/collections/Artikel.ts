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

export const Artikel: CollectionConfig = {
  slug: "artikel",
  labels: {
    singular: "Artikel",
    plural: "Artikels",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "kategori", "status", "publishedAt"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  versions: {
    drafts: { autosave: { interval: 3000 } },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
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
  ],
};

