"use client";

// Toolbar editor Lexical: format teks, heading, list, link, dan insert gambar.
// Sticky di atas area edit agar tetap terjangkau pada artikel panjang.

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  type ElementNode,
  type LexicalEditor,
} from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $setBlocksType } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Pilcrow,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link2,
  ImagePlus,
  Sparkles,
} from "lucide-react";

import { adminPost, AdminClientError } from "@/lib/v2-admin/api-client";

// Mode alat AI editor untuk teks terseleksi.
type TextToolMode = "rewrite" | "expand" | "shorten" | "proofread";

const AI_TOOLS: { mode: TextToolMode; label: string; title: string }[] = [
  { mode: "rewrite", label: "Tulis ulang", title: "Parafrase teks terpilih" },
  { mode: "expand", label: "Kembangkan", title: "Kembangkan teks terpilih" },
  { mode: "shorten", label: "Ringkas", title: "Ringkas teks terpilih" },
  { mode: "proofread", label: "Koreksi", title: "Perbaiki ejaan & tata bahasa" },
];

type ToolbarProps = {
  onRequestImage: () => void;
};

const btnBase =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed";
const btnIdle = `${btnBase} text-admin-fg-muted hover:bg-admin-surface-hover hover:text-admin-fg`;
const btnActive = `${btnBase} bg-admin-accent-soft font-semibold text-admin-accent-soft-fg`;

export default function EditorToolbar({ onRequestImage }: ToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  // Alat AI: aktif hanya bila ada teks terseleksi (non-collapsed).
  const [hasSelection, setHasSelection] = useState(false);
  const [aiBusy, setAiBusy] = useState<TextToolMode | null>(null);

  // Sinkronkan status tombol dengan seleksi aktif.
  useEffect(() => {
    const syncToolbar = () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setHasSelection(false);
        return;
      }
      setActiveFormats({
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        underline: selection.hasFormat("underline"),
      });
      setHasSelection(
        !selection.isCollapsed() &&
          selection.getTextContent().trim().length > 0,
      );
    };

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(syncToolbar);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          syncToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  // $setBlocksType generik atas ElementNode; factory-nya boleh mengembalikan
  // paragraph, heading, atau quote.
  const applyBlock = useCallback(
    (factory: () => ElementNode) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, factory);
        }
      });
    },
    [editor],
  );

  const insertLink = useCallback(
    (ed: LexicalEditor) => {
      const url = window.prompt("URL tautan (kosongkan untuk menghapus):", "https://");
      if (url === null) return;

      const trimmed = url.trim();
      if (!trimmed) {
        ed.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        return;
      }

      // Tolak skema aktif agar konten tersimpan bersih.
      if (/^(javascript|data|vbscript):/i.test(trimmed)) {
        window.alert("Skema URL tersebut tidak diizinkan.");
        return;
      }

      ed.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed);
    },
    [],
  );

  // Jalankan alat AI atas teks terseleksi lalu ganti seleksi dengan hasilnya.
  // onMouseDown pada tombol mem-preventDefault agar seleksi editor tidak hilang
  // saat tombol diklik, sehingga insertText mengganti tepat teks yang dipilih.
  const runTextTool = useCallback(
    async (mode: TextToolMode) => {
      if (aiBusy) return;

      // Ambil teks terseleksi dari state editor tanpa mengubahnya.
      let selectedText = "";
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          selectedText = selection.getTextContent();
        }
      });

      const trimmed = selectedText.trim();
      if (!trimmed) {
        window.alert("Pilih (blok) teks terlebih dahulu untuk memakai alat AI.");
        return;
      }

      setAiBusy(mode);
      try {
        const data = await adminPost<{ text: string }>(
          "/api/v2/ai/text-tool",
          { body: { mode, text: trimmed }, timeoutMs: 120_000 },
        );

        const result = (data.text ?? "").trim();
        if (!result) {
          window.alert("AI tidak menghasilkan teks.");
          return;
        }

        // Ganti teks terseleksi dengan hasil. insertText hanya menyentuh
        // rentang seleksi; node non-teks di luar seleksi tidak terganggu.
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            selection.insertText(result);
          }
        });
      } catch (error) {
        window.alert(
          error instanceof AdminClientError
            ? error.message
            : "Gagal memproses teks dengan AI.",
        );
      } finally {
        setAiBusy(null);
      }
    },
    [editor, aiBusy],
  );

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-admin-border bg-admin-surface/95 px-3 py-2 backdrop-blur">
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        className={btnIdle}
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Shift+Z)"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        className={btnIdle}
      >
        <Redo2 className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-admin-border" />

      <button
        type="button"
        title="Bold (Ctrl+B)"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={activeFormats.bold ? btnActive : btnIdle}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Italic (Ctrl+I)"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={activeFormats.italic ? btnActive : btnIdle}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Underline (Ctrl+U)"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className={activeFormats.underline ? btnActive : btnIdle}
      >
        <Underline className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-admin-border" />

      <button
        type="button"
        title="Paragraf"
        onClick={() => applyBlock(() => $createParagraphNode())}
        className={btnIdle}
      >
        <Pilcrow className="h-4 w-4" />
      </button>
      {/* H1 sengaja tidak disediakan: judul artikel sudah menjadi H1 di halaman publik. */}
      <button
        type="button"
        title="Heading 2"
        onClick={() => applyBlock(() => $createHeadingNode("h2"))}
        className={btnIdle}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Heading 3"
        onClick={() => applyBlock(() => $createHeadingNode("h3"))}
        className={btnIdle}
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Kutipan"
        onClick={() => applyBlock(() => $createQuoteNode())}
        className={btnIdle}
      >
        <Quote className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-admin-border" />

      <button
        type="button"
        title="Daftar berpoin"
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
        className={btnIdle}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Daftar bernomor"
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
        className={btnIdle}
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-admin-border" />

      <button
        type="button"
        title="Tautan"
        onClick={() => insertLink(editor)}
        className={btnIdle}
      >
        <Link2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Sisipkan gambar"
        onClick={onRequestImage}
        className={btnIdle}
      >
        <ImagePlus className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-admin-border" />

      <span
        className="flex items-center gap-1 px-1 text-[11px] font-bold uppercase tracking-wide text-admin-accent"
        title={
          hasSelection
            ? "Alat AI untuk teks terpilih"
            : "Pilih (blok) teks lebih dulu"
        }
      >
        <Sparkles className="h-3 w-3" />
        AI
      </span>
      {AI_TOOLS.map((tool) => (
        <button
          key={tool.mode}
          type="button"
          title={
            hasSelection
              ? tool.title
              : `${tool.title} — pilih teks terlebih dahulu`
          }
          // Cegah editor kehilangan seleksi saat tombol ditekan.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void runTextTool(tool.mode)}
          disabled={!hasSelection || aiBusy !== null}
          className={btnIdle}
        >
          {aiBusy === tool.mode ? "…" : tool.label}
        </button>
      ))}
    </div>
  );
}
