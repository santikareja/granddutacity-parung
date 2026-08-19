export type AnalyticsEventParams = Record<string, string | number>;

export const trackEvent = (
  eventName: string,
  params?: AnalyticsEventParams
) => {
  if (
    !eventName ||
    typeof window === "undefined" ||
    typeof window.gtag !== "function"
  ) {
    return;
  }

  window.gtag("event", eventName, params);
};
