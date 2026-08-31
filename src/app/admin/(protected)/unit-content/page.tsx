import Link from "next/link";

import {
  AdminBadge,
  AdminCard,
  AdminCardBody,
  AdminPageHeader,
} from "@/components/admin/ui";
import { units, unitDisplayName, unitSizeLabel } from "@/data/units";
import { listUnitContentRows } from "@/lib/v2-admin/unit-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DAFTAR KONTEN TIPE RUMAH.
 *
 * Daftar tipe berasal dari KODE (src/data/units.ts), bukan dari tabel
 * `unit_content`. Alasannya: tipe rumah adalah data produk yang dipakai juga
 * oleh schema, sitemap, dan pricelist — sumber kebenarannya tetap di kode.
 * Tabel `unit_content` hanya menyimpan penimpaan konten tampilan, jadi tipe yang
 * belum pernah disunting tetap muncul di sini dengan status "Default".
 *
 * `force-dynamic` supaya status selalu terbaca dari DB, bukan dari cache build
 * (halaman admin tidak perlu diprerender).
 */
export default async function UnitContentListPage() {
  const rows = await listUnitContentRows();
  const byUnitId = new Map(rows.map((row) => [row.unitId, row]));

  return (
    <>
      <AdminPageHeader
        title="Konten Tipe Rumah"
        description="Kelola foto, video, deskripsi, harga tampil, dan aksesibilitas pada halaman tipe rumah. Perubahan langsung tersinkron ke situs setelah disimpan."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => {
          const row = byUnitId.get(unit.id);
          const status = !row
            ? { label: "Default", tone: "neutral" as const }
            : row.isPublished
              ? { label: "Disunting", tone: "success" as const }
              : { label: "Draf", tone: "warning" as const };

          return (
            <AdminCard key={unit.id}>
              <AdminCardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-admin-fg">
                      Tipe {unitDisplayName(unit)} {unitSizeLabel(unit)}
                    </h2>
                    <p className="mt-1 text-xs text-admin-fg-muted">
                      {unit.cluster === "ladera" ? "Cluster Ladera" : "Cluster Cascada"}
                      {" · "}
                      {row?.priceLabel ?? unit.priceLabel}
                    </p>
                  </div>
                  <AdminBadge tone={status.tone}>{status.label}</AdminBadge>
                </div>

                <p className="mt-3 text-xs text-admin-fg-muted">
                  {row?.updatedAt
                    ? `Diperbarui ${new Date(row.updatedAt).toLocaleString("id-ID")}`
                    : "Belum pernah disunting — halaman memakai nilai default dari kode."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/unit-content/${unit.id}`}
                    className="inline-flex items-center rounded-lg bg-admin-accent px-3 py-2 text-xs font-semibold text-admin-accent-fg hover:bg-admin-accent-hover"
                  >
                    Edit konten
                  </Link>
                  <a
                    href={`/tipe-rumah/${unit.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-admin-border px-3 py-2 text-xs font-medium text-admin-fg hover:bg-admin-surface-hover"
                  >
                    Lihat halaman
                  </a>
                </div>
              </AdminCardBody>
            </AdminCard>
          );
        })}
      </div>
    </>
  );
}
