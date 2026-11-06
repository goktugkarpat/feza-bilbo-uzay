// Model-only adaptation of the user-owned original; source shapes and rig retained.
/* Bilbo — sculpted Labrador, articulated skeleton, shared portrait and distance-driven gait. */
window.MARS.BilboOriginal = (() => {
  'use strict';
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const smooth = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  // Velvety chocolate coat: a warm fresnel sheen (cheap rim term, no extra lights) keeps the vertex colours.
  function sheen(mat, rgb, k, p, key) {
    mat.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>',
        `{ float bRim = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
           outgoingLight += diffuseColor.rgb * vec3(${rgb}) * (pow(max(bRim, 0.0), ${p}) * ${k}); }
         #include <opaque_fragment>`);
    };
    mat.customProgramCacheKey = () => key;
    return mat;
  }
  const furMat = sheen(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.74 }), '1.30, 1.12, 0.98', '0.75', '2.8', 'bilboFur');
  const wetMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.36 });
  const eyeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.16 });
  const shineMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const sphere = new THREE.SphereGeometry(1, 16, 10);
  const detail = new THREE.SphereGeometry(1, 10, 7);
  const COAT = 0x67432f, EAR = 0x573929, MUZZLE = 0x704c36;

  // Continuous sculpted surfaces. Sections: z, horizontal radius, vertical radius, centre y.
  function loft(sections, rows = 26, sides = 18) {
    const pos = [], uv = [], idx = [];
    const sample = (t, k) => {
      const u = t * (sections.length - 1), i = Math.min(sections.length - 2, Math.floor(u)), f = u - i;
      const a = sections[Math.max(0, i - 1)][k], b = sections[i][k], c = sections[i + 1][k], d = sections[Math.min(sections.length - 1, i + 2)][k];
      return 0.5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    };
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, z = sample(t, 0), rx = Math.max(0.001, sample(t, 1)), ry = Math.max(0.001, sample(t, 2)), cy = sample(t, 3);
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * Math.PI * 2;
        pos.push(Math.cos(a) * rx, cy + Math.sin(a) * ry, z); uv.push(j / sides, t);
        if (i < rows && j < sides) { const n = i * (sides + 1) + j; idx.push(n, n + 1, n + sides + 1, n + 1, n + sides + 2, n + sides + 1); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  const trunkGeo = loft([[-0.91, .001, .001, .72], [-.77, .23, .26, .73], [-.52, .32, .33, .75],
    [-.16, .32, .31, .77], [.18, .35, .37, .78], [.42, .33, .38, .83], [.59, .19, .27, .88], [.66, .001, .001, .89]]);
  const headGeo = loft([[-.29, .001, .001, .02], [-.23, .23, .24, .045], [-.08, .315, .29, .07],
    [.10, .31, .27, .07], [.25, .24, .20, .015], [.40, .235, .155, -.055], [.54, .215, .14, -.068], [.63, .13, .08, -.06], [.65, .001, .001, -.05]], 30, 24);
  { const p = headGeo.attributes.position; for (let i=0;i<p.count;i++) if(p.getY(i)>.20) p.setY(i,.20+(p.getY(i)-.20)*.55); headGeo.computeVertexNormals(); }
  function earGeo(side) {
    // A closed, rounded fold attached inside the skull; broad near the cheek, tucked-in at the tip.
    const g = loft([[0, .001, .001, 0], [.035, .064, .034, .012], [.12, .123, .046, .035],
      [.24, .125, .039, .075], [.35, .089, .030, .105], [.43, .039, .018, .11], [.46, .001, .001, .10]], 20, 14);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = p.getZ(i), u = clamp01(t / .46);
      p.setXYZ(i, p.getX(i) + side * (.045 * Math.sin(u * Math.PI) - .014 * u), -t, p.getY(i));
    }
    g.computeVertexNormals(); return g;
  }
  const earL = earGeo(-1), earR = earGeo(1);
  const foreGeo = loft([[-.07,.065,.08,0],[.04,.127,.15,0],[.17,.118,.125,0],[.30,.099,.103,0],[.44,.085,.087,.015],[.60,.078,.08,.035],[.67,.068,.064,.04]],18,14);
  const hindGeo = loft([[-.09,.065,.09,0],[.02,.18,.21,0],[.15,.17,.185,0],[.29,.12,.13,-.035],[.43,.089,.095,-.02],[.59,.075,.08,.03],[.67,.068,.064,.04]],18,14);
  const tailGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, .03, -.22), new THREE.Vector3(0, .14, -.47), new THREE.Vector3(0, .20, -.73)
  ]), 24, .098, 12, false);
  { const p = tailGeo.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = Math.floor(i / 13) / 24, k = 1 - .86 * t;
      const c = tailGeo.parameters.path.getPointAt(t);
      p.setXYZ(i, p.getX(i) * k, c.y + (p.getY(i) - c.y) * k, c.z + (p.getZ(i) - c.z) * k); }
    tailGeo.computeVertexNormals(); }

  function create() {
    const root = new THREE.Group(); root.name = 'Bilbo';
    const bones = [], parts = [], owned = [];
    function joint(parent, name, x = 0, y = 0, z = 0) {
      const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b); bones.push(b); return b;
    }
    function part(bone, geo, color, pos = [0, 0, 0], scale = [1, 1, 1], mat = furMat, rot = [0, 0, 0]) {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
      const p = { bone, geo, color: new THREE.Color(color), m, mat }; parts.push(p); return p;
    }
    const ell = (b, col, p, s, mat = furMat, rot) => part(b, sphere, col, p, s, mat, rot);
    const small = (b, col, p, s, mat = wetMat) => part(b, detail, col, p, s, mat);
    function curve(b, pts, radius, color, mat = wetMat) {
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 8, radius, 5, false);
      owned.push(g); part(b, g, color, undefined, undefined, mat);
    }
    const body = joint(root, 'body'); part(body, trunkGeo, COAT);
    const neck = joint(body, 'neck', 0, .91, .38);
    ell(neck, COAT, [0, .06, .08], [.29, .32, .30], furMat, [-.25, 0, 0]);
    const head = joint(neck, 'head', 0, .18, .13);
    part(head, headGeo, COAT).muzzle = true;
    small(head, 0x563831, [0, -.022, .635], [.137, .073, .070]);
    curve(head, [[0,-.09,.645],[0,-.15,.622],[0,-.174,.598]], .006, 0x402b23);
    for (const side of [-1, 1]) {
      small(head, 0x241b19, [side * .066, -.017, .702], [.032, .023, .015]);
      curve(head, [[0,-.174,.598],[side*.11,-.193,.552],[side*.19,-.150,.43]], .006, 0x402b23);
      ell(head, 0x3b2a21, [side * .202, .131, .262], [.074, .060, .040]);
      const eye = joint(head, 'eye' + side, side * .202, .135, .294);
      small(eye, 0xc08f45, [0, 0, 0], [.061, .053, .020], eyeMat);
      small(eye, 0x171311, [0, .001, .016], [.040, .043, .011], eyeMat);
      small(eye, 0xffffff, [-.015, .020, .027], [.015, .014, .006], shineMat);
      small(eye, 0xfff1d6, [.017, -.017, .026], [.0065, .0065, .004], shineMat);
      ell(head, COAT, [side * .19, .168, .170], [.094, .040, .085]);
      // Soft, rounded cheeks give the long Labrador muzzle a friendlier, puppy-like smile.
      ell(head, MUZZLE, [side * .088, -.072, .500], [.105, .082, .118]);
    }
    const eyes = bones.filter(b => b.name.startsWith('eye')); eyes.forEach(b => b.scale.set(1.16, 1, 1.16));
    const ears = [-1, 1].map(side => {
      const b = joint(head, 'ear' + side, side * .268, .235, .015); part(b, side < 0 ? earL : earR, EAR).ear = true; return { b, side, z: 0 };
    });
    const jaw = joint(head, 'jaw', 0, -.12, .26);
    ell(jaw, 0x7a3a40, [0, -.062, .205], [.150, .028, .158], wetMat);   // inside the mouth, tucked inside the lower lip
    ell(jaw, MUZZLE, [0, -.093, .19], [.195, .055, .177]);
    const tongue = joint(jaw, 'tongue', 0, -.060, .25);
    small(tongue, 0xe07c86, [0, 0, .095], [.068, .020, .13]);
    small(tongue, 0xbd5a66, [0, .012, .11], [.008, .010, .10]);
    const mouthAnchor = new THREE.Object3D(); mouthAnchor.name = 'Bilbo mouth';
    mouthAnchor.position.set(0, -.025, .37); jaw.add(mouthAnchor);
    const legs = [];
    for (const front of [true, false]) for (const side of [-1, 1]) {
      const b = joint(body, (front ? 'fore' : 'hind') + side, side * .25, .75, front ? .33 : -.56);
      const shin = joint(b, 'shin', 0, -.30, front ? 0 : -.035);
      const limb = part(b, front ? foreGeo : hindGeo, COAT, [0,0,0], [1,1,1], furMat, [Math.PI/2,0,0]);
      limb.skin = z => { let w = clamp01((z-.20)/.20); w = w*w*(3-2*w); return { bone: shin, w }; };
      const foot = joint(shin, 'paw', 0, -.34, .035);
      ell(foot, COAT, [0, -.02, .075], [.135, .090, .204]);
      for (const x of [-.045, .045]) curve(foot, [[x, .025, .228], [x, .047, .17], [x, .055, .11]], .0035, 0x493023, furMat);
      legs.push({ b, shin, foot, front, side });
    }
    const tail = joint(body, 'tail', 0, .83, -.79); part(tail, tailGeo, COAT);
    // Riding seat: top of the back (world position = where Feza sits).
    const saddle = new THREE.Object3D(); saddle.name = 'Bilbo saddle'; saddle.position.set(0, 1.07, -.10); body.add(saddle);
    root.updateMatrixWorld(true);
    const skel = new THREE.Skeleton(bones), meshes = [];
    // All fur shares one skinned surface; the whole dog uses only four material draws.
    for (const mat of new Set(parts.map(p => p.mat))) {
      const list = parts.filter(p => p.mat === mat), positions = [], normals = [], colors = [], uvs = [], skinI = [], skinW = [], indices = [];
      const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
      const muzzleColor = new THREE.Color(MUZZLE), painted = new THREE.Color(), creamC = new THREE.Color(0xb98a62), sockC = new THREE.Color(0xc9a27a);
      let base = 0;
      for (const p of list) {
        const m = p.bone.matrixWorld.clone().multiply(p.m), a = p.geo.attributes, bi = bones.indexOf(p.bone);
        nm.getNormalMatrix(m);
        for (let i = 0; i < a.position.count; i++) {
          v.fromBufferAttribute(a.position, i).applyMatrix4(m); positions.push(v.x, v.y, v.z);
          n.fromBufferAttribute(a.normal, i).applyMatrix3(nm).normalize(); normals.push(n.x, n.y, n.z);
          const shade = mat === furMat ? .91 + .09 * clamp01(n.y * .5 + .5) : 1;
          painted.copy(p.color);
          if (p.muzzle) painted.lerp(muzzleColor, clamp01((a.position.getZ(i)-.20)/.32) * clamp01((.20-a.position.getY(i))/.20));
          if (mat === furMat && !p.ear) {   // G5: boyama — karın/göğüs açık, patiler çorap gibi açık, sırt biraz koyu
            const bellyK = clamp01((.15 - n.y) / .7) * .55, chestK = (!p.muzzle && v.z > .22 && v.z < .95 && v.y > .5 && n.z > .25 && v.y < 1.05 ? clamp01((n.z - .25) / .5) * .5 : 0);
            const sockK = clamp01((.20 - v.y) / .12) * .65;
            painted.lerp(creamC, Math.max(bellyK, chestK)); painted.lerp(sockC, sockK);
            if (v.y > .78) painted.multiplyScalar(.96 + .04 * clamp01(n.y));
          }
          colors.push(painted.r * shade, painted.g * shade, painted.b * shade);
          uvs.push(a.uv ? a.uv.getX(i) : 0, a.uv ? a.uv.getY(i) : 0);
          const skin = p.skin ? p.skin(a.position.getZ(i)) : null;
          skinI.push(bi, skin ? bones.indexOf(skin.bone) : 0, 0, 0); skinW.push(skin ? 1-skin.w : 1, skin ? skin.w : 0, 0, 0);
        }
        const index = p.geo.index;
        for (let i = 0; i < (index ? index.count : a.position.count); i++) indices.push(base + (index ? index.getX(i) : i));
        base += a.position.count;
      }
      const g = new THREE.BufferGeometry();
      for (const [key, data, size] of [['position', positions, 3], ['normal', normals, 3], ['color', colors, 3], ['uv', uvs, 2], ['skinWeight', skinW, 4]]) g.setAttribute(key, new THREE.Float32BufferAttribute(data, size));
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinI, 4)); g.setIndex(indices); g.computeBoundingSphere();
      const mesh = new THREE.SkinnedMesh(g, mat); mesh.name = 'Bilbo surface'; mesh.castShadow = mat !== shineMat; mesh.receiveShadow = false;
      mesh.frustumCulled = false; root.add(mesh); mesh.bind(skel); meshes.push(mesh);
    }
    owned.forEach(g => g.dispose());
    // Model-only extraction: the lofts, face, colors, skeleton, skin weights and
    // authored base gait below are retained from the user's original Bilbo.
    let t=0,stride=0,run=0,rest=0,sit=0,blinkAt=2.8,blink=0;
    let this_hy=0,earLag=0,curK=0,wavK=0,begK=0,happy=0,sniff=0,dig=0,ride=0,wagPh=0,lastGlee=0,sneezeT=-1,sneezeCb=null;
    const SNEEZE={wind:1.05,total:1.85};
    function mouthWorld(){return mouthAnchor.getWorldPosition(new THREE.Vector3());}
    function update(dt, state = {}) {
      dt = Math.min(Math.max(dt || 0, 0), .1); t += dt;
      eyes.forEach(b=>{b.scale.x=1.16;b.scale.z=1.16;});
      const speed = Math.max(0, state.speed || 0), moving = speed > .10;
      run = smooth(run, clamp01(speed / 5.2), 10, dt);
      if(Number.isFinite(state.stridePhase))stride=state.stridePhase;else stride += speed * dt * 3.8;
      rest = moving || state.bark > 0 || state.pounce > 0 || state.sniff || state.dig || state.ride || sneezeT >= 0 ? 0 : rest + dt;
      sit = smooth(sit, state.sit || state.selam || state.yalvar || rest > 7 ? 1 : 0, 4, dt);
      happy = smooth(happy, clamp01(state.happy || 0), 2.5, dt); sniff = smooth(sniff, state.sniff ? 1 : 0, 6, dt);
      dig = smooth(dig, state.dig ? 1 : 0, 8, dt); ride = smooth(ride, state.ride ? 1 : 0, 6, dt);
      const age = 1.30 - (state.bark || 0);
      const bark = state.bark > 0 ? Math.exp(-Math.pow((age - .13) / .11, 2)) + Math.exp(-Math.pow((age - .85) / .12, 2)) : 0;
      body.position.y = run * .018 * Math.cos(stride * 2) + .004 * Math.sin(t * 2.2) - sit * .13;
      body.rotation.set(-.09 * sit + .02 * run * Math.cos(stride), 0, .014 * run * Math.sin(stride));
      for (const { b, shin, foot, front, side } of legs) {
        const phase = stride + (front ? 0 : Math.PI) + (side > 0 ? Math.PI : 0), s = Math.sin(phase);
        b.position.y = .75 + (front ? .08 * sit : 0);
        b.rotation.x = .48 * run * s + (front ? -.10 : 1.03) * sit;
        shin.rotation.x = .60 * run * Math.max(0, -Math.cos(phase)) - (front ? 0 : 1.35) * sit;
        foot.rotation.x = -b.rotation.x * .30 - shin.rotation.x * .55;
      }
      neck.rotation.x = -.035 * run + .025 * bark;
      head.rotation.x = -.02 + .028 * (1 - run) * Math.sin(t * 1.4) - .11 * bark;
      head.rotation.y = state.portrait ? -.035 : .045 * (1 - run) * Math.sin(t * .63);
      head.rotation.z = state.portrait ? -.10 : .02 * (1 - run) * Math.sin(t * .7);
      // The smoothed ear angle lives in e.z, so layered offsets (ride flap, sneeze, catch) never accumulate.
      const hyv = head.rotation.y - (this_hy || 0); this_hy = head.rotation.y; earLag = smooth(earLag, Math.max(-.5, Math.min(.5, -hyv * 9)), 9, dt);
      for (const e of ears) { e.z = smooth(e.z, e.side * (.04 + .10 * run * Math.sin(stride - .6) + .10 * bark) + (e.side > 0 ? 1 : -1) * Math.abs(earLag) * .35 + earLag * .12, 12, dt); e.b.rotation.z = e.z; e.b.rotation.x = .05 * Math.sin(t * 1.3 + e.side) * (1 - run); }
      // Happy wag: a phase accumulator lets the tempo rise smoothly (no jump) when Feza is close or something smells good.
      const glee = Math.max(happy, sniff, dig, ride);
      wagPh += dt * (5.4 + 9.5 * (glee+lastGlee)*.5);lastGlee=glee;
      tail.rotation.y = (.18 + .25 * run + .42 * glee) * Math.sin(wagPh);
      tail.rotation.x = -.10 + .07 * Math.sin(t * 2.7) - sit * .18;
      jaw.rotation.x = (state.portrait ? .105 : .012) + .55 * bark;
      tongue.scale.setScalar(state.portrait ? .72 : bark > .1 ? .8 : .1);
      blinkAt -= dt;
      if (blinkAt <= 0) { blink = .18; blinkAt = 2.7 + Math.random() * 2.4; }
      blink = Math.max(0, blink - dt);
      const lid = state.portrait ? 1 : 1 - .92 * Math.sin(Math.PI * clamp01(blink / .18));
      eyes.forEach(b => { b.scale.y = lid * 1.16; });
      // Anticipation, tucked paws, floppy ears and a soft landing make the playful leap readable.
      const leap = clamp01(state.pounce || 0), nibble = 0;
      body.rotation.x -= .16 * leap;
      for (const { b, shin, foot, front } of legs) {
        b.rotation.x += (front ? -.9 : .55) * leap;
        shin.rotation.x += (front ? .8 : -.6) * leap; foot.rotation.x -= .22 * leap;
      }
      ears.forEach(({ b, side }) => { b.rotation.x += -.22 * leap + .035 * run * Math.sin(stride + side); });
      head.rotation.x += .09 * nibble - .10 * leap;
      head.rotation.z += .055 * (1 - run) * Math.sin(t * .91) + .02 * nibble;
      jaw.rotation.x += nibble + (run > .45 ? .065 + .025 * Math.sin(t * 8) : 0);
      tongue.scale.setScalar(Math.max(state.portrait ? .72 : .1, run * .55, nibble > 0 ? .6 : 0, bark > .1 ? .8 : 0));
      funPose(dt, state, bark);
      // The host renderer updates this shared skeleton after the final layered pose.
    }
    // ── Happy / sniff / dig / ride / sneeze poses (layered on the gait above) ──
    function funPose(dt, state, bark) {
      // G5 duygular: merak (başı yana eğer, kulaklar dikilir, gözler iri), selam (oturup ön patisini sallar), yalvar (sevimli yalvarış: baş eğik, iki patisi havada, kuyruk hızlı)
      curK = smooth(curK, state.merak ? 1 : 0, 5, dt); wavK = smooth(wavK, state.selam ? 1 : 0, 6, dt); begK = smooth(begK, state.yalvar ? 1 : 0, 6, dt);
      if (curK > .01) { head.rotation.z += .3 * curK; head.rotation.x -= .07 * curK; for (const e of ears) e.b.rotation.x -= .25 * curK; eyes.forEach(b => { b.scale.x *= 1 + .1 * curK; }); }
      if (wavK > .01) { body.rotation.x -= .42 * wavK; head.rotation.x += .2 * wavK; } if (wavK > .01) for (const L of legs) if (L.front && L.side > 0) { L.b.rotation.x = THREE.MathUtils.lerp(L.b.rotation.x, -1.7 + .4 * Math.sin(t * 9), wavK); L.shin.rotation.x = THREE.MathUtils.lerp(L.shin.rotation.x, .9, wavK); }
      if (begK > .01) { body.rotation.x -= .5 * begK; head.rotation.x += .1 * begK; head.rotation.z += .2 * begK; head.rotation.x += .12 * begK; for (const L of legs) if (L.front) { L.b.rotation.x = THREE.MathUtils.lerp(L.b.rotation.x, -1.5 + .15 * Math.sin(t * 6 + L.side), begK); L.shin.rotation.x = THREE.MathUtils.lerp(L.shin.rotation.x, .85, begK); } wagPh += dt * 6 * begK; eyes.forEach(b => { b.scale.x *= 1 + .18 * begK; b.scale.z *= 1 + .18 * begK; }); }
      const wig = Math.sin(wagPh);
      // Whole-rear wiggle with the wag; the neck counter-turns so the friendly face stays steady.
      const rear = .075 * Math.max(happy, sniff) * (1 - run) * (1 - sit) * wig;
      body.rotation.y += rear; neck.rotation.y = -rear;
      body.rotation.z += .02 * happy * (1 - run) * Math.sin(wagPh + .8);
      // Open, smiling mouth with the tongue out when he is happy, running or riding.
      const grin = Math.max(happy * (1 - sniff) * (1 - dig), ride);
      jaw.rotation.x += .15 * grin + .035 * grin * Math.sin(t * 9.5);
      tongue.rotation.x = .18 + .32 * grin + .05 * Math.sin(t * 9.5) * grin;
      tongue.scale.setScalar(Math.max(tongue.scale.x, .92 * grin));
      if (ride > .01) for (const { b, side } of ears) b.rotation.z += side * ride * (.10 + .12 * Math.sin(t * 15 + side));
      if (sniff > .01) {
        const burstOn = Math.sin(t * 3.1) > -.2 ? 1 : 0;
        neck.rotation.x += .66 * sniff; head.rotation.x += .26 * sniff + .05 * sniff * burstOn * Math.sin(t * 34);
        head.rotation.y += .22 * sniff * Math.sin(t * 1.7);
        body.rotation.x += .05 * sniff;
        for (const { b } of ears) b.rotation.x -= .2 * sniff;
        for (const e of eyes) e.scale.y *= 1 - .25 * sniff;
      }
      if (dig > .01) {
        body.rotation.x += .27 * dig; body.position.y -= .04 * dig;
        neck.rotation.x += .40 * dig; head.rotation.x += .16 * dig;
        for (const L of legs) {
          if (L.front) {
            const s = Math.sin(t * 17 + (L.side > 0 ? Math.PI : 0));
            L.b.rotation.x += (-.42 - .55 * s - L.b.rotation.x * .6) * dig;
            L.shin.rotation.x += (.75 * Math.max(0, s) + .15) * dig;
            L.foot.rotation.x += (-.35 * Math.max(0, -s)) * dig;
          } else L.b.rotation.x -= .25 * dig;
        }
        for (const e of eyes) e.scale.y *= 1 - .15 * dig;
      }
      if (sneezeT >= 0) sneezePose(dt);
    }
    function ease(u) { u = clamp01(u); return u * u * (3 - 2 * u); }
    function sneezePose(dt) {
      const before = sneezeT; sneezeT += dt;
      if (before < SNEEZE.wind && sneezeT >= SNEEZE.wind) {
        const cb = sneezeCb; sneezeCb = null;
        if (cb) { try { root.updateMatrixWorld(true); cb(mouthWorld()); } catch (err) { console.warn('Bilbo sneeze', err); } }
      }
      if (sneezeT < SNEEZE.wind) {
        // "ha… ha…": head tips back in two little bobs, eyes squeeze, nose wrinkles up.
        const u = sneezeT / SNEEZE.wind, k = ease(u / .85);
        const bob = Math.max(0, Math.sin(u * Math.PI * 2.2)) * (1 - u * .5);
        head.rotation.x -= .30 * k + .10 * bob; neck.rotation.x -= .16 * k;
        jaw.rotation.x += .10 * k;
        for (const e of eyes) e.scale.y *= 1 - .72 * k;
        for (const { b } of ears) b.rotation.x -= .12 * k;
        body.position.y += .015 * bob;
      } else {
        const a = sneezeT - SNEEZE.wind, snap = Math.exp(-9 * a), wob = Math.sin(a * 26) * Math.exp(-6 * a);
        head.rotation.x += .55 * snap - .08 * wob; neck.rotation.x += .32 * snap;
        body.rotation.x += .10 * snap; body.position.y += .07 * snap * Math.max(0, Math.cos(a * 12));
        jaw.rotation.x += .38 * snap;
        for (const e of eyes) e.scale.y *= a < .25 ? .08 : 1 - .6 * snap;
        for (const { b, side } of ears) { b.rotation.z += side * .9 * snap; b.rotation.x -= .5 * snap; }
        if (sneezeT >= SNEEZE.total) sneezeT = -1;
      }
    }
    function sneeze(onAchoo) {
      if (sneezeT >= 0) return false;
      sneezeT = 0; sneezeCb = typeof onAchoo === 'function' ? onAchoo : null; return true;
    }

    update(0);
    function dispose(){meshes.forEach(m=>m.geometry.dispose());skel.dispose();}
    return {root,update,dispose,bones,meshes,skeleton:skel,mouthAnchor,saddle,head,neck,body,legs,eyes,ears,tail,jaw,tongue,sneeze,shapes:{trunk:trunkGeo}};
  }
  return {create,source:'feza-piril-3d-arpg/src/04_bilbo.js',sourceSha256:'81b6e06dd9595918762b84959716c05bee4d47a6db1a7173290e9e74e95c3d86'};
})();
