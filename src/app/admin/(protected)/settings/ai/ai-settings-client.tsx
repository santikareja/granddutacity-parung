"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Pencil, Plus, ScanSearch, Trash2 } from "lucide-react";

import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminCheckbox,
  AdminInput,
  AdminLabel,
  AdminPageHeader,
  AdminSelect,
} from "@/components/admin/ui";

export type ProviderForClient = {
  id: number;
  name: string;
  baseUrl: string;
  apiKeyMasked: string;
  availableModels: string[];
  models: string[];
  defaultModel: string | null;
  isDefault: boolean;
  updatedAt: string;
};

type FormState = {
  id: number | null;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  availableModels: string[];
  defaultModel: string;
  isDefault: boolean;
};

const emptyForm: FormState = {
  id: null,
  name: "",
  baseUrl: "",
  apiKey: "",
  models: [],
  availableModels: [],
  defaultModel: "",
  isDefault: false,
};

const PRESETS = [
  { label: "OpenAI", url: "https://api.openai.com/v1" },
  { label: "Groq", url: "https://api.groq.com/openai/v1" },
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1" },
  { label: "DeepSeek", url: "https://api.deepseek.com/v1" },
];

export default function AiSettingsClient({
  initialProviders,
  aiEnvFallbackActive,
}: {
  initialProviders: ProviderForClient[];
  aiEnvFallbackActive: boolean;
}) {
  const [providers, setProviders] = useState(initialProviders);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(initialProviders.length === 0);

  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/v2/ai-providers");
    const data = await response.json();
    if (response.ok) setProviders(data.providers ?? []);
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
    setNotice(null);
  };

  const startEdit = (provider: ProviderForClient) => {
    setForm({
      id: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      // Mask ditampilkan; biarkan apa adanya agar key lama dipertahankan.
      apiKey: provider.apiKeyMasked,
      models: provider.models,
      availableModels: provider.availableModels,
      defaultModel: provider.defaultModel ?? "",
      isDefault: provider.isDefault,
    });
    setShowForm(true);
    setError(null);
    setNotice(null);
  };

  const detectModels = useCallback(async () => {
    setDetecting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/v2/ai-providers/detect-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: form.id,
          baseUrl: form.baseUrl,
          // Kirim key hanya bila user mengetik key baru (bukan mask).
          apiKey: form.apiKey.startsWith("••") ? undefined : form.apiKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal mendeteksi model.");

      const detected: string[] = data.models ?? [];
      setForm((prev) => ({ ...prev, availableModels: detected }));
      setNotice(`${detected.length} model terdeteksi. Centang yang ingin dipakai.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendeteksi model.");
    } finally {
      setDetecting(false);
    }
  }, [form.id, form.baseUrl, form.apiKey]);

  const toggleModel = (modelId: string) => {
    setForm((prev) => {
      const has = prev.models.includes(modelId);
      const models = has
        ? prev.models.filter((m) => m !== modelId)
        : [...prev.models, modelId];
      return {
        ...prev,
        models,
        defaultModel:
          !has && !prev.defaultModel ? modelId : has && prev.defaultModel === modelId ? (models[0] ?? "") : prev.defaultModel,
      };
    });
  };

  const save = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);
      setError(null);
      setNotice(null);

      try {
        const isUpdate = form.id !== null;
        const response = await fetch(
          isUpdate ? `/api/v2/ai-providers/${form.id}` : "/api/v2/ai-providers",
          {
            method: isUpdate ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              baseUrl: form.baseUrl,
              // Mask tidak dikirim sebagai key baru.
              apiKey: form.apiKey.startsWith("••") ? undefined : form.apiKey,
              models: form.models,
              availableModels: form.availableModels,
              defaultModel: form.defaultModel,
              isDefault: form.isDefault,
            }),
          },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Gagal menyimpan.");

        await refresh();
        setNotice(
          isUpdate ? "Provider diperbarui." : "Provider berhasil ditambahkan.",
        );
        setShowForm(false);
        setForm(emptyForm);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      } finally {
        setSaving(false);
      }
    },
    [form, refresh],
  );

  const remove = useCallback(
    async (provider: ProviderForClient) => {
      if (
        !window.confirm(
          `Hapus provider "${provider.name}"? API key-nya akan hilang permanen.`,
        )
      ) {
        return;
      }

      setError(null);
      try {
        const response = await fetch(`/api/v2/ai-providers/${provider.id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Gagal menghapus.");
        await refresh();
        setNotice("Provider dihapus.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menghapus.");
      }
    },
    [refresh],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminPageHeader
        title="Konfigurasi AI"
        description="Provider OpenAI-compatible. API key dienkripsi (AES-256-GCM) sebelum disimpan dan tidak pernah dikirim balik ke browser."
        actions={
          <AdminButton type="button" variant="primary" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Provider Baru
          </AdminButton>
        }
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {notice ? <AdminAlert variant="success">{notice}</AdminAlert> : null}

      {providers.length === 0 && aiEnvFallbackActive ? (
        <AdminAlert variant="warning">
          Belum ada provider di database, tetapi AI tetap aktif memakai variabel
          environment <code className="font-mono">AI_BASE_URL</code>/
          <code className="font-mono">AI_MODEL</code>. Tambahkan provider di sini
          agar bisa mengganti model tanpa redeploy.
        </AdminAlert>
      ) : null}

      {providers.length > 0 ? (
        <AdminCard className="overflow-hidden">
          <ul className="divide-y divide-admin-border">
            {providers.map((provider) => (
              <li
                key={provider.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-admin-fg">
                      {provider.name}
                    </p>
                    {provider.isDefault ? (
                      <AdminBadge tone="accent">
                        <CheckCircle2 className="h-3 w-3" />
                        Default
                      </AdminBadge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-admin-fg-muted">
                    {provider.baseUrl}
                  </p>
                  <p className="mt-0.5 text-xs text-admin-fg-muted">
                    Key {provider.apiKeyMasked} &middot; {provider.models.length} model
                    aktif
                    {provider.defaultModel ? ` · default: ${provider.defaultModel}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => startEdit(provider)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </AdminButton>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => void remove(provider)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </AdminButton>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      {showForm ? (
        <AdminCard>
          <form onSubmit={save}>
            <AdminCardBody>
              <h2 className="text-base font-semibold text-admin-fg">
                {form.id ? `Edit: ${form.name}` : "Tambah Provider"}
              </h2>

              <div className="space-y-1.5">
                <AdminLabel htmlFor="prov-name">Nama</AdminLabel>
                <AdminInput
                  id="prov-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="OpenAI"
                />
              </div>

              <div className="space-y-1.5">
                <AdminLabel htmlFor="prov-url">Base URL</AdminLabel>
                <AdminInput
                  id="prov-url"
                  required
                  value={form.baseUrl}
                  onChange={(e) => setForm((p) => ({ ...p, baseUrl: e.target.value }))}
                  placeholder="https://api.openai.com/v1"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESETS.map((preset) => (
                    <AdminButton
                      key={preset.url}
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          baseUrl: preset.url,
                          name: p.name || preset.label,
                        }))
                      }
                    >
                      {preset.label}
                    </AdminButton>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <AdminLabel htmlFor="prov-key">API Key</AdminLabel>
                <AdminInput
                  id="prov-key"
                  className="font-mono"
                  type="text"
                  autoComplete="off"
                  value={form.apiKey}
                  onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  required={form.id === null}
                />
                {form.id !== null ? (
                  <p className="text-xs text-admin-fg-muted">
                    Menampilkan mask. Biarkan seperti ini untuk mempertahankan key
                    lama, atau hapus lalu ketik key baru untuk menggantinya.
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-admin-border bg-admin-surface-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-admin-fg">Model</p>
                  <AdminButton
                    type="button"
                    variant="dark"
                    onClick={() => void detectModels()}
                    disabled={detecting || !form.baseUrl}
                  >
                    <ScanSearch className="h-4 w-4" />
                    {detecting ? "Mendeteksi…" : "Deteksi Model"}
                  </AdminButton>
                </div>

                {form.availableModels.length > 0 ? (
                  <div className="admin-scrollbar mt-3 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-admin-border bg-admin-surface p-3">
                    {form.availableModels.map((modelId) => (
                      <label
                        key={modelId}
                        className="flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1 text-sm hover:bg-admin-surface-hover"
                      >
                        <AdminCheckbox
                          checked={form.models.includes(modelId)}
                          onChange={() => toggleModel(modelId)}
                        />
                        <span className="font-mono text-xs">{modelId}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-admin-fg-muted">
                    {form.models.length > 0
                      ? `Model aktif: ${form.models.join(", ")}. Klik "Deteksi Model" untuk memuat daftar lengkap.`
                      : "Klik \"Deteksi Model\" setelah Base URL dan API Key terisi."}
                  </p>
                )}

                {form.models.length > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    <AdminLabel htmlFor="prov-default-model">
                      Model default
                    </AdminLabel>
                    <AdminSelect
                      id="prov-default-model"
                      value={form.defaultModel}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, defaultModel: e.target.value }))
                      }
                    >
                      {form.models.map((modelId) => (
                        <option key={modelId} value={modelId}>
                          {modelId}
                        </option>
                      ))}
                    </AdminSelect>
                  </div>
                ) : null}
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-admin-fg">
                <AdminCheckbox
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isDefault: e.target.checked }))
                  }
                />
                <span>
                  Jadikan provider default
                  <span className="ml-1 text-xs text-admin-fg-muted">
                    (dipakai AI Studio &amp; tombol AI)
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap gap-3 border-t border-admin-border pt-4">
                <AdminButton type="submit" variant="primary" disabled={saving}>
                  {saving ? "Menyimpan…" : form.id ? "Simpan Perubahan" : "Simpan Provider"}
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                    setError(null);
                  }}
                >
                  Batal
                </AdminButton>
              </div>
            </AdminCardBody>
          </form>
        </AdminCard>
      ) : null}
    </div>
  );
}
