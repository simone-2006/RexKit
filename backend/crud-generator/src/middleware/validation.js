export function attachTable(tableName) {
    return (req, res, next) => {
        req.crudTable = tableName;
        next();
    };
}

export function sanitizeBody(req, res, next) {
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
        return next();
    }

    const columns = req.crudColumns || [];
    const allowed = new Set(
        columns.filter((col) => !col.isIdentity && !col.isComputed).map((col) => col.name)
    );
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const filtered = {};

    for (const key of Object.keys(body)) {
        if (allowed.has(key)) {
            filtered[key] = body[key];
        }
    }

    req.crudData = filtered;
    next();
}
