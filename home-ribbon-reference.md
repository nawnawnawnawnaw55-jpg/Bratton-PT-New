# Home Ribbon / Navigation Bar — Complete Reference

> **Bratton Physical Therapy** — `bratton-pt-v3`  
> Last updated: 2026-07-14

---

## 1. Overview

The "home ribbon" is the site-wide navigation bar (Home, About Us, Conditions, Services, Patient Center, Contact) that appears below the logo/contact header and sticks to the top of the viewport when the user scrolls.

It is assembled from three layers:

| Layer | Source | Role |
|-------|--------|------|
| **HTML Template** | `templates/header.html` | Provides both `header` (logo, contact) and `nav` (ribbon links) |
| **CSS** | `css/header.css` + `css/header-angular.css` + `css/main.css` | Styling, sticky behavior, mobile drawer, color accents |
| **JavaScript** | `index.html` (inline) + `js/main.js` | Injects the template into the DOM, wires up mobile menu toggle, scroll-aware hide/show, dynamic height measurement |

---

## 2. DOM Structure (Final Rendered)

After the inline fetch script in `index.html` runs, the `<body>` contains these siblings:

```
<body>
  <div id="site-header">
    <!-- skip-to-content link -->
    <!-- <header class="header"> ... logo, contact, hamburger ... </header> -->
  </div>

  <nav id="main-nav" class="nav nav--mobile">
    <!-- <div class="container"> ... nav__links, dropdowns ... </div> -->
  </nav>

  <main id="main-content">
    <!-- page content -->
  </main>

  <div id="site-footer">...</div>
</body>
```

**Critical:** `#main-nav` is a direct child of `<body>`, _not_ nested inside `#site-header`. This is required for `position: sticky` to work — a sticky element must be a direct child of a scrollable ancestor. If `#main-nav` were inside `#site-header`, it would be constrained by `#site-header`'s height and could not stick.

---

## 3. Template Source — `templates/header.html`

**Full file (23 lines):**

