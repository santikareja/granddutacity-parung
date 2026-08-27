"use client";

// Dialog pemilih gambar untuk editor artikel DAN gambar utama.
//
// Tiga sumber dalam satu dialog:
//   1. Library  — media yang sudah ada (GET /api/v2/media)
//   2. Upload   — unggah berkas dari perangkat (POST /api/v2/media/upload)
//   3. Foto Stok— cari di Unsplash/Pexels lalu impor (POST /api/v2/media/stock/import)
//
// Upload dan impor langsung mengembalikan gambar terpilih lewat onPick, karena
// dari sudut pandang penulis keduanya adalah "pilih gambar", bukan "kelola
// library". Pengelolaan penuh (edit metadata, hapus) tetap di halaman /admin/media.

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Search, Sparkles, Upload, X } from "lucide-react";

import {
  AdminClientError,
  adminGet,
  adminPost,
} from "@/lib/v2-admin/api-client";
import {
  AdminAlert,
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminSelect,
} from "@/components/admin/ui";

export type PickedMedia = {
  id: number;
  url: string | null;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
};

type MediaItem = PickedMedia & {
  name: string | null;
  source: string | null;
};

type MediaListResponse = {
  items: MediaItem[];
  total: number;
  page: number;
  totalPages: number;
};

type StockPhoto = {
  id: string;
  provider: "unsplash" | "pexels";
  thumbUrl: string;
  fullUrl: string;
  author: string;
  authorUrl: string;
  description: string;
  downloadLocation?: string;
};

/** Kemampuan server yang menentukan tab mana yang bisa dipakai. */
export type MediaCapabilities = {
  cloudinaryReady: boolean;
  stockProviders: { unsplash: boolean; pexels: boolean };
};

type Props = {
  capabilities: MediaCapabilities;
  /** Konteks artikel; dipakai server untuk metadata AI saat impor foto stok. */
  context?: string;
  onClose: () => void;
  onPick: (media: PickedMedia) => void;
};

type Tab = "library" | "upload" | "stock";

const PAGE_SIZE = 24;

const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof AdminClientError || err instanceof Error
    ? err.message || fallback
    : fallback;

