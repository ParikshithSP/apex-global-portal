// Shared helpers for the HR Admin and HOD portals.
window.P = {
  esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  async api(path, opts = {}) {
    const res = await fetch(path, { credentials: "same-origin", headers: { "content-type": "application/json" }, ...opts,
      body: opts.body && typeof opts.body !== "string" ? JSON.stringify(opts.body) : opts.body });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok || data.ok === false) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status, data });
    return data;
  },
  alert(el, type, text) { el.innerHTML = text ? `<div class="alert alert-${type}">${P.esc(text)}</div>` : ""; },
  toast(text) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = text; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  },
  date: (iso, time = false) => iso ? new Date(iso).toLocaleString("en-IN", time
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }) : "—",
  badge: (s) => `<span class="badge b-${String(s).toLowerCase().replace(/\s+/g, "-")}">${P.esc(s)}</span>`,
  busy(btn, on, label) { if (on) { btn.dataset.l = btn.textContent; btn.textContent = label || "Please wait…"; btn.disabled = true; } else { btn.textContent = btn.dataset.l || btn.textContent; btn.disabled = false; } },

  // Password strength rules UI (matches server rules)
  pwRules(input, list) {
    const rules = [
      ["len", "8+ characters", (v) => v.length >= 8], ["up", "Uppercase letter", (v) => /[A-Z]/.test(v)],
      ["low", "Lowercase letter", (v) => /[a-z]/.test(v)], ["num", "Number", (v) => /\d/.test(v)],
      ["sym", "Special character", (v) => /[^A-Za-z0-9]/.test(v)],
    ];
    list.innerHTML = rules.map(([k, l]) => `<li data-r="${k}">${l}</li>`).join("");
    const upd = () => rules.forEach(([k, , f]) => list.querySelector(`[data-r="${k}"]`).classList.toggle("ok", f(input.value)));
    input.addEventListener("input", upd); upd();
    return () => rules.every(([, , f]) => f(input.value));
  },
  // Show / hide toggles for password fields
  pwToggles(root = document) {
    root.querySelectorAll(".pw-wrap").forEach((w) => {
      const i = w.querySelector("input"), b = w.querySelector("button");
      b.addEventListener("click", () => { const s = i.type === "password"; i.type = s ? "text" : "password"; b.textContent = s ? "Hide" : "Show"; });
    });
  },
  // 6 separate OTP boxes with paste + auto-advance
  otpBoxes(container) {
    container.innerHTML = Array.from({ length: 6 }, (_, i) =>
      `<input inputmode="numeric" autocomplete="${i === 0 ? "one-time-code" : "off"}" maxlength="1" aria-label="Digit ${i + 1}">`).join("");
    const boxes = [...container.querySelectorAll("input")];
    boxes.forEach((b, i) => {
      b.addEventListener("input", () => {
        const d = b.value.replace(/\D/g, "");
        if (d.length > 1) { fill(d); return; }
        b.value = d; if (d && i < 5) boxes[i + 1].focus();
      });
      b.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !b.value && i > 0) boxes[i - 1].focus(); });
      b.addEventListener("paste", (e) => { e.preventDefault(); fill((e.clipboardData.getData("text") || "").replace(/\D/g, "")); });
    });
    const fill = (d) => { d.slice(0, 6).split("").forEach((c, k) => (boxes[k].value = c)); boxes[Math.min(d.length, 6) - 1]?.focus(); };
    return { value: () => boxes.map((b) => b.value).join(""), clear: () => { boxes.forEach((b) => (b.value = "")); boxes[0].focus(); }, focus: () => boxes[0].focus() };
  },
  // Mobile nav drawer for app shell
  shell() {
    document.querySelector("[data-menu]")?.addEventListener("click", () => document.body.classList.add("nav-open"));
    document.querySelector(".scrim")?.addEventListener("click", () => document.body.classList.remove("nav-open"));
    document.querySelectorAll(".side nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
  },
  drawer(html) {
    let d = document.getElementById("drawer");
    if (!d) {
      d = document.createElement("div"); d.id = "drawer"; d.className = "drawer";
      d.innerHTML = `<div class="bg"></div><div class="panel" role="dialog" aria-modal="true"><button class="btn btn-sm close" aria-label="Close">✕</button><div class="body"></div></div>`;
      document.body.appendChild(d);
      const close = () => { d.classList.remove("open"); document.body.style.overflow = ""; };
      d.querySelector(".bg").onclick = close; d.querySelector(".close").onclick = close;
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
      d.close = close;
    }
    d.querySelector(".body").innerHTML = html; d.classList.add("open"); document.body.style.overflow = "hidden";
    return d;
  },
  csv(filename, rows) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const text = rows.map((r) => r.map(esc).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv" })); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};
