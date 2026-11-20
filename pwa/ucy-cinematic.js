/* UCY Heat cinematic v2 — cinematic splash and campus zoom bridge.
 * Scope: splash only. Existing forecast models, map layers, and controls unchanged.
 */
(function () {
  'use strict';
  if (window.__UCY_CINEMA_V2_STARTED) return;
  window.__UCY_CINEMA_V2_STARTED = true;
  var script = document.currentScript;
  var assetRoot = script && script.src ? new URL('.', script.src).href : '../pwa/';
  var reduced = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var stats = window.__UCY_CINEMA_V2 = {zoomStatus:'pending', mapType:'MapLibre (campus bounds)'};
  var videoMs = reduced ? 250 : 3950;
  var fadeMs = reduced ? 80 : 1050;

  function run() {
    if (!document.body) return;
    // The old splash remains in the source file for publisher compatibility,
    // but is hidden by the isolated cinematic stylesheet.
    var splash = document.createElement('div');
    splash.id = 'ucy-cinema-v2';
    splash.setAttribute('role','status');
    splash.setAttribute('aria-label','UCY Heat loading');
    splash.innerHTML = '<div class="ucy-cinema-ambient"></div>'+
      '<div class="ucy-cinema-stage"><video class="ucy-cinema-film" muted playsinline preload="auto" poster="'+assetRoot+'ucy-cinematic-poster.jpg">'+
      '<source src="'+assetRoot+'ucy-cinematic.webm" type="video/webm">'+
      '<source src="'+assetRoot+'ucy-cinematic.mp4" type="video/mp4"></video><div class="ucy-cinema-flare"></div></div>'+
      '<div class="ucy-cinema-vignette"></div>'+
      '<div class="ucy-cinema-wordmark">THERMAL COMFORT <span>FORECAST</span></div>';
    document.body.appendChild(splash);
    var movie = splash.querySelector('video');
    if (!reduced) {
      try { var p = movie.play(); if (p && p.catch) p.catch(function(){}); } catch(e) {}
    } else {
      movie.style.display='none';
      splash.classList.add('ucy-cinema-reduced');
    }
    // The bridge listener is injected alongside fitCampus() in the original map
    // closure, so it has direct access to that same `map` and `bounds`.
    if (!reduced) {
      window.setTimeout(function () {
        try { window.dispatchEvent(new CustomEvent('ucyheat:cinema:focus')); }
        catch (e) { stats.zoomStatus='event-error'; }
      }, 3180);
    }
    window.setTimeout(function () {
      splash.classList.add('ucy-cinema-exit');
      window.setTimeout(function () {
        splash.remove();
        try {window.dispatchEvent(new CustomEvent('ucyheat:cinema:end',{detail:{zoomStatus:stats.zoomStatus}}));} catch(e){}
      }, fadeMs);
    }, videoMs);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',run,{once:true});
  } else run();
})();
