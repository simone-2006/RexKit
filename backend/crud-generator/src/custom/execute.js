import { getPool, sql } from '../config/database.js';
import { getApi } from './define.js';

function bindParams(request, names, values) {
    for (const name of names) {
        if (!(name in values) || values[name] === undefined) {
            const err = new Error(`Parametro mancante: ${name}`);
            err.status = 400;
            throw err;
        }

        const value = values[name];
        if (value === null || value === '') {
            request.input(name, sql.NVarChar, null);
        } else if (typeof value === 'boolean') {
            request.input(name, sql.Bit, value);
        } else if (typeof value === 'number') {
            request.input(name, Number.isInteger(value) ? sql.Int : sql.Float, value);
        } else {
            request.input(name, sql.NVarChar(sql.MAX), String(value));
        }
    }
}

export async function runApi(name, values = {}) {
    const api = getApi(name);
    if (!api) {
        const err = new Error(`API '${name}' non trovata`);
        err.status = 404;
        throw err;
    }

    const pool = await getPool();
    const request = pool.request();
    bindParams(request, api.params, values);

    const result = await request.query(api.sql);
    const rows = result.recordset;

    if (api.kind === 'query') {
        return rows || [];
    }

    if (Array.isArray(rows) && rows.length) {
        return rows;
    }

    const affected = Array.isArray(result.rowsAffected)
        ? result.rowsAffected[result.rowsAffected.length - 1]
        : result.rowsAffected;

    return { rowsAffected: affected ?? 0 };
}
