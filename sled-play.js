/* Gentle, child-paced snowflake play for the existing sled.
 * Owns only slideState.x/speed/score and the supplied rings' taken/visibility.
 * The host owns jump physics, seats, camera, boarding and completed tasks.
 */
(function (M) {
  'use strict';
  const T = window.THREE;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  const GOLD = 0xffd581, ICE = 0xb7efff, QUIET = 0x498593, DARK = 0x285565;
  let flakeGeometry = null, flakeMaterial = null, lightGeometry = null, lightMaterial = null;

  function resources() {
    if (flakeGeometry) return;
    const pieces = [], matrix = new T.Matrix4(), rotation = new T.Matrix4(), color = new T.Color();
    function add(g, tint, x, y, angle) {
      rotation.makeRotationZ(angle || 0); matrix.makeTranslation(x || 0, y || 0, 0).multiply(rotation);
      g.applyMatrix4(matrix); const flat = g.index ? g.toNonIndexed() : g;
      if (flat !== g) g.dispose();
      const p = flat.attributes.position, colors = new Float32Array(p.count * 3); color.setHex(tint);
      for (let i = 0; i < p.count; i++) { colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b; }
      flat.setAttribute('color', new T.BufferAttribute(colors, 3)); pieces.push(flat);
    }
    function ray(length, width) {
      const s = new T.Shape(); s.moveTo(-width / 2, 0); s.lineTo(-width / 2, length - width / 2);
      s.lineTo(0, length); s.lineTo(width / 2, length - width / 2); s.lineTo(width / 2, 0); s.closePath();
      const g = new T.ExtrudeGeometry(s, { depth: .065, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 1, steps: 1 });
      g.translate(0, 0, -.0325); return g;
    }
    for (let arm = 0; arm < 6; arm++) {
      const a = arm * Math.PI / 3, sx = -Math.sin(a), sy = Math.cos(a);
      add(ray(.72, .105), ICE, 0, 0, a);
      for (const side of [-1, 1]) add(ray(.27, .083), 0xe4faff, sx * .39, sy * .39, a + side * .79);
    }
    const core = new T.IcosahedronGeometry(.235, 0); core.scale(1, 1, .58); add(core, GOLD, 0, 0, .18);
    const total = pieces.reduce((n, g) => n + g.attributes.position.count, 0);
    const positions = new Float32Array(total * 3), normals = new Float32Array(total * 3), colors = new Float32Array(total * 3);
    let offset = 0;
    for (const g of pieces) { positions.set(g.attributes.position.array, offset); normals.set(g.attributes.normal.array, offset); colors.set(g.attributes.color.array, offset); offset += g.attributes.position.array.length; g.dispose(); }
    flakeGeometry = new T.BufferGeometry(); flakeGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));
    flakeGeometry.setAttribute('normal', new T.BufferAttribute(normals, 3)); flakeGeometry.setAttribute('color', new T.BufferAttribute(colors, 3));
    flakeGeometry.computeBoundingSphere();
    flakeMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: .36, metalness: .08, emissive: 0x497c88, emissiveIntensity: .24 });
    lightGeometry = new T.SphereGeometry(1, 12, 8);
    lightMaterial = new T.MeshStandardMaterial({ roughness: .43, metalness: .08, emissive: 0x896527, emissiveIntensity: .18 });
  }

  M.createSledPlay = function ({ root, world, rings, slideState, player, dog, onCollect, sound }) {
    if (!root || !world || !rings || !slideState) throw new Error('Sled play needs root, world, rings and slideState.');
    resources();
    const count = rings.length, flakes=rings.filter(q=>!q.kind||q.kind==='snowflake').length, order = new Uint8Array(count), pop = new Float32Array(count);
    const gemMesh = new T.InstancedMesh(flakeGeometry, flakeMaterial, count); gemMesh.name = 'Touchable snowflakes along the ice expedition';
    gemMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); gemMesh.frustumCulled = false; gemMesh.visible = false; root.add(gemMesh);
    const progress = new T.Group(); progress.name = 'Sled warm snowflake lights';
    const lights = new T.InstancedMesh(lightGeometry, lightMaterial, flakes * 2); lights.name = 'Sled progress lights'; lights.frustumCulled = false; progress.add(lights);
    const controlPoint=new T.Vector3();
    const pose = new T.Object3D(), tint = new T.Color(), targetPoint = { x: 0, y: 0, z: .2, kind: 'sledSnowflake' };
    let active = false, collected = 0, snowflakes=0, direction = 1, velocity = 0, waiting = false, jumpReady = true, clock = 0;
    const isFlake=q=>!q.kind||q.kind==='snowflake';

    function nextIndex() { for (let k = 0; k < count; k++) { const i = order[k]; if (!rings[i].taken) return i; } return -1; }
    function setLight(i, lit) {
      pose.rotation.set(0, 0, 0); pose.position.set((i - (flakes - 1) / 2) * .23, 0, 0); pose.scale.set(.10, .10, .045); pose.updateMatrix();
      lights.setMatrixAt(i * 2, pose.matrix); lights.setColorAt(i * 2, tint.setHex(DARK));
      pose.position.z = .038; pose.scale.set(.077, .077, .037); pose.updateMatrix(); lights.setMatrixAt(i * 2 + 1, pose.matrix);
      lights.setColorAt(i * 2 + 1, tint.setHex(lit ? GOLD : QUIET)); lights.instanceMatrix.needsUpdate = true; lights.instanceColor.needsUpdate = true;
    }
    for (let i = 0; i < count; i++) { order[i] = i; gemMesh.setColorAt(i, tint.setHex(0xffffff)); }
    for (let i = 0; i < flakes; i++) setLight(i,false);

    function begin() {
      active = true; collected = 0; snowflakes=0; velocity = 0; waiting = false; jumpReady = true; clock = 0;
      direction = slideState.to >= slideState.from ? 1 : -1;
      slideState.score = 0; slideState.speed = 0;
      for (let k = 0; k < count; k++) {
        const i = direction > 0 ? k : count - 1 - k; order[k] = i;
        rings[k].taken = !!rings[k].workshop?.complete();if(rings[k].taken)collected++;rings[k].ring.visible = false; rings[k].inner.visible = false; pop[k] = 0;
      }
      for(let k=0;k<flakes;k++)setLight(k,false);
      gemMesh.visible = true; update(0, 0, world.ground(slideState.x) + .12 + (slideState.lift || 0));
    }

    function advance(dt) {
      if (!active || slideState.phase !== 'slide' || !(dt > 0)) { slideState.speed = 0; return slideState.x; }
      dt = Math.min(dt, .1); const i = nextIndex();
      const stop = i < 0 ? slideState.to : rings[i].x - direction * (rings[i].stopOffset || 1.0);
      const remaining = Math.max(0, direction * (stop - slideState.x));
      waiting = i >= 0 && remaining < .055;
      const wanted = remaining < .001 ? 0 : Math.min(3.7, .76 + remaining * 1.05);
      velocity = damp(velocity, wanted, wanted > velocity ? 3.6 : 6.5, dt);
      const step = Math.min(remaining, velocity * dt), before = slideState.x;
      slideState.x += direction * step;
      if (remaining - step < .025) slideState.x = stop;
      slideState.speed = (slideState.x - before) / dt;
      if (Math.abs(stop - slideState.x) < .026) { velocity = damp(velocity, 0, 9, dt); waiting = i >= 0; }
      return slideState.x;
    }

    function collect(i, action) {
      if (i < 0 || rings[i].taken || !active || slideState.phase !== 'slide') return false;
      const q = rings[i]; q.taken = true; q.ring.visible = false; q.inner.visible = false;
      pop[i] = .001; collected++; if(isFlake(q)){snowflakes++;setLight(snowflakes-1,true);}slideState.score = snowflakes; waiting = false;
      // A single jump cannot collect a later gem during the same flight.
      if (action === 'jump' || (slideState.lift || 0) > .1) jumpReady = false;
      if (typeof sound === 'function') sound('collect');
      if (typeof onCollect === 'function') onCollect(q, i, collected);
      return true;
    }

    function update(dt, t, sledY) {
      if (!active) return;
      dt = clamp(Number(dt) || 0, 0, .1); clock += dt;
      const i = nextIndex(), lift = Number(slideState.lift) || 0, vy = Number(slideState.vy) || 0;
      if (lift < .08 && vy <= .25) jumpReady = true;
      if (dt > 0 && slideState.phase === 'slide' && i >= 0 && isFlake(rings[i]) && jumpReady && lift > .34 && vy > .1 && Math.abs(slideState.x - rings[i].x) < 2.1) {
        const center = Number.isFinite(sledY) ? sledY + 1.15 : world.ground(slideState.x) + .12 + lift + 1.15;
        if (Math.abs(center - rings[i].y) < 1.4) collect(i, 'jump');
      }
      const next = nextIndex();
      for (let k = 0; k < count; k++) {
        const q = rings[k], taken = q.taken, isNext = k === next;
        let scale = taken ? 0 : isNext ? 1 + Math.sin(clock * 3.3) * .045 : .72;
        let y = q.y + (taken ? 0 : Math.sin(clock * 1.8 + k) * .055);
        if (pop[k] > 0) {
          pop[k] += dt; const u = Math.min(1, pop[k] / .65); scale = (1 + Math.sin(u * Math.PI) * .25) * (1 - u); y = q.y + u * .7;
          if (u >= 1) pop[k] = 0;
        }
        pose.position.set(q.x, y, (q.ring.position.z || 0) + .13); pose.rotation.set(0, taken ? clock * 2 : Math.sin(clock * .8 + k) * .12, taken ? clock * .7 : Math.sin(clock * .7 + k) * .05);
        pose.scale.setScalar(isFlake(q)?Math.max(.0001, scale):.0001); pose.updateMatrix(); gemMesh.setMatrixAt(k, pose.matrix);
        gemMesh.setColorAt(k, tint.setHex(taken ? 0xffcb73 : isNext ? 0xffffff : 0x98bdc9));
      }
      gemMesh.instanceMatrix.needsUpdate = true; gemMesh.instanceColor.needsUpdate = true;
    }

    function pointer(type, p, event) {
      if (!active || slideState.phase !== 'slide') return false;
      const pending=nextIndex();if(pending>=0&&rings[pending].workshop&&Math.abs(rings[pending].x-slideState.x)<5.1){const accepted=rings[pending].workshop.pointer(type,p,event);if(rings[pending].workshop.complete())collect(pending,'match');return accepted;}
      if (type !== 'down' || !p) return false;
      const i = nextIndex(); if (i < 0 || Math.abs(rings[i].x - slideState.x) > 5.1) return false;
      const q = rings[i];
      if(!isFlake(q))return q.control&&M.touchPlayPart(p,q.control,.24)?collect(i,'tap'):false;
      const z=(q.ring.position.z||0)+.13,y=q.y+Math.sin(clock*1.8+i)*.055,camera=M.camera,k=camera.position.z/(camera.position.z-z),x=camera.position.x+(q.x-camera.position.x)*k,yy=camera.position.y+(y-camera.position.y)*k;
      if(Math.hypot(p.x-x,p.y-yy)<1.08)return collect(i,'tap');
      return false;
    }

    function target() {
      if (!active || slideState.phase !== 'slide') return null;
      const i = nextIndex(); if (i < 0 || Math.abs(rings[i].x - slideState.x) > 5.1) return null;
      if(rings[i].workshop)return rings[i].workshop.target();
      const q=rings[i];if(q.targetNode){q.targetNode.getWorldPosition(controlPoint);targetPoint.x=controlPoint.x;targetPoint.y=controlPoint.y;targetPoint.z=controlPoint.z;}else{targetPoint.x=q.x;targetPoint.y=q.y+Math.sin(clock*1.8+i)*.055;targetPoint.z=(q.ring.position.z||0)+.13;}targetPoint.kind=q.kind||'sledSnowflake';
      return targetPoint;
    }
    function finished() { return active && collected === count && Math.abs(slideState.x - slideState.to) < .035; }
    const status={active:false,collected:0,snowflakes:0,total:count,waiting:false,next:-1,direction:1,speed:0,finished:false};
    function state(){status.active=active;status.collected=collected;status.snowflakes=snowflakes;status.waiting=waiting;status.next=nextIndex();status.direction=direction;status.speed=slideState.speed||0;status.finished=finished();return status;}
    return { begin, advance, update, pointer, target, finished, state, nextIndex, progress, gems: gemMesh };
  };
})(window.MARS);
