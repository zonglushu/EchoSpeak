import type { NextConfig } from 'next';

// Import polyfills for server-side APIs
import './polyfills';

const nextConfig: NextConfig = {
  // 优化图片
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'qpdmmzfravgswrezxsci.supabase.co',
      },
    ],
  },
};

export default nextConfig;
