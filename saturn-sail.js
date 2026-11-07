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
    // A calm glide: each crossing is a real 14-19 s ride with gentle swoops
    // between its two moorings, never a quick hop on and off.
    const CRUISE=3.0;
    const shellMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.29});
    M.WorkshopArt.paint(shellMat,'enamel');
    const sailMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.38,metalness:.18,side:T.DoubleSide,map:glazeTexture,
      emissive:0x3a6a70,emissiveIntensity:.42});
    // Ring-ice silhouettes share the polished ice look of the walking surface.
    const frost=new T.MeshStandardMaterial({color:0xc2ecf6,map:glazeTexture,roughness:.3,metalness:.12,emissive:0x0c4152,emissiveIntensity:.5});
    // Glacier glow to match the big ice arches: bright cyan rim, soft inner light (no extra draws).
    frost.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        float rim=pow(1.-abs(dot(normal,normalize(vViewPosition))),2.4);
        outgoingLight+=vec3(.09,.32,.40)*rim+diffuseColor.rgb*vec3(.03,.09,.11);
        #include <opaque_fragment>`);
    };
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
      // Eight hand-set stations become a smooth, rounded hull (built once).
      const stations=[[-1.83,.08,.04],[-1.70,.36,.18],[-1.23,.59,.35],[-.60,.68,.41],[.27,.67,.40],[.98,.57,.34],[1.55,.37,.22],[1.93,.045,.035]];
      const sections=new T.CatmullRomCurve3(stations.map(([x,w,h])=>new T.Vector3(x,w,h))).getPoints(21).map(v=>[v.x,Math.max(.03,v.y),Math.max(.025,v.z)]);
      const dark=new T.Color(0x2e6576),ice=new T.Color(0x82c5cf),pearl=new T.Color(0xebdbbc),gold=new T.Color(0xc79858);
      const colors=[dark,ice,pearl,gold,pearl,ice,dark];
      sections.forEach(([x,w,h],i)=>{
        const lift=.055+.12*Math.pow(Math.abs(x)/1.93,2.6);
        const yz=[[-.37*h,0],[-.10*h,w*.74],[.31*h,w],[.54*h,w*.98],[.78*h,w*.80],[.82*h,0],[.78*h,-w*.80],[.54*h,-w*.98],[.31*h,-w],[-.10*h,-w*.74],[-.37*h,0]];
        yz.forEach(([y,z],j)=>{
          p.push(x,y+lift,z);const shade=colors[[0,1,2,3,4,5,4,3,2,1,0][j]];c.push(shade.r,shade.g,shade.b);uv.push(i/9,j/5);
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
      // Warm bow lamp and teal stern light in brass collars, like a real little boat.
      part(g,shapes.sphere,mats.milk,1.66,.33,0,.085);part(g,shapes.ring,mats.brass,1.66,.33,0,.11,.11,.11).rotation.y=Math.PI/2;
      part(g,shapes.sphere,mats.light,-1.64,.33,0,.07);part(g,shapes.ring,mats.brass,-1.64,.33,0,.095,.095,.095).rotation.y=Math.PI/2;
      part(g,plinthG,mats.steel,1.10,.21,.10,.78,.68,.78);
      part(g,shapes.sphere,mats.gem[0],1.10,.301,.10,.175,.068,.175);
      const port=part(g,aperture,mats.light,.09,.164,.67);port.rotation.x=.02;
      // A row of round glowing portholes in brass rims along the visible flank (welded, no extra draws).
      for(const [px,pz] of [[-1.02,.625],[-.45,.682],[.62,.63],[1.12,.535]]){
        part(g,shapes.nub,mats.brass,px,.258,pz,.088,.088,.03);
        part(g,shapes.nub,mats.light,px,.258,pz+.014,.064,.064,.03);
      }
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
    // A faint bulb 'shadow' inside the empty lantern shows where the light belongs.
    const ghostMat=new T.MeshBasicMaterial({color:0xfff1c8,transparent:true,opacity:.22,depthWrite:false});
    // Shared, built-once ornaments: a stepped turned plinth, a star badge, a
    // little gear, a domed lantern roof and a turned wheel hub.
    const lath=(pts,n)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),n);
    const plinthTopG=lath([[0,0],[1,0],[1.04,.04],[1.04,.10],[.98,.15],[.90,.17],[.86,.22],[0,.22]],40);
    const starShape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.42:1;i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
    const starG=new T.ExtrudeGeometry(starShape,{depth:.18,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:1});starG.center();
    const gearShape=new T.Shape();
    for(let i=0;i<=48;i++){const a=i/48*TAU,tooth=(Math.floor(i/2)%2)?1:.84;const x=Math.cos(a)*tooth,y=Math.sin(a)*tooth;i?gearShape.lineTo(x,y):gearShape.moveTo(x,y);}
    const gearHole=new T.Path();gearHole.absarc(0,0,.42,0,TAU,true);gearShape.holes.push(gearHole);
    const gearG=new T.ExtrudeGeometry(gearShape,{depth:.12,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:1,curveSegments:8});gearG.center();
    const roofG=lath([[.66,0],[.62,.08],[.50,.20],[.32,.32],[.14,.40],[0,.42]],28);
    const hubG=lath([[0,.20],[.10,.19],[.20,.14],[.27,.07],[.30,0],[0,0]],24);hubG.rotateX(Math.PI/2);
    const glassCylG=new T.CylinderGeometry(.42,.42,1.0,24,1,true);
    for(let leg=0;leg<ships.length;leg++){
      const s=ships[leg];s.leg=leg;s.visited=false;s.stops=[];
      for(const def of stopsByShip[leg]){
        const y=ground(def.x),g=group(root,def.x,y,-.65);
        g.name=['Dönen buz kapısı','Buz ışığı yuvası','Çoban ayı kanalı'][['winch','lantern','moon'].indexOf(def.kind)];
        const shade=leg===1?mats.gem[1]:leg===2?mats.gem[2]:mats.gem[0];
        // Stepped enamel plinth with a brass bevelled top, rivets and a coral band.
        part(g,shapes.cyl,mats.ink,0,.12,-.30,1.68,.24,.78);
        part(g,shapes.cyl,mats.coral,0,.205,-.30,1.70,.05,.80);
        part(g,plinthTopG,mats.brass,0,.24,-.30,1.55,.70,.68);
        for(let r=0;r<12;r++){const a=r/12*TAU;part(g,shapes.sphere,mats.porcelain,Math.cos(a)*1.62,.135,-.30+Math.sin(a)*.75,.045);}
        for(const side of [-1,1]){
          strut(g,[side*1.37,.36,-.35],[side*1.09,1.83,-.35],.07,mats.brass);
          part(g,shapes.sphere,mats.brass,side*1.37,.37,-.35,.12);
          part(g,shapes.sphere,mats.coral,side*1.09,1.86,-.35,.11);
          part(g,shapes.ring,mats.porcelain,side*1.24,1.05,-.35,.09,.09,.09).rotation.x=Math.PI/2;
        }
        const lamp=part(g,shapes.sphere,mats.milk,0,.46,.40,.18,.18,.11);
        part(g,shapes.ring,mats.brass,0,.46,.40,.22,.22,.22);
        const q={...def,leg,root:g,y,done:false,amount:0,target:0,selected:false,owner:null,dragged:false,angle:0,visual:0,lamp,tx:-1.12,ty:1.95,fx:-1.12,fy:1.95,cue:0};
        if(def.kind==='winch'){
          // Ship's wheel: brass rim, turned spokes with beads, round coral
          // grips beyond the rim, a domed hub with a star, and a little gear
          // behind that turns the other way (secondary motion).
          q.gear=group(g,0,2.10,-.22);
          part(q.gear,gearG,mats.petrol,0,0,0,.62,.62,1);
          q.handle=group(g,0,2.10,.08);
          part(q.handle,winchGeo,mats.brass,0,0,0);
          part(q.handle,shapes.ring,mats.coral,0,0,.02,.66,.66,.66);
          for(let j=0;j<8;j++){const a=j*TAU/8,c=Math.cos(a),sn=Math.sin(a);
            strut(q.handle,[c*.2,sn*.2,0],[c*1.12,sn*1.12,0],.04,mats.porcelain);
            part(q.handle,shapes.sphere,mats.brass,c*.55,sn*.55,0,.07);
            part(q.handle,shapes.sphere,mats.coral,c*1.16,sn*1.16,0,.10,.10,.10);}
          if(weldToy)weldToy(q.handle);
          part(q.handle,hubG,shade,0,0,.02,1.05,1.05,1.05);
          part(q.handle,starG,mats.milk,0,0,.26,.12,.12,.12);
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
            // A real little lantern: turned brass foot, oval enamel back,
            // round glass, two posts, a coral dome roof with a finial and ring.
            part(q.receiver,shapes.cyl,mats.petrol,0,0,-.22,.52,.20,.62).rotation.x=Math.PI/2;
            part(q.receiver,plinthTopG,mats.brass,0,-.70,0,.52,.75,.40);
            part(q.receiver,shapes.cyl,mats.brass,0,-.56,0,.50,.06,.40);
            part(q.receiver,shapes.cyl,mats.brass,0,.56,0,.50,.06,.40);
            part(q.receiver,roofG,mats.coral,0,.58,0,.80,.80,.62);
            part(q.receiver,shapes.sphere,mats.brass,0,.96,0,.08);
            part(q.receiver,shapes.ring,mats.brass,0,1.12,0,.12,.12,.12);
            for(const side of[-1,1]){strut(q.receiver,[side*.46,-.55,.13],[side*.46,.55,.13],.05,mats.brass);part(q.receiver,shapes.sphere,mats.coral,side*.46,.60,.13,.07);}
            for(let r=0;r<6;r++){const a=r/6*TAU;part(q.receiver,shapes.sphere,mats.porcelain,Math.cos(a)*.47,-.56,Math.sin(a)*.36,.035);}
            const glass=new T.MeshStandardMaterial({color:0xa3dfdf,transparent:true,opacity:.16,roughness:.25,depthWrite:false});
            part(q.receiver,glassCylG,glass,0,0,0,1,1.1,.62);
            part(q.receiver,shapes.box,mats.porcelain,-.26,.12,.24,.025,.60,.018);
            q.ghost=part(q.receiver,shapes.sphere,ghostMat,0,.02,.12,.35,.49,.30);
          }else{
            // Round brass porthole for the moon: riveted frame, night-blue
            // window with tiny stars, a cradle below and a star on top.
            part(q.receiver,shapes.cyl,mats.petrol,0,0,-.18,.66,.16,.66).rotation.x=Math.PI/2;
            part(q.receiver,socketGeo,mats.brass,0,0,0,1.38,1.38,1.38);
            part(q.receiver,shapes.ring,mats.coral,0,0,-.04,.56,.56,.56);
            for(let r=0;r<10;r++){const a=r/10*TAU;part(q.receiver,shapes.sphere,mats.porcelain,Math.cos(a)*.68,Math.sin(a)*.68,.08,.04);}
            for(const [sx,sy,sz] of [[-.36,.30,.07],[.38,-.22,.055],[.30,.36,.045]])part(q.receiver,starG,mats.milk,sx,sy,-.08,sz,sz,sz);
            part(q.receiver,plinthTopG,mats.brass,0,-.86,.02,.45,.6,.35);
            part(q.receiver,starG,mats.brass,0,.80,.02,.16,.16,.16);
            part(q.receiver,moonBody,mats.ink,0,0,-.08,.64,.64,.24);
          }

          if(weldToy)weldToy(q.receiver);
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
          // Amber crystal cluster: a tall spire with two slimmer leaning companions.
          part(g,shapes.iceRock,mats.gem[1],0,2.05,0,.40,2.75,.40).rotation.y=.5;
          for(let side=-1;side<=1;side+=2){const leaf=part(g,shapes.iceRock,mats.gem[1],side*.8,1.5,.12,.33,1.95,.33);leaf.rotation.z=side*.36;}
        }else{
          for(let k=0;k<3;k++){const spire=part(g,shapes.iceRock,k%2?mats.gem[2]:frost,(k-1)*.62,1.5+k%2,.16*k,.38,2.3+k%2,.48);spire.rotation.z=(k-1)*-.18;}
        }
        if(weldToy)weldToy(g);
      }
    }
    let riding=null,inputId=null,heldDir=0,clock=0,lastAir=false,completed=0,cheer=0;
    function finishStop(q){
      if(q.done)return;
      q.done=true;q.target=q.amount=1;q.selected=false;q.owner=null;completed++;if(q.kind==='winch')q.turnAngle=(q.turnAngle||0)+(q.turnDirection||1)*.6;
      M.sfx('saturn-cradle');M.celebrate(q.x,q.y+2.1);cheer=1.8;dog.emote='happy';
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
        // Gentle auto-help for a 4-year-old: after ~16 s on one stop without a finger on it, the part finishes itself.
        if(active&&!q.done&&riding.phase==='moor'){q.helpT=(q.helpT||0)+dt*(window.SATURN_HELP_FAST?12:1);if(q.helpT>16&&q.owner===null&&inputId===null){finishStop(q);continue;}}
        q.visual=M.damp(q.visual,q.target,active?9:4,dt);
        q.lamp.scale.setScalar(q.done?.24:.18+(active?.035*Math.sin(clock*3.5):0));
        q.attention.visible=!M.playGuideActive&&active&&!q.done;
        if(q.attention.visible){
          q.attention.position.set(q.kind==='winch'?0:q.owner!==null?1.12:q.tx,q.kind==='winch'?2.10:q.owner!==null?1.95:q.ty,.29);
          q.attention.scale.setScalar((q.kind==='winch'?1:.67)+.045*Math.sin(clock*3.5));
          q.attention.rotation.z=0;
        }
        if(q.kind==='winch'){
          q.handle.rotation.z=q.turnAngle||0;q.gear.rotation.z=-(q.turnAngle||0)*1.7+.08*Math.sin(clock*.6);
          for(let j=0;j<2;j++){
            q.floes[j].rotation.z=(j?1:-1)*q.visual*1.16;
            q.floes[j].position.x=(j?1:-1)*(1.43+q.visual*.82);
          }
        }else{
          // The light/moon really travels with the finger. Dropped near its
          // socket it seats itself; dropped elsewhere it floats home.
          const holding=q.owner!==null&&!q.done;
          const gx=q.done?1.12:holding?q.fx:-1.12,gy=q.done?1.95:holding?q.fy:1.95;
          q.tx=M.damp(q.tx,gx,holding?18:q.done?9:5,dt);q.ty=M.damp(q.ty,gy,holding?18:q.done?9:5,dt);
          const near=!q.done&&Math.hypot(q.tx-1.12,q.ty-1.95)<.95;
          q.token.position.set(q.tx,q.ty+(q.done||holding?0:.07*Math.sin(clock*2.4)),.20+(holding?.25:0));
          q.token.scale.setScalar(holding?1.12:1);
          q.token.rotation.y=clock*.23;
          q.receiver.rotation.z=0;if(q.ghost){q.ghost.visible=!q.done;q.ghost.material.opacity=.16+.1*Math.sin(clock*3);}
          const socketSize=1+(near?.08+.04*Math.sin(clock*9):active&&!q.done?.03*Math.sin(clock*3.5):0);
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
      // Lifting or losing a finger never finishes a stop by itself: the wheel
      // keeps its turn, and a light or moon floats back to be tried again.
      if(type==='cancel'){if(!e||id===q.owner){q.owner=null;q.dragged=false;}return false;}
      if(q.owner!==null&&id!==q.owner)return type==='down';
      const camera=M.camera;
      if(q.kind==='winch')q.handle.localToWorld(va.set(0,0,.03));else va.set(q.x,q.y,q.root.position.z+.2);
      if(camera?.position.z){const k=(camera.position.z-va.z)/camera.position.z;vb.set(camera.position.x+(p.x-camera.position.x)*k,camera.position.y+(p.y-camera.position.y)*k,va.z);p=vb;}
      const x=p.x-q.x,y=p.y-q.y;
      if(type==='down'){
        if(q.kind==='winch'){
          // The whole wheel and its frame is a big, forgiving handle.
          if(Math.hypot(x,y-2.10)>2.3)return false;
          q.owner=id;q.dragged=false;q.angle=Math.atan2(y-2.1,x);q.lastX=x;q.lastY=y;
          q.helpT=Math.min(q.helpT||0,9);return true;
        }
        // Grab the light or moon itself (generous circle around it).
        if(Math.hypot(x-q.tx,y-q.ty)>1.35)return false;
        q.owner=id;q.dragged=false;q.selected=true;q.pressX=x;q.pressY=y;q.offX=q.tx-x;q.offY=q.ty-y;
        q.fx=q.tx;q.fy=q.ty;q.helpT=Math.min(q.helpT||0,9);M.sfx('saturn-magnet');
        return true;
      }
      if(q.owner!==id)return false;
      if(type==='move'){
        if(q.kind==='winch'){
          const r=Math.hypot(x,y-2.10);let delta;
          if(r<.32){delta=-(x-q.lastX)*.9;}
          else{const a=Math.atan2(y-2.10,x);delta=a-q.angle;q.angle=a;if(delta>Math.PI)delta-=TAU;if(delta<-Math.PI)delta+=TAU;}
          q.lastX=x;q.lastY=y;delta=clamp(delta,-.7,.7);
          q.turnAngle=(q.turnAngle||0)+delta;if(Math.abs(delta)>.012){q.dragged=true;q.turnDirection=Math.sign(delta);}
          const before=q.amount;
          // About three quarters of a circle in either direction opens the gate.
          q.amount=clamp(q.amount+Math.abs(delta)/4.0,0,1);q.target=q.amount;
          if(Math.floor(before*3)<Math.floor(q.amount*3)&&q.amount<.97)M.sfx('saturn-magnet');
          if(q.amount>.97)finishStop(q);
        }else{
          if(Math.hypot(x-q.pressX,y-q.pressY)>.08)q.dragged=true;
          q.fx=clamp(x+q.offX,-2.6,2.6);q.fy=clamp(y+q.offY,.7,3.7);
          // Close enough: it clicks into its socket while still held.
          if(Math.hypot(q.fx-1.12,q.fy-1.95)<.62){q.tx=q.fx;q.ty=q.fy;finishStop(q);}
        }
      }else if(type==='up'){
        if(q.kind!=='winch'&&Math.hypot(q.fx-1.12,q.fy-1.95)<.95)finishStop(q);
        else{q.selected=false;if(q.kind==='winch'&&!q.dragged){q.turnAngle=(q.turnAngle||0)-.35;q.amount=clamp(q.amount+.06,0,.9);q.target=q.amount;M.sfx('saturn-magnet');}}
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
    // Soft arcs between shores and berths; zero where the sail moors.
    function swoop(s){
      let a=s.lo;
      for(let i=0;i<=s.stops.length;i++){
        const b=i<s.stops.length?s.stops[i].x-3.6:s.hi;
        if(s.x<=b){const L=b-a;return L>1?Math.sin(Math.PI*clamp((s.x-a)/L,0,1))*Math.min(1.35,L*.065):0;}
        a=b;
      }
      return 0;
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
      if(cheer>0){cheer-=dt;if(cheer<=0&&dog.emote==='happy')dog.emote='';}
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
            s.v=M.damp(s.v,drive*CRUISE,drive?2.2:1.88,dt);const move=s.v*dt;
            const before=s.x;
            s.x=clamp(s.x+move,s.lo,s.hi);
            for(let qi=0;qi<s.stops.length;qi++){
              const q=s.stops[s.dir>0?qi:s.stops.length-1-qi];if(q.done)continue;
              const berth=q.x-s.dir*3.6;
              if((s.dir>0&&before<=berth+.08&&s.x>=berth)||(s.dir<0&&before>=berth-.08&&s.x<=berth)){
                s.x=berth;stopAt(s,q);break;
              }
            }
            const y=ground(s.x)+.35+ringLift(s)+swoop(s)+.054*Math.sin(s.clock*2.6);
            s.root.position.set(s.x,y,-.18);
            player.x=s.x+.59;player.y=y+.49;player.z=-.18;
            dog.x=s.x-.67;dog.y=y+.50;dog.z=-.11;
            player.mode=dog.mode='idle';player.skating=s.v/CRUISE;dog.skating=player.skating;
            // A slightly wider, forward-looking view shows the ice and rings ahead.
            M.setCameraTarget(s.x+s.dir*1.2+s.v*.2,y+1.7,innerWidth<innerHeight?1.3:1.04,.91);
            if(Math.abs(s.x-s.atX)>1.8)s.beenAway=true;
            const atEdge=(s.x<=s.lo+.012&&s.v<-.17)||(s.x>=s.hi-.012&&s.v>.17);
            if(atEdge&&(s.beenAway||s.timer>.53)){
              // The ride only ends once both moorings are done; an early
              // shore turns the sail back instead of dropping the pair off.
              if(s.stops.every(q=>q.done)){s.visited=true;disembark(s);}
              else{const back=s.x<=s.lo+.012?1:-1;s.dir=s.wants=s.cruiseDir=back;s.v=0;s.boost=0;heldDir=0;player.facing=dog.facing=back;}
            }
          }else if(s.phase==='moor'){
            const y=ground(s.x)+.35+ringLift(s)+swoop(s)+.025*Math.sin(s.clock*2.2);
            s.root.position.set(s.x,y,-.18);
            player.x=s.x+.59;player.y=y+.49;player.z=-.18;
            dog.x=s.x-.67;dog.y=y+.50;dog.z=-.11;
            player.mode=dog.mode='idle';player.skating=dog.skating=0;
            dog.lookX=clamp((s.stop.x-dog.x)*.11,-.5,.5);dog.lookY=.48;
            M.setCameraTarget((s.x+s.stop.x)*.5,ground(s.x)+.35+ringLift(s)+2.0,innerWidth<innerHeight?1.38:.89,.95);
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
          // An unfinished crossing cannot be walked past: stepping onto (or
          // over) the docked sail climbs aboard, so no long walk back later.
          const px=player.x,crossed=s.lastPX!==undefined&&(s.lastPX-s.x)*(px-s.x)<0&&Math.abs(px-s.lastPX)<3;
          if(!s.visited&&!riding&&!player.locked&&(Math.abs(px-s.x)<.9||crossed))board(s);
        }
        s.lastPX=player.x;
        const pulling=s===riding&&(s.phase==='sail'||s.phase==='moor'),charge=pulling?Math.max(s.phase==='moor'?.23:s.boost>.03?.48:0,Math.abs(s.v)/CRUISE):0;
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
        // Touching the hull mid-crossing is harmless; the sail lands by itself.
        if(type==='down'&&(s.phase==='sail'||s.phase==='moor')&&Math.abs(p.x-s.x)<1.04&&p.y>s.root.position.y-.42&&p.y<s.root.position.y+.46)return true;
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
    // The shared large jump button never ends a crossing early: the sail
    // always lands by itself at the far shore, so there is no hop off and
    // straight back on halfway along the ice.
    function jump(){
      return !!riding;
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
      const ship=ships[i],point=new T.Vector3();lessons.push({id:'saturn-sail-'+i+'-board',x:()=>ship.x,y:()=>ship.root.getWorldPosition(point).y,goal:'boat',completed:()=>ship.visited||ship.phase!=='dock',enabled:()=>!ship.visited&&!riding&&!player.locked,describe(step){if(riding||ship.visited||Math.abs(player.x-ship.x)>9)return false;ship.root.localToWorld(step.from.set(.15,.36,.45));step.to.copy(step.from);step.action='tap';step.sourceIcon='footsteps';step.goalIcon='boat';step.progress=0;step.total=1;return true;}});
      for(let j=0;j<ship.stops.length;j++){const q=ship.stops[j];lessons.push({id:'saturn-sail-'+i+'-stop-'+j,x:q.x,y:q.y+1.2,goal:q.kind==='winch'?'ice-gate':q.kind==='lantern'?'lantern':'moon-socket',completed:()=>q.done,enabled:()=>riding?.stop===q,describe(step){if(q.done||riding?.stop!==q)return false;step.progress=0;step.total=1;if(q.kind==='winch'){const turn=(q.turnDirection||-1)*2.4*(1-q.amount);q.handle.localToWorld(step.from.set(.91,0,.03));q.handle.localToWorld(step.to.set(Math.cos(turn)*.91,Math.sin(turn)*.91,.03));if(step.pivot?.isVector3){q.handle.getWorldPosition(step.pivot);step.startAngle=Math.atan2(step.from.y-step.pivot.y,step.from.x-step.pivot.x);step.endAngle=Math.atan2(step.to.y-step.pivot.y,step.to.x-step.pivot.x);}step.action='turn';step.sourceIcon='wheel';step.goalIcon='ice-gate';}else{q.token.getWorldPosition(step.from);q.receiver.getWorldPosition(step.to);step.action='drag';step.sourceIcon=q.kind==='lantern'?'light':'moon';step.goalIcon=q.kind==='lantern'?'lantern':'moon-socket';}return true;}});}
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
