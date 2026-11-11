import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export type Server = { url: string; close: () => Promise<void> };

/**
 * Seam 4 of tests/site/README.md: the build is a folder of static files, served the way Cloudflare serves one.
 * `/a/b/` is a/b/index.html, `/a/b` redirects to `/a/b/` when a/b/ is a folder, any other path is that file, and a
 * missing one is 404 (with 404.html when the build has one). No dependency on the site's own tooling.
 */
export async function serveFolder(root: string): Promise<Server> {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const file = path.join(root, path.normalize(decodeURIComponent(url.pathname)));
    if (file !== root && !file.startsWith(root + path.sep)) return send(response, 404);
    if (url.pathname.endsWith('/')) return sendFile(response, path.join(file, 'index.html'), root);
    if (isFolder(file)) {
      response.writeHead(308, { location: url.pathname + '/' + url.search });
      return response.end();
    }
    return sendFile(response, file, root);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

function isFolder(file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).isDirectory();
}

function sendFile(response: http.ServerResponse, file: string, root: string): void {
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    response.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
    return;
  }
  const notFound = path.join(root, '404.html');
  if (fs.existsSync(notFound)) {
    response.writeHead(404, { 'content-type': TYPES['.html'] });
    fs.createReadStream(notFound).pipe(response);
    return;
  }
  send(response, 404);
}

function send(response: http.ServerResponse, status: number): void {
  response.writeHead(status, { 'content-type': TYPES['.txt'] });
  response.end(http.STATUS_CODES[status]);
}
