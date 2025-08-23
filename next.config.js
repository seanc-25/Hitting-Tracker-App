/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router configuration
  experimental: {
    appDir: true,
  },
  
  // Production build optimization
  output: 'standalone',
  
  // Routing configuration
  trailingSlash: false,
  
  // Image optimization for Vercel
  images: {
    unoptimized: false,
    domains: [],
    remotePatterns: [],
  },
  
  // Build optimization
  swcMinify: true,
  
  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for better security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for better routing
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Webpack configuration for better builds
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};
 
module.exports = nextConfig; 