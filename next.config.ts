import type { NextConfig } from "next";

// Validate custom domain format per RFC 1123
function isValidDomain(domain: string | undefined): boolean {
  if (!domain) return false;
  // Check for valid domain format: alphanumeric, dots, hyphens
  // Allows single-character domains and complies with RFC 1123
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-.]*[a-zA-Z0-9])?$/;
  // Prevent protocol prefixes and paths
  if (domain.includes('://') || domain.includes('/')) return false;
  return domainRegex.test(domain);
}

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
      // Allow custom R2 domains if configured and valid
      ...(isValidDomain(process.env.R2_CUSTOM_DOMAIN)
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.R2_CUSTOM_DOMAIN!,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
