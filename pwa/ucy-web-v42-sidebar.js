/* UCY Heat v4.2 — only default expansion states; preserve manual toggles. */
(function(){
  'use strict';
  function configure(){
    var layers=document.getElementById('ucy-v4-layers');
    var comfort=document.getElementById('ucy-v4-comfort');
    var weather=document.getElementById('ucy-v4-weather');
    if(!layers||!comfort||!weather)return;
    layers.open=true;
    comfort.open=true;
    weather.open=true;
    var opacity=document.getElementById('layerBody');
    var toggle=document.getElementById('layerToggle');
    if(opacity)opacity.hidden=true;
    if(toggle)toggle.setAttribute('aria-expanded','false');
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',configure,{once:true});
  }else{
    configure();
  }
})();
