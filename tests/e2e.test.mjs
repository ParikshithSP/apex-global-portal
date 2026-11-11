// End-to-end API test using a local file-backed store (no Netlify account needed).
// Run: npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const dir = path.resolve(".data-test");
fs.rmSync(dir, { recursive: true, force: true });
process.env.LOCAL_STORE = "1"; process.env.LOCAL_STORE_DIR = dir; process.env.SESSION_SECRET = "test-secret";

const pub = (await import("../netlify/functions/public-api.mjs")).default;
const admin = (await import("../netlify/functions/admin-api.mjs")).default;
const hod = (await import("../netlify/functions/hod-api.mjs")).default;

const jars = { admin: "", hod: "" };
async function call(fn, jar, method, p, data) {
  const req = new Request("http://localhost" + p, {
    method, headers: { "content-type": "application/json", cookie: jars[jar] || "" },
    body: data ? JSON.stringify(data) : undefined,
  });
  const res = await fn(req, { ip: "1.1.1.1" });
  const sc = res.headers.get("set-cookie"); if (sc && jar) jars[jar] = sc.split(";")[0];
  const ct = res.headers.get("content-type") || "";
  return { status: res.status, body: ct.includes("json") ? await res.json() : await res.arrayBuffer() };
}
let pass = 0; const t = async (name, f) => { await f(); pass++; console.log("  ✓", name); };

