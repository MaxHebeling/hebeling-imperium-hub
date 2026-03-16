/* Global type declarations for tracking scripts */

interface Window {
  gtag?: (
    command: string,
    targetOrAction: string,
    params?: Record<string, unknown>
  ) => void;
  dataLayer?: Record<string, unknown>[];
  fbq?: (
    command: string,
    eventOrPixelId: string,
    params?: Record<string, unknown>
  ) => void;
}
