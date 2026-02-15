import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",  // Required for GitHub Pages
  images: {
    unoptimized: true, // Required for next/image on static sites
  },
};

export default nextConfig;
