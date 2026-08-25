// Server-side only: konversi HTML terstruktur (dari AI) menjadi Lexical editor
// state yang kompatibel dengan field `content` Artikel. Memakai converter resmi
// `convertHTMLToLexical` dari @payloadcms/richtext-lexical + jsdom.

import { convertHTMLToLexical } from "@payloadcms/richtext-lexical";
import { editorConfigFactory } from "@payloadcms/richtext-lexical";
import type { SanitizedConfig } from "payload";
import { JSDOM } from "jsdom";

// Sanitasi HTML dari AI sebelum konversi & sebelum dirender di pratinjau admin.
// Konten ini berasal dari provider AI eksternal (untrusted) dan pratinjau AI Studio
// merender-nya lewat dangerouslySetInnerHTML, jadi tag/atribut aktif harus dibuang
// di sini, bukan hanya diandalkan pada filter node Lexical.
const DANGEROUS_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "link",
  "meta",
  "base",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "template",
  "noscript",
];

export const sanitizeAiHtml = (html: string): string => {
  let output = html;

  // Turunkan <h1> menjadi <h2> (artikel tidak boleh punya h1 di body).
  output = output.replace(/<(\/?)h1(\s[^>]*)?>/gi, "<$1h2$2>");

  // Buang tag berbahaya beserta isinya, lalu sisa tag pembuka/penutupnya.
  for (const tag of DANGEROUS_TAGS) {
    output = output.replace(
      new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi"),
      "",
    );
    output = output.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"), "");
  }

  // Buang atribut event handler inline, termasuk varian tanpa kutip.
  output = output
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "");

  // Buang URI skema aktif pada href/src (javascript:, data:, vbscript:).
  output = output
    .replace(/(href|src)\s*=\s*"\s*(?:javascript|data|vbscript):[^"]*"/gi, "")
    .replace(/(href|src)\s*=\s*'\s*(?:javascript|data|vbscript):[^']*'/gi, "")
    .replace(/(href|src)\s*=\s*(?:javascript|data|vbscript):[^\s>]+/gi, "");

  return output.trim();
};

export type ArticleLexicalState = ReturnType<typeof convertHTMLToLexical>;

// Konversi HTML → Lexical state memakai editor config dari field `content`
// Artikel (agar node yang dikenali sama dengan editor admin).
export const htmlToArticleLexical = async (
  html: string,
  config: SanitizedConfig,
): Promise<ArticleLexicalState> => {
  const cleaned = sanitizeAiHtml(html);

  const artikelCollection = config.collections.find(
    (collection) => collection.slug === "artikel",
  );
  const contentField = artikelCollection?.fields.find(
    (field) => "name" in field && field.name === "content",
  );

  const editorConfig =
    contentField && "editor" in contentField && contentField.editor
      ? editorConfigFactory.fromField({
          field: contentField as Parameters<
            typeof editorConfigFactory.fromField
          >[0]["field"],
        })
      : await editorConfigFactory.default({ config });

  return convertHTMLToLexical({
    editorConfig,
    html: cleaned,
    JSDOM,
  });
};