```html
<a href="#main-content" class="sr-only" style="position:absolute;top:0;left:0;z-index:9999;padding:8px;background:var(--primary);color:#ffffff">Skip to main content</a>

<header class="header">
  <div class="container"><div class="header__top">
    <a href="/" class="header__logo"><img src="/files/logo/BRATTON-ai.svg" width="200" height="89" alt="Bratton Physical Therapy"></a>
    <div class="header__contact">
      <div class="header__address"><a href="/location/" style="color:inherit;text-decoration:none"><svg width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-miterlimit="10"><defs><mask id="pinHoleMask" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><rect x="0" y="0" width="16" height="16" fill="white"/><circle cx="8" cy="5.15" r="1.9" fill="black"/></mask></defs><path d="M4.2,7.1l0.1,0.2l0.2,0.3l2.9,4.7c0.2,0.4,0.8,0.6,1.2,0.3c0.1-0.1,0.2-0.2,0.3-0.3L11.8,7c0.2-0.4,0.4-1.2,0.4-1.6c-0.1-2.3-2-4.1-4.3-4.1C5.7,1.2,3.8,3,3.7,5.3C3.7,5.9,3.9,6.6,4.2,7.1z" fill="currentColor" mask="url(#pinHoleMask)"/><circle cx="8" cy="5.15" r="1.9" fill="none" stroke="currentColor"/><path d="M9.8,11c1.6,0.3,2.7,1,2.7,1.8c0,1.1-2,2-4.5,2s-4.5-0.9-4.5-2c0-0.8,1.2-1.6,2.8-1.8"/></svg>1346 Lindberg Drive Suite 3, Slidell, LA 70458</a></div>
      <div class="header__phone"><span class="header__label">Call Now:</span><a href="tel:9856415825"><span class="header__icon"><svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5562 12.9062L16.1007 13.359C16.1007 13.359 15.0181 14.4355 12.0631 11.4972C9.10812 8.55901 10.1907 7.48257 10.1907 7.48257L10.4775 7.19738C11.1841 6.49484 11.2507 5.36691 10.6342 4.54348L9.37326 2.85908C8.61028 1.83992 7.13596 1.70529 6.26145 2.57483L4.69185 4.13552C4.25823 4.56668 3.96765 5.12559 4.00289 5.74561C4.09304 7.33182 4.81071 10.7447 8.81536 14.7266C13.0621 18.9492 17.0468 19.117 18.6763 18.9651C19.1917 18.9171 19.6399 18.6546 20.0011 18.2954L21.4217 16.883C22.3806 15.9295 22.1102 14.2949 20.8833 13.628L18.9728 12.5894C18.1672 12.1515 17.1858 12.2801 16.5562 12.9062Z" fill="currentColor"/></svg></span> (985) 641-5825</a></div>
    </div>
    <a href="/location/" class="header__mobile-cta" style="background:var(--primary)"><svg width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-miterlimit="10"><path d="M4.2,7.1l0.1,0.2l0.2,0.3l2.9,4.7c0.2,0.4,0.8,0.6,1.2,0.3c0.1-0.1,0.2-0.2,0.3-0.3L11.8,7c0.2-0.4,0.4-1.2,0.4-1.6c-0.1-2.3-2-4.1-4.3-4.1C5.7,1.2,3.8,3,3.7,5.3C3.7,5.9,3.9,6.6,4.2,7.1z"/><circle cx="8" cy="5.15" r="1.9"/><path d="M9.8,11c1.6,0.3,2.7,1,2.7,1.8c0,1.1-2,2-4.5,2s-4.5-0.9-4.5-2c0-0.8,1.2-1.6,2.8-1.8"/></svg> Location</a>
    <a href="/booking/" class="header__mobile-cta"><svg class="svg-icon" style="width:1em;height:1em;vertical-align:middle;fill:currentColor;overflow:hidden" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M440.6 834.15H169.84c-20.48 0-37.14-16.67-37.14-37.15V419.47h717.09v21.29c0 18.12 14.68 32.8 32.8 32.8s32.8-14.68 32.8-32.8V254.11c0-56.65-46.09-102.74-102.75-102.74h-77.23v-41.16c0-18.12-14.69-32.8-32.8-32.8s-32.8 14.69-32.8 32.8v41.16H317.88v-41.16c0-18.12-14.69-32.8-32.8-32.8-18.12 0-32.8 14.69-32.8 32.8v41.16h-82.45c-56.65 0-102.74 46.08-102.74 102.74V797c0 56.65 46.08 102.75 102.74 102.75H440.6c18.12 0 32.8-14.68 32.8-32.8 0-18.12-14.68-32.8-32.8-32.8zM169.84 216.97h82.45v35.49c0 18.12 14.69 32.8 32.8 32.8 18.12 0 32.8-14.69 32.8-32.8v-35.49h351.93v35.49c0 18.12 14.69 32.8 32.8 32.8s32.8-14.69 32.8-32.8v-35.49h77.23c20.48 0 37.15 16.66 37.15 37.14v99.76H132.7v-99.76c0-20.48 16.66-37.14 37.14-37.14z"/><path d="M351.34 526.46H218.83c-18.12 0-32.8 14.69-32.8 32.8s14.69 32.8 32.8 32.8h132.51c18.12 0 32.8-14.69 32.8-32.8s-14.68-32.8-32.8-32.8zM813.75 682.43h-69.31v-77.97c0-15.1-12.24-27.33-27.33-27.33-15.1 0-27.33 12.24-27.33 27.33v105.3c0 15.1 12.24 27.33 27.33 27.33h96.64c15.09 0 27.33-12.24 27.33-27.33s-12.23-27.33-27.33-27.33zM351.34 701.38H218.83c-18.12 0-32.8 14.69-32.8 32.8 0 18.12 14.69 32.8 32.8 32.8h132.51c18.12 0 32.8-14.69 32.8-32.8 0-18.12-14.68-32.8-32.8-32.8z"/><path d="M716.05 464.75C583.14 464.75 475 572.89 475 705.8s108.14 241.05 241.05 241.05S957.1 838.71 957.1 705.8 848.96 464.75 716.05 464.75z m0 416.49c-96.75 0-175.45-78.7-175.45-175.45s78.7-175.45 175.45-175.45S891.5 609.05 891.5 705.8s-78.7 175.44-175.45 175.44z"/></svg> Schedule</a>
    <button class="mobile-menu-btn" id="menu-toggle" aria-label="Menu">&#x2630;</button>
  </div></div>
</header>

<nav class="nav nav--mobile" id="main-nav"><div class="container"><div class="nav__inner">
    <a href="/" class="nav__link nav__link--active">Home</a>
    <div class="nav__dropdown"><a href="/about/" class="nav__link">About Us</a><div class="nav__dropdown-menu"><a href="/staff/" class="nav__link">Staff</a><a href="/join-our-team/" class="nav__link">Join Our Team</a><a href="/location/" class="nav__link">Location</a></div></div>
    <div class="nav__dropdown"><a href="/conditions/" class="nav__link">Conditions</a><div class="nav__dropdown-menu"><a href="/shoulder-pain/" class="nav__link">Shoulder Pain</a><a href="/knee-pain/" class="nav__link">Knee Pain</a><a href="/back-pain-sciatica/" class="nav__link">Back Pain</a><a href="/sports-injuries/" class="nav__link">Sports Injuries</a><a href="/joint-pain-arthritis/" class="nav__link">Joint Pain & Arthritis</a><a href="/rotator-cuff-tear/" class="nav__link">Rotator Cuff Tear</a><a href="/shoulder-impingement/" class="nav__link">Shoulder Impingement</a><a href="/sprains-strains-tendinitis/" class="nav__link">Sprains, Strains & Tendinitis</a><a href="/walking-balance-problems/" class="nav__link">Walking & Balance Problems</a><a href="/pre-post-surgical-rehabilitation/" class="nav__link">Pre- & Post-Surgical Rehab</a><a href="/work-related-injuries/" class="nav__link">Work-Related Injuries</a><a href="/conditions/" class="nav__link">View All</a></div></div>
    <div class="nav__dropdown"><a href="/services/" class="nav__link">Services</a><div class="nav__dropdown-menu"><a href="/services/patient-education/" class="nav__link">Patient Education</a><a href="/services/therapeutic-exercise/" class="nav__link">Therapeutic Exercise</a><a href="/services/strength-conditioning/" class="nav__link">Strength & Conditioning</a><a href="/services/dry-needling-certified/" class="nav__link">Dry Needling</a><a href="/services/blood-flow-restriction-therapy/" class="nav__link">Blood Flow Restriction</a><a href="/services/mckenzie-method/" class="nav__link">McKenzie Method</a><a href="/services/mulligan-technique/" class="nav__link">Mulligan Technique</a><a href="/services/cupping/" class="nav__link">Cupping</a><a href="/services/gait-balance-training/" class="nav__link">Gait & Balance</a><a href="/services/vasopneumatic-compression/" class="nav__link">Vasopneumatic Compression</a><a href="/services/moist-heat-ice/" class="nav__link">Moist Heat / Ice</a><a href="/services/electrical-stimulation/" class="nav__link">Electrical Stimulation</a><a href="/services/workers-compensation/" class="nav__link">Workers Comp</a></div></div>
    <div class="nav__dropdown"><a href="/patcenter/" class="nav__link">Patient Center</a><div class="nav__dropdown-menu"><a href="/library/" class="nav__link">Medical Library</a><a href="/insurance/" class="nav__link">Insurance</a><a href="/reviews/" class="nav__link">Reviews</a><a href="/faq/" class="nav__link">FAQ</a></div></div>
    <a href="/contact/" class="nav__link">Contact</a>
  </div></div></nav>
```

