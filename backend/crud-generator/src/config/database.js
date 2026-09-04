import sql from 'mssql';
import 'dotenv/config';

const config = {
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD?.replace(/^["']|["']$/g, ''),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true
    }
};

let pool;

export async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
        console.log(`Connesso a SQL Server: ${config.database}`);
    }
    return pool;
}

export { sql };
