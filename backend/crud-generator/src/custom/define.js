import { quoteIdent } from '../database/identifiers.js';

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const registry = new Map();

function extractParams(sql) {
    const found = [];
    const re = /(?<![@\w])@([A-Za-z_][A-Za-z0-9_]*)/g;
    let match;
    while ((match = re.exec(sql))) {
        if (!found.includes(match[1])) {
            found.push(match[1]);
        }
    }
    return found;
}

function inferKind(sql) {
    const first = sql.replace(/^[\s(]+/, '').split(/\s+/)[0].toUpperCase();
    if (first === 'SELECT' || first === 'WITH') return 'query';
    return 'command';
}

function buildSelect(name, options) {
    const cols = options.columns?.length
        ? options.columns.map((col) => quoteIdent(col)).join(', ')
        : '*';

    let sql = 'SELECT';
    if (options.limit != null) {
        const n = Number(options.limit);
        if (!Number.isInteger(n) || n < 1) {
            throw new Error(`API '${name}': limit non valido`);
        }
        sql += ` TOP (${n})`;
    }

    sql += ` ${cols} FROM ${quoteIdent(options.table)}`;
    if (options.where) sql += ` WHERE ${options.where}`;
    if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
    return sql;
}

function compile(name, options = {}) {
    if (!NAME_RE.test(name)) {
        throw new Error(`Nome API non valido: ${name}`);
    }
    if (!options.sql && !options.table) {
        throw new Error(`API '${name}': specifica table o sql`);
    }
    if (options.sql && options.table) {
        throw new Error(`API '${name}': usa table oppure sql, non entrambi`);
    }

    let sqlText = options.sql
        ? String(options.sql).trim()
        : buildSelect(name, options);

    sqlText = sqlText.replace(/;+\s*$/, '');
    if (sqlText.includes(';')) {
        throw new Error(`API '${name}': un solo statement per define`);
    }

    const kind = inferKind(sqlText);
    const method = String(options.method || (kind === 'query' ? 'GET' : 'POST')).toUpperCase();
    if (method !== 'GET' && method !== 'POST') {
        throw new Error(`API '${name}': method deve essere GET o POST`);
    }

    return {
        name,
        sql: sqlText,
        params: extractParams(sqlText),
        method,
        kind,
        table: options.table || null
    };
}

export function define(name, options) {
    if (registry.has(name)) {
        throw new Error(`API già definita: ${name}`);
    }
    const api = compile(name, options);
    registry.set(name, api);
    return api;
}

export function getApi(name) {
    return registry.get(name) || null;
}

export function listApis() {
    return [...registry.values()].map((api) => ({
        name: api.name,
        method: api.method,
        params: api.params,
        kind: api.kind,
        table: api.table
    }));
}
