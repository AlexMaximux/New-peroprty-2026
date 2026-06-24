import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ['@propvest/shared', '@propvest/api-client'],
};

export default nextConfig;