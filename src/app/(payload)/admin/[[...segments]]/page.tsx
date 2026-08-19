import { generatePageMetadata, RootPage } from "@payloadcms/next/views";
import configPromise from "@payload-config";

import { importMap } from "../importMap.js";

type PageProps = {
  params?: Promise<{ segments?: string[] }>;
  searchParams?: Promise<{ [key: string]: string | string[] }>;
};

const normalizeParams = async (paramsPromise: PageProps["params"]) => {
  const params = paramsPromise ? await paramsPromise : undefined;
  const safeParams = {
    ...(params ?? {}),
    segments: params?.segments ?? [],
  };

  return {
    segments: safeParams.segments,
  };
};

const normalizeSearchParams = async (searchParamsPromise: PageProps["searchParams"]) =>
  (searchParamsPromise ? await searchParamsPromise : undefined) ?? {};

export const generateMetadata = ({ params, searchParams }: PageProps) =>
  generatePageMetadata({
    config: configPromise,
    params: normalizeParams(params),
    searchParams: normalizeSearchParams(searchParams),
  });

export default async function Page({ params, searchParams }: PageProps) {
  return RootPage({
    config: configPromise,
    importMap,
    params: normalizeParams(params),
    searchParams: normalizeSearchParams(searchParams),
  });
}
