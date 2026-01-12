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
      // Cloudflare R2 public domains pattern
      // Note: Next.js supports wildcard subdomains in hostname patterns
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      // Allow custom R2 domains if configured
      ...(process.env.R2_CUSTOM_DOMAIN
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.R2_CUSTOM_DOMAIN,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
