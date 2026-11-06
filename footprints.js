(function(M){
 'use strict';
 const T=THREE;
 M.createFootprints=function(scene,world){
  function soleTexture(dog) {
    const c=document.createElement('canvas');c.width=c.height=64;
    const g=c.getContext('2d');g.fillStyle='rgba(87,46,33,.33)';
    if(dog){
      g.beginPath();g.ellipse(32,39,13,12,0,0,Math.PI*2);g.fill();
      for(const p of [[16,24],[27,16],[40,17],[49,27]]){
        g.beginPath();g.ellipse(p[0],p[1],6,7,0,0,Math.PI*2);g.fill();
      }
    }else{
      g.beginPath();g.roundRect(19,8,25,48,11);g.fill();
      g.strokeStyle='rgba(238,166,117,.32)';g.lineWidth=3;
      for(let y=18;y<51;y+=7){g.beginPath();g.moveTo(22,y);g.lineTo(40,y);g.stroke();}
    }
    const a=new T.CanvasTexture(c);a.colorSpace=T.SRGBColorSpace;return a;
  }
  const wear={value:0},dummy=new T.Object3D(),limit=160;
  function prints(dog){
    const g=new T.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
    const born=new T.InstancedBufferAttribute(new Float32Array(limit),1).setUsage(T.DynamicDrawUsage);
    g.setAttribute('aBirth',born);
    const m=new T.MeshBasicMaterial({map:soleTexture(dog),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
    m.onBeforeCompile=shader=>{
      shader.uniforms.uWear=wear;
      shader.vertexShader='attribute float aBirth; uniform float uWear; varying float vInk;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vInk=1.-smoothstep(2.,11.,uWear-aBirth);');
      shader.fragmentShader='varying float vInk;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\n diffuseColor.a *= vInk;');
    };
    const mesh=new T.InstancedMesh(g,m,limit);mesh.frustumCulled=false;mesh.renderOrder=2;
    mesh.count=0;mesh.visible=false;scene.add(mesh);
    return {mesh,born,total:0,distance:0,lastX:NaN,side:1,grounded:true,vy:0,dog};
  }
  const feet=prints(false),paws=prints(true);
  // Contact dust is a single draw with a fixed particle pool. The grains sit
  // behind the boots and drift sideways with the passing front.
  const budget=36,pos=new Float32Array(budget*3),size=new Float32Array(budget),alpha=new Float32Array(budget);
  const grains=Array.from({length:budget},()=>({age:1,life:0,x:0,y:0,z:0,vx:0,vy:0,r:0}));
  const cloudGeo=new T.BufferGeometry();
  for(const [k,a,n] of [['position',pos,3],['puffSize',size,1],['puffAlpha',alpha,1]])cloudGeo.setAttribute(k,new T.BufferAttribute(a,n).setUsage(T.DynamicDrawUsage));
  const shader=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uPixels:{value:1}},
    vertexShader:'attribute float puffSize;attribute float puffAlpha;uniform float uPixels;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(puffSize*uPixels/max(1.,-mv.z),1.,80.);vAlpha=puffAlpha;}',
    fragmentShader:'varying float vAlpha;void main(){vec2 p=gl_PointCoord*2.-1.;float d=dot(p,p);float a=(1.-smoothstep(.12,1.,d))*vAlpha;if(a<.009)discard;gl_FragColor=vec4(.69,.41,.25,a);\n#include <colorspace_fragment>\n}'});
  const cloud=new T.Points(cloudGeo,shader);cloud.frustumCulled=false;cloud.renderOrder=2;cloud.visible=false;scene.add(cloud);
  let cursor=0;
  function kick(a,stamp,wind){
    const strong=stamp.vy<-3.1,n=strong?(stamp.dog?4:7):(stamp.dog?1:2);
    for(let j=0;j<n;j++){
      const i=cursor++%budget,q=grains[i],w=Math.sin(cursor*2.39996),v=Math.cos(cursor*1.87347);
      q.age=0;q.life=.33+.17*(w+1)*.5;q.x=a.x+.13*w;q.y=a.y+.05;q.z=(a.z||0)+.075+v*.07;
      q.vx=-a.vx*.19+w*(strong?.82:.34)+wind*.76;q.vy=(strong?.42:.19)+.17*(v+1);
      q.r=(strong?.11:.073)*(1+.25*w);
    }
    cloud.visible=true;
  }
  function track(s,a,wind){
    if(!Number.isFinite(s.lastX))s.lastX=a.x;
    s.distance+=Math.min(.18,Math.abs(a.x-s.lastX));s.lastX=a.x;
    const surface=world.ground(a.x),landed=!s.grounded&&a.grounded,groundContact=a.grounded&&!a.locked&&Math.abs(a.y-surface)<.14&&!world.isIce(a.x);
    if(groundContact){
      if(landed&&s.vy<-1.2)kick(a,s,wind);
      if(Math.abs(a.vx)>.4&&s.distance>(s.dog?.43:.56)){
        s.distance=0;s.side=-s.side;
        const i=s.total++%limit;
        dummy.position.set(a.x,surface+.024,(a.z??(s.dog?.3:0))+s.side*.115);
        // The long axis faces along the route and follows the local terrain.
        const slope=(world.ground(a.x+.08)-world.ground(a.x-.08))/.16;
        dummy.rotation.set(0,a.facing<0?-Math.PI/2:Math.PI/2,Math.atan(slope),'ZXY');
        dummy.scale.set(.22,1,s.dog?.22:.36);dummy.updateMatrix();
        s.mesh.setMatrixAt(i,dummy.matrix);s.mesh.instanceMatrix.needsUpdate=true;s.born.setX(i,wear.value);s.born.needsUpdate=true;
        s.mesh.count=Math.min(limit,s.total);s.mesh.visible=true;
        if(!landed)kick(a,s,wind);
      }
    }
    s.grounded=a.grounded;s.vy=a.vy;
  }
  let tireDistance=0,tireX=NaN,wasRolling=false;
  // Sand leaves the rear tyre on contact; the trail breaks while jumping and
  // briefly deepens at touchdown. Both use the same bounded dust pool.
  const tyre={x:0,y:0,z:-.22,vx:0},contact={dog:false,vy:0};
  function wheels(state,wind){
    const a=state.player;
    if(state.activity!=='rover'||a.mode!=='ride'){tireX=NaN;wasRolling=false;return;}
    const x=a.x-a.facing*1.98;
    if(Number.isFinite(tireX))tireDistance+=Math.min(.35,Math.abs(x-tireX));
    tireX=x;
    if(a.grounded&&Math.abs(a.vx)>.75&&(tireDistance>.35||!wasRolling)){
      tyre.x=x;tyre.y=world.ground(x)+.03;tyre.vx=a.vx;
      contact.vy=wasRolling?0:-4;kick(tyre,contact,wind);tireDistance=0;
    }
    wasRolling=a.grounded;
  }
  return {warm(visible){
    // Paid once under the loading curtain, never on the child's first footstep.
    for(const s of [feet,paws]){
      s.mesh.visible=visible;s.mesh.count=visible?1:0;
      if(visible){dummy.scale.setScalar(0);dummy.updateMatrix();s.mesh.setMatrixAt(0,dummy.matrix);s.mesh.instanceMatrix.needsUpdate=true;}
    }
    cloud.visible=visible;
  },update(dt,t,state){
    if(dt<=0)return;
    const wind=world.weather?.intensity||0;wear.value+=dt*(.045+.97*wind*wind);
    track(feet,state.player,wind);track(paws,state.dog,wind);wheels(state,wind);
    if(!cloud.visible)return;
    let active=0;
    for(let i=0;i<budget;i++){
      const q=grains[i];q.age+=dt;if(q.age>=q.life){alpha[i]=0;continue;}
      active++;const u=q.age/q.life;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy-=dt*.85;
      pos[i*3]=q.x;pos[i*3+1]=q.y;pos[i*3+2]=q.z;size[i]=q.r*(1+.8*u);
      alpha[i]=.26*(1-u)*(1-u);
    }
    cloud.visible=active>0;if(!active)return;
    shader.uniforms.uPixels.value=M.renderer.domElement.height/(2*Math.tan(M.camera.fov*Math.PI/360))*M.camera.zoom;
    for(const k of ['position','puffSize','puffAlpha'])cloudGeo.attributes[k].needsUpdate=true;
  }};
 };
})(window.MARS);