**Structure notes:**

| Element | Purpose |
|---------|---------|
| `.sr-only` link | Accessibility skip-to-content, visually hidden but focusable |
| `header.header` | Logo, address, phone, hamburger button (`#menu-toggle`), mobile CTA buttons |
| `nav#main-nav.nav--mobile` | The ribbon itself — all site navigation links and dropdown menus |
| `#main-nav` | Moved to be a sibling of `#site-header` by the injection script (see §4) |

---

## 4. Injection Script — `index.html` (inline, in `<head>`)

This script runs immediately after the `<div id="site-header">` placeholder element. It fetches the template, parses it, separates the `#main-nav` from the header content, and places them as siblings in the DOM.

```js
fetch('/templates/header.html')
  .then(function(r){return r.text()})
  .then(function(h){
    // Parse into a temp container so we can separate header from nav
    var temp=document.createElement('div');
    temp.innerHTML=h;
    var nav=temp.querySelector('#main-nav');
    // Put header content (everything except nav) into #site-header
    if(nav){nav.remove();}
    document.getElementById('site-header').innerHTML=temp.innerHTML;
    // Insert nav after site-header so position:sticky works
    if(nav){
      var sh=document.getElementById('site-header');
      sh.parentNode.insertBefore(nav,sh.nextSibling);
    }
  })
  .then(function(){
    var toggle=document.getElementById('menu-toggle');
    var nav=document.getElementById('main-nav');
    if(toggle&&nav){toggle.addEventListener('click',function(){nav.classList.toggle('nav--open')})}
    // Highlight current page in nav
    var path=window.location.pathname;
    document.querySelectorAll('.nav__link').forEach(function(link){
      link.classList.toggle('nav__link--active',link.getAttribute('href')===path);
    });
  });
```

