// ===== Shared Footer Loader =====
// Fetches the shared footer template and injects it into #site-footer.
// Deferred via requestIdleCallback so it never blocks first paint.
(function(){
  var fetchFooter = function(){
    fetch('/templates/footer.html')
      .then(function(r){return r.text()})
      .then(function(f){document.getElementById('site-footer').innerHTML=f});
  };
  if (window.requestIdleCallback) {
    requestIdleCallback(fetchFooter, { timeout: 3000 });
  } else {
    setTimeout(fetchFooter, 200);
  }
})();
