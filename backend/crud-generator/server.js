import { createApp } from './src/app.js';

const PORT = Number(process.env.PORT) || 3000;
const { app, tables } = await createApp();

app.listen(PORT, () => {
    console.log(`Backend: http://localhost:${PORT}`);
    console.log(`CRUD generato per ${tables.length} tabelle`);
    if (tables.includes('clienti')) {
        console.log('Esempio: GET http://localhost:' + PORT + '/api/clienti');
    }
});