const PW = "Str0ng!Pass";
await t("public jobs seeded", async () => {
  const r = await call(pub, null, "GET", "/api/public/jobs");
  assert.equal(r.status, 200); assert.ok(r.body.jobs.length >= 5);
  globalThis.jobId = r.body.jobs[0].id;
});
await t("apply validation", async () => {
  const r = await call(pub, null, "POST", "/api/public/apply", { name: "A" });
  assert.equal(r.status, 400); assert.ok(r.body.errors.email);
});
await t("apply with resume", async () => {
  const r = await call(pub, null, "POST", "/api/public/apply", { jobId, name: "Ravi Kumar", email: "ravi@x.com", phone: "+91 9876543210",
    consent: true, resume: { name: "cv.pdf", type: "application/pdf", data: Buffer.from("%PDF-1.4 test").toString("base64") } });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.ok(r.body.reference);
});
await t("contact enquiry", async () => {
  const r = await call(pub, null, "POST", "/api/public/contact", { name: "Asha", email: "asha@corp.com", category: "Client hiring inquiry",
    company: "Corp", message: "Need 5 DV engineers", consent: true });
  assert.equal(r.status, 200, JSON.stringify(r.body));
});
await t("chatbot lead saved with source", async () => {
  const r = await call(pub, null, "POST", "/api/public/contact", { name: "Bot Lead", email: "lead@corp.com", category: "Client hiring inquiry",
    message: "Need 3 embedded engineers in Pune", consent: true, source: "Chatbot" });
  assert.equal(r.status, 200);
});
await t("admin APIs blocked without login", async () => {
  assert.equal((await call(admin, "admin", "GET", "/api/admin/applications")).status, 401);
});
let otp;
await t("admin signup: send OTP (demo mode returns code)", async () => {
  const r = await call(admin, "admin", "POST", "/api/admin/auth/send-otp", { email: "hr1@apex.com", purpose: "signup" });
  assert.equal(r.status, 200); assert.match(r.body.demoOtp, /^\d{6}$/); otp = r.body.demoOtp;
});
await t("resend cooldown enforced", async () => {
  const r = await call(admin, "admin", "POST", "/api/admin/auth/send-otp", { email: "hr1@apex.com" });
  assert.equal(r.status, 429);
});
await t("wrong OTP rejected", async () => {
  const wrong = otp === "000000" ? "111111" : "000000";
  const r = await call(admin, "admin", "POST", "/api/admin/auth/verify-otp", { email: "hr1@apex.com", otp: wrong });
  assert.equal(r.status, 400); assert.match(r.body.error, /attempt/);
});
let token;
await t("correct OTP verifies", async () => {
  const r = await call(admin, "admin", "POST", "/api/admin/auth/verify-otp", { email: "hr1@apex.com", otp });
  assert.equal(r.status, 200); token = r.body.token;
});
await t("OTP is single-use", async () => {
  const r = await call(admin, "admin", "POST", "/api/admin/auth/verify-otp", { email: "hr1@apex.com", otp });
  assert.equal(r.status, 400);
});
await t("password mismatch + weak password rejected", async () => {
  assert.equal((await call(admin, "admin", "POST", "/api/admin/auth/set-password", { token, name: "HR One", password: PW, confirm: PW + "x" })).status, 400);
  assert.equal((await call(admin, "admin", "POST", "/api/admin/auth/set-password", { token, name: "HR One", password: "weak", confirm: "weak" })).status, 400);
});
await t("set password -> pending HOD approval", async () => {
  const r = await call(admin, "admin", "POST", "/api/admin/auth/set-password", { token, name: "HR One", password: PW, confirm: PW });
  assert.equal(r.status, 200); assert.equal(r.body.status, "pending");
});
await t("pending admin cannot log in", async () => {
  const r = await call(admin, "admin", "POST", "/api/admin/auth/login", { email: "hr1@apex.com", password: PW });
  assert.equal(r.status, 403); assert.equal(r.body.status, "pending");
});
await t("HOD signup -> logged in", async () => {
  const r = await call(hod, "hod", "POST", "/api/hod/auth/signup", { email: "hod@apex.com", name: "Head", password: PW, confirm: PW });
  assert.equal(r.status, 200); assert.ok(jars.hod.startsWith("hod_session="));
});
await t("HOD cookie does not work on admin API", async () => {
  const r = await admin(new Request("http://localhost/api/admin/dashboard", { headers: { cookie: jars.hod } }), {});
  assert.equal(r.status, 401);
});
await t("HOD sees + approves pending admin", async () => {
  const d = await call(hod, "hod", "GET", "/api/hod/dashboard");
  assert.equal(d.body.stats.pendingAdmins, 1);
  const r = await call(hod, "hod", "POST", "/api/hod/admins/hr1%40apex.com/approve", {});
  assert.equal(r.status, 200); assert.equal(r.body.admin.status, "active");
});
await t("approved admin logs in, wrong pw rejected", async () => {
  assert.equal((await call(admin, "admin", "POST", "/api/admin/auth/login", { email: "hr1@apex.com", password: "nope" })).status, 401);
  const r = await call(admin, "admin", "POST", "/api/admin/auth/login", { email: "HR1@apex.com", password: PW });
  assert.equal(r.status, 200);
});
await t("admin dashboard + applications + resume download", async () => {
  const d = await call(admin, "admin", "GET", "/api/admin/dashboard");
  assert.equal(d.body.stats.totalApplications, 1);
  const a = await call(admin, "admin", "GET", "/api/admin/applications");
  const id = a.body.applications[0].id;
  const p = await call(admin, "admin", "PATCH", `/api/admin/applications/${id}`, { status: "Shortlisted", note: "Good DV profile" });
  assert.equal(p.body.application.status, "Shortlisted"); assert.equal(p.body.application.notes.length, 2);
  const f = await call(admin, "admin", "GET", `/api/admin/applications/${id}/resume`);
  assert.equal(Buffer.from(f.body).toString(), "%PDF-1.4 test");
});
await t("admin job CRUD reflects on public site", async () => {
  const c = await call(admin, "admin", "POST", "/api/admin/jobs", { title: "RTL Design Engineer", domain: "Semiconductor", type: "Contract", location: "Noida", description: "RTL design for SoC IPs." });
  assert.equal(c.status, 200);
  let pubJobs = (await call(pub, null, "GET", "/api/public/jobs")).body.jobs;
  assert.ok(pubJobs.some((j) => j.title === "RTL Design Engineer"));
  await call(admin, "admin", "PUT", `/api/admin/jobs/${c.body.job.id}`, { ...c.body.job, status: "closed" });
  pubJobs = (await call(pub, null, "GET", "/api/public/jobs")).body.jobs;
  assert.ok(!pubJobs.some((j) => j.title === "RTL Design Engineer"));
});
await t("enquiry status update", async () => {
  const e = await call(admin, "admin", "GET", "/api/admin/enquiries");
  assert.ok(e.body.enquiries.some((x) => x.source === "Chatbot"));
  assert.ok(e.body.enquiries.some((x) => x.source === "Contact form"));
  const r = await call(admin, "admin", "PATCH", `/api/admin/enquiries/${e.body.enquiries[0].id}`, { status: "In Progress", assignToMe: true });
  assert.equal(r.body.enquiry.status, "In Progress");
});
await t("HOD disables admin -> admin session revoked", async () => {
  await call(hod, "hod", "POST", "/api/hod/admins/hr1%40apex.com/disable", { reason: "Left company" });
  assert.equal((await call(admin, "admin", "GET", "/api/admin/dashboard")).status, 401);
});
await t("forgot password via OTP", async () => {
  await call(hod, "hod", "POST", "/api/hod/admins/hr1%40apex.com/enable", {});
  fs.rmSync(path.join(dir, "otps"), { recursive: true, force: true });
  const s = await call(admin, "admin", "POST", "/api/admin/auth/send-otp", { email: "hr1@apex.com", purpose: "reset" });
  const v = await call(admin, "admin", "POST", "/api/admin/auth/verify-otp", { email: "hr1@apex.com", otp: s.body.demoOtp, purpose: "reset" });
  const NEW = "N3w!Passw0rd";
  const r = await call(admin, "admin", "POST", "/api/admin/auth/set-password", { token: v.body.token, password: NEW, confirm: NEW });
  assert.equal(r.body.reset, true);
  assert.equal((await call(admin, "admin", "POST", "/api/admin/auth/login", { email: "hr1@apex.com", password: NEW })).status, 200);
});
await t("account lockout after 5 failed logins", async () => {
  for (let i = 0; i < 5; i++) await call(admin, null, "POST", "/api/admin/auth/login", { email: "hr1@apex.com", password: "bad" });
  assert.equal((await call(admin, null, "POST", "/api/admin/auth/login", { email: "hr1@apex.com", password: "N3w!Passw0rd" })).status, 423);
});
await t("HOD audit log records actions", async () => {
  const r = await call(hod, "hod", "GET", "/api/hod/audit");
  assert.ok(r.body.activity.some((a) => a.action === "admin.approve"));
});
await t("cross-origin POST blocked", async () => {
  const r = await admin(new Request("http://localhost/api/admin/auth/login", { method: "POST", headers: { origin: "https://evil.com" }, body: "{}" }), {});
  assert.equal(r.status, 403);
});
fs.rmSync(dir, { recursive: true, force: true });
console.log(`\nAll ${pass} tests passed.`);
