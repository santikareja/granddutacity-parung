import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "alt", "updatedAt", "filename"],
    group: "Media",
  },
  upload: {
    disableLocalStorage: true,
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Nama media",
      admin: {
        description: "Nama internal media agar mudah dicari di library.",
      },
    },
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alt Text (Wajib untuk SEO)",
    },
    {
      name: "caption",
      type: "textarea",
      label: "Caption / Keterangan",
      admin: {
        description: "Opsional. Gunakan untuk keterangan singkat gambar.",
      },
    },
    {
      name: "source",
      type: "select",
      label: "Sumber Gambar",
      defaultValue: "upload",
      options: [
        { label: "Upload", value: "upload" },
        { label: "Unsplash", value: "unsplash" },
        { label: "Pexels", value: "pexels" },
      ],
      admin: {
        position: "sidebar",
        description: "Jejak sumber gambar untuk pemenuhan lisensi.",
      },
    },
    {
      name: "sourceId",
      type: "text",
      label: "ID Sumber",
      admin: {
        position: "sidebar",
        description: "ID foto di provider stok (Unsplash/Pexels).",
      },
    },
    {
      name: "attributionUrl",
      type: "text",
      label: "URL Atribusi",
      admin: {
        position: "sidebar",
        description: "Link kredit fotografer/halaman sumber bila diwajibkan lisensi.",
      },
    },
  ],
};
