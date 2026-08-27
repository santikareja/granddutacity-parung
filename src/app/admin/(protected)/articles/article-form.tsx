"use client";

// Form editor artikel: judul, slug, editor Lexical, SEO, kategori/tag, status.
// Autosave draft setiap 4 detik setelah perubahan berhenti (debounce), sehingga
// penulis tidak kehilangan pekerjaan tanpa harus menekan Simpan.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  ImageIcon,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { AdminClientError, adminPost } from "@/lib/v2-admin/api-client";

import ArticleEditor, {
  type EditorApplyRequest,
} from "./editor/article-editor";
import MediaPickerDialog, {
  type MediaCapabilities,
  type PickedMedia,
} from "./editor/media-picker-dialog";
import AiAssistPanel from "./ai-assist-panel";
import {
  createEmptyState,
  prepareStateForEditor,
  prepareStateForStorage,
  slugify,
} from "@/lib/v2-admin/lexical";
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
  /** Menentukan tab mana yang aktif di dialog pemilih gambar. */
  mediaCapabilities: MediaCapabilities;
  aiEnabled: boolean;
  aiModel: string | null;
};

const AUTOSAVE_DELAY_MS = 4000;

/**
 * Warna keterangan panjang karakter: netral saat masih kosong, hijau di rentang
 * ideal, kuning bila di bawah ideal, merah bila melewati batas keras.
 */
const lengthHintClass = (length: number, ideal: number, max: number): string => {
  const base = "text-xs";
  if (length === 0) return `${base} text-admin-fg-dim`;
  if (length > max) return `${base} font-medium text-admin-danger`;
  if (length >= ideal) return `${base} text-admin-success`;
  return `${base} text-admin-warning`;
};

