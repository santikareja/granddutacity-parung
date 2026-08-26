"use client";

import { useCallback, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";

import { adminDelete, adminPut } from "@/lib/v2-admin/api-client";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardBody,
  AdminCheckbox,
  AdminInput,
  AdminLabel,
} from "@/components/admin/ui";

export type RoleModelForClient = {
  role: "text" | "image" | "scanning";
  provider: string;
  baseUrl: string | null;
  apiKeyMasked: string;
  model: string | null;
  isActive: boolean;
  updatedAt: string;
};

type AiRole = RoleModelForClient["role"];

const ROLE_META: Record<
  AiRole,
  { title: string; desc: string; placeholder: string }
> = {
  text: {
    title: "Teks",
    desc: "Model untuk generate judul, outline, artikel, SEO, rewrite/expand/shorten/proofread.",
    placeholder: "gpt-4o-mini",
  },
  image: {
    title: "Gambar",
    desc: "Model untuk generate atau memproses gambar/ilustrasi artikel.",
    placeholder: "dall-e-3",
  },
  scanning: {
    title: "Scanning",
    desc: "Model untuk analisa/scan konten (mis. ekstraksi, klasifikasi, moderasi).",
    placeholder: "gpt-4o",
  },
};

const ROLES: AiRole[] = ["text", "image", "scanning"];

type CardState = {
  baseUrl: string;
  apiKey: string;
  model: string;
  isActive: boolean;
  hasRecord: boolean;
  saving: boolean;
  deleting: boolean;
};

const buildInitialState = (
  roleModels: RoleModelForClient[],
): Record<AiRole, CardState> => {
  const byRole = new Map(roleModels.map((rm) => [rm.role, rm]));
  const result = {} as Record<AiRole, CardState>;
  for (const role of ROLES) {
    const rm = byRole.get(role);
    result[role] = {
      baseUrl: rm?.baseUrl ?? "",
      // Tampilkan mask agar key lama dipertahankan (tidak dikirim ulang).
      apiKey: rm?.apiKeyMasked ?? "",
      model: rm?.model ?? "",
      isActive: rm?.isActive ?? true,
      hasRecord: Boolean(rm),
      saving: false,
      deleting: false,
    };
  }
  return result;
};

