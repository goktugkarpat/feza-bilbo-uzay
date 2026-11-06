'use strict';
window.MARS = {version:'0.10.1', events:new EventTarget(), progress:{world:0,characters:0,activities:0,engine:0,qa:0}};
(function(M){
  M.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  M.lerp=(a,b,t)=>a+(b-a)*t;
  M.damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
  const ua=navigator.userAgent||'',touch=navigator.maxTouchPoints||0;
  const ipad=/iPad/.test(ua)||(/Mac/.test(navigator.platform||'')&&touch>1);
  const androidTablet=/Android/.test(ua)&&(!/Mobile/.test(ua)||Math.min(screen.width,screen.height)>=600);
  const tablet=ipad||androidTablet;
  M.device={tablet,ipad,frameRate:tablet?60:0};
  const search=new URLSearchParams(location.search);
  const prefKey='feza-bilbo-mars-ui-v1';
  function readPreferences(){try{const data=JSON.parse(localStorage.getItem(prefKey)||'{}');return data&&typeof data==='object'?data:{};}catch(_){return {};}}
  M.rememberPreference=function(key,value){try{const data=readPreferences();data[key]=value;localStorage.setItem(prefKey,JSON.stringify(data));}catch(_){}};
  // Only sound is restored automatically; each child visit starts without written hints.
  M.soundIsOff=()=>search.has('sessiz')||readPreferences().muted===true;
  M.muted=M.soundIsOff();
  function applyCaptions(value){M.captions=!!value;document.body.classList.toggle('captions',M.captions);const b=document.getElementById('captions-toggle');if(b){b.textContent=M.captions?'Açık':'Kapalı';b.setAttribute('aria-pressed',String(M.captions));}}
  M.setCaptions=function(value){applyCaptions(value);M.rememberPreference('captions',M.captions);};
  // Every child visit starts with picture-only guidance. Parents may enable captions in pause.
  applyCaptions(search.has('altyazi'));
  M.sfx=function(){};
  M.setHint=function(text){const n=document.getElementById('hint-text');if(n)n.textContent=text||'Birlikte keşfet! Basılı tutarak yürü, büyük okla zıpla.';};
  let noteTimer=0;
  M.notify=function(text,seconds=3.5){const n=document.getElementById('notice');if(!n)return;n.textContent=text;n.classList.add('visible');clearTimeout(noteTimer);noteTimer=setTimeout(()=>n.classList.remove('visible'),seconds*1000);};
  M.cameraRequest={x:0,y:0,zoom:1,weight:0,life:0};
  M.setCameraTarget=function(x,y,zoom=1,weight=1){if(x===null){M.cameraRequest.life=0;return;}if(!Number.isFinite(x)||!Number.isFinite(y))return;Object.assign(M.cameraRequest,{x,y,zoom,weight,life:.12});};
})(window.MARS);
