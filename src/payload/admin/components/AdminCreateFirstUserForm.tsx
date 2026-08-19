"use client";

import {
  ConfirmPasswordField,
  EmailField,
  Form,
  FormSubmit,
  PasswordField,
  TextField,
  type UserWithToken,
  useAuth,
  useConfig,
} from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";

export default function AdminCreateFirstUserForm() {
  const { config, getEntityConfig } = useConfig();
  const { setUser } = useAuth();
  const {
    admin: { user: userSlug },
    routes: { admin: adminRoute, api: apiRoute },
  } = config;
  const collectionConfig = getEntityConfig({
    collectionSlug: userSlug,
  });
  const loginWithUsername =
    collectionConfig.auth && typeof collectionConfig.auth === "object"
      ? collectionConfig.auth.loginWithUsername
      : false;

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/first-register`,
      })}
      className="gdc-auth-form"
      disableSuccessStatus
      initialState={{
        "confirm-password": {
          initialValue: "",
          valid: false,
          value: "",
        },
        email: {
          initialValue: "",
          valid: true,
          value: "",
        },
        name: {
          initialValue: "",
          valid: true,
          value: "",
        },
        password: {
          initialValue: "",
          valid: true,
          value: "",
        },
        ...(loginWithUsername
          ? {
              username: {
                initialValue: "",
                valid: true,
                value: "",
              },
            }
          : {}),
      }}
      method="POST"
      onSuccess={(data) => {
        setUser(data as UserWithToken | null);
      }}
      redirect={adminRoute}
      validationOperation="create"
    >
      <div className="gdc-auth-form__fields">
        <TextField
          field={{
            label: "Nama admin",
            name: "name",
            required: true,
          }}
          path="name"
        />
        <EmailField
          field={{
            label: "Email admin",
            name: "email",
            required: true,
          }}
          path="email"
        />
        {loginWithUsername && (
          <TextField
            field={{
              label: "Username",
              name: "username",
              required: true,
            }}
            path="username"
          />
        )}
        <PasswordField
          autoComplete="off"
          field={{
            label: "Password baru",
            name: "password",
            required: true,
          }}
          path="password"
        />
        <ConfirmPasswordField />
      </div>

      <FormSubmit size="large">Buat akun admin</FormSubmit>
    </Form>
  );
}
