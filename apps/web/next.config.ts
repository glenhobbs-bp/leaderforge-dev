import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better dev experience
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: ['@leaderforge/ui', '@leaderforge/services', '@leaderforge/database'],

  // Image domains for external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'edge.tribesocial.io',
      },
      {
        protocol: 'https',
        hostname: 'cdn.tribesocial.io',
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;

