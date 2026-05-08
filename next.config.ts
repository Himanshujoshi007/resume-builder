import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Prevent unpdf from being bundled on the server side
    // It's only used client-side via dynamic import
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('unpdf');
      }
    }
    return config;
  },
};

export default nextConfig;
