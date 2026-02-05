/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 暫時忽略 TypeScript 錯誤
    ignoreBuildErrors: true,
  },
  eslint: {
    // 暫時忽略 ESLint 錯誤
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
