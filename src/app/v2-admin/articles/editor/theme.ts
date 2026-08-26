// Tema kelas CSS untuk editor Lexical. Kelas-kelas ini dipakai Tailwind lewat
// globals.css (lihat blok .gdc-editor) agar tampilan editor mendekati tampilan
// artikel di situs publik.

import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
  paragraph: "gdc-editor__p",
  quote: "gdc-editor__quote",
  heading: {
    h1: "gdc-editor__h1",
    h2: "gdc-editor__h2",
    h3: "gdc-editor__h3",
    h4: "gdc-editor__h4",
  },
  list: {
    ul: "gdc-editor__ul",
    ol: "gdc-editor__ol",
    listitem: "gdc-editor__li",
    nested: {
      listitem: "gdc-editor__li-nested",
    },
  },
  link: "gdc-editor__link",
  text: {
    bold: "gdc-editor__bold",
    italic: "gdc-editor__italic",
    underline: "gdc-editor__underline",
    strikethrough: "gdc-editor__strike",
    code: "gdc-editor__code",
  },
};
