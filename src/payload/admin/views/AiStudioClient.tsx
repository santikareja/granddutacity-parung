"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { Media } from "@/payload-types";
import StockPhotoPicker from "../components/StockPhotoPicker";

type OutlineSection = { heading: string; subheadings?: string[] };

type WizardStep = "topic" | "titles" | "outline" | "article" | "finalize";

type AiStudioClientProps = {
  adminRoute: string;
  apiRoute: string;
  aiEnabled: boolean;
  stockProviders: { unsplash: boolean; pexels: boolean };
  categories: { id: number; name: string }[];
};

const STYLES = `
  .gdc-ai {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
  }
  .gdc-ai__header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #d4dae5; }
  .gdc-ai__eyebrow { color: #F5A524; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px; }
  .gdc-ai__title { font-size: 28px; font-weight: 600; margin: 0 0 8px; }
  .gdc-ai__subtitle { color: #475467; font-size: 15px; margin: 0; max-width: 640px; line-height: 1.5; }
  .gdc-ai__steps { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .gdc-ai__step { font-size: 12px; font-weight: 600; padding: 6px 12px; border: 1px solid #d4dae5; background: #f7f9fc; color: #64748b; }
  .gdc-ai__step--active { background: #fff5ea; border-color: #F5A524; color: #A85D16; }
  .gdc-ai__step--done { background: #ecfdf5; border-color: #10b981; color: #047857; }
  .gdc-ai__card { background: #fff; border: 1px solid #d4dae5; padding: 20px; margin-bottom: 16px; box-shadow: 0 6px 14px rgba(16,24,40,0.05); }
  .gdc-ai__label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
  .gdc-ai__field { width: 100%; padding: 10px 12px; border: 1px solid #d4dae5; font-size: 14px; font-family: inherit; box-sizing: border-box; }
  textarea.gdc-ai__field { min-height: 120px; resize: vertical; }
  .gdc-ai__btn { padding: 10px 18px; background: #F5A524; color: #0f172a; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .gdc-ai__btn:hover:not(:disabled) { opacity: 0.9; }
  .gdc-ai__btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .gdc-ai__btn--ghost { background: transparent; border: 1px solid #d4dae5; color: #475467; }
  .gdc-ai__actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
  .gdc-ai__titles { display: grid; gap: 10px; }
  .gdc-ai__titleCard { text-align: left; padding: 14px 16px; border: 1px solid #d4dae5; background: #f7f9fc; cursor: pointer; font-size: 15px; transition: all 0.15s; }
  .gdc-ai__titleCard:hover { border-color: #F5A524; background: #fff5ea; }
  .gdc-ai__titleCard--selected { border-color: #F5A524; background: #fff5ea; font-weight: 600; }
  .gdc-ai__outline { display: grid; gap: 12px; }
  .gdc-ai__outlineItem { border: 1px solid #d4dae5; padding: 12px; }
  .gdc-ai__outlineHeading { width: 100%; padding: 8px; border: 1px solid #d4dae5; font-size: 14px; font-weight: 600; box-sizing: border-box; margin-bottom: 6px; }
  .gdc-ai__sub { width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 13px; box-sizing: border-box; margin-bottom: 4px; }
  .gdc-ai__preview { border: 1px solid #d4dae5; padding: 16px; max-height: 420px; overflow-y: auto; background: #fdfdfd; }
  .gdc-ai__preview h2 { font-size: 20px; margin: 16px 0 8px; }
  .gdc-ai__preview h3 { font-size: 16px; margin: 12px 0 6px; }
  .gdc-ai__preview p { margin: 0 0 10px; line-height: 1.6; }
  .gdc-ai__error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; padding: 10px 12px; font-size: 14px; margin-bottom: 12px; }
  .gdc-ai__notice { color: #92400e; background: #fffbeb; border: 1px solid #fde68a; padding: 12px 14px; font-size: 14px; }
  .gdc-ai__featured { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .gdc-ai__featured img { width: 96px; height: 64px; object-fit: cover; border: 1px solid #d4dae5; }
  .gdc-stock { margin-top: 12px; }
  .gdc-stock__controls { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .gdc-stock__select, .gdc-stock__input { padding: 8px 10px; border: 1px solid #d4dae5; font-size: 14px; }
  .gdc-stock__input { flex: 1; min-width: 180px; }
  .gdc-stock__btn, .gdc-stock__use { padding: 8px 14px; background: #F5A524; border: none; font-weight: 600; cursor: pointer; }
  .gdc-stock__btn:disabled, .gdc-stock__use:disabled { opacity: 0.5; cursor: not-allowed; }
  .gdc-stock__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .gdc-stock__card { border: 1px solid #d4dae5; margin: 0; }
  .gdc-stock__thumb { width: 100%; height: 100px; object-fit: cover; display: block; }
  .gdc-stock__meta { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; font-size: 11px; gap: 6px; }
  .gdc-stock__author { color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gdc-stock__error { color: #b91c1c; font-size: 13px; }
  .gdc-stock--disabled { color: #92400e; background: #fffbeb; border: 1px solid #fde68a; padding: 12px; font-size: 14px; }
`;

