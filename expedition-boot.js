(function (M) {
  'use strict';
  const requested = new URLSearchParams(location.search).get('planet');
  const planets = {
    mars:{label:'Mars', theme:'#ad5e41', destination:'Mars’a doğru…', welcome:'Mars’a hoş geldiniz! Kızıl yollar keşfinizi bekliyor.', ending:'Mars’ın iki kaşifi', note:'Topladıkları örnekler ve kurdukları düzenekler, Mars bilim kampını birlikte uyandırdı.', scripts:['world-assets.js','mars-weather.js','world.js','sled-play.js','activities.js','footprints.js','mars-aerostat.js','mars-samples.js','mars-discoveries.js']},
    saturn:{label:'Satürn', theme:'#64526b', destination:'Satürn’e doğru…', welcome:'Satürn’ün halkalarına hoş geldiniz! Buz yolları sizi bekliyor.', ending:'Halkaların iki kaşifi', note:'Çanların sesi ve taşıdıkları örnekler, halkaların kristal bahçesini birlikte büyüttü.', scripts:['assets/orbit/saturn-surfaces.js','saturn-sail.js','saturn.js']},
    neptune:{label:'Neptün', theme:'#315679', destination:'Neptün’e doğru…', welcome:'Neptün’ün rüzgârlarına hoş geldiniz! Bulut bahçelerini birlikte uyandıralım.', ending:'Rüzgârın iki kaşifi', note:'Uyandırdıkları rüzgâr, büyüttükleri çiçekler ve dokudukları yelken, keşif balonunu göğe taşıdı.', scripts:['neptune.js','family-postcard.js','family-postcard-host.js']},
    jupiter:{label:'Jüpiter', theme:'#785745', destination:'Jüpiter’e doğru…', welcome:'Jüpiter’in yörünge istasyonuna hoş geldiniz! Io ve Europa sizi bekliyor.', ending:'Uyduların iki kaşifi', note:'Io’nun yanardağ örnekleri ve Europa’nın buz keşifleri, birlikte açtıkları müzede buluştu.', scripts:['jupiter.js','family-postcard.js','family-postcard-host.js']},
    venus:{label:'Venüs', theme:'#8d6c43', destination:'Venüs’e doğru…', welcome:'Venüs’ün altın bulutlarına hoş geldiniz! Cam kubbeli aracınız keşfe hazır.', ending:'Bulutların iki kaşifi', note:'Çektikleri bulut görüntüleri ve hazırladıkları örnekler, birlikte açtıkları gözlemevini canlandırdı.', scripts:['venus.js','family-postcard.js','family-postcard-host.js']}
  };
  M.planet = Object.hasOwn(planets, requested) ? requested : 'mars';
  M.destination = planets[M.planet];
  const byId = id => document.getElementById(id);
  document.body.dataset.planet = M.planet;
  document.title = 'Feza ve Bilbo · ' + M.destination.label + ' keşfi';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', M.destination.theme);
  byId('game').setAttribute('aria-label', 'Feza ve Bilbo ile ' + M.destination.label + ' keşfi');
  byId('arrival-globe').src = 'assets/orbit/' + M.planet + '-globe.webp';
  byId('destination-title').textContent = M.destination.destination;
  byId('planet-name').textContent = M.destination.label.toLocaleUpperCase('tr-TR');
  byId('ending-title').textContent = M.destination.ending;
  byId('ending-note').textContent = M.destination.note;
  // Preparing a planet shares the flight time, but the child's visit begins at landing.
  // Either document may load first, including when launched as two local files.
  if (window.parent !== window && new URLSearchParams(location.search).has('ucus')) {
    const origin = location.protocol === 'file:' ? 'null' : location.origin;
    M.waitForLanding = new Promise(resolve => {
      function onLanding(event) {
        if (event.source !== window.parent || event.origin !== origin || event.data !== 'feza:land') return;
        window.removeEventListener('message',onLanding);
        resolve();
      }
      window.addEventListener('message',onLanding);
      window.parent.postMessage('feza:await-landing', origin === 'null' ? '*' : origin);
    });
  }
  let returning = false;
  M.dock = async () => {
    if (returning) return;
    returning = true;
    let postcard = '';
    const souvenir = byId('souvenir');
    if (window.parent !== window && souvenir.parentElement.hidden) {
      try { await M.captureDeparturePhoto?.(); } catch (_) { /* Photo failure never blocks the trip home. */ }
    }
    if (window.parent !== window && !souvenir.parentElement.hidden) {
      // The hub only needs a small print. Keep it in this tab, never in saved progress.
      try {
        const print = document.createElement('canvas');
        print.width = 196;
        print.height = Math.max(1, Math.round(print.width * souvenir.height / souvenir.width));
        print.getContext('2d').drawImage(souvenir, 0, 0, print.width, print.height);
        postcard = print.toDataURL('image/jpeg', .85);
      } catch (_) { /* A restricted canvas still allows the trip home. */ }
    }
    if (M.shutdown) M.shutdown();
    if (window.parent === window) {
      const base = new URL('index.html', location.href);
      base.search = location.search;
      base.searchParams.delete('planet');
      base.searchParams.delete('ucus');
      location.replace(base);
    }
    else {
      const target = location.protocol === 'file:' ? '*' : location.origin;
      if (postcard) window.parent.postMessage({type:'feza:dock', postcard}, target);
      // Older stations can stay open while Dropbox replaces the expedition files.
      window.parent.postMessage('feza:dock', target);
    }
  };
  byId('loading-home').addEventListener('click', M.dock);
  function load(src, independent = false) {
    return new Promise((resolve,reject) => {
      const s = document.createElement('script'); s.async = independent; s.src = src; s.onload = resolve;
      s.onerror = () => reject(new Error(src)); document.body.appendChild(s);
    });
  }
  (async () => {
    // Narration can join a visit after landing. The visual activities also work
    // when a connection drops before this optional bank has arrived.
    const voices = M.planet === 'mars' ? 'voices.js' : 'orbit-voices.js';
    load(voices, true).catch(() => {});
    // Fetch the scene scripts together and execute in insertion order, even from file://.
    await Promise.all(M.destination.scripts.map(src => load(src)));
    if (!returning) await load('main.js');
  })().catch(err => {
    console.error(err);
    byId('loading-label').textContent = 'Bu gezegen açılamadı. Üsse dönüp tekrar deneyebilirsin.';
    byId('loading').classList.add('error');
  });
})(window.MARS);
