// Prompt EMR scheduling embed — expand/collapse controls + best-effort auto-height.
(function () {
  'use strict';

  var embed = document.getElementById('booking-embed');
  var expandBtn = document.getElementById('booking-embed-expand');
  var label = document.querySelector('.booking-embed__btn-label');

  if (!embed || !expandBtn) {
    return;
  }

  function setExpanded(expanded) {
    embed.classList.toggle('is-expanded', expanded);
    expandBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (label) {
      label.textContent = expanded ? 'Collapse Form' : 'Expand Form';
    }
  }

  expandBtn.addEventListener('click', function () {
    setExpanded(!embed.classList.contains('is-expanded'));
  });

  // Collapse the expanded view with Escape.
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && embed.classList.contains('is-expanded')) {
      setExpanded(false);
      expandBtn.focus();
    }
  });

  // Best-effort height sync: Prompt EMR does not currently send a height
  // postMessage to the parent, but listen in case it is added later. We only
  // resize when the embed is collapsed so the expanded view is unaffected.
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object') {
      return;
    }
    var height = data.height || data.frameHeight || data.bookingHeight;
    if (typeof height === 'number' && height > 0) {
      var viewport = document.getElementById('booking-embed-viewport');
      if (viewport && !embed.classList.contains('is-expanded')) {
        viewport.style.height = height + 'px';
      }
    }
  });
})();
