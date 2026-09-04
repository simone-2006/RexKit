import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ports = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../ports.json'), 'utf8')
);

export const backendPort = Number(process.env.PORT) || Number(ports.backend);
export const frontendPort = Number(ports.frontend);
export const frontendOrigins = [
    `http://localhost:${frontendPort}`,
    `http://127.0.0.1:${frontendPort}`
];