export default function RoleModelsClient({
  initialRoleModels,
}: {
  initialRoleModels: RoleModelForClient[];
}) {
  const [cards, setCards] = useState<Record<AiRole, CardState>>(() =>
    buildInitialState(initialRoleModels),
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const patchCard = useCallback(
    (role: AiRole, patch: Partial<CardState>) => {
      setCards((prev) => ({ ...prev, [role]: { ...prev[role], ...patch } }));
    },
    [],
  );

  const save = useCallback(
    async (role: AiRole) => {
      const card = cards[role];
      patchCard(role, { saving: true });
      setError(null);
      setNotice(null);

      try {
        const data = await adminPut<{ roleModel: RoleModelForClient }>(
          "/api/v2/ai/role-models",
          {
            body: {
              role,
              baseUrl: card.baseUrl,
              // Mask tidak dikirim sebagai key baru.
              apiKey: card.apiKey.startsWith("••") ? undefined : card.apiKey,
              model: card.model,
              isActive: card.isActive,
            },
          },
        );

        const rm = data.roleModel;
        patchCard(role, {
          baseUrl: rm.baseUrl ?? "",
          apiKey: rm.apiKeyMasked,
          model: rm.model ?? "",
          isActive: rm.isActive,
          hasRecord: true,
          saving: false,
        });
        setNotice(`Model untuk tugas "${ROLE_META[role].title}" disimpan.`);
      } catch (err) {
        patchCard(role, { saving: false });
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    },
    [cards, patchCard],
  );

  const remove = useCallback(
    async (role: AiRole) => {
      if (
        !window.confirm(
          `Hapus konfigurasi model untuk tugas "${ROLE_META[role].title}"? API key-nya akan hilang.`,
        )
      ) {
        return;
      }

      patchCard(role, { deleting: true });
      setError(null);
      setNotice(null);

      try {
        await adminDelete(`/api/v2/ai/role-models/${role}`);
        patchCard(role, {
          baseUrl: "",
          apiKey: "",
          model: "",
          isActive: true,
          hasRecord: false,
          deleting: false,
        });
        setNotice(`Konfigurasi tugas "${ROLE_META[role].title}" dihapus.`);
      } catch (err) {
        patchCard(role, { deleting: false });
        setError(err instanceof Error ? err.message : "Gagal menghapus.");
      }
    },
    [patchCard],
  );

  const anyBusy = useMemo(
    () => ROLES.some((r) => cards[r].saving || cards[r].deleting),
    [cards],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-admin-fg">
          AI Models per Tugas
        </h1>
        <p className="mt-1 text-sm text-admin-fg-muted">
          Tetapkan model berbeda untuk tiap jenis tugas AI. Bila sebuah tugas
          tidak dikonfigurasi (atau dinonaktifkan), sistem memakai provider AI
          default. API key dienkripsi (AES-256-GCM) dan tidak pernah dikirim
          balik ke browser.
        </p>
      </header>

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {notice ? <AdminAlert variant="success">{notice}</AdminAlert> : null}

      <div className="grid gap-5 md:grid-cols-1">
        {ROLES.map((role) => {
          const card = cards[role];
          const meta = ROLE_META[role];
          return (
            <AdminCard key={role}>
              <AdminCardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-admin-fg">
                        {meta.title}
                      </h2>
                      {card.hasRecord ? (
                        <AdminBadge tone={card.isActive ? "success" : "neutral"}>
                          {card.isActive ? "Aktif" : "Nonaktif"}
                        </AdminBadge>
                      ) : (
                        <AdminBadge tone="neutral">Belum diatur</AdminBadge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-admin-fg-muted">{meta.desc}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <AdminLabel htmlFor={`${role}-baseurl`}>Base URL</AdminLabel>
                  <AdminInput
                    id={`${role}-baseurl`}
                    value={card.baseUrl}
                    onChange={(e) => patchCard(role, { baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>

                <div className="space-y-1.5">
                  <AdminLabel htmlFor={`${role}-key`}>API Key</AdminLabel>
                  <AdminInput
                    id={`${role}-key`}
                    className="font-mono"
                    type="text"
                    autoComplete="off"
                    value={card.apiKey}
                    onChange={(e) => patchCard(role, { apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  {card.hasRecord ? (
                    <p className="text-xs text-admin-fg-muted">
                      Menampilkan mask. Biarkan seperti ini untuk mempertahankan
                      key lama, atau ketik key baru untuk menggantinya.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <AdminLabel htmlFor={`${role}-model`}>Model</AdminLabel>
                  <AdminInput
                    id={`${role}-model`}
                    className="font-mono"
                    value={card.model}
                    onChange={(e) => patchCard(role, { model: e.target.value })}
                    placeholder={meta.placeholder}
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-admin-fg">
                  <AdminCheckbox
                    checked={card.isActive}
                    onChange={(e) =>
                      patchCard(role, { isActive: e.target.checked })
                    }
                  />
                  <span>
                    Aktifkan untuk tugas ini
                    <span className="ml-1 text-xs text-admin-fg-muted">
                      (jika nonaktif, memakai provider default)
                    </span>
                  </span>
                </label>

                <div className="flex flex-wrap gap-3 border-t border-admin-border pt-4">
                  <AdminButton
                    type="button"
                    variant="primary"
                    onClick={() => void save(role)}
                    disabled={card.saving || anyBusy}
                  >
                    <Save className="h-4 w-4" />
                    {card.saving ? "Menyimpan…" : "Simpan"}
                  </AdminButton>
                  {card.hasRecord ? (
                    <AdminButton
                      type="button"
                      variant="danger"
                      onClick={() => void remove(role)}
                      disabled={card.deleting || anyBusy}
                    >
                      <Trash2 className="h-4 w-4" />
                      {card.deleting ? "Menghapus…" : "Hapus"}
                    </AdminButton>
                  ) : null}
                </div>
              </AdminCardBody>
            </AdminCard>
          );
        })}
      </div>
    </div>
  );
}
