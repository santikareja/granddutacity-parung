"use client";

// Wizard AI Studio: ide topik → 7 judul → outline (bisa diedit) → artikel →
// simpan sebagai draft lalu buka editor untuk finishing.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Save,
  History,
} from "lucide-react";

import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";

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
        <h1 className="text-2xl font-semibold tracking-tight text-admin-fg">
          AI Studio
        </h1>
        <AdminAlert variant="warning">
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
        </AdminAlert>
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
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-admin-accent">
            <Sparkles className="h-3.5 w-3.5" />
            AI Content Studio
          </p>
          <Link
            href="/admin/ai-studio/history"
            className="flex items-center gap-1 text-xs font-medium text-admin-fg-muted underline-offset-2 hover:text-admin-accent hover:underline"
          >
            <History className="h-3.5 w-3.5" />
            Riwayat Tugas AI
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-admin-fg">
          Buat Artikel dengan AI
        </h1>
        <p className="mt-1.5 text-sm text-admin-fg-muted">
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
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-admin-border bg-admin-surface p-3">
          <div className="space-y-1">
            <label
              className="block text-xs font-medium text-admin-fg-muted"
              htmlFor="ai-provider"
            >
              Provider (opsional)
            </label>
            <AdminSelect
              id="ai-provider"
              className="w-52"
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
            </AdminSelect>
          </div>

          {selectedProvider && selectedProvider.models.length > 0 ? (
            <div className="space-y-1">
              <label
                className="block text-xs font-medium text-admin-fg-muted"
                htmlFor="ai-model"
              >
                Model (opsional)
              </label>
              <AdminSelect
                id="ai-model"
                className="w-52"
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
              </AdminSelect>
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
                ? "bg-admin-accent-soft text-admin-accent-soft-fg ring-1 ring-admin-accent"
                : doneSteps.includes(item.key)
                  ? "bg-admin-success-soft text-admin-success"
                  : "bg-admin-surface text-admin-fg-dim ring-1 ring-admin-border"
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      {step === "topic" ? (
        <AdminCard>
          <AdminCardBody>
            <div className="space-y-1.5">
              <AdminLabel htmlFor="ai-topic">Ide topik artikel</AdminLabel>
              <AdminTextarea
                id="ai-topic"
                className="min-h-28"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Contoh: Tips memilih rumah pertama di kawasan Parung"
              />
            </div>
            <AdminButton
              variant="primary"
              size="lg"
              onClick={() => void generateTitles()}
              disabled={loading || !topic.trim()}
            >
              <Sparkles className="h-4 w-4" />
              {loading ? "Menghasilkan…" : "Generate 7 Judul"}
            </AdminButton>
          </AdminCardBody>
        </AdminCard>
      ) : null}

      {step === "titles" ? (
        <AdminCard>
          <AdminCardBody>
            <p className="text-sm font-medium text-admin-fg">Pilih satu judul</p>
            <div className="space-y-2">
              {titles.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setSelectedTitle(title)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    selectedTitle === title
                      ? "border-admin-accent bg-admin-accent-soft font-semibold text-admin-accent-soft-fg"
                      : "border-admin-border text-admin-fg hover:border-admin-accent hover:bg-admin-surface-hover"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-admin-border pt-4">
              <AdminButton variant="secondary" onClick={() => setStep("topic")}>
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => void generateTitles()}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4" />
                Generate ulang
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={() => void generateOutline()}
                disabled={loading || !selectedTitle}
              >
                {loading ? "Menghasilkan…" : "Generate Outline"}
                <ArrowRight className="h-4 w-4" />
              </AdminButton>
            </div>
          </AdminCardBody>
        </AdminCard>
      ) : null}

      {step === "outline" ? (
        <AdminCard>
          <AdminCardBody>
            <div>
              <p className="text-sm font-medium text-admin-fg">
                Tinjau &amp; edit outline
              </p>
              <p className="mt-0.5 text-xs text-admin-fg-muted">
                Judul: <span className="font-medium">{selectedTitle}</span>
              </p>
            </div>

            <div className="space-y-3">
              {outline.map((section, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className="space-y-2 rounded-lg border border-admin-border p-3"
                >
                  <div className="flex gap-2">
                    <AdminInput
                      className="font-medium"
                      value={section.heading}
                      onChange={(event) =>
                        updateHeading(sectionIndex, event.target.value)
                      }
                    />
                    <AdminButton
                      variant="danger"
                      size="icon"
                      onClick={() => removeSection(sectionIndex)}
                      title="Hapus bagian"
                    >
                      <X className="h-4 w-4" />
                    </AdminButton>
                  </div>
                  {section.subheadings.map((sub, subIndex) => (
                    <div key={subIndex} className="flex items-center gap-2">
                      <AdminInput
                        className="ml-4 text-xs"
                        value={sub}
                        onChange={(event) =>
                          updateSub(sectionIndex, subIndex, event.target.value)
                        }
                        placeholder="Sub-poin (H3)"
                      />
                      <AdminButton
                        variant="danger"
                        size="icon"
                        onClick={() => removeSub(sectionIndex, subIndex)}
                        title="Hapus sub-poin"
                      >
                        <X className="h-3.5 w-3.5" />
                      </AdminButton>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addSub(sectionIndex)}
                    className="ml-4 flex items-center gap-1 rounded-lg border border-dashed border-admin-border-strong px-3 py-1 text-xs text-admin-fg-muted transition hover:border-admin-accent hover:bg-admin-surface-hover"
                  >
                    <Plus className="h-3 w-3" />
                    Tambah Sub-poin
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSection}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-admin-border-strong px-4 py-2 text-sm text-admin-fg-muted transition hover:border-admin-accent hover:bg-admin-surface-hover"
            >
              <Plus className="h-4 w-4" />
              Tambah Bagian
            </button>

            <div className="flex flex-wrap gap-2 border-t border-admin-border pt-4">
              <AdminButton variant="secondary" onClick={() => setStep("titles")}>
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={() => void generateArticle()}
                disabled={loading || outline.length === 0}
              >
                {loading ? "Menulis artikel…" : "Setujui & Tulis Artikel"}
                <ArrowRight className="h-4 w-4" />
              </AdminButton>
            </div>
            {loading ? (
              <p className="text-xs text-admin-fg-muted">
                Menulis 900–1.200 kata bisa memakan waktu hingga beberapa menit.
                Jangan tutup halaman ini.
              </p>
            ) : null}
          </AdminCardBody>
        </AdminCard>
      ) : null}

      {step === "preview" ? (
        <AdminCard>
          <AdminCardBody>
            <div>
              <p className="text-sm font-medium text-admin-fg">
                Pratinjau artikel
              </p>
              <p className="mt-0.5 text-xs text-admin-fg-muted">
                CTA ke homepage sudah ditambahkan otomatis di akhir artikel.
              </p>
            </div>

            <div
              className="gdc-editor admin-scrollbar max-h-[420px] overflow-y-auto rounded-lg border border-admin-border bg-admin-surface-muted p-4 text-sm"
              // Field `html` sudah disanitasi di server dengan sanitizeAiHtml()
              // (membuang tag/atribut aktif dan skema URL berbahaya) sebelum dirender di sini.
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />

            <div className="space-y-3 rounded-lg border border-admin-border bg-admin-surface-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-admin-fg">SEO</p>
                <AdminButton
                  variant="soft"
                  size="sm"
                  onClick={() => void generateSeo()}
                  disabled={loading || !articleContent}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {loading ? "Memproses…" : seo ? "Generate ulang SEO" : "Generate SEO"}
                </AdminButton>
              </div>
              {seo ? (
                <dl className="space-y-2 text-xs text-admin-fg-muted">
                  <div>
                    <dt className="font-semibold text-admin-fg">Meta Title</dt>
                    <dd>{seo.metaTitle || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-admin-fg">
                      Meta Description
                    </dt>
                    <dd>{seo.metaDescription || "—"}</dd>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <dt className="font-semibold text-admin-fg">Slug</dt>
                      <dd className="font-mono">{seo.slug || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-admin-fg">
                        Focus Keyword
                      </dt>
                      <dd>{seo.focusKeyword || "—"}</dd>
                    </div>
                  </div>
                  <p className="pt-1 text-[11px] text-admin-fg-dim">
                    SEO ini akan ikut tersimpan saat menyimpan draft.
                  </p>
                </dl>
              ) : (
                <p className="text-xs text-admin-fg-dim">
                  Belum ada SEO. Klik &quot;Generate SEO&quot; untuk membuat meta
                  title, description, slug, dan focus keyword.
                </p>
              )}
            </div>

            {categories.length > 0 ? (
              <div className="space-y-1.5">
                <AdminLabel htmlFor="ai-category">Kategori</AdminLabel>
                <AdminSelect
                  id="ai-category"
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
                </AdminSelect>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-admin-border pt-4">
              <AdminButton variant="secondary" onClick={() => setStep("outline")}>
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => void generateArticle()}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4" />
                Tulis ulang
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={() => void saveDraft()}
                disabled={loading || !articleContent}
              >
                <Save className="h-4 w-4" />
                {loading ? "Menyimpan…" : "Simpan Draft & Buka Editor"}
              </AdminButton>
            </div>
          </AdminCardBody>
        </AdminCard>
      ) : null}
    </div>
  );
}
