// ===== Shared Header Loader =====
// Fetches the shared nav template and injects #main-nav as a sibling of
// #site-header (so position:sticky works) and highlights the active link.
// The mobile menu toggle is wired up in js/main.js (which owns the overlay,
// close button, and scroll lock). Replaces the previously inlined script.
(function(){
  fetch('/templates/header.html')
    .then(function(r){return r.text()})
    .then(function(h){
      var temp=document.createElement('div');
      temp.innerHTML=h;
      var nav=temp.querySelector('#main-nav');
      if(nav){
        var sh=document.getElementById('site-header');
        sh.parentNode.insertBefore(nav,sh.nextSibling);
      }
    })
    .then(function(){
      var path=window.location.pathname;
      document.querySelectorAll('.nav__link').forEach(function(link){
        link.classList.toggle('nav__link--active',link.getAttribute('href')===path);
      });
      window.initStickyNav&&window.initStickyNav();
    });
})();
