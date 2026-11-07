(function (M) {
  'use strict';
  // Optional encounters in the long stretches between the main Mars activities.
  // Each has a physical trigger and a visible response, without adding any HUD counters.
  M.createMarsDiscoveries = function ({scene, world, player, dog}) {
    const mission=world.marsMission||(world.marsMission={power:false,water:false,samples:false,garden:false,balloon:false,constellation:false});
    function plugShape(){const s=new T.Shape();s.moveTo(-.33,.34);s.lineTo(.33,.34);s.quadraticCurveTo(.47,.34,.45,.18);s.lineTo(.32,-.27);s.quadraticCurveTo(.29,-.39,.15,-.40);s.lineTo(-.15,-.40);s.quadraticCurveTo(-.29,-.39,-.32,-.27);s.lineTo(-.45,.18);s.quadraticCurveTo(-.47,.34,-.33,.34);const g=new T.ExtrudeGeometry(s,{depth:.44,bevelEnabled:true,bevelThickness:.065,bevelSize:.055,bevelSegments:2,steps:1,curveSegments:7});g.translate(0,0,-.22);return g;}
    function complete(kind,x){if(mission[kind])return;if(mission.signal)mission.signal(kind,x);else mission[kind]=true;}
    const samples=M.createMarsSampleBench({scene,world,player,dog});
    const aerostat=M.createAerostat(scene,world,player,dog);
    const T = THREE, tau = Math.PI * 2;
    const group = (parent) => {const result=new T.Group();parent.add(result);return result;};
    const mat = (color, metalness=.15, roughness=.55) => new T.MeshStandardMaterial({color,metalness,roughness});
    const amber=mat(0xf7ba46,.3), enamel=mat(0xf1ead9,.18), strut=mat(0x36535b,.5), rubber=mat(0x363248,.1);
    const turquoise=mat(0x45c6b0,.35), copper=mat(0xb56c46,.48), deep=mat(0x263f64,.26),silver=mat(0xb9c8ce,.65,.28);
    for(const material of[enamel,strut,turquoise,copper,deep]) M.WorkshopArt.paint(material,material===copper||material===strut?'metal':'enamel');
    const leaf=mat(0x68c571,.03),terra=mat(0xa94d38,.08);
    const lamp=new T.MeshStandardMaterial({color:0xffe598,emissive:0xf5a14e,emissiveIntensity:.42});
    const glass=new T.MeshStandardMaterial({color:0x82cfdd,transparent:true,opacity:.16,roughness:.22,depthWrite:false});
    // A soft rim keeps the glass readable against the blue ice, while the flowers
    // remain visible inside. No refraction buffer or additional render pass.
    glass.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
        'float rim=pow(1.0-abs(dot(normal,normalize(vViewPosition))),2.6);diffuseColor.a=0.05+0.34*rim;outgoingLight+=vec3(0.14,0.30,0.36)*rim;\n#include <opaque_fragment>');
    };
    const roundedBox=new T.BoxGeometry(1,1,1,3,3,3),roundedVertices=roundedBox.attributes.position;
    for(let i=0;i<roundedVertices.count;i++){const x=roundedVertices.getX(i),y=roundedVertices.getY(i),z=roundedVertices.getZ(i),ax=M.clamp(x,-.40,.40),ay=M.clamp(y,-.40,.40),az=M.clamp(z,-.40,.40),dx=x-ax,dy=y-ay,dz=z-az,length=Math.hypot(dx,dy,dz)||1;roundedVertices.setXYZ(i,ax+dx/length*.10,ay+dy/length*.10,az+dz/length*.10);}roundedBox.computeVertexNormals();
    const geometry={box:roundedBox,sphere:new T.SphereGeometry(1,16,12),tube:new T.CylinderGeometry(1,1,1,16),torus:new T.TorusGeometry(1,.065,6,40),hemisphere:new T.SphereGeometry(1,28,16,0,tau,0,Math.PI*.5)};
    function mesh(parent, shape, material, x,y,z, sx=1,sy=1,sz=1) {
      const o=new T.Mesh(shape,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=material!==glass;o.receiveShadow=true;parent.add(o);return o;
    }
    function body(p,m,x,y,z,sx,sy,sz){return mesh(p,geometry.sphere,m,x,y,z,sx,sy,sz);}
    function box(p,m,x,y,z,sx,sy,sz){return mesh(p,geometry.box,m,x,y,z,sx,sy,sz);}
    const up=new T.Vector3(0,1,0), direction=new T.Vector3();
    function rod(p,m,ax,ay,az,bx,by,bz,r){
      direction.set(bx-ax,by-ay,bz-az);
      const o=mesh(p,geometry.tube,m,(ax+bx)/2,(ay+by)/2,(az+bz)/2,r,direction.length(),r);
      o.quaternion.setFromUnitVectors(up,direction.normalize());return o;
    }
    // Shared trim for hand wheels: six slim spokes, an enamel inner ring, a domed brass hub and rim rivets.
    const rivetShape=new T.SphereGeometry(1,8,6);
    function dressWheel(g,r,accent){
      for(let i=0;i<6;i++){const a=i*tau/6+tau/12;rod(g,copper,0,0,0,r*.9*Math.cos(a),r*.9*Math.sin(a),0,.017);}
      mesh(g,geometry.torus,accent,0,0,.015,r*.6,r*.6,.8);
      mesh(g,geometry.hemisphere,amber,0,0,.035,.105,.105,.075).rotation.x=Math.PI/2;
      for(let i=0;i<8;i++){const a=i*tau/8;mesh(g,rivetShape,enamel,r*Math.cos(a),r*Math.sin(a),.045,.026,.026,.026);}
    }
    function station(x,name){
      const g=group(scene);g.position.set(x,world.ground(x),-.7);g.name=name;return g;
    }
    function frameStation(minX,maxX,y,zoom){if(Math.abs(player.vx)>=.6)return;M.frameActivity(Math.min(minX,player.x-1.1,dog.x-1.3),Math.max(maxX,player.x+1.1,dog.x+1.3),y,zoom);}
    function lampBase(g,r=1.4){
      mesh(g,geometry.tube,strut,0,.15,0,r,.29,r*.63);
      mesh(g,geometry.tube,enamel,0,.31,0,r*.94,.09,r*.61);
      for(let i=0;i<5;i++){const a=Math.PI*i/4;body(g,lamp,Math.cos(a)*r*.9,.35,Math.sin(a)*r*.53,.065,.04,.065);}
    }
    // The first new expedition branch: unfold two actual wings, then connect
    // the orange cable. Sunlight visibly reaches a dark row of camp lamps.
    const solar=station(95,'Güneşi izleyen enerji bahçesi'),solarFixed=group(solar),solarWings=[];
    const solarCellMaterial=new T.MeshStandardMaterial({color:0x285793,metalness:.38,roughness:.37,emissive:0x102447,emissiveIntensity:.12});
    lampBase(solarFixed,2.2);rod(solarFixed,strut,0,.3,-.6,0,2.35,-.6,.12);
    const sunDisc=body(solarFixed,amber,0,3.8,-1.1,.43,.43,.11);
    for(let n=0;n<8;n++){const a=tau*n/8;rod(solarFixed,amber,.62*Math.cos(a),3.8+.62*Math.sin(a),-1.1,.84*Math.cos(a),3.8+.84*Math.sin(a),-1.1,.035);}
    for(const side of [-1,1]){
      const wing=group(solar);wing.position.set(side*.12,2.05,-.6);wing.rotation.z=-side*1.15;
      box(wing,enamel,side*1.22,0,0,2.48,1.53,.16);
      box(wing,deep,side*1.22,0,.10,2.30,1.35,.055);
      for(let col=0;col<5;col++)for(let row=0;row<3;row++){const cell=box(wing,deep,side*(.32+col*.45),(row-1)*.43,.145,.40,.38,.035);cell.material=solarCellMaterial;}
      for(let n=0;n<6;n++)box(wing,enamel,side*(.09+n*.45),0,.17,.018,1.29,.015);
      for(let n=0;n<4;n++)box(wing,enamel,side*1.22,(n-1.5)*.43,.17,2.27,.018,.015);
      for(const yy of[-.48,.48]){const hinge=mesh(wing,geometry.tube,copper,0,yy,0,.13,.32,.13);hinge.rotation.x=Math.PI/2;}
      if(world.batchStation)world.batchStation(wing);
      solarWings.push({g:wing,side,on:false,amount:0});
    }
    const solarPlug=group(solar);solarPlug.name='İki metal uçlu gerçek elektrik fişi';solarPlug.position.set(1.58,1.03,.72);
    mesh(solarPlug,plugShape(),amber,0,0,0);box(solarPlug,enamel,0,.34,.025,.83,.12,.55);
    for(const side of[-1,1]){box(solarPlug,silver,side*.23,.64,.025,.125,.48,.13);body(solarPlug,enamel,side*.23,.89,.025,.065,.055,.065);}
    for(let n=0;n<3;n++)box(solarPlug,rubber,0,-.16+n*.14,.294,.49+n*.07,.035,.025);
    mesh(solarPlug,geometry.tube,rubber,0,-.46,0,.14,.31,.14);
    for(let n=0;n<3;n++)mesh(solarPlug,geometry.torus,strut,0,-.39-n*.08,0,.15,.15,.15).rotation.x=Math.PI/2;
    if(world.batchStation)world.batchStation(solarPlug);
    const solarSocket=group(solarFixed);solarSocket.name='Fişin iki delikli elektrik yuvası';solarSocket.position.set(3.57,1.48,.65);
    box(solarSocket,enamel,0,0,0,1.18,1.07,.30);box(solarSocket,rubber,0,0,.18,.87,.75,.09);
    mesh(solarSocket,geometry.torus,turquoise,0,0,.25,.42,.42,.42);
    for(const side of[-1,1]){box(solarSocket,strut,side*.23,.07,.28,.16,.34,.055);box(solarSocket,rubber,side*.23,.07,.313,.09,.25,.025);}
    for(const yy of[-.40,.40])body(solarSocket,copper,0,yy,.18,.045,.045,.03);
    rod(solarFixed,strut,3.57,.24,.49,3.57,1.47,.49,.10);
    const solarDock=new T.Vector3(3.57,.94,.88),plugHome=new T.Vector3(1.58,1.03,.72);
    const cablePose=new T.Object3D(),cableA=new T.Vector3(),cableB=new T.Vector3(),cableAxis=new T.Vector3(0,1,0),cableDelta=new T.Vector3();
    const powerCable=new T.InstancedMesh(geometry.tube,rubber,14);powerCable.name='Panele bağlı esnek fiş kablosu';powerCable.instanceMatrix.setUsage(T.DynamicDrawUsage);powerCable.frustumCulled=false;solar.add(powerCable);
    let cableX=NaN,cableY=NaN,cableZ=NaN;
    function updatePowerCable(){if(Math.abs(solarPlug.position.x-cableX)<.0001&&Math.abs(solarPlug.position.y-cableY)<.0001&&Math.abs(solarPlug.position.z-cableZ)<.0001)return;cableX=solarPlug.position.x;cableY=solarPlug.position.y;cableZ=solarPlug.position.z;let ax=0,ay=.58,az=.70;for(let n=0;n<14;n++){const u=(n+1)/14,v=1-u,bx=3*v*u*u*(solarPlug.position.x-.40)+u*u*u*solarPlug.position.x,by=Math.max(.43,v*v*v*.58+3*v*v*u*.43+3*v*u*u*.43+u*u*u*(solarPlug.position.y-.57)),bz=.70+(solarPlug.position.z-.70)*u+Math.sin(Math.PI*u)*.62; cableA.set(ax,ay,az);cableB.set(bx,by,bz);cableDelta.subVectors(cableB,cableA);const length=cableDelta.length();cablePose.position.copy(cableA).add(cableB).multiplyScalar(.5);cablePose.quaternion.setFromUnitVectors(cableAxis,cableDelta.normalize());cablePose.scale.set(.057,length+.014,.057);cablePose.updateMatrix();powerCable.setMatrixAt(n,cablePose.matrix);ax=bx;ay=by;az=bz;}powerCable.instanceMatrix.needsUpdate=true;}
    const frostedBulb=new T.MeshStandardMaterial({color:0xc7d7dc,roughness:.35,metalness:.04}),warmBulb=new T.MeshStandardMaterial({color:0xffeab1,emissive:0xffc453,emissiveIntensity:.85,roughness:.30});
    const powerLamps=[];for(let n=0;n<4;n++){const x=-2.1+n*1.02;rod(solarFixed,strut,x,.3,.90,x,.66,.90,.055);mesh(solarFixed,geometry.tube,enamel,x,.34,.90,.22,.12,.22);mesh(solarFixed,geometry.tube,silver,x,.68,.90,.105,.18,.105);for(let k=0;k<3;k++){const screw=mesh(solarFixed,geometry.torus,copper,x,.62+k*.045,.90,.112,.112,.112);screw.rotation.x=Math.PI/2;}powerLamps.push(body(solar,frostedBulb,x,.86,.90,.17,.20,.15),body(solar,frostedBulb,x,1.06,.90,.27,.29,.23));}
    let plugged=false,plugAmount=0,plugSelected=false;
    const plugGesture={owner:null,moved:false,startX:0,startY:0,offsetX:0,offsetY:0},plugPoint=new T.Vector3();
    function unpluggedPoint(p){const c=M.camera,z=solar.position.z+solarPlug.position.z,k=(c.position.z-z)/c.position.z;plugPoint.set(c.position.x+(p.x-c.position.x)*k-solar.position.x,c.position.y+(p.y-c.position.y)*k-solar.position.y,solarPlug.position.z);return plugPoint;}
    function connectPower(){if(plugged)return;plugged=true;plugSelected=false;plugGesture.owner=null;complete('power',95);M.sfx('success');M.celebrate(95,solar.position.y+2);}
    function releasePlug(){plugGesture.owner=null;plugGesture.moved=false;}
    function solarPointer(type,p,event){const id=event?.pointerId??'primary';if(type==='cancel'){if(!event||plugGesture.owner===id)releasePlug();return false;}if(plugGesture.owner!==null){if(id!==plugGesture.owner)return true;if(type==='move'||type==='up'){if(p){if(Math.hypot(p.x-plugGesture.startX,p.y-plugGesture.startY)>.10)plugGesture.moved=true;if(plugGesture.moved){const v=unpluggedPoint(p);solarPlug.position.x=M.clamp(v.x+plugGesture.offsetX,.75,4.2);solarPlug.position.y=M.clamp(v.y+plugGesture.offsetY,.65,2.4);}if(type==='up'&&plugGesture.moved&&controlHit(p,solarSocket,.82,.92))connectPower();}if(type==='up')releasePlug();return true;}return true;}if(type!=='down'||!p||player.locked||plugged||!solarWings.every(q=>q.on)||Math.abs(player.x-95)>10)return false;if(plugSelected&&controlHit(p,solarSocket,.82,.92)){connectPower();return true;}if(!M.touchPlayPart(p,solarPlug,.17))return false;const v=unpluggedPoint(p);plugGesture.owner=id;plugGesture.moved=false;plugGesture.startX=p.x;plugGesture.startY=p.y;plugGesture.offsetX=solarPlug.position.x-v.x;plugGesture.offsetY=solarPlug.position.y-v.y;plugSelected=true;M.sfx('select');return true;}
    function solarTouch(p){
      if(player.locked||Math.abs(player.x-95)>10)return false;
      for(const q of solarWings){const x=95+q.side*(.12+1.05*Math.cos(q.g.rotation.z)),y=solar.position.y+2.05+q.side*1.05*Math.sin(q.g.rotation.z);
        if(!q.on&&(!p||M.touchPlayPart(p,q.g))){q.on=true;M.sfx('snap');return true;}}
      if(solarWings.every(q=>q.on)&&!plugged&&!p){
        if(plugSelected)connectPower();else{plugSelected=true;M.sfx('select');}return true;
      }
      return false;
    }
    function solarUpdate(dt){
      solar.visible=Math.abs(player.x-95)<37;
      for(const q of solarWings){q.amount=M.damp(q.amount,q.on?1:0,3.2,dt);q.g.rotation.z=-q.side*1.15*(1-q.amount)+q.side*.20*q.amount;}
      plugAmount=M.damp(plugAmount,plugged?1:0,3.5,dt);if(plugGesture.owner===null){const target=plugged?solarDock:plugHome;solarPlug.position.lerp(target,1-Math.exp(-dt*5));}if(solar.visible)updatePowerCable();
      for(let n=0;n<powerLamps.length;n++)powerLamps[n].material=plugged?warmBulb:frostedBulb;
      sunDisc.rotation.z=clock*.12;
    }
    // Later, sunlight melts a small sealed ice sample. The child turns a mirror,
    // opens a tap, then seals the filled vessel; each object has its own result.
    const waterLab=station(366,'Buzdan su araştırması'),waterFixed=group(waterLab);
    lampBase(waterFixed,2.3);box(waterFixed,enamel,.0,.45,-.3,4.4,.3,1.45);
    const mirror=group(waterLab);mirror.position.set(-1.5,1.72,-.4);const mirrorFace=mesh(mirror,geometry.torus,copper,0,0,0,.73,.73,.8);
    const mirrorCanvas=document.createElement('canvas');mirrorCanvas.width=mirrorCanvas.height=256;const mc=mirrorCanvas.getContext('2d');
    const skyReflection=mc.createLinearGradient(0,0,256,256);skyReflection.addColorStop(0,'#fff9d7');skyReflection.addColorStop(.26,'#dff7fc');skyReflection.addColorStop(.52,'#789aa8');skyReflection.addColorStop(.70,'#e4f3ef');skyReflection.addColorStop(1,'#a4c8d0');mc.fillStyle=skyReflection;mc.fillRect(0,0,256,256);
    mc.strokeStyle='rgba(255,255,255,.72)';mc.lineWidth=14;mc.beginPath();mc.moveTo(12,114);mc.lineTo(151,-18);mc.stroke();mc.lineWidth=4;mc.beginPath();mc.moveTo(54,164);mc.lineTo(228,-10);mc.stroke();
    const mirrorMap=new T.CanvasTexture(mirrorCanvas);mirrorMap.colorSpace=T.SRGBColorSpace;
    const silverFace=new T.MeshStandardMaterial({color:0xffffff,map:mirrorMap,roughness:.18,metalness:.4,emissive:0x526f79,emissiveIntensity:.22});
    body(mirror,silverFace,0,0,.018,.69,.69,.08);mirror.rotation.z=-.85;
    rod(waterFixed,strut,-1.5,.55,-.4,-1.5,1.72,-.4,.11);
    const iceShape=new T.IcosahedronGeometry(1.25,1),iceVertices=iceShape.attributes.position;
    // A chunky, faceted ice crystal rather than a plain cube; the same mesh still melts by scaling.
    for(let i=0;i<iceVertices.count;i++){const x=iceVertices.getX(i),y=iceVertices.getY(i),z=iceVertices.getZ(i),f=.9+.1*Math.sin(x*3.1+z*2.3+1.2)+.07*Math.sin(y*4.7-x*2.9);iceVertices.setXYZ(i,M.clamp(x*f,-1.02,1.02),M.clamp(y*f*1.05,-1,1.12),M.clamp(z*f,-1.02,1.02));}iceShape.computeVertexNormals();
    const frozenWater=world.materials.ice.clone();frozenWater.vertexColors=false;frozenWater.color.setHex(0xc2efff);frozenWater.roughness=.25;frozenWater.flatShading=true;
    const ice=mesh(waterLab,iceShape,frozenWater,.05,1.14,-.2,.55,.69,.48),bowl=mesh(waterFixed,geometry.tube,enamel,.05,.73,-.2,.72,.25,.62);
    ice.rotation.set(.04,-.25,.08);

    const waterBeam=box(waterLab,lamp,-.65,1.57,-.30,1.34,.07,.08);waterBeam.rotation.z=-.28;waterBeam.visible=false;
    rod(waterFixed,copper,.06,.73,-.2,1.53,.73,-.2,.075);
    const valve=group(waterLab);valve.name='Suyun gerçek dönen musluk çarkı';valve.position.set(.9,1.03,.42);mesh(valve,geometry.torus,amber,0,0,0,.42,.42,.7);rod(waterFixed,copper,.9,.75,.1,.9,1.03,.42,.065);
    for(let i=0;i<3;i++){const a=i*tau/3;rod(valve,copper,0,0,0,.37*Math.cos(a),.37*Math.sin(a),0,.035);}dressWheel(valve,.42,turquoise);body(valve,enamel,.40,0,.10,.13,.13,.16);body(valve,copper,0,0,.04,.10,.10,.09);
    const vessel=group(waterLab);vessel.name='Omuzlu boyunlu cam su şişesi';vessel.position.set(1.86,.51,.1);mesh(vessel,geometry.tube,glass,0,.65,0,.45,1.16,.40);body(vessel,glass,0,1.20,0,.45,.24,.40);mesh(vessel,geometry.tube,glass,0,1.44,0,.26,.29,.25);mesh(vessel,geometry.torus,enamel,0,.10,0,.43,.43,.43).rotation.x=Math.PI/2;const fill=mesh(vessel,geometry.tube,turquoise,0,.18,0,.38,.10,.34);
    const cap=group(vessel);cap.name='Su şişesinin yivli gerçek kapağı';cap.position.set(.98,.37,.18);mesh(cap,geometry.tube,amber,0,0,0,.30,.19,.29);mesh(cap,geometry.tube,enamel,0,.105,0,.28,.035,.27);for(let n=0;n<12;n++){const a=n*tau/12;rod(cap,copper,.30*Math.cos(a),-.07,.29*Math.sin(a),.30*Math.cos(a),.07,.29*Math.sin(a),.018);}if(world.batchStation)world.batchStation(cap);
    mesh(waterFixed,geometry.tube,strut,2.84,.42,.28,.075,.60,.075);mesh(waterFixed,geometry.tube,enamel,2.84,.75,.28,.40,.10,.36);mesh(waterFixed,geometry.torus,copper,2.84,.81,.28,.35,.35,.35).rotation.x=Math.PI/2;
    const capDock=group(vessel);capDock.position.set(0,1.60,.02);const waterPrint=body(vessel,enamel,0,.67,.405,.20,.28,.035),dropShape=new T.Shape();dropShape.moveTo(0,.18);dropShape.bezierCurveTo(-.04,.11,-.18,-.06,-.14,-.13);dropShape.bezierCurveTo(-.10,-.24,.14,-.24,.15,-.10);dropShape.bezierCurveTo(.16,-.01,.04,.12,0,.18);const dropPrint=new T.ExtrudeGeometry(dropShape,{depth:.018,bevelEnabled:false,curveSegments:8});mesh(vessel,dropPrint,turquoise,0,.70,.44);
    const labDrops=[];for(let n=0;n<7;n++){const d=body(waterLab,turquoise,0,0,0,.055,.085,.055);d.visible=false;labDrops.push(d);}
    const waterState={mirror:false,valve:false,sealed:false,melt:0,fill:0};
    let valveAmount=0,capSelected=false;const waterGesture={owner:null,kind:'',startAngle:0,startX:0,startY:0,offsetX:0,offsetY:0,moved:false},waterPoint=new T.Vector3();
    const controlCenter=new T.Vector3();
    function controlHit(p,node,rx,ry){node.getWorldPosition(controlCenter);const c=M.camera,k=c.position.z/(c.position.z-controlCenter.z),x=c.position.x+(controlCenter.x-c.position.x)*k,y=c.position.y+(controlCenter.y-c.position.y)*k;return Math.hypot((p.x-x)/rx,(p.y-y)/ry)<1;}
    function waterAngle(p){valve.getWorldPosition(waterPoint);const c=M.camera,k=c.position.z/(c.position.z-waterPoint.z);return Math.atan2(p.y-c.position.y-(waterPoint.y-c.position.y)*k,p.x-c.position.x-(waterPoint.x-c.position.x)*k);}
    function sealWater(){if(waterState.sealed||waterState.fill<.88)return false;waterState.sealed=true;capSelected=false;waterGesture.owner=null;waterGesture.kind='';complete('water',366);M.sfx('snap');M.celebrate(367.8,waterLab.position.y+1.7);return true;}
    function releaseWater(){waterGesture.owner=null;waterGesture.kind='';waterGesture.moved=false;}
    function waterPointer(type,p,event){const id=event?.pointerId??'primary';if(type==='cancel'){if(!event||waterGesture.owner===id)releaseWater();return false;}if(waterGesture.owner!==null){if(id!==waterGesture.owner)return true;if(type==='move'||type==='up'){if(p&&waterGesture.kind==='valve'){let d=waterAngle(p)-waterGesture.startAngle;while(d>Math.PI)d-=tau;while(d<-Math.PI)d+=tau;valveAmount=M.clamp(Math.abs(d)/1.35,0,1);if(valveAmount>.45){waterState.valve=true;releaseWater();M.sfx('water');}}else if(p&&waterGesture.kind==='cap'){if(Math.hypot(p.x-waterGesture.startX,p.y-waterGesture.startY)>.10)waterGesture.moved=true;if(waterGesture.moved){const c=M.camera,z=waterLab.position.z+vessel.position.z+cap.position.z,k=(c.position.z-z)/c.position.z;cap.position.x=M.clamp(c.position.x+(p.x-c.position.x)*k-waterLab.position.x-vessel.position.x+waterGesture.offsetX,-1.1,1.35);cap.position.y=M.clamp(c.position.y+(p.y-c.position.y)*k-waterLab.position.y-vessel.position.y+waterGesture.offsetY,.25,2.5);}if(type==='up'&&waterGesture.moved&&controlHit(p,capDock,.61,.66))sealWater();}if(type==='up')releaseWater();return true;}return true;}if(type!=='down'||!p||player.locked||waterState.sealed||Math.abs(player.x-366)>10)return false;if(waterState.mirror&&!waterState.valve&&M.touchPlayPart(p,valve,.16)){waterGesture.owner=id;waterGesture.kind='valve';waterGesture.startAngle=waterAngle(p);M.sfx('select');return true;}if(waterState.valve&&waterState.fill>.88){if(capSelected&&controlHit(p,capDock,.61,.66)&&!M.touchPlayPart(p,cap,.10))return sealWater();if(M.touchPlayPart(p,cap,.18)){const c=M.camera,z=waterLab.position.z+vessel.position.z+cap.position.z,k=(c.position.z-z)/c.position.z;waterGesture.owner=id;waterGesture.kind='cap';waterGesture.moved=false;waterGesture.startX=p.x;waterGesture.startY=p.y;waterGesture.offsetX=cap.position.x-(c.position.x+(p.x-c.position.x)*k-waterLab.position.x-vessel.position.x);waterGesture.offsetY=cap.position.y-(c.position.y+(p.y-c.position.y)*k-waterLab.position.y-vessel.position.y);capSelected=true;M.sfx('select');return true;}}return false;}
    function waterTouch(p){
      if(player.locked||Math.abs(player.x-366)>10||waterState.sealed)return false;
      if(!waterState.mirror&&(!p||M.touchPlayPart(p,mirror,.15))){waterState.mirror=true;M.sfx('select');return true;}
      if(!p&&waterState.mirror&&!waterState.valve){waterState.valve=true;valveAmount=1;M.sfx('water');return true;}
      if(!p&&waterState.valve&&waterState.fill>.88){if(capSelected)return sealWater();capSelected=true;M.sfx('select');return true;}
      return false;
    }
    function waterUpdate(dt){
      waterLab.visible=Math.abs(player.x-366)<38;
      waterState.melt=M.damp(waterState.melt,waterState.mirror?1:0,2.8,dt);waterState.fill=M.damp(waterState.fill,waterState.valve?1:0,1.8,dt);
      mirror.rotation.z=-.85+waterState.melt*.85;ice.scale.set(.55*(1-.78*waterState.melt),.69*(1-.78*waterState.melt),.48*(1-.78*waterState.melt));
      waterBeam.visible=waterState.mirror&&!waterState.sealed;if(waterGesture.kind!=='valve')valveAmount=M.damp(valveAmount,waterState.valve?1:0,5,dt);valve.rotation.z=valveAmount*1.35;
      fill.scale.y=.08+waterState.fill*.92;fill.position.y=.18+waterState.fill*.45;if(waterGesture.kind!=='cap'){cap.position.x=M.damp(cap.position.x,waterState.sealed?0:.98,5,dt);cap.position.y=M.damp(cap.position.y,waterState.sealed?1.60:.37,5,dt);cap.position.z=M.damp(cap.position.z,waterState.sealed?.02:.18,5,dt);}
      for(let n=0;n<labDrops.length;n++){const d=labDrops[n],u=(clock*.65+n/7)%1;d.visible=waterState.valve&&!waterState.sealed;d.position.set(.13+u*1.51,.78+Math.sin(u*Math.PI)*.44-u*.14,.25);}
    }
    if(world.batchStation){world.batchStation(solarFixed);world.batchStation(waterFixed);}
    // Counter-rotating coaxial blades, gold thermal body, solar cells and four spring legs.
    const pad=station(118,'Çift pervaneli keşif helikopteri'), craft=group(pad), rotors=[];
    lampBase(pad,1.75);craft.position.y=.34;
    box(craft,amber,0,.72,0,.59,.65,.55);box(craft,enamel,0,.98,0,.64,.12,.6);
    for(const x of [-1,1])for(const z of [-1,1]){
      rod(craft,strut,x*.23,.6,z*.19,x*.57,.06,z*.41,.033);
      box(craft,rubber,x*.57,.055,z*.41,.24,.07,.12);
    }
    // Foil seams and the navigation camera read even at the gameplay camera distance.
    for(let i=0;i<4;i++)box(craft,copper,-.22+i*.145,.72,.282,.015,.56,.012);
    for(const y of [.49,.92])box(craft,enamel,0,y,.285,.58,.038,.026);
    body(craft,strut,.03,.73,.34,.17,.15,.075);
    body(craft,deep,.03,.73,.393,.118,.105,.055);
    body(craft,turquoise,0,.76,.431,.043,.031,.014);
    body(craft,rubber,-.10,.38,.16,.13,.11,.15);
    rod(craft,strut,-.27,.97,-.18,-.46,1.19,-.18,.025);
    body(craft,lamp,-.46,1.2,-.18,.04,.035,.04);
    rod(craft,strut,0,1,0,0,1.76,0,.052);
    const bladeGeometry=new T.Shape();
    bladeGeometry.moveTo(.04,0);bladeGeometry.quadraticCurveTo(.45,.12,1.25,.13);bladeGeometry.quadraticCurveTo(1.63,.1,1.7,.03);
    bladeGeometry.quadraticCurveTo(1.45,-.05,.77,-.055);bladeGeometry.lineTo(.04,0);
    const blade=new T.ExtrudeGeometry(bladeGeometry,{depth:.022,bevelEnabled:true,bevelThickness:.009,bevelSize:.012,bevelSegments:2,curveSegments:10});blade.rotateX(-Math.PI/2);
    for(let i=0;i<2;i++){
      const rotor=group(craft);rotor.position.y=1.24+i*.22;
      for(const side of [0,Math.PI]){
        mesh(rotor,blade,i?strut:copper,0,0,0).rotation.y=side;
        const tip=body(rotor,i?turquoise:amber,Math.cos(side)*1.47,0,0,.17,.03,.075);tip.rotation.y=side;
      }
      mesh(rotor,geometry.torus,i?amber:turquoise,0,0,0,.15,.15,.15).rotation.x=Math.PI/2;
      rotors.push(rotor);
    }
    mesh(rotors[1],geometry.hemisphere,amber,0,.02,0,.15,.12,.15);body(rotors[1],lamp,0,.15,0,.045,.045,.045);
    box(craft,deep,0,1.78,0,.83,.055,.63);
    for(let i=0;i<4;i++)box(craft,enamel,-.3+i*.2,1.815,0,.013,.008,.58);
    const touchdown=mesh(pad,geometry.torus,amber,0,.38,0,1.02,1.02,1.02);touchdown.rotation.x=-Math.PI/2;
    // Three different scientific shapes, each drawn in one coloured mesh. The
    // miniature on its physical record plate reuses the exact specimen geometry.
    // No image download, per-frame geometry, or three interchangeable egg props.
    function surveyShape(kind){
      const positions=[],colours=[],tint=new T.Color();
      function triangle(a,b,c,colour){tint.setHex(colour);for(const p of [a,b,c]){positions.push(p[0],p[1],p[2]);colours.push(tint.r,tint.g,tint.b);}}
      function rings(cx,cz,levels,radii,palette,stretch=1,seed=0){
        const n=9,points=[];
        for(let j=0;j<levels.length;j++)for(let k=0;k<n;k++){const a=tau*k/n,edge=1+.12*Math.sin(k*2.7+seed)+.07*Math.cos(k*4.1+seed);points.push([cx+Math.cos(a)*radii[j]*edge,levels[j]+.021*Math.sin(k*2.1+seed),cz+Math.sin(a)*radii[j]*stretch*edge]);}
        for(let j=0;j<levels.length-1;j++)for(let k=0;k<n;k++){const a=points[j*n+k],b=points[j*n+(k+1)%n],c=points[(j+1)*n+k],d=points[(j+1)*n+(k+1)%n],colour=palette[j%palette.length];triangle(a,c,b,colour);triangle(b,c,d,colour);}
        const top=[cx,levels[levels.length-1]+.025,cz],bottom=[cx,levels[0],cz];for(let k=0;k<n;k++){triangle(top,points[(levels.length-1)*n+(k+1)%n],points[(levels.length-1)*n+k],palette[palette.length-1]);triangle(bottom,points[k],points[(k+1)%n],palette[0]);}
      }
      function crystal(cx,cy,cz,r,h,lean,palette){
        const low=[],high=[],n=6;for(let k=0;k<n;k++){const a=tau*k/n+.24;low.push([cx+Math.cos(a)*r,cy,cz+Math.sin(a)*r*.72]);high.push([cx+lean+Math.cos(a)*r*.8,cy+h*.71,cz+Math.sin(a)*r*.58]);}
        const tip=[cx+lean*1.35,cy+h,cz-.015];for(let k=0;k<n;k++){const j=(k+1)%n;triangle(low[k],high[k],low[j],palette[k%palette.length]);triangle(low[j],high[k],high[j],palette[k%palette.length]);triangle(high[k],tip,high[j],palette[(k+1)%palette.length]);triangle([cx,cy,cz],low[j],low[k],palette[0]);}
      }
      if(kind===0)rings(0,0,[.38,.48,.57,.68,.78,.90,1.02,1.12],[.36,.52,.48,.57,.52,.46,.43,.26],[0x8a4338,0xc56d48,0xe2a16c,0x9c4d3a,0xd8905d,0xf0c098,0xb96c4d],.66,.3);
      if(kind===1){rings(0,0,[.36,.44,.52],[.44,.43,.28],[0x8bbbc4,0xc4e5e7],.72,1.2);crystal(-.12,.43,.02,.25,1.15,.08,[0xe4f9f5,0xffffff,0xaedce6,0xd0eef2]);crystal(.28,.43,.04,.17,.75,.10,[0xc6e7eb,0xf5ffff,0x98c8da]);crystal(-.33,.43,.10,.13,.58,-.05,[0xb5d9df,0xf0ffff,0xd3eff2]);}
      if(kind===2){rings(0,0,[.37,.47,.57],[.44,.51,.31],[0x526665,0x798780],.71,2.3);for(const q of [[-.29,.05,.16,.72,-.09],[0,-.06,.22,1.05,.04],[.30,.05,.17,.80,.13],[-.13,.24,.15,.57,-.04],[.18,.25,.13,.52,.08]])crystal(q[0],.48,q[1],q[2],q[3],q[4],[0x327b62,0x80d6a4,0x58aa7b,0xbce4bd]);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colours,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
    }
    const surveyTargets=[],surveyNames=['Katmanlı kızıl kaya','Beyaz buz kristali','Yeşil mineral kümesi'];
    const surveyMaterials=[new T.MeshStandardMaterial({vertexColors:true,roughness:.86,metalness:.03,flatShading:true}),new T.MeshStandardMaterial({vertexColors:true,roughness:.28,metalness:.10,flatShading:true}),new T.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.12,flatShading:true})];
    const scanDetailMaterial=new T.MeshStandardMaterial({color:0xc8f7d2,emissive:0x53ad92,emissiveIntensity:.28,roughness:.44});
    [-3.9,2.4,7.0].forEach((x,i)=>{
      const g=group(pad);g.name='Helikopter örneği · '+surveyNames[i];g.position.set(x,0,-.18);
      const fixed=group(g);lampBase(fixed,.78);
      const specimen=mesh(fixed,surveyShape(i),surveyMaterials[i],0,0,0);specimen.name=surveyNames[i];
      // The three records sit below the source, towards the child. Before the
      // scan the card is a dark recessed plate; afterwards its matching relief
      // and a concrete layer/water/mineral diagram stay illuminated.
      box(fixed,strut,0,.25,.78,1.55,.52,.075);box(fixed,amber,0,.25,.825,1.43,.43,.025);box(fixed,deep,0,.25,.852,1.33,.35,.025);
      const plate=group(g);plate.name='Tarama kaydı · '+surveyNames[i];plate.position.set(0,.25,.872);
      const picture=mesh(plate,specimen.geometry,surveyMaterials[i],-.27,-.23,.035,.29,.29,.14);picture.name='Örneğin aynı şekilli kabartma resmi';
      if(i===0){for(let n=0;n<4;n++)box(plate,[terra,copper,enamel,terra][n],.34,-.105+n*.07,.04,.42-n*.025,.045,.025);}
      if(i===1){const drop=body(plate,turquoise,.34,.015,.045,.095,.13,.025);const point=mesh(plate,new T.ConeGeometry(.077,.14,10),turquoise,.34,.135,.045);point.scale.z=.32;box(plate,enamel,.34,-.145,.05,.37,.025,.025);}
      if(i===2){for(let n=0;n<3;n++){const shard=mesh(plate,new T.OctahedronGeometry(.07,0),scanDetailMaterial,.23+n*.11,(n%2)*.055-.02,.045);shard.scale.set(.75,1.3,.34);}}
      plate.visible=false;
      const detail=group(g);detail.name='Tarayıcıyla ortaya çıkan örnek ayrıntısı';detail.visible=false;
      if(i===0){for(let n=0;n<3;n++){const vein=box(detail,scanDetailMaterial,0,.57+n*.20,.337,.68-n*.06,.025,.025);vein.rotation.z=(n-1)*.045;}}
      if(i===1){for(let n=0;n<3;n++){const fissure=box(detail,scanDetailMaterial,-.15+n*.11,.85+n*.10,.18,.018,.30,.025);fissure.rotation.z=(n-1)*.32;}}
      if(i===2){for(let n=0;n<4;n++)mesh(detail,new T.OctahedronGeometry(.055,0),amber,-.18+n*.12,.70+(n%2)*.12,.24);}
      const flag=mesh(g,geometry.torus,amber,.64,1.57,.10,.17,.17,.7),beam=body(g,lamp,.64,1.57,.10,.045,.045,.045);beam.visible=false;
      if(world.batchStation){world.batchStation(fixed);world.batchStation(plate);world.batchStation(detail);}
      surveyTargets.push({x,g,specimen,flag,beam,plate,detail,scan:0,seen:false});
    });
    // One pooled beam points from the moving camera to the actual specimen,
    // rather than scanning empty air while the helicopter is still travelling.
    const scanCone=mesh(pad,new T.CylinderGeometry(.055,.70,1,18,1,true),new T.MeshBasicMaterial({color:0x82e8d6,transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide}),0,0,0);scanCone.name='Helikopterden gerçek örneğe tarama ışığı';scanCone.visible=false;scanCone.castShadow=false;
    let clock=0,flightStart=-50,rotorAngle=0;
    const teaching=group(scene),teachingHand=M.WorkshopArt.hand(teaching,1.05);teachingHand.position.set(.12,.65,.4);teaching.visible=false;let teachingIdle=0;

    const survey={active:-1,queued:-1,fromX:0,fromY:.34,fromZ:0};
    function launch(index=-1){
      let next=index>=0?index:surveyTargets.findIndex(q=>!q.seen);
      if(next<0)next=3;
      if(survey.active>=0){if(next!==survey.active)survey.queued=next;return;}
      survey.active=next;survey.fromX=craft.position.x;survey.fromY=craft.position.y;survey.fromZ=craft.position.z;flightStart=clock;M.sfx('rotor');
    }
    function fly(dt){
      const flying=survey.active>=0,t=clock-flightStart,u=flying?Math.min(1,t/3.6):1,air=flying?Math.sin(Math.PI*u)**2:0;
      rotorAngle=(rotorAngle+dt*(flying?39:1.4))%tau;
      rotors[0].rotation.y=rotorAngle;rotors[1].rotation.y=-rotorAngle+.8;
      if(flying){
        const destination=survey.active===3?0:surveyTargets[survey.active].x,travel=M.clamp((u-.12)/.68,0,1),ease=travel*travel*(3-2*travel);
        craft.position.set(survey.fromX+(destination-survey.fromX)*ease,.34+(survey.fromY-.34)*(1-u)+air*2.7,-.35*air);
        craft.rotation.z=.12*Math.sin(tau*u)*air;craft.rotation.y=.2*Math.sin(tau*u);scanCone.visible=survey.active<3&&u>.32&&u<.91;
        if(scanCone.visible){const q=surveyTargets[survey.active],scan=M.clamp((u-.32)/.55,0,1);q.scan=Math.max(q.scan,scan);q.detail.visible=true;q.plate.visible=scan>.52||q.seen;const sway=Math.sin(scan*Math.PI*2)*.24,ax=craft.position.x,ay=craft.position.y+.58,az=craft.position.z+.18,bx=q.x+sway,by=.80,bz=-.18;direction.set(ax-bx,ay-by,az-bz);const length=direction.length();scanCone.position.set((ax+bx)*.5,(ay+by)*.5,(az+bz)*.5);scanCone.quaternion.setFromUnitVectors(up,direction.normalize());scanCone.scale.set(1,length,1);q.detail.scale.setScalar(.65+.35*scan);}
        if(u>=1){
          const ended=survey.active;if(ended<3){const q=surveyTargets[ended];q.seen=true;q.scan=1;q.detail.visible=q.plate.visible=true;q.detail.scale.setScalar(1);q.flag.material=lamp;q.beam.visible=true;M.sfx('scan');if(surveyTargets.every(q=>q.seen))complete('heli',118);}
          survey.active=-1;scanCone.visible=false;craft.rotation.set(0,0,0);const queued=survey.queued;survey.queued=-1;if(queued>=0)launch(queued);
        }
        if(Math.abs(player.x-118)<10)frameStation(112,127.4,pad.position.y+2.2,.94);
      }
      touchdown.scale.setScalar(1+.045*Math.sin(clock*2));
      for(let i=0;i<surveyTargets.length;i++){const q=surveyTargets[i];q.flag.rotation.y=Math.sin(clock*.8+i)*.1;q.beam.scale.setScalar(.045+(q.seen?.025*Math.sin(clock*2+i):0));}
    }
    // A complete tiny garden: match three tangible seeds to coloured pots,
    // pump water through the pipe, then open the sunlight shade.
    const gardenX=274,garden=station(gardenX,'Mars serası'),stemGroups=[],flowerGroups=[],drops=[];
    const greenhouse=group(garden);greenhouse.position.set(1.25,0,-.87);const greenhouseFixed=group(greenhouse);greenhouseFixed.name='Seranın sabit aynı malzemeli parçaları';lampBase(greenhouseFixed,2.16);
    const botany=(width,length,curve,colour)=>{
      // A tapered, folded surface gives each leaf a raised midrib and a curled tip.
      const pos=[],uv=[],idx=[],shades=[],vein=new T.Color(colour);
      for(let j=0;j<=9;j++){
        const u=j/9,spread=.008+width*Math.sin(Math.PI*Math.pow(u,.88))**.75;
        for(let k=-1;k<=1;k++){
          pos.push(u*length,k*spread+curve*Math.sin(u*Math.PI)-.07*u*u,(1-Math.abs(k))*.042*Math.sin(u*Math.PI)+u*u*.12);
          uv.push(u,(k+1)*.5);const tone=(k===0?1.12:.88)+u*.16;shades.push(vein.r*tone,vein.g*tone,vein.b*tone);
        }
        if(j<9)for(let k=0;k<2;k++){const a=j*3+k;idx.push(a,a+3,a+1,a+1,a+3,a+4);}
      }
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(shades,3));
      g.setIndex(idx);g.computeVertexNormals();return g;
    };
    const leafG=botany(.112,.58,.12,0x6dba68),petalG=botany(.084,.39,.044,0xffce53);
    const plantMat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.76});
    // Bake only four rigid leaves under each still-animated plant. Vertex colours,
    // UVs and mirrored-face winding remain equivalent to the original meshes.
    // Constructor-only buffers; seed, stem, bloom and all petal motion stay original.
    function batchGardenLeaves(parent,pieces){
      const positions=[],normals=[],uvs=[],colours=[],indices=[],v=new T.Vector3(),normal=new T.Matrix3();
      for(const piece of pieces){
        piece.updateMatrix();normal.getNormalMatrix(piece.matrix);
        const a=piece.geometry.attributes,offset=positions.length/3;
        for(let n=0;n<a.position.count;n++){
          v.fromBufferAttribute(a.position,n).applyMatrix4(piece.matrix);positions.push(v.x,v.y,v.z);
          v.fromBufferAttribute(a.normal,n).applyNormalMatrix(normal);normals.push(v.x,v.y,v.z);
          uvs.push(a.uv.getX(n),a.uv.getY(n));colours.push(a.color.getX(n),a.color.getY(n),a.color.getZ(n));
        }
        const index=piece.geometry.index,count=index?index.count:a.position.count,mirrored=piece.matrix.determinant()<0;
        for(let n=0;n<count;n+=3){const a0=index?index.getX(n):n,b0=index?index.getX(n+1):n+1,c0=index?index.getX(n+2):n+2;indices.push(offset+a0,offset+(mirrored?c0:b0),offset+(mirrored?b0:c0));}
        piece.removeFromParent();
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('color',new T.Float32BufferAttribute(colours,3));g.setIndex(indices);g.computeBoundingBox();g.computeBoundingSphere();
      const joined=new T.Mesh(g,pieces[0].material);joined.name='Seranın dört gerçek yaprağı · sabit birleşim';joined.castShadow=pieces[0].castShadow;joined.receiveShadow=pieces[0].receiveShadow;parent.add(joined);
    }
    const blossoms=[],seedColours=[turquoise,amber,enamel],potRims=[];
    for(let i=0;i<9;i++){const a=Math.PI*(i/8);box(greenhouseFixed,copper,1.83*Math.cos(a),.26,1.08*Math.sin(a),.135,.09,.045).rotation.y=-a+Math.PI/2;}

    mesh(greenhouse,geometry.hemisphere,glass,0,.36,0,1.94,2.63,1.26);
    for(let side=0;side<2;side++){
      const rib=new T.CurvePath();
      const points=[];for(let i=0;i<=22;i++){const a=Math.PI*i/22;points.push(new T.Vector3((side?0:1.94)*Math.cos(a),.36+2.64*Math.sin(a),(side?1.26:0)*Math.cos(a)));}
      for(let i=1;i<points.length;i++)rib.add(new T.LineCurve3(points[i-1],points[i]));
      mesh(greenhouseFixed,new T.TubeGeometry(rib,26,.036,5,false),enamel,0,0,0);
    }
    for(let i=0;i<3;i++){
      const x=(i-1)*.87, plant=group(greenhouse);plant.position.set(x,.59,.08);
      mesh(greenhouseFixed,geometry.tube,terra,x,.47,.08,.33,.28,.31);
      potRims.push(mesh(greenhouse,geometry.torus,seedColours[i],x,.63,.08,.33,.15,.30));potRims[i].rotation.x=Math.PI/2;
      const height=i===1?1.6:1.18;
      rod(plant,leaf,0,0,0,.06,height,0,.035);
      const fixedLeaves=[];
      for(let j=0;j<4;j++){
        const side=j%2?1:-1;
        const o=mesh(plant,leafG,plantMat,.03,height*(.2+j*.16),.03);
        o.rotation.z=side>0?.30:Math.PI-.43;o.rotation.x=.09*Math.sin(j);o.scale.y=side;o.scale.x=j===3?.72:1;fixedLeaves.push(o);
      }
      batchGardenLeaves(plant,fixedLeaves);
      const bloom=group(plant);bloom.position.set(.06,height,.04);const bloomFixed=group(bloom);bloomFixed.name='Çiçeğin sabit merkezi ve poleni';
      const flower=[];
      for(let j=0;j<11;j++){const angle=j*tau/11,o=group(bloom);o.rotation.z=angle;const petal=mesh(o,petalG,plantMat,.046,0,.02);petal.scale.x=j%2?.88:1;flower.push(petal);}
      blossoms.push(flower);body(bloomFixed,copper,0,0,.13,.115,.115,.065);
      for(let j=0;j<6;j++){const a=j*tau/6;body(bloomFixed,amber,.073*Math.cos(a),.073*Math.sin(a),.176,.027,.027,.018);}
      if(world.batchStation)world.batchStation(bloomFixed);
stemGroups.push(plant);flowerGroups.push(bloom);
    }
    if(world.batchStation)world.batchStation(greenhouseFixed);
    M.WorkshopArt.sign(garden,['seed','water','flower'],-.8,3.95,-1.5,4.6,1.5);
    const pump=group(garden);pump.position.set(-1.72,.03,.28);
    mesh(pump,geometry.tube,copper,0,.16,0,.59,.28,.56);
    const bellows=group(pump);bellows.position.y=.27;
    for(let i=0;i<4;i++)mesh(bellows,geometry.tube,i%2?enamel:turquoise,0,i*.13+.1,0,.44+i*.02,.11,.43+i*.02);
    const handle=body(pump,turquoise,0,.94,0,.70,.24,.60);body(handle,lamp,0,.76,0,.2,.22,.2);
    rod(garden,copper,-1.7,.23,-.17,-.21,.23,-.17,.082);
    for(let i=0;i<8;i++)drops.push(body(garden,turquoise,0,0,0,.046,.075,.046));
    const seedTray=group(garden);seedTray.position.set(-3.9,.28,.5);box(seedTray,enamel,0,0,0,2.4,.16,.76);
    // A real seed box: dark soil bed, copper boards and three soft soil mounds where the seeds wait; merged per material.
    {const trayFixed=group(seedTray);box(trayFixed,rubber,0,.09,0,2.26,.035,.64);
     for(const z of [-.40,.40])box(trayFixed,copper,0,.11,z,2.5,.2,.06);for(const x of [-1.22,1.22])box(trayFixed,copper,x,.11,0,.06,.2,.86);
     for(const x of [-.8,0,.8])body(trayFixed,rubber,x,.1,0,.27,.07,.22);
     for(const x of [-1.22,1.22])for(const z of [-.40,.40])box(trayFixed,amber,x,.22,z,.1,.04,.1);
     if(world.batchStation)world.batchStation(trayFixed);}
    const seedObjects=[],seedsPlanted=[false,false,false],seedFlight=[0,0,0];
    for(let i=0;i<3;i++){const seed=body(garden,seedColours[i],-4.7+i*.8,.65,.5,.23,.34,.19);seed.name='Seranın gerçek tohumu '+(i+1);seed.rotation.z=.35*(i-1);body(seed,enamel,0,0,.93,.28,.55,.10);seedObjects.push(seed);}
    const seedGhostMaterial=new T.MeshStandardMaterial({color:0xc6fff2,transparent:true,opacity:.36,emissive:0x70c8aa,emissiveIntensity:.2,depthWrite:false});
    const seedGhost=body(garden,seedGhostMaterial,0,0,.6,.23,.34,.19);seedGhost.visible=false;
    const shade=group(garden);shade.position.set(1.25,3.15,-.87);
    const awningMap=document.createElement('canvas');awningMap.width=512;awningMap.height=256;const aw=awningMap.getContext('2d');
    aw.fillStyle='#80c8b4';aw.fillRect(0,0,512,256);
    for(let i=0;i<12;i++){aw.fillStyle=i%2?'#e7ddbd':'#59a99d';aw.fillRect(i*43,0,21,256);}
    aw.strokeStyle='#f5efd3';aw.lineWidth=2;aw.setLineDash([7,5]);aw.strokeRect(9,9,494,238);
    const awningTexture=new T.CanvasTexture(awningMap);awningTexture.colorSpace=T.SRGBColorSpace;
    const awningMaterial=new T.MeshStandardMaterial({map:awningTexture,roughness:.88,side:T.DoubleSide});
    const awning=mesh(shade,new T.PlaneGeometry(3.8,1.65),awningMaterial,0,0,0);awning.rotation.x=-Math.PI/2;
    const awningRoll=mesh(shade,geometry.tube,enamel,0,.04,-.82,.12,3.95,.12);awningRoll.rotation.z=Math.PI/2;
    const crank=group(garden);crank.position.set(2.90,2.97,-.04);
    const shadeHandle=mesh(crank,geometry.torus,amber,0,0,0,.35,.35,.7);
    for(let i=0;i<3;i++){const a=i*tau/3;rod(crank,copper,0,0,0,.31*Math.cos(a),.31*Math.sin(a),0,.035);}dressWheel(crank,.35,turquoise);
    body(crank,turquoise,.32,0,.08,.12,.12,.19);
    rod(garden,copper,2.9,.35,-.2,2.9,2.97,-.2,.045);
    rod(garden,copper,2.9,2.97,-.2,3.13,3.18,-1.69,.045);
    const gardenSun=group(garden);gardenSun.position.set(3.55,2.2,-.6);
    M.WorkshopArt.sign(gardenSun,['sun'],0,0,0,.65,.65);rod(garden,copper,3.55,.35,-.65,3.55,2.2,-.65,.045);

    let selectedSeed=-1,hintedSeed=-1,seedHint=0,shadeOpen=false,shadeAmount=0;
    const seedGesture={owner:null,index:-1,startX:0,startY:0,x:0,y:0,moved:false};
    const seedReturns=seedObjects.map(()=>({x:0,y:0,age:1}));
    let watered=0,growth=0,pumpedAt=-10;
    function plantSeed(i){
      if(seedsPlanted[i])return;
      seedsPlanted[i]=true;if(seedGesture.index===i&&seedGesture.moved)seedFlight[i]=1;selectedSeed=-1;hintedSeed=-1;seedHint=0;seedReturns[i].age=1;M.sfx('snap');
      // 4 yaş: tek tohum yeter, diğer ikisi kendiliğinden saksılarına uçar.
      for(let j=0;j<3;j++)if(!seedsPlanted[j]){seedsPlanted[j]=true;seedReturns[j].age=1;}
    }
    function releaseSeed(){
      if(seedGesture.index>=0&&seedGesture.moved&&!seedsPlanted[seedGesture.index]){
        const back=seedReturns[seedGesture.index];back.x=seedGesture.x;back.y=seedGesture.y;back.age=0;
      }
      seedGesture.owner=null;seedGesture.index=-1;seedGesture.moved=false;
    }
    function water(){
      if(clock-pumpedAt<.44)return;pumpedAt=clock;watered=3;
      M.sfx(watered===3&&growth<.96?'bloom':'water');
    }
    function gardenTouch(point){
      if(player.locked||mission.garden||Math.abs(player.x-gardenX)>11)return false;
      const x=point?point.x-gardenX:0,y=point?point.y-garden.position.y:0;
      if(!point){const i=seedsPlanted.indexOf(false);if(i>=0){if(selectedSeed===i){plantSeed(i);}else{selectedSeed=i;M.sfx('select');}return true;}if(watered<3){water();return true;}if(!shadeOpen){shadeOpen=true;M.sfx('select');return true;}water();return true;}
      for(let i=0;i<3;i++)if(!seedsPlanted[i]&&Math.abs(x-(-4.7+i*.8))<.40&&Math.abs(y-.65)<.65){selectedSeed=i;hintedSeed=-1;seedHint=0;M.sfx('select');return true;}
      for(let i=0;i<3;i++)if(!seedsPlanted[i]&&Math.abs(x-(1.25+(i-1)*.87))<.43&&Math.abs(y-.68)<.8){
        if(selectedSeed===i)plantSeed(i);
        else{hintedSeed=selectedSeed>=0?selectedSeed:i;seedHint=3;M.sfx('select');}return true;
      }
      if(watered<3&&M.touchPlayPart(point,pump,.14)){water();return true;}
      if(!shadeOpen&&controlHit(point,crank,.54,.54)){shadeOpen=true;M.sfx('select');return true;}
      return false;
    }
    function grow(dt){
      seedHint=Math.max(0,seedHint-dt);if(watered===3&&!shadeOpen&&clock-pumpedAt>.6)shadeOpen=true;
      growth=M.damp(growth,shadeOpen?watered/3:watered/9,2.7,dt);shadeAmount=M.damp(shadeAmount,shadeOpen?1:0,3,dt);shade.rotation.z=0;awning.scale.y=Math.max(.035,1-shadeAmount*.97);awning.position.z=-.82*shadeAmount;crank.rotation.z=shadeAmount*3.6;gardenSun.scale.setScalar(1+shadeAmount*.06);
      if(seedsPlanted.every(Boolean)&&watered===3&&shadeOpen)complete('garden',gardenX);
      const since=clock-pumpedAt,stroke=since<.45?Math.sin(Math.PI*since/.45):0;
      bellows.scale.y=1-stroke*.55;handle.position.y=.94-stroke*.32+(!watered?.035*Math.sin(clock*2.5):0);
      for(let i=0;i<3;i++){
        const g=seedsPlanted[i]?Math.max(0,Math.min(1,growth*3-i)):0;
        seedFlight[i]=M.damp(seedFlight[i],seedsPlanted[i]?1:0,4.1,dt);const move=seedFlight[i],seed=seedObjects[i];seed.visible=move<.98;
        seed.position.set((-4.7+i*.8)*(1-move)+(1.25+(i-1)*.87)*move,.65+.65*Math.sin(move*Math.PI),.5-move*.8);seed.rotation.z=move*Math.PI*2;
        const back=seedReturns[i];back.age=Math.min(1,back.age+dt);
        if(seedGesture.owner!==null&&seedGesture.index===i&&seedGesture.moved)seed.position.set(seedGesture.x,seedGesture.y,.70);
        else if(!seedsPlanted[i]&&back.age<.42){const u=back.age/.42,v=u*u*(3-2*u);seed.position.set(back.x+(-4.7+i*.8-back.x)*v,back.y+(.65-back.y)*v,.70-.20*v);}
        const invite=seedHint>0&&hintedSeed===i?1+.17*(.5+.5*Math.sin(clock*5)):1;seed.scale.set(.23*invite,.34*invite,.19*invite);
        potRims[i].material=seedsPlanted[i]?lamp:seedColours[i];stemGroups[i].visible=seedsPlanted[i];
        stemGroups[i].scale.set(.52+.48*g,.19+.81*g,.52+.48*g);stemGroups[i].rotation.z=Math.sin(clock*1.7+i)*.043*g;
        flowerGroups[i].scale.setScalar(.12+.88*g);
        for(const petal of blossoms[i])petal.rotation.y=-1.38*(1-g)-.10;
      }
      seedGhost.visible=!M.playGuideActive&&selectedSeed>=0&&!seedsPlanted[selectedSeed]&&!seedGesture.moved;if(seedGhost.visible){const i=selectedSeed,u=(clock*.45)%1,v=u*u*(3-2*u);seedGhost.position.set((-4.7+i*.8)*(1-v)+(1.25+(i-1)*.87)*v,.7+.55*Math.sin(u*Math.PI),.65);}
      for(let i=0;i<drops.length;i++){
        const u=(since-i*.042)/.82,drop=drops[i];drop.visible=u>=0&&u<=1;
        if(drop.visible)drop.position.set(-1.48+u*(2.8+.7*Math.sin(i)),.62+u*.34+1.8*Math.sin(Math.PI*u),.44);
      }
    }
    // A constellation Feza and Bilbo light together from a pair of boot and paw plates.
    const projector=station(451,'Bilbo takımyıldızı'), chart=group(projector);
    chart.position.set(1.1,2.2,-1.8);
    const starMat=new T.MeshBasicMaterial({color:0xffdfa0});
    const layout=[[-1.82,.88],[-1.22,.42],[-.72,.57],[-.12,.71],[.52,.93],[.75,1.57],[1.21,1.47],[1.59,1.05],[1.16,.98],[.86,.65],[.52,.09],[.5,-.62],[.16,-.65],[-.03,-.1],[-.85,-.15],[-1.1,-.73],[-1.43,-.77],[-1.27,-.02],[-1.32,.28]];
    const curve=layout.map(p=>new T.Vector3(p[0]*1.39,p[1]*1.39,0));
    const links=new T.InstancedMesh(new T.CylinderGeometry(.011,.011,1,6,1,true),new T.MeshBasicMaterial({color:0xffe5ac}),curve.length-1);
    chart.add(links);
    const linkPose=new T.Object3D();
    for(let i=1;i<curve.length;i++){const a=curve[i-1],b=curve[i];direction.subVectors(b,a);linkPose.position.copy(a).addScaledVector(direction,.5);linkPose.scale.set(1,direction.length(),1);linkPose.quaternion.setFromUnitVectors(up,direction.normalize());linkPose.updateMatrix();links.setMatrixAt(i-1,linkPose.matrix);}
    const pinGeo=new T.OctahedronGeometry(1), stars=new T.InstancedMesh(pinGeo,starMat,curve.length), dummy=new T.Object3D();
    curve.forEach((v,i)=>{dummy.position.copy(v);dummy.scale.setScalar(i%3?.052:.087);dummy.updateMatrix();stars.setMatrixAt(i,dummy.matrix);});chart.add(stars);
    function padPrint(x,paw){
      const g=group(projector);g.position.set(x,0,.08);mesh(g,geometry.tube,strut,0,.09,0,.77,.16,.5);
      const ring=mesh(g,geometry.torus,amber,0,.17,0,.64,.42,1);ring.rotation.x=-Math.PI/2;
      if(paw){body(g,enamel,0,.19,.03,.24,.042,.20);for(let i=0;i<4;i++)body(g,enamel,(i-1.5)*.125,.19,-.15-Math.sin((i+.5)*Math.PI/4)*.15,.074,.032,.088);}
      else for(const d of [-.17,.17])body(g,enamel,d,.19,0,.095,.045,.23);
      return ring;
    }
    const bootPad=padPrint(.84,false),dogPad=padPrint(-1.63,true);
    const beacon=group(projector);beacon.position.set(1.2,0,-2.1);lampBase(beacon,.73);
    for(let i=0;i<3;i++){const a=tau*i/3;rod(beacon,enamel,.22*Math.cos(a),.86,.22*Math.sin(a),.56*Math.cos(a),.27,.56*Math.sin(a),.055);}
    mesh(beacon,geometry.tube,deep,0,.62,0,.34,.59,.34);
    mesh(beacon,geometry.tube,copper,0,.91,0,.46,.12,.46);
    body(beacon,turquoise,0,1,0,.39,.19,.39);
    const projectionMat=new T.MeshBasicMaterial({color:0x8bdbe9,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
    const shaft=mesh(beacon,new T.ConeGeometry(.81,1.5,24,1,true),projectionMat,0,1.84,0);
    shaft.rotation.z=Math.PI;shaft.castShadow=false;
    const constellationParts=[false,false,false],constellationTiles=[],mapSockets=[],mapColours=[amber,turquoise,copper];
    const mapRack=group(projector);mapRack.name='Üç gerçek yıldız kartının yuvalı harita panosu';mapRack.position.set(1.70,1.50,-1.06);box(mapRack,enamel,0,0,0,4.55,1.47,.22);box(mapRack,strut,0,0,.13,4.33,1.27,.08);for(const xx of[-1.95,1.95])rod(projector,strut,1.70+xx,.2,-1.15,1.70+xx,1.50,-1.15,.065);
    const cardShape=new T.Shape();cardShape.moveTo(-.57,-.53);cardShape.lineTo(.57,-.53);cardShape.lineTo(.57,.35);cardShape.lineTo(.38,.54);cardShape.lineTo(-.57,.54);cardShape.closePath();const cardGeometry=new T.ExtrudeGeometry(cardShape,{depth:.095,bevelEnabled:true,bevelThickness:.025,bevelSize:.026,bevelSegments:1,steps:1});cardGeometry.translate(0,0,-.045);
    const starShape=new T.Shape();for(let n=0;n<10;n++){const a=Math.PI*.5+n*Math.PI/5,r=n%2?.10:.23;if(n)starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r);else starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}starShape.closePath();const mapStarGeometry=new T.ExtrudeGeometry(starShape,{depth:.025,bevelEnabled:true,bevelThickness:.009,bevelSize:.008,bevelSegments:1,steps:1});
    for(let i=0;i<3;i++){
      const sx=-3.8+i*1.57,tile=group(projector);tile.name='Elde taşınan yıldız haritası kartı '+(i+1);tile.position.set(sx,.88,.68);mesh(tile,cardGeometry,enamel,0,0,0);box(tile,deep,-.015,0,.076,1.04,.94,.025);box(tile,mapColours[i],-.40,.39,.104,.22,.11,.025);mesh(tile,mapStarGeometry,mapColours[i],.04,.06,.11);
      for(let n=0;n<3;n++){const xx=-.33+n*.31,yy=-.28+(n%2)*.14;body(tile,lamp,xx,yy,.12,.046,.046,.018);if(n<2)rod(tile,enamel,xx,yy,.108,xx+.31,-.28+((n+1)%2)*.14,.108,.014);}if(world.batchStation)world.batchStation(tile);
      const socket=group(mapRack);socket.position.set((i-1)*1.45,0,.22);mesh(socket,cardGeometry,rubber,0,0,0,1.08,1.08,.6);mesh(socket,mapStarGeometry,mapColours[i],.04,.06,.07);box(socket,mapColours[i],-.40,.39,.08,.22,.11,.03);mapSockets.push(socket);
      const tray=group(projector);tray.position.set(sx,.24,.62);box(tray,enamel,0,0,0,1.30,.12,.48);rod(tray,copper,-.48,.04,.10,-.48,.22,.10,.035);rod(tray,copper,.48,.04,.10,.48,.22,.10,.035);if(world.batchStation)world.batchStation(tray);
      constellationTiles.push({g:tile,x:sx,home:new T.Vector3(sx,.88,.68),dock:new T.Vector3(1.70+(i-1)*1.45,1.50,-.69),amount:0});
    }
    if(world.batchStation)world.batchStation(mapRack);
    const starGesture={owner:null,index:-1,moved:false,startX:0,startY:0,offsetX:0,offsetY:0},starPoint=new T.Vector3();let selectedStar=-1;
    function releaseStar(){starGesture.owner=null;starGesture.index=-1;starGesture.moved=false;}
    function starPointer(type,p,event){const id=event?.pointerId??'primary';if(type==='cancel'){if(!event||starGesture.owner===id)releaseStar();return false;}if(starGesture.owner!==null){if(id!==starGesture.owner)return true;if(type==='move'||type==='up'){const i=starGesture.index,q=constellationTiles[i];if(p){if(Math.hypot(p.x-starGesture.startX,p.y-starGesture.startY)>.10)starGesture.moved=true;if(starGesture.moved){const c=M.camera,z=projector.position.z+q.g.position.z,k=(c.position.z-z)/c.position.z;q.g.position.x=M.clamp(c.position.x+(p.x-c.position.x)*k-projector.position.x+starGesture.offsetX,-4.6,4);q.g.position.y=M.clamp(c.position.y+(p.y-c.position.y)*k-projector.position.y+starGesture.offsetY,.55,3);}if(type==='up'&&starGesture.moved&&controlHit(p,mapSockets[i],.74,.80))placeStarTile(i);}if(type==='up')releaseStar();return true;}return true;}if(type!=='down'||!p||player.locked||mission.constellation||Math.abs(player.x-451)>11)return false;if(selectedStar>=0&&!constellationParts[selectedStar]&&controlHit(p,mapSockets[selectedStar],.74,.80)){placeStarTile(selectedStar);return true;}for(let i=0;i<3;i++)if(!constellationParts[i]&&M.touchPlayPart(p,constellationTiles[i].g,.14)){const q=constellationTiles[i],c=M.camera,z=projector.position.z+q.g.position.z,k=(c.position.z-z)/c.position.z;starGesture.owner=id;starGesture.index=i;starGesture.moved=false;starGesture.startX=p.x;starGesture.startY=p.y;starGesture.offsetX=q.g.position.x-(c.position.x+(p.x-c.position.x)*k-projector.position.x);starGesture.offsetY=q.g.position.y-(c.position.y+(p.y-c.position.y)*k-projector.position.y);selectedStar=i;M.sfx('select');return true;}return false;}
    let constellation=0,lit=false;
    function placeStarTile(i){if(constellationParts[i])return;constellationParts[i]=true;selectedStar=-1;M.sfx('snap');}
    function showStars(){if(lit||!constellationParts.every(Boolean))return;lit=true;complete('constellation',451);M.sfx('constellation');}
    function stargaze(dt){
      const onBoot=Math.abs(player.x-projector.position.x-.84)<1.6, onPaw=Math.abs(dog.x-projector.position.x+1.63)<2.3;
      bootPad.material=onBoot||lit?lamp:amber;dogPad.material=onPaw||lit?lamp:amber;
      if(onBoot&&onPaw&&player.grounded)showStars();
      let assembled=0;for(let i=0;i<3;i++){if(constellationParts[i])assembled++;const q=constellationTiles[i];q.amount=M.damp(q.amount,constellationParts[i]?1:0,3.5,dt);if(starGesture.index!==i){q.g.position.lerp(constellationParts[i]?q.dock:q.home,1-Math.exp(-dt*5));}q.g.rotation.z=0;q.g.visible=true;}
      constellation=M.damp(constellation,lit?1:assembled*.24,2.3,dt);
      chart.visible=shaft.visible=constellation>.008;
      projectionMat.opacity=.075*constellation;
      links.count=Math.min(curve.length-1,Math.floor(curve.length*constellation));
      if(chart.visible){chart.scale.setScalar(.42+.38*constellation);stars.count=Math.ceil(curve.length*constellation);chart.position.y=3.35+.10*constellation+.035*Math.sin(clock*1.3);}
    }
    // In the dune valley, Bilbo can uncover a geode just by walking past it.
    // The two matching halves turn their mineral bands towards the camera.
    const geode=station(154,'Bilbo’nun kristalli taşı');
    const stoneMat=new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.81,side:T.DoubleSide});
    const stoneHalves=[];
    const bandColors=[0x34496b,0x53727f,0x80b4ad,0x33647b,0xcf9c72];
    const stoneOrigin=.76;
    function geodeHalf(side){
      const positions=[],colors=[], indices=[];
      const color=new T.Color();
      const segments=15;
      function ring(radius,depth,tint,variation){
        const first=positions.length/3;
        for(let i=0;i<segments;i++){
          const a=i*tau/segments,edge=1+.065*Math.sin(a*3+.7)+.055*Math.cos(a*5);
          const shellNoise=depth*.035*Math.sin(a*4+side);
          positions.push(side*(depth+shellNoise),Math.cos(a)*radius*edge*.76,Math.sin(a)*radius*edge*.88);
          color.setHex(tint).multiplyScalar(1+variation*Math.sin(a*7+.7));
          colors.push(color.r,color.g,color.b);
        }
        if(first)for(let i=0;i<segments;i++){
          const j=(i+1)%segments,a=first-segments+i,b=first-segments+j;
          if(side<0)indices.push(a,a+segments,b,b,a+segments,b+segments);
          else indices.push(a,b,a+segments,b,b+segments,a+segments);
        }
      }
      // Inner face, agate rim and basalt shell use one vertex-coloured mesh.
      for(let i=0;i<5;i++)ring([.001,.49,.66,.76,.89][i],[-.008,-.022,-.012,-.018,0][i],bandColors[i],.11);
      ring(1,.04,0xa47354,.19);
      ring(.94,.47,0x876451,.17);
      ring(.74,.87,0x76574f,.20);
      ring(.38,1.07,0x836454,.16);
      ring(.001,1.16,0x725447,.15);
      const shape=new T.BufferGeometry();
      shape.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      shape.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      shape.setIndex(indices);shape.computeVertexNormals();
      return mesh(geode,shape,stoneMat,side*.025,stoneOrigin,0);
    }
    stoneHalves.push(geodeHalf(-1),geodeHalf(1));
    const mineral=group(geode);
    const points=[],rows=[[-.22,.56],[.13,1],[.66,.83],[1,.035]],indices=[];
    for(let j=0;j<rows.length;j++)for(let i=0;i<6;i++){
      const a=i*tau/6,r=rows[j][1]*.21;
      points.push(Math.cos(a)*r,rows[j][0],Math.sin(a)*r);
      if(j+1<rows.length){const p=j*6+i,q=j*6+(i+1)%6;indices.push(p,p+6,q,q,p+6,q+6);}
    }
    const facet=new T.BufferGeometry();
    facet.setAttribute('position',new T.Float32BufferAttribute(points,3));
    facet.setIndex(indices);facet.computeVertexNormals();
    const crystalMat=new T.MeshStandardMaterial({flatShading:true,roughness:.25,metalness:.18,emissive:0x36566a,emissiveIntensity:.27});
    const shards=new T.InstancedMesh(facet,crystalMat,13);
    mineral.add(shards);mineral.position.y=.12;
    // The crystals grow from a dark rind that stays on the ground as the halves open.
    const cradle=mesh(mineral,new T.IcosahedronGeometry(1,0),mat(0x665766,.06,.86),0,.065,0,1.04,.24,.65);
    cradle.rotation.y=.4;
    const crystalPose=new T.Object3D(),tint=new T.Color(),palette=[0x66ede1,0x9fbbff,0xffbb7d];
    for(let i=0;i<13;i++){
      const a=i*2.4,r=i===0?0:.18+.46*Math.sqrt(i/12),x=Math.cos(a)*r,z=Math.sin(a)*r*.63;
      crystalPose.position.set(x,.23-Math.abs(x)*.16,z);
      crystalPose.rotation.set(z*.61,a,x*-.74);
      crystalPose.scale.set(.83+(i%3)*.14,i===0?1.28:.68+(i%5)*.12,1);
      crystalPose.updateMatrix();shards.setMatrixAt(i,crystalPose.matrix);
      shards.setColorAt(i,tint.setHex(palette[x<-.22?0:x>.23?2:1]));
    }
    const glints=new T.InstancedMesh(new T.OctahedronGeometry(1),new T.MeshBasicMaterial({color:0xffefbe}),8);
    glints.frustumCulled=false;glints.instanceMatrix.setUsage(T.DynamicDrawUsage);geode.add(glints);
    // Upload this tiny effect during the loading render. Zero-sized stars keep
    // the unrevealed stone quiet before its first update.
    crystalPose.scale.setScalar(0);crystalPose.updateMatrix();
    for(let i=0;i<glints.count;i++)glints.setMatrixAt(i,crystalPose.matrix);
    mineral.scale.setScalar(.16);
    let openedAt=-Infinity,ringAt=-Infinity;
    function ringStone(offset=0){
      if(clock-ringAt<.75)return;
      ringAt=clock;
      if(!Number.isFinite(openedAt)){openedAt=clock;M.sfx('bloom');}
      else M.sfx('saturn-chime-'+(offset<-.38?0:offset>.38?2:1));
    }
    function updateGeode(){
      geode.visible=Math.abs(player.x-geode.position.x)<37;
      if(!geode.visible)return;
      if(!Number.isFinite(openedAt)&&!player.locked&&Math.min(Math.abs(player.x-154),Math.abs(dog.x-154))<3.3)ringStone();
      const age=clock-openedAt,shake=Number.isFinite(openedAt)&&age<.42?Math.sin(age*36)*Math.sin(Math.PI*age/.42)*.047:0;
      const amount=Number.isFinite(openedAt)?M.clamp((age-.16)/1.25,0,1):0;
      const open=amount*amount*(3-2*amount);
      for(let i=0;i<2;i++){
        const sign=i===0?-1:1,o=stoneHalves[i];
        o.position.x=sign*(.025+.86*open)+shake;
        o.position.y=stoneOrigin-.15*open;
        o.rotation.set(-.15*open,sign*.90*open,sign*(-.21*open+shake));
      }
      mineral.scale.setScalar(.16+.84*open);
      const echo=clock-ringAt;
      glints.visible=echo<2.1 && open>.06;
      if(!glints.visible)return;
      for(let i=0;i<glints.count;i++){
        const u=M.clamp((echo-i*.075)/1.48,0,1),a=i*2.39996;
        const flash=Math.sin(Math.PI*u);
        crystalPose.position.set(Math.cos(a)*(.24+u*.91),.91+u*1.22+.28*Math.sin(a),.30+Math.sin(a)*.35);
        crystalPose.rotation.set(0,0,a+u*.8);
        crystalPose.scale.set(.054*flash,.123*flash,.045*flash);
        crystalPose.updateMatrix();glints.setMatrixAt(i,crystalPose.matrix);
      }
      glints.instanceMatrix.needsUpdate=true;
    }


    // Science responds to the actual visible part, with a small finger allowance.
    function tryHere(point){
      if(player.locked)return false;
      if(solarTouch(point)||waterTouch(point)||aerostat.touch(point)||samples.touch(point))return true;
      const near=(g)=>Math.abs(player.x-g.position.x)<11;
      // The geode is scenery, never a touch target.
      if(near(pad))for(let i=0;i<surveyTargets.length;i++){const q=surveyTargets[i];if(!q.seen&&(!point||M.touchPlayPart(point,q.specimen,.22))){launch(i);return true;}}
      if(near(pad)&&!mission.heli&&(!point||M.touchPlayPart(point,craft,.20))){launch();return true;}
      if(gardenTouch(point))return true;
      if(near(projector)&&!mission.constellation){
        if(!point){const i=constellationParts.indexOf(false);if(i>=0){if(selectedStar===i)placeStarTile(i);else{selectedStar=i;M.sfx('select');}return true;}}
        if(constellationParts.every(Boolean)&&(!point||controlHit(point,bootPad,.75,.50))){showStars();return true;}
      }
      return false;
    }
    // The host may forward discovery-owned pointer events here. Other science
    // keeps its existing direct down-tap behavior; only real greenhouse seeds
    // acquire a drag. Old touch(point) callers retain the separate two-tap path.
    function pointer(type,p,event){
      if(type==='down')teachingIdle=0;
      if(aerostat.pointer(type,p,event)||solarPointer(type,p,event)||waterPointer(type,p,event)||starPointer(type,p,event))return true;
      const id=event?.pointerId??'primary';
      if(type==='cancel'){if(!event||seedGesture.owner===id)releaseSeed();return false;}
      if(type==='move'||type==='up'){
        if(seedGesture.owner!==id||seedGesture.index<0)return false;
        if(!p){if(type==='up')releaseSeed();return false;}
        if(Math.hypot(p.x-seedGesture.startX,p.y-seedGesture.startY)>.10)seedGesture.moved=true;
        if(seedGesture.moved){seedGesture.x=M.clamp(p.x-gardenX,-5.7,4.3);seedGesture.y=M.clamp(p.y-garden.position.y,.40,3.65);}
        if(type==='up'){
          const i=seedGesture.index,x=p.x-gardenX,y=p.y-garden.position.y;
          if(seedGesture.moved&&Math.abs(x-(1.25+(i-1)*.87))<.58&&Math.abs(y-.68)<.95)plantSeed(i);
          releaseSeed();
        }
        return true;
      }
      if(type!=='down'||!p)return false;
      if(seedGesture.owner!==null)return true;
      if(!player.locked&&Math.abs(player.x-gardenX)<=11){
        const x=p.x-gardenX,y=p.y-garden.position.y;let best=-1,score=Infinity;
        for(let i=0;i<3;i++)if(!seedsPlanted[i]){const seed=seedObjects[i],dx=(x-seed.position.x)/.44,dy=(y-seed.position.y)/.68,d=dx*dx+dy*dy;if(Math.abs(dx)<1&&Math.abs(dy)<1&&d<score){best=i;score=d;}}
        if(best>=0){selectedSeed=best;hintedSeed=-1;seedHint=0;seedReturns[best].age=1;seedGesture.owner=id;seedGesture.index=best;seedGesture.startX=p.x;seedGesture.startY=p.y;seedGesture.x=seedObjects[best].position.x;seedGesture.y=seedObjects[best].position.y;seedGesture.moved=false;M.sfx('select');return true;}
      }
      return tryHere(p);
    }
    const lessons=[...(aerostat.lessons||[]),...(samples.lessons||[])];
    function lesson(id,node,goal,completed,describe){lessons.push({id,x:node.position.x,y:node.position.y,goal,range:10,completed,enabled:()=>!player.locked,describe});}
    function tapStep(step,x,y,z){step.action='tap';step.from.set(x,y,z);step.to.copy(step.from);}
    lesson('mars-solar',solar,'light',()=>mission.power,step=>{
      const q=solarWings.find(q=>!q.on);step.sourceIcon=q?'solar-panel':'plug';step.progress=solarWings.filter(q=>q.on).length+(plugged?1:0);step.total=3;
      if(q){tapStep(step,95+q.side*(.12+1.05*Math.cos(q.g.rotation.z)),solar.position.y+2.05+q.side*1.05*Math.sin(q.g.rotation.z),-1.3);}else{step.action='drag';step.demoObject=solarPlug;solarPlug.getWorldPosition(step.from);solarSocket.getWorldPosition(step.to);}return true;
    });
    lesson('mars-water',waterLab,'water-sample',()=>mission.water,step=>{
      step.sourceIcon=waterState.mirror?(waterState.valve?'lid':'valve'):'mirror';step.progress=Number(waterState.mirror)+Number(waterState.valve)+Number(waterState.sealed);step.total=3;step.action='tap';
      if(!waterState.mirror){mirror.getWorldPosition(step.from);step.to.copy(step.from);}
      else if(!waterState.valve){step.action='turn';valve.localToWorld(step.from.set(.40,0,.10));valve.getWorldPosition(waterPoint);const a=valveAmount*1.35,b=1.35;step.to.set(waterPoint.x+Math.cos(b)*.40,waterPoint.y+Math.sin(b)*.40,step.from.z);if(step.pivot)step.pivot.copy(waterPoint);step.centerX=waterPoint.x;step.centerY=waterPoint.y;step.radius=.40;step.startAngle=a;step.endAngle=b;}
      else{step.action=waterState.fill>.88?'drag':'wait';step.demoObject=cap;cap.getWorldPosition(step.from);capDock.getWorldPosition(step.to);}return true;
    });
    lesson('mars-helicopter',pad,'helicopter',()=>mission.heli,step=>{
      const i=surveyTargets.findIndex(q=>!q.seen);if(i<0)return false;step.sourceIcon='rock';step.progress=surveyTargets.filter(q=>q.seen).length;step.total=3;surveyTargets[i].g.getWorldPosition(step.from);step.from.y+=.85;step.to.copy(step.from);if(survey.active>=0)step.action='wait';return true;
    });
    lesson('mars-greenhouse',garden,'flowers',()=>mission.garden,step=>{
      const i=seedsPlanted.indexOf(false);step.progress=(seedsPlanted.every(Boolean)?1:0)+(watered?1:0);step.total=2;
      if(i>=0){step.action='drag';step.demoObject=seedObjects[i];step.sourceIcon='seed';seedObjects[i].getWorldPosition(step.from);garden.localToWorld(step.to.set(1.25+(i-1)*.87,.68,.5));}
      else if(watered<3||!shadeOpen){step.action=watered<3?'press':'wait';step.sourceIcon='pump';handle.getWorldPosition(step.from);step.to.copy(step.from);step.to.y-=.32;}
      else{step.sourceIcon='valve';crank.getWorldPosition(step.from);step.to.copy(step.from);}return true;
    });
    lesson('mars-constellation',projector,'stars',()=>mission.constellation,step=>{
      const i=constellationParts.indexOf(false);step.progress=constellationParts.filter(Boolean).length;step.total=4;step.sourceIcon='tile';
      if(i>=0){step.action='drag';step.demoObject=constellationTiles[i].g;constellationTiles[i].g.getWorldPosition(step.from);mapSockets[i].getWorldPosition(step.to);}else{step.action='tap';projector.localToWorld(step.from.set(.84,.22,0));step.sourceIcon='footsteps';step.to.copy(step.from);}return true;
    });
    for(const entry of lessons){if(entry.id==='mars-solar')entry.demoSources=[solarPlug];else if(entry.id==='mars-greenhouse')entry.demoSources=seedObjects;else if(entry.id==='mars-water')entry.demoSources=[cap];else if(entry.id==='mars-constellation')entry.demoSources=constellationTiles.map(q=>q.g);}
    const discoveryState={power:false,water:false,samples:false,solarWings:[false,false],seedsPlanted,watered:0,shadeOpen:false,garden:false,constellationParts,constellation:false,heliVisited:[false,false,false],heli:false,waterMirror:false,waterValve:false,waterSealed:false};
    return {lessons,touch:tryHere,pointer,dispose(){releaseSeed();releasePlug();releaseWater();releaseStar();aerostat.dispose();},weatherPost:aerostat.state,interact:()=>tryHere(null),state(){discoveryState.power=mission.power;discoveryState.water=mission.water;discoveryState.samples=mission.samples;discoveryState.watered=watered;discoveryState.shadeOpen=shadeOpen;discoveryState.garden=!!mission.garden;discoveryState.constellation=!!mission.constellation;discoveryState.heli=!!mission.heli;for(let i=0;i<3;i++)discoveryState.heliVisited[i]=surveyTargets[i].seen;for(let i=0;i<2;i++)discoveryState.solarWings[i]=solarWings[i].on;discoveryState.waterMirror=waterState.mirror;discoveryState.waterValve=waterState.valve;discoveryState.waterSealed=waterState.sealed;return discoveryState;},update(dt,t){
      teachingIdle=Math.abs(player.vx)>.4?0:teachingIdle+dt;teaching.visible=false;
      clock=t;solarUpdate(dt);waterUpdate(dt);aerostat.update(dt,t);samples.update(dt,t);updateGeode();
      pad.visible=Math.abs(player.x-pad.position.x)<33;garden.visible=Math.abs(player.x-garden.position.x)<33;projector.visible=Math.abs(player.x-projector.position.x)<33;
      if(pad.visible)fly(dt);if(garden.visible)grow(dt);if(!player.locked&&!mission.garden&&Math.abs(player.x-gardenX)<8){const tx=Math.max(gardenX-6.6,player.x-3.6);M.parkForActivity(tx,tx-1.6,1);}if(projector.visible)stargaze(dt);
      if(!player.locked){
        let targetX=0,targetY=0,show=false;
        if(Math.abs(player.x-95)<10&&!mission.power){
          const wing=solarWings.find(q=>!q.on);
          if(wing){targetX=95+wing.side*(.12+1.05*Math.cos(wing.g.rotation.z));targetY=solar.position.y+2.05+wing.side*1.05*Math.sin(wing.g.rotation.z);}
          else{solarPlug.getWorldPosition(controlCenter);targetX=controlCenter.x;targetY=controlCenter.y;}
          show=true;M.parkForActivity(91.5,90.0,1);frameStation(91.6,99.5,solar.position.y+1.85,1.14);
        }else if(Math.abs(player.x-gardenX)<10&&!mission.garden){
          const i=selectedSeed>=0?selectedSeed:seedsPlanted.indexOf(false);
          if(i>=0){const u=selectedSeed>=0?1:M.clamp((clock%4-.8)/2,0,1),v=u*u*(3-2*u);targetX=gardenX+M.lerp(-4.7+i*.8,1.25+(i-1)*.87,v);targetY=garden.position.y+.68+.5*Math.sin(v*Math.PI);}
          else if(watered<3){targetX=gardenX-1.72;targetY=garden.position.y+.94;}
          else{targetX=gardenX+2.90;targetY=garden.position.y+3;}
          show=true;frameStation(gardenX-5.8,gardenX+4.8,garden.position.y+1.88,1.12);
        }else if(Math.abs(player.x-366)<10&&!mission.water){
          if(!waterState.mirror)mirror.getWorldPosition(controlCenter);else if(!waterState.valve)valve.localToWorld(controlCenter.set(.40,0,.10));else cap.getWorldPosition(controlCenter);targetX=controlCenter.x;targetY=controlCenter.y;
          show=true;M.parkForActivity(362.5,360.9,1);frameStation(363.2,369.6,waterLab.position.y+1.88,1.15);
        }else if(Math.abs(player.x-451)<10&&!mission.constellation){
          const i=constellationParts.indexOf(false);targetX=451+(i>=0?constellationTiles[i].x:.84);targetY=projector.position.y+1.08;show=true;if(i>=0)M.parkForActivity(445.7,444.1,1);frameStation(446.2,455.5,projector.position.y+2.35,1.02);
        }else if(Math.abs(player.x-118)<10&&!mission.heli&&survey.active<0){
          // Landscape iPad: keep the whole coaxial helicopter (rotor tips included) in view while Feza waits beside it.
          frameStation(112.4,121.4,pad.position.y+2.2,.94);
        }
        teaching.visible=!M.playGuideActive&&show&&teachingIdle>3;
        if(teaching.visible){teaching.position.set(targetX,targetY+Math.sin(clock*3)*.05,.8);}
      }

    }};
  };
})(window.MARS);
