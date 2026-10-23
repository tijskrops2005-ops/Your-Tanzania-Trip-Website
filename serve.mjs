// Serves the built site (dist/) on http://localhost:3000 — run `npm run build` first.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, 'dist');
const port = Number(process.env.PORT) || 3000;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.pdf': 'application/pdf',
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(root, rel);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' }).end(); return; }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    const notFound = path.join(root, '404.html');
    res.writeHead(404, { 'Content-Type': types['.html'] });
    fs.existsSync(notFound) ? fs.createReadStream(notFound).pipe(res) : res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving dist/ on http://localhost:${port}`));
