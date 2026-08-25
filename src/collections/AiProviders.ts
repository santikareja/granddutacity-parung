import type { CollectionConfig, FieldHook } from "payload";

import { decryptSecret, encryptSecret, isEncrypted, isMasked, maskSecret } from "@/lib/ai/crypto";

// Enkripsi API key sebelum disimpan. Jika nilai masuk berupa mask (user tidak
// mengubah key di form) atau sudah terenkripsi, jangan enkripsi ulang.
//
// PENTING: kita TIDAK boleh memakai `originalDoc` sebagai sumber ciphertext lama.
// Payload membangun `originalDoc` lewat afterRead(), sehingga apiKey di sana sudah
// TERMASK ("••••…"). Memakainya akan menimpa ciphertext dengan mask dan merusak key
// secara permanen setiap kali record di-save ulang. `siblingDocWithLocales` berisi
// nilai DB mentah (ciphertext asli) tanpa field hook, jadi itu sumber yang benar.
const encryptApiKeyBeforeChange: FieldHook = ({
  value,
  siblingDocWithLocales,
}) => {
  const storedCiphertext = (siblingDocWithLocales?.apiKey as string | undefined) ?? value;

  if (typeof value !== "string" || value.length === 0) {
    // Tidak diubah: pertahankan ciphertext lama dari DB.
    return storedCiphertext;
  }
  if (isMasked(value)) {
    // User membiarkan mask apa adanya → pertahankan ciphertext lama dari DB.
    return storedCiphertext;
  }
  if (isEncrypted(value)) {
    return value;
  }
  return encryptSecret(value);
};

// Jangan pernah kirim API key mentah ke client. Tampilkan mask saja.
const maskApiKeyAfterRead: FieldHook = ({ value }) => {
  if (typeof value !== "string" || value.length === 0) return value;
  return maskSecret(value);
};

export const AiProviders: CollectionConfig = {
  slug: "ai-providers",
  labels: {
    singular: "AI Provider",
    plural: "Konfigurasi AI",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "baseUrl", "defaultModel", "isDefault"],
    group: "Pengaturan",
    description:
      "Provider AI OpenAI-compatible. Masukkan Base URL + API Key, deteksi model, lalu pilih model yang dipakai. API key dienkripsi.",
  },
  access: {
    // Konfigurasi AI berisi kredensial — batasi ke user login; hanya admin yang
    // boleh mengubah/menghapus.
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => user?.role === "admin",
    update: ({ req: { user } }) => user?.role === "admin",
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  hooks: {
    // Jaga hanya satu provider default: bila record ini di-set default, matikan
    // flag default pada record lain.
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        if (
          doc?.isDefault &&
          (operation === "create" || !previousDoc?.isDefault || previousDoc?.isDefault)
        ) {
          try {
            await req.payload.update({
              collection: "ai-providers",
              where: {
                and: [
                  { id: { not_equals: doc.id } },
                  { isDefault: { equals: true } },
                ],
              },
              data: { isDefault: false },
              overrideAccess: true,
              req,
            });
          } catch {
            // Non-fatal: kegagalan sinkronisasi flag default tidak boleh
            // menggagalkan penyimpanan record.
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Nama Provider",
      admin: { description: "Label internal, mis. 'OpenAI', 'Groq', 'Provider Custom'." },
    },
    {
      name: "baseUrl",
      type: "text",
      required: true,
      label: "Base URL (OpenAI-compatible)",
      admin: {
        description: "Contoh: https://api.openai.com/v1 atau https://api.provider.com/v1",
      },
    },
    {
      name: "apiKey",
      type: "text",
      required: true,
      label: "API Key",
      admin: {
        description: "Dienkripsi saat disimpan. Field menampilkan mask; kosongkan mask lalu isi ulang untuk mengganti.",
      },
      hooks: {
        beforeChange: [encryptApiKeyBeforeChange],
        afterRead: [maskApiKeyAfterRead],
      },
    },
    {
      name: "detectModelsUi",
      type: "ui",
      admin: {
        components: {
          Field: "@/payload/admin/components/AiModelPicker",
        },
      },
    },
    {
      name: "availableModels",
      type: "json",
      label: "Model Terdeteksi",
      admin: {
        description: "Daftar semua model dari provider (hasil deteksi). Read-only.",
        readOnly: true,
      },
    },
    {
      name: "models",
      type: "json",
      label: "Model Aktif",
      admin: {
        description: "Model yang boleh dipakai (array Model ID). Centang dari hasil deteksi via tombol di atas.",
      },
    },
    {
      name: "defaultModel",
      type: "text",
      label: "Model Default",
      admin: {
        description: "Model ID yang dipakai bila tugas AI tidak menentukan model tertentu.",
      },
    },
    {
      name: "isDefault",
      type: "checkbox",
      defaultValue: false,
      label: "Provider Default",
      admin: {
        position: "sidebar",
        description: "Provider yang dipakai AI Studio & tombol AI. Hanya satu yang aktif.",
      },
    },
  ],
};

// Helper server-side: dekripsi API key dari doc provider (dipakai runtime).
export const decryptProviderApiKey = (encryptedKey: string): string =>
  decryptSecret(encryptedKey);
