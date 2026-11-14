/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // the shared rules engine ships TypeScript source
  transpilePackages: ['@relay-chess/game'],
  // accounts are gone; the old signed-in home is the landing page now
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      // contact merged into the about page
      { source: '/contact', destination: '/about#contact', permanent: true },
    ];
  },
  // Only production gets indexed. Staging (main) is a Vercel preview deploy.
  async headers() {
    if (process.env.VERCEL_ENV === 'production') return [];
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};

module.exports = nextConfig;
