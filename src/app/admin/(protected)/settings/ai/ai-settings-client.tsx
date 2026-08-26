"use client";

import { useCallback, useState } from "react";

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

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";

const labelClass = "block text-sm font-medium text-[#334155]";

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
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Konfigurasi AI</h1>
          <p className="mt-1 text-sm text-[#475467]">
            Provider OpenAI-compatible. API key dienkripsi (AES-256-GCM) sebelum
            disimpan dan tidak pernah dikirim balik ke browser.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f]"
        >
          + Provider Baru
        </button>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      {providers.length === 0 && aiEnvFallbackActive ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Belum ada provider di database, tetapi AI tetap aktif memakai variabel
          environment <code className="font-mono">AI_BASE_URL</code>/
          <code className="font-mono">AI_MODEL</code>. Tambahkan provider di sini
          agar bisa mengganti model tanpa redeploy.
        </p>
      ) : null}

      {providers.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
          <ul className="divide-y divide-[#eef2f7]">
            {providers.map((provider) => (
              <li
                key={provider.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{provider.name}</p>
                    {provider.isDefault ? (
                      <span className="rounded-full bg-[#fff5ea] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#A85D16]">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-[#64748b]">
                    {provider.baseUrl}
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748b]">
                    Key {provider.apiKeyMasked} &middot; {provider.models.length} model
                    aktif
                    {provider.defaultModel ? ` · default: ${provider.defaultModel}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(provider)}
                    className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm transition hover:bg-[#f1f5f9]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(provider)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showForm ? (
        <form
          onSubmit={save}
          className="space-y-5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold">
            {form.id ? `Edit: ${form.name}` : "Tambah Provider"}
          </h2>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="prov-name">
              Nama
            </label>
            <input
              id="prov-name"
              className={inputClass}
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="OpenAI"
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="prov-url">
              Base URL
            </label>
            <input
              id="prov-url"
              className={inputClass}
              required
              value={form.baseUrl}
              onChange={(e) => setForm((p) => ({ ...p, baseUrl: e.target.value }))}
              placeholder="https://api.openai.com/v1"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      baseUrl: preset.url,
                      name: p.name || preset.label,
                    }))
                  }
                  className="rounded-md border border-[#e2e8f0] px-2 py-1 text-xs text-[#475467] transition hover:border-[#F5A524] hover:bg-[#fff5ea]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="prov-key">
              API Key
            </label>
            <input
              id="prov-key"
              className={`${inputClass} font-mono`}
              type="text"
              autoComplete="off"
              value={form.apiKey}
              onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
              placeholder="sk-..."
              required={form.id === null}
            />
            {form.id !== null ? (
              <p className="text-xs text-[#64748b]">
                Menampilkan mask. Biarkan seperti ini untuk mempertahankan key
                lama, atau hapus lalu ketik key baru untuk menggantinya.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium">Model</p>
              <button
                type="button"
                onClick={() => void detectModels()}
                disabled={detecting || !form.baseUrl}
                className="rounded-lg bg-[#0f172a] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#1e293b] disabled:opacity-50"
              >
                {detecting ? "Mendeteksi…" : "Deteksi Model"}
              </button>
            </div>

            {form.availableModels.length > 0 ? (
              <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white p-3">
                {form.availableModels.map((modelId) => (
                  <label
                    key={modelId}
                    className="flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1 text-sm hover:bg-[#f8fafc]"
                  >
                    <input
                      type="checkbox"
                      checked={form.models.includes(modelId)}
                      onChange={() => toggleModel(modelId)}
                      className="h-4 w-4 accent-[#F5A524]"
                    />
                    <span className="font-mono text-xs">{modelId}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#64748b]">
                {form.models.length > 0
                  ? `Model aktif: ${form.models.join(", ")}. Klik "Deteksi Model" untuk memuat daftar lengkap.`
                  : "Klik \"Deteksi Model\" setelah Base URL dan API Key terisi."}
              </p>
            )}

            {form.models.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                <label className={labelClass} htmlFor="prov-default-model">
                  Model default
                </label>
                <select
                  id="prov-default-model"
                  className={inputClass}
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
                </select>
              </div>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm((p) => ({ ...p, isDefault: e.target.checked }))
              }
              className="h-4 w-4 accent-[#F5A524]"
            />
            <span>
              Jadikan provider default
              <span className="ml-1 text-xs text-[#64748b]">
                (dipakai AI Studio &amp; tombol AI)
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3 border-t border-[#eef2f7] pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#F5A524] px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : form.id ? "Simpan Perubahan" : "Simpan Provider"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
                setError(null);
              }}
              className="rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-sm transition hover:bg-[#f1f5f9]"
            >
              Batal
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
