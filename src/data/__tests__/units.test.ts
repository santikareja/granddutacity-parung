/**
 * Guard data unit — permintaan pemilik 30 Agustus 2026 (kartu tipe rumah beranda).
 *
 * Semua yang diuji di sini adalah keputusan yang MUDAH RUSAK TANPA SUARA:
 * urutan kartu ditentukan hasil sort, label "+1" ditentukan dua field terpisah,
 * dan klaim "mulai Rp 600 jutaan" di metadata beranda tidak punya hubungan
 * mekanis apa pun dengan `priceLabel` di data unit. Tanpa test, ketiganya bisa
 * menyimpang tanpa satu pun error muncul.
 */

import { describe, expect, it } from "vitest";
import {
  CATALOG_LEAD_IDS,
  bathroomLabel,
  bedroomLabel,
  catalogUnits,
  getUnitById,
  unitFacadeAlt,
  units,
} from "@/data/units";

describe("urutan kartu katalog", () => {
  it("menaruh Verona, Malta, Tuscan, Frontera di empat posisi pertama", () => {
    // Permintaan eksplisit pemilik. Urutan `units` kebetulan sudah benar, jadi
    // pelanggaran hanya akan muncul saat seseorang menyusun ulang array itu —
    // persis situasi yang tidak akan disadari siapa pun tanpa test.
    expect(catalogUnits.slice(0, 4).map((unit) => unit.id)).toEqual([
      "verona-39",
      "malta-47",
      "tuscan-66",
      "frontera-89",
    ]);
  });

  it("memasukkan seluruh tipe unggulan ke katalog", () => {
    // `CATALOG_LEAD_IDS` hanya mengatur URUTAN; ia tidak memaksa `showInCatalog`.
    // Tipe unggulan yang lupa ditandai akan hilang dari kartu tanpa jejak.
    for (const id of CATALOG_LEAD_IDS) {
      expect(getUnitById(id)?.showInCatalog, id).toBe(true);
    }
  });

  it("tidak menjatuhkan unit dari katalog saat mengurutkan", () => {
    const expected = units.filter((unit) => unit.showInCatalog).length;
    expect(catalogUnits).toHaveLength(expected);
  });
});

describe("label kamar", () => {
  it("menandai kamar mandi ekstra Frontera sebagai 3+1", () => {
    const frontera = getUnitById("frontera-89")!;
    expect(bedroomLabel(frontera)).toBe("4+1");
    expect(bathroomLabel(frontera)).toBe("3+1");
  });

  it("tidak menambahkan +1 pada tipe tanpa kamar mandi servis", () => {
    // Malta punya ruang ekstra TAPI tidak punya kamar mandi ekstra. Ia yang
    // membuktikan kedua penanda itu benar-benar terpisah.
    const malta = getUnitById("malta-47")!;
    expect(bedroomLabel(malta)).toBe("2+1");
    expect(bathroomLabel(malta)).toBe("1");
  });

  it("mengembalikan tanda hubung untuk data yang belum dikonfirmasi", () => {
    expect(bathroomLabel(getUnitById("t-62")!)).toBe("-");
  });
});

describe("alt gambar fasad", () => {
  it("unik untuk setiap unit", () => {
    // Alt yang seragam antar kartu tidak menambah apa pun untuk pencarian
    // gambar maupun pembaca layar.
    const alts = units.map(unitFacadeAlt);
    expect(new Set(alts).size).toBe(units.length);
  });

  it("memuat nama tipe, ukuran, dan nama proyek", () => {
    expect(unitFacadeAlt(getUnitById("verona-39")!)).toBe(
      "Fasad rumah Tipe Verona 39/60 1 lantai di Cluster Ladera Grand Duta City Parung",
    );
  });
});

describe("harga tampil", () => {
  it("mempertahankan Verona sebagai tipe termurah di 600 Juta-an", () => {
    // Klaim "mulai Rp 600 jutaan" di metadata beranda, `priceRange` schema,
    // FAQ, dan llms.txt semuanya bersandar pada angka ini. Pasangan test yang
    // mengikat keduanya ada di seo-invariants.test.ts (G18).
    expect(getUnitById("verona-39")!.priceLabel).toBe("600 Juta-an");
  });

  it("memberi Frontera harga, bukan lagi 'Segera Hadir'", () => {
    const frontera = getUnitById("frontera-89")!;
    expect(frontera.priceLabel).toBe("1.6 Milyar-an");
    expect(frontera.status).toBe("check-siteplan");
  });
});
