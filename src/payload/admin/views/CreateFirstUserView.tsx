import AdminAuthShell from "../components/AdminAuthShell";
import AdminCreateFirstUserForm from "../components/AdminCreateFirstUserForm";

export default function CreateFirstUserView() {
  return (
    <AdminAuthShell mode="first-user">
      <div className="create-first-user">
        <p
          style={{
            color: "#A89F93",
            fontSize: 14,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Buat akses admin utama untuk mulai mengelola artikel, media, dan struktur
          konten Grand Duta City Parung.
        </p>
        <AdminCreateFirstUserForm />
      </div>
    </AdminAuthShell>
  );
}
