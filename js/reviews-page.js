// ===== Reviews Page (grid + overall stats) =====
// Renders the full reviews list with event delegation (no inline handlers).
(function(){
  var grid = document.getElementById('reviews-page-grid');
  var statsEl = document.getElementById('overall-stats');
  if (!grid || !statsEl) return;

  var avatarColors = ['var(--success)','var(--primary)','var(--accent)','var(--primary-dark)','var(--secondary)','#e74c3c','#8e44ad','#16a085'];
  var reviews = [];

  function formatRelativeTime(timeStr){
    if (!timeStr) return '';
    var then;
    // Handle Unix timestamp — seconds since epoch (numeric or numeric string)
    if (typeof timeStr === 'number' || /^\d+$/.test(timeStr)){
      var ts = parseInt(timeStr, 10);
      then = new Date(ts * 1000);
    } else {
      if (isNaN(Date.parse(timeStr))) return timeStr;
      then = new Date(timeStr);
    }
    var now = new Date();
    var diffMs = now - then;
    if (diffMs < 0) return timeStr;
    var minutes = Math.floor(diffMs / 60000);
    var hours   = Math.floor(diffMs / 3600000);
    var days    = Math.floor(diffMs / 86400000);
    var weeks   = Math.floor(days / 7);
    var months  = Math.floor(days / 30);
    var years   = Math.floor(days / 365);
    if (minutes < 1)  return 'Just now';
    if (minutes < 60) return minutes + ' ' + (minutes === 1 ? 'minute' : 'minutes') + ' ago';
    if (hours < 24)   return hours + ' ' + (hours === 1 ? 'hour' : 'hours') + ' ago';
    if (days < 7)     return days + ' ' + (days === 1 ? 'day' : 'days') + ' ago';
    if (weeks < 5)    return weeks + ' ' + (weeks === 1 ? 'week' : 'weeks') + ' ago';
    if (months < 12)  return months + ' ' + (months === 1 ? 'month' : 'months') + ' ago';
    return years + ' ' + (years === 1 ? 'year' : 'years') + ' ago';
  }

  function getInitials(name){
    return (name||'?').split(' ').map(function(w){return w.charAt(0).toUpperCase()}).join('').substring(0,2);
  }

  function starStr(r){return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));}

  function escapeHTML(str){
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function toggleReview(idx){
    var review = reviews[idx];
    if (!review) return;
    var textEl = grid.querySelector('.review-card__text[data-idx="' + idx + '"]');
    if (!textEl) return;
    var readmoreEl = grid.querySelector('.review-card__readmore[data-idx="' + idx + '"]');
    var isExpanded = textEl.classList.contains('expanded');
    if (isExpanded){
      textEl.classList.remove('expanded');
      textEl.style.maxHeight = '';
      textEl.style.overflow = '';
      textEl.textContent = review.text.length > 150 ? review.text.substring(0, 150) + '...' : review.text;
      if (readmoreEl) readmoreEl.innerHTML = 'Read more ▼';
    } else {
      textEl.classList.add('expanded');
      textEl.style.maxHeight = 'none';
      textEl.style.overflow = 'visible';
      textEl.textContent = review.text;
      if (readmoreEl) readmoreEl.innerHTML = 'Show less ▲';
    }
  }

  function renderReviews(list, overallRating, totalReviews){
    reviews = list;

    // Overall stats — Glass + Google branded card
    statsEl.innerHTML = '<a href="https://search.google.com/local/reviews?placeid=ChIJicdBse3mnYgRyU49RjVmRs0" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;">' +
        '<div class="stats-google-g">G</div>' +
        '<span class="stats-google-label">Google</span>' +
      '</a>' +
      '<div class="stats-rating-block">' +
        '<div class="overall-rating">' + overallRating.toFixed(1) + '</div>' +
        '<div class="overall-stars">' + starStr(overallRating) + '</div>' +
        '<div class="overall-count">Based on ' + totalReviews + ' Google reviews</div>' +
        '<span class="review-subtitle">Showing ' + reviews.length + ' most recent</span>' +
      '</div>';

    // Review cards
    grid.innerHTML = reviews.map(function(r, i){
      var isLong = r.text.length > 150;
      var displayText = isLong ? escapeHTML(r.text.substring(0, 150)) + '...' : escapeHTML(r.text);
      var readMoreHTML = isLong
        ? '<span class="review-card__readmore" data-idx="' + i + '">Read more ▼</span>'
        : '';
      var photoHTML = r.photo
        ? '<div class="review-card__avatar" style="background:' + avatarColors[i % avatarColors.length] + '"><img src="' + escapeHTML(r.photo) + '" referrerpolicy="no-referrer" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover"></div>'
        : '<div class="review-card__avatar" style="background:' + avatarColors[i % avatarColors.length] + '">' + getInitials(r.name) + '</div>';
      var timeDisplay = formatRelativeTime(r.time);
      return '<div class="review-card">' +
        '<div class="review-card__header">' +
        photoHTML +
        '<div><div class="review-card__stars">' + starStr(r.rating) + '</div><strong>' + escapeHTML(r.name) + '</strong></div>' +
        '</div>' +
        '<p class="review-card__text" data-idx="' + i + '">' + displayText + '</p>' +
        (timeDisplay ? '<div class="review-card__time">' + timeDisplay + '</div>' : '') +
        readMoreHTML +
        '</div>';
    }).join('');
  }
  // Event delegation (CSP-safe, no inline onclick attributes)
  grid.addEventListener('click', function(e){
    var readmore = e.target.closest('.review-card__readmore');
    if (readmore) { e.preventDefault(); toggleReview(parseInt(readmore.getAttribute('data-idx'), 10)); return; }
    var text = e.target.closest('.review-card__text');
    if (text) { e.preventDefault(); toggleReview(parseInt(text.getAttribute('data-idx'), 10)); }
  });

  // The server-side cache (api/reviews-cache.json, refreshed nightly) always
  // provides 20 reviews (archive real + curated filler). No client-side padding
  // or fallback duplication needed — api/fallback-reviews.js is the single
  // source of truth when fallback is necessary.
  fetch('/api/reviews?newest=20')
    .then(function(r){ return r.json(); })
    .then(function(data){
      var list = (data.reviews && data.reviews.length) ? data.reviews : [];
      if (list.length) {
        renderReviews(list, data.overall_rating || 5.0, data.total_reviews || list.length);
      } else {
        grid.innerHTML = '<p style="text-align:center;color:#fff;padding:40px">No reviews available right now. Please check back soon!</p>';
        statsEl.innerHTML = '';
      }
    })
    .catch(function(){
      grid.innerHTML = '<p style="text-align:center;color:#fff;padding:40px">Unable to load reviews. Please refresh the page or try again later.</p>';
      statsEl.innerHTML = '';
    });
})();
