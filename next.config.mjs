/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Turbopack configuration (for future use)
  experimental: {
    // Future Turbopack settings can go here
  },
};

export default nextConfig;
