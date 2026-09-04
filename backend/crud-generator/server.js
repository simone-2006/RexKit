import { createApp } from './src/app.js';
import { backendPort } from './src/config/ports.js';

try {
    const { app, tables } = await createApp();

    app.listen(backendPort, () => {
        console.log(`Backend: http://localhost:${backendPort}`);
        console.log(`CRUD generato per ${tables.length} tabelle`);
        console.log(`Query custom: GET http://localhost:${backendPort}/api/q`);
    });
} catch (err) {
    console.error('Avvio fallito. Controlla la connessione in backend/crud-generator/.env');
    console.error(err.message);
    process.exit(1);
}
