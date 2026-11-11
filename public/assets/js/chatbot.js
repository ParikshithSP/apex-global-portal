// Apex Global Search website assistant.
// A built-in guided chatbot (no third-party service, no running cost):
//  - answers common questions (services, industries, applying, privacy…)
//  - shows live job openings from the database
//  - collects hiring / career / general leads and saves them as Inquiries in the HR Admin portal
(() => {
  if (window.__apexChat) return; window.__apexChat = true;
  const BRAND = "Apex Global Search";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const api = async (path, opts) => {
    const res = await fetch(path, { headers: { "content-type": "application/json" }, ...opts });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || "Request failed");
    return data;
  };
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const isPhone = (v) => /^[+\d][\d\s-]{6,18}$/.test(v.trim());

  // ---------------------------------------------------------------- UI
  const root = document.createElement("div");
  root.className = "agc";
  root.innerHTML = `
    <div class="agc-teaser" hidden><button class="agc-teaser-x" aria-label="Dismiss">×</button>
      <strong>Hi there 👋</strong><span>Looking to hire or for your next role? I can help.</span></div>
    <button class="agc-launcher" aria-label="Open chat assistant" aria-expanded="false" aria-controls="agcPanel">
      <svg class="agc-i-chat" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>
      <svg class="agc-i-close" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      <span class="agc-launcher-label">Chat with us</span>
    </button>
    <section class="agc-panel" id="agcPanel" role="dialog" aria-label="${BRAND} chat assistant" hidden>
      <header class="agc-head">
        <div class="agc-avatar"><img src="assets/img/symbol.png" alt=""></div>
        <div><strong>Apex Assistant</strong><span><i class="agc-dot"></i>Online · replies instantly</span></div>
        <button class="agc-restart" title="Start over" aria-label="Start over"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
        <button class="agc-close" aria-label="Close chat"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </header>
      <div class="agc-log" role="log" aria-live="polite"></div>
      <div class="agc-chips"></div>
      <form class="agc-input" autocomplete="off">
        <input type="text" aria-label="Type your message" placeholder="Type your message…" maxlength="600">
        <button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg></button>
      </form>
      <div class="agc-foot">Your details are used only to respond to you. <a href="privacy.html">Privacy</a></div>
    </section>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const panel = $(".agc-panel"), log = $(".agc-log"), chipsEl = $(".agc-chips"), form = $(".agc-input"), input = form.querySelector("input");
  const launcher = $(".agc-launcher"), teaser = $(".agc-teaser");

  let history = store.get("agc_history") || [];
  let state = { flow: null, step: 0, data: {} };
  let started = history.length > 0;

  function save() { store.set("agc_history", history.slice(-60)); }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function addMsg(who, html, persist = true) {
    const el = document.createElement("div");
    el.className = `agc-msg agc-${who}`;
    el.innerHTML = html;
    log.appendChild(el); scroll();
    if (persist) { history.push({ who, html }); save(); }
  }
  function user(text) { addMsg("user", esc(text)); }
  function setChips(list = []) {
    chipsEl.innerHTML = list.map((c, i) => `<button type="button" data-i="${i}">${esc(typeof c === "string" ? c : c.label)}</button>`).join("");
    chipsEl.querySelectorAll("button").forEach((b) => b.onclick = () => {
      const c = list[+b.dataset.i]; const label = typeof c === "string" ? c : c.label;
      user(label); setChips([]);
      (typeof c === "string" ? () => handleText(c, true) : c.go)();
    });
    scroll();
  }
  function bot(html, chips, delay = 450) {
    return new Promise((resolve) => {
      const t = document.createElement("div"); t.className = "agc-msg agc-bot agc-typing"; t.innerHTML = "<i></i><i></i><i></i>";
      log.appendChild(t); scroll();
      setTimeout(() => { t.remove(); addMsg("bot", html); if (chips) setChips(chips); resolve(); }, delay);
    });
  }
  const placeholder = (t) => (input.placeholder = t || "Type your message…");

  // ---------------------------------------------------------------- open / close
  function open() {
    panel.hidden = false; root.classList.add("open"); launcher.setAttribute("aria-expanded", "true");
    teaser.hidden = true; store.set("agc_teased", 1);
    if (!started) { started = true; welcome(); }
    else if (!log.children.length) { history.forEach((m) => addMsg(m.who, m.html, false)); setChips(MENU()); }
    setTimeout(() => input.focus(), 80);
  }
  function close() { panel.hidden = true; root.classList.remove("open"); launcher.setAttribute("aria-expanded", "false"); launcher.focus(); }
  launcher.onclick = () => (panel.hidden ? open() : close());
  $(".agc-close").onclick = close;
  $(".agc-restart").onclick = () => { history = []; save(); log.innerHTML = ""; state = { flow: null, step: 0, data: {} }; welcome(); };
  teaser.onclick = (e) => { if (e.target.closest(".agc-teaser-x")) { teaser.hidden = true; store.set("agc_teased", 1); return; } open(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });
  document.addEventListener("click", (e) => { const t = e.target.closest("[data-chat-open]"); if (t) { e.preventDefault(); open(); } });
  if (!store.get("agc_teased")) setTimeout(() => { if (panel.hidden) teaser.hidden = false; }, 7000);

  // ---------------------------------------------------------------- content
  const MENU = () => [
    { label: "🔍 Find a job", go: findJob },
    { label: "🤝 Hire talent", go: hireTalent },
    { label: "Our services", go: () => answer("services") },
    { label: "Industries we serve", go: () => answer("industries") },
    { label: "Talk to our team", go: () => startLead("general") },
    { label: "FAQs", go: faqs },
  ];
  const back = { label: "↩ Main menu", go: () => bot("What else can I help you with?", MENU()) };

  const KB = {
    services: {
      keys: ["service", "services", "offer", "solution", "what do you do", "provide"],
      html: `We offer four workforce solutions for Semiconductor, IT &amp; Engineering:<ul>
        <li><a href="services.html#permanent">Permanent Recruitment</a></li><li><a href="services.html#contract">Contract Staffing</a> (incl. contract-to-hire)</li>
        <li><a href="services.html#executive">Executive Search &amp; Specialized Hiring</a></li><li><a href="services.html#rpo">Recruitment Process Outsourcing (RPO)</a></li></ul>Which one would you like to know more about?`,
      chips: () => [{ label: "Permanent", go: () => answer("permanent") }, { label: "Contract", go: () => answer("contract") }, { label: "Executive search", go: () => answer("executive") }, { label: "RPO", go: () => answer("rpo") }, back],
    },
    permanent: { keys: ["permanent", "full time", "fulltime", "full-time"],
      html: `<b>Permanent Recruitment</b>: we identify, attract and recruit qualified professionals for permanent roles, from mid-level to senior and leadership hiring, including screening, shortlisting, interview coordination and offer management. <a href="services.html#permanent">Read more</a>`,
      chips: () => [{ label: "Hire talent", go: hireTalent }, back] },
    contract: { keys: ["contract", "temporary", "temp", "project based", "contract to hire", "c2h", "freelance"],
      html: `<b>Contract Staffing</b>: skilled professionals for project-based, temporary and long-term contract needs, with contract-to-hire options and global staffing support. <a href="services.html#contract">Read more</a>`,
      chips: () => [{ label: "Hire talent", go: hireTalent }, back] },
    executive: { keys: ["executive", "leadership", "cxo", "ceo", "cto", "director", "vp", "senior leader", "headhunt"],
      html: `<b>Executive Search &amp; Specialized Hiring</b>: strategic talent mapping and targeted search for leadership positions, niche technical roles and business-critical hiring. <a href="services.html#executive">Read more</a>`,
      chips: () => [{ label: "Hire talent", go: hireTalent }, back] },
    rpo: { keys: ["rpo", "outsourc", "recruitment process", "volume hiring", "bulk hiring", "mass hiring"],
      html: `<b>RPO</b>: we work as an extension of your recruitment team, either end-to-end or as project-based RPO when you need to hire many people in a defined timeframe. <a href="services.html#rpo">Read more</a>`,
      chips: () => [{ label: "Hire talent", go: hireTalent }, back] },
    industries: { keys: ["industr", "sector", "domain", "semiconductor", "vlsi", "chip", "automotive", "aerospace", "telecom", "embedded", "ai", "data"],
      html: `We specialise in technology-driven industries:<ul><li>Semiconductor &amp; Microelectronics</li><li>Information Technology</li><li>Electronics &amp; Electrical Engineering</li><li>Automotive &amp; Mobility</li><li>Aerospace &amp; Industrial Engineering</li><li>Consumer Electronics</li><li>Telecommunications</li><li>AI &amp; Data Technologies</li></ul><a href="industries.html">See all industries</a>`,
      chips: () => [{ label: "Hire talent", go: hireTalent }, { label: "Find a job", go: findJob }, back] },
    apply: { keys: ["apply", "application", "how to apply", "submit resume", "upload", "cv"],
      html: `Applying is quick: open <a href="careers.html#openings">Current Openings</a>, choose a role, click <b>View &amp; Apply</b>, fill in your details and attach your resume (PDF, DOC or DOCX, up to 2 MB). You'll get a reference number straight away.`,
      chips: () => [{ label: "Show open jobs", go: () => listJobs("") }, back] },
    status: { keys: ["status", "update on my application", "heard back", "follow up", "selected", "shortlist"],
      html: `Our recruitment team reviews every application. If your profile matches a role, they will contact you directly by email or phone. You can also leave a message for the team here.`,
      chips: () => [{ label: "Message the team", go: () => startLead("candidate") }, back] },
    why: { keys: ["why", "different", "choose you", "advantage", "better"],
      html: `Clients work with us for our <b>specialised industry focus</b>, <b>technical recruitment understanding</b>, <b>targeted sourcing</b>, <b>flexible staffing models</b> and a <b>long-term partnership approach</b>. <a href="why-choose-us.html">Why choose us</a>`,
      chips: () => [{ label: "Hire talent", go: hireTalent }, back] },
    location: { keys: ["location", "where are you", "office", "address", "city", "country", "located"],
      html: `We support clients and candidates globally across Semiconductor, IT &amp; Engineering. Share your location and requirements and our team will connect with you.`,
      chips: () => [{ label: "Talk to our team", go: () => startLead("general") }, back] },
    privacy: { keys: ["privacy", "personal data", "delete my data", "gdpr", "data protection", "remove my"],
      html: `You can read how we handle personal information in our <a href="privacy.html">Privacy Policy</a>. To access, correct or delete your data, send a <a href="contact.html?category=Privacy%20request">privacy request</a>.`,
      chips: () => [back] },
    human: { keys: ["human", "agent", "person", "talk to", "call me", "speak", "contact", "phone", "email", "reach"],
      html: `I'll connect you with our team. Just share a few details and they'll get back to you.`, after: () => startLead("general") },
    thanks: { keys: ["thank", "thanks", "great", "cool", "awesome", "ok", "okay"], html: `You're welcome! Anything else I can help with?`, chips: () => MENU() },
    hello: { keys: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "namaste"], html: `Hello! 👋 How can I help you today?`, chips: () => MENU() },
  };

  function answer(id) { const k = KB[id]; bot(k.html, k.chips ? k.chips() : null).then(() => k.after && k.after()); }

  function welcome() {
    bot(`Hi 👋 I'm the <b>${BRAND}</b> assistant.<br>I can help you find a job, hire specialised talent, or answer questions about our services.`, null, 300)
      .then(() => bot("What would you like to do?", MENU(), 350));
  }

  function faqs() {
    bot("Here are some common questions:", [
      { label: "How do I apply?", go: () => answer("apply") },
      { label: "Application status", go: () => answer("status") },
      { label: "Why choose Apex?", go: () => answer("why") },
      { label: "Where do you operate?", go: () => answer("location") },
      { label: "My personal data", go: () => answer("privacy") },
      back,
    ]);
  }

  // ---------------------------------------------------------------- jobs
  let jobsCache = null;
  async function getJobs() { if (!jobsCache) jobsCache = (await api("/api/public/jobs")).jobs; return jobsCache; }
  function findJob() {
    bot("Great, let's find you a role. Which area are you interested in?", [
      { label: "Semiconductor", go: () => listJobs("", "Semiconductor") }, { label: "IT", go: () => listJobs("", "IT") },
      { label: "Engineering", go: () => listJobs("", "Engineering") }, { label: "All openings", go: () => listJobs("") },
      { label: "Search by keyword", go: () => { state = { flow: "jobsearch" }; placeholder("e.g. verification, Java, Bengaluru"); bot("Type a job title, skill or location."); } },
    ]);
  }
  async function listJobs(term, domain) {
    let jobs = [];
    try { jobs = await getJobs(); } catch { return bot(`I couldn't load openings right now. Please see <a href="careers.html#openings">Current Openings</a>.`, [back]); }
    const t = (term || "").toLowerCase().trim();
    const words = t.split(/\s+/).filter((w) => w.length > 1);
    const hits = jobs.filter((j) => (!domain || j.domain === domain) &&
      (!words.length || words.some((w) => [j.title, j.skills, j.location, j.domain, j.type].join(" ").toLowerCase().includes(w))));
    if (!hits.length) {
      return bot(`I couldn't find a matching opening right now${domain ? ` in ${esc(domain)}` : ""}. You can share your profile and our team will reach out when a suitable role opens.`,
        [{ label: "Share my profile", go: () => startLead("candidate") }, { label: "All openings", go: () => listJobs("") }, back]);
    }
    const shown = hits.slice(0, 5);
    const cards = shown.map((j) => `<a class="agc-job" href="careers.html#job=${encodeURIComponent(j.id)}"><b>${esc(j.title)}</b><span>${esc(j.location)} · ${esc(j.type)}${j.experience ? " · " + esc(j.experience) : ""}</span><em>View &amp; apply →</em></a>`).join("");
    await bot(`I found <b>${hits.length}</b> opening${hits.length > 1 ? "s" : ""}${domain ? ` in ${esc(domain)}` : ""}:${cards}${hits.length > 5 ? `<a href="careers.html#openings">See all ${hits.length} openings →</a>` : ""}`,
      [{ label: "Search by keyword", go: () => { state = { flow: "jobsearch" }; placeholder("e.g. verification, Java, Bengaluru"); bot("Type a job title, skill or location."); } },
       { label: "Share my profile", go: () => startLead("candidate") }, back]);
  }

  // ---------------------------------------------------------------- leads
  const LEADS = {
    client: { category: "Client hiring inquiry", intro: "Happy to help you hire! I'll take a few quick details so the right specialist can get back to you.",
      steps: ["name", "company", "email", "phone", "need", "consent"] },
    candidate: { category: "Candidate & career inquiry", intro: "Sure! Share a few details and our recruitment team will reach out when there's a matching role. (To apply for a specific job with your resume, use the Careers page.)",
      steps: ["name", "email", "phone", "profile", "consent"] },
    general: { category: "General business inquiry", intro: "No problem. A few quick details and our team will get back to you.",
      steps: ["name", "email", "phone", "message", "consent"] },
  };
  const ASK = {
    name: ["What's your full name?", "Your full name"],
    company: ["Which company are you hiring for?", "Company name"],
    email: ["What's the best email to reach you?", "name@company.com"],
    phone: ["And a phone number? (type <b>skip</b> if you prefer email only)", "+91 98xxxxxxxx or skip"],
    need: ["Tell me about the roles you need: titles, number of positions, location and timeline.", "e.g. 5 DV engineers, Bengaluru, within 2 months"],
    profile: ["Briefly describe your profile: current role, key skills, total experience and preferred location.", "e.g. RTL design, 6 yrs, Bengaluru"],
    message: ["How can our team help you?", "Your message"],
  };
  function hireTalent() {
    bot("What kind of hiring support are you looking for?", [
      ...["Permanent hiring", "Contract staffing", "Executive search", "RPO", "Not sure yet"].map((l) => ({ label: l, go: () => startLead("client", l) })),
      back,
    ]);
  }
  function startLead(kind, hiringType) {
    state = { flow: "lead", kind, step: 0, data: { hiringType } };
    bot(LEADS[kind].intro).then(askStep);
  }
  function askStep() {
    const key = LEADS[state.kind].steps[state.step];
    if (key === "consent") {
      placeholder();
      return bot(`Do you agree that ${BRAND} may use these details to respond to you, as described in our <a href="privacy.html" target="_blank">Privacy Policy</a>?`,
        [{ label: "Yes, I agree", go: submitLead }, { label: "No", go: () => { state = { flow: null }; bot("No problem, nothing has been sent. You can still browse our site or ask me anything.", MENU()); } }]);
    }
    placeholder(ASK[key][1]);
    const chips = key === "phone" ? [{ label: "Skip", go: () => takeLeadInput("skip") }] : null;
    bot(ASK[key][0], chips);
  }
  function takeLeadInput(text) {
    const key = LEADS[state.kind].steps[state.step];
    const v = text.trim();
    if (key === "name" && v.length < 2) return bot("Please enter your full name.");
    if (key === "email" && !isEmail(v)) return bot("That doesn't look like a valid email. Could you check it?");
    if (key === "phone") {
      if (/^skip$/i.test(v)) { state.data.phone = ""; }
      else if (!isPhone(v)) return bot("Please enter a valid phone number, or type <b>skip</b>.", [{ label: "Skip", go: () => takeLeadInput("skip") }]);
      else state.data.phone = v;
    } else if (["need", "profile", "message"].includes(key) && v.length < 10) {
      return bot("Could you add a little more detail (at least 10 characters)?");
    } else state.data[key] = v;
    state.step++;
    askStep();
  }
  async function submitLead() {
    const L = LEADS[state.kind], d = state.data;
    const body = d.need || d.profile || d.message || "";
    const payload = {
      name: d.name, email: d.email, phone: d.phone || "", company: d.company || "",
      category: L.category, consent: true, source: "Chatbot",
      subject: `Chatbot: ${d.hiringType || (state.kind === "candidate" ? "Candidate profile" : "General inquiry")}`,
      message: `${d.hiringType ? `Hiring type: ${d.hiringType}\n` : ""}${body}\n\n(Sent via website chat on ${location.pathname})`,
    };
    placeholder();
    try {
      const r = await api("/api/public/contact", { method: "POST", body: JSON.stringify(payload) });
      state = { flow: null };
      bot(`Thank you, ${esc(d.name.split(" ")[0])}! ✅ Your request has been sent to our team (reference <b>${esc(r.reference)}</b>). We'll be in touch at <b>${esc(d.email)}</b> soon.`,
        [{ label: "Find a job", go: findJob }, { label: "Our services", go: () => answer("services") }, back]);
    } catch (err) {
      bot(`Sorry, I couldn't send that (${esc(err.message)}). Please try again or use the <a href="contact.html">contact form</a>.`, [{ label: "Try again", go: submitLead }, back]);
    }
  }

  // ---------------------------------------------------------------- free text
  function handleText(text, fromChip = false) {
    if (state.flow === "lead") return takeLeadInput(text);
    if (state.flow === "jobsearch") { state = { flow: null }; placeholder(); return listJobs(text); }
    const t = " " + text.toLowerCase().replace(/[^a-z0-9+\s-]/g, " ").replace(/\s+/g, " ") + " ";
    const has = (k) => (k.length <= 3 ? t.includes(` ${k} `) : t.includes(k));
    // intent: jobs
    if (/\b(job|jobs|opening|openings|vacanc|role|roles|position|career|careers|hiring\?|work for)\b/.test(t) && !/\b(hire|hiring for|need|staff)\b/.test(t)) {
      const dom = /semiconductor|vlsi|chip|asic|rtl/.test(t) ? "Semiconductor" : /\bit\b|software|developer|java|python|full stack/.test(t) ? "IT" : /engineer|embedded|hardware|mechanical|electrical/.test(t) ? "Engineering" : "";
      return listJobs(dom ? "" : text.replace(/\b(job|jobs|opening|openings|for|in|any|show|me|find|looking|role|roles)\b/gi, ""), dom || undefined);
    }
    if (/\b(hire|hiring|recruit|staff|need .*engineers?|talent|candidates|resources|manpower)\b/.test(t)) return hireTalent();
    let best = null, score = 0;
    for (const [id, k] of Object.entries(KB)) {
      const s = k.keys.reduce((n, key) => n + (has(key) ? key.length : 0), 0);
      if (s > score) { score = s; best = id; }
    }
    if (best) return answer(best);
    bot("I'm not sure I understood that. Here's what I can help with, or you can leave a message for our team.", [...MENU().slice(0, 4), { label: "Message the team", go: () => startLead("general") }]);
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    input.value = ""; setChips([]); user(v); handleText(v);
  });
})();
