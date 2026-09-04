import { getPool, sql } from '../config/database.js';
import { quoteIdent as quote } from '../database/identifiers.js';

function getPrimaryKey(columns) {
    return columns.find((col) => col.isPrimaryKey) || null;
}

function writableColumns(columns) {
    return columns.filter((col) => !col.isIdentity && !col.isComputed);
}

function sqlType(dataType) {
    const type = String(dataType || '').toLowerCase();
    if (['int', 'smallint', 'tinyint'].includes(type)) return sql.Int;
    if (type === 'bigint') return sql.BigInt;
    if (type === 'bit') return sql.Bit;
    if (['decimal', 'numeric'].includes(type)) return sql.Decimal(18, 4);
    if (['float', 'real'].includes(type)) return sql.Float;
    if (['money', 'smallmoney'].includes(type)) return sql.Money;
    if (type === 'date') return sql.Date;
    if (['datetime', 'datetime2', 'smalldatetime'].includes(type)) return sql.DateTime2;
    if (type === 'time') return sql.Time;
    if (type === 'uniqueidentifier') return sql.UniqueIdentifier;
    return sql.NVarChar(sql.MAX);
}

function normalizeValue(column, value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    if (column.inputType === 'checkbox') {
        return value === true || value === 1 || value === '1' || value === 'true';
    }
    if (column.inputType === 'number') {
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
    }
    return value;
}

function bind(request, columns, data) {
    for (const column of columns) {
        if (!(column.name in data)) continue;
        request.input(column.name, sqlType(column.dataType), normalizeValue(column, data[column.name]));
    }
}

export async function listRows(tableName) {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM ${quote(tableName)}`);
    return result.recordset;
}

export async function getRow(tableName, columns, id) {
    const pk = getPrimaryKey(columns);
    if (!pk) {
        const err = new Error(`La tabella '${tableName}' non ha una chiave primaria`);
        err.status = 400;
        throw err;
    }

    const pool = await getPool();
    const request = pool.request().input('id', sqlType(pk.dataType), id);
    const result = await request.query(`
        SELECT * FROM ${quote(tableName)}
        WHERE ${quote(pk.name)} = @id
    `);

    return result.recordset[0] || null;
}

export async function createRow(tableName, columns, data) {
    const fields = writableColumns(columns).filter((col) => col.name in data);
    const pool = await getPool();
    const request = pool.request();

    let query;
    if (!fields.length) {
        query = `INSERT INTO ${quote(tableName)} OUTPUT INSERTED.* DEFAULT VALUES`;
    } else {
        bind(request, fields, data);
        const names = fields.map((col) => quote(col.name)).join(', ');
        const values = fields.map((col) => `@${col.name}`).join(', ');
        query = `INSERT INTO ${quote(tableName)} (${names}) OUTPUT INSERTED.* VALUES (${values})`;
    }

    const result = await request.query(query);
    return result.recordset[0];
}

export async function updateRow(tableName, columns, id, data) {
    const pk = getPrimaryKey(columns);
    if (!pk) {
        const err = new Error(`La tabella '${tableName}' non ha una chiave primaria`);
        err.status = 400;
        throw err;
    }

    const fields = writableColumns(columns).filter((col) => col.name in data && col.name !== pk.name);
    if (!fields.length) {
        const err = new Error('Nessun campo da aggiornare');
        err.status = 400;
        throw err;
    }

    const pool = await getPool();
    const request = pool.request().input('id', sqlType(pk.dataType), id);
    bind(request, fields, data);

    const sets = fields.map((col) => `${quote(col.name)} = @${col.name}`).join(', ');
    const result = await request.query(`
        UPDATE ${quote(tableName)}
        SET ${sets}
        OUTPUT INSERTED.*
        WHERE ${quote(pk.name)} = @id
    `);

    return result.recordset[0] || null;
}

export async function deleteRow(tableName, columns, id) {
    const pk = getPrimaryKey(columns);
    if (!pk) {
        const err = new Error(`La tabella '${tableName}' non ha una chiave primaria`);
        err.status = 400;
        throw err;
    }

    const pool = await getPool();
    const request = pool.request().input('id', sqlType(pk.dataType), id);
    const result = await request.query(`
        DELETE FROM ${quote(tableName)}
        OUTPUT DELETED.*
        WHERE ${quote(pk.name)} = @id
    `);

    return result.recordset[0] || null;
}

export { getPrimaryKey };
