(function (M) {
  'use strict';
  const T = window.THREE;
  const textures = new Map();
  function canvas(width, height) {
    const image = document.createElement('canvas');
    image.width = width;
    image.height = height;
    return image;
  }
  function texture(image, repeat = false) {
    const map = new T.CanvasTexture(image);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 2;
    if (repeat) map.wrapS = map.wrapT = T.RepeatWrapping;
    return map;
  }
  function surface(kind) {
    const key = 'surface-' + kind;
    if (textures.has(key)) return textures.get(key);
    const image = canvas(256, 256), c = image.getContext('2d');
    const shade = c.createLinearGradient(0, 0, 256, 256);
    shade.addColorStop(0, '#fffef7');
    shade.addColorStop(.39, '#eeeae1');
    shade.addColorStop(.67, '#fbf8ef');
    shade.addColorStop(1, '#deded5');
    c.fillStyle = shade;
    c.fillRect(0, 0, 256, 256);
    let seed = 16379;
    for (let i = 0; i < 1900; i++) {
      seed = Math.imul(seed, 1664525) + 1013904223 | 0;
      const x = (seed >>> 0) % 256;
      seed = Math.imul(seed, 1664525) + 1013904223 | 0;
      const y = (seed >>> 0) % 256;
      c.fillStyle = i % 2 ? 'rgba(70,73,72,.055)' : 'rgba(255,255,255,.30)';
      c.fillRect(x, y, kind === 'metal' ? 7 : 1.2, .65);
    }
    if (kind === 'enamel') {
      c.strokeStyle = 'rgba(62,75,72,.14)';
      c.lineWidth = 1.1;
      c.strokeRect(9, 9, 238, 238);
      c.strokeStyle = 'rgba(255,255,250,.65)';
      c.strokeRect(11, 11, 234, 234);
      for (const x of [19, 237]) for (const y of [19, 237]) {
        c.fillStyle = '#d0d3c9';
        c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#a0a89e';
        c.beginPath(); c.moveTo(x - 1.8, y); c.lineTo(x + 1.8, y); c.stroke();
      }
    }
    const map = texture(image, true);
    textures.set(key, map);
    return map;
  }
  function paint(material, kind = 'enamel') {
    if (!material.map) material.map = surface(kind);
    return material;
  }
  function icon(c, kind, x, y, size, colour = '#ffd980') {
    c.save(); c.translate(x, y); c.scale(size / 100, size / 100);
    c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#fff4d3'; c.fillStyle = colour;
    function ellipse(x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) c.fill(); else c.stroke(); }
    function line(points) { c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke(); }
    if (kind === 'head') {
      c.fillRect(-35, -25, 70, 50); c.strokeRect(-35, -25, 70, 50);
      c.fillStyle = '#193c47'; c.fillRect(-28, -15, 56, 25);
      c.fillStyle = '#ccfff4'; ellipse(-14, -3, 5, 6, true); ellipse(14, -3, 5, 6, true);
      line([[0, -26], [0, -41]]); ellipse(0, -45, 5, 5, true);
    } else if (kind === 'battery') {
      c.fillRect(-23, -32, 46, 66); c.strokeRect(-23, -32, 46, 66);
      c.fillRect(-11, -42, 22, 10); c.fillStyle = '#fff6cc';
      c.beginPath(); c.moveTo(6, -22); c.lineTo(-14, 6); c.lineTo(-1, 6); c.lineTo(-7, 24); c.lineTo(16, -6); c.lineTo(4, -6); c.closePath(); c.fill();
    } else if (kind === 'robot') {
      c.fillRect(-31, -31, 62, 45); c.strokeRect(-31, -31, 62, 45);
      c.fillStyle = '#193c47'; c.fillRect(-24, -20, 48, 24);
      c.fillStyle = '#c8fff2'; ellipse(-12, -9, 4, 5, true); ellipse(12, -9, 4, 5, true);
      line([[0, -32], [0, -44]]); ellipse(0, -48, 5, 5, true);
      c.fillStyle = colour; c.fillRect(-21, 17, 42, 25);
      line([[-22, 23], [-38, 34]]); line([[22, 23], [38, 34]]);
      line([[-12, 42], [-12, 51]]); line([[12, 42], [12, 51]]);
    } else if (kind === 'seed') {
      c.save(); c.rotate(-.4); ellipse(0, 3, 17, 28, true); c.restore();
      c.strokeStyle = '#b9efae'; line([[3, 23], [3, -24]]);
      c.fillStyle = '#b9efae'; c.save(); c.rotate(-.5); ellipse(15, -18, 20, 9, true); c.restore();
    } else if (kind === 'water') {
      c.beginPath(); c.moveTo(0, -42); c.bezierCurveTo(-51, 15, -22, 42, 0, 42); c.bezierCurveTo(35, 42, 42, 12, 0, -42); c.fill();
      c.strokeStyle = '#e6fcff'; line([[-15, 7], [-15, 21], [-8, 28]]);
    } else if (kind === 'flower') {
      c.strokeStyle = '#b9eab7'; line([[0, 44], [0, 1]]);
      c.fillStyle = '#a6e4aa'; ellipse(14, 24, 18, 8, true);
      c.fillStyle = colour;
      for (let i = 0; i < 7; i++) { c.save(); c.rotate(i * Math.PI * 2 / 7); ellipse(0, -22, 10, 20, true); c.restore(); }
      c.fillStyle = '#ffdd80'; ellipse(0, -2, 13, 13, true);
    } else if (kind === 'jar') {
      c.fillStyle = 'rgba(175,237,242,.25)'; c.fillRect(-28, -24, 56, 64); c.strokeRect(-28, -24, 56, 64);
      c.fillStyle = colour; c.fillRect(-31, -34, 62, 12);
      c.beginPath(); c.moveTo(-13, 24); c.lineTo(-17, 7); c.lineTo(2, -3); c.lineTo(17, 13); c.lineTo(12, 29); c.closePath(); c.fill();
      c.strokeStyle = '#d1f5f3'; line([[-18, -12], [-18, 12]]);
    } else if (kind === 'bell') {
      c.beginPath(); c.moveTo(-31, 25); c.bezierCurveTo(-12, 5, -29, -31, 0, -31); c.bezierCurveTo(29, -31, 12, 5, 31, 25); c.closePath(); c.fill();
      c.strokeStyle = colour; line([[-35, 28], [35, 28]]); ellipse(0, 36, 7, 7, true);
      c.strokeStyle = '#fff4d3'; line([[37, -20], [45, -28]]); line([[-37, -20], [-45, -28]]);
    } else if (kind === 'rover') {
      c.fillRect(-35, -18, 70, 35); c.strokeRect(-35, -18, 70, 35);
      c.fillStyle = '#91dce4'; c.fillRect(-24, -35, 40, 19); c.strokeRect(-24, -35, 40, 19);
      c.fillStyle = '#243b48'; for (const xx of [-24, 25]) { ellipse(xx, 27, 14, 14, true); c.strokeStyle = '#e5cf9b'; ellipse(xx, 27, 6, 6, false); }
      c.strokeStyle = '#fff4d3'; line([[34, -2], [44, -2]]);
    } else if (kind === 'bridge') {
      c.fillRect(-43, -1, 86, 15); line([[-39, 34], [-39, -25]]); line([[39, 34], [39, -25]]);
      line([[-40, -24], [-15, -8], [15, -8], [40, -24]]);
    } else if (kind === 'sun') {
      ellipse(0, 0, 22, 22, true);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line([[Math.cos(a) * 32, Math.sin(a) * 32], [Math.cos(a) * 43, Math.sin(a) * 43]]); }
    }
    c.restore();
  }
  function hand(parent, scale = 1) {
    let map = textures.get('hand');
    if (!map) {
      const image = canvas(256, 256), c = image.getContext('2d');
      c.lineJoin = 'round'; c.lineWidth = 8;
      c.strokeStyle = '#214a57'; c.fillStyle = '#fff4d7';
      c.beginPath(); c.moveTo(76, 48); c.lineTo(160, 48);
      c.bezierCurveTo(171, 64, 170, 75, 170, 88);
      c.bezierCurveTo(193, 81, 206, 92, 199, 107);
      c.lineTo(175, 145); c.bezierCurveTo(169, 155, 159, 161, 148, 161);
      c.lineTo(148, 210); c.bezierCurveTo(148, 234, 122, 234, 122, 210);
      c.lineTo(122, 161); c.bezierCurveTo(98, 164, 80, 155, 77, 140);
      c.bezierCurveTo(68, 116, 73, 78, 76, 48); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#e5ac60'; c.fillRect(77, 31, 85, 29); c.strokeRect(77, 31, 85, 29);
      c.strokeStyle = '#b0c6c2'; c.lineWidth = 4;
      for (const x of [94, 112, 131]) { c.beginPath(); c.moveTo(x, 82); c.lineTo(x - 1, 122); c.stroke(); }
      map = texture(image); textures.set('hand', map);
    }
    const sprite = new T.Sprite(new T.SpriteMaterial({map, transparent:true, depthWrite:false, depthTest:false}));
    sprite.name = 'Gösterilen nesneye dokunan el';
    sprite.scale.setScalar(scale); sprite.renderOrder = 30;
    parent.add(sprite);
    return sprite;
  }
  function sign(parent, steps, x, y, z, width = 3.8, height = 1.32) {
    const key = 'sign-' + steps.join('-');
    let map = textures.get(key);
    if (!map) {
      const image = canvas(steps.length===1?256:768, 256), c = image.getContext('2d');
      const panelWidth=image.width;
      const ink = c.createLinearGradient(0, 0, 0, 256); ink.addColorStop(0, '#416f75'); ink.addColorStop(1, '#234952');
      c.fillStyle = ink; c.fillRect(0, 0, panelWidth, 256);
      c.strokeStyle = '#eac88b'; c.lineWidth = 4; c.strokeRect(10, 10, panelWidth-20, 236);
      c.strokeStyle = '#84a8a1'; c.lineWidth = 1.2; c.strokeRect(17, 17, panelWidth-34, 222);
      steps.forEach((kind, i) => {
        const xx = panelWidth/2 + (i - (steps.length - 1) / 2) * 240;
        icon(c, kind, xx, 126, 133, ['#f2c482', '#a8e2dc', '#e6afd1'][i % 3]);
        if (i < steps.length - 1) {
          c.strokeStyle = '#eac88b'; c.lineWidth = 6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(xx + 82, 128); c.lineTo(xx + 143, 128); c.lineTo(xx + 129, 114); c.moveTo(xx + 143, 128); c.lineTo(xx + 129, 142); c.stroke();
        }
      });
      for (const xx of [29, panelWidth-29]) for (const yy of [29, 227]) { c.fillStyle = '#d6ae72'; c.beginPath(); c.arc(xx, yy, 5, 0, Math.PI * 2); c.fill(); }
      map = texture(image); textures.set(key, map);
    }
    const panel = new T.Mesh(new T.PlaneGeometry(width, height), new T.MeshStandardMaterial({map, roughness: .67, metalness: .1, side: T.DoubleSide}));
    panel.name = 'Resimlerle ' + steps.join(' → ');
    panel.position.set(x, y, z); parent.add(panel);
    return panel;
  }
  M.WorkshopArt = {surface, paint, sign, icon, hand};
})(window.MARS);
