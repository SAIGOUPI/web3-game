/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.externals.push({
      'pino-pretty': 'commonjs pino-pretty',
      'lokijs': 'commonjs lokijs',
      'encoding': 'commonjs encoding',
    });
    return config;
  },
};

export default nextConfig;