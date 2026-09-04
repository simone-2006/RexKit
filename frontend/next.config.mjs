import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ports = JSON.parse(readFileSync(join(root, 'ports.json'), 'utf8'));

const backend = `http://localhost:${ports.backend}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: root,
  env: {
    NEXT_PUBLIC_BACKEND_PORT: String(ports.backend)
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/health', destination: `${backend}/health` },
      { source: '/favicon.ico', destination: '/icons/favicon.ico' }
    ];
  }
};

export default nextConfig;
