// ===== Skip to main content =====
// Keep the existing visually hidden link, but move keyboard focus as well as
// scrolling. Medical library pages retain their existing behavior.
(function(){
  if (/^\/library(?:\/|$)/.test(window.location.pathname)) return;
  document.addEventListener('click', function(e){
    var link = e.target.closest('a.sr-only[href="#main-content"]');
    if (!link || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var main = document.getElementById('main-content');
    if (!main) return;
    e.preventDefault();
    main.focus({ preventScroll: true });
    // Reserve room for the header and navigation even when either is hidden
    // during scrolling, so the destination is not covered when they reappear.
    var header = document.getElementById('site-header');
    var nav = document.getElementById('main-nav');
    var offset = (header ? header.offsetHeight : 0) + (nav ? nav.offsetHeight : 0) + 16;
    window.scrollTo({
      top: Math.max(0, window.scrollY + main.getBoundingClientRect().top - offset),
      behavior: 'instant'
    });
  });
})();

// ===== Dynamic Header Height — measure actual rendered height and cache =====
// Prevents layout shift: on first visit measures the real header height,
// stores it in sessionStorage, and subsequent page loads reserve that exact
// space before the fetch completes.
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
    // Wait a tick for layout to settle (nav may have been moved out by MutationObserver)
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        // --- READ phase: batch all layout reads before any writes ---
        var headerEl = siteHeader.querySelector('.header');
        var h = headerEl.offsetHeight;
        // --- WRITE phase: apply all DOM writes after reads complete ---
        if (h > 0) {
          if (window.sessionStorage) {
            sessionStorage.setItem(CACHE_KEY, h);
          }
          siteHeader.style.minHeight = h + 'px';
          measured = true;
        }
      });
    });
  }

  // Try immediately
  measureAndCache();
  // Also observe site-header for child additions (header injects via fetch)
  if (siteHeader) {
    var obs = new MutationObserver(function() {
      // Defer layout read/write to a rAF to avoid forced reflow
      requestAnimationFrame(function(){
        measureAndCache();
        if (measured) obs.disconnect();
      });
    });
    obs.observe(siteHeader, { childList: true, subtree: true });
    // Safety timeout: stop observing after 5 seconds
    setTimeout(function() { obs.disconnect(); }, 5000);
  }

  // 3. On resize crossing the breakpoint, invalidate cache so next page re-measures
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

// Sticky nav: #main-nav is placed outside #site-header by the inline script
// in index.html, so position:sticky in header.css works natively.
// No JS intervention needed — this comment documents the approach.

// Fix: On sub-pages, #main-nav is incorrectly nested inside #site-header
// (the inline script dumps the entire template into #site-header.innerHTML).
// position:sticky requires #main-nav to be a direct child of a scrollable
// container (the viewport), not constrained by #site-header's height.
// Extract and re-place it as a sibling — no-op on the home page.
// Uses MutationObserver because the header template loads async via fetch,
// so #main-nav doesn't exist yet when main.js first executes.
(function fixNavPlacement() {
  var placed = false;
  var siteHeader = document.getElementById('site-header');
  if (!siteHeader) return;

  function tryFix() {
    if (placed) return;
    var mainNav = document.getElementById('main-nav');
    if (mainNav && mainNav.parentNode === siteHeader) {
      siteHeader.parentNode.insertBefore(mainNav, siteHeader.nextSibling);
      placed = true;
      obs.disconnect();
    }
  }

  // Try immediately (in case header already loaded)
  tryFix();
  if (placed) return;

  // Watch for #main-nav appearing inside #site-header
  var obs = new MutationObserver(function() {
    tryFix();
  });
  obs.observe(siteHeader, { childList: true, subtree: true });

  // Safety timeout: stop observing after 8 seconds
  setTimeout(function() { obs.disconnect(); }, 8000);
})();


