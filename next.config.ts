import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '5.imimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
    // Disable image optimization cache to avoid permission issues
    // Or set a custom cache directory with proper permissions
    unoptimized: false,
    // Use a custom cache directory if needed
    // cacheDir: process.env.NEXT_IMAGE_CACHE_DIR || undefined,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
};

export default nextConfig;
