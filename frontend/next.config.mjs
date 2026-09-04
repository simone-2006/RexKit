import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ports = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../ports.json'), 'utf8')
);

const backend = `http://localhost:${ports.backend}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BACKEND_PORT: String(ports.backend)
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/health', destination: `${backend}/health` }
    ];
  }
};

export default nextConfig;
