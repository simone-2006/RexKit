import { Router } from 'express';
import { getApi, listApis } from './define.js';
import { runApi } from './execute.js';

function paramsFrom(req, method) {
    return method === 'GET' ? { ...req.query } : { ...(req.body || {}) };
}

export function customRouter() {
    const router = Router();

    router.get('/q', (req, res) => {
        res.json({ ok: true, data: listApis() });
    });

    async function handle(req, res, next) {
        try {
            const api = getApi(req.params.name);
            if (!api) {
                return res.status(404).json({ ok: false, error: `API '${req.params.name}' non trovata` });
            }
            if (req.method !== api.method) {
                return res.status(405).json({
                    ok: false,
                    error: `Usa ${api.method} per '${api.name}'`
                });
            }

            const data = await runApi(api.name, paramsFrom(req, api.method));
            res.json({ ok: true, data });
        } catch (err) {
            next(err);
        }
    }

    router.get('/q/:name', handle);
    router.post('/q/:name', handle);

    return router;
}
