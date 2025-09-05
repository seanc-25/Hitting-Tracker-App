/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment configuration
  output: 'standalone',
  trailingSlash: false,
  
  // Build optimization
  swcMinify: true,
  
  // Image optimization for Vercel
  images: {
    unoptimized: true, // Disable for Vercel
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
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