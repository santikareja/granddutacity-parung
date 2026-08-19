import "@payloadcms/next/css";
import "../../payload/admin/styles/theme.css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import configPromise from "@payload-config";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { importMap } from "./admin/importMap.js";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
    },
  },
};

type GlobalWithPayloadLogFilter = typeof globalThis & {
  __gdcPayloadDebugLogFiltered?: boolean;
};

const globalWithFilter = globalThis as GlobalWithPayloadLogFilter;

if (!globalWithFilter.__gdcPayloadDebugLogFiltered) {
  const originalConsoleLog = console.log;

  console.log = (...args: unknown[]) => {
    const firstArg = args[0];

    if (typeof firstArg === "string" && firstArg.startsWith("RootPage DEBUG")) {
      return;
    }

    originalConsoleLog(...args);
  };

  globalWithFilter.__gdcPayloadDebugLogFiltered = true;
}

export default function PayloadLayout({ children }: { children: ReactNode }) {
  async function serverFunction(args: { args: Record<string, unknown>; name: string }) {
    "use server";

    return handleServerFunctions({
      ...args,
      config: configPromise,
      importMap,
    });
  }

  return RootLayout({
    children,
    config: configPromise,
    importMap,
    serverFunction,
  });
}
