"use client";

import { useCallback, useMemo, useState } from "react";
import { Save } from "lucide-react";

import { AdminClientError, adminPut } from "@/lib/v2-admin/api-client";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminInput,
  AdminLabel,
  AdminTextarea,
} from "@/components/admin/ui";

export type SettingItem = {
  key: string;
  value: string | null;
  type: string;
  group: string;
  label: string | null;
  description: string | null;
};

type Props = {
  initialItems: SettingItem[];
  canManage: boolean;
};

// Urutan & label grup yang ditampilkan. Grup lain (tak dikenal) tetap
// dirender di bawah dengan judul apa adanya.
const GROUP_ORDER: { id: string; label: string; description: string }[] = [
  { id: "general", label: "Umum", description: "Identitas dasar situs." },
  { id: "contact", label: "Kontak", description: "Informasi kontak & WhatsApp." },
  { id: "social", label: "Sosial", description: "Tautan media sosial." },
  { id: "seo", label: "SEO", description: "Nilai default metadata SEO." },
];

const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof AdminClientError ? err.message : fallback;

const isTextareaType = (type: string): boolean =>
  type === "json" || type === "html";

const inputType = (type: string): string => (type === "url" ? "url" : "text");

export default function SettingsClient({ initialItems, canManage }: Props) {
  // Nilai form per key (string; null direpresentasikan sebagai "").
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const item of initialItems) init[item.key] = item.value ?? "";
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Nilai awal untuk deteksi perubahan (dirty).
  const initialValues = useMemo(() => {
    const init: Record<string, string> = {};
    for (const item of initialItems) init[item.key] = item.value ?? "";
    return init;
  }, [initialItems]);

  // Kelompokkan item per grup mengikuti GROUP_ORDER, lalu grup lain-lain.
  const groups = useMemo(() => {
    const byGroup = new Map<string, SettingItem[]>();
    for (const item of initialItems) {
      const list = byGroup.get(item.group) ?? [];
      list.push(item);
      byGroup.set(item.group, list);
    }

    const ordered: { id: string; label: string; description: string; items: SettingItem[] }[] =
      [];

    for (const meta of GROUP_ORDER) {
      const list = byGroup.get(meta.id);
      if (list && list.length > 0) {
        ordered.push({ ...meta, items: list });
        byGroup.delete(meta.id);
      }
    }
    // Grup tak dikenal (jika ada) tetap ditampilkan.
    for (const [id, list] of byGroup) {
      ordered.push({ id, label: id, description: "", items: list });
    }

    return ordered;
  }, [initialItems]);

  const setValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  }, []);

  const handleSave = useCallback(async () => {
    // Kirim hanya key yang berubah.
    const changed: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value !== (initialValues[key] ?? "")) changed[key] = value;
    }

    if (Object.keys(changed).length === 0) {
      setSuccess("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminPut("/api/v2/settings", { body: { settings: changed } });
      setSuccess("Pengaturan tersimpan.");
    } catch (err) {
      setError(errorMessage(err, "Gagal menyimpan pengaturan."));
    } finally {
      setSaving(false);
    }
  }, [values, initialValues]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-admin-fg">Pengaturan</h1>
        <p className="mt-1 text-sm text-admin-fg-muted">
          {canManage
            ? "Kelola pengaturan situs. Perubahan berlaku setelah disimpan."
            : "Pengaturan situs (hanya-baca). Perlu hak admin untuk mengubah."}
        </p>
      </header>

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {success ? <AdminAlert variant="success">{success}</AdminAlert> : null}

      {initialItems.length === 0 ? (
        <AdminCard>
          <AdminCardBody>
            <p className="text-sm text-admin-fg-muted">
              Belum ada pengaturan. Jalankan migrasi database untuk menyemai
              nilai awal.
            </p>
          </AdminCardBody>
        </AdminCard>
      ) : (
        <>
          {groups.map((group) => (
            <AdminCard key={group.id}>
              <AdminCardBody>
                <div className="border-b border-admin-border pb-3">
                  <h2 className="text-sm font-semibold text-admin-fg">
                    {group.label}
                  </h2>
                  {group.description ? (
                    <p className="mt-0.5 text-xs text-admin-fg-dim">
                      {group.description}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {group.items.map((item) => {
                    const fieldId = `setting-${item.key}`;
                    return (
                      <div key={item.key} className="space-y-1.5">
                        <AdminLabel htmlFor={fieldId}>
                          {item.label ?? item.key}
                        </AdminLabel>
                        {item.description ? (
                          <p className="text-xs text-admin-fg-dim">
                            {item.description}
                          </p>
                        ) : null}
                        {isTextareaType(item.type) ? (
                          <AdminTextarea
                            id={fieldId}
                            rows={4}
                            value={values[item.key] ?? ""}
                            onChange={(e) => setValue(item.key, e.target.value)}
                            disabled={!canManage || saving}
                          />
                        ) : (
                          <AdminInput
                            id={fieldId}
                            type={inputType(item.type)}
                            value={values[item.key] ?? ""}
                            onChange={(e) => setValue(item.key, e.target.value)}
                            disabled={!canManage || saving}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </AdminCardBody>
            </AdminCard>
          ))}

          {canManage ? (
            <div className="flex justify-end">
              <AdminButton
                type="button"
                variant="primary"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan…" : "Simpan perubahan"}
              </AdminButton>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
