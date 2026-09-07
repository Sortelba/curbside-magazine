import type { NextConfig } from "next";

const safeProjectRoot = process.env.HOME
  ? `${process.env.HOME}/curbside-magazine`
  : process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: safeProjectRoot,
  },
  output: process.env.GITHUB_ACTIONS === 'true' ? "export" : undefined, // Only export on GitHub
  images: {
    unoptimized: true, // Required for next/image on static sites
  },
};

export default nextConfig;
