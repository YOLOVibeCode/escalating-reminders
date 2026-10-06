/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint is its own CI job (1.7k pre-existing findings); a lint finding must not block a deployable build.
  // Type errors still fail `next build`.
  eslint: { ignoreDuringBuilds: true },
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

