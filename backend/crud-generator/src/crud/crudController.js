import { getTableMeta } from '../database/schemaReader.js';
import * as crudService from './crudService.js';

async function columnsOf(req) {
    if (!req.crudColumns) {
        req.crudColumns = await getTableMeta(req.crudTable);
    }
    return req.crudColumns;
}

export async function getSchema(req, res) {
    const columns = await columnsOf(req);
    res.json({ ok: true, table: req.crudTable, data: columns });
}

export async function list(req, res) {
    const [columns, rows] = await Promise.all([
        columnsOf(req),
        crudService.listRows(req.crudTable)
    ]);
    res.json({ ok: true, table: req.crudTable, schema: columns, data: rows });
}

export async function getById(req, res) {
    const columns = await columnsOf(req);
    const row = await crudService.getRow(req.crudTable, columns, req.params.id);
    if (!row) {
        return res.status(404).json({ ok: false, error: 'Record non trovato' });
    }
    res.json({ ok: true, data: row });
}

export async function create(req, res) {
    const columns = await columnsOf(req);
    const row = await crudService.createRow(req.crudTable, columns, req.crudData || req.body);
    res.status(201).json({ ok: true, data: row });
}

export async function update(req, res) {
    const columns = await columnsOf(req);
    const row = await crudService.updateRow(req.crudTable, columns, req.params.id, req.crudData || req.body);
    if (!row) {
        return res.status(404).json({ ok: false, error: 'Record non trovato' });
    }
    res.json({ ok: true, data: row });
}

export async function remove(req, res) {
    const columns = await columnsOf(req);
    const row = await crudService.deleteRow(req.crudTable, columns, req.params.id);
    if (!row) {
        return res.status(404).json({ ok: false, error: 'Record non trovato' });
    }
    res.json({ ok: true, data: row });
}
