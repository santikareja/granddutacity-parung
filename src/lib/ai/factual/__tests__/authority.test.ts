import { describe, expect, it } from "vitest";

import {
  filterAuthoritativeSources,
  hostnameOf,
  isAuthoritativeUrl,
  isBlockedDomain,
  isOwnDomain,
} from "@/lib/ai/factual/authority";
import type { ToolSource } from "@/lib/ai/factual/sources";

const source = (url: string, name = "Sumber"): ToolSource => ({
  source_name: name,
  source_url: url,
  data_summary: "Ringkasan.",
  retrieved_at: new Date().toISOString(),
  provider: "tavily",
});

describe("hostnameOf", () => {
  it("membuang prefix www dan menormalkan huruf", () => {
    expect(hostnameOf("https://WWW.BPS.go.id/data")).toBe("bps.go.id");
  });

  it("null untuk URL tidak valid atau skema non-http", () => {
    expect(hostnameOf("bukan-url")).toBeNull();
    expect(hostnameOf("javascript:alert(1)")).toBeNull();
    expect(hostnameOf("ftp://contoh.com")).toBeNull();
  });
});

describe("isAuthoritativeUrl — allowlist", () => {
  it("menerima BPS dan instansi pemerintah lain (suffix go.id)", () => {
    expect(isAuthoritativeUrl("https://www.bps.go.id/indikator")).toBe(true);
    expect(isAuthoritativeUrl("https://www.bi.go.id/statistik")).toBe(true);
    expect(isAuthoritativeUrl("https://ojk.go.id/kanal")).toBe(true);
  });

  it("menerima Wikipedia, akademik, dan lembaga internasional", () => {
    expect(isAuthoritativeUrl("https://id.wikipedia.org/wiki/Parung")).toBe(true);
    expect(isAuthoritativeUrl("https://ui.ac.id/riset")).toBe(true);
    expect(isAuthoritativeUrl("https://www.worldbank.org/id")).toBe(true);
  });

  it("menerima media besar Indonesia dan internasional", () => {
    expect(isAuthoritativeUrl("https://www.kompas.com/properti/x")).toBe(true);
    expect(isAuthoritativeUrl("https://www.cnbcindonesia.com/news/y")).toBe(true);
    expect(isAuthoritativeUrl("https://www.reuters.com/markets/z")).toBe(true);
  });

  it("MENOLAK domain acak yang tidak ada di allowlist", () => {
    expect(isAuthoritativeUrl("https://blog-properti-acak.com/artikel")).toBe(
      false,
    );
    expect(isAuthoritativeUrl("https://medium.com/@seseorang/opini")).toBe(false);
  });

  it("MENOLAK pengembang pesaing & portal jual-beli properti", () => {
    // Inti kebutuhan: artikel tidak boleh menautkan kompetitor.
    expect(isAuthoritativeUrl("https://www.rumah123.com/perumahan")).toBe(false);
    expect(isAuthoritativeUrl("https://www.99.co/id/properti")).toBe(false);
    expect(isAuthoritativeUrl("https://www.sinarmasland.com/project")).toBe(false);
    expect(isAuthoritativeUrl("https://www.summarecon.com/x")).toBe(false);
    expect(isAuthoritativeUrl("https://lamudi.co.id/jawa-barat")).toBe(false);
  });

  it("MENOLAK domain sendiri (bukan sumber eksternal)", () => {
    expect(
      isAuthoritativeUrl("https://granddutacitysouthofjakarta.com/artikel"),
    ).toBe(false);
    expect(isOwnDomain("https://granddutacitysouthofjakarta.com/")).toBe(true);
  });

  it("mengenali subdomain dari domain terlarang", () => {
    expect(isBlockedDomain("https://cari.rumah123.com/x")).toBe(true);
  });
});

describe("filterAuthoritativeSources", () => {
  it("menyimpan sumber layak dan membuang sisanya, urutan dipertahankan", () => {
    const { kept, rejected } = filterAuthoritativeSources([
      source("https://www.bps.go.id/a", "BPS"),
      source("https://www.rumah123.com/b", "Rumah123"),
      source("https://www.kompas.com/c", "Kompas"),
      source("https://blog-acak.xyz/d", "Blog"),
    ]);

    expect(kept.map((s) => s.source_name)).toEqual(["BPS", "Kompas"]);
    expect(rejected).toEqual([
      "https://www.rumah123.com/b",
      "https://blog-acak.xyz/d",
    ]);
  });

  it("daftar kosong menghasilkan hasil kosong tanpa error", () => {
    expect(filterAuthoritativeSources([])).toEqual({ kept: [], rejected: [] });
  });
});
