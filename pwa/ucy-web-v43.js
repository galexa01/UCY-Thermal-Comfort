/* UCY Heat v4.3 — minor UX polish. Preserves current scientific behaviour. */
(function(){
  'use strict';
  if(window.__UCY_WEB_V43_STARTED)return;
  window.__UCY_WEB_V43_STARTED=true;
  var current=document.currentScript;
  var root=current&&current.src?new URL('.',current.src).href:'../pwa/';
  function nowcast(){
    try{return typeof window.v9Nowcast==='function' && !!window.v9Nowcast()}catch(e){return false}
  }
  function applyBrand(){
    var brand=document.querySelector('#sidebar .sidebar-brand');
    if(!brand)return;
    var h1=brand.querySelector('h1');
    if(!h1)return;
    if(!brand.querySelector('.ucy-v43-brand-row')){
      var row=document.createElement('div');
      row.className='ucy-v43-brand-row';
      var img=document.createElement('img');
      img.className='ucy-v43-brandmark';
      img.alt='UCY Heat';
      img.src=root+'ucy-mark.png';
      h1.parentNode.insertBefore(row,h1);
      row.appendChild(img);
      row.appendChild(h1);
    }
  }
  function applyLabels(){
    var dataLabel=document.querySelector('#ucy-v4-comfort .ucy-v4-data-label');
    if(dataLabel){
      dataLabel.textContent=nowcast()
        ? 'Latest AURA update (Cyprus time)'
        : 'Selected ECMWF forecast hour (Cyprus time)';
    }
    var weatherSmall=document.querySelector('#ucy-v4-weather .weather-heading small');
    if(weatherSmall){
      weatherSmall.textContent=nowcast()
        ? 'AURA · latest available observation'
        : 'ECMWF · selected forecast hour';
    }
  }
  function fixToolbarArrow(){
    var btn=document.getElementById('ucy-v4-tools-toggle');
    var toolbar=document.querySelector('.top-controls');
    if(!btn||!toolbar)return;
    var closed=toolbar.classList.contains('ucy-v4-tools-closed');
    btn.textContent=closed?'‹':'›';
    btn.setAttribute('aria-expanded',String(!closed));
    btn.setAttribute('aria-label',closed?'Expand map toolbar':'Collapse map toolbar');
    btn.title=closed?'Expand map toolbar':'Collapse map toolbar';
  }
  function forceOpenPrimarySections(){
    ['ucy-v4-layers','ucy-v4-comfort','ucy-v4-weather'].forEach(function(id){
      var el=document.getElementById(id);
      if(el)el.open=true;
    });
  }
  function apply(){
    applyBrand();
    applyLabels();
    fixToolbarArrow();
    forceOpenPrimarySections();
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',apply,{once:true});
  }else apply();
  window.addEventListener('load',apply,{once:true});
  setTimeout(apply,600);
  setTimeout(apply,1800);
  setInterval(function(){ applyLabels(); fixToolbarArrow(); },1000);
  try{
    new MutationObserver(function(){ applyLabels(); fixToolbarArrow(); })
      .observe(document.body,{attributes:true,attributeFilter:['class'],subtree:false});
  }catch(e){}
})();
