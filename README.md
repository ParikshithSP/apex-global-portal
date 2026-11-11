# Apex Global Search – User Site + HR Admin Portal + HOD Portal

> **Version 2 (Nov 2026):** new company name and logo, a premium international-style design with professional photography, a live job search on the home page, and a website **chat assistant** that collects leads into the HR Admin portal.

One Netlify project that hosts three separate sites. All three work on mobile and on laptops.

| Site | URL path | Who uses it | Login |
|---|---|---|---|
| **User site** (8 pages) | `/` | Public: clients and candidates | None |
| **HR Admin portal** | `/admin/` | HR employees | Sign up with email → 6-digit OTP → password, then **HOD approval**. Log in with email + password |
| **HOD portal** | `/hod/` | Heads of Department (internal only) | Sign up with email + password + confirm. Log in with email + password |

There are no links between the three sites. The admin and HOD pages are marked `noindex`, are blocked in `robots.txt`, and are never cached. Every admin and HOD API checks for a valid session on the server.

---

## 1. What is included

### User site (no login): 8 pages
1. **Home**
2. **About Us**: story, vision, mission, philosophy, core values
3. **Services**: Permanent Recruitment, Contract Staffing, Executive Search & Specialized Hiring, and RPO (anchor links from the menu)
4. **Industries We Serve**: 8 industries
5. **Why Choose Us**
6. **Careers / Current Openings**: live job list from the database, with search and filters by domain and type. A job detail modal holds the **online application** (resume upload as PDF/DOC/DOCX up to 2 MB, plus a consent checkbox)
7. **Contact Us**: inquiry form with the types from the content doc, plus a "Privacy request" type
8. **Privacy Policy**

All page text comes from the supplied content document.

### Website chat assistant (on every public page)
- Floating **Chat with us** button (bottom-right). It opens a full-screen chat on mobile and shows a short greeting the first time someone visits.
- **Find a job:** lists live openings from the database by domain or keyword, with links straight to the job's apply form.
- **Hire talent:** asks the hiring type (Permanent / Contract / Executive search / RPO), then name, company, email, phone (optional) and requirement, plus privacy consent. The lead is saved as an **Inquiry** in the HR Admin portal, tagged **💬 Chatbot**.
- **Candidate profile** and **Talk to our team** leads work the same way.
- Answers common questions: services, industries, how to apply, application status, why choose us, privacy. Free-text questions are matched by keyword.
- It is built in, so there is no third-party service, no monthly cost and no tracking. The text is in `public/assets/js/chatbot.js` (the `KB` section).

### Design and branding (v2)
- New logo (`public/assets/img/logo.png`, transparent). It is shown on white in the header, on a white badge in dark areas (footer, portals), and as the favicon.
- Name changed to **Apex Global Search** across the site, portals and emails. The navy and teal theme is unchanged.
- Professional people and technology photos in a split hero with a framed photo, employer and job-seeker path cards, photo tiles for services and industries, and full-width photo bands.
- A job search box on the home page (keyword + domain) leads to the filtered Careers list. The home page also shows the latest 3 openings.
- Photos are free **Unsplash** photos (Unsplash License: free for commercial use, no attribution needed), loaded from Unsplash's image CDN. To use the client's own photos, copy them to `public/assets/img/photos/` and change the `PHOTOS` list in `tools/build_site.py`, then run `python3 tools/build_site.py`.

### HR Admin portal (HR staff only, showing only the data HR needs)
- **Sign-up:** email → **Send OTP** → enter the 6-digit OTP (paste supported, resend after 60 s, expires in 10 min, max 5 tries) → full name + **create password + confirm password** → request goes to the HOD for approval → after approval, log in → **Home**
- **Login:** email + password → **Home**
- **Forgot password:** email → OTP → new password
- **Home dashboard:** new applications, applications this week, open jobs, open inquiries, pipeline chart, applications by domain, recent applications and inquiries
- **Applications:** search and filter, candidate detail, resume download, status pipeline (New → Screening → Shortlisted → Interview → Offered → Hired / Rejected / On Hold), notes and history, CSV export, and "delete candidate data" for privacy requests
- **Job openings:** create, edit, publish, close and delete. Open jobs appear on the Careers page instantly. An internal client name is kept private
- **Inquiries:** search and filter (including by source: Contact form or Chatbot), status, assign to me, internal notes, reply by email, CSV export
- **My profile:** edit your details and change your password

### HOD portal (internal)
- **Sign-up:** email + create password + confirm password (name is optional) → **Home**
- **Login:** email + password → **Home**
- **Home:** pending admin requests with one-click **Approve / Reject**, key numbers, recent activity
- **Admin requests**, plus **HR Admin accounts**, where you can approve, reject, **disable** (logs the person out immediately) or re-enable
- **Activity log:** sign-ups, approvals, logins, job changes, resume downloads, and more, with CSV export
- **HOD members** and **My profile**
- A placeholder card is reserved for the HOD modules you will define later

