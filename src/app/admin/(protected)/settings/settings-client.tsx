"use client";

import { useCallback, useMemo, useState } from "react";

import { AdminClientError, adminPut } from "@/lib/v2-admin/api-client";

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

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#64748b]";

const labelClass = "block text-sm font-medium text-[#334155]";

const primaryBtn =
  "rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e0951c] disabled:cursor-not-allowed disabled:opacity-50";

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
        <h1 className="text-xl font-semibold text-[#0f172a]">Pengaturan</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          {canManage
            ? "Kelola pengaturan situs. Perubahan berlaku setelah disimpan."
            : "Pengaturan situs (hanya-baca). Perlu hak admin untuk mengubah."}
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {initialItems.length === 0 ? (
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
          <p className="text-sm text-[#64748b]">
            Belum ada pengaturan. Jalankan migrasi database untuk menyemai nilai
            awal.
          </p>
        </section>
      ) : (
        <>
          {groups.map((group) => (
            <section
              key={group.id}
              className="rounded-xl border border-[#e2e8f0] bg-white p-5"
            >
              <div className="border-b border-[#eef2f7] pb-3">
                <h2 className="text-sm font-semibold text-[#334155]">
                  {group.label}
                </h2>
                {group.description ? (
                  <p className="mt-0.5 text-xs text-[#94a3b8]">
                    {group.description}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 space-y-4">
                {group.items.map((item) => {
                  const fieldId = `setting-${item.key}`;
                  return (
                    <div key={item.key}>
                      <label className={labelClass} htmlFor={fieldId}>
                        {item.label ?? item.key}
                      </label>
                      {item.description ? (
                        <p className="mt-0.5 text-xs text-[#94a3b8]">
                          {item.description}
                        </p>
                      ) : null}
                      {isTextareaType(item.type) ? (
                        <textarea
                          id={fieldId}
                          className={`mt-1.5 ${inputClass}`}
                          rows={4}
                          value={values[item.key] ?? ""}
                          onChange={(e) => setValue(item.key, e.target.value)}
                          disabled={!canManage || saving}
                        />
                      ) : (
                        <input
                          id={fieldId}
                          type={inputType(item.type)}
                          className={`mt-1.5 ${inputClass}`}
                          value={values[item.key] ?? ""}
                          onChange={(e) => setValue(item.key, e.target.value)}
                          disabled={!canManage || saving}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {canManage ? (
            <div className="flex justify-end">
              <button
                type="button"
                className={primaryBtn}
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? "Menyimpan…" : "Simpan perubahan"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
