// Serializer Lexical → JSX milik sendiri, TANPA dependensi Payload.
//
// Pengganti `RichText` + `defaultConverters` dari
// "@payloadcms/richtext-lexical/react" (prasyarat Task 12B-1 sebelum Payload
// dicabut). Perilakunya adalah port 1:1 dari implementasi Payload 3.88.0:
//   node_modules/@payloadcms/richtext-lexical/dist/features/converters/lexicalToJSX/
//     - Component/index.js                (RichText)
//     - converter/index.js                (convertLexicalToJSX + node walker)
//     - converter/defaultConverters.js    (urutan merge converter)
//     - converter/converters/*.js         (per node type)
//   plus dist/validate/hasText.js dan dist/lexical/utils/nodeFormat.js
//
// KONTRAK SEO (R2 / P1): output HTML WAJIB byte-identik dengan renderer Payload.
// Buktinya ada di `__fixtures__/golden/*.html` (direkam saat Payload masih
// terpasang) dan diuji oleh `__tests__/lexical-renderer.test.tsx`. Jangan
// "merapikan" markup di file ini — perubahan sekecil atribut/urutan style akan
// mengubah HTML artikel publik.

import { cloneElement, createElement, isValidElement } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

/* -------------------------------------------------------------------------- */
/* Tipe publik (kompatibel dengan pemakaian JSXConverter milik Payload)        */
/* -------------------------------------------------------------------------- */

/** Node Lexical terserialisasi, dibaca secara permisif. */
export type LexicalNodeLike = {
  type?: string;
  [key: string]: unknown;
};

export type NodesToJSXArgs = {
  nodes: LexicalNodeLike[];
  converters?: JSXConverters;
  disableIndent?: boolean | string[];
  disableTextAlign?: boolean | string[];
  parent?: LexicalNodeLike;
};

export type JSXConverterArgs<TNode extends LexicalNodeLike = LexicalNodeLike> = {
  childIndex: number;
  converters: JSXConverters;
  node: TNode;
  nodesToJSX: (args: NodesToJSXArgs) => ReactNode[];
  parent: LexicalNodeLike;
};

/**
 * Converter untuk satu node type. Signature-nya sama dengan `JSXConverter`
 * Payload sehingga converter kustom existing (upload/readAlso) tidak perlu
 * diubah.
 */
export type JSXConverter<TNode extends LexicalNodeLike = LexicalNodeLike> = (
  args: JSXConverterArgs<TNode>,
) => ReactNode;

/** Sebuah entri converter boleh berupa fungsi ATAU node statis (mis. `<br />`). */
export type JSXConverterEntry = JSXConverter | ReactNode;

/** Map blockType → converter (untuk `blocks` / `inlineBlocks`). */
export type JSXConverterGroup = Record<string, JSXConverterEntry | undefined>;

export type JSXConverters = {
  [nodeType: string]: JSXConverterEntry | JSXConverterGroup | undefined;
};

/* -------------------------------------------------------------------------- */
/* Bitmask format text node (copy dari lexical/utils/nodeFormat.js)            */
/* -------------------------------------------------------------------------- */

const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;
const IS_SUBSCRIPT = 1 << 5;
const IS_SUPERSCRIPT = 1 << 6;

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

const asNodes = (value: unknown): LexicalNodeLike[] =>
  Array.isArray(value) ? (value as LexicalNodeLike[]) : [];

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

/**
 * uuid v4 untuk pasangan `<input id>` / `<label for>` pada checkbox list.
 * Payload memakai paket `uuid` (dependensi transitifnya); di sini dibuat lokal
 * agar tidak ada dependensi baru. Sama seperti Payload, nilainya acak sehingga
 * output checklist tidak deterministik antar-render.
 */
