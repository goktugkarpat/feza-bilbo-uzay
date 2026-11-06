/* Actual Feza model-only extraction.
 * Source: feza-piril-3d-arpg/src/04_feza.js (user-owned project, read-only source).
 * Original sculpted head/face shader/hair locks/body profiles/12-joint skeleton are preserved.
 * Small geometry/material helpers extracted from src/00_core.js; no game engine/UI/equipment.
 * Source SHA256: ddfd161d0b400533742aeb910f7dc4539f3af3cab0004a65a9c2c36dcc142ad7
 */
(function(M){
'use strict';
const TAU=Math.PI*2,ANISO=4,UP=new THREE.Vector3(0,1,0);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const GC = {};
function gcache(key, make) { let g = GC[key]; if (!g) { g = GC[key] = make(); g.userData.cached = true; } return g; }
const G = {
  sphere: (w = 20, h) => gcache(`s${w}_${h}`, () => new THREE.SphereGeometry(1, w, h ?? Math.max(6, Math.round(w * 0.7)))),
  hemi: (w = 20) => gcache(`hs${w}`, () => new THREE.SphereGeometry(1, w, Math.max(4, w >> 1), 0, TAU, 0, Math.PI / 2)),
  cyl: (rt = 1, rb = 1, seg = 16, open = false) => gcache(`c${rt}_${rb}_${seg}_${open}`, () => new THREE.CylinderGeometry(rt, rb, 1, seg, 1, open)),
  cone: (seg = 12) => gcache(`k${seg}`, () => new THREE.ConeGeometry(1, 1, seg)),
  box: () => gcache('b', () => new THREE.BoxGeometry(1, 1, 1)),
  rbox: (seg = 2) => gcache(`rb${seg}`, () => roundedBox(seg)),
  torus: (arc = TAU, tube = 0.25, seg = 16) => gcache(`t${arc.toFixed(3)}_${tube}_${seg}`, () => new THREE.TorusGeometry(1, tube, 8, seg, arc)),
  capsule: (len = 1, seg = 12) => gcache(`cp${len}_${seg}`, () => new THREE.CapsuleGeometry(1, len, 4, seg)),
  ico: (detail = 1) => gcache(`i${detail}`, () => new THREE.IcosahedronGeometry(1, detail)),
  dodeca: () => gcache('d', () => new THREE.DodecahedronGeometry(1, 0)),
  octa: () => gcache('o', () => new THREE.OctahedronGeometry(1, 0)),
};
// Unit cube with softly bevelled edges (sphere-projected corners) – nicer highlights than a hard box.
function roundedBox(seg) {
  const g = new THREE.BoxGeometry(1, 1, 1, seg * 2 + 1, seg * 2 + 1, seg * 2 + 1);
  const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), c = new THREE.Vector3(), r = 0.12;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(clamp(v.x, -0.5 + r, 0.5 - r), clamp(v.y, -0.5 + r, 0.5 - r), clamp(v.z, -0.5 + r, 0.5 - r));
    const d = v.clone().sub(c);
    if (d.lengthSq() > 1e-8) { d.normalize(); v.copy(c).addScaledVector(d, r); p.setXYZ(i, v.x, v.y, v.z); n.setXYZ(i, d.x, d.y, d.z); }
  }
  return g;
}

// ── Kit: renkli ilkel parçaları tek bir geometride birleştirir (az çizim çağrısı) ──
// k.add(geo, color, pos, rot, scale): color = hex | THREE.Color | (x,y,z)=>THREE.Color (per-vertex, x/y/z = final position)
// rot = [x,y,z] Euler | THREE.Quaternion; scale = number | [x,y,z]. k.push()/k.pop() nest transforms.
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s3 = new THREE.Vector3(), _p3 = new THREE.Vector3();
function tmat(pos, rot, scl) {
  const m = new THREE.Matrix4();
  _p3.set(pos ? pos[0] : 0, pos ? pos[1] : 0, pos ? pos[2] : 0);
  if (rot && rot.isQuaternion) _q.copy(rot); else if (rot) _q.setFromEuler(_e.set(rot[0] || 0, rot[1] || 0, rot[2] || 0)); else _q.identity();
  if (scl === undefined || scl === null) _s3.set(1, 1, 1); else if (typeof scl === 'number') _s3.set(scl, scl, scl); else _s3.set(scl[0], scl[1], scl[2]);
  return m.compose(_p3, _q, _s3);
}
class Kit {
  constructor() { this.parts = []; this.stack = [new THREE.Matrix4()]; }
  top() { return this.stack[this.stack.length - 1]; }
  push(pos, rot, scl) { this.stack.push(this.top().clone().multiply(tmat(pos, rot, scl))); return this; }
  pop() { if (this.stack.length > 1) this.stack.pop(); return this; }
  add(geo, color, pos, rot, scl) {
    const c = typeof color === 'function' ? color : (color && color.isColor ? color.clone() : new THREE.Color(color ?? 0xffffff));
    this.parts.push({ geo, color: c, m: this.top().clone().multiply(tmat(pos, rot, scl)) });
    return this;
  }
  // Cylinder segment from p0 to p1 (arrays [x,y,z]) with radius r (r1 = end radius), e.g. limbs/legs.
  seg(p0, p1, r, color, r1 = r, sides = 10) {
    const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1), d = b.clone().sub(a), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize());
    const mid = a.clone().add(b).multiplyScalar(0.5);
    return this.add(G.cyl(r1 / r, 1, sides), color, [mid.x, mid.y, mid.z], q, [r, len, r]);
  }
  build() { return mergeParts(this.parts); }
}
function mergeParts(parts) {
  let nv = 0, ni = 0;
  for (const p of parts) { const P = p.geo.attributes.position; nv += P.count; ni += p.geo.index ? p.geo.index.count : P.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  let vo = 0, io = 0;
  for (const p of parts) {
    const g = p.geo, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    nm.getNormalMatrix(p.m);
    const fn = typeof p.color === 'function' ? p.color : null;
    for (let i = 0; i < P.count; i++) {
      const o = (vo + i) * 3;
      v.fromBufferAttribute(P, i).applyMatrix4(p.m);
      pos[o] = v.x; pos[o + 1] = v.y; pos[o + 2] = v.z;
      const c = fn ? fn(v.x, v.y, v.z) : p.color;
      col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b;
      if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[o] = v.x; nor[o + 1] = v.y; nor[o + 2] = v.z; }
      if (U) { uv[(vo + i) * 2] = U.getX(i); uv[(vo + i) * 2 + 1] = U.getY(i); }
    }
    if (g.index) { const I = g.index; for (let i = 0; i < I.count; i++) idx[io + i] = I.getX(i) + vo; io += I.count; }
    else { for (let i = 0; i < P.count; i++) idx[io + i] = vo + i; io += P.count; }
    vo += P.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}
const col3 = hex => new THREE.Color(hex);
const mixCol = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

// Place an object on a sphere of radius R (e.g. eyes on a head): local (x, y) on the face, returns [pos, quaternion].
function onSphere(x, y, R, inset = 0) {
  const z = Math.sqrt(Math.max(1e-4, R * R - x * x - y * y)) - inset;
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.asin(clamp(y / R, -1, 1)), Math.atan2(x, z), 0, 'YXZ'));
  return [[x, y, z], q];
}

