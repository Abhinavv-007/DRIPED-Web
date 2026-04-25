import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Static export so we can deploy to Cloudflare Pages without the
  // OpenNext adapter. Driped's dashboard is fully client-rendered
  // (Firebase Auth + TanStack Query against the Worker API) so no SSR
  // features are needed.
  output: "export",
  // Allow the Windsurf browser preview proxy (127.0.0.1 on arbitrary ports)
  // to hit Next.js dev resources like /_next/webpack-hmr.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Pin Turbopack's workspace root to apps/web. In a pnpm workspace, Next
  // otherwise tries to infer the root and trips on the monorepo layout.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // next/image optimization endpoint isn't available in static export.
    // We use the raw remote URLs (Simple Icons CDN, jsdelivr, Google
    // user content) so this is fine.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.simpleicons.org" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
