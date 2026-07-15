// Custom Google Reviews Popup
(function(){
  if(window.innerWidth < 769) return;
  
  var css = `.br-review-popup{position:fixed;bottom:20px;right:20px;z-index:99998;background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.2);width:380px;max-width:90vw;overflow:hidden;font-family:Montserrat,sans-serif;display:none;animation:brSlideIn .4s ease}
.br-review-popup.show{display:block}@keyframes brSlideIn{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}
.br-review-header{background:#2257A6;color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.br-review-header h3{margin:0;font-size:16px;color:#fff}
.br-review-close{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:0;line-height:1}
.br-review-body{padding:0 20px 16px;max-height:160px;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none}
.br-review-body::-webkit-scrollbar{display:none}
.br-review-card{padding:12px 0;border-bottom:1px solid #eee;cursor:pointer;transition:background .2s}
.br-review-card:last-child{border-bottom:none}
.br-review-stars{color:#f86f26;font-size:14px;margin-bottom:4px}
.br-review-name{font-weight:700;font-size:13px;color:#333}
.br-review-text{font-size:12px;color:#666;margin-top:4px;line-height:1.5;max-height:36px;overflow:hidden;transition:max-height .4s}
.br-review-text.expanded{max-height:500px!important}
.br-review-time{font-size:10px;color:#999;margin-top:4px}
.br-read-more{font-size:11px;color:#2257A6;margin-top:2px;cursor:pointer;display:none}
.br-review-card.long .br-read-more{display:block}
.br-review-footer{text-align:center;padding:16px 20px;border-top:1px solid #eee}
.br-review-btn{display:inline-block;background:#f86f26;color:#fff!important;padding:10px 24px;border-radius:25px;text-decoration:none;font-size:14px;font-weight:600;transition:background .3s}
.br-review-btn:hover{background:#e05a15}
.br-review-loading{text-align:center;padding:20px;color:#999;font-size:13px}
`;
  
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  
  // Popup
  var popup = document.createElement('div');
  popup.className = 'br-review-popup';
  popup.innerHTML = '<div class="br-review-header"><h3>★★★★★ Our Reviews</h3><button class="br-review-close">&times;</button></div><div class="br-review-body"><div class="br-review-loading">Loading reviews...</div></div><div class="br-review-footer"><a href="/reviews/" class="br-review-btn">More Reviews</a></div>';
  document.body.appendChild(popup);
  
  // Absolute last-resort fallback if /api/reviews itself fails entirely.
  // The canonical fallback lives in api/fallback-reviews.js — this small
  // inline set only fires if the server endpoint is completely unreachable.
  var fallbackReviews = [
    {name:'Mary V.',time:'a week ago',rating:5,text:'Bratton Physical Therapy took care of me 7 years ago when I had a total knee replacement. They gave me excellent care! Jena is not only an expert in her field, she is also caring.'},
    {name:'Susan B.',time:'3 weeks ago',rating:5,text:'I had trouble with my right knee. It felt stiff, sore and achy. I tried Bratton Therapy Centre and it was the best decision ever. They came up with a special exercise program just for me.'},
    {name:'Alfred J.',time:'a week ago',rating:5,text:'The staff is very professional. All guide your routine with caution and care. I began recovery after my first visit. I know my recovery is in good hands. Give them a call!'}
  ];
  
  var allReviews = [];
  var loaded = false;
  
  // Hide/show the inline HTML trigger button
  function hideBtn(){
    var b = document.querySelector('.br-trigger-btn');
    if(b) b.classList.add('br-hidden');
  }
  function showBtn(){
    var b = document.querySelector('.br-trigger-btn');
    if(b) b.classList.remove('br-hidden');
  }
  
  function openPopup(){
    popup.classList.add('show');
    hideBtn();
    loadReviews();
  }
  
  function closePopup(){
    popup.classList.remove('show');
    showBtn();
  }
  
  function renderReviews(reviews){
    allReviews = reviews;
    var body = popup.querySelector('.br-review-body');
    if(!reviews.length){
      body.innerHTML = '<p style="text-align:center;color:#999;padding:20px">No reviews yet!</p>';
      return;
    }
    body.innerHTML = reviews.map(function(r, i){
      var isLong = r.text.length > 150;
      var displayText = isLong ? r.text.substring(0, 150) + '...' : r.text;
      var cls = isLong ? ' br-review-card long' : ' br-review-card';
      return '<div class="' + cls + '" data-idx="' + i + '">' +
        '<div class="br-review-stars">' + '★'.repeat(r.rating) + '</div>' +
        '<div class="br-review-name">' + r.name + '</div>' +
        '<div class="br-review-text" data-idx="' + i + '">' + displayText + '</div>' +
        '<div class="br-read-more" data-idx="' + i + '">Read more ▼</div>' +
        '<div class="br-review-time">' + (r.relative_time || r.time) + '</div>' +
        '</div>';
    }).join('');
    
    body.querySelectorAll('.br-review-card').forEach(function(card){
      card.addEventListener('click', function(e){
        if(e.target.classList.contains('br-read-more')) return;
        var idx = parseInt(this.getAttribute('data-idx'));
        var textEl = this.querySelector('.br-review-text');
        var moreEl = this.querySelector('.br-read-more');
        toggleText(textEl, moreEl, idx);
      });
    });
    body.querySelectorAll('.br-read-more').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-idx'));
        var textEl = body.querySelector('.br-review-text[data-idx="' + idx + '"]');
        toggleText(textEl, this, idx);
      });
    });
  }
  
  function toggleText(textEl, moreEl, idx){
    var review = allReviews[idx];
    if(!review) return;
    if(textEl.classList.contains('expanded')){
      textEl.classList.remove('expanded');
      textEl.textContent = review.text.length > 150 ? review.text.substring(0, 150) + '...' : review.text;
      if(moreEl) moreEl.innerHTML = 'Read more ▼';
    } else {
      textEl.classList.add('expanded');
      textEl.textContent = review.text;
      if(moreEl) moreEl.innerHTML = 'Show less ▲';
    }
  }
  
   function loadReviews(){
     if(loaded) return;
     loaded = true;

     // Use reviews already fetched by the page (homepage/reviews page) —
     // no API call from the popup itself.
     if (window.__sharedReviews && window.__sharedReviews.length) {
       renderReviews(window.__sharedReviews);
       return;
     }

     renderReviews(fallbackReviews);
   }
  
  // Close on outside click
  document.addEventListener('click', function(e){
    if(popup.classList.contains('show') && !popup.contains(e.target) && !e.target.closest('.br-trigger-btn')){
      closePopup();
    }
  });
  
  // Close button
  popup.querySelector('.br-review-close').addEventListener('click', function(e){
    e.stopPropagation();
    closePopup();
  });
  
  // Auto-open after 5 seconds
  setTimeout(function(){
    openPopup();
  }, 5000);
})();