const uuidv4 = (): string => {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.trunc(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

/**
 * Port dari `dist/validate/hasText.js`. Menentukan apakah editor state dianggap
 * berisi konten; bila tidak, Payload merender container kosong.
 */
export function hasText(value: unknown): boolean {
  const root = (value as { root?: { children?: unknown } } | null | undefined)?.root;
  const children = asNodes(root?.children);

  if (children.length === 0) {
    return false;
  }

  let hasOnlyEmptyParagraph = false;

  if (children.length === 1) {
    const first = children[0];
    if (first?.type === "paragraph") {
      const paragraphChildren = asNodes(first.children);
      if (paragraphChildren.length === 0) {
        hasOnlyEmptyParagraph = true;
      } else if (paragraphChildren.length === 1) {
        const child = paragraphChildren[0];
        if (child?.type === "text" && !asString(child.text)?.length) {
          hasOnlyEmptyParagraph = true;
        }
      }
    }
  }

  return !hasOnlyEmptyParagraph;
}

/* -------------------------------------------------------------------------- */
/* Converter default (port dari converter/converters/*.js)                    */
/* -------------------------------------------------------------------------- */

const ParagraphJSXConverter: JSXConverters = {
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });

    if (!children?.length) {
      return (
        <p>
          <br />
        </p>
      );
    }

    return <p>{children}</p>;
  },
};

const TextJSXConverter: JSXConverters = {
  text: ({ node }) => {
    let text: ReactNode = asString(node.text) ?? "";
    const format = asNumber(node.format) ?? 0;

    if (format & IS_BOLD) {
      text = <strong>{text}</strong>;
    }
    if (format & IS_ITALIC) {
      text = <em>{text}</em>;
    }
    if (format & IS_STRIKETHROUGH) {
      text = <span style={{ textDecoration: "line-through" }}>{text}</span>;
    }
    if (format & IS_UNDERLINE) {
      text = <span style={{ textDecoration: "underline" }}>{text}</span>;
    }
    if (format & IS_CODE) {
      text = <code>{text}</code>;
    }
    if (format & IS_SUBSCRIPT) {
      text = <sub>{text}</sub>;
    }
    if (format & IS_SUPERSCRIPT) {
      text = <sup>{text}</sup>;
    }

    return text;
  },
};

const LinebreakJSXConverter: JSXConverters = {
  linebreak: <br />,
};

const BlockquoteJSXConverter: JSXConverters = {
  quote: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });
    return <blockquote>{children}</blockquote>;
  },
};

const TableJSXConverter: JSXConverters = {
  table: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });

    return (
      <div className="lexical-table-container">
        <table className="lexical-table" style={{ borderCollapse: "collapse" }}>
          <tbody>{children}</tbody>
        </table>
      </div>
    );
  },
  tablecell: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });
    const headerState = asNumber(node.headerState) ?? 0;
    const tagName = headerState > 0 ? "th" : "td";
    const headerStateClass = `lexical-table-cell-header-${headerState}`;
    const style: CSSProperties = {
      backgroundColor: asString(node.backgroundColor) || undefined,
      border: "1px solid #ccc",
      padding: "8px",
    };
    const rawColSpan = asNumber(node.colSpan);
    const rawRowSpan = asNumber(node.rowSpan);
    const colSpan = rawColSpan && rawColSpan > 1 ? rawColSpan : undefined;
    const rowSpan = rawRowSpan && rawRowSpan > 1 ? rawRowSpan : undefined;

    // eslint-disable-next-line react/no-children-prop -- tag dinamis; `children` lewat props menyamai `_jsx(Tag, { children })` hasil kompilasi Payload (dan menghindari validasi key varargs yang tidak ada di baseline)
    return createElement(tagName, {
      className: `lexical-table-cell ${headerStateClass}`,
      colSpan,
      rowSpan,
      style,
      children,
    });
  },
  tablerow: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });
    return <tr className="lexical-table-row">{children}</tr>;
  },
};

const HeadingJSXConverter: JSXConverters = {
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });
    const nodeTag = asString(node.tag) ?? "h1";
    // eslint-disable-next-line react/no-children-prop -- tag dinamis; lihat catatan di `tablecell`
    return createElement(nodeTag, { children });
  },
};

const HorizontalRuleJSXConverter: JSXConverters = {
  horizontalrule: <hr />,
};

