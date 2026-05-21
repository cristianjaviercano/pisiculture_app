import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile shared package so Next.js handles its TypeScript source
  transpilePackages: ['@aquashell/shared'],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@aquashell/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    };
    return config;
  },
};

export default nextConfig;
