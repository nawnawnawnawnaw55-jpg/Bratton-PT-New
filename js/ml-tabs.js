// ===== Medical Library Tabs =====
// Wires the accessible tab groups used across the medical library pages.
(function(){
  var tabs = document.querySelectorAll('.ml-tabs');
  tabs.forEach(function(tab){
    var btns = tab.querySelectorAll('.ml-tab-btn');
    var panels = tab.querySelectorAll('.ml-tab-panel');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = this.getAttribute('data-ml-tab');
        btns.forEach(function(b){ b.classList.remove('ml-tab-btn--active'); b.setAttribute('aria-selected','false'); });
        panels.forEach(function(p){ p.classList.remove('ml-tab-panel--active'); p.setAttribute('hidden',''); });
        this.classList.add('ml-tab-btn--active');
        this.setAttribute('aria-selected','true');
        var panel = tab.querySelector('[data-ml-tab-panel="' + id + '"]');
        if(panel){ panel.classList.add('ml-tab-panel--active'); panel.removeAttribute('hidden'); }
      });
    });
  });
})();
