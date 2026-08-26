"use client";

// Editor artikel berbasis Lexical.
//
// Node yang didaftarkan harus mencakup semua tipe yang mungkin ada di korpus
// artikel warisan Payload. Bila sebuah tipe node tidak terdaftar, Lexical
// melempar saat memuat state awal dan artikel tidak bisa dibuka sama sekali.
// Karena itu TableNode/TableRowNode/TableCellNode dan HorizontalRuleNode ikut
// didaftarkan meski toolbar tidak menyediakan tombol untuk membuatnya.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import type { EditorState, LexicalEditor } from "lexical";

import { editorTheme } from "./theme";
import { UploadNode } from "./upload-node";
import UploadPlugin, { INSERT_UPLOAD_COMMAND } from "./upload-plugin";
import EditorToolbar from "./toolbar";
import MediaPickerDialog, {
  type MediaCapabilities,
  type PickedMedia,
} from "./media-picker-dialog";

/**
 * Permintaan penggantian seluruh isi editor dari luar (mis. hasil AI Assist).
 * `token` harus berubah setiap kali penerapan baru diminta; itulah yang memicu
 * penerapan, bukan identitas objek `state`.
 */
export type EditorApplyRequest = {
  state: unknown;
  token: number;
};

type ArticleEditorProps = {
  /** Lexical state awal (dari DB). Null untuk artikel baru. */
  initialState: unknown;
  onChange: (state: unknown) => void;
  mediaCapabilities: MediaCapabilities;
  /** Konteks untuk metadata AI saat mengimpor foto stok. */
  mediaContext?: string;
  applyRequest?: EditorApplyRequest | null;
};

/**
 * Mengganti seluruh isi editor saat `applyRequest.token` berubah.
 *
 * `LexicalComposer` hanya membaca `initialConfig.editorState` sekali saat mount,
 * jadi mengubah prop `initialState` tidak berpengaruh pada editor yang sudah
 * hidup. Penggantian harus imperatif lewat instance editor.
 */
function ApplyExternalStatePlugin({
  request,
}: {
  request: EditorApplyRequest | null | undefined;
}) {
  const [editor] = useLexicalComposerContext();
  const appliedToken = useRef<number | null>(null);

  useEffect(() => {
    if (!request) return;
    if (appliedToken.current === request.token) return;
    if (!request.state || typeof request.state !== "object") return;

    appliedToken.current = request.token;

    try {
      const parsed = editor.parseEditorState(
        JSON.stringify(request.state),
      );
      editor.setEditorState(parsed);
    } catch (error) {
      // Jangan biarkan state tak terduga mematikan editor: laporkan saja.
      console.error("[ArticleEditor] gagal menerapkan state eksternal:", error);
    }
  }, [editor, request]);

  return null;
}

export default function ArticleEditor({
  initialState,
  onChange,
  mediaCapabilities,
  mediaContext,
  applyRequest,
}: ArticleEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const editorRef = useRef<LexicalEditor | null>(null);

  // editorState hanya dibaca sekali saat mount; perubahan berikutnya dikelola
  // Lexical sendiri. Karena itu di-memo agar tidak me-reset editor tiap render.
  const initialConfig = useMemo(
    () => ({
      namespace: "GdcArticleEditor",
      theme: editorTheme,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AutoLinkNode,
        TableNode,
        TableRowNode,
        TableCellNode,
        HorizontalRuleNode,
        UploadNode,
      ],
      editorState:
        initialState && typeof initialState === "object"
          ? JSON.stringify(initialState)
          : undefined,
      onError: (error: Error) => {
        // Jangan menelan error diam-diam: editor rusak lebih baik terlihat.
        console.error("[ArticleEditor] Lexical error:", error);
      },
    }),
    [initialState],
  );

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      editorRef.current = editor;
      onChange(editorState.toJSON());
    },
    [onChange],
  );

  const insertMedia = useCallback((media: PickedMedia) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.dispatchCommand(INSERT_UPLOAD_COMMAND, {
      // Kirim objek media agar pratinjau langsung tampil tanpa fetch ulang.
      value: {
        id: media.id,
        url: media.url,
        alt: media.alt,
        caption: media.caption,
        width: media.width,
        height: media.height,
      },
      alt: media.alt ?? undefined,
      caption: media.caption ?? undefined,
    });

    setPickerOpen(false);
  }, []);

  return (
    // TANPA overflow-hidden: `overflow` apa pun selain `visible` pada ancestor
    // menjadikan elemen ini scroll container terdekat untuk toolbar
    // `position: sticky`, sehingga toolbar tidak pernah menempel saat halaman
    // digulir. Sudut membulat ditangani per-anak (toolbar rounded-t, area teks
    // rounded-b) agar tampilan tetap rapi tanpa memotong sticky.
    <div className="rounded-xl border border-admin-border bg-admin-surface">
      <LexicalComposer initialConfig={initialConfig}>
        <EditorToolbar onRequestImage={() => setPickerOpen(true)} />

        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="gdc-editor__input gdc-editor"
                aria-label="Isi artikel"
              />
            }
            placeholder={
              <div className="gdc-editor__placeholder">
                Mulai menulis artikel…
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TabIndentationPlugin />
          <TablePlugin />
          <UploadPlugin />
          <ApplyExternalStatePlugin request={applyRequest} />
        </div>
      </LexicalComposer>

      {pickerOpen ? (
        <MediaPickerDialog
          capabilities={mediaCapabilities}
          context={mediaContext}
          onClose={() => setPickerOpen(false)}
          onPick={insertMedia}
        />
      ) : null}
    </div>
  );
}
