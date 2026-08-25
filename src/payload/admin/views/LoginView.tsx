import { redirect } from "next/navigation";
import type { AdminViewServerProps } from "payload";
import { getSafeRedirect } from "payload/shared";

import AdminAuthShell from "../components/AdminAuthShell";
import AdminLoginForm from "../components/AdminLoginForm";

export default function LoginView({
  initPageResult,
  searchParams,
}: AdminViewServerProps) {
  const {
    req: {
      payload: { config },
      user,
    },
  } = initPageResult;

  if (user) {
    const safeRedirect = searchParams?.redirect
      ? getSafeRedirect({
          fallbackTo: config.routes.admin,
          redirectTo: searchParams.redirect,
        })
      : config.routes.admin;

    redirect(safeRedirect);
  }

  const redirectTo = searchParams?.redirect;

  return (
    <AdminAuthShell mode="login">
      <AdminLoginForm redirectTo={redirectTo} />
    </AdminAuthShell>
  );
}
