// HR Admin portal API.
// Sign-up:  email -> 6-digit OTP to email -> verify -> name + password + confirm -> HOD approval -> login -> Home
// Login:    email + password -> Home
// Forgot:   email -> OTP -> verify -> new password
import crypto from "node:crypto";
import { db, listAll, newId, audit } from "./lib/store.mjs";
import { ok, fail, body, route, clientIp, sameOrigin } from "./lib/http.mjs";
import {
  normEmail, isEmail, domainAllowed, passwordProblem, hashPassword, verifyPassword,
  genOtp, hashOtp, OTP_TTL_MIN, signSession, readSession, currentUser, publicAccount, rateLimit,
} from "./lib/auth.mjs";
import { sendMail, otpEmail, demoMode } from "./lib/mail.mjs";
import { login, logout, startSession } from "./lib/accounts.mjs";
import { ensureSeed } from "./lib/seed.mjs";

const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SEC = 60;
const needApproval = () => process.env.REQUIRE_HOD_APPROVAL !== "0";
const clean = (v, max = 500) => String(v ?? "").trim().slice(0, max);

const APP_STATUSES = ["New", "Screening", "Shortlisted", "Interview", "Offered", "Hired", "Rejected", "On Hold"];
const ENQ_STATUSES = ["Open", "In Progress", "Closed"];
const JOB_TYPES = ["Permanent", "Contract", "Contract-to-hire", "Executive Search", "RPO"];
const DOMAINS = ["Semiconductor", "IT", "Engineering"];

async function notifyHods(subject, text) {
  if (demoMode()) return;
  const hods = (await listAll("hods")).filter((h) => h.status === "active");
  await Promise.allSettled(hods.map((h) => sendMail({ to: h.email, subject, text, html: `<p>${text}</p>` })));
}

// ---------------- auth ----------------
async function sendOtp(b, ip) {
  const email = normEmail(b.email);
  const purpose = b.purpose === "reset" ? "reset" : "signup";
  if (!isEmail(email)) return fail(400, "Enter a valid email address.");
  if (!domainAllowed(email, "ADMIN_ALLOWED_DOMAINS")) return fail(403, "Please use your company email address.");
  if (!(await rateLimit(`otp-ip:${ip}`, 20, 3600))) return fail(429, "Too many requests. Try again later.");

  const existing = await db("admins").get(email);
  if (purpose === "signup" && existing?.passwordHash) {
    const msg = existing.status === "pending" ? "This email is already registered and waiting for HOD approval."
      : "This email is already registered. Please log in.";
    return fail(409, msg, { status: existing.status });
  }
  if (purpose === "reset" && (!existing || !existing.passwordHash)) {
    // Do not reveal which emails exist.
    return ok({ sent: true, expiresInMin: OTP_TTL_MIN });
  }

  const key = `${purpose}:${email}`;
  const prev = await db("otps").get(key);
  if (prev && Date.now() - prev.sentAt < OTP_RESEND_SEC * 1000) {
    const wait = Math.ceil((OTP_RESEND_SEC * 1000 - (Date.now() - prev.sentAt)) / 1000);
    return fail(429, `Please wait ${wait}s before requesting a new code.`, { retryAfter: wait });
  }
  if (!(await rateLimit(`otp-mail:${email}`, 5, 3600))) return fail(429, "Too many codes requested for this email. Try again in an hour.");

  const otp = genOtp();
  await db("otps").set(key, { hash: hashOtp(email, otp), exp: Date.now() + OTP_TTL_MIN * 60000, attempts: 0, sentAt: Date.now() });
  try {
    await sendMail({ to: email, ...otpEmail(otp, purpose, OTP_TTL_MIN) });
  } catch (e) {
    console.error("OTP mail failed", e);
    return fail(502, "Could not send the email. Please check the address or try again later.");
  }
  const res = { sent: true, expiresInMin: OTP_TTL_MIN, resendInSec: OTP_RESEND_SEC };
  if (demoMode()) res.demoOtp = otp; // showcase only: email not configured
  return ok(res);
}