**Key steps:**

1. Fetch `/templates/header.html` as text
2. Parse into a temporary `<div>` (not yet in the DOM)
3. Extract `#main-nav` from the temp container with `.remove()`
4. Set `#site-header.innerHTML` to the remaining content (just the `header.header` and skip-to-content link)
5. Insert `#main-nav` into the live DOM as a sibling after `#site-header` using `insertBefore(nav, sh.nextSibling)`
6. Wire up the basic hamburger toggle and current-page highlighting

**Why this approach?** If `#main-nav` were nested inside `#site-header`, `position: sticky` would fail because a sticky element must be a direct child of a scrollable container. `#site-header` is too short to provide scrollable overflow, so the nav would scroll away with the header.

---

## 5. CSS — `css/header.css` (full file, 106 lines)

```css
/* ===== HEADER ===== */

/* Reserve space before header loads to prevent layout shift / flicker.
   These are conservative fallbacks — the actual header height is measured
   after render and cached in sessionStorage for subsequent page loads. */
#site-header {
  min-height: 60px;
}

@media (min-width: 768px) {
  #site-header {
    min-height: 130px;
  }
}

/* CTA Bar */
.header__cta-bar{background:var(--primary);padding:6px 0;display:none}
.header__cta-bar .container{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
.header__cta-bar .btn{background:var(--accent);color:var(--white);padding:8px 14px;font-size:.78rem;font-weight:700;border-radius:var(--radius-pill);white-space:nowrap;text-transform:uppercase;transition:all .2s}
.header__cta-bar .btn:hover{background:var(--white);color:var(--primary)}

/* Top row */
.header__top{display:flex;align-items:center;justify-content:space-between;padding:8px 0;gap:6px}
.header__logo{flex-shrink:0}
.header__logo img{width:120px;height:auto}
.header__contact{display:none}

/* Mobile: phone CTA in header */
.header__mobile-cta{display:flex;align-items:center;gap:4px;padding:4px 8px;background:var(--accent);color:var(--white);border-radius:var(--radius-pill);font-weight:700;font-size:.7rem;text-decoration:none;white-space:nowrap}
.header__mobile-cta:hover{color:var(--white);background:#e05a15}

/* Hamburger */
.mobile-menu-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:var(--light-gray);border:none;border-radius:var(--radius-sm);font-size:20px;cursor:pointer;color:var(--dark);flex-shrink:0;transition:background .2s,color .2s}
.mobile-menu-btn.mobile-menu-btn--open{background:var(--primary);color:var(--white)}

/* Desktop: show contact info */
@media(min-width:768px){
  .header__cta-bar{display:block}
  .header__top{justify-content:center;gap:40px;padding:16px 0}
  .header__logo img{width:220px}
  .header__contact{display:flex;align-items:center;gap:32px}
  .header__address{display:flex;align-items:center;gap:8px;font-size:.85rem;line-height:1.5;color:var(--dark)}
  .header__address svg{width:20px;height:20px;color:var(--accent);flex-shrink:0;transform:translateY(1px)}
  .header__phone{text-align:center}
  .header__label{display:block;font-size:.65rem;font-weight:700;text-transform:uppercase;color:var(--gray);letter-spacing:.5px;margin-bottom:2px}
  .header__phone a{font-size:1.1rem;font-weight:700;color:var(--dark);display:flex;align-items:center;gap:6px}
  .header__phone a:hover{color:var(--accent)}
  .header__icon{display:inline-flex;align-items:center;transform:translateY(1px);color:var(--accent);font-size:1.25rem}
  .mobile-menu-btn,.header__mobile-cta{display:none}
}

/* ===== NAVIGATION RIBBON ===== */
.nav{display:block;background:var(--white);border-top:1px solid var(--light-gray);border-bottom:2px solid var(--primary);position:sticky;top:0;z-index:998}
.nav .container{position:relative}
.nav__inner{display:none}

@media(min-width:768px){
  .nav__inner{display:flex;align-items:center;justify-content:center;flex-wrap:wrap}
  .nav__link{display:block;padding:14px 10px;font-family:var(--font-heading);font-weight:600;font-size:.75rem;text-transform:uppercase;color:var(--dark);border-top:2px solid transparent;transition:all .2s;white-space:nowrap;letter-spacing:.3px}
  .nav__link:hover,.nav__link--active{color:var(--primary);border-top-color:var(--accent)}
  .nav__link--active{background:var(--light-gray)}
}
@media(min-width:1024px){
  .nav__link{padding:14px 14px;font-size:.8rem}
}
@media(min-width:1200px){
  .nav__link{padding:14px 18px;font-size:.82rem}
}

/* Dropdown */
.nav__dropdown{position:relative}
.nav__dropdown-menu{display:none;position:absolute;top:100%;left:0;min-width:200px;background:var(--white);border-radius:0 0 var(--radius-md) var(--radius-md);box-shadow:var(--shadow-md);z-index:100;padding:4px 0}
.nav__dropdown:hover .nav__dropdown-menu{display:block}
.nav__dropdown-menu .nav__link{display:block;padding:10px 16px;border:none;font-size:.78rem;text-transform:none;letter-spacing:0}
.nav__dropdown-menu .nav__link:hover{background:var(--light-gray);color:var(--primary)}

/* Mobile: sticky header + nav wrapper hide on scroll down, show on scroll up */
@media(max-width:767px){
  #site-header{position:sticky;top:0;z-index:999;transition:transform .3s ease;background:var(--white)}
  #site-header.site-header--hidden{transform:translateY(-100%)}
  #main-nav{position:sticky;top:0;z-index:998;transition:transform .3s ease}
  #main-nav.site-header--hidden{transform:translateY(-100%)}
  .nav{position:static;border-bottom:none}
  .nav--mobile{display:none;position:fixed;top:0;right:0;bottom:0;width:300px;max-width:85vw;z-index:1000;background:var(--white);padding:60px 20px 20px;overflow-y:auto;box-shadow:-4px 0 20px rgba(0,0,0,0.2)}
  .nav--mobile.nav--open{display:block}
  #main-nav.nav--mobile.nav--open{position:fixed;z-index:1000}
  .nav--mobile .nav__inner{display:flex;flex-direction:column;gap:2px}
  .nav--mobile .nav__link{display:block;padding:12px 16px;font-family:var(--font-heading);font-weight:600;font-size:.9rem;text-transform:uppercase;color:var(--dark);border-radius:var(--radius-sm)}
  .nav--mobile .nav__link:hover{background:var(--light-gray)}
  .nav--mobile .nav__dropdown-menu{position:static;display:none;box-shadow:none;padding-left:16px;min-width:auto}
  .nav--mobile .nav__dropdown.open .nav__dropdown-menu{display:block}
  .nav--open .nav__close-btn{display:flex}
  .menu-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:999;display:none}
  .menu-overlay--visible{display:block}
}

.nav__close-btn{display:none;position:absolute;top:12px;right:12px;width:44px;height:44px;background:none;border:none;font-size:28px;line-height:1;color:var(--dark);cursor:pointer;z-index:1001;align-items:center;justify-content:center;border-radius:var(--radius-sm)}
.nav__close-btn:hover{background:var(--light-gray);color:var(--primary)}
@media(min-width:768px){
  .nav__close-btn{display:none!important}
}

/* Sticky nav — pure CSS, no JS needed */
@media(min-width:768px){
  .nav{position:sticky;top:0;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
}
```

