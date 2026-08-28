import { describe, expect, it } from "vitest";

import { planGrounding } from "@/lib/ai/factual/plan";

const YEAR = new Date().getFullYear();

describe("planGrounding — pemilihan satu tool secara deterministik", () => {
  it("memilih BPS bila judul menyinggung data statistik", () => {
    const plan = planGrounding({
      title: "Tren Inflasi dan Daya Beli Rumah di Bogor",
    });
    expect(plan.primary).toBe("bps");
    expect(plan.reason).toMatch(/inflasi/i);
  });

  it("memilih BPS bila sinyal statistik muncul di outline, bukan di judul", () => {
    // Judul bergaya panduan, tetapi salah satu bagian membahas data resmi.
    const plan = planGrounding({
      title: "Panduan Memilih Hunian untuk Keluarga Muda",
      outline: [
        { heading: "Menentukan kebutuhan ruang" },
        { heading: "Statistik kebutuhan rumah nasional" },
      ],
    });
    expect(plan.primary).toBe("bps");
  });

  it("memilih pencarian web untuk topik tren/pasar tanpa sinyal statistik", () => {
    const plan = planGrounding({
      title: "Cara Memilih Cluster yang Cocok untuk Pekerja Jakarta",
    });
    expect(plan.primary).toBe("web");
    expect(plan.reason).toMatch(/tren|pasar/i);
  });

  it("selalu deterministik: input sama menghasilkan rencana sama", () => {
    const input = { title: "Prospek Kawasan Parung untuk Hunian" };
    expect(planGrounding(input)).toEqual(planGrounding(input));
  });
});

describe("planGrounding — pembentukan query", () => {
  it("menambahkan tahun berjalan agar hasil pencarian terkini", () => {
    const plan = planGrounding({ title: "Prospek Kawasan Parung" });
    expect(plan.webQuery).toBe(`Prospek Kawasan Parung ${YEAR}`);
  });

  it("tidak menambah tahun bila judul sudah memuat tahun", () => {
    const plan = planGrounding({ title: "Prospek Kawasan Parung 2025" });
    expect(plan.webQuery).toBe("Prospek Kawasan Parung 2025");
    // Pastikan tidak ada dua tahun berdempet.
    expect(plan.webQuery).not.toContain(String(YEAR) + " " + String(YEAR));
  });

  it("membuang dekorasi judul listicle agar query berisi inti topik", () => {
    const plan = planGrounding({
      title: "7 Hal yang Perlu Dicek Sebelum Membeli Rumah",
    });
    expect(plan.webQuery).not.toMatch(/^7 Hal/);
    expect(plan.webQuery).toContain("Membeli Rumah");
  });

  it("membuang awalan 'Panduan Lengkap' dan 'Cara'", () => {
    expect(
      planGrounding({ title: "Panduan Lengkap KPR Rumah Pertama" }).webQuery,
    ).not.toMatch(/^Panduan Lengkap/);
    expect(
      planGrounding({ title: "Cara Mengajukan KPR Tanpa Riba" }).webQuery,
    ).not.toMatch(/^Cara /);
  });

  it("selalu menyediakan bpsKeyword yang tidak kosong", () => {
    const plan = planGrounding({ title: "Hunian Nyaman di Selatan Jakarta" });
    expect(plan.bpsKeyword.trim().length).toBeGreaterThan(0);
  });

  it("memakai nama indikator sebagai bpsKeyword bila sinyal terdeteksi", () => {
    const plan = planGrounding({ title: "Data Indeks Harga Properti Terbaru" });
    expect(plan.bpsKeyword).toBe("indeks harga");
  });

  it("judul yang seluruhnya dekorasi tetap menghasilkan query valid", () => {
    const plan = planGrounding({ title: "Panduan Lengkap" });
    expect(plan.webQuery.trim().length).toBeGreaterThan(0);
  });
});
