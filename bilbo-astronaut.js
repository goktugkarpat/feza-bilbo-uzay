/* Bilbo's Mars suit. The dog underneath is the user's original sculpted Labrador,
 * retained in model-data/bilbo-original.js, including its face and skin weights.
 * lookX/lookY are normalized coaching offsets; lookWorldX/lookWorldY accept a
 * world-space target. Seat paw anchors are sole heights relative to the actor root. */
(function(M){
 'use strict';
 const T=THREE,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
 M.createBilboAstronaut=function(){
  if(!M.BilboOriginal)throw new Error('Load model-data/bilbo-original.js before bilbo-astronaut.js');
  const model=M.BilboOriginal.create(),root=new T.Group();root.name='Bilbo · original chocolate Labrador astronaut';root.add(model.root);
  const scale=.62;model.root.scale.setScalar(scale);model.root.position.y=.012;
  const sphere=new T.SphereGeometry(1,14,8),detailSphere=new T.SphereGeometry(1,8,6),cylinder=new T.CylinderGeometry(1,1,1,14),cube=new T.BoxGeometry(1,1,1);
  const white=new T.MeshStandardMaterial({color:0xe5e9e5,roughness:.68,metalness:.12});
  let fabric=null;
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),image=ctx.createImageData(128,128);
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,weave=((x+y)%4===0?6:0)+((x-y+128)%4===0?3:0),value=242-weave+((x*17+y*29)%7-3);image.data[i]=image.data[i+1]=image.data[i+2]=value;image.data[i+3]=255;}
   ctx.putImageData(image,0,0);fabric=new T.CanvasTexture(canvas);fabric.colorSpace=T.SRGBColorSpace;fabric.wrapS=fabric.wrapT=T.RepeatWrapping;fabric.repeat.set(8,8);fabric.anisotropy=2;white.map=white.bumpMap=fabric;white.bumpScale=.003;
  }
  const teal=new T.MeshStandardMaterial({color:0x259fa4,roughness:.47,metalness:.28});
  const orange=new T.MeshStandardMaterial({color:0xe9a45e,roughness:.48,metalness:.12});
  const dark=new T.MeshStandardMaterial({color:0x2f4149,roughness:.7,metalness:.16});
  const silver=new T.MeshStandardMaterial({color:0xc8d9db,roughness:.34,metalness:.58});
  for(const m of [white,teal,orange,dark,silver])M.addCharacterRim?.(m,m===white?.42:.3);
  const glass=new T.MeshPhysicalMaterial({color:0xb4e2e7,transparent:true,opacity:.105,roughness:.105,metalness:0,clearcoat:1,clearcoatRoughness:.08,depthWrite:false,side:T.FrontSide});
  glass.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
   '{float bGlassRim=pow(1.0-clamp(abs(dot(normalize(normal),normalize(vViewPosition))),0.0,1.0),1.8);diffuseColor.a=.04+.84*bGlassRim;outgoingLight+=vec3(.68,.78,.78)*bGlassRim;float bGlassSky=smoothstep(.2,.9,normalize(normal).y)*(1.0-bGlassRim);diffuseColor.a+=bGlassSky*.06;outgoingLight+=vec3(.86,.95,1.)*bGlassSky*.14;float bGloss=dot(totalSpecular,vec3(.3,.59,.11));outgoingLight+=totalSpecular*1.2;diffuseColor.a=min(.9,diffuseColor.a+bGloss*2.4);}\n#include <opaque_fragment>');};
  glass.customProgramCacheKey=()=> 'bilbo-clear-helmet-fresnel-v5';
  const glint=new T.MeshBasicMaterial({color:0xe2f7f5,transparent:true,opacity:.82,depthWrite:false});
  // Reflection strength for the shared studio sky in characters.js.
  for(const [m,v] of [[white,.45],[teal,.85],[orange,.6],[dark,.5],[silver,1.1],[glass,1.4]])m.userData.suitEnv=v;
  const pieces=[],owned=[];
  function piece(bone,g,mat,pos=[0,0,0],sz=[1,1,1],rot=[0,0,0]){pieces.push({bone,g,mat,local:new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...sz))});}
  function ell(b,m,p,s){piece(b,Math.max(...s)<.08?detailSphere:sphere,m,p,s);}
  function box(b,m,p,s,r){piece(b,cube,m,p,s,r);}
  function cyl(b,m,p,s,r){piece(b,cylinder,m,p,s,r);}
  function line(b,m,points,r){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(6,(points.length-1)*2),r,r<=.018?4:6,false);owned.push(g);piece(b,g,m);}
  function ring(b,m,p,r,t,rot=[0,0,0],sz=[1,1,1]){const g=new T.TorusGeometry(r,t,r>.2?6:5,r>.2?28:16);owned.push(g);piece(b,g,m,p,sz,rot);}
  // A fitted dorsal vest leaves the Labrador's muscular chest, brown limbs,
  // broad face, floppy ears, and tapered tail visible.
  const sections=[],trunk=model.shapes.trunk.attributes.position;
  for(let row=0;row<=26;row++){const i=row*19,z=trunk.getZ(i),cy=trunk.getY(i);if(z>=-.72&&z<=.37)sections.push([z,trunk.getX(i),(trunk.getY(i+4)-cy)/Math.sin(4*Math.PI*2/18),cy]);}
  const pv=[],uv=[],ix=[],arcSegments=20;
  const edgeAt=i=>-.10+.18*Math.pow(Math.abs(i/(sections.length-1)*2-1),2);
  sections.forEach((s,i)=>{const edge=edgeAt(i);for(let j=0;j<=arcSegments;j++){const a=edge+j/arcSegments*(Math.PI-edge*2);pv.push(Math.cos(a)*(s[1]+.025),s[3]+Math.sin(a)*(s[2]+.025),s[0]);uv.push(j/arcSegments,i/(sections.length-1));if(i<sections.length-1&&j<arcSegments){const n=i*(arcSegments+1)+j;ix.push(n,n+1,n+arcSegments+1,n+1,n+arcSegments+2,n+arcSegments+1);}}});
  const vest=new T.BufferGeometry();vest.setAttribute('position',new T.Float32BufferAttribute(pv,3));vest.setAttribute('uv',new T.Float32BufferAttribute(uv,2));vest.setIndex(ix);vest.computeVertexNormals();owned.push(vest);piece(model.body,vest,white);
  [-1,1].forEach(side=>line(model.body,teal,sections.map((s,i)=>{const a=side<0?edgeAt(i):Math.PI-edgeAt(i);return [Math.cos(a)*(s[1]+.031),s[3]+Math.sin(a)*(s[2]+.031),s[0]];}),.018));
  // Two pressure seams and a soft protective spine pad follow the actual body bone.
  [-.53,.22].forEach(z=>{const s=sections.reduce((a,b)=>Math.abs(b[0]-z)<Math.abs(a[0]-z)?b:a);const pts=[];for(let j=0;j<=14;j++){const a=.05+j/14*(Math.PI-.1);pts.push([Math.cos(a)*(s[1]+.037),s[3]+Math.sin(a)*(s[2]+.036),z]);}line(model.body,silver,pts,.008);});
  ell(model.body,white,[0,1.145,-.22],[.245,.125,.33]);
  box(model.body,teal,[0,1.251,-.22],[.30,.032,.35]);
  box(model.body,orange,[0,1.276,-.22],[.22,.015,.075]);
  [-1,1].forEach(side=>{
   cyl(model.body,silver,[side*.19,1.11,-.28],[.058,.43,.058],[Math.PI/2,0,0]);
   cyl(model.body,teal,[side*.19,1.11,-.48],[.061,.035,.061],[Math.PI/2,0,0]);
   line(model.body,teal,[[side*.20,1.08,.30],[side*.31,.95,.38],[side*.30,.66,.41]],.026);
   cyl(model.body,teal,[side*.367,.88,-.09],[.105,.018,.105],[0,0,Math.PI/2]);
   ell(model.body,orange,[side*.381,.866,-.09],[.012,.042,.048]);
   [[-.05,.925],[-.017,.957],[.023,.952],[.055,.923]].forEach(a=>ell(model.body,orange,[side*.383,a[1],-.09+a[0]],[.012,.019,.017]));
  });
  box(model.body,orange,[0,.72,.559],[.16,.09,.035]);
  if(M.planet==='mars'){
   // A short specimen tube nests along the side of the pack.
   cyl(model.body,white,[.235,1.07,-.27],[.072,.35,.072],[Math.PI/2,0,0]);
   for(const z of [-.445,-.095])cyl(model.body,orange,[.235,1.07,z],[.077,.035,.077],[Math.PI/2,0,0]);
  }else if(M.planet==='saturn'){
   for(const s of [-1,1]){
    cyl(model.body,dark,[s*.29,1.065,-.30],[.09,.035,.09],[0,0,Math.PI/2]);
    ring(model.body,orange,[s*.313,1.065,-.30],.079,.016,[0,Math.PI/2,0],[1,.89,1]);
   }
  }else if(M.planet==='neptune'){
   // These eyes sit at the exact points where the kite risers meet the harness.
   for(const s of [-1,1]){
    box(model.body,teal,[s*.19,1.11,-.26],[.086,.06,.115]);
    ring(model.body,orange,[s*.19,1.15,-.26],.054,.014,[0,Math.PI/2,0]);
    line(model.body,teal,[[s*.19,1.12,-.26],[s*.28,1.04,-.20],[s*.337,.91,-.12]],.017);
   }
  }
  // Boots retain the original paws and toe grooves, with articulated soles and seals.
  model.legs.forEach(L=>{
   ell(L.foot,dark,[0,-.100,.075],[.141,.028,.207]);
   cyl(L.foot,white,[0,.047,.025],[.102,.095,.103]);
   ring(L.foot,teal,[0,.09,.025],.104,.012,[Math.PI/2,0,0]);
   box(L.foot,orange,[0,.024,.132],[.066,.035,.023]);
  });
  // A completely clear bubble encloses the original broad muzzle and ears.
  // Its trim stays behind the cheeks so the chocolate Labrador face remains unobstructed.
  const helmetGeo=new T.SphereGeometry(1,28,20);owned.push(helmetGeo);
  piece(model.head,helmetGeo,glass,[0,.015,.18],[.485,.48,.71]);
  ring(model.head,teal,[0,-.27,-.13],.30,.032,[Math.PI/2,0,0],[1.23,1.1,1]);
  ring(model.head,silver,[0,-.288,-.13],.30,.013,[Math.PI/2,0,0],[1.23,1.1,1]);
  [-1,1].forEach(s=>{cyl(model.head,silver,[s*.407,-.14,-.08],[.06,.035,.06],[0,0,Math.PI/2]);ell(model.head,orange,[s*.43,-.14,-.08],[.018,.027,.027]);});
  // Restrained curved highlights make the glass legible without painting over the eyes.
  line(model.head,glint,[[-.29,.26,.56],[-.33,.19,.60],[-.35,.10,.60]],.015);
  line(model.head,glint,[[.20,.36,.53],[.26,.31,.56],[.29,.26,.57]],.010);
  // Merge all suit pieces by material into the SAME original skeleton.
  const suitMeshes=[],v=new T.Vector3(),n=new T.Vector3(),normalMatrix=new T.Matrix3();
  new Set(pieces.map(p=>p.mat)).forEach(mat=>{
   const positions=[],normals=[],uvs=[],skinIndex=[],skinWeight=[],indices=[];let base=0;
   pieces.filter(p=>p.mat===mat).forEach(p=>{const bi=model.bones.indexOf(p.bone),rest=model.skeleton.boneInverses[bi].clone().invert(),transform=rest.multiply(p.local),a=p.g.attributes;normalMatrix.getNormalMatrix(transform);
    for(let i=0;i<a.position.count;i++){v.fromBufferAttribute(a.position,i).applyMatrix4(transform);positions.push(v.x,v.y,v.z);n.fromBufferAttribute(a.normal,i).applyMatrix3(normalMatrix).normalize();normals.push(n.x,n.y,n.z);uvs.push(a.uv?a.uv.getX(i):0,a.uv?a.uv.getY(i):0);skinIndex.push(bi,0,0,0);skinWeight.push(1,0,0,0);}
    const ai=p.g.index;for(let i=0;i<(ai?ai.count:a.position.count);i++)indices.push(base+(ai?ai.getX(i):i));base+=a.position.count;
   });
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndex,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeight,4));g.setIndex(indices);g.computeBoundingSphere();
   const mesh=new T.SkinnedMesh(g,mat);mesh.name='Bilbo articulated space suit';mesh.castShadow=mat!==glass&&mat!==glint;mesh.receiveShadow=false;mesh.frustumCulled=false;model.root.add(mesh);mesh.bind(model.skeleton,model.meshes[0].bindMatrix.clone());if(mat===glass||mat===glint)mesh.renderOrder=2;suitMeshes.push(mesh);
  });
  owned.forEach(g=>g.dispose());owned.length=0;pieces.length=0;sphere.dispose();detailSphere.dispose();cylinder.dispose();cube.dispose();
  let yaw=1.28,walk=0,locomotion=0,air=0,land=0,wind=0,sail=0,deck=0,bank=0,wasGrounded=true,lastVy=0,localTime=0,distance=0,lastX=null,turnVelocity=0,lastMode='idle';
  const weights={idle:1,walk:0,jump:0,land:0,dig:0,wave:0,ride:0,slide:0,sniff:0,look:0};
  const weightKeys=Object.keys(weights),telemetry={mode:'idle',walk:0,air:0,land:0,wind:0};
  const poseState={speed:0,stridePhase:0,happy:.22,pounce:0,dig:false,sniff:false,ride:false,merak:false,selam:false,sit:false};
  const anchors={groundPaw:0,rideHip:.362,slideHip:.385,ridePaw:.004,slidePaw:.025,nose:.674,head:.76};
  const noseAnchor=new T.Object3D();noseAnchor.name='Bilbo original nose tip';noseAnchor.position.set(0,-.022,.705);model.head.add(noseAnchor);
  const bodyInverse=new T.Matrix4(),ikTarget=new T.Vector3(),hindLegs=model.legs.filter(L=>!L.front);
  model.legs.forEach(L=>{const a=L.shin.position,b=L.foot.position;L.ik={l1:Math.hypot(a.y,a.z),l2:Math.hypot(b.y,b.z),bias1:Math.atan2(-a.z,-a.y),bias2:Math.atan2(-b.z,-b.y),z:L.b.position.z,x:L.b.position.x};});
  let lookYaw=0,lookPitch=0;
  function plantLeg(L,forward,lift,blend){
   if(blend<.001)return;const ik=L.ik;
   ikTarget.set(ik.x,-.012/scale+.128+lift/scale,ik.z+(L.front?.035:0)+forward/scale).applyMatrix4(bodyInverse).sub(L.b.position);
   const d=clamp(Math.hypot(ikTarget.y,ikTarget.z),.08,ik.l1+ik.l2-.001),k=(L.front?1:-1)*Math.acos(clamp((d*d-ik.l1*ik.l1-ik.l2*ik.l2)/(2*ik.l1*ik.l2),-1,1));
   const a=Math.atan2(-ikTarget.z,-ikTarget.y)-Math.atan2(ik.l2*Math.sin(k),ik.l1+ik.l2*Math.cos(k))-ik.bias1,b=k+ik.bias1-ik.bias2;
   L.b.rotation.x+=(clamp(a,-1.65,1.65)-L.b.rotation.x)*blend;L.shin.rotation.x+=(clamp(b,-1.9,1.9)-L.shin.rotation.x)*blend;
   L.foot.rotation.x+=(-model.body.rotation.x-L.b.rotation.x-L.shin.rotation.x-L.foot.rotation.x)*blend;
  }
  function update(dt,t,pose={},celebrate=0,buddy=null){
   dt=clamp(dt||0,0,.06);if(!dt)return;localTime+=dt;
   const mode=pose.mode||'idle',speed=Math.abs(pose.vx||0),grounded=pose.grounded!==false,emote=typeof pose.emote==='string'?pose.emote:pose.emote&&pose.emote.type||'';
   sail=ease(sail,pose.sailing?1:0,10,dt);
   deck=ease(deck,Number.isFinite(pose.skating)?1:0,10,dt);
   bank=ease(bank,clamp(pose.skating||0,-1,1),5.4,dt);
   wind=ease(wind,clamp(Number.isFinite(pose.wind)?pose.wind:0,0,1),3.6,dt);
   if(grounded&&!wasGrounded)land=clamp(Math.abs(lastVy)/8,.15,.8);land=Math.max(0,land-dt*4);lastVy=pose.vy||0;wasGrounded=grounded;
   weightKeys.forEach(k=>weights[k]=ease(weights[k],k===mode?1:0,10,dt));
   walk=ease(walk,grounded&&mode==='walk'?clamp(speed/5.2,0,1):0,11,dt);air=ease(air,grounded?0:1,10,dt);
   locomotion=ease(locomotion,grounded&&mode==='walk'&&speed>.07?1:0,10,dt);
   const run=clamp(speed/4.4,0,1),stance=.58-.32*run,lead=.09+.13*run,strideLength=2*lead/stance;
   const travel=Number.isFinite(pose.x)&&lastX!==null?Math.abs(pose.x-lastX):speed*dt;
   if(grounded&&mode==='walk'&&travel<.4)distance+=travel/strideLength*Math.PI*2;
   lastX=Number.isFinite(pose.x)?pose.x:null;poseState.stridePhase=distance;
   const hasWorldLook=Number.isFinite(pose.lookWorldX)||(Number.isFinite(pose.lookX)&&Math.abs(pose.lookX)>1.001),worldLookX=Number.isFinite(pose.lookWorldX)?pose.lookWorldX:pose.lookX,worldLookY=Number.isFinite(pose.lookWorldY)?pose.lookWorldY:pose.lookY;
   const hasLook=hasWorldLook||Math.abs(pose.lookX||0)+Math.abs(pose.lookY||0)>.001,dx=hasWorldLook?worldLookX-(Number.isFinite(pose.x)?pose.x:root.position.x):0;
   const facing=hasWorldLook&&(mode==='look'||mode==='sniff')&&Math.abs(dx)>.3?Math.sign(dx):(pose.facing<0?-1:1);
   const salute=mode==='wave'||emote==='wave'||celebrate>.48;
   let targetYaw=facing*(mode==='walk'?1.43:salute?.44:mode==='slide'?.56:mode==='ride'?1.02:1.24);if(buddy)targetYaw+=(-buddy.toDog*.74-targetYaw)*buddy.paw;
   const dy=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw));turnVelocity=ease(turnVelocity,dy,10,dt);yaw+=dy*(1-Math.exp(-9*dt));model.root.rotation.y=yaw;
   poseState.speed=mode==='walk'&&grounded?speed:0;poseState.happy=clamp(.24+wind*.08+celebrate*.76+(emote==='happy'?.35:0)+(buddy?.wag||0)*.82,0,1);poseState.pounce=air*(pose.vy>0?1:clamp(.65+(pose.vy||0)*.08,.2,.65));poseState.dig=mode==='dig'||emote==='dig';poseState.sniff=mode==='sniff'||emote==='sniff';poseState.ride=mode==='ride';poseState.merak=emote==='curious'||mode==='look'||(mode==='idle'&&Math.sin(localTime*.48)>.58);poseState.selam=mode==='wave'||emote==='wave'||celebrate>.48||(buddy?.paw||0)>.24;poseState.sit=mode==='ride';
   model.update(dt,poseState);
   // Soft low-gravity landing compression, motion lag, and sled crouch are layered
   // on the original bone poses; no external root position is ever overwritten.
   const cycle=((distance/(Math.PI*2))%1+1)%1,pairPhase=(cycle*2)%1,contactFraction=Math.min(.99,stance*2),bound=pairPhase>contactFraction?Math.sin((pairPhase-contactFraction)/(1-contactFraction)*Math.PI)*.045*run:0;
   const impact=Math.max(land,weights.land*.4);
   model.body.position.y-=impact*.075+weights.slide*.08+weights.dig*.035+Math.max(weights.sniff,poseState.sniff?.65:0)*.035+locomotion*(.075+.045*run)-bound/scale*locomotion;
   model.body.rotation.x-=weights.slide*.11+weights.dig*.13;model.neck.rotation.x+=weights.dig*.13;model.head.rotation.y-=turnVelocity*.1;
   // A friendly, tiny brace inside the suit; the breeze never moves the actor root.
   const brace=wind*(grounded?1:.2);model.body.position.y-=brace*.025;model.body.rotation.x+=brace*.025;
   model.head.rotation.z+=wind*.035*Math.sin(localTime*1.3+.7);model.head.rotation.x-=wind*.012;
   const ly=hasWorldLook?clamp(Math.atan2(dx*Math.cos(yaw),Math.max(.25,dx*Math.sin(yaw))),-.55,.55):hasLook?clamp(pose.lookX||0,-1,1)*.55:0;
   const lp=hasWorldLook&&Number.isFinite(worldLookY)?clamp(-Math.atan2(worldLookY-(Number.isFinite(pose.y)?pose.y:root.position.y)-.76,Math.max(.4,Math.abs(dx))),-.48,.55):hasLook?-clamp(pose.lookY||0,-1,1)*.55:0;
   lookYaw=ease(lookYaw,ly,8,dt);lookPitch=ease(lookPitch,lp,8,dt);model.head.rotation.y+=lookYaw;model.head.rotation.x+=lookPitch*(mode==='sniff'?.22:.68);model.neck.rotation.x+=lookPitch*(mode==='sniff'?.05:.18);
   model.head.rotation.z+=Math.sin(localTime*1.7)*.025*(1-walk);
   model.ears.forEach(e=>{e.b.rotation.x-=air*.18+weights.slide*.12;e.b.rotation.z=clamp(e.b.rotation.z+e.side*impact*.12,-.18,.18);});
   model.legs.forEach(L=>{L.b.rotation.x+=impact*.12;if(mode==='slide'){L.b.rotation.x-=.38*weights.slide;L.shin.rotation.x+=(L.front?.25:-.24)*weights.slide;}});
   // The harness takes the weight in the air. On the ice sail he widens
   // his stance and lets the deck roll underneath his planted paws.
   if(sail>.002||deck>.002){
    model.body.rotation.x+=sail*.10;model.body.position.y-=deck*.055;
    model.body.rotation.z+=deck*bank*.075;
    model.head.rotation.z-=deck*bank*.045;
    model.ears.forEach(e=>{e.b.rotation.x-=sail*.09;e.b.rotation.z+=e.side*(.025+.027*Math.sin(localTime*3.1))*sail;});
    if(sail>.002)model.legs.forEach(L=>{
      const swing=.057*Math.sin(localTime*2.7+L.side*.37+(L.front?1.25:0));
      L.b.rotation.x+=( (L.front?-.12:.06)+swing-L.b.rotation.x)*sail;
      L.shin.rotation.x+=((L.front?.24:-.37)-L.shin.rotation.x)*sail;
    });
   }
   if(mode==='ride'||mode==='slide'){
    model.body.updateMatrix();bodyInverse.copy(model.body.matrix).invert();
    const contact=mode==='ride'?anchors.ridePaw:anchors.slidePaw,blend=mode==='ride'?weights.ride:weights.slide;
    model.legs.forEach(L=>plantLeg(L,0,contact,blend));
   }else if(grounded){
    model.body.updateMatrix();bodyInverse.copy(model.body.matrix).invert();
    const settle=air>.025||impact>.01?1:0,sniffContact=Math.max(weights.sniff,poseState.sniff?.65:0);
    model.legs.forEach(L=>{
     const offset=(L.front?(L.side>0?.5:0):(L.side>0?0:.5)),phase=(cycle+offset)%1;
     let forward=0,lift=0;
     if(phase<stance)forward=lead*(1-2*phase/stance);else{const s=(phase-stance)/(1-stance),u=s*s*(3-2*s);forward=-lead+2*lead*u;lift=(.075+.085*run)*Math.pow(Math.sin(s*Math.PI),.85);}
     let digForward=0,digLift=0;if(L.front){const p=(localTime*2.3+(L.side>0?.5:0))%1;if(p<.62)digForward=.18-.28*p/.62;else{const s=(p-.62)/.38,u=s*s*(3-2*s);digForward=-.10+.28*u;digLift=.125*Math.sin(s*Math.PI);}if(p<.62)digLift=-.006;}
     const windContact=(poseState.selam&&L.front&&L.side>0)?0:clamp(wind*4,0,1)*(1-Math.max(locomotion,weights.dig,sniffContact,settle));
     const total=locomotion+weights.dig+sniffContact+settle+windContact+deck,blend=clamp(total,0,1);
     plantLeg(L,(forward*locomotion+digForward*weights.dig)/Math.max(1,total),(lift*locomotion+digLift*weights.dig)/Math.max(1,total),blend);
    });
   }
   model.tail.rotation.x-=air*.17;model.jaw.rotation.x+=weights.slide*.055;
   // A closed helmet limits the pant to a small happy tongue curl.
   if(mode==='ride'||model.tongue.scale.x>.8){model.jaw.rotation.x*=.86;model.tongue.rotation.x*=.78;}
   if(mode==='idle'&&lastMode==='dig')model.head.rotation.z+=.06*Math.sin(localTime*16)*Math.exp(-weights.dig*6);
   model.tail.rotation.x+=wind*.025+sail*.07;
   lastMode=mode;telemetry.mode=mode;telemetry.walk=walk;telemetry.air=air;telemetry.land=land;telemetry.wind=wind;root.userData.pose=telemetry;
  }
  function dispose(){suitMeshes.forEach(m=>m.geometry.dispose());[white,teal,orange,dark,silver,glass,glint].forEach(m=>m.dispose());if(fabric)fabric.dispose();model.dispose();}
  const anchorScratch=new T.Vector3();
  function getAnchor(name,out=new T.Vector3()){
   root.updateMatrixWorld(true);
   if(name==='nose'||name==='head')return (name==='nose'?noseAnchor:model.head).getWorldPosition(out);
   if(/paw/i.test(name)){out.set(0,0,0);model.legs.forEach(L=>{anchorScratch.set(0,-.128,.075);L.foot.localToWorld(anchorScratch);out.add(anchorScratch);});return out.multiplyScalar(.25);}
   out.set(0,0,0);hindLegs.forEach(L=>out.add(L.b.getWorldPosition(anchorScratch)));return out.multiplyScalar(.5);
  }
  root.userData.identity={name:'Bilbo',breed:'Chocolate Labrador',source:M.BilboOriginal.source,sourceSha256:M.BilboOriginal.sourceSha256,originalSkeleton:true};
  return {root,update,dispose,model,anchors,getAnchor,source:M.BilboOriginal.source,rig:{body:model.body,head:model.head,neck:model.neck,legs:model.legs,tail:model.tail,ears:model.ears},suitMeshes};
 };
})(window.MARS);
