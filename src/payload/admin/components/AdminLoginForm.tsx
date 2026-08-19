"use client";

import {
  EmailField,
  Form,
  FormSubmit,
  Link,
  TextField,
  type UserWithToken,
  useAuth,
  useConfig,
  useTranslation,
} from "@payloadcms/ui";
import { email, formatAdminURL, getLoginOptions, getSafeRedirect, username } from "payload/shared";
import { useState } from "react";
import CustomPasswordField from "./CustomPasswordField";

type AdminLoginFormProps = {
  redirectTo?: string | string[];
};

function LoginField({ type }: { type: "email" | "emailOrUsername" | "username" }) {
  const { t } = useTranslation();

  if (type === "email") {
    return (
      <EmailField
        field={{
          admin: {
            autoComplete: "email",
          },
          label: t("general:email"),
          name: "email",
          required: true,
        }}
        path="email"
        validate={email}
      />
    );
  }

  if (type === "username") {
    return (
      <TextField
        field={{
          label: t("authentication:username"),
          name: "username",
          required: true,
        }}
        path="username"
        validate={username}
      />
    );
  }

  return (
    <TextField
      field={{
        label: t("authentication:emailOrUsername"),
        name: "username",
        required: true,
      }}
      path="username"
    />
  );
}

export default function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const { config, getEntityConfig } = useConfig();
  const { setUser } = useAuth();
  const { t } = useTranslation();
  const {
    admin: {
      routes: { forgot: forgotRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
  } = config;
  const collectionConfig = getEntityConfig({
    collectionSlug: userSlug,
  });
  const authOptions =
    collectionConfig.auth && typeof collectionConfig.auth === "object"
      ? collectionConfig.auth
      : undefined;
  const loginWithUsername = authOptions?.loginWithUsername ?? false;
  const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername);
  const safeRedirect = redirectTo
    ? getSafeRedirect({
        fallbackTo: adminRoute,
        redirectTo,
      })
    : adminRoute;

  const [loginType] = useState<"email" | "emailOrUsername" | "username">(() => {
    if (canLoginWithEmail && canLoginWithUsername) {
      return "emailOrUsername";
    }

    if (canLoginWithUsername) {
      return "username";
    }

    return "email";
  });

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/login`,
      })}
      className="gdc-auth-form"
      disableSuccessStatus
      initialState={{
        password: {
          initialValue: "",
          valid: true,
          value: "",
        },
        ...(loginType === "email"
          ? {
              email: {
                initialValue: "",
                valid: true,
                value: "",
              },
            }
          : {
              username: {
                initialValue: "",
                valid: true,
                value: "",
              },
            }),
      }}
      method="POST"
      onSuccess={(data) => {
        setUser(data as UserWithToken | null);
      }}
      redirect={safeRedirect}
      waitForAutocomplete
    >
      <div className="gdc-auth-form__intro">
        <h2>Masuk ke dashboard admin</h2>
        <p>
          Gunakan akun admin Anda untuk mengelola artikel, media, dan struktur konten
          Grand Duta City.
        </p>
      </div>

      <div className="gdc-auth-form__fields">
        <LoginField type={loginType} />
        <CustomPasswordField
          field={{
            label: t("general:password"),
            name: "password",
            required: true,
          }}
          path="password"
        />
      </div>

      <div className="gdc-auth-form__footer">
        <Link
          href={formatAdminURL({
            adminRoute,
            path: forgotRoute,
          })}
          prefetch={false}
        >
          {t("authentication:forgotPasswordQuestion")}
        </Link>
      </div>

      <FormSubmit size="large">Masuk ke dashboard</FormSubmit>
    </Form>
  );
}
