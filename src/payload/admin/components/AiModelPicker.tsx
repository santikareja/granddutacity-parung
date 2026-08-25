"use client";

import { useCallback, useState } from "react";
import { useConfig, useForm, useFormFields } from "@payloadcms/ui";

// Field UI di edit screen AI Provider: tombol "Deteksi Model" yang memanggil
// /api/ai/detect-models dengan baseUrl + apiKey (atau providerId bila sudah
// tersimpan), lalu menampilkan checkbox model untuk dipilih ke field `models`.

const CONTAINER: React.CSSProperties = {
  border: "1px solid #d4dae5",
  padding: "16px",
  marginBottom: "16px",
  background: "#f7f9fc",
};

const BTN: React.CSSProperties = {
  padding: "8px 16px",
  background: "#F5A524",
  color: "#0f172a",
  border: "none",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};



export default function AiModelPicker() {
  const { config } = useConfig();
  const { dispatchFields, getData } = useForm();

  const baseUrl = useFormFields(([fields]) => fields?.baseUrl?.value as string | undefined);
  const apiKey = useFormFields(([fields]) => fields?.apiKey?.value as string | undefined);
  const selectedModels = useFormFields(
    ([fields]) => fields?.models?.value as string[] | undefined,
  );

  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiRoute = config.routes.api;

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = getData();
      const providerId = data.id;

      const response = await fetch(`${apiRoute}/ai/detect-models`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          baseUrl: typeof baseUrl === "string" ? baseUrl : undefined,
          // Kirim apiKey hanya bila user baru mengetiknya (bukan mask). Bila mask,
          // server memakai providerId untuk dekripsi key tersimpan.
          apiKey:
            typeof apiKey === "string" && !apiKey.startsWith("••") ? apiKey : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal mendeteksi model.");
      }

      const detected: string[] = Array.isArray(result.models) ? result.models : [];
      setModels(detected);

      // Simpan daftar lengkap ke field availableModels (read-only, audit).
      dispatchFields({ type: "UPDATE", path: "availableModels", value: detected });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendeteksi model.");
    } finally {
      setLoading(false);
    }
  }, [apiRoute, baseUrl, apiKey, dispatchFields, getData]);

  const currentSelected = new Set(
    (selectedModels || []).filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  const toggleModel = useCallback(
    (modelId: string) => {
      const raw = getData().models;
      const existing: string[] = Array.isArray(raw)
        ? raw.filter((id): id is string => typeof id === "string")
        : [];
      const has = existing.includes(modelId);
      const next = has
        ? existing.filter((id) => id !== modelId)
        : [...existing, modelId];

      // Field `models` bertipe json (string[]), jadi UPDATE satu path sudah cukup.
      dispatchFields({ type: "UPDATE", path: "models", value: next });

      // Set default model bila belum ada dan kita baru menambah satu.
      if (!has) {
        const currentDefault = getData().defaultModel;
        if (!currentDefault) {
          dispatchFields({ type: "UPDATE", path: "defaultModel", value: modelId });
        }
      }
    },
    [dispatchFields, getData],
  );

  return (
    <div style={CONTAINER}>
      <button
        type="button"
        style={{ ...BTN, opacity: loading ? 0.5 : 1 }}
        onClick={() => void detect()}
        disabled={loading}
      >
        {loading ? "Mendeteksi model..." : "Deteksi Model dari Provider"}
      </button>

      {error ? (
        <p style={{ color: "#b91c1c", fontSize: "13px", marginTop: "8px" }}>{error}</p>
      ) : null}

      {models.length > 0 ? (
        <div style={{ marginTop: "12px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
            {models.length} model terdeteksi — centang untuk mengaktifkan:
          </p>
          <div
            style={{
              display: "grid",
              gap: "4px",
              maxHeight: "260px",
              overflowY: "auto",
              border: "1px solid #e2e8f0",
              padding: "8px",
              background: "#fff",
            }}
          >
            {models.map((modelId) => (
              <label
                key={modelId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={currentSelected.has(modelId)}
                  onChange={() => toggleModel(modelId)}
                />
                <span>{modelId}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
