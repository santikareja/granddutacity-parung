"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminCardHeader,
  AdminCardTitle,
  AdminCheckbox,
  AdminInput,
  AdminLabel,
  AdminTextarea,
} from "@/components/admin/ui";
import { adminPut } from "@/lib/v2-admin/api-client";
import type { UnitContentDraft } from "@/lib/v2-admin/unit-content";

/**
 * FORM KONTEN TIPE RUMAH.
 *
 * Bentuk datanya sengaja sama persis dengan `UnitContentDraft` di lapisan data,
 * jadi tidak ada penerjemahan bentuk di tengah jalan yang bisa menyimpang.
 *
 * Daftar dinamis (paragraf, keunggulan, galeri, akses) dikelola sebagai array
 * biasa. Baris kosong TIDAK divalidasi keras di sini: server sudah membuang
 * string kosong dan mengubah array kosong menjadi NULL (= kembali ke default),
 * sehingga editor bebas mengosongkan sesuatu tanpa terjebak pesan error.
 */
export default function UnitContentEditor({
  unitId,
  unitLabel,
  initialDraft,
  canManage,
}: {
  unitId: string;
  unitLabel: string;
  initialDraft: UnitContentDraft;
  canManage: boolean;
}) {
  const [draft, setDraft] = useState<UnitContentDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const patch = (changes: Partial<UnitContentDraft>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  // --- helper daftar string ---
  const setStringAt = (
    key: "overview" | "highlights" | "suitedFor",
    index: number,
    value: string,
  ) =>
    setDraft((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });

  const addString = (key: "overview" | "highlights" | "suitedFor") =>
    setDraft((prev) => ({ ...prev, [key]: [...prev[key], ""] }));

  const removeString = (
    key: "overview" | "highlights" | "suitedFor",
    index: number,
  ) =>
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const result = await adminPut<{ revalidated: string[] }>(
        `/api/v2/unit-content/${unitId}`,
        { body: draft },
      );
      setSaved(
        `Tersimpan. Halaman berikut akan menampilkan versi terbaru: ${result.revalidated
          .filter((path) => !path.endsWith(".xml"))
          .join(", ")}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const disabled = !canManage || saving;

  return (
    <div className="space-y-4">
      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
      {saved ? <AdminAlert variant="success">{saved}</AdminAlert> : null}

      {/* ── Harga & status ── */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Harga &amp; status tayang</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardBody className="space-y-4">
          <div>
            <AdminLabel htmlFor="priceLabel">Harga tampil</AdminLabel>
            <AdminInput
              id="priceLabel"
              value={draft.priceLabel ?? ""}
              placeholder="mis. 600 Juta-an"
              disabled={disabled}
              onChange={(e) => patch({ priceLabel: e.target.value })}
            />
            <p className="mt-1.5 text-xs text-admin-fg-muted">
              Ditampilkan sebagai &quot;Rp &lt;harga&gt;&quot;. Tulis tanpa &quot;Rp&quot;.
              Kosongkan untuk memakai harga default dari kode.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <AdminCheckbox
              id="isPublished"
              checked={draft.isPublished}
              disabled={disabled}
              onChange={(e) => patch({ isPublished: e.target.checked })}
            />
            <AdminLabel htmlFor="isPublished" className="cursor-pointer">
              Tayangkan perubahan ini
            </AdminLabel>
          </div>
          <p className="text-xs text-admin-fg-muted">
            Bila tidak dicentang, konten disimpan sebagai draf dan halaman publik
            tetap memakai nilai default.
          </p>
        </AdminCardBody>
      </AdminCard>

      {/* ── Deskripsi ── */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Deskripsi</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardBody className="space-y-3">
          {draft.overview.map((paragraph, index) => (
            <div key={index} className="flex gap-2">
              <AdminTextarea
                rows={4}
                value={paragraph}
                placeholder={`Paragraf ${index + 1}`}
                disabled={disabled}
                onChange={(e) => setStringAt("overview", index, e.target.value)}
              />
              <AdminButton
                type="button"
                variant="danger"
                size="icon"
                aria-label={`Hapus paragraf ${index + 1}`}
                disabled={disabled}
                onClick={() => removeString("overview", index)}
              >
                <Trash2 className="size-4" />
              </AdminButton>
            </div>
          ))}
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => addString("overview")}
          >
            <Plus className="size-4" /> Tambah paragraf
          </AdminButton>
        </AdminCardBody>
      </AdminCard>

      {/* ── Keunggulan & cocok untuk ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(
          [
            { key: "highlights" as const, title: "Keunggulan tipe ini" },
            { key: "suitedFor" as const, title: "Cocok untuk" },
          ]
        ).map(({ key, title }) => (
          <AdminCard key={key}>
            <AdminCardHeader>
              <AdminCardTitle>{title}</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardBody className="space-y-2.5">
              {draft[key].map((item, index) => (
                <div key={index} className="flex gap-2">
                  <AdminInput
                    value={item}
                    placeholder="Satu poin singkat"
                    disabled={disabled}
                    onChange={(e) => setStringAt(key, index, e.target.value)}
                  />
                  <AdminButton
                    type="button"
                    variant="danger"
                    size="icon"
                    aria-label={`Hapus poin ${index + 1}`}
                    disabled={disabled}
                    onClick={() => removeString(key, index)}
                  >
                    <Trash2 className="size-4" />
                  </AdminButton>
                </div>
              ))}
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => addString(key)}
              >
                <Plus className="size-4" /> Tambah poin
              </AdminButton>
            </AdminCardBody>
          </AdminCard>
        ))}
      </div>

      {/* ── Foto ── */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Foto</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="facadeImage">Foto fasad utama</AdminLabel>
              <AdminInput
                id="facadeImage"
                value={draft.facadeImage ?? ""}
                placeholder="https://res.cloudinary.com/..."
                disabled={disabled}
                onChange={(e) => patch({ facadeImage: e.target.value })}
              />
            </div>
            <div>
              <AdminLabel htmlFor="floorPlanImage">Denah lantai</AdminLabel>
              <AdminInput
                id="floorPlanImage"
                value={draft.floorPlanImage ?? ""}
                placeholder="https://res.cloudinary.com/..."
                disabled={disabled}
                onChange={(e) => patch({ floorPlanImage: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-admin-fg-muted">
                Kosongkan bila denah belum tersedia — seksinya otomatis
                disembunyikan.
              </p>
            </div>
          </div>

          <div className="border-t border-admin-border pt-4">
            <AdminLabel>Galeri foto</AdminLabel>
            <p className="mb-3 text-xs text-admin-fg-muted">
              Thumbnail muncul otomatis bila ada dua foto atau lebih. Teks alt
              wajib deskriptif — ia dipakai Google dan pembaca layar.
            </p>

            <div className="space-y-3">
              {draft.gallery.map((image, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-admin-border p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-admin-fg-muted">
                      Foto {index + 1}
                    </span>
                    <AdminButton
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={disabled}
                      onClick={() =>
                        patch({
                          gallery: draft.gallery.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Trash2 className="size-4" /> Hapus
                    </AdminButton>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <AdminInput
                      value={image.url}
                      placeholder="URL foto"
                      disabled={disabled}
                      onChange={(e) => {
                        const next = [...draft.gallery];
                        next[index] = { ...next[index], url: e.target.value };
                        patch({ gallery: next });
                      }}
                    />
                    <AdminInput
                      value={image.alt}
                      placeholder="Teks alt (SEO)"
                      disabled={disabled}
                      onChange={(e) => {
                        const next = [...draft.gallery];
                        next[index] = { ...next[index], alt: e.target.value };
                        patch({ gallery: next });
                      }}
                    />
                    <AdminInput
                      value={image.caption ?? ""}
                      placeholder="Keterangan (opsional)"
                      disabled={disabled}
                      onChange={(e) => {
                        const next = [...draft.gallery];
                        next[index] = {
                          ...next[index],
                          caption: e.target.value,
                        };
                        patch({ gallery: next });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={disabled}
              onClick={() =>
                patch({
                  gallery: [...draft.gallery, { url: "", alt: "", caption: "" }],
                })
              }
            >
              <Plus className="size-4" /> Tambah foto
            </AdminButton>
          </div>
        </AdminCardBody>
      </AdminCard>

      {/* ── Video ── */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Video</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardBody className="space-y-4">
          <div>
            <AdminLabel htmlFor="videoUrl">Link video</AdminLabel>
            <AdminInput
              id="videoUrl"
              value={draft.videoUrl ?? ""}
              placeholder="URL YouTube atau mp4 Cloudinary"
              disabled={disabled}
              onChange={(e) => patch({ videoUrl: e.target.value })}
            />
            <p className="mt-1.5 text-xs text-admin-fg-muted">
              Menerima link YouTube (watch, youtu.be, embed) maupun file mp4.
              Ditampilkan potret 9:16. Kosongkan untuk menyembunyikan seksi video.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AdminLabel htmlFor="videoPoster">Poster video</AdminLabel>
              <AdminInput
                id="videoPoster"
                value={draft.videoPoster ?? ""}
                placeholder="URL gambar poster"
                disabled={disabled}
                onChange={(e) => patch({ videoPoster: e.target.value })}
              />
            </div>
            <div>
              <AdminLabel htmlFor="videoTitle">Judul video</AdminLabel>
              <AdminInput
                id="videoTitle"
                value={draft.videoTitle ?? ""}
                placeholder="mis. Video Tipe Verona"
                disabled={disabled}
                onChange={(e) => patch({ videoTitle: e.target.value })}
              />
            </div>
          </div>
        </AdminCardBody>
      </AdminCard>

      {/* ── Aksesibilitas ── */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Aksesibilitas &amp; waktu tempuh</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardBody>
          <p className="mb-3 text-xs text-admin-fg-muted">
            Contoh: label &quot;CBD Jakarta Selatan&quot;, nilai &quot;20 menit
            via tol&quot;. Tampil sebagai daftar di halaman tipe.
          </p>
          <div className="space-y-2.5">
            {draft.accessItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <AdminInput
                  value={item.label}
                  placeholder="Tujuan / label"
                  disabled={disabled}
                  onChange={(e) => {
                    const next = [...draft.accessItems];
                    next[index] = { ...next[index], label: e.target.value };
                    patch({ accessItems: next });
                  }}
                />
                <AdminInput
                  value={item.value}
                  placeholder="Waktu tempuh / keterangan"
                  disabled={disabled}
                  onChange={(e) => {
                    const next = [...draft.accessItems];
                    next[index] = { ...next[index], value: e.target.value };
                    patch({ accessItems: next });
                  }}
                />
                <AdminButton
                  type="button"
                  variant="danger"
                  size="icon"
                  aria-label={`Hapus item akses ${index + 1}`}
                  disabled={disabled}
                  onClick={() =>
                    patch({
                      accessItems: draft.accessItems.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </AdminButton>
              </div>
            ))}
          </div>
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={disabled}
            onClick={() =>
              patch({
                accessItems: [...draft.accessItems, { label: "", value: "" }],
              })
            }
          >
            <Plus className="size-4" /> Tambah tujuan
          </AdminButton>
        </AdminCardBody>
      </AdminCard>

      {/* ── Simpan ── */}
      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-xl border border-admin-border bg-admin-surface p-4 shadow-admin-xs">
        <AdminButton type="button" disabled={disabled} onClick={save}>
          {saving ? "Menyimpan…" : "Simpan & sinkronkan"}
        </AdminButton>
        <a
          href={`/tipe-rumah/${unitId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-admin-fg-muted underline hover:text-admin-fg"
        >
          Lihat {unitLabel}
        </a>
      </div>
    </div>
  );
}
