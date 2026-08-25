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
            placeholder: "santikaraza@gmail.com",
          },
          label: "Email",
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
        label: "Email atau Username",
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
      className="mum-auth-form"
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
      <div className="mum-auth-form__fields">
        <LoginField type={loginType} />
        <CustomPasswordField
          field={{
            label: "Password",
            name: "password",
            required: true,
          }}
          path="password"
        />
      </div>

      <div
        className="mum-auth-form__footer"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
          marginTop: -6,
        }}
      >
        <Link
          href={formatAdminURL({
            adminRoute,
            path: forgotRoute,
          })}
          prefetch={false}
          style={{ fontSize: 13 }}
        >
          {t("authentication:forgotPasswordQuestion")}
        </Link>
      </div>

      <FormSubmit size="large">Masuk</FormSubmit>
    </Form>
  );
}
