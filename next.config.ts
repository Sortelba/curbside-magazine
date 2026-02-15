import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS === 'true' ? "export" : undefined, // Only export on GitHub
  images: {
    unoptimized: true, // Required for next/image on static sites
  },
};

export default nextConfig;
