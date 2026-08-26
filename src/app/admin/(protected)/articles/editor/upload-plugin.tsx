"use client";

// Plugin: menyisipkan UploadNode ke editor lewat command kustom, sehingga
// komponen luar (dialog pemilih media) tidak perlu tahu detail Lexical.

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from "lexical";
import { $insertNodeToNearestRoot } from "@lexical/utils";

import { $createUploadNode, UploadNode, type UploadValue } from "./upload-node";

export type InsertUploadPayload = {
  value: UploadValue;
  alt?: string;
  caption?: string;
};

export const INSERT_UPLOAD_COMMAND: LexicalCommand<InsertUploadPayload> =
  createCommand("INSERT_UPLOAD_COMMAND");

export default function UploadPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([UploadNode])) {
      throw new Error("UploadPlugin: UploadNode belum terdaftar di editor.");
    }

    return editor.registerCommand<InsertUploadPayload>(
      INSERT_UPLOAD_COMMAND,
      (payload) => {
        const node = $createUploadNode(payload.value, {
          alignment: "center",
          ...(payload.alt ? { alt: payload.alt } : {}),
          ...(payload.caption ? { captionOverride: payload.caption } : {}),
        });

        $insertNodeToNearestRoot(node);

        // Sisipkan paragraf kosong setelah gambar agar kursor punya tempat
        // menulis dan gambar tidak menjadi blok terakhir yang sulit dilewati.
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const paragraph = $createParagraphNode();
          node.insertAfter(paragraph);
          paragraph.select();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
