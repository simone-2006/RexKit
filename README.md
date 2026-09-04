# RexKit

Template per applicazioni con **SQL Server + Express + React**.

Non scrivi controller, route o client HTTP a mano. Il backend legge le tabelle e genera il CRUD. Per le query specifiche dichiari un `define(...)`. Dal frontend usi due funzioni: `createCrud` e `q`.

Le pagine dell’app le costruisci tu in `frontend/src/App.jsx`. Questo repo è vuoto di proposito: è uno starter, non una dashboard.

---

## Avvio

Dalla root:

```powershell
npm run dev
```

| Servizio | URL | Cartella |
|---|---|---|
| Backend | http://localhost:3000 | `backend/crud-generator` |
| Frontend | http://localhost:5173 | `frontend` |

Due terminali:

```powershell
npm run dev:backend
npm run dev:frontend
```

Il frontend (Vite) fa da proxy di `/api` verso `http://localhost:3000`. In sviluppo le chiamate restano sullo stesso origin: `fetch('/api/...')`.

---

## Struttura

```
RexKit/
  backend/crud-generator/
    .env                         connessione SQL Server
    src/config/tables.js         whitelist tabelle (opzionale)
    src/api/index.js             qui dichiari le API custom
    src/custom/define.js         funzione define()
  frontend/
    src/App.jsx                  la tua UI
    src/lib/crud.js              createCrud() e q()
```

---

## Configurazione database

File: `backend/crud-generator/.env`

```
PORT=3000
DB_SERVER=...
DB_PORT=1433
DB_DATABASE=...
DB_USER=...
DB_PASSWORD=...
DB_ENCRYPT=false
```

All’avvio il backend si collega, elenca le tabelle `dbo` e monta un CRUD per ognuna.

### Whitelist

File: `backend/crud-generator/src/config/tables.js`

```js
export const allowedTables = [];
```

- Array vuoto → tutte le tabelle `dbo`
- Con nomi → solo quelle tabelle, es. `['clienti', 'ordini']`

Usa la whitelist in produzione. Senza, ogni tabella del database è un’API.

---

## CRUD automatico

Per ogni tabella esposta esiste già l’API REST. Non registri niente: parte da solo.

Sostituisci `clienti` col nome reale della tabella.

| Metodo | URL | Cosa fa |
|---|---|---|
| GET | `/api/clienti` | elenco |
| GET | `/api/clienti/:id` | un record (chiave primaria) |
| POST | `/api/clienti` | crea |
| PUT / PATCH | `/api/clienti/:id` | aggiorna |
| DELETE | `/api/clienti/:id` | elimina |
| GET | `/api/clienti/schema` | colonne, tipi, PK, identity |
| GET | `/api/_tables` | elenco tabelle esposte |

`GET /health` restituisce stato, tabelle e nomi delle query custom.

### Dal frontend

File da importare: `frontend/src/lib/crud.js`

```js
import { createCrud } from './lib/crud.js';

const clienti = createCrud('clienti');

const elenco = await clienti.list();
const uno = await clienti.get(1);
const nuovo = await clienti.create({ ragione_sociale: 'Acme Srl' });
await clienti.update(1, { ragione_sociale: 'Acme Spa' });
await clienti.remove(1);
const colonne = await clienti.schema();
```

Una chiamata, un nome tabella. Il client parla con `/api/<tabella>`.

### HTTP equivalente

```http
GET /api/clienti
POST /api/clienti
Content-Type: application/json

{ "ragione_sociale": "Acme Srl" }
```

Risposta elenco:

```json
{
  "ok": true,
  "table": "clienti",
  "schema": [ { "name": "id", "dataType": "int", "isPrimaryKey": true, "isIdentity": true } ],
  "data": [ { "id": 1, "ragione_sociale": "Acme Srl" } ]
}
```

`createCrud().list()` e `.get()` / `.create()` / `.update()` / `.remove()` restituiscono già `data` (array o oggetto), non l’involucro `{ ok, data }`.

### Comportamento

- La chiave primaria viene letta dallo schema. Get/update/delete senza PK non sono disponibili.
- In insert/update i campi **identity** e **computed** vengono ignorati.
- I nomi tabella/colonna sono quotati (`[clienti]`). I valori passano come parametri SQL, non concatenati.
- Get/update/delete usano l’id nella URL (`/api/clienti/12`). Funziona anche con chiavi non numeriche.

---

## API personalizzate

