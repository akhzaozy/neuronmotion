import path from 'path';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.18.83', 'localhost:3000', '127.0.0.1:3000', '192.168.*.*'],
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  async rewrites() {
    const backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'http://backend:4000'
        : 'http://127.0.0.1:4000');

    return [
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: '/api/tests/:path*',
        destination: `${backendUrl}/api/tests/:path*`,
      },
      {
        source: '/api/patients/:path*',
        destination: `${backendUrl}/api/patients/:path*`,
      },
      {
        source: '/api/doctor/:path*',
        destination: `${backendUrl}/api/doctor/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${backendUrl}/api/admin/:path*`,
      },
      {
        source: '/api/chat',
        destination: `${backendUrl}/api/chat`,
      },
      {
        source: '/api/translate/:path*',
        destination: `${backendUrl}/api/translate/:path*`,
      },
      {
        source: '/api/health',
        destination: `${backendUrl}/api/health`,
      },
    ];
  },
};

export default nextConfig;
