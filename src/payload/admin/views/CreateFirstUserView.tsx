import type { AdminViewServerProps } from "payload";

import AdminAuthShell from "../components/AdminAuthShell";
import AdminAuthLogo from "../components/AdminAuthLogo";
import AdminCreateFirstUserForm from "../components/AdminCreateFirstUserForm";

export default function CreateFirstUserView(_: AdminViewServerProps) {
  return (
    <AdminAuthShell mode="first-user">
      <div className="gdc-auth-panel__brand">
        <AdminAuthLogo compact />
      </div>
      <div className="create-first-user">
        <h1>Siapkan akun admin pertama</h1>
        <p>
          Buat akses admin utama untuk mulai mengelola artikel, media, dan struktur
          konten Grand Duta City dari Payload Dashboard.
        </p>
        <AdminCreateFirstUserForm />
      </div>
    </AdminAuthShell>
  );
}
