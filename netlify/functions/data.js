// Netlify Function: simple shared key-value storage backed by Netlify Blobs.
// GET  /.netlify/functions/data?key=KEY        -> { value: "..." | null }
// POST /.netlify/functions/data  body:{key,value} -> { ok: true }
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const store = getStore('moody-space-store');

    if (event.httpMethod === 'GET') {
      const key = event.queryStringParameters && event.queryStringParameters.key;
      if (!key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing key' }) };
      }
      // Ping check used by the app to test if this backend is reachable.
      if (key === '__ping__') {
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }
      const value = await store.get(key);
      return { statusCode: 200, headers, body: JSON.stringify({ value: value || null }) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing key' }) };
      }
      await store.set(body.key, body.value);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err && err.message ? err.message : err) }) };
  }
};
