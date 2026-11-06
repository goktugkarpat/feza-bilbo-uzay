/* A real-model family postcard. No DOM/UI capture, private photographs, painted
 * people, adapter.update(), synchronous GPU readback or persistent pose changes.
 * Call prepare() under the loading screen, capture() at the finale, dispose()
 * before renderer disposal. This helper is intentionally independent of Saturn.
 * getWorld().photoVisibility({camera,actors,phase}) may synchronously return an
 * Object3D[] of foreground props to omit. It must not mutate the scene itself.
 */
(function(M){
  'use strict';
  const T=window.THREE,WIDTH=640,HEIGHT=410;
  M.createFamilyPostcard=function(options){
    const scene=options.scene,getActors=options.getActors||(()=>M.actors),getRenderer=options.getRenderer||(()=>M.renderer),getWorld=options.getWorld||(()=>M.world);
    const onReady=options.onReady||((film)=>M.keepPhoto?.(film));
    const status={phase:'idle',prepared:false,pending:false,captured:false,disposed:false,contextLost:false,error:null,metrics:{warm:null,shot:null},occluders:[]};
    let pool=null,preparing=null,capturing=null,epoch=0,disposed=false,lost=false,listeningCanvas=null;
    const now=()=>performance.now();
    function alive(version,renderer){return !!renderer&&!disposed&&!lost&&version===epoch&&!renderer.getContext?.().isContextLost?.();}
    function free(value){if(!value||value.released)return;value.released=true;value.target.dispose();}
    function attach(renderer){const canvas=renderer.domElement;if(canvas===listeningCanvas)return;detach();listeningCanvas=canvas;canvas?.addEventListener?.('webglcontextlost',contextLost);canvas?.addEventListener?.('webglcontextrestored',contextRestored);}
    function detach(){listeningCanvas?.removeEventListener?.('webglcontextlost',contextLost);listeningCanvas?.removeEventListener?.('webglcontextrestored',contextRestored);listeningCanvas=null;}
    function contextLost(){lost=true;epoch++;status.contextLost=true;status.prepared=false;status.pending=false;status.captured=false;status.phase='context-lost';preparing=capturing=null;free(pool);pool=null;}
    function contextRestored(){if(disposed)return;lost=false;status.contextLost=false;status.phase='idle';status.error=null;}
    function dispose(){if(disposed)return;disposed=true;epoch++;status.disposed=true;status.pending=false;status.prepared=false;status.phase='disposed';preparing=capturing=null;free(pool);pool=null;detach();if(typeof removeEventListener==='function')removeEventListener('pagehide',dispose);}
    if(typeof addEventListener==='function')addEventListener('pagehide',dispose);
    function inputs(renderer){const actors=getActors();if(!renderer||!actors?.feza?.root||!actors?.bilbo?.root)return null;return {renderer,actors};}
    function ensureIdentity(input){if(pool&&(pool.renderer!==input.renderer||pool.actors!==input.actors)){epoch++;status.pending=status.prepared=status.captured=false;preparing=capturing=null;free(pool);pool=null;}}
    function makePool(renderer,actors){
      const film=document.createElement('canvas');film.width=WIDTH;film.height=HEIGHT;const ctx=film.getContext('2d');if(!ctx)throw new Error('family-photo-canvas');
      const samples=Math.min(4,Math.max(0,Number(renderer.capabilities?.maxSamples)||0));
      const target=new T.WebGLRenderTarget(WIDTH,HEIGHT,{samples,depthBuffer:true,stencilBuffer:false});target.texture.colorSpace=T.SRGBColorSpace;
      const nodes=[],nodeSet=new Set(),skeletons=new Set();for(const actor of [actors.feza,actors.bilbo])actor.root.traverse(o=>{nodes.push(o);nodeSet.add(o);if(o.skeleton)skeletons.add(o.skeleton);});
      const pixels=new Uint8Array(WIDTH*HEIGHT*4),rows=[];for(let y=0;y<HEIGHT;y++)rows.push(pixels.subarray((HEIGHT-1-y)*WIDTH*4,(HEIGHT-y)*WIDTH*4));
      const face=actors.feza.source?.face,uniforms=[];if(face)for(const key of ['fzEye','fzEyeW','fzMouth','fzBrow']){const value=face[key]?.value;if(value?.clone&&value?.copy)uniforms.push({value,saved:value.clone()});}
      return {renderer,actors,target,film,ctx,pixels,rows,print:ctx.createImageData(WIDTH,HEIGHT),camera:new T.PerspectiveCamera(32,WIDTH/HEIGHT,.08,1500),nodes,nodeSet,skeletons:Array.from(skeletons),saved:new Float64Array(nodes.length*11),uniforms,bounds:null,hidden:[],occluderMeshes:[],ray:new T.Raycaster(),origin:new T.Vector3(),direction:new T.Vector3(),sample:new T.Vector3(),box:new T.Box3(),union:new T.Box3(),rootPosition:new T.Vector3(),frameSize:new T.Vector3(),frameCenter:new T.Vector3(),viewport:new T.Vector4(),scissor:new T.Vector4(),released:false};
    }
    function savePose(value){for(let i=0;i<value.nodes.length;i++){const o=value.nodes[i],j=i*11,s=value.saved;s[j]=o.position.x;s[j+1]=o.position.y;s[j+2]=o.position.z;s[j+3]=o.quaternion.x;s[j+4]=o.quaternion.y;s[j+5]=o.quaternion.z;s[j+6]=o.quaternion.w;s[j+7]=o.scale.x;s[j+8]=o.scale.y;s[j+9]=o.scale.z;s[j+10]=o.visible?1:0;}for(const u of value.uniforms)u.saved.copy(u.value);}
    function restorePose(value){for(let i=0;i<value.nodes.length;i++){const o=value.nodes[i],j=i*11,s=value.saved;o.position.set(s[j],s[j+1],s[j+2]);o.quaternion.set(s[j+3],s[j+4],s[j+5],s[j+6]);o.scale.set(s[j+7],s[j+8],s[j+9]);o.visible=!!s[j+10];}for(const u of value.uniforms)u.value.copy(u.saved);scene.updateMatrixWorld(true);for(const skeleton of value.skeletons)skeleton.update();}
    function poseFamily(value){
      const f=value.actors.feza,d=value.actors.bilbo,b=f.rig||{},dog=d.rig||{},model=d.model||{},dogOnLeft=d.root.position.x<f.root.position.x;
      if(b.root){b.root.rotation.set(0,dogOnLeft?-.16:.16,-.012);b.root.position.y=0;}
      b.hips?.rotation.set(0,0,0);b.chest?.rotation.set(.02,0,0);b.head?.rotation.set(-.16,0,.035);
      for(const side of ['L','R']){const sign=side==='L'?1:-1;b['thigh'+side]?.rotation.set(0,0,sign*.035);b['shin'+side]?.rotation.set(0,0,0);b['foot'+side]?.rotation.set(0,0,sign*.008);}
      b.armL?.rotation.set(-1.90,.08,.64);b.foreL?.rotation.set(-.98,-.18,.02);b.handL?.rotation.set(.02,.04,.20);b.armR?.rotation.set(.06,0,-.12);b.foreR?.rotation.set(-.25,0,0);b.handR?.rotation.set(0,0,0);
      const face=f.source?.face;face?.fzEye?.value.set(0,0,.04,0);face?.fzEyeW?.value.set(.82,.18,0);face?.fzMouth?.value.set(.37,.63,0,0);face?.fzBrow?.value.set(.62,0,.56);
      if(model.root)model.root.rotation.set(0,dogOnLeft?.26:-.26,0);
      if(dog.body){dog.body.position.y=0;dog.body.rotation.set(0,0,0);}dog.neck?.rotation.set(-.03,0,0);dog.head?.rotation.set(-.06,dogOnLeft?.03:-.03,dogOnLeft?-.12:.12);
      for(const leg of dog.legs||[]){leg.b.rotation.set(0,0,0);leg.shin.rotation.set(0,0,0);leg.foot.rotation.set(0,0,0);}
      for(const ear of dog.ears||[]){const bone=ear.b||ear;bone.rotation.set(.04,0,(ear.side||1)*.09);}
      dog.tail?.rotation.set(-.03,dogOnLeft?.42:-.42,.02);model.jaw?.rotation.set(.075,0,0);
      scene.updateMatrixWorld(true);for(const skeleton of value.skeletons)skeleton.update();
    }
    function frameFamily(value,metrics,measure){
      const pair=[value.actors.feza.root,value.actors.bilbo.root];if(measure||!value.bounds){value.bounds=[];for(const root of pair){root.getWorldPosition(value.rootPosition);value.box.setFromObject(root,true);value.bounds.push({min:value.box.min.clone().sub(value.rootPosition),max:value.box.max.clone().sub(value.rootPosition)});}}
      value.union.makeEmpty();for(let i=0;i<2;i++){pair[i].getWorldPosition(value.rootPosition);value.box.min.copy(value.bounds[i].min).add(value.rootPosition);value.box.max.copy(value.bounds[i].max).add(value.rootPosition);value.union.union(value.box);}
      value.union.getSize(value.frameSize);value.union.getCenter(value.frameCenter);const camera=value.camera,tan=Math.tan(camera.fov*Math.PI/360);
      const distance=Math.max(value.frameSize.y/(2*tan),value.frameSize.x/(2*tan*camera.aspect),1.9)*1.13;
      camera.position.set(value.frameCenter.x+.08,value.frameCenter.y+.04,value.union.max.z+distance);camera.lookAt(value.frameCenter.x,value.frameCenter.y+.025,value.frameCenter.z);camera.updateMatrixWorld();
      const projectedBounds=[];for(let i=0;i<2;i++){pair[i].getWorldPosition(value.rootPosition);value.box.min.copy(value.bounds[i].min).add(value.rootPosition);value.box.max.copy(value.bounds[i].max).add(value.rootPosition);let lowX=Infinity,highX=-Infinity,lowY=Infinity,highY=-Infinity;for(let corner=0;corner<8;corner++){value.sample.set(corner&1?value.box.max.x:value.box.min.x,corner&2?value.box.max.y:value.box.min.y,corner&4?value.box.max.z:value.box.min.z).project(camera);lowX=Math.min(lowX,value.sample.x);highX=Math.max(highX,value.sample.x);lowY=Math.min(lowY,value.sample.y);highY=Math.max(highY,value.sample.y);}projectedBounds.push({widthPixels:(highX-lowX)*WIDTH*.5,heightPixels:(highY-lowY)*HEIGHT*.5,leftNdc:lowX,rightNdc:highX,bottomNdc:lowY,topNdc:highY});}
      metrics.frame={width:value.frameSize.x,height:value.frameSize.y,separation:Math.abs(pair[0].position.x-pair[1].position.x),cameraDistance:distance,projectedModelBounds:projectedBounds,scope:'Projected posed-model bounding boxes, not measured raster silhouette or image-quality validation.'};
    }
    function mayHide(value,o){if(!o?.isObject3D||o===scene||o.isLight)return false;for(const actor of [value.actors.feza.root,value.actors.bilbo.root]){let q=o;while(q){if(q===actor)return false;q=q.parent;}q=actor;while(q){if(q===o)return false;q=q.parent;}}return true;}
    function omitForeground(value,phase){const list=getWorld()?.photoVisibility?.({camera:value.camera,actors:value.actors,phase});if(list!==undefined&&!Array.isArray(list))throw new Error('family-photo-visibility-must-return-list');value.hidden.length=0;for(const object of list||[]){if(!mayHide(value,object))throw new Error('family-photo-cannot-hide-actor-or-light');if(value.hidden.some(q=>q.object===object))continue;value.hidden.push({object,visible:object.visible});object.visible=false;}}
    function inspectOcclusion(value,metrics){
      value.occluderMeshes.length=0;scene.traverseVisible(o=>{if(!o.isMesh||value.nodeSet.has(o)||!value.camera.layers.test(o.layers))return;const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.every(m=>m.transparent&&m.opacity<.5))return;value.occluderMeshes.push(o);});
      const a=value.actors,points=[[a.feza.rig?.head,.22],[a.feza.rig?.chest,.15],[a.bilbo.rig?.head,.64],[a.bilbo.rig?.neck,.32]],blocked=new Set();
      for(const [bone,front]of points){if(!bone)continue;value.sample.set(0,0,front);bone.localToWorld(value.sample);value.origin.copy(value.camera.position);value.direction.copy(value.sample).sub(value.origin);const length=value.direction.length();value.ray.set(value.origin,value.direction.normalize());value.ray.near=.05;value.ray.far=Math.max(.05,length-.06);const hits=value.ray.intersectObjects(value.occluderMeshes,false);if(hits.length){const o=hits[0].object;blocked.add(o.name||o.uuid);}}
      metrics.occluders=Array.from(blocked);status.occluders=metrics.occluders;if(blocked.size)throw new Error('family-photo-foreground-occlusion');
    }
    // Important: no await appears inside this scope. compileAsync/readback may
    // return promises, but the live scene is restored before those promises wait.
    function exposure(value,phase,fn,metrics,measure=false){
      const renderer=value.renderer,beforeTarget=renderer.getRenderTarget(),autoClear=renderer.autoClear,xr=renderer.xr?.enabled;const hasViewport=!!renderer.getViewport,hasScissor=!!renderer.getScissor,scissorTest=renderer.getScissorTest?.();
      if(hasViewport)renderer.getViewport(value.viewport);if(hasScissor)renderer.getScissor(value.scissor);savePose(value);
      try{let began=now();poseFamily(value);frameFamily(value,metrics,measure);omitForeground(value,phase);metrics.poseAndFrameMs=(metrics.poseAndFrameMs||0)+now()-began;
        if(phase==='capture'){began=now();inspectOcclusion(value,metrics);metrics.occlusionCheckMs=now()-began;}
        renderer.autoClear=true;if(renderer.xr)renderer.xr.enabled=false;renderer.setRenderTarget(value.target);return fn();
      }finally{const began=now();renderer.setRenderTarget(beforeTarget);if(hasViewport&&renderer.setViewport)renderer.setViewport(value.viewport);if(hasScissor&&renderer.setScissor)renderer.setScissor(value.scissor);if(scissorTest!==undefined)renderer.setScissorTest?.(scissorTest);renderer.autoClear=autoClear;if(renderer.xr)renderer.xr.enabled=xr;for(const q of value.hidden)q.object.visible=q.visible;value.hidden.length=0;restorePose(value);metrics.restoreMs=(metrics.restoreMs||0)+now()-began;}
    }
    function exposeAndRead(value,phase,metrics){return exposure(value,phase,()=>{let began=now();value.renderer.render(scene,value.camera);metrics.renderSubmitMs=now()-began;began=now();const result=value.renderer.readRenderTargetPixelsAsync(value.target,0,0,WIDTH,HEIGHT,value.pixels);metrics.readbackEnqueueMs=now()-began;metrics.fenceStart=now();return result;},metrics);}
    function paint(value,metrics){let began=now();for(let y=0;y<HEIGHT;y++)value.print.data.set(value.rows[y],y*WIDTH*4);metrics.pixelFlipMs=now()-began;began=now();value.ctx.putImageData(value.print,0,0);metrics.canvasPaintMs=now()-began;}
    function prepare(renderer=getRenderer()){
      if(disposed||lost)return Promise.resolve(false);const input=inputs(renderer);if(!input){status.phase='waiting';return Promise.resolve(false);}
      ensureIdentity(input);
      if(status.prepared&&pool?.renderer===renderer&&pool.actors===input.actors)return Promise.resolve(true);if(preparing)return preparing;
      attach(renderer);const version=epoch,metrics={width:WIDTH,height:HEIGHT,samples:Math.min(4,Math.max(0,Number(renderer.capabilities?.maxSamples)||0)),programsBefore:renderer.info?.programs?.length??null,scope:'CPU wall-clock; fenceWait includes GPU queue and asynchronous browser scheduling, not isolated GPU execution time.'},began=now();status.metrics.warm=metrics;status.phase='preparing';status.error=null;
      preparing=Promise.resolve().then(async()=>{let value;try{
        if(!alive(version,renderer))return false;
        if(typeof renderer.readRenderTargetPixelsAsync!=='function')throw new Error('family-photo-async-readback-required');
        let start=now();free(pool);value=makePool(renderer,input.actors);pool=value;renderer.initRenderTarget?.(value.target);metrics.setupMs=now()-start;
        start=now();await exposure(value,'prepare',()=>renderer.compileAsync?.(scene,value.camera),metrics,true);metrics.compileMs=now()-start;if(!alive(version,renderer))return false;
        const result=await exposeAndRead(value,'prepare',metrics);metrics.fenceWaitMs=now()-metrics.fenceStart;delete metrics.fenceStart;
        if(!alive(version,renderer))return false;if(result!==value.pixels)throw new Error('family-photo-empty-readback');paint(value,metrics);status.prepared=true;status.phase='prepared';metrics.programsAfter=renderer.info?.programs?.length??null;metrics.totalMs=now()-began;return true;
      }catch(error){metrics.error=String(error?.message||error);metrics.totalMs=now()-began;if(alive(version,renderer)){status.phase='retry';status.error=metrics.error;status.prepared=false;free(value);if(pool===value)pool=null;}return false;}
      finally{if(!alive(version,renderer))free(value);if(version===epoch)preparing=null;}});return preparing;
    }
    function capture(){
      if(disposed||lost)return Promise.resolve(false);const renderer=getRenderer(),input=inputs(renderer);if(!input){status.phase='waiting';return Promise.reject(new Error('family-photo-actors-or-renderer-unavailable'));}ensureIdentity(input);if(status.captured&&pool)return Promise.resolve(pool.film);if(capturing)return capturing;
      const version=epoch,began=now(),metrics={width:WIDTH,height:HEIGHT,scope:'CPU submission and asynchronous readback; not a GPU timer query.'};status.metrics.shot=metrics;status.pending=true;status.phase='pending';status.error=null;
      capturing=Promise.resolve().then(async()=>{try{
        if(!alive(version,renderer))return false;
        if(!status.prepared){const start=now();if(!await prepare(renderer))throw new Error('family-photo-not-prepared');metrics.latePrepareMs=now()-start;}
        if(!alive(version,renderer))return false;const value=pool;if(!value||value.released)throw new Error('family-photo-target-released');status.phase='exposing';
        const result=await exposeAndRead(value,'capture',metrics);metrics.fenceWaitMs=now()-metrics.fenceStart;delete metrics.fenceStart;if(!alive(version,renderer))return false;
        if(result!==value.pixels)throw new Error('family-photo-empty-readback');paint(value,metrics);status.captured=true;const start=now();try{onReady?.(value.film);}catch(error){metrics.onReadyError=String(error?.message||error);status.error=metrics.onReadyError;}metrics.onReadyMs=now()-start;status.phase='ready';metrics.totalMs=now()-began;return value.film;
      }catch(error){metrics.error=String(error?.message||error);metrics.totalMs=now()-began;if(!alive(version,renderer))return false;status.error=metrics.error;status.phase='retry';throw error;}
      finally{if(version===epoch){status.pending=false;capturing=null;}}});return capturing;
    }
    return {prepare,capture,dispose,state:()=>status,get canvas(){return status.captured?pool?.film||null:null;}};
  };
})(window.MARS);
