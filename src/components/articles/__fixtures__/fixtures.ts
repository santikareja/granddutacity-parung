// Manifest golden fixture untuk renderer Lexical artikel publik (Task 12B-1).
//
// KONTRAK SEO (R2 / P1): setiap entri di sini punya pasangan file HTML di
// `__fixtures__/golden/<name>.html` yang DIREKAM dari renderer Payload
// (`RichText` + `defaultConverters` dari @payloadcms/richtext-lexical/react)
// saat Payload masih terpasang. Serializer in-house (`LexicalRenderer`) WAJIB
// menghasilkan HTML yang sama persis dengan file-file itu.
//
// Jangan mengubah file JSON state maupun golden HTML tanpa alasan SEO yang
// eksplisit: perubahan di situ artinya markup artikel publik berubah.

import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

import emptyRoot from "./lexical-states/empty-root.json";
import emptySingleParagraph from "./lexical-states/empty-single-paragraph.json";
import fullArticle from "./lexical-states/full-article.json";
import heading from "./lexical-states/heading.json";
import legacyAndUnknown from "./lexical-states/legacy-and-unknown.json";
import linebreakTab from "./lexical-states/linebreak-tab.json";
import link from "./lexical-states/link.json";
import linkInternalDoc from "./lexical-states/link-internal-doc.json";
import listBullet from "./lexical-states/list-bullet.json";
import listCheck from "./lexical-states/list-check.json";
import listNested from "./lexical-states/list-nested.json";
import listNumber from "./lexical-states/list-number.json";
import paragraph from "./lexical-states/paragraph.json";
import paragraphAlignIndent from "./lexical-states/paragraph-align-indent.json";
import quote from "./lexical-states/quote.json";
import readAlso from "./lexical-states/read-also.json";
import table from "./lexical-states/table.json";
import textFormats from "./lexical-states/text-formats.json";
import upload from "./lexical-states/upload.json";

type EditorState = SerializedEditorState<SerializedLexicalNode>;

export type ReadAlsoItem = {
  title: string;
  href: string;
  thumbnail: string;
  thumbnailAlt: string;
};

export type LexicalFixture = {
  /** Nama file golden tanpa ekstensi. */
  name: string;
  /** Node Lexical yang dicakup fixture ini (dokumentasi cakupan). */
  covers: string[];
  data: EditorState;
  readAlsoItems: ReadAlsoItem[];
  /**
   * True bila output Payload sendiri TIDAK deterministik untuk fixture ini
   * (checklist memakai uuid acak untuk pasangan input/label), sehingga
   * perbandingan golden dilakukan setelah uuid dinormalisasi.
   */
  nonDeterministicIds?: true;
};

/**
 * Item "Baca juga" tetap untuk fixture yang mengaktifkan injeksi readAlso.
 * Nilai sengaja statis agar golden HTML deterministik.
 */
export const READ_ALSO_ITEMS: ReadAlsoItem[] = [
  {
    title: "Cara Beli KPR di Grand Duta City Parung",
    href: "/cara-beli-kpr",
    thumbnail: "https://res.cloudinary.com/demo/image/upload/v1/artikel/kpr.jpg",
    thumbnailAlt: "Ilustrasi pengajuan KPR",
  },
  {
    title: "Update Stok & Siteplan Terbaru",
    href: "/update-stok-siteplan-grand-duta-city-parung",
    thumbnail: "https://res.cloudinary.com/demo/image/upload/v1/artikel/stok.jpg",
    thumbnailAlt: "Siteplan & stok unit",
  },
];

const asState = (raw: unknown) => raw as EditorState;

