// Zero-dependency local server: serves /public and routes /api/* to the Netlify function handlers.
// Uses a file-based store in .data/ instead of Netlify Blobs.
// Run:  node tools/dev-server.mjs   ->  http://localhost:8888
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

process.env.LOCAL_STORE = "1";
const ROOT = path.resolve("public");
const PORT = Number(process.env.PORT || 8888);
const handlers = {
  "/api/public/": (await import("../netlify/functions/public-api.mjs")).default,
  "/api/admin/": (await import("../netlify/functions/admin-api.mjs")).default,
  "/api/hod/": (await import("../netlify/functions/hod-api.mjs")).default,
};
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".txt": "text/plain", ".png": "image/png" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const prefix = Object.keys(handlers).find((p) => url.pathname.startsWith(p));
  if (prefix) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const r = await handlers[prefix](request, { ip: req.socket.remoteAddress });
    const headers = Object.fromEntries(r.headers);
    res.writeHead(r.status, headers); res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  let p = decodeURIComponent(url.pathname);
  if (p === "/admin" || p === "/hod") { res.writeHead(301, { location: p + "/" }); return res.end(); }
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }); res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/html" }); res.end(await fs.readFile(path.join(ROOT, "404.html")));
  }
}).listen(PORT, () => console.log(`Local: http://localhost:${PORT}  (admin: /admin/  hod: /hod/)`));
