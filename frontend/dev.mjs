import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const { frontend } = JSON.parse(readFileSync(join(dir, '../ports.json'), 'utf8'));
const nextBin = join(dir, 'node_modules/next/dist/bin/next');

const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(frontend)], {
  cwd: dir,
  stdio: 'inherit'
});

child.on('exit', (code) => process.exit(code ?? 0));
