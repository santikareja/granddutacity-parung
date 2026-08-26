// Sanitasi HTML keluaran AI — modul MANDIRI, tanpa dependency Payload.
//
// Dipisahkan dari `src/lib/ai/html-to-lexical.ts` (yang mengimpor
// @payloadcms/richtext-lexical + payload) agar kode Custom CMS v2 —
// route API v2, endpoint agent, dan test-nya — tidak lagi menarik paket Payload
// hanya untuk memakai `sanitizeAiHtml`. Implementasi di bawah dipindahkan APA
// ADANYA; perilaku sanitasi tidak berubah.

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