**Key styling breakdown:**

| Section | Lines | Purpose |
|---------|-------|---------|
| `#site-header` min-height | 6–14 | Prevents layout shift before the header template loads |
| `.header__cta-bar` | 17–20 | Utility bar above the header (hidden on mobile) |
| `.header__top` | 23–25 | Logo row — flex layout |
| `.header__mobile-cta` | 29–31 | Location and Schedule buttons (mobile only) |
| `.mobile-menu-btn` | 33–34 | Hamburger icon |
| Desktop media query (768px+) | 37–50 | Shows contact info, hides mobile CTAs, larger logo |
| **`.nav` base styles** | **53–55** | **The ribbon: `position:sticky;top:0;z-index:998`, white bg, blue bottom border** |
| Desktop nav links | 57–68 | Flex row of uppercase nav links with increasing padding at wider breakpoints |
| Dropdown menus | 71–75 | Hover-revealed absolute-positioned dropdowns |
| Mobile nav drawer | 78–95 | Slide-in panel from right, overlay, close button |
| Mobile sticky header + nav | 79–82 | Both `#site-header` and `#main-nav` are sticky on mobile, hiding on scroll-down with `transform:translateY(-100%)` |
| Desktop sticky overrides | 104–106 | `position: sticky; top:0; z-index:999` with box-shadow |

---

## 6. CSS — `css/header-angular.css` (Blue Accents, 66 lines)

