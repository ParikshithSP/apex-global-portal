// Shared behaviour for the public site: mobile menu, footer year, form helpers.
(() => {
  const btn = document.querySelector(".nav-toggle");
  const menu = document.getElementById("menu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", (e) => { if (e.target.tagName === "A") menu.classList.remove("open"); });
  }
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // If a photo cannot load, hide it so the branded background shows instead of a broken image.
  const hideBroken = (img) => { img.style.visibility = "hidden"; };
  document.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) hideBroken(img);
    img.addEventListener("error", () => hideBroken(img));
  });

  // Gentle scroll-reveal animation
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && items.length) {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  }
})();

window.AG = {
  esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  async api(path, opts = {}) {
    const res = await fetch(path, { headers: { "content-type": "application/json" }, ...opts });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok || data.ok === false) throw Object.assign(new Error(data.error || "Request failed"), { data });
    return data;
  },
  showErrors(form, errors = {}) {
    form.querySelectorAll("[data-err]").forEach((el) => (el.textContent = ""));
    form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    for (const [k, v] of Object.entries(errors)) {
      const slot = form.querySelector(`[data-err="${k}"]`); if (slot) slot.textContent = v;
      const input = form.elements[k]; if (input && input.classList) input.classList.add("invalid");
    }
  },
  msg(el, type, text) { el.innerHTML = text ? `<div class="alert alert-${type}">${AG.esc(text)}</div>` : ""; },
};
