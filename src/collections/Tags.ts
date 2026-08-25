import type { CollectionConfig } from "payload";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: { useAsTitle: "name", group: "Konten" },
  access: {
    // Tag boleh dibaca publik (dipakai frontend artikel), tetapi membuat,
    // mengubah, dan menghapus wajib user login. Sebelumnya create terbuka
    // untuk siapa pun sehingga endpoint POST /api/tags bisa disalahgunakan.
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      admin: { description: "Diisi otomatis dari name" },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.name && !data.slug) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }

        return data;
      },
    ],
  },
};