```css
/* ===== HEADER BLUE ACCENTS =====
   Clean blue coloring on structural elements of the initial view */

/* --- Top accent stripe above the header utility bar --- */
.site-header::before {
  content: "";
  display: block;
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--primary-dark) 0%,
    var(--primary) 25%,
    var(--accent) 50%,
    var(--primary) 75%,
    var(--primary-dark) 100%
  );
}

/* --- Nav ribbon: white bg with blue bottom border --- */
.nav {
  border-bottom-color: var(--primary) !important;
}

/* Active nav link: faint blue wash, full bar height */
@media(min-width:768px){
  .nav__link--active {
    background: rgba(0, 90, 170, 0.08) !important;
    color: var(--primary) !important;
    border-top-color: transparent !important;
  }
  .nav__link:hover {
    color: var(--primary) !important;
  }
}

/* Mobile nav drawer: faint blue wash on active link */
@media(max-width:767px){
  .nav--mobile .nav__link--active {
    background: rgba(0, 90, 170, 0.08) !important;
    color: var(--primary) !important;
  }
  .nav--mobile .nav__link:hover {
    color: var(--primary) !important;
  }
}

/* --- Hero CTA button blue accent glow on hover --- */
.hero__cta .btn--accent {
  position: relative;
  overflow: visible;
}
.hero__cta .btn--accent::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(8px);
}
.hero__cta .btn--accent:hover::after {
  opacity: 0.6;
}
```

This file is loaded after `header.css` and provides overrides for:
- A gradient stripe above the header
- Blue-tinted active nav link background
- Blue hover color on nav links
- A blue glow effect on the hero CTA button hover

---

## 7. CSS — `css/main.css` (Relevant Ribbon Rules)

### 7a. Design System Variables

```css
:root {
  --primary: #2257A6;
  --primary-dark: #1B3B6F;
  --accent: #F86F26;
  --white: #FFFFFF;
  --light-gray: #EFEFEF;
  --gray: #666666;
  --dark: #1A1A1A;
  --font-heading: 'Montserrat', sans-serif;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-pill: 999px;
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
}
```

### 7b. Global Reset (affects the ribbon)

```css
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
```

**Note:** The `html` element previously had `overflow-y: overlay`, a deprecated non-standard WebKit property that breaks `position: sticky`. This has been **removed** — the `html` element now has no `overflow-y` override, which is critical for sticky behavior.

### 7c. Desktop Nav / Dropdown Overrides

```css
/* Desktop Nav — now handled in header.css */
.nav--open{display:flex;flex-direction:column;position:fixed;top:0;right:0;bottom:0;width:300px;max-width:80vw;background:var(--white);z-index:1000;padding:24px;overflow-y:auto;box-shadow:var(--shadow-lg)}
.nav__link{display:block;padding:10px 16px;font-family:var(--font-heading);font-weight:600;font-size:.9rem;text-transform:uppercase;color:var(--dark);border-radius:var(--radius-sm);transition:background .2s}
.nav__link:hover,.nav__link--active{background:var(--light-gray);color:var(--primary)}
.nav__dropdown{position:relative}
.nav__dropdown-menu{display:none;position:absolute;top:100%;left:0;min-width:200px;background:var(--white);border-radius:var(--radius-md);box-shadow:var(--shadow-md);padding:8px 0;z-index:100}
.nav__dropdown:hover .nav__dropdown-menu{display:block}
```

### 7d. Mobile Menu Button

```css
.mobile-menu-btn{display:flex;align-items:center;justify-content:center;width:44px;height:44px;background:none;border:none;cursor:pointer;font-size:24px;color:var(--white)}
@media(min-width:1024px){.mobile-menu-btn{display:none}}
```

---

## 8. JavaScript — `js/main.js` (Ribbon-Related Sections)

### 8a. Sticky Nav Documentation Comment

```js
// Sticky nav: #main-nav is placed outside #site-header by the inline script
// in index.html, so position:sticky in header.css works natively.
// No JS intervention needed — this comment documents the approach.
```

This replaced the old MutationObserver code that was trying to move `#main-nav` after injection. The new approach in `index.html` (see §4) handles the placement correctly from the start.

### 8b. Dynamic Header Height Measurement

