(() => {
  const form = document.getElementById("contactForm");
  const out = document.getElementById("contactMsg");
  const cat = new URLSearchParams(location.search).get("category");
  if (cat) [...form.category.options].forEach((o) => { if (o.value === cat) form.category.value = cat; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    f.consent = form.consent.checked;
    const errors = {};
    if (!f.name || f.name.trim().length < 2) errors.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email || "")) errors.email = "Enter a valid email.";
    if (!f.message || f.message.trim().length < 10) errors.message = "Message should be at least 10 characters.";
    if (!f.consent) errors.consent = "Please accept the privacy notice to proceed.";
    AG.showErrors(form, errors);
    if (Object.keys(errors).length) return;
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Sending…"; AG.msg(out, "", "");
    try {
      const r = await AG.api("/api/public/contact", { method: "POST", body: JSON.stringify(f) });
      form.reset();
      AG.msg(out, "ok", `Thank you! Your message has been received (Ref: ${r.reference}). Our team will get back to you shortly.`);
    } catch (err) {
      AG.showErrors(form, err.data?.errors);
      AG.msg(out, "err", err.message);
    } finally { btn.disabled = false; btn.textContent = "Send message"; }
  });
})();
