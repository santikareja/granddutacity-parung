"use client";

import { useCallback, useMemo, useState } from "react";

import { adminDelete, adminPut } from "@/lib/v2-admin/api-client";

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

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20";

const labelClass = "block text-sm font-medium text-[#334155]";

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
        <h1 className="text-2xl font-semibold tracking-tight">
          AI Models per Tugas
        </h1>
        <p className="mt-1 text-sm text-[#475467]">
          Tetapkan model berbeda untuk tiap jenis tugas AI. Bila sebuah tugas
          tidak dikonfigurasi (atau dinonaktifkan), sistem memakai provider AI
          default. API key dienkripsi (AES-256-GCM) dan tidak pernah dikirim
          balik ke browser.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-1">
        {ROLES.map((role) => {
          const card = cards[role];
          const meta = ROLE_META[role];
          return (
            <section
              key={role}
              className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{meta.title}</h2>
                    {card.hasRecord ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          card.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#f1f5f9] text-[#64748b]"
                        }`}
                      >
                        {card.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                        Belum diatur
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#64748b]">{meta.desc}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor={`${role}-baseurl`}>
                  Base URL
                </label>
                <input
                  id={`${role}-baseurl`}
                  className={inputClass}
                  value={card.baseUrl}
                  onChange={(e) => patchCard(role, { baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor={`${role}-key`}>
                  API Key
                </label>
                <input
                  id={`${role}-key`}
                  className={`${inputClass} font-mono`}
                  type="text"
                  autoComplete="off"
                  value={card.apiKey}
                  onChange={(e) => patchCard(role, { apiKey: e.target.value })}
                  placeholder="sk-..."
                />
                {card.hasRecord ? (
                  <p className="text-xs text-[#64748b]">
                    Menampilkan mask. Biarkan seperti ini untuk mempertahankan
                    key lama, atau ketik key baru untuk menggantinya.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor={`${role}-model`}>
                  Model
                </label>
                <input
                  id={`${role}-model`}
                  className={`${inputClass} font-mono`}
                  value={card.model}
                  onChange={(e) => patchCard(role, { model: e.target.value })}
                  placeholder={meta.placeholder}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={card.isActive}
                  onChange={(e) =>
                    patchCard(role, { isActive: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#F5A524]"
                />
                <span>
                  Aktifkan untuk tugas ini
                  <span className="ml-1 text-xs text-[#64748b]">
                    (jika nonaktif, memakai provider default)
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap gap-3 border-t border-[#eef2f7] pt-4">
                <button
                  type="button"
                  onClick={() => void save(role)}
                  disabled={card.saving || anyBusy}
                  className="rounded-lg bg-[#F5A524] px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e0961f] disabled:opacity-50"
                >
                  {card.saving ? "Menyimpan…" : "Simpan"}
                </button>
                {card.hasRecord ? (
                  <button
                    type="button"
                    onClick={() => void remove(role)}
                    disabled={card.deleting || anyBusy}
                    className="rounded-lg border border-red-200 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {card.deleting ? "Menghapus…" : "Hapus"}
                  </button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
