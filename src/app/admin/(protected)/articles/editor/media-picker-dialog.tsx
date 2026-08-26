"use client";

// Dialog pemilih media untuk editor artikel. Mengambil daftar dari
// /api/v2/media (library yang sama dengan Payload).

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

import { AdminAlert, AdminButton, AdminInput } from "@/components/admin/ui";

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
      <div className="admin-modal-panel flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-admin-lg">
        <div className="flex items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
          <h2 className="text-base font-semibold text-admin-fg">Pilih Gambar</h2>
          <AdminButton variant="ghost" size="icon" onClick={onClose} aria-label="Tutup">
            <X className="h-4 w-4" />
          </AdminButton>
        </div>

        <div className="border-b border-admin-border px-5 py-3">
          <AdminInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau alt text…"
          />
        </div>

        <div className="admin-scrollbar flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-admin-fg-muted">
              Memuat media…
            </p>
          ) : error ? (
            <AdminAlert>{error}</AdminAlert>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-admin-fg-dim">
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
        </div>
      </div>
    </div>
  );
}
