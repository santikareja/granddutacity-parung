"use client";

// Editor artikel berbasis Lexical untuk CMS kustom.
//
// Format state yang dibaca/ditulis SAMA dengan Payload, sehingga 30+ artikel
// lama terbuka apa adanya dan renderer frontend tetap bekerja. Node yang
// didaftarkan mencakup UploadNode kustom (kompatibel node "upload" Payload).

import { useCallback, useMemo, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import type { EditorState, LexicalEditor } from "lexical";

import { editorTheme } from "./theme";
import { UploadNode } from "./upload-node";
import UploadPlugin, { INSERT_UPLOAD_COMMAND } from "./upload-plugin";
import EditorToolbar from "./toolbar";
import MediaPickerDialog, { type PickedMedia } from "./media-picker-dialog";

type ArticleEditorProps = {
  /** Lexical state awal (dari DB). Null untuk artikel baru. */
  initialState: unknown;
  onChange: (state: unknown) => void;
};

export default function ArticleEditor({
  initialState,
  onChange,
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
    <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
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
          <UploadPlugin />
        </div>
      </LexicalComposer>

      {pickerOpen ? (
        <MediaPickerDialog
          onClose={() => setPickerOpen(false)}
          onPick={insertMedia}
        />
      ) : null}
    </div>
  );
}
