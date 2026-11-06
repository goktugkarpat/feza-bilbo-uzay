(function (M) {
  'use strict';
  // A tethered wind sampler. The big fabric handles can be touched from below
  // or stepped on from above. There is no required order or missed launch.
  M.createAerostat = function (scene, world, player, dog) {
    const T=THREE, centre=44.6, level=world.ground(centre), tau=2*Math.PI;
    const root=new T.Group(); root.name='Rüzgâr postası · bağlı keşif gemisi';
    root.position.set(centre,level,-.56); scene.add(root);
    const paint=(color,metalness=.15)=>new T.MeshStandardMaterial({color,metalness,roughness:.64});
    const enamel=paint(0xf3e4bd),night=paint(0x244a59,.42),brass=paint(0xb97b43,.53),mint=paint(0x67d6c4);
    const light=new T.MeshBasicMaterial({color:0xffffc4});
    const sphere=new T.SphereGeometry(1,16,12),cylinder=new T.CylinderGeometry(1,1,1,12),box=new T.BoxGeometry();
    const axis=new T.Vector3(0,1,0),dir=new T.Vector3();
    function part(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1) {
      const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;
    }
    function bar(p,mat,a,b,r) {
      dir.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
      const o=part(p,cylinder,mat,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,dir.length(),r);
      o.quaternion.setFromUnitVectors(axis,dir.normalize());return o;
    }
    // Pack every rigid assembly into a single vertex-coloured draw. The cloth,
    // handles, suspension lines and propeller keep their own motion.
    const bakedMat=new T.MeshStandardMaterial({vertexColors:true,metalness:.24,roughness:.65});
    function joinRigid(g){
      const pos=[],col=[],norm=[],v=new T.Vector3(),n=new T.Vector3(),nm=new T.Matrix3();
      for(const o of g.children.slice()){
        if(!o.isMesh||o.material.map||o.material===light)continue;
        o.updateMatrix();nm.getNormalMatrix(o.matrix);
        const geo=o.geometry,idx=geo.index,at=geo.attributes.position,no=geo.attributes.normal,c=o.material.color;
        for(let j=0;j<(idx?idx.count:at.count);j++){
          const k=idx?idx.getX(j):j;v.fromBufferAttribute(at,k).applyMatrix4(o.matrix);
          n.fromBufferAttribute(no,k).applyNormalMatrix(nm);
          pos.push(v.x,v.y,v.z);norm.push(n.x,n.y,n.z);col.push(c.r,c.g,c.b);
        }
        g.remove(o);
      }
      if(!pos.length)return;
      const geo=new T.BufferGeometry();
      for(const [name,arr] of [['position',pos],['normal',norm],['color',col]])geo.setAttribute(name,new T.Float32BufferAttribute(arr,3));
      geo.computeBoundingSphere();g.add(new T.Mesh(geo,bakedMat));
    }
    // Painted gores follow the contour of a fabric aerostat, including the
    // reinforced nose, stitched hem, small observation roundels and threadwork.
    const cv=document.createElement('canvas');cv.width=768;cv.height=384;
    const pen=cv.getContext('2d'),w=cv.width,h=cv.height;
    pen.fillStyle='#f4dfa9';pen.fillRect(0,0,w,h);
    for(let i=0;i<12;i++){
      const y=i*h/12,ph=h/12;
      pen.fillStyle=i%2?'#f3e3bc':'#ecd29d';pen.fillRect(0,y,w,ph);
      const ribbon=pen.createLinearGradient(0,y,0,y+ph);ribbon.addColorStop(0,'rgba(117,63,30,.17)');ribbon.addColorStop(.18,'rgba(255,245,203,0)');ribbon.addColorStop(1,'rgba(147,98,56,.09)');
      pen.fillStyle=ribbon;pen.fillRect(0,y,w,ph);
      pen.fillStyle='#c57c4c';pen.fillRect(0,y,w,1.35);
    }
    for(const [x,ww,c] of [[0,132,'#38a797'],[124,9,'#153e50'],[137,6,'#f6bb55'],[495,15,'#df7350'],[516,57,'#c95739'],[578,12,'#df7350'],[676,87,'#398d85']]){
      pen.fillStyle=c;pen.fillRect(x,0,ww,h);
    }
    for(const v of [0,h*.5,h]){
      const u=338;pen.fillStyle='#244959';pen.beginPath();pen.ellipse(u,v,53,38,0,0,tau);pen.fill();
      pen.strokeStyle='#efc772';pen.lineWidth=3;pen.stroke();
      // A little wind rose in both broadside fabric patches.
      pen.fillStyle='#f2dfb0';pen.beginPath();
      for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2,r=k%2?7:25;const xx=u+Math.cos(a)*r*1.35,yy=v+Math.sin(a)*r;if(k)pen.lineTo(xx,yy);else pen.moveTo(xx,yy);}pen.closePath();pen.fill();
    }
    const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=2;
    const cloth=new T.MeshStandardMaterial({map:tex,roughness:.83});
    const vertices=[],uv=[],indices=[],rows=36,columns=48;
    for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){
      const t=i/rows,a=j*tau/columns,bulge=Math.pow(Math.sin(Math.PI*t),.65)*(.83+.27*t),flute=1-.035*(1+Math.cos(a*12))*.5;
      vertices.push((t-.5)*3.25,bulge*Math.sin(a)*flute*.92+.06*Math.sin(Math.PI*t),bulge*Math.cos(a)*flute*.86);
      uv.push(t,j/columns);
      if(i<rows&&j<columns){const b=i*(columns+1)+j;indices.push(b,b+columns+1,b+1,b+1,b+columns+1,b+columns+2);}
    }
    const skin=new T.BufferGeometry();skin.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    skin.setAttribute('uv',new T.Float32BufferAttribute(uv,2));skin.setIndex(indices);skin.computeVertexNormals();
    const craft=new T.Group();craft.name='Ölçüm zeplini';root.add(craft);part(craft,skin,cloth,0,1.18,0);
    const frame=new T.Group();craft.add(frame);
    function fin(p,y,z,angle) {
      const shape=new T.Shape();
      shape.moveTo(-.97,0);shape.bezierCurveTo(-1.32,.09,-1.66,.59,-2.03,.6);
      shape.lineTo(-1.86,.06);shape.quadraticCurveTo(-1.77,-.12,-1.30,-.15);shape.closePath();
      const g=new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false,curveSegments:8});g.translate(0,0,-.022);
      const foil=part(p,g,mint,0,y,z);foil.rotation.x=angle;
      bar(p,brass,[-1.27,y+.04*Math.cos(angle),z+.04*Math.sin(angle)],[-1.96,y+.54*Math.cos(angle),z+.54*Math.sin(angle)],.016);
    }
    fin(frame,1.5,0,0);fin(frame,1.05,0,2.28);fin(frame,1.05,0,-2.28);
    for(const z of [-.29,.29])for(const side of [-1,1]){
      bar(frame,brass,[side*.79,.73,z],[side*.25,-.08,z*.64],.022);
    }
    part(frame,sphere,enamel,0,-.10,.005,.48,.25,.30);
    part(frame,box,night,.025,-.11,.25,.45,.13,.10);
    part(frame,cylinder,night,-.33,-.41,.02,.115,.25,.115);
    part(frame,sphere,brass,.26,-.32,.03,.14,.11,.13);
    part(frame,sphere,night,1.56,1.2,0,.13,.14,.14);
    bar(frame,brass,[1.5,1.2,0],[1.83,1.2,0],.028);
    joinRigid(frame);
    const lights=[];
    for(let i=0;i<3;i++)lights.push(part(craft,sphere,night,-.112+i*.135,-.11,.314,.045,.038,.025));
    const wheel=new T.Group();wheel.position.set(1.81,1.2,0);craft.add(wheel);
    for(let i=0;i<3;i++){const a=tau*i/3;const blade=part(wheel,sphere,mint,0,.18*Math.cos(a),.18*Math.sin(a),.04,.20,.068);blade.rotation.x=a;}
    joinRigid(wheel);
    const panel=new T.Group(),fasteners=[],ropes=[];root.add(panel);
    const fixColours=[paint(0xf8b94d),paint(0x45cdb4),paint(0xe37a52)];
    const circle=new T.TorusGeometry(.24,.079,8,24);
    const tempA=new T.Vector3(),tempB=new T.Vector3(),tempC=new T.Vector3();
    const y0=world.ground(44)-level+1.55;
    let clock=0,opened=0,releasedAt=-1,pressAt=-5,bob=0,watching=0;
    for(const [i,x] of [40,44,48].entries()){
      const cap=world.platforms.find(q=>q.x===x);
      const y=cap.y-level,dx=x-centre;
      part(panel,cylinder,night,dx,y+.065,0,.38,.13,.32);
      part(panel,cylinder,brass,dx,y+.15,0,.29,.075,.25);
      part(panel,box,enamel,dx,y+.28,0,.29,.23,.20);
      const handle=new T.Group();handle.position.set(dx,y+.29,.045);root.add(handle);
      part(handle,circle,fixColours[i],0,.28,0);
      part(handle,box,fixColours[i],0,.51,0,.33,.11,.10);
      joinRigid(handle);
      const marker=part(root,sphere,light,dx,y+.31,.145,.072,.041,.04);
      const geo=new T.BufferGeometry(),points=new Float32Array(21*2*3),faces=[],colours=[];
      const dark=new T.Color([0x854e37,0x3a6e69,0xaa5434][i]),pale=new T.Color(0xf3cf87);
      for(let j=0;j<=20;j++){
        const c=j%3===2?pale:dark;colours.push(c.r,c.g,c.b,c.r,c.g,c.b);
        if(j<20){const k=2*j;faces.push(k,k+1,k+2,k+2,k+1,k+3);}
      }
      geo.setAttribute('position',new T.BufferAttribute(points,3).setUsage(T.DynamicDrawUsage));
      geo.setAttribute('color',new T.Float32BufferAttribute(colours,3));geo.setIndex(faces);
      const rope=new T.Mesh(geo,new T.MeshBasicMaterial({side:T.DoubleSide,vertexColors:true}));
      rope.frustumCulled=false;root.add(rope);
      fasteners.push({x,y,dx,handle,marker,at:-1});ropes.push({points,geo});
    }
    joinRigid(panel);
    function openOne(i){
      const q=fasteners[i];if(q.at>=0||clock-pressAt<.24)return false;
      pressAt=q.at=clock;opened++;lights[opened-1].material=light;
      if(opened===3){releasedAt=clock;if(world.marsMission){if(world.marsMission.signal)world.marsMission.signal('balloon',centre);else world.marsMission.balloon=true;}M.sfx('aerostat-away');}
      else M.sfx('aerostat-clasp');
      if(M.captions)M.setHint(opened===3?'Rüzgâr postası göğe yükseldi!':'Renkli halkalar çözülünce rüzgâr postası uçacak.');
      return true;
    }
    function near(){return Math.abs(player.x-centre)<13&&!player.locked;}
    function ringHit(p,q){
      if(M.touchPlayPart(p,q.handle,.18))return true;
      // Keep even the zoomed-out ring's centre easy to touch with a small finger.
      q.handle.localToWorld(tempA.set(0,.28,0)).project(M.camera);tempB.set(p.x,p.y,0).project(M.camera);
      return Math.hypot((tempA.x-tempB.x)*innerWidth*.5,(tempA.y-tempB.y)*innerHeight*.5)<=22;
    }
    function touch(p){
      if(!near()||opened===3)return false;
      let best=-1,distance=Infinity;
      for(let i=0;i<3;i++){
        const q=fasteners[i];if(q.at>=0)continue;
        const d=p?Math.hypot((p.x-q.x)/1.03,(p.y-level-q.y-.51)/.87):Math.abs(player.x-q.x)/2;
        if((!p?d<1:ringHit(p,q))&&d<distance){distance=d;best=i;}
      }
      return best>=0&&openOne(best);
    }
    const pull={owner:null,index:-1,startX:0,startY:0,clientX:0,clientY:0,tap:true,amount:0};
    function cancelPull(){pull.owner=null;pull.index=-1;pull.amount=0;}
    function pointer(type,p,event){
      const id=event?.pointerId??'primary';
      if(type==='cancel'){if(!event||pull.owner===id)cancelPull();return false;}
      if(pull.owner!==null){
        if(id!==pull.owner)return true;
        if(type==='move'||type==='up'){
          if(p&&fasteners[pull.index].at<0){const down=pull.startY-p.y,side=Math.abs(p.x-pull.startX);if(Number.isFinite(event?.clientX)){if(Math.hypot(event.clientX-pull.clientX,event.clientY-pull.clientY)>24)pull.tap=false;}else if(Math.hypot(side,down)>.43)pull.tap=false;pull.amount=M.clamp(Math.max(down/.43,side/.65),0,1);if(pull.amount>.68||type==='up'&&pull.tap)openOne(pull.index);}
          if(type==='up')cancelPull();return true;
        }
        return true;
      }
      if(type!=='down'||!p||!near()||opened===3)return false;
      for(let i=0;i<fasteners.length;i++){const q=fasteners[i];if(q.at<0&&ringHit(p,q)){pull.owner=id;pull.index=i;pull.startX=p.x;pull.startY=p.y;pull.clientX=event?.clientX??0;pull.clientY=event?.clientY??0;pull.tap=true;pull.amount=0;M.sfx('select');return true;}}
      return false;
    }
    function update(dt,t){
      clock=t;root.visible=Math.abs(player.x-centre)<44;
      if(!root.visible){watching=0;return;}
      if(near()&&opened<3&&Math.abs(player.vx)<.6)M.frameActivity(Math.min(centre-5.2,player.x-1.05,dog.x-1.20),centre+5.2,level+2.35,.98);
      watching=near()&&Math.abs(player.vx)<.45&&player.grounded?watching+dt:0;
      let suggested=null;
      if(watching>2.8&&opened<3&&t-pressAt>2.6){
        for(const q of fasteners)if(q.at<0&&(!suggested||Math.abs(q.x-player.x)<Math.abs(suggested.x-player.x)))suggested=q;
        if(suggested){
          // Bilbo waits beneath the loop, looks up, then Feza points at it.
          // The paw never opens it on the child's behalf.
          dog.activityTargetX=suggested.x-.62;dog.activityMode='look';dog.emote='curious';
          dog.lookX=Math.sign(suggested.x-dog.x)*.45;dog.lookY=.68;
          player.lookX=Math.sign(suggested.x-player.x)*.55;player.lookY=.36;
          if(watching>4.2){player.emote='point';if(Math.abs(suggested.x-player.x)>.7)player.facing=Math.sign(suggested.x-player.x);}
        }
      }
      const age=releasedAt<0?0:Math.max(0,t-releasedAt),ascent=age?1-Math.exp(-age*.21):0;
      const free=Math.min(1,age/2.2);bob=M.damp(bob,opened/3,2,dt);
      const first=fasteners[0],last=fasteners[2],lean=(first.at>=0?1:0)-(last.at>=0?1:0);
      craft.position.set(.36*Math.sin(t*.7)+.48*lean*(1-free)+ascent*18,
        y0+.98+bob*.7+.10*Math.sin(t*1.24)+ascent*9.8,-.55-ascent*3.8);
      craft.rotation.z=.035*Math.sin(t*.85)+.13*lean*(1-free)+.04*ascent;
      craft.visible=age<22;wheel.rotation.x+=dt*(4+opened*2+(world.weather?.intensity||0)*5);
      for(let i=0;i<3;i++){
        const q=fasteners[i],r=ropes[i],u=q.at<0?0:Math.min(1,(t-q.at)/.63);
        const call=q===suggested?Math.sin(t*2.8):0;
        const held=pull.index===i?pull.amount:0;
        q.handle.rotation.z=(u||held*.58)*(i===2?1.18:-1.18)+.09*call;q.handle.position.y=q.y+.29-.18*Math.max(u,held);
        q.marker.visible=u<1;q.marker.scale.set(.072+.013*call,.041+.008*call,.04);
        if(u===1&&!r.geo.drawRange.count)continue;
        if(u===1){r.geo.setDrawRange(0,0);continue;}
        tempA.set(q.dx,q.y+.53,.035);
        tempB.set(i===0?-.33:i===2?.33:0,-.19,.04).applyQuaternion(craft.quaternion).add(craft.position);
        tempB.lerp(tempA,u);
        for(let k=0;k<=20;k++){const f=k/20;tempC.lerpVectors(tempA,tempB,f);tempC.y-=Math.sin(Math.PI*f)*(.15+u*.46);
          const dx=tempB.x-tempA.x,dy=tempB.y-tempA.y-Math.cos(Math.PI*f)*Math.PI*(.15+u*.46);
          const width=.0325/Math.max(.01,Math.hypot(dx,dy)),px=-dy*width,py=dx*width,j=k*6;
          r.points[j]=tempC.x-px;r.points[j+1]=tempC.y-py;r.points[j+2]=tempC.z;
          r.points[j+3]=tempC.x+px;r.points[j+4]=tempC.y+py;r.points[j+5]=tempC.z;}
        r.geo.attributes.position.needsUpdate=true;
      }
      if(near()&&Math.abs(player.vx)<.65&&clock-pressAt<2.6){
        player.emote=opened===3?'point':'curious';player.lookX=Math.sign(centre+craft.position.x-player.x)*.6;player.lookY=.78;dog.emote='curious';dog.lookX=Math.sign(centre+craft.position.x-dog.x)*.55;dog.lookY=.74;
      }
      if(near()&&releasedAt>=0&&age<1.8&&Math.abs(player.vx)<.6)
        M.setCameraTarget(centre+1.5+ascent*5,level+3.15+ascent*2.5,.86,.45*(1-age/1.8));
    }
    const lessons=[{id:'mars-wind-mail',x:centre,y:level,goal:'balloon',range:13,demoSources:fasteners.map(q=>q.handle),enabled:()=>!player.locked,completed:()=>opened===3,describe(step){const q=fasteners.find(q=>q.at<0);if(!q)return false;step.action='tap';step.demoObject=q.handle;step.sourceIcon='loop';step.progress=opened;step.total=3;q.handle.localToWorld(step.from.set(0,.28,0));step.to.copy(step.from);return true;}}];
    return {lessons,touch,pointer,dispose:cancelPull,update,state:()=>({released:opened,airborne:releasedAt>=0})};
  };
})(window.MARS);
