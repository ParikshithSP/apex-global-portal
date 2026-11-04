#!/usr/bin/env python3
"""Generates the 8 static pages of the public (User) site into ../public/.
Edit text here and re-run:  python3 tools/build_site.py
(The generated HTML is committed, so Netlify needs no build step.)"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public"
BRAND = "Apex Global"
TAG = "Global Search & Staffing Firm"

NAV = [
    ("index.html", "Home"),
    ("about.html", "About Us"),
    ("services.html", "Services"),
    ("industries.html", "Industries"),
    ("why-choose-us.html", "Why Choose Us"),
    ("careers.html", "Careers"),
]
SERVICES = [
    ("permanent", "Permanent Recruitment"),
    ("contract", "Contract Staffing"),
    ("executive", "Executive Search & Specialized Hiring"),
    ("rpo", "Recruitment Process Outsourcing (RPO)"),
]

I = {  # minimal inline icons (stroke = currentColor)
    "chip": '<path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/>',
    "code": '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
    "gear": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    "users": '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    "star": '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    "layers": '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    "heart": '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    "bulb": '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    "check": '<path d="M20 6L9 17l-5-5"/>',
    "car": '<path d="M5 17h14M5 17a2 2 0 1 1-4 0v-5l3-6h16l3 6v5a2 2 0 1 1-4 0"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    "plane": '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    "phone": '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    "wifi": '<path d="M5 12.6a10 10 0 0 1 14 0M8.5 16.1a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0"/><circle cx="12" cy="20" r="1"/>',
    "brain": '<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-3 3c0 1.3.8 2.4 2 2.8A3 3 0 0 0 6 17a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM15 3a3 3 0 0 1 3 3 3 3 0 0 1 3 3c0 1.3-.8 2.4-2 2.8A3 3 0 0 1 18 17a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3"/>',
    "bolt": '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    "handshake": '<path d="M11 17l2 2a1.4 1.4 0 0 0 2-2M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2L15 11M2 11l5-5 4 1 3-2 8 6-3 3M2 11l7 7"/>',
    "chart": '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>',
    "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    "book": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM20 22H6.5A2.5 2.5 0 0 1 4 19.5"/>',
}

def icon(name):
    return f'<div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{I[name]}</svg></div>'

def card(ic, title, text):
    return f'<div class="card">{icon(ic)}<h3>{title}</h3><p class="muted">{text}</p></div>'

def checklist(items):
    return '<ul class="checklist">' + "".join(f"<li>{x}</li>" for x in items) + "</ul>"

def header(active):
    items = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == active else ""
        if href == "services.html":
            sub = "".join(f'<li><a href="services.html#{a}">{t}</a></li>' for a, t in SERVICES)
            items.append(f'<li class="has-sub"><a href="{href}"{cur}>{label} ▾</a><ul class="submenu">{sub}</ul></li>')
        else:
            items.append(f'<li><a href="{href}"{cur}>{label}</a></li>')
    cur = ' aria-current="page"' if active == "contact.html" else ""
    items.append(f'<li class="cta"><a href="contact.html"{cur}>Contact Us</a></li>')
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="container nav">
  <a class="brand" href="index.html"><span class="brand-mark">AG</span><span>{BRAND.upper()}<small>{TAG}</small></span></a>
  <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
  <ul class="menu" id="menu">{"".join(items)}</ul>
</div></header>'''

FOOTER = f'''<footer class="site-footer"><div class="container">
  <div class="footer-grid">
    <div><a class="brand" href="index.html"><span class="brand-mark">AG</span><span>{BRAND.upper()}</span></a>
      <p style="margin-top:14px">{TAG}<br>Semiconductor &bull; IT &bull; Engineering</p>
      <p>Your Talent. Our Expertise. Shared Success.</p></div>
    <div><h4>Company</h4><ul><li><a href="about.html">About Us</a></li><li><a href="why-choose-us.html">Why Choose Us</a></li><li><a href="industries.html">Industries We Serve</a></li><li><a href="careers.html">Careers</a></li></ul></div>
    <div><h4>Services</h4><ul>{"".join(f'<li><a href="services.html#{a}">{t}</a></li>' for a, t in SERVICES)}</ul></div>
    <div><h4>Get in touch</h4><ul><li><a href="contact.html">Contact Us</a></li><li><a href="careers.html">Current Openings</a></li><li><a href="privacy.html">Privacy Policy</a></li></ul></div>
  </div>
  <div class="footer-bottom"><span>&copy; <span data-year></span> {BRAND}. All rights reserved.</span><span>Semiconductor &bull; IT &bull; Engineering</span></div>
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
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
{header(fname)}
<main id="main">
{body}
</main>
{FOOTER}
<script src="assets/js/site.js" defer></script>{scripts}
</body>
</html>
'''
    (OUT / fname).write_text(html, encoding="utf-8")

def hero(eyebrow, h1, lead, actions="", chips=False, cls="page-hero"):
    ch = '<div class="chips"><span class="chip">Semiconductor</span><span class="chip">Information Technology</span><span class="chip">Engineering</span></div>' if chips else ""
    return f'<section class="hero {cls}"><div class="container"><div class="eyebrow">{eyebrow}</div><h1>{h1}</h1><p class="lead">{lead}</p>{actions}{ch}</div></section>'

CTA = '''<section><div class="container"><div class="cta-band"><div><h2>Let&rsquo;s Build Your Next Team.</h2><p style="margin:0">Tell us about your hiring goals and we&rsquo;ll propose a staffing solution aligned with your business.</p></div>
<div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-primary" href="contact.html">Talk to our team</a><a class="btn btn-outline" href="careers.html">View openings</a></div></div></div></section>'''

# ---------------- HOME ----------------
page("index.html", f"{BRAND} | Engineering Talent. Accelerating Innovation.",
     "Specialized staffing solutions for Semiconductor, IT and Engineering industries.",
     hero("Global Search &amp; Staffing Firm", "Engineering Talent. Accelerating Innovation.",
          "Specialized Staffing Solutions for Semiconductor, IT &amp; Engineering Industries",
          '<div class="hero-actions"><a class="btn btn-primary" href="contact.html">Hire Talent</a><a class="btn btn-outline" href="careers.html">Explore Openings</a></div>',
          chips=True, cls="") + f'''
<section><div class="container split">
  <div><div class="eyebrow">Who we are</div><h2>We connect talent with opportunity.</h2>
  <p>We are a specialized staffing and workforce solutions company focused on connecting businesses with highly skilled professionals across Semiconductor, IT, and Engineering domains.</p>
  <p>From advanced semiconductor design and verification to software development, embedded systems, and engineering operations, we help organizations build the teams that drive innovation and business growth.</p>
  <p>Our industry-focused recruitment approach, technical understanding, and commitment to quality enable us to deliver talent solutions aligned with your business objectives.</p>
  <p class="quote">We connect talent with opportunity. We connect innovation with execution.</p></div>
  <div class="grid">{card("chip","Semiconductor","Design, verification, physical design and silicon engineering talent.")}{card("code","Information Technology","Software development, product engineering and enterprise technology teams.")}{card("gear","Engineering","Embedded systems, electronics, hardware and engineering operations.")}</div>
</div></section>
<section class="soft"><div class="container split">
  <div class="panel"><div class="eyebrow">Shared success</div><h3 style="font-size:1.6rem">Your Talent. Our Expertise. Shared Success.</h3>
  <p>Technology is advancing at an unprecedented pace. Organizations need skilled professionals who can adapt, innovate, and deliver results.</p>
  <p>We understand the challenges of identifying specialized technical talent in competitive markets.</p>
  <p style="margin:0">Our approach combines industry knowledge, focused recruitment strategies, and a commitment to building meaningful partnerships.</p></div>
  <div><h2>Move forward with confidence</h2><p>Whether you are scaling a semiconductor design team, strengthening your IT capabilities, or expanding engineering operations, we provide workforce solutions that help you move forward with confidence.</p>
  <a class="btn btn-dark" href="services.html">Explore our services</a></div>
</div></section>
<section><div class="container"><div class="section-head center"><div class="eyebrow">Value</div><h2>What We Bring to Your Business</h2></div>
<div class="grid g4">
{card("star","Specialized expertise","Specialized recruitment expertise across technology-driven industries.")}
{card("users","Skilled professionals","Access to skilled and experienced technical professionals.")}
{card("layers","Flexible models","Flexible staffing models aligned with business requirements.")}
{card("target","Niche sourcing","Focused sourcing for niche and hard-to-fill positions.")}
{card("check","Quality evaluation","Quality-driven candidate evaluation.")}
{card("handshake","Responsive engagement","Collaborative and responsive client engagement.")}
{card("chart","Scalable solutions","Scalable talent solutions for evolving workforce demands.")}
{card("bolt","Speed to hire","Structured processes that keep critical hiring moving.")}
</div></div></section>
<section class="soft"><div class="container"><div class="section-head"><div class="eyebrow">Services</div><h2>Workforce solutions for every stage</h2></div>
<div class="grid g4">
{card("search","Permanent Recruitment",'Identify and hire qualified professionals for permanent roles. <a href="services.html#permanent">Learn more →</a>')}
{card("clock","Contract Staffing",'Flexible, project-based and contract-to-hire talent. <a href="services.html#contract">Learn more →</a>')}
{card("star","Executive Search",'Leadership and niche, business-critical hiring. <a href="services.html#executive">Learn more →</a>')}
{card("layers","RPO",'Scalable recruitment as an extension of your team. <a href="services.html#rpo">Learn more →</a>')}
</div></div></section>
{CTA}''')

# ---------------- ABOUT ----------------
page("about.html", f"About Us | {BRAND}", "Empowering businesses through specialized talent solutions.",
     hero("About Us", "Empowering Businesses Through Specialized Talent Solutions",
          "A technology-focused staffing and workforce solutions company supporting the Semiconductor, IT, and Engineering industries.") + f'''
<section><div class="container split">
  <div><p>We are a technology-focused staffing and workforce solutions company dedicated to supporting the evolving talent requirements of the Semiconductor, IT, and Engineering industries.</p>
  <p>In an industry where innovation drives progress, the right talent is essential to achieving business objectives.</p>
  <p>We understand that every organization has unique workforce challenges. From sourcing niche technical specialists to supporting large-scale engineering programs, our approach is built around understanding client requirements and delivering talent solutions that create meaningful value.</p>
  <p>Our expertise spans technical recruitment, workforce planning, talent sourcing, candidate engagement, and staffing solutions designed to support business growth.</p>
  <p>We strive to build lasting relationships with our clients and candidates through professionalism, transparency, and a commitment to excellence.</p></div>
  <div class="panel"><div class="eyebrow">Our Story</div>
  <p>The technology industry continues to evolve, creating new opportunities and increasing demand for specialized professionals.</p>
  <p>At the same time, organizations face growing challenges in identifying and attracting talent with the right technical skills and industry experience.</p>
  <p>We established our focus on specialized staffing to help bridge this gap.</p>
  <p>By concentrating on Semiconductor, IT, and Engineering domains, we aim to develop a deeper understanding of technical requirements, industry expectations, and talent market dynamics.</p>
  <p style="margin:0">Our goal is to become a trusted partner for organizations seeking reliable talent solutions and professionals looking to advance their careers.</p></div>
</div></section>
<section class="soft"><div class="container grid g3">
  {card("target","Our Vision","To be a recognized and trusted talent solutions partner for technology and engineering organizations, enabling innovation through exceptional people.")}
  {card("bolt","Our Mission","To deliver specialized, flexible, and quality-driven workforce solutions that empower organizations to achieve their business objectives while creating meaningful career opportunities for professionals.")}
  {card("bulb","Our Philosophy","We believe that people are the foundation of innovation. Every successful project, technological breakthrough, and business transformation begins with individuals who bring knowledge, creativity, and commitment to their work.")}
</div></section>
<section><div class="container"><div class="section-head center"><div class="eyebrow">What guides us</div><h2>Our Core Values</h2></div>
<div class="grid g3">
{card("shield","Integrity &amp; Transparency","We believe in honest communication, ethical recruitment practices, and building relationships based on trust.")}
{card("handshake","Customer Commitment","We prioritize understanding our clients' business needs and delivering solutions aligned with their expectations.")}
{card("star","Quality &amp; Excellence","We focus on candidate relevance, professional standards, and continuous improvement across our recruitment processes.")}
{card("bulb","Innovation &amp; Adaptability","We embrace evolving technologies, recruitment methodologies, and workforce strategies to meet changing industry needs.")}
{card("heart","People First","We recognize the value of every professional and strive to create positive experiences for both clients and candidates.")}
</div></div></section>
{CTA}''')

# ---------------- SERVICES ----------------
page("services.html", f"Services | {BRAND}", "Permanent recruitment, contract staffing, executive search and RPO.",
     hero("Services — Workforce Solutions", "Comprehensive Staffing Solutions for Technology-Driven Businesses",
          "The Right Talent. The Right Expertise. The Right Fit.",
          '<div class="chips">' + "".join(f'<a class="chip" href="#{a}">{t}</a>' for a, t in SERVICES) + "</div>") + f'''
<section><div class="container"><div class="section-head">
<p>Workforce requirements are constantly evolving across technology and engineering industries.</p>
<p>Organizations need staffing partners who can understand their business priorities, identify specialized talent, and provide flexible solutions that support operational efficiency and long-term growth.</p>
<p>We offer a comprehensive range of staffing services designed to meet diverse hiring requirements. Our solutions are tailored to support businesses at every stage of their workforce journey.</p></div></div></section>

<section class="soft service-block" id="permanent"><div class="container split">
  <div><span class="pill">01</span><h2 style="margin-top:12px">Permanent Recruitment</h2>
  <p>We help organizations identify, attract, and recruit qualified professionals for permanent positions across Semiconductor, IT, and Engineering domains.</p>
  <p>Our permanent recruitment solutions focus on identifying candidates who align with technical requirements, organizational culture, and long-term business objectives.</p></div>
  <div class="card"><h3>Our capabilities include</h3>{checklist(["Technical and non-technical permanent hiring","Mid-level and senior-level recruitment","Specialized engineering recruitment","Leadership and niche talent acquisition","Candidate screening and shortlisting","Interview coordination and offer management"])}</div>
</div></section>

<section class="service-block" id="contract"><div class="container split">
  <div><span class="pill">02</span><h2 style="margin-top:12px">Contract Staffing</h2>
  <p class="tagline">Flexible Workforce Solutions. Specialized Technical Talent.</p>
  <p>We help organizations access skilled professionals for project-based, temporary, and long-term contract requirements across Semiconductor, IT, and Engineering industries.</p>
  <p>From niche semiconductor engineers and software developers to specialized engineering professionals, we provide flexible staffing solutions designed to support project execution, workforce agility, and business growth.</p>
  <p class="quote">The Right Expertise. When You Need It.</p></div>
  <div class="card"><h3>What you get</h3>{checklist(["Specialized technical talent","Flexible workforce engagement","Project-based resource deployment","Contract-to-hire solutions","Global staffing support"])}</div>
</div></section>

<section class="soft service-block" id="executive"><div class="container split">
  <div><span class="pill">03</span><h2 style="margin-top:12px">Executive Search &amp; Specialized Hiring</h2>
  <p class="tagline">Identifying Exceptional Leaders. Delivering Specialized Talent.</p>
  <p>The success of an organization depends on the quality of its leadership and the expertise of its people.</p>
  <p>In today's competitive business environment, identifying exceptional talent for critical positions requires more than conventional recruitment.</p>
  <p>It demands industry understanding, strategic talent mapping, targeted search methodologies, and the ability to engage professionals who possess the right experience, leadership capabilities, and technical expertise.</p></div>
  <div class="panel"><p>As a Global Search &amp; Staffing Firm specializing in Semiconductor, IT, and Engineering, we help organizations identify, attract, and engage exceptional professionals for leadership positions, niche technical roles, and business-critical hiring requirements.</p>
  <p>From executive leadership appointments to highly specialized engineering recruitment, we deliver focused search solutions aligned with your business objectives.</p>
  <h3 style="margin:0">Exceptional Talent. Strategic Search. Lasting Impact.</h3></div>
</div></section>

<section class="service-block" id="rpo"><div class="container">
  <div class="split" style="align-items:start">
  <div><span class="pill">04</span><h2 style="margin-top:12px">Recruitment Process Outsourcing</h2>
  <p class="tagline">Strategic Recruitment. Specialized Talent. Scalable Hiring.</p>
  <p>At {BRAND}, we help organizations strengthen their talent acquisition capabilities through flexible, strategic, and scalable Recruitment Process Outsourcing (RPO) solutions. We work as an extension of your recruitment team, supporting hiring initiatives with specialized expertise, structured processes, and a focus on finding the right talent for your business.</p>
  <p>Whether you are expanding your engineering teams, building a new technology function, entering new markets, or managing high-volume recruitment, our RPO solutions are designed to adapt to your hiring goals and workforce requirements.</p>
  <p>With a strong focus on Semiconductor, IT, and Engineering, we bring industry knowledge and recruitment expertise together to help businesses identify, engage, and hire qualified professionals across technical and leadership roles.</p></div>
  <div class="card"><h3>Your Recruitment Partner, Aligned with Your Business</h3>
  <p>Recruitment is more than filling vacancies. It is about building the capabilities that support business growth, innovation, and long-term success.</p>
  <p>Our RPO approach combines recruitment strategy, talent sourcing, candidate engagement, screening, and hiring coordination into a streamlined process. We collaborate closely with your HR and business teams to understand your organizational structure, technical requirements, hiring priorities, and company culture.</p>
  <p>By aligning recruitment activities with your business objectives, we help create a more consistent and effective hiring experience.</p></div>
  </div>
  <div class="section-head" style="margin-top:48px"><h3 style="font-size:1.5rem">Flexible RPO Solutions for Every Hiring Need</h3>
  <p class="muted">Every organization has unique recruitment challenges. Our RPO solutions can be structured around your specific requirements, from individual hiring programs to broader recruitment support.</p></div>
  <div class="grid g2">
  {card("layers","End-to-End Recruitment Process Outsourcing","We can manage agreed stages of the recruitment lifecycle, from understanding hiring requirements and developing sourcing strategies to candidate screening, interview coordination, offer support, and onboarding coordination. Our approach helps create a consistent recruitment process while allowing your internal teams to focus on core business priorities.")}
  {card("chart","Project-Based RPO","When your organization needs to hire a large number of professionals within a defined timeframe, our project-based RPO model provides focused recruitment support. Whether you are launching a new engineering facility, expanding a product development team, or scaling a technology program, we can align recruitment resources with your hiring plan and project timeline.")}
  </div>
</div></section>
{CTA}''')

# ---------------- INDUSTRIES ----------------
page("industries.html", f"Industries We Serve | {BRAND}", "Specialized talent across technology-driven industries.",
     hero("Industries We Serve", "Specialized Talent Across Technology-Driven Industries",
          "Our recruitment expertise spans multiple industries where specialized technical knowledge and engineering capabilities are essential.") + f'''
<section><div class="container grid g4">
{card("chip","Semiconductor &amp; Microelectronics","Supporting semiconductor design companies, integrated device manufacturers, semiconductor manufacturing organizations, and technology companies developing advanced electronic systems.")}
{card("code","Information Technology","Supporting software product companies, IT services organizations, digital transformation initiatives, and enterprise technology teams.")}
{card("bolt","Electronics &amp; Electrical Engineering","Providing staffing solutions for organizations involved in electronic hardware, electrical systems, circuit design, and product engineering.")}
{card("car","Automotive &amp; Mobility","Supporting automotive technology companies, electronics suppliers, embedded engineering teams, and advanced mobility initiatives.")}
{card("plane","Aerospace &amp; Industrial Engineering","Supporting specialized engineering requirements across systems engineering, hardware development, testing, validation, and industrial technology.")}
{card("phone","Consumer Electronics","Connecting organizations with professionals involved in product design, embedded software, electronics engineering, and hardware validation.")}
{card("wifi","Telecommunications","Supporting engineering and technology teams across networking, embedded systems, communication technologies, and software development.")}
{card("brain","Artificial Intelligence &amp; Data Technologies","Supporting organizations building intelligent applications, data platforms, machine learning solutions, and advanced technology products.")}
</div></section>
{CTA}''')

# ---------------- WHY CHOOSE US ----------------
page("why-choose-us.html", f"Why Choose Us | {BRAND}", "A recruitment partner that understands your business.",
     hero("Why Choose Us", "A Recruitment Partner That Understands Your Business",
          "Choosing the right staffing partner is an important business decision.") + f'''
<section><div class="container split">
  <div><p>The right partner can help reduce recruitment complexity, improve access to specialized talent, and support the growth of your organization.</p>
  <p>We bring a focused approach to staffing across Semiconductor, IT, and Engineering industries.</p></div>
  <div class="stat-band"><div>Semiconductor<span>Design to silicon</span></div><div>IT<span>Product &amp; enterprise</span></div><div>Engineering<span>Embedded to systems</span></div></div>
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
</div></section>
{CTA}''')

# ---------------- CAREERS ----------------
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
  <label class="check"><input type="checkbox" name="consent"> <span>I consent to Apex Global processing my information for recruitment purposes, including sharing my profile with prospective employers, as described in the <a href="privacy.html" target="_blank">Privacy Policy</a>.</span></label>
  <div class="field-error" data-err="consent"></div>
  <div class="field-error" data-err="jobId"></div>
  <div id="applyMsg" role="status"></div>
  <button class="btn btn-primary" type="submit">Submit application</button>
</form></div></div>'''

page("careers.html", f"Careers & Current Openings | {BRAND}", "Explore a career with Apex Global and current openings in Semiconductor, IT and Engineering.",
     hero("Careers", "People are at the heart of every innovation.",
          "Explore a career with Apex Global, or browse current openings with our clients across Semiconductor, IT, and Engineering.",
          '<div class="hero-actions"><a class="btn btn-primary" href="#openings">View current openings</a></div>') + f'''
<section><div class="container split">
  <div><p>At {BRAND}, we believe that people are at the heart of every innovation. Our work connects talented professionals with opportunities that help businesses grow, advance technology, and shape the future.</p>
  <p>As a search and staffing firm specializing in Semiconductor, IT, and Engineering, we work at the intersection of talent and technology. We are passionate about understanding people, recognizing potential, and creating meaningful connections between exceptional talent and ambitious organizations.</p>
  <p class="quote">If you are driven by curiosity, collaboration, and a desire to make a difference, we invite you to explore a career with {BRAND}.</p></div>
  <div class="grid">{card("chip","Be Part of a Growing Industry","Work in dynamic sectors that are shaping the future of technology, including semiconductor engineering, software development, embedded systems, and IT.")}{card("heart","Make a Meaningful Impact","Every successful placement represents an opportunity for a professional to grow and an organization to strengthen its capabilities. Your work can make a real difference in people's careers and business outcomes.")}</div>
</div></section>
<section class="soft"><div class="container grid g3">
{card("book","Learn and Grow","Recruitment is an evolving field that combines communication, market intelligence, relationship building, and business understanding. We encourage continuous learning and the development of new skills.")}
{card("users","Collaborate and Connect","We value teamwork, open communication, and the exchange of ideas. Our work brings us together with professionals, clients, and candidates from diverse backgrounds and technical disciplines.")}
{card("star","Develop Your Expertise","From understanding specialized technical roles to building talent networks and managing recruitment processes, you can develop valuable expertise in the talent acquisition industry.")}
</div></section>
<section id="openings" style="scroll-margin-top:80px"><div class="container">
  <div class="section-head"><div class="eyebrow">Current Openings</div><h2>Find your next role</h2><p class="muted">Roles are updated by our recruitment team. Apply online in a couple of minutes.</p></div>
  <div class="filters"><input id="q" type="search" placeholder="Search by title, skill or location" aria-label="Search jobs">
  <select id="fDomain" aria-label="Domain"><option value="">All domains</option><option>Semiconductor</option><option>IT</option><option>Engineering</option></select>
  <select id="fType" aria-label="Employment type"><option value="">All types</option><option>Permanent</option><option>Contract</option><option>Contract-to-hire</option><option>Executive Search</option><option>RPO</option></select></div>
  <div id="jobs" class="grid g3" aria-live="polite"><div class="empty">Loading openings…</div></div>
  <p class="muted" style="margin-top:22px">Don&rsquo;t see a matching role? <a href="contact.html?category=Candidate%20%26%20career%20inquiry">Send us a career inquiry</a>.</p>
</div></section>
{APPLY_MODAL}''', '\n<script src="assets/js/careers.js" defer></script>')

# ---------------- CONTACT ----------------
page("contact.html", f"Contact Us | {BRAND}", "Let's build your next team. Contact Apex Global.",
     hero("Contact Us", "Let&rsquo;s Build Your Next Team.",
          "Whether you are looking for specialized technical talent, planning a workforce expansion, or exploring recruitment partnership opportunities, Apex Global is here to understand your needs.") + f'''
<section><div class="container split" style="align-items:start">
  <div><h2>How can we help?</h2><p>Connect with our team to discuss your hiring goals and explore a staffing solution aligned with your business requirements.</p>
  {checklist(["Client hiring inquiries","Staffing and workforce solution inquiries","Candidate and career inquiries","General business inquiries"])}
  <div class="card" style="margin-top:26px">{icon("mail")}<h3>Looking for a job?</h3><p class="muted">Browse current openings and apply directly with your resume.</p><a class="btn btn-ghost" href="careers.html#openings">View openings</a></div></div>
  <div class="card"><form class="form" id="contactForm" novalidate>
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
    <label class="check"><input type="checkbox" name="consent"> <span>I agree that Apex Global may use these details to respond to my inquiry, as described in the <a href="privacy.html" target="_blank">Privacy Policy</a>.</span></label>
    <div class="field-error" data-err="consent"></div>
    <div id="contactMsg" role="status"></div>
    <button class="btn btn-primary" type="submit">Send message</button>
  </form></div>
</div></section>''', '\n<script src="assets/js/contact.js" defer></script>')

# ---------------- PRIVACY ----------------
def ul(items): return "<ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"
page("privacy.html", f"Privacy Policy | {BRAND}", "How Apex Global collects, uses and protects personal information.",
     hero("Legal", "Privacy Policy", "How we collect, use, disclose, and protect personal information.") + f'''
<section><div class="container prose">
<div class="note"><strong>Draft notice:</strong> This draft is intended as website content and should be reviewed and adapted to reflect the company&rsquo;s actual practices, locations, and applicable legal requirements before publication.</div>
<p style="margin-top:24px">This Privacy Policy explains how Apex Global (&ldquo;Apex Global,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) may collect, use, disclose, and protect personal information when you visit our website, contact us, submit a resume, apply for a role, or use our recruitment and staffing services.</p>
<h2>1. Information We May Collect</h2><p>Depending on how you interact with us, we may collect information such as:</p>
{ul(["Contact details, including name, email address, telephone number, and business contact information.","Professional and recruitment information, including resume/CV details, employment history, education, skills, qualifications, certifications, portfolio or profile links, and career preferences.","Hiring and business information, including company name, job title, role requirements, staffing needs, and communications with our team.","Information you provide in forms, messages, interviews, or other communications.","Website and technical information, which may include IP address, browser and device details, pages viewed, approximate usage data, and cookie or similar technology data, depending on the tools enabled on the website."])}
<p>Please do not submit sensitive personal information unless it is specifically requested for a legitimate purpose and you have been given appropriate instructions.</p>
<h2>2. How We Use Information</h2><p>We may use personal information for purposes such as:</p>
{ul(["Responding to inquiries and communicating with clients, candidates, and website visitors.","Providing recruitment, staffing, executive search, and workforce solutions.","Reviewing candidate profiles and considering individuals for relevant employment opportunities.","Managing recruitment processes, interviews, candidate submissions, and hiring coordination.","Understanding client hiring requirements and delivering agreed services.","Operating, maintaining, securing, and improving our website and services.","Managing records, preventing misuse, and meeting applicable legal or regulatory obligations."])}
<h2>3. Legal Basis and Consent</h2><p>Where applicable law requires a legal basis for processing personal information, we will process it on a basis permitted by that law, such as consent, steps taken at your request, performance of a contract, legitimate interests, or compliance with legal obligations. Where consent is relied upon, you may be able to withdraw it, subject to applicable law and any necessary continued processing.</p>
<h2>4. Sharing of Information</h2><p>We may share personal information, where appropriate and permitted, with relevant parties such as:</p>
{ul(["Clients and prospective employers for recruitment consideration, where relevant to a candidate and consistent with applicable requirements.","Service providers supporting website hosting, recruitment systems, communications, security, analytics, or business operations.","Professional advisers, regulators, public authorities, or other parties where required by law or necessary to protect rights, safety, or legitimate interests.","Other parties with your direction or consent, where applicable."])}
<p>We do not state that personal information is sold. Any data-sharing practices should be confirmed against Apex Global&rsquo;s actual operations and applicable law before this policy is published.</p>
<h2>5. International Data Transfers</h2><p>Because recruitment and staffing activities may involve clients, candidates, or service providers in different locations, personal information may be processed or transferred across borders where necessary for the purposes described in this policy. Where required, appropriate safeguards will be used in accordance with applicable law.</p>
<h2>6. Data Retention</h2><p>We retain personal information for as long as reasonably necessary for the purposes for which it was collected, including recruitment, client service, recordkeeping, dispute resolution, and legal or regulatory requirements. Retention periods may vary based on the type of information, the relevant relationship, and applicable law. We will take steps to delete or de-identify information when it is no longer required, where appropriate and legally permitted.</p>
<h2>7. Data Security</h2><p>We use reasonable administrative, technical, and organizational measures designed to protect personal information against unauthorized access, loss, misuse, alteration, or disclosure. No method of transmission or storage can be guaranteed to be completely secure.</p>
<h2>8. Cookies and Similar Technologies</h2><p>Our website may use cookies or similar technologies to support essential functionality, remember preferences, understand website usage, or improve performance. The types of cookies used depend on the tools and settings implemented on the website. Where required, we will provide appropriate notice and obtain consent before using non-essential cookies. You may be able to manage cookies through your browser settings or any cookie preference tool provided on the website.</p>
<h2>9. Your Privacy Rights</h2><p>Depending on your location and applicable law, you may have rights to request access to, correction or deletion of, or a copy of your personal information; object to or restrict certain processing; withdraw consent; or raise a complaint with a relevant authority. To make a request, <a href="contact.html?category=Privacy%20request">contact us</a> using the details below. We may need to verify your identity and may be unable to fulfill certain requests where an exception applies under applicable law.</p>
<h2>10. Candidate Information</h2><p>If you submit a resume or professional profile, we may use the information to assess your suitability for roles, communicate about opportunities, and share relevant details with clients for recruitment consideration. Please ensure that the information you provide is accurate and that you have the right to share any information about other individuals. You may contact us to update your profile or ask about its retention.</p>
<h2>11. Third-Party Websites</h2><p>Our website may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those third parties. Please review their privacy notices before providing personal information.</p>
<h2>12. Children&rsquo;s Privacy</h2><p>Our website and recruitment services are not intended for children, and we do not knowingly collect personal information from children through the website. If you believe a child has provided us with personal information, please contact us so that we can review and take appropriate action.</p>
<h2>13. Changes to This Privacy Policy</h2><p>We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal requirements. The updated version will be posted on this page with a revised &ldquo;Last Updated&rdquo; date.</p>
<h2>14. Contact Us</h2><p>For questions, requests, or concerns relating to this Privacy Policy or your personal information, please contact Apex Global using the details below:</p>
{ul(["Company: Apex Global [confirm full legal entity name]","Privacy Contact / Email: [insert monitored privacy or contact email]","Business Address: [insert registered or business address, if appropriate]"])}
<p><strong>Last Updated:</strong> [Insert date]</p>
</div></section>''')

print("Generated:", ", ".join(sorted(p.name for p in OUT.glob("*.html"))))
