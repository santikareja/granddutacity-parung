import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "alt", "updatedAt", "filename"],
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
  ],
};
