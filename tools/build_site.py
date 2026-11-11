#!/usr/bin/env python3
"""Generates the 8 static pages of the public (User) site into ../public/.
Edit text here and re-run:  python3 tools/build_site.py
(The generated HTML is committed, so Netlify needs no build step.)

Photos: free Unsplash photos (Unsplash License: free for commercial use, no attribution required),
loaded from the Unsplash image CDN. To use your own photos, put files in public/assets/img/photos/
and change the PHOTOS entries below to e.g. "assets/img/photos/team.jpg".
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from icons import I

OUT = Path(__file__).resolve().parent.parent / "public"
BRAND = "Apex Global Search"
TAG = "Staffing Solutions"

# ---------------------------------------------------------------- photos
PHOTOS = {
    "hero":        ("1762341121210-6bd877d766b0", "Recruitment consultant working at a laptop in a modern office"),
    "team":        ("1758518731706-be5d5230e5a5", "Diverse business team collaborating in a modern office"),
    "meeting":     ("1603202662747-00e33e7d1468", "Team meeting around a table in a modern office"),
    "collab":      ("1603201667230-bd139210db18", "Colleagues collaborating around a laptop"),
    "handshake_w": ("1758518729240-7162d07427b8", "Two businesswomen shaking hands in an office"),
    "handshake_m": ("1758519288905-38b7b00c1023", "Two professionals shaking hands across a table"),
    "handshake_l": ("1672380135241-c024f7fbfa13", "Handshake in front of a laptop"),
    "interview":   ("1758520144437-f068ecaf0d83", "Recruiter interviewing a candidate at an office desk"),
    "interview2":  ("1758518730162-09a142505bfd", "Interview across a table"),
    "resume":      ("1698047681432-006d2449c631", "Recruiter reviewing a resume"),
    "developer":   ("1623479322729-28b25c16b011", "Software developer working at a computer"),
    "exec":        ("1764084052708-c3c0611d89e7", "Business leader in a suit"),
    "woman_arms":  ("1758599543125-0a927f1d7a3b", "Confident professional with arms crossed"),
    "woman_suit":  ("1762341120362-54c074c13ca6", "Professional in a black suit"),
    "woman_desk":  ("1762341104634-998bbee0ccba", "Professional seated at a desk"),
    "mindmap":     ("1758873268136-83e3e1be9315", "Smiling engineer in front of a planning board"),
    "office":      ("1758873271857-c42a7ef7d692", "People working in a modern office"),
    "group":       ("1522071820081-009f0129c71c", "Group of people working on a laptop"),
    "lab":         ("1581093577421-f561a654a353", "Engineer using a laptop in a laboratory"),
    "microscope":  ("1682562031780-856bb01f08e8", "Engineer looking through a microscope"),
    "chip":        ("1640955785023-1854685dae05", "Microchip being placed on a circuit board"),
    "chip2":       ("1675602488512-bdd631490fcb", "Close-up of a chip on a printed circuit board"),
    "board":       ("1782338938777-908f4e1db3be", "Circuit board with a central microchip"),
    "cpu":         ("1782155789607-1f3a0d3f949b", "Circuit board with a central processing chip"),
    "wires":       ("1581093586267-784d0a92223d", "Coated network and electrical wires"),
    "code":        ("1759661990336-51bd4b951fea", "Screens displaying code"),
}

def src(key, w):
    pid = PHOTOS[key][0]
    if "/" in pid: return pid
    return f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&w={w}&q=75"

def photo(key, cls="", sizes="(max-width: 900px) 100vw, 50vw", eager=False, pos=None):
    alt = PHOTOS[key][1]
    ss = ", ".join(f"{src(key, w)} {w}w" for w in (480, 800, 1200, 1600))
    st = f' style="object-position:{pos}"' if pos else ""
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return f'<img class="{cls}" src="{src(key, 1200)}" srcset="{ss}" sizes="{sizes}" alt="{alt}" {load} decoding="async"{st}>'

# ---------------------------------------------------------------- nav
NAV = [
    ("index.html", "Home"), ("about.html", "About Us"), ("services.html", "Services"),
    ("industries.html", "Industries"), ("why-choose-us.html", "Why Choose Us"), ("careers.html", "Careers"),
]
SERVICES = [
    ("permanent", "Permanent Recruitment"), ("contract", "Contract Staffing"),
    ("executive", "Executive Search & Specialized Hiring"), ("rpo", "Recruitment Process Outsourcing (RPO)"),
]

def icon(name, cls="icon"):
    return f'<div class="{cls}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{I[name]}</svg></div>'

def card(ic, title, text):
    return f'<div class="card reveal">{icon(ic)}<h3>{title}</h3><p class="muted">{text}</p></div>'

def checklist(items):
    return '<ul class="checklist">' + "".join(f"<li>{x}</li>" for x in items) + "</ul>"

ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

def header(active):
    items = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == active else ""
        if href == "services.html":
            sub = "".join(f'<li><a href="services.html#{a}">{t}</a></li>' for a, t in SERVICES)
            items.append(f'<li class="has-sub"><a href="{href}"{cur}>{label} <span class="caret">▾</span></a><ul class="submenu">{sub}</ul></li>')
        else:
            items.append(f'<li><a href="{href}"{cur}>{label}</a></li>')
    cur = ' aria-current="page"' if active == "contact.html" else ""
    items.append(f'<li class="cta"><a href="contact.html"{cur}>Contact Us</a></li>')
    return f'''<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="container topbar-in">
  <span>Specialized talent for <strong>Semiconductor</strong> &bull; <strong>IT</strong> &bull; <strong>Engineering</strong></span>
  <nav aria-label="Quick links"><a href="careers.html#openings">Find Jobs</a><a href="contact.html?category=Client%20hiring%20inquiry">Hire Talent</a><a href="#" data-chat-open>Chat with us</a></nav>
</div></div>
<header class="site-header"><div class="container nav">
  <a class="brand" href="index.html" aria-label="{BRAND} home"><img src="assets/img/logo-400.png" alt="{BRAND} – {TAG}" width="400" height="208"></a>
  <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
  <ul class="menu" id="menu">{"".join(items)}</ul>
</div></header>'''

FOOTER = f'''<footer class="site-footer"><div class="container">
  <div class="footer-grid">
    <div><a class="logo-badge" href="index.html" aria-label="{BRAND} home"><img src="assets/img/logo-400.png" alt="{BRAND}" width="200" height="104"></a>
      <p style="margin-top:16px">Global Search &amp; Staffing Firm<br>Semiconductor &bull; IT &bull; Engineering</p>
      <p class="footer-tag">Your Talent. Our Expertise. Shared Success.</p></div>
    <div><h4>Company</h4><ul><li><a href="about.html">About Us</a></li><li><a href="why-choose-us.html">Why Choose Us</a></li><li><a href="industries.html">Industries We Serve</a></li><li><a href="careers.html">Careers</a></li></ul></div>
    <div><h4>Services</h4><ul>{"".join(f'<li><a href="services.html#{a}">{t}</a></li>' for a, t in SERVICES)}</ul></div>
    <div><h4>Get in touch</h4><ul><li><a href="contact.html">Contact Us</a></li><li><a href="careers.html#openings">Current Openings</a></li><li><a href="#" data-chat-open>Chat with us</a></li><li><a href="privacy.html">Privacy Policy</a></li></ul></div>
  </div>
  <div class="footer-bottom"><span>&copy; <span data-year></span> {BRAND}. All rights reserved.</span><span><a href="privacy.html">Privacy Policy</a></span></div>
</div></footer>'''

def page(fname, title, desc, body, scripts=""):
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0b1b33">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/img/logo.png">
<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="assets/img/favicon-64.png" sizes="64x64" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://images.unsplash.com">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css">
<link rel="stylesheet" href="assets/css/chatbot.css">
</head>
<body>
{header(fname)}
<main id="main">
{body}
</main>
{FOOTER}
<script src="assets/js/site.js" defer></script>{scripts}
<script src="assets/js/chatbot.js" defer></script>
</body>
</html>
'''
    # Company renamed: make sure every mention uses the full new name
    html = html.replace("Apex Global Search", "\x00").replace("Apex Global", "Apex Global Search").replace("\x00", "Apex Global Search")
    (OUT / fname).write_text(html, encoding="utf-8")

def split_hero(eyebrow, h1, lead, img, actions="", pos=None, extra=""):
    return f'''<section class="hero hero-split"><div class="container hero-grid">
  <div class="hero-copy"><div class="eyebrow">{eyebrow}</div><h1>{h1}</h1><p class="lead">{lead}</p>{actions}{extra}</div>
  <div class="hero-media"><div class="photo-frame">{photo(img, "photo", "(max-width: 900px) 90vw, 46vw", True, pos)}</div></div>
</div></section>'''

def band(img, quote, sub="", pos="center"):
    return f'''<section class="photo-band">{photo(img, "band-img", "100vw", False, pos)}<div class="band-overlay"></div>
<div class="container band-copy reveal"><p class="band-quote">{quote}</p>{f'<p class="band-sub">{sub}</p>' if sub else ''}</div></section>'''

def media_split(img, inner, reverse=False, soft=False, pos=None, anchor=""):
    cls = "split media-split" + (" reverse" if reverse else "")
    return f'''<section class="{'soft ' if soft else ''}service-block"{f' id="{anchor}"' if anchor else ''}><div class="container {cls}">
  <div class="media reveal"><div class="photo-card">{photo(img, "photo", "(max-width: 900px) 100vw, 45vw", False, pos)}</div></div>
  <div class="reveal">{inner}</div></div></section>'''

CTA = '''<section><div class="container"><div class="cta-band reveal"><div><div class="eyebrow" style="color:#6fe3e3">Let&rsquo;s talk</div><h2>Let&rsquo;s Build Your Next Team.</h2><p style="margin:0">Tell us about your hiring goals and we&rsquo;ll propose a staffing solution aligned with your business.</p></div>
<div class="cta-actions"><a class="btn btn-primary" href="contact.html?category=Client%20hiring%20inquiry">Hire talent</a><a class="btn btn-outline" href="careers.html#openings">Find jobs</a></div></div></div></section>'''

JOB_SEARCH = '''<form class="job-search" action="careers.html" method="get" role="search">
  <label class="sr-only" for="hq">Job title, skill or location</label>
  <div class="js-field">''' + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' + '''<input id="hq" name="q" placeholder="Job title, skill or location"></div>
  <label class="sr-only" for="hd">Domain</label>
  <select id="hd" name="domain"><option value="">All domains</option><option>Semiconductor</option><option>IT</option><option>Engineering</option></select>
  <button class="btn btn-primary" type="submit">Find jobs</button>
</form>'''

# ================================================================ HOME
page("index.html", f"{BRAND} | Engineering Talent. Accelerating Innovation.",
     "Specialized staffing solutions for Semiconductor, IT and Engineering industries. Permanent recruitment, contract staffing, executive search and RPO.",
     split_hero("Global Search &amp; Staffing Firm",
                'Engineering Talent.<span class="h1-light"> Accelerating Innovation.</span>',
                "Specialized Staffing Solutions for Semiconductor, IT &amp; Engineering Industries",
                "hero", JOB_SEARCH,
                extra='<div class="hero-links"><a href="contact.html?category=Client%20hiring%20inquiry">Looking to hire? Talk to our team ' + ARROW + '</a></div>') + f'''
<section class="paths"><div class="container grid g2">
  <a class="path-card reveal" href="contact.html?category=Client%20hiring%20inquiry">{photo("handshake_m", "path-img", "(max-width: 640px) 100vw, 50vw")}
    <div class="path-body"><span class="pill">For employers</span><h3>Hire Talent</h3><p>Permanent, contract and executive hiring for Semiconductor, IT and Engineering teams.</p><span class="link-arrow">Start hiring {ARROW}</span></div></a>
  <a class="path-card reveal" href="careers.html#openings">{photo("developer", "path-img", "(max-width: 640px) 100vw, 50vw")}
    <div class="path-body"><span class="pill">For professionals</span><h3>Find Jobs</h3><p>Explore current openings with leading technology and engineering organizations.</p><span class="link-arrow">View openings {ARROW}</span></div></a>
</div></section>

<section><div class="container split">
  <div class="reveal"><div class="eyebrow">Who we are</div><h2>We connect talent with opportunity.</h2>
  <p>We are a specialized staffing and workforce solutions company focused on connecting businesses with highly skilled professionals across Semiconductor, IT, and Engineering domains.</p>
  <p>From advanced semiconductor design and verification to software development, embedded systems, and engineering operations, we help organizations build the teams that drive innovation and business growth.</p>
  <p>Our industry-focused recruitment approach, technical understanding, and commitment to quality enable us to deliver talent solutions aligned with your business objectives.</p>
  <p class="quote">We connect talent with opportunity. We connect innovation with execution.</p>
  <a class="btn btn-dark" href="about.html">About us</a></div>
  <div class="media reveal"><div class="photo-card tall">{photo("team", "photo", "(max-width: 900px) 100vw, 45vw")}</div>
    <div class="float-card"><strong>Semiconductor &bull; IT &bull; Engineering</strong><span>Focused expertise, global reach</span></div></div>
</div></section>

<section class="soft"><div class="container"><div class="section-head center reveal"><div class="eyebrow">Industries</div><h2>Specialists in technology-driven industries</h2><p class="muted">Deep understanding of technical roles, skill sets and hiring challenges in each domain.</p></div>
<div class="grid g3">
  <a class="img-card reveal" href="industries.html">{photo("chip", "img", "(max-width: 960px) 100vw, 33vw")}<div class="img-card-body"><h3>Semiconductor</h3><p>Design, verification, physical design and silicon engineering.</p></div></a>
  <a class="img-card reveal" href="industries.html">{photo("group", "img", "(max-width: 960px) 100vw, 33vw")}<div class="img-card-body"><h3>Information Technology</h3><p>Software, product engineering and enterprise technology teams.</p></div></a>
  <a class="img-card reveal" href="industries.html">{photo("lab", "img", "(max-width: 960px) 100vw, 33vw")}<div class="img-card-body"><h3>Engineering</h3><p>Embedded systems, electronics, hardware and engineering operations.</p></div></a>
</div></div></section>

<section><div class="container split">
  <div class="media reveal"><div class="photo-card">{photo("meeting", "photo", "(max-width: 900px) 100vw, 45vw")}</div></div>
  <div class="reveal"><div class="eyebrow">Shared success</div><h2>Your Talent. Our Expertise. Shared Success.</h2>
  <p>Technology is advancing at an unprecedented pace. Organizations need skilled professionals who can adapt, innovate, and deliver results.</p>
  <p>We understand the challenges of identifying specialized technical talent in competitive markets.</p>
  <p>Our approach combines industry knowledge, focused recruitment strategies, and a commitment to building meaningful partnerships.</p>
  <p>Whether you are scaling a semiconductor design team, strengthening your IT capabilities, or expanding engineering operations, we provide workforce solutions that help you move forward with confidence.</p>
  <a class="btn btn-dark" href="services.html">Explore our services</a></div>
</div></section>

<section class="soft"><div class="container"><div class="section-head center reveal"><div class="eyebrow">Value</div><h2>What We Bring to Your Business</h2></div>
<div class="grid g4">
{card("star","Specialized expertise","Specialized recruitment expertise across technology-driven industries.")}
{card("users","Skilled professionals","Access to skilled and experienced technical professionals.")}
{card("layers","Flexible models","Flexible staffing models aligned with business requirements.")}
{card("target","Niche sourcing","Focused sourcing for niche and hard-to-fill positions.")}
{card("check","Quality evaluation","Quality-driven candidate evaluation.")}
{card("handshake","Responsive engagement","Collaborative and responsive client engagement.")}
{card("chart","Scalable solutions","Scalable talent solutions for evolving workforce demands.")}
{card("bolt","Structured process","Structured processes that keep critical hiring moving.")}
</div></div></section>

<section><div class="container"><div class="section-head reveal"><div class="eyebrow">Services</div><h2>Workforce solutions for every stage</h2></div>
<div class="grid g4 services-grid">
  <a class="svc reveal" href="services.html#permanent">{photo("interview", "svc-img", "(max-width: 960px) 50vw, 25vw")}<div class="svc-body"><h3>Permanent Recruitment</h3><span class="link-arrow">Learn more {ARROW}</span></div></a>
  <a class="svc reveal" href="services.html#contract">{photo("collab", "svc-img", "(max-width: 960px) 50vw, 25vw")}<div class="svc-body"><h3>Contract Staffing</h3><span class="link-arrow">Learn more {ARROW}</span></div></a>
  <a class="svc reveal" href="services.html#executive">{photo("exec", "svc-img", "(max-width: 960px) 50vw, 25vw", pos="center 25%")}<div class="svc-body"><h3>Executive Search</h3><span class="link-arrow">Learn more {ARROW}</span></div></a>
  <a class="svc reveal" href="services.html#rpo">{photo("office", "svc-img", "(max-width: 960px) 50vw, 25vw")}<div class="svc-body"><h3>RPO</h3><span class="link-arrow">Learn more {ARROW}</span></div></a>
</div></div></section>

<section class="soft"><div class="container"><div class="section-head reveal" style="display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap;max-width:none"><div><div class="eyebrow">Current openings</div><h2>Latest opportunities</h2></div><a class="btn btn-ghost" href="careers.html#openings">View all jobs</a></div>
<div class="grid g3" id="latestJobs" aria-live="polite"><div class="empty" style="grid-column:1/-1">Loading openings…</div></div></div></section>

{band("handshake_w", "We connect talent with opportunity. We connect innovation with execution.", "Your Talent. Our Expertise. Shared Success.", "center 35%")}
{CTA}''', '\n<script src="assets/js/home.js" defer></script>')

# ================================================================ ABOUT
page("about.html", f"About Us | {BRAND}", "Empowering businesses through specialized talent solutions.",
     split_hero("About Us", "Empowering Businesses Through Specialized Talent Solutions",
                "A technology-focused staffing and workforce solutions company supporting the Semiconductor, IT, and Engineering industries.",
                "woman_arms", '<div class="hero-actions"><a class="btn btn-primary" href="contact.html">Work with us</a><a class="btn btn-outline" href="services.html">Our services</a></div>', pos="center 25%") +
     media_split("collab", '''<div class="eyebrow">Who we are</div><h2>A partner built around your workforce challenges</h2>
  <p>We are a technology-focused staffing and workforce solutions company dedicated to supporting the evolving talent requirements of the Semiconductor, IT, and Engineering industries.</p>
  <p>In an industry where innovation drives progress, the right talent is essential to achieving business objectives.</p>
  <p>We understand that every organization has unique workforce challenges. From sourcing niche technical specialists to supporting large-scale engineering programs, our approach is built around understanding client requirements and delivering talent solutions that create meaningful value.</p>
  <p>Our expertise spans technical recruitment, workforce planning, talent sourcing, candidate engagement, and staffing solutions designed to support business growth.</p>
  <p>We strive to build lasting relationships with our clients and candidates through professionalism, transparency, and a commitment to excellence.</p>''') +
     media_split("microscope", '''<div class="eyebrow">Our Story</div><h2>Bridging the specialized talent gap</h2>
  <p>The technology industry continues to evolve, creating new opportunities and increasing demand for specialized professionals.</p>
  <p>At the same time, organizations face growing challenges in identifying and attracting talent with the right technical skills and industry experience.</p>
  <p>We established our focus on specialized staffing to help bridge this gap.</p>
  <p>By concentrating on Semiconductor, IT, and Engineering domains, we aim to develop a deeper understanding of technical requirements, industry expectations, and talent market dynamics.</p>
  <p>Our goal is to become a trusted partner for organizations seeking reliable talent solutions and professionals looking to advance their careers.</p>''', reverse=True, soft=True) + f'''
<section><div class="container grid g3">
  {card("target","Our Vision","To be a recognized and trusted talent solutions partner for technology and engineering organizations, enabling innovation through exceptional people.")}
  {card("bolt","Our Mission","To deliver specialized, flexible, and quality-driven workforce solutions that empower organizations to achieve their business objectives while creating meaningful career opportunities for professionals.")}
  {card("bulb","Our Philosophy","We believe that people are the foundation of innovation. Every successful project, technological breakthrough, and business transformation begins with individuals who bring knowledge, creativity, and commitment to their work.")}
</div></section>
{band("team", "People are the foundation of innovation.", "Every breakthrough begins with individuals who bring knowledge, creativity and commitment.")}
<section><div class="container"><div class="section-head center reveal"><div class="eyebrow">What guides us</div><h2>Our Core Values</h2></div>
<div class="grid g3 values">
{card("shield","Integrity &amp; Transparency","We believe in honest communication, ethical recruitment practices, and building relationships based on trust.")}
{card("handshake","Customer Commitment","We prioritize understanding our clients' business needs and delivering solutions aligned with their expectations.")}
{card("star","Quality &amp; Excellence","We focus on candidate relevance, professional standards, and continuous improvement across our recruitment processes.")}
{card("bulb","Innovation &amp; Adaptability","We embrace evolving technologies, recruitment methodologies, and workforce strategies to meet changing industry needs.")}
{card("heart","People First","We recognize the value of every professional and strive to create positive experiences for both clients and candidates.")}
</div></div></section>
{CTA}''')

# ================================================================ SERVICES
page("services.html", f"Services | {BRAND}", "Permanent recruitment, contract staffing, executive search and RPO.",
     split_hero("Services — Workforce Solutions", "Comprehensive Staffing Solutions for Technology-Driven Businesses",
                "The Right Talent. The Right Expertise. The Right Fit.", "interview2",
                '<div class="chips">' + "".join(f'<a class="chip" href="#{a}">{t}</a>' for a, t in SERVICES) + "</div>") + f'''
<section><div class="container"><div class="section-head reveal">
<p>Workforce requirements are constantly evolving across technology and engineering industries.</p>
<p>Organizations need staffing partners who can understand their business priorities, identify specialized talent, and provide flexible solutions that support operational efficiency and long-term growth.</p>
<p>We offer a comprehensive range of staffing services designed to meet diverse hiring requirements. Our solutions are tailored to support businesses at every stage of their workforce journey.</p></div></div></section>''' +
     media_split("interview", f'''<span class="pill">01</span><h2 style="margin-top:12px">Permanent Recruitment</h2>
  <p>We help organizations identify, attract, and recruit qualified professionals for permanent positions across Semiconductor, IT, and Engineering domains.</p>
  <p>Our permanent recruitment solutions focus on identifying candidates who align with technical requirements, organizational culture, and long-term business objectives.</p>
  <h3>Our capabilities include</h3>{checklist(["Technical and non-technical permanent hiring","Mid-level and senior-level recruitment","Specialized engineering recruitment","Leadership and niche talent acquisition","Candidate screening and shortlisting","Interview coordination and offer management"])}''', soft=True, anchor="permanent") +
     media_split("developer", f'''<span class="pill">02</span><h2 style="margin-top:12px">Contract Staffing</h2>
  <p class="tagline">Flexible Workforce Solutions. Specialized Technical Talent.</p>
  <p>We help organizations access skilled professionals for project-based, temporary, and long-term contract requirements across Semiconductor, IT, and Engineering industries.</p>
  <p>From niche semiconductor engineers and software developers to specialized engineering professionals, we provide flexible staffing solutions designed to support project execution, workforce agility, and business growth.</p>
  {checklist(["Specialized technical talent","Flexible workforce engagement","Project-based resource deployment","Contract-to-hire solutions","Global staffing support"])}
  <p class="quote" style="margin-top:20px">The Right Expertise. When You Need It.</p>''', reverse=True, anchor="contract") +
     media_split("exec", '''<span class="pill">03</span><h2 style="margin-top:12px">Executive Search &amp; Specialized Hiring</h2>
  <p class="tagline">Identifying Exceptional Leaders. Delivering Specialized Talent.</p>
  <p>The success of an organization depends on the quality of its leadership and the expertise of its people.</p>
  <p>In today's competitive business environment, identifying exceptional talent for critical positions requires more than conventional recruitment.</p>
  <p>It demands industry understanding, strategic talent mapping, targeted search methodologies, and the ability to engage professionals who possess the right experience, leadership capabilities, and technical expertise.</p>
  <p>As a Global Search &amp; Staffing Firm specializing in Semiconductor, IT, and Engineering, we help organizations identify, attract, and engage exceptional professionals for leadership positions, niche technical roles, and business-critical hiring requirements.</p>
  <p>From executive leadership appointments to highly specialized engineering recruitment, we deliver focused search solutions aligned with your business objectives.</p>
  <p class="quote">Exceptional Talent. Strategic Search. Lasting Impact.</p>''', soft=True, pos="center 20%", anchor="executive") +
     media_split("meeting", f'''<span class="pill">04</span><h2 style="margin-top:12px">Recruitment Process Outsourcing</h2>
  <p class="tagline">Strategic Recruitment. Specialized Talent. Scalable Hiring.</p>
  <p>At {BRAND}, we help organizations strengthen their talent acquisition capabilities through flexible, strategic, and scalable Recruitment Process Outsourcing (RPO) solutions. We work as an extension of your recruitment team, supporting hiring initiatives with specialized expertise, structured processes, and a focus on finding the right talent for your business.</p>
  <p>Whether you are expanding your engineering teams, building a new technology function, entering new markets, or managing high-volume recruitment, our RPO solutions are designed to adapt to your hiring goals and workforce requirements.</p>
  <p>With a strong focus on Semiconductor, IT, and Engineering, we bring industry knowledge and recruitment expertise together to help businesses identify, engage, and hire qualified professionals across technical and leadership roles.</p>''', reverse=True, anchor="rpo") + f'''
<section class="soft"><div class="container">
  <div class="split" style="align-items:start">
  <div class="reveal"><div class="eyebrow">Your Recruitment Partner, Aligned with Your Business</div>
  <p>Recruitment is more than filling vacancies. It is about building the capabilities that support business growth, innovation, and long-term success.</p>
  <p>Our RPO approach combines recruitment strategy, talent sourcing, candidate engagement, screening, and hiring coordination into a streamlined process. We collaborate closely with your HR and business teams to understand your organizational structure, technical requirements, hiring priorities, and company culture.</p>
  <p>By aligning recruitment activities with your business objectives, we help create a more consistent and effective hiring experience.</p></div>
  <div class="reveal"><h3 style="font-size:1.4rem">Flexible RPO Solutions for Every Hiring Need</h3>
  <p class="muted">Every organization has unique recruitment challenges. Our RPO solutions can be structured around your specific requirements, from individual hiring programs to broader recruitment support.</p></div>
  </div>
  <div class="grid g2" style="margin-top:28px">
  {card("layers","End-to-End Recruitment Process Outsourcing","We can manage agreed stages of the recruitment lifecycle, from understanding hiring requirements and developing sourcing strategies to candidate screening, interview coordination, offer support, and onboarding coordination. Our approach helps create a consistent recruitment process while allowing your internal teams to focus on core business priorities.")}
  {card("chart","Project-Based RPO","When your organization needs to hire a large number of professionals within a defined timeframe, our project-based RPO model provides focused recruitment support. Whether you are launching a new engineering facility, expanding a product development team, or scaling a technology program, we can align recruitment resources with your hiring plan and project timeline.")}
  </div>
</div></section>
{CTA}''')

# ================================================================ INDUSTRIES
IND = [
    ("chip", "Semiconductor &amp; Microelectronics", "Supporting semiconductor design companies, integrated device manufacturers, semiconductor manufacturing organizations, and technology companies developing advanced electronic systems."),
    ("group", "Information Technology", "Supporting software product companies, IT services organizations, digital transformation initiatives, and enterprise technology teams."),
    ("chip2", "Electronics &amp; Electrical Engineering", "Providing staffing solutions for organizations involved in electronic hardware, electrical systems, circuit design, and product engineering."),
    ("cpu", "Automotive &amp; Mobility", "Supporting automotive technology companies, electronics suppliers, embedded engineering teams, and advanced mobility initiatives."),
    ("microscope", "Aerospace &amp; Industrial Engineering", "Supporting specialized engineering requirements across systems engineering, hardware development, testing, validation, and industrial technology."),
    ("board", "Consumer Electronics", "Connecting organizations with professionals involved in product design, embedded software, electronics engineering, and hardware validation."),
    ("wires", "Telecommunications", "Supporting engineering and technology teams across networking, embedded systems, communication technologies, and software development."),
    ("code", "Artificial Intelligence &amp; Data Technologies", "Supporting organizations building intelligent applications, data platforms, machine learning solutions, and advanced technology products."),
]
page("industries.html", f"Industries We Serve | {BRAND}", "Specialized talent across technology-driven industries.",
     split_hero("Industries We Serve", "Specialized Talent Across Technology-Driven Industries",
                "Our recruitment expertise spans multiple industries where specialized technical knowledge and engineering capabilities are essential.", "lab",
                '<div class="hero-actions"><a class="btn btn-primary" href="contact.html?category=Client%20hiring%20inquiry">Discuss your hiring needs</a></div>') + f'''
<section><div class="container grid g4 ind-grid">
{"".join(f'<div class="img-card static reveal">{photo(k, "img", "(max-width: 640px) 100vw, (max-width: 960px) 50vw, 25vw")}<div class="img-card-body"><h3>{t}</h3><p>{d}</p></div></div>' for k, t, d in IND)}
</div></section>
{band("office", "Deep domain focus. Better hiring outcomes.", "We understand the technical requirements, skill sets and talent markets of every industry we serve.")}
{CTA}''')

# ================================================================ WHY CHOOSE US
page("why-choose-us.html", f"Why Choose Us | {BRAND}", "A recruitment partner that understands your business.",
     split_hero("Why Choose Us", "A Recruitment Partner That Understands Your Business",
                "Choosing the right staffing partner is an important business decision.", "handshake_l",
                '<div class="hero-actions"><a class="btn btn-primary" href="contact.html?category=Client%20hiring%20inquiry">Partner with us</a></div>') + f'''
<section><div class="container split">
  <div class="reveal"><p class="lead-dark">The right partner can help reduce recruitment complexity, improve access to specialized talent, and support the growth of your organization.</p>
  <p>We bring a focused approach to staffing across Semiconductor, IT, and Engineering industries.</p></div>
  <div class="stat-band reveal"><div>Semiconductor<span>Design to silicon</span></div><div>IT<span>Product &amp; enterprise</span></div><div>Engineering<span>Embedded to systems</span></div></div>
</div></section>
<section class="soft"><div class="container grid g4">
{card("target","Specialized Industry Focus","Our focus on technology and engineering enables us to understand technical job requirements, specialized skill sets, and industry-specific hiring challenges.")}
{card("gear","Technical Recruitment Understanding","We recognize the importance of technical alignment when hiring specialized professionals. Our recruitment approach considers relevant experience, technical competencies, project exposure, and role-specific requirements.")}
{card("search","Focused Talent Sourcing","We adopt targeted sourcing strategies designed to identify professionals with the skills and experience required for specialized positions.")}
{card("layers","Flexible Staffing Models","Our staffing solutions can be aligned with permanent hiring, contractual requirements, contract-to-hire engagements, and project-based workforce needs.")}
{card("users","Collaborative Client Engagement","We work closely with client stakeholders to understand requirements, maintain communication, and support recruitment coordination.")}
{card("star","Commitment to Quality","We prioritize candidate relevance, professional standards, and alignment with client expectations.")}
{card("chart","Scalable Workforce Support","We support organizations as their workforce requirements evolve, helping them access talent across different technical domains and experience levels.")}
{card("handshake","Long-Term Partnership Approach","We believe successful staffing relationships are built on trust, consistency, and mutual understanding. Our objective is to become a dependable talent partner for your current and future workforce requirements.")}
</div></section>''' +
     media_split("woman_desk", '''<div class="eyebrow">How we work</div><h2>A clear, collaborative hiring process</h2>
  <ol class="steps-list"><li><strong>Understand</strong> your requirements, team structure and culture.</li><li><strong>Source</strong> through targeted, domain-focused search.</li><li><strong>Evaluate</strong> candidates for technical and role alignment.</li><li><strong>Coordinate</strong> interviews, feedback and offers.</li><li><strong>Support</strong> onboarding and long-term workforce needs.</li></ol>''', reverse=True) + f'''
{CTA}''')

# ================================================================ CAREERS
APPLY_MODAL = '''<div class="modal" id="jobModal" role="dialog" aria-modal="true" aria-labelledby="jmTitle"><div class="modal-box">
<button class="modal-close" data-close aria-label="Close">&times;</button>
<div id="jmView"></div>
<hr style="border:0;border-top:1px solid var(--line);margin:24px 0">
<h3>Apply for this role</h3>
<form class="form" id="applyForm" novalidate>
  <input type="hidden" name="jobId">
  <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="row"><div><label>Full name <span class="req">*</span></label><input name="name" autocomplete="name" required><div class="field-error" data-err="name"></div></div>
  <div><label>Email <span class="req">*</span></label><input name="email" type="email" autocomplete="email" required><div class="field-error" data-err="email"></div></div></div>
  <div class="row"><div><label>Phone <span class="req">*</span></label><input name="phone" type="tel" autocomplete="tel" placeholder="+91 98xxxxxxxx" required><div class="field-error" data-err="phone"></div></div>
  <div><label>Total experience</label><select name="experience"><option value="">Select</option><option>Fresher</option><option>0-2 years</option><option>2-5 years</option><option>5-8 years</option><option>8-12 years</option><option>12-15 years</option><option>15+ years</option></select></div></div>
  <div class="row"><div><label>Current company</label><input name="currentCompany"></div>
  <div><label>Notice period</label><select name="noticePeriod"><option value="">Select</option><option>Immediate</option><option>15 days</option><option>30 days</option><option>60 days</option><option>90 days</option></select></div></div>
  <div class="row"><div><label>Current location</label><input name="location"></div>
  <div><label>LinkedIn / portfolio</label><input name="linkedin" type="url" placeholder="https://"></div></div>
  <div><label>Resume (PDF/DOC/DOCX, max 2 MB) <span class="req">*</span></label><input name="resume" type="file" accept=".pdf,.doc,.docx"><div class="field-error" data-err="resume"></div></div>
  <div><label>Cover note</label><textarea name="coverLetter" placeholder="Briefly tell us about your relevant experience"></textarea></div>
  <label class="check"><input type="checkbox" name="consent"> <span>I consent to Apex Global Search processing my information for recruitment purposes, including sharing my profile with prospective employers, as described in the <a href="privacy.html" target="_blank">Privacy Policy</a>.</span></label>
  <div class="field-error" data-err="consent"></div>
  <div class="field-error" data-err="jobId"></div>
  <div id="applyMsg" role="status"></div>
  <button class="btn btn-primary" type="submit">Submit application</button>
</form></div></div>'''

page("careers.html", f"Careers & Current Openings | {BRAND}", "Explore a career with Apex Global Search and current openings in Semiconductor, IT and Engineering.",
     split_hero("Careers", "People are at the heart of every innovation.",
                "Explore a career with Apex Global, or browse current openings with our clients across Semiconductor, IT, and Engineering.",
                "mindmap", '<div class="hero-actions"><a class="btn btn-primary" href="#openings">View current openings</a><a class="btn btn-outline" href="#" data-chat-open>Ask our assistant</a></div>') + f'''
<section id="openings" style="scroll-margin-top:90px"><div class="container">
  <div class="section-head reveal"><div class="eyebrow">Current Openings</div><h2>Find your next role</h2><p class="muted">Roles are updated by our recruitment team. Apply online in a couple of minutes.</p></div>
  <div class="filters"><input id="q" type="search" placeholder="Search by title, skill or location" aria-label="Search jobs">
  <select id="fDomain" aria-label="Domain"><option value="">All domains</option><option>Semiconductor</option><option>IT</option><option>Engineering</option></select>
  <select id="fType" aria-label="Employment type"><option value="">All types</option><option>Permanent</option><option>Contract</option><option>Contract-to-hire</option><option>Executive Search</option><option>RPO</option></select></div>
  <p class="muted small" id="jobCount" aria-live="polite"></p>
  <div id="jobs" class="grid g3" aria-live="polite"><div class="empty">Loading openings…</div></div>
  <p class="muted" style="margin-top:22px">Don&rsquo;t see a matching role? <a href="contact.html?category=Candidate%20%26%20career%20inquiry">Send us a career inquiry</a>.</p>
</div></section>''' +
     media_split("office", f'''<div class="eyebrow">Life at Apex Global</div><h2>Work at the intersection of talent and technology</h2>
  <p>At {BRAND}, we believe that people are at the heart of every innovation. Our work connects talented professionals with opportunities that help businesses grow, advance technology, and shape the future.</p>
  <p>As a search and staffing firm specializing in Semiconductor, IT, and Engineering, we work at the intersection of talent and technology. We are passionate about understanding people, recognizing potential, and creating meaningful connections between exceptional talent and ambitious organizations.</p>
  <p class="quote">If you are driven by curiosity, collaboration, and a desire to make a difference, we invite you to explore a career with {BRAND}.</p>''', soft=True) + f'''
<section><div class="container grid g3">
{card("chip","Be Part of a Growing Industry","Work in dynamic sectors that are shaping the future of technology, including semiconductor engineering, software development, embedded systems, and IT.")}
{card("heart","Make a Meaningful Impact","Every successful placement represents an opportunity for a professional to grow and an organization to strengthen its capabilities. Your work can make a real difference in people's careers and business outcomes.")}
{card("book","Learn and Grow","Recruitment is an evolving field that combines communication, market intelligence, relationship building, and business understanding. We encourage continuous learning and the development of new skills.")}
{card("users","Collaborate and Connect","We value teamwork, open communication, and the exchange of ideas. Our work brings us together with professionals, clients, and candidates from diverse backgrounds and technical disciplines.")}
{card("star","Develop Your Expertise","From understanding specialized technical roles to building talent networks and managing recruitment processes, you can develop valuable expertise in the talent acquisition industry.")}
<div class="card reveal card-photo">{photo("resume", "photo", "(max-width: 960px) 100vw, 33vw")}</div>
</div></section>
{APPLY_MODAL}''', '\n<script src="assets/js/careers.js" defer></script>')

# ================================================================ CONTACT
page("contact.html", f"Contact Us | {BRAND}", "Let's build your next team. Contact Apex Global Search.",
     split_hero("Contact Us", "Let&rsquo;s Build Your Next Team.",
                "Whether you are looking for specialized technical talent, planning a workforce expansion, or exploring recruitment partnership opportunities, Apex Global is here to understand your needs.",
                "woman_suit", '<div class="hero-actions"><a class="btn btn-primary" href="#contactForm">Send a message</a><a class="btn btn-outline" href="#" data-chat-open>Chat with us now</a></div>', pos="center 30%") + f'''
<section><div class="container split" style="align-items:start">
  <div class="reveal"><h2>How can we help?</h2><p>Connect with our team to discuss your hiring goals and explore a staffing solution aligned with your business requirements.</p>
  {checklist(["Client hiring inquiries","Staffing and workforce solution inquiries","Candidate and career inquiries","General business inquiries"])}
  <div class="next-steps"><h3>What happens next</h3><ol class="steps-list"><li><strong>We review</strong> your message and route it to the right specialist.</li><li><strong>We get in touch</strong> to understand your requirements in detail.</li><li><strong>We propose</strong> a staffing solution or matching opportunities.</li></ol></div>
  <div class="card" style="margin-top:22px">{icon("mail")}<h3>Looking for a job?</h3><p class="muted">Browse current openings and apply directly with your resume.</p><a class="btn btn-ghost" href="careers.html#openings">View openings</a></div></div>
  <div class="card form-card reveal"><form class="form" id="contactForm" novalidate style="scroll-margin-top:110px">
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div><label>Inquiry type <span class="req">*</span></label><select name="category">
      <option>Client hiring inquiry</option><option>Staffing &amp; workforce solutions</option><option>Candidate &amp; career inquiry</option><option>General business inquiry</option><option>Privacy request</option></select></div>
    <div class="row"><div><label>Full name <span class="req">*</span></label><input name="name" autocomplete="name"><div class="field-error" data-err="name"></div></div>
    <div><label>Email <span class="req">*</span></label><input name="email" type="email" autocomplete="email"><div class="field-error" data-err="email"></div></div></div>
    <div class="row"><div><label>Phone</label><input name="phone" type="tel" autocomplete="tel"><div class="field-error" data-err="phone"></div></div>
    <div><label>Company</label><input name="company" autocomplete="organization"></div></div>
    <div class="row"><div><label>Your job title</label><input name="jobTitle" autocomplete="organization-title"></div>
    <div><label>Subject</label><input name="subject"></div></div>
    <div><label>Message <span class="req">*</span></label><textarea name="message" placeholder="Roles, number of positions, locations, timelines…"></textarea><div class="field-error" data-err="message"></div></div>
    <label class="check"><input type="checkbox" name="consent"> <span>I agree that Apex Global Search may use these details to respond to my inquiry, as described in the <a href="privacy.html" target="_blank">Privacy Policy</a>.</span></label>
    <div class="field-error" data-err="consent"></div>
    <div id="contactMsg" role="status"></div>
    <button class="btn btn-primary" type="submit">Send message</button>
  </form></div>
</div></section>''', '\n<script src="assets/js/contact.js" defer></script>')

# ================================================================ PRIVACY
def ul(items): return "<ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"
old = (Path(__file__).resolve().parent / "privacy_body.html").read_text(encoding="utf-8")
page("privacy.html", f"Privacy Policy | {BRAND}", "How Apex Global Search collects, uses and protects personal information.",
     '<section class="hero page-hero"><div class="container"><div class="eyebrow">Legal</div><h1>Privacy Policy</h1><p class="lead">How we collect, use, disclose, and protect personal information.</p></div></section>' + old)

print("Generated:", ", ".join(sorted(p.name for p in OUT.glob("*.html"))))
