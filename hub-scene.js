/* Living station backdrop: slowly turning Earth, twinkling stars and Feza with
 * Bilbo waving from the big round window. The painted station is a cut-out
 * layer above one WebGL canvas. Until everything is ready (or without WebGL)
 * the original painting stays visible, so the dock never waits for this. */
(function (M) {
  'use strict';
  const IMG_W = 1672, IMG_H = 941;
  // The painted Earth limb and the window hole, in painting pixels.
  const EARTH = {x: 2429.2, y: 3053.2, r: 2986};
  const PORT = {x: 886, y: 401, r: 54};
  const SCRIPTS = ['vendor/three.js', 'assets/orbit/earth-art.js', 'model-data/feza-original.js', 'feza-astronaut.js', 'model-data/bilbo-original.js', 'bilbo-astronaut.js'];
  const loaded = new Map();
  function loadScript(src) {
    if (loaded.has(src)) return loaded.get(src);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = resolve; s.onerror = () => reject(new Error(src));
      document.head.appendChild(s);
    });
    loaded.set(src, p);
    return p;
  }
  function needed(src) {
    if (src === 'vendor/three.js') return !window.THREE;
    if (src.endsWith('earth-art.js')) return !M.HubEarthArt;
    if (src.endsWith('feza-original.js')) return !M.FezaOriginal;
    if (src === 'feza-astronaut.js') return !M.createFezaAstronaut;
    if (src.endsWith('bilbo-original.js')) return !M.BilboOriginal;
    if (src === 'bilbo-astronaut.js') return !M.createBilboAstronaut;
    return true;
  }
  function image(src) {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(i));
      i.onerror = reject; i.src = src;
    });
  }

  const backdropVertex = 'void main(){gl_Position=vec4(position.xy,0.,1.);}';
  const backdropFragment = `
precision highp float;
uniform vec2 uRes; uniform float uDpr; uniform vec2 uOff; uniform float uScale; uniform vec3 uEarth;
uniform float uTime; uniform float uSpin; uniform float uCloudSpin;
uniform vec3 uA; uniform vec3 uE1; uniform vec3 uE2; uniform vec3 uSun;
uniform sampler2D uSurface; uniform sampler2D uClouds; uniform vec4 uShoot; uniform vec2 uShootA;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec3 starLayer(vec2 css,float cell,float density,float seed,float twinkle){
  vec2 g=css/cell, id=floor(g), f=fract(g);
  float e=h21(id+seed);
  if(e>density)return vec3(0.);
  vec2 pos=.18+.64*vec2(h21(id+seed+3.1),h21(id+seed+7.7));
  vec2 dv=(f-pos)*cell;
  float b=h21(id+seed+11.3); b=b*b*b;
  float size=.55+1.25*b;
  float ph=h21(id+seed+19.9)*6.2832, sp=.7+2.3*h21(id+seed+23.1);
  float tw=mix(1.,.5+.5*sin(uTime*sp+ph),twinkle);
  float core=exp(-dot(dv,dv)/(size*size*.9));
  float spike=0.;
  if(b>.42){float s=smoothstep(.55,1.,tw);spike=(exp(-abs(dv.x)*1.1)*exp(-dv.y*dv.y*1.4)+exp(-abs(dv.y)*1.1)*exp(-dv.x*dv.x*1.4))*.55*s*b;}
  float k=(core*(.32+1.1*b)+spike)*tw;
  vec3 tint=mix(vec3(.82,.9,1.),h21(id+seed+5.)>.7?vec3(1.,.86,.66):vec3(.7,.86,1.),.6);
  return tint*k;
}
// A few big sparkling stars a child can point at: four soft rays that breathe.
vec3 sparkleStars(vec2 css){
  float cell=128.; vec2 g=css/cell, id=floor(g), f=fract(g);
  if(h21(id+71.)>.42)return vec3(0.);
  vec2 dv=(f-(.2+.6*vec2(h21(id+73.1),h21(id+77.7))))*cell;
  float tw=.5+.5*sin(uTime*(.8+1.4*h21(id+83.1))+h21(id+79.9)*6.2832);
  tw=.18+.82*tw*tw;
  float ray=(exp(-abs(dv.x)*.42)*exp(-dv.y*dv.y*2.2)+exp(-abs(dv.y)*.42)*exp(-dv.x*dv.x*2.2));
  float k=exp(-dot(dv,dv)/2.6)*1.25+(ray*.95+exp(-length(dv)*.28)*.35)*tw;
  return (h21(id+85.)>.62?vec3(1.,.88,.68):vec3(.76,.9,1.))*k*(.45+.55*tw);
}
float vnoise(vec2 q){
  vec2 i=floor(q), f=fract(q); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);
}
uniform vec3 uMoon; uniform vec3 uNight;
void main(){
  vec2 css=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;
  vec2 p=(css-uOff)/uScale;
  vec2 d=(p-uEarth.xy)/uEarth.z;
  float rr=length(d);
  float above=(rr-1.)*uEarth.z;
  // Deep space matches the painting: navy, a little lighter towards the Earth.
  vec3 col=mix(vec3(.050,.105,.215),vec3(.040,.125,.265),clamp(p.x/1672.,0.,1.));
  col=mix(col,vec3(.075,.105,.19),smoothstep(500.,0.,p.x)*.5);
  float sunD=length(p-vec2(-90.,425.));
  col+=vec3(.30,.17,.10)*exp(-sunD/230.)+vec3(.10,.06,.06)*exp(-sunD/600.);
  // The sun just beyond the left edge: a golden glow and a long soft light streak.
  col+=vec3(1.,.72,.42)*exp(-sunD/150.)*.42+vec3(.42,.27,.16)*exp(-sunD/520.)*.30;
  col+=vec3(1.,.70,.42)*exp(-abs(p.y-425.)/10.)*exp(-max(p.x+90.,0.)/520.)*.20;
  float starMask=smoothstep(10.,90.,above);
  // Stars, star clouds and sparkles are skipped where the Earth covers the sky.
  if(starMask>.001){
  // A faint violet and teal cloud of far-away stars drifts across the open sky.
  float band=exp(-pow((p.y-150.+p.x*.10)/210.,2.))*starMask;
  if(band>.01){
    vec2 nq=p/240.+vec2(uTime*.006,0.);
    float neb=vnoise(nq)*.62+vnoise(nq*2.3+7.3)*.28+vnoise(nq*5.1+3.1)*.1;
    vec3 nebCol=mix(vec3(.34,.16,.50),vec3(.08,.40,.55),vnoise(p/420.+11.));
    col+=nebCol*smoothstep(.32,.86,neb)*band*.48;
  }
  col+=starLayer(css,46.,.66,0.,1.)*starMask*1.25;
  col+=starLayer(css+vec2(17.,9.),21.,.5,40.,.45)*starMask*.6;
  col+=sparkleStars(css+vec2(31.,57.))*starMask;
  }
  // A small round moon, lit from the same sun as the Earth.
  vec2 md=(css-uMoon.xy)/uMoon.z; float mr=length(md);
  if(mr<5.){
    col+=vec3(.55,.65,.86)*(exp(-max(mr-1.,0.)*1.25)*.26+exp(-max(mr-1.,0.)*4.)*.22);
    if(mr<1.04){
      vec3 mn=vec3(md.x,-md.y,sqrt(max(0.,1.-mr*mr)));
      float maria=smoothstep(.5,.78,vnoise(md*2.2+5.))*.34+smoothstep(.55,.82,vnoise(md*5.3+1.7))*.16;
      float lit=clamp(dot(mn,normalize(vec3(-.78,.42,.46))),0.,1.);
      vec3 moon=vec3(1.,.97,.9)*(1.-maria)*(.12+1.16*pow(lit,.7))+vec3(.07,.10,.18);
      col=mix(col,moon,smoothstep(1.03,.97,mr));
    }
  }
  // Now and then one slow shooting star crosses the open sky.
  if(uShootA.x>0.){
    vec2 q=css-uShoot.xy; float along=dot(q,uShoot.zw);
    float side=abs(q.x*uShoot.w-q.y*uShoot.z);
    float tail=clamp(-along/uShootA.y,0.,1.);
    float k=step(along,2.)*step(-uShootA.y,along)*exp(-side*side/(1.2+2.*(1.-tail)))*pow(1.-tail,1.6);
    col+=vec3(1.,.95,.85)*k*uShootA.x*starMask*1.9;
  }
  // Thin bright air above the horizon and a wide soft blue halo; past the day line it dims to deep blue.
  float ab=max(above,0.);
  float limbSun=dot(normalize(vec3(d.x,-d.y,.0001)),uNight);
  float limbDay=smoothstep(-.07,.05,limbSun), limbTwi=exp(-pow((limbSun+.012)/.05,2.));
  col+=(vec3(.55,.88,1.)*exp(-ab/6.)*.85+vec3(.22,.55,1.)*exp(-ab/22.)*.6)*mix(.28,1.,limbDay)+vec3(.08,.24,.55)*exp(-ab/110.)*mix(.45,.62,limbDay);
  col+=vec3(1.,.46,.26)*(exp(-ab/7.)*.75+exp(-ab/30.)*.30)*limbTwi;
  // A soft wide sky-blue glow hugs the day side of the Earth.
  col+=vec3(.16,.42,.95)*exp(-ab/50.)*.26*limbDay;
  // Towards the sun the thin air turns into a warm sunrise line.
  float dawn=exp(-sunD/900.);
  col+=vec3(1.,.58,.30)*(exp(-ab/9.)*.55+exp(-ab/40.)*.22)*dawn;
  if(rr<1.){
    vec3 n=vec3(d.x,-d.y,sqrt(max(0.,1.-rr*rr)));
    float lon=atan(dot(n,uE2),dot(n,uE1));
    float lat=asin(clamp(dot(n,uA),-1.,1.));
    vec2 uv=vec2((lon+uSpin)/.87266,lat/.43633+.5);
    vec2 uvc=vec2((lon+uCloudSpin)/.69813,lat/.34907+.37);
    vec3 ground=texture2D(uSurface,uv).rgb;
    float c=texture2D(uClouds,uvc).r;
    float cLit=texture2D(uClouds,uvc+vec2(.0028,-.0042)).r;
    float cShade=texture2D(uClouds,uvc+vec2(-.0035,.0060)).r;
    ground*=1.-.33*cShade;
    float water=smoothstep(.06,.24,ground.b-ground.r);
    float lit=clamp(.62+(c-cLit)*2.6,0.,1.);
    vec3 cloud=mix(vec3(.60,.70,.86),vec3(1.,.975,.93),lit);
    float cover=smoothstep(.02,.85,c);
    vec3 surf=mix(ground,cloud,cover);
    float dif=clamp(dot(n,uSun)*.75+.42,.25,1.18);
    surf*=dif;
    vec3 h=normalize(uSun+vec3(0.,0.,1.));
    surf+=vec3(1.,.95,.85)*pow(max(dot(n,h),0.),60.)*.45*water*(1.-cover);
    float lum=dot(surf,vec3(.3,.55,.15));
    surf=max(mix(vec3(lum),surf,1.18),0.);
    // Day and night: past a soft golden sunset line the far side sleeps and its cities light up.
    float sunUp=dot(n,uNight);
    float day=smoothstep(-.05,.045,sunUp), twi=exp(-pow((sunUp+.004)/.042,2.));
    vec3 nightSurf=surf*vec3(.10,.14,.27)+vec3(.010,.018,.048)+vec3(.07,.09,.16)*cover;
    surf=mix(nightSurf,surf,day);
    surf=mix(surf,surf*vec3(1.22,.80,.58)+vec3(.30,.15,.03)*cover,twi*.8);
    surf+=vec3(.62,.27,.08)*twi*(.3+.7*cover)*.75;
    if(day<.97){
      float land=(1.-water)*(1.-smoothstep(.45,.75,dot(ground,vec3(.33))));
      float pop=smoothstep(.40,.74,vnoise(uv*vec2(26.,13.)))*land;
      vec2 cg=uv*vec2(420.,210.), ci=floor(cg), cf=fract(cg)-(.22+.56*vec2(h21(ci+1.3),h21(ci+8.1)));
      float spark=step(h21(ci+3.7),pop)*exp(-dot(cf,cf)*24.)*(.55+.45*h21(ci+5.5));
      float haze=pop*(.3+.7*vnoise(uv*vec2(150.,75.)));
      surf+=vec3(1.,.74,.38)*(spark*2.6+haze*.34)*(1.-day)*(1.-cover*.75);
    }
    float fres=pow(1.-n.z,3.2);
    surf=mix(surf,mix(vec3(.10,.18,.42),vec3(.50,.80,1.),day),clamp(fres*.75,0.,.85));
    float inside=(1.-rr)*uEarth.z;
    surf+=mix(vec3(.10,.22,.50),vec3(.42,.80,1.),day)*(exp(-inside/4.)*.55+exp(-inside/16.)*.28);
    surf+=vec3(1.,.50,.26)*exp(-inside/6.)*.5*twi;
    float edge=clamp((1.-rr)*uEarth.z*uScale*uDpr*.9,0.,1.);
    col=mix(col,surf,edge);
  }
  gl_FragColor=vec4(col,1.);
}`;

  M.createHubScene = function (container) {
    const station = document.createElement('div');
    station.className = 'orb-station-live'; station.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    canvas.className = 'orb-live'; canvas.setAttribute('aria-hidden', 'true');
    const anchor = container.querySelector('.orb-shade');
    // Navigation beacons blink and the round windows breathe on the painted station.
    const lights = document.createElement('div');
    lights.className = 'orb-lights'; lights.setAttribute('aria-hidden', 'true');
    [[863, 132, 'red'], [244, 395, 'red'], [1450, 383, 'green'], [801, 189, 'white'],
     [335, 400, 'teal'], [535, 400, 'teal'], [806, 384, 'teal'], [959, 385, 'teal'], [1368, 395, 'teal']].forEach(([x, y, kind], i) => {
      const dot = document.createElement('i');
      dot.className = 'orb-light orb-light-' + kind;
      dot.style.left = (x / IMG_W * 100).toFixed(3) + '%'; dot.style.top = (y / IMG_H * 100).toFixed(3) + '%';
      dot.style.animationDelay = (-i * .83).toFixed(2) + 's';
      lights.appendChild(dot);
    });
    container.insertBefore(canvas, anchor); container.insertBefore(station, anchor); container.insertBefore(lights, anchor);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let T, renderer, backdrop, cabin, cabinCamera, feza, bilbo, fezaPose, bilboPose, gesture;
    let state = 'idle', running = false, raf = 0, last = 0, clock = 0, spin = 0, cloudSpin = .31;
    let layout = null, broken = false, hiddenSize = false, wanted = false, cpuMs = 0;
    const options = new URLSearchParams(location.search);

    function readLayout() {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return null;
      const pos = getComputedStyle(station).backgroundPosition.split(/\s+/).map(v => parseFloat(v) / 100);
      const px = Number.isFinite(pos[0]) ? pos[0] : .5, py = Number.isFinite(pos[1]) ? pos[1] : .44;
      const scale = Math.max(w / IMG_W, h / IMG_H);
      return {w, h, scale, ox: (w - IMG_W * scale) * px, oy: (h - IMG_H * scale) * py};
    }
    function dprFor(w, h) {
      const dpr = window.devicePixelRatio || 1;
      // Big tablets get a bounded drawing size; the backdrop is soft by design.
      const budget = M.device && M.device.tablet ? 2000000 : 3400000;
      return Math.min(dpr, 2, Math.sqrt(budget / Math.max(1, w * h)));
    }
    function resize() {
      if (!renderer) return;
      const L = readLayout();
      if (!L) return;
      layout = L;
      const dpr = dprFor(L.w, L.h);
      renderer.setPixelRatio(dpr);
      renderer.setSize(L.w, L.h, false);
      hiddenSize = false;
      const u = backdrop.material.uniforms;
      u.uRes.value.set(canvas.width, canvas.height);
      u.uDpr.value = canvas.width / L.w;
      u.uOff.value.set(L.ox, L.oy);
      u.uScale.value = L.scale;
      // The moon sits in the open sky corner of every screen shape, clear of the title.
      const wide = L.w >= L.h;
      u.uMoon.value.set(L.w * (wide ? .905 : .9), L.h * (wide ? .105 : .1), Math.max(14, Math.min(L.w, L.h) * .034));
      // Blinking station lights follow the painted station exactly.
      lights.style.left = L.ox + 'px'; lights.style.top = L.oy + 'px';
      lights.style.width = IMG_W * L.scale + 'px'; lights.style.height = IMG_H * L.scale + 'px';
    }

    async function build() {
      state = 'loading';
      for (const src of SCRIPTS) if (needed(src)) await loadScript(src);
      T = window.THREE;
      const art = M.HubEarthArt;
      const [surfaceImg, cloudImg] = await Promise.all([image(art.surface), image(art.clouds)]);
      renderer = new T.WebGLRenderer({canvas, antialias: true, alpha: false, powerPreference: 'high-performance'});
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.autoClear = false; renderer.info.autoReset = false;
      canvas.addEventListener('webglcontextlost', e => {e.preventDefault(); fail();});
      function tex(img) {
        const t = new T.Texture(img);
        t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4;
        t.minFilter = T.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
        return t;
      }
      // Spin axis: the visible patch of Earth drifts along the horizon.
      const V = (x, y, z) => new T.Vector3(x, y, z);
      const c = V((1300 - EARTH.x) / EARTH.r, -(760 - EARTH.y) / EARTH.r, 0);
      c.z = Math.sqrt(Math.max(0, 1 - c.x * c.x - c.y * c.y));
      const tangent = V(-c.y, c.x, 0).normalize();
      const axis = V().crossVectors(c, tangent).normalize();
      const e2 = V().crossVectors(axis, c).normalize();
      // The day line runs through two painted points; the far right side of the Earth is in night.
      const nAt = (x, y) => {const dx = (x - EARTH.x) / EARTH.r, dy = (y - EARTH.y) / EARTH.r; return V(dx, -dy, Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)));};
      const night = V().crossVectors(nAt(1450, 240), nAt(1220, 941)).normalize();
      if (night.dot(nAt(500, 941)) < 0) night.negate();
      backdrop = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
        vertexShader: backdropVertex, fragmentShader: backdropFragment, depthTest: false, depthWrite: false,
        uniforms: {
          uRes: {value: new T.Vector2(1, 1)}, uDpr: {value: 1}, uOff: {value: new T.Vector2()}, uScale: {value: 1},
          uEarth: {value: new T.Vector3(EARTH.x, EARTH.y, EARTH.r)}, uTime: {value: 0}, uSpin: {value: 0}, uCloudSpin: {value: 0},
          uA: {value: axis}, uE1: {value: c}, uE2: {value: e2}, uSun: {value: V(-.55, .45, .70).normalize()},
          uSurface: {value: tex(surfaceImg)}, uClouds: {value: tex(cloudImg)},
          uShoot: {value: new T.Vector4()}, uShootA: {value: new T.Vector2()}, uMoon: {value: new T.Vector3(-999, -999, 1)}, uNight: {value: night}
        }
      }));
      backdrop.frustumCulled = false;
      backdrop.userData.scene = new T.Scene(); backdrop.userData.scene.add(backdrop);
      backdrop.userData.camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // The room behind the window: warm light, a soft wall and the two explorers.
      cabin = new T.Scene();
      const wall = new T.Mesh(new T.PlaneGeometry(9, 9), new T.ShaderMaterial({
        depthWrite: false,
        vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: 'varying vec2 vUv;void main(){vec2 q=vUv-vec2(.47,.56);float r=length(q*vec2(1.,1.15));vec3 c=mix(vec3(1.,.90,.70),vec3(.36,.52,.62),smoothstep(.04,.42,r));float lamp=exp(-pow(length(vUv-vec2(.62,.83))*9.,2.));c+=vec3(.5,.42,.25)*lamp;float strip=smoothstep(.006,0.,abs(vUv.y-.34))*.25;c=mix(c,vec3(.55,.9,.92),strip);gl_FragColor=vec4(c,1.);}'
      }));
      wall.position.set(0, .2, -2.4); cabin.add(wall);
      cabin.add(new T.HemisphereLight(0xfff3dc, 0x5d7690, 1.9));
      const key = new T.DirectionalLight(0xfff1dd, 2.4); key.position.set(-1.5, 2.4, 3.2); cabin.add(key);
      const rim = new T.DirectionalLight(0x9de8ff, 1.3); rim.position.set(2.2, 1.2, -2.5); cabin.add(rim);
      feza = M.createFezaAstronaut(); bilbo = M.createBilboAstronaut();
      cabin.add(feza.root, bilbo.root);
      fezaPose = {mode: 'idle', grounded: true, vx: 0, vy: 0, facing: -1};
      bilboPose = {mode: 'idle', grounded: true, vx: 0, vy: 0, facing: 1, emote: 'happy'};
      gesture = {wag: 0, paw: 0, wave: 0, toDog: 1};
      cabinCamera = new T.PerspectiveCamera(25, 1, .1, 30);
      cabinCamera.position.set(-.02, 1.34, 4.1); cabinCamera.lookAt(-.02, 1.16, 0);
      M.camera = cabinCamera; // Feza's eyes follow the window camera: she looks at the child.
      cabin.updateMatrixWorld(true);
      if (options.has('fps') || options.has('perf')) M.hubScene = api;
      resize();
      renderer.compile(backdrop.userData.scene, backdrop.userData.camera);
      renderer.compile(cabin, cabinCamera);
      state = 'ready';
    }
    function fail() {
      broken = true; running = false; cancelAnimationFrame(raf);
      container.classList.remove('orb-live-on');
    }

    function pose(dt) {
      // A gentle 8 second loop: Feza waves at the child; Bilbo's tail never stops.
      const cycle = clock % 8, t = clock;
      fezaPose.mode = cycle > .5 && cycle < 3.7 ? 'wave' : 'idle';
      // Bilbo turns his head to the child, then back to Feza.
      const look = Math.min(1, Math.max(0, Math.sin((cycle - 3.9) / 4 * Math.PI) * 1.6));
      bilboPose.lookX = -.75 * look; bilboPose.lookY = .12 * look;
      gesture.wave = 0; gesture.paw = 0; gesture.toDog = -1;
      gesture.wag = .6 + .4 * Math.max(0, Math.sin(t * 1.3));
      feza.root.position.set(.30, -.06 + Math.sin(t * .9) * .035, .15);
      feza.root.rotation.set(Math.sin(t * .55) * .02, .84, Math.sin(t * .7) * .03);
      bilbo.root.position.set(-.50, .58 + Math.sin(t * .9 + 1.7) * .04, 0);
      bilbo.root.rotation.set(0, -.78, Math.sin(t * .62 + 1) * .04);
      feza.update(dt, t, fezaPose, 0, null);
      bilbo.update(dt, t, bilboPose, 0, gesture);
    }
    function shootingStar(u) {
      const period = 8, k = Math.floor((clock + 5) / period), local = (clock + 5) - k * period, life = 2.2;
      if (local > life || !layout) {u.uShootA.value.x = 0; return;}
      const rnd = n => {const x = Math.sin(k * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x);};
      const a = .16 + .22 * rnd(1), dx = Math.cos(a), dy = Math.sin(a);
      const sx = layout.w * (.28 + .32 * rnd(2)), sy = layout.h * (.015 + .07 * rnd(3));
      const travel = Math.min(layout.w, layout.h) * .42, p = local / life;
      u.uShoot.value.set(sx + dx * travel * p, sy + dy * travel * p, dx, dy);
      u.uShootA.value.set(Math.sin(Math.PI * p), 90 + 70 * p);
    }
    function portholeRect() {
      const L = layout, dpr = renderer.getPixelRatio();
      const r = (PORT.r + 2) * L.scale, cx = L.ox + PORT.x * L.scale, cy = L.oy + PORT.y * L.scale;
      const size = Math.ceil(r * 2 * dpr), x = Math.floor((cx - r) * dpr), y = Math.floor((L.h - cy - r) * dpr);
      return {x, y, size, cx, cy, r};
    }
    function draw(dt) {
      renderer.info.reset();
      const u = backdrop.material.uniforms;
      // The Earth keeps turning where a child can see it move (half speed with reduced motion).
      const surfaceSpeed = reduce.matches ? .0042 : .0088, span = .87266, cloudSpan = .69813;
      spin = (spin + dt * surfaceSpeed) % span;
      cloudSpin = (cloudSpin + dt * surfaceSpeed * 1.35) % cloudSpan;
      u.uTime.value = clock; u.uSpin.value = spin; u.uCloudSpin.value = cloudSpin;
      shootingStar(u);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, layout.w, layout.h);
      renderer.render(backdrop.userData.scene, backdrop.userData.camera);
      const P = portholeRect();
      if (P.size > 4 && P.cx + P.r > 0 && P.cx - P.r < layout.w && P.cy + P.r > 0 && P.cy - P.r < layout.h) {
        pose(reduce.matches ? 0 : dt);
        const dpr = renderer.getPixelRatio();
        renderer.setViewport(P.x / dpr, P.y / dpr, P.size / dpr, P.size / dpr);
        renderer.setScissor(P.x / dpr, P.y / dpr, P.size / dpr, P.size / dpr);
        renderer.setScissorTest(true);
        renderer.clearDepth();
        renderer.render(cabin, cabinCamera);
        renderer.setScissorTest(false);
      }
    }
    function frame(now) {
      raf = 0;
      if (!running) return;
      raf = requestAnimationFrame(frame);
      // Like the planets: a 120 Hz tablet still draws the station at 60 frames.
      const cap = M.device && M.device.frameRate;
      if (cap && last && now - last < 1000 / cap - 2) return;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
      last = now;
      clock += dt;
      const began = performance.now();
      try { draw(dt); } catch (err) { console.warn('Üs sahnesi durdu', err); fail(); }
      cpuMs = cpuMs * .95 + (performance.now() - began) * .05;
    }
    function start() {
      if (broken) return;
      if (state === 'idle') {
        // Planet pictures and the dock appear first; the live sky follows.
        const begin = () => build().then(() => {if (wanted) start();}).catch(err => {console.warn('Üs sahnesi yüklenemedi', err); fail();});
        state = 'queued';
        if (document.readyState === 'complete') setTimeout(begin, 120); else addEventListener('load', () => setTimeout(begin, 120), {once: true});
      }
      wanted = true;
      if (state !== 'ready' || running) return;
      resize();
      if (!layout) return;
      // Draw once right away so a returning family never sees an empty frame.
      try { draw(1 / 60); } catch (err) { console.warn('Üs sahnesi durdu', err); fail(); return; }
      running = true; last = 0;
      raf = requestAnimationFrame(frame);
      if (!container.classList.contains('orb-live-on')) requestAnimationFrame(() => container.classList.add('orb-live-on'));
    }
    // Pause keeps the last picture under the flight; stop also frees the big drawing buffer.
    function pause() {
      running = false; wanted = false;
      if (raf) cancelAnimationFrame(raf); raf = 0;
    }
    function stop() {
      pause();
      if (renderer && !hiddenSize) {renderer.setPixelRatio(1); renderer.setSize(1, 1, false); hiddenSize = true;}
    }
    addEventListener('resize', () => {if (running) resize();});
    document.addEventListener('visibilitychange', () => {last = 0;});
    const api = {start, pause, stop, get running() {return running;}, get ready() {return state === 'ready';},
      info() {return renderer ? {calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, size: [canvas.width, canvas.height], cpuMs: +cpuMs.toFixed(2), running, clock: +clock.toFixed(2), pixelRatio: +renderer.getPixelRatio().toFixed(2), tablet: !!(M.device && M.device.tablet), frameCap: (M.device && M.device.frameRate) || 0, memory: {...renderer.info.memory}, programs: renderer.info.programs ? renderer.info.programs.length : 0} : null;},
      // Test helper (?fps / ?perf only): advance the picture by a fixed step while paused.
      step(dt) {if (state !== 'ready' || running) return false; if (hiddenSize || !layout) resize(); clock += dt; draw(dt); return true;}};
    return api;
  };
})(window.MARS);
