import path from 'path';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.18.83', 'localhost:3000', '127.0.0.1:3000', '192.168.*.*'],
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