// ── Malzemeler ──
function stdMat(o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6, metalness: 0 }, o)); }
function vcMat(o = {}) { return stdMat(Object.assign({ vertexColors: true }, o)); }
// Unlit HDR colour (> 1 blooms): glowing blades, crystals, flames, eyes.
function glowMat(color, intensity = 2.5, o = {}) { return new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(color).multiplyScalar(intensity) }, o)); }
// Inject GLSL into a built-in material. o: {uniforms, vDecl, vBegin, fDecl, fMap, fNormal:[search, replace], fOut, key}
function patchMat(mat, o) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (o.uniforms) Object.assign(sh.uniforms, o.uniforms);
    if (o.vDecl) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + o.vDecl);
    if (o.vBegin) sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + o.vBegin);
    if (o.fDecl) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + o.fDecl);
    if (o.fMap) sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', o.fMap);
    if (o.fNormal) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', THREE.ShaderChunk.normal_fragment_maps.replace(o.fNormal[0], o.fNormal[1]));
    if (o.fOut) sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', o.fOut + '\n#include <opaque_fragment>');
    prev.call(mat, sh, r);
  };
  const k = (mat.userData.pkey || '') + '|' + (o.key || 'p');
  mat.userData.pkey = k;
  mat.customProgramCacheKey = () => k;
  return mat;
}
// Soft coloured edge light – makes characters pop off the ground (stylised, "premium" look).
function rimify(mat, color = 0xffffff, strength = 0.22, power = 2.8) {
  return patchMat(mat, {
    uniforms: { rimColor: { value: new THREE.Color(color).multiplyScalar(strength) }, rimPow: { value: power } },
    fDecl: 'uniform vec3 rimColor; uniform float rimPow;',
    fOut: 'outgoingLight += rimColor * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), rimPow);',
    key: 'rim',
  });
}

  // ── (G4) Yeni görünüm anahtarı: adres ?eskifeza ile eski yüz/saç/gölge ──
  const V2ON = !(typeof location !== 'undefined' && /eskifeza/.test(location.search));
  // ── Helpers ──
  const sq = x => x * x;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeIO = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const wrapPI = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  const keep = o => { o.userData.keep = true; return o; };   // shared: disposeTree() leaves it alone
  const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const V2 = (x, y = x) => new THREE.Vector2(x, y);
  const canvasEl = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function tex(n) {
    if (typeof TEX === 'undefined') return null;
    if (!TEX.ready && !TEX[n] && TEX.init) { try { TEX.init(); } catch (e) { return null; } }
    return TEX[n] && TEX[n].map ? TEX[n] : null;
  }
  // Every Feza/equipment material writes stencil 1 where it is visible; the x-ray pass only draws where it is not.
  function stencil(m) {
    m.stencilWrite = true; m.stencilRef = 1; m.stencilFunc = THREE.AlwaysStencilFunc;
    m.stencilZPass = THREE.ReplaceStencilOp; m.stencilFail = THREE.KeepStencilOp; m.stencilZFail = THREE.KeepStencilOp;
    return m;
  }
  const RARITY = [{ ad: 'Sıradan', color: '#f4f4f4' }, { ad: 'Sihirli', color: '#5aa8ff' }, { ad: 'Nadir', color: '#ffd23f' }, { ad: 'Efsane', color: '#ff8a1c' }];
  const rarCol = r => (RARITY[r] || RARITY[0]).color;
  const baseId = it => (it && it.base && it.base.id) ? it.base.id : (it ? it.base : null);
  const itemKey = it => it.slot + ':' + baseId(it) + ':' + (it.rarity | 0);

  // ── Geometry builders ──
  // Grid surface fn(u, v, out) for u, v in [0,1]; normals by central differences, oriented away from `ctr`.
  function paramGeo(fn, nu, nv, ctr, wrapU) {
    const n1 = nu + 1, nV = n1 * (nv + 1);
    const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), uv = new Float32Array(nV * 2);
    const p = v3(), a = v3(), b = v3(), c = v3(), d = v3(), n = v3(), e = 1e-3;
    for (let j = 0, k = 0; j <= nv; j++) for (let i = 0; i <= nu; i++, k++) {
      const u = i / nu, v = j / nv;
      fn(u, v, p);
      fn(wrapU ? u + e : Math.min(1, u + e), v, a); fn(wrapU ? u - e : Math.max(0, u - e), v, b); a.sub(b);
      fn(u, Math.min(1, v + e), c); fn(u, Math.max(0, v - e), d); c.sub(d);
      n.crossVectors(a, c);
      if (n.lengthSq() < 1e-14) n.copy(p).sub(ctr);
      n.normalize();
      if (n.dot(d.copy(p).sub(ctr)) < 0) n.negate();
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      nor[k * 3] = n.x; nor[k * 3 + 1] = n.y; nor[k * 3 + 2] = n.z;
      uv[k * 2] = u; uv[k * 2 + 1] = v;
    }
    const idx = [];
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = j * n1 + i; idx.push(q, q + 1, q + n1 + 1, q, q + n1 + 1, q + n1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    fixWinding(g);
    return g;
  }
  // Make triangle winding agree with the vertex normals (front faces outward).
  function fixWinding(g) {
    const I = g.index.array, P = g.attributes.position, N = g.attributes.normal, a = v3(), b = v3(), c = v3(), n = v3();
    let s = 0;
    for (let t = 0; t < I.length; t += 3 * Math.max(1, (I.length / 3 / 60) | 0)) {
      a.fromBufferAttribute(P, I[t]); b.fromBufferAttribute(P, I[t + 1]).sub(a); c.fromBufferAttribute(P, I[t + 2]).sub(a);
      n.crossVectors(b, c); if (n.lengthSq() < 1e-16) continue;
      a.fromBufferAttribute(N, I[t]); s += n.dot(a) > 0 ? 1 : -1;
    }
    if (s < 0) for (let t = 0; t < I.length; t += 3) { const x = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = x; }
  }
  // Lathe (profile bottom → top as [r, y]) with the seam at the back, elliptic (sx, sz), UVs in texture tiles if `tile`.
  function lathe(prof, seg, cx, cz, sx, sz, tile) {
    const pts = prof.map(p => V2(p[0], p[1]));
    const g = new THREE.LatheGeometry(pts, seg, Math.PI, TAU);
    g.applyMatrix4(new THREE.Matrix4().makeScale(sx, 1, sz));
    g.translate(cx, 0, cz);
    if (tile) {
      const uv = g.attributes.uv, n = pts.length, L = [0];
      let rMax = 0;
      for (let j = 0; j < n; j++) { rMax = Math.max(rMax, pts[j].x); if (j) L[j] = L[j - 1] + pts[j].distanceTo(pts[j - 1]); }
      const C = TAU * rMax * (sx + sz) / 2;
      for (let i = 0; i <= seg; i++) for (let j = 0; j < n; j++) uv.setXY(i * n + j, i / seg * C / tile, L[j] / tile);
    }
    return g;
  }
  // Sweep an elliptic cross-section along points P[i] with up vectors U[i]. wf/tf(t) half width/thickness,
  // flat squashes the underside, colf(t, color), flexf(t). Returns indexed geometry with color + aFlex.
  function sweep(P, U, wf, tf, M, flat, colf, flexf) {
    const N = P.length - 1, nv = (N + 1) * (M + 1);
    const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 3), fl = new Float32Array(nv);
    const T = v3(), Nn = v3(), B = v3(), q = v3(), c = new THREE.Color();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      T.subVectors(P[Math.min(N, i + 1)], P[Math.max(0, i - 1)]).normalize();
      Nn.copy(U[i]).addScaledVector(T, -U[i].dot(T)).normalize();
      B.crossVectors(T, Nn).normalize();
      const w = wf(t), th = tf(t), f = flexf ? flexf(t) : 0;
      colf(t, c);
      for (let k = 0; k <= M; k++) {
        const a = k / M * TAU, ca = Math.cos(a), sa = Math.sin(a), o = i * (M + 1) + k;
        q.copy(P[i]).addScaledVector(B, ca * w).addScaledVector(Nn, sa < 0 ? sa * th * flat : sa * th);
        pos[o * 3] = q.x; pos[o * 3 + 1] = q.y; pos[o * 3 + 2] = q.z;
        uv[o * 2] = k / M; uv[o * 2 + 1] = t;
        col[o * 3] = c.r; col[o * 3 + 1] = c.g; col[o * 3 + 2] = c.b;
        fl[o] = f;
      }
    }
    const idx = [];
    for (let i = 0; i < N; i++) for (let k = 0; k < M; k++) { const a = i * (M + 1) + k, b = a + M + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aFlex', new THREE.BufferAttribute(fl, 1));
    g.setIndex(idx);
    g.computeVertexNormals();
    // outward check: the top of the ring (k = M/4) must face +up
    const k4 = Math.round(M / 4), mid = Math.floor(N / 2) * (M + 1), nA = g.attributes.normal;
    T.subVectors(P[Math.min(N, Math.floor(N / 2) + 1)], P[Math.max(0, Math.floor(N / 2) - 1)]).normalize();
    Nn.copy(U[Math.floor(N / 2)]).addScaledVector(T, -U[Math.floor(N / 2)].dot(T)).normalize();
    if (q.fromBufferAttribute(nA, mid + k4).dot(Nn) < 0) {
      const I = g.index.array; for (let t = 0; t < I.length; t += 3) { const x = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = x; }
      g.computeVertexNormals();
    }
    return g;
  }
  // Catmull-Rom through 3D points, returns N+1 samples.
  const curvePts = (pts, N) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoints(N);
  // Concatenate geometries that share the same attribute set.
  function concat(geos) {
    const names = Object.keys(geos[0].attributes);
    let nv = 0, ni = 0;
    for (const g of geos) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const out = new THREE.BufferGeometry(), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    for (const n of names) {
      const s = geos[0].attributes[n].itemSize, arr = new Float32Array(nv * s);
      let vo = 0;
      for (const g of geos) { const a = g.attributes[n]; for (let i = 0; i < a.count * s; i++) arr[vo * s + i] = a.array[i]; vo += g.attributes.position.count; }
      out.setAttribute(n, new THREE.BufferAttribute(arr, s));
    }
    let vo = 0, io = 0;
    for (const g of geos) {
      const c = g.attributes.position.count;
      if (g.index) { const I = g.index.array; for (let i = 0; i < I.length; i++) idx[io + i] = I[i] + vo; io += I.length; }
      else { for (let i = 0; i < c; i++) idx[io + i] = vo + i; io += c; }
      vo += c;
    }
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    out.computeBoundingSphere();
    return out;
  }
  // Kit-like merge with skin weights. part: {geo, bone} or {geo, w(x,y,z) → [bone0, bone1, weight1]}, color hex|fn, face?
  function mergeSkinned(parts, withFace) {
    let nv = 0, ni = 0;
    for (const p of parts) { nv += p.geo.attributes.position.count; ni += p.geo.index ? p.geo.index.count : p.geo.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 3);
    const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), face = withFace ? new Float32Array(nv * 2).fill(-10) : null;
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0;
    const cc = new THREE.Color();
    for (const p of parts) {
      const g = p.geo, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, F = g.attributes.aFace, C = g.attributes.color;
      const cfn = typeof p.color === 'function' ? p.color : null, cfix = cfn ? null : new THREE.Color(p.color ?? 0xffffff);
      for (let i = 0; i < P.count; i++) {
        const o = vo + i, x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z;
        nor[o * 3] = N.getX(i); nor[o * 3 + 1] = N.getY(i); nor[o * 3 + 2] = N.getZ(i);
        if (U) { uv[o * 2] = U.getX(i); uv[o * 2 + 1] = U.getY(i); }
        const c = cfn ? cfn(x, y, z) : C ? cc.setRGB(C.getX(i), C.getY(i), C.getZ(i)).multiply(cfix) : cfix;
        col[o * 3] = c.r; col[o * 3 + 1] = c.g; col[o * 3 + 2] = c.b;
        if (p.w) { const w = p.w(x, y, z); si[o * 4] = w[0]; si[o * 4 + 1] = w[1]; sw[o * 4] = 1 - w[2]; sw[o * 4 + 1] = w[2]; }
        else { si[o * 4] = p.bone; sw[o * 4] = 1; }
        if (face && F) { face[o * 2] = F.getX(i); face[o * 2 + 1] = F.getY(i); }
      }
      if (g.index) { const I = g.index.array; for (let i = 0; i < I.length; i++) idx[io + i] = I[i] + vo; io += I.length; }
      else { for (let i = 0; i < P.count; i++) idx[io + i] = vo + i; io += P.count; }
      vo += P.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    out.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    if (face) out.setAttribute('aFace', new THREE.BufferAttribute(face, 2));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    out.computeBoundingSphere();
    return keep(out);
  }
  const kitGeo = f => { const k = new Kit(); f(k); return k.build(); };

  // ── Head shape (head-bone space; bone sits at the neck base, world y = HB in bind pose) ──
  const HB = 0.84, HC = v3(0, 0.24, 0.012);
  function headSurf(th, ph, o) {
    const cp = Math.cos(ph), dx = Math.sin(th) * cp, dy = Math.sin(ph), dz = Math.cos(th) * cp;
    let x = dx * 0.272, y = dy * lerp(0.198, 0.262, sstep(-0.35, 0.35, dy)), z = dz * lerp(0.27, 0.258, sstep(-0.35, 0.35, dz));
    const jaw = sstep(0.3, 1.25, -ph);                                                     // narrower jaw, short soft chin
    x *= 1 - 0.22 * jaw; z *= 1 - 0.16 * jaw;
    const at = Math.abs(th), front = sstep(-0.1, 0.4, dz);
    let b = 0.022 * Math.exp(-sq((at - 0.5) / 0.33) - sq((ph + 0.35) / 0.27)) * front;      // round cheeks
    b += 0.013 * Math.exp(-sq(th / 0.08) - sq((ph + 0.262) / 0.065));                      // button nose
    b += 0.006 * Math.exp(-sq(th / 0.3) - sq((ph + 0.92) / 0.2));                          // chin
    o.set(HC.x + x + dx * b, HC.y + y + dy * b, HC.z + z + dz * b);
    return o;
  }
  const _ha = v3(), _hb = v3(), _hc = v3(), _hd = v3();
  function headNormal(th, ph, o) {
    const e = 1e-3;
    headSurf(th + e, ph, _ha); headSurf(th - e, ph, _hb); _ha.sub(_hb);
    headSurf(th, Math.min(ph + e, 1.5707), _hc); headSurf(th, Math.max(ph - e, -1.5707), _hd); _hc.sub(_hd);
    o.crossVectors(_ha, _hc);
    if (o.lengthSq() < 1e-12) { headSurf(th, ph, o); o.sub(HC); }
    return o.normalize();
  }
  // Non-uniform head grid: dense over the face, sparse at the back and top (under the hair) → a third of the triangles.
  const headTh = u => { const s = 2 * u - 1; return Math.PI * s * (0.38 + 0.62 * s * s); };
  const PH_CDF = (() => {
    const N = 256, d = ph => 1 + 1.4 * Math.exp(-sq((ph + 0.3) / 0.6)), c = [0];
    for (let i = 1; i <= N; i++) c.push(c[i - 1] + d(-Math.PI / 2 + (i - 0.5) / N * Math.PI));
    return c.map(x => x / c[N]);
  })();
  function headPh(v) {
    v = clamp(v, 0, 1);
    let lo = 0, hi = PH_CDF.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (PH_CDF[m] <= v) lo = m; else hi = m; }
    const f = (v - PH_CDF[lo]) / Math.max(1e-9, PH_CDF[hi] - PH_CDF[lo]);
    return -Math.PI / 2 + (lo + f) / (PH_CDF.length - 1) * Math.PI;
  }
  function headGeo() {
    const NU = 64, NV = 40, ctr = v3(0, HB + HC.y, HC.z);
    const g = paramGeo((u, v, o) => { headSurf(headTh(u), headPh(v), o); o.y += HB; }, NU, NV, ctr, true);
    const f = new Float32Array((NU + 1) * (NV + 1) * 2);
    for (let j = 0, k = 0; j <= NV; j++) for (let i = 0; i <= NU; i++, k++) { f[k * 2] = headTh(i / NU); f[k * 2 + 1] = headPh(j / NV); }
    g.setAttribute('aFace', new THREE.BufferAttribute(f, 2));
    return g;
  }
  // Ears (half covered by the side hair, like in the photo): a thin plate with a rolled rim, tilted back a little.
  const EAR = { th: 1.6, ph: -0.19 };
  function earGeo(s) {
    const th = s * EAR.th, p = headSurf(th, EAR.ph, v3()), n = headNormal(th, EAR.ph, v3());
    const X = n.clone(), Y = v3(0, 1, 0).addScaledVector(X, -X.y).normalize().applyAxisAngle(X, -0.22 * s), Z = v3().crossVectors(X, Y);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    const c = p.clone().addScaledVector(n, 0.004); c.y += HB;
    const o = c.clone().addScaledVector(X, 0.008), inner = new THREE.Color(0xe9a390), outer = new THREE.Color(0xf6cdb8), tmp = new THREE.Color(), w = v3();
    const col = (x, y, z) => { w.set(x, y, z).sub(o); return tmp.copy(inner).lerp(outer, sstep(0.008, 0.022, Math.hypot(w.dot(Y), w.dot(Z) * 1.3))); };
    return kitGeo(k => {
      k.add(G.sphere(12, 8), col, [c.x, c.y, c.z], q, [0.009, 0.034, 0.024]);
      k.push([o.x, o.y, o.z], q).add(G.torus(TAU, 0.34, 18), 0xf6cdb8, [0, 0.002, 0], [0, Math.PI / 2, 0], [0.018, 0.026, 0.02]).pop();
    });
  }

  // ── Hair: a shell over the scalp plus ~75 short, tousled locks (a boy's shaggy cut: nape at the top of the neck,
  // ears half covered, fringe swept diagonally so one corner of the forehead shows) and a few cowlicks ──
  const HAIR_D = new THREE.Color(0x352010), HAIR_L = new THREE.Color(0x56351c), HAIR_H = new THREE.Color(0x7d532d);
  function hairline(th) {
    const a = Math.abs(th), saw = th * 2.3 + 0.35 - Math.floor(th * 2.3 + 0.35);
    const front = 0.46 + 0.06 * th + (V2ON ? 0.022 : 0.06) * Math.pow(saw, 1.7);                              // the locks make the fringe edge
    let h = lerp(front, -0.3, sstep(0.6, 1.25, a));                                          // temples → sideburns
    h = lerp(h, -0.28, sstep(1.75, 2.2, a));                                                 // behind the ears
    h = lerp(h, -0.34, sstep(2.4, 2.9, a));                                                  // nape (the idle head tilt lowers it)
    h = lerp(h, -0.04, sstep(1.28, 1.46, a) * (1 - sstep(1.76, 1.96, a)));                   // around the ear
    return h + (V2ON ? 0.012 : 0.03) * Math.sin(th * 11 + 0.7) * sstep(0.5, 1.2, a);
  }
  function hairThick(th, ph) {
    const a = Math.abs(th);
    return (0.016 + 0.034 * sstep(-0.1, 1.1, ph) + 0.006 * sstep(1.9, 2.8, a) * sstep(-0.6, 0.3, ph)) * (V2ON ? 1 + 0.4 * sstep(0.7, 1.3, ph) : 1);
  }
  const capLift = (th, ph) => { const hl = hairline(th); return hairThick(th, ph) * sstep(hl - 0.1, hl + 0.06, ph); };
  const dirOf = (th, ph) => v3(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph));
  function hairCapGeo() {
    const NU = 128, NV = 16, n = v3(), ctr = HC.clone();
    const g = paramGeo((u, v, o) => {
      const th = -Math.PI + u * TAU, hl = hairline(th), s = Math.pow(v, 0.85), ph = lerp(hl, Math.PI / 2 - 1e-3, s);
      headSurf(th, ph, o); headNormal(th, ph, n);
      o.addScaledVector(n, hairThick(th, ph) * (0.18 + 0.82 * sstep(0, 0.16, v)));
    }, NU, NV, ctr, true);
    const cnt = g.attributes.position.count, col = new Float32Array(cnt * 3), fl = new Float32Array(cnt), uv = g.attributes.uv, c = new THREE.Color();
    for (let i = 0; i < cnt; i++) {
      const u = uv.getX(i), v = uv.getY(i), th = -Math.PI + u * TAU;
      const streak = 0.5 + 0.5 * Math.sin(th * 23 + Math.sin(th * 7) * 2) * Math.sin(th * 9 + 1);
      c.copy(HAIR_D).lerp(HAIR_L, 0.3 + 0.25 * streak * sstep(0.1, 0.8, v)).multiplyScalar(0.8 + 0.2 * sstep(0, 0.3, v));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      uv.setXY(i, u * 10, v * 2.2);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aFlex', new THREE.BufferAttribute(fl, 1));
    return g;
  }
  function hairLocks() {
    const R = mulberry32(20190612), r = (a, b) => a + R() * (b - a), L = [];
    const add = (pts, w, t, tone, flex, tuft) => L.push({ pts, w, t, tone, flex, tuft: !!tuft });
    const P = (th, ph, lift) => [dirOf(th, ph), lift];
    const lock4 = (th0, ph0, th1, ph1, lifts, w, t, tone, flex, bulge = 0) => add([P(th0, ph0, lifts[0]), P(lerp(th0, th1, 0.4) + bulge, lerp(ph0, ph1, 0.42), lifts[1]),
      P(lerp(th0, th1, 0.78), lerp(ph0, ph1, 0.8), lifts[2]), P(th1, ph1, lifts[3])], w, t, tone, flex);
    // fringe: swept diagonally to Feza's right (th < 0) — short on his left so that corner of the forehead shows,
    // down to the right brow; some tips flick up
    for (let i = 0; i < 12; i++) {
      const f = i / 11, th0 = 0.8 - i * 0.125 + r(-0.03, 0.03), ph0 = 0.8 + r(-0.04, 0.05);
      const th1 = th0 - 0.3 - r(0, 0.14), ph1 = lerp(0.37, 0.15, f) + r(-0.03, 0.03) - Math.max(0, -th1 - 0.5) * 0.2;
      lock4(th0, ph0, th1, ph1, [0, 0.017, 0.013, 0.011 + 0.012 * R()], r(0.05, 0.064), r(0.018, 0.022), r(0.05, 0.75), 0.8, 0.02);
    }
    for (let i = 0; i < 5; i++) {   // shorter top layer so the fringe root is not a flat line
      const th0 = 0.62 - i * 0.3 + r(-0.05, 0.05), ph0 = 1.0 + r(0, 0.08);
      lock4(th0, ph0, th0 - 0.3 - r(0, 0.1), 0.5 + r(0, 0.08), [0, 0.018, 0.017, 0.014], r(0.055, 0.07), 0.02, r(0.4, 1), 0.7, 0.03);
    }
    lock4(0.1, 0.74, 0.36, 0.44, [0, 0.015, 0.017, 0.022], 0.044, 0.017, 0.85, 0.8);          // one rebel the other way
    // sides: shaggy, ear-lobe length in front of and behind the ear, short over it; tips flick outward
    for (const s of [1, -1]) {
      for (let i = 0; i < 3; i++) {   // temples / sideburns
        const th0 = s * (0.8 + i * 0.16 + r(-0.03, 0.03)), ph0 = 0.5 + r(-0.03, 0.06);
        lock4(th0, ph0, th0 + s * (0.14 + r(0, 0.08)), -0.06 - r(0, 0.05), [0, 0.018, 0.022, 0.03], r(0.056, 0.068), 0.021, r(0.1, 0.9), 1, s * 0.04);
      }
      for (let i = 0; i < 3; i++) {   // over the ear: covers its top half
        const th0 = s * (1.36 + i * 0.17 + r(-0.03, 0.03)), ph0 = 0.56 + r(-0.03, 0.06);
        lock4(th0, ph0, th0 + s * r(0.04, 0.14), 0.1 - r(0, 0.05), [0, 0.02, 0.026, 0.032], r(0.06, 0.072), 0.022, r(0, 1), 1);
      }
      for (let i = 0; i < 3; i++) {   // behind the ear
        const th0 = s * (1.95 + i * 0.2 + r(-0.04, 0.04)), ph0 = 0.62 + r(-0.03, 0.08);
        lock4(th0, ph0, th0 + s * r(0.04, 0.16), -0.02 - r(0, 0.06), [0, 0.02, 0.025, 0.03], r(0.064, 0.076), 0.023, r(0, 1), 1);
      }
      for (let i = 0; i < 4; i++) {   // short upper-side layer (volume seen from above)
        const th0 = s * (0.8 + i * 0.42 + r(-0.05, 0.05)), ph0 = 1.02 + r(0, 0.1);
        lock4(th0, ph0, th0 + s * r(0.04, 0.16), 0.26 + r(-0.08, 0.08), [0, 0.021, 0.026, 0.028], r(0.068, 0.082), 0.024, r(0.3, 1), 0.8);
      }
    }
    // nape: uneven tips at the top of the neck, flicking out
    for (let i = 0; i < 9; i++) {
      const th0 = Math.PI + (i - 4) * 0.22 + r(-0.04, 0.04), ph0 = 0.72 + r(0, 0.1), th1 = th0 + r(-0.12, 0.12), ph1 = 0.04 - r(0, 0.08) + (i & 1) * 0.05;
      lock4(th0, ph0, th1, ph1, [0, 0.02, 0.026, 0.03 + r(0, 0.012)], r(0.068, 0.082), 0.024, r(0, 0.9), 1);
    }
    // shorter layer over the back of the head, so the back reads layered and tousled, not as one straight curtain
    for (let i = 0; i < 7; i++) {
      const th0 = Math.PI + (i - 3) * 0.3 + r(-0.06, 0.06), ph0 = 0.95 + r(0, 0.1);
      lock4(th0, ph0, th0 + r(-0.2, 0.2), 0.3 + r(-0.08, 0.1), [0, 0.024, 0.028, 0.034 + r(0, 0.012)], r(0.07, 0.085), 0.024, r(0.3, 1), 0.8);
    }
    // crown: short tousled clumps swirling out of a whorl a little behind the top (very visible from the game camera)
    const Cw = dirOf(Math.PI * 0.92, 1.18), e1 = v3().crossVectors(Cw, v3(1, 0, 0)).normalize(), e2 = v3().crossVectors(Cw, e1);
    const at = (a, d) => Cw.clone().multiplyScalar(Math.cos(d)).addScaledVector(e1, Math.cos(a) * Math.sin(d)).addScaledVector(e2, Math.sin(a) * Math.sin(d)).normalize();
    const clump = (a, tw, d0, d1, l0, l1, l2, l3, w, t, tone, flex) => add([[at(a, d0), l0], [at(a + tw * 0.4, lerp(d0, d1, 0.4)), l1], [at(a + tw * 0.8, lerp(d0, d1, 0.78)), l2], [at(a + tw, d1), l3]], w, t, tone, flex);
    for (let i = 0; i < 8; i++) clump(i / 8 * TAU + r(-0.2, 0.2), 0.35 + r(-0.1, 0.15), 0.03, r(0.3, 0.4), 0.004, 0.02, 0.022, 0.02 + r(0, 0.012), r(0.068, 0.082), r(0.018, 0.022), r(0.3, 1), 0.5);
    for (let i = 0; i < 12; i++) { const d0 = r(0.26, 0.34); clump(i / 12 * TAU + r(-0.15, 0.15), r(-0.45, 0.45), d0, d0 + r(0.32, 0.44), 0.006, 0.022, 0.02, 0.017 + r(0, 0.016), r(0.07, 0.086), r(0.018, 0.023), r(0.2, 1), 0.6); }
    // cowlicks (collapsed under hats)
    const cw = [[0.5, 0.11, 0.06], [-0.3, 0.13, 0.08], [0.15, 0.08, 0.05], [1.4, 0.07, 0.035]];
    for (const [a, h, len] of cw) {
      const b = dirOf(Math.PI * 0.9 + a * 0.25, 1.22), m = dirOf(Math.PI * 0.9 + a * 0.4, 1.05 + len), e = dirOf(Math.PI * 0.95 + a * 0.6, 0.9 + len);
      add([[b, 0.01], [m, h * 0.6], [e, h]], 0.028, 0.012, 0.7, 1.4, true);
    }
    return L;
  }
  function lockGeo(L) {
    const N = V2ON ? 16 : 8, dirs = curvePts(L.pts.map(p => p[0]), N), n1 = L.pts.length - 1;
    const liftAt = t => { const f = t * n1, i = Math.min(n1 - 1, Math.floor(f)), u = f - i, a = L.pts[i][1], b = L.pts[i + 1][1]; return a + (b - a) * u * u * (3 - 2 * u); };
    const P = [], U = [], n = v3();
    for (let i = 0; i <= N; i++) {
      const d = dirs[i].normalize(), th = Math.atan2(d.x, d.z), ph = Math.asin(clamp(d.y, -1, 1));
      const p = headSurf(th, ph, v3()); headNormal(th, ph, n);
      p.addScaledVector(n, capLift(th, ph) + liftAt(i / N) + L.t * 0.35);
      P.push(p); U.push(n.clone());
    }
    const base = HAIR_D.clone().lerp(HAIR_L, L.tone);
    // aFlex < 0 marks cowlick vertices (the hair shader collapses them under a hat)
    return sweep(P, U, t => L.w * (0.7 + 0.3 * Math.sin(Math.min(1, t * 2.2) * Math.PI / 2)) * Math.pow(1 - t, 0.9),
      t => L.t * (1 - 0.75 * t), V2ON ? 8 : 6, 0.5,
      (t, c) => { c.copy(base).multiplyScalar(0.86 + 0.26 * t); if (L.tone > 0.75 && t > 0.3) c.lerp(HAIR_H, 0.3); },
      t => L.tuft ? -(Math.pow(t, 1.5) * L.flex + 0.01) : Math.pow(t, 1.5) * L.flex);
  }
  // Low-poly outer hull of head + hair (for the x-ray silhouette proxy), head-bone space shifted to bind pose (y + HB).
  function headHullGeo() {
    const n = v3();
    return paramGeo((u, v, o) => {
      const th = -Math.PI + u * TAU, ph = -Math.PI / 2 + v * Math.PI, hl = hairline(th);
      headSurf(th, ph, o); headNormal(th, ph, n);
      o.addScaledVector(n, capLift(th, ph) + 0.028 * sstep(hl - 0.05, hl + 0.12, ph)); o.y += HB;
    }, 20, 14, v3(0, HB + HC.y, HC.z), true);
  }

  // ── Strand normal map for the hair (generated once, 128²) ──
  let STRAND = null;
  function strandTex() {
    if (STRAND) return STRAND;
    const S = 128, D = new Uint8Array(S * S * 4), H = new Float32Array(S * S), R = mulberry32(77);
    const ph = [], fr = [2, 5, 9, 14, 23, 31, 47], am = [0.3, 0.25, 0.22, 0.18, 0.12, 0.1, 0.06];
    for (let i = 0; i < fr.length; i++) ph.push(R() * TAU);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let h = 0; const u = x / S, v = y / S;
      for (let i = 0; i < fr.length; i++) h += am[i] * Math.sin(TAU * fr[i] * u + ph[i] + 0.6 * Math.sin(TAU * v + i));
      H[y * S + x] = h;
    }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = H[y * S + (x + 1) % S] - H[y * S + (x + S - 1) % S], dy = H[((y + 1) % S) * S + x] - H[((y + S - 1) % S) * S + x];
      const nx = -dx * 2.2, ny = -dy * 2.2, l = Math.hypot(nx, ny, 1), o = (y * S + x) * 4;
      D[o] = (nx / l * 0.5 + 0.5) * 255; D[o + 1] = (ny / l * 0.5 + 0.5) * 255; D[o + 2] = (1 / l * 0.5 + 0.5) * 255; D[o + 3] = 255;
    }
    const t = new THREE.DataTexture(D, S, S, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = ANISO; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    return (STRAND = keep(t));
  }

  // ── Body geometry (built once, shared by every Feza) ──
  // Bones: 0 root, 1 hips, 2 chest, 3 head, 4 armL, 5 foreL, 6 armR, 7 foreR, 8 thighL, 9 shinL, 10 thighR, 11 shinR.
  // Feza faces +z, so his right side is −x (sword arm = armR).
  const SKIN = 0xf2cbb5, TILE = 0.4;
  const BONES = [['root', -1, 0, 0, 0], ['hips', 0, 0, 0.47, 0], ['chest', 1, 0, 0.13, 0], ['head', 2, 0, 0.24, 0],
    ['armL', 2, 0.175, 0.16, -0.005], ['foreL', 4, 0, -0.155, 0], ['armR', 2, -0.175, 0.16, -0.005], ['foreR', 6, 0, -0.155, 0],
    ['thighL', 1, 0.088, -0.03, 0], ['shinL', 8, 0, -0.195, 0], ['thighR', 1, -0.088, -0.03, 0], ['shinR', 10, 0, -0.195, 0]];
  // Lathe profiles [r, y] (bind pose, metres). SHIRT_P / SHORTS_P are also used to keep the cape off the back.
  const NECK_P = [[0, 0.76], [0.06, 0.765], [0.058, 0.84], [0.06, 0.92], [0, 0.95]];
  const ARM_P = [[0, 0.455], [0.03, 0.458], [0.041, 0.47], [0.043, 0.5], [0.046, 0.56], [0.047, 0.605], [0.05, 0.65], [0.053, 0.7], [0.054, 0.74], [0.05, 0.775], [0.035, 0.79], [0, 0.795]];
  const LEG_P = [[0, 0.06], [0.03, 0.063], [0.043, 0.08], [0.046, 0.11], [0.057, 0.17], [0.059, 0.2], [0.056, 0.245], [0.06, 0.29], [0.068, 0.35], [0.072, 0.4], [0.07, 0.45], [0.05, 0.48], [0, 0.49]];
  const SLEEVE_P = [[0.055, 0.628], [0.066, 0.632], [0.069, 0.66], [0.068, 0.71], [0.062, 0.755], [0.048, 0.785], [0.026, 0.8], [0, 0.803]];
  // uzun eşofman paçası (bilekte lastik), uzun kol, çorap
  const PANTLEG_P = [[0.042, 0.158], [0.057, 0.161], [0.062, 0.172], [0.064, 0.186], [0.07, 0.21], [0.075, 0.24], [0.077, 0.27], [0.08, 0.3], [0.087, 0.34],
    [0.09, 0.38], [0.093, 0.41], [0.091, 0.44], [0.07, 0.455], [0, 0.46]];
  const LSLEEVE_P = [[0.036, 0.462], [0.054, 0.465], [0.058, 0.48], [0.057, 0.51], [0.059, 0.56], [0.062, 0.605], [0.065, 0.65], [0.068, 0.7], [0.069, 0.74], [0.064, 0.775],
    [0.048, 0.795], [0.026, 0.805], [0, 0.808]];
  const SOCK_P = (() => { const P = [[0.03, 0.085]]; for (let y = 0.09; y <= 0.181; y += 0.006) P.push([y < 0.1 ? 0.049 : y > 0.165 ? 0.056 : 0.051 + (y - 0.1) * 0.06, y]); P.push([0.044, 0.184], [0, 0.185]); return P; })();
  const sockCol = (() => { const A = new THREE.Color(0xff8a3d), B = new THREE.Color(0x35b8a8), Y = new THREE.Color(0xffd84a), c = new THREE.Color();
    return (x, y) => { const k = Math.floor((y - 0.085) / 0.012); return c.copy(y > 0.165 ? Y : k % 2 ? B : A); }; })();
  const SHIRT_P = [[0, 0.425], [0.14, 0.423], [0.186, 0.432], [0.196, 0.452], [0.195, 0.48], [0.191, 0.52], [0.187, 0.55], [0.178, 0.61], [0.17, 0.67], [0.163, 0.72],
    [0.152, 0.76], [0.13, 0.79], [0.1, 0.81], [0.07, 0.822], [0.056, 0.826], [0, 0.827]];
  const SHORTS_P = [[0, 0.375], [0.1, 0.378], [0.155, 0.398], [0.178, 0.43], [0.187, 0.47], [0.186, 0.5], [0.18, 0.52], [0, 0.525]];
  let BODY = null;
  function buildBody() {
    if (BODY) return BODY;
    const t0 = performance.now();
    const skin = [], cloth = [], shoe = [], pants = [];
    // Dev Ev kıyafeti: uzun kollu çizgili tişört, koyu gri eşofman altı (lastikli paça), renkli çizgili çoraplar
    const capCream = (g, y0) => { const u = g.attributes.uv, P = g.attributes.position; for (let i = 0; i < u.count; i++) if (P.getY(i) > y0) u.setXY(i, 0.5, 0.968); return g; };   // omuz tepesi: halka yerine düz krem
    const cream = g => { const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, 0.5, 0.968); return g; };   // ribanalar: çizgisiz krem
    const PANT = 0x474b54, PANT_D = 0x3a3d45;
    skin.push({ geo: headGeo(), bone: 3 });
    for (const s of [1, -1]) skin.push({ geo: earGeo(s), bone: 3 });
    skin.push({ geo: lathe(NECK_P, 16, 0, 0.004, 1, 0.92), w: (x, y) => [2, 3, sstep(0.8, 0.87, y)] });
    for (const s of [1, -1]) {
      const up = s > 0 ? 4 : 6, fo = up + 1, th = s > 0 ? 8 : 10, sh = th + 1, ax = 0.175 * s;
      skin.push({ geo: lathe(ARM_P.filter(p => p[1] < 0.5), 12, ax, -0.005, 1, 0.95), bone: fo });   // bilek (kolun gerisi kolluğun içinde)
      skin.push({ geo: kitGeo(k => {
        k.add(G.sphere(14), 0xffffff, [ax, 0.42, 0.002], 0, [0.046, 0.052, 0.048]);
        k.add(G.sphere(10), 0xffffff, [ax - 0.034 * s, 0.432, 0.026], [0, 0, 0.5 * s], [0.017, 0.026, 0.018]);
        for (let i = 0; i < 4; i++) k.add(G.sphere(8), 0xffffff, [ax + (i - 1.5) * 0.0165 * s * -1 + 0.004 * s, 0.395 - (i === 1 || i === 2 ? 0.004 : 0), 0.034 - Math.abs(i - 1.5) * 0.004], [0, 0, 0], [0.0125, 0.02, 0.0135]);   // (G4) parmak ucu kabarcıkları
      }), bone: fo, color: 0xfff0ea });
      cloth.push({ geo: capCream(lathe(LSLEEVE_P, 18, ax * 0.985, -0.005, 1, 0.95, TILE), 0.79), w: (x, y) => y > 0.66 ? [2, up, sstep(0.8, 0.72, y)] : [up, fo, sstep(0.64, 0.57, y)], color: 0xffffff });
      cloth.push({ geo: cream(kitGeo(k => k.add(G.torus(TAU, 0.2, 20), 0xffffff, [ax, 0.468, -0.005], [Math.PI / 2, 0, 0], [0.054, 0.051, 0.054]))), bone: fo, color: 0xf6f0e6 });   // kol ağzı ribanası
      pants.push({ geo: lathe(PANTLEG_P, 18, 0.09 * s, 0, 1, 0.95, TILE), w: (x, y) => y > 0.37 ? [1, th, sstep(0.43, 0.37, y)] : [th, sh, sstep(0.28, 0.21, y)],
        color: (x, y, z) => new THREE.Color(PANT).lerp(new THREE.Color(PANT_D), 0.5 * Math.exp(-sq((y - 0.27) / 0.03)) + 0.35 * sstep(0.2, 0.16, y)) });
      pants.push({ geo: kitGeo(k => k.add(G.torus(TAU, 0.3, 18), 0xffffff, [0.09 * s, 0.172, 0], [Math.PI / 2, 0, 0], [0.058, 0.055, 0.057])), bone: sh, color: PANT_D });   // lastikli paça
      shoe.push({ geo: shoeGeo(s), bone: sh });
      shoe.push({ geo: lathe(SOCK_P, 16, 0.088 * s, 0.004, 1, 1), bone: sh, color: sockCol });
    }
    cloth.push({ geo: lathe(SHIRT_P, 32, 0, 0, 1, 0.8, TILE), w: (x, y) => [1, 2, sstep(0.5, 0.6, y)], color: 0xffffff });
    cloth.push({ geo: cream(kitGeo(k => k.add(G.torus(TAU, 0.2, 24), 0xffffff, [0, 0.821, 0.002], [Math.PI / 2, 0, 0], [0.064, 0.052, 0.064]))), bone: 2, color: 0xf6f0e6 });
    cloth.push({ geo: kitGeo(k => k.add(G.torus(TAU, 0.05, 32), 0xffffff, [0, 0.432, 0], [Math.PI / 2, 0, 0], [0.19, 0.152, 0.19])), bone: 1, color: 0xf3ecdf });
    pants.push({ geo: lathe(SHORTS_P, 28, 0, 0, 1, 0.82, TILE), bone: 1, color: PANT });
    // hair: shell + locks + cowlicks in ONE mesh (cowlicks are collapsed in the shader under a hat)
    const hair = [hairCapGeo()];
    for (const L of hairLocks()) hair.push(lockGeo(L));
    BODY = { skin: mergeSkinned(skin, true), cloth: mergeSkinned(cloth), pants: mergeSkinned(pants), shoe: mergeSkinned(shoe), hair: keep(concat(hair)), xray: xrayBodyGeo() };
    BODY.ms = Math.round(performance.now() - t0);
    return BODY;
  }
  // Low-poly skinned stand-in (~2k triangles) that draws the x-ray silhouette for the whole body + hair in one call.
  function xrayBodyGeo() {
    const P = [];
    P.push({ geo: headHullGeo(), bone: 3 });
    P.push({ geo: lathe(NECK_P, 8, 0, 0.004, 1, 0.92), w: (x, y) => [2, 3, sstep(0.8, 0.87, y)] });
    for (const s of [1, -1]) {
      const up = s > 0 ? 4 : 6, fo = up + 1, th = s > 0 ? 8 : 10, sh = th + 1, ax = 0.175 * s;
      P.push({ geo: lathe(ARM_P, 8, ax, -0.005, 1, 0.95), w: (x, y) => [up, fo, sstep(0.64, 0.57, y)] });
      P.push({ geo: kitGeo(k => k.add(G.sphere(8), 0xffffff, [ax, 0.42, 0.002], 0, [0.05, 0.056, 0.052])), bone: fo });
      P.push({ geo: lathe(LEG_P, 8, 0.088 * s, 0, 1, 1), w: (x, y) => [th, sh, sstep(0.28, 0.21, y)] });
      P.push({ geo: lathe(SLEEVE_P, 10, ax * 0.97, -0.005, 1, 0.95), w: (x, y) => [2, up, sstep(0.8, 0.72, y)] });
      P.push({ geo: lathe(PANTLEG_P, 10, 0.09 * s, 0, 1, 0.95), w: (x, y) => [1, th, sstep(0.43, 0.37, y)] });
    }
    P.push({ geo: lathe(SHIRT_P, 16, 0, 0, 1, 0.8), w: (x, y) => [1, 2, sstep(0.5, 0.6, y)] });
    P.push({ geo: lathe(SHORTS_P, 14, 0, 0, 1, 0.82), bone: 1 });
    return mergeSkinned(P);
  }
  function shoeGeo(s) {
    const x0 = 0.088 * s, W = 0xe6e4df, B = 0x3a78e0, NV = 0x24407a, RD = 0xf0604c;
    return kitGeo(k => {
      k.add(G.rbox(2), W, [x0, 0.018, 0.028], 0, [0.1, 0.036, 0.21]);
      k.add(G.sphere(14), B, [x0, 0.052, 0.026], 0, [0.05, 0.046, 0.098]);
      k.add(G.sphere(12), W, [x0, 0.043, 0.09], 0, [0.047, 0.033, 0.05]);
      k.add(G.sphere(12), B, [x0, 0.062, -0.03], 0, [0.047, 0.052, 0.046]);
      k.add(G.rbox(1), RD, [x0, 0.08, -0.071], [0.25, 0, 0], [0.026, 0.045, 0.014]);
      k.add(G.torus(TAU, 0.26, 12), NV, [x0, 0.094, -0.006], [Math.PI / 2, 0, 0], 0.045);
      k.add(G.cyl(1, 1, 10), W, [x0, 0.108, -0.004], 0, [0.047, 0.03, 0.047]);
      for (let i = 0; i < 3; i++) k.add(G.rbox(1), W, [x0, 0.086 - i * 0.009, 0.03 + i * 0.02], [-0.55, 0, 0], [0.042, 0.007, 0.011]);
      k.add(G.rbox(1), W, [x0 + 0.048 * s, 0.05, 0.018], [0.25, 0, 0], [0.006, 0.016, 0.075]);
    });
  }

  // ── The face, drawn inside the skin shader ──
  const FACE_GLSL = `
    uniform vec4 fzEye; uniform float fzWink; uniform vec3 fzEyeW; uniform vec4 fzMouth; uniform vec3 fzBrow;
    varying vec2 vFace;
    #define SRGB(r, g, b) pow(vec3(r, g, b), vec3(2.2))
    float fzSq(float x) { return x * x; }
    float fzSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
    float fzLine(float d, float w, float aa) { return 1.0 - smoothstep(w - aa, w + aa, d); }
    void fzFace(inout vec3 col, inout float gloss, inout vec3 emis, vec2 q, float aa) {
      // cheeks + nose tip
      float bl = exp(-fzSq((abs(q.x) - 0.34) / 0.115) - fzSq((q.y + 0.325) / 0.07)) * (0.4 + 0.4 * fzBrow.z);
      col = mix(col, SRGB(0.99, 0.55, 0.53), bl);
      col = mix(col, SRGB(0.97, 0.66, 0.6), 0.22 * exp(-fzSq(q.x / 0.04) - fzSq((q.y + 0.252) / 0.035)));
      // eyes (e: eye-local, +x = outer corner)
      float side = q.x < 0.0 ? -1.0 : 1.0;
      float fzBk = max(fzEye.x, side > 0.0 ? fzWink : 0.0);   // göz kırpma: yalnız sol göz
      vec2 ec = vec2(0.252 * side, -0.11), er = vec2(0.138, 0.158);
      vec2 e = vec2((q.x - ec.x) * side, q.y - ec.y) / er;
      float aE = aa / er.y;
      float xx = clamp(e.x, -1.0, 1.0), cx = sqrt(max(0.0, 1.0 - xx * xx));
      float top = pow(cx, 0.75) * 0.84, bot = -cx * 0.92;
      // going to happy ^ / wince >: both lids squeeze shut onto that curve (the lid line becomes the ^), so an in-between
      // frame is a smiling squint, never a see-through pale ghost eye
      float hx = clamp(e.x, -0.95, 0.95), hy = -0.08 + 0.62 * (1.0 - hx * hx);
      float sq = clamp(1.0 - fzEyeW.x, 0.0, 1.0), tgt = mix(0.04, hy, fzEyeW.y / max(fzEyeW.y + fzEyeW.z, 1e-3));
      float lid = mix(mix(top, tgt + 0.03, sq), bot * 0.9 + 0.06, fzBk);
      lid = min(lid, top - fzEye.w * 0.6 * cx);
      float rr = length(vec2(e.x, e.y > 0.0 ? e.y / max(0.05, top / max(cx, 0.05)) : e.y / 0.92));
      float lidL = mix(-1.6, tgt - 0.03, sq);
      float vis = (1.0 - smoothstep(1.0 - aE, 1.0 + aE, rr)) * (1.0 - smoothstep(-aE, aE, e.y - lid)) * smoothstep(-aE, aE, e.y - lidL);
      vec2 ic = ec + vec2(fzEye.y * 0.03, fzEye.z * 0.024 + 0.002);
      vec2 di = q - ic; float ir = 0.12, dr = length(di) / ir, aI = aa / ir;
      vec3 iris = mix(SRGB(0.36, 0.2, 0.1), SRGB(0.72, 0.46, 0.22), smoothstep(0.2, -0.95, di.y / ir));
      iris *= 0.86 + 0.14 * sin(atan(di.y, di.x) * 15.0 + dr * 5.0);
      iris = mix(iris, SRGB(0.16, 0.08, 0.04), smoothstep(0.68, 0.98, dr));
      iris = mix(iris, SRGB(0.06, 0.03, 0.02), 1.0 - smoothstep(0.43 - aI, 0.43 + aI, dr));
      vec3 scl = SRGB(0.97, 0.965, 0.99) * (1.0 - 0.1 * smoothstep(0.6, 1.0, rr));
      vec3 eye = mix(scl, iris, 1.0 - smoothstep(1.0 - aI, 1.0 + aI, dr));
      eye *= 1.0 - 0.45 * smoothstep(lid - 0.62, lid, e.y);
      float c1 = 1.0 - smoothstep(0.27 - aI, 0.27 + aI, length(di / ir - vec2(-0.33, 0.36)));
      float c2 = 1.0 - smoothstep(0.13 - aI, 0.13 + aI, length(di / ir - vec2(0.38, -0.36)));
      float cl = max(c1, c2 * 0.9);
      eye = mix(eye, vec3(1.0), cl);
      // thin, even upper lid line (no outer flick: a boy, not mascara)
      float lw = (0.12 + 0.08 * fzBk) * mix(0.8, 1.0, smoothstep(-1.0, 0.3, e.x));
      float ly = e.y - lid;
      float lash = smoothstep(-0.05 - aE, -0.05 + aE, ly) * (1.0 - smoothstep(lw - aE, lw + aE, ly)) * (1.0 - smoothstep(0.88, 1.02, abs(e.x)));
      // closed variants: happy ^ and wince >
      float happy = fzLine(abs(e.y - hy) / sqrt(1.0 + fzSq(1.24 * hx)), 0.17, aE) * (1.0 - smoothstep(0.9, 1.02, abs(e.x)));
      float wd = min(fzSeg(e, vec2(0.95, 0.5), vec2(-0.5, 0.02)), fzSeg(e, vec2(-0.5, 0.02), vec2(0.95, -0.42)));
      float wince = fzLine(wd, 0.16, aE);
      vec3 lashC = SRGB(0.17, 0.09, 0.06);
      float lower = fzLine(abs(e.y - max(bot, lidL) - 0.05), 0.045, aE) * smoothstep(0.95, 0.4, abs(e.x - 0.1)) * (1.0 - max(fzBk, sq));
      float ow = smoothstep(0.05, 0.35, fzEyeW.x), cw = smoothstep(0.45, 0.9, sq);   // open eye fades only once nearly shut
      col = mix(col, col * SRGB(0.8, 0.62, 0.58), lower * 0.7 * ow);
      col = mix(col, eye, vis * ow);
      col = mix(col, lashC, lash * ow);
      col = mix(col, lashC, happy * fzEyeW.y * cw);
      col = mix(col, lashC, wince * fzEyeW.z * cw);
      gloss = max(gloss, vis * ow);
      emis += vec3(0.55) * cl * vis * ow;
      // brows
      float bx = e.x;
      float by = ec.y + er.y + 0.06 + fzBrow.x * 0.035 + 0.02 * (1.0 - bx * bx) - fzBrow.y * 0.03 * bx;
      float bw = 0.017 * (1.15 - 0.2 * (bx + 1.0));
      float brow = fzLine(abs(q.y - by), bw, aa) * (1.0 - smoothstep(0.85, 1.0, abs(bx - 0.05)));
      col = mix(col, SRGB(0.24, 0.13, 0.07), brow * 0.92);
      // mouth
      vec2 m = q - vec2(0.012, -0.44);
      vec3 mline = SRGB(0.5, 0.22, 0.19), minner = SRGB(0.45, 0.1, 0.13), medge = SRGB(0.4, 0.12, 0.12);
      // cheeky closed-lip smirk: thick lip line with the corner on Feza's left pushed up into a cheek bulge + dimple
      float sx = clamp(m.x, -0.074, 0.088), sk = max(0.0, sx - 0.02);
      float sy = 1.4 * sx * sx + 0.12 * sx + 6.5 * sk * sk - 0.004;
      float sd = abs(m.y - sy) / sqrt(1.0 + fzSq(2.8 * sx + 0.12 + 13.0 * sk));
      float sw = 0.0125 * (0.72 + 0.6 * smoothstep(-0.08, 0.07, m.x));
      float inX = smoothstep(-0.088, -0.068, m.x) * (1.0 - smoothstep(0.084, 0.1, m.x));
      float smirk = fzLine(sd, sw, aa) * inX;
      float lipLo = exp(-fzSq((m.x + 0.004) / 0.052) - fzSq((m.y - sy + 0.021) / 0.014));                // fuller lower lip
      float lipUp = exp(-fzSq((m.x - 0.004) / 0.05) - fzSq((m.y - sy - 0.011) / 0.008));
      float bulge = exp(-fzSq((m.x - 0.112) / 0.045) - fzSq((m.y - 0.05) / 0.042));                        // pushed-up cheek
      float dimple = fzLine(fzSeg(m, vec2(0.094, 0.036), vec2(0.108, 0.066)), 0.0065, aa) * smoothstep(0.03, 0.05, m.y);
      float tuck = exp(-fzSq((m.x + 0.079) / 0.009) - fzSq((m.y - sy + 0.002) / 0.009));                  // other corner
      col *= 1.0 + 0.09 * bulge * fzMouth.x;
      col = mix(col, SRGB(0.9, 0.5, 0.46), (0.62 * lipLo + 0.35 * lipUp) * inX * fzMouth.x);
      col = mix(col, col * SRGB(1.0, 1.08, 1.08), 0.35 * exp(-fzSq((m.x + 0.01) / 0.025) - fzSq((m.y - sy + 0.024) / 0.006)) * fzMouth.x);
      col = mix(col, col * SRGB(0.8, 0.6, 0.56), (0.75 * dimple + 0.5 * tuck) * fzMouth.x);
      col = mix(col, mline, smirk * fzMouth.x);
      // open grin and "o" grow open as they blend in (solid colour at every weight, no pale see-through mouth)
      float gk = mix(0.3, 1.0, fzMouth.y), ga = smoothstep(0.0, 0.3, fzMouth.y);
      float gx = m.x / (0.105 * mix(0.8, 1.0, fzMouth.y)), gt = 0.016 + 1.2 * m.x * m.x, gb = gt - 0.1 * gk * sqrt(max(0.0, 1.0 - gx * gx));
      float gin = min(min(gt - m.y, m.y - gb), (1.0 - abs(gx)) * 0.03);
      float gI = smoothstep(-aa, aa, gin), gE = smoothstep(-aa, aa, gin + 0.006) - gI;
      vec3 gc = mix(minner, SRGB(0.95, 0.46, 0.52), 1.0 - smoothstep(0.045 * gk - aa, 0.045 * gk + aa, length(m - vec2(0.0, gt - 0.09 * gk))));
      float gty = gt - 0.017 * mix(0.6, 1.0, fzMouth.y);                                        // teeth
      gc = mix(gc, vec3(0.98), smoothstep(gty - aa, gty + aa, m.y));
      col = mix(col, medge, gE * ga); col = mix(col, gc, gI * ga);
      float ok = mix(0.4, 1.0, fzMouth.z), oa = smoothstep(0.0, 0.3, fzMouth.z);
      vec2 om = (m - vec2(0.0, -0.014)) / (vec2(0.033, 0.04) * ok);                              // "o"
      float od = (length(om) - 1.0) * 0.033 * ok, oI = 1.0 - smoothstep(-aa, aa, od), oE = (1.0 - smoothstep(-aa, aa, od - 0.006)) - oI;
      col = mix(col, medge, oE * oa); col = mix(col, mix(minner, SRGB(0.9, 0.42, 0.48), smoothstep(-0.2, -0.9, om.y)), oI * oa);
      float kx = clamp(m.x, -0.034, 0.034), ky = 2.4 * kx * kx - 0.004;                          // small relaxed line
      float small = fzLine(abs(m.y - ky) / sqrt(1.0 + fzSq(4.8 * kx)), 0.0058, aa) * (1.0 - smoothstep(0.032, 0.042, abs(m.x)));
      col = mix(col, mline, small * fzMouth.w);
      gloss = max(gloss, (gI * ga + oI * oa) * 0.6);
    }`;

  const FACE_GLSL2 = V2ON ? FACE_GLSL
    .replace('er = vec2(0.138, 0.158)', 'er = vec2(0.158, 0.184)').replace('ec = vec2(0.252 * side, -0.11)', 'ec = vec2(0.25 * side, -0.1)')
    .replace('float ir = 0.12,', 'float ir = 0.142,')
    .replace('top = pow(cx, 0.75) * 0.84', 'top = pow(cx, 0.75) * 0.99')
    .replace('length(di / ir - vec2(-0.33, 0.36))', 'length(di / ir - vec2(-0.3, 0.34))').replace('smoothstep(0.27 - aI, 0.27 + aI,', 'smoothstep(0.31 - aI, 0.31 + aI,')
    .replace('float lw = (0.12 + 0.08 * fzBk)', 'float lw = (0.19 + 0.08 * fzBk)')
    .replace('float bw = 0.017 * (1.15 - 0.2 * (bx + 1.0));', 'float bw = 0.023 * (1.15 - 0.25 * (bx + 1.0));')
    .replace('fzBrow.x * 0.035 + 0.02 * (1.0 - bx * bx) - fzBrow.y * 0.03 * bx', 'fzBrow.x * 0.055 + 0.026 * (1.0 - bx * bx) - fzBrow.y * 0.05 * bx')
    .replace('* (0.4 + 0.4 * fzBrow.z);', '* (0.55 + 0.45 * fzBrow.z);')
    .replace('float sy = 1.4 * sx * sx + 0.12 * sx + 6.5 * sk * sk - 0.004;', 'float sy = 3.4 * sx * sx + 0.1 * sx + 6.5 * sk * sk - 0.004;')
    .replace('float sw = 0.0125 *', 'float sw = 0.0165 *')
    .replace('float gx = m.x / (0.105 * mix(0.8, 1.0, fzMouth.y)), gt = 0.016 + 1.2 * m.x * m.x, gb = gt - 0.1 * gk', 'float gx = m.x / (0.125 * mix(0.8, 1.0, fzMouth.y)), gt = 0.018 + 1.0 * m.x * m.x, gb = gt - 0.135 * gk')
    .replace('      // mouth\n', '      col = mix(col, col * SRGB(0.78, 0.5, 0.46), 0.5 * (exp(-fzSq((abs(q.x) - 0.024) / 0.011) - fzSq((q.y + 0.296) / 0.009))));   // burun delikleri\n      col += SRGB(1.0, 0.9, 0.85) * 0.07 * exp(-fzSq((q.x + 0.012) / 0.03) - fzSq((q.y + 0.24) / 0.03));   // burun ucu parlaması\n      // mouth\n')
  : FACE_GLSL;
  // Soft highlight knee just below the bloom threshold: skin, clothes and hair never glow, magic items still do.
  const KNEE = 'outgoingLight = mix(outgoingLight, 1.0 + (outgoingLight - 1.0) / (1.0 + (outgoingLight - 1.0) * 5.0), step(1.0, outgoingLight));';