const ListJSXConverter: JSXConverters = {
  list: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });
    const nodeTag = asString(node.tag) ?? "ul";

    // eslint-disable-next-line react/no-children-prop -- tag dinamis; lihat catatan di `tablecell`
    return createElement(nodeTag, {
      className: `list-${asString(node.listType)}`,
      children,
    });
  },
  listitem: ({ node, nodesToJSX, parent }) => {
    const nodeChildren = asNodes(node.children);
    const hasSubLists = nodeChildren.some((child) => child.type === "list");
    const children = nodesToJSX({ nodes: nodeChildren });
    const checked = node.checked === true;

    if ("listType" in parent && parent?.listType === "check") {
      const uuid = uuidv4();

      return (
        <li
          aria-checked={checked ? "true" : "false"}
          className={`list-item-checkbox${
            checked ? " list-item-checkbox-checked" : " list-item-checkbox-unchecked"
          }${hasSubLists ? " nestedListItem" : ""}`}
          // role="checkbox" pada <li> adalah paritas markup dengan
          // defaultConverters Payload (kontrak SEO), bukan pilihan a11y baru.
          role="checkbox"
          style={{ listStyleType: "none" }}
          tabIndex={-1}
          value={asNumber(node.value)}
        >
          {hasSubLists ? (
            children
          ) : (
            <>
              <input checked={checked} id={uuid} readOnly type="checkbox" />
              <label htmlFor={uuid}>{children}</label>
              <br />
            </>
          )}
        </li>
      );
    }

    return (
      <li
        className={`${hasSubLists ? "nestedListItem" : ""}`}
        style={hasSubLists ? { listStyleType: "none" } : undefined}
        value={asNumber(node.value)}
      >
        {children}
      </li>
    );
  },
};

export type InternalDocToHrefArgs = { linkNode: LexicalNodeLike };

export const LinkJSXConverter = ({
  internalDocToHref,
}: {
  internalDocToHref?: (args: InternalDocToHrefArgs) => string;
}): JSXConverters => ({
  autolink: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });
    const fields = (node.fields ?? {}) as { newTab?: boolean; url?: string };
    const rel = fields.newTab ? "noopener noreferrer" : undefined;
    const target = fields.newTab ? "_blank" : undefined;

    return (
      <a href={fields.url} rel={rel} target={target}>
        {children}
      </a>
    );
  },
  link: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: asNodes(node.children) });
    const fields = (node.fields ?? {}) as {
      linkType?: string;
      newTab?: boolean;
      url?: string;
    };
    const rel = fields.newTab ? "noopener noreferrer" : undefined;
    const target = fields.newTab ? "_blank" : undefined;
    let href = fields.url ?? "";

    if (fields.linkType === "internal") {
      if (internalDocToHref) {
        href = internalDocToHref({ linkNode: node });
      } else {
        console.error(
          "Lexical => JSX converter: Link converter: found internal link, but internalDocToHref is not provided",
        );
        href = "#"; // fallback
      }
    }

    return (
      <a href={href} rel={rel} target={target}>
        {children}
      </a>
    );
  },
});

type UploadSize = {
  filename?: string | null;
  filesize?: number | null;
  height?: number | null;
  mimeType?: string | null;
  url?: string | null;
  width?: number | null;
};

const UploadJSXConverter: JSXConverters = {
  upload: ({ node }) => {
    if (typeof node.value !== "object" || node.value === null) {
      return null;
    }

    const uploadDoc = node.value as {
      alt?: string | null;
      filename?: string | null;
      height?: number | null;
      mimeType?: string | null;
      sizes?: Record<string, UploadSize | null | undefined> | null;
      url?: string | null;
      width?: number | null;
    };
    const fields = (node.fields ?? {}) as { alt?: string };
    const alt = fields.alt || uploadDoc?.alt || "";
    const url = uploadDoc.url ?? undefined;

    // Bukan gambar → tautan ke file.
    if (!uploadDoc.mimeType?.startsWith("image")) {
      return (
        <a href={url} rel="noopener noreferrer">
          {uploadDoc.filename}
        </a>
      );
    }

    // Gambar tanpa varian ukuran → <img> sederhana.
    if (!uploadDoc.sizes || !Object.keys(uploadDoc.sizes).length) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- paritas markup dengan defaultConverters Payload (kontrak SEO)
        <img
          alt={alt}
          height={uploadDoc.height ?? undefined}
          src={url}
          width={uploadDoc.width ?? undefined}
        />
      );
    }

    // Gambar dengan beberapa ukuran → <picture>.
    const pictureJSX: ReactNode[] = [];

    for (const size in uploadDoc.sizes) {
      const imageSize = uploadDoc.sizes[size];

      if (
        !imageSize ||
        !imageSize.width ||
        !imageSize.height ||
        !imageSize.mimeType ||
        !imageSize.filesize ||
        !imageSize.filename ||
        !imageSize.url
      ) {
        continue;
      }

      pictureJSX.push(
        <source
          key={size}
          media={`(max-width: ${imageSize.width}px)`}
          srcSet={imageSize.url}
          type={imageSize.mimeType}
        />,
      );
    }

    pictureJSX.push(
      // eslint-disable-next-line @next/next/no-img-element -- paritas markup dengan defaultConverters Payload (kontrak SEO)
      <img
        key="image"
        alt={alt}
        height={uploadDoc?.height ?? undefined}
        src={url}
        width={uploadDoc?.width ?? undefined}
      />,
    );

    return <picture>{pictureJSX}</picture>;
  },
};

