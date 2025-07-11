const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable React Strict Mode to prevent double rendering during development
  // This eliminates the flashing and multiple component mounting issues
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  // ✅ FIX: Disable source maps in development to prevent 404 errors
  devIndicators: {
    buildActivity: false,
  },
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // Enable development features when NODE_ENV is development
  ...(process.env.NODE_ENV === 'development' && {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
    // Enable source maps in development builds
    productionBrowserSourceMaps: true,
    // Disable minification for better debugging
    swcMinify: false,
  }),
  // Force development mode if VERCEL_ENV is preview and FORCE_DEV is set
  ...(process.env.VERCEL_ENV === 'preview' && process.env.FORCE_DEV === 'true' && {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
    productionBrowserSourceMaps: true,
    swcMinify: false,
  }),
      webpack: (config) => {
    // ✅ FIX: Remove devtool override to prevent performance warnings
    // Source maps are handled by Next.js automatically

    // ✅ FIX: Minimal webpack config to prevent rebuild issues
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
      "@app": path.resolve(__dirname, "app"),
      "@lib": path.resolve(__dirname, "lib"),
      "@components": path.resolve(__dirname, "components")
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
  images: {
    // ❌ REMOVED: domains - deprecated configuration
    // domains: ["cdn.tribesocial.io"], // Use remotePatterns instead
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.tribesocial.io',
        pathname: '/videos/**',
      }
    ],
    minimumCacheTTL: 300,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    loader: 'default'
  },
};

module.exports = nextConfig;