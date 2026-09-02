import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  experimental: {
    // The CMS validates videos at 100 MB; leave room for multipart boundaries.
    middlewareClientMaxBodySize: "101mb",
  },
};

export default nextConfig;
