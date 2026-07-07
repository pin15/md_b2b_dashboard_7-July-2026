import type { NextConfig } from "next";

/**
 * NOTE (anti-pattern md-admin has — deliberately NOT copied):
 * md-admin's next.config.ts sets `typescript.ignoreBuildErrors` (and the old
 * `eslint.ignoreDuringBuilds`) to true. This app keeps type-checking ON so the
 * build fails on a type error. ESLint runs as its own CI gate (`npm run lint`) —
 * Next 16 no longer exposes an `eslint` key in next.config, so lint lives in CI.
 * Do not set `ignoreBuildErrors` to true.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // The dashboard is a thin client: it talks to apps/api over GraphQL and to
  // Supabase Auth only. No images proxy, no service-role, no direct DB.
};

export default nextConfig;
