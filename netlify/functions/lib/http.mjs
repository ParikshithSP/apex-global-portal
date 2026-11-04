// Small HTTP helpers for Netlify Functions (v2 Request/Response API).
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}
export const ok = (data = {}, headers) => json({ ok: true, ...data }, 200, headers);
export const fail = (status, error, extra = {}) => json({ ok: false, error, ...extra }, status);

export async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

/** Returns the route after a base, e.g. "/api/admin/auth/login" with base "/api/admin" -> "/auth/login". */
export function route(req, base) {
  const p = new URL(req.url).pathname.replace(/\/+$/, "");
  return p.startsWith(base) ? p.slice(base.length) || "/" : p;
}

export function getCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function setCookie(name, value, maxAgeSec) {
  const secure = process.env.LOCAL_STORE === "1" ? "" : "; Secure";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`;
}

/** Blocks cross-site form posts (CSRF defence in addition to SameSite cookies). */
export function sameOrigin(req) {
  if (req.method === "GET") return true;
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients / same-origin fetch in some browsers
  return origin === new URL(req.url).origin;
}

export function clientIp(req, context) {
  return context?.ip || req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "local";
}
