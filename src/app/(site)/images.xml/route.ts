import { siteImages } from "@/data/images";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;

const IMAGE_FILE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
const pageUrl = (page: string) => (page === "/" ? SITE_URL : `${SITE_URL}${page}`);

export async function GET() {
  const uniqueImageEntries = siteImages.filter(
    (image, index, allImages) =>
      IMAGE_FILE_PATTERN.test(image.url) &&
      allImages.findIndex(
        (candidate) =>
          candidate.page === image.page && candidate.url === image.url
      ) === index
  );

  const pageMap = uniqueImageEntries.reduce<
    Record<string, typeof uniqueImageEntries>
  >((acc, image) => {
    if (!acc[image.page]) {
      acc[image.page] = [];
    }

    acc[image.page].push(image);
    return acc;
  }, {});

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${Object.entries(pageMap)
  .map(
    ([page, images]) => `  <url>
    <loc>${pageUrl(page)}</loc>
${images
  .map(
    (image) => `    <image:image>
      <image:loc>${escapeXml(image.url)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
      <image:caption>${escapeXml(image.caption)}</image:caption>
    </image:image>`
  )
  .join("\n")}
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
