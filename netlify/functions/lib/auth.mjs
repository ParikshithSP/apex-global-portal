// Passwords, sessions, OTPs, validation and rate limiting.
import crypto from "node:crypto";
import { db } from "./store.mjs";
import { getCookie } from "./http.mjs";

const SECRET = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
export const SESSION_HOURS = Number(process.env.SESSION_HOURS || 8);

// ---------- validation ----------
export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;

/** Optional company-domain restriction, e.g. ADMIN_ALLOWED_DOMAINS="sunmobility.com" */
export function domainAllowed(email, envVar) {
  const list = (process.env[envVar] || "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (!list.length) return true;
  return list.includes(email.split("@")[1]);
}

export function passwordProblem(pw) {
  pw = String(pw || "");
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (pw.length > 128) return "Password is too long.";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw))
    return "Password needs upper & lower case letters, a number and a special character.";
  return null;
}

// ---------- passwords (scrypt) ----------
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export function verifyPassword(pw, stored) {
  const [, salt, hash] = String(stored || "").split("$");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(String(pw), salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, "hex"));
}

// ---------- OTP ----------
export const OTP_TTL_MIN = 10;
export const genOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
export const hashOtp = (email, otp) => crypto.createHmac("sha256", SECRET).update(`${email}:${otp}`).digest("hex");

// ---------- sessions (HMAC-signed, httpOnly cookie) ----------
const b64 = (s) => Buffer.from(s).toString("base64url");
export function signSession(payload) {
  const data = b64(JSON.stringify({ ...payload, exp: Date.now() + SESSION_HOURS * 3600e3 }));
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}
export function readSession(token) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expect = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

/**
 * Loads the logged-in account for a portal and re-checks it in the database,
 * so a revoked admin is logged out immediately.
 * role: "admin" | "hod"
 */
export async function currentUser(req, role) {
  const s = readSession(getCookie(req, `${role}_session`));
  if (!s || s.role !== role) return null;
  const acct = await db(role === "admin" ? "admins" : "hods").get(s.email);
  if (!acct || acct.status !== "active") return null;
  if ((acct.sessionVersion || 0) !== (s.v || 0)) return null; // password changed -> old sessions invalid
  return acct;
}

export function publicAccount(a) {
  if (!a) return null;
  const { passwordHash, failedLogins, lockedUntil, sessionVersion, ...rest } = a;
  return rest;
}

// ---------- rate limiting ----------
/** Returns true if allowed. Fixed window counter stored in the DB. */
export async function rateLimit(key, max, windowSec) {
  const store = db("ratelimits");
  const now = Date.now();
  const rec = (await store.get(key)) || { count: 0, reset: now + windowSec * 1000 };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + windowSec * 1000; }
  rec.count += 1;
  await store.set(key, rec);
  return rec.count <= max;
}

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
