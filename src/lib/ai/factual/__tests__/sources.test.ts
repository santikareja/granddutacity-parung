import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchWeb } from "@/lib/ai/factual/sources";

// Bangun objek mirip Response untuk mock fetch (fetchJson memakai res.ok & res.json()).
const jsonResponse = (body: unknown, ok = true, status = ok ? 200 : 500) =>
  ({
    ok,
    status,
    json: async () => body,
  }) as unknown as Response;

const TAVILY = "api.tavily.com";
const SERP = "serpapi.com";

describe("searchWeb — Tavily primary dengan fallback SerpApi", () => {
  beforeEach(() => {
    process.env.TAVILY_API_KEY = "tavily-test-key";
    process.env.SERPAPI_API_KEY = "serpapi-test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TAVILY_API_KEY;
    delete process.env.SERPAPI_API_KEY;
  });

  it("memakai Tavily saat sukses (tanpa fallback)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes(TAVILY)) {
          return jsonResponse({
            results: [
              {
                title: "Judul A",
                url: "https://situs.com/a",
                content: "Ringkasan A",
              },
            ],
          });
        }
        throw new Error("SerpApi tidak boleh dipanggil");
      }),
    );

    const res = await searchWeb("harga properti bogor", 3);
    expect(res.providerUsed).toBe("tavily");
    expect(res.fallbackUsed).toBe(false);
    expect(res.sources).toHaveLength(1);
    expect(res.sources[0].source_url).toBe("https://situs.com/a");
    expect(res.sources[0].provider).toBe("tavily");
  });

  it("fallback ke SerpApi saat Tavily gagal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes(TAVILY)) {
          return jsonResponse({}, false, 503); // Tavily down
        }
        if (String(url).includes(SERP)) {
          return jsonResponse({
            organic_results: [
              {
                title: "Judul S",
                link: "https://serp.com/s",
                snippet: "Cuplikan S",
              },
            ],
          });
        }
        throw new Error("URL tak terduga");
      }),
    );

    const res = await searchWeb("tren kpr", 3);
    expect(res.providerUsed).toBe("serpapi");
    expect(res.fallbackUsed).toBe(true);
    expect(res.sources[0].source_url).toBe("https://serp.com/s");
    expect(res.sources[0].provider).toBe("serpapi");
  });

  it("mengembalikan kosong bila Tavily dan SerpApi sama-sama gagal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}, false, 500)),
    );

    const res = await searchWeb("apa saja", 3);
    expect(res.providerUsed).toBeNull();
    expect(res.fallbackUsed).toBe(true);
    expect(res.sources).toHaveLength(0);
  });
});
