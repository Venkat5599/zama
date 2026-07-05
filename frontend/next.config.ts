import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    config.resolve.alias = { ...config.resolve.alias, "pino-pretty": false };
    return config;
  },
};

export default nextConfig;
