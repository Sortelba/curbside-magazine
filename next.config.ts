import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS === "true" ? "export" : undefined,
  trailingSlash: process.env.GITHUB_ACTIONS === "true" ? true : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
