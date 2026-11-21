/* UCY Heat - optional native browser PWA install button.
   Display only when the browser explicitly offers installation.
   No heuristics that pretend to detect every browser's installed apps. */
(function () {
  'use strict';
  if (window.__UCY_HEAT_INSTALL_UI) return;
  window.__UCY_HEAT_INSTALL_UI = true;

  var pending = window.__ucyInstallPrompt || null;
  var button = null;
  var busy = false;

  function standalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.navigator.standalone === true;
  }
  function ensureButton() {
    if (button || !document.body) return;
    button = document.createElement('button');
    button.id = 'ucyheat-install-button';
    button.type = 'button';
    button.hidden = true;
    button.setAttribute('aria-label', 'Install UCY Heat application');
    button.innerHTML = '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/></svg><span>Install UCY Heat</span>';
    document.body.appendChild(button);
    button.addEventListener('click', async function () {
      if (!pending || busy || standalone()) return;
      var event = pending;
      pending = null;
      busy = true;
      update();
      try {
        await event.prompt(); // Only from a direct user gesture.
        if (event.userChoice) await event.userChoice;
      } catch (error) {
        console.warn('UCY Heat: browser did not open PWA install prompt',error);
      } finally {
        busy = false;
        /* The browser owns the install decision. A future
           beforeinstallprompt event may make the button available again. */
        update();
      }
    });
    update();
  }
  function update() {
    if (!button) return;
    button.hidden = !pending || standalone() || busy;
  }

  window.addEventListener('ucyheat:installable', function () {
    pending = window.__ucyInstallPrompt || null;
    ensureButton();
    update();
  });
  window.addEventListener('appinstalled', function () {
    pending = null;
    window.__ucyInstallPrompt = null;
    update();
  });
  var media = window.matchMedia('(display-mode: standalone)');
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', update);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButton, {once:true});
  } else {
    ensureButton();
  }
})();
