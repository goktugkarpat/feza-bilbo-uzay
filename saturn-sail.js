/* Magnetic ring-ice sails. The access route under each crossing is continuous.
   Feza boards by touching the hull; each crossing stops at two real workshop games. */
(function(M){
  'use strict';
  const T=THREE,TAU=2*Math.PI;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  M.createRingSails=function({root,player,dog,ground,mats,shapes,glazeTexture,weldToy,routeLength=300}){
    const unit=new T.Vector3(0,1,0),va=new T.Vector3(),vb=new T.Vector3();
    const lessons=[],ships=[],orbital=[{start:13,end:54},{start:76,end:128},{start:174,end:230}];
    const shellMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.29});
    M.WorkshopArt.paint(shellMat,'enamel');
    const sailMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.38,metalness:.18,side:T.DoubleSide,map:glazeTexture,
      emissive:0x284249,emissiveIntensity:.28});
    const frost=new T.MeshStandardMaterial({color:0x74cbda,map:glazeTexture,roughness:.35,metalness:.12});
    const reactorColors=[0x75f5e3,0xffcf8d];
    function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
    function part(parent,geo,mat,x,y,z,sx=1,sy=sx,sz=sx){
      const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
    }
    function strut(parent,from,to,r,mat){
      va.set(...from);vb.set(...to).sub(va);const l=vb.length();
      const m=part(parent,shapes.rod,mat,va.x+vb.x*.5,va.y+vb.y*.5,va.z+vb.z*.5,r,l,r);
      m.quaternion.setFromUnitVectors(unit,vb.normalize());return m;
    }
    // A lofted, clinker-built hull: round ice keel below a rolled metal lip
    // and a flat, broad non-slip surface under two separate seats.
    function hullGeometry(){
      const p=[],c=[],uv=[],ix=[];
      const sections=[[-1.83,.08,.04],[-1.70,.36,.18],[-1.23,.59,.35],[-.60,.68,.41],[.27,.67,.40],[.98,.57,.34],[1.55,.37,.22],[1.93,.045,.035]];
      const dark=new T.Color(0x2e6576),ice=new T.Color(0x82c5cf),pearl=new T.Color(0xebdbbc),gold=new T.Color(0xc79858);
      const colors=[dark,ice,pearl,gold,pearl,ice,dark];
      sections.forEach(([x,w,h],i)=>{
        const lift=.055+.12*Math.pow(Math.abs(x)/1.93,2.6);
        const yz=[[-.37*h,0],[-.10*h,w*.74],[.31*h,w],[.54*h,w*.98],[.78*h,w*.80],[.82*h,0],[.78*h,-w*.80],[.54*h,-w*.98],[.31*h,-w],[-.10*h,-w*.74],[-.37*h,0]];
        yz.forEach(([y,z],j)=>{
          p.push(x,y+lift,z);const shade=colors[[0,1,2,3,4,5,4,3,2,1,0][j]];c.push(shade.r,shade.g,shade.b);uv.push(i/3,j/5);
          if(i&&j){const a=i*11+j;ix.push(a-12,a-1,a,a-12,a,a-11);}
        });
      });
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
    }
    const hullG=hullGeometry();
    // Pleated solar wing: individual radial ribs support two-colour panels with
    // a thin translucent-looking edge. Its hinge opens as magnetic pull rises.
    function sailGeometry(){
      const p=[],c=[],uv=[],ix=[],sectors=11,steps=7;
      const jade=new T.Color(0x398e9a),ice=new T.Color(0xbce3d4),sun=new T.Color(0xe4c095),out=new T.Color();
      for(let a=0;a<=sectors;a++){
        const t=a/sectors,theta=.12+1.82*t,L=1.56+.30*Math.sin(Math.PI*t);
        for(let j=0;j<=steps;j++){
          const v=j/steps,delicate=(a%2?.19:0)*v;
          p.push(Math.cos(theta)*L*v,Math.sin(theta)*L*v+.055*Math.sin(v*Math.PI),-.24*Math.sin(t*Math.PI)*v+delicate);
          out.copy(jade).lerp(ice,.16+.64*v).lerp(sun,t*.50);
          if(j===steps-1)out.lerp(sun,.54);if(a%3===0&&v>.12)out.lerp(sun,.24);c.push(out.r,out.g,out.b);uv.push(t,v);
          if(a&&j){const i=a*(steps+1)+j,q=i-steps-1;ix.push(q-1,q,i,q-1,i,i-1);}
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
    }
    const wingG=sailGeometry();
    const runners=new T.CatmullRomCurve3([new T.Vector3(-1.78,.15,0),new T.Vector3(-1.50,-.10,0),
      new T.Vector3(-.95,-.18,0),new T.Vector3(.45,-.18,0),new T.Vector3(1.30,-.10,0),new T.Vector3(1.86,.23,0)]);
    const skateG=new T.TubeGeometry(runners,26,.058,7,false);
    const plinthG=new T.LatheGeometry([[.13,-.11],[.29,-.07],[.34,.025],[.29,.08],[.13,.11]].map(([r,y])=>new T.Vector2(r,y)),28);
    const aperture=new T.PlaneGeometry(.29,.078);
    const seatG=new T.BoxGeometry(1,1,1),centerGrip=new T.TorusGeometry(.30,.052,7,28,Math.PI*1.36);
    const moonBody=new T.IcosahedronGeometry(.33,2),crescentG=new T.TorusGeometry(.43,.049,7,48,Math.PI*1.49);
    for(let idx=0;idx<orbital.length;idx++){
      const o=orbital[idx],g=group(root,o.start,ground(o.start)+.33,-1.23);g.name='Buz yelkeni '+(idx+1);
      const hull=part(g,hullG,shellMat,0,0,0);hull.castShadow=true;hull.receiveShadow=true;
      const wing=group(g,-.82,.36,-.39);
      part(wing,wingG,sailMat,0,0,0);
      for(let j=0;j<=11;j+=2){
        const u=j/11,theta=.12+1.82*u,L=1.56+.3*Math.sin(Math.PI*u);
        strut(wing,[0,0,0],[Math.cos(theta)*L,Math.sin(theta)*L,-.24*Math.sin(u*Math.PI)],j===0?.039:.013,mats.brass);
      }
      part(g,shapes.cyl,mats.brass,-.82,.28,-.39,.16,.25,.16);
      part(g,seatG,mats.ink,0,.346,-.03,1.99,.11,.69);
      // A sprung magnetic runner below either flank and a recessed inspection port.
      for(const side of [-1,1]){
        part(g,skateG,mats.brass,0,-.02,side*.47);
        for(const sx of [-1.15,.98])strut(g,[sx-.10,-.10,side*.47],[sx+.15,.16,side*.48],.058,mats.petrol);
      }
      part(g,plinthG,mats.steel,1.10,.21,.10,.78,.68,.78);
      part(g,shapes.sphere,mats.gem[0],1.10,.301,.10,.175,.068,.175);
      const port=part(g,aperture,mats.light,.09,.164,.67);port.rotation.x=.02;
      for(const seatX of [-.64,.60]){
        part(g,shapes.sphere,mats.coral,seatX,.425,0,.37,.10,.28);
        const hand=part(g,centerGrip,mats.brass,seatX-.13,.49,-.27);hand.rotation.z=-.30;
      }
      const moons=[];
      for(let j=0;j<2;j++){
        const orb=group(g,j===0?-2.25:2.25,1.23,-.25);
        const gem=new T.MeshStandardMaterial({color:reactorColors[j],roughness:.27,metalness:.14,
          emissive:reactorColors[j],emissiveIntensity:.14,map:glazeTexture});
        const core=part(orb,moonBody,gem,0,0,0,.98,.98,.98);
        const band=part(orb,crescentG,mats.brass,0,0,-.01);band.rotation.set(.19,-.28,j?.5:-.64);
        const dot=part(orb,shapes.sphere,mats.milk,0,.47,0,.071);
        moons.push({orb,core,gem,band,dot});
      }
      if(weldToy){weldToy(g);weldToy(wing);}
      const beamMax=48,beamData=new Float32Array(beamMax*3),colors=new Float32Array(beamMax*3);
      for(let i=0;i<beamMax;i++){const tt=i/(beamMax-1);colors.set([.51+tt*.37,.9-.21*tt,1.-.47*tt],i*3);}
      const beamG=new T.BufferGeometry();beamG.setAttribute('position',new T.BufferAttribute(beamData,3).setUsage(T.DynamicDrawUsage));beamG.setAttribute('color',new T.BufferAttribute(colors,3));
      const beamM=new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false});
      const beam=new T.Line(beamG,beamM);beam.frustumCulled=false;g.add(beam);
      const dots=new T.Points(beamG,new T.PointsMaterial({vertexColors:true,size:.063,transparent:true,opacity:.78,blending:T.AdditiveBlending,depthWrite:false}));
      dots.frustumCulled=false;g.add(dots);
      ships.push({root:g,wing,moons,beam,beamData,dots,x:o.start,lo:o.start,hi:o.end,dir:1,cruiseDir:1,v:0,shipY:g.position.y,lights:0,clock:idx*1.03,phase:'dock',timer:0,wants:0,boost:0,beenAway:false,step:0,soundAt:-10});
    }
    // A handful of actual ring grains meet the shepherd field, sweep around
    // the selected moon, then settle back into their original orbital stream.
    const grainPose=new T.Object3D(),grainTint=new T.Color(),grainG=new T.IcosahedronGeometry(1,0);
    const viewFrustum=new T.Frustum(),viewMatrix=new T.Matrix4(),hullBounds=new T.Sphere(new T.Vector3(),5.6);
    for(let j=0;j<ships.length;j++){
      const ship=ships[j],bits=ship.bits=new T.InstancedMesh(grainG,frost,21);
      bits.name='Çoban uydularının çevresinde dönen halka buzu';
      bits.instanceMatrix.setUsage(T.DynamicDrawUsage);
      bits.boundingSphere=new T.Sphere(new T.Vector3((ship.lo+ship.hi)*.5,1,-1),(ship.hi-ship.lo)*.5+4.5);
      ship.grains=[];root.add(bits);
      for(let i=0;i<21;i++){
        const u=(i+.45)/21,x=M.lerp(ship.lo+1,ship.hi-.6,u),phase=i*2.399963+j*.85;
        const band=.94+.59*Math.sin(u*Math.PI)+.51*Math.sin(phase);
        const y=ground(x)+band,z=-1.4+.63*Math.cos(phase*.77),radius=.047+.051*(.5+.5*Math.sin(i*4.24));
        ship.grains.push({x,y,z,px:x,py:y,pz:z,phase,r:radius,pull:0});
        grainPose.position.set(x,y,z);grainPose.scale.set(radius,radius,radius);grainPose.updateMatrix();
        bits.setMatrixAt(i,grainPose.matrix);
        grainTint.setHex([0xa1e9ed,0xf5e3c3,0xc3e3f0,0x91cfdd,0xddcdc3][i%5]);
        bits.setColorAt(i,grainTint);
      }
    }
    // Each crossing has a different material, skyline and pair of physical
    // moorings. The restored machinery stays in the world after leaving it.
    // The path is never timed, and walking beneath a sail remains possible.
    const stops=[],stopsByShip=[[{x:29,kind:'winch'},{x:43,kind:'lantern'}],
      [{x:95,kind:'moon'},{x:115,kind:'winch'}],
      [{x:193,kind:'lantern'},{x:216,kind:'moon'}]];
    const winchGeo=new T.TorusGeometry(.91,.075,8,48);
    const socketGeo=new T.TorusGeometry(.49,.065,8,36);
    const lanternGeo=new T.OctahedronGeometry(.43,0);
    const streakGeo=new T.ConeGeometry(.17,.76,5);
    for(let leg=0;leg<ships.length;leg++){
      const s=ships[leg];s.leg=leg;s.visited=false;s.stops=[];
      for(const def of stopsByShip[leg]){
        const y=ground(def.x),g=group(root,def.x,y,-.65);
        g.name=['Dönen buz kapısı','Buz ışığı yuvası','Çoban ayı kanalı'][['winch','lantern','moon'].indexOf(def.kind)];
        const shade=leg===1?mats.gem[1]:leg===2?mats.gem[2]:mats.gem[0];
        part(g,shapes.cyl,mats.ink,0,.12,-.30,1.68,.24,.78);
        part(g,shapes.cyl,mats.brass,0,.28,-.30,1.51,.10,.66);
        for(const side of [-1,1])strut(g,[side*1.37,.25,-.35],[side*1.09,1.83,-.35],.075,mats.steel);
        const bearing=part(g,shapes.sphere,mats.petrol,0,1.70,-.30,.50,.48,.18);
        const lamp=part(g,shapes.sphere,mats.milk,0,.46,.40,.18,.18,.11);
        const q={...def,leg,root:g,y,done:false,amount:0,target:0,selected:false,owner:null,dragged:false,angle:0,visual:0,lamp};
        if(def.kind==='winch'){
          q.handle=group(g,0,2.10,.08);
          part(q.handle,winchGeo,mats.brass,0,0,0);
          for(let j=0;j<4;j++){const a=j*Math.PI/2;strut(q.handle,[0,0,0],[Math.cos(a)*.86,Math.sin(a)*.86,0],.045,mats.porcelain);}
          part(q.handle,shapes.sphere,shade,0,0,.03,.26,.26,.13);
          q.floes=[];
          for(const side of [-1,1]){
            const gate=group(g,side*1.43,.45,-1.55);
            const ice=part(gate,shapes.iceRock,frost,0,1.03,0,.55,1.28,.56);
            part(gate,shapes.iceRock,shade,-side*.24,1.78,.08,.30,.54,.37);
            q.floes.push(gate);ice.receiveShadow=true;
          }
        }else{
          strut(g,[-1.65,.36,-.15],[1.70,.36,-.15],.055,mats.steel);
          q.receiver=group(g,1.12,1.95,.16);q.receiverY=1;
          if(def.kind==='lantern'){
            part(q.receiver,shapes.box,mats.petrol,0,0,-.22,.98,1.30,.22);
            part(q.receiver,shapes.cyl,mats.brass,0,-.61,0,.60,.12,.40);
            part(q.receiver,shapes.cyl,mats.porcelain,0,.61,0,.59,.12,.40);
            for(const side of[-1,1])strut(q.receiver,[side*.48,-.55,.13],[side*.48,.55,.13],.048,mats.brass);
            const glass=new T.MeshStandardMaterial({color:0xa3dfdf,transparent:true,opacity:.18,roughness:.25,depthWrite:false});
            part(q.receiver,shapes.box,glass,0,0,.08,.84,1.1,.24);
            part(q.receiver,shapes.box,mats.porcelain,-.30,.12,.24,.025,.60,.018);
          }else{
            part(q.receiver,shapes.box,mats.petrol,0,0,-.26,1.22,1.23,.18);
            part(q.receiver,shapes.cyl,mats.brass,0,-.53,.12,.72,.13,.49);
            for(const side of[-1,1])strut(q.receiver,[side*.54,-.49,.14],[side*.54,.48,.14],.07,mats.porcelain);
            part(q.receiver,shapes.box,mats.porcelain,0,.54,.12,1.22,.12,.27);
            part(q.receiver,moonBody,mats.ink,0,0,-.11,.64,.64,.24);
          }

          q.token=group(g,-1.12,1.95,.20);
          if(def.kind==='lantern'){const bulb=part(q.token,shapes.sphere,shade,0,0,0,.35,.49,.30);part(q.token,shapes.cyl,mats.brass,0,-.41,0,.22,.17,.22);part(q.token,shapes.box,mats.milk,-.12,.14,.27,.035,.29,.02);}else part(q.token,moonBody,shade,0,0,0);
          if(def.kind==='lantern'){
            part(q.token,socketGeo,mats.brass,0,0,0,.78,.78,.78).rotation.y=.42;
            strut(q.token,[-.24,.22,0],[0,.58,0],.026,mats.brass);
            strut(q.token,[0,.58,0],[.24,.22,0],.026,mats.brass);
          }else{
            part(q.token,crescentG,mats.brass,0,0,-.02,.88,.88,.88).rotation.z=.45;
            for(let j=0;j<3;j++)part(g,streakGeo,mats.light,-.35+j*.28,.85,-.15,.38,.38,.38).rotation.z=-.9;
          }
        }
        const data=new Float32Array(32*3),geometry=new T.BufferGeometry();
        geometry.setAttribute('position',new T.BufferAttribute(data,3).setUsage(T.DynamicDrawUsage));
        const material=new T.LineBasicMaterial({color:leg===1?0xffd493:0xa9fff1,transparent:true,opacity:.24,depthWrite:false});
        const flow=new T.Line(geometry,material);flow.frustumCulled=false;g.add(flow);q.flow=flow;q.flowData=data;
        // Keep tiny animated details in a child assembly so the static toy
        // welding never removes the meshes whose transforms change later.
        const details=group(g);g.remove(lamp);details.add(lamp);
        if(q.receiver){g.remove(q.receiver);details.add(q.receiver);}
        q.attention=group(g,0,2.1,.29);
        part(q.attention,shapes.ring,mats.milk,0,0,0,1.14,1.14,1.14);
        q.attention.visible=false;
        s.stops.push(q);stops.push(q);
        if(weldToy)weldToy(g);
      }
      // Sculptural navigation silhouettes change with the leg. They are
      // well behind the touchable machinery and share the existing surfaces.
      for(let j=0;j<4;j++){
        const x=M.lerp(s.lo+4,s.hi-3,(j+.3)/4),g=group(root,x,ground(x)-.7,-6.8-j%2);
        if(leg===0){
          for(const side of[-1,1]){const ridge=part(g,shapes.iceRock,frost,side*1.65,1.5,0,.72,2.10,.95);ridge.rotation.z=side*.23;}part(g,shapes.iceRock,frost,0,3.25,0,2.1,.55,1.05);
          part(g,shapes.iceRock,mats.gem[0],-1.9,1.0,.1,.55,1.8,.9);
        }else if(leg===1){
          for(let side=-1;side<=1;side+=2){const leaf=part(g,shapes.iceRock,mats.gem[1],side*.85,1.8,0,.64,2.5,.38);leaf.rotation.z=side*.41;}
        }else{
          for(let k=0;k<3;k++){const spire=part(g,shapes.iceRock,k%2?mats.gem[2]:frost,(k-1)*.62,1.5+k%2,.16*k,.38,2.3+k%2,.48);spire.rotation.z=(k-1)*-.18;}
        }
        if(weldToy)weldToy(g);
      }
    }
    let riding=null,inputId=null,heldDir=0,clock=0,lastAir=false,completed=0;
    function finishStop(q){
      if(q.done)return;
      q.done=true;q.target=q.amount=1;q.selected=false;q.owner=null;completed++;
      M.sfx('saturn-cradle');M.celebrate(q.x,q.y+2.1);
      if(riding?.stop===q){riding.phase='sail';riding.stop=null;riding.boost=0;riding.v=0;riding.wants=0;riding.dir=riding.cruiseDir;player.facing=dog.facing=riding.dir;heldDir=0;inputId=null;}
    }
    function stopAt(s,q){
      s.phase='moor';s.stop=q;s.v=0;s.boost=s.wants=0;heldDir=0;inputId=null;
      player.skating=dog.skating=0;M.sfx('saturn-latch');
    }
    function updateStops(dt){
      for(const q of stops){
        const active=riding?.stop===q,near=Math.abs(player.x-q.x)<14;
        if(!near&&!q.done)continue;
        q.visual=M.damp(q.visual,q.target,active?9:4,dt);
        q.lamp.scale.setScalar(q.done?.24:.18+(active?.035*Math.sin(clock*3.5):0));
        q.attention.visible=!M.playGuideActive&&active&&!q.done;
        if(q.attention.visible){
          q.attention.position.set(q.kind==='winch'?0:q.selected?1.12:q.token.position.x,q.kind==='winch'?2.10:1.95,.29);
          q.attention.scale.setScalar((q.kind==='winch'?1:.67)+.045*Math.sin(clock*3.5));
          q.attention.rotation.z=0;
        }
        if(q.kind==='winch'){
          q.handle.rotation.z=q.turnAngle||0;
          for(let j=0;j<2;j++){
            q.floes[j].rotation.z=(j?1:-1)*q.visual*1.16;
            q.floes[j].position.x=(j?1:-1)*(1.43+q.visual*.82);
          }
        }else{
          q.token.position.x=M.lerp(-1.12,1.12,q.visual);
          q.token.position.y=1.95+(q.kind==='lantern'?.26*Math.sin(Math.PI*q.visual):0);
          q.token.rotation.y=clock*.23;
          q.receiver.rotation.z=0;
          const socketSize=1;
          q.receiver.scale.set(socketSize,socketSize*q.receiverY,socketSize);
        }
        q.flow.material.opacity=(q.done?.76:active?.45:.17);
        const n=q.flowData.length/3;
        for(let j=0;j<n;j++){
          const t=j/(n-1),wave=Math.sin(t*Math.PI),open=q.visual;
          q.flowData[j*3]=M.lerp(-2.7,2.7,t);
          q.flowData[j*3+1]=.61+wave*(q.kind==='moon'?(1-open)*1.5:.25)+.08*Math.sin(clock*2.1+t*14)*wave*(q.done?1:.4);
          q.flowData[j*3+2]=-.80+wave*(q.kind==='winch'?(1-open)*1.4:.18);
        }
        q.flow.geometry.attributes.position.needsUpdate=true;
      }
    }
    function stopPointer(type,p,e){
      const s=riding,q=s?.stop,id=e?.pointerId??0;
      if(!q||q.done)return false;
      if(type==='cancel') {if(!e||id===q.owner){q.owner=null;q.dragged=false;}return false;}
      // Keep the hand already moving this object. Another finger may use the
      // source-to-socket assistance after release, but cannot steal a held grip.
      if(q.owner!==null&&id!==q.owner)return type==='down';
      if(q.kind==='winch')q.handle.localToWorld(va.set(0,0,.03));else q.token.getWorldPosition(va);const camera=M.camera;if(camera?.position.z){const k=(camera.position.z-va.z)/camera.position.z;vb.set(camera.position.x+(p.x-camera.position.x)*k,camera.position.y+(p.y-camera.position.y)*k,va.z);p=vb;}
      if(type==='down'){
        const x=p.x-q.x,y=p.y-q.y;
        if(q.kind==='winch'){
          if(Math.hypot(x,y-2.10)>1.48)return false;
          q.angle=Math.atan2(y-2.1,x);q.owner=id;q.dragged=false;return true;
        }
        if(Math.abs(x-1.12)<.94&&Math.abs(y-1.95)<1.05){
          // Assistance still starts at the real lantern or moon. An empty
          // socket by itself only leaves the source's invitation ring visible.
          if(q.selected){finishStop(q);return true;}
          return false;
        }
        if(Math.abs(x-q.token.position.x)<1.02&&Math.abs(y-q.token.position.y)<1.08){q.owner=id;q.dragged=false;q.selected=true;q.pressX=x;return true;}
        return false;
      }
      if(q.owner!==id)return false;
      if(type==='move'){
        if(q.kind==='winch'){
          const a=Math.atan2(p.y-q.y-2.10,p.x-q.x);let delta=a-q.angle;
          if(delta>Math.PI)delta-=TAU;if(delta<-Math.PI)delta+=TAU;
          q.angle=a;q.turnAngle=(q.turnAngle||0)+delta;if(Math.abs(delta)>.012){q.dragged=true;q.turnDirection=Math.sign(delta);}
          q.amount=clamp(q.amount+Math.abs(delta)/2.35,0,1);q.target=q.amount;
          if(q.amount>.97)finishStop(q);
        }else{
          if(Math.abs(p.x-q.x-q.pressX)>.08)q.dragged=true;
          q.target=clamp((p.x-q.x+1.12)/2.24,0,1);
          if(q.target>.79&&Math.abs(p.y-q.y-1.95)<1.15){finishStop(q);return true;}
        }
      }else if(type==='up'){
        if(q.kind==='winch'&&!q.dragged)finishStop(q);
        q.owner=null;
      }
      return true;
    }
    function stirIce(s,dt){
      const bits=s.bits;
      for(let i=0;i<s.grains.length;i++){
        const q=s.grains[i],wave=q.phase+clock*.53;
        const wake=riding===s&&s.phase==='sail'?s.lights*Math.max(0,1-Math.abs(q.x-s.x-s.dir*.72)/3.8):0;
        q.pull=M.damp(q.pull,wake,3.1,dt);
        const swirl=wave*1.37+q.pull*2.32,ring=.7+.14*Math.sin(q.phase);
        const x=M.lerp(q.x+.18*Math.sin(wave),s.x+s.dir*(1.66+ring*Math.cos(swirl)),q.pull);
        const y=M.lerp(q.y+.18*Math.sin(wave*1.67),s.root.position.y+1.22+.54*Math.sin(swirl),q.pull);
        const z=M.lerp(q.z+.12*Math.cos(wave),-.38+ring*Math.sin(swirl)*.61,q.pull);
        q.px=M.damp(q.px,x,5.2,dt);q.py=M.damp(q.py,y,5.2,dt);q.pz=M.damp(q.pz,z,5.2,dt);
        grainPose.position.set(q.px,q.py,q.pz);grainPose.rotation.set(wave*.63,swirl,q.phase+.48*Math.sin(wave));
        grainPose.scale.set(q.r*(.82+.19*q.pull),q.r*(1.25+.36*q.pull),q.r*.70);grainPose.updateMatrix();
        bits.setMatrixAt(i,grainPose.matrix);
      }
      bits.instanceMatrix.needsUpdate=true;
    }
    function parkDepth(){return -1.23;}
    function ringLift(s){
      const t=clamp((s.x-s.lo)/(s.hi-s.lo),0,1);
      return Math.sin(t*Math.PI)*(.88+.18*Math.sin(t*TAU));
    }
    function board(s){
      if(s.visited||riding||player.locked||Math.abs(player.x-s.x)>5.5)return false;
      riding=s;s.phase='board';s.stop=null;s.timer=0;s.boost=0;s.v=0;s.wants=0;s.beenAway=false;
      s.atX=s.x;s.fromX=player.x;s.fromY=player.y;s.fromZ=player.z||0;
      s.dogX=dog.x;s.dogY=dog.y;s.dogZ=dog.z??.3;s.fromHeight=s.root.position.y;
      s.dir=Math.abs(s.x-s.hi)<1?-1:Math.abs(s.x-s.lo)<1?1:s.cruiseDir;
      s.cruiseDir=s.dir;
      player.locked=dog.locked=true;player.vx=dog.vx=player.vy=dog.vy=0;
      player.grounded=dog.grounded=true;dog.activityTargetX=undefined;dog.activityMode=undefined;dog.emote='';
      player.facing=dog.facing=s.dir;inputId=null;heldDir=0;
      M.sfx('saturn-latch');return true;
    }
    function moonPress(s,id,dir) {
      inputId=id;
      const atLeft=s.x<=s.lo+.04,atRight=s.x>=s.hi-.04;
      heldDir=!s.beenAway&&((dir<0&&atLeft)||(dir>0&&atRight))?-dir:dir;
      if(s.phase==='board'){
        // Keep a little explorer's first touch while the two climb aboard.
        s.dir=heldDir;s.boost=1.12;player.facing=dog.facing=heldDir;
      }else steer(heldDir,1.12);
    }
    function steer(dir,boost){
      const s=riding;if(!s||s.phase!=='sail')return false;
      s.dir=dir||s.dir;s.boost=Math.max(s.boost,boost);s.wants=s.dir;
      if(clock-s.soundAt>.65){s.soundAt=clock;M.sfx('saturn-magnet');}
      player.facing=dog.facing=s.dir;return true;
    }
    function disembark(s){
      if(s.phase==='land')return;
      if(s.stop){s.stop.owner=null;s.stop=null;}
      s.phase='land';s.timer=0;player.skating=dog.skating=undefined;s.fromX=player.x;s.fromY=player.y;s.fromZ=player.z||0;
      s.dogX=dog.x;s.dogY=dog.y;s.dogZ=dog.z??0;s.fromHeight=s.root.position.y;
      s.landing=clamp(s.x+s.dir*1.78,2,routeLength-3);
      inputId=null;heldDir=0;s.boost=s.wants=0;s.v=0;
    }
    function seatPose(s,u,y,z){
      const hop=Math.sin(Math.PI*u)*.34;
      player.x=M.lerp(s.fromX,s.x+.59,u);player.y=M.lerp(s.fromY,y+.49,u)+hop;player.z=M.lerp(s.fromZ,z,u);
      dog.x=M.lerp(s.dogX,s.x-.67,u);dog.y=M.lerp(s.dogY,y+.50,u)+hop;dog.z=M.lerp(s.dogZ,z+.055,u);
      player.mode=dog.mode=u>.74?'idle':'jump';
      if(u>.74)player.skating=dog.skating=0;
    }
    function sampleBeams(s,strength){
      const positive=s.dir>0,target=s.moons[positive?1:0].orb.position;
      const fromX=-.38,fromY=.79,n=s.beamData.length/3;
      const sine=Math.sin(s.clock*4.2);
      for(let i=0;i<n;i++){
        const t=i/(n-1),bend=Math.sin(t*Math.PI);
        s.beamData[i*3]=M.lerp(fromX,target.x,t);
        s.beamData[i*3+1]=M.lerp(fromY,target.y,t)+bend*(.24+.18*sine)+.035*Math.sin(t*23.-s.clock*8)*bend;
        s.beamData[i*3+2]=M.lerp(-.34,target.z,t)+bend*.16;
      }
      s.beam.geometry.attributes.position.needsUpdate=true;s.beam.material.opacity=strength*.8;s.dots.material.opacity=strength*.66;
    }
    function update(dt,t){
      clock+=dt;
      const justLanded=lastAir&&!player.locked&&player.grounded;
      lastAir=!player.locked&&!player.grounded;
      const camera=M.camera;
      if(camera)viewFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
      for(const s of ships){
        s.clock+=dt;
        const active=s===riding;
        if(active||!camera||viewFrustum.intersectsSphere(s.bits.boundingSphere))stirIce(s,dt);
        hullBounds.center.copy(s.root.position);hullBounds.center.y+=.75;
        s.root.visible=active||!camera||viewFrustum.intersectsSphere(hullBounds)||Math.abs(player.x-s.x)<6;
        if(!s.root.visible){s.beenAway=true;s.step=0;continue;}
        if(s===riding){
          s.timer+=dt;
          if(s.phase==='board'){
            const u=ease(s.timer/.70),y=ground(s.x)+.31+.05*u,z=M.lerp(parkDepth(),-.20,u);
            s.root.position.set(s.x,y,z);seatPose(s,u,y,z);
            if(u>=1){s.phase='sail';s.timer=0;s.boost=Math.max(s.boost,.67);s.wants=s.dir;}
          }else if(s.phase==='sail'){
            s.boost=Math.max(0,s.boost-dt);
            // Travel is the reward between the child's physical stops. A
            // non-reader never needs to discover a hidden hold-to-go control.
            // Moon steering is optional and returns to the crossing direction.
            const drive=heldDir||(s.boost>0?s.wants:s.cruiseDir);
            if(drive&&drive!==s.dir){s.dir=drive;player.facing=dog.facing=drive;}
            s.v=M.damp(s.v,drive*6.4,drive?3.45:1.88,dt);const move=s.v*dt;
            const before=s.x;
            s.x=clamp(s.x+move,s.lo,s.hi);
            for(let qi=0;qi<s.stops.length;qi++){
              const q=s.stops[s.dir>0?qi:s.stops.length-1-qi];if(q.done)continue;
              const berth=q.x-s.dir*3.6;
              if((s.dir>0&&before<=berth+.08&&s.x>=berth)||(s.dir<0&&before>=berth-.08&&s.x<=berth)){
                s.x=berth;stopAt(s,q);break;
              }
            }
            const y=ground(s.x)+.35+ringLift(s)+.054*Math.sin(s.clock*2.6);
            s.root.position.set(s.x,y,-.18);
            player.x=s.x+.59;player.y=y+.49;player.z=-.18;
            dog.x=s.x-.67;dog.y=y+.50;dog.z=-.11;
            player.mode=dog.mode='idle';player.skating=s.v/6.4;dog.skating=player.skating;
            M.setCameraTarget(s.x+s.v*.23,y+1.95,.93,.91);
            if(Math.abs(s.x-s.atX)>1.8)s.beenAway=true;
            const atEdge=(s.x<=s.lo+.012&&s.v<-.17)||(s.x>=s.hi-.012&&s.v>.17);
            if(atEdge&&(s.beenAway||s.timer>.53)){
              if(s.stops.every(q=>q.done))s.visited=true;
              disembark(s);
            }
          }else if(s.phase==='moor'){
            const y=ground(s.x)+.35+ringLift(s)+.025*Math.sin(s.clock*2.2);
            s.root.position.set(s.x,y,-.18);
            player.x=s.x+.59;player.y=y+.49;player.z=-.18;
            dog.x=s.x-.67;dog.y=y+.50;dog.z=-.11;
            player.mode=dog.mode='idle';player.skating=dog.skating=0;
            dog.lookX=clamp((s.stop.x-dog.x)*.11,-.5,.5);dog.lookY=.48;
            M.setCameraTarget((s.x+s.stop.x)*.5,ground(s.x)+.35+ringLift(s)+2.0,.89,.95);
          }else{
            const u=ease(s.timer/.68),h=Math.sin(Math.PI*u)*.22;
            s.root.position.set(s.x,M.lerp(s.fromHeight,ground(s.x)+.31,u),M.lerp(-.18,parkDepth(),u));
            player.x=M.lerp(s.fromX,s.landing,u);player.y=M.lerp(s.fromY,ground(player.x),u)+h;player.z=M.lerp(s.fromZ,0,u);
            dog.x=M.lerp(s.dogX,s.landing-s.dir*.92,u);dog.y=M.lerp(s.dogY,ground(dog.x),u)+h;dog.z=M.lerp(s.dogZ,.30,u);
            player.mode=dog.mode='jump';
            if(u>=1){riding=null;s.phase='dock';s.beenAway=false;s.step=0;player.locked=dog.locked=false;
              player.grounded=dog.grounded=true;player.mode=dog.mode='idle';dog.lookX=dog.lookY=0;M.sfx('saturn-cradle');}
          }
        }else if(s.phase==='dock'){
          s.root.position.set(s.x,ground(s.x)+.31+.035*Math.sin(s.clock*1.7),parkDepth());
        }
        const pulling=s===riding&&(s.phase==='sail'||s.phase==='moor'),charge=pulling?Math.max(s.phase==='moor'?.23:s.boost>.03?.48:0,Math.abs(s.v)/6.4):0;
        s.lights=M.damp(s.lights,charge,4.3,dt);
        s.wing.rotation.z=.10*Math.sin(s.clock*.82)+s.lights*s.dir*.16;
        s.wing.rotation.y=.09+.18*s.lights*Math.sin(s.clock*2.0);
        for(let j=0;j<2;j++){
          const m=s.moons[j],sign=j?1:-1,available=pulling||s.dir===sign;
          // At a real stop the lantern/handle and its socket own the picture.
          // Optional steering controls return as soon as cruising resumes.
          m.orb.visible=s.phase!=='moor';
          const scale=pulling?1:available?.87:.48;
          m.orb.scale.setScalar(scale);
          m.orb.position.set(sign*(pulling?2.50:1.55),1.25+.13*Math.sin(s.clock*1.9+j*2.21)+s.lights*.16,-.22);
          m.band.rotation.z=(j?.55:-.65)+s.clock*.28*sign;m.core.rotation.y=s.clock*.6;
          m.gem.emissiveIntensity=.12+(available?.085:.0)+s.lights*(s.dir===sign?.72:.04);
        }
        const beamOn=s.lights>.035&&s.phase!=='moor';s.beam.visible=s.dots.visible=beamOn;
        if(beamOn)sampleBeams(s,s.lights);
      }
      updateStops(dt);
    }
    function pointer(type,p,e){
      const id=e?.pointerId??0;
      if(type==='cancel'){stopPointer(type,p,e);if(!e||id===inputId){inputId=null;heldDir=0;if(!e)downKeys.clear();}return false;}
      if(riding){
        const s=riding;if(s.phase==='moor'&&stopPointer(type,p,e))return true;
        if(type==='down'&&(s.phase==='sail'||s.phase==='moor')&&Math.abs(p.x-s.x)<1.04&&p.y>s.root.position.y-.42&&p.y<s.root.position.y+.46){disembark(s);return true;}
        return false;
      }
      if(type!=='down'||player.locked)return false;
      for(const ship of ships){if(Math.abs(player.x-ship.x)>5.5)continue;const dx=Math.abs(p.x-ship.x),dy=p.y-ground(ship.x);if(dx<2.17&&dy>-.20&&dy<2.46)return board(ship);}
      return false;
    }
    function interact(){
      if(riding){
        if(riding.phase==='sail')steer(riding.dir,1.55);
        else if(riding.phase==='moor'){
          const q=riding.stop;
          if(q.kind==='lantern'&&!q.selected){q.selected=true;M.sfx('saturn-magnet');}
          else finishStop(q);
        }
        return true;
      }
      for(const s of ships)if(Math.abs(player.x-s.x)<3.3&&board(s))return true;
      return false;
    }
    // The shared large jump button is an exit, never an assisted solution.
    // Keep keyboard interaction separate from this deliberately narrow hook.
    function jump(){
      if(!riding)return false;
      disembark(riding);return true;
    }
    // Keyboard travel parallels left/right touches. Only consume keys while
    // sitting on a sail; normal shared walking/pause handling stays intact.
    const keyDirection=code=>code==='ArrowLeft'||code==='KeyA'?-1:code==='ArrowRight'||code==='KeyD'?1:0;
    const downKeys=new Set();
    addEventListener('keydown',event=>{
      const dir=keyDirection(event.code);
      if(dir&&riding?.phase==='sail'&&M.debug?.phase==='play'){heldDir=dir;downKeys.add(event.code);if(!event.repeat)steer(dir,.45);}
    });
    addEventListener('keyup',event=>{if(downKeys.delete(event.code)&&inputId===null){heldDir=0;for(const code of downKeys)heldDir=keyDirection(code);}});
    addEventListener('blur',()=>{downKeys.clear();heldDir=0;inputId=null;});
    for(let i=0;i<ships.length;i++){
      const ship=ships[i],point=new T.Vector3();lessons.push({id:'saturn-sail-'+i+'-board',x:()=>ship.x,y:()=>ship.root.getWorldPosition(point).y,goal:'boat',completed:()=>ship.visited||ship.phase!=='dock',enabled:()=>!ship.visited&&!riding&&!player.locked,describe(step){if(riding||player.locked||ship.visited||Math.abs(player.x-ship.x)>5.5)return false;ship.root.localToWorld(step.from.set(.15,.36,.45));step.to.copy(step.from);step.action='tap';step.sourceIcon='footsteps';step.goalIcon='boat';step.progress=0;step.total=1;return true;}});
      for(let j=0;j<ship.stops.length;j++){const q=ship.stops[j];lessons.push({id:'saturn-sail-'+i+'-stop-'+j,x:q.x,y:q.y+1.2,goal:q.kind==='winch'?'ice-gate':q.kind==='lantern'?'light':'boat',completed:()=>q.done,enabled:()=>riding?.stop===q,describe(step){if(q.done||riding?.stop!==q)return false;step.progress=0;step.total=1;if(q.kind==='winch'){const turn=(q.turnDirection||-1)*2.4*(1-q.amount);q.handle.localToWorld(step.from.set(.91,0,.03));q.handle.localToWorld(step.to.set(Math.cos(turn)*.91,Math.sin(turn)*.91,.03));if(step.pivot?.isVector3){q.handle.getWorldPosition(step.pivot);step.startAngle=Math.atan2(step.from.y-step.pivot.y,step.from.x-step.pivot.x);step.endAngle=Math.atan2(step.to.y-step.pivot.y,step.to.x-step.pivot.x);}step.action='turn';step.sourceIcon='wheel';step.goalIcon='ice-gate';}else{q.token.getWorldPosition(step.from);q.receiver.getWorldPosition(step.to);step.action='drag';step.sourceIcon=q.kind==='lantern'?'light':'moon';step.goalIcon=q.kind==='lantern'?'light':'boat';}return true;}});}
    }
    return {lessons,update,pointer,interact,jump,
      get riding(){return !!riding;},get phase(){return riding?.phase||'shore';},
      get repaired(){return completed;},get journeys(){let count=0;for(const s of ships)if(s.visited)count++;return count;},
      get complete(){return completed===stops.length&&ships.every(s=>s.visited);},
      get nextX(){const s=ships.find(s=>!s.visited);return s?s.x:null;},
      state(){return {phase:riding?.phase||'shore',leg:riding?.leg??-1,repaired:completed,total:stops.length,
        journeys:ships.filter(s=>s.visited).length,stop:riding?.stop?.kind||'',
        stops:stops.map(q=>({x:q.x,kind:q.kind,done:q.done})),ships:ships.map(s=>({x:s.x,start:s.lo,end:s.hi,visited:s.visited,direction:s.dir,cruiseDirection:s.cruiseDir}))};}};
  };
})(window.MARS);