const STEP_LABELS: Record<WizardStep, string> = {
  topic: "1. Topik",
  titles: "2. Judul",
  outline: "3. Outline",
  article: "4. Artikel",
  finalize: "5. Finalisasi",
};

const STEP_ORDER: WizardStep[] = ["topic", "titles", "outline", "article", "finalize"];

const resolveMediaUrl = (media: Media): string | null =>
  media.transformedUrl || media.cloudinaryUrl || media.url || media.thumbnailURL || media.originalUrl || null;

export default function AiStudioClient({
  adminRoute,
  apiRoute,
  aiEnabled,
  stockProviders,
  categories,
}: AiStudioClientProps) {
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>("topic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [articleHtml, setArticleHtml] = useState("");
  const [articleLexical, setArticleLexical] = useState<unknown>(null);
  const [featuredMedia, setFeaturedMedia] = useState<Media | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | "">(
    categories[0]?.id ?? "",
  );

  const post = useCallback(
    async <T,>(path: string, body: Record<string, unknown>): Promise<T> => {
      const response = await fetch(`${apiRoute}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Permintaan gagal.");
      }
      return data as T;
    },
    [apiRoute],
  );

  const generateTitles = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await post<{ titles: string[] }>("/ai/titles", { topic: topic.trim() });
      setTitles(data.titles);
      setStep("titles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghasilkan judul.");
    } finally {
      setLoading(false);
    }
  }, [post, topic]);

  const generateOutline = useCallback(
    async (title: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await post<{ sections: OutlineSection[] }>("/ai/outline", { title });
        setOutline(data.sections);
        setStep("outline");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menghasilkan outline.");
      } finally {
        setLoading(false);
      }
    },
    [post],
  );

  const generateArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await post<{ html: string; lexical: unknown }>("/ai/article", {
        title: selectedTitle,
        outline,
      });
      setArticleHtml(data.html);
      setArticleLexical(data.lexical);
      setStep("article");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghasilkan artikel.");
    } finally {
      setLoading(false);
    }
  }, [post, selectedTitle, outline]);

  const finalize = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // draft=true wajib: tanpa itu Payload menjalankan validasi penuh dan create
      // gagal karena `kategori`/`featuredImage` bertanda required, sementara
      // wizard sengaja menyisakan finishing di edit screen.
      const response = await fetch(`${apiRoute}/artikel?draft=true`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedTitle,
          content: articleLexical,
          aiGenerated: true,
          aiTopic: topic,
          aiOutline: outline,
          status: "draft",
          ...(featuredMedia ? { featuredImage: featuredMedia.id } : {}),
          ...(selectedCategory ? { kategori: [selectedCategory] } : {}),
          seo: { focusKeyword: topic },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message =
          data?.errors?.[0]?.message || data?.message || "Gagal menyimpan draft artikel.";
        throw new Error(message);
      }
      const id = data?.doc?.id;
      if (!id) {
        throw new Error("Draft tersimpan tetapi ID tidak ditemukan.");
      }
      router.push(`${adminRoute}/collections/artikel/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan draft artikel.");
      setLoading(false);
    }
  }, [
    apiRoute,
    adminRoute,
    articleLexical,
    featuredMedia,
    outline,
    router,
    selectedCategory,
    selectedTitle,
    topic,
  ]);

  const updateOutlineHeading = (index: number, value: string) => {
    setOutline((prev) => prev.map((s, i) => (i === index ? { ...s, heading: value } : s)));
  };

  const updateOutlineSub = (sectionIndex: number, subIndex: number, value: string) => {
    setOutline((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              subheadings: (s.subheadings || []).map((sub, j) => (j === subIndex ? value : sub)),
            }
          : s,
      ),
    );
  };

  const doneSteps = STEP_ORDER.slice(0, STEP_ORDER.indexOf(step));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="gdc-ai">
        <header className="gdc-ai__header">
          <p className="gdc-ai__eyebrow">AI Content Studio</p>
          <h1 className="gdc-ai__title">Buat Artikel dengan AI</h1>
          <p className="gdc-ai__subtitle">
            Alur bertahap: masukkan ide topik, pilih judul, setujui outline, generate artikel, lalu
            simpan sebagai draft untuk finishing di editor.
          </p>
        </header>

        {!aiEnabled ? (
          <div className="gdc-ai__notice">
            Layanan AI belum aktif. Buka menu <strong>Konfigurasi AI</strong> untuk menambahkan
            provider (Base URL + API Key), deteksi model, dan tandai satu provider sebagai default —
            atau set env <code>AI_BASE_URL</code>/<code>AI_API_KEY</code>/<code>AI_MODEL</code>.
          </div>
        ) : (
          <>
            <div className="gdc-ai__steps">
              {STEP_ORDER.map((s) => (
                <span
                  key={s}
                  className={`gdc-ai__step ${
                    s === step
                      ? "gdc-ai__step--active"
                      : doneSteps.includes(s)
                        ? "gdc-ai__step--done"
                        : ""
                  }`}
                >
                  {STEP_LABELS[s]}
                </span>
              ))}
            </div>

            {error ? <div className="gdc-ai__error">{error}</div> : null}

            {step === "topic" ? (
              <div className="gdc-ai__card">
                <label className="gdc-ai__label" htmlFor="gdc-ai-topic">
                  Ide topik artikel
                </label>
                <textarea
                  id="gdc-ai-topic"
                  className="gdc-ai__field"
                  placeholder="Contoh: Tips memilih rumah pertama di kawasan Parung"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                />
                <div className="gdc-ai__actions">
                  <button
                    type="button"
                    className="gdc-ai__btn"
                    onClick={() => void generateTitles()}
                    disabled={loading || !topic.trim()}
                  >
                    {loading ? "Menghasilkan..." : "Generate 7 Judul"}
                  </button>
                </div>
              </div>
            ) : null}

            {step === "titles" ? (
              <div className="gdc-ai__card">
                <label className="gdc-ai__label">Pilih satu judul</label>
                <div className="gdc-ai__titles">
                  {titles.map((title) => (
                    <button
                      key={title}
                      type="button"
                      className={`gdc-ai__titleCard ${
                        selectedTitle === title ? "gdc-ai__titleCard--selected" : ""
                      }`}
                      onClick={() => setSelectedTitle(title)}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <div className="gdc-ai__actions">
                  <button
                    type="button"
                    className="gdc-ai__btn--ghost gdc-ai__btn"
                    onClick={() => setStep("topic")}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    className="gdc-ai__btn"
                    onClick={() => void generateOutline(selectedTitle)}
                    disabled={loading || !selectedTitle}
                  >
                    {loading ? "Menghasilkan..." : "Generate Outline"}
                  </button>
                </div>
              </div>
            ) : null}

            {step === "outline" ? (
              <div className="gdc-ai__card">
                <label className="gdc-ai__label">Tinjau &amp; edit outline sebelum approve</label>
                <div className="gdc-ai__outline">
                  {outline.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="gdc-ai__outlineItem">
                      <input
                        className="gdc-ai__outlineHeading"
                        value={section.heading}
                        onChange={(event) => updateOutlineHeading(sectionIndex, event.target.value)}
                      />
                      {(section.subheadings || []).map((sub, subIndex) => (
                        <input
                          key={subIndex}
                          className="gdc-ai__sub"
                          value={sub}
                          onChange={(event) =>
                            updateOutlineSub(sectionIndex, subIndex, event.target.value)
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="gdc-ai__actions">
                  <button
                    type="button"
                    className="gdc-ai__btn--ghost gdc-ai__btn"
                    onClick={() => setStep("titles")}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    className="gdc-ai__btn"
                    onClick={() => void generateArticle()}
                    disabled={loading || outline.length === 0}
                  >
                    {loading ? "Menghasilkan..." : "Approve & Generate Artikel"}
                  </button>
                </div>
              </div>
            ) : null}

            {step === "article" ? (
              <div className="gdc-ai__card">
                <label className="gdc-ai__label">Pratinjau artikel</label>
                <div
                  className="gdc-ai__preview"
                  dangerouslySetInnerHTML={{ __html: articleHtml }}
                />
                <div className="gdc-ai__actions">
                  <button
                    type="button"
                    className="gdc-ai__btn--ghost gdc-ai__btn"
                    onClick={() => setStep("outline")}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    className="gdc-ai__btn"
                    onClick={() => setStep("finalize")}
                    disabled={!articleLexical}
                  >
                    Lanjut ke Finalisasi
                  </button>
                </div>
              </div>
            ) : null}

            {step === "finalize" ? (
              <div className="gdc-ai__card">
                {categories.length > 0 ? (
                  <>
                    <label className="gdc-ai__label" htmlFor="gdc-ai-category">
                      Kategori artikel
                    </label>
                    <select
                      id="gdc-ai-category"
                      className="gdc-ai__field"
                      style={{ marginBottom: "16px" }}
                      value={selectedCategory}
                      onChange={(event) =>
                        setSelectedCategory(
                          event.target.value ? Number(event.target.value) : "",
                        )
                      }
                    >
                      <option value="">— Pilih nanti di editor —</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </>
                ) : null}

                <label className="gdc-ai__label">Featured image (opsional)</label>
                {featuredMedia ? (
                  <div className="gdc-ai__featured">
                    {/* eslint-disable-next-line @next/next/no-img-element -- preview media Cloudinary, bukan aset lokal */}
                    <img
                      src={resolveMediaUrl(featuredMedia) || ""}
                      alt={featuredMedia.alt || "Featured image"}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{featuredMedia.name}</div>
                      <button
                        type="button"
                        className="gdc-ai__btn--ghost gdc-ai__btn"
                        onClick={() => setFeaturedMedia(null)}
                      >
                        Ganti
                      </button>
                    </div>
                  </div>
                ) : (
                  <StockPhotoPicker
                    apiRoute={apiRoute}
                    context={selectedTitle}
                    providers={stockProviders}
                    onImported={(media) => setFeaturedMedia(media)}
                  />
                )}

                <div className="gdc-ai__actions">
                  <button
                    type="button"
                    className="gdc-ai__btn--ghost gdc-ai__btn"
                    onClick={() => setStep("article")}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    className="gdc-ai__btn"
                    onClick={() => void finalize()}
                    disabled={loading}
                  >
                    {loading ? "Menyimpan..." : "Simpan sebagai Draft & Buka Editor"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
