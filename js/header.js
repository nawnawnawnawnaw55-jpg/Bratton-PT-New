// ===== Shared Header Loader =====
// Fetches the shared nav template and injects #main-nav as a sibling of
// #site-header (so position:sticky works), then wires the mobile menu toggle
// and active-link highlighting. Replaces the previously inlined script.
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
      var toggle=document.getElementById('menu-toggle');
      var nav=document.getElementById('main-nav');
      if(toggle&&nav){toggle.addEventListener('click',function(){nav.classList.toggle('nav--open')})}
      var path=window.location.pathname;
      document.querySelectorAll('.nav__link').forEach(function(link){
        link.classList.toggle('nav__link--active',link.getAttribute('href')===path);
      });
      window.initStickyNav&&window.initStickyNav();
    });
})();
