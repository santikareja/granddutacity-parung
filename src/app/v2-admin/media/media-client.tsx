"use client";

// Halaman Media: library, upload berkas, dan impor foto stok (Unsplash/Pexels).

import { useCallback, useRef, useState } from "react";

export type MediaRow = {
  id: number;
  name: string | null;
  alt: string;
  caption: string | null;
  url: string | null;
  width: number | null;
  height: number | null;
  source: string | null;
  createdAt: string;
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

type Props = {
  initialItems: MediaRow[];
  cloudinaryReady: boolean;
  stockProviders: { unsplash: boolean; pexels: boolean };
};

type Tab = "library" | "upload" | "stock";

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";

export default function MediaClient({
  initialItems,
  cloudinaryReady,
  stockProviders,
}: Props) {
  const [tab, setTab] = useState<Tab>("library");
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Stock
  const anyStock = stockProviders.unsplash || stockProviders.pexels;
  const [stockProvider, setStockProvider] = useState<"unsplash" | "pexels">(
    stockProviders.unsplash ? "unsplash" : "pexels",
  );
  const [stockQuery, setStockQuery] = useState("");
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const refreshLibrary = useCallback(async () => {
    try {
      const response = await fetch("/api/v2/media?limit=120");
      const data = await response.json();
      if (response.ok) setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // Diamkan: kegagalan refresh tidak perlu menutup pesan sukses upload.
    }
  }, []);

  const submitUpload = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError("Pilih berkas gambar terlebih dahulu.");
        return;
      }
      if (!uploadAlt.trim()) {
        setError("Alt text wajib diisi.");
        return;
      }

      setUploading(true);
      setError(null);
      setNotice(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt", uploadAlt.trim());
        if (uploadName.trim()) formData.append("name", uploadName.trim());

        const response = await fetch("/api/v2/media/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Upload gagal.");

        setNotice("Gambar berhasil diunggah.");
        setUploadAlt("");
        setUploadName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        await refreshLibrary();
        setTab("library");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload gagal.");
      } finally {
        setUploading(false);
      }
    },
    [uploadAlt, uploadName, refreshLibrary],
  );

  const searchStock = useCallback(async () => {
    if (!stockQuery.trim()) return;

    setSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v2/media/stock?provider=${stockProvider}&q=${encodeURIComponent(stockQuery.trim())}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Pencarian gagal.");
      setStockPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pencarian gagal.");
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
        const response = await fetch("/api/v2/media/stock/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: photo.provider,
            photo,
            context: stockQuery.trim(),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Impor gagal.");

        setNotice("Foto diimpor ke library.");
        await refreshLibrary();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impor gagal.");
      } finally {
        setImportingId(null);
      }
    },
    [stockQuery, refreshLibrary],
  );

  const tabClass = (target: Tab) =>
    `rounded-lg px-4 py-2 text-sm transition ${
      tab === target
        ? "bg-[#fff5ea] font-semibold text-[#A85D16]"
        : "text-[#475467] hover:bg-[#f1f5f9]"
    }`;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
        <p className="mt-1 text-sm text-[#475467]">
          {items.length} gambar di library. Semua gambar diunggah ke Cloudinary
          dan dilayani sebagai WebP/AVIF otomatis.
        </p>
      </header>

      <div className="flex gap-1 rounded-lg border border-[#e2e8f0] bg-white p-1">
        <button type="button" onClick={() => setTab("library")} className={tabClass("library")}>
          Library
        </button>
        <button type="button" onClick={() => setTab("upload")} className={tabClass("upload")}>
          Upload
        </button>
        <button type="button" onClick={() => setTab("stock")} className={tabClass("stock")}>
          Foto Stok
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      {!cloudinaryReady ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cloudinary belum dikonfigurasi. Upload dan impor foto stok dimatikan
          sampai <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="font-mono">CLOUDINARY_API_KEY</code>, dan{" "}
          <code className="font-mono">CLOUDINARY_API_SECRET</code> diset.
        </p>
      ) : null}

      {tab === "library" ? (
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <figure
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-[#e2e8f0]"
                >
                  {item.url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- thumbnail Cloudinary dinamis di panel admin
                    <img
                      src={item.url}
                      alt={item.alt || item.name || "Media"}
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-[#f8fafc] text-xs text-[#94a3b8]">
                      Tanpa pratinjau
                    </div>
                  )}
                  <figcaption className="space-y-0.5 px-2.5 py-2">
                    <p className="truncate text-xs font-medium">
                      {item.name || `Media #${item.id}`}
                    </p>
                    <p className="truncate text-[11px] text-[#64748b]">
                      {item.alt}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
                      {item.source ?? "upload"}
                      {item.width && item.height
                        ? ` · ${item.width}×${item.height}`
                        : ""}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-[#94a3b8]">
              Belum ada media. Unggah gambar atau impor dari foto stok.
            </p>
          )}
        </section>
      ) : null}

      {tab === "upload" ? (
        <form
          onSubmit={submitUpload}
          className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-5"
        >
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#334155]" htmlFor="up-file">
              Berkas gambar
            </label>
            <input
              id="up-file"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              disabled={!cloudinaryReady}
              className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#f1f5f9] file:px-3 file:py-1.5 file:text-sm"
            />
            <p className="text-xs text-[#64748b]">
              JPG, PNG, WebP, GIF, atau AVIF. Maksimal 10 MB.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#334155]" htmlFor="up-alt">
              Alt text <span className="text-red-600">*</span>
            </label>
            <input
              id="up-alt"
              className={inputClass}
              value={uploadAlt}
              onChange={(event) => setUploadAlt(event.target.value)}
              placeholder="Deskripsi gambar untuk SEO & pembaca layar"
              disabled={!cloudinaryReady}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#334155]" htmlFor="up-name">
              Nama internal (opsional)
            </label>
            <input
              id="up-name"
              className={inputClass}
              value={uploadName}
              onChange={(event) => setUploadName(event.target.value)}
              placeholder="Nama untuk memudahkan pencarian di library"
              disabled={!cloudinaryReady}
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !cloudinaryReady}
            className="rounded-lg bg-[#F5A524] px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
          >
            {uploading ? "Mengunggah…" : "Unggah Gambar"}
          </button>
        </form>
      ) : null}

      {tab === "stock" ? (
        <section className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-5">
          {!anyStock ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Pencarian foto stok belum aktif. Set{" "}
              <code className="font-mono">UNSPLASH_ACCESS_KEY</code> dan/atau{" "}
              <code className="font-mono">PEXELS_API_KEY</code> di environment.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <select
                  value={stockProvider}
                  onChange={(event) =>
                    setStockProvider(event.target.value as "unsplash" | "pexels")
                  }
                  className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm"
                >
                  {stockProviders.unsplash ? (
                    <option value="unsplash">Unsplash</option>
                  ) : null}
                  {stockProviders.pexels ? (
                    <option value="pexels">Pexels</option>
                  ) : null}
                </select>

                <input
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
                  className="min-w-0 flex-1 rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-sm outline-none focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20"
                />

                <button
                  type="button"
                  onClick={() => void searchStock()}
                  disabled={searching || !stockQuery.trim()}
                  className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1e293b] disabled:opacity-50"
                >
                  {searching ? "Mencari…" : "Cari"}
                </button>
              </div>

              {stockPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {stockPhotos.map((photo) => (
                    <figure
                      key={`${photo.provider}-${photo.id}`}
                      className="overflow-hidden rounded-lg border border-[#e2e8f0]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail dari CDN provider eksternal */}
                      <img
                        src={photo.thumbUrl}
                        alt={photo.description || `Foto oleh ${photo.author}`}
                        loading="lazy"
                        className="h-28 w-full object-cover"
                      />
                      <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5">
                        <span className="truncate text-[11px] text-[#64748b]">
                          © {photo.author}
                        </span>
                        <button
                          type="button"
                          onClick={() => void importPhoto(photo)}
                          disabled={importingId !== null || !cloudinaryReady}
                          className="shrink-0 rounded-md bg-[#F5A524] px-2 py-1 text-[11px] font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
                        >
                          {importingId === photo.id ? "…" : "Impor"}
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
