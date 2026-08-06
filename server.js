/**
 * TELE PRÉMIO — Servidor local (Node.js puro, sem dependências)
 * Resolve o problema de CORS fazendo as chamadas Payblack no servidor.
 *
 * Executar: node server.js
 * Abrir:    http://localhost:3000
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT    = 3000;
const API_KEY = 'pk_25vq62dAbRZXgrOkbnRxMV9x-4OKEnsThInBAPBYhx8';
const API_HOST = 'h.paymoz.tech';

/* ---- MIME types ---- */
const MIMES = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.json': 'application/json',
};

/* ---- Proxy helper ---- */
function proxyToPayblack(req, res, apiPath) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const opts = {
      hostname: API_HOST,
      port    : 443,
      path    : apiPath,
      method  : 'POST',
      headers : {
        'Content-Type'  : 'application/json',
        'Authorization' : 'ApiKey ' + API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const apiReq = https.request(opts, apiRes => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    });

    apiReq.on('error', err => {
      console.error('[Payblack Error]', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Erro de gateway: ' + err.message }));
    });

    apiReq.write(body);
    apiReq.end();
  });
}

/* ---- HTTP Server ---- */
const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;

  /* --- CORS headers (para desenvolvimento) --- */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  /* --- Rotas de proxy para Payblack --- */
  if (req.method === 'POST' && pathname === '/api/pay/mpesa') {
    console.log('[M-Pesa]  Chamada recebida →', pathname);
    proxyToPayblack(req, res, '/api/v1/pagamentos/c2b/pay/');
    return;
  }

  if (req.method === 'POST' && pathname === '/api/pay/emola') {
    console.log('[e-Mola]  Chamada recebida →', pathname);
    proxyToPayblack(req, res, '/api/v1/pagamentos/emola/c2b/pay/');
    return;
  }

  /* --- Servir ficheiros estáticos --- */
  let filePath = '.' + pathname;
  if (filePath === './' || filePath === '.') filePath = './index.html';

  const ext         = path.extname(filePath).toLowerCase();
  const contentType = MIMES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 – Ficheiro não encontrado: ' + filePath);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 – Erro interno do servidor');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   ✅ Servidor Tele Prémio iniciado!      ║');
  console.log('║                                          ║');
  console.log(`║   🌐 http://localhost:${PORT}               ║`);
  console.log('║                                          ║');
  console.log('║   Pressione Ctrl+C para parar.           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
