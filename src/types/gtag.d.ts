declare global {
  interface Window {
    gtag: (
      command: string,
      target: string | Date,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

export {};
