(function (M) {
  'use strict';

  M.createMarsSampleBench = function ({scene, world, player, dog=M.dog}) {
    const mission=world.marsMission||(world.marsMission={power:false,water:false,samples:false});
    const T=THREE, center=416, floor=world.ground(center);
    const bench=new T.Group();
    bench.name='Mars kayaç laboratuvarı';
    bench.position.set(center,floor,-1.28);scene.add(bench);
    const fixed=new T.Group();bench.add(fixed);
    const paint=(color,metalness=.22)=>new T.MeshStandardMaterial({color,roughness:.56,metalness});
    const ink=paint(0x2c454f), cream=paint(0xe2d8ad), mint=paint(0x387f80), brass=paint(0xc39147,.44);
    const cube=new T.BoxGeometry(), cylinder=new T.CylinderGeometry(1,1,1,24);
    const pin=new T.CylinderGeometry(1,1,1,12), rim=new T.TorusGeometry(1,.055,7,40);
    const up=new T.Vector3(0,1,0),axis=new T.Vector3();
    function part(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1){
      const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
      o.receiveShadow=true;parent.add(o);return o;
    }
    function brace(parent,mat,a,b,r){
      axis.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
      const o=part(parent,pin,mat,(a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5,r,axis.length(),r);
      o.quaternion.setFromUnitVectors(up,axis.normalize());
    }
    // The large, low specimen pads and the separate eyepiece are all reachable on foot.
    const sampleXs=[-2.60,-1.06,.47],baseY=.65,scopeX=2.17;
    for(const x of [-2.69,-.08,2.64]){
      const sole=world.ground(center+x)-floor-.03,height=Math.max(.16,.43-sole);
      part(fixed,cube,ink,x,sole+height*.5,-.10,.20,height,.57);
      part(fixed,cube,mint,x,sole+.055,-.1,.78,.13,1.06);
    }
    part(fixed,cube,cream,-.04,.42,0,6.25,.22,1.06);
    part(fixed,cube,mint,-.04,.48,.53,6.22,.12,.06);
    for(const x of [-2.97,-1.50,.02,1.53,2.92]){
      const rivet=part(fixed,pin,brass,x,.48,.569,.028,.024,.028);rivet.rotation.x=Math.PI/2;
    }
    for(const x of sampleXs){
      part(fixed,cylinder,ink,x,.55,.04,.60,.12,.45);
      const lip=part(fixed,rim,brass,x,.61,.04,.54,.40,.54);lip.rotation.x=-Math.PI/2;
    }
    part(fixed,cylinder,mint,scopeX,.56,.04,.73,.15,.55);
    part(fixed,cylinder,cream,scopeX,.65,.04,.60,.035,.47);
    // An articulated magnifier and its circular viewing glass.
    const glassX=scopeX+.47,glassY=3.10;
    brace(fixed,ink,[scopeX+.67,.52,-.32],[glassX+1.00,2.64,-.44],.11);
    brace(fixed,brass,[glassX+1.00,2.64,-.44],[glassX+.88,glassY,-.46],.09);
    const frame=part(fixed,cylinder,mint,glassX,glassY,-.47,1.01,.19,1.01);frame.rotation.x=Math.PI/2;
    part(fixed,rim,brass,glassX,glassY,-.34,1.01,1.01,1.01);
    const darkWell=new T.MeshBasicMaterial({color:0x344c56});
    part(fixed,new T.CircleGeometry(.94,48),darkWell,glassX,glassY,-.36);
    for(let i=0;i<8;i++){
      const a=Math.PI*2*i/8;
      const tick=part(fixed,cube,cream,glassX+.91*Math.cos(a),glassY+.91*Math.sin(a),-.30,.031,.085,.032);
      tick.rotation.z=a-Math.PI*.5;
    }
    const glint=new T.TorusGeometry(.82,.012,4,18,Math.PI*.26);
    part(fixed,glint,cream,glassX,glassY,-.292).rotation.z=.62;
    const pivotX=-.04,pivotY=2.45;
    part(fixed,cylinder,ink,pivotX,.77,-.75,.35,.66,.32);
    brace(fixed,cream,[pivotX,.72,-.73],[pivotX,pivotY,-.65],.15);
    world.batchStation(fixed);

    // A single painted mineral surface is reused on the specimen and in its lens.
    // These patterns are generated once per visit and require no downloads.
    function sampleMap(kind){
      const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
      const c=canvas.getContext('2d');let seed=349063+kind*617;
      function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
      c.fillStyle=['#b37c53','#9b8471','#625754'][kind];c.fillRect(0,0,size,size);
      const grain=c.getImageData(0,0,size,size),data=grain.data;
      for(let p=0;p<data.length;p+=4){const shift=(random()-.5)*(kind===2?19:14);data[p]+=shift;data[p+1]+=shift;data[p+2]+=shift;}
      c.putImageData(grain,0,0);
      if(kind===0){
        const inks=['#dca779','#9b674c','#c78961','#ebc295','#955e49','#b87858'];
        for(let y=-28,i=0;y<size+30;i++){
          const h=4+random()*13,amplitude=2+random()*1.5,baseline=y;
          c.fillStyle=inks[i%inks.length];c.beginPath();
          function bedding(x,row){
            const a=x*2*Math.PI/size;
            return Math.sin(a+Math.sin(2*a)*.66+row*.006)*amplitude*1.9+Math.sin(3*a+.6+row*.011)*2.1;
          }
          for(let x=0;x<=size;x+=4){
            const wave=bedding(x,baseline);
            if(x===0)c.moveTo(x,baseline+wave);else c.lineTo(x,baseline+wave);
          }
          for(let x=size;x>=0;x-=4)c.lineTo(x,baseline+h+bedding(x,baseline+h));
          c.closePath();c.fill();y+=h;
        }
        for(let i=0;i<15;i++){
          const x=random()*size,y=random()*size;c.strokeStyle='rgba(85,54,43,.18)';c.lineWidth=.7;c.beginPath();c.moveTo(x,y);
          c.lineTo(x+3+random()*4,y+4);c.lineTo(x+4+random()*10,y+8+random()*8);c.stroke();
        }
        for(let i=0;i<2300;i++){c.fillStyle=i%2?'rgba(255,222,182,.19)':'rgba(66,39,42,.10)';c.fillRect(random()*size,random()*size,1+random()*2,.65);}
      }else{
        const pebbles=['#d4bb90','#aa7967','#7f847c','#c7a184','#786e70','#d0c2a5'];
        const pits=kind===2;
        for(let i=0;i<(pits?128:108);i++){
          const x=random()*size,y=random()*size,wide=2+random()**1.4*(pits?14:18),h=wide*(.46+random()*.49),turn=(random()-.5)*2;
          const tint=pebbles[Math.floor(random()*pebbles.length)];
          for(const dx of [-size,0,size])for(const dy of [-size,0,size]){
            if(x+dx+wide<0||x+dx-wide>size||y+dy+wide<0||y+dy-wide>size)continue;
            c.save();c.translate(x+dx,y+dy);c.rotate(turn);c.scale(1,h/wide);
            const g=c.createRadialGradient(-wide*.27,-wide*.32,.4,0,0,wide);
            if(pits){g.addColorStop(0,'#302c32');g.addColorStop(.63,'#403b41');g.addColorStop(.84,'#615454');g.addColorStop(1,'#a18a79');}
            else {g.addColorStop(0,'#e0cfad');g.addColorStop(.36,tint);g.addColorStop(.83,tint);g.addColorStop(1,'#695b52');}
            c.fillStyle=g;c.beginPath();c.arc(0,0,wide,0,2*Math.PI);c.fill();c.restore();
          }
        }
      }
      const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;return tex;
    }
    const maps=[0,1,2].map(sampleMap),samples=[];
    for(let k=0;k<3;k++){
      const geo=new T.SphereGeometry(1,16,10),p=geo.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i),rough=1+.08*Math.sin(4*x+3*y+z+k)+.055*Math.sin(5*z-3*y+k*.8);
        p.setXYZ(i,x*rough*(1+.09*y),Math.max(-.67,y*rough),z*rough);
      }
      geo.computeVertexNormals();
      const m=new T.MeshStandardMaterial({map:maps[k],roughness:.86,metalness:.015});
      const o=part(bench,geo,m,sampleXs[k],baseY+.22,.05,.53,k===1?.29:.34,.38);
      o.name=['Katmanlı kumtaşı','Çakıllı kaya','Gözenekli lav taşı'][k];o.castShadow=true;
      o.rotation.y=[.94,-.8,.38][k];samples.push(o);
    }
    const glassMat=new T.MeshBasicMaterial({map:maps[0],transparent:true,opacity:0,depthWrite:false});
    const view=part(bench,new T.CircleGeometry(.85,48),glassMat,glassX,glassY,-.325);
    view.name='Büyüteçte kayaç örneği';view.visible=false;
    const sampleHand=M.WorkshopArt.hand(bench,.95);sampleHand.position.z=1;
    const mark=part(bench,rim,new T.MeshBasicMaterial({color:0xffd788}),sampleXs[0],.623,.04,.58,.43,.58);
    mark.rotation.x=-Math.PI/2;

    // Two rigid links reach the real claw; solve their joints from its target.
    const linkA=part(bench,cube,mint,0,0,-.65,.17,1,.19),linkB=part(bench,cube,cream,0,0,-.61,.15,1,.17);
    const elbow=part(bench,pin,brass,0,0,-.56,.15,.27,.15);elbow.rotation.x=Math.PI/2;
    const motor=part(bench,pin,brass,pivotX,pivotY,-.60,.23,.28,.23);motor.rotation.x=Math.PI/2;
    for(const joint of [elbow,motor]){
      part(joint,pin,ink,0,.55,0,.63,.16,.63);
      part(joint,pin,cream,0,.65,0,.29,.13,.29);
    }
    const head=new T.Group();bench.add(head);
    part(head,cube,ink,0,.065,-.35,.31,.18,.72);
    const pair=[];
    for(const sign of [-1,1]){
      const jaw=new T.Group();head.add(jaw);jaw.position.set(sign*.12,.06,-.01);
      brace(jaw,brass,[0,0,0],[sign*.17,-.25,0],.046);
      brace(jaw,brass,[sign*.17,-.25,0],[sign*.035,-.34,0],.05);
      world.batchStation(jaw);pair.push(jaw);
    }
    const clamp=M.clamp;
    const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
    const restX=-.33,restY=2.56,gripY=baseY+.58;
    let clawX=restX,clawY=restY,grip=0;
    function aim(){
      const dx=clawX-pivotX,dy=clawY-pivotY,dist=Math.max(.01,Math.hypot(dx,dy));
      const len=1.65,reach=Math.sqrt(Math.max(0,len*len-dist*dist*.25));
      const ex=pivotX+dx*.5-dy*reach/dist;
      const ey=pivotY+dy*.5+dx*reach/dist;
      function placeLink(o,ax,ay,bx,by){
        o.position.x=(ax+bx)*.5;o.position.y=(ay+by)*.5;
        o.scale.y=Math.hypot(bx-ax,by-ay);o.rotation.z=Math.atan2(ax-bx,by-ay);
      }
      placeLink(linkA,pivotX,pivotY,ex,ey);placeLink(linkB,ex,ey,clawX,clawY);
      elbow.position.set(ex,ey,-.56);head.position.set(clawX,clawY,.055);
      pair[0].rotation.z=-.37*(1-grip);pair[1].rotation.z=.37*(1-grip);
    }
    let time=0,active=-1,queued=-1,last=0,inspected=-1,started=0,lit=0,visited=false,endAllowedAt=0;
    let scanned=false;const examined=[false,false,false];
    const archiveLights=sampleXs.map(x=>part(bench,new T.SphereGeometry(.075,10,7),mint,x,.76,.49));
    const archiveGlow=new T.MeshStandardMaterial({color:0xffd877,emissive:0xcc8d31,emissiveIntensity:.45,roughness:.45});
    function start(k){
      scanned=false;
      active=k;started=time;queued=-1;visited=true;endAllowedAt=time+.4;
      M.sfx('aerostat-clasp');
    }
    function request(k){
      if(time<endAllowedAt){if(active>=0&&k!==active)queued=k;return;}
      if(active<0){start(k);return;}
      queued=k;endAllowedAt=time+.34;
      const age=time-started;
      if(age>2.58&&age<4.68)started=time-4.68;
      M.sfx('select');
    }
    function touch(p){
      if(player.locked||Math.abs(player.x-center)>(p?10:6))return false;
      if(!p){request((active>=0?active+1:last+1)%3);return true;}
      const x=p.x-center,y=p.y-floor;
      for(let i=0;i<3;i++)if(!examined[i]&&M.touchPlayPart(p,samples[i],.16)){request(i);return true;}
      return false;
    }
    function update(dt,now){
      time=now;bench.visible=Math.abs(player.x-center)<36;
      if(!bench.visible&&active<0)return;
      // The specimen only moves after the child chooses it.

      if(active>=0){
        const k=active,sample=samples[k],sx=sampleXs[k],age=time-started;
        let u;
        if(age<1.0){
          u=ease(age);clawX=restX+(sx-restX)*u;clawY=restY+(gripY-restY)*u+.23*Math.sin(Math.PI*u);grip=ease((age-.73)/.27);
        }else if(age<2.5){
          u=ease((age-1)/1.5);clawX=sx+(scopeX-sx)*u;clawY=gripY+.79*Math.sin(Math.PI*u);grip=1;
          sample.position.set(clawX,clawY-.36,.05);
        }else if(age<4.92){
          sample.position.set(scopeX,baseY+.22,.05);clawX=scopeX;
          const upAmount=ease((age-2.5)/.33)*(1-ease((age-4.61)/.31));
          clawY=gripY+upAmount*.31;grip=1-upAmount;
          if(!scanned){inspected=k;last=k;glassMat.map=maps[k];view.visible=true;scanned=true;examined[k]=true;archiveLights[k].material=archiveGlow;if(examined.every(Boolean)&&!mission.samples){if(mission.signal)mission.signal('samples',center);else mission.samples=true;M.celebrate(center,floor+2);}if(bench.visible)M.sfx('scan');}
        }else if(age<6.35){
          u=ease((age-4.92)/1.43);clawX=scopeX+(sx-scopeX)*u;clawY=gripY+.79*Math.sin(Math.PI*u);grip=1;
          sample.position.set(clawX,clawY-.36,.05);
        }else{
          sample.position.set(sx,baseY+.22,.05);
          u=ease((age-6.35)/.82);clawX=sx+(restX-sx)*u;clawY=gripY+(restY-gripY)*u;grip=1-ease((age-6.35)/.24);
          if(u===1){active=-1;if(queued>=0&&bench.visible)start(queued);else queued=-1;}
        }
        aim();
      }
      if(!bench.visible)return;
      if(active>=0&&!player.locked&&Math.abs(player.x-center)<5.2&&Math.abs(player.vx)<.6&&(!examined.every(Boolean)||time-started<3.9)){
        M.frameActivity(Math.min(center-3.75,player.x-1.1,dog.x-1.3),Math.max(center+4.20,player.x+1.1,dog.x+1.3),floor+2.08,.98);
      }
      lit=M.damp(lit,inspected>=0?1:0,7,dt);glassMat.opacity=.91*lit;
      const choice=queued>=0?queued:active>=0?active:(last+1)%3;
      sampleHand.visible=!M.playGuideActive&&active<0&&!examined.every(Boolean)&&Math.abs(player.x-center)<6&&Math.abs(player.vx)<.4;
      const suggested=examined.findIndex(value=>!value);sampleHand.position.set(sampleXs[Math.max(0,suggested)],1.30+.06*Math.sin(time*2.8),.6);
      mark.visible=false;mark.position.x=sampleXs[choice];const pulse=1+.065*Math.sin(time*3.4);
      mark.scale.set(.59*pulse,.43*pulse,.58*pulse);
    }
    aim();
    const sampleState={examined,active:-1,queued:-1,finished:false};
    const lessons=[{id:'mars-magnifier',x:center,y:floor,goal:'scope',range:10,enabled:()=>!player.locked,completed:()=>examined.every(Boolean),describe(step){const i=examined.findIndex(q=>!q);if(i<0)return false;step.action=active>=0?'wait':'tap';step.sourceIcon='rock';step.progress=examined.filter(Boolean).length;step.total=3;samples[i].getWorldPosition(step.from);step.to.copy(step.from);return true;}}];
    return {lessons,touch,update,state(){sampleState.active=active;sampleState.queued=queued;sampleState.finished=examined.every(Boolean);return sampleState;}};
  };
})(window.MARS);

