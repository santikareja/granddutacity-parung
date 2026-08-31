import { notFound } from "next/navigation";

import { AdminAlert, AdminPageHeader } from "@/components/admin/ui";
import { getSessionUser } from "@/lib/v2-auth/session";
import { getUnitById, unitDisplayName, unitSizeLabel } from "@/data/units";
import { getUnitContentDraft } from "@/lib/v2-admin/unit-content";
import UnitContentEditor from "./editor-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ unitId: string }> };

/**
 * Server component memuat draf langsung dari lapisan data (tanpa hop HTTP),
 * sama seperti pola halaman kategori. Form-nya sendiri client component karena
 * ia mengelola daftar dinamis (galeri, paragraf, item akses).
 */
export default async function UnitContentEditPage({ params }: Props) {
  const { unitId } = await params;
  const unit = getUnitById(unitId);
  if (!unit) notFound();

  const user = await getSessionUser();
  const canManage = user?.role === "admin";

  const draft = await getUnitContentDraft(unitId);
  if (!draft) notFound();

  const title = `Tipe ${unitDisplayName(unit)} ${unitSizeLabel(unit)}`;

  return (
    <>
      <AdminPageHeader
        eyebrow="Konten Tipe Rumah"
        title={title}
        description="Kolom yang dikosongkan otomatis kembali ke nilai default dari kode, sehingga halaman tidak pernah tampil kosong."
      />

      {!canManage ? (
        <AdminAlert variant="warning">
          Akun Anda tidak punya hak admin, jadi perubahan tidak bisa disimpan.
        </AdminAlert>
      ) : null}

      <UnitContentEditor
        unitId={unitId}
        unitLabel={title}
        initialDraft={draft}
        canManage={canManage}
      />
    </>
  );
}