const TabJSXConverter: JSXConverters = {
  tab: "\t",
};

/**
 * Urutan merge WAJIB sama dengan `defaultConverters.js` Payload.
 */
export const defaultJSXConverters: JSXConverters = {
  ...ParagraphJSXConverter,
  ...TextJSXConverter,
  ...LinebreakJSXConverter,
  ...BlockquoteJSXConverter,
  ...TableJSXConverter,
  ...HeadingJSXConverter,
  ...HorizontalRuleJSXConverter,
  ...ListJSXConverter,
  ...LinkJSXConverter({}),
  ...UploadJSXConverter,
  ...TabJSXConverter,
};

/* -------------------------------------------------------------------------- */
/* Walker (port dari converter/index.js)                                      */
/* -------------------------------------------------------------------------- */

// Payload memakai guard:
//   !disabled && (!Array.isArray(disabled) || !disabled?.includes(node.type))
// Karena `!disabled` sudah false untuk array apa pun (array selalu truthy),
// bentuk array praktis menonaktifkan style untuk SEMUA node. Perilaku itu
// dipertahankan apa adanya supaya output tidak menyimpang dari baseline.
const isStyleDisabled = (flag: boolean | string[] | undefined): boolean => Boolean(flag);

export function convertLexicalNodesToJSX({
  converters,
  disableIndent,
  disableTextAlign,
  nodes,
  parent,
}: {
  converters: JSXConverters;
  disableIndent?: boolean | string[];
  disableTextAlign?: boolean | string[];
  nodes: LexicalNodeLike[];
  parent: LexicalNodeLike;
}): ReactNode[] {
  const unknownConverter = converters.unknown as JSXConverterEntry | undefined;

  const jsxArray: ReactNode[] = nodes.map((node, i) => {
    const nodeType = asString(node.type) ?? "";
    let converterForNode: JSXConverterEntry | undefined;

    if (nodeType === "block" || nodeType === "inlineBlock") {
      const groupKey = nodeType === "block" ? "blocks" : "inlineBlocks";
      const group = converters[groupKey] as JSXConverterGroup | undefined;
      const blockType = asString((node.fields as { blockType?: unknown } | undefined)?.blockType);
      converterForNode = blockType ? group?.[blockType] : undefined;

      if (!converterForNode && !unknownConverter) {
        console.error(
          `Lexical => JSX converter: ${
            nodeType === "block" ? "Blocks" : "Inline Blocks"
          } converter: found ${blockType} ${
            nodeType === "block" ? "block" : "inline block"
          }, but no converter is provided`,
        );
      }
    } else {
      converterForNode = converters[nodeType] as JSXConverterEntry | undefined;
    }

    try {
      if (!converterForNode && unknownConverter) {
        converterForNode = unknownConverter;
      }

      let reactNode: ReactNode;

      if (converterForNode) {
        reactNode =
          typeof converterForNode === "function"
            ? (converterForNode as JSXConverter)({
                childIndex: i,
                converters,
                node,
                nodesToJSX: (args) =>
                  convertLexicalNodesToJSX({
                    converters: args.converters ?? converters,
                    disableIndent: args.disableIndent ?? disableIndent,
                    disableTextAlign: args.disableTextAlign ?? disableTextAlign,
                    nodes: args.nodes,
                    parent: args.parent ?? { ...node, parent },
                  }),
                parent,
              })
            : (converterForNode as ReactNode);
      } else {
        reactNode = <span key={i}>unknown node</span>;
      }

      const style: CSSProperties = {};

      if (!isStyleDisabled(disableTextAlign)) {
        // Text node memakai `format` numerik (bitmask) — tidak ada case yang
        // cocok, sama seperti Payload. Hanya format string yang relevan.
        const format = asString(node.format);
        if (format) {
          switch (format) {
            case "center":
              style.textAlign = "center";
              break;
            case "end":
              style.textAlign = "right";
              break;
            case "justify":
              style.textAlign = "justify";
              break;
            case "left":
              break;
            case "right":
              style.textAlign = "right";
              break;
            case "start":
              style.textAlign = "left";
              break;
          }
        }
      }

      if (!isStyleDisabled(disableIndent)) {
        const indent = node.indent;
        if ("indent" in node && indent && nodeType !== "listitem") {
          // Unit HARUS px dan besarannya 40px per level (sama dengan Payload).
          style.paddingInlineStart = `${Number(indent) * 40}px`;
        }
      }

      if (isValidElement(reactNode)) {
        if (style.textAlign || style.paddingInlineStart) {
          const elementProps = (reactNode.props ?? {}) as { style?: CSSProperties };
          const newStyle: CSSProperties = {
            ...style,
            ...(elementProps.style ?? {}),
          };

          return cloneElement(reactNode as ReactElement<{ style?: CSSProperties }>, {
            key: i,
            style: newStyle,
          });
        }

        return cloneElement(reactNode, { key: i });
      }

      return reactNode;
    } catch (error) {
      console.error("Error converting lexical node to JSX:", error, "node:", node);
      return null;
    }
  });

  return jsxArray.filter(Boolean);
}

