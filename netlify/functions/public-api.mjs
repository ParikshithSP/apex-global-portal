// Public API used by the User site. No login. Read-only access to open jobs,
// write-only access for job applications and contact enquiries.
import { db, listAll, newId } from "./lib/store.mjs";
import { ok, fail, body, route, clientIp, sameOrigin } from "./lib/http.mjs";
import { normEmail, isEmail, rateLimit } from "./lib/auth.mjs";
import { ensureSeed } from "./lib/seed.mjs";

const MAX_RESUME_BYTES = 2 * 1024 * 1024;
const RESUME_TYPES = ["application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const clean = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const CATEGORIES = [
  "Client hiring inquiry", "Staffing & workforce solutions", "Candidate & career inquiry",
  "General business inquiry", "Privacy request",
];
const isPhone = (p) => /^[+\d][\d\s-]{6,18}$/.test(p);

const publicJob = ({ createdBy, ...j }) => j;

export default async (req, context) => {
  if (!sameOrigin(req)) return fail(403, "Bad origin.");
  const r = route(req, "/api/public");
  const ip = clientIp(req, context);

  try {
    if (req.method === "GET" && r === "/jobs") {
      await ensureSeed();
      const jobs = (await listAll("jobs")).filter((j) => j.status === "open")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicJob);
      return ok({ jobs });
    }
    if (req.method === "GET" && r.startsWith("/jobs/")) {
      const job = await db("jobs").get(r.slice(6));
      if (!job || job.status !== "open") return fail(404, "This job is no longer open.");
      return ok({ job: publicJob(job) });
    }
    if (req.method === "POST" && r === "/apply") {
      const b = await body(req);
      if (b.website) return ok({ id: "ignored" }); // honeypot for bots
      if (!(await rateLimit(`apply:${ip}`, 10, 3600))) return fail(429, "Too many submissions. Please try later.");

      const app = {
        name: clean(b.name, 100), email: normEmail(b.email), phone: clean(b.phone, 20),
        jobId: clean(b.jobId, 60), experience: clean(b.experience, 40), currentCompany: clean(b.currentCompany, 120),
        noticePeriod: clean(b.noticePeriod, 40), location: clean(b.location, 80),
        linkedin: clean(b.linkedin, 200), coverLetter: clean(b.coverLetter, 3000),
      };
      const errors = {};
      if (app.name.length < 2) errors.name = "Enter your full name.";
      if (!isEmail(app.email)) errors.email = "Enter a valid email.";
      if (!isPhone(app.phone)) errors.phone = "Enter a valid phone number.";
      if (!b.consent) errors.consent = "Please accept the consent to proceed.";
      const job = app.jobId ? await db("jobs").get(app.jobId) : null;
      if (!job || job.status !== "open") errors.jobId = "Select an open position.";

      let resume = null;
      if (b.resume?.data) {
        const buf = Buffer.from(String(b.resume.data), "base64");
        if (buf.length > MAX_RESUME_BYTES) errors.resume = "Resume must be 2 MB or smaller.";
        else if (!RESUME_TYPES.includes(b.resume.type)) errors.resume = "Resume must be PDF or Word.";
        else resume = { name: clean(b.resume.name, 120), type: b.resume.type, size: buf.length, data: buf.toString("base64") };
      } else errors.resume = "Please attach your resume.";
      if (Object.keys(errors).length) return fail(400, "Please fix the highlighted fields.", { errors });

      const id = newId("app_");
      if (resume) await db("files").set(`resume_${id}`, resume);
      const now = new Date().toISOString();
      await db("applications").set(id, {
        id, ...app, jobTitle: job.title, department: job.department,
        resume: resume ? { name: resume.name, type: resume.type, size: resume.size } : null,
        status: "New", notes: [], createdAt: now, updatedAt: now,
      });
      return ok({ id, reference: id.slice(-8).toUpperCase() });
    }

    if (req.method === "POST" && r === "/contact") {
      const b = await body(req);
      if (b.website) return ok({ id: "ignored" });
      if (!(await rateLimit(`contact:${ip}`, 10, 3600))) return fail(429, "Too many submissions. Please try later.");
      const e = {
        name: clean(b.name, 100), email: normEmail(b.email), phone: clean(b.phone, 20),
        category: CATEGORIES.includes(b.category) ? b.category : "General business inquiry",
        company: clean(b.company, 150), jobTitle: clean(b.jobTitle, 100),
        subject: clean(b.subject, 150), message: clean(b.message, 3000),
        source: b.source === "Chatbot" ? "Chatbot" : "Contact form",
      };
      const errors = {};
      if (e.name.length < 2) errors.name = "Enter your name.";
      if (!isEmail(e.email)) errors.email = "Enter a valid email.";
      if (e.phone && !isPhone(e.phone)) errors.phone = "Enter a valid phone number.";
      if (!b.consent) errors.consent = "Please accept the privacy notice to proceed.";
      if (e.message.length < 10) errors.message = "Message should be at least 10 characters.";
      if (Object.keys(errors).length) return fail(400, "Please fix the highlighted fields.", { errors });
      const id = newId("enq_");
      const now = new Date().toISOString();
      await db("enquiries").set(id, { id, ...e, status: "Open", createdAt: now, updatedAt: now });
      return ok({ id, reference: id.slice(-8).toUpperCase() });
    }

    return fail(404, "Not found.");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong. Please try again.");
  }
};

export const config = { path: "/api/public/*" };
