/* UCY Heat v4.10: measure ticker height for the Nowcast-only mobile stack.
 * v4.9 moves the existing ticker outside bottomPanel; here we only re-position it.
 */
(function(){
  'use strict';
  if(window.__UCY_NOWCAST_MOBILE_V410)return;
  window.__UCY_NOWCAST_MOBILE_V410=true;
  var mobile=window.matchMedia('(max-width:768px)');
  var observer=null;
  function measure(){
    if(!mobile.matches || !document.body.classList.contains('v9-nowcast'))return;
    var ticker=document.getElementById('ucy-nowcast-mobile-announcement');
    if(!ticker)return;
    var h=ticker.getBoundingClientRect().height;
    if(h>0 && Number.isFinite(h)){
      document.documentElement.style.setProperty('--ucy-v410-notice-height',Math.ceil(h)+'px');
    }
    if(typeof ResizeObserver==='function'&&!observer){
      observer=new ResizeObserver(function(){measure();});
      observer.observe(ticker);
    }
  }
  function sync(){
    if(mobile.matches && document.body.classList.contains('v9-nowcast')){
      requestAnimationFrame(measure);
    }else{
      document.documentElement.style.removeProperty('--ucy-v410-notice-height');
    }
  }
  function start(){
    sync();
    window.addEventListener('resize',sync,{passive:true});
    window.addEventListener('orientationchange',sync,{passive:true});
    if(mobile.addEventListener)mobile.addEventListener('change',sync);
    else if(mobile.addListener)mobile.addListener(sync);
    new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
    window.addEventListener('load',sync,{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