```js
// ===== Dynamic Header Height — measure actual rendered height and cache =====
(function(){
  var CACHE_KEY = 'headerHeight';
  var BREAKPOINT = 768;
  var siteHeader = document.getElementById('site-header');

  // 1. Immediately apply cached height (subsequent page loads — no flicker)
  if (siteHeader && window.sessionStorage) {
    var cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      siteHeader.style.minHeight = cached + 'px';
    }
  }

  // 2. After header renders, measure actual height and cache it
  var wasMobile = window.innerWidth < BREAKPOINT;
  var measured = false;

  function measureAndCache() {
    if (measured) return;
    if (!siteHeader || !siteHeader.querySelector('.header')) return;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        var h = siteHeader.querySelector('.header').offsetHeight;
        if (h > 0 && window.sessionStorage) {
          sessionStorage.setItem(CACHE_KEY, h);
          siteHeader.style.minHeight = h + 'px';
          measured = true;
        }
      });
    });
  }

  measureAndCache();
  if (siteHeader) {
    var obs = new MutationObserver(function() {
      measureAndCache();
      if (measured) obs.disconnect();
    });
    obs.observe(siteHeader, { childList: true, subtree: true });
    setTimeout(function() { obs.disconnect(); }, 5000);
  }

  // 3. On resize crossing the breakpoint, invalidate cache
  window.addEventListener('resize', function() {
    var isMobile = window.innerWidth < BREAKPOINT;
    if (isMobile !== wasMobile) {
      wasMobile = isMobile;
      measured = false;
      if (window.sessionStorage) {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }
  });
})();
```

**Purpose:** Prevents Cumulative Layout Shift (CLS). On first page load, measures the real header height after render and caches it in `sessionStorage`. On subsequent page loads, applies the cached height before the fetch completes, so the page doesn't jump.

### 8c. Mobile Menu Toggle

```js
// Mobile menu — wait for #menu-toggle to appear
(function(){
  var initialized = false;
  var navEl = null;
  var toggleEl = null;
  var overlay = null;
  var closeBtn = null;

  function setupMenu() {
    if (initialized) return;
    toggleEl = document.getElementById('menu-toggle');
    navEl = document.getElementById('main-nav');
    if (!toggleEl || !navEl) return;

    initialized = true;

    // Create overlay
    overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);

    // Inject close button into the nav panel
    closeBtn = document.createElement('button');
    closeBtn.className = 'nav__close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close menu');
    navEl.insertBefore(closeBtn, navEl.firstChild);

    // Remove any bare toggle listeners added by inline scripts by cloning
    var newToggle = toggleEl.cloneNode(true);
    toggleEl.parentNode.replaceChild(newToggle, toggleEl);
    toggleEl = newToggle;
    toggleEl.id = 'menu-toggle';

    function open() {
      navEl.classList.add('nav--open');
      overlay.classList.add('menu-overlay--visible');
      toggleEl.classList.add('mobile-menu-btn--open');
      toggleEl.innerHTML = '&times;';
      document.body.style.overflow = 'hidden';
    }

    function close() {
      navEl.classList.remove('nav--open');
      overlay.classList.remove('menu-overlay--visible');
      toggleEl.classList.remove('mobile-menu-btn--open');
      toggleEl.innerHTML = '&#x2630;';
      document.body.style.overflow = '';
    }

    toggleEl.addEventListener('click', function(e) {
      e.stopImmediatePropagation();
      navEl.classList.contains('nav--open') ? close() : open();
    });

    closeBtn.addEventListener('click', function(e) {
      e.stopImmediatePropagation();
      close();
    });

    overlay.addEventListener('click', close);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navEl.classList.contains('nav--open')) close();
    });

    // Dropdown toggles on mobile
    document.querySelectorAll('.nav__dropdown > .nav__link').forEach(function(link){
      link.addEventListener('click', function(e){
        if (window.innerWidth < 768){
          e.preventDefault();
          this.parentElement.classList.toggle('open');
        }
      });
    });
  }

  setupMenu();
  // ... MutationObserver fallback and safety timeout ...
})();
```

**Purpose:** Creates the full mobile menu experience:
- Overlay behind the drawer
- Close button inside the drawer
- Clone-and-replace pattern to remove stale inline event listeners
- Escape key closes the menu
- Dropdown submenus toggle on click (mobile only)

### 8d. Scroll-Aware Header Show/Hide (Mobile Only)

