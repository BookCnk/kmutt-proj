/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const BE = process.env.NEXT_PUBLIC_BACKEND_ORIGIN;
    return [
      // Regular API routes
      { source: "/api/:path*", destination: `${BE}/api/:path*` },
      // Auth routes (for refresh token with first-party cookie)
      { source: "/auth/:path*", destination: `${BE}/auth/:path*` },
    ];
  },
};

export default nextConfig;
