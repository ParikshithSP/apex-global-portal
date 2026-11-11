(() => {
  const list = document.getElementById("jobs");
  const q = document.getElementById("q"), fD = document.getElementById("fDomain"), fT = document.getElementById("fType");
  const modal = document.getElementById("jobModal"), view = document.getElementById("jmView");
  const form = document.getElementById("applyForm"), out = document.getElementById("applyMsg");
  const esc = AG.esc;
  let jobs = [];

  const meta = (j) => `<div class="job-meta"><span>📍 ${esc(j.location)}</span><span>💼 ${esc(j.type)}</span>${j.experience ? `<span>⏱ ${esc(j.experience)}</span>` : ""}</div>`;

  function render() {
    const s = q.value.trim().toLowerCase();
    const shown = jobs.filter((j) =>
      (!fD.value || j.domain === fD.value) && (!fT.value || j.type === fT.value) &&
      (!s || [j.title, j.skills, j.location, j.domain].join(" ").toLowerCase().includes(s)));
    const cnt = document.getElementById("jobCount");
    if (cnt) cnt.textContent = `${shown.length} opening${shown.length === 1 ? "" : "s"}${q.value || fD.value || fT.value ? " match your search" : ""}`;
    list.innerHTML = shown.length ? shown.map((j) => `
      <article class="card job"><span class="pill">${esc(j.domain)}</span><h3>${esc(j.title)}</h3>${meta(j)}
      ${j.skills ? `<p class="muted" style="margin:0;font-size:.93rem">${esc(j.skills)}</p>` : ""}
      <div class="job-actions"><button class="btn btn-primary" data-open="${esc(j.id)}">View &amp; Apply</button></div></article>`).join("")
      : `<div class="empty" style="grid-column:1/-1">No openings match your search right now.</div>`;
  }

  function open(id) {
    const j = jobs.find((x) => x.id === id); if (!j) return;
    const lines = (t) => (t || "").split("\n").filter(Boolean).map((l) => `<li>${esc(l)}</li>`).join("");
    view.innerHTML = `<span class="pill">${esc(j.domain)}</span><h2 id="jmTitle" style="margin-top:10px">${esc(j.title)}</h2>${meta(j)}
      <p style="margin-top:16px">${esc(j.description)}</p>
      ${j.requirements ? `<h3>Requirements</h3><ul>${lines(j.requirements)}</ul>` : ""}
      ${j.skills ? `<p><strong>Key skills:</strong> ${esc(j.skills)}</p>` : ""}`;
    form.reset(); AG.showErrors(form, {}); AG.msg(out, "", "");
    form.jobId.value = j.id; form.style.display = "";
    modal.classList.add("open"); document.body.style.overflow = "hidden";
    history.replaceState(null, "", `#job=${j.id}`);
    modal.querySelector(".modal-close").focus();
  }
  function close() { modal.classList.remove("open"); document.body.style.overflow = ""; history.replaceState(null, "", location.pathname); }

  list.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) open(b.dataset.open); });
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
  [q, fD, fT].forEach((el) => el.addEventListener("input", render));

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    delete f.resume; f.consent = form.consent.checked;
    const file = form.resume.files[0];
    const errors = {};
    if (!f.name || f.name.trim().length < 2) errors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email || "")) errors.email = "Enter a valid email.";
    if (!/^[+\d][\d\s-]{6,18}$/.test(f.phone || "")) errors.phone = "Enter a valid phone number.";
    if (!file) errors.resume = "Please attach your resume.";
    else if (file.size > 2 * 1024 * 1024) errors.resume = "Resume must be 2 MB or smaller.";
    else if (!/\.(pdf|docx?)$/i.test(file.name)) errors.resume = "Resume must be PDF or Word.";
    if (!f.consent) errors.consent = "Please accept the consent to proceed.";
    AG.showErrors(form, errors);
    if (Object.keys(errors).length) return;

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Submitting…"; AG.msg(out, "", "");
    try {
      const type = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf"
        : file.name.toLowerCase().endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/msword");
      f.resume = { name: file.name, type, data: await toBase64(file) };
      const r = await AG.api("/api/public/apply", { method: "POST", body: JSON.stringify(f) });
      form.style.display = "none";
      AG.msg(out, "ok", `Application submitted! Your reference is ${r.reference}. Our recruitment team will contact you if your profile matches.`);
      form.insertAdjacentElement("afterend", out);
    } catch (err) {
      AG.showErrors(form, err.data?.errors);
      AG.msg(out, "err", err.message);
    } finally { btn.disabled = false; btn.textContent = "Submit application"; }
  });

  // Pre-fill filters from the home page job search (?q=...&domain=...)
  const qs = new URLSearchParams(location.search);
  if (qs.get("q")) q.value = qs.get("q");
  if (qs.get("domain")) fD.value = qs.get("domain");
  if (qs.get("type")) fT.value = qs.get("type");
  if (qs.has("q") || qs.has("domain")) setTimeout(() => document.getElementById("openings").scrollIntoView(), 50);

  AG.api("/api/public/jobs").then((r) => {
    jobs = r.jobs; render();
    const m = location.hash.match(/job=([\w-]+)/); if (m) open(m[1]);
    window.addEventListener("hashchange", () => { const h = location.hash.match(/job=([\w-]+)/); if (h) open(h[1]); });
  }).catch(() => { list.innerHTML = `<div class="empty" style="grid-column:1/-1">Could not load openings. Please refresh.</div>`; });
})();
