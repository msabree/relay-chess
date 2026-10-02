/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // the shared rules engine ships TypeScript source
  transpilePackages: ['@relay-chess/game'],
  // accounts are gone; the old signed-in home is the landing page now
  async redirects() {
    return [{ source: '/home', destination: '/', permanent: true }];
  },
};

module.exports = nextConfig;
