/* Feza and Bilbo's ring observatory. The deck floats beside the rings;
   the amber world in the sky has no walkable ground. */
(function (M) {
  'use strict';
  const T = THREE, TAU = Math.PI * 2;
  const length = 300, harpX = 63, dockX = 155, eyeX = 287, eclipseX = 242, nurseryX = 263;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = t => t * t * (3 - 2 * t);
  function hill(x,center,radius){return ease(clamp(1-Math.abs(x-center)/radius,0,1));}
  function terrain(x) {
    return .22*Math.sin(x*.055)+.13*Math.sin(x*.17)+1.08*hill(x,18,8)-.72*hill(x,48,7)+1.38*hill(x,70,10)-.85*hill(x,107,9)+1.14*hill(x,118,7)+1.25*hill(x,181,12)-.65*hill(x,207,10)+.92*hill(x,227,10)+.78*hill(x,270,12);
  }
  const plazas=[[harpX,5.0],[137,3.7],[dockX,4.9],[eclipseX,3.1],[nurseryX,5.0],[eyeX-1.1,7.0]];
  function ground(x){
    let h=terrain(x);
    for(const plaza of plazas){
      const amount=1-ease(clamp((Math.abs(x-plaza[0])-plaza[1])/3.3,0,1));
      if(amount>0)h+=(terrain(plaza[0])-h)*amount;
    }
    return h;
  }
  function seeded() {
    let n = 0x3fe538a1;
    return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
  }
  function glow(color) { return new T.MeshBasicMaterial({color}); }
  function metal(color, roughness = .48, metalness = .25) {
    return new T.MeshStandardMaterial({color, roughness, metalness});
  }
  function group(parent, x = 0, y = 0, z = 0) {
    const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g;
  }
  function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
    const obj = new T.Mesh(geometry, material); obj.position.set(x,y,z); parent.add(obj); return obj;
  }
  function sky(scene) {
    const panorama=new T.TextureLoader().load(M.saturnMaps.vista);
    panorama.colorSpace=T.SRGBColorSpace;scene.background=panorama;
    return panorama;
  }
  function putPlanet(parent) {
    const root=group(parent),axis=group(root);axis.rotation.z=.22;
    const loader=new T.TextureLoader();
    const atlas=loader.load(M.saturnMaps.body),ringAtlas=loader.load(M.saturnMaps.rings);
    atlas.colorSpace=ringAtlas.colorSpace=T.SRGBColorSpace;atlas.wrapS=T.RepeatWrapping;
    const bodyShader=new T.ShaderMaterial({
      uniforms:{atlas:{value:atlas},ringProfile:{value:ringAtlas}},
      vertexShader:'varying vec3 n;varying vec3 pos;varying vec2 surfaceUV;void main(){n=normalize(normalMatrix*normal);pos=position;surfaceUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec3 n;varying vec3 pos;varying vec2 surfaceUV;uniform sampler2D atlas,ringProfile;
      void main(){
        vec3 v=normalize(n);vec3 albedo=texture2D(atlas,surfaceUV+vec2(.078,0.)).rgb;
        // Richer butterscotch belts: a little more colour and band contrast.
        float lum=dot(albedo,vec3(.299,.587,.114));
        albedo=max(mix(vec3(lum),albedo,1.55)*(.84+.30*smoothstep(.30,.92,lum))*vec3(1.04,.99,.9),0.);
        vec3 light=normalize(vec3(-.71,.35,.65));float diffuse=max(0.,dot(v,light));
        vec3 p=pos*vec3(1.,.91,1.);vec3 sun=normalize(vec3(-.67,.34,.71));
        float t=-p.y/sun.y;float r=length((p+sun*t).xz);
        float shadow=(t>0.&&r>15.65&&r<32.18)?texture2D(ringProfile,vec2((r-15.65)/16.53,.5)).a:0.;
        float limb=pow(1.-max(0.,v.z),3.9);
        vec3 lit=albedo*(.125+1.28*diffuse*(1.-.62*shadow));
        lit+=vec3(.015,.022,.05)*(1.-diffuse)+limb*mix(vec3(.07,.10,.2),vec3(.27,.21,.13),diffuse);
        lit+=albedo*vec3(.32,.14,.02)*diffuse*(1.-diffuse)*(1.-.62*shadow);
        gl_FragColor=vec4(lit,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
    });
    // The sphere and annuli share one equatorial axis. Their real depth
    // cleanly occludes the far half of the rings behind Saturn.
    const planet=mesh(axis,new T.SphereGeometry(14,72,48),bodyShader);
    planet.scale.y=.91;planet.rotation.x=.28;
    const ringMaterial=new T.ShaderMaterial({
      uniforms:{map:{value:ringAtlas}},side:T.DoubleSide,forceSinglePass:true,transparent:true,depthWrite:false,
      vertexShader:'varying vec2 xy;void main(){xy=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 xy;uniform sampler2D map;void main(){
        float r=length(xy);vec4 icy=texture2D(map,vec2(clamp((r-15.65)/16.53,0.,1.),.5));
        if(icy.a<.028)discard;
        vec3 sun=normalize(vec3(-.67,.34,.71)),p=vec3(xy.x,0.,-xy.y);
        float ray=-dot(p,sun);float dist=length(p+ray*sun);
        float eclipse=ray>0.?1.-smoothstep(12.4,14.7,dist):0.;
        // Fine ringlets and a warm-to-icy tint give the rings crisp detail.
        float lets=.86+.14*sin(r*23.)*sin(r*7.3+1.7);
        vec3 tint=mix(vec3(3.3,2.72,2.18),vec3(2.7,2.85,3.05),smoothstep(24.,31.,r));
        vec3 col=(icy.rgb*tint+vec3(.05,.045,.05))*lets;
        col*=1.-.82*eclipse;
        gl_FragColor=vec4(col,min(1.,icy.a*1.15));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
    });
    root.userData.atlas=atlas;
    const rings=mesh(axis,new T.RingGeometry(15.67,32.16,208),ringMaterial);
    rings.rotation.x=-1.28;
    // A soft golden haze just outside the globe (one small sprite, 128 px).
    const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=128;
    const hc=haloCanvas.getContext('2d'),haze=hc.createRadialGradient(64,64,0,64,64,64);
    haze.addColorStop(0,'rgba(255,214,160,0)');haze.addColorStop(.6,'rgba(255,214,160,0)');haze.addColorStop(.665,'rgba(255,218,168,.5)');
    haze.addColorStop(.78,'rgba(255,196,140,.17)');haze.addColorStop(1,'rgba(255,190,140,0)');hc.fillStyle=haze;hc.fillRect(0,0,128,128);
    const haloMap=new T.CanvasTexture(haloCanvas);haloMap.colorSpace=T.SRGBColorSpace;
    const halo=new T.Sprite(new T.SpriteMaterial({map:haloMap,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:.8}));
    halo.scale.set(42.5,42.5,1);halo.renderOrder=-1;root.add(halo);
    return root;
  }
  // Small local derivatives of the Mars pack's ambientCG Ice002 (CC0).
  const iceImages=['data:image/webp;base64,UklGRrgLAABXRUJQVlA4IKwLAAAwcwCdASoAAQABPpFCmkolo6IhqTQr2LASCWlm6aIdBBMPF2RvxO5kHXv3Y83/l7///zvTzs/8tfMp/+ejP32ZHoarO6Gz9QbC1JOCWgH6PPX7m/2bp1oVk2nH+rvqP3UaHmsAv5iI7vhxnpOBncpCNHZCVvbVmVp4P+Rl/YFsmJc8ktwQ+l2De6/bfE+vCR/Ztmj32vwDmomfG2brSTspDzdNkiZb1uhwzYD0nm9IDMYvFbaMMr+kLJ15y9iHwirNmeoo6SYuXll3IyNeJrWB6xhlT6dkKXdmD9zc9HNSkzdVE+CqcNhGUpcJK8pJHS8kIM4YXugAzjZKCr4XGya6GXRry3tm0HiLYQ0QH5oQkroHHuRUlMO/hzpSvoYh35DE3LzmrFa3B4ZPDrFst5ZMdhAmvPNY25oBsVWFHgzdGqt6fAcy5YTj2+r7QtPfW69yaW3nqBZ5l5CI3q5GzZBRPoP56qIrjW6HV5JnOSkDcrw5E9CeE2kV4dHCJ/HKSf97h0XoDM/Ykltt6n+hDoNvy+Y6XErqbLlxcgai7Xq9P3SXhjRCFDDB8KxBXneVQqVBaHb20s7s1AcojjO9QbxIDfgdHfMmpJNIYDi7wC9IwQysfl9nJ6XTYaXn515dcnoHGjWApdzG107h7xcGhWP9IaNxkxQjUIp/Ot3/gpPWNRHVrMkQU774px4Fw6gCSWZ7DQn4iy/jj1FC0CTT6iYZMoWHhVHljdtYBH9Y5oZdishFkkEd5ls0lvlqGqLl1/7/DWW7xrlhdMLqjLffK//055QsORwz7BpIv/XzHF7rHS2D/OvDQ6KqWVcu6A4wL8oyNGJX/89CdzrQstbGZA5Vh+2rnLDSyw/JhOR/VEiINhiml/Kdyffp9nQyC9d4UBCet0C6+8NEffsEKPEIqs1O20J7fT1Yld3T+7Zmrd+0Cn0qkX5uYayCN71px/pBc30dX5mrtv1q5tUmlwVITX0/HEgcvobTrpjLBIydQ5zrjdKRiFEz5+2yJvBMwFVc7se7xiPqqeJRrRnZ5mN5ZvgwXb33FZNvTcryufVyvShVGtP169atx7Vt2CvoXG+vu0PYmuKsj+bT6SdMMref/uMFToFa0BNvp3LI3isYal6CdsXx1VY12TU04sT1j9dweeh0gCn7BAZZraRTwtI8Rw5Y6Wha/rVzZ2Kgiy5klpbMNNgX+EpFrP6wCXHpNxep3SpQAld1FaVGqui6wREMRFNy/AAA/spLrVVWr1JYot/LllF9nOQt+3/sinVkT+UpWYuwboymXjgUEfvDc3nYcvbSWhPlbh+9jN/oxoLSlQMknk6DZhfnpmzbw49wd3tQnQrGAORbyiWRF1LfqEvdvipVspvMtN5h86vF33KODvn6Ve8iMvKmK++v2K/pV/jYJeo0BGTmsKegAehyqAgOgc0TSjK6ySkm3NZisxjqpkltDUUie8ax+xgkP2yJFEBJ42S2Kl0MR5SSR4hSg0QY92+BRl/YJ8YoTCIOC8CF3B9DKvKRr8v2IJEEeU/4oTEWYzZUkiO4ceQBD8aHqxNYo0tADFqWz30idOBTQU2O1j78LZIG04Hn38cafNQWPk45nsKOAEsW30FwlYfRWhxFQGhsajKVQqX+j88L3f3Xl7x6R5QTGCOUG+V24WgejD0Wa1hOiBayHXS8xesJbOeToJQ5dVq8A2npauMSJcmZDfqRIfhyr6Jiqod6txWu4opq+OOQK3Rd7YVIZfchX9IoDYH9c7ZnR5FRKyzqCNa94re+4mA8bwYOitQhv3yER/GFRMha3T6KOxaTljpVchdlETi+lajz9mpizaNTzyd9ziYAPRLvoVVihV8dHhmtmG4xKmqMvEMYs6QKuRp1AjzYfVKUlaHjJl3nV5jfEuDCDoy62Bo1gqWZH2K+DWX8qCvUmkMV9avGgCPte0s5ByJGIXPQQu/IRI/nqW+3vkg9foPHxztNAssztVGsm5uminkQ+gl+VWmROyv5qvOffkVyNvzB0a+vkuOjLDHop7o1/Vm8VNxwSgFtyIT2387G+Nv7zcu16mH6KZee0RhqGbPpxv9CPGxfmPE+DSXC1nlHn8tz3hd3BcTxNmXV7ZqA16xk6BSOGL96Fr0iXMfNFplnTpeRZjCvycj9pkiyAO+DgF/ZuNLukeIKAWfkkCRpK0Pyh4W7jQNJba6z1L9jtU2iHgoT/RV3PGhSBjI7rgXB52My/iWK8slY+v8CD/FQhkKv+5wpXg0RGPV1T2sEBXvB3R9RdIln4D1q+H8bcqJZVEpUcFd6jYV6FY587WprJ60w80iHQ2NHZnky8US5NWIgKJKVrqlU70+RqYTxtYK+UlSQTBKLn7dlaCPEu6F5e66JJ9xhK0Ldo3Ac1ZBz7mPkPSL19utP25izew9/KCs3G7N7574h26cKH+LDid14SB0QiJjvuPD2PSxjPshGc9bNZgHjBrmZDSwia+AsuzwcFiIDo262T72LxIUSkkZrEk2v/nBQRjWJxpJeyOfy8YoWP2EsaU1B2KIYn49N8ocvrOnZQ+C8WE2BeyUlNAJKVaRDzaBZGrAgYAAJANVpFij1tuv2i8TaKb1v/4JtosTZnjWCbwyKrmK+iQ9DoJGybS2Ms1I2IVC3fOA5lhZNCSsegYtQKnk48taVhmvqyO1MGp/iud49tnAbKteUeL+ExDBPkenx9UXXAnCsdYWt81a90H1/RVdSjXflM9wUKyOTOUR6SBheNhY9lUunao8glqL9kDRK6H4TvFn4tmFAFTdoqm4WmSqwSCyIhWLbMy5kLeiztwMfiZK4wtMjsQ32PijNKITV0s6S7ub8nomJTQVvX+ahYrkTuQSGe98QaKzWIy14n6DwOoBptiOAClYr8wWFgMCpB4dRpnfNM918phNp5OQLu3yj02JC5j9u0/PDDlO772wx8IWFGNYSjSes6+akiiws9bUbKah7UXdRluOxd8B6Dj4JttcPqbTruKd5BRG3mWgRgnCiiIaNzwMooy3t0oFgBDI6fqe5qfpK2mzcGZui0riUGTcnuFB4QRj+frvyRRb6E6waG4XJIkvWGkq1SaCTEIYJSJ6alDdLa4H8aJ84GbiAwKDS2dyg1QvDYYO5Jj1H+nahylS98CK9BkIHkcNzhdM1bOvWr/gT6chM9CNqew//HvvvmRmp7RDna1H2oNpp9FtXdtgI22d+rRAs7YhpnxzFXnZvfZXgSlNWvpkWcJ5jUeUDijbpUKYljmCxIyA7t0dPSbVmQf7L2ldZYwf76FACquPbjoRdXiKaqWi+O+IhuO10/rqOq55+dOpZ4SpxH5Rni1ZbSNWRGu05VvKEIUTavM57LifKagvFS5l3KLlX5ofSS2rIJFnnsTEcppcF1Bn65dKC7rqmcUseMlBr3PiMzj2HZb/nszOQDMgdGHFscTVRbbEgVoa6uLwT+jGOvruDszH6ip6JESquypw5W395YJMbAKWsyj+t7wQNzwenCk8ixfTUU1pZUFbDKPfYtLUsQMlMTpJ9kIM4oQ7F9+piJm48+RTHejSqFnmCno4WQUPeRuB2yYDH7cqGubZ3t49wxpEVDzLKicTwNoQLqJ7jfBGjfK6S7xF89WEbIlYCgOY4SbPn11t/4Ctn5Nxhjr02yhTD5IOYCdJG+XYohBfx+xYQeuPrgnC1Ie1O7pLNcCly7B9FpGUMCwifPq9cXTR7o5OTLyiicBtaqdYureyhZSSRx4DMqAszQ1afxKW4Hi1IB6K8bIprKeApv7sfeyOwSNAo/onjp+Oj2t+yuKUdNH26yPZ82MVrAG5QkLmmdFFXODB5n0ePat635cYLCohn3z2Vilt1bPvgx9EL/FDrAzDSkINNK02krPAq3ntcJ6RkU5ac9eGT58bSnrUA0oZFVCUVDsznTrPJhScHY3Vm40/uF/RnZ1U36YYSGiEPPHHfu87KVKHD3EcABf+ZZ/r5mX/dyY51jkKSl7jwn+ohgHV0/sIAAAA=','data:image/webp;base64,UklGRrQBAABXRUJQVlA4IKgBAABwFQCdASoAAQABPpFGnU0loyMioHVZALASCWluu8AOWPOzbBACgKKAIPWBZdmK1t+C8WM5Xw8iEjx9u1fcEhme5RT7R9iBIBTXLjGpMfL0+5UkSO3stWBEmBRRAqUooAg9VSTGrBsDA6NDhKfrE1LYG43U0ErxluyD1RfNUGMjeK03rAge/YzaYLd08ILbK1WbW8x9B8TPV2ZPfmBVfSmsCvW3zApofXuIvqr4vQMhzTqPTAAA/sjP//5Kf/n9/vK49/QfGTDJ3uuTegNoboEyiLaWo8L82A3nFNoSKJzGRSiP8AUx6FZcypUYy/FQtdYrOtVoJdL06SDJWLa4I8zBVeIZqaIXmlygYroZlkfprinvm1KCHgmnlyBuKnQ4TTbNQawKtEeCtcAKpxfND+nCIUjftOBLl8xTSwFTTZOcjldyJwPkOFGrX+m1kWo4Dy5rLDE9k/igjlZwIuDIFCHbwCVBPLXprLumWdN9QPQR/pGKo647yYIf8AQpVKfbOblbiksBB/Rm0snD3uzHmSQEPypf5xiz2UxzION7b7cbiqD2UNguQAAA'];
  function icyRockGeometry() {
    const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position,c=[];
    const cool=new T.Color(0x869cba),warm=new T.Color(0xe6e0cc),mix=new T.Color();
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const knurl=1+.14*Math.sin(x*6+z*4)*Math.sin(y*4-x)+.09*Math.sin(z*4+y);
      p.setXYZ(i,x*knurl,y*knurl,z*knurl);
      mix.copy(cool).lerp(warm,.52+.22*y+.15*Math.sin(x*5+y*9+z*3));
      c.push(mix.r,mix.g,mix.b);
    }
    g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();return g;
  }
  function deckTexture(rand) {
    const c=document.createElement('canvas');c.width=512;c.height=512;const p=c.getContext('2d');
    p.fillStyle='#8998a2';p.fillRect(0,0,512,512);
    p.fillStyle='#a6b1b4';p.beginPath();p.moveTo(13,15);p.lineTo(493,15);p.lineTo(501,25);p.lineTo(501,485);p.lineTo(487,499);p.lineTo(20,499);p.lineTo(11,488);p.closePath();p.fill();
    for(let i=0;i<16000;i++){p.fillStyle=i%2?'rgba(244,245,233,.10)':'rgba(36,58,74,.08)';p.fillRect(rand()*510,rand()*510,1+rand()*3,1);}
    for(const y of [33,477]){
      p.fillStyle='#72828b';p.fillRect(18,y,477,2);
      for(const x of [24,485]){p.fillStyle='#526873';p.beginPath();p.arc(x,y+4,4.4,0,TAU);p.fill();p.fillStyle='#b6c2be';p.fillRect(x-2,y+3.4,4,1);}
    }
    p.fillStyle='#728591';p.fillRect(22,63,470,2);p.fillRect(22,67,470,2);
    p.fillStyle='#ceb478';p.fillRect(24,70,256,4);p.fillRect(286,70,64,4);
    p.fillStyle='#84949b';for(let i=0;i<10;i++){p.fillRect(24+i*7,436,4,18);}
    // Machined footplate with blue non-slip tile, bevels and sunken latches.
    // All small machining detail is baked once, not another projected layer.
    const plate=p.createLinearGradient(0,105,500,395);plate.addColorStop(0,'#5f7c85');plate.addColorStop(.44,'#829ca2');plate.addColorStop(1,'#506e7d');
    const platePath=off=>{p.beginPath();p.moveTo(38+off,111+off);p.lineTo(450-off,111+off);p.lineTo(473-off,137+off);
      p.lineTo(473-off,365-off);p.lineTo(449-off,396-off);p.lineTo(52+off,396-off);p.lineTo(38+off,379-off);p.closePath();};
    platePath(0);p.fillStyle='#526975';p.fill();platePath(3);p.fillStyle='#acb9b6';p.fill();platePath(6);p.fillStyle=plate;p.fill();
    p.save();p.clip();
    for(let x=-270;x<500;x+=19){
      p.beginPath();p.moveTo(x,387);p.lineTo(x+182,121);p.strokeStyle='rgba(35,58,68,.19)';p.lineWidth=2;p.stroke();
      p.beginPath();p.moveTo(x+2,387);p.lineTo(x+184,121);p.strokeStyle='rgba(201,221,218,.18)';p.lineWidth=1;p.stroke();
    }p.restore();
    for(const z of [91,418])for(const x of [82,408]){
      p.strokeStyle='#786b52';p.lineWidth=3;p.strokeRect(x-19,z-5,37,10);p.fillStyle='#6d8490';p.fillRect(x-17,z-3,33,6);
      p.fillStyle='#d6bf88';p.fillRect(x-13,z-2,12,3);
    }
    const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  }
  M.createSaturn=function({scene,player,dog}){
    const root=group(scene),rand=seeded(),panorama=sky(scene),lessons=[];
    // Magical layer over the painted vista: twinkling stars, a giant ring arc
    // cutting the sky, Titan and little Enceladus, one slow shooting star now and then.
    let spaceSky=null;
    try{spaceSky=M.createSpaceSky&&M.createSpaceSky({scene,preset:'saturn',
      dome:{overlay:true,nebulaAmount:.18,glow:false},
      stars:{count:650,brightness:.9,size:1,twinkle:1.2,parallax:.3},
      shooting:{every:[18,34],duration:2.6,color:'#fff4dc'},
      arc:{y:.18,rise:.45,width:.085,tilt:-.1,opacity:.36,colors:['#f3e2bd','#a9c9d8']},
      bodies:[{preset:'titan',screen:[.34,.10],size:.07,light:[1,.3]},{preset:'enceladus',screen:[.46,.06],size:.032,light:[1,.3]}]});}catch(err){spaceSky=null;}
    const skyBody=putPlanet(root);
    // Warm low sun, cool ring-light from behind: more depth, same three lights.
    const hemi=new T.HemisphereLight(0xffe6d2,0x5a6a96,1.72);
    const key=new T.DirectionalLight(0xffd29c,2.6);key.position.set(-8,15,10);
    const fill=new T.DirectionalLight(0x7fe0ff,1.12);fill.position.set(8,7,-12);
    root.add(hemi,key,key.target,fill);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
    const shadow=key.shadow.camera;shadow.left=-13;shadow.right=13;shadow.top=12;shadow.bottom=-10;shadow.near=.4;shadow.far=43;key.shadow.normalBias=.025;key.shadow.bias=-.0004;key.shadow.radius=2;
    const mats={
      porcelain:metal(0xe4d8bb,.47), ink:metal(0x23364c,.54), petrol:metal(0x426572,.48), steel:metal(0x8898a6,.39,.48),
      brass:metal(0xd59b5a,.36,.53), coral:metal(0xcc7856,.47), milk:glow(0xffe5a9), light:glow(0xb1fcf5),
      gem:[metal(0x64d8de,.24,.17),metal(0xf0ba6d,.23,.15),metal(0xd496d8,.24,.15)],
      shine:[glow(0xbdfff3),glow(0xffe5a5),glow(0xffc6ed)],
      frost:metal(0xa2c6d4,.6,.07)
    };
    for(const key of['porcelain','ink','petrol','steel','brass','coral'])M.WorkshopArt.paint(mats[key],key==='steel'||key==='brass'?'metal':'enamel');
    const shapes={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,16,12),cyl:new T.CylinderGeometry(1,1,1,18),stone:new T.IcosahedronGeometry(1,0),nub:new T.IcosahedronGeometry(1,1),ring:new T.TorusGeometry(1,.040,7,48),rod:new T.CylinderGeometry(1,1,1,8)};
    const textureLoader=new T.TextureLoader();
    const iceAlbedo=textureLoader.load(iceImages[0]),iceNormal=textureLoader.load(iceImages[1]),glazeTexture=textureLoader.load(M.saturnMaps.glaze);
    glazeTexture.colorSpace=T.SRGBColorSpace;glazeTexture.wrapS=glazeTexture.wrapT=T.RepeatWrapping;glazeTexture.anisotropy=4;
    iceAlbedo.colorSpace=T.SRGBColorSpace;
    for(const t of [iceAlbedo,iceNormal]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,1.4);t.anisotropy=2;}
    // Polished, faintly glowing ring ice: a wet sheen under the sun and a
    // deep teal light in the shadows (no extra textures or draw calls).
    mats.ice=metal(0xacd3ed,.44,.06);mats.ice.vertexColors=true;
    mats.ice.map=iceAlbedo;mats.ice.normalMap=iceNormal;mats.ice.normalScale=new T.Vector2(.64,.64);
    mats.ice.emissive.setHex(0x0d3a4a);mats.ice.emissiveIntensity=.42;
    mats.frost.roughness=.42;mats.frost.emissive.setHex(0x0b2e3c);mats.frost.emissiveIntensity=.3;
    for(const m of mats.gem){m.map=iceAlbedo;m.normalMap=iceNormal;m.normalScale=new T.Vector2(.11,.11);m.emissive.copy(m.color);m.emissiveIntensity=.16;}
    shapes.iceRock=icyRockGeometry();
    const staticParts=new Map(), dummy=new T.Object3D(),a=new T.Vector3(),b=new T.Vector3(),up=new T.Vector3(0,1,0);
    // Keep a small length of the ring in each batch. The camera can then cull
    // full stations and ice fields while the original coloured details remain.
    const paint=M.WorkshopArt.paint(metal(0xffffff,.49,.25)),alloy=M.WorkshopArt.paint(metal(0xffffff,.38,.51),'metal'),lamp=glow(0xffffff);
    const finish=new Map([
      [mats.porcelain,paint],[mats.ink,paint],[mats.petrol,paint],[mats.coral,paint],
      [mats.steel,alloy],[mats.brass,alloy],[mats.milk,lamp],[mats.light,lamp],
      ...mats.shine.map(m=>[m,lamp])
    ]);
    // Rigid painted parts on a moving toy can share one draw. Keep the
    // original normals (including nonuniform scales) and each part's tint.
    const paintedSurfaces=new Map();
    function weldToy(parent) {
      const groups=new Map();
      for(const child of parent.children){
        const surface=finish.get(child.material);
        if(!surface||child.castShadow||child.receiveShadow)continue;
        if(!groups.has(surface))groups.set(surface,[]);
        groups.get(surface).push(child);
      }
      for(const [surface,parts] of groups){
        if(parts.length<2)continue;
        const positions=[],normals=[],colours=[],uvs=[],indices=[];
        const v=new T.Vector3(),normalMatrix=new T.Matrix3();
        for(const part of parts){
          part.updateMatrix();normalMatrix.getNormalMatrix(part.matrix);
          const g=part.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
          const base=positions.length/3,c=part.material.color;
          for(let i=0;i<p.count;i++){
            v.fromBufferAttribute(p,i).applyMatrix4(part.matrix);positions.push(v.x,v.y,v.z);
            v.fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix);normals.push(v.x,v.y,v.z);
            colours.push(c.r,c.g,c.b);uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
          }
          const count=g.index?g.index.count:p.count;
          for(let i=0;i<count;i++)indices.push(base+(g.index?g.index.getX(i):i));
          parent.remove(part);
        }
        const g=new T.BufferGeometry();
        g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
        g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
        g.setAttribute('color',new T.Float32BufferAttribute(colours,3));
        g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
        g.setIndex(indices);g.computeBoundingSphere();
        if(!paintedSurfaces.has(surface)){
          const material=surface.clone();material.vertexColors=true;paintedSurfaces.set(surface,material);
        }
        parent.add(new T.Mesh(g,paintedSurfaces.get(surface)));
      }
    }
    function queue(geometry,mat) {
      const shared=finish.get(mat),surface=shared||mat;
      const cell=Math.floor((dummy.position.x+5)/28);
      const key=cell+'_'+geometry.id+'_'+surface.id;
      let pack=staticParts.get(key);
      if(!pack){pack={geometry,surface,parts:[],tinted:!!shared};staticParts.set(key,pack);}
      dummy.updateMatrix();pack.parts.push({matrix:dummy.matrix.clone(),material:mat});
    }
    function piece(geometry,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0){
      dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(rx,ry,rz);queue(geometry,mat);
    }
    function beam(x,y,z,xx,yy,zz,r,mat){
      a.set(x,y,z);b.set(xx,yy,zz).sub(a);dummy.position.copy(a).addScaledVector(b,.5);
      dummy.scale.set(r,b.length(),r);dummy.quaternion.setFromUnitVectors(up,b.normalize());queue(shapes.rod,mat);
    }
    function flush() {
      for(const pack of staticParts.values()){
        const obj=new T.InstancedMesh(pack.geometry,pack.surface,pack.parts.length);
        pack.parts.forEach(({matrix,material},i)=>{
          obj.setMatrixAt(i,matrix);
          if(pack.tinted)obj.setColorAt(i,material.color);
        });
        obj.computeBoundingSphere();obj.receiveShadow=true;root.add(obj);
      }
      staticParts.clear();
    }
    const iceSpans=[[9,55],[76,130],[174,232],[250,277],[294,304]];
    function iceAt(x){for(const span of iceSpans)if(x>=span[0]&&x<span[1])return true;return false;}
    const polished=metal(0xc9f1ee,.41,.065);
    polished.vertexColors=true;polished.map=glazeTexture;polished.normalMap=iceNormal;polished.normalScale=new T.Vector2(.35,.35);
    polished.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        float edge=pow(1.-max(0.,dot(normal,normalize(vViewPosition))),3.);
        outgoingLight+=vec3(.026,.13,.18)*edge;
        #include <opaque_fragment>`);
    };
    function shelfEdge(x,side) {
      return side>0?2.28+.42*Math.sin(x*.72)+.38*Math.cos(x*.34): -3.20-.75*Math.sin(x*.39)-.75*Math.sin(x*.13);
    }
    // Continuous, level riding lane through natural ring material. Layers of
    // compressed ice flare out below the surface and finish in fractured keels.
    const icePos=[],iceCol=[],iceUV=[],iceIndex=[];
    function vertex(x,y,z,u,v,color){
      icePos.push(x,y,z);iceCol.push(color.r,color.g,color.b);iceUV.push(u,v);
    }
    const topWarm=new T.Color(0xe5f6ef),topBlue=new T.Color(0x9cdbeb),sideBlue=new T.Color(0x4685a4),ocean=new T.Color(0x22547e),seam=new T.Color(0xbcebe4),tmpC=new T.Color();
    for(const [start,end] of iceSpans){
      const slices=Math.round((end-start)*1.5);
      const offset=icePos.length/3;
      for(let i=0;i<=slices;i++){
        const x=M.lerp(start,end,i/slices),f=shelfEdge(x,1),b=shelfEdge(x,-1),h=ground(x);
        const lip=.11*Math.sin(x*1.45),depth=2.5+.82*Math.sin(x*.38)+1.03*Math.pow(.5+.5*Math.sin(x*1.42),3);
        const keel=.7+.33*Math.sin(x*.75);
        const rows=[
          [b+.64,h-depth*.74,0],[b-.16,h-1.19,1],[b-.13,h-.2,2],[b+.11,h+.06,3],
          [-.65,h,4],[.78,h,5],[f-.35,h+.055+lip*.24,6],[f,h-.19+lip*.3,7],
          [f+.25*Math.sin(x*.78),h-.76+lip,8],[f-.22,h-1.15+lip,9],
          [f-.66+lip,h-depth*.77,10],[keel,h-depth,11]
        ];
        rows.forEach(([z,y,k])=>{
          const r=.5+.5*Math.sin(x*.81+k*1.6);
          const shade=k>=3&&k<=6?tmpC.copy(topWarm).lerp(topBlue,.30+.35*r):
                k===7?tmpC.copy(seam).lerp(topWarm,r*.69):k===8?tmpC.copy(sideBlue).lerp(topBlue,.19+r*.25):
                k===9?tmpC.copy(sideBlue).lerp(seam,.24+r*.40):tmpC.copy(ocean).lerp(sideBlue,.24+.26*r);
          vertex(x,y,z,x*.153,k>=3&&k<=6?z*.18:(y*.28+z*.04),shade);
        });
        const cols=rows.length;
        if(i)for(let j=0;j<cols-1;j++){
          const now=offset+i*cols+j;
          iceIndex.push(now-cols,now-cols+1,now,now,now-cols+1,now+1);
        }
      }
    }
    const iceGeo=new T.BufferGeometry();iceGeo.setAttribute('position',new T.Float32BufferAttribute(icePos,3));iceGeo.setAttribute('color',new T.Float32BufferAttribute(iceCol,3));iceGeo.setAttribute('uv',new T.Float32BufferAttribute(iceUV,2));iceGeo.setIndex(iceIndex);iceGeo.computeVertexNormals();
    const shelf=mesh(root,iceGeo,polished);shelf.receiveShadow=true;shelf.name='Satürn halka buzu geçidi';
    const floorM=metal(0xcad3d5,.66,.16);floorM.map=deckTexture(rand);
    function bridgeAmount(x){
      const interval=(lo,hi)=>ease(clamp((x-lo)/3,0,1))*ease(clamp((hi-x)/3,0,1));
      return Math.max(interval(55,74),interval(133,147),interval(233,249),interval(278,285));
    }
    function apron(x){
      return Math.max(0,1-Math.pow((x-harpX)/9,2),1-Math.pow((x-dockX)/8.5,2),1-Math.pow((x-eyeX)/6.5,2));
    }
    function front(x){return 2.28-bridgeAmount(x)*.95+apron(x)*.50;}
    function back(x){return -3.3+bridgeAmount(x)*.62-apron(x)*.4;}
    const pos=[],uv=[],ind=[],glassInd=[];
    for(let i=0;i<=length+8;i++){
      const x=i-4,h=ground(x);
      pos.push(x,h,back(x),x,h,front(x));uv.push(x/3.5,0,x/3.5,1);
      if(i&&!iceAt(x-.5)){const j=i*2;(bridgeAmount(x-.5)>.82?glassInd:ind).push(j-2,j-1,j,j,j-1,j+1);}
    }
    const deckG=new T.BufferGeometry();deckG.setAttribute('position',new T.Float32BufferAttribute(pos,3));deckG.setAttribute('uv',new T.Float32BufferAttribute(uv,2));deckG.setIndex(ind.concat(glassInd));deckG.addGroup(0,ind.length,0);deckG.addGroup(ind.length,glassInd.length,1);deckG.computeVertexNormals();
    const glassM=new T.MeshStandardMaterial({color:0x6dbfc9,roughness:.22,metalness:.22,emissive:0x314954,emissiveIntensity:.29,transparent:true,opacity:.45,depthWrite:false});
    const deckSurface=mesh(root,deckG,[floorM,glassM]);deckSurface.receiveShadow=true;
    for(let x=-2;x<length+3;x+=3){
      if(iceAt(x))continue;
      const y=ground(x),slope=Math.atan2(ground(x+1.5)-ground(x-1.5),3);
      const z=front(x),rear=back(x),mid=(z+rear)*.5;
      function strip(mat,cy,depth,thick){
        beam(x-1.5,ground(x-1.5)+cy,front(x-1.5)+depth,x+1.5,ground(x+1.5)+cy,front(x+1.5)+depth,thick,mat);
      }
      if(bridgeAmount(x)>.60){
        strip(mats.steel,-.13,.01,.12);
        strip(mats.brass,-1.16,-.36,.085);
        beam(x-1.49,y-.16,z,x,y-1.16,z-.34,.070,mats.brass);
        beam(x,y-1.16,z-.34,x+1.49,y-.16,z,.070,mats.brass);
        beam(x,y-.19,z-.05,x,y-.19,rear,.084,mats.petrol);
        beam(x,y-1.16,z-.34,x,y-.91,rear,.075,mats.steel);
        piece(shapes.box,mats.light,x,y-.16,z+.08,.42,.048,.035);
      }else{
        const breadth=z-rear;
        piece(shapes.box,mats.ink,x,y-.39,mid-.035,3.02,.69,breadth-.07,0,0,slope);
        strip(mats.steel,-.13,.02,.064);
        strip(mats.brass,-.62,.019,.030);
        piece(shapes.box,mats.petrol,x,y-.39,z+.035,1.60,.20,.09,0,0,slope);
        piece(shapes.box,mats.light,x,y-.38,z+.085,.63,.048,.035,0,0,slope);
        for(let d=0;d<3;d++)piece(shapes.box,mats.steel,x+.51+d*.11,y-.39,z+.088,.035,.12,.04,0,0,-.27);
        piece(shapes.box,mats.steel,x-1.36,y-.40,z+.035,.12,.47,.075,0,0,slope);
        piece(shapes.box,mats.petrol,x,y-.88,mid,2.76,.30,breadth-.65,0,0,slope);
        if(x%2){beam(x-1.2,y-.7,z-.12,x+.86,y-1.46,mid,.071,mats.brass);beam(x+1.2,y-.7,z-.12,x-.80,y-1.46,mid,.069,mats.steel);}
      }
    }
    // Slim rear handrail; keep the front edge completely clear for the camera.
    for(let x=-3;x<length+2;x+=5){
      if(iceAt(x+2.5))continue;
      const y=ground(x);
      beam(x,y-.10,back(x)+.16,x,y+.83,back(x)+.16,.064,mats.steel);
      beam(x,y+.83,back(x)+.16,x+5,ground(x+5)+.83,back(x+5)+.16,.052,mats.brass);
    }
    const iceLayer=metal(0xa9d7de,.45,.07);
    iceLayer.map=glazeTexture;iceLayer.normalMap=iceNormal;iceLayer.normalScale=new T.Vector2(.4,.4);
    const amberLayer=metal(0xc3ad8e,.51,.05);amberLayer.map=iceAlbedo;
    // Fewer, individually layered fragments at different distances. Frost
    // shelves and amber seams break up their silhouettes against the ring field.
    for(let i=0;i<13;i++){
      const x=rand()*(length+32)-12,z=-14-rand()*25,y=-2.5-rand()*6;
      const sz=.56+Math.pow(rand(),1.55)*2.03,roll=(rand()-.5)*.46;
      const span=sz*(1.25+rand()*1.0),height=sz*(.50+rand()*.47),deep=sz*.79;
      piece(shapes.iceRock,iceLayer,x,y,z,span,height,deep,0,.12,roll);
      piece(shapes.iceRock,i%3===0?amberLayer:mats.frost,x,y+height*.42,z-.045,span*.86,height*.225,deep*.90,0,.12,roll);
      if(i%2===0)piece(shapes.stone,iceLayer,x-span*.38,y+height*.31,z+.09,span*.42,height*.80,deep*.50,.22,-.22,roll-.21);
      
    }
    // Small pieces of ring ice form a far belt, leaving generous open sky.
    for(let i=0;i<49;i++){
      const x=rand()*(length+65)-35,z=-27-rand()*40,y=-5+Math.sin(x*.048)*2+rand()*2;
      const s=.10+rand()*.38;piece(shapes.stone,iceLayer,x,y,z,s*1.35,s*.65,s,rand()*2,rand()*2,rand());
    }
    // Ring-ice floes: tabular fractured slabs, long blue cleavage faces,
    // pale caps and thin cracks. Only the midground holds these larger shapes.
    const iceFacet=metal(0xb4dce3,.44,.12);iceFacet.map=iceAlbedo;iceFacet.normalMap=iceNormal;iceFacet.normalScale=new T.Vector2(.20,.20);
    const wedge=new T.CylinderGeometry(.60,1,1,6,1);wedge.translate(0,.51,0);
    const point=new T.ConeGeometry(.62,.29,6);point.translate(0,1.10,0);
    for(const [cx,cy,cz,size] of [[-7,-1.7,-9,2.7],[20,-1.7,-7.9,2.15],[49,-2.5,-8,2.55],[64,-2.5,-9.5,2],[101,-1.7,-7,1.7],[116,-2.3,-8.7,2.55],[144,-1.5,-9,2.4],[180,-1.9,-8.5,3.2],[202,-2.1,-8,2.5],[226,-1.2,-10,2.8],[254,-2.4,-8,2.6],[293,-1.4,-10,3.1]]){
      piece(shapes.iceRock,mats.ice,cx,cy-.90,cz,2.85,1.25,1.6);
      for(let j=0;j<6;j++){
        const dx=(j-2.5)*.54,r=.24+.21*rand(),h=size*(.51+.55*rand()),tilt=-dx*.23+rand()*.12;
        piece(wedge,iceFacet,cx+dx,cy-.46,cz-rand()*.10,r,h,r*.78,.055,.44,tilt);
        piece(point,mats.frost,cx+dx,cy-.46,cz-.04,r,h,r*.78,.055,.44,tilt);
      }
    }
    // Fractured ice arches are lofted around a curved spine; the hollow really
    // opens onto the rings. One mesh handles the whole chain of distant ridges.
    const cliffP=[],cliffC=[],cliffUV=[],cliffI=[],snowCap=new T.Color(0xf4fcff),glacierFace=new T.Color(0x86eef6);
    function iceSpine(center,z,span,lift,girth) {
      const base=cliffP.length/3,steps=21,facets=9;
      for(let i=0;i<=steps;i++){
        const u=i/steps,arc=Math.PI*(1-u);
        const x=center+Math.cos(arc)*span+.65*Math.sin(2*arc),y=-4.3+lift*Math.pow(Math.sin(arc),.73)+.64*Math.sin(arc*2.5);
        const nx=Math.cos(arc),ny=Math.sin(arc);
        const thickness=girth*(.82+.17*Math.sin(i*1.33)+.34*Math.pow(Math.abs(nx),2));
        for(let j=0;j<=facets;j++){
          const turn=(j%facets)/facets*TAU;
          const c=Math.cos(turn),v=Math.sin(turn);
          const rough=1+.12*Math.sin(i*.8+3*(j%facets))+.06*Math.cos(i*1.7+j);
          const radial=thickness*c*rough;
          const wx=x+nx*radial,wy=y+ny*radial,wz=z+Math.sin(arc*1.8)*.53+v*thickness*1.9;
          // Glacier ice: deep blue roots, bright cyan flanks and snowy crests.
          const up=ny*c,rise=clamp((wy+4.3)/(lift+1.2),0,1);
          tmpC.copy(ocean).lerp(sideBlue,.25+.75*rise).lerp(topBlue,clamp(.30+.45*up+.10*Math.sin(i+j*3),0,1));
          if(up>.3)tmpC.lerp(snowCap,clamp((up-.3)*1.5,0,.8));
          else if(v>.5)tmpC.lerp(glacierFace,.30*(v-.5)*2+.08*Math.sin(i*2.1+j));
          cliffP.push(wx,wy,wz);cliffC.push(tmpC.r,tmpC.g,tmpC.b);cliffUV.push(i*.16,j*.18);
          if(i&&j){const q=base+i*(facets+1)+j,prev=q-facets-1;cliffI.push(prev-1,q-1,q,prev-1,q,prev);}
        }
      }
    }
    iceSpine(22,-22.6,6.9,5.7,1.28);
    iceSpine(67.7,-19.8,8.4,7.21,1.55);
    
    iceSpine(115.2,-22.5,9.15,6.48,1.62);
    iceSpine(185,-23,12.5,8.1,1.65);
    iceSpine(222,-22,10.8,7.6,1.48);
    iceSpine(273,-25,13,8.3,1.6);
    const cliffG=new T.BufferGeometry();cliffG.setAttribute('position',new T.Float32BufferAttribute(cliffP,3));cliffG.setAttribute('color',new T.Float32BufferAttribute(cliffC,3));cliffG.setAttribute('uv',new T.Float32BufferAttribute(cliffUV,2));cliffG.setIndex(cliffI);cliffG.computeVertexNormals();
    const cliffM=polished.clone();cliffM.side=T.DoubleSide;cliffM.color.set(0xb9e2ee);cliffM.emissive.setHex(0x0c4152);cliffM.emissiveIntensity=.55;
    // Glacier glow: a bright cyan rim and soft light inside the ice (same single draw).
    cliffM.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        float rim=pow(1.-abs(dot(normal,normalize(vViewPosition))),2.4);
        outgoingLight+=vec3(.09,.32,.40)*rim+diffuseColor.rgb*vec3(.03,.09,.11);
        #include <opaque_fragment>`);
    };
    const broken=cliffG.toNonIndexed();broken.computeVertexNormals();cliffG.dispose();mesh(root,broken,cliffM);
    // Real ice hints at pieces suspended in the interior through two offset
    // depth layers, refracted fissures and a glancing facet highlight. Opaque
    // cores provide that effect without per-object transmission render targets.
    const specimenMats=mats.gem.map((mat,i)=>new T.ShaderMaterial({
      uniforms:{stone:{value:glazeTexture},tint:{value:new T.Color([0x46c8df,0xf3b85d,0xc89cde][i])}},
      vertexShader:`varying vec3 local,normalV,look;varying vec3 cut;void main(){
        local=position;cut=color;normalV=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);look=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
      vertexColors:true,
      fragmentShader:`varying vec3 local,normalV,look,cut;uniform vec3 tint;uniform sampler2D stone;
      void main(){
        vec3 V=normalize(look),N=normalize(normalV),L=normalize(vec3(-.48,.72,.52));
        float nv=max(.0,dot(V,N)),edge=pow(1.-nv,2.6);
        vec2 uv=local.xy*.57+vec2(local.z*.23,-local.z*.11),shift=(V.xy-N.xy)*.16;
        vec3 deep=texture2D(stone,uv*.77+shift).rgb,skin=texture2D(stone,uv*1.18-shift*.37).rgb;
        float light=.32+.72*max(0.,dot(N,L));float inclusion=smoothstep(.37,.70,deep.r);
        vec3 col=mix(tint*.23,tint*1.12+vec3(.11,.13,.12),.17+.68*skin.g+.24*inclusion)*light*cut;
        col+=tint*.15*inclusion+vec3(.17,.25,.29)*edge;
        float glint=pow(max(0.,dot(normalize(L+V),N)),33.);col+=vec3(1.,.94,.76)*glint*.73;
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
    }));
    // Three clearly different silhouettes, reused by the chimes and by their
    // physical specimen wells — a twin spear, an amber rosette, and a fan.
    const specimenGeo=[];
    for(let type=0;type<3;type++){
      const ps=[],cs=[],tx=[],idx=[];
      function blade(cx,cy,cz,r,h,lean,twist,n=6){
        const first=ps.length/3,ringCount=5;
        const levels=[[-.45,.21],[-.34,.88],[.16,1],[.38,.73],[.62,.045]];
        for(let k=0;k<ringCount;k++)for(let j=0;j<n;j++){
          const phi=j/n*TAU+twist;
          const dy=levels[k][0]*h,wide=levels[k][1]*r*(1+.085*Math.cos(3*phi+twist));
          const xx=Math.cos(phi)*wide+.09*h*(k/ringCount);
          ps.push(cx+xx*Math.cos(lean)-dy*Math.sin(lean),cy+xx*Math.sin(lean)+dy*Math.cos(lean),cz+Math.sin(phi)*wide*.72);
          const sh=.68+.18*Math.cos(phi+twist)+.12*k/(ringCount-1);cs.push(sh,sh+.028,sh+.043);tx.push(j/n,k/4);
          if(k){const q=first+k*n+j,rj=first+k*n+(j+1)%n;idx.push(q-n,q,rj,q-n,rj,rj-n);}
        }
        for(let j=1;j<n-1;j++)idx.push(first,first+j+1,first+j,first+4*n,first+4*n+j,first+4*n+j+1);
      }
      if(type===0){blade(-.12,-.02,0,.31,1.24,-.13,.2);blade(.19,-.12,-.045,.21,.82,-.42,.43);}
      if(type===1){for(let j=0;j<6;j++){const ang=j*TAU/6;blade(Math.cos(ang)*.19,Math.sin(ang)*.18,-.04,.18,.68,ang-1.57,.3);}blade(0,.02,.08,.36,.68,.25,.51);}
      if(type===2){for(let j=-2;j<=2;j++)blade(j*.125,-.08+Math.abs(j)*.005,Math.abs(j)*-.04,.17,1.21-Math.abs(j)*.22,-j*.26,.4+j*.21,5);}
      const shell=new T.BufferGeometry();shell.setAttribute('position',new T.Float32BufferAttribute(ps,3));shell.setAttribute('color',new T.Float32BufferAttribute(cs,3));shell.setAttribute('uv',new T.Float32BufferAttribute(tx,2));shell.setIndex(idx);
      const cut=shell.toNonIndexed();cut.computeVertexNormals();shell.dispose();specimenGeo.push(cut);
    }
    // Rings are explored on ice rather than on repeated platform obstacles.
    for(const [start,end] of iceSpans){
      for(let x=start+.4;x<end-.2;x+=1.1+rand()*1.32){
        const z=shelfEdge(x,1),y=ground(x);
        const sz=.075+rand()*.14;
        piece(shapes.stone,iceLayer,x,y-.13,z-.05,sz*1.72,sz*.55,sz,.14,.48,rand()*.3);
        if(rand()>.63)piece(shapes.stone,iceLayer,x+.27,y-.43,z+.05,sz*.39,sz*1.28,sz*.48,.19,0,.21);
      }
    }
    const platforms=[];
    function detailedPod(x,y,z,sx,sy,sz){
      piece(shapes.sphere,mats.porcelain,x,y,z,sx,sy,sz);
      piece(shapes.sphere,mats.ink,x,y+.12*sy,z+.63*sz,sx*.73,sy*.54,sz*.53);
      piece(shapes.sphere,mats.petrol,x-.12*sx,y+.13*sy,z+.68*sz,sx*.56,sy*.36,sz*.49);
      piece(shapes.sphere,mats.coral,x,y-.51*sy,z,sx*.86,sy*.51,sz*.88);
    }
    // Landing capsule with warm portholes, a retracted engine bell, real
    // footpads and radiator seams at a scale Feza can walk past.
    const shipX=4.1,shipZ=-6.0;
    detailedPod(shipX,1.76,shipZ,2.06,1.34,1.38);
    for(const dx of [-1.23,1.23]){
      for(const dz of [-.55,.67]){
        beam(shipX+dx*.79,1.20,shipZ+dz,shipX+dx*1.27,.18,shipZ+dz*1.43,.091,mats.steel);
        piece(shapes.cyl,mats.ink,shipX+dx*1.27,.17,shipZ+dz*1.43,.32,.15,.28);
      }
    }
    for(let n=0;n<3;n++){
      const x=shipX-.77+n*.72;
      piece(shapes.sphere,mats.milk,x,1.76+(n===1?.12:0),shipZ+1.36,.22,.23,.095);
    }
    piece(shapes.cyl,mats.ink,shipX,.75,shipZ,.64,.43,.55);
    beam(shipX+.64,2.86,shipZ,shipX+.91,3.68,shipZ-.11,.045,mats.steel);
    piece(shapes.sphere,mats.milk,shipX+.91,3.68,shipZ-.11,.10,.10,.10);
    const panelCanvas=document.createElement('canvas');panelCanvas.width=384;panelCanvas.height=192;
    const cells=panelCanvas.getContext('2d');cells.fillStyle='#9faab3';cells.fillRect(0,0,384,192);
    const dye=cells.createLinearGradient(0,0,340,260);dye.addColorStop(0,'#233455');dye.addColorStop(.36,'#345c79');dye.addColorStop(.50,'#57708b');dye.addColorStop(.63,'#354c70');dye.addColorStop(1,'#253b60');
    for(let ix=0;ix<8;ix++)for(let iy=0;iy<4;iy++){
      const px=ix*48+3,py=iy*48+3;
      cells.fillStyle=dye;cells.fillRect(px,py,43.7,43.7);
      cells.fillStyle='rgba(179,209,226,.38)';
      for(let j=1;j<9;j++)cells.fillRect(px+j*4.8,py+.6,.7,42);
      cells.fillStyle='#b3a47d';cells.fillRect(px+2,py+21,40,1.15);
    }
    const cellMap=new T.CanvasTexture(panelCanvas);cellMap.colorSpace=T.SRGBColorSpace;cellMap.anisotropy=4;
    const photovoltaic=metal(0xe0e7f0,.40,.17);photovoltaic.map=cellMap;
    for(const sx of [14,73,123]){
      const sy=ground(sx);
      beam(sx,sy-.8,-4,sx-.6,sy+1.6,-6,.12,mats.steel);
      const array=group(root,sx-.6,sy+1.85,-6.04);array.rotation.set(-.20,-.18,-.12);
      const frame=mesh(array,shapes.box,mats.brass);frame.scale.set(3.05,1.47,.12);
      mesh(array,new T.PlaneGeometry(2.96,1.36),photovoltaic,0,0,.069);
    }
    // A ring-shaped instrument above the first ice bridge. Its upper
    // ribs stay behind the travel lane.
    function haloPavilion(x,scale,tilt){
      const y=ground(x),z=-5.2;
      for(let j=0;j<2;j++){
        const cx=x+(j?1.72:-1.72)*scale;
        beam(cx,y-1.3,z+.18,cx+(j?-.33:.33),y+.76*scale,z,.13*scale,mats.steel);
        piece(shapes.cyl,mats.brass,cx,y-.35,z,.19,.36,.19);
      }
      const mount=group(root,x,y+2.13*scale,z);
      mount.rotation.set(.14,.22,tilt);
      const ring=mesh(mount,new T.TorusGeometry(1.80*scale,.078*scale,9,96),mats.steel);
      const inlay=mesh(mount,new T.TorusGeometry(1.68*scale,.033*scale,8,96,4.8),mats.milk);
      inlay.rotation.z=.34;
      const platter=group(mount);platter.rotation.set(.85,-.15,.22);
      const brass=mesh(platter,new T.TorusGeometry(1.45*scale,.046*scale,8,80),mats.brass);
      const mobile=group(platter);const pea=mesh(mobile,shapes.sphere,iceFacet,1.45*scale,0,0);pea.scale.setScalar(.17*scale);
      const sister=mesh(mobile,shapes.sphere,mats.coral,-1.45*scale,0,0);sister.scale.setScalar(.11*scale);
      const globePaint=metal(0xffe2a5,.58,.05);globePaint.map=skyBody.userData.atlas;const core=mesh(mount,shapes.sphere,globePaint,0,.01,-.03);core.scale.set(.62*scale,.56*scale,.62*scale);core.rotation.set(.32,.6,.27);const miniatureRings=mesh(core,new T.RingGeometry(1.32,2.1,64),new T.MeshStandardMaterial({color:0xd9bd8a,side:T.DoubleSide,roughness:.65}));miniatureRings.rotation.x=-Math.PI/2;
      const crank=group(mount,1.84*scale,0,.12);mesh(crank,shapes.cyl,mats.brass).rotation.x=Math.PI/2;crank.scale.setScalar(.14*scale);const crankArm=mesh(mount,shapes.rod,mats.brass,1.84*scale,-.35*scale,.17);crankArm.scale.set(.065*scale,.72*scale,.065*scale);const knob=mesh(mount,shapes.sphere,mats.coral,1.84*scale,-.76*scale,.26);knob.scale.set(.22*scale,.23*scale,.32*scale);
      return {mount,platter,mobile,core,pea,sister,inlay};
    }
    const wheel=haloPavilion(137,1.20,-.23);
    // A working eclipse bench set into the ring. The foreground moon rides a
    // real curved rail. The frosted screen behind it receives a soft shadow.
    function createEclipseTheatre(x) {
      const floor=ground(x),baseY=floor+3.00,z=-3.43,travel=1.56,solarY=.26;
      const theatre=group(root,x,baseY,z);theatre.name='Tutulma atölyesi';
      const outline=new T.Shape();outline.absellipse(0,0,2.45,1.38,0,TAU,false,0);
      const rimGeometry=new T.ExtrudeGeometry(outline,{depth:.16,bevelEnabled:true,
        bevelSegments:2,bevelSize:.095,bevelThickness:.072,curveSegments:32});
      mesh(theatre,rimGeometry,mats.petrol,0,0,-.18);
      function hoop(rx,ry,front,radius,material,start=0,arc=TAU,tilt=0) {
        const knots=[],segments=Math.max(8,Math.ceil(48*arc/TAU));
        for(let i=0;i<=segments;i++){
          const t=start+arc*i/segments,px=rx*Math.cos(t),py=ry*Math.sin(t);
          knots.push(new T.Vector3(px*Math.cos(tilt)-py*Math.sin(tilt),
            py*Math.cos(tilt)+px*Math.sin(tilt),front+.035*Math.cos(t)));
        }
        return mesh(theatre,new T.TubeGeometry(new T.CatmullRomCurve3(knots),segments,radius,6,false),material);
      }
      hoop(2.46,1.40,.086,.044,mats.brass);
      // A tilted outer yoke pivots at two enamel bearings. The rods and
      // graduated bezel merge with the metalwork at construction.
      hoop(2.66,1.52,-.12,.076,mats.brass,.16,Math.PI*1.70,.12);
      hoop(2.66,1.52,-.10,.032,mats.milk,.66,.49,.12);
      for(const side of [-1,1]){
        const hub=mesh(theatre,shapes.cyl,mats.brass,side*2.45,0,.07);hub.rotation.x=Math.PI/2;hub.scale.set(.16,.25,.16);
        const pin=mesh(theatre,shapes.nub,mats.petrol,side*2.45,.002,.225);pin.scale.set(.10,.10,.056);
      }
      for(const phi of [.48,1.24,1.91,2.64,3.71,5.69]){
        const pin=mesh(theatre,shapes.stone,mats.porcelain,2.41*Math.cos(phi),1.37*Math.sin(phi),.106);
        pin.scale.set(.035,.035,.024);
      }
      // A broad fork rises from one weighted foot on the ice, leaving the
      // path through the foreground open for the sail and both explorers.
      const pedestalY=ground(x),footZ=z+.91;
      const slope=Math.atan2(ground(x+.70)-ground(x-.70),1.40);
      piece(shapes.cyl,mats.ink,x,pedestalY+.105,footZ,.76,.20,.58,0,0,slope);
      piece(shapes.cyl,mats.brass,x,pedestalY+.218,footZ,.62,.095,.48,0,0,slope);
      beam(x,pedestalY+.19,footZ,x,pedestalY+.95,z+.12,.20,mats.petrol);
      piece(shapes.cyl,mats.brass,x,pedestalY+.93,z+.12,.25,.12,.25);
      for(const side of [-1,1]){
        beam(x,pedestalY+.94,z+.12,x+side*1.56,baseY-1.14,z-.14,.111,mats.petrol);
        beam(x+side*1.56,baseY-1.14,z-.14,x+side*2.44,baseY-.01,z-.12,.091,mats.brass);
      }
      const uniforms={frost:{value:glazeTexture},moonX:{value:-travel},alignment:{value:0},seconds:{value:0}};
      const screenMat=new T.ShaderMaterial({
        uniforms,
        vertexShader:`varying vec2 lens;void main(){
          lens=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
        }`,
        fragmentShader:`varying vec2 lens;uniform sampler2D frost;uniform float moonX,alignment,seconds;
        void main(){
          vec2 p=lens,sun=p-vec2(0.,.26);
          float r=length(sun),angle=atan(sun.y,sun.x);
          vec3 frostTex=texture2D(frost,p*.34+vec2(.13,.42)).rgb;
          float oval=length(p/vec2(2.45,1.38));
          float edge=smoothstep(.63,1.02,oval);
          vec3 glass=mix(vec3(.009,.028,.057),vec3(.033,.094,.134),frostTex.g);
          glass+=edge*(vec3(.025,.077,.086)+vec3(.032,.065,.076)*frostTex.b);
          float innerRim=1.-smoothstep(.002,.014,abs(oval-.96));
          float outerEtch=.5+.5*cos(atan(p.y/1.38,p.x/2.45)*72.);
          glass+=vec3(.24,.16,.075)*innerRim*(.45+.55*outerEtch);
          // The lower pane is a separate crescent of opal. The penumbra
          // glides across it and grows wider as the foreground moon aligns.
          vec2 opalUV=vec2(p.x/1.84,(p.y+.72-.12*p.x*p.x)/.41);
          float opal=1.-smoothstep(.92,1.015,length(opalUV));
          vec3 nacre=mix(vec3(.20,.37,.42),vec3(.44,.51,.48),frostTex.g);
          nacre+=vec3(.09,.035,.10)*(.5+.5*sin(p.x*4.+frostTex.r*6.));
          glass=mix(glass,nacre,opal*(.80+.16*edge));
          float umbra=.14+.32*alignment;
          vec2 shadow=vec2(p.x-moonX*.81,(p.y+.84-.12*p.x*p.x)*1.35);
          float shade=1.-smoothstep(umbra*.35,umbra*1.66,length(shadow));
          glass=mix(glass,vec3(.018,.024,.073)+vec3(.023,.025,.042)*frostTex.g,opal*shade*.94);
          // Slender, uneven streamers play across the engraved glass. The
          // pearl light follows the Sun's limb and stays still at totality.
          float outer=max(0.,r-.50);
          float rayAngle=angle+.055*sin(r*7.-seconds*.27)+.035*sin(angle*4.+r*4.);
          float fan=.45+.55*pow(max(0.,.5+.5*cos(rayAngle*9.1+.85*sin(angle*3.))),3.);
          float strands=pow(max(0.,.5+.5*cos(rayAngle*34.+.63*sin(angle*7.))),4.);
          float wings=.52+.48*pow(abs(cos(angle-.21)),4.);
          float glow=exp(-outer*(6.-alignment*2.1))*fan;
          float threads=exp(-outer*(5.6-2.*wings))*strands*wings;
          vec3 warm=vec3(1.12,.37,.064),pearl=mix(vec3(.43,.82,1.26),vec3(1.28,.83,.62),.5+.5*cos(angle*2.));
          vec3 col=glass+mix(warm*.33,pearl,alignment)*glow*(1.-.73*opal);
          col+=pearl*threads*alignment*.61*(1.-.73*opal);
          float rim=1.-smoothstep(.009,.046,abs(r-.542));
          col+=mix(warm*.43,vec3(1.10,1.02,.83),alignment)*rim;
          float glint=length(sun-vec2(.39,.365));
          col+=vec3(1.8,1.27,.65)*(1.-smoothstep(.012,.105,glint))*alignment;
          float sunmask=1.-smoothstep(.515,.536,r);
          vec2 circ=sun/.529;float depth=sqrt(max(.0,1.-dot(circ,circ)));
          float granule=texture2D(frost,circ*1.02+vec2(.005*seconds,.37)).g;
          vec2 plasma=circ*23.+vec2(2.7*sin(circ.y*7.+seconds*.15),2.2*sin(circ.x*8.1));
          float convection=.5+.5*sin(plasma.x+granule*3.)*sin(plasma.y-.4*plasma.x);
          float bright=clamp(.04+.57*depth+.23*granule+.16*convection,0.,1.);
          vec3 fiery=mix(vec3(.99,.155,.013),vec3(1.64,.72,.119),bright);
          vec2 sunSpot=(circ-vec2(-.34,.19))*vec2(.89,1.25);
          float spot=1.-smoothstep(.026,.094,length(sunSpot));
          spot+=.67*(1.-smoothstep(.015,.052,length(sunSpot-vec2(.12,-.087))));
          fiery*=1.-.37*spot;
          col=mix(col,fiery,sunmask);
          float ticks=abs(r-1.03);
          col+=vec3(.044,.069,.078)*(1.-smoothstep(.001,.012,ticks))*smoothstep(.3,.86,.5+.5*cos(angle*40.));
          gl_FragColor=vec4(col,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
      });
      const screen=mesh(theatre,new T.ShapeGeometry(outline,32),screenMat,0,0,.065);
      screen.name='Buzlu Güneş perdesi';
      // Hand-sized brass runners support a slotted crescent rail on the glass.
      const pathPoints=[];
      for(let i=0;i<=10;i++){
        const px=travel*(i/5-1);
        pathPoints.push(new T.Vector3(px,-.72+.26*(px/travel)**2,.18));
      }
      mesh(theatre,new T.TubeGeometry(new T.CatmullRomCurve3(pathPoints),26,.035,6,false),mats.brass);
      for(const side of [-1,1]){
        const stop=mesh(theatre,shapes.cyl,mats.brass,side*travel,-.45,.195);stop.rotation.x=Math.PI/2;stop.scale.set(.12,.095,.12);
        const dot=mesh(theatre,shapes.nub,mats.milk,side*travel,-.45,.25);dot.scale.set(.052,.052,.022);
      }
      // A large, solid lunar marble with local crater floors and sunlit rims.
      const craterMap=document.createElement('canvas');craterMap.width=256;craterMap.height=128;
      const ctx=craterMap.getContext('2d'),rng=seeded();
      ctx.fillStyle='#abb9bd';ctx.fillRect(0,0,256,128);
      for(let i=0;i<18;i++){
        const cx=rng()*256,cy=18+rng()*93,r=8+rng()*22;
        for(const wrap of [-256,0,256]){
          const px=cx+wrap;if(px+r<0||px-r>256)continue;
          const sea=ctx.createRadialGradient(px,cy,1,px,cy,r);
          sea.addColorStop(0,'rgba(71,89,106,.41)');sea.addColorStop(.68,'rgba(91,109,124,.23)');
          sea.addColorStop(1,'rgba(91,109,124,0)');ctx.fillStyle=sea;ctx.fillRect(px-r,cy-r,2*r,2*r);
        }
      }
      for(let i=0;i<115;i++){
        const cx=rng()*256,cy=rng()*128,r=1.3+7.3*Math.pow(rng(),2.4);
        for(const wrap of [-256,0,256]){
          const px=cx+wrap;
          if(px+r<0||px-r>256)continue;
          const glow=ctx.createRadialGradient(px-r*.21,cy-r*.22,r*.15,px,cy,r);
          glow.addColorStop(0,'#82939d');glow.addColorStop(.64,'#7a8792');
          glow.addColorStop(.78,'#cbd4cc');glow.addColorStop(.91,'#bdc9c7');glow.addColorStop(1,'rgba(159,177,183,0)');
          ctx.fillStyle=glow;ctx.fillRect(px-r,cy-r,r*2,r*2);
        }
      }
      const crust=new T.CanvasTexture(craterMap);crust.colorSpace=T.SRGBColorSpace;crust.wrapS=T.RepeatWrapping;
      const moonMat=metal(0xf2eded,.80,.035);moonMat.map=crust;
      const carriage=group(theatre);carriage.name='Ay kızağı';
      const rod=mesh(carriage,shapes.rod,mats.brass,0,.40,.26);rod.scale.set(.031,.79,.031);
      const axle=mesh(carriage,shapes.cyl,mats.brass,0,0,.236);axle.rotation.x=Math.PI/2;axle.scale.set(.10,.11,.10);
      const moon=mesh(carriage,new T.SphereGeometry(.54,32,20),moonMat,0,.92,.57);
      moon.name='Tutulma ayı';
      weldToy(theatre);weldToy(carriage);
      const hit=new T.Vector2();let owner=null,from=0,at=0,dragged=false,position=-travel,target=-travel;
      let seen=false,wasTotal=false,lastDirection=-1,alignment=0,attention=0;
      let invited=false,demonstration=-1;
      function project(p) {
        const cam=M.camera?.position;if(!cam||!p)return false;
        // The input ray already intersects the walking plane at p. Continue it
        // to the lunar carriage so a visible finger lands on the moon in portrait.
        const factor=(cam.z-z-.51)/cam.z;
        hit.set(cam.x+(p.x-cam.x)*factor-x,cam.y+(p.y-cam.y)*factor-baseY);
        return true;
      }
      function toggle(){
        demonstration=-1;invited=true;
        if(Math.abs(target)<.22){target=-lastDirection*travel;lastDirection=Math.sign(target);}
        else{lastDirection=Math.sign(target);target=0;}
        attention=4.5;M.sfx('saturn-magnet');
      }
      function pointer(type,p,e) {
        const id=e?.pointerId??0;
        if(type==='cancel'){
          if(owner!==null&&(!e||id===owner))owner=null;
          return false;
        }
        if(type==='down'){
          if(seen||owner!==null||Math.abs(player.x-x)>10.5||!project(p)||
              Math.abs(hit.x-position)>.86||Math.abs(hit.y-solarY-.095*Math.min(1,Math.abs(position)/travel))>.90)return false;
          demonstration=-1;invited=true;target=position;
          owner=id;from=hit.x;at=position;dragged=false;attention=4.5;return true;
        }
        if(id!==owner)return false;
        if(type==='move'&&project(p)){
          const delta=hit.x-from;
          if(Math.abs(delta)>.08)dragged=true;
          if(dragged){
            const value=clamp(at+delta,-travel,travel);
            target=Math.abs(value)<.36?0:value;
          }
        }
        if(type==='up'){
          // A tap only nudges the moon a little towards the sun; sliding it
          // there is the experiment. Released near the middle, it settles in.
          if(!dragged){target=Math.abs(position)<.6?0:position*.8;M.sfx('saturn-magnet');}
          else if(Math.abs(target)<.62)target=0;
          owner=null;
        }
        return true;
      }
      function update(dt,t) {
        attention=Math.max(0,attention-dt);
        if(owner!==null)attention=4.5;
        if(!invited&&Math.abs(player.x-x)<6.1){
          invited=true;demonstration=M.playGuideActive?-1:0;attention=2.1;
        }
        if(demonstration>=0){
          demonstration+=dt;
          // One short, silent slide shows the marble is movable, then hands
          // the experiment over without performing the eclipse for the child.
          const u=clamp(demonstration/1.85,0,1),swing=Math.sin(Math.PI*u);
          position=-travel+.50*swing*swing;
          if(u===1)demonstration=-1;
        }else{
          position=M.damp(position,target,owner!==null&&dragged?19:3.45,dt);
          if(Math.abs(position-target)<.002)position=target;
        }
        const ratio=Math.min(1,Math.abs(position)/travel);
        alignment=1-ease(clamp(Math.abs(position)/.98,0,1));
        const lower=-.72+.26*ratio*ratio;
        carriage.position.set(position,lower,0);
        moon.position.y=solarY-lower+.095*ratio;
        // The observation face acts as a sight glass. Keep the close and
        // far discs concentric when viewed from either end of the bridge.
        const cam=M.camera?.position;
        if(cam){
          const parallax=.505/(cam.z-z-.065);
          moon.position.x=(cam.x-x-position)*parallax*alignment;
          moon.position.y+=(cam.y-baseY-solarY)*parallax*alignment;
        }
        moon.scale.setScalar(1+.09*alignment);
        moon.rotation.y=position*.61+.025*Math.sin(t*.71);
        moon.rotation.z=.13+.046*position;
        const lit=1-.961*alignment;
        moonMat.color.setRGB(lit*.85+.009,lit*.91+.011,lit+.014);
        uniforms.moonX.value=position;uniforms.alignment.value=alignment;uniforms.seconds.value=t;
        const total=Math.abs(position)<.095;
        if(total&&!wasTotal){if(!seen)M.celebrate(x,baseY+1.2);seen=true;M.sfx('saturn-cradle');}
        wasTotal=total;
      }
      update(0,0);
      return {pointer,update,describe(step){if(seen||player.locked||Math.abs(player.x-x)>10.5)return false;moon.getWorldPosition(step.from);const cam=M.camera?.position,parallax=cam?.z ? .505/(cam.z-z-.065):0;step.to.set(cam?(cam.x-x)*parallax:0,solarY+(cam?cam.y-baseY-solarY:0)*parallax,.57);theatre.localToWorld(step.to);step.action='drag';step.progress=0;step.total=1;step.sourceIcon='moon';step.goalIcon='eclipse';return true;},help(){if(seen)return false;if(Math.abs(target)>.22||Math.abs(position)<.22)toggle();return true;},interact(){if(seen||Math.abs(player.x-x)>4.7)return false;toggle();return true;},
        get state(){return wasTotal?'total':alignment>.03?'partial':'open';},get seen(){return seen;},get watching(){return attention>0;},get moonPosition(){return x+position;}};
    }
    const eclipse=createEclipseTheatre(eclipseX);
    // The first armillary is also a free-play instrument. Ice beads turn
    // with the finger on a real tilted plane, then coast in either direction.
    const wheelX=137,orbitRadius=1.45*1.2;
    wheel.mobile.name='Halka oyuncağının dönen ekseni';
    const ballMaterial=metal(0xffc980,.34,.12);
    ballMaterial.emissive.setHex(0xf0ad62);ballMaterial.emissiveIntensity=.13;
    wheel.pea.material=ballMaterial;wheel.pea.scale.setScalar(.27);wheel.pea.name='Halka oyuncağının uydusu';
    const sphereRing=mesh(wheel.pea,new T.TorusGeometry(1.20,.07,8,44),mats.milk);
    sphereRing.rotation.set(.90,.10,.28);
    const beads=new T.InstancedMesh(shapes.stone,iceFacet,10);
    for(let i=0;i<10;i++){
      const theta=(i+.62)*TAU/10;
      dummy.position.set(Math.cos(theta)*orbitRadius,Math.sin(theta)*orbitRadius,.035);
      dummy.rotation.set(.55,theta*.45,theta);const sz=(i%3===0?.125:.072);
      dummy.scale.set(sz*1.24,sz,sz*.78);dummy.updateMatrix();beads.setMatrixAt(i,dummy.matrix);
    }
    wheel.mobile.add(beads);
    // A single bounded two-dimensional ribbon, curved by its shader.
    // No trail history, particle spawns, or new buffers while playing.
    const trailUniforms={amount:{value:.05},direction:{value:1},radius:{value:orbitRadius},phase:{value:0}};
    const trailMaterial=new T.ShaderMaterial({
      uniforms:trailUniforms,transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,blending:T.AdditiveBlending,
      vertexShader:`varying vec2 knot;uniform float amount,direction,radius;
      void main(){knot=uv;float tail=1.-uv.x;
       float a=-direction*tail*(.31+amount*4.7);
       float w=(uv.y-.5)*(.20+amount*.49)*(.47+.53*sin(3.14159*uv.x));
       float r=radius+w+amount*.46*sin(3.14159*tail)+.07*sin(a*3.)*tail;
       gl_Position=projectionMatrix*modelViewMatrix*vec4(cos(a)*r,sin(a)*r,.20+.13*sin(a*4.)*tail,1.);
      }`,
      fragmentShader:`varying vec2 knot;uniform float amount;
      void main(){float d=abs(knot.y-.5)*2.;
       float mist=(1.-smoothstep(.02,1.,d))*.48;
       float core=(1.-smoothstep(.01,.21,d))*.58;
       float alpha=(mist+core)*smoothstep(0.,.38,knot.x)*(.30+.70*knot.x)*(.33+.67*amount);
       vec3 col=mix(vec3(.12,.90,1.),vec3(1.,.70,.38),smoothstep(.68,.97,knot.x));
       gl_FragColor=vec4(col,alpha);
       #include <tonemapping_fragment>
       #include <colorspace_fragment>
      }`
    });
    const trail=mesh(wheel.mobile,new T.PlaneGeometry(1,1,64,1),trailMaterial);
    // Shader-expanded paths have their own local bounds, including the tail.
    const wheelBounds=new T.Sphere(new T.Vector3(),orbitRadius+1.45);
    trail.geometry.boundingSphere=wheelBounds;trail.name='Uydunun ışık izi';
    // Tiny stars peel off the outer edge of the trace while the moon turns.
    const sparks=new T.BufferGeometry(),phases=new Float32Array(20);
    for(let i=0;i<20;i++)phases[i]=(i+.5)/20;
    sparks.setAttribute('position',new T.BufferAttribute(new Float32Array(60),3));
    sparks.setAttribute('seed',new T.BufferAttribute(phases,1));
    const scintillation=new T.ShaderMaterial({uniforms:trailUniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      vertexShader:`attribute float seed;varying float light;uniform float phase,amount,direction,radius;
      void main(){float t=fract(seed+phase*.21),ang=-direction*t*(.43+4.55*amount);
        float r=radius+amount*(.45*sin(3.14159*t)+t*(.16+.59*fract(seed*34.7)));
        vec4 mv=modelViewMatrix*vec4(cos(ang)*r,sin(ang)*r,.20+.16*seed,1.);
        gl_Position=projectionMatrix*mv;gl_PointSize=clamp((63.+130.*seed)/max(6.,-mv.z),1.,13.);
        light=smoothstep(.20,.70,amount)*sin(t*3.14159)*(.58+.4*sin(phase*3.+seed*45.));
      }`,
      fragmentShader:`varying float light;void main(){vec2 p=abs(gl_PointCoord-.5)*2.;
        float star=max(0.,1.-length(p)*1.6)+pow(max(0.,1.-max(p.x,p.y)),2.)*pow(1.-min(p.x,p.y),9.);
        gl_FragColor=vec4(.60,.95,1.,star*light);
        #include <colorspace_fragment>
      }`
    });
    sparks.boundingSphere=wheelBounds;
    const twinkles=new T.Points(sparks,scintillation);wheel.mobile.add(twinkles);
    let wheelTurn=0,wheelAngle=0,spin=.20,shine=.07,spinPointer=null,dragAngle=0,lastX=0,lastY=0,lastStamp=0,dragDistance=0,jumpRose=false,wheelTurned=false;
    const wheelRay=new T.Raycaster(),wheelNdc=new T.Vector2(),wheelPlane=new T.Plane(),wheelLocal=new T.Vector3();
    const wheelInverse=new T.Matrix4(),wheelNormal=new T.Matrix3(),wheelOrigin=new T.Vector3(),wheelVector=new T.Vector3();
    function onRing(e,p){
      if(!M.camera)return false;
      if(e&&Number.isFinite(e.clientX)){
        wheelNdc.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);
        wheelRay.setFromCamera(wheelNdc,M.camera);
      }else{
        wheelRay.ray.origin.copy(M.camera.position);
        wheelRay.ray.direction.set(p.x,p.y,0).sub(M.camera.position).normalize();
      }
      // The outer frame gives a broad circular touch area. Project on that
      // face (not the narrow orbit ellipse) for an easy gesture from any angle.
      wheel.mount.updateWorldMatrix(true,false);
      wheelOrigin.setFromMatrixPosition(wheel.mount.matrixWorld);
      wheelNormal.getNormalMatrix(wheel.mount.matrixWorld);
      wheelVector.set(0,0,1).applyMatrix3(wheelNormal).normalize();
      wheelPlane.setFromNormalAndCoplanarPoint(wheelVector,wheelOrigin);
      if(!wheelRay.ray.intersectPlane(wheelPlane,wheelLocal))return false;
      wheelInverse.copy(wheel.mount.matrixWorld).invert();wheelLocal.applyMatrix4(wheelInverse);
      return true;
    }
    // A tap gives a small push; turning it about half way round (by finger or
    // a flick that coasts) wakes the ring model. Help/keyboard push harder.
    function impulse(direction,strong=true){
      const sign=direction||1;spin=sign*Math.min(7,Math.max(strong?4.3:2.2,Math.abs(spin)+(strong?2.8:1.2)));
      shine=1;if(strong)wheelTurned=true;M.sfx('ring');
    }
    function addTurn(a){if(wheelTurned)return;const before=wheelTurn;wheelTurn+=a;if(Math.floor(before/1.05)<Math.floor(wheelTurn/1.05))M.sfx('saturn-magnet');if(wheelTurn>3.0){wheelTurned=true;shine=1;M.sfx('saturn-cradle');M.celebrate(wheelX,ground(wheelX)+3.2);}}
    function grabWheel(id,e,p){
      if(spinPointer!==null||Math.abs(player.x-wheelX)>7.8||!onRing(e,p))return false;
      if(wheelLocal.x*wheelLocal.x+wheelLocal.y*wheelLocal.y>3.0*3.0)return false;
      spinPointer=id;lastX=wheelLocal.x;lastY=wheelLocal.y;dragAngle=Math.atan2(lastY,lastX);
      dragDistance=0;lastStamp=e?.timeStamp??performance.now();shine=.79;spin=0;return true;
    }
    function dragWheel(e,p){
      if(!onRing(e,p))return;
      const x=wheelLocal.x,y=wheelLocal.y,angle=Math.atan2(y,x),dx=x-lastX,dy=y-lastY;
      let change=angle-dragAngle;if(change>Math.PI)change-=TAU;if(change<-Math.PI)change+=TAU;
      // Across the central ice piece a straight swipe turns the same wheel.
      if(x*x+y*y<.52||lastX*lastX+lastY*lastY<.52)change=-dx*.94+dy*.36;
      const stamp=e?.timeStamp??performance.now(),dt=clamp((stamp-lastStamp)/1000,.012,.12);
      dragDistance+=Math.hypot(dx,dy);change=clamp(change,-.85,.85);wheelAngle+=change;addTurn(Math.abs(change));
      spin=M.lerp(spin,clamp(change/dt,-8.7,8.7),.54);shine=Math.min(1,shine+Math.abs(change)*.48);
      lastX=x;lastY=y;dragAngle=angle;lastStamp=stamp;
    }
    function releaseWheel(e,cancelled){
      if(spinPointer===null)return;
      if(cancelled){spin=0;}
      else if(dragDistance<.14){impulse(lastX<-.15?-1:1,false);}
      else if((e?.timeStamp??performance.now())-lastStamp>180){spin*=.25;}
      spinPointer=null;
    }
    function animateWheel(dt,time){
      if(spinPointer===null){
        const quiet=Math.abs(spin)<.24;
        spin=quiet?M.damp(spin,.185,.52,dt):spin*Math.exp(-.79*dt);
        wheelAngle=(wheelAngle+spin*dt)%TAU;if(Math.abs(spin)>1.2)addTurn(Math.abs(spin*dt)*.8);
      }
      shine=M.damp(shine,Math.min(1,.065+Math.abs(spin)*.14),2.1,dt);
      wheel.mobile.rotation.z=wheelAngle;
      wheel.core.rotation.y=.6+.33*wheelAngle;wheel.core.rotation.z=.27+.105*shine*Math.sin(time*2.2);
      wheel.pea.position.z=.09+.13*shine*Math.sin(wheelAngle*2.2);
      wheel.pea.scale.setScalar(.27+.045*shine);ballMaterial.emissiveIntensity=.12+.40*shine;
      wheel.platter.rotation.x=.85+.11*shine*Math.cos(wheelAngle);
      trailUniforms.amount.value=shine;trailUniforms.phase.value=time;twinkles.visible=shine>.20;
      if(Math.abs(spin)>.16)trailUniforms.direction.value=Math.sign(spin);
    }
    // Destination silhouettes viewed across the track: folded copper petals
    // and a cool prismatic window catch the light behind the landing capsule.
    for(const span of [[5.1,1.15],[170,.98],[296,1.1]]){
      const x=span[0],s=span[1],y=ground(x),z=-5.8;
      for(const side of [-1,1]){
        const tip=x+side*2.4*s;
        beam(x+side*1.05*s,y-.9,z,tip,y+2.87*s,z-.36,.15*s,mats.petrol);
        beam(tip,y+2.87*s,z-.36,x+side*1.1*s,y+3.45*s,z-.59,.10*s,mats.brass);
        piece(shapes.sphere,mats.milk,tip,y+2.87*s,z-.36,.12,.12,.12);
        const cellx=x+side*1.78*s;
        piece(shapes.box,mats.brass,cellx,y+1.61*s,z-.29,.49*s,2.28*s,.13,.13,0,-side*.27);
        piece(shapes.box,mats.petrol,cellx,y+1.61*s,z-.18,.38*s,2.09*s,.095,.13,0,-side*.27);
        for(let n=0;n<5;n++)piece(shapes.box,mats.steel,cellx+side*(n-2)*.098*s,y+(1.60+(n-2)*.36)*s,z-.10,.37*s,.024,.028,.13,0,-side*.27);
      }
      piece(shapes.cyl,mats.steel,x,y-.12,z,1.5*s,.20,1.18*s);
    }
    function housing(x,wide){
      const y=ground(x);
      piece(shapes.cyl,mats.ink,x,y+.11,-.77,wide,.23,1.13);
      piece(shapes.cyl,mats.porcelain,x,y+.25,-.77,wide*.95,.13,1.03);
      piece(shapes.cyl,mats.brass,x,y+.34,-.77,wide*.75,.07,.84);
    }
    housing(harpX,2.1);housing(dockX,1.04);housing(eyeX,1.14);
    const harpY=ground(harpX),dockY=ground(dockX),eyeY=ground(eyeX);
    // An actual hanging ice instrument. Three resonators have distinct
    // silhouettes as well as colours, and visibly build a little ring model.
    for(const off of [-4.18,4.18]){
      beam(harpX+off,harpY,-1.15,harpX+off*.90,harpY+4.05,-1.15,.12,mats.brass);
      piece(shapes.sphere,mats.porcelain,harpX+off*.90,harpY+4.05,-1.15,.22,.22,.22);
    }
    beam(harpX-3.76,harpY+4.05,-1.15,harpX+3.76,harpY+4.05,-1.15,.095,mats.steel);
    // The instrument is held by two curving, nested tuning bows.
    for(const side of [-1,1]){
      const postX=harpX+side*3.77;
      const hook=mesh(root,new T.TorusGeometry(.28,.047,8,32),mats.brass,postX,harpY+4.07,-1.10);
      hook.rotation.z=.33;
      for(const offset of [0,.14]){
        const bow=[new T.Vector3(postX,harpY+3.82-offset,-1.20),new T.Vector3(harpX+side*3.25,harpY+4.25-offset,-1.28),new T.Vector3(harpX+side*2.07,harpY+4.45-offset,-1.30),new T.Vector3(harpX+side*.34,harpY+4.12-offset,-1.29)];
        mesh(root,new T.TubeGeometry(new T.CatmullRomCurve3(bow),20,offset?.023:.048,7,false),offset?mats.steel:mats.brass);
      }
    }
    // A graduated rank of metal pipes opens into bell mouths. Together with
    // the three moving glass bells it reads as an instrument before any touch.
    for(let i=0;i<10;i++){
      const side=i<5?-1:1,n=i%5,px=harpX+side*(2.08+n*.30),py=harpY+.25,pz=-1.86;
      const height=.58+.19*n;
      piece(shapes.cyl,mats.petrol,px,py+height*.5,pz,.095,height,.095);
      piece(shapes.cyl,mats.brass,px,py+height-.07,pz,.115,.13,.115);
      piece(shapes.cyl,mats.ink,px,py+height+.002,pz,.075,.015,.075);
      piece(shapes.cyl,mats.steel,px,py+.14,pz,.11,.055,.11);
    }
    const fleck=document.createElement('canvas');fleck.width=fleck.height=32;
    const fc=fleck.getContext('2d'),falloff=fc.createRadialGradient(16,16,0,16,16,16);
    falloff.addColorStop(0,'#fff');falloff.addColorStop(.29,'rgba(255,255,255,1)');falloff.addColorStop(.59,'rgba(255,255,255,.61)');falloff.addColorStop(1,'rgba(255,255,255,0)');
    fc.fillStyle=falloff;fc.fillRect(0,0,32,32);const grainMap=new T.CanvasTexture(fleck);
    // Frozen flower buds wait in real pots. Their own touch melts the ice
    // and unfolds the petals; a short sparkle joins the neighbouring flower.
    function createIceGarden() {
      const xs=[163.1,166.8,170.5],hues=[0x73eee9,0xffcd82,0xe6b2fa];
      const blooms=[],perFlight=14,positions=new Float32Array(xs.length*perFlight*3);
      const packetColors=new Float32Array(positions.length);
      const potGeometry=new T.LatheGeometry([[.21,0],[.30,.10],[.35,.42],[.39,.45],[.39,.51],[.30,.51],[.27,.12],[.18,.06]].map(v=>new T.Vector2(...v)),20);
      const leafPaint=metal(0x669a7b,.76,.02),soilPaint=metal(0x58454b,.95,.01),petalPose=new T.Object3D();
      xs.forEach((x,i)=>{
        const y=ground(x),z=-1.4;
        piece(potGeometry,mats.coral,x,y+.10,z,1,1,1);
        piece(shapes.cyl,soilPaint,x,y+.57,z,.29,.035,.29);
        beam(x,y+.58,z,x,y+1.30,z,.045,leafPaint);
        for(const side of [-1,1]){
          const leaf=mesh(root,shapes.sphere,leafPaint,x+side*.20,y+.93,z+.025);leaf.scale.set(.28,.095,.065);leaf.rotation.z=side*.52;
        }
        const flower=group(root,x,y+1.35,z),petalPaint=metal(hues[i],.56,.035),petals=new T.InstancedMesh(shapes.sphere,petalPaint,7);
        flower.name='Halka çiçeği '+(i+1);petals.instanceMatrix.setUsage(T.DynamicDrawUsage);petals.boundingSphere=new T.Sphere(new T.Vector3(),1.05);flower.add(petals);
        const heart=mesh(flower,shapes.sphere,mats.brass,0,.03,.16);heart.scale.set(.17,.17,.10);
        const icePaint=new T.MeshStandardMaterial({color:0xc8f4ff,transparent:true,opacity:.42,roughness:.15,metalness:.08,depthWrite:false});
        const ice=mesh(root,shapes.sphere,icePaint,x,y+1.55,z+.015);ice.scale.set(.47,.72,.36);ice.name='Dokununca çözülen çiçek buzu '+i;
        const seams=group(ice);for(const a of [-.42,.38]){const seam=mesh(seams,shapes.rod,mats.porcelain,Math.sin(a)*.25,.04,.91);seam.scale.set(.012,.72,.012);seam.rotation.z=a;}
        blooms.push({x,y,flower,petals,heart,ice,icePaint,tint:new T.Color(hues[i]),opened:false,openness:0,age:3,wave:0,receiver:i,melt:0});
      });
      const g=new T.BufferGeometry(),attr=new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage);
      g.setAttribute('position',attr);
      g.setAttribute('color',new T.BufferAttribute(packetColors,3).setUsage(T.DynamicDrawUsage));
      const glitter=new T.Points(g,new T.PointsMaterial({vertexColors:true,size:.18,map:grainMap,
        transparent:true,opacity:.94,depthWrite:false,blending:T.AdditiveBlending}));
      // Spark positions move between world-space flowers. Keep distant bursts cullable.
      g.boundingSphere=new T.Sphere(new T.Vector3(xs[1],3,-1.4),7.3);root.add(glitter);glitter.visible=false;
      let collected=0;
      function bloom(i) {
        const b=blooms[i];
        if(b.age<.27)return true;
        if(!b.opened){b.opened=true;collected++;}
        b.age=0;b.wave=1;b.receiver=i===0?1:i===2?1:player.facing<0?0:2;
        M.sfx('saturn-chime-'+i);
        return true;
      }
      // A warm finger resting (or rubbing) on the frozen bud melts its ice
      // in about a second; lifting early keeps the melt already made.
      let melting=null;
      function touch(p,id) {
        if(player.locked)return false;
        for(let i=0;i<blooms.length;i++){
          const b=blooms[i];if(b.opened)continue; // an open flower must not swallow a tap meant for the taxi beside it
          if(Math.abs(player.x-b.x)<14&&Math.abs(p.x-b.x)<1.55&&Math.abs(p.y-b.flower.position.y)<1.5){
            melting={i,id,x:p.x,y:p.y};b.melt=Math.max(b.melt,.12);b.wave=.5;M.sfx('saturn-chime-'+i);return true;
          }
        }
        return false;
      }
      function rub(type,p,id){
        if(!melting||melting.id!==id)return;
        if(type==='move'&&p){const b=blooms[melting.i];b.melt=Math.min(1,b.melt+Math.hypot(p.x-melting.x,p.y-melting.y)*.16);melting.x=p.x;melting.y=p.y;}
        else if(type==='up'||type==='cancel')melting=null;
      }
      function interact() {
        if(player.locked)return false;
        const i=blooms.findIndex(b=>Math.abs(player.x-b.x)<1.75);
        return i>=0&&bloom(i);
      }
      function update(dt,time) {
        let count=0;
        if(melting){const b=blooms[melting.i];if(b.opened)melting=null;else{b.melt=Math.min(1,b.melt+dt/1.0);if(b.melt>=1){melting=null;bloom(blooms.indexOf(b));}}}
        for(let i=0;i<blooms.length;i++){
          const b=blooms[i];
          // The crystal opens only after its own visible touch.
          const previous=b.age;b.age+=dt;b.wave=Math.max(0,b.wave-dt*1.05);
          b.openness=M.damp(b.openness,b.opened?1:0,3.8,dt);
          const open=b.openness,sway=Math.sin(time*1.7+i),head=b.flower;
          head.position.y=b.y+1.35+.12*open+.025*sway+b.wave*.07;
          head.rotation.set(.035*sway,.04*Math.sin(time*.86+i),.045*Math.sin(time*.69+i));
          for(let j=0;j<7;j++){const angle=M.lerp(.16*Math.sin(j*2.4),j*TAU/7,open);petalPose.position.set(-Math.sin(angle)*.34,Math.cos(angle)*.34-.08,.045*Math.cos(j*2.4)*(1-open));petalPose.rotation.set(0,0,angle);petalPose.scale.set(.21,.47,.105);petalPose.updateMatrix();b.petals.setMatrixAt(j,petalPose.matrix);}b.petals.instanceMatrix.needsUpdate=true;
          b.heart.scale.setScalar(.10+.07*open);b.heart.position.y=.30*(1-open);
          const m=b.opened?0:b.melt,quiver=m>0&&!b.opened?.025*Math.sin(time*30):0;b.ice.visible=open<.93;b.icePaint.opacity=.42*(1-open)*(1-.55*m);b.ice.scale.set((.47+open*.16)*(1-.38*m)+quiver,(.72+open*.10)*(1-.42*m),(.36+open*.10)*(1-.38*m));b.ice.position.y=b.y+1.55-.18*m;
          if(b.age>=1.55)continue;
          const receiver=blooms[b.receiver];
          if(previous<1.07&&b.age>=1.07)receiver.wave=.72;
          for(let j=0;j<perFlight;j++){
            const progress=(b.age-j*.027)/1.07;
            if(progress<0||progress>=1)continue;
            const u=ease(progress),arc=Math.sin(Math.PI*progress),a=j*2.4+progress*6;
            positions[count*3]=M.lerp(b.x,receiver.x,u)+.13*arc*Math.cos(a);
            positions[count*3+1]=M.lerp(head.position.y,receiver.flower.position.y,u)+arc*(1.35+.20*Math.sin(a));
            positions[count*3+2]=-1.26+.22*arc*Math.sin(a);
            b.tint.toArray(packetColors,count*3);
            count++;
          }
        }
        glitter.visible=count>0;
        if(count){g.setDrawRange(0,count);attr.needsUpdate=true;g.attributes.color.needsUpdate=true;}
      }
      update(0,0);
      const lessons=blooms.map((b,i)=>({id:'saturn-ice-flower-'+i,x:b.x,y:b.y,goal:'flowers',sourceIcon:'bud',range:14,completed:()=>b.opened,enabled:()=>!player.locked,describe(step){if(b.opened||player.locked||Math.abs(player.x-b.x)>=14)return false;b.flower.localToWorld(step.from.set(0,.30*(1-b.openness),.15));step.to.copy(step.from);step.action='press';step.progress=0;step.total=1;step.sourceIcon='bud';step.goalIcon='flowers';return true;}}));
      return {lessons,touch,rub,interact,update,help(){const i=blooms.findIndex(b=>!b.opened);return i>=0&&bloom(i);},park(){if(collected===3||player.locked||Math.abs(player.x-xs[1])>=6.6)return;const parkX=player.x>168.2?168.65:164.95;M.parkForActivity(parkX,parkX-2.95,1);M.frameActivity(xs[0]-4.2,xs[2]+2.0,ground(xs[1])+1.75,1.20);},get collected(){return collected;},get nextX(){return blooms.find(b=>!b.opened)?.x??null;}};
    }
    const garden=createIceGarden();
    const harp=[],offsets=[-2.48,0,2.48],heights=[2.34,2.62,2.32],moonHeights=[3.55,3.82,3.55],moonLights=[];
    const moonOutline=new T.Shape();moonOutline.moveTo(.14,.31);moonOutline.absarc(0,0,.34,1.146,5.137,false);moonOutline.quadraticCurveTo(-.22,0,.14,.31);
    const moonGeometry=new T.ExtrudeGeometry(moonOutline,{depth:.07,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:1,steps:1,curveSegments:18});
    const moonCord=offsets.map((off,i)=>new T.Vector3(harpX+off*.64,harpY+moonHeights[i]+.40,-.75));moonCord.unshift(new T.Vector3(harpX-3.50,harpY+4.0,-.75));moonCord.push(new T.Vector3(harpX+3.50,harpY+4.0,-.75));
    mesh(root,new T.TubeGeometry(new T.CatmullRomCurve3(moonCord),32,.023,5,false),mats.brass);
    for(let i=0;i<3;i++){const material=glow(0x526477),moon=mesh(root,moonGeometry,material,harpX+offsets[i]*.64,harpY+moonHeights[i],-.70);moon.name='Çanla yanan ay lambası '+i;moonLights.push(moon);beam(moon.position.x,moon.position.y+.31,-.65,moon.position.x,moon.position.y+.40,-.65,.02,mats.brass);}
    const chimeGeometry=new T.LatheGeometry([[.04,.58],[.16,.53],[.25,.37],[.30,.08],[.44,-.24],[.59,-.36],[.58,-.44],[.49,-.43],[.34,-.22],[.23,.10],[.18,.36],[.04,.46]].map(v=>new T.Vector2(...v)),28);

    offsets.forEach((off,i)=>{
      const x=harpX+off,y=harpY+heights[i];
      beam(x,harpY+4.06,-1.15,x,y+.42,-.65,.035,mats.brass);
      const hanger=group(root,x,y+.54,-.58),gem=group(hanger,0,-.54,0);
      const shell=mesh(gem,chimeGeometry,metal([0xc99561,0xc4b485,0x7aa9a3][i],.34,.50));shell.name='Asılı çan '+i;const clapper=fit(gem,shapes.sphere,mats.brass,0,-.49,.08,.12,.17,.12);fit(gem,shapes.rod,mats.ink,0,-.19,.05,.024,.58,.024);
      const cap=mesh(gem,shapes.cyl,mats.brass,0,.49,0);cap.scale.set(.13,.14,.13);
      const ang=mesh(gem,shapes.ring,mats.brass,0,.37,0);ang.scale.set(.36,.36,.36);ang.rotation.x=1.1;ang.rotation.z=.18;
      const rim=fit(gem,shapes.ring,mats.brass,0,-.40,0,.57,.57,.57);rim.rotation.x=Math.PI*.5;
      const pump=group(root,harpX,harpY+1.32,-.74);pump.visible=false;
      // Twelve notes ripple down a physical, arcing string to the ring model.
      const wavePath=new T.CatmullRomCurve3([new T.Vector3(off,heights[i]-1.32,.12),new T.Vector3(off*.9,heights[i]-.65,.20),new T.Vector3(off*.72,moonHeights[i]-1.65,.10),new T.Vector3(off*.64,moonHeights[i]-1.32,.04)]);
      const pathPos=new Float32Array(14*3),pathGeometry=new T.BufferGeometry();
      pathGeometry.setAttribute('position',new T.BufferAttribute(pathPos,3).setUsage(T.DynamicDrawUsage));
      const pathColor=new T.PointsMaterial({size:.13,map:grainMap,color:mats.shine[i].color,transparent:true,opacity:1,depthWrite:false,blending:T.AdditiveBlending});
      const sparkle=new T.Points(pathGeometry,pathColor);sparkle.frustumCulled=false;pump.add(sparkle);
      const mallet=group(root,x+.48,y-.68,-.15);mallet.rotation.z=-.42;
      fit(mallet,shapes.rod,mats.brass,0,-.10,0,.038,.76,.038);
      fit(mallet,shapes.sphere,mats.coral,0,.31,0,.19,.14,.14);
      harp.push({x,y,gem,hanger,ang,mallet,hit:false,energy:0,pump,wavePath,pathGeometry,pathPos,pathColor});
    });
    piece(shapes.cyl,mats.petrol,harpX,harpY+.72,-.76,.22,.79,.22);
    const globeSkin=metal(0xffe7c3,.63,.04);globeSkin.map=skyBody.userData.atlas;
    piece(shapes.sphere,globeSkin,harpX,harpY+1.32,-.74,.59,.56,.59,.14,.33,.18);
    piece(shapes.cyl,mats.brass,harpX,harpY+.43,-.76,.46,.17,.44);
    piece(shapes.cyl,mats.porcelain,harpX,harpY+.47,-.76,.35,.21,.35);
    const noteHead=new T.Vector3();
    const toyRings=[];
    for(let i=0;i<3;i++){
      const ring=mesh(root,new T.TorusGeometry(.73+i*.22,.037,7,58),mats.shine[i],harpX,harpY+1.3,-.74);
      ring.rotation.set(1.045,.17,.21);ring.visible=false;toyRings.push(ring);
    }
    // Bilbo's sample scout. A paw-shaped launch pad sends it from its
    // charging cradle to actual pieces of ice, one short round trip per touch.
    const scout=group(root,dockX,dockY+1.48,-.60);
    scout.name='Bilbo’nun örnek toplayıcı sondası';
    function fit(parent,geo,mat,x,y,z,sx,sy=sx,sz=sx){
      const o=mesh(parent,geo,mat,x,y,z);o.scale.set(sx,sy,sz);return o;
    }
    // A lathed pressure vessel, integrated collar, binocular optics and
    // articulated sampler. The front-facing irises turn toward each specimen.
    const scoutShell=new T.LatheGeometry([[.08,-.29],[.29,-.27],[.43,-.15],[.47,-.03],[.46,.13],[.38,.25],[.22,.32],[.06,.34]].map(([r,y])=>new T.Vector2(r,y)),40);
    const hull=mesh(scout,scoutShell,mats.porcelain);hull.scale.set(1.25,1.08,.91);hull.castShadow=true;
    fit(scout,shapes.cyl,mats.brass,0,-.08,0,.57,.074,.425);
    fit(scout,shapes.cyl,mats.petrol,0,-.16,0,.483,.12,.38);
    const visor=fit(scout,shapes.sphere,mats.ink,0,.066,.30,.43,.208,.17);
    const pupils=[];
    for(const side of [-1,1]){
      const eye=group(scout,side*.204,.078,.441);
      fit(eye,shapes.ring,mats.brass,0,0,0,.119,.125,.062);
      fit(eye,shapes.sphere,mats.light,0,0,.01,.100,.109,.044);
      const pupil=fit(eye,shapes.sphere,mats.petrol,0,-.005,.053,.046,.059,.019);pupils.push(pupil);
      fit(eye,shapes.sphere,mats.milk,-.025,.032,.068,.021,.025,.008);
    }
    const aerial=group(scout,-.19,.28,-.12);aerial.rotation.z=.32;
    fit(aerial,shapes.rod,mats.brass,0,.21,0,.019,.48,.019);
    const aerialLamp=fit(aerial,shapes.sphere,mats.milk,0,.45,0,.060);
    const wings=[],claws=[];
    for(const sign of [-1,1]){
      const pivot=group(scout,sign*.48,.07,-.03);
      fit(pivot,shapes.sphere,mats.brass,0,0,0,.13);
      const arm=group(pivot,0,0,0);wings.push(arm);
      const panel=fit(arm,shapes.box,mats.brass,sign*.39,.036,0,.72,.09,.46);
      panel.rotation.z=sign*.16;
      const cells=fit(arm,shapes.box,photovoltaic,sign*.40,.083,.027,.64,.069,.40);cells.rotation.z=sign*.16;
      fit(arm,shapes.sphere,mats.coral,sign*.74,.091,0,.105,.090,.23);
      const knuckle=group(scout,sign*.29,-.20,.135);claws.push(knuckle);
      fit(knuckle,shapes.sphere,mats.brass,0,0,0,.108);
      const rod=fit(knuckle,shapes.rod,mats.petrol,sign*.067,-.15,0,.056,.34,.056);rod.rotation.z=sign*.39;
      fit(knuckle,shapes.sphere,mats.steel,sign*.13,-.30,0,.080);
      const jaw=fit(knuckle,shapes.rod,mats.brass,sign*.065,-.38,.015,.044,.22,.044);jaw.rotation.z=-sign*.61;
      fit(knuckle,shapes.sphere,mats.light,0,-.468,.02,.052,.050,.07);
    }
    const cradle=mesh(root,shapes.ring,mats.light,dockX,dockY+.80,-.58);cradle.rotation.x=1.24;cradle.scale.setScalar(.62);
    piece(shapes.cyl,mats.ink,dockX,dockY+.58,-.58,.37,.48,.37);
    const sampleOffsets=[[-2.65,2.95],[.55,3.75],[3.15,2.80]],samples=[];
    const specimenGlass=new T.MeshStandardMaterial({color:0xb7ecf2,transparent:true,opacity:.23,roughness:.19,metalness:.08,side:T.FrontSide,depthWrite:false});
    const jarGlint=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.28,.09,.33),new T.Vector3(-.34,.37,.38),new T.Vector3(-.32,.72,.35)]),10,.016,5,false);
    const jarWall=new T.LatheGeometry([[.03,.015],[.49,.015],[.58,.08],[.58,.91],[.53,1.01],[.49,1.06],[.49,1.13],[.54,1.13],[.54,1.18],[.47,1.18],[.45,1.07],[.52,.94],[.52,.13],[.42,.075],[.03,.075]].map(p=>new T.Vector2(...p)),28);
    piece(shapes.box,mats.petrol,dockX,dockY+.83,.15,5.0,.21,1.33);
    for(const side of[-1,1]){piece(shapes.box,mats.porcelain,dockX+side*2.29,dockY+.42,-.19,.25,.84,.38);piece(shapes.box,mats.brass,dockX+side*2.29,dockY+.09,-.19,.66,.15,.68);}
    M.WorkshopArt.sign(root,['jar'],dockX+4.25,dockY+1.6,-1.0,1.4,1.4);

    // Three open specimen berths, with matching colours and an actual ghost
    // outline for each unique shape. Touch targets stay broad in portrait.
    for(let i=0;i<sampleOffsets.length;i++){
      const x=dockX+sampleOffsets[i][0],y=dockY+sampleOffsets[i][1],g=group(root,x,y,-.48);
      const sample=mesh(g,specimenGeo[i],specimenMats[i]);sample.scale.setScalar(1.16);sample.rotation.set(.06,.18,(i-1)*.11);
      const jarX=dockX+(i-1)*1.67,jarY=dockY+1.62;
      piece(shapes.cyl,mats.ink,jarX,dockY+1.03,.11,.68,.19,.55);
      for(const side of [-1,1]){
        const xx=jarX+side*.49;
        beam(xx,dockY+1.19,.21,jarX+side*.47,dockY+1.44,.18,.045,mats.steel);
        piece(shapes.sphere,mats.shine[i],xx,dockY+1.42,.19,.07,.064,.07);
      }
      piece(shapes.cyl,mats.brass,jarX,dockY+1.14,.11,.60,.075,.50);
      piece(shapes.cyl,mats.porcelain,jarX,dockY+1.26,.11,.52,.18,.43);
      piece(shapes.cyl,mats.petrol,jarX,dockY+1.37,.11,.43,.050,.36);
      const socketRing=mesh(root,shapes.ring,mats.shine[i],jarX,dockY+1.41,.11);socketRing.scale.set(.47,.38,.47);socketRing.rotation.x=1.51;
      const lipMaterial=new T.LineBasicMaterial({color:[0x97f6f5,0xffda8d,0xf4b6ec][i],transparent:true,opacity:.38,depthWrite:false});
      const outline=new T.LineSegments(new T.EdgesGeometry(specimenGeo[i],26),lipMaterial);
      outline.position.set(jarX,jarY+.015,.11);outline.scale.setScalar(.73);root.add(outline);
      const glass=mesh(root,jarWall,specimenGlass,jarX,dockY+1.14,.11);glass.renderOrder=2;piece(jarGlint,mats.porcelain,jarX,dockY+1.30,.11,1.45,1.10,1.45);
      const lid=group(root,jarX,dockY+2.35,-.34);const lidFace=mesh(lid,shapes.cyl,mats.gem[i],0,0,.39);lidFace.scale.set(.56,.07,.56);lid.rotation.x=1.62;lid.visible=false;
      const jarMark=group(root,jarX,dockY+.66,.84);fit(jarMark,shapes.sphere,mats.porcelain,0,0,0,.40,.30,.035);fit(jarMark,specimenGeo[i],specimenMats[i],0,-.01,.055,.30,.30,.045);weldToy(jarMark);
      samples.push({x,y,g,jarX,jarY,collected:false,outline,lipMaterial,socketRing,lid});
    }
    const trailCount=18,filingDots=new Float32Array(trailCount*3),filingG=new T.BufferGeometry();
    filingG.setAttribute('position',new T.BufferAttribute(filingDots,3).setUsage(T.DynamicDrawUsage));
    const filingMat=new T.PointsMaterial({color:0xffe5a0,map:grainMap,size:.10,transparent:true,opacity:.72,depthWrite:false,blending:T.AdditiveBlending});
    const filingLine=new T.Points(filingG,filingMat);filingLine.frustumCulled=false;filingLine.visible=false;root.add(filingLine);
    // Intake hoods and the listening dish give the second station its own silhouette.
    piece(shapes.cyl,mats.petrol,dockX-4.2,dockY+.85,-2.4,.19,1.8,.19);
    piece(shapes.sphere,mats.porcelain,dockX-4.2,dockY+1.9,-2.4,.90,.22,.58,.3,0,.74);
    beam(dockX-4.2,dockY+1.93,-2.35,dockX-4.78,dockY+2.42,-2.1,.045,mats.brass);
    const paw=group(root,dockX-2.9,dockY+1.23,-.20);paw.visible=false;
    const plate=mesh(paw,shapes.cyl,mats.ink);plate.scale.set(.66,.15,.66);plate.rotation.x=Math.PI*.5;
    const pawMat=glow(0xffd48a);finish.set(pawMat,lamp);
    function pawDot(x,y,rx,ry,tilt=0){const dot=mesh(paw,shapes.sphere,pawMat,x,y,.13);dot.scale.set(rx,ry,.075);dot.rotation.z=tilt;}
    pawDot(0,-.12,.24,.17);pawDot(-.27,.12,.085,.128,.34);pawDot(-.09,.24,.09,.14,.13);pawDot(.10,.24,.09,.14,-.12);pawDot(.28,.12,.082,.13,-.36);
    beam(dockX-2.9,dockY,-.27,dockX-2.9,dockY+1.16,-.27,.13,mats.steel);
    // Brass observatory camera on its fork mount. A print emerges through
    // the slot after the child releases the shutter.
    for(const dx of [-.75,.75]){
      beam(eyeX+dx,eyeY+.3,-.6,eyeX+dx*.79,eyeY+1.7,-.6,.13,mats.brass);
    }
    const lens=group(root,eyeX,eyeY+1.87,-.68);
    // Rounded enamel camera: soft bevelled body, brass bands, stepped lens
    // barrel, round coral shutter button, a little viewfinder and a star badge.
    const camShape=new T.Shape(),cw=.85,ch=.61,cr=.2;
    camShape.moveTo(-cw+cr,-ch);camShape.lineTo(cw-cr,-ch);camShape.quadraticCurveTo(cw,-ch,cw,-ch+cr);camShape.lineTo(cw,ch-cr);camShape.quadraticCurveTo(cw,ch,cw-cr,ch);
    camShape.lineTo(-cw+cr,ch);camShape.quadraticCurveTo(-cw,ch,-cw,ch-cr);camShape.lineTo(-cw,-ch+cr);camShape.quadraticCurveTo(-cw,-ch,-cw+cr,-ch);
    const camG=new T.ExtrudeGeometry(camShape,{depth:.72,bevelEnabled:true,bevelThickness:.09,bevelSize:.07,bevelSegments:3,curveSegments:6});camG.center();
    const body=mesh(lens,camG,mats.porcelain);
    for(const by of [-.36,.36]){const band=mesh(lens,shapes.box,mats.brass,0,by,0);band.scale.set(1.86,.07,.96);}
    const barrelG=new T.LatheGeometry([[.50,0],[.50,.08],[.44,.10],[.44,.22],[.40,.24],[.40,.34],[.36,.36],[0,.36]].map(([r,y])=>new T.Vector2(r,y)),32);
    const cap=mesh(lens,barrelG,mats.petrol,.05,.06,.42);cap.rotation.x=Math.PI/2;
    const brassBarrel=mesh(lens,shapes.ring,mats.brass,.05,.06,.53);brassBarrel.scale.setScalar(.47);
    const glass=mesh(lens,shapes.sphere,mats.gem[0],.05,.06,.76);glass.scale.set(.36,.36,.10);
    const frontRing=mesh(lens,shapes.ring,mats.milk,.05,.06,.80);frontRing.scale.setScalar(.39);
    const finder=mesh(lens,shapes.cyl,mats.ink,.55,.50,.10);finder.scale.set(.17,.12,.17);finder.rotation.x=Math.PI/2;
    const finderRim=mesh(lens,shapes.ring,mats.brass,.55,.50,.17);finderRim.scale.setScalar(.18);
    const starBadgeShape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.42:1;i?starBadgeShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starBadgeShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
    const starBadgeG=new T.ExtrudeGeometry(starBadgeShape,{depth:.2,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:1});starBadgeG.center();
    const badge=mesh(lens,starBadgeG,mats.brass,-.58,-.18,.47);badge.scale.setScalar(.11);
    const buttonG=new T.LatheGeometry([[.0,.14],[.12,.13],[.18,.08],[.20,0],[0,0]].map(([r,y])=>new T.Vector2(r,y)),20);
    piece(buttonG,mats.coral,eyeX-.55,eyeY+2.60,-.69,1,1,1);
    piece(shapes.cyl,mats.brass,eyeX-.55,eyeY+2.585,-.69,.23,.03,.23);
    piece(shapes.box,mats.ink,eyeX,eyeY+.75,-.47,1.75,.21,.65);
    const photo=group(root,eyeX,eyeY+.81,.21);
    const border=mesh(photo,shapes.box,mats.porcelain);border.scale.set(1.85,1.45,.095);
    const paper=mesh(photo,shapes.box,mats.ink,0,.08,.056);paper.scale.set(1.61,1.05,.025);
    const stamp=mesh(photo,shapes.sphere,mats.gem[1],0,.075,.085);stamp.scale.set(.35,.32,.035);
    const orbitStamp=mesh(photo,shapes.ring,mats.milk,0,.075,.14);orbitStamp.scale.set(.64,.15,.2);orbitStamp.rotation.z=.25;
    photo.visible=false;
    // Miniature versions of actual world objects are used on the return taxi
    // and at the family garden. A child can recognise a missing experience
    // from its silhouette, without a word, colour code or narrated instruction.
    function discoveryGlyph(parent,kind,size=1){
      const glyph=group(parent);glyph.scale.setScalar(size);
      function bit(geometry,mat,x,y,z,sx,sy=sx,sz=sx){const o=mesh(glyph,geometry,mat,x,y,z);o.scale.set(sx,sy,sz);return o;}
      if(kind==='harp'){
        bit(shapes.box,mats.brass,0,.43,0,1.03,.07,.08);
        for(let i=0;i<3;i++){
          const x=(i-1)*.34;bit(shapes.rod,mats.steel,x,.22,0,.018,.39,.018);
          bit(specimenGeo[i],mats.shine[i],x,.02+(i===1?.07:0),.02,.24,.30,.18);
        }
      }else if(kind==='scout'){
        bit(shapes.sphere,mats.porcelain,0,0,0,.41,.30,.22);
        for(const side of [-1,1]){
          const wing=bit(shapes.stone,mats.brass,side*.43,.02,-.04,.31,.14,.09);wing.rotation.z=side*.15;
          bit(shapes.sphere,mats.light,side*.15,.06,.22,.064,.077,.03);
        }
        bit(shapes.rod,mats.steel,.09,.39,0,.02,.29,.02);bit(shapes.sphere,mats.milk,.09,.55,0,.065);
      }else if(kind==='sail'){
        bit(shapes.sphere,mats.brass,0,-.30,0,.61,.13,.16);
        bit(shapes.rod,mats.steel,-.13,.08,-.04,.022,.68,.022);
        const wing=bit(shapes.stone,mats.light,.08,.13,0,.39,.44,.08);wing.rotation.z=-.30;
        bit(shapes.sphere,mats.milk,.59,.24,0,.12);bit(shapes.sphere,mats.light,-.59,.24,0,.12);
      }else if(kind==='wheel'){
        bit(shapes.ring,mats.brass,0,.04,0,.50,.50,.50);
        bit(shapes.ring,mats.light,0,.04,.01,.38,.38,.38).rotation.x=.92;
        bit(shapes.sphere,mats.coral,.34,.29,.04,.13);bit(shapes.sphere,mats.porcelain,-.30,-.20,.02,.09);
      }else if(kind==='eclipse'){
        bit(shapes.ring,mats.milk,0,.03,0,.49,.49,.49);
        bit(shapes.sphere,mats.milk,0,.03,0,.37,.37,.07);
        bit(shapes.sphere,mats.ink,.14,.03,.09,.33,.33,.06);
      }else{
        for(let i=0;i<3;i++){
          const x=(i-1)*.37;bit(shapes.rod,mats.brass,x,-.16,0,.018,.38,.018);
          if(kind==='nursery')bit(specimenGeo[i],mats.shine[i],x,.19,.02,.23,.29,.18);
          else{
            for(let j=0;j<5;j++){const a=j*TAU/5;bit(shapes.stone,mats.shine[i],x+Math.cos(a)*.12,.16+Math.sin(a)*.12,.02,.09,.11,.055);}
          }
        }
      }
      weldToy(glyph);return glyph;
    }
    // A small botanical workshop on the last shelf. Feza carries three
    // differently cut ice seeds into their actual matching crystal nests.
    // A missed drop stays where it was put; no seed, progress or time is lost.
    function createNursery(){
      const y=ground(nurseryX),seeds=[],bed=group(root,nurseryX,y,-.45);
      bed.name='Halka fidanlığı';
      const bottom=mesh(bed,shapes.cyl,mats.ink,0,.12,-.5);bottom.scale.set(4.35,.24,1.10);
      const lip=mesh(bed,shapes.cyl,mats.brass,0,.27,-.5);lip.scale.set(4.15,.08,1.0);
      let selected=null,owner=null,count=0,dragged=false;
      for(let i=0;i<3;i++){
        const x=nurseryX+(i-1)*2.50,sourceX=nurseryX+(i-1)*3.35;
        const hollow=mesh(root,specimenGeo[i],mats.ink,x,y+.90,.0);hollow.scale.set(.93,.93,.32);hollow.name='Fidanlığın boş kristal yuvası '+(i+1);
        const rimMaterial=mats.shine[i].clone();rimMaterial.transparent=true;rimMaterial.opacity=.95;rimMaterial.depthWrite=false;
        const rim=mesh(root,new T.TorusGeometry(.74,.055,7,36),rimMaterial,x,y+.84,.05);rim.rotation.x=.22;rim.name='Fidanlığın kristal yuva çemberi '+(i+1);
        rim.visible=false;
        piece(shapes.cyl,mats.porcelain,x,y+.48,-.13,.94,.44,.68);
        piece(shapes.cyl,mats.petrol,x,y+.70,-.13,.79,.075,.55);
        piece(shapes.cyl,mats.brass,x,y+.30,-.13,.96,.09,.70);
        for(const side of[-1,1])piece(shapes.box,mats.gem[i],x+side*.72,y+.50,.14,.12,.24,.07);
        const seed=group(root,sourceX,y+2.32,-.13);
        const crystal=mesh(seed,specimenGeo[i],specimenMats[i]);crystal.scale.set(.70,.70,.58);
        const crown=group(root,x,y+.43,-.85);crown.scale.setScalar(.02);
        for(let j=0;j<5;j++){
          const a=j*TAU/5;
          const petal=mesh(crown,shapes.nub,mats.gem[i],Math.cos(a)*.44,1.10+Math.sin(a)*.44,.0);
          petal.scale.set(.19,.52,.16);petal.rotation.z=a-1.57;
        }
        const stem=mesh(crown,shapes.rod,mats.brass,0,.55,0);stem.scale.set(.045,1.1,.045);
        const core=mesh(crown,shapes.sphere,mats.shine[i],0,1.1,.05);core.scale.set(.19,.19,.13);
        const q={x,y:y+.83,seed,sourceX,sourceY:y+2.32,crown,hollow,rim,rimMaterial,placed:false,amount:0,targetX:sourceX,targetY:y+2.32,pulse:0};
        seeds.push(q);weldToy(crown);
      }
      function place(q){
        if(q.placed)return;
        q.placed=true;q.hollow.visible=false;q.targetX=q.x;q.targetY=q.y;count++;selected=null;owner=null;
        M.sfx('saturn-cradle');M.celebrate(q.x,q.y+1.1);
      }
      function pointer(type,p,e){
      if(type==='down')lastGuideTouch=clock;
        const id=e?.pointerId??0;
        if(type==='cancel'){if(!e||owner===id)owner=null;return false;}
        if(player.locked||Math.abs(player.x-nurseryX)>11)return false;
        if(owner!==null&&id!==owner)return type==='down';
        if(type==='down'){
          if(selected){
            if(Math.abs(p.x-selected.x)<1.1&&Math.abs(p.y-selected.y)<1.1){place(selected);return true;}
            for(const q of seeds)if(q!==selected&&Math.abs(p.x-q.x)<1.0&&Math.abs(p.y-q.y)<.85)return false;
          }
          for(const q of seeds){
            if(!q.placed&&Math.abs(p.x-q.seed.position.x)<1.0&&Math.abs(p.y-q.seed.position.y)<1.07){
              selected=q;owner=id;dragged=false;q.pressX=p.x;q.pressY=p.y;q.pulse=1;M.sfx('saturn-magnet');return true;
            }
          }
          return false;
        }
        if(owner!==id||!selected)return false;
        if(type==='move'){
          if(Math.hypot(p.x-selected.pressX,p.y-selected.pressY)>.09)dragged=true;
          if(dragged){selected.targetX=clamp(p.x,nurseryX-5.2,nurseryX+5.2);selected.targetY=clamp(p.y,y+.48,y+3.6);}
        }else if(type==='up'){
          if(dragged&&Math.abs(p.x-selected.x)<1.05&&Math.abs(p.y-selected.y)<1.15)place(selected);
          owner=null;
        }
        return true;
      }
      function update(dt,t){
        for(const q of seeds){
          q.pulse=Math.max(0,q.pulse-dt);
          q.seed.position.x=M.damp(q.seed.position.x,q.targetX,15,dt);
          q.seed.position.y=M.damp(q.seed.position.y,q.targetY,15,dt);
          q.seed.rotation.y=.10*Math.sin(t*.75+q.x);
          q.amount=M.damp(q.amount,q.placed?1:0,2.2,dt);q.crown.scale.setScalar(.02+.98*q.amount);
          const waiting=q===selected&&!q.placed;
          q.rim.scale.setScalar(1-.28*q.amount+(waiting?.10*Math.sin(t*3):0)+q.pulse*.08);
          q.rim.position.y=y+.84-.55*q.amount;q.rim.rotation.x=.22+1.04*q.amount;
          q.rimMaterial.opacity=.95-.72*q.amount;q.hollow.visible=!q.placed;
          q.rim.rotation.z=t*(q.placed?.15:waiting?.40:0);
        }
        if(selected&&owner===null&&Math.abs(player.x-nurseryX)<9)M.setCameraTarget(nurseryX,y+2.0,.87,.60);
      }
      return {demoSources:seeds.map(q=>q.seed),pointer,update,describe(step){if(player.locked||Math.abs(player.x-nurseryX)>11||count===3)return false;let q=selected;for(let i=0;!q&&i<seeds.length;i++)if(!seeds[i].placed)q=seeds[i];if(!q||q.placed)return false;q.seed.getWorldPosition(step.from);step.to.set(q.x,q.y,-.13);step.demoObject=q.seed;step.action='drag';step.progress=count;step.total=3;step.sourceIcon='sample';step.goalIcon='flowers';return true;},help(){if(count===3)return false;if(selected)place(selected);else{selected=seeds.find(q=>!q.placed)||null;if(selected)selected.pulse=1;}return true;},interact(){
        if(Math.abs(player.x-nurseryX)>7)return false;
        if(selected)place(selected);else{selected=seeds.find(q=>!q.placed)||null;if(selected)selected.pulse=1;}
        return true;
      },get complete(){return count===3;},get planted(){return count;},get target(){const q=selected||seeds.find(q=>!q.placed);return q?{x:selected?q.x:q.seed.position.x,y:selected?q.y:q.seed.position.y}:null;}};
    }
    const nursery=createNursery();
    // The observatory is now a living consequence of the whole expedition.
    // Chime light, sampled ice and restored ring flow feed the same bed.
    const familyBed=group(root,eyeX-2.75,eyeY,-2.4),familyFlowers=[],familySources=[];
    familyBed.name='Ailenin büyüttüğü halka bahçesi';
    const bedBase=mesh(familyBed,shapes.cyl,mats.petrol,0,.11,0);bedBase.scale.set(4.42,.23,1.15);
    for(let i=0;i<3;i++){
      const x=(i-1)*2.36,g=group(familyBed,x,.25,0);
      const stem=mesh(g,shapes.rod,mats.brass,0,1.1,0);stem.scale.set(.055,2.2,.055);
      const head=group(g,0,2.25,0);
      for(let j=0;j<7;j++){
        const a=j*TAU/7;
        const petal=mesh(head,specimenGeo[i],specimenMats[i],Math.cos(a)*.68,Math.sin(a)*.68,0);
        petal.scale.set(.29,.52,.27);petal.rotation.z=a-1.57;
      }
      const core=mesh(head,shapes.sphere,mats.shine[i],0,0,.08);core.scale.set(.30,.30,.19);
      const halo=mesh(head,new T.TorusGeometry(1.05,.030,6,48),mats.shine[i]);halo.rotation.x=.4;
      g.scale.setScalar(.035);familyFlowers.push({root:g,head,halo});weldToy(head);
    }
    const sourceGeo=new T.TorusGeometry(.21,.035,6,28);
    for(let i=0;i<6;i++){
      const x=eyeX-6.1+i*1.33,y=eyeY+.62;
      const source=group(root,x,y,-1.23);
      const foot=mesh(source,shapes.cyl,mats.ink,0,-.32,0);foot.scale.set(.33,.20,.28);
      const heart=discoveryGlyph(source,['harp','scout','sail','wheel','eclipse','nursery'][i],.65);heart.position.y=.02;
      const ring=group(source,0,0,.03);mesh(ring,sourceGeo,mats.shine[i%3]);
      const data=new Float32Array(32*3),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(data,3).setUsage(T.DynamicDrawUsage));
      const line=new T.Line(geometry,new T.LineBasicMaterial({color:[0xa6fff5,0xffd596,0xe8c5ff][i%3],transparent:true,opacity:.12,depthWrite:false}));line.frustumCulled=false;root.add(line);
      familySources.push({root:source,ring,heart,line,data,x,y,light:0});weldToy(source);
    }
    const familyLever=group(root,eyeX+2.52,eyeY,-.24);
    const leverFoot=mesh(familyLever,shapes.cyl,mats.petrol,0,.16,0);leverFoot.scale.set(.60,.31,.47);
    const leverMast=mesh(familyLever,shapes.rod,mats.brass,0,.82,0);leverMast.scale.set(.075,1.35,.075);
    const leverHandle=group(familyLever,0,1.65,.02);
    const handleRing=mesh(leverHandle,new T.TorusGeometry(.51,.080,8,40),mats.brass);
    const handleCore=mesh(leverHandle,shapes.sphere,mats.gem[0],0,0,.02);handleCore.scale.set(.29,.29,.11);
    const familyPaw=group(root,eyeX-1.4,eyeY+.09,.65);
    const pawBase=mesh(familyPaw,shapes.cyl,mats.petrol);pawBase.scale.set(.72,.13,.57);
    const pawCentre=mesh(familyPaw,shapes.sphere,mats.milk,0,.12,.08);pawCentre.scale.set(.27,.04,.20);
    for(let i=0;i<4;i++){const a=.28+i*.85;const toe=mesh(familyPaw,shapes.sphere,mats.milk,Math.cos(a)*.38,.12,-.12-Math.sin(a)*.25);toe.scale.set(.09,.045,.11);}
    let finalePhase='sleep',familyGrow=0,familyFeza=false,familyBilbo=false,familyOwner=null,familyDrag=false,familyFromY=0;
    // A child who reaches the camera first can explicitly call a small taxi.
    // Its destination is an actual 3-D picture of the missing discovery.
    const taxi=group(root),boat=group(taxi),ticket=group(taxi,0,2.04,-.42);
    taxi.visible=false;
    const keel=mesh(boat,shapes.sphere,mats.brass);keel.scale.set(1.56,.18,.56);
    const deckSeat=mesh(boat,shapes.box,mats.petrol,0,.11,0);deckSeat.scale.set(2.04,.14,.80);
    for(const x of [-.72,.63]){
      const cushion=mesh(boat,shapes.sphere,mats.coral,x,.21,-.04);cushion.scale.set(.37,.105,.34);
    }
    for(const x of [-1.17,1.17]){
      const fairing=mesh(boat,shapes.sphere,mats.porcelain,x,.15,-.10);fairing.scale.set(.40,.27,.50);
      const lamp=mesh(boat,shapes.sphere,mats.light,x,.17,.35);lamp.scale.set(.20,.061,.043);
      // Little coral tail fins and a gold trim band: a friendlier sky boat (welded, no extra draws).
      const fin=mesh(boat,shapes.sphere,mats.coral,x*1.2,.32,-.16);fin.scale.set(.2,.25,.05);fin.rotation.z=-Math.sign(x)*.55;
    }
    const trim=mesh(boat,shapes.ring,mats.brass,0,.03,0);trim.scale.set(1.57,.57,1.4);trim.rotation.x=Math.PI/2;
    const backRail=mesh(boat,new T.TorusGeometry(.86,.035,6,24,Math.PI),mats.brass,0,.2,-.38);backRail.scale.set(1.15,.55,1);
    const sign=mesh(ticket,shapes.sphere,mats.ink,0,0,-.08);sign.scale.set(.83,.73,.13);
    const outline=mesh(ticket,shapes.ring,mats.milk);outline.scale.set(.78,.68,1);
    const crystalMark=mesh(ticket,new T.OctahedronGeometry(.42),mats.gem[0],0,0,.12);
    const pawMark=group(ticket,0,-.01,.10);
    function pawMarkDot(x,y,w,h){
      const m=mesh(pawMark,shapes.sphere,mats.milk,x,y,.04);m.scale.set(w,h,.055);
    }
    pawMarkDot(0,-.13,.24,.14);for(let j=0;j<4;j++){const a=Math.PI*(.18+j*.21);pawMarkDot(Math.cos(a)*.29,Math.sin(a)*.28,.073,.10);}
    const cameraMark=group(ticket);
    const pictureBody=mesh(cameraMark,shapes.box,mats.porcelain,0,0,.10);pictureBody.scale.set(.80,.53,.12);
    const pictureLens=mesh(cameraMark,shapes.sphere,mats.gem[0],.04,.014,.22);pictureLens.scale.set(.19,.19,.075);
    const sailMark=discoveryGlyph(ticket,'sail',.94),wheelMark=discoveryGlyph(ticket,'wheel',.94),gardenMark=discoveryGlyph(ticket,'garden',.94),eclipseMark=discoveryGlyph(ticket,'eclipse',.94),nurseryMark=discoveryGlyph(ticket,'nursery',.94);
    const direction=group(ticket,-1.02,0,0);
    for(const j of [-1,1]){
      const bar=mesh(direction,shapes.box,mats.milk,0,j*.12,0);bar.scale.set(.45,.085,.09);bar.rotation.z=j*.57;
    }
    let taxiX=0,ride=null,taxiOn=false,signBounce=0;
    function nextStop(){
      if(!tasks[0])return harpX;
      if(!tasks[1])return dockX;
      if(!sails.complete)return sails.nextX??13;
      if(!wheelTurned)return wheelX;
      if(garden.collected<3)return garden.nextX;
      if(!eclipse.seen)return eclipseX;
      if(!nursery.complete)return nurseryX;
      return eyeX;
    }
    // The robot taxi is only a real return journey (a missed stop far back).
    // A nearby missed stop is reached on foot; no hop-on/hop-off rides.
    function taxiFar(from){return Math.abs(nextStop()-from)>40;}
    function showTaxi(){
      if(!taxiFar(eyeX)&&!taxiOn){gleam=1;M.sfx('ring');return;}
      const besideCamera=taxiOn&&Math.abs(taxiX-eyeX)<5;
      if(besideCamera){boardTaxi();return;}
      taxiX=eyeX-2.65;taxiOn=true;taxi.visible=true;signBounce=1;M.sfx('robot');
    }
    function boardTaxi(){
      if(ride||!taxiOn)return;
      const stop=nextStop();
      if(Math.abs(taxiX-stop)<6.6||!taxiFar(taxiX)){signBounce=1;M.sfx('ring');return;}
      const landingX=stop+(stop===eyeX?-2.65:4.65),dir=Math.sign(landingX-taxiX);
      ride={phase:'board',elapsed:0,start:taxiX,end:landingX,duration:Math.max(12,3+Math.abs(landingX-taxiX)/14),dir,
        px:player.x,py:player.y,pz:player.z||0,dx:dog.x,dy:dog.y,dz:dog.z??.3};
      dog.activityTargetX=undefined;dog.activityMode=undefined;dog.emote='';dog.lookX=dog.lookY=0;
      player.locked=dog.locked=true;player.grounded=dog.grounded=true;
      player.vx=player.vy=dog.vx=dog.vy=0;player.facing=dog.facing=dir;M.sfx('slide');
    }
    function landTaxi(){
      if(!ride||ride.phase==='land')return;
      const q=ride;q.phase='land';q.elapsed=0;q.px=player.x;q.py=player.y;q.pz=player.z||0;
      q.dx=dog.x;q.dy=dog.y;q.dz=dog.z??.3;q.boatY=taxi.position.y;
      q.landing=clamp(taxiX+(taxiX>nextStop()?-1.62:1.62),2,length-3);
    }
    function updateTaxi(dt){
      if(!taxiOn)return;
      signBounce=Math.max(0,signBounce-dt*1.1);const target=nextStop();
      const needSail=!tasks[0]||!tasks[1]?false:!sails.complete;
      crystalMark.visible=target===harpX;pawMark.visible=target===dockX;cameraMark.visible=target===eyeX;
      sailMark.visible=needSail;wheelMark.visible=!needSail&&target===wheelX;
      gardenMark.visible=!needSail&&target===garden.nextX;eclipseMark.visible=!needSail&&target===eclipseX;nurseryMark.visible=!needSail&&target===nurseryX;
      const signDir=target<taxiX?-1:1;direction.scale.x=-signDir;direction.position.x=signDir*(.97+.07*Math.sin(clock*3));
      const y=ground(taxiX)+.34+.042*Math.sin(clock*2.15);
      taxi.position.set(taxiX,y,-.10);ticket.visible=!ride&&Math.abs(taxiX-target)>6.6&&taxiFar(taxiX);
      ticket.position.y=1.80+.055*Math.sin(clock*2.4)+.14*signBounce;
      crystalMark.rotation.y=clock*.85;
      if(!ride)return;
      const q=ride;q.elapsed+=dt;
      if(q.phase==='board'){
        const u=ease(clamp(q.elapsed/.74,0,1)),h=Math.sin(Math.PI*u)*.28;
        player.x=M.lerp(q.px,taxiX+q.dir*.57,u);player.y=M.lerp(q.py,y-.045,u)+h;player.z=M.lerp(q.pz,-.09,u);
        dog.x=M.lerp(q.dx,taxiX-q.dir*.70,u);dog.y=M.lerp(q.dy,y+.28,u)+h;dog.z=M.lerp(q.dz,.04,u);
        player.mode=dog.mode=u>.65?'ride':'jump';
        if(u>=1){q.phase='cruise';q.elapsed=0;}
      }else if(q.phase==='cruise'){
        const t=clamp(q.elapsed/q.duration,0,1),old=taxiX;
        taxiX=M.lerp(q.start,q.end,ease(t));const height=ground(taxiX)+.38+Math.sin(t*Math.PI)*1.15+.32*Math.sin(t*Math.PI*5)*Math.sin(t*Math.PI);
        taxi.position.set(taxiX,height,-.10);player.x=taxiX+q.dir*.57;dog.x=taxiX-q.dir*.70;
        player.y=height-.045;dog.y=height+.28;player.z=-.09;dog.z=.04;
        player.mode=dog.mode='ride';
        const speed=dt?(taxiX-old)/dt:0;
        M.setCameraTarget(taxiX+speed*.25,height+1.80,.92,1);
        if(t===1)landTaxi();
      }else{
        const u=ease(clamp(q.elapsed/.65,0,1)),h=Math.sin(Math.PI*u)*.20;
        taxi.position.y=M.lerp(q.boatY,y,u);
        player.x=M.lerp(q.px,q.landing,u);dog.x=M.lerp(q.dx,q.landing-q.dir*.92,u);
        player.y=M.lerp(q.py,ground(player.x),u)+h;dog.y=M.lerp(q.dy,ground(dog.x),u)+h;
        player.z=M.lerp(q.pz,0,u);dog.z=M.lerp(q.dz,.3,u);player.mode=dog.mode='jump';
        if(u>=1){
          ride=null;player.locked=dog.locked=false;player.grounded=dog.grounded=true;player.mode=dog.mode='idle';
          if(Math.abs(taxiX-eyeX)<3.5&&target===eyeX){taxiOn=false;taxi.visible=false;}
        }
      }
    }
    const motes=group(root);
    // Sparse glints at higher elevations, away from faces and playable objects.
    const sparkPos=new Float32Array(180*3);
    for(let i=0;i<sparkPos.length;i+=3){sparkPos[i]=rand()*(length+8)-3;sparkPos[i+1]=1+rand()*6;sparkPos[i+2]=-17+rand()*10;}
    const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sparkPos,3));
    // Ice-crystal glints: each one slowly flares into a tiny four-point star and fades (measured, never busy).
    const glintUniforms={time:{value:0}};
    const dust=new T.Points(sg,new T.ShaderMaterial({uniforms:glintUniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      vertexShader:`uniform float time;varying float a;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        float ph=fract(sin(dot(position.xz,vec2(12.9898,78.233)))*43758.5453);float w=sin(time*(.55+.7*ph)+ph*40.);
        a=.28+.72*pow(max(0.,w),6.);gl_PointSize=clamp((1.1+5.5*pow(max(0.,w),6.))*60./max(4.,-mv.z),1.,14.);}`,
      fragmentShader:`varying float a;void main(){vec2 p=abs(gl_PointCoord-.5)*2.;float core=max(0.,1.-length(p)*1.7);
        float cross=pow(max(0.,1.-p.x),6.)*pow(max(0.,1.-p.y*7.),2.)+pow(max(0.,1.-p.y),6.)*pow(max(0.,1.-p.x*7.),2.);
        gl_FragColor=vec4(1.,.95,.86,(core+cross*.8)*a*.8);}`}));
    dust.frustumCulled=false;motes.add(dust);
    // CİLA: calm decor, all built once. Lantern posts on the back edge of the
    // lane, frost crystal clumps on the front lip, a slow far band of ring rocks.
    // Each set is one instanced draw; none of them take touches or cast shadows.
    const decor=group(root),noPick=()=>{};
    const busy=[harpX,dockX,eyeX,eclipseX,nurseryX,26,43,90,115,137,167,191,215];
    const nearBusy=x=>busy.some(q=>Math.abs(x-q)<4.5);
    const postXs=[];for(let x=4;x<length-4;x+=11)if(!nearBusy(x))postXs.push(x);
    const postMat=metal(0xd59b5a,.36,.53),lanternMat=new T.MeshBasicMaterial({color:0xffe2a0});
    const posts=new T.InstancedMesh(shapes.rod,postMat,postXs.length*3),caps=new T.InstancedMesh(shapes.sphere,lanternMat,postXs.length);
    postXs.forEach((x,i)=>{
      const z=(iceAt(x)?shelfEdge(x,-1):back(x))+.55,y=ground(x);
      dummy.rotation.set(0,0,0);dummy.position.set(x,y+.55,z);dummy.scale.set(.035,1.1,.035);dummy.updateMatrix();posts.setMatrixAt(i*3,dummy.matrix);
      dummy.position.set(x,y+.08,z);dummy.scale.set(.09,.16,.09);dummy.updateMatrix();posts.setMatrixAt(i*3+1,dummy.matrix);dummy.position.set(x,y+1.31,z);dummy.scale.set(.15,.04,.15);dummy.updateMatrix();posts.setMatrixAt(i*3+2,dummy.matrix);
      dummy.position.set(x,y+1.17,z);dummy.scale.setScalar(.11);dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix);
    });
    const gemTints=[0x7ff4ff,0x7ff4ff,0xd8a6ff,0xffc977,0x9fffe0].map(h=>new T.Color(h)),gemGeo=new T.OctahedronGeometry(1,0);
    const gemMat=new T.MeshStandardMaterial({color:0x8a8f96,roughness:.2,metalness:.1});
    gemMat.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        float rim=pow(1.-abs(dot(normal,normalize(vViewPosition))),2.);
        outgoingLight+=vColor*vColor*(.42+.9*rim);
        #include <opaque_fragment>`);
    };
    const crystalSpots=[];for(let x=10;x<length-2;x+=2.6+rand()*2.2)if(iceAt(x)&&!nearBusy(x))crystalSpots.push(x);
    const crystals=new T.InstancedMesh(gemGeo,gemMat,crystalSpots.length*3);
    crystalSpots.forEach((x,i)=>{
      const z=shelfEdge(x,1)-.32,y=ground(x);
      for(let k=0;k<3;k++){
        const h=.2+rand()*.26;dummy.position.set(x+(k-1)*.14,y+h*.4,z+(rand()-.5)*.16);
        dummy.rotation.set((rand()-.5)*.5,rand()*TAU,(k-1)*.38);dummy.scale.set(.07+rand()*.03,h,.07+rand()*.03);
        dummy.updateMatrix();crystals.setMatrixAt(i*3+k,dummy.matrix);crystals.setColorAt(i*3+k,gemTints[(i+k)%gemTints.length]);
      }
    });
    // Crystal garden: glowing cyan, lilac and amber clusters grow from the
    // back edge of the ice lanes, behind the riding line (one instanced draw).
    const clusterXs=[];
    for(let x=11;x<length-4;x+=3.1+rand()*2.6)if(iceAt(x)&&iceAt(x+1)&&!nearBusy(x)&&shelfEdge(x,-1)<-2.85&&postXs.every(q=>Math.abs(q-x)>1.1))clusterXs.push(x);
    const gemCluster=new T.InstancedMesh(gemGeo,gemMat,clusterXs.length*4);
    clusterXs.forEach((x,i)=>{
      const z=shelfEdge(x,-1)+.5+rand()*.25,y=ground(x),tint=gemTints[Math.floor(rand()*gemTints.length)];
      for(let k=0;k<4;k++){
        const h=k===0?1.0+rand()*.55:.42+rand()*.42,lean=(k-1.5)*.32+(rand()-.5)*.2;
        dummy.position.set(x+(k-1.5)*.24,y+h*.45,z+(rand()-.5)*.3);
        dummy.rotation.set((rand()-.5)*.35,rand()*TAU,-lean);dummy.scale.set(.12+h*.1,h,.12+h*.1);
        dummy.updateMatrix();gemCluster.setMatrixAt(i*4+k,dummy.matrix);gemCluster.setColorAt(i*4+k,tint);
      }
    });
    gemCluster.name='Buz kristali kümeleri';decor.add(gemCluster);
    const farRocks=new T.InstancedMesh(shapes.stone,mats.frost,70),farBand=group(decor);
    for(let i=0;i<70;i++){
      const s=.12+rand()*.28;dummy.position.set(rand()*(length+40)-20,-2.2+rand()*3.4,-34-rand()*12);
      dummy.rotation.set(rand()*TAU,rand()*TAU,rand()*TAU);dummy.scale.set(s,s*(.6+rand()*.5),s);dummy.updateMatrix();farRocks.setMatrixAt(i,dummy.matrix);
    }
    for(const m of [posts,caps,crystals,farRocks,gemCluster]){m.raycast=noPick;m.castShadow=false;m.receiveShadow=false;m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}
    decor.add(posts,caps,crystals);farBand.add(farRocks);
    function decorTick(time){
      lanternMat.color.setRGB(1,.86+.06*Math.sin(time*1.3),.58+.08*Math.sin(time*1.3));
      farBand.position.set(Math.sin(time*.035)*3.5,Math.sin(time*.11)*.35,0);
    }
    dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.position.set(0,0,0);
    flush();
    weldToy(scout);for(const wing of wings)weldToy(wing);for(const claw of claws)weldToy(claw);
    weldToy(lens);weldToy(paw);weldToy(boat);weldToy(direction);weldToy(pawMark);
    const sails=M.createRingSails({root,player,dog,ground,mats,shapes,glazeTexture,weldToy,routeLength:length});
    const tasks=[false,false,false];
    const view={active:'',tasks,finished:false,chimes:0,samples:0,scout:'docked',cue:'',endingDelay:4.1,endingPhotoDelay:1.9};
    Object.defineProperty(view,'route',{enumerable:true,get:()=>sails.state()});
    const photoMetrics={warm:null,shot:null,scope:'CPU wall-clock milliseconds; fenceWaitMs includes GPU queue, fence polling and browser scheduling, not isolated GPU execution time.'};
    view.photo='idle';view.photoMetrics=photoMetrics;
    let photoPool=null,photoPrepared=false,photoPreparePromise=null,photoPending=false,photoDisposed=false,photoContextLost=false,photoEpoch=0;
    const photoCanvas=M.renderer?.domElement;
    if(photoCanvas?.addEventListener){photoCanvas.addEventListener('webglcontextlost',photoLost);photoCanvas.addEventListener('webglcontextrestored',photoRestored);}
    if(typeof addEventListener==='function')addEventListener('pagehide',disposePhoto);
    const held=new Set();
    let clock=0,flight=null,undocked=false,shutter=-1,gleam=0;
    
    const guide=group(root);const guideHand=M.WorkshopArt.hand(guide,1.05);guideHand.position.set(.12,.7,.8);let lastGuideTouch=-10;
    // A small orbiting glint identifies a touchable object even in greyscale.
    const guideHalo=mesh(guide,new T.TorusGeometry(.32,.023,6,28,Math.PI*1.52),mats.milk);guideHalo.scale.set(.45,.45,.45);
    const guideSpark=mesh(guide,shapes.stone,mats.milk);guideSpark.scale.set(.092,.17,.092);
    function close(x,range=10){return Math.abs(player.x-x)<range;}
    function finishTask(i,x,y){
      if(tasks[i])return;
      tasks[i]=true;M.celebrate(x,y);M.sfx('complete');
    }
    // Echo game: the waiting bell sings and sways by itself; answering that
    // same bell lights its moon. Any other bell simply sings (no penalty).
    const harpOrder=[1,0,2];let harpCallT=1.2;
    function harpNext(){return harp[harpOrder[Math.min(view.chimes,2)]];}
    function chime(i) {
      const q=harp[i];q.energy=1;M.sfx('saturn-chime-'+i);
      if(q.hit||q!==harpNext())return;harpCallT=-1.4;
      q.hit=true;toyRings[i].visible=true;moonLights[i].material.color.copy(mats.shine[i].color);view.chimes++;
      if(view.chimes===3)finishTask(0,harpX,harpY+1.55);
    }
    // A shard follows the finger immediately. Its matching glass berth
    // receives it, and the same visible specimen stays inside the jar.
    function startFlight(i,id,p){
      const q=samples[i];if(!q||q.collected)return false;
      if(flight){
        if(flight.index!==i||flight.phase==='place')return false;
        if(id!==undefined){flight.id=id;flight.pressX=p.x;flight.pressY=p.y;}
        return true;
      }
      if(!undocked){undocked=true;M.sfx('robot');}
      flight={index:i,phase:'carry',time:0,fromX:scout.position.x,fromY:scout.position.y,
        targetX:q.x,targetY:q.y,pressX:p?.x??q.x,pressY:p?.y??q.y,id:id??null,dragged:false,
        pendingPlace:false,pulse:1};
      view.scout='carry';M.sfx('saturn-latch');return true;
    }
    function placeShard(){
      if(!flight||flight.phase==='place')return;
      const q=samples[flight.index];
      if(flight.phase==='hook'){flight.pendingPlace=true;return;}
      flight.phase='place';flight.time=0;flight.id=null;flight.fromX=q.g.position.x;flight.fromY=q.g.position.y;
      view.scout='place';M.sfx('saturn-magnet');
    }
    function inBerth(p,q){return Math.abs(p.x-q.jarX)<.78&&Math.abs(p.y-q.jarY)<.78;}
    function nudgeTarget(){if(flight){flight.pulse=1;M.sfx('ring');}}
    function launchScout(){
      if(flight){nudgeTarget();return;}
      if(tasks[1]){gleam=1;M.sfx('ring');return;}
      if(undocked){startFlight(samples.findIndex(q=>!q.collected));return;}
      undocked=true;view.scout='choose';M.sfx('robot');
    }
    function carryDrag(type,p,id){
      if(!flight||flight.id!==id)return false;
      const f=flight,q=samples[f.index];
      if(type==='move'){
        if(Math.hypot(p.x-f.pressX,p.y-f.pressY)>.12)f.dragged=true;
        if(f.dragged){f.targetX=clamp(p.x,dockX-4.2,dockX+4.2);f.targetY=clamp(p.y,dockY+.55,dockY+4.25);}
      }else if(type==='up'||type==='cancel'){
        if(type==='up'&&f.dragged&&inBerth(p,q))placeShard();
        else if(f.dragged&&f.phase!=='place'){f.pulse=1;f.targetY=Math.max(f.targetY,dockY+1.45);}
        f.id=null;
      }
      return true;
    }
    function familyReady(){return tasks[0]&&tasks[1]&&sails.complete&&wheelTurned&&garden.collected===3&&eclipse.seen&&nursery.complete;}
    function inviteFamily(){
      if(!familyReady()){gleam=1;showTaxi();return false;}
      if(finalePhase==='sleep'){finalePhase='invite';M.sfx('saturn-magnet');}
      return true;
    }
    function familyPointer(type,p,e){
      const id=e?.pointerId??0;
      if(type==='cancel'){if(!e||familyOwner===id)familyOwner=null;return false;}
      if(!close(eyeX,12)||player.locked||!familyReady()||shutter>=0)return false;
      if(type==='down'){
        if(!familyBilbo&&Math.abs(p.x-familyPaw.position.x)<1.03&&Math.abs(p.y-eyeY-.20)<.91){
          inviteFamily();familyBilbo=true;M.sfx('dog');return true;
        }
        if(!familyFeza&&Math.abs(p.x-familyLever.position.x)<.99&&Math.abs(p.y-eyeY-1.65)<1.03){
          if(familyOwner!==null&&familyOwner!==id)return true;
          inviteFamily();familyOwner=id;familyFromY=p.y;familyDrag=false;return true;
        }
        return false;
      }
      if(id!==familyOwner)return false;
      if(type==='move'){
        const pull=clamp((familyFromY-p.y)/.72,0,1);
        if(pull>.08)familyDrag=true;
        leverHandle.rotation.z=-pull*.72;
        if(pull>.72){familyFeza=true;M.sfx('saturn-magnet');familyOwner=null;}
      }else if(type==='up'){
        if(!familyDrag){familyFeza=true;M.sfx('saturn-magnet');}
        familyOwner=null;
      }
      return true;
    }
    function updateFamily(dt,time){
      const near=close(eyeX,16),ready=familyReady();
      familyLever.visible=familyPaw.visible=ready&&shutter<0;
      if(ready&&near&&finalePhase==='sleep')inviteFamily();
      const states=[tasks[0],tasks[1],sails.complete,wheelTurned,eclipse.seen,nursery.complete&&garden.collected===3];
      for(let i=0;i<familySources.length;i++){
        const q=familySources[i];q.light=M.damp(q.light,states[i]?1:0,2.7,dt);
        q.ring.rotation.z=time*(.10+.18*q.light);q.heart.rotation.y=.12*Math.sin(time*.62+i);q.heart.visible=states[i];
        q.ring.scale.setScalar(.83+q.light*.29);
        q.line.visible=near;
        if(!near)continue;
        q.line.material.opacity=.06+.37*q.light+(finalePhase==='grow'?.29:0);
        const n=q.data.length/3,targetX=eyeX-2.75;
        for(let j=0;j<n;j++){
          const u=j/(n-1),arc=Math.sin(u*Math.PI),flow=.035*Math.sin(time*3-u*24)*q.light;
          q.data[j*3]=M.lerp(q.x,targetX,u);
          q.data[j*3+1]=M.lerp(q.y,eyeY+.72+familyGrow*1.3,u)+arc*(.57+i*.085)+flow;
          q.data[j*3+2]=M.lerp(-1.2,-2.25,u);
        }
        q.line.geometry.attributes.position.needsUpdate=true;
      }
      if(familyBilbo&&finalePhase!=='ready'&&shutter<0){
        dog.activityTargetX=familyPaw.position.x;dog.activityMode=finalePhase==='grow'?'look':'dig';dog.emote='curious';dog.lookY=.40;dog.lookX=-.12;
      }
      if(finalePhase==='invite'&&familyFeza&&familyBilbo&&Math.abs(dog.x-familyPaw.position.x)<.72){
        finalePhase='grow';M.sfx('beacon');
      }
      if(finalePhase==='grow'){
        familyGrow=Math.min(1,familyGrow+dt/4.8);
        if(familyGrow===1){finalePhase='ready';dog.activityTargetX=undefined;dog.activityMode=undefined;dog.emote='';dog.lookX=dog.lookY=0;M.celebrate(eyeX-2.75,eyeY+3.1);M.sfx('complete');}
      }
      for(let i=0;i<familyFlowers.length;i++){
        const flower=familyFlowers[i],amount=ease(clamp(familyGrow*1.35-i*.16,0,1));
        flower.root.scale.setScalar(.035+.965*amount);
        flower.head.rotation.z=.045*Math.sin(time*.72+i)*amount;
        flower.halo.rotation.z=time*.17*(i%2?-1:1);
      }
      if(near&&(finalePhase==='invite'||finalePhase==='grow')){
        M.setCameraTarget(eyeX-.9,eyeY+2.45,.85,.85);
        handleCore.scale.setScalar(familyFeza?.33:.29+.025*Math.sin(time*3));
        pawCentre.scale.y=familyBilbo?.07:.04+.008*Math.sin(time*3);
        if(familyOwner===null)leverHandle.rotation.z=M.damp(leverHandle.rotation.z,familyFeza?-.72:0,6,dt);
      }
    }
    function photoNow(){return performance.now();}
    function photoAlive(epoch,renderer){return !photoDisposed&&!photoContextLost&&epoch===photoEpoch&&!renderer.getContext?.().isContextLost?.();}
    function freePhotoPool(pool){
      if(!pool||pool.released)return;pool.released=true;
      pool.target.dispose();pool.texture.dispose();pool.material.dispose();
    }
    function photoLost(){
      photoContextLost=true;photoEpoch++;photoPending=false;photoPrepared=false;photoPreparePromise=null;
      freePhotoPool(photoPool);photoPool=null;
      if(!view.finished){shutter=-1;photo.visible=false;view.photo='context-lost';}
    }
    function photoRestored(){photoContextLost=false;if(!photoDisposed&&!view.finished)view.photo='idle';}
    function disposePhoto(){
      if(photoDisposed)return;photoDisposed=true;photoEpoch++;photoPending=false;photoPrepared=false;photoPreparePromise=null;
      freePhotoPool(photoPool);photoPool=null;view.photo='disposed';
      photoCanvas?.removeEventListener?.('webglcontextlost',photoLost);photoCanvas?.removeEventListener?.('webglcontextrestored',photoRestored);
      if(typeof removeEventListener==='function')removeEventListener('pagehide',disposePhoto);
    }
    function makePhotoPool(renderer){
      const film=document.createElement('canvas');film.width=640;film.height=410;
      const ctx=film.getContext('2d');if(!ctx)throw new Error('photo-canvas');
      const target=new T.WebGLRenderTarget(640,410,{depthBuffer:true,stencilBuffer:false,samples:Math.min(4,renderer.capabilities.maxSamples)});
      target.texture.colorSpace=T.SRGBColorSpace;
      const texture=new T.CanvasTexture(film);texture.colorSpace=T.SRGBColorSpace;
      const material=new T.MeshBasicMaterial({map:texture,toneMapped:false});
      const previewScene=new T.Scene();previewScene.add(new T.Mesh(shapes.box,material));
      return {renderer,film,ctx,target,texture,material,previewScene,camera:new T.PerspectiveCamera(32,640/410,.13,300),pixels:new Uint8Array(640*410*4),print:ctx.createImageData(640,410),released:false};
    }
    // This scope is always synchronous: an async renderer call may return a
    // promise, but every temporary live pose, sky crop and visibility is restored
    // before that promise is awaited or another animation frame can draw.
    function photoExposure(pool,fn,metrics){
      const renderer=pool.renderer,feza=M.actors.feza,bilbo=M.actors.bilbo,portrait=pool.camera;
      const floor=Math.min(feza.root.position.y,bilbo.root.position.y),middle=(player.x+dog.x)*.5;
      const distance=Math.max(2.68,(Math.abs(player.x-dog.x)+1.45)/portrait.aspect)/(2*Math.tan(portrait.fov*Math.PI/360));
      portrait.position.set(middle+.14,floor+1.27,distance+.12);portrait.lookAt(middle,floor+1.18,0);portrait.updateMatrixWorld();
      const omitted=[],savedBody=skyBody.position.clone(),savedScale=skyBody.scale.clone(),savedRepeat=panorama.repeat.clone(),savedOffset=panorama.offset.clone();
      const fezaTurn=feza.rig.root.rotation.y,dogTurn=bilbo.model.root.rotation.y;
      const arm=feza.rig.armL,elbow=feza.rig.foreL,hand=feza.rig.handL,head=bilbo.rig.head;
      const armBefore=arm.rotation.clone(),elbowBefore=elbow.rotation.clone(),handBefore=hand.rotation.clone(),tiltBefore=head.rotation.z,beforeTarget=renderer.getRenderTarget();
      try{
        for(const o of root.children)if(o.visible&&o!==skyBody&&o!==shelf&&o!==deckSurface&&!o.isLight&&o!==key.target){o.visible=false;omitted.push(o);}
        feza.rig.root.rotation.y=dog.x<player.x?-.23:.23;bilbo.model.root.rotation.y=dog.x<player.x?.29:-.29;
        arm.rotation.set(-1.90,.08,.64);elbow.rotation.set(-.98,-.18,.02);hand.rotation.z=.20;head.rotation.z=tiltBefore-.13;
        const depth=113,halfHeight=depth*Math.tan(portrait.fov*Math.PI/360);
        skyBody.position.set(-halfHeight*portrait.aspect*.16,halfHeight*.54,-depth);portrait.localToWorld(skyBody.position);skyBody.scale.setScalar(.72);
        const crop=portrait.aspect/(2021/778);panorama.repeat.set(crop,1);panorama.offset.set((1-crop)*.63,0);
        renderer.setRenderTarget(pool.target);return fn();
      }finally{
        const start=photoNow();renderer.setRenderTarget(beforeTarget);for(const o of omitted)o.visible=true;
        skyBody.position.copy(savedBody);skyBody.scale.copy(savedScale);panorama.repeat.copy(savedRepeat);panorama.offset.copy(savedOffset);
        feza.rig.root.rotation.y=fezaTurn;bilbo.model.root.rotation.y=dogTurn;head.rotation.z=tiltBefore;
        arm.rotation.copy(armBefore);elbow.rotation.copy(elbowBefore);hand.rotation.copy(handBefore);scene.updateMatrixWorld(true);
        if(metrics)metrics.restoreMs=photoNow()-start;
      }
    }
    function exposeAndReadPhoto(pool,metrics){
      return photoExposure(pool,()=>{
        let start=photoNow();pool.renderer.render(scene,pool.camera);metrics.renderSubmitMs=photoNow()-start;
        start=photoNow();const result=pool.renderer.readRenderTargetPixelsAsync(pool.target,0,0,640,410,pool.pixels);
        metrics.readbackEnqueueMs=photoNow()-start;metrics.fenceStart=photoNow();return result;
      },metrics);
    }
    function paintPhoto(pool,metrics){
      let start=photoNow();for(let row=0;row<410;row++)pool.print.data.set(pool.pixels.subarray((409-row)*640*4,(410-row)*640*4),row*640*4);
      metrics.pixelFlipMs=photoNow()-start;start=photoNow();pool.ctx.putImageData(pool.print,0,0);metrics.canvasPaintMs=photoNow()-start;
      start=photoNow();pool.texture.needsUpdate=true;pool.renderer.initTexture?.(pool.texture);metrics.textureUploadSubmitMs=photoNow()-start;
    }
    function preparePhoto(renderer=M.renderer){
      if(photoDisposed||photoContextLost||!renderer||!M.actors?.feza||!M.actors?.bilbo)return Promise.resolve(false);
      if(photoPrepared&&photoPool?.renderer===renderer)return Promise.resolve(true);
      if(photoPreparePromise)return photoPreparePromise;
      const epoch=photoEpoch,metrics={width:640,height:410,samples:Math.min(4,renderer.capabilities.maxSamples),programsBefore:renderer.info?.programs?.length??null},began=photoNow();photoMetrics.warm=metrics;
      photoPreparePromise=(async()=>{
        let pool;
        try{
          if(typeof renderer.readRenderTargetPixelsAsync!=='function')throw new Error('photo-async-unavailable');
          let start=photoNow();freePhotoPool(photoPool);photoPool=null;pool=makePhotoPool(renderer);photoPool=pool;renderer.initRenderTarget?.(pool.target);metrics.setupMs=photoNow()-start;
          start=photoNow();await photoExposure(pool,()=>renderer.compileAsync?.(scene,pool.camera));metrics.exposureCompileMs=photoNow()-start;
          if(!photoAlive(epoch,renderer))return false;
          start=photoNow();const before=renderer.getRenderTarget();let compile;
          try{renderer.setRenderTarget(pool.target);compile=renderer.compileAsync?.(pool.previewScene,pool.camera);}finally{renderer.setRenderTarget(before);}
          await compile;metrics.printCompileMs=photoNow()-start;if(!photoAlive(epoch,renderer))return false;
          const pixels=await exposeAndReadPhoto(pool,metrics);metrics.fenceWaitMs=photoNow()-metrics.fenceStart;delete metrics.fenceStart;
          if(!photoAlive(epoch,renderer))return false;if(pixels!==pool.pixels)throw new Error('photo-readback-empty');
          paintPhoto(pool,metrics);photoPrepared=true;metrics.programsAfter=renderer.info?.programs?.length??null;metrics.totalMs=photoNow()-began;if(!photoPending)view.photo='prepared';return true;
        }catch(error){
          metrics.error=String(error?.message||'photo-readback-failed');metrics.totalMs=photoNow()-began;
          if(photoAlive(epoch,renderer)){view.photo='retry';freePhotoPool(pool);if(photoPool===pool)photoPool=null;}
          return false;
        }finally{
          if(!photoAlive(epoch,renderer))freePhotoPool(pool);
          if(epoch===photoEpoch)photoPreparePromise=null;
        }
      })();return photoPreparePromise;
    }
    function capturePhoto(){
      if(!inviteFamily())return;if(finalePhase!=='ready'){gleam=1;return;}
      if(shutter>=0||photoPending||photoDisposed||photoContextLost)return;
      const renderer=M.renderer;
      shutter=0;photo.visible=true;M.sfx('beacon');
      // CPU-only world tests have no renderer/rigs and keep the existing symbolic
      // postcard path. The real app always uses the full-resolution exposure.
      if(!renderer||!M.actors?.feza||!M.actors?.bilbo){view.photo='symbolic';return;}
      photoPending=true;view.photo='exposing';const epoch=photoEpoch,metrics={width:640,height:410,programsBefore:renderer.info?.programs?.length??null},began=photoNow();photoMetrics.shot=metrics;
      void (async()=>{
        try{
          if(!photoPrepared){const start=photoNow();if(!await preparePhoto(renderer))throw new Error('photo-not-prepared');metrics.latePrepareMs=photoNow()-start;}
          if(!photoAlive(epoch,renderer))return;const pool=photoPool;if(!pool||pool.released)throw new Error('photo-target-released');
          const pixels=await exposeAndReadPhoto(pool,metrics);metrics.fenceWaitMs=photoNow()-metrics.fenceStart;delete metrics.fenceStart;
          if(!photoAlive(epoch,renderer))return;if(pixels!==pool.pixels)throw new Error('photo-readback-empty');
          paintPhoto(pool,metrics);const start=photoNow();M.keepPhoto?.(pool.film);metrics.souvenirCopyMs=photoNow()-start;
          paper.material=pool.material;stamp.visible=orbitStamp.visible=false;view.photo='ready';metrics.programsAfter=renderer.info?.programs?.length??null;metrics.totalMs=photoNow()-began;
        }catch(error){
          metrics.error=String(error?.message||'photo-readback-failed');metrics.totalMs=photoNow()-began;
          if(photoAlive(epoch,renderer)){view.photo='retry';shutter=-1;photo.visible=false;photoPrepared=false;}
        }finally{if(epoch===photoEpoch)photoPending=false;}
      })();
    }
    function worldUpdate(dt,time,state){
      const x=state.player.x;
      // Parallax carries the distant planet only a few degrees across the route.
      const portrait=innerWidth<innerHeight,aspect=innerWidth/innerHeight;
      skyBody.scale.setScalar(portrait?Math.min(1,.82*aspect/.70):1);
      skyBody.position.set(x+Math.sin(x*.036)*(portrait?1.1:3)+(portrait?.35:9),portrait?6.5:4,-107);
      // Crop the far sky about its centre instead of stretching stars on a tablet.
      const artAspect=2021/778,crop=Math.min(1,aspect/artAspect),cropY=Math.min(1,artAspect/aspect);
      panorama.repeat.set(crop,cropY);
      panorama.offset.set((1-crop)*(.14+.72*clamp(x/length,0,1)),(1-cropY)*.5);
      animateWheel(dt,time);spaceSky?.update(dt);
      key.position.set(x-8,15,10);key.target.position.set(x,ground(x),0);
      motes.position.y=Math.sin(time*.38)*.15;glintUniforms.time.value=time;decorTick(time);
    }
    function update(dt,time){
      clock+=dt;gleam=Math.max(0,gleam-dt);
      sails.update(dt,time);view.ringSail=sails.phase;view.sailRepairs=sails.repaired;view.sailJourneys=sails.journeys;view.sailComplete=sails.complete;
      garden.update(dt,time);garden.park();view.iceBlooms=garden.collected;
      nursery.update(dt,time);view.nurserySeeds=nursery.planted;view.wheelTurned=wheelTurned;
      eclipse.update(dt,time);view.eclipse=eclipse.state;view.eclipseSeen=eclipse.seen;
      autoHelp(dt);
      // Opening: keep the pair and the first ice sail both in view (portrait too).
      if(!ride&&!sails.riding&&player.x<12.2&&sails.nextX===13)M.frameActivity(Math.min(player.x-1.6,dog.x-1.2),15.3,ground(11)+1.7,1.0);
      if(!ride&&!sails.riding){
        if(!tasks[1]&&close(dockX,6.4))M.parkForActivity(dockX-3.7,dockX-5.1,1);
        else if(!nursery.complete&&close(nurseryX,6.4))M.parkForActivity(nurseryX-3.7,nurseryX-5.0,1);
        else if(!tasks[0]&&close(harpX,6.4))M.parkForActivity(harpX-3.5,harpX-4.9,1);
      }
      const rising=!player.locked&&!player.grounded&&player.vy>2.7;
      // Walking and jumping never complete a registered experiment.
      jumpRose=rising;
      guide.visible=false;
      view.active=close(harpX)?'harp':close(dockX,7.5)?'scout':close(eyeX)?'observatory':close(eclipseX,6.5)?'eclipse':close(nurseryX,8.4)?'nursery':'';
      if(ride||sails.riding){guide.visible=false;}else if(view.active==='harp'&&!tasks[0]) {
        const next=harpNext();guide.position.set(next.x,next.y,0);
        guide.visible=true;
        dog.activityTargetX=next.x-1.15;dog.activityMode='look';dog.emote='curious';dog.lookY=.82;dog.lookX=.37;
        M.frameActivity(harpX-4.0,harpX+4.0,harpY+2.22,1.25);
      }else if(view.active==='scout'&&!tasks[1]){
        dog.activityTargetX=dockX-2.82;dog.activityMode='look';dog.emote='curious';dog.lookY=undocked?.82:.26;dog.lookX=.4;
        if(!flight){
          if(undocked){const q=samples.find(s=>!s.collected);guide.position.set(q.x,q.g.position.y,0);}
          else guide.position.set(paw.position.x,paw.position.y,.08);
          guide.visible=true;
        }else if(flight.phase==='carry'){
          const q=samples[flight.index];guide.position.set(q.jarX,q.jarY,.2);guide.visible=flight.id===null||!flight.dragged;
          dog.activityTargetX=q.jarX-1.0;dog.lookY=.16;
        }
        M.frameActivity(dockX-4.1,dockX+5.0,dockY+2.12,1.32);
      }else if(view.active==='nursery'&&!nursery.complete){
        const target=nursery.target;if(target){guide.position.set(target.x,target.y,.18);guide.visible=true;}
        dog.activityTargetX=nurseryX-4.6;dog.activityMode='look';dog.emote='curious';dog.lookY=.55;dog.lookX=.40;
        M.frameActivity(nurseryX-5.5,nurseryX+4.8,ground(nurseryX)+2.05,1.2);
      }else if(eclipse.watching&&close(eclipseX,8)&&Math.abs(player.vx)<.55){
        dog.activityTargetX=player.x-player.facing*1.65;dog.activityMode='look';dog.emote='curious';
        dog.lookY=.82;dog.lookX=clamp((eclipse.moonPosition-dog.x)*.11,-.48,.48);
      }else{
        if(Number.isFinite(dog.activityTargetX)){dog.activityTargetX=undefined;dog.activityMode=undefined;dog.emote='';dog.lookX=dog.lookY=0;}
        if(view.active==='observatory'&&shutter<0){if(taxiOn&&Math.abs(taxiX-eyeX)<5)guide.position.set(taxiX,ground(taxiX)+2.18,.20);else guide.position.set(eyeX,eyeY+1.9,.42);guide.visible=true;}
      }
      for(const sample of samples){sample.lid.visible=sample.collected;sample.lid.rotation.x=M.damp(sample.lid.rotation.x,sample.collected?0:1.62,5,dt);}
      guide.visible=guide.visible&&clock-lastGuideTouch>2.6;guideHand.position.y=.71+.06*Math.sin(clock*3.4);
      const th=clock*2.75,gl=1+.08*Math.sin(clock*3);
      guideHalo.visible=false;guideSpark.visible=false;guideHalo.rotation.z=th;guideHalo.scale.setScalar(gl*.45);guideSpark.position.set(.17*gl*Math.cos(th),.17*gl*Math.sin(th),0);
      if(!tasks[0]&&close(harpX,9)&&!player.locked){
        harpCallT+=dt;
        if(harpCallT>3.1){harpCallT=0;const c=harpNext();c.energy=Math.max(c.energy,.62);c.calling=1.6;M.sfx('saturn-chime-'+harp.indexOf(c));}
      }
      for(let i=0;i<3;i++){
        const q=harp[i];q.energy=Math.max(0,q.energy-dt*.65);q.calling=Math.max(0,(q.calling||0)-dt);
        q.mallet.rotation.z=-.42+q.energy*Math.sin((1-q.energy)*11)*.48;
        q.hanger.rotation.z=Math.sin(clock*1.25+i)*.022+q.energy*Math.sin((1-q.energy)*17)*.34;
        q.gem.rotation.y=.025*Math.sin(clock*1.2+i);q.ang.scale.setScalar(.34+q.energy*.07+(q.calling>0?.07*Math.sin(clock*12):0));q.gem.scale.setScalar(1+(q.calling>0&&!q.hit?.07*Math.sin(Math.PI*q.calling/1.6):0));moonLights[i].scale.setScalar(1+q.energy*.15*Math.sin((1-q.energy)*8));
        toyRings[i].rotation.y=.17+.08*Math.sin(clock*.64+i*.36);
        q.pump.visible=q.hit&&q.energy>.011;
        if(q.pump.visible){
          const progress=(1-q.energy)*1.55;
          for(let j=0;j<14;j++){
            const a=clamp(progress-j*.024,0,1);
            q.wavePath.getPoint(a,noteHead);q.pathPos[j*3]=noteHead.x;q.pathPos[j*3+1]=noteHead.y;q.pathPos[j*3+2]=noteHead.z;
          }
          q.pathGeometry.attributes.position.needsUpdate=true;q.pathColor.opacity=Math.min(.90,q.energy*2);
        }
        // Jumping directly beneath a resonator also makes its crystal sing.
        // Each chime needs its own visible crystal touch.
        const s=samples[i];
        if(!s.collected&&(!flight||flight.index!==i)){s.g.position.y=s.y+Math.sin(clock*1.35+i)*.13;s.g.rotation.y=.22*Math.sin(clock*.63+i);}
        const chosen=flight?.index===i&&!s.collected;
        s.outline.visible=!s.collected;s.lipMaterial.opacity=chosen?.76+.20*Math.sin(clock*3.45):.56;
        s.socketRing.scale.set(chosen?.51+.055*Math.sin(clock*3.45):.47,.38,.47);
      }
      const flapping=flight?.phase==='hook'?4.1:1.9;
      wings[0].rotation.z=-.23+.12*Math.sin(clock*flapping);wings[1].rotation.z=-wings[0].rotation.z;
      aerial.rotation.z=.22+.13*Math.sin(clock*2.2);aerialLamp.scale.setScalar(.059+.008*Math.sin(clock*4.5));
      const closed=flight?.phase==='carry'||flight?.phase==='place';
      for(let i=0;i<2;i++){
        const sign=i?1:-1;claws[i].rotation.z=M.damp(claws[i].rotation.z,sign*(closed?-.24:.38),6.6,dt);
        pupils[i].position.x=M.damp(pupils[i].position.x,flight?clamp((flight.targetX-scout.position.x)*.03,-.038,.038):.012*Math.sin(clock*1.5),7,dt);
      }
      filingLine.visible=false;
      if(flight){
        const f=flight,s=samples[f.index];f.time+=dt;f.pulse=Math.max(0,f.pulse-dt*.85);
        if(f.phase==='hook'){
          const u=ease(clamp(f.time/.67,0,1));
          scout.position.set(M.lerp(f.fromX,s.x,u),M.lerp(f.fromY,s.g.position.y+.58,u)+Math.sin(Math.PI*u)*.21,-.56);
          scout.rotation.z=-.16*Math.sin(Math.PI*u)*Math.sign(s.x-f.fromX);
          if(u>=1){f.phase='carry';f.time=0;view.scout='carry';if(!f.dragged){f.targetX=s.x;f.targetY=s.y-.19;}if(f.pendingPlace)placeShard();}
        }else if(f.phase==='carry'){
          s.g.position.x=M.damp(s.g.position.x,f.targetX,14,dt);s.g.position.y=M.damp(s.g.position.y,f.targetY,14,dt);
          s.g.position.z=M.damp(s.g.position.z,.12,8,dt);s.g.rotation.y=.16*Math.sin(clock*1.58);
          scout.position.set(s.g.position.x,s.g.position.y+.79,s.g.position.z-.14);
          scout.rotation.z=M.damp(scout.rotation.z,clamp((f.targetX-s.g.position.x)*-.14,-.25,.25),7,dt);
          filingLine.visible=true;
          filingMat.color.copy(mats.shine[f.index].color);filingMat.opacity=.46+.31*f.pulse;
          for(let i=0;i<trailCount;i++){
            const t=(i/trailCount+clock*.29)%1,u=ease(t);
            filingDots[3*i]=M.lerp(s.g.position.x,s.jarX,u)+.11*Math.sin(t*Math.PI);
            filingDots[3*i+1]=M.lerp(s.g.position.y-.29,s.jarY+.14,u)+.16*Math.sin(Math.PI*t);
            filingDots[3*i+2]=.26;
          }
          filingG.attributes.position.needsUpdate=true;
        }else{
          const t=clamp(f.time/.72,0,1),u=ease(t);
          s.g.position.set(M.lerp(f.fromX,s.jarX,u),M.lerp(f.fromY,s.jarY,u)+.17*Math.sin(Math.PI*t),.12);
          s.g.scale.setScalar(1-.28*u);scout.position.set(s.g.position.x,s.g.position.y+.79+.23*u,-.04);
          scout.rotation.z=.09*Math.sin(t*Math.PI);
          if(t>=1){
            s.collected=true;s.outline.visible=false;view.samples++;flight=null;
            view.scout=view.samples===3?'docked':'choose';M.sfx('saturn-cradle');
            if(view.samples===3){undocked=false;finishTask(1,dockX,dockY+1.4);}
          }
        }
      }else{
        const targetY=dockY+(undocked?2.12:1.55)+Math.sin(clock*1.95)*.10+gleam*.22;
        scout.position.x=M.damp(scout.position.x,dockX,3.6,dt);
        scout.position.y=M.damp(scout.position.y,targetY,4,dt);
        scout.position.z=M.damp(scout.position.z,-.58,4,dt);
        scout.rotation.z=M.damp(scout.rotation.z,Math.sin(clock*1.6)*.045,5,dt);
      }
      paw.scale.setScalar(1+(!M.playGuideActive&&!tasks[1]&&!undocked&&close(dockX)?Math.sin(clock*3.2)*.07:0));
      updateTaxi(dt);
      updateFamily(dt,time);view.finale=finalePhase;view.familyGrow=familyGrow;view.familyFeza=familyFeza;view.familyBilbo=familyBilbo;
      view.cue=clock<7&&player.x<22?'ringsHello':close(harpX,9)&&!tasks[0]?'ringsHarp':close(dockX,10)&&!tasks[1]?'ringsScout':close(eyeX,9)&&finalePhase==='ready'&&!view.finished?'ringsPhoto':'';
      if(close(eyeX,12)&&finalePhase==='invite'){
        guide.position.set(familyFeza?familyPaw.position.x:familyLever.position.x,eyeY+(familyFeza?.55:1.65),.12);guide.visible=true;
      }
      if(shutter>=0){
        shutter+=dt;const u=ease(clamp(shutter/1.35,0,1));photo.position.y=eyeY+.36+u*.98;photo.scale.setScalar(.24+u*.76);
        photo.rotation.z=-.09*u;lens.rotation.z=Math.sin(Math.min(shutter*10,Math.PI))*-.065;
        if(shutter>=1.35&&!photoPending&&view.photo!=='retry'&&!view.finished){finishTask(2,eyeX,eyeY+2.3);view.finished=true;}
      }
      if(M.playGuideActive){guide.visible=false;filingLine.visible=false;}
    }
    function activateAt(p,id) {
      // A journey always finishes at its stop: no accidental hop-off midway.
      if(ride)return Math.abs(p.x-taxiX)<1.9&&Math.abs(p.y-taxi.position.y)<1.05;
      if(taxiOn&&Math.abs(nextStop()-taxiX)>6.6&&close(taxiX,10)&&Math.abs(p.x-taxiX)<1.78&&p.y>=ground(taxiX)-.1&&p.y<ground(taxiX)+3.1){boardTaxi();return true;}
      if(close(harpX,12)){
        for(let i=0;i<3;i++){const q=harp[i];if(M.touchPlayPart?M.touchPlayPart(p,q.gem,.18):Math.abs(p.x-q.x)<.78&&Math.abs(p.y-q.y)<.72){chime(i);return true;}}
      }
      if(close(dockX,12)){
        if(flight&&flight.phase!=='place'){
          const q=samples[flight.index];
          if(inBerth(p,q)){placeShard();return true;}
          if(Math.abs(p.x-q.g.position.x)<1.02&&Math.abs(p.y-q.g.position.y)<1.05){startFlight(flight.index,id,p);return true;}
        }
        for(let i=0;i<3;i++){
          const q=samples[i];if(!q.collected&&Math.abs(p.x-q.x)<1.10&&Math.abs(p.y-q.g.position.y)<1.02)return startFlight(i,id,p);
        }
      }
      if(close(eyeX,10)&&Math.abs(p.x-eyeX)<1.48&&Math.abs(p.y-eyeY-1.72)<1.40){if(!familyReady()){if(!taxiOn||Math.abs(taxiX-eyeX)>6.6){showTaxi();return true;}return false;}if(finalePhase==='ready'&&shutter<0&&!photoPending){capturePhoto();return true;}}
      return false;
    }
    function pointer(type,p,e){
      if(type==='down')helpInputAt=clock;
      if((type==='cancel'||!ride)&&eclipse.pointer(type,p,e))return true;
      if((type==='cancel'||!ride)&&sails.pointer(type,p,e))return true;
      if((type==='cancel'||!ride)&&familyPointer(type,p,e))return true;
      if((type==='cancel'||!ride)&&nursery.pointer(type,p,e))return true;
      if(type==='cancel'){
        if(!e||e.pointerId===spinPointer)releaseWheel(e,true);
        if(flight&&(!e||flight.id===e.pointerId)){flight.id=null;if(flight.dragged)flight.targetY=Math.max(flight.targetY,dockY+1.4);}
        garden.rub('cancel',p,e?e.pointerId:0);if(!e)garden.rub('cancel',p,undefined);
        if(e)held.delete(e.pointerId);else held.clear();return false;
      }
      const id=e?e.pointerId:0;
      if(type==='down'){
        if(!ride&&grabWheel(id,e,p)){held.add(id);return true;}
        if(!garden.touch(p,id)&&!activateAt(p,id))return false;held.add(id);return true;
      }
      garden.rub(type,p,id);
      if(flight&&flight.id===id)carryDrag(type,p,id);
      if(id===spinPointer){if(type==='move')dragWheel(e,p);else if(type==='up')releaseWheel(e,false);}
      const owned=held.has(id);if(type==='up')held.delete(id);return owned;
    }
    // Otomatik yardım (4 yaş): yakındaki mini oyunda 16 sn ilerleme ve dokunuş yoksa
    // sıradaki adımı oyun kendisi yapar; sonra her 2,2 sn'de bir adım daha.
    let helpKey='',helpT=0,helpInputAt=-99,helping=false,stuckT=0;
    function helpTarget(){
      if(ride||sails.riding||player.locked)return '';
      if(!tasks[0]&&close(harpX,12))return 'harp'+view.chimes;
      if(!tasks[1]&&close(dockX,12)&&player.x<dockX+5)return 'dock'+view.samples+(flight?flight.phase:'')+undocked;
      if(!wheelTurned&&Math.abs(player.x-wheelX)<7.8)return 'wheel';
      if(garden.collected<3&&garden.nextX!==null&&Math.abs(player.x-garden.nextX)<6)return 'garden'+garden.collected;
      if(!eclipse.seen&&Math.abs(player.x-eclipseX)<8)return 'eclipse';
      if(!nursery.complete&&close(nurseryX,11))return 'nursery'+nursery.planted;
      if(close(eyeX,9)&&familyReady()&&!view.finished&&shutter<0&&!photoPending)return 'family'+familyFeza+familyBilbo+finalePhase;
      return '';
    }
    function autoHelp(dt){
      const key=helpTarget();view.help=key;
      if(key!==helpKey){helpKey=key;stuckT=0;if(!key)helping=false;helpT=helping&&key?13.8:0;return;}
      if(!key||held.size||flight?.id!=null||spinPointer!==null)return;
      // Many unsuccessful touches must not block help forever: after ~24 s on one step it helps anyway.
      stuckT+=dt*(window.SATURN_HELP_FAST?12:1);
      if(clock-helpInputAt<4&&stuckT<24){helpT=Math.min(helpT,12);helping=false;}
      helpT+=dt*(window.SATURN_HELP_FAST?12:1);
      if(helpT>16){helpT=13.8;stuckT=Math.min(stuckT,20);helping=true;if(key.startsWith('garden'))garden.help();else if(key==='wheel')impulse(1);else if(key==='eclipse')eclipse.help();else if(key.startsWith('nursery'))nursery.help();else interact();}
    }
    function interact(){
      if(!ride&&sails.interact())return true;
      if(ride)return true;
      if(Math.abs(player.x-wheelX)<4.4){impulse(player.facing);return true;}
      if(taxiOn&&close(taxiX,2.1)&&Math.abs(nextStop()-taxiX)>6.6){boardTaxi();return true;}
      if(garden.interact()||eclipse.interact()||nursery.interact())return true;
      if(close(harpX,9)){chime(harpOrder[Math.min(view.chimes,2)]);return true;}
      if(close(dockX,9)){if(flight)placeShard();else launchScout();return true;}
      if(close(eyeX,9)){
        if(familyReady()&&finalePhase!=='ready'){
          inviteFamily();if(!familyFeza)familyFeza=true;else familyBilbo=true;
        }else capturePhoto();
        return true;
      }
      return false;
    }
    function jump(){
      if(ride)return true;
      return sails.jump();
    }

    const free=()=>!player.locked&&!ride&&!sails.riding;
    function lesson(id,x,goal,completed,describe,enabled=free){lessons.push({id,x,y:()=>ground(typeof x==='function'?x():x),goal,completed,enabled,describe});}
    lessons.push(...sails.lessons,...garden.lessons);
    lesson('saturn-harp',harpX,'moon-lights',()=>tasks[0],step=>{if(!free()||tasks[0]||!close(harpX,12))return false;const q=harpNext();if(!q||q.hit)return false;q.gem.getWorldPosition(step.from);step.to.copy(step.from);step.action='tap';step.progress=view.chimes;step.total=3;step.sourceIcon='bell';step.goalIcon='moon-lights';return true;});
    lesson('saturn-probe-samples',dockX,'samples',()=>tasks[1],step=>{if(!free()||tasks[1]||!close(dockX,12)||flight?.phase==='place')return false;let q=flight?samples[flight.index]:null;for(let i=0;!q&&i<samples.length;i++)if(!samples[i].collected)q=samples[i];if(!q)return false;q.g.getWorldPosition(step.from);step.to.set(q.jarX,q.jarY,.12);step.demoObject=q.g;step.action='drag';step.progress=view.samples;step.total=3;step.sourceIcon='sample';step.goalIcon='samples';return true;});
    const turnAxis=new T.Vector3(0,0,1),orreryPointAt=(u,out)=>wheel.mobile.localToWorld(out.copy(wheel.pea.position).applyAxisAngle(turnAxis,1.4*u));
    lesson('saturn-orrery',wheelX,'rings',()=>wheelTurned,step=>{if(!free()||wheelTurned||!close(wheelX,7.8))return false;wheel.pea.getWorldPosition(step.from);wheel.mobile.localToWorld(step.to.copy(wheel.pea.position).applyAxisAngle(turnAxis,1.4));wheel.mobile.getWorldPosition(step.pivot);step.startAngle=Math.atan2(step.from.y-step.pivot.y,step.from.x-step.pivot.x);const end=Math.atan2(step.to.y-step.pivot.y,step.to.x-step.pivot.x);step.endAngle=step.startAngle+Math.atan2(Math.sin(end-step.startAngle),Math.cos(end-step.startAngle));step.pointAt=orreryPointAt;step.action='turn';step.progress=0;step.total=1;step.sourceIcon='marble';step.goalIcon='rings';return true;});
    lesson('saturn-eclipse',eclipseX,'eclipse',()=>eclipse.seen,eclipse.describe);
    lesson('saturn-nursery',nurseryX,'flowers',()=>nursery.complete,nursery.describe);
    lesson('saturn-family-photo',eyeX,'photo',()=>view.finished,step=>{if(!free()||!familyReady()||view.finished||shutter>=0)return false;step.progress=Number(familyFeza)+Number(familyBilbo);step.total=3;if(!familyFeza){leverHandle.getWorldPosition(step.from);step.to.copy(step.from);step.to.y-=.80;step.action='drag';step.sourceIcon='handle';step.goalIcon='flowers';}else if(!familyBilbo){familyPaw.getWorldPosition(step.from);step.from.y+=.12;step.to.copy(step.from);step.action='tap';step.sourceIcon='paw';step.goalIcon='flowers';}else{if(finalePhase!=='ready'||photoPending)return false;lens.getWorldPosition(step.from);step.to.copy(step.from);step.action='tap';step.sourceIcon='camera';step.goalIcon='photo';}return true;},()=>free()&&familyReady());
    lesson('saturn-taxi-call',eyeX,'boat',familyReady,step=>{if(familyReady()||!free()||!taxiFar(eyeX)||(taxiOn&&Math.abs(taxiX-eyeX)<6.6))return false;lens.getWorldPosition(step.from);step.to.copy(step.from);step.action='tap';step.sourceIcon='paw';step.goalIcon='boat';step.progress=0;step.total=1;return true;},()=>free()&&!familyReady()&&taxiFar(eyeX)&&(!taxiOn||Math.abs(taxiX-eyeX)>6.6));
    lesson('saturn-taxi-board',()=>taxiX,'boat',()=>familyReady()&&Math.abs(taxiX-eyeX)<6.6,step=>{if(!free()||!taxiOn||Math.abs(nextStop()-taxiX)<=6.6||!taxiFar(taxiX))return false;taxi.localToWorld(step.from.set(0,.30,.30));step.to.copy(step.from);step.action='tap';step.sourceIcon='footsteps';step.goalIcon='boat';step.progress=0;step.total=1;return true;},()=>free()&&taxiOn&&Math.abs(nextStop()-taxiX)>6.6&&taxiFar(taxiX));
    const probeLesson=lessons.find(l=>l.id==='saturn-probe-samples');probeLesson.demoSources=samples.map(s=>s.g);lessons.find(l=>l.id==='saturn-nursery').demoSources=nursery.demoSources;
    view.lessonCount=lessons.length;
    const world={length,ground,platforms,warmPositions:[8,26,43,63,90,115,137,155,167,191,215,242,263,287],update:worldUpdate,zone(x){return x<55?'Buz yelkeni iskelesi':x<75?'Buz çanları':x<131?'Kehribar halka geçidi':x<147?'Halka oyuncağı':x<174?'Çoban sonda ve çiçekler':x<233?'Kristal boğazı':x<251?'Tutulma atölyesi':x<278?'Halka fidanlığı':'Aile gözlemevi';}};
    return {world,activities:{lessons,update,pointer,interact,jump,prepare:preparePhoto,dispose(){disposePhoto();try{spaceSky?.dispose();}catch(_){}spaceSky=null;},state:()=>view}};
  };
})(window.MARS);
