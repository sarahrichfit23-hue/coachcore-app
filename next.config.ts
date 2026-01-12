import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        "react/jsx-runtime.js": "react/jsx-runtime",
        "react/jsx-dev-runtime.js": "react/jsx-dev-runtime",
      },
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react/jsx-runtime.js": "react/jsx-runtime",
      "react/jsx-dev-runtime.js": "react/jsx-dev-runtime",
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
