/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // the shared rules engine ships TypeScript source
  transpilePackages: ['@relay-chess/game'],
};

module.exports = nextConfig;
