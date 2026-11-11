// Home page: show the 3 newest open jobs.
(() => {
  const box = document.getElementById("latestJobs"); if (!box) return;
  const esc = AG.esc;
  AG.api("/api/public/jobs").then((r) => {
    const jobs = r.jobs.slice(0, 3);
    box.innerHTML = jobs.length ? jobs.map((j) => `<article class="card job"><span class="pill">${esc(j.domain)}</span><h3>${esc(j.title)}</h3>
      <div class="job-meta"><span>📍 ${esc(j.location)}</span><span>💼 ${esc(j.type)}</span>${j.experience ? `<span>⏱ ${esc(j.experience)}</span>` : ""}</div>
      <div class="job-actions"><a class="btn btn-ghost" href="careers.html#job=${encodeURIComponent(j.id)}">View &amp; apply</a></div></article>`).join("")
      : `<div class="empty" style="grid-column:1/-1">New openings will be posted soon. <a href="contact.html?category=Candidate%20%26%20career%20inquiry">Send us your profile</a>.</div>`;
  }).catch(() => { box.innerHTML = `<div class="empty" style="grid-column:1/-1"><a href="careers.html#openings">See current openings</a></div>`; });
})();
