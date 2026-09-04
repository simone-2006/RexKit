const API = '/api';

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Errore HTTP ${response.status}`);
  }
  return payload;
}

export async function listTables() {
  const payload = await request(`${API}/_tables`);
  return payload.data;
}

export function createCrud(tableName) {
  const base = `${API}/${encodeURIComponent(tableName)}`;

  return {
    schema: () => request(`${base}/schema`).then((payload) => payload.data),
    list: () => request(base).then((payload) => payload.data),
    get: (id) => request(`${base}/${encodeURIComponent(id)}`).then((payload) => payload.data),
    create: (data) => request(base, { method: 'POST', body: JSON.stringify(data) }).then((payload) => payload.data),
    update: (id, data) => request(`${base}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }).then((payload) => payload.data),
    remove: (id) => request(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' }).then((payload) => payload.data)
  };
}

let catalogPromise;

export async function listQueries() {
  const payload = await request(`${API}/q`);
  return payload.data;
}

async function catalog() {
  if (!catalogPromise) {
    catalogPromise = listQueries()
      .then((apis) => Object.fromEntries(apis.map((api) => [api.name, api])))
      .catch((err) => {
        // Non tenere in cache un fallimento: al prossimo q() si riprova.
        catalogPromise = null;
        throw err;
      });
  }
  return catalogPromise;
}

export async function q(name, params = {}) {
  const apis = await catalog();
  const api = apis[name];
  if (!api) {
    throw new Error(`API '${name}' non trovata`);
  }

  if (api.method === 'GET') {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== '') qs.set(key, String(value));
    }
    const suffix = qs.toString() ? `?${qs}` : '';
    const payload = await request(`${API}/q/${encodeURIComponent(name)}${suffix}`);
    return payload.data;
  }

  const payload = await request(`${API}/q/${encodeURIComponent(name)}`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
  return payload.data;
}
