import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Empty turbopack config to work with Next.js 16 default build
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias.canvas = false;
    }
    // Disable pdfjs-dist workers on server (not needed for text extraction)
    config.resolve.alias['pdfjs-dist/legacy/build/pdf.worker.mjs'] = false;
    config.resolve.alias['pdfjs-dist/build/pdf.worker.mjs'] = false;
    config.resolve.alias['pdfjs-dist/build/pdf.worker.js'] = false;
    config.resolve.alias['pdfjs-dist/build/pdf.worker.entry'] = false;
    return config;
  },
};

export default nextConfig;
