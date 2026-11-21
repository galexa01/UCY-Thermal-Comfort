/* UCY Heat v4.1: layout-only enhancements. The scientific popup is inside the existing MapLibre module. */
(function(){
 'use strict';
 if(window.__UCY_V41_LAYOUT)return;
 window.__UCY_V41_LAYOUT=true;
 function init(){
  var brand=document.querySelector('#sidebar .sidebar-brand');
  if(brand){
   var h=brand.querySelector('h1');if(h)h.innerHTML='UCY <em>Heat</em>';
   var sub=brand.querySelector('.ucy-v41-tagline');
   if(!sub){sub=document.createElement('div');sub.className='ucy-v41-tagline';brand.appendChild(sub)}
   sub.textContent='Campus Thermal Comfort Forecast';
  }
  [['ucy-v4-layers','Map layers'],['ucy-v4-comfort','Time & thermal comfort'],['ucy-v4-weather','Weather conditions']].forEach(function(pair){
   var el=document.getElementById(pair[0]);
   if(!el)return;
   var title=el.querySelector('summary');if(title)title.textContent=pair[1];
  });
  var source=document.querySelector('#ucy-v4-comfort .ucy-v4-data-label');
  function updateSource(){
   if(source)source.textContent=document.body.classList.contains('v9-nowcast')
    ? 'Latest AURA observation (Cyprus time)'
    : 'Selected ECMWF forecast hour (Cyprus time)';
  }
  updateSource();
  if(source){new MutationObserver(updateSource).observe(document.body,{attributes:true,attributeFilter:['class']})}
  var toggle=document.getElementById('ucy-v4-tools-toggle');
  if(toggle){toggle.textContent='‹';toggle.title='Collapse or expand navigation';}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
