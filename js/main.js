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
        var h = siteHeader.querySelector('.header').offsetHeight;
        if (h > 0 && window.sessionStorage) {
          sessionStorage.setItem(CACHE_KEY, h);
          // Also update inline min-height so this page settles exactly
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
      measureAndCache();
      if (measured) obs.disconnect();
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

  // ===== Scroll-aware header show/hide (mobile only) =====
  // Uses an up-scroll accumulator pattern: the header doesn't reappear on
  // tiny upward flicks — it requires ~150px of deliberate upward scroll
  // before sliding back into view proportionally with continued scroll.
  var lastScrollY = window.scrollY;
  var upAccumulator = 0;          // builds on scroll-up, resets to 0 on scroll-down
  var ticking = false;
  var HIDE_THRESHOLD = 80;        // px — don't hide header until scrolled past this
  var SHOW_THRESHOLD = 150;       // px — cumulative up-scroll required before header starts to appear
  var REVEAL_RANGE = 100;         // px — additional scroll over which header translates from hidden → shown

  function onScroll() {
    var siteHeader = document.getElementById('site-header');
    var mainNav = document.getElementById('main-nav');
    if (!siteHeader || !mainNav) return;
    var currentScrollY = window.scrollY;
    var isMobile = window.innerWidth < 768;

    if (!isMobile) {
      // Reset desktop state
      siteHeader.style.transform = '';
      siteHeader.classList.remove('site-header--hidden');
      mainNav.classList.remove('site-header--hidden');
      upAccumulator = 0;
      lastScrollY = currentScrollY;
      return;
    }

    var delta = lastScrollY - currentScrollY; // positive = scrolling up

    if (currentScrollY <= HIDE_THRESHOLD) {
      // Near top: always show
      siteHeader.style.transform = '';
      siteHeader.classList.remove('site-header--hidden');
      mainNav.classList.remove('site-header--hidden');
      upAccumulator = 0;
    } else if (delta < 0) {
      // Scrolling down: hide immediately, reset accumulator
      upAccumulator = 0;
      siteHeader.style.transform = '';
      siteHeader.classList.add('site-header--hidden');
      mainNav.classList.add('site-header--hidden');
    } else if (delta > 0) {
      // Scrolling up: accumulate
      upAccumulator += delta;

      if (upAccumulator >= SHOW_THRESHOLD) {
        // Header is fully shown — beyond threshold
        siteHeader.classList.remove('site-header--hidden');
        mainNav.classList.remove('site-header--hidden');
        siteHeader.style.transform = '';
      } else {
        // Progressive reveal: map accumulator → translateY
        // At accumulator = 0, translateY = -100% (hidden)
        // At accumulator = SHOW_THRESHOLD, translateY = 0% (shown)
        // Clamp to REVEAL_RANGE for smooth proportional slide
        var progress = Math.min(upAccumulator / SHOW_THRESHOLD, 1);
        var translatePct = -(100 - progress * 100);
        // Round to 1 decimal to avoid sub-pixel jitter
        translatePct = Math.round(translatePct * 10) / 10;
        siteHeader.style.transform = 'translateY(' + translatePct + '%)';
        // Remove the binary hidden class during progressive reveal so CSS
        // transition doesn't fight our inline transform
        siteHeader.classList.remove('site-header--hidden');
        mainNav.classList.remove('site-header--hidden');

        // Also slide main-nav in sync
        if (mainNav) {
          mainNav.style.transform = 'translateY(' + translatePct + '%)';
        }
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
