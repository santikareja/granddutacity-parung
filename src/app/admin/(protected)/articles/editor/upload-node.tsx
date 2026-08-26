"use client";

// Node upload gambar untuk editor Lexical CMS kustom.
//
// Bentuk serialisasi WAJIB identik dengan node "upload" milik Payload agar:
//   - artikel lama (30+) tetap terbaca di editor ini
//   - renderer frontend (ArticleRichContent) tetap menampilkan gambar
// Bentuk Payload: { type: "upload", relationTo: "media", value: <id|obj>,
//                   fields: { alignment?, captionOverride?, alt? }, version: 3 }

import { DecoratorNode } from "lexical";
import type {
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import type { JSX } from "react";

export type UploadAlignment = "left" | "center" | "right";

export type UploadFields = {
  alignment?: UploadAlignment;
  captionOverride?: string;
  alt?: string;
};

// `value` bisa berupa id (number) atau objek media hasil populate Payload.
export type UploadValue = number | { id: number; [k: string]: unknown };

export type SerializedUploadNode = Spread<
  {
    type: "upload";
    relationTo: string;
    value: UploadValue;
    fields: UploadFields | null;
    version: 3;
  },
  SerializedLexicalNode
>;

// Data tampilan yang dibutuhkan editor. Diambil dari objek media bila sudah
// di-populate; kalau `value` hanya id, editor akan mengambilnya lewat API.
export type UploadDisplay = {
  url: string | null;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
};

const readMediaDisplay = (value: UploadValue): UploadDisplay => {
  if (typeof value === "number") {
    return { url: null, alt: null, caption: null, width: null, height: null };
  }

  const asString = (key: string): string | null => {
    const raw = (value as Record<string, unknown>)[key];
    return typeof raw === "string" && raw.length > 0 ? raw : null;
  };
  const asNumber = (key: string): number | null => {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === "number") return raw;
    if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) {
      return Number(raw);
    }
    return null;
  };

  return {
    // Prioritas URL mengikuti frontend: transformedUrl → cloudinaryUrl → url → thumbnail.
    url:
      asString("transformedUrl") ||
      asString("cloudinaryUrl") ||
      asString("url") ||
      asString("thumbnailURL") ||
      asString("originalUrl"),
    alt: asString("alt"),
    caption: asString("caption"),
    width: asNumber("width"),
    height: asNumber("height"),
  };
};

export class UploadNode extends DecoratorNode<JSX.Element> {
  __relationTo: string;
  __value: UploadValue;
  __fields: UploadFields;

  static getType(): string {
    return "upload";
  }

  static clone(node: UploadNode): UploadNode {
    return new UploadNode(
      node.__value,
      node.__fields,
      node.__relationTo,
      node.__key,
    );
  }

  constructor(
    value: UploadValue,
    fields: UploadFields = {},
    relationTo = "media",
    key?: NodeKey,
  ) {
    super(key);
    this.__value = value;
    this.__fields = fields ?? {};
    this.__relationTo = relationTo;
  }

  static importJSON(serialized: SerializedUploadNode): UploadNode {
    return new UploadNode(
      serialized.value,
      serialized.fields ?? {},
      serialized.relationTo ?? "media",
    );
  }

  exportJSON(): SerializedUploadNode {
    return {
      type: "upload",
      relationTo: this.__relationTo,
      value: this.__value,
      fields: this.__fields,
      version: 3,
    };
  }

  // Gambar adalah blok tersendiri, bukan inline.
  isInline(): boolean {
    return false;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "gdc-upload-node";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const display = readMediaDisplay(this.__value);
    const element = document.createElement("img");
    if (display.url) element.setAttribute("src", display.url);
    element.setAttribute(
      "alt",
      this.__fields.alt || display.alt || "Gambar artikel",
    );
    return { element };
  }

  getMediaId(): number {
    return typeof this.__value === "number" ? this.__value : this.__value.id;
  }

  getDisplay(): UploadDisplay {
    return readMediaDisplay(this.__value);
  }

  getFields(): UploadFields {
    return { ...this.__fields };
  }

  setFields(fields: UploadFields): void {
    const writable = this.getWritable();
    writable.__fields = { ...writable.__fields, ...fields };
  }

  setValue(value: UploadValue): void {
    const writable = this.getWritable();
    writable.__value = value;
  }

  // Signature `decorate` ditentukan DecoratorNode; kedua argumen tidak dipakai
  // karena node ini merender sendiri tanpa konfigurasi editor.
  decorate(): JSX.Element {
    const display = readMediaDisplay(this.__value);
    const alignment = this.__fields.alignment ?? "center";
    const alt = this.__fields.alt || display.alt || "Gambar artikel";
    const caption = this.__fields.captionOverride || display.caption;

    const alignClass =
      alignment === "left"
        ? "mr-auto"
        : alignment === "right"
          ? "ml-auto"
          : "mx-auto";

    return (
      <figure
        className={`my-4 w-full max-w-2xl ${alignClass}`}
        data-gdc-upload={this.getKey()}
      >
        {display.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau editor; URL Cloudinary dinamis, bukan aset lokal
          <img
            src={display.url}
            alt={alt}
            className="h-auto w-full rounded-lg border border-[#e2e8f0]"
          />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-xs text-[#64748b]">
            Media #{this.getMediaId()} (pratinjau tidak tersedia)
          </div>
        )}
        {caption ? (
          <figcaption className="mt-1.5 text-xs text-[#64748b]">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }
}

export const $createUploadNode = (
  value: UploadValue,
  fields: UploadFields = {},
): UploadNode => new UploadNode(value, fields);

export const $isUploadNode = (
  node: LexicalNode | null | undefined,
): node is UploadNode => node instanceof UploadNode;
