import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createTumblrClient,
  isLiveArticleUrl,
  normalizeExcerpt,
  percentEncode,
  postToTumblr,
  verifyTumblrCredentials,
} from "@/lib/social/tumblr";
import type { TumblrConfig } from "@/lib/ai/env";

const CONFIG: TumblrConfig = {
  consumerKey: "ck",
  consumerSecret: "cs",
  token: "tok",
  tokenSecret: "ts",
  blogName: "myblog",
};

const LIVE_URL = "https://granddutacitysouthofjakarta.com/contoh-artikel";

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as unknown as Response;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("percentEncode (RFC 3986)", () => {
  it("meng-encode karakter yang dilewati encodeURIComponent", () => {
    expect(percentEncode("a b!*'()")).toBe("a%20b%21%2A%27%28%29");
  });
});

describe("normalizeExcerpt", () => {
  it("memangkas & merapikan spasi", () => {
    expect(normalizeExcerpt("  hello   world  ")).toBe("hello world");
  });

  it("mengembalikan string kosong untuk nilai kosong/null", () => {
    expect(normalizeExcerpt("")).toBe("");
    expect(normalizeExcerpt(null)).toBe("");
    expect(normalizeExcerpt(undefined)).toBe("");
  });

  it("memotong deskripsi yang melebihi 500 karakter", () => {
    const out = normalizeExcerpt("x".repeat(600));
    expect(out.length).toBe(500);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("isLiveArticleUrl", () => {
  it("true untuk https ke host produksi dengan path artikel", () => {
    expect(isLiveArticleUrl(LIVE_URL)).toBe(true);
  });

  it("false untuk root/homepage, http, host lain, atau kosong", () => {
    expect(isLiveArticleUrl("https://granddutacitysouthofjakarta.com/")).toBe(false);
    expect(isLiveArticleUrl("https://granddutacitysouthofjakarta.com")).toBe(false);
    expect(isLiveArticleUrl("http://granddutacitysouthofjakarta.com/x")).toBe(false);
    expect(isLiveArticleUrl("https://staging.example.com/x")).toBe(false);
    expect(isLiveArticleUrl("")).toBe(false);
    expect(isLiveArticleUrl(null)).toBe(false);
  });
});

describe("createTumblrClient", () => {
  it("null bila konfigurasi tidak tersedia", () => {
    // Tanpa env TUMBLR_* dan tanpa config eksplisit → null.
    expect(createTumblrClient(null)).toBeNull();
  });

  it("menormalkan nama blog menjadi hostname", () => {
    const client = createTumblrClient(CONFIG);
    expect(client?.blogName).toBe("myblog.tumblr.com");
  });
});

describe("postToTumblr", () => {
  it("membuat link post dengan header OAuth & body benar saat sukses", async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        captured = { url, init };
        return jsonResponse({
          meta: { status: 201, msg: "Created" },
          response: { id: 12345, id_string: "12345" },
        });
      }),
    );

    const res = await postToTumblr(
      { title: "Judul", url: LIVE_URL, excerpt: "Ringkasan singkat." },
      CONFIG,
    );

    expect(res.success).toBe(true);
    expect(res.postId).toBe("12345");

    expect(captured).not.toBeNull();
    const headers = captured!.init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^OAuth /);
    expect(headers.Authorization).toContain("oauth_signature");
    expect(headers.Authorization).toContain("oauth_consumer_key");
    expect(String(captured!.url)).toContain("/v2/blog/myblog.tumblr.com/post");
    const body = String(captured!.init.body);
    expect(body).toContain("type=link");
    expect(body).toContain("description=");
  });

  it("dilewati (skipped) tanpa memanggil fetch bila judul kosong", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await postToTumblr({ title: "  ", url: LIVE_URL }, CONFIG);
    expect(res.skipped).toBe(true);
    expect(res.success).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("dilewati (skipped) tanpa memanggil fetch bila URL belum live", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await postToTumblr(
      { title: "Judul", url: "http://localhost:3000/x" },
      CONFIG,
    );
    expect(res.skipped).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("gagal (bukan skip) saat Tumblr menolak (meta status 401)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ meta: { status: 401, msg: "Not Authorized" } }),
      ),
    );

    const res = await postToTumblr({ title: "Judul", url: LIVE_URL }, CONFIG);
    expect(res.success).toBe(false);
    expect(res.skipped).toBeUndefined();
    expect(res.error).toContain("401");
  });

  it("dilewati bila konfigurasi tidak tersedia", async () => {
    const res = await postToTumblr({ title: "Judul", url: LIVE_URL }, null);
    expect(res.skipped).toBe(true);
    expect(res.error).toContain("belum dikonfigurasi");
  });
});

describe("verifyTumblrCredentials", () => {
  it("mengembalikan nama user & daftar blog saat sukses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          meta: { status: 200 },
          response: {
            user: {
              name: "akun-saya",
              blogs: [{ name: "myblog", url: "https://myblog.tumblr.com/" }],
            },
          },
        }),
      ),
    );

    const res = await verifyTumblrCredentials(CONFIG);
    expect(res.ok).toBe(true);
    expect(res.configured).toBe(true);
    expect(res.userName).toBe("akun-saya");
    expect(res.blogs?.[0]).toEqual({
      name: "myblog",
      url: "https://myblog.tumblr.com/",
    });
  });

  it("configured=false bila env kosong", async () => {
    const res = await verifyTumblrCredentials(null);
    expect(res.ok).toBe(false);
    expect(res.configured).toBe(false);
  });
});
