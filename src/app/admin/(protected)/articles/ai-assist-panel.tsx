"use client";

// Panel AI Assist untuk halaman editor artikel.
//
// Alur tiga tahap dengan persetujuan penulis di setiap langkah:
//   1. Judul  — dari topik, hasilkan 5 opsi judul (listicle/how-to/panduan/dll)
//   2. Outline— dari judul terpilih, hasilkan struktur H2/H3 yang bisa diedit
//                dan diterapkan ke editor
//   3. Konten — dari outline, tulis artikel penuh sesuai target jumlah kata
//
// Panel ini TIDAK menyimpan apa pun ke server. Hasilnya diserahkan ke halaman
// editor lewat callback, sehingga penyimpanan tetap satu jalur (tombol Simpan
// Draft / Publish) dan autosave yang sudah ada tidak berubah perilakunya.

import { useCallback, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  RotateCcw,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { AdminClientError, adminPost } from "@/lib/v2-admin/api-client";
import { outlineToLexicalState } from "@/lib/v2-admin/lexical";
import {
  AdminAlert,
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";

type OutlineSection = { heading: string; subheadings: string[] };

type Step = "titles" | "outline" | "content";

const STEPS: { key: Step; label: string }[] = [
  { key: "titles", label: "1. Judul" },
  { key: "outline", label: "2. Outline" },
  { key: "content", label: "3. Konten" },
];

const WORD_OPTIONS = [600, 800, 1000, 1200, 1500, 2000, 2500, 3000];

const TITLE_COUNT = 5;

type Props = {
  aiEnabled: boolean;
  aiModel: string | null;
  /** Judul yang sedang ada di form; dipakai bila penulis melewati tahap judul. */
  currentTitle: string;
  onClose: () => void;
  onApplyTitle: (title: string) => void;
  /** Terapkan Lexical state ke editor. `topic` dicatat sebagai metadata AI. */
  onApplyContent: (state: unknown, meta: { topic: string }) => void;
};

const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof AdminClientError || err instanceof Error
    ? err.message || fallback
    : fallback;

export default function AiAssistPanel({
  aiEnabled,
  aiModel,
  currentTitle,
  onClose,
  onApplyTitle,
  onApplyContent,
}: Props) {
  const [step, setStep] = useState<Step>("titles");
  const [busy, setBusy] = useState<null | "titles" | "outline" | "content">(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState(currentTitle);
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [targetWords, setTargetWords] = useState(1200);
  const [articleContent, setArticleContent] = useState<unknown>(null);
  const [articleWordCount, setArticleWordCount] = useState<number | null>(null);
  // Model yang benar-benar dipakai pada permintaan terakhir. Bisa berbeda dari
  // model default bila sistem berotasi karena model pertama timeout/gagal.
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [rotatedNotice, setRotatedNotice] = useState<string | null>(null);

  // Catat model yang dipakai + beri tahu penulis bila terjadi rotasi, supaya
  // perbedaan gaya keluaran tidak terasa misterius.
  const noteModel = useCallback(
    (model?: string, rotated?: boolean) => {
      if (model) setUsedModel(model);
      setRotatedNotice(
        rotated && model
          ? `Model utama tidak merespons, sistem otomatis berpindah ke "${model}".`
          : null,
      );
    },
    [],
  );

  const run = useCallback(
    async (kind: "titles" | "outline" | "content", task: () => Promise<void>) => {
      setBusy(kind);
      setError(null);
      setNotice(null);
      try {
        await task();
      } catch (err) {
        setError(errorMessage(err, "Permintaan AI gagal."));
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const generateTitles = () =>
    run("titles", async () => {
      const trimmed = topic.trim();
      if (!trimmed) {
        setError("Masukkan topik terlebih dahulu.");
        return;
      }
      const data = await adminPost<{
        titles: string[];
        model?: string;
        rotated?: boolean;
      }>("/api/v2/ai/titles", {
        body: { topic: trimmed, count: TITLE_COUNT },
        // Server memberi anggaran rotasi 170 detik; timeout klien harus lebih
        // longgar, kalau tidak permintaan dibatalkan sebelum rotasi selesai.
        timeoutMs: 190_000,
      });
      setTitles(Array.isArray(data.titles) ? data.titles : []);
      noteModel(data.model, data.rotated);
    });

  const chooseTitle = useCallback(
    (title: string) => {
      setSelectedTitle(title);
      onApplyTitle(title);
      setOutline([]);
      setArticleContent(null);
      setNotice("Judul diterapkan ke form artikel.");
      setStep("outline");
    },
    [onApplyTitle],
  );

  const generateOutline = () =>
    run("outline", async () => {
      const title = (selectedTitle || currentTitle).trim();
      if (!title) {
        setError("Pilih atau isi judul terlebih dahulu.");
        return;
      }
      const data = await adminPost<{
        sections: OutlineSection[];
        model?: string;
        rotated?: boolean;
      }>("/api/v2/ai/outline", { body: { title }, timeoutMs: 190_000 });
      setOutline(
        (Array.isArray(data.sections) ? data.sections : []).map((section) => ({
          heading: section.heading ?? "",
          subheadings: Array.isArray(section.subheadings)
            ? section.subheadings
            : [],
        })),
      );
      setArticleContent(null);
      noteModel(data.model, data.rotated);
    });

  const applyOutlineToEditor = useCallback(() => {
    const usable = outline.filter((section) => section.heading.trim());
    if (usable.length === 0) {
      setError("Outline masih kosong.");
      return;
    }
    onApplyContent(outlineToLexicalState(usable), { topic: topic.trim() });
    setNotice("Outline diterapkan ke editor. Isi tiap bagian atau lanjut ke tahap Konten.");
  }, [outline, onApplyContent, topic]);

  const generateArticle = () =>
    run("content", async () => {
      const title = (selectedTitle || currentTitle).trim();
      if (!title) {
        setError("Judul wajib ada sebelum menulis artikel.");
        return;
      }
      const usable = outline
        .filter((section) => section.heading.trim())
        .map((section) => ({
          heading: section.heading.trim(),
          subheadings: section.subheadings
            .map((sub) => sub.trim())
            .filter((sub) => sub.length > 0),
        }));

      if (usable.length === 0) {
        setError("Outline wajib dibuat lebih dulu di tahap 2.");
        return;
      }

      const data = await adminPost<{
        html: string;
        content: unknown;
        model?: string;
        rotated?: boolean;
        wordCount?: number;
        warning?: string;
      }>("/api/v2/ai/article", {
        body: { title, outline: usable, targetWords },
        // Server memberi maxDuration 300s untuk artikel panjang; timeout klien
        // harus setidaknya sama, kalau tidak permintaan dibatalkan sepihak.
        timeoutMs: 300_000,
      });

      setArticleContent(data.content ?? null);
      const words =
        typeof data.wordCount === "number"
          ? data.wordCount
          : (data.html ?? "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(
              (w) => w.length > 0,
            ).length;
      setArticleWordCount(words);
      noteModel(data.model, data.rotated);

      // Peringatan dari server (terpotong / jauh di bawah target) lebih penting
      // ditampilkan daripada pesan sukses biasa.
      if (data.warning) {
        setError(data.warning);
      } else {
        setNotice(
          `Artikel siap (~${words} kata). Periksa lalu terapkan ke editor.`,
        );
      }
    });

  const applyArticleToEditor = useCallback(() => {
    if (!articleContent) {
      setError("Belum ada artikel yang di-generate.");
      return;
    }
    onApplyContent(articleContent, { topic: topic.trim() });
    setNotice("Artikel diterapkan ke editor.");
  }, [articleContent, onApplyContent, topic]);

  // --- Editor outline -------------------------------------------------------
  const updateHeading = (index: number, value: string) =>
    setOutline((prev) =>
      prev.map((s, i) => (i === index ? { ...s, heading: value } : s)),
    );

  const updateSub = (sectionIndex: number, subIndex: number, value: string) =>
    setOutline((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              subheadings: s.subheadings.map((sub, j) =>
                j === subIndex ? value : sub,
              ),
            }
          : s,
      ),
    );

  const removeSection = (index: number) =>
    setOutline((prev) => prev.filter((_, i) => i !== index));

  const addSection = () =>
    setOutline((prev) => [...prev, { heading: "", subheadings: [] }]);

  const addSub = (sectionIndex: number) =>
    setOutline((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, subheadings: [...s.subheadings, ""] }
          : s,
      ),
    );

  const removeSub = (sectionIndex: number, subIndex: number) =>
    setOutline((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              subheadings: s.subheadings.filter((_, j) => j !== subIndex),
            }
          : s,
      ),
    );

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <aside
      // Lebar ditahan 340px (turun dari 440px): panel ini hanya berisi kontrol,
      // sedangkan area yang benar-benar butuh ruang adalah editor teks.
      className="admin-modal-panel fixed inset-y-0 right-0 z-40 flex w-full max-w-[340px] flex-col border-l border-admin-border bg-admin-surface shadow-admin-lg"
      role="dialog"
      aria-modal="false"
      aria-label="AI Assist"
    >
      <header className="flex items-start justify-between gap-3 border-b border-admin-border px-5 py-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-admin-accent">
            <Sparkles className="h-3.5 w-3.5" />
            AI Assist
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-admin-fg">
            Tulis artikel bertahap
          </h2>
          {usedModel || aiModel ? (
            <p className="mt-0.5 font-mono text-[11px] text-admin-fg-dim">
              {usedModel ?? aiModel}
            </p>
          ) : null}
        </div>
        <AdminButton variant="ghost" size="icon" onClick={onClose} aria-label="Tutup panel AI">
          <X className="h-4 w-4" />
        </AdminButton>
      </header>

      {!aiEnabled ? (
        <div className="p-5">
          <AdminAlert variant="warning">
            Layanan AI belum aktif. Tambahkan provider (Base URL + API Key) dan
            tandai satu sebagai default di Konfigurasi AI.
          </AdminAlert>
        </div>
      ) : (
        <>
          <nav className="flex gap-1 border-b border-admin-border px-5 py-2.5">
            {STEPS.map((entry, index) => {
              const isActive = entry.key === step;
              const isDone = index < stepIndex;
              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setStep(entry.key)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition ${
                    isActive
                      ? "bg-admin-accent-soft font-semibold text-admin-accent-soft-fg"
                      : "text-admin-fg-muted hover:bg-admin-surface-hover hover:text-admin-fg"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : null}
                  {entry.label}
                </button>
              );
            })}
          </nav>

          <div className="admin-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
            {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
            {notice ? <AdminAlert variant="success">{notice}</AdminAlert> : null}
            {rotatedNotice ? (
              <AdminAlert variant="info">{rotatedNotice}</AdminAlert>
            ) : null}

            {/* --- Tahap 1: judul ------------------------------------------ */}
            {step === "titles" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <AdminLabel htmlFor="ai-topic">Topik artikel</AdminLabel>
                  <AdminTextarea
                    id="ai-topic"
                    className="min-h-24"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="Mis. keunggulan lokasi Grand Duta City Parung untuk pekerja Jakarta Selatan"
                  />
                  <p className="text-xs text-admin-fg-dim">
                    AI akan membuat {TITLE_COUNT} opsi judul dengan format
                    berbeda: listicle, how-to, panduan, dan lainnya.
                  </p>
                </div>

                <AdminButton
                  variant="primary"
                  onClick={() => void generateTitles()}
                  disabled={busy !== null || !topic.trim()}
                >
                  <Wand2 className="h-4 w-4" />
                  {busy === "titles"
                    ? "Membuat judul…"
                    : titles.length > 0
                      ? "Generate ulang"
                      : `Generate ${TITLE_COUNT} Judul`}
                </AdminButton>

                {titles.length > 0 ? (
                  <ul className="space-y-2">
                    {titles.map((title) => (
                      <li key={title}>
                        <div className="rounded-lg border border-admin-border p-3">
                          <p className="text-sm font-medium text-admin-fg">
                            {title}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-admin-fg-dim">
                              {title.length} karakter
                            </span>
                            <AdminButton
                              size="sm"
                              variant="soft"
                              onClick={() => chooseTitle(title)}
                            >
                              Pakai judul ini
                              <ArrowRight className="h-3.5 w-3.5" />
                            </AdminButton>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {/* --- Tahap 2: outline ---------------------------------------- */}
            {step === "outline" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-admin-border bg-admin-surface-muted p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-admin-fg-dim">
                    Judul
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-admin-fg">
                    {selectedTitle || currentTitle || "— belum ada judul —"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AdminButton
                    variant="primary"
                    onClick={() => void generateOutline()}
                    disabled={
                      busy !== null || !(selectedTitle || currentTitle).trim()
                    }
                  >
                    <Wand2 className="h-4 w-4" />
                    {busy === "outline"
                      ? "Menyusun outline…"
                      : outline.length > 0
                        ? "Generate ulang"
                        : "Generate Outline"}
                  </AdminButton>
                  {outline.length > 0 ? (
                    <AdminButton variant="secondary" onClick={addSection}>
                      <Plus className="h-4 w-4" />
                      Bagian
                    </AdminButton>
                  ) : null}
                </div>

                {outline.length > 0 ? (
                  <>
                    <ol className="space-y-3">
                      {outline.map((section, sectionIndex) => (
                        <li
                          key={sectionIndex}
                          className="space-y-2 rounded-lg border border-admin-border p-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-[11px] font-bold text-admin-fg-dim">
                              H2
                            </span>
                            <AdminInput
                              value={section.heading}
                              onChange={(event) =>
                                updateHeading(sectionIndex, event.target.value)
                              }
                              placeholder="Judul bagian"
                            />
                            <AdminButton
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSection(sectionIndex)}
                              aria-label="Hapus bagian"
                            >
                              <X className="h-3.5 w-3.5" />
                            </AdminButton>
                          </div>

                          {section.subheadings.map((sub, subIndex) => (
                            <div
                              key={subIndex}
                              className="flex items-center gap-2 pl-4"
                            >
                              <span className="shrink-0 text-[11px] font-bold text-admin-fg-dim">
                                H3
                              </span>
                              <AdminInput
                                value={sub}
                                onChange={(event) =>
                                  updateSub(
                                    sectionIndex,
                                    subIndex,
                                    event.target.value,
                                  )
                                }
                                placeholder="Sub-bagian"
                              />
                              <AdminButton
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSub(sectionIndex, subIndex)}
                                aria-label="Hapus sub-bagian"
                              >
                                <X className="h-3.5 w-3.5" />
                              </AdminButton>
                            </div>
                          ))}

                          <AdminButton
                            variant="ghost"
                            size="sm"
                            onClick={() => addSub(sectionIndex)}
                            className="ml-4"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Sub-bagian
                          </AdminButton>
                        </li>
                      ))}
                    </ol>

                    <div className="flex flex-wrap gap-2 border-t border-admin-border pt-3">
                      <AdminButton variant="secondary" onClick={applyOutlineToEditor}>
                        <Check className="h-4 w-4" />
                        Terapkan ke Editor
                      </AdminButton>
                      <AdminButton variant="dark" onClick={() => setStep("content")}>
                        Lanjut ke Konten
                        <ArrowRight className="h-4 w-4" />
                      </AdminButton>
                    </div>
                    <p className="text-[11px] text-admin-fg-dim">
                      &quot;Terapkan ke Editor&quot; mengganti isi editor dengan
                      kerangka H2/H3 kosong. Kalau langsung ingin artikel penuh,
                      lompat ke tahap Konten.
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}

            {/* --- Tahap 3: konten ---------------------------------------- */}
            {step === "content" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-admin-border bg-admin-surface-muted p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-admin-fg-dim">
                    Akan ditulis dari
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-admin-fg">
                    {selectedTitle || currentTitle || "— belum ada judul —"}
                  </p>
                  <p className="mt-1 text-xs text-admin-fg-muted">
                    {outline.filter((s) => s.heading.trim()).length} bagian outline
                  </p>
                </div>

                <div className="space-y-1.5">
                  <AdminLabel htmlFor="ai-words">Target jumlah kata</AdminLabel>
                  <AdminSelect
                    id="ai-words"
                    value={String(targetWords)}
                    onChange={(event) =>
                      setTargetWords(Number(event.target.value))
                    }
                  >
                    {WORD_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option.toLocaleString("id-ID")} kata
                      </option>
                    ))}
                  </AdminSelect>
                  <p className="text-xs text-admin-fg-dim">
                    Artikel panjang butuh waktu lebih lama. CTA ke homepage
                    dengan anchor &quot;Grand Duta City Parung&quot; ditambahkan
                    otomatis di akhir.
                  </p>
                </div>

                <AdminButton
                  variant="primary"
                  onClick={() => void generateArticle()}
                  disabled={busy !== null}
                >
                  <Wand2 className="h-4 w-4" />
                  {busy === "content"
                    ? "Menulis artikel…"
                    : articleContent
                      ? "Generate ulang"
                      : "Generate Artikel"}
                </AdminButton>

                {busy === "content" ? (
                  <p className="text-xs text-admin-fg-muted">
                    Sedang menulis. Untuk target panjang besar ini bisa memakan
                    satu sampai beberapa menit — jangan tutup halaman.
                  </p>
                ) : null}

                {articleContent ? (
                  <div className="space-y-3 border-t border-admin-border pt-3">
                    <p className="text-sm text-admin-fg">
                      Artikel selesai
                      {articleWordCount
                        ? ` (~${articleWordCount.toLocaleString("id-ID")} kata)`
                        : ""}
                      .
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <AdminButton variant="secondary" onClick={applyArticleToEditor}>
                        <Check className="h-4 w-4" />
                        Terapkan ke Editor
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        onClick={() => void generateArticle()}
                        disabled={busy !== null}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Coba lagi
                      </AdminButton>
                    </div>
                    <p className="text-[11px] text-admin-fg-dim">
                      Menerapkan akan MENGGANTI seluruh isi editor, termasuk
                      kerangka outline yang sudah ada.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-admin-border px-5 py-3">
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() =>
                setStep(STEPS[Math.max(0, stepIndex - 1)]?.key ?? "titles")
              }
              disabled={stepIndex === 0}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali
            </AdminButton>
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() =>
                setStep(
                  STEPS[Math.min(STEPS.length - 1, stepIndex + 1)]?.key ??
                    "content",
                )
              }
              disabled={stepIndex === STEPS.length - 1}
            >
              Lanjut
              <ArrowRight className="h-3.5 w-3.5" />
            </AdminButton>
          </footer>
        </>
      )}
    </aside>
  );
}
