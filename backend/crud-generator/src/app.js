import express from 'express';
import cors from 'cors';
import { listTables } from './database/schemaReader.js';
import { generateCrud } from './crud/crudRoutes.js';

export async function createApp() {
    const app = express();

    app.use(cors({
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
    }));
    app.use(express.json({ limit: '1mb' }));

    const tables = await listTables();

    app.get('/health', (req, res) => {
        res.json({ ok: true, tables });
    });

    app.get('/api/_tables', (req, res) => {
        res.json({ ok: true, data: tables });
    });

    for (const table of tables) {
        app.use(`/api/${table}`, generateCrud(table));
    }

    app.use((req, res) => {
        res.status(404).json({ ok: false, error: 'Endpoint non trovato' });
    });

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(err.status || 500).json({
            ok: false,
            error: err.message || 'Errore interno'
        });
    });

    return { app, tables };
}
