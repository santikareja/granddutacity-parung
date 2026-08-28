import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { gatherGroundingSources } from "@/lib/ai/factual/ground";
import { planGrounding } from "@/lib/ai/factual/plan";

const jsonResponse = (body: unknown, ok = true, status = ok ? 200 : 500) =>
  ({ ok, status, json: async () => body }) as unknown as Response;

const TAVILY = "api.tavily.com";
const SERP = "serpapi.com";
const BPS = "webapi.bps.go.id";

// Rencana yang memilih web lebih dulu.
const webPlan = planGrounding({ title: "Prospek Kawasan Parung untuk Hunian" });
// Rencana yang memilih BPS lebih dulu.
const bpsPlan = planGrounding({ title: "Data Inflasi dan Harga Rumah" });

const tavilyBody = (urls: string[]) => ({
  results: urls.map((url, i) => ({
    title: `Judul ${i}`,
    url,
    content: `Ringkasan ${i}`,
  })),
});

const bpsBody = (titles: string[]) => ({
  status: "OK",
  data: [{ page: 1 }, titles.map((title) => ({ title }))],
});

describe("gatherGroundingSources", () => {
  beforeEach(() => {
    process.env.TAVILY_API_KEY = "tavily-key";
    process.env.SERPAPI_API_KEY = "serp-key";
    process.env.BPS_APP_ID = "bps-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TAVILY_API_KEY;
    delete process.env.SERPAPI_API_KEY;
    delete process.env.BPS_APP_ID;
  });

  it("memakai tool primer saja bila sudah menghasilkan sumber layak", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes(TAVILY)) {
          return jsonResponse(tavilyBody(["https://www.kompas.com/a"]));
        }
        throw new Error(`tidak boleh dipanggil: ${url}`);
      }),
    );

    const result = await gatherGroundingSources(webPlan);
    expect(result.fallbackUsed).toBe(false);
    expect(result.sources).toHaveLength(1);
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].tool).toBe("web");
  });

  it("MENYARING hasil pencarian dari domain pesaing/marketplace", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes(TAVILY)) {
          return jsonResponse(
            tavilyBody([
              "https://www.rumah123.com/dijual", // pesaing → dibuang
              "https://www.bps.go.id/indikator", // layak → disimpan
              "https://www.sinarmasland.com/x", // pesaing → dibuang
            ]),
          );
        }
        return jsonResponse({}, false, 500);
      }),
    );

    const result = await gatherGroundingSources(webPlan);
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].source_url).toContain("bps.go.id");
    expect(result.rejectedUrls).toHaveLength(2);
  });

  it("fallback ke tool lain bila primer tidak memberi sumber layak", async () => {
    // Web hanya mengembalikan domain pesaing → semuanya tersaring → 0 sumber →
    // sistem harus beralih ke BPS.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const target = String(url);
        if (target.includes(TAVILY)) {
          return jsonResponse(tavilyBody(["https://www.rumah123.com/x"]));
        }
        if (target.includes(SERP)) {
          return jsonResponse({ organic_results: [] });
        }
        if (target.includes(BPS)) {
          return jsonResponse(bpsBody(["Indeks Harga Properti Residensial"]));
        }
        return jsonResponse({}, false, 500);
      }),
    );

    const result = await gatherGroundingSources(webPlan);
    expect(result.fallbackUsed).toBe(true);
    expect(result.attempts.map((a) => a.tool)).toEqual(["web", "bps"]);
    expect(result.sources[0].provider).toBe("bps");
  });

  it("fallback dari BPS ke web bila BPS kosong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const target = String(url);
        if (target.includes(BPS)) {
          return jsonResponse({ status: "OK", data: [{ page: 1 }, []] });
        }
        if (target.includes(TAVILY)) {
          return jsonResponse(tavilyBody(["https://www.tempo.co/berita"]));
        }
        return jsonResponse({}, false, 500);
      }),
    );

    const result = await gatherGroundingSources(bpsPlan);
    expect(result.fallbackUsed).toBe(true);
    expect(result.attempts.map((a) => a.tool)).toEqual(["bps", "web"]);
    expect(result.sources[0].source_url).toContain("tempo.co");
  });

  it("mengembalikan kosong tanpa melempar bila semua sumber gagal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}, false, 503)),
    );

    const result = await gatherGroundingSources(webPlan);
    expect(result.sources).toEqual([]);
    expect(result.fallbackUsed).toBe(true);
  });

  it("membatasi jumlah sumber maksimal 3", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes(TAVILY)) {
          return jsonResponse(
            tavilyBody([
              "https://www.kompas.com/a",
              "https://www.tempo.co/b",
              "https://www.bps.go.id/c",
              "https://www.reuters.com/d",
              "https://www.bisnis.com/e",
            ]),
          );
        }
        return jsonResponse({}, false, 500);
      }),
    );

    const result = await gatherGroundingSources(webPlan);
    expect(result.sources).toHaveLength(3);
  });

  it("membuang sumber duplikat berdasarkan URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes(TAVILY)) {
          return jsonResponse(
            tavilyBody([
              "https://www.kompas.com/a",
              "https://www.kompas.com/a/", // sama, hanya trailing slash
            ]),
          );
        }
        return jsonResponse({}, false, 500);
      }),
    );

    const result = await gatherGroundingSources(webPlan);
    expect(result.sources).toHaveLength(1);
  });
});
