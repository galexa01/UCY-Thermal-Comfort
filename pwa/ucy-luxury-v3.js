/* UCY Heat — luxury layer animation + MapLibre camera choreography. No video. */
(function(){
  'use strict';
  if(window.__UCY_LUXURY_V3_STARTED)return;
  window.__UCY_LUXURY_V3_STARTED=true;
  var current=document.currentScript;
  var root=current&&current.src?new URL('.',current.src).href:'../pwa/';
  var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var state=window.__UCY_LUXURY_V3={status:'loading',cameraStatus:'not-requested'};
  function emit(phase){
    try{window.dispatchEvent(new CustomEvent('ucyheat:luxury:camera',{detail:{phase:phase,reduced:reduced}}))}
    catch(e){state.cameraStatus='event-failed'}
  }
  function init(){
    if(!document.body)return;
    var el=document.createElement('div');
    el.id='ucy-luxury-v3';el.setAttribute('aria-label','UCY Heat opening animation');
    el.innerHTML='<div class="ucy-luxury-center">'+
      '<div class="ucy-luxury-glow"></div>'+
      '<img class="ucy-luxury-piece ucy-luxury-base" alt="" src="'+root+'ucy-base.png">'+
      '<img class="ucy-luxury-piece ucy-luxury-sun" alt="" src="'+root+'ucy-sun.png">'+
      '<img class="ucy-luxury-piece ucy-luxury-thermo" alt="" src="'+root+'ucy-thermometer.png">'+
      '<div class="ucy-luxury-line-wrap"><img class="ucy-luxury-piece" alt="" src="'+root+'ucy-signature.png"></div>'+
      '<img class="ucy-luxury-piece ucy-luxury-complete" alt="" src="'+root+'ucy-mark.png">'+
      '</div><div class="ucy-luxury-type"><div class="ucy-luxury-title"><strong>UCY</strong> Heat</div><div class="ucy-luxury-subtitle">THERMAL COMFORT FORECAST</div></div>'+
      '<div class="ucy-luxury-bottom">UNIVERSITY OF CYPRUS</div>';
    document.body.appendChild(el);state.status='playing';
    // Place hidden map in a close 3D view before uncovering it.
    setTimeout(function(){emit('prepare')},reduced?40:2100);
    // Execute continuous camera easing while splash dissolves.
    setTimeout(function(){emit('animate')},reduced?80:3650);
    setTimeout(function(){el.classList.add('ucy-luxury-exit');state.status='fading'},reduced?100:3900);
    setTimeout(function(){el.remove();state.status='complete';try{window.dispatchEvent(new Event('ucyheat:luxury:end'))}catch(e){}},reduced?160:5100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
