// Fix sticky nav: MutationObserver moves nav out of #site-header to <body>
// This is necessary because position:sticky fails when the nav is nested inside
// a container (#site-header) that has no scrollable overflow room.
(function(){
  var observer = new MutationObserver(function(mutations, obs){
    var nav = document.getElementById('main-nav');
    var sh = document.getElementById('site-header');
    if (nav && sh && nav.parentNode === sh) {
      sh.parentNode.insertBefore(nav, sh.nextSibling);
      obs.disconnect();
    }
  });
  var sh = document.getElementById('site-header');
  if (sh) observer.observe(sh, { childList: true, subtree: true });
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
  var lastScrollY = window.scrollY;
  var ticking = false;
  var HIDE_THRESHOLD = 80;

  function onScroll() {
    var nav = document.getElementById('main-nav');
    if (!nav) return;
    var currentScrollY = window.scrollY;
    var isMobile = window.innerWidth < 768;

    if (!isMobile) {
      if (nav.classList.contains('nav--hidden')) {
        nav.classList.remove('nav--hidden');
      }
      lastScrollY = currentScrollY;
      return;
    }

    if (currentScrollY > HIDE_THRESHOLD) {
      if (currentScrollY > lastScrollY) {
        nav.classList.add('nav--hidden');
      } else if (currentScrollY < lastScrollY) {
        nav.classList.remove('nav--hidden');
      }
    } else {
      nav.classList.remove('nav--hidden');
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
