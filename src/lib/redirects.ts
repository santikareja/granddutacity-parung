export const HOMEPAGE_CANNIBALIZATION_REDIRECT_PATH =
  "/perumahan-eksklusif-di-parung-bogor-dengan-fasilitas-lengkap" as const;

export const REDIRECTED_SITEMAP_SOURCE_PATHS = [
  HOMEPAGE_CANNIBALIZATION_REDIRECT_PATH,
] as const;

const redirectedSitemapSourcePathSet = new Set<string>(
  REDIRECTED_SITEMAP_SOURCE_PATHS,
);

function normalizePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "/";

  const pathname = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return (withoutTrailingSlash || "/").toLowerCase();
}

export function pathFromSitemapUrl(url: string) {
  try {
    return normalizePath(new URL(url).pathname);
  } catch {
    return normalizePath(url);
  }
}

export function isRedirectedSitemapSourcePath(pathname: string) {
  return redirectedSitemapSourcePathSet.has(normalizePath(pathname));
}

export function isRedirectedSitemapSourceUrl(url: string) {
  return isRedirectedSitemapSourcePath(pathFromSitemapUrl(url));
}