export const LEXICAL_FIXTURES: LexicalFixture[] = [
  {
    name: "paragraph",
    covers: ["root", "paragraph (berisi)", "paragraph (kosong)", "text (format 0)", "escaping HTML"],
    data: asState(paragraph),
    readAlsoItems: [],
  },
  {
    name: "paragraph-align-indent",
    covers: [
      "paragraph format left/center/right/justify/start/end",
      "paragraph indent",
      "heading format+indent",
      "quote format+indent",
    ],
    data: asState(paragraphAlignIndent),
    readAlsoItems: [],
  },
  {
    name: "heading",
    covers: ["heading h1-h6", "heading dengan text berformat", "heading kosong"],
    data: asState(heading),
    readAlsoItems: [],
  },
  {
    name: "text-formats",
    covers: [
      "text bitmask 0-127 (bold/italic/strikethrough/underline/code/subscript/superscript)",
      "text highlight (128/129, tanpa penanganan)",
      "text kosong (dibuang filter)",
      "text dengan style inline",
    ],
    data: asState(textFormats),
    readAlsoItems: [],
  },
  {
    name: "linebreak-tab",
    covers: ["linebreak", "tab", "paragraph berisi hanya linebreak"],
    data: asState(linebreakTab),
    readAlsoItems: [],
  },
  {
    name: "link",
    covers: [
      "link linkType custom (internal relatif & eksternal)",
      "link newTab true/false",
      "autolink newTab true/false",
      "link dengan beberapa child + linebreak",
    ],
    data: asState(link),
    readAlsoItems: [],
  },
  {
    name: "link-internal-doc",
    covers: ["link linkType internal tanpa internalDocToHref (fallback href '#')"],
    data: asState(linkInternalDoc),
    readAlsoItems: [],
  },
  {
    name: "list-bullet",
    covers: ["list bullet (ul)", "listitem", "listitem berisi link"],
    data: asState(listBullet),
    readAlsoItems: [],
  },
  {
    name: "list-number",
    covers: ["list number (ol)", "listitem value", "listitem format", "listitem indent (diabaikan)"],
    data: asState(listNumber),
    readAlsoItems: [],
  },
  {
    name: "list-nested",
    covers: ["list nested ul>li>ol>li>ul", "listitem nestedListItem", "listitem campuran teks + sublist"],
    data: asState(listNested),
    readAlsoItems: [],
  },
  {
    name: "list-check",
    covers: ["list listType check", "listitem checkbox checked/unchecked", "checklist nested"],
    data: asState(listCheck),
    readAlsoItems: [],
    nonDeterministicIds: true,
  },
  {
    name: "quote",
    covers: ["quote (blockquote)", "quote dengan linebreak", "quote kosong"],
    data: asState(quote),
    readAlsoItems: [],
  },
  {
    name: "table",
    covers: [
      "table",
      "tablerow",
      "tablecell headerState 0/1/2/3",
      "tablecell colSpan/rowSpan",
      "tablecell backgroundColor",
      "tablecell format/indent",
    ],
    data: asState(table),
    readAlsoItems: [],
  },
  {
    name: "upload",
    covers: [
      "upload alignment left/center/right",
      "upload fields null",
      "upload captionOverride",
      "upload alt fallback (fields.alt -> media.alt -> media.name -> default)",
      "upload node.format center/right",
      "upload value berupa id (dibuang)",
      "upload value null (dibuang)",
      "upload tanpa url (dibuang)",
    ],
    data: asState(upload),
    readAlsoItems: [],
  },
  {
    name: "read-also",
    covers: [
      "injeksi node readAlso setiap 3 paragraf berisi teks",
      "paragraf whitespace tidak dihitung",
      "paragraf yang teksnya ada di grandchild ikut dihitung",
      "heading tidak dihitung",
    ],
    data: asState(readAlso),
    readAlsoItems: READ_ALSO_ITEMS,
  },
  {
    name: "legacy-and-unknown",
    covers: [
      "horizontalrule (feature dicabut, node warisan masih dirender)",
      "relationship (tanpa converter -> span 'unknown node')",
      "block dengan blockType tak terdaftar",
    ],
    data: asState(legacyAndUnknown),
    readAlsoItems: [],
  },
  {
    name: "empty-single-paragraph",
    covers: ["state hanya satu paragraph kosong (hasText false)"],
    data: asState(emptySingleParagraph),
    readAlsoItems: [],
  },
  {
    name: "empty-root",
    covers: ["root tanpa children (hasText false)"],
    data: asState(emptyRoot),
    readAlsoItems: [],
  },
  {
    name: "full-article",
    covers: ["kombinasi realistis: paragraph, heading, list, upload, table, quote, CTA link"],
    data: asState(fullArticle),
    readAlsoItems: [],
  },
  {
    name: "full-article-read-also",
    covers: ["kombinasi realistis + injeksi readAlso"],
    data: asState(fullArticle),
    readAlsoItems: READ_ALSO_ITEMS,
  },
];
