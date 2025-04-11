/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    ppr: false,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  // Disable static optimization for API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization.moduleIds = 'named';
    }
    return config;
  },
};

module.exports = nextConfig;