```js
  // ===== Scroll-aware header show/hide (mobile only) =====
  var lastScrollY = window.scrollY;
  var ticking = false;
  var HIDE_THRESHOLD = 80;

  function onScroll() {
    var siteHeader = document.getElementById('site-header');
    var mainNav = document.getElementById('main-nav');
    if (!siteHeader || !mainNav) return;
    var currentScrollY = window.scrollY;
    var isMobile = window.innerWidth < 768;

    if (!isMobile) {
      // Always show on desktop
      if (siteHeader.classList.contains('site-header--hidden')) {
        siteHeader.classList.remove('site-header--hidden');
        mainNav.classList.remove('site-header--hidden');
      }
      lastScrollY = currentScrollY;
      return;
    }

    if (currentScrollY > HIDE_THRESHOLD) {
      if (currentScrollY > lastScrollY) {
        // Scrolling down — hide
        siteHeader.classList.add('site-header--hidden');
        mainNav.classList.add('site-header--hidden');
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up — show
        siteHeader.classList.remove('site-header--hidden');
        mainNav.classList.remove('site-header--hidden');
      }
    } else {
      // Near top — always show
      siteHeader.classList.remove('site-header--hidden');
      mainNav.classList.remove('site-header--hidden');
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
```

**Purpose:** On mobile, the header and nav both slide up (hide) when the user scrolls down past 80px, and slide back down (show) when the user scrolls up. This maximizes content visibility on small screens. Uses `requestAnimationFrame` throttling for performance.

---

## 9. How Sticky Works

### The CSS

At desktop (`min-width: 768px`), the `.nav` element gets:

```css
.nav {
  position: sticky;
  top: 0;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
```

At mobile (`max-width: 767px`):

```css
#site-header { position: sticky; top: 0; z-index: 999; }
#main-nav    { position: sticky; top: 0; z-index: 998; }
```

Both the header and nav stick to the top on mobile scroll.

### Why Nesting Broke It

`position: sticky` requires the element to be a direct child of a **scrollable container** (one that has overflow, or is the viewport itself). When `#main-nav` was nested inside `#site-header`, the sticky positioning was constrained by `#site-header`'s height. Since `#site-header` is only ~130px tall on desktop (just the logo row), there is no scrollable overflow room — the entire `#site-header` scrolls away, taking `#main-nav` with it.

### The Fix

The `index.html` injection script now:
1. Parses the template into a temp container
2. Extracts `#main-nav` with `.remove()`
3. Inserts `#main-nav` as a direct child of `<body>`, as a sibling after `#site-header`
4. `#main-nav` is now a direct child of the scrollable viewport, so `position: sticky` works natively

### The `overflow-y: overlay` Issue

The `html` element previously had `overflow-y: overlay` in `css/main.css`. This is a deprecated, non-standard WebKit property. Modern browsers treat it as `overflow-y: auto`, which creates a new scrolling context on the `<html>` element itself. This means `position: sticky` elements inside `<html>` no longer stick to the viewport — they stick to the `<html>` element's internal scroll area instead. This property has been removed.

---

## 10. Troubleshooting Notes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Nav scrolls away with the page | `#main-nav` is nested inside `#site-header` | Ensure the injection script in `index.html` extracts `#main-nav` and places it as a sibling after `#site-header` |
| Nav sticky but flickers/jumps | `overflow-y: overlay` on `html` | Remove any `overflow-y` override from the `html` element in `css/main.css` |
| Layout shift before header loads | No min-height reserved | `#site-header` has `min-height: 60px` (mobile) / `130px` (desktop), and the dynamic height script caches the actual measured height |
| Mobile menu doesn't open | Event listener not attached (race condition) | `main.js` uses MutationObserver to wait for `#menu-toggle` to appear, then clones it to remove stale inline listeners |
| Sticky works but z-index wrong | Other elements overlapping | `.nav` has `z-index: 998` (mobile) / `999` (desktop); `#site-header` has `z-index: 999` (mobile); the mobile menu overlay has `z-index: 999` |
| Dropdown menus not appearing on mobile | Desktop hover behavior doesn't work on touch | `main.js` toggles `.open` class on `nav__dropdown` parent on click (mobile only) |
| Header slides up on desktop | Scroll-aware hide/show should only run on mobile | The `onScroll` function checks `window.innerWidth < 768` and removes the hidden class on desktop |

---

## 11. File Dependency Graph

```
index.html
  ├── <div id="site-header"></div>          ← placeholder
  ├── <script> fetch /templates/header.html  ← injects header + nav
  │     └── /templates/header.html           ← template source
  │           ├── .sr-only (skip link)
  │           ├── header.header (logo, contact, hamburger)
  │           └── nav#main-nav (the ribbon)
  ├── <link> css/main.css                    ← design vars, reset, nav/dropdown base styles
  ├── <link> css/header.css                  ← header + nav styling, sticky, mobile drawer
  ├── <link> css/header-angular.css          ← blue accent overrides
  └── <script src="js/main.js"></script>     ← menu toggle, scroll hide/show, height cache
```

---

*End of reference document.*