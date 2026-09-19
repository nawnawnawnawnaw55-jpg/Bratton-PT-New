// ===== Home Page Interactions =====
// Recovery phase tabs, services carousel, and scroll reveal.
// Each block is guarded so the file is safe to load on any page.
(function(){
  'use strict';

  // ---- Recovery phase tabs ----
  var recoveryTabs = document.querySelectorAll('.recovery__tab');
  if (recoveryTabs.length) {
    function switchPhase(n){
      document.querySelectorAll('.recovery__content').forEach(function(el, i){ el.hidden = i !== n; });
      document.querySelectorAll('.recovery__tab').forEach(function(el, i){ el.classList.toggle('recovery__tab--active', i === n); });
    }
    recoveryTabs.forEach(function(tab, i){
      tab.addEventListener('click', function(){ switchPhase(i); });
    });
  }

  // ---- Services carousel ----
  var grid = document.getElementById('service-grid');
  if (grid) {
    function updateArrows(){
      var card = grid.querySelector('.service-card');
      if (!card) return;
      var cw = card.offsetWidth + 14;
      var maxScroll = grid.scrollWidth - grid.clientWidth;
      var pos = grid.scrollLeft;
      var atStart = pos < 10;
      var atEnd = pos > maxScroll - 10;
      var la = document.querySelector('.carousel-arrow--left');
      var ra = document.querySelector('.carousel-arrow--right');
      var wrap = document.querySelector('.service-carousel-wrap');
      if (la) { la.classList.toggle('show', !atStart); }
      if (ra) { ra.classList.toggle('show', !atEnd); }
      if (wrap) { wrap.classList.toggle('at-start', atStart); wrap.classList.toggle('at-end', atEnd); }
      // Highlight center card (mobile only)
      if (window.innerWidth < 480) {
        var cards = grid.querySelectorAll('.service-card');
        var centerX = pos + grid.clientWidth / 2;
        var closest = null;
        var closestDist = Infinity;
        cards.forEach(function(c){
          var cx = c.offsetLeft + c.offsetWidth / 2;
          var dist = Math.abs(cx - centerX);
          if (dist < closestDist) { closest = c; closestDist = dist; }
          c.style.opacity = '0.6';
          c.style.transform = 'scale(0.92)';
          c.style.pointerEvents = 'none';
        });
        if (closest) {
          closest.style.opacity = '1';
          closest.style.transform = 'scale(1)';
          closest.style.pointerEvents = 'auto';
        }
      }
    }

    function scrollServices(dir){
      var card = grid.querySelector('.service-card');
      if (!card) return;
      var cw = card.offsetWidth + 14;
      var maxScroll = grid.scrollWidth - grid.clientWidth;
      var newPos = Math.max(0, Math.min(maxScroll, grid.scrollLeft + dir * cw));
      grid.scrollTo({ left: newPos, behavior: 'smooth' });
      setTimeout(updateArrows, 450);
    }

    var la = document.querySelector('.carousel-arrow--left');
    var ra = document.querySelector('.carousel-arrow--right');
    if (la) { la.addEventListener('click', function(){ scrollServices(-1); }); }
    if (ra) { ra.addEventListener('click', function(){ scrollServices(1); }); }

    grid.addEventListener('scroll', updateArrows);
    updateArrows();
    setTimeout(updateArrows, 300);
    setTimeout(updateArrows, 700);
  }

  // ---- Scroll Reveal ----
  var revealEls = document.querySelectorAll('.reveal-on-scroll');
  if (revealEls.length) {
    function checkReveals(){
      var windowH = window.innerHeight;
      revealEls.forEach(function(el){
        var rect = el.getBoundingClientRect();
        if (rect.top < windowH * 0.85) {
          el.classList.add('revealed');
        }
      });
    }
    var revealTicking = false;
    window.addEventListener('scroll', function(){
      if (!revealTicking) {
        requestAnimationFrame(function(){
          checkReveals();
          revealTicking = false;
        });
        revealTicking = true;
      }
    }, { passive: true });
    // Initial check
    setTimeout(checkReveals, 200);
  }
})();
