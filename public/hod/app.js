// HOD console: Home, Admin requests (approve/reject), HR Admin accounts (disable/enable), Activity log, HODs, Profile.
(() => {
  const V = document.getElementById("view");
  const { esc, api, badge, date } = P;
  let me = null;

  P.shell();
  document.getElementById("logout").onclick = async () => { await api("/api/hod/auth/logout", { method: "POST" }).catch(() => {}); location.href = "/hod/"; };

  const ACTION_LABEL = {
    "admin.signup": "HR Admin signed up", "admin.approve": "Approved HR Admin", "admin.reject": "Rejected HR Admin",
    "admin.disable": "Disabled HR Admin", "admin.enable": "Re-enabled HR Admin", "admin.login": "HR Admin logged in",
    "admin.password_reset": "HR Admin reset password", "admin.password_change": "HR Admin changed password", "admin.locked": "HR Admin locked (failed logins)",
    "hod.signup": "HOD signed up", "hod.login": "HOD logged in", "hod.password_change": "HOD changed password", "hod.locked": "HOD locked (failed logins)",
    "job.create": "Opening created", "job.update": "Opening updated", "job.delete": "Opening deleted",
    "application.update": "Application updated", "application.delete": "Application deleted", "application.resume_download": "Resume downloaded",
    "enquiry.update": "Inquiry updated",
  };
  const activityList = (rows) => rows.length ? `<ul class="timeline">${rows.map((a) => `<li><strong>${esc(ACTION_LABEL[a.action] || a.action)}</strong>
    <span class="muted small">· ${esc(a.actor)} · ${date(a.at, true)}</span>${a.detail ? `<div class="small muted">${esc(a.detail)}</div>` : ""}</li>`).join("")}</ul>` : `<div class="empty">No activity yet.</div>`;

  const requestCard = (a) => `<div class="card" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center">
    <div><strong>${esc(a.name)}</strong> ${badge(a.status)}<div class="small muted">${esc(a.email)}${a.designation ? ` · ${esc(a.designation)}` : ""}${a.employeeId ? ` · Emp ID ${esc(a.employeeId)}` : ""}</div>
    <div class="small muted">Requested ${date(a.createdAt, true)} · Email verified by OTP ✓</div></div>
    <div class="actions"><button class="btn btn-ok btn-sm" data-act="approve" data-email="${esc(a.email)}">✓ Approve</button>
    <button class="btn btn-danger btn-sm" data-act="reject" data-email="${esc(a.email)}">✕ Reject</button></div></div>`;

  function bindActions(after) {
    V.querySelectorAll("[data-act]").forEach((b) => b.onclick = async () => {
      const act = b.dataset.act, email = b.dataset.email;
      let reason = "";
      if (act === "reject" || act === "disable") {
        reason = prompt(`${act === "reject" ? "Reason for rejecting" : "Reason for disabling"} ${email} (optional):`, "");
        if (reason === null) return;
      }
      P.busy(b, true, "…");
      try { await api(`/api/hod/admins/${encodeURIComponent(email)}/${act}`, { method: "POST", body: { reason } }); P.toast(`${email}: ${act}d`); after(); }
      catch (err) { P.toast(err.message); P.busy(b, false); }
    });
  }

  async function home() {
    const d = await api("/api/hod/dashboard"); const s = d.stats;
    setPending(s.pendingAdmins);
    V.innerHTML = `
      <div class="page-head"><div><h1>Welcome, ${esc(me.name?.split(" ")[0] || "")}</h1><p class="muted" style="margin:0">Access control and oversight for the HR Admin portal.</p></div></div>
      <div class="grid stats">
        <div class="card stat ${s.pendingAdmins ? "hl" : ""}"><div class="v">${s.pendingAdmins}</div><div class="l">Pending admin requests</div></div>
        <div class="card stat"><div class="v">${s.activeAdmins}</div><div class="l">Active HR Admins</div></div>
        <div class="card stat"><div class="v">${s.openJobs}</div><div class="l">Open job openings</div></div>
        <div class="card stat"><div class="v">${s.totalApplications}</div><div class="l">Applications received</div></div>
      </div>
      <div class="grid two" style="margin-top:16px">
        <div><h2>Pending requests</h2><div class="grid">${d.pending.length ? d.pending.map(requestCard).join("") : `<div class="card empty">No pending requests 🎉</div>`}</div></div>
        <div class="card"><div class="page-head" style="margin-bottom:8px"><h2 style="margin:0">Recent activity</h2><a href="#activity">View all →</a></div>${activityList(d.activity)}</div>
      </div>
      <div class="card" style="margin-top:16px"><h2>Recruitment snapshot</h2>
        <p class="muted" style="margin:0">Hired: <strong>${s.hired}</strong> · Open inquiries: <strong>${s.openEnquiries}</strong> · Disabled admins: <strong>${s.disabledAdmins}</strong> · Rejected requests: <strong>${s.rejectedAdmins}</strong></p></div>
      <div class="card" style="margin-top:16px;border-style:dashed"><h2>More HOD modules</h2><p class="muted" style="margin:0">Space reserved for upcoming HOD features (to be defined).</p></div>`;
    bindActions(home);
  }

  async function requests() {
    const d = await api("/api/hod/admins");
    const pending = d.admins.filter((a) => a.status === "pending");
    setPending(pending.length);
    V.innerHTML = `<div class="page-head"><div><h1>Admin requests</h1><p class="muted" style="margin:0">New HR Admin sign-ups need your approval before they can log in.</p></div></div>
      <div class="grid">${pending.length ? pending.map(requestCard).join("") : `<div class="card empty">No pending requests.</div>`}</div>`;
    bindActions(requests);
  }

  async function admins() {
    const d = await api("/api/hod/admins");
    V.innerHTML = `<div class="page-head"><div><h1>HR Admin accounts</h1><p class="muted" style="margin:0">Everyone who has signed up to the HR Admin portal.</p></div></div>
      <div class="toolbar"><input id="q" type="search" placeholder="Search name or email"><select id="fs"><option value="">All statuses</option><option value="pending">Pending</option><option value="active">Active</option><option value="disabled">Disabled</option><option value="rejected">Rejected</option></select></div>
      <div class="card" style="padding:0"><div class="table-wrap" id="tbl"></div></div>`;
    const q = V.querySelector("#q"), fs = V.querySelector("#fs");
    const draw = () => {
      const rows = d.admins.filter((a) => (!fs.value || a.status === fs.value) && (!q.value || `${a.name} ${a.email}`.toLowerCase().includes(q.value.toLowerCase())));
      V.querySelector("#tbl").innerHTML = rows.length ? `<table class="responsive"><thead><tr><th>Name</th><th>Status</th><th>Signed up</th><th>Last login</th><th>Reviewed by</th><th></th></tr></thead><tbody>
        ${rows.map((a) => `<tr><td data-label="Name"><strong>${esc(a.name)}</strong><div class="sub">${esc(a.email)}</div></td><td data-label="Status">${badge(a.status)}</td>
        <td data-label="Signed up">${date(a.createdAt)}</td><td data-label="Last login">${date(a.lastLoginAt, true)}</td>
        <td data-label="Reviewed by">${esc(a.reviewedBy || "—")}${a.reviewNote ? `<div class="sub">${esc(a.reviewNote)}</div>` : ""}</td>
        <td data-label="Actions"><div class="actions">${{
          pending: `<button class="btn btn-ok btn-sm" data-act="approve" data-email="${esc(a.email)}">Approve</button><button class="btn btn-danger btn-sm" data-act="reject" data-email="${esc(a.email)}">Reject</button>`,
          active: `<button class="btn btn-danger btn-sm" data-act="disable" data-email="${esc(a.email)}">Disable</button>`,
          disabled: `<button class="btn btn-sm" data-act="enable" data-email="${esc(a.email)}">Re-enable</button>`,
          rejected: `<button class="btn btn-sm" data-act="approve" data-email="${esc(a.email)}">Approve</button>`,
        }[a.status] || ""}</div></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No accounts.</div>`;
      bindActions(admins);
    };
    [q, fs].forEach((el) => el.oninput = draw); draw();
  }

  async function activity() {
    const d = await api("/api/hod/audit");
    V.innerHTML = `<div class="page-head"><div><h1>Activity log</h1><p class="muted" style="margin:0">Latest 300 security and data actions across the HR Admin and HOD portals.</p></div>
      <button class="btn" id="export">⬇ Export CSV</button></div><div class="card">${activityList(d.activity)}</div>`;
    V.querySelector("#export").onclick = () => P.csv("activity-log.csv", [["Time", "Actor", "Action", "Detail"], ...d.activity.map((a) => [a.at, a.actor, ACTION_LABEL[a.action] || a.action, a.detail])]);
  }

  async function hods() {
    const d = await api("/api/hod/hods");
    V.innerHTML = `<div class="page-head"><h1>HOD members</h1></div><div class="card" style="padding:0"><div class="table-wrap"><table class="responsive"><thead><tr><th>Name</th><th>Department</th><th>Joined</th><th>Last login</th></tr></thead><tbody>
      ${d.hods.map((h) => `<tr><td data-label="Name"><strong>${esc(h.name)}</strong><div class="sub">${esc(h.email)}</div></td><td data-label="Department">${esc(h.department || "—")}</td><td data-label="Joined">${date(h.createdAt)}</td><td data-label="Last login">${date(h.lastLoginAt, true)}</td></tr>`).join("")}
      </tbody></table></div></div>`;
  }

  function profile() {
    V.innerHTML = `<div class="page-head"><h1>My profile</h1></div>
      <div class="grid two">
        <div class="card"><h2>Details</h2><form class="form" id="pf"><div><label>Email</label><input value="${esc(me.email)}" disabled></div>
          <div><label>Full name</label><input name="name" value="${esc(me.name || "")}"></div><div><label>Department</label><input name="department" value="${esc(me.department || "")}"></div>
          <div id="pm"></div><button class="btn btn-primary">Save</button></form></div>
        <div class="card"><h2>Change password</h2><form class="form" id="cp">
          <div><label>Current password</label><div class="pw-wrap"><input name="current" type="password" autocomplete="current-password"><button type="button">Show</button></div></div>
          <div><label>New password</label><div class="pw-wrap"><input name="password" type="password" autocomplete="new-password"><button type="button">Show</button></div><ul class="rules" id="rules"></ul></div>
          <div><label>Confirm new password</label><div class="pw-wrap"><input name="confirm" type="password" autocomplete="new-password"><button type="button">Show</button></div></div>
          <div id="cm"></div><button class="btn btn-primary">Update password</button></form></div></div>`;
    P.pwToggles(V);
    const ok = P.pwRules(V.querySelector("#cp [name=password]"), V.querySelector("#rules"));
    V.querySelector("#pf").onsubmit = async (e) => {
      e.preventDefault();
      try { const r = await api("/api/hod/profile", { method: "PUT", body: Object.fromEntries(new FormData(e.target)) }); me = r.user; who(); P.alert(V.querySelector("#pm"), "ok", "Saved."); }
      catch (err) { P.alert(V.querySelector("#pm"), "err", err.message); }
    };
    V.querySelector("#cp").onsubmit = async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const m = V.querySelector("#cm");
      if (!ok()) return P.alert(m, "err", "New password does not meet all the rules.");
      if (f.password !== f.confirm) return P.alert(m, "err", "Passwords do not match.");
      try { await api("/api/hod/profile/password", { method: "POST", body: f }); e.target.reset(); P.alert(m, "ok", "Password updated."); }
      catch (err) { P.alert(m, "err", err.message); }
    };
  }

  function setPending(n) { const el = document.getElementById("cPend"); el.hidden = !n; el.textContent = n; }
  function who() { document.getElementById("whoName").textContent = me.name || me.email; document.getElementById("whoEmail").textContent = me.email; }
  const routes = { home, requests, admins, activity, hods, profile };
  async function route() {
    const r = location.hash.slice(1) || "home";
    document.querySelectorAll(".side nav a").forEach((a) => a.classList.toggle("active", a.dataset.r === (routes[r] ? r : "home")));
    try { await (routes[r] || home)(); }
    catch (err) { if (err.status === 401) location.href = "/hod/"; else V.innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`; }
  }
  api("/api/hod/auth/me").then((r) => { me = r.user; who(); window.addEventListener("hashchange", route); route(); })
    .catch(() => (location.href = "/hod/"));
})();
