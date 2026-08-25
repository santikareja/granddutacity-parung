"use client";

import { useCallback, useState } from "react";

import type { Media } from "@/payload-types";

type StockProvider = "unsplash" | "pexels";

type NormalizedPhoto = {
  id: string;
  provider: StockProvider;
  thumbUrl: string;
  fullUrl: string;
  author: string;
  authorUrl: string;
  description: string;
  width?: number;
  height?: number;
  downloadLocation?: string;
};

type StockPhotoPickerProps = {
  /** Konteks artikel untuk metadata AI (alt/caption). */
  context?: string;
  /** Base API route Payload (default "/api"). */
  apiRoute?: string;
  /** Dipanggil setelah foto diimpor menjadi doc media. */
  onImported?: (media: Media) => void;
  /** Provider yang aktif (dari /api/stock/status). */
  providers: { unsplash: boolean; pexels: boolean };
};

export default function StockPhotoPicker({
  context = "",
  apiRoute = "/api",
  onImported,
  providers,
}: StockPhotoPickerProps) {
  const firstEnabled: StockProvider = providers.unsplash ? "unsplash" : "pexels";
  const [provider, setProvider] = useState<StockProvider>(firstEnabled);
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<NormalizedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const anyProvider = providers.unsplash || providers.pexels;

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${apiRoute}/stock/search?provider=${provider}&q=${encodeURIComponent(query.trim())}&page=1`;
      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Gagal mencari foto.");
      }
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari foto.");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [apiRoute, provider, query]);

  const importPhoto = useCallback(
    async (photo: NormalizedPhoto) => {
      setImportingId(photo.id);
      setError(null);
      try {
        const response = await fetch(`${apiRoute}/stock/import`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: photo.provider, photo, context }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Gagal mengimpor foto.");
        }
        if (data.media && onImported) {
          onImported(data.media as Media);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengimpor foto.");
      } finally {
        setImportingId(null);
      }
    },
    [apiRoute, context, onImported],
  );

  if (!anyProvider) {
    return (
      <div className="gdc-stock gdc-stock--disabled">
        <p>
          Pencarian gambar stok belum aktif. Set <code>UNSPLASH_ACCESS_KEY</code>{" "}
          dan/atau <code>PEXELS_API_KEY</code> di environment.
        </p>
      </div>
    );
  }

  return (
    <div className="gdc-stock">
      <div className="gdc-stock__controls">
        <select
          className="gdc-stock__select"
          value={provider}
          onChange={(event) => setProvider(event.target.value as StockProvider)}
        >
          {providers.unsplash ? <option value="unsplash">Unsplash</option> : null}
          {providers.pexels ? <option value="pexels">Pexels</option> : null}
        </select>
        <input
          className="gdc-stock__input"
          type="text"
          placeholder="Cari foto (mis. rumah modern, kawasan hijau)..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
        />
        <button
          type="button"
          className="gdc-stock__btn"
          onClick={() => void search()}
          disabled={loading || !query.trim()}
        >
          {loading ? "Mencari..." : "Cari"}
        </button>
      </div>

      {error ? <p className="gdc-stock__error">{error}</p> : null}

      <div className="gdc-stock__grid">
        {photos.map((photo) => (
          <figure key={`${photo.provider}-${photo.id}`} className="gdc-stock__card">
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail dari provider eksternal, bukan aset lokal */}
            <img
              src={photo.thumbUrl}
              alt={photo.description || `Foto oleh ${photo.author}`}
              loading="lazy"
              className="gdc-stock__thumb"
            />
            <figcaption className="gdc-stock__meta">
              <span className="gdc-stock__author">© {photo.author}</span>
              <button
                type="button"
                className="gdc-stock__use"
                onClick={() => void importPhoto(photo)}
                disabled={importingId !== null}
              >
                {importingId === photo.id ? "Mengimpor..." : "Gunakan"}
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
