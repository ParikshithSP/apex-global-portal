// HOD: login and sign-up (email + password + confirm).
(() => {
  const $ = (id) => document.getElementById(id), msg = $("msg");
  P.pwToggles(); const pwOk = P.pwRules($("sPw"), $("rules"));
  const tab = (t) => { $("login").hidden = t !== "login"; $("signup").hidden = t !== "signup"; P.alert(msg, "", "");
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === t)); };
  document.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => tab(b.dataset.tab)));
  const email = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  $("login").onsubmit = async (e) => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("button.btn");
    if (!email(f.email.value.trim()) || !f.password.value) return P.alert(msg, "err", "Enter your email and password.");
    P.busy(btn, true, "Logging in…");
    try { await P.api("/api/hod/auth/login", { method: "POST", body: { email: f.email.value, password: f.password.value } }); location.href = "/hod/app.html"; }
    catch (err) { P.alert(msg, "err", err.message); } finally { P.busy(btn, false); }
  };
  $("signup").onsubmit = async (e) => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("button.btn");
    if (!email(f.email.value.trim())) return P.alert(msg, "err", "Enter a valid email address.");
    if (!pwOk()) return P.alert(msg, "err", "Password does not meet all the rules.");
    if (f.password.value !== f.confirm.value) return P.alert(msg, "err", "Passwords do not match.");
    P.busy(btn, true, "Creating…");
    try { await P.api("/api/hod/auth/signup", { method: "POST", body: Object.fromEntries(new FormData(f)) }); location.href = "/hod/app.html"; }
    catch (err) { P.alert(msg, "err", err.message); } finally { P.busy(btn, false); }
  };
  P.api("/api/hod/auth/me").then(() => (location.href = "/hod/app.html")).catch(() => {});
  P.api("/api/hod/auth/config").then((c) => ($("codeWrap").hidden = !c.codeRequired)).catch(() => {});
})();
