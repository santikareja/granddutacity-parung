import { NotFoundPage } from "@payloadcms/next/views";
import configPromise from "@payload-config";

import { importMap } from "../importMap.js";

type NotFoundProps = {
  params?: Promise<{ segments?: string[] }>;
  searchParams?: Promise<{ [key: string]: string | string[] }>;
};

const normalizeParams = async (paramsPromise: NotFoundProps["params"]) => {
  const params = paramsPromise ? await paramsPromise : undefined;

  return {
    segments: params?.segments ?? [],
  };
};

const normalizeSearchParams = async (
  searchParamsPromise: NotFoundProps["searchParams"],
) => (searchParamsPromise ? await searchParamsPromise : undefined) ?? {};

export default async function NotFound({ params, searchParams }: NotFoundProps) {
  return NotFoundPage({
    config: configPromise,
    importMap,
    params: normalizeParams(params),
    searchParams: normalizeSearchParams(searchParams),
  });
}
