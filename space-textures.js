(function(M){
 'use strict';
 // Ortak zemin dokusu yardımcısı (ATMOS). Kurulumda bir kez, kare başına değil:
 //   const tex=M.spaceTextures.ground({pattern:'craters',colors:['#b0603f','#7a3b28','#e0a27a'],size:512,seed:3});
 //   new THREE.MeshStandardMaterial({map:tex.map,normalMap:tex.normalMap});   // tex.map.repeat.set(4,1) vb.
 // Desenler: 'craters' (kraterli), 'cracks' (çatlaklı kuru zemin), 'ice' (buz: ince çatlak + kırağı),
 //           'dunes' (rüzgâr dalgacıkları), 'basalt' (bazalt sütun hücreleri), 'plain' (yalnız yumuşak gürültü).
 // Dokular kenarlardan döşenebilir (dikiş yok). Aynı ayarlar ikinci kez istenirse aynı doku döner.
 const T=THREE,cache=new Map();
 function seeded(seed){let s=(seed>>>0)||1;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 // Tileable value noise: one lattice per octave, wrapped at its period.
 function makeNoise(rnd,octaves,base){
  const layers=[];for(let o=0;o<octaves;o++){const p=base<<o,v=new Float32Array(p*p);for(let i=0;i<v.length;i++)v[i]=rnd();layers.push({p,v,amp:Math.pow(.5,o)});}
  const norm=layers.reduce((a,l)=>a+l.amp,0);
  return(u,v)=>{let sum=0;for(const l of layers){const x=u*l.p,y=v*l.p,xi=Math.floor(x),yi=Math.floor(y);let fx=x-xi,fy=y-yi;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
   const p=l.p,x0=((xi%p)+p)%p,y0=((yi%p)+p)%p,x1=(x0+1)%p,y1=(y0+1)%p,a=l.v[y0*p+x0],b=l.v[y0*p+x1],c=l.v[y1*p+x0],d=l.v[y1*p+x1];
   sum+=(a+(b-a)*fx+(c-a+(a-b-c+d)*fx)*fy)*l.amp;}return sum/norm;};
 }
 // Wrapped jittered-grid cells: returns [F1, F2-F1, cell id] in cell units.
 function makeCells(rnd,n){
  const pts=new Float32Array(n*n*2),ids=new Float32Array(n*n);for(let i=0;i<n*n;i++){pts[i*2]=rnd();pts[i*2+1]=rnd();ids[i]=rnd();}
  const out=[0,0,0];
  return(u,v)=>{const x=u*n,y=v*n,xi=Math.floor(x),yi=Math.floor(y);let f1=9,f2=9,id=0;
   for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=xi+i,cy=yi+j,k=(((cy%n)+n)%n)*n+(((cx%n)+n)%n);const dx=cx+pts[k*2]-x,dy=cy+pts[k*2+1]-y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<f1){f2=f1;f1=d;id=ids[k];}else if(d<f2)f2=d;}
   out[0]=f1;out[1]=f2-f1;out[2]=id;return out;};
 }
 const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
 function ground(o){
  o=Object.assign({pattern:'craters',colors:['#a0603f','#6e3a26','#d9a07a'],size:512,seed:1,scale:1,normalStrength:2.2,contrast:1,craters:22},o||{});
  const key=JSON.stringify(o);if(cache.has(key))return cache.get(key);
  const S=Math.min(1024,o.size|0),rnd=seeded(o.seed*977+13),noise=makeNoise(rnd,5,Math.max(2,Math.round(4*o.scale))),detail=makeNoise(rnd,3,Math.max(4,Math.round(24*o.scale)));
  const cells=makeCells(rnd,Math.max(3,Math.round((o.pattern==='basalt'?9:o.pattern==='ice'?5:7)*o.scale)));
  const craters=[];if(o.pattern==='craters')for(let i=0;i<o.craters;i++){const r=rnd();craters.push([rnd(),rnd(),.015+r*r*r*.09]);}
  const H=new Float32Array(S*S),tint=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
   const u=x/S,v=y/S,n=noise(u,v),d=detail(u,v);let h=n*.7+d*.3,t=n;
   if(o.pattern==='craters'){for(const c of craters){let dx=Math.abs(u-c[0]),dy=Math.abs(v-c[1]);dx=Math.min(dx,1-dx);dy=Math.min(dy,1-dy);const r=Math.sqrt(dx*dx+dy*dy)/c[2];
     if(r<1.6){h+=(r<1?(r*r-1)*.35:0)+.22*Math.exp(-(r-1)*(r-1)*18);t+=r<.9?-.12:0;}}}
   else if(o.pattern==='cracks'){const c=cells(u+n*.04,v+n*.04);const line=1-sm(0,.06,c[1]);h-=line*.35;t-=line*.45;t+=(c[2]-.5)*.12;}
   else if(o.pattern==='ice'){const c=cells(u+n*.06,v+n*.06);const line=1-sm(0,.03,c[1]);h-=line*.18;t+=line*.35+(d>.72?.25:0);}
   else if(o.pattern==='dunes'){const w=Math.sin((v*12+n*2.2+u*2)*Math.PI*2);h=n*.5+.25*(w*.5+.5)*(.6+.4*d);t=n+.12*w;}
   else if(o.pattern==='basalt'){const c=cells(u,v);const edge=1-sm(0,.08,c[1]);h=.55+c[2]*.25-edge*.4+d*.12;t=c[2]*.5+n*.5-edge*.3;}
   H[y*S+x]=h;tint[y*S+x]=t;
  }
  const cs=o.colors.map(c=>new T.Color(c)),[base,dark,light]=[cs[0],cs[1]||cs[0],cs[2]||cs[0]];
  const mc=document.createElement('canvas');mc.width=mc.height=S;const mg=mc.getContext('2d'),mi=mg.createImageData(S,S),md=mi.data;
  const nc=document.createElement('canvas');nc.width=nc.height=S;const ng=nc.getContext('2d'),ni=ng.createImageData(S,S),nd=ni.data;
  const tmp=new T.Color();
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
   const i=y*S+x,t=(tint[i]-.5)*o.contrast+.5;
   if(t<.5)tmp.copy(dark).lerp(base,sm(0,.5,t));else tmp.copy(base).lerp(light,sm(.5,1,t));
   tmp.convertLinearToSRGB();md[i*4]=tmp.r*255;md[i*4+1]=tmp.g*255;md[i*4+2]=tmp.b*255;md[i*4+3]=255;
   const l=H[y*S+((x+S-1)%S)],r=H[y*S+((x+1)%S)],u2=H[((y+S-1)%S)*S+x],d2=H[((y+1)%S)*S+x];
   let nx=(l-r)*o.normalStrength*S/128,ny=(d2-u2)*o.normalStrength*S/128,nz=1;const k=1/Math.sqrt(nx*nx+ny*ny+1);
   nd[i*4]=(nx*k*.5+.5)*255;nd[i*4+1]=(ny*k*.5+.5)*255;nd[i*4+2]=(nz*k*.5+.5)*255;nd[i*4+3]=255;
  }
  mg.putImageData(mi,0,0);ng.putImageData(ni,0,0);
  const prep=(c,srgb)=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};
  const result={map:prep(mc,true),normalMap:prep(nc,false),dispose(){result.map.dispose();result.normalMap.dispose();cache.delete(key);}};
  cache.set(key,result);return result;
 }
 M.spaceTextures={ground};
})(window.MARS);
