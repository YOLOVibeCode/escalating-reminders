/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@er/types',
    '@er/constants',
    '@er/utils',
    '@er/ui-components',
    '@er/api-client',
  ],
  experimental: {
    typedRoutes: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3801',
  },
};

module.exports = nextConfig;

