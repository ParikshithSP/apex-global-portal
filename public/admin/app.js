// HR Admin home + modules: Home dashboard, Applications, Job openings, Inquiries, Profile.
(() => {
  const V = document.getElementById("view");
  const { esc, api, badge, date } = P;
  let me = null;
  const cache = {};

  P.shell();
  document.getElementById("logout").onclick = async () => { await api("/api/admin/auth/logout", { method: "POST" }).catch(() => {}); location.href = "/admin/"; };

  const guard = (err) => { if (err.status === 401) { location.href = "/admin/"; return true; } V.innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`; return false; };

  // ---------------- HOME ----------------
  async function home() {
    const d = await api("/api/admin/dashboard");
    const s = d.stats;
    setCount("cApps", s.newApplications); setCount("cEnq", s.openEnquiries);
    const max = Math.max(1, ...Object.values(d.applicationsByStatus));
    const statusBars = Object.entries(d.applicationsByStatus).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      `<div class="bar"><span>${esc(k)}</span><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div><strong>${v}</strong></div>`).join("");
    const domMax = Math.max(1, ...Object.values(d.applicationsByDomain));
    const domainBars = Object.entries(d.applicationsByDomain).map(([k, v]) =>
      `<div class="bar"><span>${esc(k)}</span><div class="track"><div class="fill" style="width:${(v / domMax) * 100}%"></div></div><strong>${v}</strong></div>`).join("");
    V.innerHTML = `
      <div class="page-head"><div><h1>Welcome, ${esc(me.name?.split(" ")[0] || "")} 👋</h1><p class="muted" style="margin:0">Here's what's happening in recruitment today.</p></div>
        <div class="actions"><a class="btn btn-primary" href="#openings/new">+ New opening</a></div></div>
      <div class="grid stats">
        <div class="card stat hl"><div class="v">${s.newApplications}</div><div class="l">New applications to review</div></div>
        <div class="card stat"><div class="v">${s.applicationsThisWeek}</div><div class="l">Applications this week</div></div>
        <div class="card stat"><div class="v">${s.openJobs}</div><div class="l">Open job openings</div></div>
        <div class="card stat"><div class="v">${s.openEnquiries}</div><div class="l">Open inquiries</div></div>
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card"><div class="page-head" style="margin-bottom:8px"><h2 style="margin:0">Recent applications</h2><a href="#applications">View all →</a></div>
          ${d.recentApplications.length ? `<div class="table-wrap"><table class="responsive"><thead><tr><th>Candidate</th><th>Role</th><th>Status</th><th>Applied</th></tr></thead><tbody>
          ${d.recentApplications.map((a) => `<tr class="clickable" data-app="${esc(a.id)}"><td data-label="Candidate"><strong>${esc(a.name)}</strong><div class="sub">${esc(a.email)}</div></td><td data-label="Role">${esc(a.jobTitle)}</td><td data-label="Status">${badge(a.status)}</td><td data-label="Applied">${date(a.createdAt)}</td></tr>`).join("")}
          </tbody></table></div>` : `<div class="empty">No applications yet. Share the Careers page to start receiving them.</div>`}</div>
        <div class="grid">
          <div class="card"><h2>Pipeline</h2><div class="bars">${statusBars || '<p class="muted">No data yet.</p>'}</div></div>
          <div class="card"><h2>By domain</h2><div class="bars">${domainBars || '<p class="muted">No data yet.</p>'}</div>
            <p class="small muted" style="margin:12px 0 0">Total applications: <strong>${s.totalApplications}</strong> · Hired: <strong>${s.hired}</strong></p></div>
        </div>
      </div>
      <div class="card" style="margin-top:16px"><div class="page-head" style="margin-bottom:8px"><h2 style="margin:0">Latest inquiries</h2><a href="#enquiries">View all →</a></div>
        ${d.recentEnquiries.length ? d.recentEnquiries.map((e) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)"><div><strong>${esc(e.name)}</strong> <span class="sub muted small">${esc(e.company || "")}</span><div class="small muted">${esc(e.category)} · ${date(e.createdAt)}</div></div>${badge(e.status)}</div>`).join("") : `<div class="empty">No inquiries yet.</div>`}</div>`;
    V.querySelectorAll("[data-app]").forEach((r) => r.onclick = () => (location.hash = `applications/${r.dataset.app}`));
  }
  function setCount(id, n) { const el = document.getElementById(id); el.hidden = !n; el.textContent = n; }

  // ---------------- APPLICATIONS ----------------
  async function applications(openId) {
    const d = await api("/api/admin/applications");
    cache.apps = d.applications; cache.appStatuses = d.statuses;
    const jobs = [...new Set(d.applications.map((a) => a.jobTitle))].sort();
    V.innerHTML = `
      <div class="page-head"><div><h1>Applications</h1><p class="muted" style="margin:0">Candidates who applied through the Careers page.</p></div>
        <button class="btn" id="export">⬇ Export CSV</button></div>
      <div class="toolbar"><input id="q" type="search" placeholder="Search name, email, phone, company…">
        <select id="fs"><option value="">All statuses</option>${d.statuses.map((s) => `<option>${s}</option>`).join("")}</select>
        <select id="fj"><option value="">All roles</option>${jobs.map((j) => `<option>${esc(j)}</option>`).join("")}</select></div>
      <div class="card" style="padding:0"><div class="table-wrap" id="tbl"></div></div>`;
    const q = V.querySelector("#q"), fs = V.querySelector("#fs"), fj = V.querySelector("#fj");
    const filtered = () => cache.apps.filter((a) => (!fs.value || a.status === fs.value) && (!fj.value || a.jobTitle === fj.value) &&
      (!q.value || [a.name, a.email, a.phone, a.currentCompany, a.location].join(" ").toLowerCase().includes(q.value.toLowerCase())));
    const draw = () => {
      const rows = filtered();
      V.querySelector("#tbl").innerHTML = rows.length ? `<table class="responsive"><thead><tr><th>Candidate</th><th>Role</th><th>Experience</th><th>Notice</th><th>Status</th><th>Applied</th></tr></thead><tbody>
        ${rows.map((a) => `<tr class="clickable" data-id="${esc(a.id)}"><td data-label="Candidate"><strong>${esc(a.name)}</strong><div class="sub">${esc(a.email)} · ${esc(a.phone)}</div></td>
        <td data-label="Role">${esc(a.jobTitle)}<div class="sub">${esc(a.department || "")}</div></td><td data-label="Experience">${esc(a.experience || "—")}</td>
        <td data-label="Notice">${esc(a.noticePeriod || "—")}</td><td data-label="Status">${badge(a.status)}</td><td data-label="Applied">${date(a.createdAt)}</td></tr>`).join("")}
        </tbody></table>` : `<div class="empty">No applications match.</div>`;
      V.querySelectorAll("tr[data-id]").forEach((r) => r.onclick = () => openApp(r.dataset.id));
    };
    [q, fs, fj].forEach((el) => el.oninput = draw); draw();
    V.querySelector("#export").onclick = () => P.csv(`applications-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Reference", "Name", "Email", "Phone", "Role", "Experience", "Current company", "Notice period", "Location", "LinkedIn", "Status", "Applied on"],
      ...filtered().map((a) => [a.id.slice(-8).toUpperCase(), a.name, a.email, a.phone, a.jobTitle, a.experience, a.currentCompany, a.noticePeriod, a.location, a.linkedin, a.status, a.createdAt])]);
    if (openId) openApp(openId);
  }
  function openApp(id) {
    const a = cache.apps.find((x) => x.id === id); if (!a) return;
    const d = P.drawer(`
      <h2 style="padding-right:40px">${esc(a.name)}</h2><div>${badge(a.status)} <span class="muted small">Ref ${esc(a.id.slice(-8).toUpperCase())}</span></div>
      <dl class="kv"><dt>Role</dt><dd>${esc(a.jobTitle)}</dd><dt>Email</dt><dd><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></dd>
      <dt>Phone</dt><dd><a href="tel:${esc(a.phone)}">${esc(a.phone)}</a></dd><dt>Experience</dt><dd>${esc(a.experience || "—")}</dd>
      <dt>Current company</dt><dd>${esc(a.currentCompany || "—")}</dd><dt>Notice period</dt><dd>${esc(a.noticePeriod || "—")}</dd>
      <dt>Location</dt><dd>${esc(a.location || "—")}</dd><dt>LinkedIn</dt><dd>${a.linkedin ? `<a href="${esc(a.linkedin)}" target="_blank" rel="noopener noreferrer">${esc(a.linkedin)}</a>` : "—"}</dd>
      <dt>Applied</dt><dd>${date(a.createdAt, true)}</dd></dl>
      ${a.resume ? `<a class="btn" href="/api/admin/applications/${esc(a.id)}/resume">⬇ Download resume (${esc(a.resume.name)})</a>` : ""}
      ${a.coverLetter ? `<h3 style="margin-top:18px">Cover note</h3><p style="white-space:pre-wrap">${esc(a.coverLetter)}</p>` : ""}
      <h3 style="margin-top:18px">Update status</h3>
      <form class="form" id="upd"><select name="status">${cache.appStatuses.map((s) => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}</select>
        <textarea name="note" placeholder="Add a note (interview feedback, next steps…)"></textarea>
        <button class="btn btn-primary">Save</button></form>
      <h3 style="margin-top:18px">History</h3>
      <ul class="timeline">${(a.notes || []).slice().reverse().map((n) => `<li><strong>${esc(n.by)}</strong> <span class="muted small">${date(n.at, true)}</span><div>${esc(n.text)}</div></li>`).join("") || '<li class="muted">No activity yet.</li>'}</ul>
      <hr style="border:0;border-top:1px solid var(--line);margin:22px 0">
      <button class="btn btn-danger btn-sm" id="del">Delete candidate data</button>
      <p class="small muted">Use for privacy deletion requests. This removes the application and resume permanently.</p>`);
    d.querySelector("#upd").onsubmit = async (e) => {
      e.preventDefault(); const btn = e.target.querySelector("button"); P.busy(btn, true);
      try {
        const r = await api(`/api/admin/applications/${a.id}`, { method: "PATCH", body: { status: e.target.status.value, note: e.target.note.value } });
        Object.assign(a, r.application); P.toast("Application updated"); d.close(); route();
      } catch (err) { P.toast(err.message); } finally { P.busy(btn, false); }
    };
    d.querySelector("#del").onclick = async () => {
      if (!confirm(`Permanently delete ${a.name}'s application and resume?`)) return;
      await api(`/api/admin/applications/${a.id}`, { method: "DELETE" }); P.toast("Deleted"); d.close(); location.hash = "applications"; route();
    };
  }

  // ---------------- JOB OPENINGS ----------------
  async function openings(sub) {
    const d = await api("/api/admin/jobs");
    cache.jobs = d.jobs; cache.types = d.types; cache.domains = d.domains;
    V.innerHTML = `
      <div class="page-head"><div><h1>Job openings</h1><p class="muted" style="margin:0">Open roles appear on the public Careers page instantly.</p></div>
        <button class="btn btn-primary" id="new">+ New opening</button></div>
      <div class="toolbar"><input id="q" type="search" placeholder="Search title, skill, client…">
        <select id="fs"><option value="">All statuses</option><option value="open">Open</option><option value="draft">Draft</option><option value="closed">Closed</option></select>
        <select id="fd"><option value="">All domains</option>${d.domains.map((x) => `<option>${x}</option>`).join("")}</select></div>
      <div class="card" style="padding:0"><div class="table-wrap" id="tbl"></div></div>`;
    const q = V.querySelector("#q"), fs = V.querySelector("#fs"), fd = V.querySelector("#fd");
    const draw = () => {
      const rows = cache.jobs.filter((j) => (!fs.value || j.status === fs.value) && (!fd.value || j.domain === fd.value) &&
        (!q.value || [j.title, j.skills, j.client, j.location].join(" ").toLowerCase().includes(q.value.toLowerCase())));
      V.querySelector("#tbl").innerHTML = rows.length ? `<table class="responsive"><thead><tr><th>Title</th><th>Domain / Type</th><th>Location</th><th>Applicants</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.map((j) => `<tr><td data-label="Title"><strong>${esc(j.title)}</strong><div class="sub">${esc(j.client ? `Client: ${j.client}` : j.experience || "")}</div></td>
        <td data-label="Domain">${esc(j.domain)}<div class="sub">${esc(j.type)}</div></td><td data-label="Location">${esc(j.location)}</td>
        <td data-label="Applicants">${j.applicants}</td><td data-label="Status">${badge(j.status)}</td>
        <td data-label="Actions"><div class="actions"><button class="btn btn-sm" data-edit="${esc(j.id)}">Edit</button>
        <button class="btn btn-sm" data-toggle="${esc(j.id)}">${j.status === "open" ? "Close" : "Publish"}</button></div></td></tr>`).join("")}
        </tbody></table>` : `<div class="empty">No openings yet.</div>`;
      V.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => jobForm(cache.jobs.find((j) => j.id === b.dataset.edit)));
      V.querySelectorAll("[data-toggle]").forEach((b) => b.onclick = async () => {
        const j = cache.jobs.find((x) => x.id === b.dataset.toggle);
        await api(`/api/admin/jobs/${j.id}`, { method: "PUT", body: { ...j, status: j.status === "open" ? "closed" : "open" } });
        P.toast(j.status === "open" ? "Opening closed" : "Opening published"); openings();
      });
    };
    [q, fs, fd].forEach((el) => el.oninput = draw); draw();
    V.querySelector("#new").onclick = () => jobForm();
    if (sub === "new") { history.replaceState(null, "", "#openings"); jobForm(); }
  }
  function jobForm(j = {}) {
    const opt = (arr, v) => arr.map((x) => `<option ${x === v ? "selected" : ""}>${x}</option>`).join("");
    const d = P.drawer(`
      <h2>${j.id ? "Edit opening" : "New opening"}</h2>
      <form class="form" id="jf">
        <div><label>Job title *</label><input name="title" value="${esc(j.title || "")}" required></div>
        <div class="row"><div><label>Domain</label><select name="domain">${opt(cache.domains, j.domain)}</select></div>
          <div><label>Employment type</label><select name="type">${opt(cache.types, j.type)}</select></div></div>
        <div class="row"><div><label>Location *</label><input name="location" value="${esc(j.location || "")}" required></div>
          <div><label>Experience</label><input name="experience" value="${esc(j.experience || "")}" placeholder="e.g. 3-6 years"></div></div>
        <div class="row"><div><label>Client <span class="muted">(internal, not shown publicly)</span></label><input name="client" value="${esc(j.client || "")}"></div>
          <div><label>No. of positions</label><input name="positions" type="number" min="1" value="${esc(j.positions || 1)}"></div></div>
        <div><label>Key skills</label><input name="skills" value="${esc(j.skills || "")}" placeholder="Comma separated"></div>
        <div><label>Description *</label><textarea name="description" required>${esc(j.description || "")}</textarea></div>
        <div><label>Requirements <span class="muted">(one per line)</span></label><textarea name="requirements">${esc(j.requirements || "")}</textarea></div>
        <div><label>Status</label><select name="status"><option value="open" ${j.status === "open" || !j.id ? "selected" : ""}>Open (visible on website)</option>
          <option value="draft" ${j.status === "draft" ? "selected" : ""}>Draft (hidden)</option><option value="closed" ${j.status === "closed" ? "selected" : ""}>Closed (hidden)</option></select></div>
        <div id="jm"></div>
        <div class="actions"><button class="btn btn-primary">${j.id ? "Save changes" : "Create opening"}</button>
          ${j.id ? `<button type="button" class="btn btn-danger" id="jdel">Delete</button>` : ""}</div>
      </form>`);
    d.querySelector("#jf").onsubmit = async (e) => {
      e.preventDefault(); const body = Object.fromEntries(new FormData(e.target)); const btn = e.target.querySelector(".btn-primary");
      P.busy(btn, true);
      try {
        await api(j.id ? `/api/admin/jobs/${j.id}` : "/api/admin/jobs", { method: j.id ? "PUT" : "POST", body });
        P.toast(j.id ? "Opening updated" : "Opening created"); d.close(); openings();
      } catch (err) { P.alert(d.querySelector("#jm"), "err", err.message); } finally { P.busy(btn, false); }
    };
    d.querySelector("#jdel")?.addEventListener("click", async () => {
      if (!confirm(`Delete "${j.title}"? Existing applications are kept.`)) return;
      await api(`/api/admin/jobs/${j.id}`, { method: "DELETE" }); P.toast("Deleted"); d.close(); openings();
    });
  }

  // ---------------- INQUIRIES ----------------
  async function enquiries() {
    const d = await api("/api/admin/enquiries");
    cache.enq = d.enquiries; cache.enqStatuses = d.statuses;
    const cats = [...new Set(d.enquiries.map((e) => e.category))];
    V.innerHTML = `
      <div class="page-head"><div><h1>Inquiries</h1><p class="muted" style="margin:0">Messages from the Contact Us page.</p></div><button class="btn" id="export">⬇ Export CSV</button></div>
      <div class="toolbar"><input id="q" type="search" placeholder="Search name, company, message…">
        <select id="fs"><option value="">All statuses</option>${d.statuses.map((s) => `<option>${s}</option>`).join("")}</select>
        <select id="fc"><option value="">All types</option>${cats.map((c) => `<option>${esc(c)}</option>`).join("")}</select></div>
      <div class="card" style="padding:0"><div class="table-wrap" id="tbl"></div></div>`;
    const q = V.querySelector("#q"), fs = V.querySelector("#fs"), fc = V.querySelector("#fc");
    const filtered = () => cache.enq.filter((e) => (!fs.value || e.status === fs.value) && (!fc.value || e.category === fc.value) &&
      (!q.value || [e.name, e.email, e.company, e.subject, e.message].join(" ").toLowerCase().includes(q.value.toLowerCase())));
    const draw = () => {
      const rows = filtered();
      V.querySelector("#tbl").innerHTML = rows.length ? `<table class="responsive"><thead><tr><th>From</th><th>Type</th><th>Message</th><th>Status</th><th>Received</th></tr></thead><tbody>
        ${rows.map((e) => `<tr class="clickable" data-id="${esc(e.id)}"><td data-label="From"><strong>${esc(e.name)}</strong><div class="sub">${esc(e.company || e.email)}</div></td>
        <td data-label="Type">${esc(e.category)}</td><td data-label="Message">${esc((e.subject ? e.subject + " – " : "") + e.message).slice(0, 90)}…</td>
        <td data-label="Status">${badge(e.status)}</td><td data-label="Received">${date(e.createdAt)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No inquiries match.</div>`;
      V.querySelectorAll("tr[data-id]").forEach((r) => r.onclick = () => openEnq(r.dataset.id));
    };
    [q, fs, fc].forEach((el) => el.oninput = draw); draw();
    V.querySelector("#export").onclick = () => P.csv(`inquiries-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Reference", "Type", "Name", "Email", "Phone", "Company", "Job title", "Subject", "Message", "Status", "Received"],
      ...filtered().map((e) => [e.id.slice(-8).toUpperCase(), e.category, e.name, e.email, e.phone, e.company, e.jobTitle, e.subject, e.message, e.status, e.createdAt])]);
  }
  function openEnq(id) {
    const e = cache.enq.find((x) => x.id === id);
    const d = P.drawer(`
      <h2 style="padding-right:40px">${esc(e.subject || e.category)}</h2><div>${badge(e.status)} <span class="muted small">Ref ${esc(e.id.slice(-8).toUpperCase())}</span></div>
      <dl class="kv"><dt>Type</dt><dd>${esc(e.category)}</dd><dt>Name</dt><dd>${esc(e.name)}</dd><dt>Email</dt><dd><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></dd>
      <dt>Phone</dt><dd>${esc(e.phone || "—")}</dd><dt>Company</dt><dd>${esc(e.company || "—")}</dd><dt>Job title</dt><dd>${esc(e.jobTitle || "—")}</dd>
      <dt>Received</dt><dd>${date(e.createdAt, true)}</dd><dt>Assigned to</dt><dd>${esc(e.assignedTo || "Unassigned")}</dd></dl>
      <div class="card" style="white-space:pre-wrap;background:#f8fafc">${esc(e.message)}</div>
      <form class="form" id="ef" style="margin-top:18px"><div class="row"><div><label>Status</label><select name="status">${cache.enqStatuses.map((s) => `<option ${s === e.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        <div style="display:flex;align-items:end"><label class="small" style="display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" name="assignToMe" style="width:auto"> Assign to me</label></div></div>
        <textarea name="note" placeholder="Internal note (optional)"></textarea>
        <div class="actions"><button class="btn btn-primary">Save</button><a class="btn" href="mailto:${esc(e.email)}?subject=${encodeURIComponent("Re: " + (e.subject || e.category))}">Reply by email</a></div></form>
      ${(e.notes || []).length ? `<h3 style="margin-top:18px">Notes</h3><ul class="timeline">${e.notes.slice().reverse().map((n) => `<li><strong>${esc(n.by)}</strong> <span class="muted small">${date(n.at, true)}</span><div>${esc(n.text)}</div></li>`).join("")}</ul>` : ""}`);
    d.querySelector("#ef").onsubmit = async (ev) => {
      ev.preventDefault(); const f = ev.target;
      await api(`/api/admin/enquiries/${e.id}`, { method: "PATCH", body: { status: f.status.value, note: f.note.value, assignToMe: f.assignToMe.checked } });
      P.toast("Inquiry updated"); d.close(); enquiries();
    };
  }

  // ---------------- PROFILE ----------------
  function profile() {
    V.innerHTML = `
      <div class="page-head"><h1>My profile</h1></div>
      <div class="grid two">
        <div class="card"><h2>Details</h2><form class="form" id="pf">
          <div><label>Email</label><input value="${esc(me.email)}" disabled></div>
          <div><label>Full name</label><input name="name" value="${esc(me.name || "")}"></div>
          <div class="row"><div><label>Designation</label><input name="designation" value="${esc(me.designation || "")}"></div>
            <div><label>Phone</label><input name="phone" value="${esc(me.phone || "")}"></div></div>
          <p class="small muted" style="margin:0">Employee ID: ${esc(me.employeeId || "—")} · Approved by: ${esc(me.reviewedBy || "—")} · Last login: ${date(me.lastLoginAt, true)}</p>
          <div id="pm"></div><button class="btn btn-primary">Save</button></form></div>
        <div class="card"><h2>Change password</h2><form class="form" id="cp">
          <div><label>Current password</label><div class="pw-wrap"><input name="current" type="password" autocomplete="current-password"><button type="button">Show</button></div></div>
          <div><label>New password</label><div class="pw-wrap"><input name="password" type="password" autocomplete="new-password"><button type="button">Show</button></div><ul class="rules" id="rules"></ul></div>
          <div><label>Confirm new password</label><div class="pw-wrap"><input name="confirm" type="password" autocomplete="new-password"><button type="button">Show</button></div></div>
          <div id="cm"></div><button class="btn btn-primary">Update password</button></form></div>
      </div>`;
    P.pwToggles(V);
    const ok = P.pwRules(V.querySelector("#cp [name=password]"), V.querySelector("#rules"));
    V.querySelector("#pf").onsubmit = async (e) => {
      e.preventDefault();
      try { const r = await api("/api/admin/profile", { method: "PUT", body: Object.fromEntries(new FormData(e.target)) }); me = r.user; who(); P.alert(V.querySelector("#pm"), "ok", "Saved."); }
      catch (err) { P.alert(V.querySelector("#pm"), "err", err.message); }
    };
    V.querySelector("#cp").onsubmit = async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const m = V.querySelector("#cm");
      if (!ok()) return P.alert(m, "err", "New password does not meet all the rules.");
      if (f.password !== f.confirm) return P.alert(m, "err", "Passwords do not match.");
      try { await api("/api/admin/profile/password", { method: "POST", body: f }); e.target.reset(); P.alert(m, "ok", "Password updated."); }
      catch (err) { P.alert(m, "err", err.message); }
    };
  }

  // ---------------- router ----------------
  const routes = { home, applications, openings, enquiries, profile };
  async function route() {
    const [r, sub] = (location.hash.slice(1) || "home").split("/");
    const fn = routes[r] || home;
    document.querySelectorAll(".side nav a").forEach((a) => a.classList.toggle("active", a.dataset.r === (routes[r] ? r : "home")));
    try { await fn(sub); } catch (err) { guard(err); }
  }
  function who() { document.getElementById("whoName").textContent = me.name || me.email; document.getElementById("whoEmail").textContent = me.email; }

  api("/api/admin/auth/me").then((r) => {
    me = r.user; who();
    window.addEventListener("hashchange", route); route();
  }).catch(() => (location.href = "/admin/"));
})();
