const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),                        // Root of apps/web
      "@app": path.resolve(__dirname, "app"),              // For @app/page.tsx, etc.
      "@lib": path.resolve(__dirname, "lib"),              // For @lib/loadContextConfig
      "@components": path.resolve(__dirname, "components") // For @components/ui/...
    };

    // Temporarily remove complex bundle splitting to fix vendors.js syntax error
    // TODO: Re-enable optimized splitting once syntax error is resolved

    return config;
  },
  async rewrites() {
    return [
      // {
      //   source: '/api/:path*',
      //   destination: 'http://localhost:3001/api/:path*', // Proxy to API app
      // },
    ];
  },
  images: {
    domains: [
      "cdn.tribesocial.io"
    ]
  },
};

module.exports = nextConfig;