// Mobile menu — wait for #menu-toggle to appear (header loads via fetch, so
// there's a race condition). Using MutationObserver ensures we attach after
// the header template is injected, regardless of load order.
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
      lockScroll();
    }

    function close() {
      navEl.classList.remove('nav--open');
      overlay.classList.remove('menu-overlay--visible');
      toggleEl.classList.remove('mobile-menu-btn--open');
      toggleEl.innerHTML = '&#x2630;';
      unlockScroll();
    }

    // Lock page scroll while the mobile menu is open. Setting overflow:hidden on
    // <body> alone is not enough on iOS Safari/WebKit — the root <html> is the
    // scroll container (overflow-x:hidden now lives on html), so we lock both,
    // and swallow touchmove on the page behind the drawer so it can't scroll.
    function preventBodyScroll(e) {
      // Allow scrolling inside the drawer itself (its links scroll via overflow-y:auto)
      if (navEl && navEl.contains(e.target)) return;
      e.preventDefault();
    }

    function lockScroll() {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.addEventListener('touchmove', preventBodyScroll, { passive: false });
    }

    function unlockScroll() {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', preventBodyScroll);
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

    // Close on Escape
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

  // Try immediately (in case header loaded before main.js)
  setupMenu();

  // If not ready, watch for the menu-toggle to appear
  if (!initialized) {
    var siteHeader = document.getElementById('site-header');
    if (siteHeader) {
      var obs2 = new MutationObserver(function() {
        setupMenu();
        if (initialized) obs2.disconnect();
      });
      obs2.observe(siteHeader, { childList: true, subtree: true });
    }
    // Fallback: watch the whole document
    var bodyObs = new MutationObserver(function() {
      setupMenu();
      if (initialized) bodyObs.disconnect();
    });
    bodyObs.observe(document.documentElement, { childList: true, subtree: true });

    // Safety timeout: stop observing after 5 seconds
    setTimeout(function() {
      obs2.disconnect && obs2.disconnect();
      bodyObs.disconnect();
    }, 5000);
  }

})();

// ===== Scroll-aware header show/hide (mobile only) =====
// Hides the sticky header on scroll-down; reveals it only after ~150px of
// deliberate upward scroll so it doesn't flash back on tiny flicks.
(function(){
  var siteHeader = document.getElementById('site-header');
  if (!siteHeader) return;

  var lastScrollY = window.scrollY;
  var upAccumulator = 0;
  var ticking = false;
  var HIDE_THRESHOLD = 80;    // don't hide until scrolled past this
  var SHOW_THRESHOLD = 150;   // cumulative up-scroll required to reveal

  function onScroll() {
    var currentScrollY = window.scrollY;
    var isMobile = window.innerWidth < 768;

    if (!isMobile) {
      // Desktop: header scrolls away naturally — reset any mobile state.
      siteHeader.style.transform = '';
      siteHeader.classList.remove('site-header--hidden');
      upAccumulator = 0;
      lastScrollY = currentScrollY;
      return;
    }

    var delta = lastScrollY - currentScrollY; // positive = scrolling up

    if (currentScrollY <= HIDE_THRESHOLD) {
      // Near top: always show
      siteHeader.style.transform = '';
      siteHeader.classList.remove('site-header--hidden');
      upAccumulator = 0;
    } else if (delta < 0) {
      // Scrolling down: hide immediately, reset accumulator
      upAccumulator = 0;
      siteHeader.style.transform = '';
      siteHeader.classList.add('site-header--hidden');
    } else if (delta > 0) {
      // Scrolling up: accumulate
      upAccumulator += delta;
      if (upAccumulator >= SHOW_THRESHOLD) {
        siteHeader.classList.remove('site-header--hidden');
        siteHeader.style.transform = '';
      } else {
        // Progressive reveal mapped from accumulator
        var progress = Math.min(upAccumulator / SHOW_THRESHOLD, 1);
        var translatePct = Math.round(-(100 - progress * 100) * 10) / 10;
        siteHeader.style.transform = 'translateY(' + translatePct + '%)';
        siteHeader.classList.remove('site-header--hidden');
      }
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

  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onScroll, 100);
  });
})();

