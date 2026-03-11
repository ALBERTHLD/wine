import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const wanted = join(root, pathname === '/' ? 'index.html' : pathname.slice(1));

  if (existsSync(wanted) && extname(wanted)) {
    const data = readFileSync(wanted);
    res.writeHead(200, { 'Content-Type': mime[extname(wanted)] || 'application/octet-stream' });
    res.end(data);
    return;
  }

  const index = readFileSync(join(root, 'index.html'));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(index);
}).listen(4173, '0.0.0.0', () => console.log('Server running on http://0.0.0.0:4173'));
