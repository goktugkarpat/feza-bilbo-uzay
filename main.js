(function(M){
 'use strict';
 const T=THREE,$=id=>document.getElementById(id),Q=new URLSearchParams(location.search);
 const canvas=$('game'), scene=new T.Scene(),camera=new T.PerspectiveCamera(34,innerWidth/innerHeight,.15,1500);
 let renderer,world,actors,activities,footprints,discoveries,guide,phase='loading',time=0,prev=0,renderSlot=0,lastDisplayTick=0,displayPeriod=0,perfT=0,perfVisible=Q.has('fps')||Q.has('perf'),frameAvg=0,jumpBuffer=0,coyote=0,jumpHeld=false;
 // Last 120 drawn frames in fixed buffers: MARS.perf() and the ?perf corner meter read them without allocating per frame.
 const PERF_N=120,perfGap=new Float32Array(PERF_N),perfCpu=new Float32Array(PERF_N);let perfIdx=0,perfCount=0;
 // ?perf also splits our CPU time per part (activities, world, characters, guide, render submit).
 const perfParts=Q.has('perf'),partMs=new Float64Array(5);let partFrames=0;
 const meter=$('performance');
 meter.classList.toggle('hidden',!perfVisible);
 const player={x:8,y:0,vx:0,vy:0,grounded:true,facing:1,mode:'idle',locked:false},dog={x:5.4,y:0,vx:0,vy:0,grounded:true,facing:1,mode:'idle',locked:false};
 const state={player,dog,celebrate:0,rover:false,activity:null},pathActors=[player,dog];
 Object.assign(M,{scene,camera,player,dog,state});
 M.frameActivity=function(minX,maxX,y,maxZoom=.94){
  if(workshop.life>0){
   minX=Math.min(minX,workshop.x-1.15,player.x-1.15);
   maxX=Math.max(maxX,workshop.x+1.15,player.x+1.15);
   if(Number.isFinite(workshop.dogX)){
    minX=Math.min(minX,workshop.dogX-1.3,dog.x-1.3);
    maxX=Math.max(maxX,workshop.dogX+1.3,dog.x+1.3);
   }
  }
  // Portrait is narrow: frame the game itself tightly (the flag may sit at the edge) so the
  // objects a child touches stay large. Landscape keeps the flag and wider margins.
  const portrait=innerWidth<innerHeight,marker=portrait?null:M.guide?.frameBounds();if(marker){minX=Math.min(minX,marker.minX);maxX=Math.max(maxX,marker.maxX);}
  const width=portrait?Math.max(6,maxX-minX+1.1):Math.max(8,maxX-minX+1.8);
  const visible=2*camera.position.z*Math.tan(camera.fov*Math.PI/360)*camera.aspect;
  M.setCameraTarget((minX+maxX)/2,y,Math.min(portrait?maxZoom*1.3:maxZoom,visible/width),1);
 };
 const keys=new Set(),pointers=new Map(),raycaster=new T.Raycaster(),ndc=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,0,1),0),hit=new T.Vector3();
 let viewportWidth=0,viewportHeight=0,displayDensity=0,densityQuery=null;
 let tabletPixels=1450000,windowTime=0,windowFrames=0,lateFrames=0,timelyFrames=0,slowWindows=0;
 let steer=0,activeWalk=null,jumpWalkId=null,jumpWalkAt=0,cameraX=11,cameraY=2.2,lookX=11,lookY=2.2,cameraZoom=1,resizeNeeded=true,landedAt=-10,headBob=0,endingShown=false,endingDelay=0,endingDuration=0;
 const workshop={life:0,x:0,dogX:null,z:1.45,facing:1};
 // A quiet step to the side keeps the actual child and the touched object visible.
 // Normal walking and jumping immediately take precedence over the suggestion.
 M.parkForActivity=function(x,dogX=null,facing=1){
  if(phase!=='play'||player.locked||!player.grounded||activeWalk!==null||
     keys.has('ArrowLeft')||keys.has('ArrowRight')||keys.has('KeyA')||keys.has('KeyD')||
     Math.abs(x-player.x)>3.8)return;
  // Passing a workshop must never pull the child back across its equipment.
  workshop.x=x;workshop.dogX=dogX;workshop.facing=facing;workshop.life=.18;
 };
 const particles=[],particleGeo=new T.BufferGeometry(),particlePos=new Float32Array(128*3),particleCol=new Float32Array(128*3),particleSizes=new Float32Array(128);
 particleGeo.setAttribute('position',new T.BufferAttribute(particlePos,3));particleGeo.setAttribute('color',new T.BufferAttribute(particleCol,3));particleGeo.setAttribute('aSize',new T.BufferAttribute(particleSizes,1));
 for(let i=0;i<128;i++)particles.push({life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,max:1});
 const particleMat=new T.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,uniforms:{uRatio:{value:1}},vertexShader:'attribute float aSize; varying vec3 vColor; uniform float uRatio; void main(){vColor=color;vec4 v=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uRatio*(160./max(1.,-v.z));gl_Position=projectionMatrix*v;}',fragmentShader:'varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.06,d);if(a<.01)discard;gl_FragColor=vec4(vColor,a*.8);}',blending:T.AdditiveBlending});
 const points=new T.Points(particleGeo,particleMat);points.frustumCulled=false;points.visible=false;scene.add(points);
 M.celebrate=function(x,y){points.visible=true;if(!Number.isFinite(x))x=player.x;if(!Number.isFinite(y))y=player.y+1;let count=0;for(const p of particles){if(p.life>0)continue;p.x=x;p.y=y;p.z=.5;p.max=p.life=1.3+Math.random()*.7;const a=Math.random()*Math.PI*2,s=1+Math.random()*2;p.vx=Math.cos(a)*s;p.vy=1+Math.random()*3;p.vz=(Math.random()-.5)*1.2;if(++count>=24)break;}state.celebrate=1;};
 function clearInput(){guide?.clearContact();keys.clear();discoveries?.pointer?.('cancel',hit,null);if(activities)activities.pointer('cancel',hit,null);for(const id of pointers.keys()){try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}catch(_){}}pointers.clear();activeWalk=null;steer=0;jumpWalkId=null;jumpHeld=false;jumpBuffer=0;$('jump-button').classList.remove('pressed');}
 function setPhase(p){
  phase=p;prev=renderSlot=lastDisplayTick=displayPeriod=0;resetPacingWindow();perfIdx=perfCount=0;perfT=0;partFrames=0;partMs.fill(0);
  $('hud').classList.toggle('hidden',p!=='play');
  $('pause').classList.toggle('hidden',p!=='pause');
  $('ending').classList.toggle('hidden',p!=='ending');
  M.audio?.setPaused(p==='pause');clearInput();
  if(p!=='play')actors?.resetGreeting?.();
  const focus=p==='pause'?$('resume'):p==='ending'?$('end-home'):canvas;
  focus.focus({preventScroll:true});
  requestFrame();
 }
 let startedAt=0,disposed=false,photoAt=Infinity,hasPhoto=false,scheduledFrame=0,ready=false,graphicsLost=false,graphicsEpoch=0,familyPhotoHost=null;
 // The postcard is copied once, while the current WebGL frame is valid.
 // It lives only in this expedition and needs neither readPixels nor storage.
 M.keepPhoto=function(source){
   if(disposed||graphicsLost||hasPhoto||!source?.width||!source.height)return;
   const target=$('souvenir'),ctx=target.getContext('2d');if(!ctx)return;
   const ratio=1.56,sw=Math.min(source.width,source.height*ratio),sh=sw/ratio;
   target.width=Math.min(648,Math.round(sw));target.height=Math.round(target.width/ratio);
   try{ctx.drawImage(source,(source.width-sw)/2,(source.height-sh)*.47,sw,sh,0,0,target.width,target.height);}catch(_){return;}
   target.parentElement.hidden=false;hasPhoto=true;photoAt=Infinity;
 };

 // A child may fly home while the celebration is still framing the souvenir.
 // A WebGL backbuffer can clear between paints, so draw once before copying it.
 function createFamilyPhoto(){
  if(!['neptune','jupiter','venus'].includes(M.planet)||typeof M.createFamilyPostcard!=='function'||typeof M.createFamilyPostcardHost!=='function')return;
  const postcard=M.createFamilyPostcard({scene,getActors:()=>actors,getRenderer:()=>renderer,getWorld:()=>world,onReady:()=>{}});
  familyPhotoHost=M.createFamilyPostcardHost({postcard,isAlive:()=>ready&&!disposed&&!graphicsLost,accept:film=>{M.keepPhoto(film);return hasPhoto;},maxAttempts:2,retryDelayMs:180,maxWaitMs:1800});
 }
 function prepareFamilyPhoto(){
  if(!familyPhotoHost||disposed)return Promise.resolve(false);
  // A failed or interrupted warm readback must not hold the loader forever.
  return new Promise(resolve=>{let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);resolve(!!ok);},timer=setTimeout(()=>finish(false),1800);familyPhotoHost.prepare(renderer).then(finish,()=>finish(false));});
 }
 function captureScheduledPhoto(){
  if(disposed||graphicsLost||hasPhoto||time<photoAt)return;
  if(!familyPhotoHost){M.keepPhoto(canvas);return;}
  const photo=familyPhotoHost.state();
  if(photo.phase==='failed'){M.keepPhoto(canvas);photoAt=Infinity;}
  else if(!photo.pending)void familyPhotoHost.capture();
 }
 function maybeShowEnding(){
  if(!endingShown||endingDelay!==0||disposed||graphicsLost)return;
  if(!familyPhotoHost||hasPhoto||familyPhotoHost.state().phase==='failed')setPhase('ending');
 }
 M.captureDeparturePhoto=async function(){
  if(hasPhoto)return true;
  if(!endingShown||!ready||disposed||graphicsLost)return false;
  if(familyPhotoHost&&await familyPhotoHost.capture())return true;
  if(disposed||graphicsLost)return false;
  renderer.render(scene,camera);M.keepPhoto(canvas);return hasPhoto;
 };
 function start(){setPhase('play');if(navigator.userActivation?.hasBeenActive)M.audio.start();startedAt=time;M.notify(M.destination.welcome,4);M.setHint('Ekranın sağına basılı tut. Birlikte keşfedelim!');canvas.focus();}
 M.shutdown=function(){if(disposed)return;disposed=true;cancelAnimationFrame(scheduledFrame);scheduledFrame=0;clearInput();guide?.dispose();familyPhotoHost?.dispose();try{activities?.dispose?.();}catch(e){console.warn('Keşif kaynakları bırakılırken',e);}M.audio.close();densityQuery?.removeEventListener('change',onDensityChange);if(renderer){renderer.dispose();renderer.forceContextLoss();}};
 function reset(){M.shutdown();location.reload();}
 function pause(){if(disposed||graphicsLost)return;if(phase==='play')setPhase('pause');else if(phase==='pause')setPhase('play');}
 function jump(){if(disposed||phase!=='play'||graphicsLost)return;M.audio.start();if(player.locked){activities?.jump?.();return;}jumpBuffer=.20;jumpHeld=true;}
 function uiAction(id,fn){$(id).addEventListener(id==='jump-button'?'pointerdown':'click',e=>{e.preventDefault();e.stopPropagation();fn(e);});}
 uiAction('pause-button',pause);uiAction('resume',()=>setPhase('play'));uiAction('restart',reset);uiAction('again',reset);uiAction('home-button',M.dock);uiAction('pause-home',M.dock);uiAction('end-home',M.dock);
 uiAction('jump-button',e=>{jump();jumpWalkId=e.pointerId;jumpWalkAt=performance.now();$('jump-button').classList.add('pressed');try{e.target.setPointerCapture(e.pointerId);}catch(_){};});
 // Keyboard and assistive switches activate buttons through click, without a pointer.
 $('jump-button').addEventListener('click',e=>{if(e.detail===0){jump();jumpHeld=false;}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])$('jump-button').addEventListener(type,()=>{jumpHeld=false;jumpWalkId=null;if(activeWalk==='jump'){activeWalk=null;steer=0;}$('jump-button').classList.remove('pressed');});
 function soundToggle(){M.audio.setMuted(!M.muted);M.rememberPreference('muted',M.muted);updateSound();}function updateSound(){const toggle=$('sound-toggle');toggle.textContent=M.muted?'Kapalı':'Açık';toggle.setAttribute('aria-pressed',String(!M.muted));}
 uiAction('captions-toggle',()=>M.setCaptions(!M.captions));
 uiAction('sound-toggle',soundToggle);updateSound();

 addEventListener('keydown',e=>{if(disposed||graphicsLost)return;
  if(e.code==='Tab'&&(phase==='pause'||phase==='ending')){
   const buttons=$(phase==='pause'?'pause':'ending').querySelectorAll('button');
   const first=buttons[0],last=buttons[buttons.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   return;
  }
  if(e.code!=='Escape'&&e.target.closest?.('button')&&(phase!=='play'||e.code==='Enter'||e.code==='Space'))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyW','KeyA','KeyD','KeyE','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape'){pause();return;}if(e.code==='Period'){perfVisible=!perfVisible;meter.classList.toggle('hidden',!perfVisible);perfT=0;return;}if(phase!=='play')return;
  if(!e.repeat&&activities?.keyDown?.(e.code)){M.audio.start();e.preventDefault();return;}
  if(!e.repeat&&['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code))M.audio.start();if(!e.repeat&&(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'))jump();if(!e.repeat&&e.code==='KeyE'){M.audio.start();if(!discoveries?.interact())activities?.interact();}keys.add(e.code);});
 addEventListener('keyup',e=>{keys.delete(e.code);if(['Space','ArrowUp','KeyW'].includes(e.code))jumpHeld=false;});
 function worldPoint(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(ndc,camera);raycaster.ray.intersectPlane(plane,hit);return hit;}
 canvas.addEventListener('pointerdown',e=>{if(disposed||phase!=='play'||graphicsLost||e.button>0)return;e.preventDefault();M.audio.start();const p=worldPoint(e);guide?.noticeInput();const discovery=discoveries?.pointer?discoveries.pointer('down',p,e):discoveries?.touch(p);const activity=!discovery&&activities?.pointer('down',p,e);const teaching=!discovery&&!activity&&guide?.pointer('down',p);const used=discovery||activity||teaching;if(discovery||activity)guide?.feedback(p,e.pointerId);pointers.set(e.pointerId,{used,activity,discovery});try{canvas.setPointerCapture(e.pointerId);}catch(_){}if(!used&&activeWalk===null){activeWalk=e.pointerId;steer=p.x>=player.x?1:-1;}});
 canvas.addEventListener('pointermove',e=>{if(disposed||phase!=='play'||graphicsLost)return;const q=pointers.get(e.pointerId);if(!q)return;if(q.discovery||q.activity)guide?.moveContact(worldPoint(e),e.pointerId);if(q.discovery)discoveries?.pointer?.('move',worldPoint(e),e);else if(q.activity)activities?.pointer('move',worldPoint(e),e);else if(activeWalk===e.pointerId){const p=worldPoint(e),dx=p.x-player.x;steer=Math.abs(dx)<.3?0:Math.sign(dx);}});
 // Automatic help after a long pause: one gentle touch along the demo path, like a parent's finger.
 function autoTouch(points){if(disposed||phase!=='play'||!points.length)return false;const e={pointerId:-77,pointerType:'touch',button:0,isPrimary:true,clientX:0,clientY:0,preventDefault(){},stopPropagation(){}},first=points[0],last=points[points.length-1];const d=discoveries?.pointer?discoveries.pointer('down',first,e):discoveries?.touch?.(first);const a=!d&&activities?.pointer('down',first,e);if(!d&&!a)return false;for(let i=1;i<points.length;i++){if(d)discoveries?.pointer?.('move',points[i],e);else activities.pointer('move',points[i],e);}if(d)discoveries?.pointer?.('up',last,e);else activities.pointer('up',last,e);return true;}
 function pointerEnd(e,type){const q=pointers.get(e.pointerId);if(q?.discovery||q?.activity)guide?.releaseContact(worldPoint(e),e.pointerId,type==='cancel');if(q?.discovery)discoveries?.pointer?.(type,worldPoint(e),e);else if(q?.activity)activities?.pointer(type,worldPoint(e),e);pointers.delete(e.pointerId);if(activeWalk===e.pointerId){activeWalk=null;steer=0;}}
 canvas.addEventListener('pointerup',e=>pointerEnd(e,'up'));canvas.addEventListener('pointercancel',e=>pointerEnd(e,'cancel'));canvas.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))pointerEnd(e,'cancel');});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{clearInput();prev=renderSlot=lastDisplayTick=displayPeriod=0;resetPacingWindow();if(!document.hidden)requestFrame();});addEventListener('resize',queueResize);
 function queueResize(){
  const dimensionsChanged=innerWidth!==viewportWidth||innerHeight!==viewportHeight;
  if(!dimensionsChanged&&(devicePixelRatio||1)===displayDensity)return;
  if(dimensionsChanged)clearInput();
  resizeNeeded=true;requestFrame();
 }
 function onDensityChange(){watchDisplayDensity();queueResize();}
 function watchDisplayDensity(){
  densityQuery?.removeEventListener('change',onDensityChange);
  densityQuery=matchMedia('(resolution: '+(devicePixelRatio||1)+'dppx)');
  densityQuery.addEventListener('change',onDensityChange);
 }
 watchDisplayDensity();
 // The tablet budget is expressed in physical pixels, including larger iPad Pro screens.
 // DOM controls and the keepsake photo keep their own native resolutions.
 function resize(force=false){
  const width=Math.max(1,innerWidth),height=Math.max(1,innerHeight);
  const maxDensity=M.device.tablet?Math.min(1.25,Math.sqrt(tabletPixels/(width*height))):1.75;
  displayDensity=devicePixelRatio||1;
  const dpr=Math.min(displayDensity,maxDensity);
  resizeNeeded=false;
  if(!force&&width===viewportWidth&&height===viewportHeight&&dpr===renderer.getPixelRatio())return false;
  viewportWidth=width;viewportHeight=height;
  resetPacingWindow();
  renderer.setDrawingBufferSize(width,height,dpr);
  camera.aspect=width/height;applyViewShift(width,height);camera.updateProjectionMatrix();
  particleMat.uniforms.uRatio.value=dpr;
  return true;
 }
 // A tablet may temporarily reclaim its graphics context when another app opens.
 // Keep the mission and both explorers still until their current view is back.
 function onGraphicsLost(event){
  event.preventDefault();
  if(disposed)return;
  graphicsLost=true;graphicsEpoch++;cancelAnimationFrame(scheduledFrame);scheduledFrame=0;
  clearInput();familyPhotoHost?.suspend();M.audio.setPaused(true);
  $('loading').classList.remove('fading');$('loading').classList.add('recovering');
  $('loading').classList.remove('hidden');
  $('destination-title').textContent=M.destination.label;
  progress(70,'Uzay manzarası geri geliyor…');
 }
 async function onGraphicsRestored(){
  if(disposed)return;
  if(!ready){location.reload();return;}
  const restoredEpoch=graphicsEpoch;
  resize(true);cameraUpdate(0);
  // Let activity/photo context-restored listeners invalidate their former targets first.
  await Promise.resolve();if(disposed||restoredEpoch!==graphicsEpoch)return;
  // The new context has no programs. Cover hidden activity materials before play resumes.
  try{await renderer.compileAsync(scene,camera);}catch(e){console.warn('Yenilenen ışıklar hazırlanamadı',e);}
  if(disposed||restoredEpoch!==graphicsEpoch)return;
  guide?.prepare(renderer);
  const restoredViewport=renderer.getViewport(new T.Vector4());renderer.setViewport(0,0,80,60);
  try{guide?.warm(renderer,camera);}finally{renderer.setViewport(restoredViewport);}
  renderer.render(scene,camera);
  try{await activities.prepare?.(renderer,camera);}catch(e){console.warn('Yenilenen hatıra hazırlığı tamamlanamadı',e);}
  if(disposed||restoredEpoch!==graphicsEpoch)return;
  if(familyPhotoHost){await prepareFamilyPhoto();if(disposed||restoredEpoch!==graphicsEpoch)return;}
  graphicsLost=false;prev=renderSlot=lastDisplayTick=displayPeriod=0;
  $('loading').classList.remove('recovering');$('loading').classList.add('hidden');
  M.audio.setPaused(phase==='pause');
  if(phase==='play')canvas.focus({preventScroll:true});
  requestFrame();
 }
 function groundAt(x){return world.ground(M.clamp(x,1,world.length-1));}
 // A quick tap clears every 2.1 m optional ledge; holding adds a gentle extra float.
 // Analytic vertical integration keeps the arc consistent at 60, 120 and 200 Hz.
 function physics(dt){
  workshop.life=Math.max(0,workshop.life-dt);
  const input=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)||steer;
  jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=player.grounded?.17:Math.max(0,coyote-dt);
  if(!player.locked){
   const ice=world.isIce&&world.isIce(player.x),speed=ice?4.9:4.25;
   const parked=workshop.life>0&&!input&&player.grounded;
   const walking=parked?M.clamp((workshop.x-player.x)*4,-2.75,2.75):input*speed;
   player.vx=M.damp(player.vx,walking,player.grounded?(ice&&!parked?3.4:14):4.5,dt);
   if(input)player.facing=input>0?1:-1;else if(parked)player.facing=Math.abs(workshop.x-player.x)>.05?Math.sign(workshop.x-player.x):workshop.facing;
   if(jumpBuffer>0&&coyote>0){player.vy=6.1;player.grounded=false;jumpBuffer=coyote=0;learnedJump=true;M.sfx('jump');}
   const wasY=player.y,wasGrounded=player.grounded;player.x=M.clamp(player.x+player.vx*dt,2,world.length-3);const gravity=player.vy>0&&!jumpHeld?6.2:5.3;player.y+=player.vy*dt-.5*gravity*dt*dt;player.vy-=gravity*dt;
   let floor=groundAt(player.x);
   if(player.vy<=0&&world.platforms)for(const q of world.platforms){if(Math.abs(player.x-q.x)<q.w*.5+.18&&wasY>=q.y-.015&&player.y<=q.y)floor=Math.max(floor,q.y);}
   if(player.vy<=0&&(player.y<=floor||(wasGrounded&&Math.abs(wasY-floor)<.28))){const falling=player.vy;if(!player.grounded&&falling<-2.1){landedAt=time;M.sfx('land');}player.y=floor;player.vy=0;player.grounded=true;}else player.grounded=false;
   player.mode=!player.grounded?'jump':Math.abs(player.vx)>.18?'walk':'idle';
  }
  if(!dog.locked){
   const parked=workshop.life>0&&Number.isFinite(workshop.dogX);
   let target=parked?workshop.dogX:Number.isFinite(dog.activityTargetX)?dog.activityTargetX:player.x-player.facing*2.2,stopRadius=parked?.12:.6;
   if(!Number.isFinite(dog.activityTargetX)&&player.grounded&&world.platforms)for(const q of world.platforms){if(Math.abs(player.x-q.x)<q.w*.5&&Math.abs(player.y-q.y)<.12&&dog.y>q.y-.22){target=M.clamp(target,q.x-q.w*.5+.65,q.x+q.w*.5-.65);stopRadius=.12;break;}}
   const dx=target-dog.x,doing=Number.isFinite(dog.activityTargetX)&&Math.abs(dx)<.55;
   dog.vx=M.damp(dog.vx,Math.abs(dx)>stopRadius?M.clamp(dx*2.2,-6.2,6.2):0,8,dt);dog.x=M.clamp(dog.x+dog.vx*dt,1,world.length-1);if(Math.abs(dog.vx)>.1)dog.facing=Math.sign(dog.vx);if(parked&&Math.abs(dx)<.3&&Math.abs(dog.vx)<.4)dog.facing=workshop.facing;
   let floor=groundAt(dog.x);const oldDogY=dog.y;if(player.vy>3&&dog.grounded&&!doing&&Math.abs(dx)<5){dog.vy=5.45;dog.grounded=false;}dog.y+=dog.vy*dt-.5*5.3*dt*dt;dog.vy-=5.3*dt;if(dog.vy<=0&&world.platforms)for(const q of world.platforms){if(Math.abs(dog.x-q.x)<q.w*.5+.12&&oldDogY>=q.y-.015&&dog.y<=q.y)floor=Math.max(floor,q.y);}if(dog.vy<=0&&dog.y<=floor){dog.y=floor;dog.vy=0;dog.grounded=true;}else dog.grounded=false;
   dog.mode=doing?(dog.activityMode||'dig'):!dog.grounded?'jump':Math.abs(dog.vx)>.2?'walk':'idle';
  }
 }
 // The walking bypass passes in front of the thin overhanging hop ledges.
 // A jump moves back over the actual cap before landing; x/y physics stay exact.
 function pathDepth(dt){
  if(!world.platforms)return;
  for(const a of pathActors){if(a.locked)continue;let under=false,supported=false;for(const q of world.platforms){const dx=Math.abs(a.x-q.x);if(dx<q.w*.5+.18&&a.y>=q.y-.08&&a.y<q.y+.3)supported=true;if(dx<q.w*.5+2.1&&a.y<q.y-.16)under=true;}
   // The two moon outposts have working benches behind a clear front walkway.
   const frontWalk=M.planet==='jupiter'||M.planet==='venus',baseDepth=frontWalk?(a===dog?1.05:.95):(a===dog?.3:0);
   const target=workshop.life>0?workshop.z:under&&!supported?Math.max(1.15,baseDepth):baseDepth;a.z=M.damp(a.z??baseDepth,target,13,dt);
  }
 }
 function particlesUpdate(dt){if(!points.visible||dt<=0)return;let active=0;for(let i=0;i<particles.length;i++){const p=particles[i];p.life=Math.max(0,p.life-dt);if(p.life){active++;p.vy-=1.1*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;particlePos[i*3]=p.x;particlePos[i*3+1]=p.y;particlePos[i*3+2]=p.z;const a=p.life/p.max;particleCol[i*3]=a*.9;particleCol[i*3+1]=a;particleCol[i*3+2]=a*.68;particleSizes[i]=1.3*a;}else particleSizes[i]=0;}points.visible=active>0;if(!active)return;particleGeo.attributes.position.needsUpdate=true;particleGeo.attributes.color.needsUpdate=true;particleGeo.attributes.aSize.needsUpdate=true;}
 // Portrait iPad: the walking view is zoomed in so the children stay large. Planet-specific
 // camera requests keep their tuned zoom; activity framing still fits the game's width.
 const PORTRAIT_ZOOM=1.38;
 // Portrait screens are tall: a small lens shift lowers the ground line so the sky and
 // the activity get the room, instead of a wide empty strip of ground under the explorers.
 const PORTRAIT_LIFT=.1;
 function applyViewShift(width,height){if(width<height)camera.setViewOffset(width,height,0,-Math.round(height*PORTRAIT_LIFT),width,height);else if(camera.view&&camera.view.enabled)camera.clearViewOffset();}
 // Shared, allocation-free visibility test for planet scripts: skip animating props that are
 // off-screen. x range on the walking plane (z≈0); margin in metres covers depth and motion.
 M.inView=function(minX,maxX=minX,margin=3){
  const half=camera.position.z*Math.tan(camera.fov*Math.PI/360)*camera.aspect/Math.max(.2,camera.zoom);
  return maxX>=camera.position.x-half-margin&&minX<=camera.position.x+half+margin;
 };
 function cameraUpdate(dt){
  let tx=innerWidth<innerHeight?M.clamp((player.x+dog.x)*.5+player.facing*.95,player.x-2,player.x+2):player.x+2+M.clamp(player.vx*.5,-1.5,1.5),ty=groundAt(player.x)+2.2+Math.max(0,player.y-groundAt(player.x))*.28;
  
  const rq=M.cameraRequest;if(rq.life>0){rq.life-=dt;tx=M.lerp(tx,rq.x,M.clamp(rq.weight,0,1));ty=M.lerp(ty,rq.y,M.clamp(rq.weight,0,1));cameraZoom=M.damp(cameraZoom,rq.zoom,3,dt);}else cameraZoom=M.damp(cameraZoom,innerWidth<innerHeight?PORTRAIT_ZOOM:1,3,dt);
  const walkIntent=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)+(activeWalk!==null?steer:0);
  if(phase==='play'&&!player.locked&&walkIntent*player.vx>.01)tx=walkIntent>0?Math.max(tx,cameraX):Math.min(tx,cameraX);
  cameraX=M.damp(cameraX,tx,3.5,dt);cameraY=M.damp(cameraY,ty,3.6,dt);camera.position.set(cameraX,cameraY+2.8,innerWidth<innerHeight?28:16);if(Math.abs(camera.zoom-cameraZoom)>.00001){camera.zoom=cameraZoom;camera.updateProjectionMatrix();}camera.lookAt(cameraX,cameraY,0);
 }
 let showFirstSteps=M.device.tablet||matchMedia('(pointer:coarse)').matches;
 const walkGuide=$('walk-guide');
 let learnedWalk=false,walkStartX=NaN;
 let hintClock=0,zoneLast='',learnedJump=false,jumpPrompt=false;
 const obsoleteSpokenHints=new Set(['robot','ringsScout','windRide','windChoice','observatory']);
 const welcomeCue=M.destination.welcomeCue||(M.planet==='mars'?'arrival':M.planet==='saturn'?'ringsHello':'windHello');
 function narratorCue(activity){
   // A richer expedition owns its current physical instruction; old coordinates
   // must not announce the wrong game after the route has been extended.
   if(typeof activity.cue==='string')return activity.cue;
   const x=player.x,entry=time-startedAt<7||(x<12&&!M.audio.hasSpoken(welcomeCue));
   if(M.planet!=='mars'&&x<12&&!learnedWalk){
     return entry?welcomeCue:'walk';
   }
   if(M.planet==='saturn'){
     if(entry&&x<22)return 'ringsHello';
     if(!activity.tasks[0]&&Math.abs(x-34)<9)return 'ringsHarp';
     if(!activity.tasks[1]&&Math.abs(x-88)<10)return 'ringsScout';
     if(activity.tasks[0]&&activity.tasks[1]&&!activity.finished&&Math.abs(x-132)<9)return 'ringsPhoto';
     return '';
   }
   if(M.planet==='neptune'){
     if(entry&&x<22)return 'windHello';
     if(activity.ride==='choice')return 'windChoice';
     if(!activity.tasks[0]&&x>19&&x<42)return 'windGarden';
     if(!activity.tasks[1]&&activity.ride==='ready'&&Math.abs(x-64)<9)return 'windRide';
     return '';
   }
   if(activity.finished)return 'finale';
   if(entry&&x<26)return 'arrival';
   if(x<18)return 'walk';
   if(x<55)return 'jump';
   if(Math.abs(x-70)<17&&activity.robot==='search')return M.audio.hasSpoken('radar')?'dig':'radar';
   if(Math.abs(x-182)<17)return activity.rover==='build'?'build':activity.rover==='ready'?'drive':'';
   if(Math.abs(x-300)<17)return 'slide';
   if(x>430&&activity.tasks.every(Boolean))return 'observatory';
   return '';
 }
 function update(dt){
  if(phase==='play')time+=dt;
  // A child holding the big jump button in the bottom-right corner wants to go right: jump once, then walk.
  if(phase==='play'&&jumpWalkId!==null&&activeWalk===null&&performance.now()-jumpWalkAt>350){activeWalk='jump';steer=1;}
  if(phase==='play'){
   const n=Math.max(1,Math.ceil(dt/.012));for(let i=0;i<n;i++)physics(dt/n);
   if(walkStartX!==walkStartX)walkStartX=player.x;
   if(!learnedWalk&&Math.abs(player.x-walkStartX)>.45)learnedWalk=true;
   if(showFirstSteps){
    if(learnedWalk||player.locked||time-startedAt>18){
     walkGuide.hidden=true;showFirstSteps=false;
    }else{
     const shouldHide=!player.grounded||time-startedAt<=3.2;
     if(walkGuide.hidden!==shouldHide)walkGuide.hidden=shouldHide;
    }
   }else{
    // After a finished game, a still child sees the same "hold right" picture again.
    const wantWalk=!!guide?.state?.().walkHint;
    if(walkGuide.hidden===wantWalk)walkGuide.hidden=!wantWalk;
   }
   let pt=perfParts?performance.now():0;activities.update(dt,time);if(discoveries)discoveries.update(dt,time);if(perfParts){const n=performance.now();partMs[0]+=n-pt;}pathDepth(dt);const shouldPrompt=M.planet==='mars'&&!learnedJump&&player.x>24&&player.x<55;if(shouldPrompt!==jumpPrompt){jumpPrompt=shouldPrompt;$('jump-button').classList.toggle('show-how',jumpPrompt);}const activityState=activities.state();state.activity=activityState.active||null;state.completed=activityState.finished;state.rover=player.mode==='ride';state.celebrate=Math.max(0,state.celebrate-dt*.7);
   const spokenCue=narratorCue(activityState);M.audio.setCue(obsoleteSpokenHints.has(spokenCue)?'':spokenCue);M.audio.update();
   const zone=world.zone?world.zone(player.x):M.destination.label;if(zone!==zoneLast){$('zone-name').textContent=({kamp:'İniş kampı',kanyon:'Kızıl kanyon',kumlar:'Rüzgâr vadisi',buz:'Mavi buz mağarası',geçit:'Kanyon geçidi',gözlemevi:'Yıldız gözlemevi'})[zone]||zone;zoneLast=zone;}
   hintClock+=dt;if(M.planet==='mars'&&hintClock>3){hintClock=0;if(player.x<30)M.setHint(player.x<15?'Sağa doğru basılı tut. Bilbo peşinden gelir!':'Büyük oka dokun: Mars’ta daha yükseğe zıpla!');}
   if(!endingShown&&activityState.finished){endingShown=true;endingDuration=Number.isFinite(activityState.endingDelay)?M.clamp(activityState.endingDelay,2,16):(M.planet==='mars'?7:M.planet==='neptune'?6.8:3.5);endingDelay=endingDuration;if(!hasPhoto)photoAt=time+(Number.isFinite(activityState.endingPhotoDelay)?M.clamp(activityState.endingPhotoDelay,.5,endingDuration-.2):(M.planet==='mars'?1.65:1.9));}if(endingDelay>0){
     if(M.planet==='neptune'&&!activityState.finaleComplete){
       // Open the framing with the rising balloon so the children and the
       // unfurling pennant stay in the same shot.
       const u=1-endingDelay/endingDuration,lift=u*u*(3-2*u);
       M.setCameraTarget((player.x+world.finaleX)*.5,groundAt(world.finaleX)+2.8+3.1*lift,1-.30*lift,.93);
     }
     endingDelay=Math.max(0,endingDelay-dt);
   }
   maybeShowEnding();
  }
  const animDt=phase==='play'?dt:0;
  let pt=perfParts?performance.now():0;world.update(animDt,time,state);if(perfParts){const n=performance.now();partMs[1]+=n-pt;pt=n;}player.wind=dog.wind=world.weather?world.weather.intensity:0;M.audio.setWeather(player.wind);actors.feza.root.position.set(player.x,player.y,player.z||0);actors.bilbo.root.position.set(dog.x,dog.y,dog.z??.3);actors.update(animDt,time,state);if(perfParts){const n=performance.now();partMs[2]+=n-pt;pt=n;}activities.afterActors?.();if(footprints)footprints.update(animDt,time,state);particlesUpdate(animDt);cameraUpdate(animDt);if(phase==='play'){if(perfParts)pt=performance.now();guide?.update(animDt,time);if(perfParts)partMs[3]+=performance.now()-pt;if(!showFirstSteps){const hideWalk=endingShown||!guide?.state().walkHint;if(walkGuide.hidden!==hideWalk)walkGuide.hidden=hideWalk;}}
 }
 function resetPacingWindow(){
  windowTime=0;windowFrames=0;lateFrames=0;timelyFrames=0;slowWindows=0;
 }
 // Two consecutive slow windows can lower just the 3D pixel workload. A lone
 // hitch, a resize or an OS-limited 30 Hz callback must not soften the picture.
 // Keep this budget for the rest of the visit to avoid repeated reallocations.
 function checkTabletPacing(elapsed){
  const minimumPixels=1020000;
  if(tabletPixels<=minimumPixels||time-startedAt<2)return;
  if(elapsed>.16){resetPacingWindow();return;}
  windowTime+=elapsed;windowFrames++;
  if(elapsed>.0215)lateFrames++;
  if(elapsed<.029)timelyFrames++;
  if(windowTime<2.5)return;
  const belowTarget=windowFrames<55*windowTime&&lateFrames>windowFrames*.12&&timelyFrames>windowFrames*.12;
  slowWindows=belowTarget?slowWindows+1:0;
  windowTime=0;windowFrames=0;lateFrames=0;timelyFrames=0;
  if(slowWindows<2)return;
  slowWindows=0;
  const currentPixels=canvas.width*canvas.height;
  const nextBudget=Math.max(minimumPixels,Math.round(Math.min(tabletPixels,currentPixels)*.84));
  if(currentPixels>nextBudget*1.025){
   tabletPixels=nextBudget;resizeNeeded=true;
  }
 }
 function requestFrame(){
  if(ready&&!scheduledFrame&&!disposed&&!graphicsLost&&!document.hidden)scheduledFrame=requestAnimationFrame(frame);
 }
 function frame(stamp){
  scheduledFrame=0;
  if(disposed||graphicsLost||document.hidden){prev=renderSlot=lastDisplayTick=displayPeriod=0;return;}
  if(phase!=='play'){
   if(resizeNeeded&&resize()){cameraUpdate(0);renderer.render(scene,camera);}
   return;
  }
  requestFrame();
  if(M.device.frameRate){
   const period=1000/M.device.frameRate;
   const displayDelta=lastDisplayTick?stamp-lastDisplayTick:0;
   lastDisplayTick=stamp;
   if(displayDelta>0&&displayDelta<100)displayPeriod=displayPeriod?displayPeriod+(displayDelta-displayPeriod)*.08:displayDelta;
   const ticksPerFrame=Math.round(period/displayDelta);
   // Safari can round a 60 Hz clock to uneven 13–19 ms callbacks. When the
   // display itself is already near or below the cap, draw every offered frame.
   // Keep the averaged display clock separate from the simulation/render clock.
   if(displayPeriod>=period-.8){
    renderSlot=stamp+period;
   }else{
   // Follow the display clock at 60/120/180/240 Hz. A separate ideal clock
   // occasionally fits two or four ticks into a frame on a 179.8 Hz panel.
   if(ticksPerFrame>=1&&ticksPerFrame<=4&&Math.abs(displayDelta*ticksPerFrame-period)<.34){
    if(prev&&stamp-prev<period-.8)return;
    renderSlot=stamp+period;
   }else{
    // At non-divisible refresh rates, alternate tick counts to average 60.
    if(!renderSlot)renderSlot=stamp;
    if(stamp+1<renderSlot)return;
    renderSlot+=period;
    if(renderSlot<stamp-period)renderSlot=stamp+period;
   }
   }
  }
  const start=performance.now();
  const elapsed=prev?Math.max(0,(stamp-prev)/1000):1/60,dt=Math.min(.045,elapsed);
  prev=stamp;
  if(M.device.tablet&&!resizeNeeded)checkTabletPacing(elapsed);
  if(resizeNeeded)resize();
  update(dt);let rt=perfParts?performance.now():0;renderer.render(scene,camera);if(perfParts){partMs[4]+=performance.now()-rt;partFrames++;}
  captureScheduledPhoto();
  const cpu=performance.now()-start;
  frameAvg=M.damp(frameAvg,cpu,3,dt);
  perfGap[perfIdx]=elapsed*1000;perfCpu[perfIdx]=cpu;perfIdx=(perfIdx+1)%PERF_N;if(perfCount<PERF_N)perfCount++;
  if(perfVisible){perfT+=elapsed;if(perfT>=.5){perfT=0;updateMeter();}}
 }
 // Test-only measurement: MARS.perf() in the console, or ?perf for a small corner meter.
 function perfStats(){
  let gap=0,gapMax=0,cpu=0,cpuMax=0;
  for(let i=0;i<perfCount;i++){gap+=perfGap[i];cpu+=perfCpu[i];if(perfGap[i]>gapMax)gapMax=perfGap[i];if(perfCpu[i]>cpuMax)cpuMax=perfCpu[i];}
  const n=Math.max(1,perfCount);return {frames:perfCount,avg:gap/n,worst:gapMax,cpuAvg:cpu/n,cpuWorst:cpuMax};
 }
 M.perf=function(){
  if(!renderer)return null;
  const info=renderer.info,f=perfStats(),r=x=>Math.round(x*100)/100;
  return {calls:info.render.calls,triangles:info.render.triangles,points:info.render.points,lines:info.render.lines,
   geometries:info.memory.geometries,textures:info.memory.textures,programs:info.programs?info.programs.length:0,
   frameMs:{avg:r(f.avg),worst:r(f.worst),fps:f.avg>0?Math.round(1000/f.avg):0,cpuAvg:r(f.cpuAvg),cpuWorst:r(f.cpuWorst),frames:f.frames},
   pixelRatio:r(renderer.getPixelRatio()),canvas:canvas.width+'x'+canvas.height,css:innerWidth+'x'+innerHeight,
   cpuParts:perfParts&&partFrames?{activities:r(partMs[0]/partFrames),world:r(partMs[1]/partFrames),actors:r(partMs[2]/partFrames),guide:r(partMs[3]/partFrames),renderSubmit:r(partMs[4]/partFrames)}:'(?perf ile)',
   tablet:!!M.device.tablet,shadows:renderer.shadowMap.enabled,planet:M.planet,phase};
 }
 // Test-only fill estimate for tile GPUs (iPad): opaque overdraw is mostly removed by
 // the GPU, transparent layers are not. MARS.overdraw() renders a small off-screen
 // count of transparent layers per pixel and lists the most covering objects.
 M.overdraw=function(opts={}){
  if(!renderer||!ready)return null;
  const scale=opts.scale||.25,w=Math.max(16,Math.round(innerWidth*scale)),h=Math.max(16,Math.round(innerHeight*scale));
  const target=new T.WebGLRenderTarget(w,h,{depthBuffer:true}),buf=new Uint8Array(w*h*4);
  const one=1/255,count=new T.MeshBasicMaterial({color:new T.Color(one,one,one),blending:T.AdditiveBlending,transparent:true,depthWrite:false,toneMapped:false,fog:false});
  count.color.setRGB(one,one,one,T.LinearSRGBColorSpace);
  const countSprite=new T.SpriteMaterial({color:count.color,blending:T.AdditiveBlending,transparent:true,depthWrite:false,toneMapped:false,fog:false});
  const variants=new Map();function variant(side,test){const k=side+'/'+test;if(!variants.has(k)){const m=count.clone();m.side=side;m.depthTest=test;variants.set(k,m);}return variants.get(k);}
  const objs=[],opaque=[],other=[],saved=new Map();
  scene.traverseVisible(o=>{if(!(o.isMesh||o.isSprite||o.isPoints)){if(o.material)other.push(o);return;}const m=Array.isArray(o.material)?o.material[0]:o.material;if(!m)return;(m.transparent||m.blending===T.AdditiveBlending?objs:opaque).push(o);});
  const all=[...objs,...opaque,...other];for(const o of all)saved.set(o,{v:o.visible,m:o.material});
  const opaqueMats=new Map();for(const o of opaque)for(const m of [].concat(o.material))if(m&&!opaqueMats.has(m))opaqueMats.set(m,m.colorWrite);
  const prevTarget=renderer.getRenderTarget(),prevClear=renderer.autoClear,prevTone=renderer.toneMapping,cc=renderer.getClearColor(new T.Color()),ca=renderer.getClearAlpha(),bg=scene.background,fog=scene.fog;
  function pass(list){
   renderer.setRenderTarget(target);renderer.setClearColor(0x000000,1);renderer.clear();
   for(const o of all)o.visible=false;
   for(const o of opaque){if(o.isMesh){o.visible=true;o.material=saved.get(o).m;}}
   renderer.render(scene,camera);
   for(const o of opaque)o.visible=false;
   renderer.autoClear=false;
   for(const o of list){o.visible=true;const m=saved.get(o).m,src=Array.isArray(m)?m[0]:m;o.material=o.isSprite?countSprite:variant(src.side,src.depthTest);}
   renderer.render(scene,camera);renderer.autoClear=prevClear;
   for(const o of list){o.visible=false;}
   // An async photo readback may still own the pack buffer; read into memory without disturbing it.
   const gl=renderer.getContext(),pack=gl.PIXEL_PACK_BUFFER?gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING):null;if(pack)gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
   renderer.readRenderTargetPixels(target,0,0,w,h,buf);if(pack)gl.bindBuffer(gl.PIXEL_PACK_BUFFER,pack);
   let sum=0,max=0,deep=0;for(let i=0;i<buf.length;i+=4){const n=buf[i];sum+=n;if(n>max)max=n;if(n>=3)deep++;}
   return {avg:sum/(w*h),max,deep:deep/(w*h)};
  }
  let result;
  try{
   renderer.toneMapping=T.NoToneMapping;scene.background=null;scene.fog=null;for(const m of opaqueMats.keys())m.colorWrite=false;
   const total=pass(objs),top=[];
   if(opts.each!==false)for(const o of objs){const r=pass([o]);if(r.avg>.005)top.push({name:o.name||o.parent?.name||o.type,type:o.type,screen:Math.round(r.avg*1000)/10});}
   top.sort((a,b)=>b.screen-a.screen);
   result={transparentObjects:objs.length,layersAvg:Math.round(total.avg*100)/100,layersMax:total.max,screen3plus:Math.round(total.deep*1000)/10+'%',top:top.slice(0,opts.top||10),note:'screen = ekranın yüzde kaçını kaplıyor (saydam katman)'};
  }finally{
   for(const [o,s] of saved){o.visible=s.v;o.material=s.m;}for(const [m,c] of opaqueMats)m.colorWrite=c;
   renderer.setRenderTarget(prevTarget);renderer.autoClear=prevClear;renderer.toneMapping=prevTone;renderer.setClearColor(cc,ca);scene.background=bg;scene.fog=fog;
   target.dispose();count.dispose();countSprite.dispose();for(const m of variants.values())m.dispose();
  }
  return result;
 };
 function updateMeter(){
  const f=perfStats(),info=renderer.info;
  meter.textContent=(f.avg>0?Math.round(1000/f.avg):0)+' FPS · ort '+f.avg.toFixed(1)+' ms · en kötü '+f.worst.toFixed(1)+' ms\n'+
   canvas.width+' × '+canvas.height+' · oran '+renderer.getPixelRatio().toFixed(2)+(M.device.tablet?' · 60 FPS hedef':'')+'\n'+
   info.render.calls+' çizim · '+Math.round(info.render.triangles/1000)+' bin üçgen · '+info.programs.length+' program · CPU '+f.cpuAvg.toFixed(1)+' ms';
 }
 function progress(u,label){$('loading-fill').style.width=u+'%';$('loading-label').textContent=label;}
 const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 async function init(){try{
  renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;M.renderer=renderer;
  canvas.addEventListener('webglcontextlost',onGraphicsLost);
  canvas.addEventListener('webglcontextrestored',onGraphicsRestored);
  resize();progress(10,'Keşif rotası hazırlanıyor');await tick();
  const mars=M.planet==='mars';
  if(mars){
    if(M.worldAssets?.ready)await M.worldAssets.ready;
    world=M.createWorld(scene);
  }else{
    const createExpedition={saturn:M.createSaturn,neptune:M.createNeptune,jupiter:M.createJupiter,venus:M.createVenus}[M.planet];
    if(typeof createExpedition!=='function')throw new Error('Gezegen kurulumu bulunamadi');
    const expedition=createExpedition({scene,player,dog});
    world=expedition.world;activities=expedition.activities;
  }
  M.world=world;progress(40,'Keşif kıyafetleri giyiliyor');await tick();
  actors=M.createCharacters(scene);M.actors=actors;player.y=groundAt(player.x);dog.y=groundAt(dog.x);
  if(M.planet==='jupiter'||M.planet==='venus'){player.z=.95;dog.z=1.05;}
  progress(66,'Bilbo keşfe hazırlanıyor');await tick();
  if(mars){
    activities=M.createActivities({scene,world,actors,player,dog});
    footprints=M.createFootprints(scene,world);
    discoveries=M.createMarsDiscoveries({scene,world,player,dog});
  }
  M.activities=activities;M.discoveries=discoveries;guide=M.createPlayGuide({scene,world,player,dog,autoTouch,lessons:[...(activities.lessons||[]),...(discoveries?.lessons||[])]});M.guide=guide;M.playGuideActive=guide.lessons.length>0;guide.prepare(renderer);createFamilyPhoto();progress(84,'Işıklar ve gölgeler hazırlanıyor');await tick();
  actors.feza.root.position.set(player.x,player.y,player.z||0);actors.bilbo.root.position.set(dog.x,dog.y,dog.z??.3);cameraUpdate(1);actors.update(0,0,state);footprints?.warm(true);
  // Compile against the initial lighting, then upload the different scenery behind
  // the loading screen. A small viewport exercises the same programs and textures.
  world.update(0,0,state);
  await renderer.compileAsync(scene,camera);
  if(disposed||graphicsLost)return;
  renderer.setViewport(0,0,80,60);
  renderer.render(scene,camera);guide?.warm(renderer,camera);footprints?.warm(false);
  const warmPositions=Array.isArray(world.warmPositions)?world.warmPositions.filter(Number.isFinite):mars?[8,35,70,95,125,155,182,210,245,263,275,300,330,355,380,405,430,455,475,495]:[8,world.length*.25,world.length*.5,world.length*.75,world.length-8],warmState={...state,player:{...player}};
  for(let i=0;i<warmPositions.length;i++){
   if(disposed||graphicsLost)return;
   const x=warmPositions[i],y=groundAt(x);
   warmState.player.x=x;warmState.player.y=y;
   const began=performance.now(),programs=renderer.info.programs.length;
   world.update(.2,0,warmState);
   camera.position.set(x,y+5,16);camera.lookAt(x,y+2.2,0);
   // The first Mars stop repeats the landing draw above, including its shadows.
   if(mars&&i===0)continue;
   renderer.render(scene,camera);
   if(mars&&x===210){
    activities.prepareCaveShaders(renderer,camera);
    renderer.compile(points,camera,scene);
   }
   progress(84+Math.round((i+1)/warmPositions.length*15),'Keşif rotasının ışıkları hazırlanıyor');
   // Let input and paint through between stops. Give the browser a second tick
   // after linking a new program or uploading an expensive group of scenery.
   if(renderer.info.programs.length!==programs||performance.now()-began>6)await tick();
   else await new Promise(next=>requestAnimationFrame(next));
  }
  if(disposed||graphicsLost)return;
  // Prepare optional one-off activity renders while the landing screen is still
  // visible. Activities release their own pending GPU work before context loss.
  try{await activities.prepare?.(renderer,camera);}catch(e){console.warn('Hatıra hazırlığı tamamlanamadı',e);}
  if(disposed||graphicsLost)return;
  await prepareFamilyPhoto();
  if(disposed||graphicsLost)return;
  renderer.setViewport(0,0,innerWidth,innerHeight);world.update(0,0,state);cameraX=player.x+2;cameraY=groundAt(player.x)+2.1;cameraUpdate(1);renderer.render(scene,camera);progress(100,'İki kaşif hazır!');await tick();
  if(disposed||graphicsLost)return;
  M.audio.prepare();
  if(M.waitForLanding)await M.waitForLanding;
  if(disposed||graphicsLost)return;
  // Landing fades in softly while the sky lights its stars; the cover never takes touches.
  {const cover=$('loading');cover.classList.add('fading');setTimeout(()=>{if(!graphicsLost)cover.classList.add('hidden');cover.classList.remove('fading');},650);}ready=true;start();
  M.debug={get phase(){return phase;},get time(){return time;},get frameMs(){return frameAvg;},get audioContexts(){return M.audio.contexts;},get errors(){return errors;},warp(x){if(!Q.has('atla')&&!Q.has('test'))return false;player.x=x;player.y=world.ground(x);player.vx=player.vy=0;dog.x=x-2;dog.y=world.ground(dog.x);dog.vx=dog.vy=0;cameraX=x+2;cameraY=player.y+2.2;return true;},state:()=>({phase,player:{...player},dog:{...dog},activities:activities.state(),weatherPost:discoveries?.weatherPost(),guide:guide?.state(),draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
 }catch(e){console.error(e);$('loading-label').textContent='Bu gezegen hazırlanamadı. Üsse dönüp yeniden deneyebilirsin.';$('loading').classList.add('error');}}
 const errors=[];addEventListener('error',e=>{errors.push(e.message);});addEventListener('unhandledrejection',e=>{errors.push(String(e.reason));});
 init();
})(window.MARS);
