import type { CollectionConfig } from "payload";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: { useAsTitle: "name" },
  access: {
    read: () => true,
    create: () => true,
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
