"use client";

// Form editor artikel: judul, slug, editor Lexical, SEO, kategori/tag, status.
// Autosave draft setiap 4 detik setelah perubahan berhenti (debounce), sehingga
// penulis tidak kehilangan pekerjaan tanpa harus menekan Simpan.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import ArticleEditor from "./editor/article-editor";
import { createEmptyState, slugify } from "@/lib/v2-admin/lexical";

export type ArticleFormData = {
  id: number | null;
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  featuredImageId: number | null;
  status: "draft" | "published";
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoFocusKeyword: string;
  categoryIds: number[];
  tagIds: number[];
  aiGenerated: boolean;
  aiTopic: string | null;
};

type Option = { id: number; name: string };

type Props = {
  initial: ArticleFormData;
  categories: Option[];
  tags: Option[];
};

const AUTOSAVE_DELAY_MS = 4000;

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";
const labelClass = "block text-sm font-medium text-[#334155]";

export default function ArticleForm({ initial, categories, tags }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<ArticleFormData>(initial);
  const [articleId, setArticleId] = useState<number | null>(initial.id);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Ref agar timer autosave & handler membaca state terbaru tanpa jadi dependensi.
  // Penulisan ref dilakukan di effect (bukan saat render) sesuai aturan lint repo.
  const formRef = useRef(form);
  const articleIdRef = useRef(articleId);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    articleIdRef.current = articleId;
  }, [articleId]);

  const buildPayload = useCallback(
    (status: "draft" | "published") => {
      const data = formRef.current;
      return {
        title: data.title,
        slug: data.slug || slugify(data.title),
        excerpt: data.excerpt,
        content: data.content,
        featuredImageId: data.featuredImageId,
        status,
        seoMetaTitle: data.seoMetaTitle,
        seoMetaDescription: data.seoMetaDescription,
        seoFocusKeyword: data.seoFocusKeyword,
        categoryIds: data.categoryIds,
        tagIds: data.tagIds,
        aiGenerated: data.aiGenerated,
        aiTopic: data.aiTopic,
      };
    },
    [],
  );

  const persist = useCallback(
    async (
      status: "draft" | "published",
      mode: "manual" | "auto",
    ): Promise<boolean> => {
      const data = formRef.current;

      if (!data.title.trim()) {
        if (mode === "manual") setError("Judul wajib diisi.");
        return false;
      }

      if (mode === "manual") setSaving(true);
      else setAutosaving(true);
      setError(null);

      try {
        const id = articleIdRef.current;
        const response = await fetch(
          id ? `/api/v2/articles/${id}` : "/api/v2/articles",
          {
            method: id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload(status)),
          },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || "Gagal menyimpan.");

        // Artikel baru: simpan id agar penyimpanan berikutnya menjadi update.
        const newId: number | undefined = result?.article?.id;
        if (!id && newId) {
          setArticleId(newId);
          articleIdRef.current = newId;
          // Ganti URL tanpa reload agar refresh tidak membuat duplikat.
          window.history.replaceState(null, "", `/v2-admin/articles/${newId}`);
        }

        setForm((prev) => ({ ...prev, status }));
        setSavedAt(
          new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Jakarta",
          }).format(new Date()),
        );
        setDirty(false);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
        return false;
      } finally {
        setSaving(false);
        setAutosaving(false);
      }
    },
    [buildPayload],
  );

  // Autosave: hanya untuk draft, dan hanya bila ada perubahan + judul terisi.
  // Artikel yang sudah published TIDAK di-autosave agar tidak mengubah konten
  // live tanpa persetujuan eksplisit.
  useEffect(() => {
    if (!dirty) return;
    if (form.status === "published") return;
    if (!form.title.trim()) return;

    const timer = setTimeout(() => {
      void persist("draft", "auto");
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [dirty, form.status, form.title, persist]);

  // Peringatkan bila menutup tab dengan perubahan belum tersimpan.
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = useCallback(<K extends keyof ArticleFormData>(
    key: K,
    value: ArticleFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleEditorChange = useCallback((state: unknown) => {
    setForm((prev) => ({ ...prev, content: state }));
    setDirty(true);
  }, []);

  const toggleId = (list: number[], id: number): number[] =>
    list.includes(id) ? list.filter((v) => v !== id) : [...list, id];

  const generateSeo = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/v2/ai/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formRef.current.title,
          content: formRef.current.content,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal menghasilkan SEO.");

      setForm((prev) => ({
        ...prev,
        seoMetaTitle: data.metaTitle || prev.seoMetaTitle,
        seoMetaDescription: data.metaDescription || prev.seoMetaDescription,
        seoFocusKeyword: data.focusKeyword || prev.seoFocusKeyword,
        slug: prev.slug || data.slug || prev.slug,
      }));
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghasilkan SEO.");
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/v2-admin/articles"
            className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-sm transition hover:bg-[#f1f5f9]"
          >
            &larr; Daftar
          </Link>
          <div>
            <h1 className="text-lg font-semibold">
              {articleId ? "Edit Artikel" : "Artikel Baru"}
            </h1>
            <p className="text-xs text-[#64748b]">
              {autosaving
                ? "Menyimpan otomatis…"
                : savedAt
                  ? `Tersimpan ${savedAt}`
                  : dirty
                    ? "Ada perubahan belum tersimpan"
                    : "Belum ada perubahan"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void persist("draft", "manual")}
            disabled={saving}
            className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm transition hover:bg-[#f1f5f9] disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Simpan Draft"}
          </button>
          <button
            type="button"
            onClick={async () => {
              const ok = await persist("published", "manual");
              if (ok) router.refresh();
            }}
            disabled={saving}
            className="rounded-lg bg-[#F5A524] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
          >
            {form.status === "published" ? "Perbarui" : "Publish"}
          </button>
        </div>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="art-title">
              Judul
            </label>
            <input
              id="art-title"
              className={`${inputClass} text-base font-medium`}
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Judul artikel…"
            />
          </div>

          <ArticleEditor
            initialState={initial.content ?? createEmptyState()}
            onChange={handleEditorChange}
          />
        </div>

        <aside className="space-y-4">
          <section className="space-y-3 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <h2 className="text-sm font-semibold">Publikasi</h2>
            <p className="text-xs text-[#64748b]">
              Status saat ini:{" "}
              <span
                className={
                  form.status === "published"
                    ? "font-semibold text-emerald-700"
                    : "font-semibold text-amber-700"
                }
              >
                {form.status === "published" ? "Live" : "Draft"}
              </span>
            </p>
            {form.status === "published" ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Artikel ini sudah tayang. Autosave dimatikan; tekan
                &ldquo;Perbarui&rdquo; untuk menerapkan perubahan ke situs.
              </p>
            ) : null}
          </section>

          <section className="space-y-3 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <h2 className="text-sm font-semibold">Slug &amp; Ringkasan</h2>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="art-slug">
                Slug URL
              </label>
              <input
                id="art-slug"
                className={`${inputClass} font-mono text-xs`}
                value={form.slug}
                onChange={(event) => update("slug", event.target.value)}
                placeholder="otomatis dari judul"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="art-excerpt">
                Excerpt
              </label>
              <textarea
                id="art-excerpt"
                className={`${inputClass} min-h-20 resize-y`}
                maxLength={160}
                value={form.excerpt}
                onChange={(event) => update("excerpt", event.target.value)}
                placeholder="Otomatis dari paragraf pertama bila kosong"
              />
              <p className="text-xs text-[#94a3b8]">
                {form.excerpt.length}/160 karakter
              </p>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">SEO</h2>
              <button
                type="button"
                onClick={() => void generateSeo()}
                className="rounded-md bg-[#0f172a] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#1e293b]"
              >
                Isi dengan AI
              </button>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="art-meta-title">
                Meta title
              </label>
              <input
                id="art-meta-title"
                className={inputClass}
                value={form.seoMetaTitle}
                onChange={(event) => update("seoMetaTitle", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="art-meta-desc">
                Meta description
              </label>
              <textarea
                id="art-meta-desc"
                className={`${inputClass} min-h-20 resize-y`}
                value={form.seoMetaDescription}
                onChange={(event) =>
                  update("seoMetaDescription", event.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="art-keyword">
                Focus keyword
              </label>
              <input
                id="art-keyword"
                className={inputClass}
                value={form.seoFocusKeyword}
                onChange={(event) =>
                  update("seoFocusKeyword", event.target.value)
                }
              />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <h2 className="text-sm font-semibold">Kategori</h2>
            <div className="space-y-1.5">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex cursor-pointer items-center gap-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.categoryIds.includes(category.id)}
                    onChange={() =>
                      update("categoryIds", toggleId(form.categoryIds, category.id))
                    }
                    className="h-4 w-4 accent-[#F5A524]"
                  />
                  <span>{category.name}</span>
                </label>
              ))}
              {categories.length === 0 ? (
                <p className="text-xs text-[#94a3b8]">Belum ada kategori.</p>
              ) : null}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <h2 className="text-sm font-semibold">Tag</h2>
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.tagIds.includes(tag.id)}
                    onChange={() => update("tagIds", toggleId(form.tagIds, tag.id))}
                    className="h-4 w-4 accent-[#F5A524]"
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
              {tags.length === 0 ? (
                <p className="text-xs text-[#94a3b8]">Belum ada tag.</p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
