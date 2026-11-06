/* Astronaut adapter for the ACTUAL Feza model from feza-piril-3d-arpg.
 * Geometry, signature face shader, layered hair and 12 core bone transforms are reused.
 * Pressure suit finish, articulated glove/boot joints, helmet and exploration poses are new.
 * World position, renderer, input, audio and game clock are owned by the host.
 */
(function(M){
'use strict';
const T=THREE,PI=Math.PI,TAU=PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const damp=(a,b,k,dt)=>mix(a,b,1-Math.exp(-k*dt));
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const SIDES=['L','R'],WEIGHTS=['wave','dig','slide','ride'],EMPTY_POSE=Object.freeze({});
const C={white:0xe9eee9,edge:0xc7d7d5,teal:0x287f88,dark:0x264c56,orange:0xe8934c,seam:0x6d9296,light:0xa6edf0};
let suitMat,rubberMat,metalMat,emissiveMat,glassMat,glintMat,weave,pressureGeometry;
function materials(){
 if(suitMat)return;
 const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d');q.fillStyle='#b8b8b8';q.fillRect(0,0,64,64);for(let y=0;y<64;y+=4)for(let x=0;x<64;x+=4){q.fillStyle=((x+y)/4)%2?'#c5c5c5':'#a6a6a6';q.fillRect(x,y,3,1);q.fillRect(x,y,1,3);}weave=new T.CanvasTexture(c);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(4,4);
 suitMat=new T.MeshStandardMaterial({color:C.white,roughness:.8,bumpMap:weave,bumpScale:.0011});
 rubberMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.78});metalMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.43,metalness:.16});emissiveMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.35,emissive:0x79d8df,emissiveIntensity:.38});
 glassMat=new T.MeshPhysicalMaterial({color:0xbce5eb,transparent:true,opacity:.08,roughness:.1,metalness:.04,clearcoat:1,depthWrite:false,side:T.FrontSide});
 glassMat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`float visorEdge=pow(clamp(1.0-dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),2.2);diffuseColor.a=.024+visorEdge*.61;outgoingLight+=vec3(.39,.68,.77)*visorEdge*.52;\n#include <opaque_fragment>`);};glassMat.customProgramCacheKey=()=> 'actual-feza-helmet-v1';
 glintMat=new T.MeshBasicMaterial({color:0xedfcff,transparent:true,opacity:.69,depthWrite:false,toneMapped:false});
}
function curve(points,r=.005,n=points.length===2?1:Math.min(14,(points.length-1)*4),sides=5){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),n,r,sides,false);}
function mergeGeometry(geos){const p=[],n=[],u=[],ix=[];let offset=0;for(const g of geos){p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);u.push(...g.attributes.uv.array);for(const i of g.index.array)ix.push(i+offset);offset+=g.attributes.position.count;g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setIndex(ix);return g;}
function angles(l1,l2,dy,z,out){const d=clamp(Math.hypot(dy,z),.001,l1+l2-.00005),knee=Math.acos(clamp((d*d-l1*l1-l2*l2)/(2*l1*l2),-1,1));out.knee=knee;out.upper=Math.atan2(-z,-dy)-Math.atan2(l2*Math.sin(knee),l1+l2*Math.cos(knee));return out;}
function angleDamp(a,b,k,dt){let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return a+d*(1-Math.exp(-k*dt));}
function patch(parent,text,w,h){const c=document.createElement('canvas');c.width=384;c.height=128;const q=c.getContext('2d');q.fillStyle='#f1f4e8';q.fillRect(0,0,384,128);q.strokeStyle='#337e83';q.lineWidth=8;q.strokeRect(5,5,374,118);q.fillStyle='#28545d';q.textAlign='center';q.textBaseline='middle';q.font='bold 75px sans-serif';q.fillText(text,192,70);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tx,roughness:.85}));parent.add(m);return m;}
M.createFezaAstronaut=function(){
 if(!M.FezaOriginal)throw new Error('Load model-data/feza-original.js before feza-astronaut.js');
 materials();
 const original=M.FezaOriginal.create({articulated:true}),root=original.root,B=original.bones,list=original.boneList,H=M.FezaOriginal.helpers,parts={rubber:[],metal:[],glow:[]};
 root.name='Feza · original identity · astronaut';root.scale.setScalar(1.15);
 // The original pressure-suit body surfaces keep Feza's recognizable child proportions.
 original.meshes.cloth.material=suitMat;original.meshes.pants.material=suitMat;
 // Identical pressure-cloth finish: merge the two unchanged original surfaces into one cached draw.
 if(!pressureGeometry)pressureGeometry=H.concat([original.meshes.cloth.geometry,original.meshes.pants.geometry]);
 const pressureSuit=new T.SkinnedMesh(pressureGeometry,suitMat);pressureSuit.name='Original Feza body · merged pressure suit';pressureSuit.bind(original.skeleton,original.meshes.skin.bindMatrix);pressureSuit.frustumCulled=false;pressureSuit.castShadow=true;root.remove(original.meshes.cloth,original.meshes.pants);root.add(pressureSuit);original.meshes.pressureSuit=pressureSuit;
 original.meshes.skin.material.stencilWrite=false;original.meshes.hair.material.stencilWrite=false;
 // Keep the original locks and brown vertex palette; soften the old game's high-key highlight for Mars sunlight.
 {const m=original.meshes.hair.material,base=m.onBeforeCompile;m.roughness=.74;m.normalScale.set(.17,.17);m.envMapIntensity=.35;m.onBeforeCompile=(shader,renderer)=>{base(shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('pow(fzF, 2.4) * 0.3 + 0.2 * smoothstep','pow(fzF, 2.4) * 0.15 + 0.065 * smoothstep').replace('pow(fzF, 3.0) * 0.12','pow(fzF, 3.0) * 0.075');};m.customProgramCacheKey=()=> 'actual-feza-space-hair-soft1';}
 const shoeGeo=original.meshes.shoe.geometry,sp=shoeGeo.attributes.position,sc=shoeGeo.attributes.color,color=new T.Color();
 for(let i=0;i<sp.count;i++){const y=sp.getY(i),z=sp.getZ(i);color.setHex(y<.035?C.dark:y>.15?C.teal:z>.11&&y<.074?C.edge:C.white);sc.setXYZ(i,color.r,color.g,color.b);}sc.needsUpdate=true;original.meshes.shoe.material=new T.MeshStandardMaterial({vertexColors:true,roughness:.7});
 function add(group,bone,geo,color,weights){parts[group].push({geo,bone:list.indexOf(B[bone]),color, ...(weights?{w:weights}:{})});}
 function kit(group,bone,fn){add(group,bone,H.kitGeo(fn),0xffffff);}
 function line(group,bone,points,r,col,weights){add(group,bone,curve(points,r),col,weights);}
 const legWeight=s=>(x,y)=>[list.indexOf(B['thigh'+s]),list.indexOf(B['shin'+s]),1-smooth(.21,.28,y)];
 // Flexible waist, continuous side seams, knee pads, wrist locks and articulated pressure gloves.
 kit('rubber','hips',k=>{k.add(H.G.torus(TAU,.07,28),C.dark,[0,.456,0],[PI/2,0,0],[.199,.16,.199]);k.add(H.G.rbox(1),C.orange,[0,.459,.17],0,[.064,.047,.019]);});
 for(const side of SIDES){const s=side==='L'?1:-1,ax=s*.175;
  kit('metal','arm'+side,k=>{k.add(H.G.sphere(14,9),C.teal,[ax,.752,-.005],[0,0,-s*.12],[.075,.064,.078]);k.add(H.G.rbox(1),C.edge,[ax+s*.057,.751,.015],[0,s*PI/2,0],[.075,.045,.012]);});
  for(let j=0;j<3;j++)kit('rubber','fore'+side,k=>k.add(H.G.torus(TAU,.065,16),j===1?C.dark:C.seam,[ax,.609-j*.012,-.005],[PI/2,0,0],[.061,.059,.06]));
  kit('metal','fore'+side,k=>{k.add(H.G.torus(TAU,.13,16),C.teal,[ax,.476,-.005],[PI/2,0,0],[.058,.056,.057]);k.add(H.G.torus(TAU,.06,16),C.orange,[ax,.466,-.005],[PI/2,0,0],[.059,.056,.059]);});
  kit('rubber','hand'+side,k=>{k.add(H.G.sphere(14,9),C.white,[ax,.418,.004],0,[.052,.057,.052]);k.add(H.G.sphere(12,8),C.teal,[ax,.422,.052],0,[.035,.038,.008]);k.add(H.G.sphere(10,7),C.white,[ax-s*.038,.433,.027],[0,0,s*.5],[.022,.03,.023]);for(let j=0;j<4;j++)k.add(H.G.sphere(8,6),C.white,[ax+(j-1.5)*.0165*s*-1+.004*s,.39-((j===1||j===2)?.004:0),.034-Math.abs(j-1.5)*.004],0,[.014,.024,.016]);});
  for(let j=0;j<3;j++)line('rubber','hand'+side,[[ax+(j-1)*.017,.409,.052],[ax+(j-1)*.017,.389,.047]],.0023,C.seam);
  kit('rubber','shin'+side,k=>{k.add(H.G.sphere(14,9),C.teal,[s*.09,.252,.065],0,[.07,.055,.025]);k.add(H.G.rbox(1),C.edge,[s*.09,.255,.091],0,[.07,.046,.012]);});
  for(let j=0;j<2;j++)kit('rubber','shin'+side,k=>k.add(H.G.torus(TAU,.06,16),C.seam,[s*.09,.216-j*.014,0],[PI/2,0,0],[.069,.066,.068]));
  line('rubber','thigh'+side,[[s*.176,.415,.012],[s*.17,.35,.015],[s*.16,.28,.01],[s*.149,.215,.008],[s*.141,.18,.005]],.0038,C.seam,legWeight(side));
  kit('metal','foot'+side,k=>{k.add(H.G.torus(TAU,.08,16),C.teal,[s*.088,.145,.001],[PI/2,0,0],[.059,.057,.058]);k.add(H.G.torus(TAU,.04,16),C.orange,[s*.088,.134,.001],[PI/2,0,0],[.058,.057,.058]);k.add(H.G.rbox(1),C.orange,[s*.088,.055,.125],[-.2,0,0],[.063,.023,.013]);k.add(H.G.rbox(1),C.dark,[s*.088,.021,-.07],0,[.077,.025,.012]);});
  line('rubber','arm'+side,[[ax+s*.061,.726,.012],[ax+s*.062,.679,.017],[ax+s*.057,.636,.016]],.0035,C.seam,(x,y)=>[list.indexOf(B['arm'+side]),list.indexOf(B['fore'+side]),1-smooth(.57,.64,y)]);
 }
 // Compact life support pack: short enough to preserve the original head/torso silhouette.
 kit('rubber','chest',k=>{k.add(H.G.rbox(2),C.dark,[0,.637,-.18],0,[.265,.3,.125]);k.add(H.G.rbox(2),C.white,[0,.642,-.25],0,[.219,.243,.048]);k.add(H.G.rbox(1),C.orange,[0,.718,-.279],0,[.105,.037,.012]);for(const s of [-1,1]){k.add(H.G.sphere(12,8),C.teal,[s*.126,.636,-.217],0,[.035,.111,.043]);k.add(H.G.torus(TAU,.12,16),C.orange,[s*.126,.725,-.217],[PI/2,0,0],[.035,.03,.035]);}});
 for(const s of [-1,1])line('rubber','chest',[[s*.11,.74,-.172],[s*.195,.732,-.11],[s*.205,.666,.002],[s*.15,.621,.11]],.011,C.dark);
 // Mission tools are sewn into the existing suit batches. Their silhouettes
 // change with the planet without adding a render pass or touching Feza's face.
 if(M.planet==='mars'){
  kit('rubber','hips',k=>{
   k.add(H.G.rbox(1),0xb46743,[.153,.444,.095],[0,.60,-.09],[.096,.106,.050]);
   k.add(H.G.rbox(1),0xe5be82,[.157,.476,.108],[0,.60,-.09],[.103,.035,.052]);
  });
  kit('metal','hips',k=>k.add(H.G.cyl(1,1,12),0x497e7e,[.173,.442,.127],[PI/2,.52,0],[.014,.011,.014]));
 }else if(M.planet==='saturn'){
  for(const side of SIDES){
   const sign=side==='L'?1:-1;
   kit('metal','foot'+side,k=>{
    k.add(H.G.rbox(1),0xc19a58,[sign*.132,.047,.063],[0,0,sign*.055],[.034,.033,.134]);
    for(let j=0;j<2;j++)k.add(H.G.rbox(1),0x77d8de,[sign*.149,.048,.018+.084*j],0,[.012,.018,.024]);
   });
  }
 }else if(M.planet==='neptune'){
  for(const sign of [-1,1]){
   line('rubber','chest',[[sign*.158,.752,-.082],[sign*.159,.732,.062],[sign*.139,.654,.129],[sign*.112,.548,.12]],.013,0x49999d);
   kit('metal','chest',k=>k.add(H.G.torus(TAU,.19,14),0xe5b472,[sign*.147,.687,.116],[-.25,sign*.34,0],[.025,.032,.025]));
  }
 }
 // A fully clear, torso-mounted dome lets the actual original head move freely inside.
 const helmet=new T.Group();helmet.name='Pressure helmet';helmet.position.set(0,.53,-.09);B.chest.add(helmet);
 const rx=.431,ry=.446,rz=.528,cut=Math.acos(-.34/.446),dome=new T.Mesh(new T.SphereGeometry(1,48,28,0,TAU,0,cut),glassMat);dome.scale.set(rx,ry,rz);dome.renderOrder=6;helmet.add(dome);
 const glints=[];for(const s of [-1,1])for(let n=0;n<2;n++){const p=[];for(let j=0;j<=20;j++){const u=j/20,b=mix(n?.65:.08,n?.84:.63,u),a=s*((n?.65:.82)-Math.sin(u*PI*.55)*(n?.08:.2));p.push([Math.sin(a)*Math.cos(b)*rx*1.008,Math.sin(b)*ry*1.008,Math.cos(a)*Math.cos(b)*rz*1.008]);}glints.push(curve(p,n?.0045:.011,14));}const glare=new T.Mesh(mergeGeometry(glints),glintMat);glare.renderOrder=7;helmet.add(glare);
 kit('metal','chest',k=>{k.add(H.G.torus(TAU,.055,36),C.white,[0,.792,-.09],[PI/2,0,0],[.279,.342,.279]);k.add(H.G.torus(TAU,.03,36),C.teal,[0,.782,-.09],[PI/2,0,0],[.284,.348,.284]);k.add(H.G.torus(TAU,.025,36),C.orange,[0,.804,-.09],[PI/2,0,0],[.273,.334,.273]);for(const s of [-1,1]){k.add(H.G.rbox(1),C.edge,[s*.279,.786,-.09],0,[.027,.038,.055]);k.add(H.G.rbox(1),C.white,[s*.215,.768,-.065],[0,0,s*.1],[.145,.051,.13]);}});
 // Chest panel, embroidered mission medallion and a tiny friendly star.
 kit('metal','chest',k=>{k.add(H.G.rbox(1),C.teal,[.064,.666,.143],[-.06,0,0],[.105,.092,.019]);k.add(H.G.cyl(1,1,16),C.orange,[-.067,.71,.129],[PI/2,0,0],[.042,.009,.042]);k.add(H.G.cyl(1,1,16),C.dark,[-.067,.71,.136],[PI/2,0,0],[.031,.009,.031]);});
 kit('glow','chest',k=>{k.add(H.G.rbox(1),C.light,[.064,.686,.156],0,[.072,.024,.006]);for(let j=0;j<3;j++)k.add(H.G.sphere(8,6),j===0?C.orange:C.light,[.037+j*.027,.649,.156],0,[.007,.007,.004]);k.add(H.G.sphere(12,8),0xfff2be,[-.067,.712,.143],0,[.012,.012,.004]);});
 const label=patch(B.chest,'FEZA',.121,.035);label.position.set(-.015,.003,.15);
 for(const side of SIDES){const s=side==='L'?1:-1,g=new T.CapsuleGeometry(.012,.066,4,10);g.translate(s*.175-s*.0207,.369,.029);add('rubber','index'+side,g,C.white);}
 for(const [name,mat]of [['rubber',rubberMat],['metal',metalMat],['glow',emissiveMat]]){const g=H.mergeSkinned(parts[name]),mesh=new T.SkinnedMesh(g,mat);mesh.name='Feza astronaut '+name;root.add(mesh);mesh.bind(original.skeleton,original.meshes.skin.bindMatrix);mesh.castShadow=name!=='glow';mesh.frustumCulled=false;}
 const fingers={};for(const side of SIDES){fingers[side]=B['index'+side];fingers[side].scale.y=.001;}
 const gaze=V(),targetEye=V(),targetMouth=new T.Vector4(),targetBrow=V(),a={phase:0,time:0,move:0,air:0,land:0,yaw:0,lookX:0,lookY:0,gestureY:.1,curious:0,happy:0,point:0,pointL:0,pointR:0,curiousL:0,curiousR:0,wind:0,sailing:0,sailTug:0,deck:0,deckLean:0,wasGrounded:true,weights:{wave:0,dig:0,slide:0,ride:0},ik:{upper:0,knee:0}};
 function update(dt,t,p=EMPTY_POSE,celebrate=0,buddy=null){
  dt=clamp(dt||0,0,.06);if(dt<=0)return;a.time+=dt;t=a.time;const speed=Math.abs(p.vx||0),grounded=p.grounded!==false,mode=p.mode||(!grounded?'jump':speed>.1?'walk':'idle');
  if(grounded&&!a.wasGrounded&&mode!=='ride'&&mode!=='slide')a.land=1;a.wasGrounded=grounded;a.land=damp(a.land,0,11,dt);a.air=damp(a.air,grounded||mode==='ride'||mode==='slide'?0:1,grounded?22:10,dt);a.move=damp(a.move,grounded&&mode==='walk'?clamp(speed/3.5,0,1):0,10,dt);a.phase+=dt*(3+speed*2.65);a.curious=damp(a.curious,p.emote==='curious'?1:0,9,dt);a.happy=damp(a.happy,p.emote==='happy'?1:0,9,dt);a.point=damp(a.point,p.emote==='point'?1:0,9,dt);a.wind=damp(a.wind,clamp(p.wind||0,0,1),3.5,dt);for(const key of WEIGHTS)a.weights[key]=damp(a.weights[key],mode===key?1:0,10,dt);
  a.sailing=damp(a.sailing,p.sailing?1:0,10,dt);
  a.sailTug=damp(a.sailTug,p.sailing?clamp(p.sailTug||0,0,1):0,11,dt);
  a.deck=damp(a.deck,Number.isFinite(p.skating)?1:0,10,dt);
  a.deckLean=damp(a.deckLean,clamp(p.skating||0,-1,1),5.4,dt);
  const w=a.weights,wind=a.wind,walk=a.move,jump=a.air,land=a.land,ph=a.phase,sn=Math.sin(ph),cs=Math.cos(ph),tuck=smooth(-2.5,2.5,p.vy||0),facing=p.facing<0?-1:1;
  // The greeting turns only the rendered pose. A child can keep steering or jump away.
  const wave=buddy?.wave||0,turn=wave*(1-walk),toward=buddy?.toDog||facing;
  a.yaw=angleDamp(a.yaw,mix(facing*.99,toward*.81,turn),8,dt);B.root.rotation.set(walk*.07-jump*.09+w.slide*-.17, a.yaw, -sn*.022*walk);B.root.position.set(0,-walk*.028+Math.abs(cs)*.013*walk+Math.sin(t*2.3)*.0015*(1-walk)-land*.055-w.ride*.11-w.slide*.17,0);
  B.hips.rotation.set(0,walk*.12*sn,walk*.022*cs);B.chest.rotation.set(.02+Math.sin(t*2.3)*.01-land*-.1+w.dig*.2+wind*.035,-walk*.16*sn,-walk*.016*cs+wind*.008*Math.sin(t*.7));B.head.rotation.set(-.22+Math.sin(t*1.9)*.016+w.dig*.17-jump*tuck*.05-wind*.008,-a.yaw*.18+Math.sin(t*.68)*.035+wind*.012*Math.sin(t*.45),.045+Math.sin(t*1.1)*.018+a.curious*.035+wind*.008);
  for(const side of SIDES){const s=side==='L'?1:-1,legPh=ph+(s<0?PI:0),ss=Math.sin(legPh),lift=Math.max(0,-Math.cos(legPh))*.065*walk,ik=angles(.195,.195,.05-(.44+B.root.position.y)+lift,-ss*.115*walk,a.ik);let up=mix(ik.upper,-mix(.17,.86,tuck)+s*.15*tuck,jump),knee=mix(ik.knee,mix(.28,1.45,tuck),jump),foot=mix(-(ik.upper+ik.knee),-.19*tuck,jump);up=mix(up,-1.15,w.ride);knee=mix(knee,1.3,w.ride);foot=mix(foot,-.1,w.ride);up=mix(up,-1.62,w.slide);knee=mix(knee,.08,w.slide);foot=mix(foot,.08,w.slide);B['thigh'+side].rotation.set(up,0,s*(.035+jump*.035));B['shin'+side].rotation.set(knee,0,0);B['foot'+side].rotation.set(foot,0,s*.008);
   const helloWave=(s===-toward ? .94 : .07)*wave;
   const armWave=(s>0?w.wave:.18*w.wave)+celebrate*.8+a.happy*.32+helloWave,as=Math.sin(ph+(s>0?PI:0));B['arm'+side].rotation.set(.04+as*.43*walk-jump*(.24+.26*tuck)-w.ride*.67-w.dig*.65,0,s*(.13+jump*.48+armWave*.28+w.slide*.45));B['fore'+side].rotation.set(-.22-Math.max(0,-as)*.3*walk-jump*.24-w.ride*.55-w.dig*(.65+.18*Math.sin(t*7)),0,0);if(armWave>.01){B['arm'+side].rotation.x-=armWave*2.45;B['arm'+side].rotation.z+=s*armWave*.35;B['fore'+side].rotation.x-=armWave*(.25+.3*Math.sin(t*7));}B['hand'+side].rotation.set(armWave*.13*Math.sin(t*8),armWave*.18*Math.sin(t*7),s*armWave*.12);const arm=B['arm'+side],fore=B['fore'+side],hand=B['hand'+side];arm.rotation.x=mix(arm.rotation.x,s>0?-.70:-.55,w.ride);arm.rotation.z=mix(arm.rotation.z,s*.12,w.ride);fore.rotation.x=mix(fore.rotation.x,(s>0?-.72:-.92)+Math.sin(t*2.6+s)*.025,w.ride);hand.rotation.x=mix(hand.rotation.x,-.16+Math.sin(t*2.6)*.018,w.ride);hand.rotation.y=mix(hand.rotation.y,s*.12,w.ride);hand.rotation.z=mix(hand.rotation.z,s*.08,w.ride);arm.rotation.x=mix(arm.rotation.x,s>0?-.40:-.28,w.slide);arm.rotation.z=mix(arm.rotation.z,s*.25,w.slide);fore.rotation.x=mix(fore.rotation.x,(s>0?-.45:-.65)+Math.sin(t*3+s)*.025,w.slide);hand.rotation.x=mix(hand.rotation.x,-.15,w.slide);hand.rotation.y=mix(hand.rotation.y,s*.12,w.slide);hand.rotation.z=mix(hand.rotation.z,s*.08,w.slide);arm.rotation.x-=wind*.025;arm.rotation.z+=s*wind*.012;fore.rotation.x-=wind*.015;hand.rotation.x-=wind*.012;
  }
  if(wave>0){
   // The nearer glove stays beside the visor so the child can see the wave.
   const waveSide=toward<0?'L':'R';
   B['arm'+waveSide].rotation.z-=toward*.40*wave;
   B['hand'+waveSide].rotation.z-=toward*.29*Math.sin(t*10)*wave;
   B.chest.rotation.y+=toward*.10*wave;B.head.rotation.y+=toward*.19*wave;
   B.head.rotation.x+=.13*wave;B.head.rotation.z-=toward*.08*wave;
  }
  // Source face channels: normalized gaze, curved brows, cheek blush, smirk / grin / little 'o'.
  let lx=-a.yaw*.7,ly=.1;if(M.camera){gaze.copy(M.camera.position);B.head.worldToLocal(gaze);if(gaze.z>.05){lx=clamp(Math.atan2(gaze.x,gaze.z)/.55,-1,1)*.85;ly=Math.min(.12,clamp(Math.atan2(gaze.y,Math.hypot(gaze.x,gaze.z))/.7,-1,1)*.85);}}lx=mix(lx,0,walk);ly=mix(ly,.1,walk);if(wave>0){lx=mix(lx,toward*.45,wave);ly=mix(ly,-.46,wave);}if(Number.isFinite(p.lookX))lx=clamp(p.lookX,-1,1);if(Number.isFinite(p.lookY))ly=clamp(p.lookY,-1,1);a.gestureY=damp(a.gestureY,ly,12,dt);const gestureY=a.gestureY;ly=Math.min(.12,ly);a.lookX=damp(a.lookX,lx,18,dt);a.lookY=damp(a.lookY,ly,18,dt);
  const pointingSide=a.yaw>=0?'R':'L';a.pointL=damp(a.pointL,pointingSide==='L'?a.point:0,8,dt);a.pointR=damp(a.pointR,pointingSide==='R'?a.point:0,8,dt);a.curiousL=damp(a.curiousL,pointingSide==='L'?a.curious:0,8,dt);a.curiousR=damp(a.curiousR,pointingSide==='R'?a.curious:0,8,dt);
  for(const side of SIDES){const weight=side==='L'?a.curiousL:a.curiousR;if(weight>.001){const arm=B['arm'+side],fore=B['fore'+side],k=weight*(1-walk)*.85;arm.rotation.x=mix(arm.rotation.x,-1.1,k);fore.rotation.x=mix(fore.rotation.x,-.95,k);arm.rotation.y=mix(arm.rotation.y,side==='R'?.28:-.28,k);}}
  for(const side of SIDES){const s=side==='L'?1:-1,point=side==='L'?a.pointL:a.pointR;fingers[side].scale.y=Math.max(.001,point);if(point>.001){const arm=B['arm'+side],fore=B['fore'+side];arm.rotation.x=mix(arm.rotation.x,-1.22-clamp(gestureY,-1,1)*.42,point);arm.rotation.y=mix(arm.rotation.y,-s*.06,point);arm.rotation.z=mix(arm.rotation.z,s*.25,point);fore.rotation.x=mix(fore.rotation.x,-.22,point);B['hand'+side].rotation.x=mix(B['hand'+side].rotation.x,.1,point);}}
  // Suspended from a sail she takes a riser in each hand. Pulling the sail
  // draws both elbows down; releasing it lets her stretch out again.
  const sail=a.sailing,tug=a.sailTug,deck=a.deck,lean=a.deckLean;
  if(sail>.002||deck>.002){
    B.chest.rotation.x+=sail*(-.07+.13*tug)+deck*.08;
    B.head.rotation.x-=sail*(.055+.05*tug);
    B.hips.rotation.z+=deck*(.025*Math.sin(t*2)-.06*lean);
    B.chest.rotation.z+=deck*.095*lean;
    B.root.position.y-=deck*(.032+.018*Math.abs(lean));
    for(const side of SIDES){
      const sign=side==='L'?1:-1,arm=B['arm'+side],fore=B['fore'+side],hand=B['hand'+side];
      const thigh=B['thigh'+side],shin=B['shin'+side],foot=B['foot'+side];
      arm.rotation.x=mix(arm.rotation.x,-2.22+.65*tug+.035*Math.sin(t*2.8+sign),sail);
      arm.rotation.z=mix(arm.rotation.z,sign*(.42+.11*tug),sail);
      fore.rotation.x=mix(fore.rotation.x,-.65-.56*tug,sail);hand.rotation.z+=sail*sign*.13;
      thigh.rotation.x=mix(thigh.rotation.x,-.21-.13*(sign>0?1:0)-.14*tug,sail);
      shin.rotation.x=mix(shin.rotation.x,.53+.19*sign+.16*tug,sail);
      foot.rotation.x=mix(foot.rotation.x,.10,sail);
      arm.rotation.z=mix(arm.rotation.z,sign*(.66+.21*Math.abs(lean))+.13*lean,deck);
      arm.rotation.x=mix(arm.rotation.x,-.29+.055*Math.sin(t*1.75+sign),deck);
      fore.rotation.x=mix(fore.rotation.x,-.50+.07*lean*sign,deck);
      thigh.rotation.x-=deck*.17;shin.rotation.x+=deck*.36;foot.rotation.x-=deck*.19;
    }
  }
  const U=original.face,blink=Math.pow(Math.max(0,Math.cos((t+1.4)*.83)),90),joy=clamp(Math.max(a.happy*.85,celebrate+w.wave*.35+w.slide*.22,wave*.72)+a.point*.12,0,1),eyeHappy=Math.max(joy*.08,a.happy,smooth(.4,.7,celebrate)),grin=clamp(joy*.65+jump*.1+wind*.06,0,1),o=clamp((a.curious*.3+jump*tuck*.08)*(1-grin),0,1),blend=1-Math.exp(-22*dt);U.fzEye.value.set(blink*(1-eyeHappy),a.lookX,a.lookY,w.dig*.13);U.fzEyeW.value.lerp(targetEye.set(1-eyeHappy,eyeHappy,0),blend);U.fzMouth.value.lerp(targetMouth.set(1-grin-o,grin,o,0),blend);U.fzBrow.value.lerp(targetBrow.set(.4+jump*tuck*.35+joy*.18+a.curious*.3+wind*.13,w.dig*.2,.4+joy*.35),blend);original.hairUniforms.fzHOff.value.set(-sn*.003*walk,Math.sin(t*3)*.0015+jump*.003,0);original.hairUniforms.fzHExp.value=joy*.002;
 }
 return{root,update,source:original,rig:B,helmet,visor:dome,height:1.813,anchors:{rideHip:.3795,slideHip:.3105},rideSeatHeight:.3795,slideSeatHeight:.3105,modelIdentity:'actual feza-piril-3d-arpg Feza'};
};
})(window.MARS);
