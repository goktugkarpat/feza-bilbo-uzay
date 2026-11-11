/* Distant, non-interactive expedition scenery. Every fixed vignette shares one
 * painted mesh; the little cloud craft share one instanced mesh. Nothing here
 * receives input, changes the walking surface or adds a light/shadow pass. */
(function(M){
 'use strict';
 M.createPlanetDetails=function({scene,world,player}){
  const T=THREE,planet=M.planet||'mars',root=new T.Group();
  root.name='Distant expedition landmarks';scene.add(root);
  const owned=[],meshes=[],moving=[],TAU=Math.PI*2;let disposed=false;
  const ink=new T.Color(),v=new T.Vector3(),n=new T.Vector3(),dir=new T.Vector3(),up=new T.Vector3(0,1,0),normal=new T.Matrix3(),pose=new T.Object3D();
  const shape={box:new T.BoxGeometry(),sphere:new T.SphereGeometry(1,16,10),cylinder:new T.CylinderGeometry(1,1,1,12),rod:new T.CylinderGeometry(1,1,1,6),disc:new T.CircleGeometry(1,24),ring:new T.TorusGeometry(1,.07,6,32)};
  const ground=x=>{const h=world.ground(x);return Number.isFinite(h)?h:0;};
  // A small monochrome atlas: enamelling, solar cells, mineral strata and
  // stitched fabric. Vertex colours supply each planet's quiet palette.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const c=canvas.getContext('2d');
  for(let tile=0;tile<8;tile++){
   const ox=tile%4*128,oy=Math.floor(tile/4)*128;c.save();c.translate(ox,oy);
   const g=c.createLinearGradient(0,0,128,128);g.addColorStop(0,'#fffef8');g.addColorStop(.45,'#e2e3df');g.addColorStop(.72,'#fafaf3');g.addColorStop(1,'#d2d5d2');c.fillStyle=g;c.fillRect(0,0,128,128);
   if(tile===0){
    c.strokeStyle='rgba(64,71,80,.16)';c.lineWidth=1;c.strokeRect(7.5,7.5,113,113);c.strokeStyle='rgba(255,255,255,.65)';c.strokeRect(9.5,9.5,109,109);
    for(const x of [13,115])for(const y of [13,115]){c.fillStyle='#a9b0b0';c.beginPath();c.arc(x,y,2,0,TAU);c.fill();c.fillStyle='#f7f9f4';c.fillRect(x-.6,y-1.2,1.2,2.4);}
   }else if(tile===1){
    c.fillStyle='#aabdc7';c.fillRect(0,0,128,128);
    for(let y=6;y<128;y+=20)for(let x=5;x<128;x+=30){const gg=c.createLinearGradient(x,y,x+24,y+16);gg.addColorStop(0,'#f0f6f3');gg.addColorStop(.45,'#afc2c7');gg.addColorStop(1,'#8299aa');c.fillStyle=gg;c.fillRect(x,y,25,16);c.fillStyle='rgba(255,255,255,.55)';c.fillRect(x+3,y,1,16);c.fillRect(x+17,y,1,16);}
   }else if(tile===2||tile===5){
    for(let y=3;y<128;y+=9){c.strokeStyle=tile===5?'rgba(119,151,162,.24)':'rgba(91,73,57,.17)';c.lineWidth=y%3+1;c.beginPath();c.moveTo(0,y);for(let x=0;x<=128;x+=8)c.lineTo(x,y+Math.sin(x*.045+y*.2)*2.1);c.stroke();}
    for(let j=0;j<12;j++){const x=9+(j*41)%111,y=7+(j*29)%113;c.strokeStyle='rgba(255,255,255,.42)';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+7,y+11);c.lineTo(x+4,y+20);c.stroke();}
   }else if(tile===3){
    for(let x=0;x<128;x+=16){c.fillStyle=x%32?'#e5e2d8':'#fbf8ed';c.fillRect(x,0,16,128);c.strokeStyle='rgba(69,77,86,.32)';c.lineWidth=.8;c.setLineDash([2.5,2.5]);c.beginPath();c.moveTo(x+1,0);c.lineTo(x+1,128);c.stroke();}c.setLineDash([]);
   }else if(tile===4){
    // The same little paw as the family's real ship: a sewn, quiet badge,
    // not a luminous target. This atlas tile was otherwise unused.
    c.fillStyle='#f3e7cb';c.fillRect(0,0,128,128);c.strokeStyle='#a18d70';c.lineWidth=3;c.setLineDash([3,3]);c.beginPath();c.arc(64,64,51,0,TAU);c.stroke();c.setLineDash([]);
    c.fillStyle='#79614d';c.beginPath();c.ellipse(64,78,26,20,0,0,TAU);c.fill();for(const [x,y,rx,ry,angle]of [[34,49,9,12,-.35],[53,36,10,13,-.13],[76,36,10,13,.13],[95,49,9,12,.35]]){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill();}
   }else if(tile===6){
    c.fillStyle='#f4f6f1';c.fillRect(0,0,128,128);for(let k=0;k<6;k++){c.strokeStyle=k%2?'rgba(255,255,255,.85)':'rgba(101,128,147,.28)';c.lineWidth=k%2?1:3;c.beginPath();c.moveTo(k*23-10,0);c.bezierCurveTo(k*23+5,40,k*23-11,74,k*23+13,128);c.stroke();}
   }else{
    for(let y=0;y<128;y+=8){c.fillStyle=y%16?'#dce0d7':'#f4f0de';c.fillRect(0,y,128,4);}for(let x=0;x<128;x+=12){c.fillStyle='rgba(76,74,59,.12)';c.fillRect(x,0,2,128);}
   }
   for(let j=0;j<160;j++){c.fillStyle=j%2?'rgba(255,255,255,.18)':'rgba(65,67,70,.035)';c.fillRect((j*47)%128,(j*73)%128,1+j%3,1);}
   c.restore();
  }
  const atlas=new T.CanvasTexture(canvas);atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=2;owned.push(atlas);
  // Reuse the world's licensed rock photograph where it is exposed. Keeping it
  // in this atlas avoids another material/texture draw for the distant rocks.
  let rockImage=world.materials?.rock?.map?.image;
  if(!rockImage&&planet==='jupiter')scene.getObjectByName('Io planted volcanic shields')?.traverse(o=>{if(!rockImage&&o.isMesh&&o.material?.map?.image)rockImage=o.material.map.image;});
  if(rockImage){
   const paintRock=()=>{if(disposed||!(rockImage.naturalWidth||rockImage.width))return;c.save();c.globalAlpha=.82;c.drawImage(rockImage,256,0,128,128);c.restore();atlas.needsUpdate=true;};
   // Texture payloads are local; an already-decoded canvas needs no listener.
   if(rockImage.complete===false)rockImage.addEventListener('load',paintRock,{once:true});else paintRock();
  }
  const mat=new T.MeshStandardMaterial({map:atlas,color:0xffffff,vertexColors:true,roughness:.72,metalness:.045});owned.push(mat);
  function Builder(){this.p=[];this.n=[];this.uv=[];this.c=[];this.i=[];}
  Builder.prototype.add=function(geometry,matrix,color,tile=0){
   const a=geometry.attributes,offset=this.p.length/3,tx=tile%4,ty=Math.floor(tile/4);normal.getNormalMatrix(matrix);ink.setHex(color);
   for(let k=0;k<a.position.count;k++){
    v.fromBufferAttribute(a.position,k).applyMatrix4(matrix);n.fromBufferAttribute(a.normal,k).applyNormalMatrix(normal);
    this.p.push(v.x,v.y,v.z);this.n.push(n.x,n.y,n.z);
    const grain=.965+.035*Math.sin(v.x*7.1+v.y*9.4+v.z*4.7),col=a.color;this.c.push(ink.r*grain*(col?col.getX(k):1),ink.g*grain*(col?col.getY(k):1),ink.b*grain*(col?col.getZ(k):1));
    const u=a.uv?a.uv.getX(k):0,w=a.uv?a.uv.getY(k):0;this.uv.push((tx+.03+u*.94)/4,1-(ty+.03+(1-w)*.94)/2);
   }
   if(geometry.index)for(let k=0;k<geometry.index.count;k++)this.i.push(offset+geometry.index.getX(k));
   else for(let k=0;k<a.position.count;k++)this.i.push(offset+k);
  };
  Builder.prototype.finish=function(){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.setIndex(this.i);g.computeBoundingBox();g.computeBoundingSphere();owned.push(g);return g;
  };
  const fixed=new Builder();
  function part(b,g,color,x,y,z,sx=1,sy=1,sz=1,tile=0,rx=0,ry=0,rz=0){
   pose.position.set(x,y,z);pose.rotation.set(rx,ry,rz);pose.scale.set(sx,sy,sz);pose.updateMatrix();b.add(g,pose.matrix,color,tile);
  }
  function rod(b,color,a,d,r=.045,tile=0){
   dir.set(d[0]-a[0],d[1]-a[1],d[2]-a[2]);pose.position.set((a[0]+d[0])*.5,(a[1]+d[1])*.5,(a[2]+d[2])*.5);pose.quaternion.setFromUnitVectors(up,dir.clone().normalize());pose.scale.set(r,dir.length(),r);pose.updateMatrix();b.add(shape.rod,pose.matrix,color,tile);
  }
  function tube(b,color,points,r,tile=0){for(let k=1;k<points.length;k++)rod(b,color,points[k-1],points[k],r,tile);}
  function disc(b,color,x,y,z,r,tile=0){part(b,shape.disc,color,x,y,z,r,r,1,tile);}
  function geology(x,y,z,width,height,depth,color,seed=0,ice=false){
   const p=[],uv=[],indices=[],N=13,R=12,profile=[1,.98,1.02,.88,.86,.89,.73,.69,.72,.55,.51,.40,.34];
   for(let j=0;j<=R;j++)for(let k=0;k<=N;k++){
    const a=k/N*TAU,u=j/R,bulge=1+.15*Math.sin(a*3+seed)+.08*Math.cos(a*5-seed),rr=profile[j]*bulge,lean=Math.sin(u*2+seed)*u*width*.16;
    const top=.88+.09*Math.sin(a*2+seed)+.035*Math.sin(a*5-seed),shelf=Math.sin(a*3+seed+u*4)*height*.022*Math.sin(u*Math.PI);
    p.push(Math.cos(a)*width*rr+lean,y+height*u*top+shelf,Math.sin(a)*depth*rr);uv.push(k/N,j/R);
    if(j<R&&k<N){const i=j*(N+1)+k;indices.push(i,i+N+1,i+1,i+1,i+N+1,i+N+2);}
   }
   const cap=p.length/3;p.push(Math.sin(2+seed)*width*.16,y+height*.89,0);uv.push(.5,1);for(let k=0;k<N;k++)indices.push(cap,R*(N+1)+k+1,R*(N+1)+k);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();part(fixed,g,color,x,0,z,1,1,1,ice?6:2);g.dispose();
  }
  function habitat(x,z,scale=1,tone=0xd3c4aa){
   const y=ground(x)-.18,S=scale;
   // A pressure shell with real curved ribs, oval windows and a cell-covered
   // canopy reads as an outpost rather than a block placed beside the path.
   part(fixed,shape.sphere,tone,x,y+.95*S,z,2.55*S,1.52*S,1.18*S,0);
   part(fixed,shape.box,0x657a80,x,y+.07*S,z,5.05*S,.24*S,2.30*S,0);
   for(const dx of [-1.45,-.5,.5,1.45]){
    part(fixed,shape.sphere,0x5b8296,x+dx*S,y+1.04*S,z+1.02*S,.33*S,.47*S,.11*S,0);
    const points=[];for(let j=0;j<=12;j++){const a=j/12*Math.PI;points.push([x+dx*S,y+.35*S+Math.sin(a)*1.52*S,z+Math.cos(a)*1.18*S]);}tube(fixed,0xa89b84,points,.026*S,0);
   }
   for(const side of [-1,1])for(const dx of [-1.9,1.9])rod(fixed,0x7f8a83,[x+dx*S,y-.55*S,z+side*.8*S],[x+dx*S,y+.22*S,z+side*.8*S],.075*S);
   const panelX=x+3.4*S,panelY=y+1.68*S;
   part(fixed,shape.box,0xb7b49b,panelX,panelY-.10*S,z+.10*S,2.75*S,.13*S,1.85*S,0,0,0,-.15);
   part(fixed,shape.box,0x54778e,panelX,panelY,z+.10*S,2.54*S,.035*S,1.64*S,1,0,0,-.15);
   for(const dx of [-1,1])rod(fixed,0xa8a69a,[panelX+dx*S,y-.55*S,z+.15*S],[panelX+dx*S,panelY-.10*S,z+.15*S],.06*S);
   rod(fixed,0xb6aa90,[x-1.8*S,y+1.8*S,z],[x-1.8*S,y+2.84*S,z],.034*S);
   part(fixed,shape.sphere,0x99b6ba,x-1.8*S,y+2.88*S,z,.18*S,.12*S,.18*S,0);
   rod(fixed,0xb6aa90,[x-2.14*S,y+2.75*S,z],[x-1.46*S,y+2.75*S,z],.025*S);
  }
  function outpost(x,z,y,colour=0xc7d5d5){
   const base=ground(x)+y;
   part(fixed,shape.sphere,colour,x,base+1.28,z,1.8,1.76,1.18,0);
   part(fixed,shape.cylinder,0x7e9aa3,x,base+.08,z,1.75,.28,1.18,0);
   part(fixed,shape.sphere,0x617f97,x,base+1.45,z+1.04,1.30,1.05,.12,0);
   for(const side of [-1,1]){
    rod(fixed,0xa6b6bc,[x+side*1.45,base-.4,z],[x+side*1.45,base+.7,z],.10);
    const px=x+side*3.6;
    rod(fixed,0xa0b0b3,[x+side*1.3,base+1.6,z],[px,base+1.6,z],.08);
    part(fixed,shape.box,0x8fa8b0,px,base+1.6,z,3.3,2.05,.12,0,0,side*.08,side*.10);
    part(fixed,shape.box,0x55758b,px,base+1.6,z+.075,3.08,1.83,.035,1,0,side*.08,side*.10);
   }
   for(const y1 of [.9,1.6,2.3])rod(fixed,0xc2c6b7,[x-1.33,base+y1,z+1.13],[x+1.33,base+y1,z+1.13],.025);
   rod(fixed,0xa8b6b2,[x,base+2.7,z],[x,base+3.7,z],.045);
   part(fixed,shape.sphere,0xd6c8a7,x,base+3.71,z,.11,.17,.11,0);
  }
  function airship(balloon=false){
   const b=new Builder(),cream=balloon?0xe2c68e:0xf3dfbd,accent=balloon?0xb98d73:0x7da7a4;
   const envelope=shape.sphere.clone(),colours=[];for(let i=0;i<envelope.attributes.position.count;i++){const u=envelope.attributes.uv.getX(i),band=Math.floor(u*12)%3===0,tone=band?(balloon?0xc39e80:0x9adfff):0xffffff;ink.setHex(tone);colours.push(ink.r,ink.g,ink.b);}envelope.setAttribute('color',new T.Float32BufferAttribute(colours,3));
   if(balloon){
    // Eight fabric gores, tied to a woven observation gondola.
    part(b,envelope,cream,0,2.16,0,1.42,1.85,1.05,3);
    for(let j=0;j<8;j++){const a=j/8*TAU,points=[];for(let k=0;k<=14;k++){const u=k/14*Math.PI;points.push([Math.sin(u)*Math.cos(a)*1.43,.30+3.7*(.5-.5*Math.cos(u)),Math.sin(u)*Math.sin(a)*1.06]);}tube(b,accent,points,.018,3);}
    for(const s of [-1,1])rod(b,0xb9a185,[s*.70,.78,.38],[s*.45,-.65,.36],.018,3);
    part(b,shape.box,0xba9d79,0,-.76,0,1.17,.62,.78,7);
    part(b,shape.box,0x8e897d,0,-.44,0,1.23,.07,.84,0);
   }else{
    // The fins, saddle, suspension cords and stitched gores make the shape
    // recognisable even from the child's side-on view.
    part(b,envelope,cream,0,.90,0,3.35,1.05,.87,3);
    disc(b,0xe3d7b7,.08,.92,.887,.33,4);part(b,shape.ring,0xbfa67f,.08,.92,.894,.336,.336,.42,0);
    for(const x of [-2.25,-.8,.8,2.25]){
     const r=Math.sqrt(Math.max(.01,1-x*x/(3.35*3.35))),points=[];
     for(let k=0;k<=20;k++){const a=k/20*TAU;points.push([x,.90+Math.sin(a)*1.06*r,Math.cos(a)*.88*r]);}tube(b,accent,points,.026,3);
    }
    for(const z of [-.58,.58])for(const x of [-1.35,1.35])rod(b,0xa6b1ad,[x,.33,z],[x*.65,-.73,z*.5],.018,3);
    part(b,shape.sphere,0xb6a68c,0,-.78,0,1.28,.42,.49,7);
    for(const x of [-.52,0,.52])part(b,shape.sphere,0x6f899a,x,-.68,.46,.16,.13,.025,0);
    part(b,shape.box,accent,-2.85,1.12,0,.90,1.02,.07,3,0,0,-.35);
    part(b,shape.box,accent,-2.85,.87,0,.90,.07,1.02,3,0,-.35,0);
    rod(b,0xc0b4a0,[1.38,-.71,0],[1.92,-.71,0],.05);
    for(const s of [-1,1])part(b,shape.sphere,0xa5b7b5,1.94,-.71+s*.23,0,.045,.26,.10,0,0,0,s*.1);
   }
   envelope.dispose();return b.finish();
  }
  function addMovingCraft(balloon,placements){
   const g=airship(balloon),mesh=new T.InstancedMesh(g,mat,placements.length);mesh.name=balloon?'Distant weather balloons':'Distant stitched cloud airships';mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
   for(let k=0;k<placements.length;k++){
    const q=placements[k];moving.push({index:k,x:q[0],y:q[1],z:q[2],scale:q[3],phase:k*1.73,mesh});pose.position.set(q[0],q[1],q[2]);pose.rotation.set(0,0,0);pose.scale.setScalar(q[3]);pose.updateMatrix();mesh.setMatrixAt(k,pose.matrix);
   }
   mesh.computeBoundingSphere();mesh.raycast=()=>{};mesh.castShadow=mesh.receiveShadow=false;root.add(mesh);meshes.push(mesh);
  }
  if(planet==='mars'){
   for(const [x,z,s]of [[27,-11.5,.86],[145,-15,.95],[219,-14,.72],[397,-12,.82]])habitat(x,z,s);
   for(const [x,z,w,h,d]of [[90,-13,2.7,4.8,1.4],[93.4,-14,2.2,3.9,1.7],[357,-15,3.7,6.1,2.0],[362.5,-16,2.6,4.1,1.8]])geology(x,ground(x)-1.4,z,w,h,d,0xab795f,x*.1);
  }else if(planet==='saturn'){
   for(const [x,z]of [[22,-15],[82,-17],[130,-18],[207,-16],[273,-19]]){
    for(let k=0;k<3;k++)geology(x+(k-1)*2.6,ground(x)-1.7,z-k*.8,2.4+k*.3,3.2+(k%2)*1.2,1.55, [0x65a8c3,0x82bbd0,0x70a9c3][k],k+x,true);
    part(fixed,shape.sphere,0x9fced7,x,ground(x)-1.0,z+1.0,6.1,.75,2.4,5);
   }
  }else if(planet==='neptune'){
   addMovingCraft(false,[[33.5,4.6,-22,.82],[169,5.2,-25,.86],[294,5.2,-24,.78]]);
  }else if(planet==='jupiter'){
   outpost(27,-15,-.15,0xc4ccc6);outpost(302,-17,.1,0xc0d4dc);
   for(const [x,h,w]of [[145,3.5,3.3],[150.1,4.5,3.0],[155,3.2,3.5]])geology(x,ground(x)-.8,-24,w,h,1.9,0x9b8270,x*.1);
   for(const [x,h,w]of [[273,3.4,3.7],[278.2,4.2,3.2],[335,3.8,3.9]])geology(x,ground(x)-1.1,-23,w,h,2.0,0x8bb9cc,x*.1,true);
  }else if(planet==='venus'){
   for(const [x,z,h,w]of [[65,-16,6.4,3.2],[73,-20,8.5,3.4],[239,-18,7,3.7],[245,-21,9.5,4.2],[383,-21,7.8,4.1]])geology(x,ground(x)-1.6,z,w,h,2.7,0x9b7f78,x*.1);
   addMovingCraft(true,[[31,2.5,-23,.78],[148,2.9,-25,.88],[329,3.8,-26,.78],[426,4.0,-26,.80]]);
  }
  if(fixed.p.length){const mesh=new T.Mesh(fixed.finish(),mat);mesh.name='Painted distant '+planet+' expedition scenery';mesh.raycast=()=>{};mesh.castShadow=mesh.receiveShadow=false;root.add(mesh);meshes.push(mesh);}
  for(const g of Object.values(shape))g.dispose();
  function update(dt,t){
   if(disposed)return;
   // The whole craft is rigid: one instance transform, no skeletons, textures,
   // geometry rebuilds or allocations during animation.
   for(const q of moving){
    pose.position.set(q.x+Math.sin(t*.072+q.phase)*.65,q.y+Math.sin(t*.26+q.phase)*.20,q.z);pose.rotation.set(0,0,Math.sin(t*.19+q.phase)*.028);pose.scale.setScalar(q.scale);pose.updateMatrix();q.mesh.setMatrixAt(q.index,pose.matrix);
   }
   if(moving.length)moving[0].mesh.instanceMatrix.needsUpdate=true;
  }
  function dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const q of owned)q.dispose();}
  return{update,dispose,stats:{planet,draws:meshes.length,triangles:meshes.reduce((sum,q)=>sum+(q.geometry.index?q.geometry.index.count:q.geometry.attributes.position.count)/3*(q.isInstancedMesh?q.count:1),0),movingInstances:moving.length}};
 };
})(window.MARS);
