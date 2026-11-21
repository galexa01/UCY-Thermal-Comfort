/* UCY Heat v4.9 - fix only mobile Nowcast announcement positioning.
 * Move the real ticker DOM node outside the collapsible bottomPanel in
 * mobile Nowcast; restore it to its original location in Forecast/desktop.
 * Reuse #tickerTrack so existing statistics, text, and ticker animation remain.
 */
(function(){
  'use strict';
  if(window.__UCY_NOWCAST_TICKER_V49)return;
  window.__UCY_NOWCAST_TICKER_V49=true;

  var mobile=window.matchMedia('(max-width:768px)');
  var ticker=null, marker=null, oldDisplay='', oldPriority='';
  var moved=false;
  function isNowcast(){return document.body.classList.contains('v9-nowcast');}
  function findTicker(){
    if(ticker && ticker.isConnected)return ticker;
    ticker=document.querySelector('#bottomPanel .ticker');
    return ticker;
  }
  function offset(){
    if(!moved)return;
    var buttons=document.getElementById('ucyMobileButtons');
    /* Keep 10px between the entire notice and the TOP of mobile buttons. */
    var space=88;
    if(buttons){
      var rect=buttons.getBoundingClientRect();
      if(rect.height>0)space=Math.max(64,window.innerHeight-rect.top+10);
    }
    ticker.style.setProperty('--ucy-v49-nowcast-offset',Math.ceil(space)+'px');
  }
  function sync(){
    if(!document.body || !findTicker())return;
    var shouldMove=mobile.matches && isNowcast();
    if(shouldMove && !moved){
      var parent=ticker.parentNode;
      if(!parent || parent.id==='bottomPanel' && false)return;
      marker=document.createComment('UCY Nowcast announcement original position');
      parent.insertBefore(marker,ticker);
      oldDisplay=ticker.style.getPropertyValue('display');
      oldPriority=ticker.style.getPropertyPriority('display');
      ticker.id='ucy-nowcast-mobile-announcement';
      document.body.appendChild(ticker);
      ticker.style.display='flex';
      moved=true;
    } else if(!shouldMove && moved){
      if(marker && marker.parentNode)marker.parentNode.insertBefore(ticker,marker);
      if(marker && marker.parentNode)marker.remove();
      marker=null;
      ticker.removeAttribute('id');
      if(oldDisplay)ticker.style.setProperty('display',oldDisplay,oldPriority);
      else ticker.style.removeProperty('display');
      ticker.style.removeProperty('--ucy-v49-nowcast-offset');
      moved=false;
    }
    offset();
  }
  function init(){
    sync();
    var observer=new MutationObserver(sync);
    observer.observe(document.body,{attributes:true,attributeFilter:['class']});
    if(mobile.addEventListener)mobile.addEventListener('change',sync);
    else if(mobile.addListener)mobile.addListener(sync);
    window.addEventListener('resize',offset,{passive:true});
    window.addEventListener('orientationchange',offset,{passive:true});
    window.requestAnimationFrame(sync);
    /* #ucyMobileButtons is created by a separate deferred script. */
    window.addEventListener('load',function(){sync();window.requestAnimationFrame(offset)},{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
