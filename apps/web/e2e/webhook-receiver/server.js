/* eslint-disable no-console */
const http = require('http');
const { URL } = require('url');

const port = Number(process.env.WEBHOOK_RECEIVER_PORT || '3812');
const host = process.env.WEBHOOK_RECEIVER_HOST || '127.0.0.1';

let events = [];

function sendJson(res, status, obj, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${host}:${port}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/reset') {
      events = [];
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/events') {
      return sendJson(res, 200, { ok: true, events });
    }

    if (req.method === 'POST' && url.pathname === '/webhook') {
      const raw = await readBody(req);
      let json = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = null;
      }

      const record = {
        receivedAt: new Date().toISOString(),
        headers: req.headers,
        body: json,
        rawBody: raw,
      };
      events.push(record);

      // Help callers correlate delivery
      return sendJson(res, 200, { success: true }, { 'X-Message-Id': `webhook_${Date.now()}` });
    }

    return sendJson(res, 404, { ok: false, error: 'not_found' });
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: e && e.message ? e.message : String(e) });
  }
});

server.listen(port, host, () => {
  console.log(`[webhook-receiver] listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

