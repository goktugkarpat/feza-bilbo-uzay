/* Shared host for Feza and Bilbo's original-model astronaut adapters. */
(function(M){
 'use strict';
 const openModes=new Set(['idle','walk']);
 // A soft sky-coloured edge light keeps both explorers readable against every
 // planet's scenery. It is a shader term only: no extra lights, draws or textures.
 const rimTint={mars:0xffc6a2,saturn:0xddd4ff,neptune:0xa6dcff,jupiter:0xffd2a6,venus:0xffdfa6};
 let rimUniform=null;
 // One small painted studio sky gives suits, gear and helmet glass real reflections.
 // three.js prefilters it once into a 64 px cube: no lights, draws or per-frame work.
 let suitSky=null;
 function suitEnvironment(){
  if(suitSky||typeof document==='undefined')return suitSky;
  const c=document.createElement('canvas');c.width=256;c.height=128;const q=c.getContext('2d'),tint='#'+new THREE.Color(rimTint[M.planet]||0xd4ecff).getHexString();
  const g=q.createLinearGradient(0,0,0,128);g.addColorStop(0,'#e6f3ff');g.addColorStop(.38,'#9cb3c8');g.addColorStop(.49,tint);g.addColorStop(.54,'#6a6068');g.addColorStop(1,'#1c2028');q.fillStyle=g;q.fillRect(0,0,256,128);
  q.shadowColor='#ffffff';q.shadowBlur=8;q.fillStyle='#ffffff';q.fillRect(196,15,44,22);q.fillRect(150,30,24,11);q.fillStyle='#d6f2ff';q.fillRect(38,34,30,9);
  suitSky=new THREE.CanvasTexture(c);suitSky.mapping=THREE.EquirectangularReflectionMapping;suitSky.colorSpace=THREE.SRGBColorSpace;
  return suitSky;
 }
 function dressSuits(root){
  const env=suitEnvironment();if(!env)return;
  root.traverse(o=>{const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list)if(m&&Number.isFinite(m.userData.suitEnv)&&m.envMap!==env){m.envMap=env;m.envMapIntensity=m.userData.suitEnv;m.needsUpdate=true;}});
 }
 M.addCharacterRim=function(material,strength=.4){
  if(!material||material.userData.characterRim)return material;
  if(!rimUniform)rimUniform={value:new THREE.Color(rimTint[M.planet]||0xd4ecff)};
  material.userData.characterRim=true;
  const base=material.onBeforeCompile,key=material.customProgramCacheKey,amount=strength.toFixed(3);
  material.onBeforeCompile=function(shader,renderer){
   base.call(this,shader,renderer);
   shader.uniforms.uCharacterRim=rimUniform;
   shader.fragmentShader='uniform vec3 uCharacterRim;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',
    '{float cRim=1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0);outgoingLight+=uCharacterRim*(cRim*cRim*cRim)*'+amount+';}\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=function(){return key.call(this)+'|character-rim-'+amount;};
  material.needsUpdate=true;
  return material;
 };
 M.createCharacters=function(scene){
  const feza=M.createFezaAstronaut(),bilbo=M.createBilboAstronaut();
  scene.add(feza.root,bilbo.root);dressSuits(feza.root);dressSuits(bilbo.root);
  let current=null,greetingTime=0,cooldown=0;
  const gesture={wag:0,paw:0,wave:0,toDog:1};
  function available(){
   if(!current||current.activity||current.completed||current.rover||current.celebrate>.05)return false;
   const {player,dog}=current;
   return !!player&&!!dog&&player.grounded&&dog.grounded&&!player.locked&&!dog.locked&&
    openModes.has(player.mode)&&openModes.has(dog.mode)&&!player.emote&&!dog.emote&&
    !dog.activityMode&&!Number.isFinite(dog.activityTargetX)&&!player.sailing&&!dog.sailing&&
    !Number.isFinite(player.skating)&&!Number.isFinite(dog.skating);
  }
  function greet(p){
   if(!p||!available())return false;
   const {dog}=current;
   // The body, boots and helmet share a forgiving touch area on the walking plane.
   if(Math.abs(p.x-dog.x)>.99||p.y<dog.y-.13||p.y>dog.y+1.42)return false;
   if(cooldown<=0){
    greetingTime=.001;cooldown=2.6;
    M.sfx('buddy-hello');
   }
   return true;
  }
  function resetGreeting(){greetingTime=cooldown=0;}
  function update(dt,t,state){
   current=state;
   const s=state||{},celebrate=s.celebrate||0;
   let reply=null;
   cooldown=Math.max(0,cooldown-dt);
   if(greetingTime>0){
    greetingTime+=dt;
    if(greetingTime>=1.8||!available())greetingTime=0;
    else{
     const progress=greetingTime/1.8;
     gesture.wag=Math.min(1,progress*9,(1-progress)*4.5);
     gesture.paw=gesture.wag*Math.max(0,1-Math.abs(s.dog.vx||0)/1.1);
     gesture.wave=Math.max(0,Math.min(1,(progress-.09)*5,(1-progress)*4));
     gesture.toDog=Math.sign(s.dog.x-s.player.x)||s.player.facing||1;
     reply=gesture;
    }
   }
   feza.update(dt,t,s.player||{},celebrate,reply);
   bilbo.update(dt,t,s.dog||{},celebrate,reply);
  }
  return {feza,bilbo,greet,resetGreeting,update};
 };
})(window.MARS);

