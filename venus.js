/* Venus: crafted cloud survey, classic local scripts and embedded offline art. */
(function(M){
  'use strict';
  M.createVenus=function({scene,player,dog}){
    const artReady=M.venusArtReady||(M.venusArtReady=new Promise(resolve=>{const script=document.createElement('script');script.src='assets/venus/scene-art.js';script.onload=()=>resolve(M.VenusSceneTextures||{});script.onerror=()=>resolve({});document.head.appendChild(script);}));
    const T=THREE,TAU=Math.PI*2,clamp=M.clamp,mix=M.lerp,ease=x=>x*x*(3-2*x),length=430;
    const C={gold:0xe9b862,cream:0xffe2a0,copper:0xb9754e,amber:0xf1a04b,coral:0xea7e60,teal:0x64c7c1,blue:0x3c5489,violet:0x514477,navy:0x292e56,dark:0x302c49,pale:0xc1d5cd};
    const root=new T.Group();root.name='Venüs · Kehribar Bulut Gözlemevi';scene.add(root);
    const paints=new Map(),finishes=new Map(),scratch=new T.Object3D(),vA=new T.Vector3(),vB=new T.Vector3(),axis=new T.Vector3(0,1,0);
    function paint(c,soft=false){const k=c+':'+soft;if(!paints.has(k)){const p=new T.MeshStandardMaterial({color:c,roughness:soft?.86:.40,metalness:soft?.02:.30});paints.set(k,p);finishes.set(p,soft);}return paints.get(k);}
    Object.values(C).forEach(c=>{paint(c);paint(c,true);});
    const G={box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,16,10),pearl:new T.SphereGeometry(1,10,7),rod:new T.CylinderGeometry(1,1,1,10),ring:new T.TorusGeometry(1,.10,7,32),crystal:new T.OctahedronGeometry(1,0),cone:new T.ConeGeometry(1,1,8),disc:new T.CircleGeometry(1,24)};
    function roundedBox(){const g=new T.BoxGeometry(1,1,1,5,5,5),p=g.attributes.position,n=new T.Vector3(),a=new T.Vector3();for(let i=0;i<p.count;i++){a.set(p.getX(i),p.getY(i),p.getZ(i));n.set(clamp(a.x,-.38,.38),clamp(a.y,-.38,.38),clamp(a.z,-.38,.38));a.sub(n).normalize().multiplyScalar(.12).add(n);p.setXYZ(i,a.x,a.y,a.z);}g.computeVertexNormals();return g;}G.roundBox=roundedBox();
    function profileGeometry(path,depth=.88){return new T.ExtrudeGeometry(path,{depth,steps:1,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:3,curveSegments:12});}
    const basic=new T.MeshBasicMaterial({color:C.cream}),glass=new T.MeshStandardMaterial({color:0xafdcd7,transparent:true,opacity:.19,roughness:.17,metalness:.18,side:T.DoubleSide,depthWrite:false});
    function mesh(parent,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const q=new T.Mesh(g,m);q.position.set(x,y,z);q.scale.set(sx,sy,sz);q.receiveShadow=!m.transparent;parent.add(q);return q;}
    function rod(parent,x,y,z,x2,y2,z2,r,m){vA.set(x,y,z);vB.set(x2,y2,z2).sub(vA);const q=mesh(parent,G.rod,m,0,0,0,r,vB.length(),r);q.position.copy(vA).addScaledVector(vB,.5);q.quaternion.setFromUnitVectors(axis,vB.normalize());return q;}
    const white=[false,true].map(soft=>new T.MeshStandardMaterial({color:0xffffff,roughness:soft?.86:.40,metalness:soft?.02:.30}));
    function weld(parent){
      const sets=new Map();for(const o of parent.children){if(!o.isMesh||o.children.length||!finishes.has(o.material))continue;const soft=finishes.get(o.material),k=o.geometry.id+':'+soft;if(!sets.has(k))sets.set(k,{soft,parts:[]});sets.get(k).parts.push(o);}
      for(const {soft,parts}of sets.values()){if(parts.length<2)continue;const q=new T.InstancedMesh(parts[0].geometry,white[soft?1:0],parts.length);parts.forEach((o,i)=>{o.updateMatrix();q.setMatrixAt(i,o.matrix);q.setColorAt(i,o.material.color);parent.remove(o);});q.computeBoundingSphere();q.castShadow=q.receiveShadow=true;parent.add(q);}
    }
    function smooth(a,b,x){return ease(clamp((x-a)/(b-a),0,1));}
    // One shared tiny atlas gives the fabricated objects brushed enamel and stitching.
    const detailCanvas=document.createElement('canvas');detailCanvas.width=detailCanvas.height=128;const di=detailCanvas.getContext('2d');const enamelGradient=di.createLinearGradient(0,0,128,128);enamelGradient.addColorStop(0,'#fffef7');enamelGradient.addColorStop(.42,'#ece5d8');enamelGradient.addColorStop(.73,'#fff9e9');enamelGradient.addColorStop(1,'#ddd6c9');di.fillStyle=enamelGradient;di.fillRect(0,0,128,128);di.strokeStyle='rgba(65,60,54,.19)';di.lineWidth=1.0;di.strokeRect(6,6,116,116);di.strokeStyle='rgba(255,255,255,.58)';di.strokeRect(8,8,112,112);for(const x of [11,117])for(const y of [11,117]){di.fillStyle='#d5d7cc';di.beginPath();di.arc(x,y,2.2,0,TAU);di.fill();di.strokeStyle='rgba(64,64,64,.28)';di.beginPath();di.moveTo(x-1,y);di.lineTo(x+1,y);di.stroke();}for(let i=0;i<250;i++){di.fillStyle=i%2?'rgba(77,67,60,.045)':'rgba(255,255,255,.22)';di.fillRect((i*47)%128,(i*73)%128,1+(i%4),1);}const enamelTex=new T.CanvasTexture(detailCanvas);enamelTex.colorSpace=T.SRGBColorSpace;enamelTex.wrapS=enamelTex.wrapT=T.RepeatWrapping;white[0].map=enamelTex;white[0].needsUpdate=true;for(const [m,soft]of finishes)if(!soft){m.map=enamelTex;m.needsUpdate=true;}
    const clothCanvas=document.createElement('canvas');clothCanvas.width=256;clothCanvas.height=128;const ci=clothCanvas.getContext('2d');ci.fillStyle='#fff4ce';ci.fillRect(0,0,256,128);for(let i=0;i<12;i++){const x=i*256/12;ci.fillStyle=i%2?'#f0d4a5':'#fff4ce';ci.fillRect(x,0,256/12,128);ci.strokeStyle='rgba(80,51,27,.28)';ci.lineWidth=1;ci.setLineDash([3,3]);ci.beginPath();ci.moveTo(x+1,0);ci.lineTo(x+1,128);ci.stroke();}ci.setLineDash([]);const clothTex=new T.CanvasTexture(clothCanvas);clothTex.colorSpace=T.SRGBColorSpace;
    const weaveCanvas=document.createElement('canvas');weaveCanvas.width=weaveCanvas.height=128;const wi=weaveCanvas.getContext('2d');wi.fillStyle='#c99154';wi.fillRect(0,0,128,128);for(let i=0;i<16;i++){wi.fillStyle=i%2?'#b67d45':'#dbac70';wi.fillRect(0,i*8,128,4);wi.fillStyle='rgba(88,51,28,.24)';for(let j=0;j<16;j++)wi.fillRect(j*8+(i%2)*4,i*8,2,7);}const weaveTex=new T.CanvasTexture(weaveCanvas);weaveTex.colorSpace=T.SRGBColorSpace;
    function basket(parent,x,y,z,w=.78,h=.48){const q=new T.Group();q.position.set(x,y,z);parent.add(q);const mat=new T.MeshStandardMaterial({map:weaveTex,color:0xe7b776,roughness:.86});mesh(q,G.box,mat,0,0,0,w,h,w*.72);for(const side of [-1,1]){mesh(q,G.box,paint(C.copper),0,h*.5,side*w*.36,w+.05,.055,.055);mesh(q,G.box,paint(C.copper),side*w*.5,h*.5,0,.055,.055,w*.78);}mesh(q,G.box,paint(C.navy),0,h*.5+.025,0,w*.77,.035,w*.49);weld(q);return q;}
    function bottle(parent,color,x=0,y=0,z=0){const q=new T.Group();q.position.set(x,y,z);parent.add(q);mesh(q,G.rod,paint(color),0,0,0,.21,.53,.21);mesh(q,G.rod,paint(C.cream),0,.30,0,.15,.11,.15);mesh(q,G.box,paint(C.cream),0,.015,.207,.20,.17,.018);mesh(q,G.box,paint(color),0,.015,.222,.12,.07,.015);for(const a of [-1,1])rod(q,a*.15,.31,0,a*.15,.43,0,.025,paint(C.copper));rod(q,-.15,.43,0,.15,.43,0,.025,paint(C.copper));weld(q);return q;}
    const oreCanvas=document.createElement('canvas');oreCanvas.width=oreCanvas.height=256;const oi=oreCanvas.getContext('2d');oi.fillStyle='#e4e4da';oi.fillRect(0,0,256,256);for(let k=0;k<2100;k++){oi.fillStyle=k%2?'rgba(44,51,65,.095)':'rgba(255,255,244,.25)';oi.fillRect((k*53.7)%256,(k*103.3)%256,1+k%3,1);}for(let k=0;k<6;k++){oi.strokeStyle=k%2?'rgba(255,251,220,.87)':'rgba(102,115,127,.20)';oi.lineWidth=k%2?2:6;oi.beginPath();oi.moveTo(-8,29+k*41);for(let x=0;x<=264;x+=12)oi.lineTo(x,29+k*41+Math.sin(x*.029+k*.9)*12+Math.sin(x*.11+k)*2.5);oi.stroke();}const oreTex=new T.CanvasTexture(oreCanvas);oreTex.colorSpace=T.SRGBColorSpace;oreTex.wrapS=oreTex.wrapT=T.RepeatWrapping;const oreMaterials=[C.teal,C.pale,C.coral].map(color=>new T.MeshStandardMaterial({color,map:oreTex,roughness:.64,metalness:.12}));
    G.sampleStone=new T.SphereGeometry(1,16,12);{const p=G.sampleStone.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=1+.13*Math.sin(x*5.1+y*3.4)+.07*Math.sin(z*7.7-x*3.2);p.setXYZ(i,x*a*.93,Math.max(-.64,y*a*.83),z*a*.79);}G.sampleStone.computeVertexNormals();}
    G.coreStone=new T.CylinderGeometry(1,1,1,14,6);{const p=G.coreStone.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=1+.035*Math.sin(Math.atan2(z,x)*5+y*11);p.setXYZ(i,x*a,y,z*a);}G.coreStone.computeVertexNormals();}oreMaterials[1].color.setHex(0xb9a58d);oreMaterials[1].roughness=.90;oreMaterials[1].metalness=.015;const coreEndMaterial=new T.MeshStandardMaterial({color:0xd6c3a5,map:oreTex,roughness:.94,metalness:.01}),coreBandMaterial=new T.MeshStandardMaterial({color:0x756878,map:oreTex,roughness:.95,metalness:.01});
    function sampleRock(parent,i,x=0,y=0,z=0,r=.35){const q=new T.Group();q.position.set(x,y,z);parent.add(q);if(i===1)q.name='Layered stone core extracted by the drill';const stone=mesh(q,i===1?G.coreStone:G.sampleStone,oreMaterials[i],0,0,0,i===1?r*.70:r,i===1?r*1.7:r,i===1?r*.70:r);stone.rotation.set(i===1?.10:.13+i*.2,i*.7,i===1?-.13:.22);if(i===1){for(const a of [-1,1])mesh(q,G.rod,coreEndMaterial,a*.025,a*r*.76,r*.035,r*.71,r*.06,r*.71);for(const y of [-.36,.18])mesh(q,G.rod,coreBandMaterial,0,y*r,0,r*.706,r*.11,r*.706);}else{for(let k=0;k<2;k++){const vein=mesh(q,G.box,paint(C.cream),-.10*r+k*.20*r,(-.11+k*.15)*r,r*.72,r*.06,r*.50,r*.022);vein.rotation.z=-.47;}}weld(q);return q;}
    function grip(parent,color){const q=new T.Group();parent.add(q);mesh(q,G.rod,paint(color),0,0,0,.12,.39,.12).rotation.z=Math.PI*.5;for(const side of [-1,1])mesh(q,G.rod,paint(C.cream),side*.21,0,0,.13,.055,.13).rotation.z=Math.PI*.5;weld(q);return q;}
    function bolt(parent,x,y,z){const q=mesh(parent,G.rod,paint(C.pale),x,y,z,.045,.035,.045);q.rotation.x=Math.PI*.5;return q;}
    function hose(parent,points,color=C.teal,r=.055){for(let k=1;k<points.length;k++)rod(parent,...points[k-1],...points[k],r,paint(color));}
    function plant(parent,x,y,z,i){const q=new T.Group();q.position.set(x,y,z);parent.add(q);mesh(q,G.rod,paint(C.copper),0,.10,0,.28,.20,.28);mesh(q,G.rod,paint(C.navy,true),0,.205,0,.235,.025,.235);rod(q,0,.21,0,.03,.93+(i%2)*.18,0,.025,paint(C.teal));for(let k=0;k<4;k++){const side=k%2?1:-1;const leaf=mesh(q,G.pearl,paint(k%2?C.teal:0x9acb90,true),side*.15,.38+k*.14,0,.21,.065,.10);leaf.rotation.z=side*.48;}mesh(q,G.pearl,paint(C.coral,true),.03,1.03+(i%2)*.18,0,.19,.12,.13);for(let k=0;k<5;k++){const a=k*TAU/5;mesh(q,G.pearl,paint(C.cream,true),.03+Math.cos(a)*.16,1.03+(i%2)*.18+Math.sin(a)*.12,.02,.11,.08,.07);}weld(q);return q;}

    function ground(x){return .32*Math.sin(x*.047)+.13*Math.sin(x*.139)+1.65*smooth(250,303,x)+1.05*smooth(374,407,x);}
    const platforms=[],weather={intensity:.12,gust:0,direction:1};
    const skyCanvas=document.createElement('canvas');skyCanvas.width=1024;skyCanvas.height=512;const sk=skyCanvas.getContext('2d');
    const skyGrad=sk.createLinearGradient(0,0,0,512);skyGrad.addColorStop(0,'#715482');skyGrad.addColorStop(.22,'#bd855f');skyGrad.addColorStop(.54,'#efbe78');skyGrad.addColorStop(1,'#f6d69c');sk.fillStyle=skyGrad;sk.fillRect(0,0,1024,512);
    for(let band=0;band<30;band++){const y=33+band*14,gr=sk.createLinearGradient(0,y-18,0,y+28);gr.addColorStop(0,'rgba(255,226,167,0)');gr.addColorStop(.48,band%3?'rgba(255,222,161,.22)':'rgba(135,92,109,.14)');gr.addColorStop(1,'rgba(255,219,151,0)');sk.fillStyle=gr;sk.beginPath();sk.moveTo(0,y+12*Math.sin(band));for(let x=0;x<=1024;x+=32)sk.lineTo(x,y+13*Math.sin(x*.007+band*.71));sk.lineTo(1024,y+31);sk.lineTo(0,y+31);sk.closePath();sk.fill();}
    const glow=sk.createRadialGradient(755,184,8,755,184,170);glow.addColorStop(0,'rgba(255,247,204,.7)');glow.addColorStop(.22,'rgba(255,220,141,.21)');glow.addColorStop(1,'rgba(255,220,141,0)');sk.fillStyle=glow;sk.fillRect(0,0,1024,512);
    for(let i=0;i<9;i++){sk.strokeStyle='rgba(255,236,191,'+(.06+(i%3)*.025)+')';sk.lineWidth=4+i%3*3;sk.beginPath();sk.moveTo(0,180+i*22);sk.bezierCurveTo(250,130+i*25,620,230+i*16,1024,172+i*21);sk.stroke();}
    const sky=new T.CanvasTexture(skyCanvas);sky.colorSpace=T.SRGBColorSpace;scene.background=sky;let paintedSky=false,paintedRidge=null;const panoramaImage=new Image();panoramaImage.onload=()=>{sky.image=panoramaImage;sky.needsUpdate=true;paintedSky=true;const plate=document.createElement('canvas');plate.width=2048;plate.height=512;const c=plate.getContext('2d'),cut=panoramaImage.height*.53;c.drawImage(panoramaImage,0,cut,panoramaImage.width,panoramaImage.height-cut,0,0,2048,512);c.globalCompositeOperation='destination-in';const a=c.createLinearGradient(0,0,0,512);a.addColorStop(0,'rgba(255,255,255,0)');a.addColorStop(.16,'white');a.addColorStop(.91,'white');a.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=a;c.fillRect(0,0,2048,512);const map=new T.CanvasTexture(plate);map.colorSpace=T.SRGBColorSpace;paintedRidge=mesh(root,new T.PlaneGeometry(160,25),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,fog:false}),28,3,-70);paintedRidge.name='Painted layered Venus calderas';};artReady.then(art=>{if(art.panorama)panoramaImage.src=art.panorama;});scene.fog=new T.FogExp2(0xd4a174,.018);
    scene.add(new T.HemisphereLight(0xffdc9c,0x77749e,1.72));const sun=new T.DirectionalLight(0xffd59a,2.55);sun.position.set(-6,16,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-11,right:11,top:10,bottom:-10,near:1,far:45});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.03;sun.shadow.bias=-.0003;scene.add(sun,sun.target);const rim=new T.DirectionalLight(0x8ba8e5,1.15);rim.position.set(6,8,-12);scene.add(rim);
    const stoneCanvas=document.createElement('canvas');stoneCanvas.width=stoneCanvas.height=256;const si=stoneCanvas.getContext('2d');si.fillStyle='#bcb0a7';si.fillRect(0,0,256,256);
    // Angular basalt facets and pores: no stretched horizontal wood-like stripes.
    for(let i=0;i<95;i++){const x=(i*73.73)%256,y=(i*109.31)%256,r=3+(i%7)*2;si.fillStyle=i%3?'rgba(65,60,85,.055)':'rgba(255,233,175,.09)';si.beginPath();si.moveTo(x-r,y);si.lineTo(x-r*.3,y-r*.8);si.lineTo(x+r,y-r*.3);si.lineTo(x+r*.5,y+r);si.closePath();si.fill();}
    for(let i=0;i<18;i++){const x=(i*53.4)%256,y=(i*97.7)%256;si.strokeStyle='rgba(49,44,68,.10)';si.lineWidth=.65;si.beginPath();si.moveTo(x,y);si.lineTo(x+12,y+8);si.lineTo(x+16,y+23);si.stroke();}
    for(let i=0;i<2200;i++){const x=(i*97.137)%256,y=(i*83.279)%256;si.fillStyle=i%3?'rgba(38,30,43,.035)':'rgba(255,228,190,.12)';si.fillRect(x,y,.6+i%3*.4,.6);}
    const reliefCanvas=document.createElement('canvas');reliefCanvas.width=reliefCanvas.height=256;const bi=reliefCanvas.getContext('2d');bi.fillStyle='#888';bi.fillRect(0,0,256,256);for(let i=0;i<90;i++){const x=(i*97.3)%256,y=(i*53.7)%256,r=5+i%7*2,g=bi.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?'#c5c5c5':'#555');g.addColorStop(1,'rgba(128,128,128,0)');bi.fillStyle=g;bi.fillRect(x-r,y-r,r*2,r*2);}const stoneBump=new T.CanvasTexture(reliefCanvas);stoneBump.wrapS=stoneBump.wrapT=T.RepeatWrapping;
    const stoneTex=new T.CanvasTexture(stoneCanvas);stoneTex.wrapS=stoneTex.wrapT=T.RepeatWrapping;stoneTex.colorSpace=T.SRGBColorSpace;stoneTex.anisotropy=4;
    const stoneMat=new T.MeshStandardMaterial({map:stoneTex,bumpMap:stoneBump,bumpScale:.13,vertexColors:true,roughness:.91,metalness:.025}),terrainChunks=[];
    const zRows=[-48,-42,-36,-30,-25,-21,-18,-16,-14,-12,-10.5,-9,-8,-7,-6,-5,-4,-3.2,-2.6,-2.2,-1.1,0,1.1,2.2,3.6,7];
    function riverZ(x){return -7.8+2.5*Math.sin(x*.11+.4)+.70*Math.sin(x*.028+1);}
    function riverWidth(x){return .85+.22*Math.sin(x*.087)+.10*Math.sin(x*.031);}
    function terrainY(x,z){if(z>=-2.2&&z<=2.2)return ground(x);if(z>2.2)return ground(x)-(z-2.2)*.72;const rear=-z-2.2,d=Math.abs(z-riverZ(x)),banks=.44*smooth(.5,1.7,rear)*(1-smooth(6,12,rear))*smooth(.6,1.9,d),shelves=smooth(8,20,rear)*(1.5+1.05*Math.sin(x*.068-z*.095)+.52*Math.sin(x*.173+z*.18)),ripples=.20*Math.sin(x*.11+z*.62)*smooth(1,5,rear);return ground(x)+rear*.011+banks+shelves+ripples;}
    // Match the actual fixed .5-unit triangulated grid, including its diagonal, for planted art.
    function terrainSurfaceY(x,z){const x0=Math.floor((x+6)*2)*.5-6,u=clamp((x-x0)*2,0,1),zz=clamp(z,zRows[0],zRows[zRows.length-1]);let j=0;while(j<zRows.length-2&&zz>zRows[j+1])j++;const z0=zRows[j],z1=zRows[j+1],v=(zz-z0)/(z1-z0),a=terrainY(x0,z0),b=terrainY(x0,z1),c=terrainY(x0+.5,z0),d=terrainY(x0+.5,z1);return u+v<=1?a+(c-a)*u+(b-a)*v:d+(b-d)*(1-u)+(c-d)*(1-v);}
    const ink=new T.Color();
    for(let a=-6;a<length+9;a+=24){
      const p=[],col=[],uv=[],idx=[],n=48;for(let i=0;i<=n;i++)for(let j=0;j<zRows.length;j++){const x=a+i*.5,z=zRows[j],y=terrainY(x,z);p.push(x,y,z);uv.push(x*.17,z*.14);ink.setHex(Math.abs(z)<2.25?0x776586:z>2.2?0x454367:z< -30?0x77809d:z< -12?0x52658d:0x625982);ink.lerp(new T.Color(C.copper),.09+.055*Math.sin(x*.23+z*.31));ink.multiplyScalar(.94+.065*Math.sin(x*.73)*Math.sin(z*.81)+.04*Math.sin(x*.19+z*.57));col.push(ink.r,ink.g,ink.b);if(i<n&&j<zRows.length-1){const k=i*zRows.length+j;idx.push(k,k+1,k+zRows.length,k+1,k+zRows.length+1,k+zRows.length);}}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const q=mesh(root,g,stoneMat);q.receiveShadow=true;terrainChunks.push(q);
    }
    function volcanoGeometry(seed){
      const p=[],c=[],uv=[],idx=[],sides=36,profile=seed===1?[1,.98,.88,.76,.62,.49,.37,.28,.21,.18,.15,.09]:seed===3?[1,.99,.94,.83,.68,.51,.38,.31,.27,.24,.19,.11]:[1,.96,.90,.79,.64,.48,.36,.27,.22,.20,.15,.08];
      for(let j=0;j<profile.length;j++)for(let i=0;i<=sides;i++){const a=i*TAU/sides,u=j/9,r=profile[j]*(.97+.045*Math.sin(a*5+seed)+.025*Math.sin(a*9-seed)),y=j<10?u:1-(j-9)*.10;const broken=seed===5&&j>=7?.045*Math.sin(a*3+1):0;p.push(Math.cos(a)*r,y+broken,Math.sin(a)*r);uv.push(i/sides*2,y*2);ink.setHex(j>9?0x615276:j>7?(seed===3?0xae806d:0x9a7e84):j>4?0x667095:0x465b85);ink.lerp(new T.Color(C.cream),.035+.035*Math.sin(a*3+seed));c.push(ink.r,ink.g,ink.b);if(j<profile.length-1&&i<sides){const k=j*(sides+1)+i;idx.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    }
    const mountainM=new T.MeshStandardMaterial({vertexColors:true,map:stoneTex,roughness:.91,metalness:.035}),mountainG=[volcanoGeometry(1),volcanoGeometry(3),volcanoGeometry(5)],mountainMatrix=new T.Matrix4(),mountainNormal=new T.Matrix3();
    // One fixed horizon mesh: no distance switches, extra rim draws or geometry creation in play.
    for(let cluster=0;cluster<1;cluster++){const p=[],n=[],uv=[],col=[],indices=[];function append(g,matrix,override){const a=g.attributes,offset=p.length/3;mountainNormal.getNormalMatrix(matrix);for(let k=0;k<a.position.count;k++){vA.fromBufferAttribute(a.position,k).applyMatrix4(matrix);p.push(vA.x,vA.y,vA.z);vA.fromBufferAttribute(a.normal,k).applyNormalMatrix(mountainNormal);n.push(vA.x,vA.y,vA.z);uv.push(a.uv?a.uv.getX(k):0,a.uv?a.uv.getY(k):0);if(override)ink.setHex(override);else ink.fromBufferAttribute(a.color,k);col.push(ink.r,ink.g,ink.b);}if(g.index)for(let k=0;k<g.index.count;k++)indices.push(offset+g.index.getX(k));else for(let k=0;k<a.position.count;k++)indices.push(offset+k);}
      for(let k=0;k<12;k++){const i=k,x=-6+i*40.5,z=-54-(i%3)*7,r=19+(i%4)*2.5,h=5.8+(i%3)*1.7,y=terrainSurfaceY(x,z)-.20;mountainMatrix.makeScale(r,h,r*.72);mountainMatrix.setPosition(x,y,z);append(mountainG[i%3],mountainMatrix);}
      const g=new T.BufferGeometry();g.name='Venus distant shield calderas '+cluster;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(indices);const distantCaldera=mesh(root,g,mountainM);distantCaldera.visible=false;
    }
    const rockCanvas=document.createElement('canvas');rockCanvas.width=rockCanvas.height=256;const rc=rockCanvas.getContext('2d');rc.fillStyle='#e8d7cc';rc.fillRect(0,0,256,256);for(let k=0;k<18;k++){const y=k*15,shade=rc.createLinearGradient(0,y-3,0,y+15);shade.addColorStop(0,'rgba(91,45,49,.20)');shade.addColorStop(.20,'rgba(129,65,61,.07)');shade.addColorStop(.8,'rgba(255,239,205,.10)');shade.addColorStop(1,'rgba(95,55,64,.20)');rc.fillStyle=shade;rc.beginPath();rc.moveTo(0,y);for(let x=0;x<=256;x+=8)rc.lineTo(x,y+Math.sin(x*.033+k*1.2)*2.6);rc.lineTo(256,y+15);rc.lineTo(0,y+15);rc.closePath();rc.fill();}for(let k=0;k<2600;k++){rc.fillStyle=k%3?'rgba(67,31,45,.055)':'rgba(255,245,213,.20)';rc.fillRect((k*43.31)%256,(k*89.37)%256,.7+(k%3)*.35,.7);}const rockTex=new T.CanvasTexture(rockCanvas);rockTex.wrapS=rockTex.wrapT=T.RepeatWrapping;rockTex.colorSpace=T.SRGBColorSpace;const outcropMat=new T.MeshStandardMaterial({map:rockTex,bumpMap:stoneBump,bumpScale:.19,vertexColors:true,roughness:.96,metalness:0});
    const basaltImage=new Image();basaltImage.onload=()=>{stoneTex.image=basaltImage;stoneTex.needsUpdate=true;stoneMat.bumpMap=stoneTex;stoneMat.bumpScale=.11;stoneMat.needsUpdate=true;outcropMat.map=stoneTex;outcropMat.bumpMap=stoneTex;outcropMat.bumpScale=.15;outcropMat.needsUpdate=true;};artReady.then(art=>{if(art.basalt)basaltImage.src=art.basalt;});
    const strata=[];
    for(let chunk=0;chunk<19;chunk++){const q=new T.Group();root.add(q);for(let i=0;i<7;i++){const x=chunk*24+i*3.6,z=-3.4-(i%3)*.35;const pillar=mesh(q,G.rod,paint(i%2?C.blue:C.violet,true),x,ground(x)-.64,z,.49,.72+(i%3)*.16,.43);pillar.rotation.z=.12*Math.sin(x);mesh(q,G.pearl,paint(C.copper),x,ground(x)-.21,z,.42,.08,.34);}weld(q);strata.push(q);}
    const lavaMat=new T.MeshBasicMaterial({vertexColors:true}),lavaGeo=new T.BufferGeometry(),lavaP=[],lavaC=[],lavaI=[],lavaOffsets=[-1,-.50,-.075,.075,.50,1],lavaColours=[0x43313f,0x864345,0xffc05d,0xffc05d,0x864345,0x43313f];
    for(let i=0;i<=440;i++){const x=-5+i,z=riverZ(x),w=riverWidth(x);for(let j=0;j<lavaOffsets.length;j++){const zz=z+lavaOffsets[j]*w;lavaP.push(x,terrainSurfaceY(x,zz)+.035,zz);ink.setHex(lavaColours[j]);lavaC.push(ink.r,ink.g,ink.b);}if(i<440)for(let j=0;j<5;j++){const k=i*6+j;lavaI.push(k,k+1,k+6,k+1,k+7,k+6);}}
    const emberCount=14,emberOffset=lavaP.length;for(let i=0;i<emberCount;i++)for(let j=0;j<6;j++){const at=lavaP.length/3;lavaP.push(0,0,0);ink.setHex(0xffcf91);lavaC.push(ink.r,ink.g,ink.b);lavaI.push(at);}
    lavaGeo.setAttribute('position',new T.Float32BufferAttribute(lavaP,3).setUsage(T.DynamicDrawUsage));lavaGeo.setAttribute('color',new T.Float32BufferAttribute(lavaC,3));lavaGeo.setIndex(lavaI);const thermalArt=mesh(root,lavaGeo,lavaMat);thermalArt.name='Thermal river and pooled sparse embers';const emberP=lavaGeo.attributes.position.array,emberCorners=[[-1,1],[-1,-1],[1,1],[1,1],[-1,-1],[1,-1]];
    function updateEmbers(t){for(let i=0;i<emberCount;i++){const x=18+i*29.5,u=(t*.085+i*.618)%1,z=riverZ(x)+.18*Math.sin(t*.27+i),xx=x+.12*Math.sin(t*.31+i),yy=terrainSurfaceY(x,z)+.18+.58*u;for(let j=0;j<6;j++){const k=emberOffset+(i*6+j)*3;emberP[k]=xx+emberCorners[j][0]*.022;emberP[k+1]=yy+emberCorners[j][1]*.022;emberP[k+2]=z;}}lavaGeo.attributes.position.needsUpdate=true;}updateEmbers(0);
    // Sparse low river-bank outcrops. Two immutable batches, behind the protected
    // lane and touch planes; every bottom vertex follows the real terrain grid.
    {
      const rockP=[],rockC=[],rockUV=[],rockI=[],seamP=[],seamC=[],seamI=[],levels=[0,.12,.43,.48,.76,1],radii=[1.06,1.04,1.0,.88,.76,.60],sides=16;
      const bottom=new T.Color(0x3d354b),middle=new T.Color(0x745163),top=new T.Color(0xa57778),sulfur=new T.Color(0xb9a18b),tone=new T.Color();
      function point(x,z,rx,rz,angle,radius,height,level){return [x+Math.cos(angle)*rx*radius,terrainSurfaceY(x+Math.cos(angle)*rx*radius,z+Math.sin(angle)*rz*radius)+height*level-.06,z+Math.sin(angle)*rz*radius];}
      function appendRock(x,z,rx,rz,height,seed,vein){
        let riverGap=Infinity;for(let i=0;i<sides;i++){const a=i*TAU/sides+.11*Math.sin(seed),xx=x+Math.cos(a)*rx*1.03,zz=z+Math.sin(a)*rz*1.03;riverGap=Math.min(riverGap,Math.abs(zz-riverZ(xx))-riverWidth(xx));}
        if(riverGap<.35)z=riverZ(x)-riverWidth(x)-rz*1.15-rx*.36-.65;
        const offset=rockP.length/3;
        for(let k=0;k<levels.length;k++)for(let i=0;i<sides;i++){
          const a=i*TAU/sides+.11*Math.sin(seed),r=radii[k]*(1+.055*Math.sin(i*2.2+seed));const v=point(x,z,rx,rz,a,r,height,levels[k]);rockP.push(...v);rockUV.push(i/sides*2.4,levels[k]*height*.62);
          tone.copy(k===0?bottom:k===levels.length-1?top:middle);tone.lerp(sulfur,k===levels.length-1&&(seed%3===0)?.38:.05+.05*Math.sin(i+seed));const shade=.91+.09*Math.sin(a+.8);rockC.push(tone.r*shade,tone.g*shade,tone.b*shade);
          if(k<levels.length-1){const a0=offset+k*sides+i,a1=offset+k*sides+(i+1)%sides,b0=a0+sides,b1=a1+sides;rockI.push(a0,b0,a1,a1,b0,b1);}
        }
        const cap=rockP.length/3;for(let i=0;i<sides;i++){const v=(offset+(levels.length-1)*sides+i)*3,vx=rockP[v],vy=rockP[v+1],vz=rockP[v+2];rockP.push(vx,vy,vz);rockUV.push(.5+(vx-x)/rx*.5,.5+(vz-z)/rz*.5);rockC.push(rockC[v],rockC[v+1],rockC[v+2]);}const center=rockP.length/3;rockP.push(x,terrainSurfaceY(x,z)+height-.06,z);rockUV.push(.5,.5);tone.copy(top).lerp(sulfur,seed%3===0?.38:.05);rockC.push(tone.r,tone.g,tone.b);for(let i=0;i<sides;i++)rockI.push(center,cap+(i+1)%sides,cap+i);
        if(vein)for(let i=0;i<3;i++){
          const start=seamP.length/3;for(const k of [0,1])for(const j of [0,1]){const a=(i+j)*TAU/sides+.11*Math.sin(seed),h=.426+k*.020,r=(1-(h-.42)/.05*.22)*(1+.055*Math.sin((i+j)*2.2+seed))*1.007,v=point(x,z,rx,rz,a,r,height,h);v[1]+=.008;seamP.push(...v);tone.setHex(i===1?0xd4a16c:0x9f785f);seamC.push(tone.r,tone.g,tone.b);}seamI.push(start,start+2,start+1,start+1,start+2,start+3);
        }
      }
      for(let i=0,x=4;x<length-3;i++,x+=13.6){const z=-4.8-(i%2)*.6;appendRock(x,z,.85+(i%2)*.13,.55,.72+(i%3)*.12,i,true);appendRock(x-1.15,z+.18,.48,.34,.32+(i%2)*.09,i+41,false);appendRock(x+1.12,z-.31,.58,.39,.43+(i%3)*.05,i+83,false);}
      for(let i=0,x=-10;x<length+20;i++,x+=27){const z=-14-(i%3)*2.5;appendRock(x,z,3.4+(i%3)*.7,2.25,2.7+(i%3)*.78,i+106,true);appendRock(x+3.15,z+.78,1.82,1.18,1.3+(i%2)*.55,i+139,true);appendRock(x-3.36,z-.22,1.55,1.14,1.65,i+188,false);}
      for(const x of [25,53,116,177,237,294,334,354,374,410])for(const side of [-1,1])appendRock(x+side*5.4,-3.55,1.12,.71,.92+(side+1)*.15,x+side,false);
      for(let i=0,x=6;x<length;i++,x+=24)appendRock(x,4.5,2.3+(i%3)*.35,1.02,1.3+(i%3)*.15,i+299,true);
      const rocks=new T.BufferGeometry();rocks.setAttribute('position',new T.Float32BufferAttribute(rockP,3));rocks.setAttribute('color',new T.Float32BufferAttribute(rockC,3));rocks.setAttribute('uv',new T.Float32BufferAttribute(rockUV,2));rocks.setIndex(rockI);rocks.computeVertexNormals();rocks.computeBoundingBox();rocks.computeBoundingSphere();const rockMesh=mesh(root,rocks,outcropMat);rockMesh.name='Venus low stratified basalt midground';rockMesh.castShadow=true;rockMesh.receiveShadow=true;
      const seams=new T.BufferGeometry();seams.setAttribute('position',new T.Float32BufferAttribute(seamP,3));seams.setAttribute('color',new T.Float32BufferAttribute(seamC,3));seams.setIndex(seamI);seams.computeVertexNormals();seams.computeBoundingBox();seams.computeBoundingSphere();const seamMesh=mesh(root,seams,lavaMat);seamMesh.name='Venus warm sulfur seam midground';seamMesh.castShadow=seamMesh.receiveShadow=false;
    }

    const cloudCanvas=document.createElement('canvas');cloudCanvas.width=1024;cloudCanvas.height=256;const cc=cloudCanvas.getContext('2d');
    for(let layer=0;layer<4;layer++){const y=110+layer*29,gradient=cc.createLinearGradient(0,y-45,0,256);gradient.addColorStop(0,'rgba(255,217,151,0)');gradient.addColorStop(.35,layer%2?'rgba(242,191,121,.19)':'rgba(255,224,169,.29)');gradient.addColorStop(1,'rgba(238,180,107,0)');cc.fillStyle=gradient;cc.beginPath();cc.moveTo(0,256);for(let x=0;x<=1024;x+=8)cc.lineTo(x,y+Math.sin(x*.018+layer)*15+Math.sin(x*.047-layer)*4);cc.lineTo(1024,256);cc.closePath();cc.fill();}
    const cloudTex=new T.CanvasTexture(cloudCanvas);cloudTex.colorSpace=T.SRGBColorSpace;cloudTex.wrapS=T.RepeatWrapping;cloudTex.repeat.x=6;mesh(root,new T.PlaneGeometry(480,15),new T.MeshBasicMaterial({map:cloudTex,transparent:true,depthWrite:false,fog:false,opacity:.65}),210,3.6,-44);

    const heatWisps=[],heatMat=new T.MeshBasicMaterial({color:C.cream,transparent:true,opacity:.095,side:T.DoubleSide,depthWrite:false});
    for(const x of [116,237,389]){const positions=new Float32Array(5*17*6),indices=[];for(let lane=0;lane<5;lane++)for(let i=0;i<16;i++){const k=(lane*17+i)*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setIndex(indices);const q=mesh(root,g,heatMat,x,ground(x),-3.8);g.boundingSphere=new T.Sphere(new T.Vector3(0,1.75,0),4.6);heatWisps.push({q,g,positions,x});}

    // The vehicle is a little heated observatory, with an open view of the original rigs.
    const crawler=new T.Group(),body=new T.Group();root.add(crawler);crawler.add(body);const wheels=[];
    const hullPos=[],hullCol=[],hullIdx=[],stations=[[-3.25,.38,.72],[-2.65,1.33,.45],[-1.9,1.54,.40],[1.9,1.54,.40],[2.75,1.20,.50],[3.25,.30,.76]];
    const cross=[[-1,0],[-1,.18],[-.85,.35],[.85,.35],[1,.18],[1,0],[-1,0]];
    for(let i=0;i<stations.length;i++)for(let j=0;j<cross.length;j++){const [x,w,y]=stations[i],[z,h]=cross[j];hullPos.push(x,y+h,z*w);ink.setHex(j===2||j===3?C.cream:j<2?C.copper:C.blue);hullCol.push(ink.r,ink.g,ink.b);if(i<stations.length-1&&j<cross.length-1){const k=i*cross.length+j;hullIdx.push(k,k+1,k+cross.length,k+1,k+cross.length+1,k+cross.length);}}
    const hullG=new T.BufferGeometry();hullG.setAttribute('position',new T.Float32BufferAttribute(hullPos,3));hullG.setAttribute('color',new T.Float32BufferAttribute(hullCol,3));hullG.setIndex(hullIdx);hullG.computeVertexNormals();mesh(body,hullG,new T.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.34}));
    const cabin=new T.Group();body.add(cabin);mesh(cabin,G.box,paint(C.navy),0,.76,0,4.7,.10,2.35);
    for(const x of [-.94,.85]){mesh(cabin,G.rod,paint(C.gold),x,.905,-.09,.21,.31,.21);mesh(cabin,G.ball,paint(C.copper,true),x,1.09,-.05,.55,.12,.46);mesh(cabin,G.ball,paint(C.gold),x-.47,1.31,-.09,.115,.29,.40);}
    const domeG=new T.SphereGeometry(1,32,16,0,TAU,0,Math.PI*.50);mesh(body,domeG,glass,0,1.03,0,3.18,2.64,1.53);
    const domeRing=mesh(cabin,G.ring,paint(C.gold),0,1.03,0,3.18,1.53,1.03);domeRing.rotation.x=Math.PI*.5;
    for(const x of [-2.30,0,2.30]){const r=Math.sqrt(1-(x/3.18)**2),frame=mesh(cabin,new T.TorusGeometry(1,.025,5,40,Math.PI),paint(C.gold),x,1.04,0,r*1.53,r*2.64,1);frame.rotation.y=Math.PI*.5;}
    for(const side of [-1,1]){rod(cabin,-2.65,1.02,side*1.18,2.65,1.02,side*1.18,.052,paint(C.gold));for(let j=0;j<4;j++)mesh(cabin,G.pearl,basic,-1.9+j*1.25,.61,side*1.27,.13,.10,.052);}
    mesh(cabin,G.box,paint(C.blue),2.06,1.20,.10,.52,.48,1.02);const steering=mesh(body,G.ring,paint(C.teal),1.88,1.55,.68,.29,.29,.29);steering.rotation.x=-.28;
    const thermos=mesh(cabin,G.rod,paint(C.teal),-2.43,1.41,-.41,.24,.76,.24);mesh(cabin,G.pearl,basic,-2.43,1.81,-.41,.18,.09,.18);
    for(const x of [-2.1,2.1])for(const z of [-1.27,1.27]){const w=new T.Group();crawler.add(w);w.position.set(x,.62,z);const tyre=mesh(w,G.rod,paint(C.navy,true),0,0,0,.64,.35,.64);tyre.rotation.x=Math.PI*.5;for(let k=0;k<16;k++){const a=k*TAU/16,q=mesh(w,G.box,paint(C.dark,true),.61*Math.sin(a),.61*Math.cos(a),0,.14,.085,.38);q.rotation.z=-a;}const cap=mesh(w,G.ring,paint(C.gold),0,0,z>0?.23:-.23,.45,.45,.30);for(let j=0;j<6;j++){const a=j*TAU/6;rod(w,0,0,z>0?.21:-.21,.36*Math.cos(a),.36*Math.sin(a),z>0?.21:-.21,.028,paint(C.copper));}weld(w);wheels.push({group:w,x,z,angle:0});}
    for(const side of [-1,1]){mesh(cabin,G.box,paint(C.copper),-.08,.61,side*1.31,1.35,.16,.40);for(let k=0;k<5;k++)mesh(cabin,G.box,paint(C.navy),-.56+k*.24,.705,side*1.31,.12,.026,.32);for(const x of [-2.55,2.55]){mesh(cabin,G.box,paint(C.cream),x,.79,side*1.02,.64,.34,.48);for(let k=0;k<3;k++)mesh(cabin,G.box,paint(C.navy),x-.16+k*.16,.80,side*1.28,.055,.19,.022);bolt(cabin,x-.24,.91,side*1.28);bolt(cabin,x+.24,.91,side*1.28);}}
    mesh(cabin,G.box,paint(C.blue),-.75,1.00,-1.12,.90,.49,.35);mesh(cabin,G.box,paint(C.copper),-.75,1.25,-1.12,.94,.06,.39);for(const x of [-.99,-.51])mesh(cabin,G.box,paint(C.cream),x,1.00,-.93,.07,.49,.035);
    for(const x of [-2.83,2.83]){mesh(cabin,G.rod,paint(C.copper),x,.98,.70,.22,.11,.22).rotation.x=Math.PI*.5;mesh(cabin,G.pearl,basic,x,.98,.80,.15,.14,.045);}
    const boardingHandle=grip(body,C.coral);boardingHandle.position.set(.24,1.25,1.43);boardingHandle.name='Venus boarding handle';mesh(cabin,G.roundBox,paint(C.blue),.24,1.25,1.29,.78,.59,.15);
    weld(cabin);
    // A proper survey camera sits on the crawler roof; the bridge owns its working crane.
    const surveyMast=new T.Group();surveyMast.position.set(-2.27,1.13,-.72);body.add(surveyMast);mesh(surveyMast,G.rod,paint(C.copper),0,.15,0,.20,.30,.20);rod(surveyMast,0,.18,0,0,1.90,0,.065,paint(C.cream));mesh(surveyMast,G.roundBox,paint(C.blue),.12,1.94,.03,.83,.48,.55);mesh(surveyMast,G.roundBox,paint(C.cream),-.11,2.02,.32,.18,.12,.025);mesh(surveyMast,G.rod,paint(C.copper),.26,1.93,.36,.23,.16,.23).rotation.x=Math.PI*.5;mesh(surveyMast,G.rod,paint(C.teal),.26,1.93,.46,.17,.035,.17).rotation.x=Math.PI*.5;mesh(surveyMast,G.pearl,basic,.21,1.99,.49,.055,.045,.015);mesh(surveyMast,G.roundBox,paint(C.gold),-.13,2.21,.01,.28,.10,.29);weld(surveyMast);
    const cableP=new Float32Array(6),cableG=new T.BufferGeometry();cableG.setAttribute('position',new T.BufferAttribute(cableP,3));const craneCable=new T.Line(cableG,new T.LineBasicMaterial({color:C.cream}));const hookCurve=new T.CatmullRomCurve3([new T.Vector3(0,.15,0),new T.Vector3(0,.01,0),new T.Vector3(.08,-.07,0),new T.Vector3(.16,.01,0),new T.Vector3(.15,.09,0)]);const craneHook=mesh(root,new T.TubeGeometry(hookCurve,16,.035,6,false),paint(C.gold));craneHook.visible=false;const craneTrolley=mesh(root,G.roundBox,paint(C.teal),0,0,0,.36,.24,.37);craneTrolley.visible=false;craneCable.frustumCulled=false;craneCable.visible=false;root.add(craneCable);

    const workshops=[],allJobs=[],jobMap=new Map();
    // One non-coplanar, terrain-following footprint. All instrument/job transforms stay authored.
    const padMaterial=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.62,metalness:.30});
    function createPlantedBase(s){const anchors=[],col=[],normal=[],colour=new T.Color(),nx=14,zs=[-1.92,-1.84,.94,1.02];function tri(a,b,c,hex,n){colour.setHex(hex);for(const q of [a,b,c]){anchors.push(q[0],q[1],q[2]);col.push(colour.r,colour.g,colour.b);normal.push(n[0],n[1],n[2]);}}function quad(a,b,c,d,hex,n){tri(a,b,c,hex,n);tri(c,b,d,hex,n);}
      for(let i=0;i<nx;i++){const x=-3.375+i*6.75/nx,xx=x+6.75/nx;for(let j=0;j<zs.length-1;j++){const a=zs[j],b=zs[j+1],hex=i===0||i===nx-1||j===0||j===zs.length-2?C.gold:0x53668d;quad([x,a,0],[x,b,0],[xx,a,0],[xx,b,0],hex,[0,1,0]);}quad([x,zs[0],0],[xx,zs[0],0],[x,zs[0],-.20],[xx,zs[0],-.20],C.blue,[0,0,-1]);quad([x,zs[3],0],[x,zs[3],-.20],[xx,zs[3],0],[xx,zs[3],-.20],C.blue,[0,0,1]);}
      for(let j=0;j<zs.length-1;j++){quad([-3.375,zs[j],0],[-3.375,zs[j],-.20],[-3.375,zs[j+1],0],[-3.375,zs[j+1],-.20],C.blue,[-1,0,0]);quad([3.375,zs[j],0],[3.375,zs[j+1],0],[3.375,zs[j],-.20],[3.375,zs[j+1],-.20],C.blue,[1,0,0]);}
      const g=new T.BufferGeometry();g.name='Planted expedition pad '+s.id;g.setAttribute('position',new T.BufferAttribute(new Float32Array(anchors.length),3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));mesh(s.fixed,g,padMaterial);s.plantedBase={g,anchors:new Float32Array(anchors),x:NaN,y:NaN,z:NaN};rebasePlantedBase(s);}
    function rebasePlantedBase(s){const p=s.plantedBase;if(!p||p.x===s.x&&p.y===s.y&&p.z===s.group.position.z)return;p.x=s.x;p.y=s.y;p.z=s.group.position.z;const a=p.g.attributes.position.array;for(let i=0;i<a.length;i+=3){const x=p.anchors[i],z=p.anchors[i+1];a[i]=x;a[i+1]=terrainSurfaceY(s.x+x,s.group.position.z+z)+.065-s.y+p.anchors[i+2];a[i+2]=z;}p.g.attributes.position.needsUpdate=true;p.g.computeBoundingBox();p.g.computeBoundingSphere();}
    function workshop(id,x,kind){const group=new T.Group(),fixed=new T.Group();group.position.set(x,ground(x),-.55);group.add(fixed);root.add(group);const s={id,x,home:x,y:ground(x),kind,group,fixed,jobs:[],done:false,recovered:false,anim:0};workshops.push(s);createPlantedBase(s);for(const side of [-1,1]){mesh(fixed,G.box,paint(C.copper),side*3.1,.18,-.95,.16,.36,.30);mesh(fixed,G.pearl,basic,side*3.1,.38,-.95,.08,.055,.08);for(let i=0;i<3;i++){const q=mesh(fixed,G.box,paint(C.navy),side*(2.65-i*.17),.075,.86,.07,.025,.24);q.rotation.y=-.52;}}return s;}
    function addJob(s,id,mode,from,to,options={}){
      const j={id,station:s,mode,from:[...from],to:[...to],x:from[0],y:from[1],done:false,progress:0,requires:options.requires||[],angle:options.angle??-.9,radius:options.radius??.70,center:options.center||null,onDone:options.onDone||null,hideDone:!!options.hideDone,reveal:!!options.reveal,persistTarget:!!options.persistTarget,hitOffset:options.hitOffset||[0,0],depth:options.depth??.66,size:options.size||.30};
      j.mesh=options.mesh||mesh(s.group,options.shape||G.pearl,paint(options.color||C.gold),j.x,j.y,.66,j.size,j.size*(mode==='press'?.52:1),j.size*.65);
      j.mesh.name='Venus source '+id;const target=new T.Object3D();target.position.set(to[0],to[1],.50);s.group.add(target);j.target=target;
      if(mode==='turn'){if(!options.mesh){s.group.remove(j.mesh);j.mesh=grip(s.group,options.color||C.gold);}j.center=options.center||[from[0]-.70,from[1]+.55];j.radius=options.radius||.87;j.angle=-.9;j.x=j.center[0]+Math.cos(j.angle)*j.radius;j.y=j.center[1]+Math.sin(j.angle)*j.radius;j.to=[j.center[0]+Math.cos(.72)*j.radius,j.center[1]+Math.sin(.72)*j.radius];target.position.set(j.to[0],j.to[1],.50);j.wheel=mesh(s.group,G.ring,paint(options.color||C.gold),j.center[0],j.center[1],.34,j.radius,j.radius,.27);mesh(s.fixed,G.rod,paint(C.navy),j.center[0],j.center[1],.12,.21,.33,.21).rotation.x=Math.PI*.5;const spokes=new T.Group();j.wheel.add(spokes);for(let i=0;i<3;i++){const a=i*TAU/3;rod(spokes,0,0,.06,.86*Math.cos(a),.86*Math.sin(a),.06,.043,paint(C.copper));}mesh(spokes,G.pearl,paint(C.gold),0,0,.08,.17,.17,.12);weld(spokes);j.mesh.position.set(j.x,j.y,.66);}
      allJobs.push(j);s.jobs.push(j);jobMap.set(id,j);return j;
    }
    function requiresDone(j){for(const id of j.requires)if(!jobMap.get(id)?.done)return false;return true;}
    function firstJob(s){for(const j of s.jobs)if(!j.done&&requiresDone(j))return j;return null;}
    function finished(s){for(const j of s.jobs)if(!j.done)return false;return true;}

    const coolant=workshop('coolant',25,'coolant');coolant.pipes=[];coolant.tanks=[];coolant.flowers=[];
    mesh(coolant.fixed,G.box,paint(C.blue),0,.16,-.55,5.5,.26,1.40);mesh(coolant.fixed,G.box,paint(C.cream),0,2.67,-1.0,5.55,.15,.38);
    for(let i=0;i<3;i++){const x=-2.05+i*2.05,color=[C.teal,C.pale,C.coral][i];
      mesh(coolant.fixed,G.rod,paint(C.navy),x,.39,-.46,.53,.30,.53);mesh(coolant.fixed,G.rod,glass,x,.95,-.46,.49,.98,.49);mesh(coolant.fixed,G.rod,paint(C.cream),x,1.46,-.46,.53,.10,.53);
      mesh(coolant.fixed,G.rod,paint(color),x,.52,-.46,.43,.08,.43);coolant.tanks.push(mesh(coolant.group,G.rod,paint(color),x,.55,-.46,.40,.05,.40));
      hose(coolant.fixed,[[x,.40,-.5],[x,.40,.30],[x,.83,.30]],C.copper,.065);mesh(coolant.fixed,G.box,paint(C.cream),x,.70,.37,.70,.13,.50);mesh(coolant.fixed,G.box,paint(color),x,.78,.37,.43,.035,.34);
      rod(coolant.fixed,x-.59,.15,-1.02,x-.59,2.62,-1.02,.07,paint(C.copper));coolant.pipes.push(mesh(coolant.group,G.pearl,paint(color),x,1.5,-.55,.15,.16,.12));
      const item=bottle(coolant.group,color);addJob(coolant,'coolant'+i,'carry',[x-.48,1.97],[x,.99],{mesh:item,color,size:.39,persistTarget:true});
      bolt(coolant.fixed,x-.36,1.46,.02);bolt(coolant.fixed,x+.36,1.46,.02);const seedling=plant(coolant.group,x+.58,.16,.64,i);seedling.scale.setScalar(.14);coolant.flowers.push(seedling);hose(coolant.fixed,[[x,.38,-.46],[x+.58,.38,-.46],[x+.58,.38,.64],[x+.58,.22,.64]],C.teal,.043);
    }
    const canopy=workshop('canopy',53,'canopy');canopy.plants=[];
    mesh(canopy.fixed,G.box,paint(C.cream),0,.22,-.62,5.1,.38,1.83);mesh(canopy.fixed,domeG,glass,0,.40,-.62,2.42,2.55,1.00);
    canopy.shade=mesh(canopy.group,domeG,new T.MeshBasicMaterial({color:C.amber,transparent:true,opacity:.30,side:T.DoubleSide,depthWrite:false}),0,.40,-.62,2.44,2.57,1.02);
    for(const x of [-2.05,0,2.05]){const r=Math.sqrt(1-(x/2.45)**2);const frame=mesh(canopy.fixed,new T.TorusGeometry(1,.028,5,32,Math.PI),paint(C.cream),x,.40,-.62,r,r*2.55,1);frame.rotation.y=Math.PI*.5;}
    for(let i=0;i<5;i++)canopy.plants.push(plant(canopy.group,-1.60+i*.8,.42,-.69,i));
    mesh(canopy.fixed,G.box,paint(C.copper),0,.66,.42,4.65,.10,.12);for(let i=0;i<2;i++){const x=i?2.23:-2.23;mesh(canopy.fixed,G.box,paint(C.blue),x,.98,.40,.44,.85,.22);const latch=new T.Group();canopy.group.add(latch);const side=i?-1:1,mid=side*.67;mesh(latch,G.box,glass,mid,.02,0,1.34,1.42,.035);for(const y of [-.70,.74])mesh(latch,G.roundBox,paint(C.cream),mid,y,.025,1.43,.065,.07);for(const x of [0,side*1.34])mesh(latch,G.roundBox,paint(C.cream),x,.02,.025,.065,1.49,.07);const handle=grip(latch,C.coral);handle.position.set(0,0,.10);weld(latch);addJob(canopy,'latch'+i,'slide',[x,1.25],[i?1.45:-1.45,1.25],{mesh:latch,size:.34});}
    hose(canopy.fixed,[[-2.50,.21,.0],[-2.50,1.84,.0],[-.85,1.84,.0]],C.teal,.075);addJob(canopy,'filter','turn',[-.1,1.45],[0,0],{center:[.10,1.72],color:C.teal,radius:.60,requires:['latch0','latch1']});
    const steamCanvas=document.createElement('canvas');steamCanvas.width=steamCanvas.height=128;const sc=steamCanvas.getContext('2d');for(let k=0;k<7;k++){const x=45+(k%3)*16,y=39+Math.floor(k/3)*17,r=22+(k%2)*7,g=sc.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,'rgba(255,237,189,.50)');g.addColorStop(.55,'rgba(255,237,189,.22)');g.addColorStop(1,'rgba(255,237,189,0)');sc.fillStyle=g;sc.fillRect(x-r,y-r,r*2,r*2);}const steamTex=new T.CanvasTexture(steamCanvas);const steamMat=new T.MeshBasicMaterial({map:steamTex,transparent:true,opacity:.62,depthWrite:false,fog:false}),steamG=new T.PlaneGeometry(.82,.96);
    const vents=workshop('vents',116,'vents');vents.plumes=[];vents.fans=[];vents.lamps=[];
    for(let i=0;i<3;i++){const x=-2.15+i*2.15,color=[C.gold,C.coral,C.teal][i];
      // Riveted copper boiler, elbow piping and a real three-bladed ventilation fan.
      mesh(vents.fixed,G.rod,paint(C.copper),x,.55,-.67,.52,.92,.52);mesh(vents.fixed,G.pearl,paint(C.cream),x,1.03,-.67,.52,.15,.52);
      for(const side of [-1,1]){mesh(vents.fixed,G.rod,paint(C.gold),x,.32+side*.16,-.67,.54,.055,.54);bolt(vents.fixed,x+side*.28,.67,-.12);}
      hose(vents.fixed,[[x,1.01,-.66],[x,1.99,-.66],[x+.53,1.99,-.66]],C.copper,.10);
      // The wheel's axle enters a full-size valve body on the copper pipe.
      // Its two bolted flanges make the connection readable from the path.
      mesh(vents.fixed,G.pearl,paint(color),x,1.60,-.66,.25,.29,.24);for(const side of [-1,1]){mesh(vents.fixed,G.rod,paint(C.cream),x,1.60+side*.25,-.66,.23,.065,.23);for(const z of [-.81,-.51])mesh(vents.fixed,G.rod,paint(C.copper),x,1.60+side*.25,z,.035,.13,.035);}
      rod(vents.fixed,x,1.60,-.62,x,1.60,.32,.085,paint(C.pale));mesh(vents.fixed,G.rod,paint(C.copper),x,1.60,-.21,.16,.17,.16).rotation.x=Math.PI*.5;
      hose(vents.fixed,[[x,1.19,-.5],[x-.67,1.19,-.5],[x-.67,2.95,-.5],[x,2.95,-.5]],C.teal,.07);
      mesh(vents.fixed,G.rod,paint(C.navy),x+.52,1.99,-.66,.17,.24,.17).rotation.z=Math.PI*.5;
      const plume=new T.Group();plume.position.set(x+.67,1.91,-.60);vents.group.add(plume);vents.plumes.push(plume);for(let k=0;k<3;k++)mesh(plume,steamG,steamMat,k*.10,k*.25,0,.66+k*.19,.66+k*.19,1);
      const fan=new T.Group();fan.name='Venus ventilation fan '+i;fan.position.set(x,2.95,-.12);vents.group.add(fan);vents.fans.push(fan);mesh(fan,G.rod,paint(C.cream),0,0,0,.16,.22,.16).rotation.x=Math.PI*.5;
      for(let k=0;k<3;k++){const a=k*TAU/3,q=mesh(fan,G.pearl,paint(color),Math.sin(a)*.28,Math.cos(a)*.28,.04,.15,.40,.055);q.rotation.z=-a+.27;}weld(fan);
      mesh(vents.fixed,G.box,paint(C.blue),x,.16,-.63,1.40,.24,1.18);const lamp=mesh(vents.group,G.pearl,paint(C.navy),x,.45,.07,.13,.10,.08);vents.lamps.push(lamp);
      addJob(vents,'vent'+i,'turn',[x+.25,1.27],[0,0],{center:[x,1.60],color,radius:.48});
    }
    const bridge=workshop('bridge',177,'bridge');bridge.beams=[];bridge.lights=[];
    // The trench is behind the family path; three actual deck slabs fill its open slots.
    mesh(bridge.fixed,G.box,paint(C.navy,true),1.38,.11,-1.12,3.8,.19,3.0);
    for(const x of [-.57,3.24]){mesh(bridge.fixed,G.box,paint(C.violet,true),x,.33,-1.10,.60,.65,3.13);mesh(bridge.fixed,G.box,paint(C.copper),x,.67,-1.10,.64,.13,3.13);}
    for(const z of [-2.63,.43]){mesh(bridge.fixed,G.box,paint(C.copper),1.35,.55,z,3.86,.19,.12);for(const x of [-.53,3.21]){rod(bridge.fixed,x,.65,z,x,1.55,z,.06,paint(C.cream));}rod(bridge.fixed,-.53,1.53,z,3.21,1.53,z,.04,paint(C.cream));}
    // Fixed crane with diagonal braces, counterweight, pulley and a cable that follows the slab.
    mesh(bridge.fixed,G.roundBox,paint(C.blue),-2.72,.34,-1.23,.92,.60,.82);rod(bridge.fixed,-2.72,.56,-1.23,-2.72,3.45,-1.23,.13,paint(C.gold));rod(bridge.fixed,-2.72,3.40,-1.23,2.75,3.40,-1.23,.11,paint(C.gold));rod(bridge.fixed,-2.72,3.43,-1.23,1.16,3.43,-1.23,.07,paint(C.copper));rod(bridge.fixed,-2.72,2.13,-1.23,.10,3.40,-1.23,.065,paint(C.copper));mesh(bridge.fixed,G.rod,paint(C.blue),-2.72,3.4,-1.23,.23,.24,.23).rotation.x=Math.PI*.5;
    for(let i=0;i<3;i++){const x=.25+i*1.03,color=[C.teal,C.cream,C.copper][i];
      // Open slots show the bottom of the trench until a real flanged deck
      // panel arrives. Matching mounting feet sit on the two support rails.
      for(const side of [-1,1]){mesh(bridge.fixed,G.box,paint(C.navy),x,.60,-1.10+side*1.28,.83,.13,.22);for(const a of [-1,1])mesh(bridge.fixed,G.rod,paint(C.pale),x+a*.33,.69,-1.10+side*1.28,.045,.16,.045);}
      const beam=new T.Group();bridge.group.add(beam);beam.name='Bolted bridge deck panel '+i;mesh(beam,G.roundBox,paint(color),0,0,0,.96,.17,2.87);
      for(const a of [-1,1]){mesh(beam,G.box,paint(C.copper),a*.38,-.16,0,.08,.30,2.72);mesh(beam,G.box,paint(C.navy),a*.38,-.30,0,.19,.07,2.76);}
      for(const side of [-1,1]){mesh(beam,G.box,paint(C.gold),0,.12,side*1.22,.88,.055,.16);for(const a of [-1,1])mesh(beam,G.rod,paint(C.pale),a*.33,.17,side*1.22,.055,.055,.055);}
      for(let k=0;k<5;k++)mesh(beam,G.box,paint(C.cream),0,.10,-.85+k*.40,.64,.025,.055);weld(beam);bridge.beams.push(beam);addJob(bridge,'bridge'+i+'Place','carry',[-1.24-i*.38,1.11-i*.25],[x,.76],{mesh:beam,size:.54,depth:.32,requires:i?['bridge'+(i-1)+'Place']:[]});bridge.lights.push(mesh(bridge.group,G.pearl,paint(C.navy),x,.78,-.07,.08,.055,.045));}
    const quarry=workshop('quarry',237,'quarry');quarry.samples=[];
    // Little enamel-yellow excavator: tracks, glazed cab, articulated boom and toothed bucket.
    const digger=new T.Group();quarry.fixed.add(digger);digger.position.set(-1.65,.18,-.62);quarry.digger=digger;
    const trackShape=new T.Shape();trackShape.moveTo(-.76,.02);trackShape.lineTo(.76,.02);trackShape.absarc(.76,.25,.23,-Math.PI*.5,Math.PI*.5,false);trackShape.lineTo(-.76,.48);trackShape.absarc(-.76,.25,.23,Math.PI*.5,Math.PI*1.5,false);trackShape.closePath();const trackG=profileGeometry(trackShape,.26);
    function trackPoint(d){const straight=1.52,arc=Math.PI*.23,total=straight*2+arc*2;d=(d%total+total)%total;if(d<straight)return[-.76+d,.48,0];d-=straight;if(d<arc){const a=Math.PI*.5-d/.23;return[.76+Math.cos(a)*.23,.25+Math.sin(a)*.23,-d/.23];}d-=arc;if(d<straight)return[.76-d,.02,Math.PI];d-=straight;const a=-Math.PI*.5-d/.23;return[-.76+Math.cos(a)*.23,.25+Math.sin(a)*.23,Math.PI-d/.23];}
    for(const z of [-.53,.39]){mesh(digger,trackG,paint(C.navy,true),0,0,z);for(let k=0;k<6;k++){const w=mesh(digger,G.rod,paint(C.copper),-.72+k*.288,.25,z+.31,.155,.055,.155);w.rotation.x=Math.PI*.5;mesh(digger,G.rod,paint(C.pale),-.72+k*.288,.25,z+.355,.055,.06,.055).rotation.x=Math.PI*.5;}for(let k=0;k<30;k++){const [x,y,a]=trackPoint(k*(3.04+TAU*.23)/30),q=mesh(digger,G.box,paint(C.dark,true),x,y,z+.14,.12,.065,.35);q.rotation.z=a;}}
    mesh(digger,G.roundBox,paint(C.gold),0,.66,0,1.93,.44,1.18);mesh(digger,G.roundBox,paint(C.copper),-.69,.91,0,.64,.35,1.09);
    const cabProfile=new T.Shape();cabProfile.moveTo(-.69,.98);cabProfile.lineTo(.44,.98);cabProfile.quadraticCurveTo(.60,1.02,.59,1.22);cabProfile.lineTo(.48,1.68);cabProfile.quadraticCurveTo(.38,2.03,.15,2.04);cabProfile.lineTo(-.48,2.04);cabProfile.quadraticCurveTo(-.70,2.03,-.71,1.81);cabProfile.lineTo(-.71,1.15);cabProfile.quadraticCurveTo(-.71,.99,-.69,.98);
    const windowPath=new T.Path();windowPath.moveTo(-.51,1.25);windowPath.lineTo(-.51,1.77);windowPath.quadraticCurveTo(-.51,1.86,-.42,1.86);windowPath.lineTo(.11,1.86);windowPath.quadraticCurveTo(.25,1.86,.30,1.66);windowPath.lineTo(.37,1.25);windowPath.closePath();cabProfile.holes.push(windowPath);const cabShell=mesh(digger,profileGeometry(cabProfile,.89),paint(C.gold),0,0,-.44);cabShell.castShadow=true;
    mesh(digger,G.roundBox,paint(C.navy),-.14,2.03,0,1.18,.11,1.11);mesh(digger,G.roundBox,paint(C.blue),-.34,1.35,-.22,.40,.47,.40);mesh(digger,G.roundBox,paint(C.navy),-.36,1.61,-.34,.39,.41,.17);mesh(digger,G.box,glass,-.10,1.56,.50,.85,.60,.025);rod(digger,.21,1.22,.35,.21,1.42,.35,.025,paint(C.navy));mesh(digger,G.pearl,paint(C.coral),.21,1.43,.35,.055,.055,.055);rod(digger,-.61,1.25,.53,-.61,1.68,.53,.025,paint(C.copper));for(const [x,y]of [[-.58,1.05],[.43,1.05],[-.58,1.95],[.25,1.91]])bolt(digger,x,y,.53);
    mesh(digger,G.rod,paint(C.navy),-.88,1.16,-.20,.065,.43,.065);mesh(digger,G.pearl,paint(C.copper),-.88,1.39,-.20,.105,.045,.105);
    for(let k=0;k<5;k++)mesh(digger,G.roundBox,paint(C.navy),-.92+k*.10,.89,.57,.045,.16,.022);mesh(digger,G.roundBox,paint(C.cream),.66,.79,.62,.36,.17,.10);mesh(digger,G.pearl,basic,.66,.79,.69,.12,.065,.025);
    const warningCanvas=document.createElement('canvas');warningCanvas.width=256;warningCanvas.height=64;const wc=warningCanvas.getContext('2d');wc.fillStyle='#f3bf55';wc.fillRect(0,0,256,64);wc.fillStyle='#3c3b48';for(let k=-1;k<9;k++){wc.beginPath();wc.moveTo(k*40,64);wc.lineTo(k*40+31,0);wc.lineTo(k*40+46,0);wc.lineTo(k*40+15,64);wc.closePath();wc.fill();}const warningTex=new T.CanvasTexture(warningCanvas);warningTex.colorSpace=T.SRGBColorSpace;mesh(digger,new T.PlaneGeometry(1.52,.09),new T.MeshStandardMaterial({map:warningTex,roughness:.68}),.02,.53,.606);weld(digger);
    const boom=new T.Group();boom.position.set(-.96,1.22,-.32);quarry.group.add(boom);quarry.boom=boom;rod(boom,0,0,0,.63,1.0,0,.12,paint(C.gold));rod(boom,.12,.01,.08,.58,.83,.08,.055,paint(C.pale));rod(boom,.63,1.0,0,1.25,.42,0,.10,paint(C.gold));rod(boom,.73,.94,.08,1.20,.49,.08,.047,paint(C.pale));for(const [x,y]of [[0,0],[.63,1.0],[1.25,.42]])mesh(boom,G.rod,paint(C.copper),x,y,.06,.15,.15,.15).rotation.x=Math.PI*.5;
    const bucket=new T.Group();bucket.position.set(1.23,.35,.01);boom.add(bucket);mesh(bucket,G.box,paint(C.copper),0,0,0,.60,.36,.58);mesh(bucket,G.box,paint(C.navy),0,.20,0,.46,.025,.41);for(let k=0;k<4;k++){const q=mesh(bucket,G.box,paint(C.cream),-.28,-.14,-.23+k*.15,.25,.08,.08);q.rotation.z=-.35;}weld(bucket);weld(boom);
    quarry.rock=mesh(quarry.fixed,G.crystal,paint(C.violet,true),.15,.44,-.52,.87,.76,.70);quarry.rock.rotation.z=.35;
    for(let i=0;i<3;i++){const x=[-2.50,2.68,-.12][i],y=[.60,.60,1.67][i];mesh(quarry.fixed,G.rod,paint([C.teal,C.pale,C.coral][i]),x,y-.20,.39,.36,.14,.36);mesh(quarry.fixed,G.rod,paint(C.cream),x,y-.10,.39,.38,.08,.38);mesh(quarry.fixed,G.rod,paint(C.navy),x,y-.05,.39,.27,.028,.27);for(const side of [-1,1])mesh(quarry.fixed,G.roundBox,paint([C.teal,C.pale,C.coral][i]),x+side*.30,y,.39,.10,.15,.35);}
    rod(quarry.fixed,-.12,.18,-.04,-.12,1.47,-.04,.06,paint(C.copper));mesh(quarry.fixed,G.roundBox,paint(C.blue),-.12,.13,-.04,.64,.16,.68);rod(quarry.fixed,-.12,1.47,-.04,-.12,1.47,.39,.04,paint(C.cream));
    // Core drilling rig with guide rails and a downward push handle.
    mesh(quarry.fixed,G.roundBox,paint(C.blue),1.66,.28,-.57,1.24,.48,.88);for(const x of [1.17,2.15])rod(quarry.fixed,x,.44,-.70,x,2.45,-.70,.065,paint(C.copper));mesh(quarry.fixed,G.box,paint(C.cream),1.66,2.49,-.70,1.17,.14,.31);quarry.drillRod=mesh(quarry.group,G.rod,paint(C.pale),1.66,1.65,-.37,.12,1.06,.12);quarry.bit=mesh(quarry.group,G.cone,paint(C.copper),1.66,1.11,-.37,.19,.35,.19);
    const flute=[];for(let k=0;k<=42;k++){const a=k/42*TAU*2.8;flute.push(new T.Vector3(Math.cos(a)*.88,-.45+k/42*1.95,Math.sin(a)*.88));}mesh(quarry.bit,new T.TubeGeometry(new T.CatmullRomCurve3(flute),48,.11,5,false),paint(C.pale));for(let k=0;k<6;k++)mesh(quarry.fixed,G.box,paint(C.navy),1.16,.80+k*.24,-.60,.15,.025,.023);
    const digLever=grip(quarry.group,C.coral);addJob(quarry,'sniff','press',[-2.50,1.45],[-2.50,.93],{mesh:digLever,size:.40});
    addJob(quarry,'crystal','carry',[.14,.95],[-2.50,.80],{mesh:sampleRock(quarry.group,0),size:.39,requires:['sniff'],reveal:true});
    addJob(quarry,'corePress','press',[1.66,2.52],[1.66,1.83],{mesh:grip(quarry.group,C.gold),size:.38});
    addJob(quarry,'coreDrill','turn',[2.33,1.48],[0,0],{center:[1.70,1.43],radius:.51,color:C.copper,requires:['corePress']});
    addJob(quarry,'core','slide',[1.66,.69],[2.68,.80],{mesh:sampleRock(quarry.group,1),size:.37,requires:['coreDrill'],reveal:true});
    addJob(quarry,'pebble','carry',[-.12,.43],[-.12,1.87],{mesh:sampleRock(quarry.group,2),size:.36,requires:['crystal']});
    const pressure=workshop('pressure',294,'pressure');pressure.lamps=[];
    mesh(pressure.fixed,G.roundBox,paint(C.blue),0,1.30,-.62,3.63,2.46,1.30);mesh(pressure.fixed,G.box,paint(C.navy),0,1.33,.08,3.13,1.82,.04);mesh(pressure.fixed,G.box,paint(C.cream),0,2.52,-.30,3.85,.16,1.38);
    for(let i=0;i<3;i++){const x=-1.03+i*1.03,color=[C.teal,C.pale,C.coral][i],fromX=-2.60+i*2.60;mesh(pressure.fixed,G.roundBox,paint(C.copper),fromX,.26,.58,.78,.12,.61);mesh(pressure.fixed,G.roundBox,paint(color),fromX,.33,.58,.60,.025,.45);mesh(pressure.fixed,G.rod,paint(color),x,1.09,.37,.39,.14,.39);mesh(pressure.fixed,G.rod,paint(C.cream),x,1.18,.37,.40,.06,.40);mesh(pressure.fixed,G.rod,glass,x,1.62,.27,.38,.87,.38);pressure.lamps.push(mesh(pressure.group,G.pearl,paint(C.navy),x,2.27,.18,.13,.075,.045));addJob(pressure,'cabinetLoad'+i,'carry',[-2.60+i*2.60,.54],[x,1.53],{mesh:sampleRock(pressure.group,i,0,0,0,.28),size:.36,requires:[['crystal','core','pebble'][i]],persistTarget:true});}
    const pressureDoor=new T.Group();pressure.group.add(pressureDoor);mesh(pressureDoor,G.box,glass,0,0,0,3.10,1.92,.07);for(const y of [-.96,.96])mesh(pressureDoor,G.box,paint(C.cream),0,y,.02,3.20,.07,.09);for(const x of [-1.56,1.56])mesh(pressureDoor,G.box,paint(C.cream),x,0,.02,.07,1.96,.09);const ph=grip(pressureDoor,C.coral);ph.position.set(.93,0,.11);weld(pressureDoor);addJob(pressure,'cabinetDoor','slide',[2.21,1.36],[0,1.36],{mesh:pressureDoor,size:.47,depth:.90,hitOffset:[.93,0],requires:['cabinetLoad0','cabinetLoad1','cabinetLoad2']});
    pressure.piston=mesh(pressure.group,G.rod,paint(C.pale),-2.35,1.27,.26,.09,1.74,.09);pressure.level=mesh(pressure.group,G.box,new T.MeshBasicMaterial({color:C.teal,transparent:true,opacity:.14,depthWrite:false}),0,.44,.48,2.70,.03,.06);mesh(pressure.fixed,G.rod,paint(C.copper),-2.35,.56,.08,.28,.94,.28);hose(pressure.fixed,[[-2.35,.25,.08],[-1.89,.25,.08],[-1.89,.77,.08]],C.teal,.075);
    addJob(pressure,'cabinetPump','press',[-2.35,2.19],[-2.35,1.30],{mesh:grip(pressure.group,C.gold),size:.38,requires:['cabinetDoor']});addJob(pressure,'cabinetAir','turn',[2.70,1.16],[0,0],{center:[2.40,1.82],radius:.48,color:C.teal,requires:['cabinetPump']});
    const drawer=new T.Group();pressure.group.add(drawer);mesh(drawer,G.box,paint(C.cream),0,0,0,1.12,.33,.57);const dh=grip(drawer,C.copper);dh.position.set(0,0,.33);weld(drawer);addJob(pressure,'cabinetStore','slide',[.03,.51],[1.76,.51],{mesh:drawer,size:.43,requires:['cabinetAir']});

    const balloons=[];
    function balloonEnvelope(){const g=new T.SphereGeometry(1,24,16);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),r=.88+.12*Math.cos(Math.atan2(p.getZ(i),p.getX(i))*10);p.setX(i,p.getX(i)*r*(.96+.10*y));p.setZ(i,p.getZ(i)*r);p.setY(i,y*1.18);}g.computeVertexNormals();return g;}
    const balloonG=balloonEnvelope();
    for(let b=0;b<3;b++){
      const s=workshop('balloon'+b,334+b*20,'balloon'),float=new T.Group(),color=[C.gold,C.coral,C.teal][b];s.group.add(float);float.position.set(1.48,.55,-.28);s.balloon=float;s.launch=0;s.balloonIndex=b;balloons.push(s);
      const fabric=new T.MeshStandardMaterial({map:clothTex,color,roughness:.84,metalness:0});const envelope=mesh(float,balloonG,fabric,0,1.89,0,1.08,1.08,.77);s.envelope=envelope;
      s.basket=basket(float,0,-.08,0,.82,.47);for(const side of [-1,1]){rod(float,side*.48,1.22,.08,side*.28,.17,.08,.025,paint(C.cream));rod(float,side*.42,1.20,-.16,side*.28,.17,-.16,.025,paint(C.cream));}mesh(float,G.rod,paint(C.copper),0,.47,0,.17,.30,.17);mesh(float,G.cone,new T.MeshBasicMaterial({color:0xffdf8e}),0,.75,0,.10,.28,.10);mesh(float,G.box,paint(C.blue),0,-.10,.34,.28,.20,.14);mesh(float,G.pearl,basic,0,-.1,.43,.095,.075,.035);weld(float);
      mesh(s.fixed,G.roundBox,paint(C.cream),1.48,.13,.02,1.15,.20,1.03);mesh(s.fixed,G.roundBox,paint(C.navy),1.48,.24,.02,.89,.035,.72);for(const side of [-1,1])mesh(s.fixed,G.roundBox,paint(color),1.48+side*.49,.31,.02,.10,.17,.85);mesh(s.fixed,G.roundBox,paint(C.copper),-2.12,.27,.55,1.0,.11,.78);for(const x of [-2.50,-1.74])rod(s.fixed,x,.04,.30,x,.22,.30,.045,paint(C.cream));const looseBasket=basket(s.group,0,0,0,.87,.49);addJob(s,s.id+'Basket','carry',[-2.12,.57],[1.48,.47],{mesh:looseBasket,size:.49,hideDone:true});
      // Folded stitched cloth is visibly fitted to the waiting wicker basket.
      mesh(s.fixed,G.roundBox,paint(C.cream),-1.50,1.94,.20,1.15,.10,.72);for(const x of [-2.0,-1.0])rod(s.fixed,x,.16,-.12,x,1.89,-.12,.045,paint(C.copper));const fold=new T.Group();s.group.add(fold);mesh(fold,G.roundBox,fabric,0,0,0,1.0,.24,.56);for(let k=0;k<5;k++)mesh(fold,G.box,paint(C.cream),-.40+k*.20,.13,0,.025,.026,.57);mesh(fold,G.box,paint(C.copper),0,0,.30,.15,.26,.025);weld(fold);
      addJob(s,s.id+'Canopy','carry',[-1.50,2.10],[1.48,2.28],{mesh:fold,size:.50,requires:[s.id+'Basket'],hideDone:true});
      addJob(s,s.id+'Gas','turn',[-1.42,1.16],[0,0],{center:[-1.10,1.49],radius:.50,color:C.gold,requires:[s.id+'Canopy']});
      const release=grip(s.group,C.coral);addJob(s,s.id+'Launch','press',[1.48,1.09],[1.48,.32],{mesh:release,size:.37,hideDone:true,requires:[s.id+'Gas'],onDone:()=>{s.launch=.001;M.sfx('wind-lift');}});
      mesh(s.fixed,G.rod,paint(C.copper),-1.10,.57,-.64,.37,1.06,.37);mesh(s.fixed,G.pearl,paint(C.cream),-1.10,1.11,-.64,.37,.10,.37);mesh(s.fixed,G.box,paint(C.blue),-1.10,.12,-.64,1.05,.19,.89);hose(s.fixed,[[-1.1,.22,-.64],[-.40,.22,-.64],[-.40,.22,.06],[1.48,.22,.06],[1.48,.65,.06]],C.teal,.065);
      s.rope=mesh(s.group,G.rod,paint(C.cream),1.48,1.53,.18,.018,2.23,.018);mesh(s.fixed,G.box,paint(C.copper),1.48,.18,.19,.44,.24,.40);
      for(const x of [-1.40,-.80])bolt(s.fixed,x,.67,-.27);
    }
    let finaleX=410;const observatory=workshop('observatory',finaleX,'observatory');observatory.dome=[];
    const obsShell=new T.Group();obsShell.position.set(0,0,-3.85);observatory.group.add(obsShell);mesh(obsShell,G.rod,paint(C.blue),0,.40,0,5.2,.8,3.3);mesh(obsShell,G.rod,paint(C.gold),0,.85,0,5.13,.10,3.26);
    for(const side of [-1,1]){const hinge=new T.Group();hinge.position.set(side*2.45,.90,0);obsShell.add(hinge);const dome=mesh(hinge,new T.SphereGeometry(1,28,14,side<0?Math.PI*.5:-Math.PI*.5,Math.PI,0,Math.PI*.5),glass,-side*2.45,0,0,5.04,4.3,3.2);observatory.dome.push(hinge);const lines=[],start=side<0?Math.PI*.5:-Math.PI*.5;function dot(phi,theta){return[-side*2.45-5.04*Math.cos(phi)*Math.sin(theta),4.3*Math.cos(theta),3.2*Math.sin(phi)*Math.sin(theta)];}for(let k=0;k<=4;k++)for(let n=0;n<18;n++)lines.push(...dot(start+Math.PI*k/4,Math.PI*.5*n/18),...dot(start+Math.PI*k/4,Math.PI*.5*(n+1)/18));for(let k=1;k<=3;k++)for(let n=0;n<24;n++)lines.push(...dot(start+Math.PI*n/24,Math.PI*.5*k/3),...dot(start+Math.PI*(n+1)/24,Math.PI*.5*k/3));const ribG=new T.BufferGeometry();ribG.setAttribute('position',new T.Float32BufferAttribute(lines,3));hinge.add(new T.LineSegments(ribG,new T.LineBasicMaterial({color:C.cream,transparent:true,opacity:.78})));}
    observatory.cards=[];const postcardTextures=[];
    for(let i=0;i<3;i++){const c=document.createElement('canvas');c.width=256;c.height=160;const p=c.getContext('2d'),gr=p.createLinearGradient(0,0,0,160);gr.addColorStop(0,['#d6a87a','#e5c385','#bb987e'][i]);gr.addColorStop(1,'#f8db9e');p.fillStyle=gr;p.fillRect(0,0,256,160);for(let layer=0;layer<3;layer++){p.fillStyle=['#9b8295','#6c6b95','#445482'][layer];p.beginPath();p.moveTo(0,160);for(let x=0;x<=256;x+=8)p.lineTo(x,95-layer*13+22*Math.sin(x*.027+i+layer*.8)+12*Math.sin(x*.059+layer));p.lineTo(256,160);p.closePath();p.fill();}p.strokeStyle='#edb66b';p.lineWidth=4;p.strokeRect(2,2,252,156);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;postcardTextures.push(tex);const card=mesh(observatory.group,new T.PlaneGeometry(.94,.62),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),-2.48+i*2.48,2.03,.65);observatory.cards.push(card);rod(observatory.fixed,-2.48+i*2.48,.06,.36,-2.48+i*2.48,3.31,.36,.044,paint(C.gold));mesh(observatory.fixed,G.box,paint(C.copper),-2.48+i*2.48,1.91,.42,1.02,.09,.16);addJob(observatory,'photo'+i,'carry',[-2.48+i*2.48,2.03],[-2.48+i*2.48,2.95],{mesh:card,size:.38,requires:['balloon'+i+'Launch'],reveal:true,persistTarget:true});addJob(observatory,'display'+i,'carry',[-2.48+i*2.48,.51],[-2.48+i*2.48,1.41],{mesh:sampleRock(observatory.group,i,0,0,0,.28),size:.35,requires:['cabinetStore'],reveal:true,persistTarget:true});}
    for(let i=0;i<3;i++){const p=postcardTextures[i].image.getContext('2d');p.lineCap='round';if(i===0){p.strokeStyle='#f4cb7e';p.lineWidth=4;p.beginPath();p.moveTo(27,127);p.lineTo(226,112);p.stroke();for(let k=0;k<5;k++){const x=40+k*40;p.beginPath();p.moveTo(x,126-k*3);p.lineTo(x,147-k*2);p.stroke();}}else if(i===1){p.strokeStyle='rgba(255,236,189,.86)';p.lineWidth=6;for(let k=0;k<3;k++){const x=55+k*70;p.beginPath();p.moveTo(x,132);p.bezierCurveTo(x-16,117,x+17,103,x,82);p.stroke();}}else{const shades=['#73c8c0','#d5d6b9','#df9778'];for(let k=0;k<3;k++){const x=77+k*50;p.fillStyle=shades[k];p.beginPath();p.moveTo(x-14,138);p.lineTo(x-7,115-k*3);p.lineTo(x+4,108+k*2);p.lineTo(x+16,136);p.closePath();p.fill();}}postcardTextures[i].needsUpdate=true;}
    const finalHandle=grip(observatory.group,C.coral);finalHandle.position.set(.60,2.09,.65);const finalRigPositions=new Float32Array(12),finalRigG=new T.BufferGeometry();finalRigG.setAttribute('position',new T.BufferAttribute(finalRigPositions,3));const finalRig=new T.LineSegments(finalRigG,new T.LineBasicMaterial({color:C.cream}));observatory.group.add(finalRig);finalRig.frustumCulled=false;rod(observatory.fixed,.10,.10,-.48,.10,3.88,-.48,.065,paint(C.copper));rod(observatory.fixed,.10,3.88,-.48,1.05,3.88,-.48,.055,paint(C.gold));for(const x of [.38,.82])mesh(observatory.fixed,G.rod,paint(C.blue),x,3.84,.54,.12,.09,.12).rotation.x=Math.PI*.5;const paw=mesh(observatory.fixed,G.pearl,paint(C.copper,true),-1.90,.08,.61,.74,.08,.53);mesh(observatory.fixed,G.pearl,paint(C.cream),-1.90,.17,.63,.23,.012,.19);for(let i=0;i<4;i++)mesh(observatory.fixed,G.pearl,paint(C.cream),-2.2+i*.2,.17,.41,.08,.011,.07);
    // Telescope, bolted feet and a picture rail turn the finale into a cloud museum.
    const telescope=new T.Group();telescope.position.set(1.65,1.18,-3.4);observatory.fixed.add(telescope);for(const side of [-1,1]){rod(telescope,0,.93,0,side*.90,-.25,.58,.065,paint(C.copper));}rod(telescope,0,.93,0,0,-.25,-.78,.065,paint(C.copper));const tube=new T.Group();tube.position.set(0,1.15,0);tube.rotation.z=-.44;telescope.add(tube);const barrel=mesh(tube,G.rod,paint(C.cream),0,0,0,.34,1.95,.34);barrel.rotation.z=Math.PI*.5;for(const x of [-.83,.83]){const band=mesh(tube,G.rod,paint(C.copper),x,0,0,.37,.16,.37);band.rotation.z=Math.PI*.5;}mesh(tube,G.rod,paint(C.blue),1.0,0,0,.28,.035,.28).rotation.z=Math.PI*.5;rod(telescope,-.33,.86,.36,.32,.86,.36,.045,paint(C.teal));weld(tube);weld(telescope);
    for(let i=0;i<3;i++){const x=-2.48+i*2.48;mesh(observatory.fixed,G.roundBox,paint(C.copper),x,.26,.66,.73,.10,.52);mesh(observatory.fixed,G.roundBox,paint(C.navy),x,.32,.66,.58,.02,.40);mesh(observatory.fixed,G.box,paint(C.blue),x,.64,.13,.88,1.14,.66);mesh(observatory.fixed,G.box,paint(C.cream),x,1.23,.13,1.05,.10,.79);mesh(observatory.fixed,G.box,glass,x,1.62,.02,.94,.73,.66);mesh(observatory.fixed,G.box,paint(C.gold),x,2.95,.43,1.15,.83,.11);mesh(observatory.fixed,G.box,paint(C.navy),x,2.95,.51,1.02,.68,.06);for(const side of [-1,1])bolt(observatory.fixed,x+side*.46,2.60,.57);}
    const callBell=new T.Group();observatory.group.add(callBell);callBell.position.set(-4.35,1.35,.77);const bellShape=new T.LatheGeometry([[.02,.40],[.16,.36],[.20,.12],[.31,-.15],[.35,-.19],[.31,-.25],[.24,-.18],[.13,.16],[.02,.24]].map(([r,y])=>new T.Vector2(r,y)),24);mesh(callBell,bellShape,paint(C.gold));rod(callBell,0,-.05,0,0,-.38,.02,.027,paint(C.copper));const callHandle=grip(callBell,C.teal);callHandle.position.set(0,-.42,.06);callHandle.name='Venus crawler call bell handle';rod(observatory.fixed,-4.35,.12,.45,-4.35,2.04,.45,.065,paint(C.copper));rod(observatory.fixed,-4.35,2.04,.45,-4.35,1.75,.77,.033,paint(C.cream));mesh(observatory.fixed,G.roundBox,paint(C.blue),-4.35,.14,.45,.75,.24,.62);
    for(const s of workshops)weld(s.fixed);

    return makeController();
    function makeController(){
      const work=workshops.map(s=>({id:s.id,x:s.x,y:s.y,done:false,count:0,total:s.jobs.length,jobs:s.jobs.map(j=>({id:j.id,kind:j.mode,done:false,eligible:false,x:0,y:0,toX:0,toY:0,progress:0}))}));
      const tasks=[false,false,false],status={tasks,active:null,finished:false,cue:'',ride:'ready',crawlerX:72,crawlComplete:false,stops:[false,false,false,false],work,actions:0,totalActions:allJobs.length,finalePhase:'idle',finaleComplete:false,endingDelay:5.6,endingPhotoDelay:1.65};
      const vehicle={phase:'ready',x:72,from:72,to:316,u:0,clock:0,stop:-1,duration:0,origins:[],speed:4.6,sway:0,steer:0,bounce:0,parkZ:-1.6,parkFrom:-1.6,recallFrom:0,late:false,boarded:false,called:false};
      const stopStations=[vents,bridge,quarry,pressure],normalStops=stopStations.map(s=>(s.home-6-72)/(316-72));
      const ending={phase:'idle',clock:0,open:0,pull:0,origins:[]};
      const lessonPoint=new T.Vector3(),lessonGoal={coolant:'flowers',canopy:'flowers',vents:'wind',bridge:'bridge',quarry:'samples',pressure:'samples',balloon:'balloon',observatory:'museum'};
      function anchor(object,out,x=0,y=0,z=0){object.updateWorldMatrix(true,false);return out.set(x,y,z).applyMatrix4(object.matrixWorld);}
      function stationUsable(s){if(finished(s))return true;if(ending.phase!=='idle')return false;if(vehicle.phase==='stop')return stopStations[vehicle.stop]===s;return !player.locked&&!!firstJob(s);}
      function describeJob(s,step){
        const j=drag?.job?.station===s?drag.job:firstJob(s)||s.jobs[s.jobs.length-1];if(!j)return false;
        step.action=j.mode==='turn'?'turn':j.mode==='press'?'press':'drag';step.demoObject=step.action==='drag'?j.mesh:null;
        anchor(j.mesh,step.from,j.hitOffset[0],j.hitOffset[1],j.mode==='slide'&&s===canopy?.10:j.id==='cabinetDoor'?.11:0);
        step.to.set(j.to[0]+j.hitOffset[0],j.to[1]+j.hitOffset[1],s===bridge?-1.10:j.depth);s.group.updateWorldMatrix(true,false);step.to.applyMatrix4(s.group.matrixWorld);
        step.progress=0;for(const q of s.jobs)if(q.done)step.progress++;step.total=s.jobs.length;
        let sourceIcon='handle';
        if(s===coolant)sourceIcon='water';
        else if(s===bridge)sourceIcon='panel';
        else if(s===vents)sourceIcon='valve';
        else if(s===quarry)sourceIcon=j.id==='crystal'||j.id==='core'||j.id==='pebble'?'rock':'robot';
        else if(s===pressure)sourceIcon=j.id.startsWith('cabinetLoad')?'rock':j.mode==='turn'?'valve':'handle';
        else if(s.kind==='balloon')sourceIcon=j.id.endsWith('Basket')?'basket':j.id.endsWith('Canopy')?'cloth':j.id.endsWith('Gas')?'valve':'handle';
        else if(s===observatory)sourceIcon=j.id.startsWith('photo')?'camera':'rock';
        else if(j.mode==='turn')sourceIcon='valve';
        step.sourceIcon=sourceIcon;step.goalIcon=lessonGoal[s.kind];step.radius=j.mode==='turn'?j.radius:.55;
        if(step.pivot?.isVector3&&j.mode==='turn')anchor(s.group,step.pivot,j.center[0],j.center[1],j.depth);
        return true;
      }
      const lessons=workshops.map(s=>({id:'venus-'+s.id,demoSources:s.jobs.filter(j=>j.mode==='carry'||j.mode==='slide').map(j=>j.mesh),x:()=>s.group.position.x,y:()=>s.group.position.y,goal:lessonGoal[s.kind],enabled:()=>stationUsable(s),completed:()=>finished(s),describe:step=>describeJob(s,step)}));
      lessons.splice(2,0,{id:'venus-crawler-board',x:()=>vehicle.x+.24,y:()=>ground(vehicle.x),goal:'rover',enabled:()=>vehicle.boarded||ending.phase==='idle'&&vehicle.phase==='ready'&&!status.crawlComplete,completed:()=>vehicle.boarded,describe:step=>{anchor(boardingHandle,step.from);step.to.copy(step.from);step.action='tap';step.progress=vehicle.boarded?1:0;step.total=1;step.sourceIcon='handle';step.goalIcon='rover';return true;}});
      lessons.push({id:'venus-crawler-call',x:()=>observatory.x-4.35,y:()=>observatory.y,flagOffsetX:0,goal:'rover',enabled:()=>vehicle.called||status.crawlComplete||ending.phase==='idle'&&!player.locked&&vehicle.phase==='ready'&&!status.crawlComplete&&Math.abs(vehicle.x-(observatory.x-4.35))>8,completed:()=>vehicle.called||status.crawlComplete,describe:step=>{anchor(callHandle,step.from);step.to.copy(step.from);step.action='tap';step.progress=vehicle.called||status.crawlComplete?1:0;step.total=1;step.sourceIcon='bell';step.goalIcon='rover';return true;}});
      lessons.push({id:'venus-observatory-open',x:()=>observatory.x+.60,y:()=>observatory.y,flagOffsetX:.8,goal:'camera',enabled:()=>status.finished||ending.phase==='pull'||ending.phase==='idle'&&status.crawlComplete&&workshops.every(finished),completed:()=>status.finished,describe:step=>{anchor(finalHandle,step.from);step.to.copy(step.from);if(ending.phase==='pull'){step.action='press';anchor(observatory.group,step.to,.60,.96,.65);}else step.action='tap';step.progress=status.finished?2:ending.phase==='idle'?0:1;step.total=2;step.sourceIcon='handle';step.goalIcon='camera';return true;}});

      const hint={visible:false,x:0,y:0,toX:0,toY:0,swipe:false},meshJobs=new Map();
      let pathJob=null;
      for(const j of allJobs){if(!meshJobs.has(j.mesh))meshJobs.set(j.mesh,[]);meshJobs.get(j.mesh).push(j);}
      const handCanvas=document.createElement('canvas');handCanvas.width=handCanvas.height=128;const hi=handCanvas.getContext('2d');hi.lineJoin=hi.lineCap='round';hi.fillStyle='#ffe6a4';hi.strokeStyle='#34314f';hi.lineWidth=7;hi.beginPath();hi.moveTo(40,101);hi.lineTo(23,73);hi.quadraticCurveTo(18,58,31,62);hi.lineTo(46,75);hi.lineTo(46,29);hi.bezierCurveTo(46,13,65,13,65,30);hi.lineTo(65,56);hi.quadraticCurveTo(74,48,82,59);hi.quadraticCurveTo(94,53,100,66);hi.quadraticCurveTo(113,63,111,79);hi.lineTo(106,103);hi.lineTo(93,116);hi.lineTo(56,116);hi.closePath();hi.stroke();hi.fill();
      const handTex=new T.CanvasTexture(handCanvas);handTex.colorSpace=T.SRGBColorSpace;const hand=new T.Sprite(new T.SpriteMaterial({map:handTex,transparent:true,depthTest:false,depthWrite:false,fog:false}));hand.renderOrder=5;hand.name='Venus local hand fallback';root.add(hand);
      const finalCordPos=new Float32Array(12),finalCordG=new T.BufferGeometry();finalCordG.setAttribute('position',new T.BufferAttribute(finalCordPos,3));const finalCords=new T.LineSegments(finalCordG,new T.LineBasicMaterial({color:C.cream}));finalCords.frustumCulled=false;finalCords.visible=false;root.add(finalCords);
      const seatP=new T.Vector3(),seatD=new T.Vector3(),craneTip=new T.Vector3();let autoT=0;const autoIds=new Set(['cabinetPump','cabinetAir','cabinetStore','coreDrill','core']);function autoJob(j){return autoIds.has(j.id)||/(Gas|Launch)$/.test(j.id)||j.id==='balloon1Canopy'||j.id==='balloon2Canopy';}
      let owner=null,drag=null,help=0,lastT=0,lastCrawlerX=72,dogCue=0;
      function near(x,d=10){return Math.abs(player.x-x)<d;}
      function showHint(x,y,toX=x,toY=y){Object.assign(hint,{visible:true,x,y,toX,toY,swipe:Math.abs(toX-x)+Math.abs(toY-y)>.05});}
      function source(j){return {x:j.station.x+j.x,y:j.station.y+j.y};}
      function markActors(storage){storage.length=0;for(const a of [player,dog]){storage.push({x:a.x,y:a.y,z:a.z||0});a.locked=true;a.vx=a.vy=0;}dog.activityTargetX=dog.activityMode=dog.lookWorldX=dog.lookWorldY=undefined;dogCue=0;}
      function releaseActors(){for(const a of [player,dog]){a.locked=false;a.vx=a.vy=0;a.y=ground(a.x);a.grounded=true;a.mode='idle';a.sailing=false;a.emote='';}player.z=.95;dog.z=1.05;dog.activityTargetX=dog.activityMode=dog.lookWorldX=dog.lookWorldY=undefined;dogCue=0;M.setCameraTarget(null);}
      function roadY(x,zz){const g=terrainSurfaceY(x,zz);if(!finished(bridge)||Math.abs(zz+1.65)>1.60)return g;const u=smooth(bridge.x-3.5,bridge.x-.57,x)*(1-smooth(bridge.x+3.24,bridge.x+6,x));return mix(g,bridge.y+.76,u);}
      function placeCrawler(dt,t){
        vehicle.sway=M.damp(vehicle.sway,vehicle.steer,3.2,dt);vehicle.bounce=M.damp(vehicle.bounce,0,5.0,dt);
        // Empty/parked hull stays behind the shared front footpath. Travel first
        // leaves that bay, then returns during the last eight forward units.
        if(vehicle.phase==='board'||vehicle.phase==='cruise'||vehicle.phase==='stop'||vehicle.phase==='exit'){
          const distance=Math.max(.1,vehicle.to-vehicle.from),span=Math.min(8,distance*.5),travel=clamp(vehicle.x-vehicle.from,0,distance);
          const routePark=vehicle.parkFrom*(1-smooth(0,span,travel))-1.6*smooth(distance-span,distance,travel);
          // The first bridge beam has its own shallow work bay beside the seated family.
          const bridgePass=finished(bridge)?smooth(bridge.x-7,bridge.x-4,vehicle.x)*(1-smooth(bridge.x+5,bridge.x+9,vehicle.x)):0;const wantedPark=mix(vehicle.phase==='stop'?Math.min(routePark,-2.05):routePark,-1.65,bridgePass);
          vehicle.parkZ+=clamp(wantedPark-vehicle.parkZ,-2*dt,2*dt);
        }
        const parkWeight=Math.min(1,Math.abs(vehicle.parkZ)/1.6);
        const z=vehicle.parkZ+vehicle.sway*(1-parkWeight);const floor=(roadY(vehicle.x-2.1,z-1.27)+roadY(vehicle.x+2.1,z-1.27)+roadY(vehicle.x-2.1,z+1.27)+roadY(vehicle.x+2.1,z+1.27))*.25;crawler.position.set(vehicle.x,floor,z);
        body.position.y=vehicle.bounce*.08;body.rotation.z=Math.atan2(ground(vehicle.x+2)-ground(vehicle.x-2),4)*.64;
        const delta=vehicle.x-lastCrawlerX;lastCrawlerX=vehicle.x;
        for(const w of wheels){w.group.position.y=roadY(vehicle.x+w.x,crawler.position.z+w.z)-floor+.62;w.angle-=delta/.64;w.group.rotation.z=w.angle;}
        steering.rotation.z=vehicle.sway*2.4;body.updateWorldMatrix(true,false);
      }
      function seatActors(){
        seatP.set(.85,.815,0).applyMatrix4(body.matrixWorld);seatD.set(-.94,1.195,.11).applyMatrix4(body.matrixWorld);
        [player,dog].forEach((a,i)=>{const v=i?seatD:seatP;a.x=v.x;a.y=v.y;a.z=v.z;a.mode='ride';a.facing=1;a.vx=vehicle.phase==='cruise'?vehicle.speed:0;a.vy=0;a.grounded=true;a.locked=true;a.emote='happy';});
      }
      function startRide(late=false){
        if(status.crawlComplete||vehicle.phase!=='ready'||ending.phase!=='idle')return false;
        vehicle.late=late;vehicle.from=vehicle.x;vehicle.to=late?Math.min(length-3,vehicle.from+11):316;
        if(vehicle.to<=vehicle.from+.01)return false;vehicle.boarded=true;
        vehicle.parkFrom=vehicle.parkZ;vehicle.u=0;vehicle.stop=-1;vehicle.phase='board';vehicle.clock=0;vehicle.duration=clamp(Math.max(Math.abs(player.x-vehicle.x),Math.abs(dog.x-vehicle.x))*.15,.85,2.2);markActors(vehicle.origins);help=0;M.sfx('robot');return true;
      }
      function summonForward(){
        if(vehicle.phase!=='ready'||vehicle.called||status.crawlComplete)return false;
        vehicle.called=true;vehicle.phase='recall';vehicle.clock=0;vehicle.recallFrom=vehicle.x;vehicle.from=clamp(player.x-.65,398,length-3.1);vehicle.late=true;help=0;M.sfx('ring');return true;
      }
      function updateVehicle(dt,t){
        vehicle.clock+=dt;
        if(vehicle.phase==='recall'){
          const u=clamp(vehicle.clock/3.1,0,1);vehicle.x=mix(vehicle.recallFrom,vehicle.from,ease(u));placeCrawler(dt,t);if(u===1){vehicle.phase='ready';help=0;}return;
        }
        if(vehicle.phase==='board'){
          placeCrawler(dt,t);seatActors();const u=clamp(vehicle.clock/vehicle.duration,0,1),v=ease(u);
          [player,dog].forEach((a,i)=>{const from=vehicle.origins[i],target=i?seatD:seatP;a.x=mix(from.x,target.x,v);a.y=mix(from.y,target.y,v)+Math.sin(u*Math.PI)*.50;a.z=mix(from.z,target.z,v);a.mode=u>.94?'ride':'jump';a.grounded=u===1;a.vy=Math.cos(u*Math.PI)*1.6;});
          if(u===1){vehicle.phase='cruise';vehicle.clock=0;}return;
        }
        if(vehicle.phase==='cruise'){
          vehicle.u=Math.min(1,vehicle.u+dt*vehicle.speed/Math.max(1,vehicle.to-vehicle.from));
          const next=status.stops.findIndex(v=>!v),at=vehicle.late?[.15,.39,.64,.88]:normalStops;
          if(next>=0&&vehicle.u>=at[next]){vehicle.u=at[next];vehicle.stop=next;vehicle.phase='stop';vehicle.clock=0;vehicle.stopLanding=null;const s=stopStations[next];if(vehicle.late){s.x=Math.min(length-4.2,mix(vehicle.from,vehicle.to,vehicle.u)+6);s.y=ground(s.x);s.group.position.set(s.x,s.y,-.55);s.recovered=true;}help=0;M.sfx('ring');}
          vehicle.x=mix(vehicle.from,vehicle.to,vehicle.u);placeCrawler(dt,t);seatActors();
          if(vehicle.u>=1){vehicle.phase='exit';vehicle.clock=0;vehicle.duration=1.05;markActors(vehicle.origins);}
        }else if(vehicle.phase==='stop'){
          placeCrawler(dt,t);const s=stopStations[vehicle.stop];if(!vehicle.stopLanding){seatActors();vehicle.stopLanding=[player,dog].map(a=>({x:a.x,y:a.y,z:a.z||0}));}
          const u=clamp(vehicle.clock/1.12,0,1),v=ease(u);[player,dog].forEach((a,i)=>{const from=vehicle.stopLanding[i],x=s.x-(i?4.95:3.65);a.x=mix(from.x,x,v);a.y=mix(from.y,ground(x),v)+Math.sin(u*Math.PI)*.50;a.z=mix(from.z,i?1.05:.95,v);a.mode=u===1?'idle':'jump';a.facing=1;a.vx=a.vy=0;a.grounded=u===1;a.locked=true;a.emote=u===1?'curious':'happy';});
          if(finished(s)){status.stops[vehicle.stop]=true;vehicle.phase='return';vehicle.clock=0;vehicle.origins=[player,dog].map(a=>({x:a.x,y:a.y,z:a.z||0}));M.sfx('complete');}
        }else if(vehicle.phase==='return'){
          placeCrawler(dt,t);seatActors();const u=clamp(vehicle.clock/1.05,0,1),v=ease(u);[player,dog].forEach((a,i)=>{const from=vehicle.origins[i],to=i?seatD:seatP;a.x=mix(from.x,to.x,v);a.y=mix(from.y,to.y,v)+Math.sin(u*Math.PI)*.45;a.z=mix(from.z,to.z,v);a.mode=u===1?'ride':'jump';a.vx=a.vy=0;a.grounded=u===1;a.locked=true;});if(u===1){vehicle.phase='cruise';vehicle.clock=0;}
        }else if(vehicle.phase==='exit'){
          placeCrawler(dt,t);const u=clamp(vehicle.clock/vehicle.duration,0,1),v=ease(u),exitX=clamp(vehicle.x+3.05,2,length-3);
          [player,dog].forEach((a,i)=>{const from=vehicle.origins[i],to=i?Math.max(1,exitX-2):exitX;a.x=mix(from.x,to,v);a.y=mix(from.y,ground(to),v)+Math.sin(u*Math.PI)*.55;a.z=mix(from.z,i?1.05:.95,v);a.mode=u===1?'idle':'jump';a.vx=0;a.vy=Math.cos(u*Math.PI)*1.6;a.grounded=u===1;});
          if(u===1){vehicle.phase='ready';status.crawlComplete=true;releaseActors();if(vehicle.late){finaleX=Math.min(422,Math.max(finaleX,vehicle.x+2));observatory.x=finaleX;observatory.y=ground(finaleX);observatory.group.position.set(finaleX,observatory.y,-.55);}M.sfx('land');}
        }else placeCrawler(dt,t);
        if(vehicle.phase==='stop'){
          const s=stopStations[vehicle.stop];if(M.frameActivity)M.frameActivity(s.x-5.8,s.x+3.6,s.y+2.05,1.10);else M.setCameraTarget(vehicle.x+3,ground(vehicle.x)+2.3,.84,1);
        }else if(player.locked&&ending.phase==='idle')M.setCameraTarget(vehicle.x+1.45,ground(vehicle.x)+2.28,.94,1);
      }
      function finishJob(j){
        if(j.done)return;j.done=true;j.progress=1;j.x=j.to[0];j.y=j.to[1];status.actions++;j.station.done=finished(j.station);j.station.anim=1;M.sfx(j.station.done?'complete':'ring');M.celebrate(j.station.x+j.x,j.station.y+j.y);if(j.onDone)j.onDone();
        if(j.id==='sniff'){dogCue=1.8;dog.lookWorldX=quarry.x-.96;dog.lookWorldY=quarry.y+1.48;dog.emote='curious';}
      }
      function moveJob(j,p){
        if(j.done||!requiresDone(j))return false;const x=p.x-j.station.x-j.hitOffset[0],y=p.y-j.station.y-j.hitOffset[1];
        if(j.mode==='turn'){
          const a=clamp(Math.atan2(y-j.center[1],x-j.center[0]),-1.5,1.5);j.progress=clamp((a+.9)/1.62,0,1);j.angle=-.9+j.progress*1.62;j.x=j.center[0]+Math.cos(j.angle)*j.radius;j.y=j.center[1]+Math.sin(j.angle)*j.radius;
        }else if(j.mode==='press'){
          const v=clamp((y-j.from[1])/(j.to[1]-j.from[1]),0,1);j.progress=v;j.x=mix(j.from[0],j.to[0],j.progress);j.y=mix(j.from[1],j.to[1],j.progress);
        }else{
          j.x=clamp(x,-3.55,3.55);j.y=clamp(y,.18,3.75);j.progress=Math.hypot(j.x-j.to[0],j.y-j.to[1])<1.05?1:0;if(j.progress===1){finishJob(j);return true;}
        }
        help=0;return true;
      }
      function recoverForward(dt){
        if(player.x<394||player.locked||ending.phase!=='idle')return;
        if(player.x>finaleX+7){finaleX=Math.min(422,player.x-3);observatory.x=finaleX;observatory.y=ground(finaleX);observatory.group.position.set(finaleX,observatory.y,-.55);}
        const missing=workshops.find(s=>s!==observatory&&!finished(s));
        if(missing&&(!missing.recovered||Math.abs(missing.x-Math.min(426,finaleX+6))>.1)){missing.recovered=true;missing.x=Math.min(426,finaleX+6);missing.y=ground(missing.x);missing.group.position.set(missing.x,missing.y,-.55);}
        for(const s of workshops)if(s.recovered&&s.done&&s!==observatory){s.group.position.x=M.damp(s.group.position.x,finaleX-12+(s.kind==='balloon'?s.balloonIndex*3:0),2,dt);s.group.position.z=M.damp(s.group.position.z,-8,2,dt);}
      }
      function startEnding(){
        if(ending.phase!=='idle')return false;
        const pending=workshops.find(s=>!finished(s));
        if(pending){const j=firstJob(pending);if(j)showHint(pending.x+j.x,pending.y+j.y,pending.x+j.to[0],pending.y+j.to[1]);help=1.3;return true;}
        if(!status.crawlComplete)return false;
        ending.phase='gather';ending.clock=0;markActors(ending.origins);owner=drag=null;M.sfx('beacon');return true;
      }
      function moveEnding(p){if(ending.phase!=='pull')return;ending.pull=clamp((observatory.y+2.09-p.y)/1.13,0,1);help=0;}
      function updateEnding(dt,t){
        if(ending.phase==='idle')return;ending.clock+=dt;
        if(ending.phase==='gather'){
          const u=clamp(ending.clock/1.35,0,1),v=ease(u);[player,dog].forEach((a,i)=>{const from=ending.origins[i],to=finaleX+(i?-1.90:.95);a.x=mix(from.x,to,v);a.y=mix(from.y,ground(to)+(i?.16:0),v)+Math.sin(u*Math.PI)*.28;a.z=mix(from.z,i?.08:0,v);a.mode=u===1?'dig':'walk';a.facing=i?1:-1;a.grounded=u===1;a.vx=a.vy=0;});if(u===1){ending.phase='pull';ending.clock=0;help=0;}
        }else if(ending.phase==='pull'){
          player.mode=dog.mode='dig';player.emote=dog.emote='happy';showHint(finaleX+.60,observatory.y+2.09-ending.pull*1.13,finaleX+.60,observatory.y+.96);
        }else{
          ending.open=Math.min(1,ending.clock/4.25);player.mode=dog.mode='wave';player.emote=dog.emote='happy';
          if(ending.open===1&&!status.finished){ending.phase='panorama';status.finished=status.finaleComplete=true;tasks[2]=true;status.actions=allJobs.length;M.sfx('complete');M.celebrate(finaleX,observatory.y+3);M.notify('Venüs’ün bulutlarını birlikte araladınız!');}
        }
        if(M.frameActivity)M.frameActivity(finaleX-5.7,finaleX+5.7,observatory.y+2.65+ending.open*.60,.88);else M.setCameraTarget(finaleX,observatory.y+2.9,.84,1);
      }
      function refreshState(){
        tasks[0]=finished(coolant)&&finished(canopy);tasks[1]=status.crawlComplete&&stopStations.every(finished);status.ride=vehicle.phase;status.crawlerX=vehicle.x;status.finalePhase=ending.phase;status.active=ending.phase!=='idle'?'venusObservatory':player.locked?'venusCrawler':drag?'venusInstrument':null;
        for(let i=0;i<workshops.length;i++){const s=workshops[i],r=work[i];r.x=s.x;r.y=s.y;r.done=finished(s);r.count=0;for(let k=0;k<s.jobs.length;k++){const j=s.jobs[k],q=r.jobs[k];q.done=j.done;q.eligible=!j.done&&requiresDone(j);q.x=s.x+j.x+j.hitOffset[0];q.y=s.y+j.y+j.hitOffset[1];q.toX=s.x+j.to[0]+j.hitOffset[0];q.toY=s.y+j.to[1]+j.hitOffset[1];q.progress=j.progress;if(j.done)r.count++;}}
      }
      function update(dt,t){
        dt=clamp(Number.isFinite(dt)?dt:0,0,.1);lastT=t;help+=dt;if(Math.abs(player.vx||0)>.20||Math.abs(player.vy||0)>.20||player.mode==='jump')help=0;hint.visible=false;pathJob=null;recoverForward(dt);updateVehicle(dt,t);updateEnding(dt,t);
        if(dogCue>0){dogCue=Math.max(0,dogCue-dt);if(dogCue>0){dog.lookWorldX=quarry.x-.96;dog.lookWorldY=quarry.y+1.48;dog.emote='curious';}else{dog.lookWorldX=dog.lookWorldY=undefined;dog.emote='';}}
        if(ending.phase==='idle'){
          let s=drag?.job?.station||(vehicle.phase==='stop'?stopStations[vehicle.stop]:null);
          if(!s&&!player.locked)s=workshops.find(w=>!finished(w)&&near(w.x,7.7));
          const j=drag?.job||s&&firstJob(s);pathJob=j||null;if(j&&!j.done){showHint(j.station.x+j.x+j.hitOffset[0],j.station.y+j.y+j.hitOffset[1],j.station.x+j.to[0]+j.hitOffset[0],j.station.y+j.to[1]+j.hitOffset[1]);}
          if(!player.locked&&s&&j){if(!drag&&M.parkForActivity){const side=player.x>s.x?1:-1;M.parkForActivity(s.x+side*3.65,s.x+side*5.0,-side);}const a=Math.min(player.x-1.1,s.x-3.5),b=Math.max(player.x+1.1,s.x+3.5);if(M.frameActivity)M.frameActivity(a,b,s.y+2.0,1.08);else M.setCameraTarget((a+b)*.5,s.y+2.0,.93,1);}
          else if(!player.locked&&near(vehicle.x,7)&&!status.crawlComplete){anchor(boardingHandle,lessonPoint);showHint(lessonPoint.x,lessonPoint.y);if(!drag&&help>20&&vehicle.phase==='ready'){help=0;startRide(vehicle.late);}if(!drag&&M.parkForActivity)M.parkForActivity(vehicle.x-3.85,vehicle.x-5.1,1);}
          else if(!player.locked&&near(finaleX,10)){if(!status.crawlComplete){anchor(callHandle,lessonPoint);showHint(lessonPoint.x,lessonPoint.y);}else if(workshops.every(finished)){showHint(finaleX+.6,observatory.y+2.09);if(M.frameActivity)M.frameActivity(finaleX-5.7,finaleX+5.7,observatory.y+2.6,.94);}}
        }
        if(drag?.job){const j=drag.job;showHint(j.station.x+j.to[0],j.station.y+j.to[1]);}
        // Soyut makine adımları (pompa, hava, kilit, matkap, balon gazı, kalkış) Feza'nın önceki hamlesinden sonra kendiliğinden çalışır.
        if(!drag&&pathJob&&!pathJob.done&&requiresDone(pathJob)&&(vehicle.phase==='stop'||!player.locked)&&autoJob(pathJob)){autoT+=dt;if(autoT>.85){autoT=0;finishJob(pathJob);help=0;}}else autoT=0;
        // Takılınca yardım: 20 sn hiç ilerleme yoksa sıradaki parça kendiliğinden yerine oturur.
        if(!drag&&help>15){if(pathJob&&!pathJob.done&&requiresDone(pathJob)&&(vehicle.phase==='stop'||!player.locked)){finishJob(pathJob);help=0;}else if(ending.phase==='pull'){ending.pull=1;ending.phase='open';ending.clock=0;M.sfx('robot');help=0;}}
        hand.visible=!M.playGuideActive&&hint.visible&&!drag&&help>3&&((help-3)%6.4)<2.6;
        if(hand.visible){const u=hint.swipe?ease(clamp(((help-3)%6.4-.40)/1.6,0,1)):0;let hx=mix(hint.x,hint.toX,u),hy=mix(hint.y,hint.toY,u);if(pathJob?.mode==='turn'){const j=pathJob,a=-.9+1.62*u;hx=j.station.x+j.center[0]+Math.cos(a)*j.radius;hy=j.station.y+j.center[1]+Math.sin(a)*j.radius;}hand.position.set(hx+.18,hy-.27,2.05);hand.scale.setScalar(.82);}
        refreshState();
      }
      function pointHit(p,x,y,rx,ry=rx){return Math.abs(p.x-x)<=rx&&Math.abs(p.y-y)<=ry;}
      function pointer(type,p,e){
        const id=e?.pointerId??'primary';
        if(type==='cancel'){if(!e||owner===id){owner=null;drag=null;}return false;}
        if(!p)return false;
        if(type==='move'||type==='up'){
          if(owner===null||owner!==id||!drag)return false;
          if(Math.hypot(p.x-drag.startX,p.y-drag.startY)>.10)drag.moved=true;
          if(drag.moved){if(drag.type==='job')moveJob(drag.job,p);else if(drag.type==='ending')moveEnding(p);}
          if(type==='up'){
            if(drag.moved&&drag.type==='job'&&drag.job.progress>.70)finishJob(drag.job);
            if(drag.moved&&drag.type==='ending'&&ending.pull>.70){ending.phase='open';ending.clock=0;M.sfx('robot');}
            owner=null;drag=null;
          }
          refreshState();return true;
        }
        if(type!=='down')return false;
        if(owner!==null)return owner===id;
        if(ending.phase==='pull'){
          if(pointHit(p,finaleX+.60,observatory.y+2.09-ending.pull*1.13,1.4,1.3)){owner=id;drag={type:'ending',startX:p.x,startY:p.y,moved:false};help=0;return true;}return false;
        }
        if(ending.phase!=='idle')return false;
        if(vehicle.phase==='board'||vehicle.phase==='return'||vehicle.phase==='exit'||vehicle.phase==='recall')return false;
        const available=vehicle.phase==='stop'?[stopStations[vehicle.stop]]:player.locked?[]:workshops;
        let selected=null,score=Infinity;
        for(const s of available){if(!near(s.x,12)||!s.group.visible)continue;for(const j of s.jobs){if(j.done||!requiresDone(j))continue;const dx=(p.x-s.x-j.x-j.hitOffset[0])/Math.max(.66,j.size*1.55),dy=(p.y-s.y-j.y-j.hitOffset[1])/Math.max(.61,j.size*1.38),d=dx*dx+dy*dy;if(d<=1&&d<score){score=d;selected=j;}}}
        if(selected){owner=id;drag={type:'job',job:selected,startX:p.x,startY:p.y,moved:false};help=0;return true;}
        if(player.locked)return false;
        anchor(callHandle,lessonPoint);if(!vehicle.called&&!status.crawlComplete&&vehicle.phase==='ready'&&near(lessonPoint.x,10)&&pointHit(p,lessonPoint.x,lessonPoint.y,1.25,1.15))return summonForward();
        if(near(finaleX,14)&&status.crawlComplete&&workshops.every(finished)&&pointHit(p,finaleX+.60,observatory.y+2.09,1.35,1.25))return startEnding();
        anchor(boardingHandle,lessonPoint);if(vehicle.phase==='ready'&&!status.crawlComplete&&near(vehicle.x,10)&&(pointHit(p,lessonPoint.x,lessonPoint.y,1.2,1.1)||pointHit(p,vehicle.x+.24,ground(vehicle.x)+1.3,2.9,1.5)))return startRide(vehicle.late);
        return false;
      }
      function interact(){if(player.locked)return true;if(near(finaleX,10)&&status.crawlComplete&&workshops.every(finished))return startEnding();if(vehicle.phase==='ready'&&!status.crawlComplete&&near(vehicle.x,7))return startRide(vehicle.late);return false;}
      function jump(){if(player.locked&&vehicle.phase==='cruise')vehicle.bounce=1;return !!player.locked;}
      function artUpdate(dt,t,px){
        boardingHandle.rotation.z=vehicle.phase==='board'?-.28*Math.sin(Math.min(1,vehicle.clock/.42)*Math.PI):0;callBell.rotation.z=vehicle.phase==='recall'?.21*Math.cos(vehicle.clock*12)*(1-Math.min(1,vehicle.clock/3.1)):0;
        const nearFinal=px>394,lateWork=vehicle.late&&['board','cruise','stop','return','exit'].includes(vehicle.phase);
        if(dt>0)updateEmbers(t);for(const s of workshops){rebasePlantedBase(s);s.anim=Math.max(0,s.anim-dt*.50);s.group.visible=Math.abs(px-s.x)<34&&(!nearFinal||s===observatory||!s.recovered||!s.done)&&(!lateWork||vehicle.phase==='stop'&&s===stopStations[vehicle.stop]);}
        for(const [object,list]of meshJobs){let j=drag?.job?.mesh===object?drag.job:list.find(v=>!v.done&&requiresDone(v))||list.findLast(v=>v.done)||list[0];object.visible=!(j.done&&j.hideDone)&&(!j.reveal||requiresDone(j)||j.done);object.position.set(j.x,j.y,j.depth);if(j.wheel)j.wheel.rotation.z=j.progress*1.62;}
        for(const j of allJobs){j.target.visible=false;j.target.rotation.z=.06*Math.sin(t*1.1+j.from[0]);j.target.scale.x=j.target.scale.y=j.size*1.35*(1+.035*Math.sin(t*2));}
        for(let i=0;i<3;i++){const placed=jobMap.get('bridge'+i+'Place').done;if(placed)bridge.beams[i].position.z=-1.10;bridge.lights[i].material=paint(placed?C.teal:C.navy);}
        for(let i=0;i<3;i++){coolant.pipes[i].scale.setScalar(jobMap.get('coolant'+i).done?.20:.11);const fill=jobMap.get('coolant'+i).done?1:0;coolant.tanks[i].scale.y=M.damp(coolant.tanks[i].scale.y,.05+fill*.77,3,dt);coolant.tanks[i].position.y=.54+coolant.tanks[i].scale.y*.5;const flower=coolant.flowers[i],growth=.14+Math.min(1,(coolant.tanks[i].scale.y-.05)/.77)*.57;flower.scale.setScalar(growth);flower.rotation.z=.035*Math.sin(t*1.3+i)*fill;const closed=jobMap.get('vent'+i).progress,plume=vents.plumes[i];plume.rotation.z=-closed*.30;plume.scale.setScalar(1-closed);vents.fans[i].rotation.z+=dt*closed*(2.8+i*.3);vents.lamps[i].material=paint(closed>.94?C.teal:C.navy);for(let k=0;k<3;k++){const q=plume.children[k];q.position.y=.26+((t*.46+k*.30)%1)*1.3;q.position.x=.09*Math.sin(t*1.3+k);}}
        const watered=coolant.jobs.reduce((n,j)=>n+(j.done?1:0),0)/3;canopy.shade.material.opacity=.30-.28*jobMap.get('filter').progress;for(let i=0;i<canopy.plants.length;i++){const q=canopy.plants[i],growth=.22+.10*watered+.68*jobMap.get('filter').progress;q.scale.set(growth,growth,growth);q.rotation.z=Math.sin(t*.8+i)*.035*jobMap.get('filter').progress;}
        const pressed=jobMap.get('corePress').progress,drilled=jobMap.get('coreDrill').progress,shaft=1.06-.636*pressed;quarry.drillRod.scale.y=shaft;quarry.drillRod.position.y=1.12+shaft*.5;quarry.bit.rotation.y=drilled*TAU*3;quarry.bit.position.y=1.11-.16*drilled;quarry.rock.scale.y=.76-.20*jobMap.get('sniff').progress;quarry.boom.rotation.z=-.73*jobMap.get('sniff').progress;for(let i=0;i<pressure.lamps.length;i++)pressure.lamps[i].material=paint(jobMap.get('cabinetAir').done?[C.teal,C.pale,C.coral][i]:C.navy);
        const pumped=jobMap.get('cabinetPump').progress,air=jobMap.get('cabinetAir').progress,piston=1.74-.89*pumped,level=.03+1.40*pumped*(1-.70*air);pressure.piston.scale.y=piston;pressure.piston.position.y=.40+piston*.5;pressure.level.scale.y=level;pressure.level.position.y=.42+level*.5;
        for(const s of balloons){const prefix=s.id,basketDone=jobMap.get(prefix+'Basket').done,canopyDone=jobMap.get(prefix+'Canopy').done,gas=jobMap.get(prefix+'Gas').progress;s.balloon.visible=basketDone;s.envelope.visible=canopyDone;s.envelope.scale.set(1.08*(.24+.76*gas),1.08*(.24+.76*gas),.77*(.24+.76*gas));if(s.launch>0){s.launch=Math.min(12,s.launch+dt);if(!s.aerial){root.attach(s.balloon);s.aerial=true;}}if(s.aerial){const u=smooth(2.5,12,s.launch),x=mix(s.x+1.48,finaleX+(s.balloonIndex-1)*3.8,u);s.balloon.position.set(x+Math.sin(t*.7+s.balloonIndex)*.13,mix(s.y+.55,ground(finaleX)+4.50,u)+Math.min(s.launch,2.5)*.46,-.83-u*4.8);}else s.balloon.position.set(1.48+Math.sin(t*.7+s.balloonIndex)*.05,.55,-.28);s.balloon.rotation.z=.035*Math.sin(t*.9+s.balloonIndex);s.rope.visible=s.launch===0;s.rope.scale.y=2.23*(.42+.58*gas);s.rope.position.y=.40+s.rope.scale.y*.5;}
        observatory.dome.forEach((hinge,i)=>{hinge.rotation.z=(i?1:-1)*ease(ending.open)*1.21;});finalHandle.position.y=2.09-ending.pull*1.13;for(let i=0;i<2;i++){const k=i*6,x=i?.82:.38;finalRigPositions[k]=x;finalRigPositions[k+1]=3.84;finalRigPositions[k+2]=.55;finalRigPositions[k+3]=x;finalRigPositions[k+4]=finalHandle.position.y;finalRigPositions[k+5]=.65;}finalRigG.attributes.position.needsUpdate=true;
        if(ending.open>0)for(let i=0;i<3;i++){const card=observatory.cards[i];card.position.y=2.95+.30*ease(ending.open);card.rotation.y=(i-1)*-.12*ease(ending.open);jobMap.get('photo'+i).target.position.y=card.position.y;}
        const lifted=drag?.job?.station===bridge?drag.job:firstJob(bridge);craneCable.visible=!!lifted&&Math.abs(px-bridge.x)<34;craneHook.visible=craneTrolley.visible=craneCable.visible;
        if(craneCable.visible){bridge.group.updateWorldMatrix(true,false);craneTip.set(lifted.x,3.40,-1.23).applyMatrix4(bridge.group.matrixWorld);craneTip.toArray(cableP,0);craneTrolley.position.copy(craneTip);const j=lifted;cableP[3]=bridge.x+j.x;cableP[4]=bridge.y+j.y+.27;cableP[5]=.10;craneHook.position.set(cableP[3],cableP[4]-.13,cableP[5]);cableG.attributes.position.needsUpdate=true;}
        if(paintedRidge)paintedRidge.position.x=px*.88+28;const sy=ground(px),sunX=Math.round(px*50)/50;sun.target.position.set(sunX,sy,0);sun.position.set(sunX-6,sy+16,8);
        for(const w of heatWisps){w.q.visible=Math.abs(px-w.x)<27;if(!w.q.visible)continue;for(let lane=0;lane<5;lane++)for(let i=0;i<=16;i++){const u=i/16,k=(lane*17+i)*6,x=(lane-2)*.58+.20*Math.sin(u*5.2-t*1.15+lane),y=u*3.45,half=.025*Math.sin(u*Math.PI);w.positions[k]=x-half;w.positions[k+1]=y;w.positions[k+2]=0;w.positions[k+3]=x+half;w.positions[k+4]=y;w.positions[k+5]=0;}w.g.attributes.position.needsUpdate=true;}
        if(paintedSky){const span=clamp(innerWidth/innerHeight*.60/3,.13,.58);sky.repeat.set(span,.60);sky.offset.set((1-span)*(.08+.84*clamp(px/length,0,1)),0);}else{sky.repeat.set(.90,.90);sky.offset.set(.035+.035*clamp(px/length,0,1),.03);}weather.intensity=.11+.035*Math.sin(t*.27)*Math.sin(t*.27);
      }
      function guidePointer(type,p,event){const used=pointer(type,p,event);if(used&&type==='down')help=0;return used;}
      function prepareGuide(){}
      function disposeGuide(){}
      function worldUpdate(dt,t,state){artUpdate(dt,t,state?.player?.x??player.x);}
      function afterActors(){
        if(!M.actors)return;finalCords.visible=ending.phase==='pull'||ending.phase==='open';if(!finalCords.visible)return;
        const handRig=M.actors.feza?.rig?.handR,dogRig=M.actors.bilbo?.rig?.body;if(!handRig||!dogRig)return;
        vA.set(0,-.028,.018);handRig.localToWorld(vA);vA.toArray(finalCordPos,0);finalCordPos[3]=finaleX+.60;finalCordPos[4]=observatory.y+finalHandle.position.y;finalCordPos[5]=.10;
        vA.set(0,1.13,-.26);dogRig.localToWorld(vA);vA.toArray(finalCordPos,6);finalCordPos[9]=finaleX-.62;finalCordPos[10]=observatory.y+1.10;finalCordPos[11]=-.35;finalCordG.attributes.position.needsUpdate=true;
      }
      placeCrawler(0,0);artUpdate(0,0,8);refreshState();
      return {world:{length,ground,platforms,weather,get finaleX(){return finaleX;},warmPositions:[8,25,53,72,110,177,237,294,316,334,354,374,410],isIce:()=>false,zone:x=>x<66?'Kehribar iniş vadisi':x<150?'Buhar bacaları':x<218?'Bazalt köprüleri':x<319?'Mor krater araştırması':x<393?'Bulut balonları':'Venüs bulut gözlemevi',update:worldUpdate},activities:{lessons,update,pointer:guidePointer,interact,jump,afterActors,keyDown:()=>false,state:()=>status,prepare:prepareGuide,dispose:disposeGuide}};
    }
  };
})(window.MARS);
