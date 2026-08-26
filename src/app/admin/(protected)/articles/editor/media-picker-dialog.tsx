"use client";

// Dialog pemilih media untuk editor artikel. Mengambil daftar dari
// /api/v2/media (library yang sama dengan Payload).

import { useCallback, useEffect, useState } from "react";

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

type Props = {
  onClose: () => void;
  onPick: (media: PickedMedia) => void;
};

export default function MediaPickerDialog({ onClose, onPick }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/v2/media?limit=120");
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(data?.error || "Gagal memuat media.");
        }
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat media.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

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

  const filtered = query.trim()
    ? items.filter((item) => {
        const needle = query.trim().toLowerCase();
        return (
          (item.name ?? "").toLowerCase().includes(needle) ||
          (item.alt ?? "").toLowerCase().includes(needle)
        );
      })
    : items;

  const pick = useCallback(
    (item: MediaItem) => {
      onPick({
        id: item.id,
        url: item.url,
        alt: item.alt,
        caption: item.caption,
        width: item.width,
        height: item.height,
      });
    },
    [onPick],
  );

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
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-base font-semibold">Pilih Gambar</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm transition hover:bg-[#f1f5f9]"
          >
            Tutup
          </button>
        </div>

        <div className="border-b border-[#eef2f7] px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau alt text…"
            className="w-full rounded-lg border border-[#e2e8f0] px-3.5 py-2 text-sm outline-none focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-[#64748b]">
              Memuat media…
            </p>
          ) : error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#94a3b8]">
              {items.length === 0
                ? "Belum ada media di library."
                : "Tidak ada media yang cocok."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pick(item)}
                  className="group overflow-hidden rounded-lg border border-[#e2e8f0] text-left transition hover:border-[#F5A524] hover:shadow-md"
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
                    <div className="flex h-24 items-center justify-center bg-[#f8fafc] text-xs text-[#94a3b8]">
                      Tanpa pratinjau
                    </div>
                  )}
                  <p className="truncate px-2 py-1.5 text-[11px] text-[#475467]">
                    {item.name || item.alt || `Media #${item.id}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
