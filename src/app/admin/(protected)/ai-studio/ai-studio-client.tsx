"use client";

// Wizard AI Studio: ide topik → 7 judul → outline (bisa diedit) → artikel →
// simpan sebagai draft lalu buka editor untuk finishing.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type OutlineSection = { heading: string; subheadings: string[] };

type Step = "topic" | "titles" | "outline" | "preview";

type Option = { id: number; name: string };

// Provider AI untuk pemilih model (api_key sudah dimask di server).
type ProviderOption = {
  id: number;
  name: string;
  models: string[];
  defaultModel: string | null;
};

type SeoResult = {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  focusKeyword: string;
};

type Props = {
  aiEnabled: boolean;
  aiModel: string | null;
  aiProviderName: string | null;
  categories: Option[];
};

const STEPS: { key: Step; label: string }[] = [
  { key: "topic", label: "1. Topik" },
  { key: "titles", label: "2. Judul" },
  { key: "outline", label: "3. Outline" },
  { key: "preview", label: "4. Artikel" },
];

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";

export default function AiStudioClient({
  aiEnabled,
  aiModel,
  aiProviderName,
  categories,
}: Props) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("topic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [articleHtml, setArticleHtml] = useState("");
  const [articleContent, setArticleContent] = useState<unknown>(null);
  const [categoryId, setCategoryId] = useState<number | "">(
    categories[0]?.id ?? "",
  );

  // Pemilih provider + model (opsional). Kosong = pakai default server.
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providerId, setProviderId] = useState<number | "">("");
  const [model, setModel] = useState("");

  // SEO inline di langkah pratinjau.
  const [seo, setSeo] = useState<SeoResult | null>(null);

  // Ambil daftar provider untuk pemilih model. Butuh hak admin; bila gagal
  // (mis. bukan admin), diamkan saja dan biarkan memakai default server.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/v2/ai-providers", {
          headers: { accept: "application/json" },
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          providers?: ProviderOption[];
        };
        if (active && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      } catch {
        // abaikan: pemilih model bersifat opsional.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Parameter provider/model untuk disisipkan ke body request AI. Hanya dikirim
  // bila user benar-benar memilih; jika tidak, server memakai default.
  const aiParams = useCallback((): Record<string, unknown> => {
    const params: Record<string, unknown> = {};
    if (typeof providerId === "number") params.providerId = providerId;
    if (model.trim()) params.model = model.trim();
    return params;
  }, [providerId, model]);

  const selectedProvider = providers.find((p) => p.id === providerId) ?? null;

  const post = useCallback(
    async <T,>(path: string, body: Record<string, unknown>): Promise<T> => {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Permintaan gagal.");
      return data as T;
    },
    [],
  );

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setLoading(true);
      setError(null);
      try {
        await task();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const generateTitles = () =>
    run(async () => {
      const data = await post<{ titles: string[] }>("/api/v2/ai/titles", {
        topic: topic.trim(),
        ...aiParams(),
      });
      setTitles(data.titles);
      setSelectedTitle("");
      setStep("titles");
    });

  const generateOutline = () =>
    run(async () => {
      const data = await post<{ sections: OutlineSection[] }>(
        "/api/v2/ai/outline",
        { title: selectedTitle, ...aiParams() },
      );
      setOutline(data.sections);
      setStep("outline");
    });

  const generateArticle = () =>
    run(async () => {
      const data = await post<{ html: string; content: unknown }>(
        "/api/v2/ai/article",
        { title: selectedTitle, outline, ...aiParams() },
      );
      setArticleHtml(data.html);
      setArticleContent(data.content);
      setSeo(null);
      setStep("preview");
    });

  const generateSeo = () =>
    run(async () => {
      const data = await post<SeoResult>("/api/v2/ai/seo", {
        title: selectedTitle,
        content: articleContent,
        ...aiParams(),
      });
      setSeo(data);
    });

  const saveDraft = () =>
    run(async () => {
      const data = await post<{ article: { id: number } }>("/api/v2/articles", {
        title: selectedTitle,
        content: articleContent,
        status: "draft",
        aiGenerated: true,
        aiTopic: topic.trim(),
        aiOutline: outline,
        // Sertakan SEO bila sudah di-generate; jika tidak, fallback keyword topik.
        seoMetaTitle: seo?.metaTitle || undefined,
        seoMetaDescription: seo?.metaDescription || undefined,
        seoFocusKeyword: seo?.focusKeyword || topic.trim(),
        slug: seo?.slug || undefined,
        categoryIds: categoryId ? [categoryId] : [],
      });

      router.push(`/admin/articles/${data.article.id}`);
    });

  const updateHeading = (index: number, value: string) =>
    setOutline((prev) =>
      prev.map((s, i) => (i === index ? { ...s, heading: value } : s)),
    );

  const updateSub = (sectionIndex: number, subIndex: number, value: string) =>
    setOutline((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              subheadings: s.subheadings.map((sub, j) =>
                j === subIndex ? value : sub,
              ),
            }
          : s,
      ),
    );

  const removeSection = (index: number) =>
    setOutline((prev) => prev.filter((_, i) => i !== index));

  const addSection = () =>
    setOutline((prev) => [...prev, { heading: "", subheadings: [] }]);

  const addSub = (sectionIndex: number) =>
    setOutline((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, subheadings: [...s.subheadings, ""] }
          : s,
      ),
    );

  const removeSub = (sectionIndex: number, subIndex: number) =>
    setOutline((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              subheadings: s.subheadings.filter((_, j) => j !== subIndex),
            }
          : s,
      ),
    );

  if (!aiEnabled) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">AI Studio</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <p className="font-medium">Layanan AI belum aktif.</p>
          <p className="mt-1.5">
            Tambahkan provider (Base URL + API Key) dan tandai satu sebagai
            default di{" "}
            <Link
              href="/admin/settings/ai"
              className="font-semibold underline"
            >
              Konfigurasi AI
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const doneSteps = STEPS.slice(0, STEPS.findIndex((s) => s.key === step)).map(
    (s) => s.key,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5A524]">
            AI Content Studio
          </p>
          <Link
            href="/admin/ai-studio/history"
            className="text-xs font-medium text-[#475467] underline-offset-2 hover:text-[#A85D16] hover:underline"
          >
            Riwayat Tugas AI
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Buat Artikel dengan AI
        </h1>
        <p className="mt-1.5 text-sm text-[#475467]">
          Alur bertahap dengan persetujuan Anda di setiap langkah.
          {aiModel ? (
            <>
              {" "}
              Model aktif:{" "}
              <span className="font-mono text-xs">{aiModel}</span>
              {aiProviderName ? ` (${aiProviderName})` : ""}
            </>
          ) : null}
        </p>
      </header>

      {providers.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#e2e8f0] bg-white p-3">
          <div className="space-y-1">
            <label
              className="block text-xs font-medium text-[#64748b]"
              htmlFor="ai-provider"
            >
              Provider (opsional)
            </label>
            <select
              id="ai-provider"
              className={`${inputClass} w-52`}
              value={providerId}
              onChange={(event) => {
                setProviderId(
                  event.target.value ? Number(event.target.value) : "",
                );
                setModel("");
              }}
            >
              <option value="">Default server</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProvider && selectedProvider.models.length > 0 ? (
            <div className="space-y-1">
              <label
                className="block text-xs font-medium text-[#64748b]"
                htmlFor="ai-model"
              >
                Model (opsional)
              </label>
              <select
                id="ai-model"
                className={`${inputClass} w-52`}
                value={model}
                onChange={(event) => setModel(event.target.value)}
              >
                <option value="">
                  {selectedProvider.defaultModel
                    ? `Default (${selectedProvider.defaultModel})`
                    : "Default provider"}
                </option>
                {selectedProvider.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STEPS.map((item) => (
          <span
            key={item.key}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              item.key === step
                ? "bg-[#fff5ea] text-[#A85D16] ring-1 ring-[#F5A524]"
                : doneSteps.includes(item.key)
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-white text-[#94a3b8] ring-1 ring-[#e2e8f0]"
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {step === "topic" ? (
        <section className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium text-[#334155]"
              htmlFor="ai-topic"
            >
              Ide topik artikel
            </label>
            <textarea
              id="ai-topic"
              className={`${inputClass} min-h-28 resize-y`}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Contoh: Tips memilih rumah pertama di kawasan Parung"
            />
          </div>
          <button
            type="button"
            onClick={() => void generateTitles()}
            disabled={loading || !topic.trim()}
            className="rounded-lg bg-[#F5A524] px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
          >
            {loading ? "Menghasilkan…" : "Generate 7 Judul"}
          </button>
        </section>
      ) : null}

      {step === "titles" ? (
        <section className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <p className="text-sm font-medium text-[#334155]">Pilih satu judul</p>
          <div className="space-y-2">
            {titles.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => setSelectedTitle(title)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                  selectedTitle === title
                    ? "border-[#F5A524] bg-[#fff5ea] font-semibold"
                    : "border-[#e2e8f0] hover:border-[#F5A524] hover:bg-[#fffaf3]"
                }`}
              >
                {title}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[#eef2f7] pt-4">
            <button
              type="button"
              onClick={() => setStep("topic")}
              className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm transition hover:bg-[#f1f5f9]"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => void generateTitles()}
              disabled={loading}
              className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm transition hover:bg-[#f1f5f9] disabled:opacity-50"
            >
              Generate ulang
            </button>
            <button
              type="button"
              onClick={() => void generateOutline()}
              disabled={loading || !selectedTitle}
              className="rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
            >
              {loading ? "Menghasilkan…" : "Generate Outline"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "outline" ? (
        <section className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div>
            <p className="text-sm font-medium text-[#334155]">
              Tinjau &amp; edit outline
            </p>
            <p className="mt-0.5 text-xs text-[#64748b]">
              Judul: <span className="font-medium">{selectedTitle}</span>
            </p>
          </div>

          <div className="space-y-3">
            {outline.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="space-y-2 rounded-lg border border-[#e2e8f0] p-3"
              >
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} font-medium`}
                    value={section.heading}
                    onChange={(event) =>
                      updateHeading(sectionIndex, event.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(sectionIndex)}
                    title="Hapus bagian"
                    className="shrink-0 rounded-lg border border-red-200 px-3 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
                {section.subheadings.map((sub, subIndex) => (
                  <div key={subIndex} className="flex items-center gap-2">
                    <input
                      className={`${inputClass} ml-4 text-xs`}
                      value={sub}
                      onChange={(event) =>
                        updateSub(sectionIndex, subIndex, event.target.value)
                      }
                      placeholder="Sub-poin (H3)"
                    />
                    <button
                      type="button"
                      onClick={() => removeSub(sectionIndex, subIndex)}
                      title="Hapus sub-poin"
                      className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 transition hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSub(sectionIndex)}
                  className="ml-4 rounded-lg border border-dashed border-[#cbd5e1] px-3 py-1 text-xs text-[#475467] transition hover:border-[#F5A524] hover:bg-[#fffaf3]"
                >
                  + Tambah Sub-poin
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSection}
            className="w-full rounded-lg border border-dashed border-[#cbd5e1] px-4 py-2 text-sm text-[#475467] transition hover:border-[#F5A524] hover:bg-[#fffaf3]"
          >
            + Tambah Bagian
          </button>

          <div className="flex flex-wrap gap-2 border-t border-[#eef2f7] pt-4">
            <button
              type="button"
              onClick={() => setStep("titles")}
              className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm transition hover:bg-[#f1f5f9]"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => void generateArticle()}
              disabled={loading || outline.length === 0}
              className="rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
            >
              {loading ? "Menulis artikel…" : "Setujui & Tulis Artikel"}
            </button>
          </div>
          {loading ? (
            <p className="text-xs text-[#64748b]">
              Menulis 900–1.200 kata bisa memakan waktu hingga beberapa menit.
              Jangan tutup halaman ini.
            </p>
          ) : null}
        </section>
      ) : null}

      {step === "preview" ? (
        <section className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div>
            <p className="text-sm font-medium text-[#334155]">
              Pratinjau artikel
            </p>
            <p className="mt-0.5 text-xs text-[#64748b]">
              CTA ke homepage sudah ditambahkan otomatis di akhir artikel.
            </p>
          </div>

          <div
            className="gdc-editor max-h-[420px] overflow-y-auto rounded-lg border border-[#e2e8f0] bg-[#fdfdfd] p-4 text-sm"
            // Field `html` sudah disanitasi di server dengan sanitizeAiHtml()
            // (membuang tag/atribut aktif dan skema URL berbahaya) sebelum dirender di sini.
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          <div className="space-y-3 rounded-lg border border-[#e2e8f0] bg-[#fbfcfe] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[#334155]">SEO</p>
              <button
                type="button"
                onClick={() => void generateSeo()}
                disabled={loading || !articleContent}
                className="rounded-lg border border-[#F5A524] bg-[#fff5ea] px-3 py-1.5 text-xs font-semibold text-[#A85D16] transition hover:bg-[#ffedd6] disabled:opacity-50"
              >
                {loading ? "Memproses…" : seo ? "Generate ulang SEO" : "Generate SEO"}
              </button>
            </div>
            {seo ? (
              <dl className="space-y-2 text-xs text-[#475467]">
                <div>
                  <dt className="font-semibold text-[#334155]">Meta Title</dt>
                  <dd>{seo.metaTitle || "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#334155]">
                    Meta Description
                  </dt>
                  <dd>{seo.metaDescription || "—"}</dd>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <dt className="font-semibold text-[#334155]">Slug</dt>
                    <dd className="font-mono">{seo.slug || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#334155]">
                      Focus Keyword
                    </dt>
                    <dd>{seo.focusKeyword || "—"}</dd>
                  </div>
                </div>
                <p className="pt-1 text-[11px] text-[#94a3b8]">
                  SEO ini akan ikut tersimpan saat menyimpan draft.
                </p>
              </dl>
            ) : (
              <p className="text-xs text-[#94a3b8]">
                Belum ada SEO. Klik &quot;Generate SEO&quot; untuk membuat meta
                title, description, slug, dan focus keyword.
              </p>
            )}
          </div>

          {categories.length > 0 ? (
            <div className="space-y-1.5">
              <label
                className="block text-sm font-medium text-[#334155]"
                htmlFor="ai-category"
              >
                Kategori
              </label>
              <select
                id="ai-category"
                className={inputClass}
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(
                    event.target.value ? Number(event.target.value) : "",
                  )
                }
              >
                <option value="">— Pilih nanti di editor —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-[#eef2f7] pt-4">
            <button
              type="button"
              onClick={() => setStep("outline")}
              className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm transition hover:bg-[#f1f5f9]"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => void generateArticle()}
              disabled={loading}
              className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm transition hover:bg-[#f1f5f9] disabled:opacity-50"
            >
              Tulis ulang
            </button>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={loading || !articleContent}
              className="rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
            >
              {loading ? "Menyimpan…" : "Simpan Draft & Buka Editor"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
