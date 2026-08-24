import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  // Eksplisit: hanya admin yang boleh mengelola user & menaikkan role.
  // Tanpa ini, default Payload (Boolean(user)) memperbolehkan user ber-role
  // apa pun (termasuk "ai-agent") membuat/mengubah akun dan mengeskalasi
  // role-nya sendiri menjadi admin.
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => user?.role === "admin",
    update: ({ req: { user } }) => user?.role === "admin",
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "select",
      options: [
        { label: "Admin", value: "admin" },
        { label: "AI Agent", value: "ai-agent" },
      ],
      defaultValue: "admin",
    },
  ],
};