export default function MediaPickerDialog({
  capabilities,
  context,
  onClose,
  onPick,
}: Props) {
  const [tab, setTab] = useState<Tab>("library");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // --- Library --------------------------------------------------------------
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // --- Upload ---------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [metaBusy, setMetaBusy] = useState(false);

  // --- Foto stok ------------------------------------------------------------
  const anyStock =
    capabilities.stockProviders.unsplash || capabilities.stockProviders.pexels;
  const [stockProvider, setStockProvider] = useState<"unsplash" | "pexels">(
    capabilities.stockProviders.unsplash ? "unsplash" : "pexels",
  );
  const [stockQuery, setStockQuery] = useState(context?.trim() ?? "");
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const loadLibrary = useCallback(
    async (nextPage: number, search: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminGet<MediaListResponse>(
          `/api/v2/media?page=${nextPage}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`,
        );
        setItems(Array.isArray(data.items) ? data.items : []);
        setPage(data.page ?? nextPage);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setAppliedSearch(search);
      } catch (err) {
        setError(errorMessage(err, "Gagal memuat media."));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Pemuatan pertama ditulis terpisah dari loadLibrary: loadLibrary memanggil
  // setLoading(true) secara sinkron, dan itu dilarang di dalam body effect
  // (memicu render berantai). Di sini `loading` sudah bernilai true sejak awal.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await adminGet<MediaListResponse>(
          `/api/v2/media?page=1&limit=${PAGE_SIZE}&search=`,
        );
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setPage(data.page ?? 1);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Gagal memuat media."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Tutup dengan Escape.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submitUpload = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError("Pilih berkas gambar terlebih dahulu.");
        return;
      }
      const alt = uploadAlt.trim();
      if (!alt) {
        setError("Alt text wajib diisi untuk SEO dan pembaca layar.");
        return;
      }

      setUploading(true);
      setError(null);
      setNotice(null);

      try {
        // Multipart: tidak bisa lewat adminPost yang selalu JSON-stringify body.
        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt", alt);
        if (uploadName.trim()) formData.append("name", uploadName.trim());
        if (uploadCaption.trim())
          formData.append("caption", uploadCaption.trim());

        const response = await fetch("/api/v2/media/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Upload gagal.");

        const media = data?.media as { id?: number; url?: string } | undefined;
        if (typeof media?.id !== "number") {
          throw new Error("Server tidak mengembalikan data gambar.");
        }

        // uploadMedia hanya mengembalikan { id, url }; sisanya dibiarkan null
        // agar renderer publik memakai metadata dari database.
        onPick({
          id: media.id,
          url: media.url ?? null,
          alt,
          caption: null,
          width: null,
          height: null,
        });
      } catch (err) {
        setError(errorMessage(err, "Upload gagal."));
      } finally {
        setUploading(false);
      }
    },
    [uploadAlt, uploadName, uploadCaption, onPick],
  );

  /**
   * Isi judul, alt, dan caption dengan AI.
   *
   * Model tidak melihat gambarnya (bukan model vision), jadi petunjuk yang
   * dipakai adalah konteks artikel plus nama berkas. Hasilnya diposisikan
   * sebagai draf yang wajib diperiksa penulis, bukan kebenaran final.
   */
  const generateMeta = useCallback(async () => {
    const file = fileInputRef.current?.files?.[0];
    const filename = file?.name ?? "";

    setMetaBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await adminPost<{
        name?: string;
        alt?: string;
        caption?: string;
      }>("/api/v2/ai/image-meta", {
        body: {
          context: context?.trim() || "",
          description: filename
            ? `Nama berkas: ${filename.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ")}`
            : "",
        },
        timeoutMs: 120_000,
      });

      if (data.alt) setUploadAlt(data.alt);
      if (data.name) setUploadName(data.name);
      if (data.caption) setUploadCaption(data.caption);
      setNotice("Metadata dibuat AI. Periksa dan sesuaikan sebelum mengunggah.");
    } catch (err) {
      setError(errorMessage(err, "Gagal membuat metadata dengan AI."));
    } finally {
      setMetaBusy(false);
    }
  }, [context]);

  const searchStock = useCallback(async () => {
    const query = stockQuery.trim();
    if (!query) return;

    setSearching(true);
    setError(null);
    try {
      const data = await adminGet<{ photos?: StockPhoto[] }>(
        `/api/v2/media/stock?provider=${stockProvider}&q=${encodeURIComponent(query)}`,
        { timeoutMs: 30_000 },
      );
      setStockPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      setError(errorMessage(err, "Pencarian foto stok gagal."));
      setStockPhotos([]);
    } finally {
      setSearching(false);
    }
  }, [stockProvider, stockQuery]);

  const importPhoto = useCallback(
    async (photo: StockPhoto) => {
      setImportingId(photo.id);
      setError(null);
      setNotice(null);

      try {
        // Impor mengunduh gambar, membuat metadata AI, dan mengunggah ke
        // Cloudinary — jauh lebih lama dari timeout default 10 detik.
        const data = await adminPost<{ media?: { id?: number; url?: string } }>(
          "/api/v2/media/stock/import",
          {
            body: {
              provider: photo.provider,
              photo,
              context: context?.trim() || stockQuery.trim(),
            },
            timeoutMs: 120_000,
          },
        );

        if (typeof data.media?.id !== "number") {
          throw new Error("Server tidak mengembalikan data gambar.");
        }

        // alt dibiarkan null: server sudah menyimpan alt (hasil AI) di DB, dan
        // itulah yang dipakai renderer publik.
        onPick({
          id: data.media.id,
          url: data.media.url ?? null,
          alt: null,
          caption: null,
          width: null,
          height: null,
        });
      } catch (err) {
        setError(errorMessage(err, "Impor foto stok gagal."));
      } finally {
        setImportingId(null);
      }
    },
    [context, stockQuery, onPick],
  );

  const tabClass = (target: Tab) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
      tab === target
        ? "bg-admin-accent-soft font-semibold text-admin-accent-soft-fg"
        : "text-admin-fg-muted hover:bg-admin-surface-hover hover:text-admin-fg"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pilih gambar"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-modal-panel flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-admin-lg">
        <div className="flex items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
          <h2 className="text-base font-semibold text-admin-fg">Pilih Gambar</h2>
          <AdminButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </AdminButton>
        </div>

        <div className="flex gap-1 border-b border-admin-border px-5 py-2.5">
          <button type="button" onClick={() => setTab("library")} className={tabClass("library")}>
            <ImagePlus className="h-3.5 w-3.5" />
            Media Library
          </button>
          <button type="button" onClick={() => setTab("upload")} className={tabClass("upload")}>
            <Upload className="h-3.5 w-3.5" />
            Upload Manual
          </button>
          <button type="button" onClick={() => setTab("stock")} className={tabClass("stock")}>
            <Search className="h-3.5 w-3.5" />
            Foto Stok
          </button>
        </div>

        <div className="admin-scrollbar flex-1 overflow-y-auto p-5">
          {error ? (
            <div className="mb-4">
              <AdminAlert variant="error">{error}</AdminAlert>
            </div>
          ) : null}
          {notice ? (
            <div className="mb-4">
              <AdminAlert variant="success">{notice}</AdminAlert>
            </div>
          ) : null}

          {tab === "library" ? (
            <div className="space-y-4">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void loadLibrary(1, searchInput.trim());
                }}
                className="flex flex-wrap gap-2"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-fg-dim" />
                  <AdminInput
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Cari nama atau alt text…"
                    className="pl-9"
                  />
                </div>
                <AdminButton type="submit" variant="dark" disabled={loading}>
                  {loading ? "Memuat…" : "Cari"}
                </AdminButton>
              </form>

              {loading ? (
                <p className="py-8 text-center text-sm text-admin-fg-muted">
                  Memuat media…
                </p>
              ) : items.length === 0 ? (
                <p className="py-8 text-center text-sm text-admin-fg-dim">
                  {appliedSearch
                    ? "Tidak ada media yang cocok."
                    : "Belum ada media di library. Coba tab Upload Manual atau Foto Stok."}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        onPick({
                          id: item.id,
                          url: item.url,
                          alt: item.alt,
                          caption: item.caption,
                          width: item.width,
                          height: item.height,
                        })
                      }
                      className="group overflow-hidden rounded-lg border border-admin-border text-left transition hover:border-admin-accent hover:shadow-admin-sm"
                    >
                      {item.url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- thumbnail Cloudinary dinamis di panel admin
                        <img
                          src={item.url}
                          alt={item.alt || item.name || "Media"}
                          loading="lazy"
                          className="h-24 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-admin-surface-muted text-xs text-admin-fg-dim">
                          Tanpa pratinjau
                        </div>
                      )}
                      <p className="truncate px-2 py-1.5 text-[11px] text-admin-fg-muted">
                        {item.name || item.alt || `Media #${item.id}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {totalPages > 1 ? (
                <div className="flex items-center justify-between gap-3 border-t border-admin-border pt-3">
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void loadLibrary(page - 1, appliedSearch)}
                    disabled={page <= 1 || loading}
                  >
                    &larr; Sebelumnya
                  </AdminButton>
                  <span className="text-xs text-admin-fg-muted">
                    Halaman {page} dari {totalPages}
                  </span>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void loadLibrary(page + 1, appliedSearch)}
                    disabled={page >= totalPages || loading}
                  >
                    Berikutnya &rarr;
                  </AdminButton>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "upload" ? (
            !capabilities.cloudinaryReady ? (
              <AdminAlert variant="warning">
                Upload dimatikan karena Cloudinary belum dikonfigurasi. Set{" "}
                <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{" "}
                <code className="font-mono">CLOUDINARY_API_KEY</code>, dan{" "}
                <code className="font-mono">CLOUDINARY_API_SECRET</code>.
              </AdminAlert>
            ) : (
              <form onSubmit={submitUpload} className="space-y-4">
                <div className="space-y-1.5">
                  <AdminLabel htmlFor="pick-up-file">Berkas gambar</AdminLabel>
                  <input
                    id="pick-up-file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-fg file:mr-3 file:rounded-md file:border-0 file:bg-admin-surface-muted file:px-3 file:py-1.5 file:text-sm file:text-admin-fg"
                  />
                  <p className="text-xs text-admin-fg-muted">
                    JPG, PNG, WebP, GIF, atau AVIF. Maksimal 10 MB.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-admin-border bg-admin-surface-muted px-3 py-2">
                  <p className="text-xs text-admin-fg-muted">
                    Isi judul, alt, dan caption dengan AI.
                  </p>
                  <AdminButton
                    type="button"
                    variant="dark"
                    size="sm"
                    onClick={() => void generateMeta()}
                    disabled={metaBusy}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {metaBusy ? "Memproses…" : "Isi dengan AI"}
                  </AdminButton>
                </div>

                <div className="space-y-1.5">
                  <AdminLabel htmlFor="pick-up-alt">
                    Alt text <span className="text-admin-danger">*</span>
                  </AdminLabel>
                  <AdminInput
                    id="pick-up-alt"
                    value={uploadAlt}
                    onChange={(event) => setUploadAlt(event.target.value)}
                    placeholder="Deskripsi gambar untuk SEO & pembaca layar"
                  />
                  <p className="text-xs text-admin-fg-dim">
                    {uploadAlt.length}/125 karakter. AI tidak melihat gambarnya,
                    jadi periksa kesesuaiannya.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <AdminLabel htmlFor="pick-up-name">
                    Judul internal (opsional)
                  </AdminLabel>
                  <AdminInput
                    id="pick-up-name"
                    value={uploadName}
                    onChange={(event) => setUploadName(event.target.value)}
                    placeholder="Memudahkan pencarian di library"
                  />
                </div>

                <div className="space-y-1.5">
                  <AdminLabel htmlFor="pick-up-caption">
                    Caption (opsional)
                  </AdminLabel>
                  <AdminInput
                    id="pick-up-caption"
                    value={uploadCaption}
                    onChange={(event) => setUploadCaption(event.target.value)}
                    placeholder="Keterangan yang tampil di bawah gambar"
                  />
                </div>

                <AdminButton type="submit" variant="primary" disabled={uploading}>
                  <Upload className="h-4 w-4" />
                  {uploading ? "Mengunggah…" : "Unggah & Pakai"}
                </AdminButton>
              </form>
            )
          ) : null}

          {tab === "stock" ? (
            !anyStock ? (
              <AdminAlert variant="warning">
                Pencarian foto stok belum aktif. Set{" "}
                <code className="font-mono">UNSPLASH_ACCESS_KEY</code> dan/atau{" "}
                <code className="font-mono">PEXELS_API_KEY</code> di environment.
              </AdminAlert>
            ) : !capabilities.cloudinaryReady ? (
              <AdminAlert variant="warning">
                Impor foto stok butuh Cloudinary aktif untuk menyimpan gambar.
              </AdminAlert>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <AdminSelect
                    value={stockProvider}
                    onChange={(event) =>
                      setStockProvider(
                        event.target.value as "unsplash" | "pexels",
                      )
                    }
                    className="w-auto"
                    aria-label="Penyedia foto stok"
                  >
                    {capabilities.stockProviders.unsplash ? (
                      <option value="unsplash">Unsplash</option>
                    ) : null}
                    {capabilities.stockProviders.pexels ? (
                      <option value="pexels">Pexels</option>
                    ) : null}
                  </AdminSelect>

                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-fg-dim" />
                    <AdminInput
                      type="search"
                      value={stockQuery}
                      onChange={(event) => setStockQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void searchStock();
                        }
                      }}
                      placeholder="Cari foto (mis. rumah modern, kawasan hijau)…"
                      className="pl-9"
                    />
                  </div>

                  <AdminButton
                    type="button"
                    variant="dark"
                    onClick={() => void searchStock()}
                    disabled={searching || !stockQuery.trim()}
                  >
                    {searching ? "Mencari…" : "Cari"}
                  </AdminButton>
                </div>

                {stockPhotos.length === 0 ? (
                  <p className="py-8 text-center text-sm text-admin-fg-dim">
                    Masukkan kata kunci lalu tekan Cari.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {stockPhotos.map((photo) => (
                      <figure
                        key={`${photo.provider}-${photo.id}`}
                        className="overflow-hidden rounded-lg border border-admin-border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail dari CDN provider eksternal */}
                        <img
                          src={photo.thumbUrl}
                          alt={photo.description || `Foto oleh ${photo.author}`}
                          loading="lazy"
                          className="h-24 w-full object-cover"
                        />
                        <figcaption className="flex items-center justify-between gap-1.5 px-2 py-1.5">
                          <span className="truncate text-[11px] text-admin-fg-muted">
                            © {photo.author}
                          </span>
                          <AdminButton
                            type="button"
                            size="sm"
                            variant="soft"
                            onClick={() => void importPhoto(photo)}
                            disabled={importingId !== null}
                            className="shrink-0"
                          >
                            {importingId === photo.id ? "…" : "Pakai"}
                          </AdminButton>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-admin-fg-dim">
                  Foto diimpor ke library Cloudinary lebih dulu, dan alt text
                  dibuat otomatis oleh AI bila tersedia. Proses ini bisa memakan
                  beberapa detik.
                </p>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
