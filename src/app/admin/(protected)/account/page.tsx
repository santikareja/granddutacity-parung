import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/v2-auth/session";
import AccountClient from "./account-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Halaman akun: setiap user login boleh mengakses dan mengganti password sendiri.
export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  return (
    <AccountClient
      name={user.name}
      email={user.email}
      role={user.role}
    />
  );
}
