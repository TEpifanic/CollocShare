import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
  },
  typescript: {
    // Ignorez les erreurs TypeScript pendant le développement
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorez les erreurs ESLint pendant le développement
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  // Augmenter la mémoire disponible pour Webpack
  webpack: (config) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
};

export default nextConfig;