### Security built in
- Passwords are hashed with scrypt. Passwords must have 8+ characters with upper case, lower case, a number and a symbol
- OTPs are stored only as an HMAC hash, can be used once, expire, have an attempt limit and a resend cooldown
- Sessions use signed **httpOnly, Secure, SameSite=Strict** cookies, kept separate for admin and HOD (a HOD cookie cannot open admin APIs)
- An account locks for 15 minutes after 5 wrong passwords. Sign-up, OTP and form requests are rate-limited
- Cross-origin POSTs are blocked. Security headers include CSP, HSTS and X-Frame-Options
- Pending, rejected and disabled admins cannot log in. A password change ends old sessions
- Optional company-domain restriction for sign-ups, and an optional HOD access code

---

## 2. Deploy to Netlify (gives you the showcase URL)

The database is **Netlify Blobs**, which is built into Netlify. You don't need a separate database account.

### Option A: Netlify CLI (fastest, about 5 minutes)
```bash
npm install                 # installs @netlify/blobs and nodemailer
npx netlify-cli login       # opens the browser to sign in to Netlify
npx netlify-cli sites:create --name apexglobal-demo   # creates the project and links this folder (name must be unique)
npx netlify-cli env:set SESSION_SECRET "$(openssl rand -hex 32)"   # Windows: use any long random string instead
npx netlify-cli deploy --prod
```
You get a URL like `https://apexglobal-demo.netlify.app`:
- User site: `https://apexglobal-demo.netlify.app/`
- HR Admin: `https://apexglobal-demo.netlify.app/admin/`
- HOD: `https://apexglobal-demo.netlify.app/hod/`

### Option B: GitHub + Netlify dashboard
1. Push this folder to a GitHub repository.
2. In Netlify, go to **Add new project → Import an existing project → GitHub** and pick the repo. The build settings are read from `netlify.toml`, so leave them as they are.
3. Under **Project configuration → Environment variables**, add `SESSION_SECRET` (any long random string).
4. Deploy. Every later `git push` redeploys automatically.

> Drag-and-drop ("Netlify Drop") does **not** work for this project, because it doesn't deploy serverless functions. Use Option A or B.

### Showcase walkthrough (after deploy)
1. Open `/hod/` → **Sign up** as a HOD.
2. In a second browser or incognito window, open `/admin/` → **Sign up** → enter an email → **Send OTP** → enter the code → set a password. The screen shows *Waiting for HOD approval*.
3. Back in the HOD portal, click **Approve**.
4. Log in to the HR Admin portal → **Home**.
5. On the public site, apply to a job and send a contact inquiry. Both appear in the admin portal right away.

---

## 3. Email for OTPs

If no email service is configured, the portal runs in **demo mode**: a yellow banner appears and the OTP is shown on screen. This is convenient for an internal showcase. To send real emails, set **one** of these in Netlify environment variables:

| Provider | Variables |
|---|---|
| Office 365 | `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` |
| Gmail / Google Workspace | `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS` (an App Password), `MAIL_FROM` |
| Resend | `RESEND_API_KEY`, `MAIL_FROM` (from a verified domain) |

After you change variables, redeploy. Once email is set, demo mode turns off automatically. HODs are also emailed when a new admin request arrives, and admins are emailed when they are approved or rejected.

All variables are listed in `.env.example`. These are recommended for production:
- `ADMIN_ALLOWED_DOMAINS=yourcompany.com` and `HOD_ALLOWED_DOMAINS=yourcompany.com`
- `HOD_SIGNUP_CODE=<shared secret>`, so that only people you give the code to can create HOD accounts
- `SEED_DEMO_DATA=0`, to skip creating the 5 sample job openings

---

## 4. Run and test locally (no Netlify account needed)
```bash
npm install
npm start          # http://localhost:8888  (/admin/ and /hod/); data is saved in .data/
npm test           # 26 automated end-to-end API tests
```
To edit the text of the public pages, change `tools/build_site.py` and run `python3 tools/build_site.py`.

## 5. Project structure
```
public/                     static files (Netlify publish dir)
  index.html … privacy.html   8 user-site pages (generated by tools/build_site.py)
  assets/                     site CSS/JS, logo, favicons, chatbot (js/chatbot.js, css/chatbot.css)
  admin/                      HR Admin portal (index.html = login/sign-up, app.html = home)
  hod/                        HOD portal      (index.html = login/sign-up, app.html = home)
  portal-kit/                 shared portal UI (CSS + helpers)
netlify/functions/
  public-api.mjs              /api/public/*  jobs, apply, contact
  admin-api.mjs               /api/admin/*   OTP sign-up, login, dashboard, jobs, applications, inquiries
  hod-api.mjs                 /api/hod/*     sign-up, login, approvals, activity log
  lib/                        store (Netlify Blobs), auth, mail, seed data
tests/e2e.test.mjs          API test suite
tools/dev-server.mjs        local server
netlify.toml                routing, security headers
```

## 6. Before going live (from the content document)
- Confirm the full legal company name, business address and privacy contact email, then fill the `[insert …]` placeholders in the Privacy Policy (`tools/build_site.py`).
- Confirm which forms and platforms collect personal data, whether analytics or cookies are used, and the jurisdictions that apply.
- Set retention periods for resumes and inquiries. The admin portal already supports deleting a candidate's data on request.
- Have qualified legal or privacy counsel review the policy.
- Optional: use separate custom domains, for example `careers.yourdomain.com` for the public site and `hr.yourdomain.com/admin/`. All three sites keep sharing one secure backend.
