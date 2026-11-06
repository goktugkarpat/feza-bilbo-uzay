(function () {
  'use strict';
  const M = window.MARS;
  M.createActivities = function ({ scene, world, actors, player, dog }) {
    const T = window.THREE;
    const root = new T.Group(); root.name = 'Tactile Mars adventures'; scene.add(root);
    const mat = (c, e, metal) => new T.MeshStandardMaterial({ color: c, emissive: e || 0x000000, emissiveIntensity: e ? .3 : 0, metalness: metal || .08, roughness: .49 });
    const C = { white:mat(0xf2f2e9), teal:mat(0x38cfc3,0x0b574d), orange:mat(0xffaa48,0x572800), dark:mat(0x26364c), black:mat(0x101b2b), sand:mat(0xbc6446), gold:mat(0xffda69,0x806200), blue:mat(0x86dcff,0x124e6a), silver:mat(0xb7c9d4,null,.45), red:mat(0xff6e5e), green:mat(0xa2f0a3,0x245633),cells:mat(0x285793,0x102447,.35) };
    C.cells.roughness=.37;
    for (const name of ['white','teal','orange','dark','silver','red']) M.WorkshopArt.paint(C[name], name==='silver'?'metal':'enamel');
    C.sand.map=world.materials?.ground?.map||M.WorkshopArt.surface('metal');C.sand.color.setHex(0xe7ba9b);
    const ghostMat = new T.MeshStandardMaterial({color:0x80e8e4,emissive:0x45bcb9,emissiveIntensity:.3,transparent:true,opacity:.22,roughness:.5,depthWrite:false});
    const glassMat = new T.MeshStandardMaterial({color:0xc5eff5,transparent:true,opacity:.16,roughness:.13,metalness:.05,depthWrite:false});
    function plugShape(){const s=new T.Shape();s.moveTo(-.33,.34);s.lineTo(.33,.34);s.quadraticCurveTo(.47,.34,.45,.18);s.lineTo(.32,-.27);s.quadraticCurveTo(.29,-.39,.15,-.40);s.lineTo(-.15,-.40);s.quadraticCurveTo(-.29,-.39,-.32,-.27);s.lineTo(-.45,.18);s.quadraticCurveTo(-.47,.34,-.33,.34);const g=new T.ExtrudeGeometry(s,{depth:.44,bevelEnabled:true,bevelThickness:.065,bevelSize:.055,bevelSegments:2,steps:1,curveSegments:7});g.translate(0,0,-.22);return g;}
    function roundedBox(){const g=new T.BoxGeometry(1,1,1,3,3,3),p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=M.clamp(x,-.41,.41),b=M.clamp(y,-.41,.41),c=M.clamp(z,-.41,.41),dx=x-a,dy=y-b,dz=z-c,l=Math.hypot(dx,dy,dz)||1;p.setXYZ(i,a+dx/l*.09,b+dy/l*.09,c+dz/l*.09);n.setXYZ(i,dx/l,dy/l,dz/l);}return g;}
    const geo={sphere:new T.SphereGeometry(1,16,12),cyl:new T.CylinderGeometry(1,1,1,20),box:roundedBox(),torus:new T.TorusGeometry(1,.11,8,40)};
    const movers=[player,dog]; const sparks=[];const starGeometries=new Map();
    let elapsed=0, idle=0, selected=-1, drag=null, noteClock=0;
    const pickRay=new T.Raycaster(),pickNdc=new T.Vector2(),partHits=[];
    const done=[false,false,false];
    // One visit's physical discoveries feed the science camp. Nothing is persisted.
    const mission=world.marsMission||(world.marsMission={power:false,water:false,samples:false,garden:false,balloon:false,constellation:false});
    function call(n,...a){if(typeof M[n]==='function')M[n](...a);}
    function ground(x){return world.ground(x);}
    function mesh(g,m,p,s,parent=root){const o=new T.Mesh(g,m);o.position.set(...p);if(s)o.scale.set(...s);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
    function ball(p,s,m,parent){return mesh(geo.sphere,m,p,s,parent);}
    function box(p,s,m,parent){return mesh(geo.box,m,p,s,parent);}
    function cyl(p,s,m,parent){return mesh(geo.cyl,m,p,s,parent);}
    function hoop(p,r,m,parent=root){const o=mesh(geo.torus,m,p,[r,r,r],parent);return o;}
    function tube(a,b,r,m,parent){const mid=a.map((v,i)=>(v+b[i])/2), d=new T.Vector3().fromArray(b).sub(new T.Vector3().fromArray(a));const o=cyl(mid,[r,d.length(),r],m,parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
    function paw(parent,x,y,z,s,m=C.white){ball([x,y-.08*s,z],[.23*s,.2*s,.08*s],m,parent);[[-.22,.21],[-.08,.32],[.1,.31],[.24,.18]].forEach(q=>ball([x+q[0]*s,y+q[1]*s,z],[.105*s,.12*s,.07*s],m,parent));}
    function star(parent,x,y,z,s,m=C.gold){let g=starGeometries.get(s);if(!g){const sh=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.44*s:s,px=Math.cos(a)*r,py=Math.sin(a)*r;i?sh.lineTo(px,py):sh.moveTo(px,py);}sh.closePath();g=new T.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:true,bevelThickness:.04,bevelSize:.03,bevelSegments:1,steps:1});starGeometries.set(s,g);}const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}

    function triangle(parent,x,y,z,s,m=C.white,rot=0){const sh=new T.Shape();sh.moveTo(-.4,-.55);sh.lineTo(.6,0);sh.lineTo(-.4,.55);sh.closePath();const o=new T.Mesh(new T.ShapeGeometry(sh),m);o.position.set(x,y,z);o.scale.setScalar(s);o.rotation.z=rot;parent.add(o);return o;}
    function marker(x,y){const g=new T.Group();g.position.set(x,y,.5);root.add(g);const hand=M.WorkshopArt.hand(g,.82);hand.position.set(.1,.52,.1);return g;}
    function hit(p,x,y,r){return Math.hypot(p.x-x,p.y-y)<r;}
    function nearby(x,r=15){return Math.abs(player.x-x)<r;}
    function note(s,t=4){call('notify',s,t);}
    function sound(n){call('sfx',n);}
    function task(i){if(!done[i])setTaxiPad(i);done[i]=true;call('celebrate',player.x,player.y+1);}
    function burst(x,y,m=C.gold,count=12){for(let i=0;i<count;i++){const s=sparks.find(q=>q.life<=0);if(!s)break;s.life=1.2;s.o.visible=true;s.o.material=m;s.o.position.set(x,y,.8);const a=(i/count)*Math.PI*2;s.vx=Math.cos(a)*(1.3+(i%3)*.6);s.vy=1.8+Math.sin(a)*1.5;s.vz=((i%3)-1)*.4;}}
    for(let i=0;i<42;i++){const o=ball([0,-20,0],[.09,.09,.09],C.gold);o.visible=false;sparks.push({o,life:0,vx:0,vy:0,vz:0});}

    // Three optional rewards teach the low-gravity hop by sight, with no new UI or task.

    // A permanent, three-piece friend: discover one piece, then match its silhouette.
    const rg=ground(70),robotX=72.2,robotMoundXs=[67.1,69.9,76.2];
    const scanner=new T.Group();scanner.position.set(64.7,rg,-2.1);root.add(scanner);
    cyl([0,.2,0],[.72,.35,.64],C.dark,scanner);cyl([0,1.1,0],[.12,1.9,.12],C.silver,scanner);
    const dish=new T.Group();dish.position.y=2.1;scanner.add(dish);ball([0,0,0],[.82,.58,.22],C.white,dish);hoop([0,0,.2],.65,C.orange,dish);tube([0,0,.18],[.12,.1,.85],.04,C.dark,dish);ball([.12,.1,.85],[.13,.13,.13],C.teal,dish);
    const bot=new T.Group();bot.name='Robot assembly base';bot.position.set(robotX,rg,-1.4);root.add(bot);
    box([0,1.08,0],[1.3,.94,.76],C.white,bot);box([0,.56,0],[1.0,.22,.65],C.teal,bot);ball([0,1.08,.405],[.46,.46,.06],C.dark,bot);
    [-1,1].forEach(s=>{tube([s*.34,.64,0],[s*.39,.16,0],.14,C.dark,bot);box([s*.39,.15,.12],[.43,.25,.65],C.white,bot);});
    const robotLights=[-.3,0,.3].map(x=>ball([x,.62,.40],[.065,.065,.035],C.dark,bot));
    const robotEyes=[],botArms=[];let botHeart=null,botAntenna=null;
    const robotGhostMats=[0x55d8cd,0xffc064,0x9bdff1].map(c=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.2,transparent:true,opacity:.19,roughness:.6,depthWrite:false}));
    function makeRobotPiece(i,parent,ghost){const m=ghost?robotGhostMats[i]:null;
      if(i===0){box([0,0,0],[1.45,.9,.77],m||C.teal,parent);ball([0,0,.44],[.60,.31,.075],m||C.dark,parent);
        [-.32,.32].forEach(x=>{const lid=ball([x,.05,.52],[.13,.025,.055],m||C.white,parent);if(!ghost){hoop([x,.05,.54],.16,C.silver,parent);const pupil=ball([x+.025,.07,.57],[.05,.055,.025],C.blue,parent);pupil.visible=false;robotEyes.push({lid,pupil});}});
        if(!ghost){const curve=new T.CatmullRomCurve3([new T.Vector3(-.21,-.13,.53),new T.Vector3(0,-.21,.53),new T.Vector3(.21,-.13,.53)]);mesh(new T.TubeGeometry(curve,12,.025,5,false),C.white,[0,0,0],null,parent);}
        tube([0,.4,0],[0,.8,0],.05,m||C.dark,parent);const a=ball([0,.85,0],[.15,.15,.15],m||C.dark,parent);if(!ghost)botAntenna=a;
      }else if(i===1){box([0,0,0],[.78,.72,.34],m||C.orange,parent);box([0,.36,0],[.78,.11,.36],m||C.silver,parent);cyl([-.21,.48,0],[.10,.17,.10],m||C.gold,parent);cyl([.21,.46,0],[.105,.13,.105],m||C.silver,parent);for(const x of[-.29,.29])box([x,-.03,.19],[.035,.47,.025],m||C.dark,parent);const boltShape=new T.Shape();boltShape.moveTo(.06,.25);boltShape.lineTo(-.17,-.04);boltShape.lineTo(-.03,-.04);boltShape.lineTo(-.10,-.25);boltShape.lineTo(.18,.08);boltShape.lineTo(.04,.08);boltShape.closePath();const boltGeometry=new T.ExtrudeGeometry(boltShape,{depth:.035,bevelEnabled:true,bevelThickness:.01,bevelSize:.008,bevelSegments:1,steps:1});const heart=mesh(boltGeometry,m||C.gold,[0,0,.20],null,parent);if(!ghost)botHeart=heart;
      }else{tube([-.66,.05,0],[.66,.05,0],.075,m||C.silver,parent);tube([-.28,.05,0],[.28,.05,0],.13,m||C.teal,parent);[-1,1].forEach(s=>{const a=new T.Group();a.position.set(s*.74,.05,0);parent.add(a);ball([0,0,0],[.18,.18,.18],m||C.teal,a);tube([0,0,0],[s*.37,-.45,0],.13,m||C.silver,a);ball([s*.4,-.48,.04],[.22,.22,.19],m||C.white,a);if(!ghost)botArms.push(a);});}
    }
    const robotSlots=[{x:0,y:2,z:0},{x:0,y:1.08,z:.43},{x:0,y:1.38,z:0}];
    const robotPieces=[],mounds=[];
    robotMoundXs.forEach((x,i)=>{
      const mg=new T.Group();mg.name='Robot piece soil '+i;mg.position.set(x,ground(x),-1.3);root.add(mg);const pileGeo=new T.IcosahedronGeometry(1,2);const pp=pileGeo.attributes.position;for(let n=0;n<pp.count;n++){const px=pp.getX(n),py=pp.getY(n),pz=pp.getZ(n),k=1+.12*Math.sin(px*12+pz*7)+.06*Math.cos(py*17-pz*9);pp.setXYZ(n,px*k,py*k,pz*k);}pileGeo.computeVertexNormals();mesh(pileGeo,C.sand,[0,.15,0],[1.17,.43,.85],mg);for(let j=0;j<6;j++)mesh(geo.sphere,C.sand,[Math.cos(j*2.3)*.77,.12,Math.sin(j*2.3)*.53],[.16,.12,.15],mg);
      const target=new T.Group();target.position.set(x,ground(x)+.38,-.75);root.add(target);const h=hoop([0,-.26,-.15],.88,C.teal,target);h.visible=false;h.rotation.x=-Math.PI/2;paw(target,0,0,.12,.82,C.white);triangle(target,0,.9,.1,.30,C.teal,-Math.PI/2);
      const ghost=new T.Group(),slot=robotSlots[i];ghost.position.set(slot.x,slot.y,slot.z);bot.add(ghost);makeRobotPiece(i,ghost,true);
      const g=new T.Group();g.name=['Robot head piece','Robot two-terminal battery piece','Robot arm pair piece'][i];root.add(g);makeRobotPiece(i,g,false);
      const home=new T.Vector3(x,ground(x)+(i===0?1.05:i===1?.78:1.08),-1.15);g.position.copy(home);
      const peek=new T.Group();peek.position.set(x,ground(x)+.57,-.35);root.add(peek);peek.rotation.z=(i-1)*.17;
      if(i===0){box([0,0,0],[1.1,.42,.48],C.teal,peek);box([0,.08,.24],[.88,.19,.035],C.dark,peek);for(const side of[-1,1])ball([side*.18,.09,.27],[.07,.07,.025],C.white,peek);}
      else if(i===1){box([0,.025,0],[.42,.27,.29],C.orange,peek);box([0,.19,0],[.21,.08,.17],C.silver,peek);star(peek,0,.03,.17,.13,C.gold);}
      else{tube([-.25,-.07,0],[.18,.13,0],.1,C.silver,peek);ball([.27,.15,.1],[.23,.14,.15],C.white,peek);}
      world.batchStation(peek);world.batchStation(mg);
      const q={peek,index:i,kind:['head','battery','arms'][i],g,home,slot,ghost,dug:false,attached:false,install:null,pop:0};robotPieces.push(q);mounds.push({g:mg,target});
      g.visible=false;target.visible=false;

    });
    const robotSign=new T.Group();robotSign.position.set(robotX-1,rg+3.6,-2.4);root.add(robotSign);
    box([0,0,-.06],[3.52,1.16,.14],C.dark,robotSign);
    M.WorkshopArt.sign(robotSign,['head','battery','robot'],0,0,.025,3.4,1.08);
    for(const side of[-1,1])tube([side*1.57,-.58,-.05],[side*1.57,-2.55,-.05],.055,C.silver,robotSign);
    world.batchStation(robotSign);
    let selectedRobot=-1;
    const robot={phase:'scan',time:0,digIndex:-1,awake:false,lastTap:-10,cheer:0,nudge:0};
    function robotFocus(){let i=robotPieces.findIndex(q=>q.dug&&!q.attached);return i>=0?i:robotPieces.findIndex(q=>!q.attached);}
    function robotPhase(){if(robot.awake)return'awake';if(robot.phase==='dig')return'dig';const i=robotFocus();return i<0?'assemble':robotPieces[i].dug?(i===1?'wake':'assemble'):'search';}
    function robotFeedback(){robot.nudge=2;idle=7;sound('select');}
    function scan(){if(robot.awake){friendlyRobot();return;}if(robot.phase==='dig')return;robot.phase=robotPhase();robot.nudge=2;idle=0;sound('scan');}
    function dig(i){if(robot.awake){friendlyRobot();return;}const q=robotPieces[i];if(!q||robot.phase==='dig'||q.attached)return;if(q.dug){chooseRobot(i);return;}robot.phase='dig';robot.time=0;robot.walk=0;robot.digIndex=i;selectedRobot=-1;dog.activityTargetX=robotMoundXs[i];dog.activityMode='sniff';dog.dig=0;idle=0;sound('dig');}
    function chooseRobot(i){const q=robotPieces[i];if(!q||!q.dug||q.attached||q.install)return;selectedRobot=i;q.pop=.35;robot.nudge=0;idle=0;sound('select');}
    const robotInstallPoint=new T.Vector3();
    function attachRobot(i){
      const q=robotPieces[i];if(!q||!q.dug||q.attached)return;
      if(drag?.kind==='robot'&&drag.i===i)drag=null;
      q.attached=true;q.g.getWorldPosition(robotInstallPoint);bot.worldToLocal(robotInstallPoint);root.remove(q.g);bot.add(q.g);q.g.position.copy(robotInstallPoint);q.install={from:robotInstallPoint.clone(),time:0};q.ghost.visible=false;q.g.scale.setScalar(1);selectedRobot=-1;idle=0;sound('snap');burst(robotX+q.slot.x,rg+q.slot.y,C.teal,8);
    }
    function friendlyRobot(){if(elapsed-robot.lastTap<.65)return;robot.lastTap=elapsed;robot.cheer=2.5;sound('robot');burst(robotX,rg+2.7,C.teal,4);}
    function finishRobot(){if(robot.awake)return;robot.awake=true;robot.phase='awake';robot.cheer=3.5;task(0);sound('success');call('celebrate',robotX,rg+2.1);burst(robotX,rg+2.2,C.gold,18);}
    function robotSlotHit(i,p,dragging=false){if(i===2)return hit(p,robotX-1.05,rg+1.15,dragging?1.05:.8)||hit(p,robotX+1.05,rg+1.15,dragging?1.05:.8)||hit(p,robotX,rg+1.4,1.5);return hit(p,robotX,rg+robotSlots[i].y,dragging?1.3:i===0?1.02:.83);}
    function visibleRobotPiece(event){if(!event||!Number.isFinite(event.clientX)||!M.camera)return-1;const c=M.renderer&&M.renderer.domElement,r=c&&c.getBoundingClientRect();if(!r||!r.width)return-1;pickNdc.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);pickRay.setFromCamera(pickNdc,M.camera);let result=-1,d=Infinity;robotPieces.forEach((q,i)=>{if(!q.dug||q.attached)return;partHits.length=0;pickRay.intersectObject(q.g,true,partHits);if(partHits.length&&partHits[0].distance<d){d=partHits[0].distance;result=i;}});partHits.length=0;return result;}
    function robotPointer(p,event){if(!nearby(70,18))return false;if(robot.awake)return false;
      if(robot.phase==='dig'){if(mounds.some((q,i)=>M.touchPlayPart(p,q.g,.18)||M.touchPlayPart(p,robotPieces[i].peek,.15))||M.touchPlayPart(p,bot,.18)){robotFeedback();return true;}return false;}
      if(selectedRobot>=0&&robotSlotHit(selectedRobot,p)){attachRobot(selectedRobot);return true;}
      let i=visibleRobotPiece(event);if(i<0)i=robotPieces.findIndex(q=>q.dug&&!q.attached&&M.touchPlayPart(p,q.g,.20));
      if(i>=0){chooseRobot(i);drag={kind:'robot',i,id:event?.pointerId,x:p.x,y:p.y,moved:false};return true;}
      for(let n=0;n<3;n++)if(!robotPieces[n].dug&&(M.touchPlayPart(p,mounds[n].g,.18)||M.touchPlayPart(p,mounds[n].target,.18)||M.touchPlayPart(p,robotPieces[n].peek,.15))){dig(n);return true;}
      if(M.touchPlayPart(p,bot,.18)){robotFeedback();return true;}
      if(!M.playGuideActive&&hit(p,64.7,rg+1.8,1.4)){scan();return true;}return false;
    }
    function robotHintTarget(){if(robot.awake||robot.phase==='dig')return null;const i=robotFocus();if(i<0)return null;const q=robotPieces[i];if(!q.dug)return{x:q.home.x,y:ground(q.home.x)+.45};const slot={x:robotX+q.slot.x,y:rg+q.slot.y};if(selectedRobot===i)return i===2?{x:robotX+1.05,y:rg+1.15}:slot;const u=M.clamp(((elapsed%3.6)-.6)/1.8,0,1),v=u*u*(3-2*u);return{x:q.home.x+(slot.x-q.home.x)*v,y:q.home.y+(slot.y-q.home.y)*v+.45*Math.sin(v*Math.PI)};}
    function updateRobot(dt){
      if(robot.phase==='scan'&&nearby(70,12))scan();const focus=robotFocus();
      if(!robot.awake&&nearby(70,15)&&!dog.locked){const q=robotPieces[focus],target=robot.phase==='dig'?robotMoundXs[robot.digIndex]-.76:q&&!q.dug?q.home.x-1.05:q?q.home.x-1.2:robotX-1.1;dog.activityTargetX=target;dog.activityMode=robot.phase==='dig'?'dig':q&&q.dug?'look':'sniff';dog.emote='curious';dog.lookX=.3;dog.lookY=q&&q.dug?.25:-.65;}else if(robot.phase!=='dig'&&!dog.locked){dog.activityTargetX=undefined;dog.activityMode=undefined;dog.emote='';dog.lookX=dog.lookY=0;}
      dish.rotation.y=Math.sin(elapsed*.8)*.3;
      if(robot.phase==='dig'){const i=robot.digIndex,q=robotPieces[i],arrived=Math.abs(dog.x-(q.home.x-.76))<.55&&dog.grounded;robot.walk=(robot.walk||0)+dt;if(arrived||robot.walk>1.4)robot.time+=dt;dog.activityMode=arrived?'dig':'sniff';dog.activityTargetX=q.home.x-.76;const u=M.clamp(robot.time/1.5,0,1);mounds[i].g.scale.y=1-u*.94;
        if(arrived&&Math.floor(robot.time*7)!==Math.floor((robot.time-dt)*7))burst(q.home.x,ground(q.home.x)+.22,C.sand,2);
        if(u>=1){q.dug=true;mounds[i].g.visible=false;q.g.visible=true;q.pop=.5;robot.phase=i===1?'wake':'assemble';robot.walk=0;dog.dig=0;sound('reveal');burst(q.home.x,q.home.y,C.gold,10);idle=0;attachRobot(i);}
      }
      robotPieces.forEach((q,i)=>{q.peek.visible=!q.dug&&robot.phase!=='dig';if(q.install){const a=q.install;a.time+=dt;const u=M.clamp(a.time/.75,0,1),v=u*u*(3-2*u);q.g.position.set(a.from.x+(q.slot.x-a.from.x)*v,a.from.y+(q.slot.y-a.from.y)*v+Math.sin(u*Math.PI)*.75,a.from.z+(q.slot.z-a.from.z)*v);if(u>=1){q.g.position.set(q.slot.x,q.slot.y,q.slot.z);q.install=null;q.pop=.25;robot.phase=robotPhase();}}
        if(q.dug&&!q.attached&&(!drag||drag.kind!=='robot'||drag.i!==i)){q.g.position.copy(q.home);q.g.position.y+=Math.sin(elapsed*1.8+i)*.06;}
        if(q.pop>0){q.pop=Math.max(0,q.pop-dt);q.g.scale.setScalar(1+Math.sin(q.pop*16)*q.pop*.12);}else q.g.scale.setScalar(1);
        q.ghost.visible=!q.attached;robotGhostMats[i].opacity=i===focus&&q.dug?.38+Math.sin(elapsed*3)*.07:.13;
        mounds[i].target.visible=!q.dug&&i===focus&&robot.phase!=='dig';mounds[i].g.visible=!q.dug;robotLights[i].material=q.attached?C.green:C.dark;
      });
      if(!robot.awake&&robotPieces.every(q=>q.attached&&!q.install))finishRobot();robot.cheer=Math.max(0,robot.cheer-dt);robot.nudge=Math.max(0,robot.nudge-dt);
      const cheer=Math.min(1,robot.cheer);bot.position.y=rg+(robot.awake?Math.sin(elapsed*2)*.018:0);bot.rotation.z=robot.awake?Math.sin(elapsed*1.4)*.01:0;
      botArms.forEach((a,i)=>{a.rotation.z=robot.awake?(i?-.12-cheer*.8+Math.sin(elapsed*4)*.25*cheer:Math.sin(elapsed*2)*.04):0;});
      robotEyes.forEach(e=>{e.lid.scale.y=robot.awake?.16:.025;e.pupil.visible=robot.awake;});if(botHeart){botHeart.material=robot.awake?C.teal:C.gold;botHeart.scale.setScalar(1+Math.sin(elapsed*3)*(robot.awake?.04:.08));}if(botAntenna)botAntenna.material=robot.awake?C.gold:C.dark;
      if(nearby(70,12)&&!player.locked&&Math.abs(player.vx)<.5&&(!robot.awake||robot.cheer>2))call('frameActivity',Math.min(64,player.x-.8,dog.x-1.15),Math.max(77.8,player.x+.8,dog.x+.9),rg+1.85,.94);
    }


    // A ROVER YOU CAN REALLY BUILD: components are large, colored physical toys.
    const vx=182, vg=ground(vx), rover=new T.Group();rover.name='Mars rover';rover.position.set(vx,vg+.15,-1.3);root.add(rover);
    box([0,.75,0],[4.3,.65,1.75],C.white,rover);box([0,1.12,0],[2.35,.35,1.5],C.orange,rover);box([1.7,.97,0],[.85,.5,1.3],C.teal,rover);
    const bumper=tube([1.7,.6,.92],[2.3,.85,.92],.12,C.dark,rover);box([-1.4,1.4,0],[.7,.35,1.2],C.dark,rover);
    [-.62,.62].forEach(z=>{const head=ball([2.16,1.05,z],[.14,.17,.1],C.gold,rover);head.rotation.y=Math.PI/2;});
    M.WorkshopArt.sign(root,['rover'],vx-5.6,vg+2.66,-2.3,1.3,1.3);
    const slots=[], parts=[], wheelRigs=[];
    function wheelSet(parent,material,ghost){const frame=new T.Group();parent.add(frame);for(const x of[-1.4,1.4])tube([x,.3,-.92],[x,.3,.92],.09,ghost?material:C.silver,frame);tube([-1.4,.3,0],[1.4,.3,0],.10,ghost?material:C.silver,frame);tube([-.25,.3,0],[.25,.3,0],.15,ghost?material:C.orange,frame);if(world.batchStation)world.batchStation(frame);[-1.4,1.4].forEach(x=>[-.92,.92].forEach(z=>{const rig=new T.Group();rig.position.set(x,.3,z);parent.add(rig);const tire=mesh(geo.cyl,material,[0,0,0],[.61,.3,.61],rig);tire.rotation.x=Math.PI/2;if(!ghost){wheelRigs.push(rig);const hub=mesh(geo.cyl,C.orange,[0,0,z>0?.17:-.17],[.28,.055,.28],rig);hub.rotation.x=Math.PI/2;for(let n=0;n<6;n++){const a=n*Math.PI/3;const tread=box([Math.sin(a)*.52,Math.cos(a)*.52,0],[.15,.2,.33],C.dark,rig);tread.rotation.z=-a;}box([0,0,z>0?.21:-.21],[.08,.49,.04],C.white,rig);}}));}
    function canopy(parent,material,ghost){
      const dome=ball([0,2.0,-.08],[1.4,1.08,.92],material,parent);
      if(!ghost){
        // The bubble clears Feza's real helmet; the thin rim stays below the face.
        const rim=mesh(new T.TorusGeometry(1,.018,6,40),C.white,[0,1.3,-.08],[1.37,.9,1],parent);rim.rotation.x=Math.PI/2;
        tube([-1.31,1.3,-.81],[-.7,2.85,-.81],.025,C.white,parent);
        tube([-.7,2.85,-.81],[.7,2.85,-.81],.025,C.white,parent);
        const wheel=mesh(new T.TorusGeometry(.18,.025,6,24),C.dark,[.93,1.43,.4],[1,1,1],parent);wheel.rotation.y=.45;
        tube([.93,1.35,.36],[1.12,1.17,.24],.045,C.dark,parent);
      }
    }
    function solar(parent,material,ghost){const panel=new T.Group();panel.position.set(-1.55,2.11,0);panel.rotation.set(.55,0,.12);parent.add(panel);box([0,0,0],[1.72,.14,1.85],ghost?material:C.white,panel);if(!ghost){const cells=C.cells;for(let col=0;col<4;col++)for(let row=0;row<4;row++)box([-.61+col*.405,.10,-.67+row*.445],[.36,.035,.39],cells,panel);if(world.batchStation)world.batchStation(panel);}tube([-1.55,1.25,0],[-1.55,2.1,0],.08,C.silver,parent);if(!ghost){tube([-1.1,2.1,-.6],[-1.1,3.05,-.6],.035,C.dark,parent);ball([-1.1,3.1,-.6],[.12,.12,.12],C.gold,parent);}}
    const makers=[wheelSet,canopy,solar];
    const sources=[{x:175,y:vg+.8},{x:177.9,y:vg+1.25},{x:187,y:vg+1.2}];
    const dests=[{x:vx,y:vg+.45},{x:vx,y:vg+1.9},{x:vx-1.55,y:vg+2.3}];
    makers.forEach((fn,i)=>{const slot=new T.Group();rover.add(slot);fn(slot,ghostMat,true);slots.push(slot);const p=new T.Group();root.add(p);fn(p,i===0?C.dark:i===1?glassMat:C.dark,false);const offset=i===0?new T.Vector3(0,.3,0):i===1?new T.Vector3(0,1.75,0):new T.Vector3(-1.55,2.11,0);p.position.set(sources[i].x-offset.x,sources[i].y-offset.y,-1.3);p.userData.home=p.position.clone();const plinth=new T.Group();plinth.position.set(sources[i].x,vg,-1.3);root.add(plinth);cyl([0,.31,0],[.87,.14,.67],C.dark,plinth);const edge=hoop([0,.39,0],.81,C.teal,plinth);edge.rotation.x=Math.PI/2;edge.scale.y=.78;[-1,1].forEach(s=>{tube([s*.38,.3,0],[s*.75,.07,.35],.075,C.silver,plinth);box([s*.75,.06,.35],[.36,.09,.27],C.orange,plinth);});const target=marker(dests[i].x,dests[i].y,.65,C.gold);target.position.z=-.55;target.visible=false;parts.push({g:p,offset,placed:false,target,plinth,spin:0});});
    // These children stay rigid; only their parent wheel rig rotates.
    if(world.batchStation)for(const rig of wheelRigs)world.batchStation(rig);
    const roverState={phase:'build',x:vx,from:vx,to:264,time:0,bounce:0,bounceV:0,trips:0,stop:-1,route:[false,false,false,false],step:0,digAt:-1,actionAt:-1,speed:0,pickupAt:-10,pickupX:0,pickupY:0,pickupZ:0,intentStop:-1,intentStep:-1,intentPointer:null,intentId:null};
    const sourceRings=sources.map((p,i)=>{const h=hoop([p.x,p.y,-1.15],i===0?1.4:.9,C.gold);h.visible=false;return h;});
    function visiblePart(event){
      if(!event||!Number.isFinite(event.clientX)||!M.camera)return -1;
      const canvas=M.renderer&&M.renderer.domElement,rect=canvas&&canvas.getBoundingClientRect();
      if(!rect||!rect.width||!rect.height)return -1;
      pickNdc.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);pickRay.setFromCamera(pickNdc,M.camera);
      let best=-1,distance=Infinity;
      parts.forEach((q,i)=>{if(q.placed)return;partHits.length=0;pickRay.intersectObject(q.g,true,partHits);if(partHits.length&&partHits[0].distance<distance){distance=partHits[0].distance;best=i;}});partHits.length=0;
      return best;
    }
    function choose(i){selected=i;idle=0;parts.forEach((q,n)=>q.target.visible=!M.playGuideActive&&n===i&&!q.placed);sourceRings.forEach(h=>h.visible=false);sound('select');note('Parçayı aynı şeklin üstüne bırak.');}
    const installPoint=new T.Vector3();
    function place(i){
      const q=parts[i];if(q.placed)return;q.placed=true;q.pop=0;
      if(drag?.kind==='rover'&&drag.i===i)drag=null;
      q.g.getWorldPosition(installPoint);rover.worldToLocal(installPoint);
      q.g.parent.remove(q.g);rover.add(q.g);q.g.position.copy(installPoint);
      q.install={x:installPoint.x,y:installPoint.y,z:installPoint.z,time:0};
      q.target.visible=false;sourceRings[i].visible=false;slots[i].visible=false;selected=-1;sound('snap');burst(dests[i].x,dests[i].y,C.teal,10);
    }
    function assemblyReady(){if(roverState.phase==='build'&&parts.every(q=>q.placed&&!q.install)){roverState.phase='ready';note('Harika! Arabaya dokun, Bilbo’yla birlikte binelim.');sound('success');burst(vx,vg+2.5,C.gold,12);}}
    function startDrive(){if(done[1]||roverState.phase!=='ready')return false;clearRouteIntent();roverState.from=vx;roverState.to=264;roverState.time=0;roverState.stop=-1;roverState.step=0;roverState.speed=0;roverState.bounce=roverState.bounceV=0;roverState.trips++;beginTransit('board','rover');call('setHint','Bilim arabasıyla güneş, kaya ve radyo duraklarını keşfedelim.');sound('rover');idle=0;return true;}
    function hopRover(){if(roverState.bounce>.18||roverState.bounceV>1)return;roverState.bounceV=4.8;sound('jump');burst(roverState.x,ground(roverState.x)+.35,C.sand,6);}

    // Three working roadside instruments replace the old automatic star pickup.
    // Every stop changes the next part of the expedition; a child can take any time.
    // Two physical construction stops. The pieces and receiver silhouettes share
    // their real geometry; each accepted match creates a permanent world change.
    function shapeWorkshop(kind,x){
      const bridge=kind==='bridge',y=ground(x),g=new T.Group(),fixed=new T.Group(),gateAngle=Math.PI/4,gateCos=Math.cos(gateAngle),gateSin=Math.sin(gateAngle);
      g.name=bridge?'Rover repairable beam bridge':'Sled glacier prism gate';g.position.set(x,y,0);root.add(g);g.add(fixed);
      // Constructor-only depth-aware support queries include the visible ice skin.
      const floorMeshes=[],floorRay=new T.Raycaster(),floorDown=new T.Vector3(0,-1,0),floorFrom=new T.Vector3(),floorHits=[],floorCache=new Map();
      if(world.root&&world.materials){world.root.updateWorldMatrix(true,true);world.root.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.includes(world.materials.ground)||mats.includes(world.materials.ice))floorMeshes.push(o);});}
      function surfaceHeight(px,pz){if(!floorMeshes.length)return ground(px);const key=px.toFixed(5)+','+pz.toFixed(5);if(floorCache.has(key))return floorCache.get(key);floorFrom.set(px,20,pz);floorRay.set(floorFrom,floorDown);floorHits.length=0;floorRay.intersectObjects(floorMeshes,false,floorHits);const result=floorHits.length?floorHits[0].point.y:ground(px);floorCache.set(key,result);return result;}
      const shapes=[],pieces=[],holes=[],collars=[],placed=[false,false,false],homes=[],destinations=[];
      const point=new T.Vector3(),input=new T.Vector3(),pose={id:'',kind, x:0,y:0,z:0,inputX:0,inputY:0,sourceX:0,sourceY:0,sourceZ:0,toX:0,toY:0,toZ:0,index:0,selected:-1};
      let selected=-1,owner=null,held=false,startX=0,startY=0,moved=false,open=0,gateHeader=null;
      const sourceRay=new T.Raycaster(),sourcePick=new T.Mesh(geo.box,C.white),sourceHome=new T.Matrix4(),sourceCorner=new T.Vector3(),sourceHits=[];
      const colors=[C.orange,C.teal,C.blue].map(material=>{if(bridge)return material;const crystal=material.clone();crystal.map=world.materials.ice.map;crystal.normalMap=world.materials.ice.normalMap;crystal.normalScale=new T.Vector2(.20,.20);crystal.roughness=.28;crystal.metalness=.08;return crystal;});
      function makeShape(i){
        const s=new T.Shape();let points;
        if(bridge){const w=[.78,1.12,1.46][i],h=2.35;
          points=i===0?[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]]:i===1?[[-w/2,-h/2],[w/2,-h/2],[w/2,.78],[0,h/2],[-w/2,.78]]:[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[.18,h/2],[.18,.77],[-.18,.77],[-.18,h/2],[-w/2,h/2]];
        }else points=i===0?[[0,.74],[.66,-.54],[-.66,-.54]]:i===1?[[0,.81],[.61,0],[0,-.81],[-.61,0]]:[[-.65,-.36],[0,-.73],[.65,-.36],[.65,.36],[0,.73],[-.65,.36]];
        for(let n=0;n<points.length;n++)n?s.lineTo(...points[n]):s.moveTo(...points[n]);s.closePath();
        const geometry=new T.ExtrudeGeometry(s,{depth:bridge?.14:.40,bevelEnabled:true,bevelThickness:bridge?.035:.07,bevelSize:bridge?.035:.065,bevelSegments:bridge?1:2,steps:1});geometry.translate(0,0,bridge?-.07:-.20);geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
      }
      if(bridge){
        function followRoad(o,top){const geometry=o.geometry.clone(),v=geometry.attributes.position;for(let n=0;n<v.count;n++)v.setY(n,v.getY(n)+(surfaceHeight(x+o.position.x+v.getX(n)*o.scale.x,o.position.z+v.getZ(n)*o.scale.z)-y+top-o.scale.y*.5)/o.scale.y);geometry.computeVertexNormals();geometry.computeBoundingSphere();o.geometry=geometry;}
        followRoad(box([0,0,-1.3],[5.5,.025,2.75],C.dark,fixed),.007);

        for(const z of [-2.65,.05]){tube([-2.8,.18,z],[2.8,.18,z],.09,C.silver,fixed);for(const a of [-2.8,2.8])cyl([a,-.03,z],[.18,.58,.18],C.white,fixed);}
        box([-.15,1.91,.89],[6.9,.2,.65],C.white,fixed);for(const end of [-3.15,3.15])tube([end,surfaceHeight(x+end,.89)-y,.89],[end,1.91,.89],.09,C.silver,fixed);
      }else{
        const arch=new T.Group();arch.position.z=-1.1;arch.rotation.y=gateAngle;fixed.add(arch);
        for(const a of [-3,3]){box([a,1.95,0],[.40,4.05,.55],C.white,arch);box([a,surfaceHeight(x+a*gateCos,-1.1-a*gateSin)-y+.15,0],[1.2,.3,1.2],C.white,arch);}
        const headerHinges=new T.Group();headerHinges.rotation.y=gateAngle;headerHinges.position.z=-1.1;g.add(headerHinges);gateHeader=new T.InstancedMesh(geo.box,C.blue,2);gateHeader.name='Prism gate folding ice arch';gateHeader.frustumCulled=false;gateHeader.castShadow=gateHeader.receiveShadow=true;headerHinges.add(gateHeader);
        box([0,.22,2.2],[7.15,.2,.66],C.white,fixed);for(const a of[-3.1,3.1])for(const z of[1.98,2.42]){const bottom=surfaceHeight(x+a,z)-y,height=Math.max(.035,.12-bottom);box([a,bottom+height/2,z],[.14,height,.14],C.white,fixed);}
      }
      for(let i=0;i<3;i++){
        const geometry=makeShape(i);shapes.push(geometry);
        const home=new T.Vector3((i-1)*2.3-(bridge?.5:0),bridge?2.02-geometry.boundingBox.min.y:.345-geometry.boundingBox.min.y,bridge?.93:2.2);
        // The open bridge leaves are tilted up. Each fitted beam folds onto the
        // actual road; the three different lengths/notches remain visible there.
        const a=(i-1)*1.65,destination=bridge?new T.Vector3(a,1.10,-2.35):new T.Vector3(a*gateCos+.16*gateSin,2.62,-1.1-a*gateSin+.16*gateCos);
        let roadY=0;
        if(bridge){geometry.computeBoundingBox();const top=geometry.boundingBox.max.z,centerGround=surfaceHeight(x+destination.x,-1.3),v=geometry.attributes.position;roadY=centerGround-y+.035-top;for(let n=0;n<v.count;n++)v.setZ(n,v.getZ(n)+surfaceHeight(x+destination.x+v.getX(n),-1.3-v.getY(n))-centerGround);geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.computeBoundingBox();}
        const hole=mesh(geometry,C.dark,destination.toArray(),bridge?[1.10,1.04,.55]:[1.12,1.12,.55],g);hole.name=kind+' empty silhouette '+i;if(bridge)hole.rotation.x=-.47;else hole.rotation.y=gateAngle;
        const p=mesh(geometry,colors[i],home.toArray(),null,g);p.name=kind+' movable '+i;p.userData.roadY=roadY;
        pieces.push(p);holes.push(hole);homes.push(home);destinations.push(destination);
        box([home.x,bridge?2.015:.3325,home.z],[bridge?.8:.85,bridge?.01:.025,.65],C.white,fixed);
        if(!bridge){const side=i<2?-3.2:3.2,cy=[1.5,3.3,2.5][i],cradle=box([side*gateCos+.16*gateSin,cy+geometry.boundingBox.min.y-.085,-1.1-side*gateSin+.16*gateCos],[.85,.13,.65],C.white,fixed);cradle.rotation.y=gateAngle;}
        // A matching coloured inset is visible behind each dark cut-out.
        const collar=mesh(geometry,colors[i],destination.toArray(),bridge?[1.19,1.09,.22]:[1.23,1.23,.22],g);collars.push(collar);collar.position.z-=.07;if(bridge)collar.rotation.x=-.47;else collar.rotation.y=gateAngle;
      }
      if(bridge){
        // The fixed road has exact negative silhouettes of the three real beams.
        // Fitting every shape closes the complete wheel lanes, including notches.
        const outline=new T.Shape();outline.moveTo(-2.8,-1.325);outline.lineTo(2.8,-1.325);outline.lineTo(2.8,1.325);outline.lineTo(-2.8,1.325);outline.closePath();
        for(let i=0;i<3;i++){const contour=shapes[i].parameters.shapes.getPoints(),hole=new T.Path();for(let n=contour.length-1;n>=0;n--){const v=contour[n];n===contour.length-1?hole.moveTo(v.x+destinations[i].x,v.y):hole.lineTo(v.x+destinations[i].x,v.y);}hole.closePath();outline.holes.push(hole);}
        const geometry=new T.ExtrudeGeometry(outline,{depth:.14,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:1,steps:1});geometry.translate(0,0,-.07);const v=geometry.attributes.position;for(let n=0;n<v.count;n++)v.setZ(n,v.getZ(n)+surfaceHeight(x+v.getX(n),-1.3-v.getY(n))-y);geometry.computeVertexNormals();geometry.computeBoundingSphere();const deck=mesh(geometry,C.silver,[0,.035-.105,-1.3],null,fixed);deck.rotation.x=-Math.PI/2;deck.name='Bridge road with exactly matched beam gaps';
      }
      const leaves=bridge?null:new T.InstancedMesh(geo.box,C.white,4),leafPose=new T.Object3D();
      if(leaves){leaves.name='Prism gate unfolding aurora';leaves.frustumCulled=false;leaves.visible=false;g.add(leaves);for(let i=0;i<4;i++)leaves.setColorAt(i,i%2?C.teal.color:C.blue.color);}
      if(world.batchStation)world.batchStation(fixed);
      function complete(){return placed.every(Boolean);}
      function project(v,out){g.localToWorld(point.copy(v));out.copy(point);if(M.camera){const c=M.camera,k=c.position.z/(c.position.z-point.z);out.set(c.position.x+(point.x-c.position.x)*k,c.position.y+(point.y-c.position.y)*k,0);}return out;}
      function hitAt(p,v,r){project(v,input);return Math.hypot(p.x-input.x,p.y-input.y)<r;}
      function sourceHit(p,i){
        const geometry=pieces[i].geometry;if(!geometry.boundingBox)geometry.computeBoundingBox();
        // Use the REAL painted home silhouette, even while its held piece moves.
        // A detached query mesh shares constructor geometry/material and never renders.
        if(M.camera){g.updateWorldMatrix(true,false);sourcePick.geometry=geometry;sourcePick.matrixWorld.multiplyMatrices(g.matrixWorld,sourceHome.makeTranslation(homes[i].x,homes[i].y,homes[i].z));sourceRay.ray.origin.copy(M.camera.position);sourceRay.ray.direction.set(p.x,p.y,0).sub(M.camera.position).normalize();sourceHits.length=0;sourceRay.intersectObject(sourcePick,false,sourceHits);if(sourceHits.length)return true;}
        const b=geometry.boundingBox;let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
        for(let n=0;n<8;n++){sourceCorner.set(n&1?b.max.x:b.min.x,n&2?b.max.y:b.min.y,n&4?b.max.z:b.min.z).add(homes[i]);project(sourceCorner,input);left=Math.min(left,input.x);right=Math.max(right,input.x);bottom=Math.min(bottom,input.y);top=Math.max(top,input.y);}
        const inside=Math.abs(p.x-(left+right)/2)<=Math.max(.65,(right-left)/2+.18)&&Math.abs(p.y-(bottom+top)/2)<=Math.max(.65,(top-bottom)/2+.18);
        return inside&&!destinations.some((v,n)=>!placed[n]&&hitAt(p,v,.88));
      }
      function reset(clearSelection){if(held&&selected>=0&&!placed[selected]){pieces[selected].position.copy(homes[selected]);pieces[selected].rotation.set(0,0,0);}owner=null;held=false;moved=false;if(clearSelection)selected=-1;}
      function place(i){if(placed[i])return;placed[i]=true;holes[i].visible=false;collars[i].visible=false;pieces[i].position.copy(destinations[i]);pieces[i].rotation.set(bridge?-.47:0,bridge?0:gateAngle,0);pieces[i].userData.fold=0;reset(true);idle=0;sound('snap');g.localToWorld(point.copy(destinations[i]));burst(point.x,point.y,C.gold,9);if(complete())sound('success');}
      function pointer(type,p,event){
        const id=event?.pointerId??null;
        if(type==='cancel'){if(!event||held&&id===owner){reset(true);return true;}return false;}
        if(!p||complete())return false;
        if(held){
          if(id!==owner)return true;
          if(type==='move'){if(Math.hypot(p.x-startX,p.y-startY)>.12)moved=true;if(moved){const c=M.camera,z=.93,k=c?(c.position.z-z)/c.position.z:1;point.set(c?c.position.x+(p.x-c.position.x)*k:p.x,c?c.position.y+(p.y-c.position.y)*k:p.y,z);g.worldToLocal(point);pieces[selected].position.copy(point);pieces[selected].rotation.set(0,0,0);}return true;}
          if(type==='up'){const i=selected,matched=moved&&hitAt(p,destinations[i],.94)&&!sourceHit(p,i);reset(false);if(matched)place(i);return true;}return true;
        }
        if(type!=='down')return false;
        if(selected>=0&&hitAt(p,destinations[selected],.94)&&!sourceHit(p,selected)){place(selected);return true;}
        // Receiver-only touches point back to the real tray; they never acquire.
        let best=-1,distance=Infinity;for(let i=0;i<3;i++)if(!placed[i]&&sourceHit(p,i)){project(homes[i],input);const d=Math.hypot(p.x-input.x,p.y-input.y);if(d<distance){distance=d;best=i;}}
        if(best<0){if(destinations.some((v,i)=>!placed[i]&&hitAt(p,v,.88))){idle=4;return true;}return false;}selected=best;owner=id;held=true;startX=p.x;startY=p.y;moved=false;idle=0;sound('select');return true;
      }
      function target(){if(complete())return null;const i=selected>=0?selected:placed.indexOf(false),v=selected>=0?destinations[i]:homes[i];g.localToWorld(point.copy(v));pose.x=point.x;pose.y=point.y;pose.z=point.z;project(v,input);pose.inputX=input.x;pose.inputY=input.y;pose.index=i;pose.selected=selected;pose.id=kind+'-'+i+(selected>=0?'-socket':'-source');g.localToWorld(point.copy(homes[i]));pose.sourceX=point.x;pose.sourceY=point.y;pose.sourceZ=point.z;g.localToWorld(point.copy(destinations[i]));pose.toX=point.x;pose.toY=point.y;pose.toZ=point.z;return pose;}
      function update(dt,active){g.visible=Math.abs(player.x-x)<38;
        for(let i=0;i<3;i++)if(placed[i]&&bridge){const p=pieces[i];p.userData.fold=Math.min(1,(p.userData.fold||0)+dt*2.3);const u=p.userData.fold,v=u*u*(3-2*u);p.position.set(destinations[i].x,1.10+(p.userData.roadY-1.10)*v,-2.35+1.05*v);p.rotation.x=-.47+(-Math.PI/2+.47)*v;}
        if(!bridge){open=M.damp(open,complete()?1:0,3,dt);leaves.visible=true;for(let i=0;i<4;i++){const a=(i-1.5)*1.45+(i<2?-1:1)*open*2.4;leafPose.position.set(a*gateCos,2.55+open*1.2,-1.1-a*gateSin);leafPose.rotation.set(0,gateAngle,0);leafPose.scale.set(1.30,3.05*(1-.69*open),.10);leafPose.updateMatrix();leaves.setMatrixAt(i,leafPose.matrix);}leaves.instanceMatrix.needsUpdate=true;for(let i=0;i<2;i++){const side=i?1:-1,angle=open*Math.PI/2;leafPose.position.set(side*3-side*1.5*Math.cos(angle),3.96+1.5*Math.sin(angle),0);leafPose.rotation.set(0,0,-side*angle);leafPose.scale.set(3.2,.38,.55);leafPose.updateMatrix();gateHeader.setMatrixAt(i,leafPose.matrix);}gateHeader.instanceMatrix.needsUpdate=true;if(complete())for(let i=0;i<3;i++){const side=i<2?-3.2:3.2;pieces[i].position.set(destinations[i].x+(side*gateCos+.16*gateSin-destinations[i].x)*open,destinations[i].y+((i===0?1.5:i===1?3.3:2.5)-destinations[i].y)*open,destinations[i].z+(-1.1-side*gateSin+.16*gateCos-destinations[i].z)*open);}}
        if(!active&&held)reset(true);
      }
      const stateView={kind,x,placed,selected:-1,held:false,owner:null,complete:false,open:0,target:null};
      function state(){stateView.selected=selected;stateView.held=held;stateView.owner=owner;stateView.complete=complete();stateView.open=open;stateView.target=target();return stateView;}
      function prepare(renderer,camera){const visible=g.visible,leafVisible=leaves?.visible;try{g.visible=true;if(leaves)leaves.visible=true;renderer.compile(g,camera,scene);}finally{g.visible=visible;if(leaves)leaves.visible=leafVisible;}}
      return{g,pointer,target,update,state,complete,reset,prepare,demoSources:pieces};
    }

    const bridgeWorkshop=shapeWorkshop('bridge',258),gateWorkshop=shapeWorkshop('gate',352);
    const caravan=[],roverCellMaterial=C.cells;
    for(const [i,x] of [198,220,241].entries()){
      const g=new T.Group();g.name=['Rover solar charger','Bilbo sample excavation','Crystal radio relay'][i];g.position.set(x,ground(x),-3.8);root.add(g);
      cyl([0,.17,0],[1.5,.25,.88],C.silver,g);box([0,.35,0],[2.8,.13,1.6],C.white,g);
      const lamp=ball([0,.63,.76],[.15,.15,.07],C.dark,g);
      const item={g,x,y:ground(x),lamp,parts:[],progress:0,signal:0,intentPulse:0};caravan.push(item);
      if(i===0){
        const mast=cyl([0,1.35,-.35],[.08,2,.08],C.silver,g);
        for(const s of [-1,1]){const wing=new T.Group();wing.position.set(s*.1,1.98,-.35);g.add(wing);box([s*.83,0,0],[1.72,1.30,.15],C.white,wing);box([s*.83,0,.10],[1.56,1.14,.06],C.dark,wing);for(let col=0;col<4;col++)for(let row=0;row<3;row++)box([s*(.23+col*.40),(row-1)*.36,.15],[.35,.31,.025],roverCellMaterial,wing);for(const yy of[-.42,.42]){const hinge=cyl([0,yy,0],[.12,.24,.12],C.silver,wing);hinge.rotation.x=Math.PI/2;}wing.rotation.z=-s*1.15;if(world.batchStation)world.batchStation(wing);item.parts.push(wing);}
        const plug=new T.Group();plug.name='Rover durağının iki uçlu kablolu fişi';g.add(plug);plug.position.set(.58,1.03,.82);mesh(plugShape(),C.orange,[0,0,0],null,plug);box([0,.34,.02],[.79,.11,.52],C.white,plug);for(const side of[-1,1]){box([side*.22,.63,.02],[.12,.46,.13],C.silver,plug);ball([side*.22,.87,.02],[.06,.055,.065],C.white,plug);}for(let n=0;n<3;n++)box([0,-.16+n*.14,.294],[.49+n*.07,.035,.025],C.dark,plug);cyl([0,-.46,0],[.13,.30,.13],C.dark,plug);for(let n=0;n<3;n++){const rim=hoop([0,-.40-n*.08,0],.14,C.silver,plug);rim.rotation.x=Math.PI/2;}
        if(world.batchStation)world.batchStation(plug);
        const socket=new T.Group();socket.name='Rover durağının iki delikli fiş yuvası';g.add(socket);socket.position.set(2.28,1.44,.75);box([0,0,0],[1.13,1.02,.30],C.white,socket);box([0,0,.18],[.83,.71,.08],C.dark,socket);hoop([0,0,.25],.40,C.teal,socket);for(const side of[-1,1])box([side*.22,.06,.29],[.13,.31,.04],C.black,socket);for(const yy of[-.37,.37])ball([0,yy,.18],[.04,.04,.03],C.silver,socket);tube([2.28,.29,.53],[2.28,1.42,.53],.09,C.silver,g);
        const cablePose=new T.Object3D(),a=new T.Vector3(),b=new T.Vector3(),delta=new T.Vector3(),up=new T.Vector3(0,1,0),cable=new T.InstancedMesh(geo.cyl,C.dark,12);cable.name='Rover fişinin panele bağlı esnek kablosu';cable.instanceMatrix.setUsage(T.DynamicDrawUsage);cable.frustumCulled=false;g.add(cable);
        let cableX=NaN,cableY=NaN,cableZ=NaN;item.updateCable=function(){if(Math.abs(plug.position.x-cableX)<.0001&&Math.abs(plug.position.y-cableY)<.0001&&Math.abs(plug.position.z-cableZ)<.0001)return;cableX=plug.position.x;cableY=plug.position.y;cableZ=plug.position.z;let ax=0,ay=.58,az=.70;for(let n=0;n<12;n++){const u=(n+1)/12,v=1-u,bx=3*v*u*u*(plug.position.x-.4)+u*u*u*plug.position.x,by=Math.max(.43,v*v*v*.58+3*v*v*u*.43+3*v*u*u*.43+u*u*u*(plug.position.y-.57)),bz=.70+(plug.position.z-.70)*u+Math.sin(Math.PI*u)*.48;a.set(ax,ay,az);b.set(bx,by,bz);delta.subVectors(b,a);const length=delta.length();cablePose.position.copy(a).add(b).multiplyScalar(.5);cablePose.quaternion.setFromUnitVectors(up,delta.normalize());cablePose.scale.set(.055,length+.014,.055);cablePose.updateMatrix();cable.setMatrixAt(n,cablePose.matrix);ax=bx;ay=by;az=bz;}cable.instanceMatrix.needsUpdate=true;};
        item.plug=plug;item.socket=socket;item.plugHome=new T.Vector3(.58,1.03,.82);item.plugDock=new T.Vector3(2.28,.92,.98);item.plugSelected=false;
        item.powerBulbs=[];item.bulbOff=mat(0xc7d7dc);item.bulbOn=mat(0xffeab1,0xffb942);item.bulbOn.emissiveIntensity=.8;for(const xx of[-1.10,-.35,.40]){cyl([xx,.46,1],[.11,.15,.11],C.silver,g);for(let k=0;k<3;k++){const screw=hoop([xx,.42+k*.04,1],.115,C.dark,g);screw.rotation.x=Math.PI/2;}item.powerBulbs.push(ball([xx,.65,1.02],[.14,.18,.13],item.bulbOff,g),ball([xx,.82,1.02],[.23,.25,.20],item.bulbOff,g));}

      }else if(i===1){
        const mound=ball([-.9,.54,.17],[.92,.3,.69],C.sand,g),rock=mesh(new T.IcosahedronGeometry(1,1),C.blue,[-.9,.55,.18],[.40,.33,.32],g);rock.name='Bilbo’nun bulduğu elde taşınan kaya';rock.visible=false;
        const tray=hoop([1.0,.82,.28],.52,C.teal,g);tray.rotation.x=Math.PI/2;
        const digControl=new T.Group();digControl.position.set(-.95,.82,.81);g.add(digControl);paw(digControl,0,0,0,.90,C.gold);item.digControl=digControl;item.mound=mound;item.rock=rock;item.tray=tray;
      }else{
        const dish=new T.Group();dish.position.set(-.63,1.7,-.2);g.add(dish);ball([0,0,0],[.88,.64,.22],C.white,dish);hoop([0,0,.19],.67,C.orange,dish);tube([0,0,.2],[.18,.1,.94],.045,C.dark,dish);ball([.18,.1,.94],[.12,.12,.12],C.blue,dish);dish.rotation.z=-.9;
        cyl([-.63,.91,-.2],[.09,1.3,.09],C.silver,g);const beacon=star(g,1.02,1.18,.45,.46,C.dark);item.dish=dish;item.beacon=beacon;
        item.waves=[];for(let n=0;n<3;n++){const w=hoop([0,1.8,-.5],.7+n*.45,C.teal,g);w.visible=false;item.waves.push(w);}
      }
    }
    caravan.push({g:bridgeWorkshop.g,x:258,y:ground(258),lamp:null,progress:0,signal:0,intentPulse:0});
    const cargo=new T.Group();cargo.position.set(-.8,1.4,.67);rover.add(cargo);
    const cargoLights=[-1,0,1].map(x=>ball([x*.34,0,0],[.10,.10,.055],C.dark,cargo));
    const roverTarget={id:'',x:0,y:0,z:0,inputX:0,inputY:0,sourceX:0,sourceY:0,sourceZ:0,toX:0,toY:0,toZ:0,kind:'roverInstrument'},routePoint=new T.Vector3(),routeTo=new T.Vector3(),routeBounds=new T.Box3(),routeCorner=new T.Vector3();
    const routePlugDrag={owner:null,moved:false,startX:0,startY:0,offsetX:0,offsetY:0},routePlugPoint=new T.Vector3();
    const routeRockDrag={owner:null,moved:false,startX:0,startY:0,offsetX:0,offsetY:0,selected:false};
    function sampleTrayHit(p,q){q.tray.getWorldPosition(routeTo);const c=M.camera,k=c.position.z/(c.position.z-routeTo.z),x=c.position.x+(routeTo.x-c.position.x)*k,y=c.position.y+(routeTo.y-c.position.y)*k;return Math.hypot((p.x-x)/.76,(p.y-y)/.65)<1;}
    function localRockPoint(p,q){const c=M.camera,z=q.g.position.z+q.rock.position.z,k=(c.position.z-z)/c.position.z;routePlugPoint.set(c.position.x+(p.x-c.position.x)*k-q.g.position.x,c.position.y+(p.y-c.position.y)*k-q.g.position.y,q.rock.position.z);return routePlugPoint;}
    function routeRockPointer(type,p,event){
      const id=event?.pointerId??'primary',q=caravan[1];
      if(type==='cancel'){if(!event||routeRockDrag.owner===id){routeRockDrag.owner=null;routeRockDrag.moved=false;}return false;}
      if(routeRockDrag.owner!==null){
        if(id!==routeRockDrag.owner)return true;
        if(type==='move'||type==='up'){
          if(p){if(Math.hypot(p.x-routeRockDrag.startX,p.y-routeRockDrag.startY)>.10)routeRockDrag.moved=true;if(routeRockDrag.moved){const v=localRockPoint(p,q);q.rock.position.x=M.clamp(v.x+routeRockDrag.offsetX,-1.8,1.9);q.rock.position.y=M.clamp(v.y+routeRockDrag.offsetY,.45,2.2);}if(type==='up'&&routeRockDrag.moved&&sampleTrayHit(p,q))commitRouteAction(routeTarget(true));}
          if(type==='up'){routeRockDrag.owner=null;routeRockDrag.moved=false;}return true;
        }
        return true;
      }
      if(type!=='down'||!p||roverState.phase!=='drive'||roverState.stop!==1||roverState.step!==1||routeOpening())return false;
      if(routeRockDrag.selected&&sampleTrayHit(p,q)&&!M.touchPlayPart(p,q.rock,.10)){commitRouteAction(routeTarget(true));return true;}
      if(!M.touchPlayPart(p,q.rock,.18))return false;const v=localRockPoint(p,q);routeRockDrag.owner=id;routeRockDrag.moved=false;routeRockDrag.startX=p.x;routeRockDrag.startY=p.y;routeRockDrag.offsetX=q.rock.position.x-v.x;routeRockDrag.offsetY=q.rock.position.y-v.y;routeRockDrag.selected=true;idle=0;sound('select');return true;
    }
    function localPlugPoint(p,q){const c=M.camera,z=q.g.position.z+q.plug.position.z,k=(c.position.z-z)/c.position.z;routePlugPoint.set(c.position.x+(p.x-c.position.x)*k-q.g.position.x,c.position.y+(p.y-c.position.y)*k-q.g.position.y,q.plug.position.z);return routePlugPoint;}
    function socketHit(p,q){q.socket.getWorldPosition(routeTo);const c=M.camera,k=c.position.z/(c.position.z-routeTo.z),x=c.position.x+(routeTo.x-c.position.x)*k,y=c.position.y+(routeTo.y-c.position.y)*k;return Math.hypot((p.x-x)/.85,(p.y-y)/.92)<1;}
    function routePlugPointer(type,p,event){const id=event?.pointerId??'primary',q=caravan[0];if(type==='cancel'){if(!event||routePlugDrag.owner===id){routePlugDrag.owner=null;routePlugDrag.moved=false;}return false;}if(routePlugDrag.owner!==null){if(id!==routePlugDrag.owner)return true;if(type==='move'||type==='up'){if(p){if(Math.hypot(p.x-routePlugDrag.startX,p.y-routePlugDrag.startY)>.10)routePlugDrag.moved=true;if(routePlugDrag.moved){const v=localPlugPoint(p,q);q.plug.position.x=M.clamp(v.x+routePlugDrag.offsetX,-.1,3);q.plug.position.y=M.clamp(v.y+routePlugDrag.offsetY,.62,2.7);}if(type==='up'&&routePlugDrag.moved&&!routeOpening()&&socketHit(p,q))commitRouteAction(routeTarget(true));}if(type==='up'){routePlugDrag.owner=null;routePlugDrag.moved=false;}return true;}return true;}if(type!=='down'||!p||roverState.phase!=='drive'||roverState.stop!==0||roverState.step!==1)return false;if(q.plugSelected&&!routeOpening()&&socketHit(p,q)){commitRouteAction(routeTarget(true));return true;}if(!M.touchPlayPart(p,q.plug,.18))return false;const v=localPlugPoint(p,q);routePlugDrag.owner=id;routePlugDrag.moved=false;routePlugDrag.startX=p.x;routePlugDrag.startY=p.y;routePlugDrag.offsetX=q.plug.position.x-v.x;routePlugDrag.offsetY=q.plug.position.y-v.y;q.plugSelected=true;idle=0;sound('select');return true;}
    function routeOpening(){const i=roverState.stop;return roverState.phase==='drive'&&i>=0&&roverState.step===1&&elapsed-roverState.actionAt<(i===1?1.8:i===0?1.05:.75);}
    function routeTarget(includeOpening=false){
      if(roverState.phase!=='drive'||roverState.stop<0)return null;
      const i=roverState.stop,q=caravan[i],step=roverState.step;
      if(i===3)return bridgeWorkshop.target();
      if(!includeOpening&&routeOpening())return null;
      if(i===0){if(step){q.plug.getWorldPosition(routePoint);q.socket.getWorldPosition(routeTo);roverTarget.sourceX=routePoint.x;roverTarget.sourceY=routePoint.y;roverTarget.sourceZ=routePoint.z;roverTarget.toX=routeTo.x;roverTarget.toY=routeTo.y;roverTarget.toZ=routeTo.z;}else q.parts[0].localToWorld(routePoint.set(-.83,0,.15));}
      else if(i===1){if(step){q.rock.getWorldPosition(routePoint);q.tray.getWorldPosition(routeTo);roverTarget.sourceX=routePoint.x;roverTarget.sourceY=routePoint.y;roverTarget.sourceZ=routePoint.z;roverTarget.toX=routeTo.x;roverTarget.toY=routeTo.y;roverTarget.toZ=routeTo.z;}else q.g.localToWorld(routePoint.set(-.95,.82,.81));}
      else (step?q.beacon:q.dish).getWorldPosition(routePoint);
      roverTarget.id=i+'-'+step;roverTarget.x=routePoint.x;roverTarget.y=routePoint.y;roverTarget.z=routePoint.z;roverTarget.inputX=routePoint.x;roverTarget.inputY=routePoint.y;
      if(M.camera){const camera=M.camera,k=camera.position.z/(camera.position.z-routePoint.z);roverTarget.inputX=camera.position.x+(routePoint.x-camera.position.x)*k;roverTarget.inputY=camera.position.y+(routePoint.y-camera.position.y)*k;}return roverTarget;
    }
    function nextRouteHit(p){
      const q=caravan[roverState.stop],object=roverState.stop===0?q.plug:roverState.stop===1?q.tray:q.beacon;
      // Project the visible object's actual bounds onto main's z=0 input plane.
      // A small finger halo also makes the horizontal sample tray easy to touch.
      routeBounds.setFromObject(object);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      for(let n=0;n<8;n++){routeCorner.set(n&1?routeBounds.max.x:routeBounds.min.x,n&2?routeBounds.max.y:routeBounds.min.y,n&4?routeBounds.max.z:routeBounds.min.z);let x=routeCorner.x,y=routeCorner.y;if(M.camera){const c=M.camera,k=c.position.z/(c.position.z-routeCorner.z);x=c.position.x+(x-c.position.x)*k;y=c.position.y+(y-c.position.y)*k;}minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
      const cx=(minX+maxX)/2,cy=(minY+maxY)/2;return Math.abs(p.x-cx)<=Math.max(.36,(maxX-minX)/2+.20)&&Math.abs(p.y-cy)<=Math.max(.36,(maxY-minY)/2+.20);
    }
    function clearRouteIntent(){if(roverState.intentStop>=0)caravan[roverState.intentStop].intentPulse=0;roverState.intentStop=roverState.intentStep=-1;roverState.intentPointer=null;roverState.intentId=null;}
    function commitRouteAction(target){
      const i=roverState.stop,q=caravan[i];idle=0;sound(roverState.step?'snap':'select');
      if(roverState.step===0){roverState.step=1;roverState.actionAt=elapsed;if(i===1)roverState.digAt=elapsed;burst(target.x,target.y,C.teal,6);}
      else{if(i===1){roverState.pickupAt=elapsed;roverState.pickupX=dog.x;roverState.pickupY=dog.y;roverState.pickupZ=dog.z;}roverState.route[i]=true;roverState.stop=-1;roverState.step=0;q.signal=3;cargoLights[i].material=C.gold;burst(q.x,q.y+1.7,C.gold,12);sound('success');}
      return true;
    }
    function routeAction(p,event){
      if(!p)return false;if(roverState.stop===3)return bridgeWorkshop.pointer('down',p,event);const target=routeTarget(true);if(!target)return false;
      if(roverState.stop===0&&roverState.step===1)return routePlugPointer('down',p,event);
      if(roverState.stop===1&&roverState.step===1)return routeRockPointer('down',p,event);
      if(routeOpening()){
        // Only the visible NEXT plug/tray/beacon can reserve its own action.
        // The first handle, empty sky and the jump control cannot queue progress.
        if(!nextRouteHit(p)||!M.touchPlayPart(p,caravan[roverState.stop].beacon,.24))return false;
        if(roverState.intentStop!==roverState.stop||roverState.intentStep!==1){roverState.intentStop=roverState.stop;roverState.intentStep=1;roverState.intentPointer=event?.pointerId??null;roverState.intentId=target.id;caravan[roverState.stop].intentPulse=.9;burst(target.x,target.y,C.gold,6);sound('select');}
        idle=0;return true;
      }
      const q=caravan[roverState.stop],source=roverState.stop===0?null:roverState.stop===1?q.digControl:roverState.step?q.beacon:q.dish;if(roverState.stop===0){if(!q.parts.some(wing=>M.touchPlayPart(p,wing,.20)))return false;}else if(!M.touchPlayPart(p,source,.24))return false;clearRouteIntent();return commitRouteAction(target);
    }
    function flushRouteIntent(){
      if(roverState.intentStop<0)return;
      if(roverState.phase!=='drive'||roverState.stop!==roverState.intentStop||roverState.step!==roverState.intentStep){clearRouteIntent();return;}
      if(routeOpening())return;const target=routeTarget();if(!target||target.id!==roverState.intentId){clearRouteIntent();return;}
      clearRouteIntent();commitRouteAction(target);
    }
    function updateCaravan(dt){
      for(let i=0;i<caravan.length;i++){
        if(i===3){bridgeWorkshop.update(dt,roverState.phase==='drive'&&roverState.stop===3);if(bridgeWorkshop.complete()&&!roverState.route[3]){roverState.route[3]=true;if(roverState.stop===3){roverState.stop=-1;roverState.step=0;}burst(258,ground(258)+1,C.gold,12);}continue;}
        const q=caravan[i],worked=roverState.route[i],working=roverState.stop===i&&roverState.step>0,queued=roverState.intentStop===i;
        q.intentPulse=Math.max(0,q.intentPulse-dt);const pulse=queued?.055*(1+Math.sin(elapsed*9))*.5:0;
        q.g.visible=Math.abs(player.x-q.x)<38;q.progress=M.damp(q.progress,worked||working?1:0,3.5,dt);q.lamp.material=worked?C.gold:C.dark;
        if(i===0){q.parts.forEach((wing,n)=>{const s=n?1:-1;wing.rotation.z=-s*1.15*(1-q.progress)+s*.08*q.progress;});if(routePlugDrag.owner===null)q.plug.position.lerp(worked?q.plugDock:q.plugHome,1-Math.exp(-dt*5));if(q.g.visible)q.updateCable();for(const bulb of q.powerBulbs)bulb.material=worked?q.bulbOn:q.bulbOff;}
        if(i===1){const u=worked?1:working?M.clamp((elapsed-roverState.digAt)/1.8,0,1):0;q.mound.scale.y=1-.92*u;q.rock.visible=u>.35;if(routeRockDrag.owner===null){q.rock.position.x=M.damp(q.rock.position.x,-.9+1.9*(worked?1:0),7,dt);q.rock.position.y=M.damp(q.rock.position.y,.55+.38*u,7,dt);q.rock.position.z=.18;}if(working&&!worked){const walk=M.clamp((elapsed-roverState.digAt)/.8,0,1);dog.x=seatD.x+(q.x-.9-seatD.x)*walk;dog.y=seatD.y+(q.y+.42-seatD.y)*walk+.16*Math.sin(walk*Math.PI);dog.z=seatD.z+(q.g.position.z+.35-seatD.z)*walk;dog.mode=walk<1?'walk':'dig';dog.activityMode=walk<1?'sniff':'dig';dog.vx=(q.x-.9-seatD.x)/.8;dog.vy=0;dog.grounded=walk>=1;dog.dig=Math.sin(u*Math.PI);dog.emote='curious';}}
        if(i===1){q.tray.material=queued?C.gold:C.teal;q.tray.scale.setScalar(.52*(1+pulse));}
        if(i===2){q.dish.rotation.z=-.9*(1-q.progress);q.beacon.material=worked?C.gold:queued?C.teal:C.dark;q.signal=Math.max(0,q.signal-dt);for(let n=0;n<q.waves.length;n++){const w=q.waves[n];w.visible=q.signal>0;w.scale.setScalar(.7+((elapsed*.6+n*.3)%1)*1.4);}}
      }
      const pickup=(elapsed-roverState.pickupAt)/.9;if(pickup>=0&&pickup<1){dog.x=roverState.pickupX+(seatD.x-roverState.pickupX)*pickup;dog.y=roverState.pickupY+(seatD.y-roverState.pickupY)*pickup+.16*Math.sin(pickup*Math.PI);dog.z=roverState.pickupZ+(seatD.z-roverState.pickupZ)*pickup;dog.mode='walk';dog.activityMode=undefined;dog.vx=(seatD.x-roverState.pickupX)/.9;dog.vy=0;dog.grounded=false;dog.facing=seatD.x>=roverState.pickupX?1:-1;}
    }


    // BLUE ICE: an actual sled, broad jump rings, and a soft low-gravity arc.
    const iceStart=282, iceEnd=359, ig=ground(iceStart);
    const sled=new T.Group();sled.name='Ice sled';root.add(sled);sled.position.set(iceStart,ig+.12,-1.1);
    [-.62,.62].forEach(z=>{tube([-1.72,.12,z],[.95,.12,z],.1,C.silver,sled);tube([.95,.12,z],[1.35,.5,z],.1,C.silver,sled);});
    box([-.25,.43,0],[3.1,.3,1.4],C.orange,sled);box([-1.67,.8,0],[.18,.75,1.4],C.teal,sled);const pawCanvas=document.createElement('canvas');pawCanvas.width=pawCanvas.height=64;const pc=pawCanvas.getContext('2d');pc.fillStyle='#fff4d9';pc.beginPath();pc.ellipse(32,41,13,11,0,0,Math.PI*2);pc.fill();for(const [px,py]of [[14,26],[25,17],[40,17],[51,26]]){pc.beginPath();pc.ellipse(px,py,6,8,(px-32)*.02,0,Math.PI*2);pc.fill();}const pawTexture=new T.CanvasTexture(pawCanvas);pawTexture.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(.38,.38),new T.MeshStandardMaterial({map:pawTexture,transparent:true,depthWrite:false,roughness:.8}),[-.1,.43,.711],null,sled);
    const iceRings=[],iceToys=[];
    // 4 yaş için kısa kızak: 1 kar tanesi + 3 buz keşfi + buz kapısı (toplam 5 dokunuş).
    [288,303,327,346].forEach((x,i)=>{
      const landmark=i>0,y=ground(x)+(landmark?1.65:2.05),kind=landmark?['prism','waterwheel','aurora'][i-1]:'snowflake';
      const ring=hoop([x,y,-2.35],landmark?.76:1.2,C.gold),inner=hoop([x,y,-2.35],landmark?.96:1.4,C.blue);
      ring.visible=inner.visible=false;const q={ring,inner,x,y,taken:false,kind};iceRings.push(q);
      if(!landmark){star(root,x,y+1.85,.05,.3,C.gold);return;}
      const toy=new T.Group();toy.name='Sled discovery '+kind;toy.position.set(x,ground(x),-1.45);root.add(toy);q.toy=toy;q.open=0;iceToys.push(q);
      if(kind==='prism'){
        const crystal=mesh(new T.OctahedronGeometry(1),C.blue,[0,1.65,0],[.78,1.24,.58],toy);q.crystal=crystal;
        q.control=q.targetNode=crystal;
        const cradle=new T.Group();toy.add(cradle);cyl([0,.12,0],[.58,.20,.48],C.white,cradle);tube([0,.16,0],[0,.48,0],.11,C.silver,cradle);for(const side of[-1,1]){tube([side*.16,.42,0],[side*.43,.67,0],.065,C.silver,cradle);ball([side*.43,.67,.02],[.11,.10,.10],C.orange,cradle);}if(world.batchStation)world.batchStation(cradle);
        q.beams=[];for(let n=0;n<3;n++){const beam=box([n*1.1-1.1,2.15+n*.25,-.35],[2.0,.07,.07],n===1?C.gold:C.teal,toy);beam.rotation.z=(n-1)*.32;beam.visible=false;q.beams.push(beam);}
      }else if(kind==='waterwheel'){
        const wheel=new T.Group();wheel.position.y=1.65;toy.add(wheel);hoop([0,0,0],.78,C.silver,wheel);for(let n=0;n<6;n++){const a=n*Math.PI/3;box([Math.cos(a)*.62,Math.sin(a)*.62,0],[.53,.21,.42],C.teal,wheel).rotation.z=a;}
        const hub=ball([0,0,.24],[.20,.20,.13],C.orange,wheel);q.control=wheel;q.targetNode=hub;if(world.batchStation)world.batchStation(wheel);
        const fixed=new T.Group();toy.add(fixed);tube([0,0,0],[0,1.65,0],.12,C.white,fixed);tube([0,.26,-.20],[.86,.26,-.20],.075,C.silver,fixed);tube([.86,.26,-.20],[.86,1.88,-.20],.075,C.silver,fixed);tube([.86,1.88,-.20],[1.15,1.88,.05],.075,C.silver,fixed);cyl([1.95,.12,.35],[.65,.18,.45],C.white,fixed);cyl([1.95,.22,.35],[.55,.025,.38],C.blue,fixed);if(world.batchStation)world.batchStation(fixed);q.wheel=wheel;q.drops=[];for(let n=0;n<8;n++)q.drops.push(ball([0,0,0],[.065,.09,.065],C.blue,toy));
      }else{
        for(const side of[-1,1])tube([side*.20,.9,0],[side*.7,.12,.14],.075,C.silver,toy);
        cyl([0,1.19,0],[.40,.79,.40],C.white,toy);cyl([0,1.57,0],[.44,.12,.44],C.dark,toy);
        ball([0,1.66,0],[.35,.13,.35],C.blue,toy);box([0,1.16,.41],[.43,.48,.10],C.teal,toy);
        const lever=new T.Group();lever.position.set(-.10,1.06,.50);toy.add(lever);tube([0,0,0],[.19,.35,.03],.055,C.silver,lever);const knob=ball([.19,.35,.03],[.14,.14,.12],C.orange,lever);q.lever=lever;q.control=lever;q.targetNode=knob;
        const auroraMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},open:{value:0}},
          vertexShader:'varying vec2 posUV;uniform float time;void main(){posUV=uv;vec3 p=position;p.x+=sin(uv.y*5.+time)*.13;p.z+=sin(uv.x*8.-time*.7)*.18;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
          fragmentShader:'varying vec2 posUV;uniform float time,open;void main(){float stripe=.5+.5*sin(posUV.x*34.+sin(posUV.y*6.+time)*1.2);float edge=smoothstep(0.,.13,posUV.x)*(1.-smoothstep(.87,1.,posUV.x))*smoothstep(0.,.23,posUV.y)*(1.-smoothstep(.78,1.,posUV.y));vec3 c=mix(vec3(.25,.86,.76),vec3(.65,.49,.94),posUV.y);gl_FragColor=vec4(c,(.18+.40*stripe)*edge*open);}'
        });
        q.aurora=mesh(new T.PlaneGeometry(3.3,2.3,18,12),auroraMaterial,[0,3.20,-.5],null,toy);q.aurora.visible=false;
      }
    });
    const gateRing=hoop([352,ground(352)+2.62,-3.1],.85,C.gold),gateInner=hoop([352,ground(352)+2.62,-3.1],1.05,C.blue);gateRing.visible=gateInner.visible=false;
    iceRings.push({ring:gateRing,inner:gateInner,x:352,y:ground(352)+2.62,kind:'prismGate',stopOffset:3.8,workshop:gateWorkshop,taken:false});
    // A pair of narrow icy ribbons makes the course readable without hiding terrain.
    const railExtension=new T.Group();railExtension.name='Static sled path beyond original finish';root.add(railExtension);
    [-.92,.92].forEach(z=>{for(let x=282;x<359;x+=2){const a=[x,ground(x)+.09,z],b=[x+1.65,ground(x+1.65)+.09,z];tube(a,b,.055,C.blue,x>=350?railExtension:root);}});if(world.batchStation)world.batchStation(railExtension);
    const landing=marker(iceEnd,ground(iceEnd)+.5,1.3,C.blue);landing.visible=false;landing.rotation.x=-Math.PI/2;landing.position.z=.08;
    const slideState={phase:'ready',x:iceStart,from:iceStart,to:iceEnd,time:0,lift:0,vy:0,score:0,trips:0,jumped:false};
    const jumpCue=new T.Group();root.add(jumpCue);jumpCue.position.set(315.5,ground(315.5)+.85,-1.1);tube([0,-.8,0],[0,-.1,0],.05,C.silver,jumpCue);triangle(jumpCue,0,.14,.1,.48,C.orange,Math.PI/2);triangle(jumpCue,0,.55,.1,.37,C.gold,Math.PI/2);cyl([0,-.78,0],[.24,.1,.24],C.blue,jumpCue);jumpCue.visible=false;
    const sledPlay=M.createSledPlay({root,world,rings:iceRings,slideState,player,dog,onCollect:q=>{burst(q.x,q.y,q.kind==='snowflake'?C.gold:C.teal,10);if(q.kind!=='snowflake')sound(q.kind==='prism'?'reveal':q.kind==='waterwheel'?'water':'constellation');},sound});sled.add(sledPlay.progress);sledPlay.progress.position.set(.4,.43,.74);
    function startSlide(){if(done[2]||!mission.garden||slideState.phase!=='ready')return false;slideState.from=iceStart;slideState.to=iceEnd;slideState.time=0;slideState.lift=slideState.vy=slideState.score=0;slideState.jumped=false;slideState.trips++;sledPlay.begin();jumpCue.visible=true;jumpCue.position.set(290,ground(290)+.85,-1.1);beginTransit('board','slide');call('setHint','Kar taneleri, ışık kristali, su çarkı ve gökyüzü küresi bizi bekliyor.');sound('slide');idle=0;return true;}
    function jumpSlide(){if(slideState.lift>.55)return;slideState.vy=5.8;slideState.jumped=true;sound('jump');burst(slideState.x,ground(slideState.x)+.4,C.blue,8);}

    // The finale is a tangible telescope and three illuminated friendship stars.
    const fx=475, fg=ground(fx), finale=new T.Group();finale.position.set(fx,fg,0);root.add(finale);
    const finaleStars=[];[-2.1,0,2.1].forEach((x,i)=>{const p=star(finale,x,3.7+Math.sin(i)*.45,.15,.62,done[i]?C.gold:C.dark);finaleStars.push(p);});
    const telescope=new T.Group();telescope.position.set(1.8,1.8,-1.8);telescope.rotation.z=.5;finale.add(telescope);const tele=cyl([0,0,0],[.55,2.1,.55],C.white,telescope);ball([0,1.02,0],[.5,.1,.5],C.blue,telescope);hoop([0,0,.52],.45,C.orange,telescope);tube([1.8,1.1,-1.8],[1.8,0,-1.8],.12,C.dark,finale);hoop([0,0,.54],.39,C.teal,telescope);const telescopeStar=star(telescope,0,0,.59,.32,C.gold);telescopeStar.name='Bilim kampının gerçek yıldız düğmesi';
    let finalTime=0,finished=false;
    const camp={parts:[false,false,false],phase:'waiting',time:0,from:null};
    const campPieces=[],campSockets=[],campWires=[];
    const campBuilding=new T.Group();campBuilding.name='Feza and Bilbo living science camp';campBuilding.position.set(fx,fg,-3.5);root.add(campBuilding);
    box([0,.18,0],[9.5,.33,2.7],C.white,campBuilding);box([0,.55,-.7],[8.7,.7,.42],C.dark,campBuilding);
    [-3.7,0,3.7].forEach((x,i)=>{
      const g=new T.Group();g.position.set(x,.95,.7);finale.add(g);g.name=['Camp solar module','Camp water vessel','Camp rock archive'][i];
      cyl([0,-.65,0],[.65,.2,.54],C.silver,g);const edge=hoop([0,-.52,0],.58,C.gold,g);edge.rotation.x=Math.PI/2;
      if(i===0){const panel=new T.Group();panel.position.y=.15;panel.rotation.x=.48;g.add(panel);box([0,0,0],[1.40,.13,.97],C.white,panel);const cells=C.cells;for(let col=0;col<4;col++)for(let row=0;row<3;row++)box([-.51+col*.34,.09,-.31+row*.31],[.29,.03,.26],cells,panel);if(world.batchStation)world.batchStation(panel);cyl([0,.45,-.15],[.075,.40,.075],C.silver,g);ball([0,.68,-.15],[.16,.20,.16],C.gold,g);}
      if(i===1){cyl([0,.16,0],[.36,.82,.34],C.blue,g);ball([0,.55,0],[.36,.21,.34],C.blue,g);cyl([0,.76,0],[.17,.22,.17],C.silver,g);cyl([0,.91,0],[.23,.12,.23],C.white,g);for(let n=0;n<10;n++){const a=n*Math.PI/5;box([Math.cos(a)*.23,.91,Math.sin(a)*.23],[.035,.10,.035],C.silver,g);}const handle=hoop([.37,.20,0],.29,C.white,g);handle.scale.y=.38;ball([0,.17,.34],[.19,.24,.035],C.white,g);const drop=new T.Shape();drop.moveTo(0,.17);drop.bezierCurveTo(-.04,.11,-.15,-.03,-.12,-.12);drop.bezierCurveTo(-.07,-.23,.13,-.20,.13,-.08);drop.bezierCurveTo(.12,.02,.04,.12,0,.17);mesh(new T.ExtrudeGeometry(drop,{depth:.02,bevelEnabled:false,curveSegments:6}),C.teal,[0,.21,.37],null,g);}
      if(i===2){box([0,-.1,0],[1.25,.25,.85],C.orange,g);[-.34,0,.34].forEach((x,n)=>mesh(new T.OctahedronGeometry(1),[C.sand,C.silver,C.blue][n],[x,.24,0],[.23,.30,.22],g));}
      const socket=hoop([(i-1)*2.5,1.05,-2.6],.62,ghostMat,finale);campSockets.push(socket);campPieces.push({g,x,progress:0,edge});
      const wire=tube([(i-1)*2.5,.72,-3.1],[(i-1)*2.5,2.1,-3.1],.045,C.dark,finale);campWires.push(wire);
    });
    const campGarden=new T.Group();campGarden.position.set(-2.6,.9,.1);campBuilding.add(campGarden);
    for(let n=-1;n<=1;n++){const stem=tube([n*.45,0,0],[n*.45,1.4+Math.cos(n)*.3,0],.045,C.green,campGarden);ball([n*.45,1.55+Math.cos(n)*.3,0],[.25,.20,.20],C.gold,campGarden);for(const s of [-1,1])ball([n*.45+s*.17,.8,0],[.25,.08,.10],C.green,campGarden).rotation.z=s*.45;}
    const campAntenna=new T.Group();campAntenna.position.set(2.7,.82,0);campBuilding.add(campAntenna);tube([0,0,0],[0,1.9,0],.08,C.silver,campAntenna);hoop([0,1.9,.05],.60,C.white,campAntenna);star(campAntenna,0,1.9,.15,.26,C.gold);
    const campDrops=[];for(let n=0;n<10;n++){const o=ball([0,0,0],[.075,.10,.075],C.blue,campBuilding);o.visible=false;campDrops.push(o);}
    const campBootBase=cyl([.95,.07,.36],[.61,.12,.49],C.dark,finale),campPawBase=cyl([-1.45,.07,.36],[.61,.12,.49],C.dark,finale);for(const side of[-1,1])ball([.95+side*.15,.145,.36],[.095,.025,.24],C.white,finale);
    const campBoot=hoop([.95,.1,.36],.56,C.orange,finale);campBoot.rotation.x=-Math.PI/2;
    const campPaw=hoop([-1.45,.1,.36],.56,C.teal,finale);campPaw.rotation.x=-Math.PI/2;paw(finale,-1.45,.15,.37,.65,C.white);
    const campSupplyReady=i=>i===0?mission.power&&mission.heli:i===1?mission.water&&mission.garden:mission.samples&&mission.constellation;
    function campReady(){return done.every(Boolean)&&campSupplyReady(0)&&campSupplyReady(1)&&campSupplyReady(2);}
    function installCamp(i){
      if(camp.parts[i]||!campReady()){finish();return;}
      camp.parts[i]=true;idle=0;burst(fx+campPieces[i].x,fg+1.6,C.teal,9);sound('snap');
    }
    function updateCamp(dt){
      campBuilding.visible=Math.abs(player.x-fx)<45;
      if(!finished&&camp.phase==='waiting'&&campReady()&&nearby(fx,14)&&!player.locked&&Math.abs(player.vx)<.6)call('frameActivity',Math.min(fx-5,player.x-1.05,dog.x-1.2),fx+5,fg+2.15,.98);
      campPieces.forEach((q,i)=>{q.progress=M.damp(q.progress,camp.parts[i]?1:0,3.4,dt);q.g.position.set(q.x*(1-q.progress)+(i-1)*2.5*q.progress,.95+q.progress*.65,.7-q.progress*3.8);q.g.rotation.y=q.progress*Math.PI*2;q.edge.material=campSupplyReady(i)?C.gold:C.dark;campSockets[i].visible=!camp.parts[i];campWires[i].material=camp.parts[i]?C.teal:C.dark;});
      const alive=camp.phase==='joining'||camp.phase==='alive';campGarden.scale.setScalar(alive?.8+.2*Math.min(1,camp.time/2):.12);campAntenna.rotation.y=alive?Math.sin(elapsed*.6)*.3:0;
      for(let n=0;n<campDrops.length;n++){const d=campDrops[n];d.visible=alive;if(alive){const u=(elapsed*.45+n*.1)%1;d.position.set(Math.sin(n*2.4)*.7,1.0+2.3*Math.sin(u*Math.PI),.2+Math.cos(n)*.3);}}
      if(camp.phase==='joining'){
        camp.time+=dt;const u=M.clamp(camp.time/1.45,0,1),v=u*u*(3-2*u);
        movers.forEach((a,i)=>{const start=camp.from[i],x=fx+(i?-1.45:.95),previous=a.x;a.x=start.x+(x-start.x)*v;a.y=ground(a.x);a.z=(start.z||0)*(1-v)+.36*v;a.vx=(a.x-previous)/Math.max(dt,.001);a.vy=0;a.mode=u<1?'walk':'idle';a.facing=i?1:-1;a.emote='happy';a.grounded=true;});
        call('frameActivity',fx-5,fx+5,fg+2.25,.94);
        if(camp.time>=2.6){camp.phase='alive';finished=true;release();finalTime=6;call('celebrate',fx,fg+2);sound('success');note('Güneş, su ve kaya keşiflerin bilim kampını uyandırdı. Feza ve Bilbo birlikte başardı!',7);}
      }
      campBoot.material=campPaw.material=alive?C.gold:C.teal;
    }
    // An optional local shuttle for little explorers who walked straight to the observatory.
    // It only offers another ride after a real discovery. No mission is completed by the shuttle.
    const taxi={used:false,pad:NaN,at:NaN,target:3,time:0,airborne:false,moved:false,ship:null,flight:null,passenger:null};
    let boardingLamp, ticket, ticketMats;
    function destinationPicture(n){
      const tile=document.createElement('canvas');tile.width=tile.height=128;
      const g=tile.getContext('2d');g.lineJoin=g.lineCap='round';g.fillStyle='#184652';g.beginPath();g.arc(64,64,61,0,Math.PI*2);g.fill();
      g.strokeStyle='#ffd475';g.lineWidth=6;g.stroke();g.fillStyle='#fff1c7';g.strokeStyle='#fff1c7';g.lineWidth=7;
      const dot=(x,y,r)=>{g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};
      const line=(x,y,tx,ty)=>{g.beginPath();g.moveTo(x,y);g.lineTo(tx,ty);g.stroke();};
      if(n===0){
        g.beginPath();g.roundRect(28,42,72,51,10);g.stroke();dot(49,62,6);dot(80,62,6);
        line(61,41,61,31);dot(61,27,6);line(51,80,75,80);
      }else if(n===1){
        g.beginPath();g.moveTo(24,76);g.lineTo(32,53);g.lineTo(70,53);g.lineTo(83,66);g.lineTo(100,70);g.lineTo(100,80);g.lineTo(24,80);g.stroke();dot(40,87,7);dot(85,87,7);
      }else if(n===2){
        g.translate(64,64);for(let b=0;b<6;b++){line(0,0,0,-36);line(0,-20,-9,-27);line(0,-20,9,-27);g.rotate(Math.PI/3);}
      }else if(n===4){
        dot(64,35,17);for(let i=0;i<6;i++){const a=i*Math.PI/3;line(64+Math.cos(a)*22,35+Math.sin(a)*22,64+Math.cos(a)*30,35+Math.sin(a)*30);}g.strokeRect(26,78,77,20);line(64,98,64,110);
      }else if(n===5){
        g.beginPath();g.moveTo(64,22);g.bezierCurveTo(18,72,27,104,64,104);g.bezierCurveTo(101,104,110,72,64,22);g.stroke();
      }else if(n===6){
        g.beginPath();g.moveTo(27,90);g.lineTo(43,59);g.lineTo(61,76);g.lineTo(78,45);g.lineTo(103,90);g.closePath();g.stroke();g.beginPath();g.arc(80,43,20,0,Math.PI*2);g.stroke();line(94,58,110,77);
      }else if(n===7){
        dot(64,43,12);for(let i=0;i<6;i++){const a=i*Math.PI/3;dot(64+Math.cos(a)*20,43+Math.sin(a)*20,10);}line(64,66,64,105);line(64,86,43,76);line(64,95,85,84);
      }else if(n===8){
        for(const [x,y]of [[28,70],[47,49],[67,60],[86,37],[103,56]])dot(x,y,6);line(28,70,47,49);line(47,49,67,60);line(67,60,86,37);line(86,37,103,56);
      }else if(n===9){
        g.strokeRect(47,62,36,28);line(64,61,64,32);line(28,31,100,31);line(34,43,95,43);line(42,96,88,96);line(52,90,46,102);line(76,90,83,102);
      }else{
        line(61,64,61,84);line(61,80,42,98);line(61,80,78,98);g.translate(61,54);g.rotate(-.53);g.strokeRect(-25,-10,51,20);line(28,-16,28,17);
      }
      const tex=new T.CanvasTexture(tile);tex.colorSpace=T.SRGBColorSpace;
      return new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});
    }
    function taxiModel(){
      if(taxi.ship)return;
      const g=taxi.ship=new T.Group();g.name='Keşif mekiği';root.add(g);
      ball([0,.73,0],[1.34,.48,.58],C.white,g);ball([-.12,1.10,0],[.81,.42,.50],C.teal,g);
      box([-.45,.47,.24],[1.24,.11,1.19],C.orange,g);
      tube([-.96,.69,-.05],[-1.32,1.29,-.05],.14,C.red,g);
      boardingLamp=ball([1.21,.75,.13],[.13,.13,.13],C.gold,g);
      for(const s of [-1,1]){box([s*.59,.23,0],[.14,.32,.31],C.dark,g);box([s*.59,.10,0],[.42,.11,.44],C.silver,g);}
      ticketMats=[0,1,2,3,4,5,6,7,8,9].map(destinationPicture);
      ticket=mesh(new T.PlaneGeometry(.96,.96),ticketMats[0],[.02,.98,.56],null,g);ticket.castShadow=false;
    }
    const taxiStopXs=[70,0,0,fx,95,366,416,274,451,118];
    function nextStop(){return !done[0]?0:!mission.power?4:!mission.heli?9:!done[1]?1:!mission.garden?7:!done[2]?2:!mission.water?5:!mission.samples?6:!mission.constellation?8:3;}
    function stopX(n){return n===1?(roverState.phase==='build'?vx:roverState.x):n===2?slideState.x:taxiStopXs[n];}
    mission.signal=function(kind,x){mission[kind]=true;if(taxi.used&&Number.isFinite(x))taxi.pad=x+4;};
    function setTaxiPad(i){
      if(!taxi.used)return;
      taxi.pad=i===0?77.7:i===1?roverState.x+Math.sign(roverState.to-roverState.from)*5.1:slideState.x+Math.sign(slideState.to-slideState.from)*4.9;
    }
    function taxiAvailable(){return taxi.ship?.visible&&!taxi.airborne&&Number.isFinite(taxi.at)&&nearby(taxi.at,13);}
    function refreshTaxi(){
      const next=nextStop();
      const alreadyHere=Math.abs(player.x-stopX(next))<10;
      taxi.at=alreadyHere?NaN:!finished&&next!==3&&nearby(fx,14)?fx-5.3:!finished&&taxi.used&&Number.isFinite(taxi.pad)&&nearby(taxi.pad,16)?taxi.pad:NaN;
      if(!Number.isFinite(taxi.at)||player.locked){if(taxi.ship)taxi.ship.visible=false;return;}
      taxiModel();taxi.target=next;taxi.ship.visible=true;taxi.ship.position.set(taxi.at,ground(taxi.at)+.12+.075*Math.sin(elapsed*2.2),-.87);
      ticket.material=ticketMats[next];boardingLamp.scale.setScalar(.14+.025*Math.sin(elapsed*3.4));
    }
    function boardTaxi(){
      if(!taxiAvailable())return false;
      taxi.used=true;taxi.airborne=true;taxi.time=0;taxi.moved=false;taxi.pad=NaN;taxi.ship.visible=false;
      player.locked=dog.locked=true;player.vx=player.vy=dog.vx=dog.vy=0;dog.activityTargetX=undefined;dog.activityMode=undefined;
      selectedRobot=selected=-1;drag=null;helper.visible=false;idle=0;
      if(!taxi.flight){
        const sky=taxi.flight=document.createElement('div');sky.setAttribute('aria-hidden','true');
        sky.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;background:radial-gradient(ellipse at 36% 150%,#e6ab7c 0%,#915e73 34%,#263958 66%,#101f37 100%);';
        const ship=taxi.passenger=document.createElement('img');ship.src='assets/orbit/shuttle.webp';ship.alt='';ship.style.cssText='position:absolute;left:50%;top:51%;width:min(43vw,42vh,390px);height:auto;';
        sky.appendChild(ship);const hud=document.getElementById('hud');hud.parentNode.insertBefore(sky,hud);
      }
      taxi.flight.hidden=false;taxi.flight.style.opacity='0';sound('rover');return true;
    }
    function taxiUpdate(dt){
      taxi.time+=dt;const u=Math.min(1,taxi.time/3.3),s=Math.sin(u*Math.PI);
      const fade=Math.min(1,u/.14,(1-u)/.19);taxi.flight.style.opacity=String(fade);
      const left=taxi.target===3||stopX(taxi.target)>taxi.at?1:-1;
      taxi.passenger.style.transform='translate('+(-50+left*(u-.5)*88)+'%,'+(-43-s*19)+'%) scaleX('+left+') rotate('+(-6*s)+'deg)';
      if(u>=.17&&!taxi.moved){
        taxi.moved=true;const dest=stopX(taxi.target);
        player.x=dest-(taxi.target===7?6.6:taxi.target===1?1.6:1);dog.x=player.x-1.7;
        for(const a of movers){a.y=ground(a.x);a.z=a===dog?.3:0;a.mode='idle';a.facing=1;a.grounded=true;a.emote='';}
      }
      if(taxi.moved)call('setCameraTarget',player.x+1.4,player.y+2.1,.98,1);
      if(u>=1){taxi.airborne=false;taxi.at=NaN;taxi.flight.hidden=true;release();idle=5.5;}
    }

    function finish(){
      if(finished||camp.phase==='joining')return;
      if(!campReady()){refreshTaxi();idle=7;note('Bilim kampının resimleri bizi bekleyen keşfi gösteriyor. Minik mekiğe dokunabiliriz.');sound('select');return;}
      if(!camp.parts.every(Boolean)){idle=7;note('Güneş panelini, su kabını ve kaya kutusunu kampın ışıklı yuvalarına taşıyalım.');return;}
      camp.phase='joining';camp.time=0;camp.from=movers.map(a=>({x:a.x,y:a.y,z:a.z}));player.locked=dog.locked=true;dog.activityTargetX=undefined;dog.activityMode=undefined;sound('constellation');
    }

    // A quiet, visible helper points to the next real action. It never solves a task.
    const helper=new T.Group();root.add(helper);helper.visible=false;
    // A single cached illustration makes the gesture legible to a non-reader.
    const handCanvas=document.createElement('canvas');handCanvas.width=handCanvas.height=256;
    const hc=handCanvas.getContext('2d');hc.lineWidth=9;hc.lineJoin='round';hc.strokeStyle='#245460';hc.fillStyle='#f8f6e9';
    hc.beginPath();hc.moveTo(78,53);hc.bezierCurveTo(80,31,102,30,108,50);hc.lineTo(112,87);hc.lineTo(117,84);hc.lineTo(117,36);hc.bezierCurveTo(118,13,146,13,147,36);hc.lineTo(147,91);hc.lineTo(152,91);hc.lineTo(152,47);hc.bezierCurveTo(154,28,177,32,177,51);hc.lineTo(177,105);hc.bezierCurveTo(192,86,209,96,205,115);hc.lineTo(188,157);hc.bezierCurveTo(183,170,171,179,158,180);hc.lineTo(157,224);hc.bezierCurveTo(155,246,130,246,129,224);hc.lineTo(127,171);hc.bezierCurveTo(92,164,81,146,79,123);hc.lineTo(78,53);hc.closePath();hc.fill();hc.stroke();
    hc.fillStyle='#e79b57';hc.fillRect(83,65,23,24);hc.strokeStyle='#acc4c6';hc.lineWidth=5;hc.beginPath();hc.moveTo(117,117);hc.lineTo(156,117);hc.moveTo(143,143);hc.lineTo(169,136);hc.stroke();
    const handTexture=new T.CanvasTexture(handCanvas);handTexture.colorSpace=T.SRGBColorSpace;
    const handSprite=new T.Sprite(new T.SpriteMaterial({map:handTexture,transparent:true,depthTest:false,depthWrite:false}));handSprite.scale.set(1.12,1.12,1);handSprite.position.set(0,.5,.3);handSprite.renderOrder=20;helper.add(handSprite);
    const touchMat=new T.MeshBasicMaterial({color:0xffe7ac,transparent:true,opacity:.65,depthWrite:false,depthTest:false});
    const touchRing=hoop([0,0,.25],.22,touchMat,helper);touchRing.renderOrder=19;
    function helperTarget(){if(taxiAvailable())return{x:taxi.at,y:ground(taxi.at)+1.23};if(player.x<24)return{x:player.x+3,y:ground(player.x+3)+.08};if(nearby(70,14)){const h=robotHintTarget();if(h)return h;}if(nearby(182,16)||nearby(roverState.x,9)){if(roverState.phase==='build'){const i=selected>=0?selected:parts.findIndex(q=>!q.placed);if(i>=0){if(selected>=0)return dests[i];const p=sources[i],q=dests[i],u=M.clamp(((elapsed%3.5)-.65)/1.9,0,1),v=u*u*(3-2*u);return{x:p.x+(q.x-p.x)*v,y:p.y+(q.y-p.y)*v+.45*Math.sin(v*Math.PI)};}}if(!done[1]&&roverState.phase==='ready')return{x:roverState.x+(roverState.x>210?-1.8:1.8),y:ground(roverState.x)+.95};}if(!done[2]&&mission.garden&&nearby(slideState.x,14)&&slideState.phase==='ready')return{x:slideState.x+(slideState.x>315?-1.1:1.1),y:ground(slideState.x)+.58};if(nearby(fx,12)){const i=campReady()?camp.parts.indexOf(false):-1;return i>=0?{x:fx+campPieces[i].x,y:fg+1.1}:{x:fx+1.8,y:fg+1.8};}return null;}

    function pointer(type,p,event){
      if(!helpBusy&&type==='down')helpT=0;
      if(routeRockPointer(type,p,event))return true;
      if(routePlugPointer(type,p,event))return true;
      if(type==='cancel'){bridgeWorkshop.pointer(type,p,event);gateWorkshop.pointer(type,p,event);}
      if(roverState.phase==='drive'&&roverState.stop===3){if(bridgeWorkshop.pointer(type,p,event))return true;}
      if(slideState.phase==='slide'&&sledPlay.pointer(type,p,event)){idle=0;return true;}
      if(type==='cancel'&&roverState.intentStop>=0&&(!event||event.pointerId===roverState.intentPointer)){clearRouteIntent();return true;}
      if(!p)return false;
      if(drag){
        const d=drag,robotPart=d.kind==='robot',q=robotPart?robotPieces[d.i]:parts[d.i];
        // Another finger can point to the matching slot while the first holds the piece.
        if(event&&event.pointerId!==d.id){
          if(type==='down'){
            if(robotPart&&robotSlotHit(d.i,p))attachRobot(d.i);
            else if(!robotPart&&hit(p,dests[d.i].x,dests[d.i].y,1.6))place(d.i);
          }
          return true;
        }
        if(type==='move'){
          if(Math.hypot(p.x-d.x,p.y-d.y)>.15)d.moved=true;
          if(d.moved)q.g.position.set(p.x-(robotPart?0:q.offset.x),p.y-(robotPart?0:q.offset.y),.4);
        }else if(type==='cancel'||type==='up'){
          drag=null;
          if(type==='up'&&d.moved&&robotPart&&robotSlotHit(d.i,p,true))attachRobot(d.i);
          else if(type==='up'&&d.moved&&!robotPart&&hit(p,dests[d.i].x,dests[d.i].y,2.1))place(d.i);
          else q.g.position.copy(robotPart?q.home:q.g.userData.home);
        }
        return true;
      }
      if(type!=='down')return false;
      if(transit||taxi.airborne)return false;
      if(taxiAvailable()&&hit(p,taxi.at,ground(taxi.at)+1.02,1.67))return boardTaxi();
      if(roverState.phase==='drive'){if(routeAction(p,event))return true;if(hit(p,roverState.x,ground(roverState.x)+1,3)){hopRover();idle=0;return true;}return false;}
      if(slideState.phase==='slide'){if(sledPlay.pointer(type,p,event)){idle=0;return true;}return false;}
      if(robotPointer(p,event))return true;
      if(nearby(182,19)||nearby(roverState.x,7)){
        if(roverState.phase==='build'){
          if(selected>=0&&hit(p,dests[selected].x,dests[selected].y,1.6)){place(selected);return true;}
          let picked=visiblePart(event);if(picked<0)for(let i=0;i<parts.length;i++){if(!parts[i].placed&&M.touchPlayPart(p,parts[i].g,.22)){picked=i;break;}}
          if(picked>=0){choose(picked);drag={kind:'rover',i:picked,id:event?.pointerId,x:p.x,y:p.y,moved:false};return true;}
        }else if(!done[1]&&roverState.phase==='ready'){
          if(hit(p,roverState.x,ground(roverState.x)+1.1,2.5))return startDrive();
        }
      }
      if(!done[2]&&mission.garden&&slideState.phase==='ready'&&nearby(slideState.x,15)&&hit(p,slideState.x,ground(slideState.x)+1,2.0))return startSlide();
      if(nearby(fx,14)&&campReady()){for(let i=0;i<3;i++)if(!camp.parts[i]&&M.touchPlayPart(p,campPieces[i].g,.20)){installCamp(i);return true;}if(M.touchPlayPart(p,telescopeStar,.22)||M.touchPlayPart(p,campBootBase,.15)||M.touchPlayPart(p,campPawBase,.15)){finish();return true;}}
      return false;
    }
    function interact(){idle=0;if(transit||taxi.airborne||camp.phase==='joining')return true;if(taxiAvailable()&&nearby(taxi.at,4.75))return boardTaxi();if(roverState.phase==='drive'){hopRover();return true;}if(slideState.phase==='slide'){jumpSlide();return true;}if(nearby(70,12)){if(robot.awake)friendlyRobot();else{const i=robotFocus();if(i>=0){if(!robotPieces[i].dug)dig(i);else if(selectedRobot===i)attachRobot(i);else chooseRobot(i);}}return true;}if(!done[1]&&nearby(roverState.x,10)&&roverState.phase==='ready')return startDrive();if(nearby(182,10)&&roverState.phase==='build'){if(selected>=0)place(selected);else choose(parts.findIndex(p=>!p.placed));return true;}if(!done[2]&&mission.garden&&nearby(slideState.x,8)&&slideState.phase==='ready')return startSlide();if(nearby(fx,9)){const i=campReady()?camp.parts.indexOf(false):-1;if(i>=0)installCamp(i);else finish();return true;}return false;}
    // The large jump control stays a jump while a vehicle owns the actors.
    // Keyboard interaction remains separate; no jump can operate an instrument.
    function jump(){
      if(transit||taxi.airborne||camp.phase==='joining')return false;
      if(roverState.phase==='drive'){hopRover();idle=0;return true;}
      if(slideState.phase==='slide'){jumpSlide();idle=0;return true;}
      return false;
    }
    // One continuous, frame-rate independent approach / hop / seat / disembark motion.
    // Root origins are fitted to the actual reused character hips; no actor teleporting.
    let transit=null;
    const seatP={},seatD={};
    function seats(kind){
      const q=kind==='rover'?roverState:slideState,dir=q.to>q.from?1:-1,obj=kind==='rover'?rover:sled;
      const fp=actors.feza.anchors||{},bp=actors.bilbo.anchors||{};
      seatP.x=q.x+(kind==='rover'?.45:.1)*dir;
      seatD.x=q.x-(kind==='rover'?.9:.85)*dir;
      seatP.y=obj.position.y+(kind==='rover'?1.295-(fp.rideHip||.3795):.58-(fp.slideHip||.3105));
      seatD.y=obj.position.y+(kind==='rover'?1.295-(bp.ridePaw??.004):.58-(bp.slidePaw??.025));
      seatP.z=kind==='rover'?-1.25:-1.02;seatD.z=kind==='rover'?-.92:-.78;
      return dir;
    }
    function release(){player.locked=dog.locked=false;player.vx=player.vy=dog.vx=dog.vy=0;player.grounded=dog.grounded=true;player.mode=dog.mode='idle';player.z=0;dog.z=.3;dog.activityTargetX=undefined;dog.activityMode=undefined;call('setCameraTarget',null);}
    function beginTransit(stage,kind){
      const q=kind==='rover'?roverState:slideState,dir=seats(kind),board=stage==='board';
      q.phase=board?'boarding':'disembark';player.locked=dog.locked=true;dog.activityTargetX=undefined;dog.activityMode=undefined;
      const targets=board?[{...seatP},{...seatD}]:[{x:q.x+3.3*dir,y:ground(q.x+3.3*dir),z:0},{x:q.x+1.5*dir,y:ground(q.x+1.5*dir),z:.3}];
      transit={stage,kind,dir,time:0,duration:board?Math.max(1.5,Math.min(5,Math.max(Math.abs(player.x-targets[0].x),Math.abs(dog.x-targets[1].x))/4+.8)):1.3,from:[{x:player.x,y:player.y,z:player.z||0},{x:dog.x,y:dog.y,z:dog.z??.3}],targets};
    }
    function updateTransit(dt){
      if(!transit)return;const tr=transit,q=tr.kind==='rover'?roverState:slideState,board=tr.stage==='board';tr.time+=dt;const u=Math.min(1,tr.time/tr.duration),obj=tr.kind==='rover'?rover:sled;
      obj.rotation.y=M.damp(obj.rotation.y,tr.dir>0?0:Math.PI,7,dt);
      movers.forEach((a,i)=>{const from=tr.from[i],to=tr.targets[i],oldX=a.x,walkEnd=.64,hop=board?M.clamp((u-walkEnd)/(1-walkEnd),0,1):u;
        if(board&&u<walkEnd){const w=u/walkEnd;a.x=from.x+(to.x-tr.dir*.65-from.x)*w;a.y=ground(a.x);a.z=from.z;a.mode='walk';a.grounded=true;}
        else{const v=hop*hop*(3-2*hop),sx=board?to.x-tr.dir*.65:from.x,sy=board?ground(sx):from.y,sz=board?from.z:from.z;a.x=sx+(to.x-sx)*v;a.y=sy+(to.y-sy)*v+Math.sin(hop*Math.PI)*(i?.44:.66);a.z=sz+(to.z-sz)*v;a.mode=hop>.9&&board?(tr.kind==='rover'?'ride':'slide'):'jump';a.grounded=hop>.98;a.vy=Math.cos(hop*Math.PI)*2.2;}
        a.vx=dt?(a.x-oldX)/dt:0;if(Math.abs(a.vx)>.03)a.facing=Math.sign(a.vx);if(board&&u>.9)a.facing=tr.dir;
      });
      call('frameActivity',Math.min(player.x-.8,dog.x-1.15,q.x-2.4),Math.max(player.x+.8,dog.x+.9,q.x+2.4),ground(q.x)+2.0,.96);
      if(u>=1){transit=null;if(board){q.phase=tr.kind==='rover'?'drive':'slide';q.time=0;}else{q.phase='ready';release();task(tr.kind==='rover'?1:2);sound('success');}}
    }
    // Takılan çocuğa yardım: 18 sn ilerleme yoksa gösterilen hareketi oyun kendisi bir kez yapar.
    const helpStep={from:new T.Vector3(),to:new T.Vector3(),action:'',progress:0,total:0},helpMid=new T.Vector3(),helpEvent={pointerId:-77,autoHelp:true};let helpT=0,helpKey='',helpBusy=false,helpClock=0;
    function autoHelp(){
      const now=performance.now(),dt=helpClock?Math.min(.25,(now-helpClock)/1000):0;helpClock=now;
      let L=null;for(const e of lessons){if(e.enabled()&&!e.completed()&&Math.abs(player.x-(typeof e.x==='function'?e.x():e.x))<(e.range||10)){L=e;break;}}
      if(!L||L.id==='mars-taxi'||drag||transit||taxi.airborne||(!player.locked&&Math.abs(player.vx)>.25)){helpT=0;return;}
      helpStep.action='';helpStep.demoObject=null;if(!L.describe(helpStep)){helpT=0;return;}
      const key=L.id+'|'+helpStep.progress+'|'+helpStep.action+'|'+(slideState.phase==='slide'?sledPlay.state().collected:'');
      if(key!==helpKey){helpKey=key;helpT=0;return;}
      if(helpStep.action!=='drag'&&helpStep.action!=='tap'&&helpStep.action!=='press'){helpT=0;return;}
      helpT+=dt;if(helpT<18)return;helpT=6;helpBusy=true;
      if((L.id==='mars-rover-stop-0'||L.id==='mars-rover-stop-1')&&helpStep.action==='drag'){helpBusy=false;const q=routeTarget(true);if(q&&!routeOpening())commitRouteAction(q);return;}
      try{pointer('down',helpStep.from,helpEvent);if(helpStep.action==='drag'){helpMid.lerpVectors(helpStep.from,helpStep.to,.5);pointer('move',helpMid,helpEvent);pointer('move',helpStep.to,helpEvent);}pointer('up',helpStep.action==='drag'?helpStep.to:helpStep.from,helpEvent);}catch(_){pointer('cancel',null,helpEvent);}
      helpBusy=false;
    }
    function update(dt,t){
      elapsed=t||elapsed+dt;idle+=dt;autoHelp();noteClock+=dt;if(!player.locked&&Math.abs(player.vx)>.25)idle=0;
      if(taxi.airborne){taxiUpdate(dt);return;}
      updateCamp(dt);
      if(camp.phase==='joining')return;
      updateRobot(dt);
      updateTransit(dt);refreshTaxi();
      sparks.forEach(s=>{if(s.life<=0)return;s.life-=dt;s.o.visible=s.life>0;s.o.position.x+=s.vx*dt;s.o.position.y+=s.vy*dt;s.o.position.z+=s.vz*dt;s.vy-=4*dt;s.o.scale.setScalar(.09*Math.min(1,s.life*2));});
      parts.forEach((q,i)=>{if(q.install){const a=q.install;a.time+=dt;const u=Math.min(1,a.time/.55),v=u*u*(3-2*u);q.g.position.set(a.x*(1-v),a.y*(1-v)+Math.sin(u*Math.PI)*.65,a.z*(1-v));if(u>=1){q.g.position.set(0,0,0);q.install=null;q.pop=.35;assemblyReady();}}if(!q.placed&&(!drag||drag.i!==i)){q.g.position.y=q.g.userData.home.y+Math.sin(elapsed*1.7+i)*.08;}if(q.pop>0){q.pop=Math.max(0,q.pop-dt);q.g.scale.setScalar(1+Math.sin(q.pop*21)*q.pop*.22);}if(q.target.visible){q.target.scale.setScalar(1+Math.sin(elapsed*3)*.08);}});
      if((roverState.phase==='build'||roverState.phase==='ready'&&Math.abs(roverState.x-vx)<.5)&&nearby(182,10)&&!player.locked&&Math.abs(player.vx)<.6){call('frameActivity',Math.min(172.5,player.x-.8,dog.x-1.15),Math.max(188.5,player.x+.8,dog.x+.9),vg+1.8,.94);}
      if(roverState.phase==='drive'){
        roverState.time+=dt;const dir=roverState.to>roverState.from?1:-1;
        let next=-1,remaining=Infinity;
        for(let i=0;i<caravan.length;i++){const distance=dir*(caravan[i].x-dir*4.5-roverState.x);if(!roverState.route[i]&&distance>=-.04&&distance<remaining){remaining=distance;next=i;}}
        const stopX=next>=0?caravan[next].x-dir*4.5:roverState.to,rest=Math.max(0,dir*(stopX-roverState.x));
        const held=roverState.stop>=0||elapsed-roverState.pickupAt<.9,wanted=held?0:Math.min(5.4,1.0+rest*1.8);
        roverState.speed=M.damp(roverState.speed,wanted,wanted>roverState.speed?3.2:6,dt);
        const before=roverState.x;if(!held)roverState.x+=dir*Math.min(rest,roverState.speed*dt);
        if(!held&&rest<.035){roverState.x=stopX;roverState.speed=0;if(next>=0){roverState.stop=next;roverState.step=0;idle=3;}else{rover.rotation.z=0;beginTransit('exit','rover');note('Bilim arabası güneş, kaya ve radyo keşiflerini taşıdı!');}}
        roverState.bounceV-=7*dt;roverState.bounce+=roverState.bounceV*dt;if(roverState.bounce<0){roverState.bounce=0;roverState.bounceV=0;}
        const y=ground(roverState.x)+.15+roverState.bounce;rover.position.set(roverState.x,y,-1.3);rover.rotation.z=Math.sin(elapsed*8)*.014+roverState.bounceV*.014;wheelRigs.forEach(q=>{q.rotation.z=-(roverState.x-vx)/.61;});
        seats('rover');player.x=seatP.x;player.y=seatP.y;player.z=seatP.z;player.mode='ride';player.facing=dir;player.vx=(roverState.x-before)/Math.max(dt,.001);player.grounded=roverState.bounce<.03;player.vy=roverState.bounceV;dog.x=seatD.x;dog.y=seatD.y;dog.z=seatD.z;dog.vx=player.vx;dog.mode='ride';dog.activityMode=undefined;dog.facing=dir;dog.grounded=player.grounded;dog.vy=player.vy;
        if(roverState.stop===3)call('frameActivity',Math.min(roverState.x-3.5,254.0),Math.max(roverState.x+3.5,262.2),ground(258)+2,.96);else if(roverState.stop>=0)call('frameActivity',roverState.x-3.5,caravan[roverState.stop].x+2.7,y+1.7,.96);else call('setCameraTarget',roverState.x+3*dir,y+1.6,1,1);
      }
      updateCaravan(dt);
      // Finish the visible opening / dig frame before consuming its reserved tap.
      flushRouteIntent();
      gateWorkshop.update(dt,slideState.phase==='slide'&&sledPlay.nextIndex()===iceRings.length-1);
      if(slideState.phase==='slide'){
        slideState.time+=dt;sledPlay.advance(dt);slideState.vy-=5.5*dt;slideState.lift+=slideState.vy*dt;if(slideState.lift<0){slideState.lift=0;slideState.vy=0;}
        const dir=slideState.to>slideState.from?1:-1,y=ground(slideState.x)+.12+slideState.lift;sled.position.set(slideState.x,y,-1.1);sled.rotation.z=-slideState.vy*.035*dir;seats('slide');player.x=seatP.x;player.y=seatP.y;player.z=seatP.z;player.mode='slide';player.facing=dir;player.vx=slideState.speed||0;player.grounded=slideState.lift<.03;player.vy=slideState.vy;dog.x=seatD.x;dog.y=seatD.y;dog.z=seatD.z;dog.vx=player.vx;dog.mode='slide';dog.facing=dir;dog.grounded=player.grounded;dog.vy=player.vy;
        jumpCue.scale.setScalar(1+Math.sin(elapsed*4)*.05);if(sledPlay.nextIndex()===iceRings.length-1)call('frameActivity',Math.min(slideState.x-2.7,348.3),356.7,ground(352)+1.95,.96);else call('setCameraTarget',slideState.x+4*dir,y+1.8,1,1);
        sledPlay.update(dt,elapsed,y);
        if(sledPlay.finished()){jumpCue.visible=false;sled.rotation.z=0;slideState.x=slideState.to;beginTransit('exit','slide');note('Kar tanesi ve üç buz keşfi kamp yolunu aydınlattı!');}

      }
      iceRings.forEach((q,i)=>{q.ring.rotation.z=elapsed*.25+i;q.inner.rotation.z=-elapsed*.2;});
      for(const q of iceToys){q.toy.visible=Math.abs(player.x-q.x)<35;q.open=M.damp(q.open,q.taken?1:0,2.8,dt);if(q.crystal){q.crystal.rotation.y=q.open*Math.PI*.5;for(const b of q.beams){b.visible=q.open>.01;b.scale.x=q.open;}}if(q.wheel){q.wheel.rotation.z+=dt*q.open*2;for(let n=0;n<q.drops.length;n++){const d=q.drops[n],u=(elapsed*.65+n*.125)%1;d.visible=q.open>.02;d.position.set(.8+u*1.5,1.9+Math.sin(u*Math.PI)*1.2-u*.6,.3);}}if(q.lever)q.lever.rotation.z=-q.open*1.05;if(q.aurora){q.aurora.visible=q.open>.02;q.aurora.material.uniforms.time.value=elapsed;q.aurora.material.uniforms.open.value=q.open;}if(q.ribbons)for(let n=0;n<q.ribbons.length;n++){const r=q.ribbons[n];r.visible=q.open>.02;r.scale.y=q.open*(.85+Math.sin(elapsed*1.7+n*.5)*.15);r.rotation.z=Math.sin(elapsed*.8+n*.5)*.12;}}
      finaleStars.forEach((o,i)=>{o.material=done[i]?C.gold:C.dark;o.rotation.y=Math.sin(elapsed+i)*.2;o.position.y=3.7+Math.sin(i)*.45+Math.sin(elapsed*2+i)*.08;});
      if(finalTime>0){finalTime-=dt;if(Math.floor(finalTime*3)!==Math.floor((finalTime+dt)*3))burst(fx+(Math.random()-.5)*6,fg+5+Math.random()*2,C.gold,4);}
      const sledGuide=slideState.phase==='slide'&&idle>2?sledPlay.target():null,roverGuide=idle>2?routeTarget(true):null;const ht=sledGuide||roverGuide||(idle>3&&!player.locked?helperTarget():null);helper.visible=!M.playGuideActive&&!!ht;if(ht){helper.position.set(ht.x+(sledGuide?(slideState.to>slideState.from?.55:-.55):0),ht.y+Math.sin(elapsed*3)*.045+(sledGuide?.25:0),sledGuide||roverGuide?(ht.z||0)+.25:1.65);touchRing.scale.setScalar(.22*(1+(elapsed*1.3%1)*1.2));touchMat.opacity=.65*(1-(elapsed*1.3%1));handSprite.material.opacity=sledGuide||roverGuide?1:Math.min(1,(idle-3)*2);player.lookX=M.clamp((ht.x-player.x)/6,-1,1);player.lookY=M.clamp((ht.y-player.y-1.25)/4,-1,1);if(!player.locked){player.emote=Math.abs(ht.x-player.x)<6?'point':'curious';if(Math.abs(ht.x-player.x)>.7)player.facing=Math.sign(ht.x-player.x);}}else{player.lookX=player.lookY=0;player.emote='';}
      if(noteClock>1.5&&!player.locked){noteClock=0;let hint='';if(nearby(70,14))hint=robot.phase==='scan'?'Bilbo bir sinyal buldu! Parlayan toprağa dokun':robot.phase==='search'?'Parlayan pati izine dokun':robot.phase==='wake'?'Pili göğsündeki aynı yuvaya taşıyalım':'';else if(!done[1]&&(nearby(182,15)||nearby(roverState.x,8)))hint=roverState.phase==='build'?'Parçayı aynı biçimdeki yuvaya taşıyalım':'Arabaya dokun: Bilbo’yla birlikte bin';else if(!done[2]&&mission.garden&&nearby(slideState.x,12))hint='Kızağa dokun; kar tanesine dokun veya büyük okla zıpla';else if(nearby(fx,13))hint=done.every(Boolean)?'Teleskobun yıldızına dokun!':'Üç dostluk yıldızını topla';call('setHint',hint);}
    }
    // Fixed wordless lessons describe actual controls; they never advance a game.
    const lessonPoint=new T.Vector3(),lessons=[];
    function lesson(id,x,goal,completed,enabled,describe,range=10){lessons.push({id,x,y:()=>ground(typeof x==='function'?x():x),goal,completed,enabled,describe,range});}
    function tapStep(step,x,y,z=0){step.action='tap';step.from.set(x,y,z);step.to.copy(step.from);}
    lesson('mars-robot',70,'robot',()=>robot.awake,()=>!finished,step=>{
      let i=robot.phase==='dig'?robot.digIndex:selectedRobot>=0?selectedRobot:robotPieces.findIndex(q=>q.dug&&!q.attached);if(i<0)i=robotPieces.findIndex(q=>!q.attached);if(i<0)return false;const q=robotPieces[i];step.progress=robotPieces.filter(q=>q.attached).length;step.total=3;step.sourceIcon=q.kind==='head'?'head':q.kind==='battery'?'battery':'arms';
      if(robot.phase==='dig'){tapStep(step,q.home.x,ground(q.home.x)+.45,-.35);step.action='wait';}
      else if(!q.dug)tapStep(step,q.home.x,ground(q.home.x)+.45,-.35);
      else{step.action='drag';step.demoObject=q.g;if(i===2)q.g.localToWorld(step.from.set(0,.05,0));else q.g.getWorldPosition(step.from);bot.localToWorld(step.to.set(q.slot.x,q.slot.y,q.slot.z));}return true;
    },14);
    lesson('mars-rover-build',182,'rover',()=>roverState.phase!=='build',()=>roverState.phase==='build',step=>{
      const i=selected>=0?selected:parts.findIndex(q=>!q.placed);if(i<0)return false;step.action='drag';step.demoObject=parts[i].g;parts[i].g.localToWorld(step.from.copy(parts[i].offset));slots[i].localToWorld(step.to.copy(parts[i].offset));step.progress=parts.filter(q=>q.placed).length;step.total=3;step.sourceIcon=i===0?'wheel':i===1?'canopy':'solar-panel';return true;
    },14);
    lesson('mars-rover-ride',()=>roverState.x,'rover',()=>done[1],()=>!done[1]&&roverState.phase==='ready',step=>{tapStep(step,roverState.x,ground(roverState.x)+1.1,-1.1);step.sourceIcon='footsteps';return true;},9);
    for(let k=0;k<4;k++)lesson('mars-rover-stop-'+k,[198,220,241,258][k],['light','sample','radio','bridge'][k],()=>roverState.route[k],()=>roverState.phase==='drive'&&roverState.stop===k,step=>{
      const q=routeTarget(true);if(!q)return false;step.progress=k===3?bridgeWorkshop.state().placed.filter(Boolean).length:roverState.step;step.total=k===3?3:2;step.sourceIcon=k===0?(roverState.step?'plug':'solar-panel'):k===1?(roverState.step?'rock':'paw'):k===2?(roverState.step?'star':'radio'):'plank';
      if((k===0||k===1)&&roverState.step===1){step.action='drag';step.demoObject=k===0?caravan[0].plug:caravan[1].rock;step.from.set(q.sourceX,q.sourceY,q.sourceZ);step.to.set(q.toX,q.toY,q.toZ);}else if(k===3){step.action='drag';step.demoObject=bridgeWorkshop.demoSources[q.index];step.from.set(q.sourceX,q.sourceY,q.sourceZ);step.to.set(q.toX,q.toY,q.toZ);}else tapStep(step,q.x,q.y,q.z||0);if(routeOpening())step.action='wait';return true;
    },13);
    lesson('mars-sled',()=>slideState.phase==='slide'?slideState.x:282,'sled',()=>done[2],()=>!done[2]&&mission.garden&&(slideState.phase==='ready'||slideState.phase==='slide'),step=>{
      if(slideState.phase==='ready'){tapStep(step,slideState.x,ground(slideState.x)+1,-1);step.sourceIcon='footsteps';return true;}
      const q=sledPlay.target();if(!q)return false;step.progress=sledPlay.state().collected;step.total=iceRings.length;step.sourceIcon=q.kind==='snowflake'?'snowflake':q.kind==='prism'?'crystal':q.kind==='waterwheel'?'waterwheel':'handle';step.goalIcon=q.kind==='snowflake'?'snowflakes':q.kind==='prism'?'light':q.kind==='waterwheel'?'water':q.kind==='aurora'?'aurora':'ice-gate';
      if(q.kind==='gate'){step.action='drag';step.demoObject=gateWorkshop.demoSources[q.index];step.from.set(q.sourceX,q.sourceY,q.sourceZ);step.to.set(q.toX,q.toY,q.toZ);step.sourceIcon='ice';step.goalIcon='ice-gate';}
      else{tapStep(step,q.x,q.y,q.z||0);const toy=iceRings[sledPlay.nextIndex()];step.demoObject=toy?.control||null;if(q.kind==='aurora'){step.action='press';step.to.x+=.208;step.to.y-=.340;}}return true;
    },13);
    lessons[lessons.length-1].flagOffsetX=4.5;
    lesson('mars-camp',fx,'camp',()=>finished,()=>campReady(),step=>{
      const i=camp.parts.indexOf(false);step.progress=camp.parts.filter(Boolean).length;step.total=4;step.action=camp.phase==='joining'?'wait':'tap';step.goalIcon=i>=0?'camp':'camera';
      if(i>=0){step.sourceIcon=['solar-panel','water-sample','rock'][i];campPieces[i].g.localToWorld(step.from.set(0,.15,.25));}else{step.progress=3;step.sourceIcon='star';telescopeStar.getWorldPosition(step.from);}step.to.copy(step.from);return true;
    },13);
    lesson('mars-taxi',()=>Number.isFinite(taxi.at)?taxi.at:player.x,'rocket',()=>false,()=>taxiAvailable(),step=>{tapStep(step,taxi.at,ground(taxi.at)+1.02,-.87);step.sourceIcon='footsteps';return true;},11);
    if(M.progress)M.progress.activities=100;
    // Borrowed view: callers may read/serialize immediately; no frame-time snapshots.
    for(const entry of lessons){if(entry.id==='mars-robot')entry.demoSources=robotPieces.map(q=>q.g);else if(entry.id==='mars-rover-build')entry.demoSources=parts.map(q=>q.g);else if(entry.id==='mars-rover-stop-0')entry.demoSources=[caravan[0].plug];else if(entry.id==='mars-rover-stop-1')entry.demoSources=[caravan[1].rock];else if(entry.id==='mars-rover-stop-3')entry.demoSources=bridgeWorkshop.demoSources;else if(entry.id==='mars-sled')entry.demoSources=[...gateWorkshop.demoSources,...iceToys.map(q=>q.control).filter(Boolean)];}
    const stateView={tasks:done,science:{power:false,heli:false,garden:false,water:false,samples:false,constellation:false},robot:robot.phase,robotCompleted:robot.awake,robotDug:[false,false,false],robotAttached:[false,false,false],robotFocus:-1,selectedRobotPiece:-1,robotPieces:robotPieces.map(q=>({kind:q.kind,dug:q.dug,attached:q.attached,home:{x:q.home.x,y:q.home.y},slot:{x:robotX+q.slot.x,y:rg+q.slot.y}})),rover:roverState.phase,slide:slideState.phase,slideStars:slideState.score,selectedPart:-1,locked:false,active:null,finished};
    function state(){
      stateView.robot=robot.phase;stateView.robotCompleted=robot.awake;stateView.robotFocus=robotFocus();stateView.selectedRobotPiece=selectedRobot;
      for(let i=0;i<3;i++){const q=robotPieces[i];stateView.robotDug[i]=q.dug;stateView.robotAttached[i]=q.attached;stateView.robotPieces[i].dug=q.dug;stateView.robotPieces[i].attached=q.attached;}
      stateView.rover=roverState.phase;stateView.roverX=roverState.x;stateView.roverStops=roverState.route;stateView.roverTarget=routeTarget();stateView.slide=slideState.phase;stateView.slideStars=slideState.score;stateView.selectedPart=selected;stateView.locked=!!player.locked;stateView.shuttle=taxi.airborne?'flying':taxiAvailable()?'ready':null;stateView.shuttleX=Number.isFinite(taxi.at)?taxi.at:null;stateView.shuttleStop=taxi.target;stateView.active=camp.phase==='joining'?'camp':taxi.airborne?'shuttle':transit?transit.kind:roverState.phase==='drive'?'rover':slideState.phase==='slide'?'slide':robot.phase==='dig'?'dig':null;stateView.finished=finished;stateView.science.power=mission.power;stateView.science.heli=!!mission.heli;stateView.science.garden=mission.garden;stateView.science.water=mission.water;stateView.science.samples=mission.samples;stateView.science.constellation=mission.constellation;stateView.camp=camp.parts;stateView.campPhase=camp.phase;stateView.endingDelay=7;stateView.endingPhotoDelay=2.2;
      stateView.cue=finished?'finale':player.x<14?'arrival':player.x<24?'walk':player.x<55?'jump':robot.phase==='dig'?'dig':nearby(70,14)&&!robot.awake?(robot.phase==='scan'?'radar':robot.phase==='search'?'dig':robot.phase==='wake'?'robot':''):roverState.phase==='build'&&nearby(vx,15)?'build':!done[1]&&roverState.phase==='ready'&&nearby(roverState.x,7)?'drive':slideState.phase==='slide'?'slide':'';
      stateView.nextDestination=nextStop();
      stateView.roverNextTarget=routeTarget(true);stateView.roverOpening=routeOpening();stateView.roverQueuedTarget=roverState.intentId;stateView.roverStop=roverState.stop;stateView.bridge=bridgeWorkshop.state();stateView.prismGate=gateWorkshop.state();
      return stateView;
    }
    function prepareCaveShaders(renderer,camera){
      // These moving objects first meet the cave lighting during an activity.
      for(const object of [rover,helper,sledPlay.gems,actors.feza.visor,...iceToys.filter(q=>q.aurora).map(q=>q.aurora)]){
        renderer.compile(object,camera,scene);
      }
      bridgeWorkshop.prepare(renderer,camera);gateWorkshop.prepare(renderer,camera);
    }
    return {lessons,update,pointer,interact,jump,state,sledPlay,prepareCaveShaders};
  };
})();
