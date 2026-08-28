import { describe, expect, it } from "vitest";

import {
  CTA_URL,
  createEmptyState,
  ensureCta,
  extractLinks,
  summarizeLinks,
} from "@/lib/v2-admin/lexical";

// Bangun paragraf berisi satu tautan gaya penyimpanan (fields.url).
const paragraphWithStoredLink = (url: string, anchor: string) => ({
  type: "paragraph",
  format: "",
  indent: 0,
  version: 1,
  direction: "ltr",
  children: [
    {
      type: "link",
      fields: { linkType: "custom", newTab: false, url },
      format: "",
      indent: 0,
      version: 3,
      direction: "ltr",
      children: [
        {
          type: "text",
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: anchor,
          version: 1,
        },
      ],
    },
  ],
});

// Bentuk editor: url ada di level atas, bukan di fields.
const paragraphWithEditorLink = (url: string, anchor: string) => ({
  type: "paragraph",
  format: "",
  indent: 0,
  version: 1,
  direction: "ltr",
  children: [
    {
      type: "link",
      url,
      format: "",
      indent: 0,
      version: 3,
      direction: "ltr",
      children: [
        {
          type: "text",
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: anchor,
          version: 1,
        },
      ],
    },
  ],
});

const stateWith = (children: unknown[]) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children,
  },
});

describe("extractLinks", () => {
  it("state kosong/tidak valid menghasilkan daftar kosong", () => {
    expect(extractLinks(null)).toEqual([]);
    expect(extractLinks({})).toEqual([]);
    expect(extractLinks(createEmptyState())).toEqual([]);
  });

  it("membaca url dari bentuk penyimpanan (fields.url)", () => {
    const links = extractLinks(
      stateWith([paragraphWithStoredLink("/tips-kpr", "tips KPR")]),
    );
    expect(links).toEqual([
      { url: "/tips-kpr", anchor: "tips KPR", kind: "internal" },
    ]);
  });

  it("membaca url dari bentuk editor (url di level atas)", () => {
    const links = extractLinks(
      stateWith([paragraphWithEditorLink("/panduan", "panduan")]),
    );
    expect(links[0].url).toBe("/panduan");
  });

  it("mengklasifikasi homepage, internal, dan eksternal", () => {
    const links = extractLinks(
      stateWith([
        paragraphWithStoredLink(CTA_URL, "Grand Duta City Parung"),
        paragraphWithStoredLink("/artikel-lain", "artikel lain"),
        paragraphWithStoredLink("https://www.bps.go.id/x", "BPS"),
      ]),
    );
    expect(links.map((l) => l.kind)).toEqual([
      "homepage",
      "internal",
      "external",
    ]);
  });

  it("URL absolut ke domain sendiri dengan path dihitung internal", () => {
    const links = extractLinks(
      stateWith([
        paragraphWithStoredLink(
          "https://granddutacitysouthofjakarta.com/cluster-ladera",
          "Cluster Ladera",
        ),
      ]),
    );
    expect(links[0].kind).toBe("internal");
  });

  it("mempertahankan urutan kemunculan dan tidak membuang duplikat", () => {
    const links = extractLinks(
      stateWith([
        paragraphWithStoredLink("/a", "pertama"),
        paragraphWithStoredLink("/a", "kedua"),
      ]),
    );
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.anchor)).toEqual(["pertama", "kedua"]);
  });

  it("melewati node link tanpa url", () => {
    const links = extractLinks(
      stateWith([paragraphWithStoredLink("", "tanpa url")]),
    );
    expect(links).toEqual([]);
  });

  it("menemukan CTA yang ditambahkan ensureCta", () => {
    const withCta = ensureCta(
      stateWith([paragraphWithStoredLink("/artikel", "artikel")]),
    );
    const links = extractLinks(withCta);
    expect(links.some((l) => l.kind === "homepage")).toBe(true);
  });
});

describe("summarizeLinks", () => {
  it("menghitung jumlah per jenis", () => {
    const links = extractLinks(
      stateWith([
        paragraphWithStoredLink(CTA_URL, "GDC Parung"),
        paragraphWithStoredLink("/a", "a"),
        paragraphWithStoredLink("/b", "b"),
        paragraphWithStoredLink("https://www.kompas.com/x", "Kompas"),
      ]),
    );
    expect(summarizeLinks(links)).toEqual({
      homepage: 1,
      internal: 2,
      external: 1,
      total: 4,
    });
  });
});
