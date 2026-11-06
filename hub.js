(function (M) {
  'use strict';

  const destinations = [
    { id: 'mars', name: 'Mars', color: '#ffad82' },
    { id: 'saturn', name: 'Satürn', color: '#f6cc85' },
    { id: 'neptune', name: 'Neptün', color: '#94baff' },
    { id: 'jupiter', name: 'Jüpiter', color: '#e9b989' },
    { id: 'venus', name: 'Venüs', color: '#f5d58c' }
  ];
  const pi = Math.PI;
  function flightStars() {
    const canvas = document.createElement('canvas');
    canvas.width = 1100; canvas.height = 810;
    const ctx = canvas.getContext('2d');
    let seed = 73;
    function random() {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967295;}
    for (let i = 0; i < 290; i++) {
      const x = random() * canvas.width, y = random() * canvas.height;
      const light = random();
      const radius = .38 + 1.25 * light * light;
      ctx.globalAlpha = .25 + .58 * light;
      ctx.fillStyle = i % 9 === 0 ? '#ffd9a5' : i % 3 === 0 ? '#92d2f2' : '#ecf5ff';
      ctx.beginPath(); ctx.arc(x, y, radius, 0, pi * 2); ctx.fill();
      if (i % 47 === 0) {
        ctx.globalAlpha *= .55;
        ctx.fillRect(x-radius*3, y-.4, radius*6, .8);
        ctx.fillRect(x-.4, y-radius*3, .8, radius*6);
      }
    }
    return canvas;
  }

  const rocketDrawing = '<i class="orb-exhaust" aria-hidden="true"></i><img src="assets/orbit/shuttle.webp" alt="" draggable="false">';

  M.createHub = function ({container, onDepart, onLaunch, initialArrival}) {
    container.classList.add('orbit-home');
    container.innerHTML = '<div class="orb-station" aria-hidden="true"></div><div class="orb-shade" aria-hidden="true"></div><div class="orb-deep" aria-hidden="true"></div><div class="orb-target" aria-hidden="true"></div><div class="orb-ship" aria-hidden="true">' + rocketDrawing + '</div><div class="orb-title"><span>Feza <i>ve</i> Bilbo</span><h1>Uzay Üssü</h1></div><nav class="orb-dock" aria-label="Gezegen seç"><div class="orb-grid"></div></nav><div class="orb-announcement" aria-live="polite"></div>';
    const grid = container.querySelector('.orb-grid'), ship = container.querySelector('.orb-ship');
    const target = container.querySelector('.orb-target'), status = container.querySelector('.orb-announcement');
    const buttons = [];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    // The turning Earth and the waving pair sit behind the same painted station.
    const live = M.createHubScene ? M.createHubScene(container) : null;
    let visible = false, busy = false, launchTimer = 0, flight = null, departureSound = null;

    function clearFlight() {
      clearTimeout(launchTimer);
      if (departureSound) {departureSound.pause(); departureSound = null;}
      if (flight) {flight.cancel(); flight = null;}
      target.replaceChildren();
      container.classList.remove('orb-travelling');
      for (const x of buttons) x.classList.remove('orb-picked');
      busy = false;
    }
    function launch(planet) {
      if (!visible || busy) return;
      clearFlight();
      busy = true;
      live?.pause();
      // One short happy hop and a sparkle on the chosen picture, then the flight.
      buttons.find(x => x.dataset.planet === planet.id)?.classList.add('orb-picked');
      onDepart(planet.id);
      if (!M.soundIsOff()) {
        departureSound = new Audio('assets/orbit/liftoff.mp3');
        departureSound.volume = .55;
        departureSound.play().catch(()=>{});
      }
      status.textContent = planet.name + ' yolculuğu başladı.';
      const picture = document.createElement('img');
      picture.src = 'assets/orbit/' + planet.id + '-globe.webp';
      picture.alt = '';
      target.append(picture);
      const sky = container.querySelector('.orb-deep');
      if (!sky.firstChild) sky.append(flightStars());
      const start = ship.getBoundingClientRect();
      container.classList.add('orb-travelling');
      const end = target.getBoundingClientRect();
      const sx = start.left + start.width * .5, sy = start.top + start.height * .5;
      const dx = end.left + end.width * .5 - sx, dy = end.top + end.height * .48 - sy;
      const w = container.clientWidth, h = container.clientHeight;
      const duration = reduce.matches ? 180 : 2360;
      if (!reduce.matches && ship.animate) {
        flight = ship.animate([
          {transform:'translate(0,0) scale(1)',opacity:1},
          {transform:'translate(-6px,3px) rotate(4deg) scale(1.04)',opacity:1,offset:.08},
          {transform:'translate(' + w*.23 + 'px,' + (-h*.18) + 'px) scale(.55)',opacity:0,offset:.25},
          {transform:'translate(' + (w*.06-sx) + 'px,' + (h*.73-sy) + 'px) scale(1.5)',opacity:0,offset:.251},
          {transform:'translate(' + (w*.23-sx) + 'px,' + (h*.62-sy) + 'px) scale(1.4)',opacity:1,offset:.38},
          {transform:'translate(' + (w*.47-sx) + 'px,' + (h*.46-sy) + 'px) rotate(-5deg) scale(1.13)',opacity:1,offset:.62},
          {transform:'translate(' + dx + 'px,' + dy + 'px) rotate(12deg) scale(.10)',opacity:.1}
        ], {duration, easing:'cubic-bezier(.42,.06,.45,.99)', fill:'forwards'});
      }
      // Selection is one physical tap. No second label or launch confirmation to read.
      launchTimer = setTimeout(() => {if (visible && busy) onLaunch(planet.id);}, duration);
    }

    for (const planet of destinations) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'orb-planet'; b.dataset.planet = planet.id;
      b.style.setProperty('--planet-accent', planet.color);
      b.setAttribute('aria-label', planet.name + ' gezegenine uç');
      const art = document.createElement('img');
      art.className = 'orb-globe'; art.alt = ''; art.draggable = false;
      art.width = 1000; art.height = 610;
      art.src = 'assets/orbit/' + planet.id + '-globe.webp';
      const name = document.createElement('span'); name.textContent = planet.name;
      b.append(art, name); b.addEventListener('click', () => launch(planet));
      grid.appendChild(b); buttons.push(b);
    }
    grid.addEventListener('keydown', e => {
      if (busy) {e.preventDefault(); e.stopPropagation(); return;}
      const index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) {
        e.preventDefault(); e.stopPropagation();
        let next = e.key==='Home' ? 0 : e.key==='End' ? buttons.length-1 : (index + (e.key==='ArrowLeft' ? -1 : 1) + buttons.length) % buttons.length;
        if (e.key==='ArrowUp' || e.key==='ArrowDown') {
          const from = buttons[index].getBoundingClientRect(), cx = from.left + from.width*.5, cy = from.top + from.height*.5;
          let best = Infinity; next = index;
          for (let i=0;i<buttons.length;i++) {
            const rect = buttons[i].getBoundingClientRect(), dy = rect.top + rect.height*.5 - cy;
            if (dy * (e.key==='ArrowUp' ? -1 : 1) <= from.height*.45) continue;
            const distance = Math.abs(dy)*2 + Math.abs(rect.left + rect.width*.5 - cx);
            if (distance < best) {best = distance; next = i;}
          }
        }
        buttons[next].focus();
      }
      if (e.key===' ' || e.key==='Enter') e.stopPropagation();
    });

    function mountPostcard(button, src) {
      let print = button.querySelector('.orb-postcard');
      if (!print) {
        print = document.createElement('img');
        print.className = 'orb-postcard'; print.alt = ''; print.draggable = false;
        button.append(print);
      }
      print.src = src;
      button.setAttribute('aria-label', button.textContent + ' gezegenine yeniden uç');
    }

    // The update itself may reload the tab. Only that navigation carries the prints.
    window.addEventListener('feza:collect-postcards', e => {
      for (const button of buttons) {
        const print = button.querySelector('.orb-postcard');
        if (print) e.detail[button.dataset.planet] = print.src;
      }
    });
    window.addEventListener('feza:restore-postcards', e => {
      for (const button of buttons) {
        const src = e.detail?.[button.dataset.planet];
        if (typeof src === 'string' && src.length < 85000 && src.startsWith('data:image/jpeg;base64,')) mountPostcard(button, src);
      }
    }, {once: true});

    function show(arrival, postcard) {
      clearFlight(); visible = true; container.hidden = false;
      container.classList.remove('hidden','orb-away'); container.removeAttribute('inert');
      live?.start();
      const arrived = buttons.find(b => b.dataset.planet === arrival);
      status.textContent = arrived ? 'Uzay üssündesin. Bir gezegen seçebilirsin.' : '';
      if (arrived) {
        if (postcard) mountPostcard(arrived, postcard);
        arrived.focus({preventScroll:true});
      }
      if (destinations.some(p=>p.id === arrival) && !reduce.matches && ship.animate) {
        flight = ship.animate([
          {transform:'translate(-37vw,-22vh) rotate(19deg) scale(.12)',opacity:0},
          {transform:'translate(-9vw,-6vh) rotate(12deg) scale(.82)',opacity:1,offset:.54},
          {transform:'translate(0,0) rotate(0deg) scale(1)',opacity:1}
        ], {duration:1530,easing:'ease-out'});
      }
    }
    function hide() {
      visible = false; clearFlight(); live?.stop(); container.hidden = true; container.setAttribute('inert','');
      container.classList.add('orb-away');
    }
    show(initialArrival);
    return {show, hide};
  };
})(window.MARS);
