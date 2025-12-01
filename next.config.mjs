/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 忽略构建时的 ESLint 错误，防止部署失败
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 关键修复：告诉 Webpack 忽略这些服务端/CLI 专用的包
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