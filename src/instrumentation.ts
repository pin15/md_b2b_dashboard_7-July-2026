// Server-side instrumentation (Next calls register() at server startup). Env-guarded:
// Sentry is dynamically imported and initialised ONLY when SENTRY_DSN is set, so with
// no DSN nothing is loaded — the local default. No PII is sent.
import type { Instrumentation } from "next";

export async function register(): Promise<void> {
  if (process.env.SENTRY_DSN && process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0"),
      sendDefaultPii: false,
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
