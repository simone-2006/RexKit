import { getPool, sql } from '../config/database.js';
import { allowedTables } from '../config/tables.js';

function mapInputType(dataType) {
    const type = String(dataType || '').toLowerCase();
    if (['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney'].includes(type)) {
        return 'number';
    }
    if (type === 'bit') return 'checkbox';
    if (type === 'date') return 'date';
    if (['datetime', 'datetime2', 'smalldatetime'].includes(type)) return 'datetime-local';
    if (type === 'time') return 'time';
    if (['text', 'ntext'].includes(type)) return 'textarea';
    return 'text';
}

export async function listTables() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT TABLE_NAME AS name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
          AND TABLE_SCHEMA = 'dbo'
        ORDER BY TABLE_NAME
    `);

    const names = result.recordset.map((row) => row.name);
    if (!allowedTables.length) return names;
    return names.filter((name) => allowedTables.includes(name));
}

const metaCache = new Map();

export async function getTableMeta(tableName) {
    if (metaCache.has(tableName)) {
        return metaCache.get(tableName);
    }

    const pool = await getPool();

    const columnsResult = await pool.request()
        .input('tableName', sql.NVarChar, tableName)
        .query(`
            SELECT
                c.name,
                ty.name AS dataType,
                c.is_nullable AS isNullable,
                OBJECT_DEFINITION(c.default_object_id) AS defaultValue,
                c.max_length AS maxLength,
                c.column_id AS position,
                c.is_identity AS isIdentity,
                c.is_computed AS isComputed
            FROM sys.columns c
            INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
            INNER JOIN sys.tables t ON c.object_id = t.object_id
            INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
            WHERE t.name = @tableName
              AND s.name = 'dbo'
            ORDER BY c.column_id
        `);

    const pkResult = await pool.request()
        .input('tableName', sql.NVarChar, tableName)
        .query(`
            SELECT col.name
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic
              ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns col
              ON ic.object_id = col.object_id AND ic.column_id = col.column_id
            INNER JOIN sys.tables t ON i.object_id = t.object_id
            INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
            WHERE t.name = @tableName
              AND s.name = 'dbo'
              AND i.is_primary_key = 1
            ORDER BY ic.key_ordinal
        `);

    const pkSet = new Set(pkResult.recordset.map((row) => row.name));

    const columns = columnsResult.recordset.map((col) => ({
        name: col.name,
        dataType: col.dataType,
        inputType: mapInputType(col.dataType),
        isNullable: Boolean(col.isNullable),
        defaultValue: col.defaultValue,
        maxLength: col.maxLength,
        isIdentity: Boolean(col.isIdentity),
        isComputed: Boolean(col.isComputed),
        isPrimaryKey: pkSet.has(col.name)
    }));

    metaCache.set(tableName, columns);
    return columns;
}