async function verifyOtp(b) {
  const email = normEmail(b.email);
  const purpose = b.purpose === "reset" ? "reset" : "signup";
  const otp = String(b.otp || "").trim();
  if (!/^\d{6}$/.test(otp)) return fail(400, "Enter the 6-digit code.");
  const key = `${purpose}:${email}`;
  const rec = await db("otps").get(key);
  if (!rec) return fail(400, "No active code. Please request a new one.");
  if (Date.now() > rec.exp) { await db("otps").del(key); return fail(400, "This code has expired. Please request a new one."); }
  if (rec.attempts >= OTP_MAX_ATTEMPTS) { await db("otps").del(key); return fail(429, "Too many wrong attempts. Please request a new code."); }

  const good = crypto.timingSafeEqual(Buffer.from(rec.hash), Buffer.from(hashOtp(email, otp)));
  if (!good) {
    rec.attempts += 1;
    await db("otps").set(key, rec);
    const left = OTP_MAX_ATTEMPTS - rec.attempts;
    return fail(400, left > 0 ? `Incorrect code. ${left} attempt(s) left.` : "Too many wrong attempts. Please request a new code.");
  }
  await db("otps").del(key);
  // Short-lived proof that this email was verified; required to set the password.
  const token = signSession({ role: "otp", purpose, email, exp2: Date.now() + 15 * 60000 });
  return ok({ verified: true, token });
}

async function setPassword(b) {
  const s = readSession(b.token);
  if (!s || s.role !== "otp" || s.exp2 < Date.now()) return fail(400, "Your verification has expired. Please start again.");
  const { email, purpose } = s;
  const pw = String(b.password || "");
  if (pw !== String(b.confirm || "")) return fail(400, "Passwords do not match.");
  const problem = passwordProblem(pw);
  if (problem) return fail(400, problem);

  const store = db("admins");
  const now = new Date().toISOString();
  const existing = await store.get(email);

  if (purpose === "reset") {
    if (!existing) return fail(400, "Account not found.");
    existing.passwordHash = hashPassword(pw);
    existing.sessionVersion = (existing.sessionVersion || 0) + 1;
    existing.failedLogins = 0; existing.lockedUntil = null; existing.updatedAt = now;
    await store.set(email, existing);
    await audit(email, "admin.password_reset");
    return ok({ reset: true });
  }

  if (existing?.passwordHash) return fail(409, "This email is already registered. Please log in.");
  const name = clean(b.name, 100);
  if (name.length < 2) return fail(400, "Enter your full name.");
  const acct = {
    email, name, employeeId: clean(b.employeeId, 30), designation: clean(b.designation, 80), phone: clean(b.phone, 20),
    passwordHash: hashPassword(pw), status: needApproval() ? "pending" : "active",
    createdAt: now, updatedAt: now, emailVerifiedAt: now, sessionVersion: 0,
  };
  await store.set(email, acct);
  await audit(email, "admin.signup", needApproval() ? "Awaiting HOD approval" : "Auto-approved");

  if (acct.status === "pending") {
    await notifyHods("New HR Admin access request", `${name} (${email}) has requested access to the HR Admin portal. Please review it in the HOD portal.`);
    return ok({ status: "pending", message: "Account created. Your HOD must approve it before you can log in." });
  }
  return startSession("admin", acct, { status: "active" });
}

// ---------------- app ----------------
function jobFrom(b, base = {}) {
  const j = {
    ...base,
    title: clean(b.title, 120), domain: DOMAINS.includes(b.domain) ? b.domain : "IT",
    type: JOB_TYPES.includes(b.type) ? b.type : "Permanent", location: clean(b.location, 100),
    experience: clean(b.experience, 40), skills: clean(b.skills, 300), description: clean(b.description, 4000),
    requirements: clean(b.requirements, 4000), client: clean(b.client, 120), positions: Math.max(1, Math.min(999, Number(b.positions) || 1)),
    status: b.status === "closed" ? "closed" : b.status === "draft" ? "draft" : "open",
  };
  if (j.title.length < 3) return { error: "Enter a job title." };
  if (!j.location) return { error: "Enter a location." };
  if (j.description.length < 10) return { error: "Enter a description." };
  return { job: j };
}

