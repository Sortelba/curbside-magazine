import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  output: process.env.GITHUB_ACTIONS === "true" ? "export" : undefined,
  trailingSlash: process.env.GITHUB_ACTIONS === "true" ? true : undefined,
  // Dev-Server läuft auf 127.0.0.1, im Browser wird oft localhost geöffnet:
  // sonst blockiert Next.js die Live-Aktualisierung (HMR)
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
