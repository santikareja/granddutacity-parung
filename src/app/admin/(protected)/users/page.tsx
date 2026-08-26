import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import { listUsers } from "@/lib/v2-admin/users";
import UsersClient, { type UserRow } from "./users-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Manajemen user hanya untuk admin (anti-eskalasi). role "ai-agent" dialihkan.
export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/admin");

  let items: UserRow[] = [];
  let error: string | null = null;

  try {
    const users = await listUsers();
    items = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("[v2-admin/users] gagal memuat:", err);
    error = "Gagal memuat daftar pengguna dari database.";
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="mx-auto mb-4 max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <UsersClient initialItems={items} />
    </>
  );
}