async function dashboard() {
  const [apps, jobs, enq] = await Promise.all([listAll("applications"), listAll("jobs"), listAll("enquiries")]);
  const by = (arr, k) => arr.reduce((m, x) => ((m[x[k]] = (m[x[k]] || 0) + 1), m), {});
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  return ok({
    stats: {
      openJobs: jobs.filter((j) => j.status === "open").length,
      totalApplications: apps.length,
      newApplications: apps.filter((a) => a.status === "New").length,
      applicationsThisWeek: apps.filter((a) => a.createdAt > weekAgo).length,
      openEnquiries: enq.filter((e) => e.status !== "Closed").length,
      hired: apps.filter((a) => a.status === "Hired").length,
    },
    applicationsByStatus: by(apps, "status"),
    applicationsByDomain: by(apps.map((a) => ({ d: jobs.find((j) => j.id === a.jobId)?.domain || "Other" })), "d"),
    recentApplications: apps.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    recentEnquiries: enq.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  });
}

export default async (req, context) => {
  if (!sameOrigin(req)) return fail(403, "Bad origin.");
  const r = route(req, "/api/admin");
  const ip = clientIp(req, context);
  const M = req.method;

  try {
    // ----- public auth endpoints -----
    if (M === "POST" && r === "/auth/send-otp") return await sendOtp(await body(req), ip);
    if (M === "POST" && r === "/auth/verify-otp") return await verifyOtp(await body(req));
    if (M === "POST" && r === "/auth/set-password") return await setPassword(await body(req));
    if (M === "POST" && r === "/auth/login") return await login("admin", await body(req), ip);
    if (M === "POST" && r === "/auth/logout") return logout("admin");
    if (M === "GET" && r === "/auth/config") return ok({ demoMode: demoMode(), approvalRequired: needApproval() });

    // ----- everything below needs an active, approved admin -----
    const me = await currentUser(req, "admin");
    if (!me) return fail(401, "Please log in.");
    if (M === "GET" && r === "/auth/me") return ok({ user: publicAccount(me) });

    if (M === "GET" && r === "/dashboard") { await ensureSeed(); return await dashboard(); }

    // Jobs
    if (r === "/jobs" && M === "GET") {
      await ensureSeed();
      const jobs = await listAll("jobs");
      const apps = await listAll("applications");
      for (const j of jobs) j.applicants = apps.filter((a) => a.jobId === j.id).length;
      return ok({ jobs: jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), types: JOB_TYPES, domains: DOMAINS });
    }
    if (r === "/jobs" && M === "POST") {
      const { job, error } = jobFrom(await body(req));
      if (error) return fail(400, error);
      const id = newId("job_"); const now = new Date().toISOString();
      const rec = { id, ...job, createdAt: now, updatedAt: now, createdBy: me.email };
      await db("jobs").set(id, rec);
      await audit(me.email, "job.create", job.title);
      return ok({ job: rec });
    }
    if (r.startsWith("/jobs/")) {
      const id = r.slice(6);
      const cur = await db("jobs").get(id);
      if (!cur) return fail(404, "Job not found.");
      if (M === "PUT") {
        const { job, error } = jobFrom(await body(req), cur);
        if (error) return fail(400, error);
        job.updatedAt = new Date().toISOString(); job.updatedBy = me.email;
        await db("jobs").set(id, job);
        await audit(me.email, "job.update", `${job.title} (${job.status})`);
        return ok({ job });
      }
      if (M === "DELETE") {
        await db("jobs").del(id);
        await audit(me.email, "job.delete", cur.title);
        return ok({});
      }
    }

    // Applications
    if (r === "/applications" && M === "GET") {
      const apps = (await listAll("applications")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return ok({ applications: apps, statuses: APP_STATUSES });
    }
    const resumeMatch = r.match(/^\/applications\/([\w-]+)\/resume$/);
    if (resumeMatch && M === "GET") {
      const f = await db("files").get(`resume_${resumeMatch[1]}`);
      if (!f) return fail(404, "Resume not found.");
      await audit(me.email, "application.resume_download", resumeMatch[1]);
      return new Response(Buffer.from(f.data, "base64"), {
        headers: {
          "content-type": f.type, "cache-control": "no-store",
          "content-disposition": `attachment; filename="${f.name.replace(/[^\w.\- ]/g, "_")}"`,
        },
      });
    }
    if (r.startsWith("/applications/") && M === "PATCH") {
      const id = r.slice(14);
      const a = await db("applications").get(id);
      if (!a) return fail(404, "Application not found.");
      const b = await body(req);
      if (b.status) {
        if (!APP_STATUSES.includes(b.status)) return fail(400, "Invalid status.");
        if (b.status !== a.status) a.notes.push({ at: new Date().toISOString(), by: me.name || me.email, text: `Status: ${a.status} → ${b.status}` });
        a.status = b.status;
      }
      if (b.note) a.notes.push({ at: new Date().toISOString(), by: me.name || me.email, text: clean(b.note, 1000) });
      a.updatedAt = new Date().toISOString();
      await db("applications").set(id, a);
      await audit(me.email, "application.update", `${a.name} → ${a.status}`);
      return ok({ application: a });
    }
    if (r.startsWith("/applications/") && M === "DELETE") {
      const id = r.slice(14);
      const a = await db("applications").get(id);
      if (!a) return fail(404, "Application not found.");
      await db("applications").del(id); await db("files").del(`resume_${id}`);
      await audit(me.email, "application.delete", `${a.name} (data deletion)`);
      return ok({});
    }

    // Enquiries
    if (r === "/enquiries" && M === "GET") {
      const enq = (await listAll("enquiries")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return ok({ enquiries: enq, statuses: ENQ_STATUSES });
    }
    if (r.startsWith("/enquiries/") && M === "PATCH") {
      const id = r.slice(11);
      const e = await db("enquiries").get(id);
      if (!e) return fail(404, "Enquiry not found.");
      const b = await body(req);
      if (b.status && ENQ_STATUSES.includes(b.status)) e.status = b.status;
      if (b.note) (e.notes ||= []).push({ at: new Date().toISOString(), by: me.name || me.email, text: clean(b.note, 1000) });
      e.assignedTo = b.assignToMe ? me.email : e.assignedTo;
      e.updatedAt = new Date().toISOString();
      await db("enquiries").set(id, e);
      await audit(me.email, "enquiry.update", `${e.name} → ${e.status}`);
      return ok({ enquiry: e });
    }

    // Profile
    if (r === "/profile" && M === "PUT") {
      const b = await body(req);
      me.name = clean(b.name, 100) || me.name; me.phone = clean(b.phone, 20); me.designation = clean(b.designation, 80);
      me.updatedAt = new Date().toISOString();
      await db("admins").set(me.email, me);
      return ok({ user: publicAccount(me) });
    }
    if (r === "/profile/password" && M === "POST") {
      const b = await body(req);
      if (!verifyPassword(b.current, me.passwordHash)) return fail(400, "Current password is incorrect.");
      if (b.password !== b.confirm) return fail(400, "Passwords do not match.");
      const p = passwordProblem(b.password); if (p) return fail(400, p);
      me.passwordHash = hashPassword(b.password);
      me.sessionVersion = (me.sessionVersion || 0) + 1;
      await db("admins").set(me.email, me);
      await audit(me.email, "admin.password_change");
      return startSession("admin", me);
    }

    return fail(404, "Not found.");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong. Please try again.");
  }
};

export const config = { path: ["/api/admin/*"] };
