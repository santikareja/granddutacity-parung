import type { MetadataRoute } from "next";

const BASE_URL = "https://granddutacitysouthofjakarta.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "PerplexityBot",
          "ChatGPT-User",
          "ClaudeBot",
          "anthropic-ai",
          "GPTBot",
          "OAI-SearchBot",
          "CCBot",
          "Google-Extended",
        ],
        allow: "/",
        disallow: ["/admin/"],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/images.xml`],
    host: BASE_URL,
  };
}