export default function ArticleForm({
  initial,
  categories,
  tags,
  mediaCapabilities,
  aiEnabled,
  aiModel,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState<ArticleFormData>(initial);
  const [articleId, setArticleId] = useState<number | null>(initial.id);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  // Slug live artikel, sumber kebenaran dari server (bukan tebakan klien) agar
  // tombol "Lihat Artikel" selalu menunjuk URL yang benar-benar tersimpan.
  const [savedSlug, setSavedSlug] = useState<string | null>(
    initial.slug || null,
  );

  // Permintaan penggantian isi editor dari AI Assist. Token yang naik adalah
  // pemicunya, karena `LexicalComposer` tidak membaca ulang state awal.
  const [applyRequest, setApplyRequest] = useState<EditorApplyRequest | null>(
    null,
  );

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
        // Bangun kembali `fields` tautan gaya Payload sebelum menyimpan; editor
        // Lexical hanya menulis `url` di level atas dan renderer publik membaca
        // `fields.url`. Tanpa ini, href tautan hilang setiap kali menyimpan.
        content: prepareStateForStorage(data.content),
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

        // Slug dari server = URL live artikel. Dipakai tombol "Lihat Artikel".
        const savedSlugFromServer: string | undefined = result?.article?.slug;
        if (savedSlugFromServer) setSavedSlug(savedSlugFromServer);

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

  /**
   * Terapkan Lexical state dari AI Assist ke editor DAN ke state form.
   *
   * Keduanya perlu di-set: `applyRequest` mengganti isi editor yang sudah
   * ter-mount, sementara `form.content` adalah yang benar-benar dikirim ke
   * server saat disimpan. Tanpa yang kedua, penyimpanan sebelum penulis
   * mengetik apa pun akan mengirim konten lama.
   */
  const applyAiContent = useCallback(
    (state: unknown, meta: { topic: string }) => {
      // Hasil AI memakai bentuk tautan Payload (fields.url), jadi harus
      // dinaikkan dulu ke bentuk yang dimengerti LinkNode sebelum masuk editor.
      setApplyRequest({
        state: prepareStateForEditor(state),
        token: Date.now(),
      });
      setForm((prev) => ({
        ...prev,
        content: state,
        aiGenerated: true,
        aiTopic: meta.topic || prev.aiTopic,
      }));
      setDirty(true);
    },
    [],
  );

  const applyAiTitle = useCallback((title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      // Slug hanya diisi bila penulis belum menentukannya sendiri.
      slug: prev.slug || slugify(title),
    }));
    setDirty(true);
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

  const [seoBusy, setSeoBusy] = useState(false);

  const generateSeo = useCallback(async () => {
    setError(null);
    setSeoBusy(true);
    try {
      // adminPost dipakai agar timeout bisa dinaikkan: default klien 10 detik
      // terlalu pendek untuk panggilan model, apalagi bila sistem berotasi.
      const data = await adminPost<{
        metaTitle?: string;
        metaDescription?: string;
        excerpt?: string;
        focusKeyword?: string;
        slug?: string;
      }>("/api/v2/ai/seo", {
        body: {
          title: formRef.current.title,
          content: formRef.current.content,
        },
        timeoutMs: 190_000,
      });

      setForm((prev) => ({
        ...prev,
        seoMetaTitle: data.metaTitle || prev.seoMetaTitle,
        seoMetaDescription: data.metaDescription || prev.seoMetaDescription,
        seoFocusKeyword: data.focusKeyword || prev.seoFocusKeyword,
        // Excerpt ikut terisi satu paket dengan SEO. Yang sudah ditulis penulis
        // tidak ditimpa — hasil AI hanya mengisi yang masih kosong.
        excerpt: prev.excerpt.trim() ? prev.excerpt : (data.excerpt ?? ""),
        slug: prev.slug || data.slug || prev.slug,
      }));
      setDirty(true);
    } catch (err) {
      setError(
        err instanceof AdminClientError || err instanceof Error
          ? err.message
          : "Gagal menghasilkan SEO.",
      );
    } finally {
      setSeoBusy(false);
    }
  }, []);

  // Slug untuk tombol "Lihat Artikel": utamakan slug tersimpan dari server,
  // jatuh ke slug/judul form (slugify idempoten, sama dengan perhitungan server).
  const liveSlug =
    savedSlug || (form.slug ? slugify(form.slug) : slugify(form.title));

  return (
    // Saat panel AI terbuka, sisakan ruang di kanan pada layar lebar agar panel
    // tidak menutupi sidebar form. Di layar kecil panel memang menutupi penuh.
    <div
      className={`space-y-4 transition-[margin] duration-200 ${
        // Saat panel AI terbuka, sisakan ruang di kanan pada layar lebar dan
        // lepaskan batas lebar terpusat agar editor memakai sisa ruang.
        aiPanelOpen ? "lg:mr-[356px]" : "mx-auto max-w-6xl"
      }`}
    >
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
          {/* Buka artikel live di tab baru. Muncul hanya bila sudah tayang dan
              punya slug, agar editor tetap terbuka sementara artikel diperiksa. */}
          {form.status === "published" && liveSlug ? (
            <AdminButton variant="secondary" asChild>
              <a
                href={`/${liveSlug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Lihat Artikel
              </a>
            </AdminButton>
          ) : null}
          {/* Mulai artikel baru tanpa harus lewat daftar. */}
          <AdminButton variant="secondary" asChild>
            <Link href="/admin/articles/new">
              <Plus className="h-4 w-4" />
              Artikel Baru
            </Link>
          </AdminButton>
          <AdminButton
            variant="dark"
            onClick={() => setAiPanelOpen((open) => !open)}
            aria-expanded={aiPanelOpen}
          >
            <Sparkles className="h-4 w-4" />
            AI Assist
          </AdminButton>
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

      <div
        className={`grid grid-cols-1 gap-4 ${
          // Panel AI terbuka: kolom pengaturan turun ke bawah supaya editor
          // memakai lebar penuh. Tanpa ini editor terhimpit di antara sidebar
          // pengaturan 320px dan panel AI.
          aiPanelOpen ? "" : "lg:grid-cols-[minmax(0,1fr)_320px]"
        }`}
      >
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
            initialState={prepareStateForEditor(
              initial.content ?? createEmptyState(),
            )}
            onChange={handleEditorChange}
            mediaCapabilities={mediaCapabilities}
            mediaContext={form.title || form.aiTopic || undefined}
            applyRequest={applyRequest}
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
                <p className={lengthHintClass(form.excerpt.length, 120, 160)}>
                  {form.excerpt.length}/160 karakter · ikut terisi saat menekan
                  &quot;Isi dengan AI&quot; di kartu SEO.
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
                <AdminButton
                  variant="dark"
                  size="sm"
                  onClick={() => void generateSeo()}
                  disabled={seoBusy}
                  title="Mengisi meta title, meta description, excerpt, slug, dan focus keyword"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {seoBusy ? "Memproses…" : "Isi dengan AI"}
                </AdminButton>
              </div>
              <div className="space-y-1.5">
                <AdminLabel htmlFor="art-meta-title">Meta title</AdminLabel>
                <AdminInput
                  id="art-meta-title"
                  value={form.seoMetaTitle}
                  onChange={(event) => update("seoMetaTitle", event.target.value)}
                />
                <p className={lengthHintClass(form.seoMetaTitle.length, 50, 60)}>
                  {form.seoMetaTitle.length}/60 karakter · ideal 50–60. Di atas
                  60 dipotong Google.
                </p>
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
                <p
                  className={lengthHintClass(
                    form.seoMetaDescription.length,
                    150,
                    160,
                  )}
                >
                  {form.seoMetaDescription.length}/160 karakter · ideal 150–160.
                  Di seluler kadang terpotong di 120–140.
                </p>
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
          capabilities={mediaCapabilities}
          context={form.title || form.aiTopic || undefined}
          onClose={() => setShowImagePicker(false)}
          onPick={pickFeaturedImage}
        />
      ) : null}

      {aiPanelOpen ? (
        <AiAssistPanel
          aiEnabled={aiEnabled}
          aiModel={aiModel}
          currentTitle={form.title}
          onClose={() => setAiPanelOpen(false)}
          onApplyTitle={applyAiTitle}
          onApplyContent={applyAiContent}
        />
      ) : null}
    </div>
  );
}