const EDGE = V2ON ? 'outgoingLight *= 1.0 - 0.2 * smoothstep(0.68, 1.0, 1.0 - saturate(dot(normal, normalize(vViewPosition))));' : '';
  const knee = m => patchMat(m, { fOut: EDGE + KNEE, key: 'knee' + (V2ON ? 'b' : '') });
  function makeSkinMat() {
    const m = stencil(vcMat({ color: SKIN, roughness: 0.55, envMapIntensity: 0.75 }));
    const U = { fzEye: { value: new THREE.Vector4(0, 0, 0, 0) }, fzWink: { value: 0 }, fzEyeW: { value: v3(1, 0, 0) }, fzMouth: { value: new THREE.Vector4(1, 0, 0, 0) }, fzBrow: { value: v3() } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aFace; varying vec2 vFace;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFace = aFace;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FACE_GLSL2)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float fzGloss = 0.0; vec3 fzEmis = vec3(0.0);
          vec2 fzQ = vec2(vFace.x * cos(vFace.y), vFace.y); float fzAA = max(length(fwidth(fzQ)) * 0.7, 1e-4);
          if (vFace.x > -9.0 && abs(vFace.x) < 1.2) fzFace(diffuseColor.rgb, fzGloss, fzEmis, fzQ, fzAA);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.32, fzGloss);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += fzEmis;')
        .replace('#include <opaque_fragment>', `float fzF = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
          outgoingLight += diffuseColor.rgb * vec3(0.6, 0.2, 0.12) * fzF * fzF * 0.38 + vec3(1.0, 0.74, 0.56) * pow(fzF, 3.0) * 0.12 * (1.0 - fzGloss);
          ${EDGE}
          // fake subsurface: warm wrap light past the terminator (the lower face no longer goes dark / grey-tan under an
          // overhead light) + a little warm bounce under the chin
          vec3 fzWrap = vec3(0.0); float fzNL;
          #if NUM_POINT_LIGHTS > 0
          #pragma unroll_loop_start
          for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
            getPointLightInfo( pointLights[ i ], geometryPosition, directLight );
            fzNL = dot( geometryNormal, directLight.direction );
            fzWrap += directLight.color * ( 0.5 * fzNL + 0.5 - saturate( fzNL ) );
          }
          #pragma unroll_loop_end
          #endif
          #if NUM_DIR_LIGHTS > 0
          #pragma unroll_loop_start
          for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
            getDirectionalLightInfo( directionalLights[ i ], directLight );
            fzNL = dot( geometryNormal, directLight.direction );
            fzWrap += directLight.color * ( 0.5 * fzNL + 0.5 - saturate( fzNL ) );
          }
          #pragma unroll_loop_end
          #endif
          float fzLow = (vFace.x > -9.0 && abs(vFace.x) < 1.6) ? smoothstep(-0.12, -0.6, vFace.y) : 0.0;
          outgoingLight += (BRDF_Lambert(diffuseColor.rgb) * fzWrap * vec3(0.62, 0.36, 0.28) + reflectedLight.indirectDiffuse * vec3(0.25, 0.1, 0.04) * fzLow) * (1.0 - fzGloss);
          ${KNEE}
          #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'fezaSkin4' + (V2ON ? 'b' : '');
    m.userData.fz = U;
    return m;
  }
  // Hair vertex motion: spring offset + spin puff (aFlex), cowlicks collapse (aFlex < 0) and, under a hat, every vertex
  // outside the hat's inner ellipsoid (fzHatM: head space → unit sphere) and above its band is pulled inside it.
  const HAIR_V = `
    float fzFl = aFlex < 0.0 ? -aFlex - 0.01 : aFlex;
    transformed += (fzHOff + normalize(transformed - vec3(0.0, 0.24, 0.012)) * fzHExp) * fzFl;
    if (aFlex < 0.0 && fzHat.w < 0.5) transformed = vec3(0.0, 0.24, 0.012);
    if (fzHat.x > 0.5) {
      vec3 fzQ = (fzHatM * vec4(transformed, 1.0)).xyz;
      float fzL = length(fzQ), fzK = smoothstep(fzHat.y - fzHat.z, fzHat.y, fzQ.y);
      if (fzL > 0.93 && fzK > 0.0) transformed = (fzHatI * vec4(fzQ * mix(1.0, 0.93 / fzL, fzK), 1.0)).xyz;
    }`;
  const HAIR_VD = 'attribute float aFlex; uniform vec3 fzHOff; uniform float fzHExp; uniform vec4 fzHat; uniform mat4 fzHatM, fzHatI;';
  function makeHairMat() {
    const m = stencil(vcMat({ roughness: 0.5, normalMap: strandTex(), normalScale: V2(0.32, 0.32), envMapIntensity: 0.55 }));
    const U = { fzHOff: { value: v3() }, fzHExp: { value: 0 }, fzHat: { value: new THREE.Vector4(0, 0, 0.3, 1) }, fzHatM: { value: new THREE.Matrix4() }, fzHatI: { value: new THREE.Matrix4() } };
    const vpatch = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + HAIR_VD).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + HAIR_V);
    };
    m.onBeforeCompile = sh => {
      vpatch(sh);
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `float fzF = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
          outgoingLight += vec3(1.0, 0.8, 0.6) * pow(fzF, 3.0) * 0.12;
          ${V2ON ? 'outgoingLight += vec3(1.0, 0.82, 0.62) * (pow(fzF, 2.4) * 0.3 + 0.2 * smoothstep(0.5, 0.92, normal.y) * smoothstep(0.35, 0.0, abs(fract(vColor.r * 6.0 + normal.x * 2.0) - 0.5) - 0.12)); outgoingLight *= 1.0 - 0.16 * smoothstep(0.78, 1.0, 1.0 - fzF);' : ''}
          ${KNEE}
          #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'fezaHair2' + (V2ON ? 'b' : '');
    // shadow caster with the same vertex motion (hidden cowlicks cast no shadow)
    const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    d.onBeforeCompile = vpatch; d.customProgramCacheKey = () => 'fezaHairD';
    m.userData.fz = U; m.userData.depth = d;
    return m;
  }
  // Dev Ev: Feza'nın gerçek tişörtü — krem zemin üstünde ince lacivert ve açık mavi yatay çizgiler (örgü dokulu).
  // Bir doku tekrarı = TILE (0,4 m); 14 çizgi çifti → ~2,9 cm aralık. v yukarı (lathe yay uzunluğu), u çevre boyunca.
  let STRIPE = null;
  function stripeTex() {
    if (STRIPE) return STRIPE;
    const W = 128, H = 448, cv = canvasEl(W, H), g = cv.getContext('2d'), R = mulberry32(4242), N = 14, per = H / N;
    g.fillStyle = '#f3ecdf'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < N; i++) {
      const y = i * per;
      g.fillStyle = '#26365f'; g.fillRect(0, y + per * 0.12, W, per * 0.2);      // lacivert
      g.fillStyle = '#7fb0e0'; g.fillRect(0, y + per * 0.58, W, per * 0.16);     // açık mavi
    }
    // örgü: küçük ilmek gölgeleri ve hafif ton dalgası (düz renk görünmesin)
    const img = g.getImageData(0, 0, W, H), D = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4, k = 0.94 + 0.05 * Math.sin(x * 1.57) * Math.sin(y * 1.2) + 0.03 * (R() - 0.5) + 0.02 * Math.sin(y * 0.07 + x * 0.02);
      D[o] = Math.min(255, D[o] * k); D[o + 1] = Math.min(255, D[o + 1] * k); D[o + 2] = Math.min(255, D[o + 2] * k);
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO;
    return (STRIPE = keep(t));
  }
  let SHARED = null;
  function sharedMats() {
    if (SHARED) return SHARED;
    const t = tex('shirt'), f = tex('fabric') ? TEX.rep('fabric', 4, 4) : null;
    SHARED = {
      cloth: keep(stencil(rimify(knee(vcMat({ roughness: 0.86, envMapIntensity: 0.55, map: stripeTex(), normalMap: t ? t.normalMap : null, normalScale: V2(0.7, 0.7) })), 0xfff2e6, 0.07))),
      // koyu gri pamuklu eşofman altı (yumuşak, mat; kumaş dokusu)
      pants: keep(stencil(rimify(knee(vcMat({ roughness: 0.95, envMapIntensity: 0.45, normalMap: f ? f.normalMap : null, normalScale: V2(0.35, 0.35) })), 0xc8d0e0, 0.12))),
      shoe: keep(stencil(rimify(knee(vcMat({ roughness: 0.5, envMapIntensity: 0.7 })), 0xffffff, 0.08))),
    };
    return SHARED;
  }


  // Original model assembly, with optional wrist/ankle joints for pressure gloves and boot contact.
  function createOriginal(options={}){
    const data=buildBody(),shared=sharedMats(),root=new THREE.Group();root.name='Feza — actual original model';root.scale.setScalar(V2ON?1.15:1);
    const bones=BONES.map(b=>{const o=new THREE.Bone();o.name=b[0];o.position.set(b[2],b[3],b[4]);o.rotation.order='YXZ';return o;});
    BONES.forEach((b,i)=>{if(b[1]>=0)bones[b[1]].add(bones[i]);});root.add(bones[0]);
    const B={};bones.forEach(b=>B[b.name]=b);
    let skinGeo=data.skin,shoeGeo=data.shoe;
    if(options.articulated){
      for(const side of ['L','R']){const foot=new THREE.Bone();foot.name='foot'+side;foot.position.set(0,-.195,.004);B['shin'+side].add(foot);B[foot.name]=foot;bones.push(foot);const hand=new THREE.Bone();hand.name='hand'+side;hand.position.set(0,-.157,.004);B['fore'+side].add(hand);B[hand.name]=hand;bones.push(hand);}
      for(const side of ['L','R']){const s=side==='L'?1:-1,index=new THREE.Bone();index.name='index'+side;index.position.set(-s*.0207,-.048,.03);B['hand'+side].add(index);B[index.name]=index;bones.push(index);}
      shoeGeo=data.shoe.clone();const p=shoeGeo.attributes.position,si=shoeGeo.attributes.skinIndex,sw=shoeGeo.attributes.skinWeight;
      for(let i=0;i<p.count;i++){const s=p.getX(i)>0?'L':'R',foot=bones.indexOf(B['foot'+s]),shin=bones.indexOf(B['shin'+s]),w=1-sstep(.115,.165,p.getY(i));si.setXYZW(i,shin,foot,0,0);sw.setXYZW(i,1-w,w,0,0);}
      skinGeo=data.skin.clone();const sp=skinGeo.attributes.position,ss=skinGeo.attributes.skinIndex,sww=skinGeo.attributes.skinWeight;
      for(let i=0;i<sp.count;i++)if(sp.getY(i)<.495){const s=sp.getX(i)>0?'L':'R',hand=bones.indexOf(B['hand'+s]),fore=bones.indexOf(B['fore'+s]),w=1-sstep(.442,.482,sp.getY(i));ss.setXYZW(i,fore,hand,0,0);sww.setXYZW(i,1-w,w,0,0);}
    }
    root.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones),skinMat=makeSkinMat(),hairMat=makeHairMat();
    const sk=(geo,mat)=>{const o=new THREE.SkinnedMesh(geo,mat);root.add(o);o.bind(skeleton);o.frustumCulled=false;o.castShadow=true;return o;};
    const meshes={skin:sk(skinGeo,skinMat),cloth:sk(data.cloth,shared.cloth),pants:sk(data.pants,shared.pants),shoe:sk(shoeGeo,shared.shoe)};
    if(V2ON)B.head.scale.setScalar(1.1);
    const hair=new THREE.Mesh(data.hair,hairMat);hair.name='Original layered Feza hair';hair.castShadow=true;hair.frustumCulled=false;hair.customDepthMaterial=hairMat.userData.depth;B.head.add(hair);meshes.hair=hair;
    B.head.rotation.set(-.3,0,.07);B.armL.rotation.set(.06,0,.17);B.foreL.rotation.x=-.3;B.armR.rotation.set(-.15,.25,-.2);B.foreR.rotation.x=-.95;B.thighL.rotation.z=.035;B.thighR.rotation.z=-.035;B.shinL.rotation.x=B.shinR.rotation.x=.03;
    return{root,bones:B,boneList:bones,skeleton,meshes,face:skinMat.userData.fz,hairUniforms:hairMat.userData.fz,sourceSHA256:'ddfd161d0b400533742aeb910f7dc4539f3af3cab0004a65a9c2c36dcc142ad7',data};
  }
  M.FezaOriginal={create:createOriginal,BONES,HB,HC,SKIN,helpers:{G,Kit,kitGeo,mergeSkinned,concat,lathe,paramGeo,sweep,curvePts,tmat,patchMat,rimify,vcMat,stdMat,glowMat,keep}};
})(window.MARS);
