/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
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
  // ✅ PERFORMANCE: Enable source maps only when needed
  productionBrowserSourceMaps: process.env.ENABLE_SOURCE_MAPS === 'true',
  // ✅ FIX: Disable source maps in development to prevent 404 errors
  devIndicators: {
    buildActivity: false,
  },
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@copilotkit/react-core',
      '@copilotkit/react-ui',
      '@radix-ui/react-icons'
    ],
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // ✅ PERFORMANCE: Enable concurrent features
    serverMinification: true,
    // ✅ PERFORMANCE: Optimize CSS
    optimizeCss: true
  },
  // ✅ PERFORMANCE: Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Enable development features when NODE_ENV is development
  ...(process.env.NODE_ENV === 'development' && {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
    // Enable source maps in development builds only if explicitly requested
    productionBrowserSourceMaps: process.env.DEV_SOURCE_MAPS === 'true',
    // Enable minification for better performance even in dev
    swcMinify: true,
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
  webpack: (config, { isServer, dev }) => {
    // ✅ PERFORMANCE: Bundle optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            copilotkit: {
              test: /[\\/]node_modules[\\/]@copilotkit[\\/]/,
              name: 'copilotkit',
              priority: 20,
              reuseExistingChunk: true,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              priority: 20,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

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