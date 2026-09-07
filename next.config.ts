import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  output: process.env.GITHUB_ACTIONS === "true" ? "export" : undefined,
  trailingSlash: process.env.GITHUB_ACTIONS === "true" ? true : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
