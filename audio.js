(function(M){
 'use strict';
 let ctx=null,master=null,music=null,next=0,step=0,noise=null,voice=null,pending='',desired='',lastVoice=-20,voiceGeneration=0,paused=false;
 const spoken=new Set(),decoded=new Map();let wind=null;
 const voices=new Set();let arrangement=null,arrangementPlanet='',musicPart='';
 function tone(freq,t,duration,volume,type='sine',end,channel=master,attack=.025){
  if(!ctx||M.muted)return;const o=ctx.createOscillator(),a=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(15,end),t+duration);
  a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(volume,t+Math.min(attack,duration*.48));a.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(a);a.connect(channel);o.start(t);o.stop(t+duration+.04);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();a.disconnect();};
 }
 function resumeIfNeeded(){
  if(!armed||!ctx||M.muted||paused||document.hidden)return;
  if(ctx.state==='suspended'||ctx.state==='interrupted')ctx.resume().catch(()=>{});
 }
 let armed=false;
 function build(){if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.34;master.connect(ctx.destination);music=ctx.createGain();music.gain.value=.90;music.connect(master);noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const a=noise.getChannelData(0);let n=0;for(let i=0;i<a.length;i++){n=.97*n+(Math.random()-.5)*.03;a[i]=n;}for(let i=0;i<128;i++){a[i]*=i/128;a[a.length-1-i]*=i/128;}}}
 function prepare(){if(M.muted||paused||document.hidden||ctx)return;try{build();if(ctx.state==='running')ctx.suspend().catch(()=>{});}catch(e){}}
 function init(){if(M.muted||paused||document.hidden)return;armed=true;try{build();resumeIfNeeded();}catch(e){}}

 function narration(){
  const key=desired;if(!ctx||M.muted||paused||voice||pending||!key||spoken.has(key)||ctx.currentTime-lastVoice<1||!M.voiceBank?.[key])return;
  pending=key;const generation=voiceGeneration;
  let promise=decoded.get(key);
  if(!promise){const raw=atob(M.voiceBank[key].split(',')[1]),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);promise=ctx.decodeAudioData(bytes.buffer);decoded.set(key,promise);}
  promise.then(buffer=>{
   if(generation!==voiceGeneration)return;
   pending='';
   if(M.muted||paused||desired!==key||voice)return;
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=buffer;gain.gain.value=1.25;source.connect(gain);gain.connect(master);
   source.onended=()=>{
    if(voice?.source===source){
     voice=null;lastVoice=ctx.currentTime;
     if(ctx.state!=='closed')music.gain.setTargetAtTime(.90,ctx.currentTime,.42);
    }
    source.disconnect();gain.disconnect();
   };
   source.start();voice={key,source};spoken.add(key);
   music.gain.setTargetAtTime(.43,ctx.currentTime,.13);
  }).catch(()=>{
   if(generation===voiceGeneration)pending='';
   if(decoded.get(key)===promise)decoded.delete(key);
  });
 }
 function setMuted(value){
  M.muted=value;
  if(master)master.gain.setTargetAtTime(value?0:.34,ctx.currentTime,.12);
  if(!value){init();return;}
  voiceGeneration++;pending='';
  if(!voice)return;
  // A parent may restore sound while the child is still at the same activity.
  const stopped=voice;voice=null;spoken.delete(stopped.key);
  music.gain.setTargetAtTime(.90,ctx.currentTime,.42);
  try{stopped.source.stop();}catch(_){}
 }
 // Reuse the same noise buffer for short fabric, air and grit sounds.
 function air(t,duration,volume,from,to){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;source.loop=true;filter.type='bandpass';filter.Q.value=.72;
  filter.frequency.setValueAtTime(from,t);filter.frequency.exponentialRampToValueAtTime(to,t+duration);
  gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+Math.min(.12,duration*.21));gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter);filter.connect(gain);gain.connect(master);source.start(t);source.stop(t+duration+.02);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 }
 function weatherSound(intensity){
  if(!armed||!ctx||M.muted)return;const value=M.clamp(Number(intensity)||0,0,1);
  if(!wind&&value>.01){const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=300;filter.Q.value=.6;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(master);source.start();wind={source,filter,gain,last:0};}
  if(wind&&(Math.abs(wind.last-value)>.02||(value===0&&wind.last!==0))){wind.last=value;wind.gain.gain.setTargetAtTime(value*(.49+.15*value),ctx.currentTime,.42);wind.filter.frequency.setTargetAtTime(220+value*value*760,ctx.currentTime,.49);}
 }
 // Sparse phrases leave room for both speech and small interactive sounds.
 const scores={
  mars:{notes:[146.83,220,293.66,369.99,329.63,220,196,0,146.83,220,293.66,440,392,293.66,220,0],bass:[73.415,65.41,73.415,82.41],beat:.66},
  saturn:{notes:[261.63,0,392,493.88,0,440,392,0,329.63,392,0,587.33,523.25,0,392,0,293.66,0,440,523.25,493.88,392,329.63,0],bass:[98,82.41,87.31,98,73.42,98],beat:.64},
  neptune:{notes:[185,0,277.18,369.99,0,311.13,246.94,0,207.65,0,311.13,415.30,369.99,277.18,0,0,246.94,0,329.63,369.99,277.18,0,185,0],bass:[61.735,69.30,82.41,69.30,61.735,69.30],beat:.74},
  // Long, answering phrases have more silence than notes. The celesta and the
  // soft wooden pulse are two compositions, rather than a transposed arpeggio.
  jupiter:{part:'jupiter-orbit',style:'celesta',notes:[293.66,0,0,440,0,369.99,0,0,329.63,0,0,493.88,0,440,0,0,369.99,0,0,587.33,0,493.88,0,0,440,0,329.63,0,293.66,0,0,0],bass:[146.83,110,123.47,146.83],beat:.90},
  io:{part:'jupiter-io',style:'wood',notes:[220,0,293.66,0,0,246.94,0,0,196,0,0,329.63,0,293.66,0,0,220,0,0,369.99,0,0,293.66,0],bass:[110,98,123.47,146.83],beat:.90},
  europa:{part:'jupiter-europa',style:'ice',notes:[440,0,0,659.25,0,587.33,0,0,493.88,0,0,739.99,0,659.25,0,0,587.33,0,0,880,0,739.99,0,0,659.25,0,493.88,0,440,0,0,0],bass:[146.83,110,123.47,146.83],beat:.96},
  jovianMuseum:{part:'jupiter-museum',style:'celesta',notes:[293.66,0,369.99,0,440,0,0,587.33,0,493.88,0,440,0,369.99,0,0],bass:[146.83,110,146.83,146.83],beat:.96},
  venus:{part:'venus-amber',style:'wood',notes:[220,0,0,277.18,0,329.63,0,0,246.94,0,0,369.99,0,329.63,0,0,277.18,0,0,415.30,0,369.99,0,0,329.63,0,277.18,0,220,0,0,0],bass:[110,138.59,123.47,110],beat:.86},
  venusCrawler:{part:'venus-crawler',style:'crawler',notes:[220,0,0,0,277.18,0,329.63,0,246.94,0,0,0,329.63,0,277.18,0,220,0,0,369.99,0,329.63,0,0],bass:[110,123.47,138.59,110],beat:.86},
  venusClouds:{part:'venus-clouds',style:'cloud',notes:[329.63,0,0,415.30,0,493.88,0,0,369.99,0,0,554.37,0,493.88,0,0,415.30,0,0,659.25,0,554.37,0,0,493.88,0,415.30,0,329.63,0,0,0],bass:[110,138.59,123.47,164.81],beat:.94},
  venusPanorama:{part:'venus-panorama',style:'cloud',notes:[329.63,0,415.30,0,493.88,0,0,659.25,0,554.37,0,493.88,0,415.30,0,0],bass:[164.81,138.59,123.47,110],beat:.96}
 };
 function selectScore(planet){
   const actor=M.state?.player||M.player,x=Number.isFinite(actor?.x)?actor.x:0,active=M.state?.activity||'';
   if(planet==='jupiter')return M.state?.completed||active==='museum'||x>=360?scores.jovianMuseum:x>=260?scores.europa:x>=112&&x<192?scores.io:scores.jupiter;
   if(planet==='venus')return M.state?.completed||active==='venusObservatory'||x>=393?scores.venusPanorama:x>=319?scores.venusClouds:active==='venusCrawler'?scores.venusCrawler:scores.venus;
   return scores[planet]||scores.mars;
 }
 function playScore(t){
   const planet=M.planet,newWorld=planet==='jupiter'||planet==='venus',wanted=selectScore(planet);
   if(newWorld&&(!arrangement||arrangementPlanet!==planet||step%8===0)){arrangement=wanted;arrangementPlanet=planet;}
   const score=newWorld?arrangement:wanted;musicPart=score.part||planet||'mars';
   const f=score.notes[step%score.notes.length],bar=Math.floor(step/4);
   if(f){
     if(newWorld){
       if(score.style==='wood'||score.style==='crawler'){
         tone(f,t,.94,.024,'sine',undefined,music,.035);
         tone(f*2.01,t+.012,.29,.0045,'triangle',undefined,music,.018);
       }else if(score.style==='cloud'){
         tone(f*.998,t,1.80,.025,'sine',f,music,.17);
         tone(f*1.5,t+.055,1.0,.0035,'sine',undefined,music,.21);
       }else{
         tone(f,t,1.48,score.style==='ice'?.022:.025,'sine',undefined,music,.022);
         tone(f*2.756,t+.012,.43,.0038,'sine',undefined,music,.014);
       }
     }else if(planet==='saturn'){
       tone(f,t,1.06,.033,'sine',undefined,music,.018);
       tone(f*2.005,t+.014,.49,.006,'sine',undefined,music,.032);
     }else if(planet==='neptune'){
       tone(f*.992,t,1.08,.037,'sine',f,music,.15);
       if(step%4===0)tone(f*2,t+.045,.8,.005,'triangle',undefined,music,.18);
     }else tone(f,t,1.02,.033,'sine',undefined,music,.046);
   }
   if(newWorld&&step%8===0){
     const bass=score.bass[Math.floor(step/8)%score.bass.length];
     tone(bass,t,4.0,.013,'sine',undefined,music,.32);
     tone(bass*1.5,t+.035,3.6,.005,'sine',undefined,music,.38);
   }else if(!newWorld&&step%4===0){
     const bass=score.bass[bar%score.bass.length];tone(bass,t,2.62,.025,'sine',undefined,music,.19);
     if(planet==='mars'||bar%2===0)tone(bass*1.5,t+.055,2.5,.011,'sine',undefined,music,.23);
   }
   step++;next+=score.beat;
 }
 M.audio={prepare,start:init,close(){paused=true;voiceGeneration++;pending='';if(ctx&&ctx.state!=='closed')ctx.close().catch(()=>{});},setWeather:weatherSound,get windSources(){return wind?1:0;},hasSpoken(key){return spoken.has(key);},setCue(key){desired=key||'';},setPaused(value){const wasPaused=paused;paused=value;if(!ctx){if(wasPaused&&!value)init();return;}if(value)ctx.suspend().catch(()=>{});else if(armed&&!M.muted&&!document.hidden)ctx.resume().catch(()=>{});},setMuted,update(){if(!armed||!ctx||M.muted||paused||document.hidden||ctx.state!=='running')return;const now=ctx.currentTime;if(next<now-.2)next=now+.1;while(next<now+.15)playScore(next);narration();},get voices(){return voices.size;},get contexts(){return ctx?1:0;},get musicPart(){return musicPart;},get narrationState(){return{pending,speaking:!!voice,spoken:Array.from(spoken),cue:desired};}};
 M.sfx=function(name){if(M.muted)return;init();if(!ctx)return;const t=ctx.currentTime;
  if((M.planet==='jupiter'||M.planet==='venus')&&name==='rover'){
    air(t,.85,.23,230,670);tone(M.planet==='jupiter'?110:138.59,t,.70,.028,'sine',M.planet==='jupiter'?164.81:185);
  }
  else if((M.planet==='jupiter'||M.planet==='venus')&&name==='scan'){
    tone(M.planet==='jupiter'?440:415.30,t,.28,.035,'sine',M.planet==='jupiter'?587.33:493.88);tone(M.planet==='jupiter'?880:830.60,t+.07,.40,.010);
  }
  else if((M.planet==='jupiter'||M.planet==='venus')&&name==='snap'){
    tone(M.planet==='jupiter'?293.66:277.18,t,.12,.042,'triangle',220);tone(M.planet==='jupiter'?587.33:554.37,t+.045,.25,.014);
  }
  else if((M.planet==='jupiter'||M.planet==='venus')&&name==='reveal'){
    tone(M.planet==='jupiter'?440:415.30,t,.80,.036);tone(M.planet==='jupiter'?659.25:622.25,t+.10,.9,.018);
  }
  else if(name==='jump'){tone(220,t,.24,.09,'sine',530);tone(440,t+.03,.19,.035,'sine',790);}
  else if(name==='land'){tone(100,t,.14,.09,'triangle',48);}
  else if(/^saturn-chime-[012]$/.test(name)){
    const f=[523.25,659.25,783.99][Number(name.slice(-1))];
    tone(f,t,1.15,.10);tone(f*2.01,t+.012,.62,.020);tone(f*3,t+.022,.32,.007);
  }
  else if(name==='aerostat-clasp'||name==='saturn-latch'){
    tone(370,t,.055,.048,'triangle',190);tone(532,t+.055,.23,.018,'sine',365);
  }
  else if(name==='aerostat-away'||name==='windsock'){
    air(t,1.35,.49,365,1180);tone(392,t+.12,.55,.04,'sine',523);tone(659.25,t+.42,.72,.032);
  }
  else if(name==='saturn-magnet'){
    tone(164.81,t,.36,.044,'sine',329.63);tone(493.88,t+.14,.41,.022,'sine',659.25);
  }
  else if(name==='saturn-cradle'){
    tone(392,t,.54,.074);tone(783,t+.012,.18,.012);tone(587.33,t+.13,.82,.05);
  }
  else if(name==='wind-lift'||name==='wind-tug'){
    const launch=name==='wind-lift';
    air(t,launch?1.16:.45,launch?.54:.38,launch?250:610,launch?980:1180);
    tone(launch?246.94:369.99,t+.05,launch?.70:.34,.032,'sine',launch?369.99:466.16);
  }
  else if(/^wind-harp-[123]$/.test(name)){
    const f=[369.99,466.16,554.37][Number(name.slice(-1))-1];tone(f,t,1.14,.063);
    tone(f*1.5,t+.026,.70,.019);air(t,.29,.14,1200,620);
  }
  else if(name==='rotor'){for(let i=0;i<12;i++)tone(110+i*5,t+i*.084,.07,.017,'triangle',75);}
  else if(name==='water'||name==='bloom'){[410,560,720].forEach((f,i)=>tone(f,t+i*.095,.16,.05,'sine',f*.75));if(name==='bloom')tone(880,t+.31,.8,.035);}
  else if(name==='constellation'){[293.66,440,587.33,659.25,880].forEach((f,i)=>tone(f,t+i*.19,1.15,.045));}
  else if(/success|complete|win|beacon|celebrate/.test(name)){[293.66,369.99,440,587.33].forEach((f,i)=>tone(f,t+i*.11,.8,.06));}
  else if(/dig|sand|dust/.test(name)){const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),a=ctx.createGain();n.buffer=noise;f.type='bandpass';f.frequency.value=650;a.gain.setValueAtTime(.2,t);a.gain.exponentialRampToValueAtTime(.0001,t+.23);n.connect(f);f.connect(a);a.connect(master);n.start(t);n.stop(t+.25);n.onended=()=>{n.disconnect();f.disconnect();a.disconnect();};}
  else if(name==='buddy-hello'){
    // A small breath and two falling formants give the greeting a soft “hav”.
    air(t,.15,.19,870,380);
    tone(197,t,.19,.083,'triangle',113,master,.015);
    tone(590,t+.013,.12,.020,'sine',350,master,.018);
    tone(285,t+.022,.16,.029,'triangle',172,master,.016);
  }
  else if(/dog|bark|woof/.test(name)){tone(195,t,.16,.08,'triangle',115);tone(285,t+.025,.11,.025,'sine',160);}
  else if(/ice|ring|slide/.test(name)){tone(660,t,.3,.05,'sine',880);tone(990,t+.03,.28,.02);}
  else if(/robot|wake/.test(name)){[330,440,550].forEach((f,i)=>tone(f,t+i*.09,.25,.04));}
  else {tone(360,t,.16,.05,'sine',490);}
 };
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden)ctx.suspend().catch(()=>{});else if(armed&&!M.muted&&!paused)ctx.resume().catch(()=>{});});
 // A touch release can unlock tablet audio after its initial press was declined.
 document.addEventListener('pointerup',event=>{if(event.pointerType==='touch')resumeIfNeeded();},{capture:true,passive:true});
})(window.MARS);
