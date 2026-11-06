/* Shared host for Feza and Bilbo's original-model astronaut adapters. */
(function(M){
 'use strict';
 const openModes=new Set(['idle','walk']);
 M.createCharacters=function(scene){
  const feza=M.createFezaAstronaut(),bilbo=M.createBilboAstronaut();
  scene.add(feza.root,bilbo.root);
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

