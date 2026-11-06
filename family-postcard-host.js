/* QA-only integration candidate. This is NOT loaded by the game. The frozen
 * BA0FAF offscreen helper stays unchanged. No UI, renderer or planet mutation. */
(function(M){
 'use strict';
 M.createFamilyPostcardHost=function(options){
  const postcard=options.postcard,accept=options.accept,isAlive=options.isAlive||(()=>true);
  const now=options.now||(()=>performance.now()),schedule=options.schedule||setTimeout,cancel=options.cancel||clearTimeout;
  const budget=Math.max(100,options.maxWaitMs??1800),retryDelay=Math.max(0,options.retryDelayMs??180),maximum=Math.max(1,options.maxAttempts??2);
  const status={phase:'idle',pending:false,accepted:false,attempts:0,error:null,disposed:false};
  let version=0,pending=null,abort=null,disposed=false;
  function valid(epoch){return !disposed&&epoch===version&&isAlive();}
  function pauseCapture(){version++;abort?.();abort=null;pending=null;status.pending=false;if(!disposed&&!status.accepted)status.phase='idle';}
  function dispose(){if(disposed)return;disposed=true;pauseCapture();status.disposed=true;status.phase='disposed';postcard.dispose();}
  function prepare(renderer){if(disposed)return Promise.resolve(false);return Promise.resolve().then(()=>postcard.prepare(renderer)).catch(error=>{status.error=String(error?.message||error);return false;});}
  function capture(){
   if(disposed||!isAlive())return Promise.resolve(false);if(status.accepted)return Promise.resolve(true);if(status.phase==='failed')return Promise.resolve(false);if(pending)return pending;
   const epoch=version,deadline=now()+budget,stopped={};let stop;
   const interruption=new Promise(resolve=>{stop=()=>resolve(stopped);});abort=stop;
   status.phase='pending';status.pending=true;status.attempts=0;status.error=null;
   function bounded(promise,ms){let timer;const timeout=new Promise((_,reject)=>{timer=schedule(()=>reject(new Error('family-photo-host-timeout')),Math.max(0,ms));});return Promise.race([promise,timeout,interruption]).finally(()=>cancel(timer));}
   pending=Promise.resolve().then(async()=>{
    try{
     for(let attempt=1;attempt<=maximum;attempt++){
      if(!valid(epoch))return false;if(now()>=deadline){status.phase='failed';status.error='family-photo-host-timeout';return false;}status.attempts=attempt;
      try{
       const film=await bounded(Promise.resolve().then(()=>postcard.capture()),deadline-now());
       if(film===stopped||!valid(epoch))return false;
       if(!film){status.phase='failed';status.error='family-photo-unavailable';return false;}
       // onReady is a no-op in this host integration. Only this guarded path may
       // copy the film, so a timed-out/disposed result cannot overwrite a fallback.
       if(accept(film)!==true)throw new Error('family-photo-not-copied');
       status.accepted=true;status.phase='ready';return true;
      }catch(error){
       if(!valid(epoch))return false;status.error=String(error?.message||error);
       if(attempt>=maximum||now()+retryDelay>=deadline){status.phase='failed';return false;}
       status.phase='retry';let retryTimer;try{const delay=await bounded(new Promise(resolve=>{retryTimer=schedule(resolve,retryDelay);}),deadline-now());if(delay===stopped||!valid(epoch))return false;}finally{cancel(retryTimer);}status.phase='pending';
      }
     }
     status.phase='failed';return false;
    }finally{if(epoch===version){status.pending=false;pending=null;abort=null;}}
   });return pending;
  }
  return {prepare,capture,suspend:pauseCapture,dispose,state:()=>status};
 };
})(window.MARS);
