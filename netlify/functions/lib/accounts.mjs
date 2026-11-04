// Login/logout/me shared by the Admin and HOD portals.
import { db, audit } from "./store.mjs";
import { ok, fail, setCookie } from "./http.mjs";
import {
  normEmail, verifyPassword, signSession, publicAccount, rateLimit,
  MAX_FAILED_LOGINS, LOCK_MINUTES, SESSION_HOURS,
} from "./auth.mjs";

const STATUS_MSG = {
  pending: "Your account is waiting for HOD approval. You can log in once it is approved.",
  rejected: "Your sign-up request was not approved. Please contact your HOD.",
  disabled: "Your account has been disabled. Please contact your HOD.",
};

export async function login(role, b, ip) {
  const email = normEmail(b.email);
  const password = String(b.password || "");
  if (!email || !password) return fail(400, "Enter your email and password.");
  if (!(await rateLimit(`login:${role}:${ip}`, 30, 900))) return fail(429, "Too many attempts. Try again in 15 minutes.");

  const store = db(role === "admin" ? "admins" : "hods");
  const acct = await store.get(email);
  const generic = "Incorrect email or password.";
  if (!acct || !acct.passwordHash) return fail(401, generic);

  if (acct.lockedUntil && acct.lockedUntil > Date.now()) {
    const mins = Math.ceil((acct.lockedUntil - Date.now()) / 60000);
    return fail(423, `Account locked after too many failed attempts. Try again in ${mins} minute(s).`);
  }
  if (!verifyPassword(password, acct.passwordHash)) {
    acct.failedLogins = (acct.failedLogins || 0) + 1;
    if (acct.failedLogins >= MAX_FAILED_LOGINS) {
      acct.lockedUntil = Date.now() + LOCK_MINUTES * 60000;
      acct.failedLogins = 0;
      await audit(email, `${role}.locked`, "Too many failed logins");
    }
    await store.set(email, acct);
    return fail(401, generic);
  }
  if (acct.status !== "active") return fail(403, STATUS_MSG[acct.status] || "Account not active.", { status: acct.status });

  acct.failedLogins = 0;
  acct.lockedUntil = null;
  acct.lastLoginAt = new Date().toISOString();
  await store.set(email, acct);
  await audit(email, `${role}.login`);
  return startSession(role, acct);
}

export function startSession(role, acct, extra = {}) {
  const token = signSession({ role, email: acct.email, v: acct.sessionVersion || 0 });
  return ok({ user: publicAccount(acct), ...extra }, { "set-cookie": setCookie(`${role}_session`, token, SESSION_HOURS * 3600) });
}

export function logout(role) {
  return ok({}, { "set-cookie": setCookie(`${role}_session`, "", 0) });
}
