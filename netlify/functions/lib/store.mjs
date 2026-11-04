// Data layer.
// On Netlify: uses Netlify Blobs (built-in, zero-setup key/value database).
// Locally / in tests (LOCAL_STORE=1): uses JSON files under .data/ so the
// project can be run and tested without a Netlify account.
import { getStore } from "@netlify/blobs";
import fs from "node:fs/promises";
import path from "node:path";

const LOCAL = process.env.LOCAL_STORE === "1";
const LOCAL_DIR = process.env.LOCAL_STORE_DIR || path.resolve(".data");

function localStore(name) {
  const dir = path.join(LOCAL_DIR, name);
  const file = (key) => path.join(dir, encodeURIComponent(key));
  return {
    async get(key) {
      try { return JSON.parse(await fs.readFile(file(key), "utf8")); } catch { return null; }
    },
    async set(key, value) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file(key), JSON.stringify(value));
    },
    async del(key) { await fs.rm(file(key), { force: true }); },
    async list(prefix = "") {
      try {
        const names = await fs.readdir(dir);
        return names.map(decodeURIComponent).filter((k) => k.startsWith(prefix));
      } catch { return []; }
    },
  };
}

function blobStore(name) {
  const s = getStore({ name, consistency: "strong" });
  return {
    async get(key) { return (await s.get(key, { type: "json" })) ?? null; },
    async set(key, value) { await s.setJSON(key, value); },
    async del(key) { await s.delete(key); },
    async list(prefix = "") {
      const { blobs } = await s.list({ prefix });
      return blobs.map((b) => b.key);
    },
  };
}

const cache = new Map();
/** Collections: admins, hods, otps, jobs, applications, enquiries, news, audit, files, ratelimits */
export function db(name) {
  if (!cache.has(name)) cache.set(name, LOCAL ? localStore(name) : blobStore(name));
  return cache.get(name);
}

export async function listAll(name, prefix = "") {
  const store = db(name);
  const keys = await store.list(prefix);
  const items = await Promise.all(keys.map((k) => store.get(k)));
  return items.filter(Boolean);
}

export function newId(prefix = "") {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}${t}${r}`;
}

export async function audit(actor, action, detail = "") {
  const at = new Date().toISOString();
  await db("audit").set(`${at}_${newId()}`, { at, actor, action, detail });
}
