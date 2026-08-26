"use client";

// Form editor artikel: judul, slug, editor Lexical, SEO, kategori/tag, status.
// Autosave draft setiap 4 detik setelah perubahan berhenti (debounce), sehingga
// penulis tidak kehilangan pekerjaan tanpa harus menekan Simpan.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Sparkles, Trash2 } from "lucide-react";

import ArticleEditor from "./editor/article-editor";
import MediaPickerDialog, {
  type PickedMedia,
} from "./editor/media-picker-dialog";
import { createEmptyState, slugify } from "@/lib/v2-admin/lexical";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminCardTitle,
  AdminCheckbox,
  AdminInput,
  AdminLabel,
  AdminTextarea,
} from "@/components/admin/ui";

export type ArticleFormData = {
  id: number | null;
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  featuredImageId: number | null;
  // URL pratinjau gambar utama. Tidak dikirim ke server (server sudah punya
  // relasi via featuredImageId); hanya dipakai untuk menampilkan pratinjau.
  featuredImageUrl: string | null;
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

export default function ArticleForm({ initial, categories, tags }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<ArticleFormData>(initial);
  const [articleId, setArticleId] = useState<number | null>(initial.id);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

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
          window.history.replaceState(null, "", `/admin/articles/${newId}`);
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

  const pickFeaturedImage = useCallback((picked: PickedMedia) => {
    setForm((prev) => ({
      ...prev,
      featuredImageId: picked.id,
      featuredImageUrl: picked.url,
    }));
    setDirty(true);
    setShowImagePicker(false);
  }, []);

  const clearFeaturedImage = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      featuredImageId: null,
      featuredImageUrl: null,
    }));
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
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-admin-border bg-admin-surface px-4 py-3 shadow-admin-xs">
        <div className="flex items-center gap-3">
          <AdminButton variant="ghost" size="icon" asChild>
            <Link href="/admin/articles" aria-label="Kembali ke daftar artikel">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </AdminButton>
          <div>
            <h1 className="text-base font-semibold text-admin-fg">
              {articleId ? "Edit Artikel" : "Artikel Baru"}
            </h1>
            <p className="text-xs text-admin-fg-muted">
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
          <AdminButton
            variant="secondary"
            onClick={() => void persist("draft", "manual")}
            disabled={saving}
          >
            {saving ? "Menyimpan…" : "Simpan Draft"}
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={async () => {
              const ok = await persist("published", "manual");
              if (ok) router.refresh();
            }}
            disabled={saving}
          >
            {form.status === "published" ? "Perbarui" : "Publish"}
          </AdminButton>
        </div>
      </header>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <AdminLabel htmlFor="art-title">Judul</AdminLabel>
            <AdminInput
              id="art-title"
              className="text-base font-medium"
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
          <AdminCard>
            <AdminCardBody>
              <AdminCardTitle>Publikasi</AdminCardTitle>
              <p className="text-xs text-admin-fg-muted">
                Status saat ini:{" "}
                <AdminBadge tone={form.status === "published" ? "success" : "warning"}>
                  {form.status === "published" ? "Live" : "Draft"}
                </AdminBadge>
              </p>
              {form.status === "published" ? (
                <AdminAlert variant="warning">
                  Artikel ini sudah tayang. Autosave dimatikan; tekan
                  &ldquo;Perbarui&rdquo; untuk menerapkan perubahan ke situs.
                </AdminAlert>
              ) : null}
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardBody>
              <AdminCardTitle>Slug &amp; Ringkasan</AdminCardTitle>
              <div className="space-y-1.5">
                <AdminLabel htmlFor="art-slug">Slug URL</AdminLabel>
                <AdminInput
                  id="art-slug"
                  className="font-mono text-xs"
                  value={form.slug}
                  onChange={(event) => update("slug", event.target.value)}
                  placeholder="otomatis dari judul"
                />
              </div>
              <div className="space-y-1.5">
                <AdminLabel htmlFor="art-excerpt">Excerpt</AdminLabel>
                <AdminTextarea
                  id="art-excerpt"
                  className="min-h-20"
                  maxLength={160}
                  value={form.excerpt}
                  onChange={(event) => update("excerpt", event.target.value)}
                  placeholder="Otomatis dari paragraf pertama bila kosong"
                />
                <p className="text-xs text-admin-fg-dim">
                  {form.excerpt.length}/160 karakter
                </p>
              </div>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardBody>
              <AdminCardTitle>Gambar Utama</AdminCardTitle>
              {form.featuredImageUrl ? (
                <div className="relative h-40 w-full overflow-hidden rounded-lg border border-admin-border">
                  {/* Sengaja <img>, BUKAN next/image. URL media berasal dari DB
                      (warisan Payload) dan bentuknya tidak dijamin: host di luar
                      images.remotePatterns, path relatif tanpa "/" di depan, atau
                      protocol-relative "//" semuanya membuat next/image MELEMPAR
                      error saat render. Karena tidak ada error boundary di atas
                      komponen ini, satu URL menyimpang cukup untuk mematikan
                      seluruh halaman editor. Pratinjau admin juga tidak perlu
                      optimasi gambar. Pola ini sama dengan media-client.tsx,
                      media-picker-dialog.tsx, dan upload-node.tsx. */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau media dinamis di panel admin */}
                  <img
                    src={form.featuredImageUrl}
                    alt="Pratinjau gambar utama"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-40 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-admin-border bg-admin-surface-muted text-xs text-admin-fg-dim">
                  <ImageIcon className="h-5 w-5" strokeWidth={1.5} />
                  {form.featuredImageId
                    ? "Gambar terpilih (pratinjau tidak tersedia)"
                    : "Belum ada gambar utama"}
                </div>
              )}
              <p className="text-xs text-admin-fg-dim">
                Bila kosong, gambar pertama di konten dipakai otomatis saat
                disimpan.
              </p>
              <div className="flex gap-2">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImagePicker(true)}
                >
                  {form.featuredImageId ? "Ganti Gambar" : "Pilih Gambar"}
                </AdminButton>
                {form.featuredImageId ? (
                  <AdminButton variant="danger" size="sm" onClick={clearFeaturedImage}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </AdminButton>
                ) : null}
              </div>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardBody>
              <div className="flex items-center justify-between gap-2">
                <AdminCardTitle>SEO</AdminCardTitle>
                <AdminButton variant="dark" size="sm" onClick={() => void generateSeo()}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Isi dengan AI
                </AdminButton>
              </div>
              <div className="space-y-1.5">
                <AdminLabel htmlFor="art-meta-title">Meta title</AdminLabel>
                <AdminInput
                  id="art-meta-title"
                  value={form.seoMetaTitle}
                  onChange={(event) => update("seoMetaTitle", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <AdminLabel htmlFor="art-meta-desc">Meta description</AdminLabel>
                <AdminTextarea
                  id="art-meta-desc"
                  className="min-h-20"
                  value={form.seoMetaDescription}
                  onChange={(event) =>
                    update("seoMetaDescription", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <AdminLabel htmlFor="art-keyword">Focus keyword</AdminLabel>
                <AdminInput
                  id="art-keyword"
                  value={form.seoFocusKeyword}
                  onChange={(event) =>
                    update("seoFocusKeyword", event.target.value)
                  }
                />
              </div>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardBody>
              <AdminCardTitle>Kategori</AdminCardTitle>
              <div className="space-y-1.5">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-admin-fg"
                  >
                    <AdminCheckbox
                      checked={form.categoryIds.includes(category.id)}
                      onChange={() =>
                        update("categoryIds", toggleId(form.categoryIds, category.id))
                      }
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
                {categories.length === 0 ? (
                  <p className="text-xs text-admin-fg-dim">Belum ada kategori.</p>
                ) : null}
              </div>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardBody>
              <AdminCardTitle>Tag</AdminCardTitle>
              <div className="admin-scrollbar max-h-48 space-y-1.5 overflow-y-auto">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-admin-fg"
                  >
                    <AdminCheckbox
                      checked={form.tagIds.includes(tag.id)}
                      onChange={() => update("tagIds", toggleId(form.tagIds, tag.id))}
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
                {tags.length === 0 ? (
                  <p className="text-xs text-admin-fg-dim">Belum ada tag.</p>
                ) : null}
              </div>
            </AdminCardBody>
          </AdminCard>
        </aside>
      </div>

      {showImagePicker ? (
        <MediaPickerDialog
          onClose={() => setShowImagePicker(false)}
          onPick={pickFeaturedImage}
        />
      ) : null}
    </div>
  );
}
