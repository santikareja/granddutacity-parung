"use client";

import { useCallback, useState } from "react";
import { useConfig, useForm, useFormFields } from "@payloadcms/ui";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";
import type { SerializedEditorState } from "lexical";

// UI field di edit screen Artikel: tombol "Generate SEO" yang memanggil
// /api/ai/seo dan mengisi seo.metaTitle, seo.metaDescription, seo.focusKeyword,
// serta slug — user tetap bisa review sebelum menyimpan.

const BTN_STYLE: React.CSSProperties = {
  padding: "8px 16px",
  background: "#F5A524",
  color: "#0f172a",
  border: "none",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

export default function GenerateSeoButton() {
  const { config } = useConfig();
  const { dispatchFields, getData } = useForm();

  // Ambil title & content dari form fields secara reaktif.
  const title = useFormFields(([fields]) => fields?.title?.value as string | undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const apiRoute = config.routes.api;

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDone(false);

    try {
      const data = getData();
      const resolvedTitle =
        (typeof title === "string" && title) ||
        (typeof data.title === "string" ? data.title : "");

      if (!resolvedTitle) {
        throw new Error("Isi judul artikel terlebih dahulu.");
      }

      // Ubah content Lexical menjadi plaintext ringkas untuk konteks SEO.
      let plainContent = "";
      const content = data.content as SerializedEditorState | undefined;
      if (content && typeof content === "object" && "root" in content) {
        try {
          plainContent = convertLexicalToPlaintext({ data: content });
        } catch {
          plainContent = "";
        }
      }

      const response = await fetch(`${apiRoute}/ai/seo`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: resolvedTitle, content: plainContent }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal menghasilkan SEO.");
      }

      if (result.metaTitle) {
        dispatchFields({ type: "UPDATE", path: "seo.metaTitle", value: result.metaTitle });
      }
      if (result.metaDescription) {
        dispatchFields({
          type: "UPDATE",
          path: "seo.metaDescription",
          value: result.metaDescription,
        });
      }
      if (result.focusKeyword) {
        dispatchFields({
          type: "UPDATE",
          path: "seo.focusKeyword",
          value: result.focusKeyword,
        });
      }
      if (result.slug) {
        dispatchFields({ type: "UPDATE", path: "slug", value: result.slug });
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghasilkan SEO.");
    } finally {
      setLoading(false);
    }
  }, [apiRoute, dispatchFields, getData, title]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <button
        type="button"
        style={{ ...BTN_STYLE, opacity: loading ? 0.5 : 1 }}
        onClick={() => void generate()}
        disabled={loading}
      >
        {loading ? "Menghasilkan SEO..." : "Generate SEO dengan AI"}
      </button>
      {error ? (
        <p style={{ color: "#b91c1c", fontSize: "13px", marginTop: "8px" }}>{error}</p>
      ) : null}
      {done && !error ? (
        <p style={{ color: "#047857", fontSize: "13px", marginTop: "8px" }}>
          Setelan SEO terisi. Tinjau lalu simpan.
        </p>
      ) : null}
    </div>
  );
}
