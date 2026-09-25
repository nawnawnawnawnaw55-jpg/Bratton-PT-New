// ===== Homepage Reviews (rotating cards + dots) =====
// Renders review cards with event delegation (no inline handlers).
(function(){
  var grid = document.getElementById('home-reviews-grid');
  var dots = document.getElementById('home-review-dots');
  if (!grid || !dots) return;

  var avatarColors = ['var(--success)','var(--primary)','var(--accent)','var(--primary-dark)','var(--primary)'];
  var reviews = [];
  var currentReview = 0;
  var autoTimer = null;

  function getInitials(name){
    return (name||'?').split(' ').map(function(w){return w.charAt(0).toUpperCase()}).join('').substring(0,2);
  }

  function starStr(r){return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));}

  function escapeHTML(str){
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function showReview(n){
    var cards = grid.querySelectorAll('.review-card');
    var dotEls = dots.querySelectorAll('.review-dot');
    cards.forEach(function(el, i){ el.classList.toggle('review-card--active', i === n); });
    dotEls.forEach(function(el, i){ el.classList.toggle('review-dot--active', i === n); });
    currentReview = n;
  }

  function startAuto(){
    if (autoTimer) clearInterval(autoTimer);
    if (!reviews.length) return;
    autoTimer = setInterval(function(){
      currentReview = (currentReview + 1) % reviews.length;
      showReview(currentReview);
    }, 5000);
  }

  function stopAuto(){
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function toggleReview(idx){
    var review = reviews[idx];
    if (!review) return;
    var textEl = grid.querySelector('.review-card__text[data-idx="' + idx + '"]');
    if (!textEl) return;
    var readmoreEl = grid.querySelector('.review-card__readmore[data-idx="' + idx + '"]');
    if (textEl.classList.contains('expanded')){
      textEl.classList.remove('expanded');
      textEl.style.maxHeight = '';
      textEl.style.overflow = '';
      textEl.textContent = review.text.length > 150 ? review.text.substring(0, 150) + '...' : review.text;
      if (readmoreEl) readmoreEl.innerHTML = 'Read more ▼';
      startAuto();
    } else {
      textEl.classList.add('expanded');
      textEl.style.maxHeight = 'none';
      textEl.style.overflow = 'visible';
      textEl.textContent = review.text;
      if (readmoreEl) readmoreEl.innerHTML = 'Show less ▲';
      stopAuto();
    }
  }

  function renderCards(list){
    reviews = list;
    grid.innerHTML = list.map(function(r, i){
      var active = i === 0 ? ' review-card--active' : '';
      var isLong = r.text.length > 150;
      var displayText = isLong ? escapeHTML(r.text.substring(0, 150)) + '...' : escapeHTML(r.text);
      var readMoreHTML = isLong ? '<span class="review-card__readmore" data-idx="' + i + '" style="display:block;color:var(--primary);font-size:.82rem;cursor:pointer;margin-top:6px;font-weight:600">Read more ▼</span>' : '';
      return '<div class="review-card' + active + '" data-review="' + i + '" data-idx="' + i + '">' +
        '<div class="review-card__header">' +
        '<div class="review-card__avatar" aria-hidden="true" style="position:relative;overflow:hidden;background:' + avatarColors[i % avatarColors.length] + '">' + escapeHTML(getInitials(r.name)) + '</div>' +
        '<div><div class="review-card__stars">' + starStr(r.rating) + '</div><strong>' + escapeHTML(r.name) + '</strong></div>' +
        '</div>' +
        '<p class="review-card__text" data-idx="' + i + '">' + displayText + '</p>' +
        readMoreHTML +
        '</div>';
    }).join('');

    // The nightly cache already supplies photo URLs. Assign through the DOM
    // rather than interpolating a URL into HTML; keep initials under the photo.
    var avatars = grid.querySelectorAll('.review-card__avatar');
    list.forEach(function(review, i){
      if (typeof review.photo !== 'string' || !review.photo.trim()) return;
      var url;
      try {
        url = new URL(review.photo);
      } catch (e) {
        return;
      }
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
      var image = document.createElement('img');
      image.alt = '';
      image.width = 44;
      image.height = 44;
      image.referrerPolicy = 'no-referrer';
      image.decoding = 'async';
      image.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:50%;object-fit:cover';
      image.addEventListener('error', function(){ image.remove(); });
      image.src = url.href;
      avatars[i].appendChild(image);
    });

    dots.innerHTML = list.map(function(_, i){
      var active = i === 0 ? ' review-dot--active' : '';
      return '<button class="review-dot' + active + '" data-idx="' + i + '" aria-label="Review ' + (i + 1) + '"></button>';
    }).join('');

    currentReview = 0;
    startAuto();
  }
  // Event delegation (CSP-safe, no inline onclick attributes)
  grid.addEventListener('click', function(e){
    var readmore = e.target.closest('.review-card__readmore');
    if (readmore) { e.preventDefault(); toggleReview(parseInt(readmore.getAttribute('data-idx'), 10)); return; }
    var card = e.target.closest('.review-card');
    if (card) { e.preventDefault(); toggleReview(parseInt(card.getAttribute('data-idx'), 10)); }
  });

  dots.addEventListener('click', function(e){
    var dot = e.target.closest('.review-dot');
    if (!dot) return;
    e.preventDefault();
    showReview(parseInt(dot.getAttribute('data-idx'), 10));
  });

  // Hardcoded fallback reviews (used when API is unreachable)
  var fallbackReviewsHome = [
    {name:'Gary L.',time:'8 months ago',rating:5,text:'Just want to thank Jena and staff for a great job in rehabbing my right rotator cuff. I had two complete tears out of the four muscles of the cuff. Jena and staff rehabbed my shoulder without a need for surgery.'},
    {name:'John C.',time:'1 year ago',rating:5,text:'The experience has been outstanding! When I first came to Bratton Physical Therapy I had sore ankles, couldn\'t walk more than 50 feet, getting up from sitting was painful. Now I can easily walk hundreds of yards, I have no pain.'},
    {name:'Barbara K.',time:'1 year ago',rating:5,text:'My journey at Bratton PT began after I spent 3 days, about 6 hours a day working on a ladder moving shelving over my head remodeling my master closet. I developed pain in my neck and upper back. I chose Bratton PT because I used them in the past.'},
    {name:'Nina S.',time:'2 years ago',rating:5,text:'Before coming I struggled picking up my son, sitting comfortably, and sleeping due to severe shoulder pain and limited neck mobility. Jena knew what the issue was immediately. She created a plan that quickly diminished my pain.'},
    {name:'Stephen D.',time:'3 years ago',rating:5,text:'After major rotator cuff surgery, I was unable to move my arm away from my side. I was also experiencing considerable pain related to the surgery. For my physical therapy treatment, my Surgeon recommended Jena Bratton, PT.'}
  ];

  // Fetch from API (cache-first, falls back to Google API, then hardcoded).
  // Wrapped in requestIdleCallback to defer the non-critical fetch.
  var doReviewsFetch = function(){
    fetch('/api/reviews')
      .then(function(r){
        if (!r.ok) throw new Error('Reviews request failed');
        return r.json();
      })
      .then(function(data){
        var allReviews = (data.reviews && data.reviews.length) ? data.reviews : [];
        // Homepage: show top 5-star reviews only, up to 5
        var top = allReviews.filter(function(r){ return r.rating === 5; }).slice(0, 5);
        if (top.length) {
          renderCards(top);
        } else {
          renderCards(fallbackReviewsHome);
        }
      })
      .catch(function(){
        renderCards(fallbackReviewsHome);
      });
  };

  if (window.requestIdleCallback) {
    requestIdleCallback(doReviewsFetch, { timeout: 3000 });
  } else {
    setTimeout(doReviewsFetch, 200);
  }
})();
