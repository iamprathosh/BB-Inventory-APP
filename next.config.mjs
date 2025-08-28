/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable webpack cache to prevent permission issues
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
