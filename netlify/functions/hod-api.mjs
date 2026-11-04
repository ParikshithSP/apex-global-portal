// HOD portal API (internal only).
// Sign-up: email + password + confirm -> Home.   Login: email + password -> Home.
// HODs approve / reject / disable HR Admin accounts and can see an activity log.
import { db, listAll, audit } from "./lib/store.mjs";
import { ok, fail, body, route, clientIp, sameOrigin } from "./lib/http.mjs";
import {
  normEmail, isEmail, domainAllowed, passwordProblem, hashPassword, verifyPassword,
  currentUser, publicAccount, rateLimit,
} from "./lib/auth.mjs";
import { sendMail, demoMode } from "./lib/mail.mjs";
import { login, logout, startSession } from "./lib/accounts.mjs";

const clean = (v, max = 500) => String(v ?? "").trim().slice(0, max);

async function signup(b, ip) {
  if (!(await rateLimit(`hod-signup:${ip}`, 10, 3600))) return fail(429, "Too many attempts. Try again later.");
  const email = normEmail(b.email);
  if (!isEmail(email)) return fail(400, "Enter a valid email address.");
  if (!domainAllowed(email, "HOD_ALLOWED_DOMAINS")) return fail(403, "Please use your company email address.");
  // Optional extra gate: if HOD_SIGNUP_CODE is set, it must be supplied (shared internally only).
  if (process.env.HOD_SIGNUP_CODE && b.code !== process.env.HOD_SIGNUP_CODE) return fail(403, "Invalid HOD access code.");
  if (await db("hods").get(email)) return fail(409, "This email is already registered. Please log in.");
  const pw = String(b.password || "");
  if (pw !== String(b.confirm || "")) return fail(400, "Passwords do not match.");
  const p = passwordProblem(pw); if (p) return fail(400, p);

  const now = new Date().toISOString();
  const acct = { email, name: clean(b.name, 100) || email.split("@")[0], department: clean(b.department, 80),
    passwordHash: hashPassword(pw), status: "active", createdAt: now, updatedAt: now, sessionVersion: 0 };
  await db("hods").set(email, acct);
  await audit(email, "hod.signup");
  return startSession("hod", acct);
}

async function decide(me, email, action, reason) {
  const store = db("admins");
  const a = await store.get(email);
  if (!a) return fail(404, "Admin not found.");
  const now = new Date().toISOString();
  const transitions = {
    approve: { from: ["pending", "rejected"], to: "active" },
    reject: { from: ["pending"], to: "rejected" },
    disable: { from: ["active"], to: "disabled" },
    enable: { from: ["disabled"], to: "active" },
  };
  const t = transitions[action];
  if (!t) return fail(400, "Unknown action.");
  if (!t.from.includes(a.status)) return fail(409, `Cannot ${action} an account that is ${a.status}.`);
  a.status = t.to;
  a.updatedAt = now;
  a.reviewedBy = me.email; a.reviewedAt = now; a.reviewNote = clean(reason, 300);
  if (action === "disable") a.sessionVersion = (a.sessionVersion || 0) + 1; // force logout
  await store.set(email, a);
  await audit(me.email, `admin.${action}`, `${a.name} <${email}>${reason ? ` – ${clean(reason, 300)}` : ""}`);

  if (!demoMode() && (action === "approve" || action === "reject")) {
    const text = action === "approve"
      ? "Your HR Admin portal access has been approved. You can now log in."
      : `Your HR Admin portal access request was not approved.${reason ? ` Reason: ${clean(reason, 300)}` : ""}`;
    sendMail({ to: email, subject: `HR Admin access ${action === "approve" ? "approved" : "not approved"}`, text, html: `<p>${text}</p>` })
      .catch((e) => console.error("notify failed", e));
  }
  return ok({ admin: publicAccount(a) });
}

export default async (req, context) => {
  if (!sameOrigin(req)) return fail(403, "Bad origin.");
  const r = route(req, "/api/hod");
  const ip = clientIp(req, context);
  const M = req.method;

  try {
    if (M === "POST" && r === "/auth/signup") return await signup(await body(req), ip);
    if (M === "POST" && r === "/auth/login") return await login("hod", await body(req), ip);
    if (M === "POST" && r === "/auth/logout") return logout("hod");
    if (M === "GET" && r === "/auth/config") return ok({ codeRequired: Boolean(process.env.HOD_SIGNUP_CODE) });

    const me = await currentUser(req, "hod");
    if (!me) return fail(401, "Please log in.");
    if (M === "GET" && r === "/auth/me") return ok({ user: publicAccount(me) });

    if (M === "GET" && r === "/dashboard") {
      const [admins, apps, jobs, enq, log] = await Promise.all([
        listAll("admins"), listAll("applications"), listAll("jobs"), listAll("enquiries"), recentAudit(8)]);
      const count = (s) => admins.filter((a) => a.status === s).length;
      return ok({
        stats: {
          pendingAdmins: count("pending"), activeAdmins: count("active"), disabledAdmins: count("disabled"), rejectedAdmins: count("rejected"),
          openJobs: jobs.filter((j) => j.status === "open").length, totalApplications: apps.length,
          hired: apps.filter((a) => a.status === "Hired").length, openEnquiries: enq.filter((e) => e.status !== "Closed").length,
        },
        pending: admins.filter((a) => a.status === "pending").map(publicAccount),
        activity: log,
      });
    }
    if (M === "GET" && r === "/admins") {
      const admins = (await listAll("admins")).filter((a) => a.passwordHash)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicAccount);
      return ok({ admins });
    }
    const m = r.match(/^\/admins\/([^/]+)\/(approve|reject|disable|enable)$/);
    if (M === "POST" && m) return await decide(me, normEmail(decodeURIComponent(m[1])), m[2], (await body(req)).reason);

    if (M === "GET" && r === "/audit") return ok({ activity: await recentAudit(300) });

    if (M === "GET" && r === "/hods") {
      const hods = (await listAll("hods")).map(({ email, name, department, createdAt, lastLoginAt }) => ({ email, name, department, createdAt, lastLoginAt }));
      return ok({ hods });
    }

    if (r === "/profile" && M === "PUT") {
      const b = await body(req);
      me.name = clean(b.name, 100) || me.name; me.department = clean(b.department, 80);
      me.updatedAt = new Date().toISOString();
      await db("hods").set(me.email, me);
      return ok({ user: publicAccount(me) });
    }
    if (r === "/profile/password" && M === "POST") {
      const b = await body(req);
      if (!verifyPassword(b.current, me.passwordHash)) return fail(400, "Current password is incorrect.");
      if (b.password !== b.confirm) return fail(400, "Passwords do not match.");
      const p = passwordProblem(b.password); if (p) return fail(400, p);
      me.passwordHash = hashPassword(b.password);
      me.sessionVersion = (me.sessionVersion || 0) + 1;
      await db("hods").set(me.email, me);
      await audit(me.email, "hod.password_change");
      return startSession("hod", me);
    }
    return fail(404, "Not found.");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong. Please try again.");
  }
};

async function recentAudit(n) {
  const store = db("audit");
  const keys = (await store.list()).sort().reverse().slice(0, n);
  return (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean);
}

export const config = { path: ["/api/hod/*"] };
