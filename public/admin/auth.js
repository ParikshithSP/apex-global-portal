// HR Admin: login, sign-up (email -> OTP -> password) and forgot-password flows.
(() => {
  const $ = (id) => document.getElementById(id);
  const msg = $("msg");
  const views = ["login", "email", "otp", "password", "pending"];
  const state = { mode: "signup", email: "", token: "", timer: null };
  const otp = P.otpBoxes($("otpBoxes"));
  const pwOk = P.pwRules($("pPw"), $("rules"));
  P.pwToggles();

  function show(view) {
    views.forEach((v) => ($(v).hidden = v !== view));
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active",
      view === "login" ? b.dataset.tab === "login" : state.mode === "signup" && b.dataset.tab === "signup"));
    const first = $(view).querySelector("input"); if (first) setTimeout(() => (view === "otp" ? otp.focus() : first.focus()), 30);
  }
  function startMode(mode) {
    state.mode = mode;
    const signup = mode === "signup";
    $("emailTitle").textContent = signup ? "Create your account" : "Reset your password";
    $("emailHint").textContent = signup ? "Enter your work email. We'll send a 6-digit code to verify it."
      : "Enter your registered email. We'll send a 6-digit code to reset your password.";
    $("pwTitle").textContent = signup ? "Set your password" : "Choose a new password";
    $("pwBtn").textContent = signup ? "Create account" : "Update password";
    document.querySelectorAll(".signup-only").forEach((el) => (el.hidden = !signup));
    P.alert(msg, "", "");
    show("email");
  }

  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
    P.alert(msg, "", "");
    b.dataset.tab === "login" ? show("login") : startMode("signup");
  }));
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]"); if (!g) return;
    const to = g.dataset.go;
    if (to === "forgot") startMode("reset");
    else if (to === "email") show("email");
    else { P.alert(msg, "", ""); show(to); }
  });

  // ---- Login ----
  $("login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, btn = f.querySelector("[type=submit]");
    if (!f.email.value || !f.password.value) return P.alert(msg, "err", "Enter your email and password.");
    P.busy(btn, true, "Logging in…");
    try {
      await P.api("/api/admin/auth/login", { method: "POST", body: { email: f.email.value, password: f.password.value } });
      location.href = "/admin/app.html";
    } catch (err) {
      P.alert(msg, err.data?.status === "pending" ? "warn" : "err", err.message);
    } finally { P.busy(btn, false); }
  });

  // ---- Step 1: send OTP ----
  async function sendOtp(btn) {
    P.busy(btn, true, "Sending…");
    try {
      const r = await P.api("/api/admin/auth/send-otp", { method: "POST", body: { email: state.email, purpose: state.mode } });
      $("otpTo").textContent = state.email;
      $("demoOtp").innerHTML = r.demoOtp ? `<div class="alert alert-warn">Demo mode – your code is <strong style="letter-spacing:3px">${P.esc(r.demoOtp)}</strong></div>` : "";
      P.alert(msg, "ok", `A 6-digit code was sent to ${state.email}.`);
      otp.clear(); show("otp"); countdown(r.resendInSec || 60);
    } catch (err) {
      if (err.data?.retryAfter) { show("otp"); countdown(err.data.retryAfter); }
      P.alert(msg, "err", err.message);
    } finally { P.busy(btn, false); }
  }
  $("email").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = e.target.email.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return P.alert(msg, "err", "Enter a valid email address.");
    state.email = v; sendOtp(e.target.querySelector("[type=submit]"));
  });
  function countdown(sec) {
    clearInterval(state.timer);
    const b = $("resend"); let s = sec; b.disabled = true;
    const tick = () => { b.textContent = s > 0 ? `Resend code in ${s}s` : "Resend code"; b.disabled = s > 0; s--; if (s < -1) clearInterval(state.timer); };
    tick(); state.timer = setInterval(tick, 1000);
  }
  $("resend").addEventListener("click", (e) => sendOtp(e.target));

  // ---- Step 2: verify OTP ----
  $("otp").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = otp.value();
    if (!/^\d{6}$/.test(code)) return P.alert(msg, "err", "Enter all 6 digits.");
    const btn = e.target.querySelector("[type=submit]"); P.busy(btn, true, "Verifying…");
    try {
      const r = await P.api("/api/admin/auth/verify-otp", { method: "POST", body: { email: state.email, otp: code, purpose: state.mode } });
      state.token = r.token; clearInterval(state.timer);
      $("pwEmail").textContent = state.email;
      P.alert(msg, "", ""); show("password");
    } catch (err) { P.alert(msg, "err", err.message); otp.clear(); }
    finally { P.busy(btn, false); }
  });

  // ---- Step 3: password ----
  $("password").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    if (state.mode === "signup" && f.name.value.trim().length < 2) return P.alert(msg, "err", "Enter your full name.");
    if (!pwOk()) return P.alert(msg, "err", "Password does not meet all the rules.");
    if (f.password.value !== f.confirm.value) return P.alert(msg, "err", "Passwords do not match.");
    const btn = f.querySelector("[type=submit]"); P.busy(btn, true, "Saving…");
    try {
      const r = await P.api("/api/admin/auth/set-password", { method: "POST", body: {
        token: state.token, password: f.password.value, confirm: f.confirm.value,
        name: f.name.value, employeeId: f.employeeId.value, designation: f.designation.value } });
      f.reset();
      if (state.mode === "reset") { show("login"); P.alert(msg, "ok", "Password updated. Please log in with your new password."); $("lEmail").value = state.email; }
      else if (r.status === "pending") { $("pendEmail").textContent = state.email; P.alert(msg, "", ""); show("pending"); }
      else location.href = "/admin/app.html";
    } catch (err) { P.alert(msg, "err", err.message); }
    finally { P.busy(btn, false); }
  });

  // Init: already logged in? go to home. Show demo banner if email not configured.
  P.api("/api/admin/auth/me").then(() => (location.href = "/admin/app.html")).catch(() => {});
  P.api("/api/admin/auth/config").then((c) => ($("demo").hidden = !c.demoMode)).catch(() => {});
  if (location.hash === "#signup") startMode("signup"); else show("login");
})();