export function convertLexicalToJSX({
  converters,
  data,
  disableIndent,
  disableTextAlign,
}: {
  converters: JSXConverters;
  data: unknown;
  disableIndent?: boolean | string[];
  disableTextAlign?: boolean | string[];
}): ReactNode {
  if (hasText(data)) {
    const root = (data as { root: LexicalNodeLike }).root;

    return convertLexicalNodesToJSX({
      converters,
      disableIndent,
      disableTextAlign,
      nodes: asNodes(root.children),
      parent: root,
    });
  }

  return <></>;
}

/* -------------------------------------------------------------------------- */
/* Komponen publik (port dari Component/index.js — `RichText`)                 */
/* -------------------------------------------------------------------------- */

export type LexicalRendererProps = {
  data?: SerializedEditorState<SerializedLexicalNode> | null;
  /**
   * Boleh berupa map converter langsung, atau fungsi yang menerima
   * `{ defaultConverters }` — sama seperti prop `converters` milik `RichText`
   * Payload, supaya pemakaian existing tidak berubah.
   */
  converters?: JSXConverters | ((args: { defaultConverters: JSXConverters }) => JSXConverters);
  className?: string;
  disableContainer?: boolean;
  disableIndent?: boolean | string[];
  disableTextAlign?: boolean | string[];
};

export function LexicalRenderer({
  className,
  converters,
  data: editorState,
  disableContainer,
  disableIndent,
  disableTextAlign,
}: LexicalRendererProps) {
  if (!editorState) {
    return null;
  }

  let finalConverters: JSXConverters;

  if (converters) {
    finalConverters =
      typeof converters === "function"
        ? converters({ defaultConverters: defaultJSXConverters })
        : converters;
  } else {
    finalConverters = defaultJSXConverters;
  }

  const content =
    editorState &&
    !Array.isArray(editorState) &&
    typeof editorState === "object" &&
    "root" in editorState &&
    convertLexicalToJSX({
      converters: finalConverters,
      data: editorState,
      disableIndent,
      disableTextAlign,
    });

  if (disableContainer) {
    return <>{content}</>;
  }

  // `payload-richtext` dipertahankan: itu class yang ada di HTML baseline
  // artikel publik (kontrak SEO), bukan sekadar penamaan warisan.
  return <div className={className ?? "payload-richtext"}>{content}</div>;
}
