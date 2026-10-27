import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const portFlag = process.argv.indexOf('--port');
const port = Number(portFlag >= 0 ? process.argv[portFlag + 1] : process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp4': 'video/mp4' };

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let target = path.resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    const { size } = await stat(target);
    const headers = { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
    let start = 0, end = size - 1, status = 200;
    if (req.headers.range && req.method !== 'HEAD') {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (match && (match[1] || match[2])) {
        start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
      } else start = size;
      if (start > end || start >= size || start < 0) {
        res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}`, 'Content-Length': 0 }).end(); return;
      }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    }
    res.writeHead(status, { ...headers, 'Content-Length': Math.max(0, end - start + 1) });
    if (req.method === 'HEAD' || !size) res.end();
    else {
      const stream = createReadStream(target, { start, end });
      stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res);
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(port, '0.0.0.0', function () { console.log(`Stillwater is ready at http://localhost:${this.address().port}`); });