Il CRUD copre solo list / get / create / update / delete su una tabella. Filtri, join, report e comandi si dichiarano con `define`.

Non scrivi una route Express. Aggiungi un blocco in:

`backend/crud-generator/src/api/index.js`

```js
import { define } from '../custom/define.js';

define('nomeApi', {
  table: 'clienti',
  where: 'citta = @citta'
});
```

All’avvio RexKit:

1. registra l’endpoint su `/api/q/nomeApi`
2. capisce da solo i parametri dagli `@placeholder` nel SQL
3. esegue la query in modo parametrizzato
4. la rende disponibile anche con `q('nomeApi')` dal frontend

### Metodo HTTP automatico

| SQL | Metodo | Dove stanno i parametri |
|---|---|---|
| `SELECT` o `WITH` | GET | query string |
| `INSERT` / `UPDATE` / `DELETE` | POST | JSON body |

Override solo se serve: `method: 'GET'` oppure `method: 'POST'`.

### 1. Tabella + filtro (caso più comune)

```js
define('clientiAttivi', {
  table: 'clienti',
  where: 'attivo = 1'
});

define('clientiPerCitta', {
  table: 'clienti',
  where: 'citta = @citta'
});
```

RexKit genera:

```sql
SELECT * FROM [clienti] WHERE citta = @citta
```

`@citta` è il parametro. Non va dichiarato a parte.

Opzionali: `columns`, `orderBy`, `limit` (diventa `SELECT TOP (n)` su SQL Server).

```js
define('ultimiClienti', {
  table: 'clienti',
  columns: ['id', 'ragione_sociale', 'citta'],
  orderBy: 'id DESC',
  limit: 20
});
```

Usa `table` **oppure** `sql`, non entrambi.

### 2. SQL libero (join, aggregate)

```js
define('totaleOrdiniCliente', {
  sql: `
    SELECT COUNT(*) AS n, SUM(o.totale) AS totale
    FROM ordini o
    WHERE o.clienteId = @clienteId
  `
});
```

### 3. Comandi

```js
define('disattivaCliente', {
  sql: 'UPDATE clienti SET attivo = 0 WHERE id = @id'
});
```

È un `UPDATE` → diventa `POST`. Non serve scrivere `method`.

### Chiamate HTTP

Elenco delle API dichiarate:

```http
GET /api/q
```

```json
{
  "ok": true,
  "data": [
    { "name": "clientiPerCitta", "method": "GET", "params": ["citta"], "kind": "query", "table": "clienti" }
  ]
}
```

Esecuzione:

```http
GET /api/q/clientiAttivi
GET /api/q/clientiPerCitta?citta=Milano
GET /api/q/totaleOrdiniCliente?clienteId=12
```

```http
POST /api/q/disattivaCliente
Content-Type: application/json

{ "id": 12 }
```

Risposta query:

```json
{
  "ok": true,
  "data": [ { "id": 1, "ragione_sociale": "Acme Srl", "citta": "Milano" } ]
}
```

I comandi (`UPDATE` / `INSERT` / `DELETE`) restituiscono le righe di `OUTPUT` se il SQL le produce, altrimenti `{ "rowsAffected": n }`.

Se chiami GET su un’API POST (o il contrario) ottieni `405`.

### Dal frontend

```js
import { q } from './lib/crud.js';

const attivi = await q('clientiAttivi');
const milano = await q('clientiPerCitta', { citta: 'Milano' });
const totali = await q('totaleOrdiniCliente', { clienteId: 12 });
await q('disattivaCliente', { id: 12 });
```

`q()` legge il catalogo `GET /api/q` e sceglie GET o POST da solo. Tu passi solo il nome e un oggetto parametri.

CRUD e custom non si sovrappongono:

- CRUD → `/api/<tabella>`
- custom → `/api/q/<nome>`

---

## Cosa non fare (v1)

- Non concatenare valori nel SQL (`WHERE citta = '${citta}'`). Usa sempre `@nome`.
- Un `define` = uno statement. Niente più query nello stesso blocco.
- `table` accetta solo identificatori semplici (`clienti`, non `dbo.clienti` né nomi con spazi).
- I parametri arrivano solo da query string (GET) o JSON body (POST).
- Le API `table: '...'` avvisano all’avvio se la tabella non esiste o non è in whitelist. Lo `sql` libero non viene validato sulle tabelle: scrivilo con attenzione.
- Nessuna autenticazione in questa versione: la whitelist è l’unico limite su quali tabelle sono esposte.
