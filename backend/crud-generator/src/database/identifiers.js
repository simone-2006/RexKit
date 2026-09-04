export function quoteIdent(ident) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
        const err = new Error(`Identificatore SQL non valido: ${ident}`);
        err.status = 400;
        throw err;
    }
    return `[${ident}]`;
}