// ===== Angular Parallax Scroll Driver =====
// Drives multi-speed scrolling on overlapping cluster items and bg shapes
(function(){
  var clusterEl = document.getElementById('angular-scroll-cluster');
  var sectionEl = clusterEl ? clusterEl.closest('.angular-parallax-section') : null;
  if (!clusterEl || !sectionEl) return;

  var items = clusterEl.querySelectorAll('.angular-scroll-item[data-parallax-speed]');
  var bgShapes = sectionEl.querySelectorAll('.angular-parallax-bg-shape[data-parallax-speed]');
  var ticking = false;

  function updateParallax() {
    var sectionRect = sectionEl.getBoundingClientRect();
    var windowH = window.innerHeight;

    // Only drive when section is in viewport
    if (sectionRect.bottom < -100 || sectionRect.top > windowH + 100) {
      ticking = false;
      return;
    }

    // Calculate scroll progress through the section (0 = top enters, 1 = bottom exits)
    var scrollOffset = windowH - sectionRect.top;
    var sectionHeight = sectionRect.height + windowH;
    var progress = Math.max(0, Math.min(1, scrollOffset / sectionHeight));

    // Map progress for each item using its speed factor
    var baseTranslate = (progress - 0.5) * 60; // max ±30px base translation

    items.forEach(function(item) {
      var speed = parseFloat(item.getAttribute('data-parallax-speed')) || 1;
      var yOff = baseTranslate * speed;
      item.style.transform = item.style.transform.replace(/translateY\([^)]*\)/, '') + ' translateY(' + yOff.toFixed(1) + 'px)';
    });

    bgShapes.forEach(function(shape) {
      var speed = parseFloat(shape.getAttribute('data-parallax-speed')) || 1;
      var yOff = baseTranslate * speed;
      shape.style.transform = shape.style.transform.replace(/translateY\([^)]*\)/, '') + ' translateY(' + yOff.toFixed(1) + 'px)';
    });

    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  setTimeout(updateParallax, 300);
})();

// ===== Medical Library Video Handler =====
// Replaces placeholder links with Vimeo embeds (same behavior as v2 g5_master.js)
(function(){
  document.addEventListener('click', function(e){
    var link = e.target.closest('.g5-mlvideo-wrapper a');
    if (!link) return;
    var vimeoId = link.getAttribute('title');
    if (!vimeoId) return;
    e.preventDefault();
    var wrapper = link.closest('.g5-mlvideo-wrapper');
    wrapper.innerHTML = '<iframe src="https://player.vimeo.com/video/' + vimeoId + '?title=0&byline=0&portrait=0&autoplay=1" ' +
      'style="width:100%;max-width:640px;aspect-ratio:640/435;border:0" ' +
      'webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
  });
})();

// ===== Review Button Visibility =====
// Hide the floating "★★★★★ Reviews" button on the reviews page itself.
(function(){
  var footer = document.getElementById('site-footer');

  function isReviewsPage(){
    var p = (window.location.pathname || '').replace(/\/+$/, '');
    return p === '/reviews' || p.indexOf('/reviews/') === 0;
  }

  function check(){
    if (!isReviewsPage()) return;
    var btn = document.querySelector('.br-trigger-btn');
    if (btn) {
      btn.classList.add('br-hidden');
      obs.disconnect();
    }
  }

  var obs = new MutationObserver(check);
  check();
  obs.observe(footer || document.body, { childList: true, subtree: true });
  setTimeout(function(){ obs.disconnect(); }, 6000);
})();

// ===== Delegated inline-handler replacements (CSP-safe) =====

// Floating "★★★★★ Reviews" button (injected by footer.html).
// Loads the reviews popup script on demand, then toggles the popup.
document.addEventListener('click', function(e){
  var btn = e.target.closest('.br-trigger-btn');
  if (!btn) return;
  e.preventDefault();
  var popup = document.querySelector('.br-review-popup');
  if (!popup) {
    btn.classList.add('br-hidden');
    var s = document.createElement('script');
    s.src = '/js/br-reviews.js';
    s.onload = function(){
      var p = document.querySelector('.br-review-popup');
      if (p) p.classList.add('show');
    };
    document.body.appendChild(s);
  } else if (popup.classList.contains('show')) {
    popup.classList.remove('show');
    btn.classList.remove('br-hidden');
  } else {
    popup.classList.add('show');
    btn.classList.add('br-hidden');
  }
});

// Medical library "Back to Previous Page" links (replaces inline history.go(-1)).
document.addEventListener('click', function(e){
  var back = e.target.closest('.ml-back-arrow');
  if (!back) return;
  e.preventDefault();
  window.history.go(-1);
});

// FAQ accordion buttons (workers-compensation page).
document.addEventListener('click', function(e){
  var q = e.target.closest('.faq-q');
  if (!q) return;
  q.parentElement.classList.toggle('open');
});

// Image load-error fallback: hide broken images and, where present,
// reveal the decorative fallback sibling (home page movement-medicine images).
document.addEventListener('error', function(e){
  var img = e.target;
  if (!img || img.tagName !== 'IMG') return;
  img.style.display = 'none';
  var sib = img.nextElementSibling;
  if (sib && sib.classList && sib.classList.contains('angular-scroll-item__fallback')) {
    sib.style.display = 'flex';
  }
}, true);

