const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),                        // Root of apps/web
      "@app": path.resolve(__dirname, "app"),              // For @app/page.tsx, etc.
      "@lib": path.resolve(__dirname, "lib"),              // For @lib/loadContextConfig
      "@components": path.resolve(__dirname, "components") // For @components/ui/...
    };
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
};

module.exports = nextConfig;