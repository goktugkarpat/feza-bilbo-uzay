(function () {
  'use strict';
  const M = window.MARS;
  M.createWorld = function (scene) {
    const T = THREE, root = new T.Group(); root.name = 'Mars landscape'; scene.add(root);
    let seed = 74853;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const range = (a,b) => a+(b-a)*rand();
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const smooth = t => { t=clamp(t,0,1); return t*t*(3-2*t); };
    const mix = (a,b,t) => a+(b-a)*t;
    const stations = [[58,82,.65],[168,192,-.25],[288,312,-.65],[463,487,1.35]];
    const anchors = [[-50,0],[24,0],[42,.95],[54,.76],[58,.65],[82,.65],[98,1.1],[112,2.2],[131,.1],[150,-.5],[168,-.25],[192,-.25],[213,.75],[235,1.1],[252,.35],[272,-.4],[288,-.65],[312,-.65],[331,-.12],[350,.5],[371,1.15],[387,1.55],[401,.85],[414,1.7],[430,.4],[445,.85],[457,1.35],[463,1.35],[540,1.35]];
    function profile(x) { for(let i=1;i<anchors.length;i++) if(x<=anchors[i][0]) { const a=anchors[i-1],b=anchors[i]; return mix(a[1],b[1],smooth((x-a[0])/(b[0]-a[0]))); } return 1.35; }
    const sampleStart=-50, step=.5, heights=new Float32Array(1221);
    for(let i=0;i<heights.length;i++) heights[i]=profile(sampleStart+i*step);
    function ground(x) { const f=clamp((x-sampleStart)/step,0,heights.length-1),i=Math.floor(f); return mix(heights[i],heights[Math.min(i+1,heights.length-1)],f-i); }
    function height(x,z) { const a=Math.abs(z),away=smooth((a-1.6)/6),edge=smooth((a-1.2)/1.5),ice=smooth((x-244)/12)*(1-smooth((x-342)/12));const relief=(Math.sin(x*.73+Math.sin(z*.61))*Math.sin(z*.8+Math.sin(x*.19))*.22+Math.sin(x*1.8+z*.87)*.065+Math.sin(x*3.8-z*2.3)*.018)*edge*(z<0?1:.6)*(1-ice*.65);const raw=ground(x)+away*(z<0 ? .22+Math.sin(x*.052+z*.16)*.43+Math.sin(x*.15-z*.28)*.2 : -.65+Math.sin(x*.06+z*.16)*.2)+relief,campPad=smooth((4.5-Math.abs(x-13))/1.4)*smooth((3.8-Math.abs(z+6.5))/1.2),obsPad=smooth((5.6-Math.abs(x-477))/1.5)*smooth((5.5-Math.abs(z+7.8))/1.3);return mix(mix(raw,ground(13)+.05,campPad),ground(477)+.08,obsPad); }
    function canvasTexture(w,h,draw,repeatX,repeatY) { const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(repeatX||1,repeatY||1);tx.anisotropy=4;return tx; }
    const pbr=M.worldAssets?.textures || {};
    const sandTexture=pbr.soilColor&&pbr.soilNormal ? null : canvasTexture(1024,512,(c,w,h)=>{
      const img=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=rand(),v=174+n*35+Math.sin(y*.28+Math.sin(x*.012)*3)*3;let k=(y*w+x)*4;img.data[k]=v;img.data[k+1]=v;img.data[k+2]=v;img.data[k+3]=255;}c.putImageData(img,0,0);
      c.lineWidth=1;for(let i=0;i<68;i++){c.strokeStyle='rgba(75,57,49,'+range(.015,.06)+')';c.beginPath();const y=range(0,h);for(let x=-10;x<w+10;x+=8){const yy=y+Math.sin(x*.009+i*.7)*7+Math.sin(x*.025+i)*2;if(x<0)c.moveTo(x,yy);else c.lineTo(x,yy);}c.stroke();}
      for(let i=0;i<9000;i++){const x=rand()*w,y=rand()*h,s=range(.4,1.6);c.fillStyle=rand()<.5?'rgba(255,246,214,.12)':'rgba(59,38,31,.11)';c.fillRect(x,y,s*1.8,s);}
    },1,1);
    const strataTexture=pbr.rockColor&&pbr.rockNormal ? null : canvasTexture(512,1024,(c,w,h)=>{
      const img=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let band=Math.sin(y*.048)*12+Math.sin(y*.18)*5+Math.sin(y*.47)*2;let grain=rand()*17;let v=184+band+grain;let k=(y*w+x)*4;img.data[k]=v;img.data[k+1]=v;img.data[k+2]=v;img.data[k+3]=255;}c.putImageData(img,0,0);
      for(let i=0;i<75;i++){let y=range(0,h);c.fillStyle=rand()<.25?'rgba(255,234,193,.18)':'rgba(65,39,32,.13)';c.fillRect(0,y,w,range(1,4));}
      for(let i=0;i<80;i++){c.strokeStyle='rgba(55,30,25,.10)';c.lineWidth=range(.5,2);c.beginPath();let x=range(0,w),y=range(0,h);c.moveTo(x,y);c.lineTo(x+range(-6,6),y+range(20,110));c.stroke();}
    });
    const iceTexture=pbr.iceColor&&pbr.iceFrostColor&&pbr.iceNormal ? null : canvasTexture(1024,512,(c,w,h)=>{
      c.fillStyle='#cedfe5';c.fillRect(0,0,w,h);for(let i=0;i<80;i++){const x=range(0,w),y=range(0,h),r=range(15,90),g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,'rgba(74,133,165,.10)');g.addColorStop(1,'rgba(146,208,230,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
      for(let i=0;i<31;i++){let x=range(0,w),y=range(0,h);c.strokeStyle=i%3?'rgba(255,255,255,.35)':'rgba(63,116,154,.24)';c.lineWidth=range(.8,2);c.beginPath();c.moveTo(x,y);for(let j=0;j<5;j++){x+=range(-45,55);y+=range(10,55);c.lineTo(x,y);}c.stroke();}
      for(let i=0;i<1300;i++){c.fillStyle='rgba(255,255,255,.22)';c.fillRect(rand()*w,rand()*h,range(1,4),1);}
    });
    const rippleTexture=pbr.sandColor&&pbr.sandNormal ? null : canvasTexture(512,512,(c,w,h)=>{const img=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const wave=Math.sin(x*.26+Math.sin(y*.017)*1.4+Math.sin(y*.047)*.3),v=185+wave*5+rand()*7,k=(y*w+x)*4;img.data[k]=img.data[k+1]=img.data[k+2]=v;img.data[k+3]=255;}c.putImageData(img,0,0);});
    const paintTexture=canvasTexture(128,128,(c,w,h)=>{const img=c.createImageData(w,h);for(let i=0;i<w*h;i++){const f=Math.sin(i*12.9898)*43758.5453,v=239+(f-Math.floor(f))*8,k=i*4;img.data[k]=img.data[k+1]=img.data[k+2]=v;img.data[k+3]=255;}c.putImageData(img,0,0);});
    // Scenery uses its original seed after painting, even when all four fallback textures are skipped.
    seed=1228690301;
    const mats={
      ground:new T.MeshStandardMaterial({color:0xffffff,map:pbr.soilColor||sandTexture,normalMap:pbr.soilNormal||null,normalScale:new T.Vector2(.42,.42),roughnessMap:pbr.soilRoughness||null,bumpMap:pbr.soilNormal?null:sandTexture,bumpScale:.025,vertexColors:true,roughness:.98}),
      rock:new T.MeshStandardMaterial({color:0xffffff,map:pbr.rockColor||strataTexture,normalMap:pbr.rockNormal||null,normalScale:new T.Vector2(.78,.78),roughnessMap:pbr.rockRoughness||null,bumpMap:pbr.rockNormal?null:strataTexture,bumpScale:.03,vertexColors:true,roughness:.98}),
      sand:new T.MeshStandardMaterial({color:0xc78361,map:pbr.soilColor||sandTexture,normalMap:pbr.soilNormal||null,normalScale:new T.Vector2(.28,.28),roughness:.98}),
      dunes:new T.MeshStandardMaterial({color:0xd0a274,map:pbr.sandColor||rippleTexture,normalMap:pbr.sandNormal||null,normalScale:new T.Vector2(.5,.5),roughnessMap:pbr.sandRoughness||null,bumpMap:pbr.sandNormal?null:rippleTexture,bumpScale:.025,roughness:.98,transparent:true,opacity:1,depthWrite:false,vertexColors:true}),
      basalt:new T.MeshStandardMaterial({color:0x53484d,roughness:.97}),
      cream:new T.MeshStandardMaterial({color:0xece9dd,map:paintTexture,roughness:.52,metalness:.16}),
      teal:new T.MeshStandardMaterial({color:0x347b82,roughness:.47,metalness:.25}),
      orange:new T.MeshStandardMaterial({color:0xd78650,roughness:.53,metalness:.08}),
      metal:new T.MeshStandardMaterial({color:0x586777,roughness:.38,metalness:.62}),
      dark:new T.MeshStandardMaterial({color:0x263541,roughness:.62,metalness:.3}),
      ice:new T.MeshStandardMaterial({color:0x9cd9e5,map:pbr.iceColor||iceTexture,normalMap:pbr.iceNormal||null,normalScale:new T.Vector2(.22,.22),roughnessMap:pbr.iceRoughness||null,bumpMap:pbr.iceNormal?null:iceTexture,bumpScale:.025,roughness:.85,metalness:.04}),
      blueIce:new T.MeshStandardMaterial({color:0x69bad3,roughness:.3,metalness:.12,flatShading:true}),
      paleIce:new T.MeshStandardMaterial({color:0xbce9ef,roughness:.24,metalness:.1,flatShading:true}),
      glow:new T.MeshBasicMaterial({color:0x8ce4eb}),
      warmGlow:new T.MeshBasicMaterial({color:0xffdfab}),
      rail:new T.MeshStandardMaterial({color:0xc7cecd,roughness:.37,metalness:.72}),
      window:new T.MeshBasicMaterial({color:0xffdab0}),
      solar:new T.MeshStandardMaterial({color:0x294f69,metalness:.65,roughness:.28}),
    };
    function mesh(g,m,x,y,z,parent=root,shadow=true){const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
    function box(w,h,d,m,x,y,z,parent){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,parent);}
    function cylinder(rt,rb,h,m,x,y,z,parent,n=16){return mesh(new T.CylinderGeometry(rt,rb,h,n),m,x,y,z,parent);}
    function sphere(r,m,x,y,z,parent,w=20,h=12){return mesh(new T.SphereGeometry(r,w,h),m,x,y,z,parent);}
    function beam(a,b,r,mat,parent=root){const mid=new T.Vector3().addVectors(a,b).multiplyScalar(.5),o=cylinder(r,r,a.distanceTo(b),mat,mid.x,mid.y,mid.z,parent,8);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3().subVectors(b,a).normalize());return o;}
    function v(x,y,z){return new T.Vector3(x,y,z);}
    // Opaque cores keep the iPad fill cost low; only a narrow, cached fringe blends into the soil.
    const edgeMaterials=new WeakMap();mats.dunes.userData.softEdge=true;mats.ice.userData.softEdge=true;
    function softSurface(g,indices,alphas,material){
      const core=[],edge=[];for(let i=0;i<indices.length;i+=3){if(Math.max(alphas[indices[i]],alphas[indices[i+1]],alphas[indices[i+2]])<.001)continue;const list=Math.min(alphas[indices[i]],alphas[indices[i+1]],alphas[indices[i+2]])>.999?core:edge;list.push(indices[i],indices[i+1],indices[i+2]);}
      let rim=edgeMaterials.get(material);if(!rim){material.transparent=false;material.depthWrite=true;material.opacity=1;rim=material.clone();rim.transparent=true;rim.depthWrite=false;rim.alphaTest=.002;rim.onBeforeCompile=material.onBeforeCompile;rim.customProgramCacheKey=material.customProgramCacheKey;edgeMaterials.set(material,rim);}
      g.setIndex(core.concat(edge));g.addGroup(0,core.length,0);g.addGroup(core.length,edge.length,1);return mesh(g,[material,rim],0,0,0,root,false);
    }
    const unitBar=new T.BoxGeometry(1,1,1);
    function bars(parts,material,parent){const inst=new T.InstancedMesh(unitBar,material,parts.length),pose=new T.Object3D();parts.forEach((p,i)=>{pose.position.set(p[0],p[1],p[2]);pose.scale.set(p[3],p[4],p[5]);pose.rotation.set(p[6]||0,p[7]||0,p[8]||0);pose.updateMatrix();inst.setMatrixAt(i,pose.matrix);});inst.castShadow=true;inst.receiveShadow=true;parent.add(inst);return inst;}
    function roundedPanel(w,h,r,d,mat,x,y,z,parent){const sh=new T.Shape(),a=-w*.5,b=w*.5,c=-h*.5,e=h*.5;sh.moveTo(a+r,c);sh.lineTo(b-r,c);sh.quadraticCurveTo(b,c,b,c+r);sh.lineTo(b,e-r);sh.quadraticCurveTo(b,e,b-r,e);sh.lineTo(a+r,e);sh.quadraticCurveTo(a,e,a,e-r);sh.lineTo(a,c+r);sh.quadraticCurveTo(a,c,a+r,c);return mesh(new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1,curveSegments:5}),mat,x,y,z,parent);}
    function tubeBatch(segments,r,material,parent){const inst=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),material,segments.length),pose=new T.Object3D(),a=new T.Vector3(),b=new T.Vector3(),dir=new T.Vector3(),up=new T.Vector3(0,1,0);segments.forEach((p,i)=>{a.set(p[0],p[1],p[2]);b.set(p[3],p[4],p[5]);dir.subVectors(b,a);pose.position.addVectors(a,b).multiplyScalar(.5);pose.scale.set(r,dir.length(),r);pose.quaternion.setFromUnitVectors(up,dir.normalize());pose.updateMatrix();inst.setMatrixAt(i,pose.matrix);});inst.receiveShadow=true;parent.add(inst);return inst;}
    // Fixed parts keep their original UVs, normals, material and shadow flags.
    // A station is small enough to cull as a unit. Leave moving and instanced parts alone.
    function batchStation(station, moving) {
      station.updateWorldMatrix(true,true);
      const toStation=new T.Matrix4().copy(station.matrixWorld).invert(), buckets=new Map();
      station.traverse(o=>{
        if (!o.isMesh || o.isInstancedMesh || o===moving || Array.isArray(o.material) || o.material.transparent) return;
        const attr=o.geometry.attributes;
        if (!attr.position || !attr.normal || !attr.uv || attr.color || o.children.length) return;
        const key=o.material.id+'/'+Number(o.castShadow)+'/'+Number(o.receiveShadow);
        if (!buckets.has(key)) buckets.set(key,[]);
        buckets.get(key).push(o);
      });
      const local=new T.Matrix4(), normalMatrix=new T.Matrix3(), v=new T.Vector3();
      for (const pieces of buckets.values()) {
        if (pieces.length<2) continue;
        const positions=[], normals=[], uvs=[], indices=[];
        for (const piece of pieces) {
          const geom=piece.geometry, attr=geom.attributes, offset=positions.length/3;
          local.multiplyMatrices(toStation,piece.matrixWorld);
          normalMatrix.getNormalMatrix(local);
          for (let i=0;i<attr.position.count;i++) {
            v.fromBufferAttribute(attr.position,i).applyMatrix4(local); positions.push(v.x,v.y,v.z);
            v.fromBufferAttribute(attr.normal,i).applyNormalMatrix(normalMatrix); normals.push(v.x,v.y,v.z);
            uvs.push(attr.uv.getX(i),attr.uv.getY(i));
          }
          const count=geom.index ? geom.index.count : attr.position.count;
          for (let i=0;i<count;i++) indices.push(offset+(geom.index ? geom.index.getX(i) : i));
          piece.removeFromParent();
        }
        const g=new T.BufferGeometry();
        g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
        g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
        g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
        g.setIndex(indices); g.computeBoundingSphere();
        const first=pieces[0], joined=new T.Mesh(g,first.material);
        joined.castShadow=first.castShadow; joined.receiveShadow=first.receiveShadow;
        station.add(joined);
      }
    }
    function groundPlinth(parent,radius,top){const n=64,p=[],c=[],uv=[],ix=[],side=new T.Color(0xa97a5c),cap=new T.Color(0xc29a73);for(let k=0;k<2;k++)for(let j=0;j<=n;j++){const a=j/n*Math.PI*2,r=radius*(k?1:1.05),x=Math.cos(a)*r,z=Math.sin(a)*r,y=k?top:Math.min(top-.05,height(parent.position.x+x,parent.position.z+z)-parent.position.y-.05);p.push(x,y,z);const color=k?cap:side;c.push(color.r,color.g,color.b);uv.push(j/n*radius*Math.PI/2,y/2.7);if(k===0&&j<n){const a0=j,b0=j+n+1;ix.push(a0,b0,a0+1,a0+1,b0,b0+1);}}const center=p.length/3;p.push(0,top,0);c.push(cap.r,cap.g,cap.b);uv.push(0,0);for(let j=0;j<=n;j++){const a=j/n*Math.PI*2,x=Math.cos(a)*radius,z=Math.sin(a)*radius;p.push(x,top,z);c.push(cap.r,cap.g,cap.b);uv.push(x/2.7,z/2.7);}for(let j=0;j<n;j++)ix.push(center,center+j+2,center+j+1);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(g,mats.rock,0,0,0,parent);}
    function groundStairs(parent,start,end,width,count,deckTop){const first=deckTop-.12,last=Math.min(first-.14,height(parent.position.x,parent.position.z+end)-parent.position.y+.14);for(let i=0;i<count;i++){const f=i/(count-1),z=mix(start,end,f),top=mix(first,last,f),floor=height(parent.position.x,parent.position.z+z)-parent.position.y-.035,h=Math.max(.09,top-floor);box(width,h,.58,mats.cream,0,top-h*.5,z,parent);}}
    const rustA=new T.Color(0xb76e52), rustB=new T.Color(0xd69a70), iceCol=new T.Color(0x79a6bc), tmpCol=new T.Color(),duneCol=new T.Color(0xd6a06e),dustCol=new T.Color(0xc29b89);
    function terrain(){
      for(let start=-45;start<555;start+=20){const zRows=[-42,-36,-30,-24,-20,-16,-12,-9,-7,-5,-4.5,-4,-3.5,-3,-2.5,-2,-1.5,-1,-.5,0,.5,1,1.5,2,2.5,3,3.5,4,4.5,5,7,9,12,16,20,25,32,42],xs=40,zs=zRows.length-1,pos=[],col=[],uv=[],norm=[],idx=[];
        for(let i=0;i<=xs;i++){const x=start+i*.5;for(let j=0;j<=zs;j++){const z=zRows[j],y=height(x,z);pos.push(x,y,z);
          const ice=smooth((x-244)/12)*(1-smooth((x-342)/12));tmpCol.copy(rustA).lerp(rustB,.35+.19*Math.sin(x*.031+z*.26));tmpCol.lerp(duneCol,smooth((x-123)/17)*(1-smooth((x-225)/22))*.25);tmpCol.lerp(rustB,smooth((2.4-Math.abs(z))/1.3)*.38);tmpCol.lerp(iceCol,ice);const shade=1+Math.sin(x*.13+z*.5)*.025;col.push(tmpCol.r*shade,tmpCol.g*shade,tmpCol.b*shade);uv.push(x/4.8,z/4.8);
          const dx=(height(x+.25,z)-height(x-.25,z))/.5,dz=(height(x,z+.25)-height(x,z-.25))/.5,inv=1/Math.sqrt(dx*dx+1+dz*dz);norm.push(-dx*inv,inv,-dz*inv);
          if(i<xs&&j<zs){const a=i*(zs+1)+j,b=a+zs+1;idx.push(a,a+1,b,b,a+1,b+1);}
        }}
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setIndex(idx);mesh(g,mats.ground,0,0,0,root,false);
      }
    }
    terrain();
    // The sparse horizon shelf joins the bases of distant mesas. Keep it separate
    // so a visible ridge never pulls a nearby, finely tessellated terrain chunk into view.
    {
      const rows=[-104,-80,-60,-49,-41.5],p=[],colors=[],uv=[],ix=[],cols=300;
      for(let i=0;i<=cols;i++){const x=-45+i*2;for(let j=0;j<rows.length;j++){
        const z=rows[j],y=height(x,z)-(j===rows.length-1?.16:.06);
        p.push(x,y,z);uv.push(x/4.8,z/4.8);colors.push(dustCol.r,dustCol.g,dustCol.b);
        if(i<cols&&j+1<rows.length){const a=i*rows.length+j,b=a+rows.length;ix.push(a,a+1,b,b,a+1,b+1);}
      }}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(g,mats.ground,0,0,0,root,false);
    }
    // The frozen channel follows every vertex of the collision terrain, so no soil islands pierce its center.
    {const p=[],u=[],c=[],alpha=[],ix=[],zRows=[-3.5,-3,-2.5,-2,-1.5,-1,-.5,0,.5,1,1.5,2,2.5,3,3.5],n=200,nz=zRows.length;
      for(let i=0;i<=n;i++){const x=248+i*.5,edge=.35+Math.sin(x*.6)*.18+Math.sin(x*.23)*.2,taper=smooth((x-248)/5)*smooth((348-x)/5);for(let j=0;j<nz;j++){const z=zRows[j],width=(z<0?2.5:2.2)+edge,a=smooth((width-Math.abs(z))/.42)*taper;p.push(x,height(x,z)+.026,z);u.push(x/8,z/8);c.push(1,1,1,a);alpha.push(a);if(i<n&&j<nz-1){const a0=i*nz+j,b=a0+nz;ix.push(a0,a0+1,b,b,a0+1,b+1);}}}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setAttribute('color',new T.Float32BufferAttribute(c,4));g.computeVertexNormals();mats.ice.vertexColors=true;softSurface(g,ix,alpha,mats.ice);g.computeVertexNormals();
    }
    // The sky is an atmospheric gradient, with a broad sun and dust-colored horizon.
    scene.background=new T.Color(0xd1a297);scene.fog=new T.FogExp2(0xd1a297,.010);
    const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(0x6c768f)},horizon:{value:new T.Color(0xe2b6a0)},low:{value:new T.Color(0xc48771)}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vP;uniform vec3 top;uniform vec3 horizon;uniform vec3 low;void main(){vec3 d=normalize(vP);float h=d.y;vec3 c=mix(horizon,top,smoothstep(.0,.13,h)*.82+.18*pow(max(h,0.),.38));c=mix(c,low,(1.-smoothstep(-.22,0.,h)));float sun=pow(max(dot(d,normalize(vec3(-.55,.33,-.7))),0.),550.);float haze=pow(max(dot(d,normalize(vec3(-.55,.33,-.7))),0.),7.);float blue=pow(max(dot(d,normalize(vec3(-.55,.33,-.7))),0.),26.);float rose=exp(-pow((h-.035)/.03,2.));c+=vec3(.22,.14,.07)*haze*.6+vec3(-.05,.10,.24)*blue+vec3(.10,.03,.05)*rose+vec3(.55,.48,.33)*sun;gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}',toneMapped:false});
    const sky=mesh(new T.SphereGeometry(1100,32,16),skyMat,250,0,0,root,false);sky.renderOrder=-1000;sky.frustumCulled=false;
    // Magic twilight overhead: twinkling stars, Phobos and Deimos, and a rare slow shooting star.
    // The shared sky draws behind every cliff; its stars add light, so they fade into the bright dusty horizon.
    let magicStars=null,stormBig=false,stormCheer=0;
    const magicSky=M.createSpaceSky?M.createSpaceSky({scene,preset:'mars',dome:false,aurora:false,seed:11,
      stars:{count:1100,brightness:1.3,twinkle:1.1,size:1.35},shooting:{every:[22,40],duration:2.8,color:'#fff0de'},
      bodies:[{preset:'phobos',screen:[.71,.095],size:.125,light:[-1,.32],spin:.012,ambient:.42,colors:['#d9c2b0','#ad9483','#8a7464'],halo:'#ffd9e0',haloAmount:.4,alpha:.88},
              {preset:'deimos',screen:[.27,.085],size:.065,light:[-1,.32],spin:.02,ambient:.45,colors:['#e6d4c2','#bba795','#988472'],halo:'#ffe2e8',haloAmount:.4,alpha:.85}]}):null;
    if(magicSky)magicSky.group.traverse(o=>{if(o.isPoints){o.material.transparent=true;o.material.blending=T.AdditiveBlending;magicStars=o.material;}});
    const hemi=new T.HemisphereLight(0xc2d0e4,0x8c5040,2.1);scene.add(hemi);
    const shadowSize=M.device?.tablet ? 1024 : 2048;
    const sun=new T.DirectionalLight(0xffdfb6,3.1);sun.position.set(-30,52,28);sun.target.position.set(10,0,-4);sun.castShadow=true;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-18;sun.shadow.camera.near=1;sun.shadow.camera.far=120;sun.shadow.normalBias=.045;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun,sun.target);
    const fill=new T.DirectionalLight(0x9ab8d7,.8);fill.position.set(35,18,-30);scene.add(fill);
    // Far ridgelines use restrained tones and coherent layered silhouettes.
    function ridge(z,base,h,matSeed){
      const nx=180,nz=10,depth=z<-90?40:z<-60?30:22,p=[],c=[],uv=[],idx=[],color=new T.Color(matSeed);
      for(let i=0;i<=nx;i++){const x=-120+i*4,q=i*2/3;for(let j=0;j<=nz;j++){const f=j/nz,zz=z-depth*.5+f*depth,spine=.45+.08*Math.sin(q*.23),ridgeProfile=Math.pow(Math.max(0,Math.sin(Math.PI*f)),.8),peak=base+h*(.44+.21*Math.sin(q*.19+f*.8)+.14*Math.sin(q*.47+1.7)+.09*Math.sin(q*.83+f*1.3));
        const y=-4+ridgeProfile*(peak+4)+Math.sin(x*.14+zz*.18)*ridgeProfile*.45;p.push(x,y,zz);const shade=.89+.10*ridgeProfile+.02*Math.sin(x*.1+zz);c.push(color.r*shade,color.g*shade,color.b*shade);uv.push(x/18,zz/18);
        if(i<nx&&j<nz){const a=i*(nz+1)+j,b=a+nz+1;idx.push(a,a+1,b,b,a+1,b+1);}
      }}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),0,0,0,root,false);
    }
    ridge(-105,2,17,0xc4a5a0);ridge(-72,0,12,0xbb9285);ridge(-45,-2,8,0xb0826c);
    function mesa(x,z,w,h,d,s){
      const p=[],cols=[],uv=[],ind=[],n=40,rings=23,bottom=height(x,z)-.85,perimeter=Math.PI*(w+d)*.5,mode=Math.floor(s*3)%3;
      const base=new T.Color(0xb97d5d),light=new T.Color(0xcda17c),shade=new T.Color(0x9c664e),color=new T.Color();
      for(let k=0;k<rings;k++){const f=k/(rings-1),wall=mode===0?mix(1.04,.82,smooth(f)):mode===1?mix(1.10,.66,Math.pow(f,.7)):1.02-.16*f-.08*Math.sin(Math.PI*f),foot=.22*(1-smooth(f/.28));
        for(let j=0;j<=n;j++){const a=j/n*Math.PI*2,macro=.075*Math.sin(a*3+s)+.052*Math.sin(a*5+s*2)+.023*Math.sin(a*11+f*4+s),gully=-.095*Math.pow(Math.max(0,Math.sin(a*7+s+f*.3)),6)*Math.sin(Math.PI*f),fine=.018*Math.sin(a*17+f*13+s),bedding=.042*Math.sin(f*26+s+.6*Math.sin(a*3))+.019*Math.sin(f*47+s*.42),
              recess=.16*smooth((Math.cos(a+s*.58)-.30)/.70)*smooth((f-.27)/.64),
              rr=wall+foot+macro+gully+fine+bedding*Math.sin(f*Math.PI)-recess;
          const topBreak=(.058*Math.sin(a*3+s)+.029*Math.sin(a*7+s*1.8)+.012*Math.sin(a*13)+.045*Math.cos(a+s*.41))*Math.pow(f,5),yy=bottom+h*(f+topBreak),xx=Math.cos(a)*w*.5*rr,zz=Math.sin(a)*d*.5*rr;
          p.push(x+xx,yy,z+zz);const mottled=.5+.23*Math.sin(a*3+f*5+s)+.14*Math.sin(a*9-f*8+s);color.copy(base).lerp(light,clamp(mottled*.4+f*.12,0,1)).lerp(shade,Math.pow(Math.max(0,Math.sin(a*7+s)),5)*.22);color.lerp(dustCol,smooth((-z-23)/32)*.45);const lamina=.95+.055*Math.sin(f*26+s+.6*Math.sin(a*3));cols.push(color.r*lamina,color.g*lamina,color.b*lamina);uv.push(j/n*perimeter/4.2,(yy-bottom)/4.2);
          if(k<rings-1&&j<n){const a0=k*(n+1)+j,b0=a0+n+1;ind.push(a0,b0,a0+1,a0+1,b0,b0+1);}
        }
      }
      // Planar UVs on the top keep distant cliffs from showing stretched fans
      // when a sunlit dust front passes behind the rim.
      const capStart=p.length/3,cap=new T.Color(0xc49a75);
      for(let ring=0;ring<2;ring++)for(let j=0;j<n;j++) {
        const k=((rings-1)*(n+1)+j)*3,a=j/n*Math.PI*2,rr=ring?.64:1;
        const xx=x+(p[k]-x)*rr,zz=z+(p[k+2]-z)*rr,yy=ring?mix(bottom+h*.982,p[k+1],.53)+h*.013*Math.sin(a*3+s):p[k+1];
        p.push(xx,yy,zz);cols.push(cap.r,cap.g,cap.b);uv.push(xx/4.2,zz/4.2);
      }
      const center=p.length/3;p.push(x,bottom+h*.986,z);cols.push(cap.r,cap.g,cap.b);uv.push(x/4.2,z/4.2);
      for(let j=0;j<n;j++){const a=capStart+j,b=capStart+(j+1)%n;ind.push(a,b+n,b,a,a+n,b+n,center,b+n,a+n);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return mesh(g,mats.rock,0,0,0);
    }
    // Distinct mesas, spurs and sediment shelves rather than a chain of identical boulders.
    const formations=[[-17,-42,24,7,14],[22,-42,21,6,14],[42,-15,11,11,7],[56,-21,13,15,9],[81,-19,18,18,11],[102,-15,9,13,6],[119,-26,20,11,12],[139,-43,16,5,10],[163,-55,20,4,11],[211,-47,27,7,14],[235,-31,10,9,9],[245,-19,12,13,10],[352,-21,10,10,9],[371,-52,18,6,11],[414,-63,24,10,14],[445,-31,16,11,11]];
    formations.forEach((a,i)=>mesa(...a,i*.87));mesa(244,-7,8,9.2,7,92);mesa(352,-7.8,8,8.8,7.5,93);
    for(let i=0;i<8;i++){const x=range(44,120);mesa(x,range(-36,-28),range(5,10),range(8,17),range(5,9),i+10);}
    // One asymmetric wind-carved arch is a landmark among the canyon's freestanding pillars.
    {const sh=new T.Shape();sh.moveTo(-7.5,0);sh.lineTo(-7.2,1.6);sh.lineTo(-6.6,3.1);sh.lineTo(-6.6,4.8);sh.bezierCurveTo(-6.3,10.5,4.9,10.1,6.2,4.3);sh.lineTo(6.8,3.1);sh.lineTo(6.35,1.7);sh.lineTo(7.1,0);sh.lineTo(3.65,0);sh.lineTo(3.35,1.15);sh.lineTo(3.8,2.7);sh.lineTo(3.45,3.9);sh.bezierCurveTo(2.9,7.3,-3.5,7.6,-3.75,4.2);sh.lineTo(-4.1,2.7);sh.lineTo(-3.85,1.3);sh.lineTo(-4.1,0);sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:3.1,bevelEnabled:true,bevelThickness:.24,bevelSize:.22,bevelSegments:2,steps:1,curveSegments:14}),gp=g.getAttribute('position');for(let i=0;i<gp.count;i++){const x=gp.getX(i),y=gp.getY(i),z=gp.getZ(i);gp.setXYZ(i,x+.14*Math.sin(y*1.7+x*.7)+.07*Math.cos(x*4+y*2),y+.13*Math.sin(x*1.2)+.08*Math.sin(x*3+y*.4),z);}g.computeVertexNormals();const u=g.getAttribute('uv');for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)/9,u.getY(i)/8);const mat=new T.MeshStandardMaterial({color:0xb67c5b,map:pbr.rockColor||strataTexture,normalMap:pbr.rockNormal||null,normalScale:new T.Vector2(.7,.7),roughnessMap:pbr.rockRoughness||null,roughness:.98});mesh(g,mat,91,ground(91)-.4,-16.2);}
    // Wind has banked sand against the cliffs. These are shaped dune ridges with ripple detail.
    const sandBanks=[];
    function dune(cx,z,w,h,d,material=mats.dunes){
      const nx=Math.min(220,Math.max(40,Math.ceil(w/.24))),nz=14,p=[],u=[],ix=[],colors=[],alpha=[],fade=material.userData.softEdge||(material.transparent&&material.vertexColors);
      for(let i=0;i<=nx;i++){const x=cx-w*.5+w*i/nx;for(let j=0;j<=nz;j++){const zz=z-d*.5+d*j/nz,uPos=i/nx,vPos=j/nz,crest=.62+.075*Math.cos(vPos*Math.PI*2)+.022*Math.sin(vPos*Math.PI*4+cx*.1),fx=uPos<crest?Math.sin(uPos/crest*Math.PI*.5):Math.pow(Math.max(0,1-(uPos-crest)/(1-crest)),1.25),fz=Math.sin(Math.PI*vPos),edge=Math.sin(Math.PI*uPos)*fz;
        const ripples=(Math.sin(x*8.5+Math.sin(zz*.7)*1.6+Math.sin(x*.19+zz*.4))*.018+Math.sin(x*17-zz*.2)*.005)*edge*(material===mats.dunes?1:.22),y=height(x,zz)+h*Math.pow(Math.max(0,fx),1.1)*Math.pow(fz,1.2)*Math.pow(Math.max(0,Math.sin(Math.PI*i/nx)),.12)+ripples;p.push(x,y,zz);u.push(x/3.2,zz/3.2);if(fade){const a=smooth(i/nx/.06)*smooth((1-i/nx)/.06)*smooth(j/nz/.10)*smooth((1-j/nz)/.10);colors.push(1,1,1,a);alpha.push(a);}
        if(i<nx&&j<nz){const a=i*(nz+1)+j,b=a+nz+1;ix.push(a,a+1,b,b,a+1,b+1);}
      }}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));if(fade)g.setAttribute('color',new T.Float32BufferAttribute(colors,4));g.setIndex(ix);g.computeVertexNormals();const surface=fade?softSurface(g,ix,alpha,material):mesh(g,material,0,0,0,root,false);if(material===mats.dunes)sandBanks.push({surface,x0:cx-w*.5,x1:cx+w*.5,z0:z-d*.5,z1:z+d*.5});
    }
    dune(147,-10,42,2.8,12);dune(189,-11.8,58,2.9,13);dune(224,-10,37,2.2,12);dune(170,-22,65,4.5,15);dune(220,-28,70,5.5,18);
    for(let i=0;i<10;i++){let x=range(-10,240);dune(x,range(5,8),range(9,24),range(.2,.6),range(3,5));}
    // Instruments and dust columns must touch the visible dune skin. Sample the
    // actual triangles once while placing them; movement physics uses the main path.
    const sandRay=new T.Raycaster(),sandProbe=v(0,0,0),down=v(0,-1,0),sandHits=[];
    function sandFloor(x,z) {
      let y=height(x,z);
      for(const bank of sandBanks)if(x>=bank.x0&&x<=bank.x1&&z>=bank.z0&&z<=bank.z1){
        sandRay.set(sandProbe.set(x,45,z),down);sandHits.length=0;sandRay.intersectObject(bank.surface,false,sandHits);
        if(sandHits.length)y=Math.max(y,sandHits[0].point.y);
      }
      return y;
    }
    // A bounded scatter of angular local stones. Instancing keeps the entire world inexpensive.
    function addStonePatches(source,name){
      // The shadow pass and the camera can both skip distant stones. Patches
      // share the geometry and material, retaining every original pose and tint.
      const cells=new Map(),pose=new T.Matrix4(),tint=new T.Color();
      for(let i=0;i<source.count;i++){
        source.getMatrixAt(i,pose);
        const cell=Math.floor(pose.elements[12]/48);
        if(!cells.has(cell))cells.set(cell,[]);
        cells.get(cell).push(i);
      }
      for(const [cell,indices] of cells){
        const patch=new T.InstancedMesh(source.geometry,source.material,indices.length);
        patch.name=name+' · '+cell;
        for(let j=0;j<indices.length;j++){
          source.getMatrixAt(indices[j],pose);patch.setMatrixAt(j,pose);
          if(source.instanceColor){source.getColorAt(indices[j],tint);patch.setColorAt(j,tint);}
        }
        patch.castShadow=source.castShadow;patch.receiveShadow=source.receiveShadow;
        patch.computeBoundingSphere();root.add(patch);
      }
    }


    const stoneGeom=T.BufferGeometryUtils&&T.BufferGeometryUtils.mergeVertices?T.BufferGeometryUtils.mergeVertices(new T.IcosahedronGeometry(1,1)):new T.IcosahedronGeometry(1,1);const stonePos=stoneGeom.getAttribute('position');for(let i=0;i<stonePos.count;i++){const x=stonePos.getX(i),y=stonePos.getY(i),z=stonePos.getZ(i),f=.86+.11*Math.sin(x*5.3+y*3.7+z*7.1)+.06*Math.sin(x*11.9-z*9.3+y*4.1),flat=y<-.35?.55:1;stonePos.setXYZ(i,x*f,Math.max(-.5,y*.82*f*flat),z*f);}stoneGeom.computeVertexNormals();
    const stones=new T.InstancedMesh(stoneGeom,new T.MeshStandardMaterial({color:0xffffff,map:pbr.rockColor||null,normalMap:pbr.rockNormal||null,normalScale:new T.Vector2(.5,.5),roughness:.96,flatShading:true}),330),dummy=new T.Object3D(),stoneColor=new T.Color();
    for(let i=0;i<330;i++){let x=range(-18,450),z=range(-12,8);if(Math.abs(z)<2.6)z=z<0?-range(2.7,6):range(3.5,7);if(z>0&&z<(i%13===0?6.5:4.5))z=range(i%13===0?6.5:4.5,8);if(x>248&&x<348){stoneColor.setHex(rand()<.5?0x83afbf:0xb0d0d5);}else{stoneColor.setHex(rand()<.25?0x6d5550:rand()<.5?0xa4684f:0xc38a65);}const s=range(.12,.8),big=i%13===0?1.8:1;dummy.position.set(x,height(x,z)+s*.28,z);dummy.rotation.set(range(-.2,.2),range(0,6.28),range(-.18,.18));dummy.scale.set(s*range(1.2,2)*big,s*range(.35,.8)*big,s*range(.8,1.3)*big);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);stones.setColorAt(i,stoneColor);}
    stones.castShadow=true;stones.receiveShadow=true;addStonePatches(stones,'Mars kayaları');
    // Low sediment slabs give the near ground a natural scale.
    const slabPatches=new Map();
    for(let i=0;i<30;i++){let x=range(30,240),z=range(-6,-3.6),cell=Math.floor(x/36);if(!slabPatches.has(cell)){const g=new T.Group();g.name='Sediment slabs · '+cell;root.add(g);slabPatches.set(cell,g);}const slab=box(range(.8,2.8),range(.12,.27),range(.6,1.3),mats.sand,x,height(x,z)+.05,z,slabPatches.get(cell));slab.rotation.y=range(-.4,.4);slab.rotation.z=range(-.09,.09);}
    for(const patch of slabPatches.values())batchStation(patch);
    // Balloon bellows retain their four familiar caps. Elsewhere only deliberate lookouts rise above the route.
    const platforms=[];
    function hopLedge(x,offset,w,i){
      const y=ground(x)+offset,d=2.6,n=24,outline=[],p=[],c=[],uv=[],ix=[];
      for(let j=0;j<n;j++){const a=j/n*Math.PI*2,f=.965+.025*Math.sin(j*2.7+i*1.3);const power=i<4?.24:.54, edge=i<4?1:1+.043*Math.sin(2*a+i)+.028*Math.sin(3*a+.7);outline.push([Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),power)*.5*f*1.07*edge,Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),power)*.5*f]);}
      const rings=[{y:ground(x)-.13,s:1.10,z:-1.95},{y:ground(x)+(y-ground(x))*.31,s:1.01,z:-1.80},{y:ground(x)+(y-ground(x))*.74,s:.98,z:-1.62},{y:y-.17,s:1.01,z:-1.45},{y:y,s:1,z:-.72}];
      const dark=new T.Color(0xaf795a),light=new T.Color(0xc59772),color=new T.Color();
      rings.forEach((r,k)=>{outline.forEach((q,j)=>{const chipped=k===4?0:Math.sin(j*3.6+i+k*1.7)*.035;const xx=x+q[0]*w*(r.s+chipped),zz=r.z+q[1]*d*(r.s+chipped);p.push(xx,r.y,zz);color.copy(dark).lerp(light,.25+k*.12+Math.sin(j*2.1+i)*.08);c.push(color.r,color.g,color.b);uv.push(j/n*2.4,(r.y-ground(x))/2.7);if(k<rings.length-1){const a=k*n+j,b=k*n+(j+1)%n;ix.push(a,a+n,b,b,a+n,b+n);}});});
      const ci=p.length/3,top=new T.Color(0xd0a47f);p.push(x,y,-.72);c.push(top.r,top.g,top.b);uv.push(x/2.7,-.72/2.7);outline.forEach(q=>{const xx=x+q[0]*w,zz=-.72+q[1]*d;p.push(xx,y,zz);c.push(top.r,top.g,top.b);uv.push(xx/2.7,zz/2.7);});for(let j=0;j<n;j++)ix.push(ci,ci+1+(j+1)%n,ci+1+j);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const ledge=mesh(g,mats.rock,0,0,0);ledge.name='Natural hop ledge '+x;
      platforms.push({x,y,w:w*.86,d});
    }
    [[40,.8,3.5],[44,1.55,3.3],[48,2.1,3.8],[52,1.2,3.5],[102,1.02,6.6]].forEach((p,i)=>hopLedge(...p,i));
    const edgeStones=new T.InstancedMesh(stoneGeom,new T.MeshStandardMaterial({color:0xc9936b,roughness:.98}),130);
    for(let i=0;i<130;i++){const x=range(29,251),z=(i%2?1:-1)*range(1.75,2.15),r=range(.035,.105);dummy.position.set(x,height(x,z)+r*.15,z);dummy.rotation.set(0,range(0,6.28),0);dummy.scale.set(r*1.7,r*.65,r);dummy.updateMatrix();edgeStones.setMatrixAt(i,dummy.matrix);}edgeStones.receiveShadow=true;addStonePatches(edgeStones,'Yol çakılları');
    // Starting camp: a small research habitat, landing vehicle, solar farm and warm route lamps.
    let campCloth,campClothRest;
    function camp(){
      const g=new T.Group();g.position.set(13,height(13,-6.5),-6.5);root.add(g);
      groundPlinth(g,2.4,.32);cylinder(2.4,2.4,.08,mats.metal,0,.36,0,g,32);const hab=cylinder(2.15,2.15,2.7,mats.cream,0,1.68,0,g,32);sphere(2.15,mats.cream,0,3.0,0,g,28,16).scale.y=.42;
      cylinder(2.18,2.18,.12,mats.teal,0,2.5,0,g,32);roundedPanel(1.25,1.96,.18,.12,mats.dark,0,1.43,2.11,g);roundedPanel(1.06,1.73,.14,.08,mats.teal,0,1.43,2.23,g);mesh(new T.CircleGeometry(.235,24),mats.window,0,1.76,2.345,g);mesh(new T.TorusGeometry(.265,.032,6,28),mats.rail,0,1.76,2.36,g);sphere(.055,mats.rail,.33,1.22,2.35,g,10,6);
      for(let i=-1;i<=1;i+=2){const win=box(.84,.55,.12,mats.dark,i*1.42,2.02,1.7,g);win.rotation.y=i*.55;const glow=box(.69,.4,.13,mats.window,i*1.42,2.02,1.76,g);glow.rotation.y=i*.55;}
      for(let i=-1;i<=1;i+=2){beam(v(i*1.6,.35,-1.4),v(i*2.5,-.1,-2.2),.09,mats.metal,g);beam(v(i*1.6,.35,1.4),v(i*2.5,-.1,2.2),.09,mats.metal,g);}
      [.55,1.3,2.82].forEach(y=>{const ring=mesh(new T.TorusGeometry(2.17,.018,6,40),mats.metal,0,y,0,g);ring.rotation.x=Math.PI*.5;});
      cylinder(.38,.4,.26,mats.metal,.55,3.93,-.3,g,20);cylinder(.29,.3,.12,mats.cream,.55,4.11,-.3,g,20);cylinder(.023,.028,.9,mats.metal,-.6,4.16,-.25,g,8);sphere(.05,mats.orange,-.6,4.62,-.25,g,10,6);
      groundStairs(g,2.65,3.85,1.18,3,.40);
      const flag=new T.Group();flag.position.set(-5,0,2);g.add(flag);cylinder(.04,.05,3.5,mats.cream,0,1.7,0,flag,8);
      const expeditionPatch=canvasTexture(256,136,(c,w,h)=>{
        c.fillStyle='#d36b40';c.fillRect(0,0,w,h);c.fillStyle='#a85237';c.beginPath();c.moveTo(0,h);c.quadraticCurveTo(87,79,164,98);c.quadraticCurveTo(218,115,w,77);c.lineTo(w,h);c.fill();
        c.strokeStyle='#ffd39a';c.lineWidth=2;c.setLineDash([7,4]);c.strokeRect(6,6,w-12,h-12);c.setLineDash([]);
        c.fillStyle='#305f69';c.beginPath();c.arc(105,63,39,0,Math.PI*2);c.fill();
        c.strokeStyle='#ffdda7';c.lineWidth=5;c.beginPath();c.ellipse(105,64,58,13,-.36,0,Math.PI*2);c.stroke();
        c.fillStyle='#ffefc8';c.beginPath();for(let i=0;i<8;i++){const a=-Math.PI*.5+i*Math.PI/4,r=i%2?5:16;c.lineTo(162+Math.cos(a)*r,39+Math.sin(a)*r);}c.closePath();c.fill();
        c.fillStyle='#c2764e';c.fillRect(0,0,12,h);
      });
      const flagGeo=new T.PlaneGeometry(1.54,.82,12,3);flagGeo.translate(.77,0,0);campClothRest=flagGeo.attributes.position.array.slice();
      campCloth=mesh(flagGeo,new T.MeshStandardMaterial({map:expeditionPatch,side:T.DoubleSide,roughness:1}),0,3,0,flag);
      campCloth.name='İki kaşifin dalgalanan kamp bayrağı';
      for(let i=0;i<3;i++){
        const panel=new T.Group(),px=6+i*3.5,pz=-.8;panel.position.set(px,height(13+px,-6.5+pz)-g.position.y,pz);g.add(panel);cylinder(.24,.28,.08,mats.metal,0,.04,0,panel,12);cylinder(.06,.08,1.14,mats.metal,0,.61,0,panel,8);
        const head=new T.Group();head.position.y=1.18;head.rotation.z=-.22;panel.add(head);box(2.8,.08,1.8,mats.solar,0,0,0,head);
        const frame=[[-1.42,.055,0,.045,.06,1.88],[1.42,.055,0,.045,.06,1.88],[0,.055,-.92,2.88,.06,.045],[0,.055,.92,2.88,.06,.045]];for(let k=-2;k<=2;k++)frame.push([k*.46,.047,0,.014,.012,1.78]);for(let k=-1;k<=1;k++)frame.push([0,.047,k*.44,2.77,.012,.014]);bars(frame,mats.rail,head);
      }
      const feed=new T.CatmullRomCurve3([v(1.85,.1,-.25),v(3.2,.055,-.65),v(4.8,.045,-.75),v(6.0,.06,-.8)]);mesh(new T.TubeGeometry(feed,24,.035,6,false),mats.dark,0,0,0,g);
      const fasteners=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2;fasteners.push([Math.cos(a)*2.21,.5,Math.sin(a)*2.21,.055,.055,.055]);}bars(fasteners,mats.rail,g);
      // A compact reusable lander has engines, four splayed legs and a glazed cockpit.
      const ship=new T.Group();ship.position.set(-12,height(1,-7.3)-g.position.y,-.8);g.add(ship);cylinder(1.15,1.4,3.4,mats.cream,0,3,0,ship,20);const nose=sphere(1.15,mats.cream,0,4.65,0,ship,24,12);nose.scale.y=.8;cylinder(1.42,1.28,.38,mats.orange,0,1.55,0,ship,20);cylinder(.66,.82,.8,mats.dark,0,.85,0,ship,16);const glass=box(1.2,.65,.18,mats.dark,0,4.0,1.02,ship);glass.rotation.x=-.2;box(1.0,.4,.2,mats.solar,0,4.06,1.11,ship).rotation.x=-.2;
      [-1,1].forEach(s=>{const side=box(.48,.6,.13,mats.solar,s*.76,4.03,.83,ship);side.rotation.y=s*.58;side.rotation.x=-.18;box(.06,.65,.16,mats.cream,s*.48,4.02,1.1,ship).rotation.x=-.18;});
      const ladder=new T.Group();ladder.position.set(0,.2,1.62);ladder.rotation.x=-.16;ship.add(ladder);[-.32,.32].forEach(x=>cylinder(.027,.027,1.9,mats.metal,x,1,0,ladder,8));for(let k=0;k<6;k++){const rung=cylinder(.024,.024,.67,mats.metal,0,.25+k*.29,0,ladder,8);rung.rotation.z=Math.PI*.5;}
      cylinder(1.17,1.17,.05,mats.teal,0,3.32,0,ship,24);
      for(let i=0;i<3;i++){const ring=mesh(new T.TorusGeometry(1.17+i*.055,.014,5,28),mats.rail,0,2.25+i*.6,0,ship);ring.rotation.x=Math.PI*.5;}
      for(let i=0;i<4;i++){const a=i*Math.PI*.5+Math.PI*.25,x=Math.cos(a)*.83,z=Math.sin(a)*.83;cylinder(.22,.31,.37,mats.dark,x,1.15,z,ship,12);cylinder(.31,.32,.08,mats.rail,x,.96,z,ship,12);}
      for(let i=0;i<4;i++){let a=i*Math.PI*.5+Math.PI*.25;const b=v(Math.cos(a)*2,.12,Math.sin(a)*2),a0=v(Math.cos(a)*1.05,2,Math.sin(a)*1.05);beam(a0,b,.09,mats.metal,ship);cylinder(.45,.5,.12,mats.metal,b.x,b.y,b.z,ship,12);}
      const cargo=[[3.0,.36,2.35],[4.05,.36,2.45],[4.0,1.02,2.45]],straps=[];cargo.forEach((p,i)=>{p[1]+=height(13+p[0],-6.5+p[2])-g.position.y;roundedPanel(.87,.65,.065,.72,i===1?mats.orange:mats.teal,p[0],p[1],p[2]-.36,g);straps.push([p[0]-.27,p[1],p[2],.07,.75,.83],[p[0]+.27,p[1],p[2],.07,.75,.83],[p[0],p[1]+.36,p[2],.96,.05,.84],[p[0],p[1]-.02,p[2]+.42,.22,.22,.03],[p[0],p[1]+.24,p[2]+.42,.34,.045,.05]);mesh(new T.CircleGeometry(.085,16),i===1?mats.teal:mats.orange,p[0],p[1]-.02,p[2]+.44,g);});bars(straps,mats.rail,g);
      batchStation(g,campCloth);
    }
    camp();
    // Quiet field instruments give the wind valley the character of a working expedition.
    const weatherRotors=[];
    [148,220].forEach((x,i)=>{
      const g=new T.Group();g.position.set(x,sandFloor(x,-6),-6);root.add(g);
      cylinder(.42,.55,.22,mats.metal,0,.1,0,g,12);cylinder(.055,.08,2.6,mats.cream,0,1.4,0,g,10);
      box(.5,.72,.28,mats.cream,0,1.05,.05,g);box(.35,.35,.04,mats.teal,0,1.15,.21,g);
      const rotor=new T.Group();rotor.position.y=2.72;g.add(rotor);weatherRotors.push(rotor);
      for(let j=0;j<3;j++){const a=j*Math.PI*2/3;beam(v(0,0,0),v(Math.cos(a)*.46,0,Math.sin(a)*.46),.018,mats.metal,rotor);const cup=sphere(.12,mats.dark,Math.cos(a)*.48,.02,Math.sin(a)*.48,rotor,10,6);cup.scale.y=.55;}
      sphere(.09,mats.orange,0,2.74,0,g,12,8);
      const panel=box(1.05,.05,.76,mats.solar,-.78,.8,0,g);panel.rotation.z=.35;beam(v(-.78,.1,0),v(-.78,.76,0),.035,mats.metal,g);
      const cablePath=[];
      for(let k=0;k<=12;k++){const u=k/12,xx=u*2.65,zz=.12+Math.sin(u*Math.PI*.79)*.58;
        cablePath.push(v(xx,sandFloor(x+xx,-6+zz)-g.position.y+.029+(k===0?.075:0),zz));}
      const cable=new T.CatmullRomCurve3(cablePath);mesh(new T.TubeGeometry(cable,20,.025,5,false),mats.dark,0,0,0,g);
    });
    const beacons=[];
    for(let x=32;x<500;x+=23){if(x>254&&x<346)continue;const z=-2.8,y=height(x,z);cylinder(.045,.06,1.35,mats.metal,x,y+.67,z,root,8);cylinder(.14,.12,.22,mats.warmGlow,x,y+1.38,z,root,12);const cap=sphere(.17,mats.cream,x,y+1.55,z,root,12,6);cap.scale.y=.3;}
    // A deep, cool grotto behind the route. Its irregular rock arch frames the open walking line.
    const caveLightXs=[252,274,296,321,345],caveLightPool=[];
    function cave(){
      function scatterIce(mat){mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nfloat iceRim=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);reflectedLight.indirectDiffuse+=vec3(.014,.068,.095)*(.2+.8*iceRim);');};mat.customProgramCacheKey=()=> 'mars-ice-scatter-v2';return mat;}
      const glacierMat=scatterIce(new T.MeshStandardMaterial({color:0xffffff,map:pbr.iceFrostColor||pbr.iceColor||iceTexture,normalMap:pbr.iceNormal||null,normalScale:new T.Vector2(.18,.18),roughnessMap:pbr.iceRoughness||null,roughness:.94,metalness:.03,emissive:0x0b2c3e,emissiveIntensity:.18,vertexColors:true,side:T.DoubleSide}));
      const deep=new T.Color(0x2b6984),pale=new T.Color(0xb1e5eb),color=new T.Color();
      const wallH=x=>19+Math.sin(x*.12)*.9+Math.sin(x*.43)*.4,wallZ=(x,f)=>-12+Math.sin(x*.17+f*.9)*1.3+Math.sin(x*.59+f*1.7)*.35+Math.sin(x*1.31-f*4)*.22+Math.sin(f*Math.PI)*1.6;
      const chambers=[{x:272,y:3.8,rx:4.8,ry:3.8,depth:17,bend:-2.5},{x:309,y:4.3,rx:6.4,ry:4.4,depth:21,bend:3}];
      const mouthShape=(q,a)=>1+.085*Math.sin(a*3+q.x*.14)+.045*Math.sin(a*5+q.x*.31)+.025*Math.sin(a*11+q.x*.17);
      const vaultY=x=>6.05+Math.sin(x*.18)*.46+Math.sin(x*.57)*.2+(1-smooth((x-244)/14))*2+smooth((x-338)/14)*1.8;
      // Fluted glacier faces have actual relief, pale sediment bands and a deeper blue core.
      const p=[],co=[],uv=[],ix=[],nx=144,ny=26;
      for(let i=0;i<=nx;i++){const x=244+i*108/nx,H=wallH(x);
        for(let j=0;j<=ny;j++){const f=j/ny,y=ground(x)-.4+f*H,z=wallZ(x,f);
          p.push(x,y,z);color.copy(deep).lerp(pale,clamp(.28+f*.29+Math.sin(x*.13+f*3)*.09+Math.sin(x*.57-f*5)*.05,0,1));co.push(color.r,color.g,color.b);uv.push(x/7.5,y/7.5);
          if(i<nx&&j<ny){const cx=x+.375,cy=y+H/ny*.5,inChamber=chambers.some(q=>{const dx=(cx-q.x)/q.rx,dy=(cy-q.y)/q.ry,r=mouthShape(q,Math.atan2(dy,dx));return(dx*dx+dy*dy)/(r*r)<1.04;});if(!inChamber){const a=i*(ny+1)+j,b=a+ny+1;ix.push(a,b,a+1,a+1,b,b+1);}}
        }
      }
      let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(co,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(g,glacierMat,0,0,0);
      // These openings lead into real three-dimensional side chambers, with thick ice rims and curved tunnels.
      const flowMat=scatterIce(new T.MeshStandardMaterial({color:0x8dcddf,map:pbr.iceFrostColor||pbr.iceColor||iceTexture,normalMap:pbr.iceNormal||null,normalScale:new T.Vector2(.20,.20),roughness:.64,metalness:.03,emissive:0x123e52,emissiveIntensity:.17}));
      const columns=new T.InstancedMesh(new T.CylinderGeometry(.27,.64,1,12,8),flowMat,6),colPose=new T.Object3D(),bubbles=[];
      chambers.forEach((q,qi)=>{
        const rp=[],rc=[],ru=[],ri=[],n=64,m=10;
        for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;for(let j=0;j<=m;j++){const t=j/m*Math.PI*2,r=(1.03+(.18+.045*Math.sin(a*3+q.x)) *Math.cos(t))*mouthShape(q,a),px=q.x+q.rx*r*Math.cos(a),py=q.y+q.ry*r*Math.sin(a),f=clamp((py-ground(px)+.4)/wallH(px),0,1),pz=wallZ(px,f)+.35+Math.sin(t)*.75;rp.push(px,py,pz);color.copy(deep).lerp(pale,.59+.18*Math.sin(t)+.08*Math.sin(a*3+qi));rc.push(color.r,color.g,color.b);ru.push(i/n*5,j/m);if(i<n&&j<m){const a0=i*(m+1)+j,b0=a0+m+1;ri.push(a0,a0+1,b0,b0,a0+1,b0+1);}}}
        let cg=new T.BufferGeometry();cg.setAttribute('position',new T.Float32BufferAttribute(rp,3));cg.setAttribute('color',new T.Float32BufferAttribute(rc,3));cg.setAttribute('uv',new T.Float32BufferAttribute(ru,2));cg.setIndex(ri);cg.computeVertexNormals();mesh(cg,glacierMat,0,0,0);
        const tp=[],tc=[],tu=[],ti=[],segments=16,front=wallZ(q.x,clamp((q.y-ground(q.x)+.4)/wallH(q.x),0,1));
        for(let j=0;j<=segments;j++){const f=j/segments,centerX=q.x+q.bend*smooth(f),centerY=q.y-f*.6,baseScale=(1-.2*f);for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,scale=(1.03-(.18+.045*Math.sin(a*3+q.x)))*baseScale,noise=mouthShape(q,a)*(1+.018*Math.sin(a*5+f*7)*Math.sin(Math.PI*f)),px=centerX+Math.cos(a)*q.rx*scale*noise,py=centerY+Math.sin(a)*q.ry*scale*noise,mouth=wallZ(px,clamp((py-ground(px)+.4)/wallH(px),0,1))+.35,pz=mix(mouth,front-q.depth,smooth(f))+.10*Math.sin(a*3+f*8)*Math.sin(Math.PI*f);tp.push(px,py,pz);color.copy(deep).lerp(pale,.56-f*.31+Math.sin(a*2+f*4)*.07);tc.push(color.r,color.g,color.b);tu.push(i/n*5,f*q.depth/6);if(j<segments&&i<n){const a0=j*(n+1)+i,b0=a0+n+1;ti.push(a0,a0+1,b0,b0,a0+1,b0+1);}}}
        cg=new T.BufferGeometry();cg.setAttribute('position',new T.Float32BufferAttribute(tp,3));cg.setAttribute('color',new T.Float32BufferAttribute(tc,3));cg.setAttribute('uv',new T.Float32BufferAttribute(tu,2));cg.setIndex(ti);cg.computeVertexNormals();mesh(cg,glacierMat,0,0,0);
        const endMat=scatterIce(new T.MeshStandardMaterial({color:0x3a7b9c,map:pbr.iceFrostColor||pbr.iceColor||iceTexture,normalMap:pbr.iceNormal||null,normalScale:new T.Vector2(.3,.3),roughness:.44,emissive:0x174e68,emissiveIntensity:.3,side:T.BackSide}));const end=sphere(1,endMat,q.x+q.bend,q.y-.6,front-q.depth-1,root,32,20);end.scale.set(q.rx*.91,q.ry*.91,1.8);end.castShadow=false;
        // A broken, attached ice shoulder interrupts the mouth instead of leaving a perfect circular tube.
        const brokenG=new T.IcosahedronGeometry(1,1),bp=brokenG.getAttribute('position');for(let k=0;k<bp.count;k++){const x=bp.getX(k),y=bp.getY(k),z=bp.getZ(k),f=.96+.07*Math.sin(x*7+y*5+z*11);bp.setXYZ(k,clamp(x,-.73,.88)*f,y*f,z*(.88+.06*Math.sin(y*7)));}brokenG.computeVertexNormals();const sign=qi?1:-1,bx=q.x+sign*q.rx*.66,by=q.y+q.ry*.52,bz=wallZ(bx,clamp((by-ground(bx)+.4)/wallH(bx),0,1))+.35,broken=mesh(brokenG,flowMat,bx,by,bz);broken.scale.set(qi?2.15:1.65,qi?2.2:2.65,1.2);broken.rotation.z=sign*.36;
        for(let k=0;k<3;k++){const h=1.7+Math.sin(k*2+qi)*.6+qi*.5;colPose.position.set(q.x+q.bend*.65+(k-1)*q.rx*.28,.55+h*.5,front-q.depth*.68+(k%2)*1.4);colPose.scale.set(.85,h,.85);colPose.rotation.set(0,k*.8,Math.sin(k+qi)*.08);colPose.updateMatrix();columns.setMatrixAt(qi*3+k,colPose.matrix);}
        for(let k=0;k<28;k++)bubbles.push(q.x+q.bend*.4+range(-q.rx*.5,q.rx*.5),range(1,6),front-range(3,q.depth*.8));
      });columns.castShadow=false;columns.receiveShadow=true;root.add(columns);const bubbleG=new T.BufferGeometry();bubbleG.setAttribute('position',new T.Float32BufferAttribute(bubbles,3));root.add(new T.Points(bubbleG,new T.PointsMaterial({color:0xb2edf4,size:.045,transparent:true,opacity:.48,depthWrite:false})));
      // A low scalloped vault stays visible above the actors, framing the entire skating trail.
      const rp=[],rc=[],ru=[],ri=[],nz=12;
      for(let i=0;i<=nx;i++){const x=244+i*108/nx;
        for(let j=0;j<=nz;j++){const f=j/nz,z=-3.6-f*7.2,y=vaultY(x)+3.35*smooth(f)-Math.sin(x*.57)*.2*f+Math.sin(f*11+x*.08)*.1;
          rp.push(x,y,z);color.copy(deep).lerp(pale,.32+(1-f)*.35+Math.sin(x*.31+f*16)*.1);rc.push(color.r,color.g,color.b);ru.push(x/16,f*1.5);
          if(i<nx&&j<nz){const a=i*(nz+1)+j,b=a+nz+1;ri.push(a,a+1,b,b,a+1,b+1);}
        }
      }
      g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(rp,3));g.setAttribute('color',new T.Float32BufferAttribute(rc,3));g.setAttribute('uv',new T.Float32BufferAttribute(ru,2));g.setIndex(ri);g.computeVertexNormals();mesh(g,glacierMat,0,0,0);
      const frost=scatterIce(new T.MeshStandardMaterial({color:0xb4e4ec,map:pbr.iceFrostColor||pbr.iceColor||iceTexture,normalMap:pbr.iceNormal||null,normalScale:new T.Vector2(.25,.25),roughness:.3,metalness:.06}));
      const frostBlue=scatterIce(new T.MeshStandardMaterial({color:0x85bed6,map:pbr.iceFrostColor||pbr.iceColor||iceTexture,normalMap:pbr.iceNormal||null,normalScale:new T.Vector2(.25,.25),roughness:.37,metalness:.05}));
      const veinMat=new T.LineBasicMaterial({color:0xcaf6f2,transparent:true,opacity:.52});
      // Broad hanging ice curtains give this grotto a glacial structure beyond small crystals.
      [250,263,278,293,309,326,342,350].forEach((x,i)=>{
        const w=range(3.0,5.2),h=range(1.8,2.7),y=vaultY(x),cp=[],cc=[],cu=[],ci=[],sx=24,sy=6;
        for(let j=0;j<=sx;j++){const u=j/sx,xx=x+(u-.5)*w,hang=h*(.30+.38*Math.pow(Math.sin(Math.PI*u),.55)+.2*Math.pow(Math.max(0,Math.sin(u*9+i)),4));
          for(let k=0;k<=sy;k++){const v=k/sy,yy=vaultY(xx)+.25-v*hang,zz=-4.1+Math.sin(u*17+i)*.16+v*.22;cp.push(xx,yy,zz);color.copy(deep).lerp(pale,.55+v*.25+Math.sin(u*17+i)*.1);cc.push(color.r,color.g,color.b);cu.push(u*1.7,v);if(j<sx&&k<sy){const a=j*(sy+1)+k,b=a+sy+1;ci.push(a,a+1,b,b,a+1,b+1);}}
        }
        const frontCount=cp.length/3,frontIndices=ci.slice();for(let k=0;k<frontCount;k++){cp.push(cp[k*3],cp[k*3+1],cp[k*3+2]-.36);cc.push(cc[k*3]*.84,cc[k*3+1]*.84,cc[k*3+2]*.84);cu.push(cu[k*2],cu[k*2+1]);}for(let k=0;k<frontIndices.length;k+=3)ci.push(frontIndices[k]+frontCount,frontIndices[k+2]+frontCount,frontIndices[k+1]+frontCount);const border=[];for(let j=0;j<=sx;j++)border.push(j*(sy+1));for(let k=1;k<=sy;k++)border.push(sx*(sy+1)+k);for(let j=sx-1;j>=0;j--)border.push(j*(sy+1)+sy);for(let k=sy-1;k>0;k--)border.push(k);for(let k=0;k<border.length;k++){const a=border[k],b=border[(k+1)%border.length];ci.push(a,b,a+frontCount,b,b+frontCount,a+frontCount);}
        const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(cp,3));geom.setAttribute('color',new T.Float32BufferAttribute(cc,3));geom.setAttribute('uv',new T.Float32BufferAttribute(cu,2));geom.setIndex(ci);geom.computeVertexNormals();mesh(geom,glacierMat,0,0,0);
        const vp=[];for(let k=0;k<4;k++){const u=.14+k*.22,a=x+(u-.5)*w,z=-3.84+Math.sin(u*17+i)*.16;vp.push(v(a,y-.15,z),v(a+.05,y-h*.35,z),v(a+.05,y-h*.35,z),v(a+.16,y-h*.61,z));}const vg=new T.BufferGeometry().setFromPoints(vp);root.add(new T.LineSegments(vg,veinMat));
      });
      // Nearby icicles share a draw. Each group retains its own culling bounds.
      for(let start=0;start<56;start+=8){
        const cluster=new T.Group();root.add(cluster);
        for(let i=start;i<start+8;i++){
          const x=246+i*1.9,y=vaultY(x),h=range(.3,1.35);
          const o=cylinder(range(.07,.17),.018,h,i%3?frost:frostBlue,x,y-h*.5,-3.85,cluster,7);
          o.rotation.z=range(-.12,.12);
        }
        batchStation(cluster);
      }
      // Low banks of wind-packed frost curve around the clear central ice channel.
      const bank=new T.MeshStandardMaterial({color:0x9bc4d0,map:pbr.iceFrostColor||iceTexture,normalMap:pbr.iceNormal||null,normalScale:new T.Vector2(.08,.08),roughness:.86,metalness:.02,transparent:true,opacity:.95,depthWrite:false,vertexColors:true});
      bank.userData.softEdge=true;for(let i=0;i<10;i++){const x=250+i*10.4;dune(x,5.0,range(12,17),range(.35,.7),6.6,bank);}
      for(let i=0;i<9;i++){const x=range(249,349),z=range(-8.5,-5.2),h=range(.5,1.6);const ice=crystal(x,ground(x),z,range(.25,.6),h,i%2?mats.blueIce:mats.paleIce);ice.rotation.z=range(-.2,.2);}
      for(let i=0;i<3;i++){const l=new T.PointLight(i%2?0x8ce2ee:0x69b9e9,38,25,2);l.position.set(caveLightXs[i],3.7,-5);scene.add(l);caveLightPool.push(l);}
      // Fine frozen seams in the glacier and the route read as ice, not loose blue rocks.
      const wallVeins=[];for(let i=0;i<45;i++){let x=range(246,350),y=range(.4,8.2);const z=-9.1+Math.sin(x*.32)*.5;for(let j=0;j<4;j++){const nx=x+range(-.55,.55),ny=y+range(.3,.8);wallVeins.push(x,y,z,nx,ny,z+.02);x=nx;y=ny;}}g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(wallVeins,3));root.add(new T.LineSegments(g,new T.LineBasicMaterial({color:0xa1dbe6,transparent:true,opacity:.08})));
      const crackMat=new T.LineBasicMaterial({color:0xd2f8f5,transparent:true,opacity:.25}),cp=[];for(let i=0;i<48;i++){let x=range(253,343),z=range(-1.8,1.8);for(let j=0;j<3;j++){let xx=x+range(.4,1.2),zz=z+range(-.5,.5);cp.push(x,ground(x)+.045,z,xx,ground(xx)+.045,zz);x=xx;z=zz;}}g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(cp,3));root.add(new T.LineSegments(g,crackMat));
    }
    function crystal(x,y,z,r,h,material){const n=6,p=[],ix=[];for(let k=0;k<2;k++)for(let j=0;j<n;j++){const a=j/n*Math.PI*2;const rr=r*(k?.76:1);p.push(Math.cos(a)*rr,k?h*.72:0,Math.sin(a)*rr);}p.push(r*.13,h,r*.06);for(let j=0;j<n;j++){const a=j,b=(j+1)%n;ix.push(a,a+n,b,b,a+n,b+n,a+n,n*2,b+n);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return mesh(g,material,x,y,z);}
    cave();
    // The homeward route opens onto a wind observatory above two asymmetric ledges.
    // All scenery sits behind the safe walking lane; only the visible flat boulder caps collide.
    [[365.8,.72,4.35],[371,1.35,5.2]].forEach((p,i)=>hopLedge(...p,i+20));
    mesa(367,-19,12,8.5,9,41);mesa(411,-24,16,11,10,43);mesa(451,-22,13,9.4,8,45);mesa(487,-38,22,8.5,12,46);
    {const shape=new T.Shape();shape.moveTo(-12,-.8);shape.lineTo(-11.1,2.7);shape.lineTo(-9.8,5.7);shape.bezierCurveTo(-7.9,7.3,-5.1,7.4,-1.1,7.05);shape.bezierCurveTo(3.1,6.8,8.2,8.15,10.25,5.9);shape.lineTo(12,-.8);shape.lineTo(7.8,-.8);shape.lineTo(7,2.7);shape.bezierCurveTo(5.8,5.65,2.2,5.15,-.6,5.2);shape.bezierCurveTo(-3.7,5.3,-6.1,5.35,-7.2,2.9);shape.lineTo(-7.9,-.8);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:3.8,bevelEnabled:true,bevelSize:.24,bevelThickness:.20,bevelSegments:2,curveSegments:16,steps:1}),p=g.getAttribute('position'),uv=g.getAttribute('uv'),c=[];const shade=new T.Color();for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,x+.10*Math.sin(y*2.1+x*.9),y+.09*Math.sin(x*1.8)+.045*Math.cos(x*4.7+z),z);shade.setHex(0xbd8d69).lerp(new T.Color(0x977358),.13+.08*Math.sin(y*2+x));c.push(shade.r,shade.g,shade.b);uv.setXY(i,uv.getX(i)/4.2,uv.getY(i)/4.2);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();const bridge=mesh(g,mats.rock,391,ground(391)-.45,-12.8);bridge.name='Wind-carved stone bridge';}
    // Rounded dark lava stones are collected into small gardens rather than a uniform scatter.
    const routeRock=mats.rock.clone();routeRock.vertexColors=false;routeRock.color.setHex(0xffffff);
    const routeStone=new T.InstancedMesh(stoneGeom,routeRock,162),routePose=new T.Object3D(),routeTint=new T.Color();
    for(let i=0;i<162;i++){const cluster=Math.floor(i/18),cx=[357,362,380,397,407,416,437,450,460][cluster],x=cx+range(-3.4,3.4),z=i%3===0?range(4.7,7.6):range(-6.8,-2.9),r=range(.08,.57),big=i%18===0?2.4:1;routePose.position.set(x,height(x,z)+r*.17,z);routePose.rotation.set(range(-.17,.17),range(0,6.28),range(-.12,.12));routePose.scale.set(r*big*range(1.25,2),r*big*range(.5,.9),r*big);routePose.updateMatrix();routeStone.setMatrixAt(i,routePose.matrix);routeTint.setHex(i%4===0?0x5f5c60:i%3===0?0x9f795c:0xc69a72);routeStone.setColorAt(i,routeTint);}routeStone.castShadow=routeStone.receiveShadow=true;addStonePatches(routeStone,'Geçit kayaları');
    const newEdges=new T.InstancedMesh(stoneGeom,mats.sand,112);for(let i=0;i<112;i++){const x=351+i*.98,z=(i%2?1:-1)*(1.8+.20*Math.sin(x*.7)),r=.035+rand()*.07;routePose.position.set(x,height(x,z)+.015,z);routePose.rotation.set(0,rand()*6.28,0);routePose.scale.set(r*1.9,r*.4,r);routePose.updateMatrix();newEdges.setMatrixAt(i,routePose.matrix);}newEdges.receiveShadow=true;addStonePatches(newEdges,'Geçit çakılları');
    // A balanced boulder and a tiny solar-powered weather vane reward looking around.
    {const balanceRock=routeRock.clone();balanceRock.color.setHex(0xb68d6b);const x=447,z=-5.2,y=height(x,z),base=mesh(stoneGeom,balanceRock,x,y+.62,z);base.scale.set(1.9,1.15,1.6);base.rotation.z=-.12;const perched=mesh(stoneGeom,balanceRock,x-.21,y+1.87,z-.15);perched.scale.set(2.35,1.05,1.55);perched.rotation.z=.16;}
    const routeVane=new T.Group();routeVane.position.set(411,height(411,-3.9),-3.9);root.add(routeVane);cylinder(.055,.095,1.7,mats.metal,0,.85,0,routeVane,8);const routeRotor=new T.Group();routeRotor.position.y=1.72;routeVane.add(routeRotor);bars([[0,0,0,.07,.07,1.25],[0,0,-.6,.42,.25,.045]],mats.teal,routeRotor);sphere(.11,mats.warmGlow,0,0,.69,routeRotor,10,6);box(.65,.04,.46,mats.solar,0,.45,.3,routeVane).rotation.x=.3;
    // The finale is a small research observatory with a real open dome slit and telescope.
    // Wind-carved caprocks behind the specimen table. Their narrow necks and
    // wide sloping caps share one layered, opaque surface for the whole landmark.
    {
      const pos=[],normColors=[],uv=[],index=[],sides=18;
      const stoneShades=[0x8c604b,0xaa7756,0xc08a65,0xad7557,0x916650,0xb28160,0x946848,0x76544c,0xc88b62,0xb78062,0x986e57];
      const outline=[[0,.96],[.10,.83],[.22,.64],[.36,.59],[.51,.46],[.60,.51],[.70,.36],[.74,.34],[.77,1.10],[.89,1.19],[1,.76]];
      const tint=new T.Color();
      for(const [cx,cz,h,r,lean] of [[421.2,-12.4,5.35,1.96,.72],[411.7,-13.1,3.75,1.26,-.48],[423.7,-14.1,2.08,1.48,-.09]]){
        const first=pos.length/3,base=height(cx,cz)-.45;
        for(let k=0;k<outline.length;k++){
          const [u,extent]=outline[k];
          for(let j=0;j<=sides;j++){
            const a=2*Math.PI*j/sides;
            const shape=1+.12*Math.sin(a*3+cx)+.07*Math.cos(a*5+cz);
            const x=cx+lean*u+Math.cos(a)*r*extent*shape,z=cz+Math.sin(a)*r*extent*shape*.72;
            const y=base+h*u+Math.cos(a+.32)*u*.22+.05*Math.cos(a*4+cx)*Math.sin(u*Math.PI);
            pos.push(x,y,z);tint.setHex(stoneShades[k]).multiplyScalar(.97+.1*Math.cos(a*2+u*4));
            normColors.push(tint.r,tint.g,tint.b);uv.push(j/sides*r*1.7,u*h*.44);
            if(k+1<outline.length&&j<sides){const v=first+k*(sides+1)+j;index.push(v,v+sides+1,v+1,v+1,v+sides+1,v+sides+2);}
          }
        }
        const top=pos.length/3;pos.push(cx+lean,base+h+.10,cz);
        tint.setHex(0xcc9370);normColors.push(tint.r,tint.g,tint.b);uv.push(.5,1);
        for(let j=0;j<sides;j++)index.push(top-1-sides+j,top,top-sides+j);
      }
      const g=new T.BufferGeometry();g.setIndex(index);
      g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
      g.setAttribute('color',new T.Float32BufferAttribute(normColors,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
      const buttes=mesh(g,mats.rock,0,0,0);buttes.name='Dengede duran katmanlı kayalar';
    }


    const observatory=new T.Group();observatory.position.set(477,height(477,-7.8),-7.8);root.add(observatory);
    groundPlinth(observatory,4.8,.375);cylinder(3.35,3.55,1.9,mats.cream,0,1.25,0,observatory,48);cylinder(3.6,3.6,.18,mats.teal,0,2.23,0,observatory,48);
    const dome=new T.Mesh(new T.SphereGeometry(3.5,48,20,.18,Math.PI*2-.48,0,Math.PI*.5),mats.cream);dome.position.y=2.3;dome.rotation.y=.5;dome.castShadow=true;observatory.add(dome);
    const slit=new T.Mesh(new T.SphereGeometry(3.4,32,20,0,Math.PI*2,0,Math.PI*.5),new T.MeshStandardMaterial({color:0x182735,roughness:.95,side:T.BackSide}));slit.position.y=2.3;observatory.add(slit);
    cylinder(.38,.65,1.9,mats.metal,0,2.3,0,observatory);const telescope=new T.Group();telescope.position.set(-1.6,3.4,.6);telescope.rotation.x=.8;telescope.rotation.z=.55;observatory.add(telescope);cylinder(.52,.52,2.8,mats.cream,0,0,0,telescope,24);cylinder(.59,.59,.25,mats.teal,0,1.4,0,telescope,24);cylinder(.45,.45,.06,mats.solar,0,1.55,0,telescope,24);
    roundedPanel(1.34,1.78,.16,.12,mats.dark,0,1.22,3.36,observatory);roundedPanel(1.13,1.57,.12,.09,mats.teal,0,1.22,3.49,observatory);mesh(new T.CircleGeometry(.21,24),mats.window,0,1.52,3.61,observatory);mesh(new T.TorusGeometry(.24,.03,6,28),mats.rail,0,1.52,3.63,observatory);groundStairs(observatory,3.85,5.65,1.6,4,.375);
    [-1,1].forEach(side=>{const w=new T.Group();w.position.set(side*2.08,1.38,2.92);w.rotation.y=side*.55;observatory.add(w);roundedPanel(.79,.56,.11,.07,mats.dark,0,0,0,w);roundedPanel(.61,.38,.08,.025,mats.window,0,0,.08,w);});
    const ribs=[];for(let i=0;i<8;i++){const phi=.23+i*(Math.PI*2-.50)/8;let previous=null;for(let j=0;j<=20;j++){const theta=.13+j*(Math.PI*.5-.13)/20,r=3.51,x=-r*Math.cos(phi)*Math.sin(theta),z=r*Math.sin(phi)*Math.sin(theta),point=[x*Math.cos(.5)+z*Math.sin(.5),2.3+r*Math.cos(theta),-x*Math.sin(.5)+z*Math.cos(.5)];if(previous)ribs.push(previous.concat(point));previous=point;}}tubeBatch(ribs,.012,mats.rail,observatory);
    const obsBolts=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2;obsBolts.push([Math.cos(a)*3.52,.46,Math.sin(a)*3.52,.055,.055,.055]);}bars(obsBolts,mats.rail,observatory);
    const bench=new T.Group();bench.position.set(6.15,height(483.15,-5.7)-observatory.position.y,2.1);observatory.add(bench);roundedPanel(2.1,.25,.1,.72,mats.teal,0,.7,-.36,bench);roundedPanel(2.1,.48,.1,.16,mats.cream,0,1.02,-.3,bench);bars([[-.77,.33,-.23,.09,.66,.1],[.77,.33,-.23,.09,.66,.1],[-.77,.33,.27,.09,.66,.1],[.77,.33,.27,.09,.66,.1]],mats.metal,bench);
    // Dish, sensor mast and a grounded cable connect the observatory to the expedition.
    const dishG=new T.Group();dishG.position.set(7,height(484,-8.8)-observatory.position.y,-1);observatory.add(dishG);cylinder(.12,.18,2.8,mats.metal,0,1.4,0,dishG);const dish=new T.Mesh(new T.SphereGeometry(1.35,24,12,0,Math.PI*2,Math.PI*.62,Math.PI*.38),new T.MeshStandardMaterial({color:0xc2c9c7,metalness:.45,roughness:.44,side:T.DoubleSide}));dish.rotation.z=-.6;dish.rotation.x=-.4;dish.position.set(0,3,0);dishG.add(dish);beam(v(0,2.9,0),v(-.7,3.9,.5),.035,mats.metal,dishG);sphere(.09,mats.teal,-.7,3.9,.5,dishG,10,6);
    batchStation(observatory);
    // Atmosphere: a finite, seeded dust field. The foreground stays clear enough to read faces.
    const particleCount=145, positions=new Float32Array(particleCount*3), drift=new Float32Array(particleCount*2);
    for(let i=0;i<particleCount;i++){
      positions.set([range(-20,450),range(.5,9),range(-14,-3)],i*3);
      drift.set([i,range(.2,.7)],i*2);
    }
    const dustGeo=new T.BufferGeometry(), dustTime={value:0};
    dustGeo.setAttribute('position',new T.BufferAttribute(positions,3));
    dustGeo.setAttribute('drift',new T.BufferAttribute(drift,2));
    dustGeo.computeBoundingSphere(); dustGeo.boundingSphere.radius+=10;
    const dustMat=new T.PointsMaterial({color:0xefd1b7,size:.065,transparent:true,opacity:.44,depthWrite:false});
    dustMat.onBeforeCompile=shader=>{
      shader.uniforms.dustTime=dustTime;
      shader.vertexShader='uniform float dustTime; attribute vec2 drift;\n'+shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\ntransformed.x += sin(dustTime*.10+drift.x)*1.3+mod(dustTime*drift.y,8.);\ntransformed.y += sin(dustTime*.43+drift.x*1.7)*.18;');
    };
    const dust=new T.Points(dustGeo,dustMat); root.add(dust);
    // The high plateau arrives at blue hour, with a small, calm star field over the observatory.
    const starP=[];for(let i=0;i<76;i++)starP.push(range(410,550),range(1,32),range(-160,-85));const starG=new T.BufferGeometry();starG.setAttribute('position',new T.Float32BufferAttribute(starP,3));const starMat=new T.PointsMaterial({color:0xffefd7,size:.15,transparent:true,opacity:0,depthWrite:false,fog:false});const skyStars=new T.Points(starG,starMat);root.add(skyStars);
    const planetTexture=canvasTexture(128,64,(c,w,h)=>{c.fillStyle='#477b9b';c.fillRect(0,0,w,h);c.fillStyle='#719287';c.beginPath();c.moveTo(8,20);c.lineTo(29,9);c.lineTo(45,20);c.lineTo(31,38);c.lineTo(17,32);c.closePath();c.fill();c.beginPath();c.moveTo(74,16);c.lineTo(102,15);c.lineTo(111,29);c.lineTo(94,36);c.lineTo(89,53);c.lineTo(78,39);c.closePath();c.fill();c.strokeStyle='rgba(241,249,248,.75)';c.lineWidth=4;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-10,8+i*12);c.bezierCurveTo(30,18+i*10,70,-2+i*13,140,10+i*12);c.stroke();}});
    const earthMat=new T.MeshBasicMaterial({color:0xd5e6ef,map:planetTexture,transparent:true,opacity:0,fog:false});const earth=sphere(.58,earthMat,490,13,-100,root,24,16);earth.castShadow=earth.receiveShadow=false;
    // Cache fixed local transforms once. Rotating vane subtrees stay live;
    // cloth still deforms its vertex buffers every frame.
    // Weather is added afterwards and retains its own moving transforms.
    // Calm far decor: one slow wind turbine behind the camp and two softly blinking beacon lamps (no touch, no shadows).
    const noHit=()=>{},beaconMat=new T.MeshBasicMaterial({color:0x5a2a1c,fog:false}),beaconOn=new T.Color(0xffb04a),beaconOff=new T.Color(0x5a2a1c);
    const farTurbine=new T.Group();farTurbine.position.set(-4,height(-4,-58)-.4,-58);farTurbine.scale.setScalar(.62);root.add(farTurbine);
    const tw=[cylinder(.16,.34,8.4,mats.cream,0,4.2,0,farTurbine,10),box(.5,.42,1.1,mats.cream,0,8.55,-.2,farTurbine),sphere(.12,beaconMat,0,8.86,-.4,farTurbine,8,6)];
    const turbineRotor=new T.Group();turbineRotor.position.set(0,8.55,.42);farTurbine.add(turbineRotor);tw.push(sphere(.22,mats.cream,0,0,0,turbineRotor,12,8));
    const bladeGeo=new T.BoxGeometry(.2,3.2,.05);bladeGeo.translate(0,1.7,0);
    for(let i=0;i<3;i++){const bl=mesh(bladeGeo,mats.cream,0,0,0,turbineRotor,false);bl.rotation.z=i*Math.PI*2/3;tw.push(bl);}
    const campBeacon=sphere(.075,beaconMat,12.4,height(13,-6.5)+4.66,-6.75,root,10,6);tw.push(campBeacon);
    tw.forEach(o=>{o.castShadow=false;o.receiveShadow=false;o.raycast=noHit;});
    root.updateWorldMatrix(true,true);
    const animatedParts=new Set([campCloth,routeRotor,turbineRotor,...weatherRotors]);
    function cacheSceneryTransform(o,parentMoves){
      const moves=parentMoves||animatedParts.has(o);
      if(!moves)o.matrixAutoUpdate=false;
      for(const child of o.children)cacheSceneryTransform(child,moves);
    }
    cacheSceneryTransform(root,false);
    const weatherScene=M.createMarsWeather({root,ground,height,sandFloor}),weather=weatherScene.state,restingExplorer={x:8,grounded:true,vy:0};
    const copperFog=new T.Color(0xc78e76), copperDome=new T.Color(0x5f6583), copperHorizon=new T.Color(0xd89673), copperSun=new T.Color(0xffc18e), afterglow=new T.Color(0xf8d2a4);
    let rotorTime=0;
    const atmosphere={sun,hemi,fill};
    const lightOffset=new T.Vector3(-28,42,29), shadowNormal=lightOffset.clone().normalize();
    const shadowRight=new T.Vector3(0,1,0).cross(shadowNormal).normalize();
    const shadowUp=new T.Vector3().crossVectors(shadowNormal,shadowRight);
    const shadowCamera=sun.shadow.camera;
    const texelX=(shadowCamera.right-shadowCamera.left)/shadowSize;
    const texelY=(shadowCamera.top-shadowCamera.bottom)/shadowSize;
    const warmFog=new T.Color(0xd1a297),coolFog=new T.Color(0x3d6e85),warmSky=new T.Color(0xc2d0e4),coolSky=new T.Color(0xaed6e8),warmSun=new T.Color(0xffdfb6),coolSun=new T.Color(0xa5c9e2),sunsetSun=new T.Color(0xffc38f),duskFog=new T.Color(0x978f9f),skyTop=new T.Color(0x3e4a7c),skyHorizon=new T.Color(0xe6b0a3),skyLow=new T.Color(0xc48771),duskTop=new T.Color(0x1e2d4d),duskHorizon=new T.Color(0x6b7d99),duskLow=new T.Color(0xb18f91),warmDust=new T.Color(0xefd1b7),coldDust=new T.Color(0xc0edf1);
    function update(dt,t,state){
      const playerX=state?.player?.x ?? 8, lightStart=playerX<286.5?0:playerX<309.5?1:2;
      // Keep a constant light count throughout the cave. Outside the reach of the
      // fixtures, the rest of Mars uses a program without the three per-pixel lights.
      const lightsInRange=playerX>=199 && playerX<=399;
      for(let i=0;i<caveLightPool.length;i++){
        const fixture=lightStart+i,light=caveLightPool[i];
        light.visible=lightsInRange;
        if (lightsInRange){light.position.x=caveLightXs[fixture];light.color.setHex(fixture%2?0x8ce2ee:0x69b9e9);}
      }
      weatherScene.update(dt,state?.player||restingExplorer);
      // The explorers turn to watch the dust wall, brace through the gust and cheer when it has passed.
      {const P=state?.player,D=state?.dog,storm=weather.storm||0;
        if(storm>.6)stormBig=true;else if(stormBig&&storm<.08){stormBig=false;stormCheer=1.6;}
        stormCheer=Math.max(0,stormCheer-dt);
        const gi=M.guide&&M.guide.state?M.guide.state():null,free=P&&D&&!P.locked&&!D.locked&&P.grounded&&Math.abs(P.vx)<.3&&!(gi&&gi.active);
        if(free&&storm>.35){P.emote='curious';P.lookX=-.75;P.lookY=.25;P.facing=-1;D.emote='sniff';D.lookX=-.5;D.lookY=-.4;}
        else if(free&&stormCheer>0){P.emote='happy';D.emote='happy';P.lookX=0;P.lookY=.3;}}
      // The shadow frustum follows the explorer; terrain itself is entirely static.
      const lightAim=sun.target.position.set(playerX+3,ground(playerX),-3);
      // Snap on the light plane so shadows on the ground stay still as we walk.
      const shadowX=lightAim.dot(shadowRight),shadowY=lightAim.dot(shadowUp);
      lightAim.addScaledVector(shadowRight,Math.round(shadowX/texelX)*texelX-shadowX);
      lightAim.addScaledVector(shadowUp,Math.round(shadowY/texelY)*texelY-shadowY);
      sun.position.copy(lightAim).add(lightOffset);sun.target.updateMatrixWorld();
      const inside=smooth((playerX-246)/12)*(1-smooth((playerX-339)/14)),dusk=smooth((playerX-445)/28);sun.intensity=mix(mix(3.1,1.8,dusk),1.5,inside);sun.color.copy(warmSun).lerp(sunsetSun,dusk).lerp(coolSun,inside);hemi.intensity=mix(mix(2.1,1.7,dusk),1.9,inside);hemi.color.copy(warmSky).lerp(coolSky,Math.max(inside,dusk*.3));fill.intensity=mix(mix(.8,1.0,dusk),1.5,inside);scene.fog.color.copy(warmFog).lerp(duskFog,dusk).lerp(coolFog,inside);skyMat.uniforms.top.value.copy(skyTop).lerp(duskTop,dusk);skyMat.uniforms.horizon.value.copy(skyHorizon).lerp(duskHorizon,dusk);skyMat.uniforms.low.value.copy(skyLow).lerp(duskLow,dusk);starMat.opacity=dusk*.72;if(magicSky){magicSky.setVisible(inside<.97);if(magicStars)magicStars.uniforms.uBright.value=1.2*(1-inside)*(.6+.55*dusk);magicSky.update(dt,M.camera);}earthMat.opacity=dusk*.72;skyStars.visible=earth.visible=dusk>.001;dust.material.color.copy(warmDust).lerp(coldDust,inside);
      // The same wind bends cloth, drives the sand and warms the distant light.
      // Retain broad fill on the two helmeted faces throughout the front.
      const haze=Math.min(1,weather.intensity*(.82+.3*(weather.storm||0))),clear=weather.clearing;
      if(playerX<30){
        // Physical folds are visible on both sides and in the cast shadow.
        const g=campCloth.geometry,p=g.attributes.position,n=g.attributes.normal,s=campClothRest,phase=weather.phase;
        const force=.21+haze*.58,rate=2.2+force*2.2;
        for(let i=0;i<p.count;i++){
          const xx=s[i*3],yy=s[i*3+1],u=xx/1.54,a=u*7.3-phase*rate+yy*.55,wave=Math.sin(a);
          p.setXYZ(i,xx,yy-u*u*(.17-force*.12)+wave*u*.039,u*wave*(.20+force*.1));
          const slope=(wave+u*7.3*Math.cos(a))*(.20+force*.1)/1.54,inv=1/Math.sqrt(1+slope*slope);
          n.setXYZ(i,-slope*inv,0,inv);
        }
        p.needsUpdate=n.needsUpdate=true;
      }
      sun.intensity*=1-.21*haze;sun.color.lerp(copperSun,haze*.36);
      scene.fog.color.lerp(copperFog,haze*.62);scene.fog.density=.010+haze*.0032+(weather.storm||0)*.0075;
      skyMat.uniforms.top.value.lerp(copperDome,haze*.79);skyMat.uniforms.horizon.value.lerp(copperHorizon,haze*.68).lerp(afterglow,clear*.42);
      dustTime.value=t;
      rotorTime=(rotorTime+dt*(1.0+weather.intensity*4.5))%(Math.PI*12);
      routeRotor.rotation.y=t*.48+rotorTime*.5;
      weatherRotors.forEach((o,i)=>{o.rotation.y=rotorTime*(1+i*.5);});
      turbineRotor.rotation.z=t*.35+rotorTime*.08;{const k=t%2.2;beaconMat.color.copy(beaconOff).lerp(beaconOn,k<.5?Math.sin(k/.5*Math.PI):0);}

    }
    return {length:500,finaleX:475,warmPositions:[8,35,70,95,118,154,182,198,220,241,263,274,282,296,303,319,327,341,349,366,390,416,451,475,495],ground,platforms,update,zone:x=>x<40?'kamp':x<125?'kanyon':x<246?'kumlar':x<350?'buz':x<445?'geçit':'bilim kampı',isIce:x=>x>=248&&x<=348,materials:mats,root,batchStation,atmosphere,weather,touchWeather:weatherScene.touch};
  };
})();
