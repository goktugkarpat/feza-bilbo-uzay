(function (M) {
  'use strict';
  const container = document.getElementById('hub');
  let expedition = null, destination = '', landed = false;
  const planetNames = {mars:'Mars',saturn:'Satürn',neptune:'Neptün',jupiter:'Jüpiter',venus:'Venüs'};
  const localOrigin = location.protocol === 'file:' ? 'null' : location.origin;
  const options = new URLSearchParams(location.search);
  const hub = M.createHub({container, onDepart: prepare, onLaunch: land, initialArrival: null});
  function prepare(planet) {
    if (expedition || !Object.hasOwn(planetNames, planet)) return;
    destination = planet;
    landed = false;
    const target = new URL('expedition.html', location.href);
    target.searchParams.set('planet', planet);
    target.searchParams.set('ucus', '1');
    for (const key of ['sessiz','test','atla','altyazi','fps','perf']) {
      if (options.has(key)) target.searchParams.set(key, '');
    }
    expedition = document.createElement('iframe');
    expedition.id = 'expedition';
    expedition.title = 'Feza ve Bilbo · ' + planetNames[planet] + ' keşfi';
    expedition.allow = 'autoplay';
    expedition.inert = true;
    expedition.tabIndex = -1;
    expedition.setAttribute('aria-hidden','true');
    expedition.src = target.href;
    document.body.appendChild(expedition);
  }
  function signalLanding() {
    expedition?.contentWindow?.postMessage('feza:land', localOrigin === 'null' ? '*' : localOrigin);
  }
  function land(planet) {
    if (!expedition || destination !== planet) return;
    landed = true;
    hub.hide();
    expedition.inert = false;
    expedition.removeAttribute('aria-hidden');
    expedition.removeAttribute('tabindex');
    expedition.focus();
    signalLanding();
  }
  function dock(postcard) {
    if (!expedition) return;
    // The child may be restored from BFCache or still be loading. Normal dock is already idempotent.
    try { expedition.contentWindow?.MARS?.shutdown?.(); } catch (_) { /* Removal still returns the family to the station. */ }
    expedition.remove();
    expedition = null; landed = false;
    hub.show(destination, postcard);
    window.dispatchEvent(new Event('feza:station-ready'));
    destination = '';
  }
  addEventListener('message', event => {
    if (event.origin !== localOrigin || !expedition || event.source !== expedition.contentWindow) return;
    const message = event.data;
    if (message === 'feza:await-landing') {if (landed) signalLanding(); return;}
    if (message === 'feza:dock') {dock(); return;}
    if (message?.type === 'feza:dock') {
      const photo = message.postcard;
      dock(typeof photo === 'string' && photo.length < 85000 && photo.startsWith('data:image/jpeg;base64,') ? photo : '');
    }
  });
  // Navigating back to a cached tab should open a fresh mission selection as well.
  addEventListener('pageshow', e => { if (e.persisted && expedition) dock(); });
})(window.MARS);
