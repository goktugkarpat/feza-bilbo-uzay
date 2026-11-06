(function(M){
 'use strict';
 // Ortak büyülü uzay göğü (ATMOS).
 //   const sky=M.createSpaceSky({scene,preset:'mars'});   // kurulumda bir kez
 //   sky.update(dt);                                        // her karede (camera isteğe bağlı)
 //   sky.dispose();                                         // gezegen kapanırken
 // Gök sonsuz uzakta durur: kamera kaydıkça kubbe ve uydular yerinde kalır, yalnız
 // yakın yıldızlar çok hafif kayar. Kare başına yeni nesne oluşturulmaz.
 // Çizim çağrısı: kubbe 1 + yıldızlar 1 + her uydu 1 + kayan yıldız 1 (yalnız uçarken) + perde 1.
 const T=THREE;
 const R=900;               // sky radius, inside every planet's camera far plane (1500)
 const FAR='gl_Position.z=gl_Position.w*.99999;';
 const SKY_ORDER=-1000;

 const PRESETS={
  night:{dome:{top:'#05081a',mid:'#111836',low:'#2a2452',midY:.5,lowY:-.2,nebula:['#5b45a8','#2a6fa8','#b45f94'],nebulaAmount:.55},
         stars:{count:1500,brightness:1,colors:['#ffffff','#cfe2ff','#ffe9c4','#ffd3ea']},aurora:false},
  mars:{dome:{top:'#120c26',mid:'#3a1f3e',low:'#a8584a',midY:.5,lowY:-.2,nebula:['#b65a3c','#6c3a8a','#d9925c'],nebulaAmount:.45},
        stars:{count:1300,brightness:.9,colors:['#ffffff','#ffe6cc','#ffd2c2','#d8e4ff']},aurora:{colors:['#4fd6c8','#7a6cff'],amount:.16,y:.62,height:.26}},
  saturn:{dome:{top:'#080a1f',mid:'#1a1c44',low:'#544368',midY:.5,lowY:-.2,nebula:['#c08f5e','#5e64b4','#9a62ac'],nebulaAmount:.5},
          stars:{count:1500,brightness:1,colors:['#ffffff','#ffe9c4','#d6dcff','#ffe0f0']},aurora:false},
  neptune:{dome:{top:'#03102a',mid:'#0c2d5a',low:'#36739f',midY:.5,lowY:-.2,nebula:['#2a9cc4','#5258cc','#3cbfae'],nebulaAmount:.5},
           stars:{count:1400,brightness:1,colors:['#ffffff','#c8f0ff','#d8d4ff','#bff5e8']},aurora:{colors:['#43e0c8','#5f7dff'],amount:.22,y:.58,height:.3}},
  jupiter:{dome:{top:'#060918',mid:'#131b39',low:'#3a2f4f',midY:.5,lowY:-.2,nebula:['#ad7a4e','#4d5ea6','#8858a0'],nebulaAmount:.5},
           stars:{count:1500,brightness:1,colors:['#ffffff','#ffe7c8','#d4e0ff','#ffd6c6']},aurora:false},
  venus:{dome:{top:'#3b1e33',mid:'#a65a3a',low:'#efb05c',midY:.5,lowY:-.2,nebula:['#ffcf7a','#ff8f5a','#ffe6b0'],nebulaAmount:.3},
         stars:{count:500,brightness:.35,colors:['#fff6e0','#ffe0b8']},aurora:{colors:['#ffd58a','#ff9d6a'],amount:.1,y:.5,height:.4,wave:.05,rays:.25}}
 };
 // Small sky bodies. Light comes from the screen direction [x,y] (e.g. [-1,.4] = from the upper left).
 const BODIES={
  moon:{kind:'rocky',colors:['#cfcac0','#9c968c','#77726c'],halo:'#cfe0ff',haloAmount:.25,craters:1},
  phobos:{kind:'rocky',colors:['#9a8676','#6e5d52','#544740'],halo:'#ffcfa8',haloAmount:.12,craters:1.2,size:.07,stretch:[1.3,.9],lumpy:.35},
  deimos:{kind:'rocky',colors:['#b8a593','#8c7a6b','#6c5d52'],halo:'#ffd9b8',haloAmount:.1,craters:.6,size:.04,stretch:[1.15,.95],lumpy:.25},
  titan:{kind:'gas',colors:['#e6a65a','#c9853f','#f2c27e'],bands:3,halo:'#ffc879',haloAmount:.9,size:.1},
  enceladus:{kind:'ice',colors:['#f4f8ff','#bcd3e6','#8fb3cf'],halo:'#dff4ff',haloAmount:.45,size:.05},
  triton:{kind:'ice',colors:['#f3d9d2','#c9a7a7','#9cc4cf'],halo:'#cfe9ff',haloAmount:.45,size:.08},
  io:{kind:'rocky',colors:['#f2d863','#d99a3c','#b1622e'],halo:'#ffe7a0',haloAmount:.3,craters:.4,size:.07},
  europa:{kind:'ice',colors:['#f1eadb','#c7a98a','#a07f66'],halo:'#e8f3ff',haloAmount:.35,size:.07},
  earth:{kind:'earth',colors:['#2f6fb2','#5f9e64','#ffffff'],halo:'#8fd0ff',haloAmount:.9,size:.12},
  neptune:{kind:'gas',colors:['#3d7fe0','#2a5cc0','#7fb6ff'],bands:5,halo:'#7fd4ff',haloAmount:.8,size:.18},
  jupiter:{kind:'gas',colors:['#e8d2b0','#b9814e','#f4ead8'],bands:9,spot:'#c8573a',spin:.004,halo:'#ffe2b8',haloAmount:.4,size:.3},
  saturn:{kind:'gas',colors:['#ead39b','#c99c5c','#f6e6bf'],bands:6,halo:'#ffe7b0',haloAmount:.4,size:.16,ring:{inner:1.3,outer:2.25,tilt:.3,angle:-.25,color:'#e8d3a6',opacity:.85}},
  sun:{kind:'glow',colors:['#fff6d8','#ffd27a','#ff9f4a'],halo:'#ffcf7a',haloAmount:1.4,size:.05},
  star:{kind:'glow',colors:['#ffffff','#cfe8ff','#9fc8ff'],halo:'#bfe0ff',haloAmount:1.2,size:.025}
 };
 M.SPACE_SKY_PRESETS=PRESETS;M.SPACE_SKY_BODIES=BODIES;

 function seeded(seed){let s=(seed>>>0)||1;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 function merge(base,extra){
  if(extra===false)return false;
  if(extra===undefined||extra===null)return base?Object.assign({},base):base;
  if(extra===true)return base?Object.assign({},base):{};
  return Object.assign({},base||{},extra);
 }
 const col=c=>new T.Color(c);

 const NOISE=`
 float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){return (.5*n3(p)+.25*n3(p*2.03)+.125*n3(p*4.01))/.875;}`;

 // Soft, wrapped nebula clouds baked once into a small panorama (360° wide, ±40° high).
 // Computed in floating point (no canvas gradient dithering, which shows as a grid when stretched).
 function nebulaTexture(colors,seed){
  const w=1024,h=256,buf=new Float32Array(w*h*3),rnd=seeded(seed);
  const pal=colors.map(c=>{const k=new T.Color(c);return [k.r,k.g,k.b];});
  // Gaussian blob, wrapped horizontally. mode 0 adds colour, 1 darkens (dust lane).
  function blob(x,y,rx,ry,c,alpha,mode){
   const x0=Math.floor(x-rx*2.2),x1=Math.ceil(x+rx*2.2),y0=Math.max(0,Math.floor(y-ry*2.2)),y1=Math.min(h-1,Math.ceil(y+ry*2.2));
   const ix=1/(rx*rx*.5),iy=1/(ry*ry*.5);
   for(let yy=y0;yy<=y1;yy++){const dy=(yy-y)*(yy-y)*iy;if(dy>5)continue;
    for(let xx=x0;xx<=x1;xx++){const f=Math.exp(-(xx-x)*(xx-x)*ix-dy)*alpha;if(f<.002)continue;const i=(((xx%w)+w)%w+yy*w)*3;
     if(mode){const m=1-f;buf[i]*=m;buf[i+1]*=m;buf[i+2]*=m;}else{buf[i]+=c[0]*f;buf[i+1]+=c[1]*f;buf[i+2]+=c[2]*f;}}}
  }
  const ribbons=[];
  for(let k=0;k<3;k++){
   const c=pal[k%pal.length],base=h*(.44+rnd()*.16),phase=rnd()*6.28,amp=h*(.05+rnd()*.07);ribbons.push([base,phase,amp]);
   for(let i=0;i<30;i++){const x=i/30*w+rnd()*30,y=base+Math.sin(x/w*Math.PI*4+phase)*amp+(rnd()-.5)*h*.08;
    blob(x,y,20+rnd()*45,8+rnd()*16,c,.16+rnd()*.14,0);}
  }
  for(let i=0;i<12;i++)blob(rnd()*w,h*(.35+rnd()*.35),30+rnd()*55,18+rnd()*30,pal[i%pal.length],.1+rnd()*.08,0);
  for(let i=0;i<34;i++){const r=ribbons[i%3],x=rnd()*w,y=r[0]+Math.sin(x/w*Math.PI*4+r[1])*r[2]+(rnd()-.5)*h*.05;blob(x,y,16+rnd()*36,3+rnd()*7,null,.3+rnd()*.25,1);}
  for(let i=0;i<10;i++){const r=ribbons[i%3],x=rnd()*w,y=r[0]+Math.sin(x/w*Math.PI*4+r[1])*r[2];blob(x,y,5+rnd()*9,4+rnd()*7,[1,1,1],.12+rnd()*.1,0);blob(x,y,14+rnd()*12,10+rnd()*10,pal[i%pal.length],.16,0);}
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),img=g.createImageData(w,h),d=img.data;
  // Store in sRGB like an image; soft roll-off keeps overlapping clouds from clipping.
  for(let i=0,j=0;i<w*h;i++,j+=3){for(let k=0;k<3;k++){const v=1-Math.exp(-buf[j+k]*2.4);d[i*4+k]=Math.round(Math.pow(v,1/1.4)*255);}d[i*4+3]=255;}
  g.putImageData(img,0,0);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;t.wrapT=T.ClampToEdgeWrapping;
  t.generateMipmaps=false;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;return t;
 }

 M.createSpaceSky=function(opts){
  opts=opts||{};
  const preset=PRESETS[opts.preset]||PRESETS.night;
  const domeCfg=merge(preset.dome,opts.dome),starCfg=merge(preset.stars,opts.stars),auroraCfg=merge(preset.aurora,opts.aurora);
  // Over a bright painted sky an additive veil quickly turns milky: keep the preset veil softer there.
  if(domeCfg&&domeCfg.overlay&&auroraCfg&&!(opts.aurora&&opts.aurora.amount!==undefined))auroraCfg.amount=(auroraCfg.amount??.2)*.4;
  const shootCfg=opts.shooting===false?false:Object.assign({every:[20,40],duration:2.2,color:'#fff4dc',amount:1},opts.shooting||{});
  const seed=opts.seed||{mars:11,saturn:23,neptune:5,jupiter:17,venus:29}[opts.preset]||7;
  const group=new T.Group();group.name='space-sky';
  const time={value:0},rot={value:0},strength={value:opts.strength??1},intro={value:opts.intro===false?1:0};
  const introSeconds=opts.intro===false?0:(opts.intro??2.6);
  // The sky wakes up softly when the child lands: stars light up one by one, moons and clouds fade in.
  const introReady=opts.introWhen||(()=>!!M.debug||!document.getElementById('loading'));
  const disposables=[];let lastCamera=null,aspect=1,zoom=1,pixelRatio=1;
  const camPos=new T.Vector3();
  const keep=(...items)=>{disposables.push(...items);return items[0];};
  function capture(renderer,scene,camera){
   lastCamera=camera;aspect=camera.aspect||1;zoom=camera.zoom||1;pixelRatio=renderer.getPixelRatio();
   if(starMat)starMat.uniforms.uScale.value=pixelRatio;
   for(const b of bodies)b.material.uniforms.uAspect.value=aspect;
   if(meteorMat)meteorMat.uniforms.uAspect.value=aspect;
   if(domeMat)domeMat.uniforms.uAspect.value=aspect;
   if(arcMat)arcMat.uniforms.uAspect.value=aspect;
  }
  function prepare(obj,order){obj.frustumCulled=false;obj.onBeforeRender=capture;obj.renderOrder=SKY_ORDER+order;obj.matrixAutoUpdate=false;group.add(obj);return obj;}

  // --- Dome: screen-space colour gradient + drifting nebula panorama -------------
  let dome=null,domeMat=null;
  if(domeCfg){
   const neb=keep(nebulaTexture(domeCfg.nebula||PRESETS.night.dome.nebula,domeCfg.seed||seed));
   const overlay=!!domeCfg.overlay;
   domeMat=keep(new T.ShaderMaterial({
    uniforms:{uIntro:intro,uTop:{value:col(domeCfg.top)},uMid:{value:col(domeCfg.mid)},uLow:{value:col(domeCfg.low)},uMidY:{value:domeCfg.midY??.25},uLowY:{value:domeCfg.lowY??-.7},
     uNeb:{value:neb},uNebAmt:{value:domeCfg.nebulaAmount??.5},uRot:rot,uStrength:strength,uOverlay:{value:overlay?1:0},uTime:time,uAspect:{value:1},
     uGlowPos:{value:new T.Vector2()},uGlowCol:{value:new T.Color()},uGlowSize:{value:.3},uGlowAmt:{value:0},uBeams:{value:7},uBeamAmt:{value:0}},
    vertexShader:`varying vec3 vDir;varying vec3 vClip;
     void main(){vDir=position;gl_Position=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.);${FAR}vClip=gl_Position.xyw;}`,
    fragmentShader:`uniform vec3 uTop,uMid,uLow,uGlowCol;uniform float uIntro,uMidY,uLowY,uNebAmt,uRot,uStrength,uOverlay,uTime,uAspect,uGlowSize,uGlowAmt,uBeams,uBeamAmt;uniform vec2 uGlowPos;uniform sampler2D uNeb;varying vec3 vDir;varying vec3 vClip;
     void main(){float y=vClip.y/vClip.z;
      vec3 c=mix(uLow,uMid,smoothstep(uLowY,uMidY,y));c=mix(c,uTop,smoothstep(uMidY,1.,y));
      vec3 d=normalize(vDir);float az=atan(d.x,-d.z)-uRot;float el=asin(clamp(d.y,-1.,1.));
      vec2 uv=vec2(fract(az*.1591549+.5),clamp(el/1.3962634+.5,0.,1.));
      vec3 n=texture2D(uNeb,uv).rgb*uNebAmt*uStrength*(.35+.65*uIntro);
      if(uGlowAmt>0.){vec2 dv=vec2((vClip.x/vClip.z-uGlowPos.x)*uAspect,y-uGlowPos.y);float dist=length(dv);
       float g=uGlowAmt*(.65*exp(-dist/uGlowSize)+.5*exp(-dist*dist/(uGlowSize*uGlowSize*.08)));
       if(uBeamAmt>0.){float ang=atan(dv.y,dv.x);float b=.5+.5*sin(ang*uBeams+sin(ang*3.+uTime*.07)*1.6+uTime*.04);
        g+=uBeamAmt*b*b*b*b*smoothstep(.02,.25,dist)*exp(-dist*1.1);}
       n+=uGlowCol*g*uStrength;}
      float dither=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
      gl_FragColor=uOverlay>.5?vec4(n+dither,1.):vec4(c+n+dither,1.);
      #include <colorspace_fragment>
     }`,
    depthWrite:false,depthTest:true,fog:false,toneMapped:false,side:T.BackSide,
    transparent:overlay,blending:overlay?T.AdditiveBlending:T.NormalBlending
   }));
   // Opaque dome is drawn after the opaque scenery at the far plane: covered pixels are skipped (cheap on iPad).
   dome=prepare(new T.Mesh(keep(new T.SphereGeometry(R,32,16)),domeMat),0);dome.name='space-sky-dome';if(!overlay)dome.renderOrder=900;
   setGlow(domeCfg.glow||null);
  }

  function setGlow(gl){
   if(!domeMat)return;const u=domeMat.uniforms;
   if(!gl){u.uGlowAmt.value=0;u.uBeamAmt.value=0;return;}
   const sc=gl.screen||[.75,.2];u.uGlowPos.value.set(sc[0]*2-1,1-sc[1]*2);u.uGlowCol.value.set(gl.color||'#ffd28a');
   u.uGlowSize.value=gl.size??.3;u.uGlowAmt.value=gl.amount??.5;u.uBeams.value=gl.beams??0;u.uBeamAmt.value=gl.beams?(gl.beamAmount??.18):0;
  }
  // --- Stars: one Points draw, each star twinkles at its own gentle pace ----------
  let stars=null,starMat=null;
  if(starCfg){
   const rnd=seeded(seed*31+5),n=Math.max(0,Math.round((starCfg.count??1400)*(opts.quality??1)));
   const pos=new Float32Array(n*3),data=new Float32Array(n*4),colours=new Float32Array(n*3);
   const palette=(starCfg.colors||['#ffffff']).map(c=>col(c));
   for(let i=0;i<n;i++){
    const az=(rnd()*2-1)*Math.PI;
    // Most stars live in the band a side-view camera sees; a few elsewhere for wider views.
    const el=rnd()<.82?(-38+rnd()*68)*Math.PI/180:Math.asin(rnd()*2-1);
    pos[i*3]=Math.sin(az)*Math.cos(el)*R;pos[i*3+1]=Math.sin(el)*R;pos[i*3+2]=-Math.cos(az)*Math.cos(el)*R;
    const big=rnd(),size=big>.985?3.6+rnd()*1.6:big>.9?2.2+rnd()*.9:1.1+rnd()*1.1;
    data[i*4]=size*(starCfg.size??1);data[i*4+1]=rnd()*6.283;data[i*4+2]=(.35+rnd()*1.1)*(starCfg.twinkle??1);data[i*4+3]=rnd()*rnd();
    const c=palette[Math.floor(rnd()*palette.length)],b=.55+rnd()*.45;colours[i*3]=c.r*b;colours[i*3+1]=c.g*b;colours[i*3+2]=c.b*b;
   }
   const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('aData',new T.BufferAttribute(data,4));g.setAttribute('aCol',new T.BufferAttribute(colours,3));
   starMat=keep(new T.ShaderMaterial({
    uniforms:{uTime:time,uRot:rot,uScale:{value:1},uBright:{value:starCfg.brightness??1},uPar:{value:starCfg.parallax??.35},uStrength:strength,uIntro:intro},
    vertexShader:`attribute vec4 aData;attribute vec3 aCol;uniform float uTime,uRot,uScale,uBright,uPar,uStrength,uIntro;varying vec3 vCol;varying float vGlint;
     void main(){float c=cos(uRot),s=sin(uRot);vec3 p=vec3(position.x*c-position.z*s,position.y,position.z*c+position.x*s);
      vec3 w=p+cameraPosition*(1.-aData.w*uPar);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);${FAR}
      float tw=.5+.5*sin(uTime*aData.z+aData.y);tw=tw*tw*(3.-2.*tw);
      gl_PointSize=aData.x*uScale*(.8+.35*tw)*2.2;
      float th=aData.y*.1591549*.8;vCol=aCol*uBright*uStrength*(.35+.65*tw)*smoothstep(th,th+.2,uIntro);vGlint=smoothstep(3.,3.8,aData.x)*(.4+.6*tw);}`,
    fragmentShader:`varying vec3 vCol;varying float vGlint;
     void main(){vec2 q=gl_PointCoord*2.-1.;float r2=dot(q,q);
      float core=exp(-r2*9.)+.25*exp(-r2*3.);
      float glint=vGlint*(max(0.,1.-abs(q.x)*7.)*max(0.,1.-abs(q.y))+max(0.,1.-abs(q.y)*7.)*max(0.,1.-abs(q.x)))*.75;
      float a=core+glint+vGlint*.3*exp(-r2*2.2);if(a<.01)discard;
      gl_FragColor=vec4(vCol*a,1.);
      #include <colorspace_fragment>
     }`,
    transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,fog:false,toneMapped:false
   }));
   stars=prepare(new T.Points(g,starMat),1);stars.name='space-sky-stars';
  }

  // --- Sky bodies: one quad each, a lit little world drawn in the shader ----------
  const bodies=[];const quad=keep(new T.PlaneGeometry(2,2));
  const KIND={rocky:0,gas:1,ice:2,earth:3,glow:4};
  const bodyVS=`uniform vec2 uPos;uniform float uSize,uExt,uAspect,uZoom;varying vec2 vUv;
   void main(){vUv=position.xy*uExt;vec2 p=uPos+position.xy*uExt*uSize*uZoom*min(1.,uAspect)*vec2(1./uAspect,1.);gl_Position=vec4(p,.99999,1.);}`;
  const bodyFS=`uniform vec3 uA,uB,uC,uHalo,uRingCol;uniform vec2 uLight;uniform float uIntro,uKind,uTime,uSpin,uHaloAmt,uAmb,uBands,uCraters,uSeed,uAlpha,uStrength;
   uniform vec4 uRing;uniform vec3 uSpot;uniform float uRingAngle,uLumpy,uSpotAmt;uniform vec2 uStretch;varying vec2 vUv;${NOISE}
   vec3 surface(vec3 q){
    if(uKind<.5){float f=fbm(q*2.2+uSeed);vec3 c=mix(uB,uA,smoothstep(.3,.75,f));c=mix(c,uC,smoothstep(.55,.8,fbm(q*1.3-uSeed))*.6);
     float k=n3(q*7.+uSeed*1.7);float crater=smoothstep(.7,.76,k)*uCraters;float rim=smoothstep(.6,.7,k)*(1.-smoothstep(.7,.76,k))*uCraters;
     return c*(1.-.3*crater)+.1*rim;}
    if(uKind<1.5){float w=fbm(q*vec3(1.5,5.,1.5)+uSeed);float t=q.y*uBands+(fbm(q*vec3(2.,7.,2.)+w*1.5+uSeed)-.5)*1.8;float b=.5+.5*sin(t*3.14159);
     vec3 c=mix(uA,uB,b*b*(3.-2.*b));c=mix(c,uC,smoothstep(.62,.9,fbm(q*vec3(3.,10.,3.)-uSeed))*.5);
     if(uSpotAmt>0.){vec3 e=q-vec3(-.2,-.36,.91);float sd=length(e*vec3(.75,1.5,.75));float swirl=fbm(q*9.+uSeed);
      c=mix(c,uSpot,smoothstep(.26,.13,sd+swirl*.06)*uSpotAmt);c=mix(c,uA,smoothstep(.31,.26,sd)*smoothstep(.2,.26,sd)*.5);}
     return c;}
    if(uKind<2.5){float f=fbm(q*2.+uSeed);vec3 c=mix(uA,uB,smoothstep(.45,.8,f)*.6);
     float cr=1.-smoothstep(0.,.035,abs(n3(q*4.5+uSeed)-.5));float cr2=1.-smoothstep(0.,.03,abs(n3(q*9.-uSeed)-.5));return mix(c,uC,max(cr,cr2*.6)*.7);}
    if(uKind<3.5){float f=fbm(q*2.4+uSeed);vec3 c=mix(uA,uB,smoothstep(.52,.58,f));
     float cl=smoothstep(.55,.8,fbm(q*vec3(3.,6.,3.)+vec3(uTime*.02,0.,0.)-uSeed));return mix(c,uC,cl*.85);}
    return uA;}
   void main(){vec2 p=vUv/uStretch;if(uLumpy>0.){float an=atan(p.y,p.x);p/=1.+uLumpy*(n3(vec3(cos(an)*1.7,sin(an)*1.7,uSeed))-.5);}
    float r=length(p);float aa=fwidth(r)*1.2;
    vec2 ld=normalize(uLight);
    vec4 outc=vec4(0.);
    float glow=uKind>3.5?1.:.45+.55*smoothstep(-.6,.8,dot(normalize(p+1e-5),ld));
    float halo=uHaloAmt*glow*(r>1.?exp(-(r-1.)*(uKind>3.5?3.:7.)):0.);
    outc=vec4(uHalo*halo,halo);
    float ringA=0.;vec3 ringC=uRingCol;
    if(uRing.w>0.){float ca=cos(uRingAngle),sa=sin(uRingAngle);vec2 rp=vec2(p.x*ca+p.y*sa,-p.x*sa+p.y*ca);vec2 e=vec2(rp.x,rp.y/uRing.z);float rr=length(e);
     float band=smoothstep(uRing.x,uRing.x+.04,rr)*(1.-smoothstep(uRing.y-.05,uRing.y,rr));
     band*=.65+.35*sin(rr*38.)*sin(rr*11.+1.);ringA=band*uRing.w;
     ringC*=.55+.45*smoothstep(-.3,.6,dot(normalize(e+1e-5),ld));
     if(rp.y>0.&&r<1.)ringA=0.;}
    if(ringA>0.&&r>=1.)outc=vec4(mix(outc.rgb,ringC,ringA),max(outc.a,ringA));
    if(r<1.+aa){vec3 n=vec3(p,sqrt(max(0.,1.-r*r)));
     float a=uTime*uSpin;vec3 q=vec3(n.x*cos(a)-n.z*sin(a),n.y,n.x*sin(a)+n.z*cos(a));
     vec3 s=surface(q);vec3 c;
     if(uKind>3.5){c=s*(1.+.25*(1.-r));}
     else{vec3 L=normalize(vec3(ld,.35));float lam=dot(n,L);float lit=smoothstep(-.08,.45,lam);
      c=s*(uAmb+lit*1.05)*mix(.6,1.,sqrt(n.z));
      c+=uHalo*pow(1.-n.z,2.5)*uHaloAmt*.7*(.25+.75*lit);}
     float edge=1.-smoothstep(1.-aa,1.+aa*.5,r);
     outc=vec4(mix(outc.rgb,c,edge),max(outc.a,edge));
     if(ringA>0.)outc.rgb=mix(outc.rgb,ringC,ringA);}
    outc.a*=uAlpha*uStrength*smoothstep(.15,.85,uIntro);if(outc.a<.004)discard;
    gl_FragColor=outc;
    #include <colorspace_fragment>
   }`;
  function bodyOptions(name,extra){
   let base={};if(typeof name==='string')base=BODIES[name]||{};else extra=name;
   return Object.assign({kind:'rocky',colors:['#cccccc','#999999','#777777'],screen:[.8,.2],size:.08,light:[-1,.35],ambient:.07,halo:'#ffffff',haloAmount:.3,
    spin:.01,bands:5,craters:1,seed:1+bodies.length*3.7,alpha:1,parallax:0,ring:null},base,extra||{});
  }
  function applyBody(b,o){
   const u=b.material.uniforms,c=o.colors||[];
   u.uA.value.set(c[0]||'#ccc');u.uB.value.set(c[1]||c[0]||'#999');u.uC.value.set(c[2]||c[1]||c[0]||'#777');u.uHalo.value.set(o.halo);
   u.uLight.value.set(o.light[0],o.light[1]);u.uKind.value=KIND[o.kind]??0;u.uSpin.value=o.spin;u.uHaloAmt.value=o.haloAmount;u.uAmb.value=o.ambient;
   u.uBands.value=o.bands;u.uLumpy.value=o.lumpy||0;u.uSpotAmt.value=o.spot?1:0;u.uSpot.value.set(o.spot||'#c8573a');const st=o.stretch||[1,1];u.uStretch.value.set(st[0],st[1]);u.uCraters.value=o.craters;u.uSeed.value=o.seed;u.uAlpha.value=o.alpha;u.uSize.value=o.size*.5;
   const ring=o.ring;u.uRing.value.set(ring?ring.inner??1.3:0,ring?ring.outer??2.2:0,ring?ring.tilt??.3:.3,ring?ring.opacity??.8:0);
   u.uRingCol.value.set(ring&&ring.color||'#e8d8b0');u.uRingAngle.value=ring?ring.angle??0:0;
   u.uExt.value=(ring?Math.max(1.6,(ring.outer??2.2)+.1):(o.kind==='glow'?2.6:1.6))*Math.max(st[0],st[1],1)*(1+(o.lumpy||0)*.5);
   b.options=o;
  }
  function addBody(name,extra){
   const o=bodyOptions(name,extra);
   const mat=keep(new T.ShaderMaterial({uniforms:{uPos:{value:new T.Vector2()},uSize:{value:.05},uExt:{value:1.6},uAspect:{value:aspect},uZoom:{value:1},
    uA:{value:new T.Color()},uB:{value:new T.Color()},uC:{value:new T.Color()},uHalo:{value:new T.Color()},uRingCol:{value:new T.Color()},uLight:{value:new T.Vector2()},
    uKind:{value:0},uTime:time,uIntro:intro,uSpin:{value:0},uHaloAmt:{value:0},uAmb:{value:0},uBands:{value:5},uCraters:{value:1},uSeed:{value:1},uAlpha:{value:1},uStrength:strength,
    uRing:{value:new T.Vector4()},uRingAngle:{value:0},uLumpy:{value:0},uStretch:{value:new T.Vector2(1,1)},uSpot:{value:new T.Color()},uSpotAmt:{value:0}},
    vertexShader:bodyVS,fragmentShader:bodyFS,transparent:true,depthWrite:false,depthTest:true,fog:false,toneMapped:false}));
   const mesh=prepare(new T.Mesh(quad,mat),2+bodies.length);mesh.name='space-sky-body';
   const b={mesh,material:mat,options:o,
    set(more){applyBody(b,Object.assign({},b.options,more||{}));place(b);return b;},
    setVisible(v){mesh.visible=!!v;return b;},
    remove(){group.remove(mesh);const i=bodies.indexOf(b);if(i>=0)bodies.splice(i,1);mat.dispose();}};
   applyBody(b,o);bodies.push(b);place(b);return b;
  }
  function place(b){
   const o=b.options,u=b.material.uniforms;
   u.uPos.value.set(o.screen[0]*2-1-camPos.x*o.parallax,1-o.screen[1]*2-camPos.y*o.parallax*.5);u.uZoom.value=zoom;u.uAspect.value=aspect;
  }
  for(const b of(opts.bodies||[]))typeof b==='string'?addBody(b):addBody(b.preset||b.name,b);

  // --- One slow shooting star, now and then ----------------------------------------
  let meteor=null,meteorMat=null;
  const shot={next:0,t:-1,dur:2,x:0,y:0,vx:0,vy:0,len:.2};
  const rndShot=seeded(seed*7+3);
  function nextShot(){const e=shootCfg.every;shot.next=e[0]+rndShot()*(e[1]-e[0]);}
  if(shootCfg){
   const mg=keep(new T.BufferGeometry());
   mg.setAttribute('position',new T.BufferAttribute(new Float32Array([0,-1,0, 1,-1,0, 1,1,0, 0,1,0]),3));mg.setIndex([0,1,2,0,2,3]);
   meteorMat=keep(new T.ShaderMaterial({uniforms:{uHead:{value:new T.Vector2()},uTail:{value:new T.Vector2()},uWidth:{value:.009},uAlpha:{value:0},uAspect:{value:1},uCol:{value:col(shootCfg.color)}},
    vertexShader:`uniform vec2 uHead,uTail;uniform float uWidth,uAspect;varying vec2 vQ;
     void main(){vQ=position.xy;vec2 a=uTail*vec2(uAspect,1.),b=uHead*vec2(uAspect,1.);vec2 d=normalize(b-a+1e-6);vec2 n=vec2(-d.y,d.x);
      vec2 p=mix(a,b,position.x)+n*position.y*uWidth*min(1.,uAspect)*(.3+.7*position.x);p.x/=uAspect;gl_Position=vec4(p,.99999,1.);}`,
    fragmentShader:`uniform float uAlpha;uniform vec3 uCol;varying vec2 vQ;
     void main(){float a=pow(vQ.x,2.2)*(1.-vQ.y*vQ.y)*uAlpha;gl_FragColor=vec4(uCol*a,1.);
      #include <colorspace_fragment>
     }`,
    transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,fog:false,toneMapped:false}));
   meteor=prepare(new T.Mesh(mg,meteorMat),50);meteor.name='space-sky-meteor';meteor.visible=false;
   shot.next=shootCfg.first??(6+rndShot()*8);
  }
  function startShot(){
   const dir=rndShot()<.5?-1:1;shot.t=0;shot.dur=shootCfg.duration*(.85+rndShot()*.3);
   shot.x=dir>0?-.75+rndShot()*.5:.25+rndShot()*.5;shot.y=.55+rndShot()*.35;
   const ang=(.18+rndShot()*.22);shot.vx=dir*Math.cos(ang)*.55;shot.vy=-Math.sin(ang)*.55;shot.len=.16+rndShot()*.1;
   meteor.visible=true;
  }
  function stepShot(dt){
   if(!meteor)return;
   if(shot.t<0){shot.next-=dt;if(shot.next<=0&&strength.value>.2)startShot();return;}
   shot.t+=dt;const u=shot.t/shot.dur;
   if(u>=1){shot.t=-1;meteor.visible=false;nextShot();return;}
   const travel=shot.t,hx=shot.x+shot.vx*travel,hy=shot.y+shot.vy*travel,len=shot.len*Math.min(1,u*4);
   const m=meteorMat.uniforms;m.uHead.value.set(hx,hy);m.uTail.value.set(hx-shot.vx/.55*len,hy-shot.vy/.55*len);
   m.uAlpha.value=Math.sin(Math.PI*Math.min(1,u))*.85*shootCfg.amount*strength.value;
  }

  // --- Optional aurora / light veil: one soft screen-wide ribbon ---------------------
  let aurora=null,auroraMat=null;
  if(auroraCfg){
   const ag=keep(new T.PlaneGeometry(1,1,64,1));
   const c=auroraCfg.colors||['#43e0c8','#6f7dff'];
   auroraMat=keep(new T.ShaderMaterial({uniforms:{uTime:time,uA:{value:col(c[0])},uB:{value:col(c[1]||c[0])},uY:{value:auroraCfg.y??.6},uH:{value:auroraCfg.height??.28},
     uWave:{value:auroraCfg.wave??.07},uIntro:intro,uAmt:{value:auroraCfg.amount??.2},uRays:{value:auroraCfg.rays??1},uCam:{value:0},uStrength:strength},
    vertexShader:`uniform float uTime,uY,uH,uWave,uCam;varying vec2 vUV;
     void main(){float u=position.x+.5,v=position.y+.5;vUV=vec2(u,v);
      float y=uY+sin(u*5.+uTime*.12+uCam)*uWave+sin(u*11.-uTime*.09)*uWave*.4;
      gl_Position=vec4(mix(-1.15,1.15,u),y+v*uH,.99999,1.);}`,
    fragmentShader:`uniform float uIntro,uTime,uAmt,uStrength,uCam,uRays;uniform vec3 uA,uB;varying vec2 vUV;
     void main(){float u=vUV.x,v=vUV.y;
      float rays=.6+.25*sin(u*140.+sin(u*9.+uTime*.21+uCam)*4.+uTime*.3)+.15*sin(u*53.-uTime*.2);rays=mix(.75,rays,uRays);
      float a=smoothstep(0.,.18,v)*pow(1.-v,1.8)*rays*smoothstep(0.,.2,u)*smoothstep(1.,.8,u)*uAmt*uStrength*smoothstep(.3,1.,uIntro);
      gl_FragColor=vec4(mix(uA,uB,v)*a,1.);
      #include <colorspace_fragment>
     }`,
    transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,fog:false,toneMapped:false}));
   aurora=prepare(new T.Mesh(ag,auroraMat),40);aurora.name='space-sky-aurora';
  }

  // --- Optional ring arch across the sky (Saturn): one soft striped band -----------
  let arc=null,arcMat=null;const arcCfg=opts.arc?Object.assign({y:.25,rise:.35,width:.07,tilt:0,colors:['#f0dcb0','#b89a78'],opacity:.55},opts.arc):null;
  if(arcCfg){
   const ag=keep(new T.PlaneGeometry(1,1,64,1));
   arcMat=keep(new T.ShaderMaterial({uniforms:{uA:{value:col(arcCfg.colors[0])},uB:{value:col(arcCfg.colors[1]||arcCfg.colors[0])},uY:{value:arcCfg.y},uRise:{value:arcCfg.rise},uW:{value:arcCfg.width},
     uTilt:{value:arcCfg.tilt},uIntro:intro,uOp:{value:arcCfg.opacity},uAspect:{value:1},uStrength:strength,uTime:time},
    vertexShader:`uniform float uY,uRise,uW,uTilt;varying vec2 vUV;
     void main(){float u=position.x+.5,v=position.y+.5;vUV=vec2(u,v);float x=mix(-1.3,1.3,u);
      float y=uY+uRise*(1.-x*x/1.69)+uTilt*x+(v-.5)*uW*(1.-.35*abs(x));gl_Position=vec4(x,y,.99999,1.);}`,
    fragmentShader:`uniform vec3 uA,uB;uniform float uIntro,uOp,uStrength,uTime;varying vec2 vUV;
     void main(){float v=vUV.y;float stripes=.7+.2*sin(v*19.)+.1*sin(v*41.+1.3);
      float gap=1.-.75*(smoothstep(.56,.6,v)-smoothstep(.64,.68,v));
      float a=smoothstep(0.,.12,v)*smoothstep(1.,.88,v)*stripes*gap*uOp*uStrength*smoothstep(.2,.9,uIntro);
      vec3 c=mix(uB,uA,v)*(.85+.15*sin(vUV.x*40.+uTime*.05));
      gl_FragColor=vec4(c,a);
      #include <colorspace_fragment>
     }`,
    transparent:true,depthWrite:false,depthTest:true,fog:false,toneMapped:false}));
   arc=prepare(new T.Mesh(ag,arcMat),1.5);arc.name='space-sky-arc';
  }

  const scene=opts.scene;if(scene)scene.add(group);
  group.updateMatrixWorld(true);
  const drift=opts.drift??.004;

  const api={group,bodies,
   update(dt,camera){
    dt=Math.min(Math.max(dt||0,0),.1);time.value+=dt;
    if(intro.value<1&&dt>0&&introReady())intro.value=Math.min(1,intro.value+dt/introSeconds);rot.value=(rot.value+dt*drift)%(Math.PI*2);
    if(camera){lastCamera=camera;aspect=camera.aspect||aspect;zoom=camera.zoom||1;}
    if(lastCamera)camPos.copy(lastCamera.position);
    for(let i=0;i<bodies.length;i++)place(bodies[i]);
    if(auroraMat)auroraMat.uniforms.uCam.value=camPos.x*.004;
    stepShot(dt);
   },
   addBody,
   setStrength(v){strength.value=Math.max(0,v);group.visible=strength.value>.001;return api;},
   setGlow(g){setGlow(g);return api;},
   setPalette(p){if(!domeMat||!p)return api;const u=domeMat.uniforms;if(p.top)u.uTop.value.set(p.top);if(p.mid)u.uMid.value.set(p.mid);if(p.low)u.uLow.value.set(p.low);
    if(p.midY!==undefined)u.uMidY.value=p.midY;if(p.lowY!==undefined)u.uLowY.value=p.lowY;if(p.nebulaAmount!==undefined)u.uNebAmt.value=p.nebulaAmount;return api;},
   setVisible(v){group.visible=!!v;return api;},
   shootNow(){if(meteor&&shot.t<0)startShot();return api;},
   get drawCalls(){let n=0;group.traverse(o=>{if(o.visible&&(o.isMesh||o.isPoints))n++;});return n;},
   dispose(){if(group.parent)group.parent.remove(group);for(const d of disposables)d.dispose&&d.dispose();bodies.length=0;}
  };
  return api;
 };
})(window.MARS);
