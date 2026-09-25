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
    toggleEl.setAttribute('aria-controls', 'main-nav');
    toggleEl.setAttribute('aria-expanded', 'false');
    toggleEl.setAttribute('aria-label', 'Open menu');
    closeBtn.type = 'button';

    var mobile = window.matchMedia('(max-width: 767px)');
    var backgroundState = [];
    var savedOverflow = null;
    var dropdowns = [];
    var lastFocusInNav = false;

    function setDropdown(item, expanded) {
      item.wrapper.classList.toggle('open', expanded);
      item.button.setAttribute('aria-expanded', String(expanded));
      if (!mobile.matches) item.link.setAttribute('aria-expanded', String(expanded));
      item.menu.hidden = !expanded;
    }

    function syncDropdownControls() {
      dropdowns.forEach(function(item){
        if (mobile.matches) {
          item.link.removeAttribute('aria-expanded');
          item.link.removeAttribute('aria-controls');
        } else {
          item.link.setAttribute('aria-controls', item.menu.id);
          item.link.setAttribute('aria-expanded', item.button.getAttribute('aria-expanded'));
        }
      });
    }

    navEl.querySelectorAll('.nav__dropdown').forEach(function(wrapper, index){
      var link = wrapper.querySelector(':scope > .nav__link');
      var menu = wrapper.querySelector(':scope > .nav__dropdown-menu');
      if (!link || !menu) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav__submenu-toggle';
      button.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      button.setAttribute('aria-label', link.textContent.trim() + ' submenu');
      menu.id = 'nav-submenu-' + index;
      button.setAttribute('aria-controls', menu.id);
      link.insertAdjacentElement('afterend', button);
      var item = { wrapper: wrapper, link: link, button: button, menu: menu };
      dropdowns.push(item);
      setDropdown(item, false);
      button.addEventListener('click', function(){
        var expanded = button.getAttribute('aria-expanded') !== 'true';
        dropdowns.forEach(function(other){ if (other !== item) setDropdown(other, false); });
        setDropdown(item, expanded);
      });
      wrapper.addEventListener('mouseenter', function(){
        if (!mobile.matches) setDropdown(item, true);
      });
      wrapper.addEventListener('mouseleave', function(){
        if (!mobile.matches && !wrapper.contains(document.activeElement)) setDropdown(item, false);
      });
      wrapper.addEventListener('focusout', function(e){
        if (!wrapper.contains(e.relatedTarget)) setDropdown(item, false);
      });
      link.addEventListener('focus', function(){
        if (!mobile.matches) setDropdown(item, true);
      });
      wrapper.addEventListener('keydown', function(e){
        if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
          e.preventDefault();
          e.stopPropagation();
          setDropdown(item, false);
          (mobile.matches ? button : link).focus();
          setDropdown(item, false);
        }
        if (e.key === 'ArrowDown' && (e.target === button || (!mobile.matches && e.target === link))) {
          e.preventDefault();
          setDropdown(item, true);
          var firstLink = menu.querySelector('a[href]');
          if (firstLink) firstLink.focus();
        }
      });
    });
    syncDropdownControls();

    // Inert the siblings at each ancestor level, not an ancestor of the drawer.
    // This also works if the shared header is initially nested in a wrapper.
    function isolateDrawer() {
      var branch = navEl;
      while (branch && branch !== document.body) {
        Array.from(branch.parentElement.children).forEach(function(el){
          if (el === branch || el === overlay || /^(SCRIPT|STYLE|LINK)$/.test(el.tagName)) return;
          backgroundState.push({ element: el, inert: el.inert });
          el.inert = true;
        });
        branch = branch.parentElement;
      }
    }

    function restoreBackground() {
      backgroundState.forEach(function(state){ state.element.inert = state.inert; });
      backgroundState = [];
    }

    function drawerFocusables() {
      return Array.from(navEl.querySelectorAll('a[href], button, [tabindex]')).filter(function(el){
        return el.tabIndex >= 0 && !el.disabled && el.getClientRects().length && !el.closest('[inert]');
      });
    }

    function open() {
      if (!mobile.matches || navEl.classList.contains('nav--open')) return;
      navEl.classList.add('nav--open');
      overlay.classList.add('menu-overlay--visible');
      toggleEl.classList.add('mobile-menu-btn--open');
      toggleEl.innerHTML = '&times;';
      toggleEl.setAttribute('aria-expanded', 'true');
      toggleEl.setAttribute('aria-label', 'Close menu');
      lockScroll();
      closeBtn.focus();
      isolateDrawer();
    }

    function close(restoreFocus) {
      var wasOpen = navEl.classList.contains('nav--open');
      navEl.classList.remove('nav--open');
      overlay.classList.remove('menu-overlay--visible');
      toggleEl.classList.remove('mobile-menu-btn--open');
      toggleEl.innerHTML = '&#x2630;';
      toggleEl.setAttribute('aria-expanded', 'false');
      toggleEl.setAttribute('aria-label', 'Open menu');
      restoreBackground();
      dropdowns.forEach(function(item){ setDropdown(item, false); });
      unlockScroll();
      if (wasOpen && restoreFocus !== false && mobile.matches) toggleEl.focus();
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
      savedOverflow = [document.documentElement.style.overflow, document.body.style.overflow];
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.addEventListener('touchmove', preventBodyScroll, { passive: false });
    }

    function unlockScroll() {
      if (savedOverflow) {
        document.documentElement.style.overflow = savedOverflow[0];
        document.body.style.overflow = savedOverflow[1];
        savedOverflow = null;
      }
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
      if (!navEl.classList.contains('nav--open')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'Tab') {
        var items = drawerFocusables();
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    document.addEventListener('focusin', function(e){
      // A breakpoint can hide the focused control before the media-query
      // callback runs. Remember its location across that browser blur.
      if (e.target !== document.body) lastFocusInNav = navEl.contains(e.target);
      if (navEl.classList.contains('nav--open') && !navEl.contains(e.target)) closeBtn.focus();
    });
    document.addEventListener('click', function(e){
      if (!navEl.contains(e.target)) dropdowns.forEach(function(item){ setDropdown(item, false); });
    });
    navEl.addEventListener('click', function(e){
      if (e.target.closest('a[href]') && mobile.matches) close(false);
    });
    mobile.addEventListener('change', function(){
      var focusWasInNav = navEl.contains(document.activeElement) ||
        (document.activeElement === document.body && lastFocusInNav) ||
        navEl.classList.contains('nav--open');
      close(false);
      syncDropdownControls();
      if (focusWasInNav) {
        if (mobile.matches) toggleEl.focus();
        else navEl.querySelector('a[href]').focus();
      }
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
      if (obs2) obs2.disconnect();
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

