/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Leaflet SSR suppression
  transpilePackages: ['react-leaflet'],
};

module.exports = nextConfig;