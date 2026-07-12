/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // In production (Vercel), the backend is served from the same origin via
  // rewrites, so /api/* calls hit the Express backend automatically.
  // In local dev, we proxy /api/* to the backend running on port 3000.
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      // On Vercel, routing is handled by vercel.json, no rewrites needed.
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
