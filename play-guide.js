(function(M){
 'use strict';
 const T=THREE;
 const palette=['#80d9d0','#efc47e','#cbb0e6'];
 function picture(c,kind,x,y,size,progress=0,total=3){
  c.save();c.translate(x,y);c.scale(size/100,size/100);c.lineJoin='round';c.lineCap='round';c.lineWidth=3;c.strokeStyle='#e6e9d8';
  function oval(x,y,rx,ry,colour){c.fillStyle=colour;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function line(points,colour='#f5e7c6',width=4){c.strokeStyle=colour;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  function rock(x,y,r,colour){c.fillStyle=colour;c.beginPath();c.moveTo(x-r,y+r*.5);c.lineTo(x-r*.75,y-r*.4);c.lineTo(x+r*.1,y-r);c.lineTo(x+r,y-r*.2);c.lineTo(x+r*.72,y+r*.75);c.closePath();c.fill();line([[x-r*.75,y-r*.4],[x,y],[x+r*.1,y-r]],'#f2f0d1',1.4);}
  if(kind==='submarine'){
   c.fillStyle='#e7c57d';c.beginPath();c.roundRect(-38,-17,75,43,21);c.fill();c.fillStyle='#c79c61';c.fillRect(-16,-26,32,11);line([[4,-27],[4,-41],[20,-41]],'#e2dac1',6);oval(23,-41,5,7,'#8ccfc9');for(const x of[-17,9]){oval(x,2,12,12,'#f0dda8');oval(x,2,8,8,'#477a8a');oval(x-3,-2,3,3,'#c9ebe3');}line([[-41,-11],[-41,20]],'#93b5af',6);line([[-35,29],[22,29]],'#e5cd9e',4);c.fillStyle='#86c2c2';c.beginPath();c.moveTo(24,10);c.lineTo(45,26);c.lineTo(21,24);c.closePath();c.fill();
  }else if(kind==='loop'){
   line([[0,-44],[0,-20]],'#ded0b0',6);oval(0,6,31,35,'#edc992');oval(0,6,21,25,'#2d5c67');c.strokeStyle='#fff0c8';c.lineWidth=3;c.beginPath();c.ellipse(0,6,27,31,0,Math.PI,Math.PI*1.8);c.stroke();line([[-12,-22],[12,-22]],'#91cfc8',8);
  }else if(kind==='camp'){
   c.fillStyle='#91c6c5';c.beginPath();c.arc(0,12,36,Math.PI,Math.PI*2);c.lineTo(36,34);c.lineTo(-36,34);c.closePath();c.fill();line([[-39,35],[39,35]],'#dbc294',6);line([[0,-23],[0,34]],'#dce9d5',3);c.fillStyle='#2c596b';c.beginPath();c.roundRect(-11,4,22,30,[10,10,0,0]);c.fill();for(const xx of[-25,25]){oval(xx,5,7,9,'#d8e9d7');oval(xx,5,4,6,'#5699ac');}line([[31,-5],[40,-22],[48,-22]],'#d6c6a0',3);oval(47,-24,5,5,'#f2d28f');
  }else if(kind==='star'){
   c.fillStyle='#edc57e';c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?18:43;c[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();line([[-10,-5],[0,-27],[8,-7]],'#fff0bf',3);
  }else if(kind==='crystal'){
   c.fillStyle='#99d9df';c.beginPath();c.moveTo(-27,-23);c.lineTo(9,-40);c.lineTo(31,-8);c.lineTo(24,30);c.lineTo(-7,42);c.lineTo(-31,15);c.closePath();c.fill();c.fillStyle='#d3eee3';c.beginPath();c.moveTo(-27,-23);c.lineTo(9,-40);c.lineTo(8,-5);c.lineTo(-10,20);c.closePath();c.fill();line([[-27,-23],[8,-5],[31,-8]],'#eef5df',2);line([[8,-5],[-7,42]],'#70b7c6',2);line([[-10,20],[24,30]],'#cceee4',2);
  }else if(kind==='waterwheel'){
   line([[-35,39],[-25,-5],[25,-5],[35,39]],'#d4b787',5);oval(0,-2,28,28,'#547e83');c.strokeStyle='#e4c899';c.lineWidth=7;c.beginPath();c.arc(0,-2,25,0,Math.PI*2);c.stroke();for(let i=0;i<6;i++){c.save();c.translate(0,-2);c.rotate(i*Math.PI/3);line([[0,0],[0,-27]],'#d4b889',4);c.fillStyle='#96d5cd';c.beginPath();c.roundRect(-10,-40,20,13,3);c.fill();c.restore();}oval(0,-2,7,7,'#edce93');line([[-43,40],[-21,36],[0,41],[22,37],[44,41]],'#98d6dc',4);
  }else if(kind==='marble'){
   oval(0,0,34,34,'#dfc488');oval(-9,-11,17,16,'#f0dca9');oval(-14,-15,6,6,'#fff3cf');c.strokeStyle='#a3b6ad';c.lineWidth=4;c.beginPath();c.arc(0,0,35,.2,2.8);c.stroke();
  }else if(kind==='rings'){
   oval(0,0,23,23,'#d8c598');c.strokeStyle='#a7d7cb';c.lineWidth=4;c.beginPath();c.ellipse(0,0,48,15,-.43,0,Math.PI*2);c.stroke();c.strokeStyle='#e9d4a1';c.lineWidth=3;c.beginPath();c.ellipse(0,0,39,26,.62,0,Math.PI*2);c.stroke();oval(36,-17,7,7,'#eed38c');oval(-29,-22,5,5,'#9cd5cf');
  }else if(kind==='rocket'){
   c.fillStyle='#e8e5cf';c.beginPath();c.moveTo(0,-44);c.bezierCurveTo(-27,-21,-23,13,-18,31);c.lineTo(18,31);c.bezierCurveTo(23,13,27,-21,0,-44);c.closePath();c.fill();c.fillStyle='#91c7c3';c.beginPath();c.moveTo(-18,2);c.lineTo(-38,31);c.lineTo(-17,25);c.fill();c.beginPath();c.moveTo(18,2);c.lineTo(38,31);c.lineTo(17,25);c.fill();oval(0,-11,13,13,'#d8b47c');oval(0,-11,8,8,'#3a707e');line([[-11,29],[11,29]],'#b79b73',6);c.fillStyle='#e9b476';c.beginPath();c.moveTo(-9,34);c.quadraticCurveTo(0,60,9,34);c.closePath();c.fill();
  }else if(kind==='lava-samples'){
   for(let i=0;i<3;i++){const xx=(i-1)*31;c.fillStyle='#a6d9d82b';c.beginPath();c.roundRect(xx-12,-28,24,61,4);c.fill();c.strokeStyle='#badad0';c.lineWidth=2;c.stroke();c.fillStyle=['#e47650','#eea96c','#d6896b'][i];c.fillRect(xx-9,-4-i*3,18,33+i*3);rock(xx,13,7,['#bf5842','#d5894b','#995b4d'][i]);c.fillStyle='#d8bb8f';c.fillRect(xx-14,-33,28,7);c.fillRect(xx-14,31,28,5);line([[xx-7,-22],[xx-7,-9]],'#f1f6de',2);}
  }else if(kind==='hot-cold-rocks'){
   for(let i=0;i<2;i++){const xx=i?26:-26;c.fillStyle='#b7c8b82b';c.fillRect(xx-22,-20,44,59);c.strokeStyle='#d7c395';c.lineWidth=2;c.strokeRect(xx-22,-20,44,59);rock(xx,16,17,i?'#9db7be':'#df885b');if(!i)for(let n=0;n<3;n++)line([[xx-10+n*10,-1],[xx-13+n*10,-9],[xx-9+n*10,-16]],'#f4c28d',2);}
  }else if(kind==='lid'){
   c.fillStyle='#e5c690';c.beginPath();c.ellipse(0,-6,36,17,0,0,Math.PI*2);c.fill();c.fillRect(-36,-6,72,27);c.beginPath();c.ellipse(0,21,36,12,0,0,Math.PI);c.fill();c.strokeStyle='#9f805c';c.lineWidth=3;for(let i=-3;i<=3;i++){const xx=i*9;line([[xx,1],[xx,21]],'#b6996e',3);}c.strokeStyle='#f6e8c4';c.lineWidth=3;c.beginPath();c.ellipse(0,-6,28,11,0,0,Math.PI*2);c.stroke();
  }else if(kind==='airboat'){
   oval(0,-18,31,22,'#ead5a1');oval(0,-18,18,22,'#9cd0c5');line([[-23,-2],[-18,25],[18,25],[23,-2]],'#e5c794',2);c.fillStyle='#cca573';c.beginPath();c.moveTo(-36,23);c.quadraticCurveTo(0,44,36,23);c.lineTo(25,40);c.quadraticCurveTo(0,52,-25,40);c.closePath();c.fill();line([[-27,29],[27,29]],'#f2ddaf',3);
  }else if(kind==='bellows'){
   c.fillStyle='#bd9d76';c.beginPath();c.moveTo(-35,-25);c.lineTo(30,-29);c.lineTo(39,-20);c.lineTo(-27,-14);c.closePath();c.fill();for(let i=0;i<5;i++){const yy=-13+i*9;c.fillStyle=i%2?'#b58167':'#d9af81';c.beginPath();c.moveTo(-29,yy);c.lineTo(31,yy-4);c.lineTo(38,yy+2);c.lineTo(-33,yy+7);c.closePath();c.fill();}line([[-35,34],[37,28]],'#e5c99d',8);line([[-26,-31],[14,-34]],'#c9d8ca',5);c.strokeStyle='#91cbc5';c.lineWidth=6;c.beginPath();c.moveTo(34,17);c.bezierCurveTo(53,18,35,39,48,43);c.stroke();
  }else if(kind==='ballast'){
   c.fillStyle='#a6b8b4';c.beginPath();c.moveTo(-19,-18);c.lineTo(19,-18);c.lineTo(33,29);c.lineTo(-33,29);c.closePath();c.fill();line([[-20,-17],[-17,-35],[17,-35],[20,-17]],'#e1c18c',7);line([[-22,4],[22,4]],'#738b8c',3);for(const xx of[-22,22])oval(xx,20,3,3,'#e9ddbe');
  }else if(kind==='hatch'){
   c.fillStyle='#7cb9b9';c.beginPath();c.ellipse(0,24,43,16,0,0,Math.PI*2);c.fill();oval(0,24,31,10,'#213e4a');c.save();c.translate(-5,-9);c.rotate(-.48);oval(0,0,39,22,'#d9d9bc');c.strokeStyle='#e9c98c';c.lineWidth=4;c.beginPath();c.ellipse(0,0,39,22,0,0,Math.PI*2);c.stroke();line([[-16,1],[16,1]],'#56898d',5);c.restore();line([[-33,11],[-24,0]],'#b6cfc2',7);
  }else if(kind==='bud'){
   c.fillStyle='#85ced32b';c.beginPath();c.ellipse(0,0,36,43,0,Math.PI,Math.PI*2);c.lineTo(36,26);c.lineTo(-36,26);c.closePath();c.fill();c.strokeStyle='#c6e7dc';c.lineWidth=2;c.stroke();line([[0,22],[0,-11]],'#93cba4',5);c.fillStyle='#8fcfa6';for(const side of[-1,1]){c.beginPath();c.ellipse(side*12,10,14,6,side*.45,0,Math.PI*2);c.fill();}oval(0,-20,13,18,'#eacda2');oval(-7,-20,7,16,'#d9b08d');oval(7,-20,7,16,'#f2dbaa');c.fillStyle='#b9916f';c.beginPath();c.moveTo(-17,22);c.lineTo(17,22);c.lineTo(13,43);c.lineTo(-13,43);c.closePath();c.fill();line([[-19,23],[19,23]],'#e3c69c',5);
  }else if(kind==='moon-lights'){
   line([[-47,-29],[0,-20],[47,-29]],'#c6d4bd',3);for(let i=0;i<3;i++){const x=(i-1)*32,y=i===1?12:4;line([[x,-24],[x,y-18]],'#d7c69d',2);oval(x,y,16,18,'#f5d58b');oval(x+8,y-5,13,16,'#244a58');oval(x-5,y+2,4,6,'#ffe9ad');}
  }else if(kind==='moon'){
   oval(0,0,37,37,'#d7d7c8');for(const[x,y,z]of[[-15,-16,9],[13,9,12],[-18,17,6],[18,-18,5]]){oval(x,y,z,z,'#a5b2b5');c.strokeStyle='#edf0d6';c.lineWidth=1.5;c.beginPath();c.arc(x,y,z,0,Math.PI*1.1);c.stroke();}
  }else if(kind==='mirror'){
   line([[0,18],[0,40],[-25,40],[25,40]],'#ddc390',5);oval(0,-6,31,35,'#c2e4e1');c.strokeStyle='#c69f70';c.lineWidth=5;c.beginPath();c.ellipse(0,-6,31,35,0,0,Math.PI*2);c.stroke();line([[-17,-3],[5,-24]],'#f5fff1',5);line([[-8,13],[16,-11]],'#f5fff1',2);
  }else if(kind==='plug'){
   line([[-40,31],[-22,31],[-22,6]],'#dfb987',6);c.fillStyle='#e8b57b';c.beginPath();c.roundRect(-31,-17,48,38,7);c.fill();line([[-19,-18],[-19,-36]],'#d5dfd1',7);line([[5,-18],[5,-36]],'#d5dfd1',7);line([[-23,0],[9,0]],'#f7dec0',3);
  }else if(kind==='tile'){
   for(let i=0;i<3;i++){const xx=(i-1)*32;c.fillStyle='#467d88';c.fillRect(xx-13,-24,26,48);c.strokeStyle='#d5c194';c.lineWidth=2;c.strokeRect(xx-13,-24,26,48);line([[xx-8,8],[xx,0],[xx+6,-12]],'#d4e8d4',1.5);for(const[dx,dy]of[[-8,8],[0,0],[6,-12]])oval(xx+dx,dy,2.5,2.5,'#ffe7b0');}
  }else if(kind==='gate'||kind==='ice-gate'){
   line([[-42,39],[-42,-38],[42,-38],[42,39]],'#dfc698',7);if(kind==='gate'){for(const side of[-1,1]){c.fillStyle=side<0?'#8fcfc9':'#baacda';c.beginPath();c.moveTo(side*38,-34);c.lineTo(side*5,-34);c.quadraticCurveTo(side*13,0,side*29,9);c.lineTo(side*22,36);c.lineTo(side*38,36);c.closePath();c.fill();line([[side*31,2],[side*23,6]],'#e8d6ac',4);}}else for(const side of[-1,1]){c.fillStyle=side<0?'#a6d9e5':'#c2bfe4';c.beginPath();c.moveTo(side*39,36);c.lineTo(side*23,36);c.lineTo(side*26,-21);c.lineTo(side*34,-34);c.lineTo(side*43,-14);c.closePath();c.fill();}line([[-16,38],[0,22],[16,38]],'#e7ddba',4);
  }else if(kind==='canopy'){
   c.fillStyle='#91d6db55';c.beginPath();c.ellipse(0,7,40,35,0,Math.PI,Math.PI*2);c.lineTo(40,16);c.lineTo(-40,16);c.closePath();c.fill();c.strokeStyle='#d7e7d6';c.lineWidth=4;c.stroke();line([[-38,16],[38,16]],'#e5c48f',6);line([[-25,1],[-16,-16]],'#eafff3',3);
  }else if(kind==='solar-panel'){
   c.fillStyle='#245264';c.fillRect(-40,-26,80,46);c.strokeStyle='#afd0cc';c.lineWidth=3;c.strokeRect(-40,-26,80,46);for(let i=-2;i<=2;i++)line([[i*14,-23],[i*14,17]],'#86b7bc',2);line([[-38,-3],[38,-3]],'#86b7bc',2);line([[0,22],[0,37],[-22,37],[22,37]],'#dec28f',5);
  }else if(kind==='water-sample'){
   c.fillStyle='#9bd1d033';c.beginPath();c.roundRect(-25,-23,50,62,8);c.fill();c.strokeStyle='#b8ded5';c.lineWidth=3;c.stroke();c.fillStyle='#73c9c6';c.fillRect(-21,6,42,28);c.fillStyle='#e8c58a';c.fillRect(-28,-31,56,12);line([[-15,-14],[-15,0]],'#f1fae8',3);
  }else if(kind==='sample'){
   c.fillStyle='#d8ccaa';c.beginPath();c.ellipse(0,24,44,12,0,0,Math.PI*2);c.fill();rock(0,1,26,'#a3d3d2');
  }else if(kind==='paw'){
   oval(0,17,23,19,'#e2cb9e');for(const [x,y]of[[-27,-9],[-11,-26],[12,-26],[29,-9]])oval(x,y,10,12,'#e2cb9e');
  }else if(kind==='radio'){
   line([[-22,34],[-9,8],[8,-20]],'#d8dcca',6);c.fillStyle='#9cd5cf';c.beginPath();c.moveTo(-36,-19);c.quadraticCurveTo(-13,29,22,-14);c.lineTo(-36,-19);c.fill();for(let i=0;i<3;i++){c.strokeStyle='#efd298';c.lineWidth=3;c.beginPath();c.arc(18,-12,12+i*11,-1.0,.4);c.stroke();}line([[-36,37],[9,37]],'#e7c98d',6);
  }else if(kind==='snowflake'||kind==='snowflakes'){
   const positions=kind==='snowflake'?[[0,0,1]]:[[-32,-21,.45],[0,-21,.45],[32,-21,.45],[-32,22,.45],[0,22,.45],[32,22,.45]];for(const[xx,yy,scale]of positions){c.save();c.translate(xx,yy);c.scale(scale,scale);for(let i=0;i<6;i++){const a=i*Math.PI/3;c.save();c.rotate(a);line([[0,0],[0,-37]],'#c2ece8',4);line([[-9,-23],[0,-15],[9,-23]],'#eaf8e9',3);c.restore();}c.restore();}
  }else if(kind==='aurora'){
   for(let i=0;i<3;i++){c.strokeStyle=['#8ddbcc','#afbcdf','#c9e7d7'][i];c.lineWidth=9;c.beginPath();c.moveTo(-43,-19+i*19);c.bezierCurveTo(-18,-42+i*17,-8,24+i*15,42,-24+i*16);c.stroke();}
  }else if(kind==='panel'){
   for(let i=0;i<3;i++){c.save();c.translate(0,(i-1)*23);c.rotate((i-1)*.06);c.fillStyle=palette[i];c.beginPath();c.roundRect(-38,-9,76,18,3);c.fill();for(const xx of[-31,31])for(const yy of[-4,4])oval(xx,yy,1.8,1.8,'#f6e5bf');line([[-22,-3],[22,-3]],'#f1e4c355',2);c.restore();}
  }else if(kind==='handle'){
   c.fillStyle='#376777';c.fillRect(-24,-28,48,66);c.strokeStyle='#a7d8cc';c.lineWidth=3;c.strokeRect(-24,-28,48,66);line([[0,24],[9,-19]],'#e3d7bb',8);line([[-7,-22],[23,-16]],'#e8b082',12);oval(0,24,8,8,'#e1c28a');
  }else if(kind==='valve'){
   c.strokeStyle='#eac58c';c.lineWidth=8;c.beginPath();c.arc(0,0,33,0,Math.PI*2);c.stroke();for(let i=0;i<3;i++){const a=i*Math.PI*2/3;line([[0,0],[Math.cos(a)*31,Math.sin(a)*31]],'#bcd7c9',5);}oval(0,0,9,9,'#6eb2b0');oval(29,-13,7,7,'#efb18d');
  }else if(kind==='basket'){
   c.fillStyle='#c19c6a';c.beginPath();c.moveTo(-37,-20);c.lineTo(37,-20);c.lineTo(28,32);c.lineTo(-28,32);c.closePath();c.fill();for(let i=0;i<5;i++)line([[-33,-13+i*9],[33,-13+i*9]],i%2?'#e6cfa0':'#d5b687',4);for(let i=-2;i<=2;i++)line([[i*12,-15],[i*10,28]],'#a98559',2);c.strokeStyle='#e9d5ab';c.lineWidth=5;c.beginPath();c.ellipse(0,-20,37,8,0,0,Math.PI*2);c.stroke();
  }else if(kind==='cloth'){
   c.fillStyle='#94cfca';c.beginPath();c.moveTo(-39,-22);c.lineTo(26,-30);c.lineTo(42,18);c.lineTo(-27,31);c.closePath();c.fill();line([[-34,-14],[29,-23],[35,12],[-23,23],[-34,-14]],'#ead9ad',2);line([[-11,-23],[1,24]],'#76aaa8',3);line([[10,-26],[23,21]],'#c6e5d8',3);c.fillStyle='#e4c58e';c.fillRect(-2,-28,7,56);
  }else if(kind==='arms'){
   for(const side of[-1,1]){line([[side*8,-16],[side*22,-2],[side*32,16]],'#c8d8ce',11);oval(side*8,-16,9,9,'#80c8bd');oval(side*32,18,13,12,'#eee1c6');}
  }else if(kind==='fish'){
   oval(3,0,31,19,'#ecb18a');c.fillStyle='#eac594';c.beginPath();c.moveTo(-23,0);c.lineTo(-44,-21);c.lineTo(-44,21);c.closePath();c.fill();oval(21,-4,4,4,'#254451');line([[-4,-10],[-1,10]],'#fae0b5',3);c.fillStyle='#d89ab4';c.beginPath();c.moveTo(-7,-17);c.lineTo(2,-32);c.lineTo(14,-17);c.fill();
  }else if(kind==='fan'){
   oval(0,-5,34,34,'#2e5967');for(let i=0;i<3;i++){c.save();c.translate(0,-5);c.rotate(i*Math.PI*2/3);oval(0,-17,11,20,'#9bd6cb');c.restore();}oval(0,-5,8,8,'#eac28b');line([[0,29],[0,41],[-21,41],[21,41]],'#d7bd91',5);
  }else if(kind==='thread'||kind==='rope'){
   if(kind==='thread'){c.fillStyle='#e3c9a0';c.fillRect(-25,-28,50,56);for(let i=0;i<7;i++)line([[-29,-23+i*7],[29,-23+i*7]],palette[i%3],6);line([[-31,-32],[31,-32]],'#e8d8b8',5);line([[-31,32],[31,32]],'#e8d8b8',5);}else{c.strokeStyle='#e5c69a';c.lineWidth=7;c.beginPath();c.moveTo(-35,31);c.bezierCurveTo(-7,31,-24,-24,1,-28);c.bezierCurveTo(36,-35,37,15,10,17);c.bezierCurveTo(-8,18,-4,-8,11,-8);c.bezierCurveTo(32,-9,4,31,37,32);c.stroke();}
  }else if(kind==='scope'){
   rock(-11,13,22,'#deb784');oval(10,-9,29,29,'#aacfd05a');c.strokeStyle='#c2e5de';c.lineWidth=7;c.beginPath();c.arc(10,-9,29,0,Math.PI*2);c.stroke();line([[30,13],[46,34]],'#e5c48c',10);line([[10,-19],[10,1]],'#e9f6e8',3);line([[0,-9],[20,-9]],'#e9f6e8',3);
  }else if(kind==='scan'||kind==='photo'){
   const positions=kind==='photo'?[0]:[-31,0,31];for(let i=0;i<positions.length;i++){const xx=positions[i];c.fillStyle='#e8dbc2';c.fillRect(xx-13,-32,26,65);c.fillStyle='#417c83';c.fillRect(xx-10,-28,20,43);rock(xx,-4,8,palette[i]);line([[xx-8,21],[xx+8,21]],'#b09a72',2);}
  }else if(kind==='lava'){
   c.fillStyle='#544c57';c.beginPath();c.moveTo(-45,27);c.lineTo(-25,-29);c.lineTo(-9,-33);c.lineTo(2,-8);c.lineTo(18,-26);c.lineTo(43,27);c.closePath();c.fill();for(let i=0;i<3;i++){const xx=(i-1)*23;line([[xx,-9],[xx-6,4],[xx+5,17],[xx,31]],['#ee985b','#eac28b','#db7957'][i],6);}
  }else if(kind==='float'){
   for(let i=0;i<3;i++){const xx=(i-1)*30;oval(xx,-15,12,16,palette[i]);line([[xx-8,-3],[xx-8,8],[xx+8,8],[xx+8,-3]],'#e7d3a9',2);c.fillStyle='#e7c395';c.fillRect(xx-10,8,20,17);line([[xx-7,12],[xx+7,21]],'#a88963',2);}line([[-48,30],[-20,27],[0,31],[24,27],[48,30]],'#a6e0df',4);
  }else if(kind==='pump'){
   c.fillStyle='#e2bf88';c.fillRect(-20,-2,40,28);c.fillStyle='#68aaa8';c.fillRect(-26,25,52,10);line([[0,-2],[0,-31],[-25,-31],[25,-31]],'#dce5d7',7);line([[22,9],[36,9],[36,32]],'#d6af75',4);
  }else if(kind==='eclipse'){
   oval(0,0,34,34,'#edc885');oval(8,-2,28,28,'#3c5364');for(let i=0;i<8;i++){const a=i*Math.PI/4;line([[Math.cos(a)*39,Math.sin(a)*39],[Math.cos(a)*45,Math.sin(a)*45]],'#edca8b',3);}
  }else if(kind==='delivery'){
   line([[-40,31],[-40,-34],[32,-34]],'#a0cfca',7);line([[14,-34],[14,-9]],'#e6c68e',3);c.fillStyle='#e5c48c';c.fillRect(-5,0,39,27);line([[14,-8],[8,0]],'#d2d8c5',4);line([[-3,4],[28,23]],'#b39468',2);
  }else if(kind==='museum'){
   for(let i=0;i<3;i++){const xx=(i-1)*32;c.fillStyle='#8ac7c32d';c.fillRect(xx-13,-31,26,62);c.strokeStyle='#a8ceca';c.lineWidth=2;c.strokeRect(xx-13,-31,26,62);c.fillStyle='#d9b582';c.fillRect(xx-15,29,30,8);if(i===0)rock(xx,4,11,'#c0a6dc');else if(i===1){oval(xx,3,10,6,'#88c5c3');line([[xx,0],[xx,-10]],'#dbd6ba',3);}else{oval(xx,3,11,11,'#ddb98d');line([[xx-9,1],[xx+9,1]],'#9e7b66',3);}}
  }else if(kind==='footsteps'){
   oval(-16,6,11,21,'#e6dac2');oval(17,-10,11,21,'#e6dac2');oval(-16,31,9,6,'#d0b580');oval(17,15,9,6,'#d0b580');
  }else if(kind==='wheel'){
   oval(0,0,36,36,'#253e4b');oval(0,0,24,24,'#e1c28a');oval(0,0,12,12,'#74c4c0');for(let i=0;i<6;i++){const a=i*Math.PI/3;line([[Math.cos(a)*15,Math.sin(a)*15],[Math.cos(a)*22,Math.sin(a)*22]],'#fff0d1',3);}
  }else if(kind==='plank'){
   for(let i=0;i<3;i++){c.fillStyle=['#dfc090','#d5b27e','#e7cfab'][i];c.save();c.translate((i-1)*24,0);c.rotate((i-1)*.15);c.fillRect(-9,-37,18,74);line([[-4,-27],[-1,25]],'#a98457',2);c.restore();}
  }else if(kind==='stars'){
   const nodes=[[-36,9],[-17,-20],[7,-7],[28,-31],[40,4]];line(nodes,'#b6e9e7',2);for(const [xx,yy]of nodes){oval(xx,yy,5,5,'#ffe2a0');}
  }else if(kind==='sled'){
   line([[-43,27],[35,27],[44,17]],'#e9cf99',5);line([[-29,24],[-23,-10],[29,-10],[35,23]],'#8cd2d0',7);line([[-20,0],[28,0]],'#f5d39a',6);line([[-29,-10],[-38,-28]],'#a0dfda',5);
  }else if(kind==='helicopter'){
   oval(0,8,19,17,'#edc07d');c.fillStyle='#80cfce';c.fillRect(-13,0,26,12);line([[0,-8],[0,-26],[-40,-26],[40,-26]],'#e5e6cf',5);line([[-24,30],[25,30]],'#c6d3c9',4);line([[-11,18],[-16,30]],'#c6d3c9',3);line([[12,18],[18,30]],'#c6d3c9',3);
  }else if(kind==='samples'){
   for(let i=0;i<3;i++){const xx=(i-1)*31;c.fillStyle='#87b5b83a';c.fillRect(xx-12,-24,24,53);c.strokeStyle='#afdad7';c.lineWidth=2;c.strokeRect(xx-12,-24,24,53);c.fillStyle=palette[i];c.fillRect(xx-14,-30,28,7);c.fillStyle='#ba9b6b';c.fillRect(xx-14,29,28,5);rock(xx,10,9,palette[i]);line([[xx-7,-17],[xx-7,0]],'#e9f9ec',1.8);}
   line([[-48,37],[48,37]],'#ba9b6b',5);
  }else if(kind==='rock'){
   for(let i=0;i<3;i++)rock((i-1)*28,8+(i%2)*8,15,palette[i]);
  }else if(kind==='bridge'){
   c.fillStyle='#79c1c3';c.fillRect(-48,19,96,20);c.fillStyle='#f0c177';c.fillRect(-48,-4,96,12);
   for(const xx of[-43,43])line([[xx,31],[xx,-25]],'#d4b377',6);
   line([[-43,-24],[-21,-9],[21,-9],[43,-24]],'#f7e6b7',3);
   for(let i=-3;i<=3;i++)line([[i*12,-3],[i*12,7]],'#9e784b',2);
  }else if(kind==='kite'){
   c.fillStyle='#8fd8cd';c.beginPath();c.moveTo(0,-43);c.lineTo(32,-10);c.lineTo(0,30);c.lineTo(-32,-10);c.closePath();c.fill();
   c.fillStyle='#eebd7c';c.beginPath();c.moveTo(0,-43);c.lineTo(32,-10);c.lineTo(0,-10);c.closePath();c.fill();line([[0,-43],[0,30]],'#f8e7be',2);line([[-32,-10],[32,-10]],'#f8e7be',2);line([[0,30],[10,40],[-3,49],[7,56]],'#edd6a9',2);
  }else if(kind==='balloon'){
   oval(0,-14,29,35,'#edbf7a');oval(0,-14,16,35,'#f5d699');line([[-21,11],[-12,34],[12,34],[21,11]],'#e9d6b6',2);c.fillStyle='#a37e57';c.fillRect(-15,33,30,19);line([[-13,39],[13,39]],'#d9ba83',2);
  }else if(kind==='camera'){
   c.fillStyle='#8ecfc6';c.fillRect(-38,-22,76,49);c.fillStyle='#e9bb7a';c.fillRect(-25,-32,28,10);oval(0,2,21,21,'#e9c98e');oval(0,2,14,14,'#244955');oval(-4,-3,4,4,'#dcf3ed');c.fillStyle='#fff0cb';c.fillRect(24,-12,8,6);
  }else if(kind==='light'){
   oval(0,-8,25,31,'#ffdd8b');c.fillStyle='#c5bc95';c.fillRect(-13,17,26,13);line([[-10,24],[10,24]],'#75868a',2);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;line([[Math.cos(a)*35,Math.sin(a)*35-8],[Math.cos(a)*43,Math.sin(a)*43-8]],'#ffdf96',3);}
  }else if(kind==='whale'){
   oval(4,4,35,23,'#91cfd4');oval(13,14,22,10,'#e7e9d5');c.fillStyle='#91cfd4';c.beginPath();c.moveTo(-24,4);c.lineTo(-47,-13);c.lineTo(-48,11);c.lineTo(-29,16);c.fill();oval(27,-1,3,4,'#244955');line([[7,-18],[5,-35],[-5,-38]],'#b9e9e4',3);line([[6,-29],[16,-35]],'#b9e9e4',3);
  }else if(kind==='wind'){
   for(let i=0;i<3;i++){const yy=(i-1)*20;line([[-44,yy],[0,yy],[27,yy-7],[35,yy]],'#a0dfdf',5);}
  }else if(kind==='ice'){
   c.fillStyle='#abdde7';c.beginPath();c.moveTo(-29,-22);c.lineTo(13,-32);c.lineTo(35,-14);c.lineTo(34,25);c.lineTo(-7,37);c.lineTo(-30,18);c.closePath();c.fill();line([[-29,-22],[-7,-4],[35,-14]],'#effaf5',2);line([[-7,-4],[-7,37]],'#effaf5',2);
  }else if(kind==='boat'){
   c.fillStyle='#e8ce9a';c.beginPath();c.moveTo(-43,14);c.lineTo(39,14);c.quadraticCurveTo(20,42,-28,27);c.closePath();c.fill();line([[-3,14],[-3,-40]],'#e8ce9a',4);c.fillStyle='#8ad3c8';c.beginPath();c.moveTo(0,-40);c.quadraticCurveTo(43,-18,32,8);c.lineTo(0,8);c.closePath();c.fill();
  }else{
   const mapped={head:'head',battery:'battery',flowers:'flower',robot:'robot',water:'water',sun:'sun',seed:'seed',jar:'jar',bell:'bell',rover:'rover'};
   M.WorkshopArt.icon(c,mapped[kind]||'robot',0,0,94,'#efc47e');
  }
  c.restore();
 }
 // Pick the visible game object itself, with a small finger allowance.
 const gameRay=new T.Raycaster(),gameDirection=new T.Vector3(),gameHits=[];
 M.touchPlayPart=function(p,node,slop=.12){
  if(!p||!node||!M.camera)return false;for(let q=node;q;q=q.parent)if(!q.visible)return false;node.updateWorldMatrix(true,true);
  for(let k=0;k<5;k++){const dx=k===1?slop:k===2?-slop:0,dy=k===3?slop:k===4?-slop:0;gameDirection.set(p.x+dx,p.y+dy,0).sub(M.camera.position).normalize();gameRay.set(M.camera.position,gameDirection);gameRay.camera=M.camera;gameHits.length=0;gameRay.intersectObject(node,true,gameHits);if(gameHits.length)return true;}return false;
 };
 M.createPlayGuide=function({scene,world,player,dog,lessons}){
  const entries=(lessons||[]).filter(Boolean),root=new T.Group();root.name='İşaretli oyun alanları';scene.add(root);
  const hud=document.getElementById('hud'),card=document.createElement('canvas');card.id='play-goal';card.width=760;card.height=232;card.hidden=true;card.setAttribute('aria-label','Yakındaki oyunun resimli amacı');hud.append(card);
  const style=document.createElement('style');style.textContent='#play-goal{position:absolute;top:calc(env(safe-area-inset-top,0px) + 102px);left:50%;transform:translateX(-50%);width:min(390px,76vw);height:auto;pointer-events:none;filter:drop-shadow(0 5px 9px #10232c55)}@media(max-width:700px){#play-goal{top:calc(env(safe-area-inset-top,0px) + 98px);width:min(330px,76vw)}}';document.head.append(style);
  const context=card.getContext('2d'),hand=M.WorkshopArt.hand(root,1.10);hand.visible=false;hand.renderOrder=40;
  const handImage=hand.material.map.image;
  const touchImage=document.createElement('canvas');touchImage.width=touchImage.height=192;const tc=touchImage.getContext('2d');tc.strokeStyle='#fff0cc';tc.lineWidth=5;tc.beginPath();tc.arc(96,96,45,0,Math.PI*2);tc.stroke();tc.strokeStyle='#b9ebe0';tc.lineWidth=3;for(let i=0;i<4;i++){const a=i*Math.PI*.5+.35;tc.beginPath();tc.arc(96,96,72,a,a+.58);tc.stroke();}const touchMap=new T.CanvasTexture(touchImage);touchMap.colorSpace=T.SRGBColorSpace;
  const touchPulse=new T.Sprite(new T.SpriteMaterial({map:touchMap,transparent:true,depthWrite:false,depthTest:false}));touchPulse.name='Gerçek dokunma yankısı';touchPulse.renderOrder=43;touchPulse.visible=false;root.add(touchPulse);
  const touchHand=new T.Sprite(new T.SpriteMaterial({map:hand.material.map,transparent:true,depthWrite:false,depthTest:false}));touchHand.name='Dokunuş onayı';touchHand.renderOrder=44;touchHand.visible=false;touchHand.scale.setScalar(.82);root.add(touchHand);let touchedAt=-20,contactOwner=null;
  function feedback(p,owner){successUntil=0;successLesson=null;contactOwner=owner??null;touchedAt=clock;info.acceptedTouches++;touchPulse.position.set(p.x,p.y,.02);touchHand.position.set(p.x-.022,p.y+.33,.02);lastInput=clock;hand.visible=false;}

  // The marker is planted in the world. Only its cloth faces the camera.
  // Four tiny cloth maps and one instanced metal stake serve every activity.
  function flagMap(done,side){
   const cv=document.createElement('canvas');cv.width=192;cv.height=164;const c=cv.getContext('2d');c.lineJoin='round';c.save();if(side<0){c.translate(192,0);c.scale(-1,1);}c.fillStyle=done?'#559c84':'#327e85';c.beginPath();c.moveTo(12,14);c.quadraticCurveTo(91,-2,179,20);c.lineTo(160,79);c.lineTo(179,145);c.quadraticCurveTo(89,124,12,141);c.closePath();c.fill();c.strokeStyle='#ecd293';c.lineWidth=4;c.stroke();c.restore();const shift=side<0?-14:0;if(done){c.strokeStyle='#fff0c6';c.lineWidth=13;c.lineCap='round';c.beginPath();c.moveTo(63+shift,79);c.lineTo(87+shift,105);c.lineTo(139+shift,51);c.stroke();}else c.drawImage(handImage,49+shift,8,111,134);const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;return map;
  }
  const flagMaps=[flagMap(false,-1),flagMap(true,-1),flagMap(false,1),flagMap(true,1)],flagMaterials=flagMaps.map(map=>new T.SpriteMaterial({map,transparent:true,depthWrite:false}));
  function stakeGeometry(){
   const parts=[[new T.CylinderGeometry(.15,.19,.085,12).translate(0,.0425,0),0x52616b],[new T.CylinderGeometry(.025,.031,1.56,8).translate(0,.86,0),0xb4c0b7],[new T.SphereGeometry(.058,8,6).translate(0,1.67,0),0xd9b97e]],positions=[],normals=[],colors=[];
   for(const [shape,hex]of parts){const g=shape.toNonIndexed(),p=g.attributes.position,n=g.attributes.normal,c=new T.Color(hex);for(let k=0;k<p.count;k++){positions.push(p.getX(k),p.getY(k),p.getZ(k));normals.push(n.getX(k),n.getY(k),n.getZ(k));colors.push(c.r,c.g,c.b);}g.dispose();shape.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;
  }
  const stakeGeo=stakeGeometry(),stakeMat=new T.MeshStandardMaterial({vertexColors:true,metalness:.32,roughness:.69}),stakes=new T.InstancedMesh(stakeGeo,stakeMat,Math.max(1,entries.length)),stakePose=new T.Object3D();stakes.name='Zemine sabitlenmiş oyun direkleri';stakes.instanceMatrix.setUsage(T.DynamicDrawUsage);stakes.frustumCulled=false;stakes.count=0;root.add(stakes);
  const layout={
   'mars-robot':[-7.5,-1],'mars-rover-build':[-9,-1],'mars-rover-ride':[-9,-1],'mars-rover-stop-0':[-3.8,-1],'mars-rover-stop-1':[-3.5,-1],'mars-rover-stop-2':[-3.5,-1],'mars-rover-stop-3':[-5,-1],'mars-greenhouse':[4.2,1],'mars-solar':[5.2,1],'mars-helicopter':[-6.0,-1],'mars-water':[3.4,1],'mars-magnifier':[-4.4,-1],'mars-constellation':[4.5,1],'mars-camp':[6,1],'mars-sled':[3.5,1],'mars-wind-mail':[-6.5,-1],
   'saturn-harp':[-5.3,-1],'saturn-probe-samples':[-6.7,-1],'saturn-orrery':[-3.0,-1],'saturn-eclipse':[-4.1,-1],'saturn-nursery':[-5.3,-1],'saturn-family-photo':[4.3,1],'saturn-taxi-call':[6,1],'saturn-taxi-board':[-3.0,-1],
   'jupiter-station-prepare':[-4.8,-1],'jupiter-io-samples':[-5.9,-1],'jupiter-io-lava-window':[-5.8,-1],'jupiter-io-camera':[-4.5,-1],'jupiter-europa-ice-hatch':[-5.8,-1],'jupiter-europa-sub-samples':[-8.9,-1],'jupiter-europa-float-lab':[-5.7,-1],'jupiter-museum-displays':[10.6,1],'jupiter-museum-delivery':[-8.6,-1],
   'venus-crawler-board':[5.2,1],'venus-crawler-call':[-6.15,-1],'venus-observatory':[-8,-1],'venus-observatory-open':[-8.6,-1]
  };
  const flags=entries.map(entry=>{const sprite=new T.Sprite(flagMaterials[0]);sprite.name='Oyun bayrağı '+entry.id;sprite.matrixAutoUpdate=false;root.add(sprite);return{entry,sprite,poseX:NaN,poseY:NaN,poseZ:NaN,poseSize:NaN,x:0,y:0,poleX:0,poleY:0,poleZ:0,side:-1,size:1,done:false,enabled:false,seen:false,startX:undefined,startY:undefined};});
  const groupedFlags=new Map();for(const f of flags){const id=f.entry.id,key=id==='mars-rover-build'||id==='mars-rover-ride'?'mars-rover-dock':id==='venus-observatory'||id==='venus-observatory-open'?'venus-observatory':id.startsWith('neptune-route-game-')?'neptune-floating-workshop':null;if(key){let group=groupedFlags.get(key);if(!group)groupedFlags.set(key,group=[]);group.push(f);}}
  const stakeSlots=flags.map(()=>({x:NaN,y:NaN,z:NaN,size:NaN}));
  const markerInfo=flags.map(flag=>({id:flag.entry.id,visible:false,x:0,y:0,z:0,scale:1,side:-1})),framing={minX:0,maxX:0};
  function supportY(x,z){let y=world.ground(x);for(const q of world.platforms||[])if(Math.abs(x-q.x)<q.w*.5-.18&&Math.abs(z-(q.z||0))<(q.d||4)*.5)y=Math.max(y,q.y);return y;}
  function markerPosition(flag){
   const e=flag.entry,id=e.id,preset=layout[id];let dx=preset?preset[0]:-4.5,side=preset?preset[1]:-1,size=1,z=-.35,x=flag.x+dx,y;
   if(id.startsWith('saturn-ice-flower-')){x=flag.x-1.55;size=.78;}
   if(id.startsWith('saturn-sail-')&&id.endsWith('-board')){if(flag.startX===undefined)flag.startX=flag.x;if(id==='saturn-sail-2-board'){x=flag.startX+3.3;side=1;}else x=flag.startX-3.3;}
   if(id.startsWith('saturn-sail-')&&id.includes('-stop-'))x=flag.x-2.75;
   if(id.startsWith('jupiter-shuttle-')&&id.endsWith('-board')){if(flag.startX===undefined)flag.startX=flag.x;x=flag.startX-3.6;}
   if(id.startsWith('jupiter-shuttle-')&&id.includes('-stop-'))x=flag.x-3.4;
   if(id==='mars-sled'&&flag.startX!==undefined)x=flag.startX+3.5;
   if(id==='mars-rover-ride'&&flag.startX!==undefined)x=flag.startX-9;
   if(id==='mars-sled'||id==='mars-rover-ride'){if(flag.startX===undefined)flag.startX=flag.x;if(!e.completed?.()&&M.player.locked)return false;}
   if(id.startsWith('venus-')&&!preset){x=flag.x+4.5;side=1;}
   if(id.startsWith('neptune-')){
    size=.9;dx=-2.4;
    if(id.startsWith('neptune-wind-crossing-'))dx=-2.0;
    if(id.startsWith('neptune-fan-'))dx=-2.2;
    if(id==='neptune-ray-kite')dx=-3.2;
    if(id==='neptune-dew-flowers'){dx=3.2;side=1;}
    if(id==='neptune-weave-kite'){dx=3.2;side=1;}
    if(id==='neptune-cloud-boat'){if(flag.startX===undefined)flag.startX=flag.x;x=flag.startX+3.2;side=1;}
    else if(id==='neptune-bilbo-bellows'){if(flag.startX===undefined)flag.startX=flag.x;x=flag.startX+6.1;side=1;}
    else if(id.startsWith('neptune-arrival-fan-'))x=306.6+Number(id.at(-1))*1.4;
    else if(id==='neptune-family-balloon'){x=321.5;side=1;}
    else if(id==='neptune-final-call-boat')x=304.8;
    else x=flag.x+dx;
    if(id.startsWith('neptune-route-game-')){const base=Number(value(e.flagBaseY));x=flag.x+3.0;y=base+.25;z=-1.70;side=1;size=.68;}
    else if(id==='neptune-route-sun'||id==='neptune-route-cloud'||id==='neptune-glider-wind'){flag.poleX=x;flag.poleY=Number(value(e.flagBaseY??e.y));flag.poleZ=z;flag.side=side;flag.size=size;return false;}
   }
   // No screen-edge clamp: moving a world marker to the screen edge plants it
   // through unrelated props. The activity framing includes the physical stake.
   flag.poleX=x;flag.poleZ=z;flag.poleY=y===undefined?supportY(x,z):y;flag.side=side;flag.size=size;return true;
  }
  const ghostBySource=new WeakMap(),ghosts=[],ghostMaterials=[],ghostGeometry=[],demoMatrix=new T.Matrix4(),demoInverse=new T.Matrix4(),demoPoint=new T.Vector3(),demoColor=new T.Color();
  function prepareGhost(source){
   if(!source?.isObject3D||ghostBySource.has(source))return;
   source.updateWorldMatrix(true,true);demoInverse.copy(source.matrixWorld).invert();const meshes=[];let vertices=0;
   source.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&!o.isInstancedMesh&&(o.visible||o===source)&&o.geometry?.attributes.position&&!Array.isArray(o.material)){for(let p=o===source?null:o.parent;p&&p!==source;p=p.parent)if(!p.visible)return;meshes.push(o);vertices+=o.geometry.index?.count||o.geometry.attributes.position.count;}});
   if(!meshes.length||vertices>18000||meshes.length>28){ghostBySource.set(source,null);return;}
   const buckets=new Map();for(const mesh of meshes){const map=mesh.material.map||null,key=map?.uuid||'plain';let b=buckets.get(key);if(!b)buckets.set(key,b={map,p:[],uv:[],c:[],i:[]});const geo=mesh.geometry,a=geo.attributes;demoMatrix.multiplyMatrices(demoInverse,mesh.matrixWorld);const n=geo.index?.count||a.position.count,seen=geo.index?new Map():null;demoColor.copy(mesh.material.color||new T.Color(0xc9e4d9));for(let i=0;i<n;i++){const k=geo.index?geo.index.getX(i):i;let vertex=seen?.get(k);if(vertex===undefined){vertex=b.p.length/3;seen?.set(k,vertex);demoPoint.fromBufferAttribute(a.position,k).applyMatrix4(demoMatrix);b.p.push(demoPoint.x,demoPoint.y,demoPoint.z);b.uv.push(a.uv?a.uv.getX(k):0,a.uv?a.uv.getY(k):0);const v=mesh.material.vertexColors?a.color:null;b.c.push(demoColor.r*(v?v.getX(k):1),demoColor.g*(v?v.getY(k):1),demoColor.b*(v?v.getZ(k):1));}b.i.push(vertex);}}
   if(buckets.size>3){ghostBySource.set(source,null);return;}
   const ghost=new T.Group();ghost.name='Nesneyi taşımayı gösteren saydam örnek';ghost.visible=false;root.add(ghost);for(const b of buckets.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));if(b.p.length/3<b.i.length)g.setIndex(b.i);g.computeBoundingSphere();const mat=new T.MeshBasicMaterial({map:b.map,vertexColors:true,transparent:true,opacity:.34,depthWrite:false,side:T.DoubleSide});const m=new T.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=35;ghost.add(m);ghostMaterials.push(mat);ghostGeometry.push(g);}ghostBySource.set(source,ghost);ghosts.push(ghost);
  }
  for(const entry of entries)for(const source of entry.demoSources||[])prepareGhost(source);
  let shownGhost=null;
  const step={demoObject:null,pointAt:null,action:'tap',from:new T.Vector3(),to:new T.Vector3(),progress:0,total:1,sourceIcon:'',goalIcon:'',radius:.55,pivot:new T.Vector3(NaN,NaN,NaN),centerX:NaN,centerY:NaN,startAngle:NaN,endAngle:NaN};
  const completionStep={demoObject:null,pointAt:null,action:'tap',from:new T.Vector3(),to:new T.Vector3(),progress:0,total:1,sourceIcon:'',goalIcon:'',radius:.55,pivot:new T.Vector3(NaN,NaN,NaN),centerX:NaN,centerY:NaN,startAngle:NaN,endAngle:NaN};
  const info={active:null,action:null,goal:null,progress:0,total:1,source:[0,0,0],target:[0,0,0],card:false,stations:entries.length,acceptedTouches:0,demoPrepared:ghosts.length,demoAvailable:false,demoVisible:false,walkHint:false,markers:markerInfo};
  let paintedLesson=null,paintedGoal='',paintedSource='',paintedProgress=NaN,paintedTotal=NaN,paintedComplete=false;
  let active=null,selected=null,clock=0,lastInput=-20,entered=0,paintKey='',disposed=false,successUntil=0,successLesson=null,successSource='',successGoal='',lastValidLesson=null,lastValidAt=-20,lastValidSource='',lastValidGoal='',lastSuccessAt=-20;
  function showCard(on){const hidden=!on;if(card.hidden!==hidden)card.hidden=hidden;info.card=on;}
  function value(v){return typeof v==='function'?v():v;}
  function updateCard(lesson,complete){const goal=step.goalIcon||lesson.goal,source=step.sourceIcon||lesson.sourceIcon||({samples:'rock',museum:'rock',flowers:'seed',bridge:'rock',balloon:'wind',kite:'kite',light:'light',ice:'sun',water:'ice',robot:'robot',boat:'wind',camera:'camera'})[goal]||goal;if(paintKey&&paintedLesson===lesson&&paintedGoal===goal&&paintedSource===source&&paintedProgress===step.progress&&paintedTotal===step.total&&paintedComplete===complete)return;paintKey='painted';paintedLesson=lesson;paintedGoal=goal;paintedSource=source;paintedProgress=step.progress;paintedTotal=step.total;paintedComplete=complete;const c=context;c.clearRect(0,0,760,232);c.fillStyle='rgba(24,54,66,.94)';c.beginPath();c.roundRect(8,8,744,215,38);c.fill();c.strokeStyle='#cfb680';c.lineWidth=4;c.stroke();c.strokeStyle='#70999b';c.lineWidth=1;c.beginPath();c.roundRect(17,17,726,197,31);c.stroke();picture(c,source,181,111,157);picture(c,goal,557,111,162,step.progress,step.total);c.strokeStyle=complete?'#a5e9c4':'#f1ce87';c.lineWidth=13;c.lineCap='round';c.lineJoin='round';c.beginPath();if(complete){c.moveTo(337,116);c.lineTo(369,146);c.lineTo(422,80);}else{c.moveTo(326,113);c.lineTo(429,113);c.moveTo(405,88);c.lineTo(431,113);c.lineTo(405,138);}c.stroke();}
  function update(dt,time){if(disposed)return;info.walkHint=false;info.demoVisible=false;info.demoAvailable=false;if(shownGhost){shownGhost.visible=false;shownGhost=null;}clock=time;if(Math.abs(player.vx)>.4)lastInput=clock;const touchAge=clock-touchedAt;touchPulse.visible=contactOwner!==null||touchAge>=0&&touchAge<.42;touchHand.visible=touchAge>=0&&touchAge<.28;if(touchPulse.visible){touchPulse.scale.setScalar(contactOwner!==null?.48:.22+touchAge*2.5);touchPulse.material.opacity=contactOwner!==null?.55:.72*(1-touchAge/.42);}if(touchHand.visible)touchHand.material.opacity=Math.min(1,(.28-touchAge)*9);let nearest=null,distance=Infinity;
   let stakeCount=0;
   for(let k=0;k<flags.length;k++){
    const flag=flags[k],e=flag.entry;flag.enabled=!e.enabled||!!e.enabled();flag.done=!!e.completed?.();flag.x=Number(value(e.x));if(flag.enabled)flag.seen=true;
    const planted=markerPosition(flag);flag.sprite.visible=planted&&(flag.enabled||flag.done&&flag.seen||flag.seen&&e===active&&clock-lastValidAt<2.8)&&Math.abs(player.x-flag.poleX)<30;
    if(flag.poseX!==flag.poleX||flag.poseY!==flag.poleY||flag.poseZ!==flag.poleZ||flag.poseSize!==flag.size){flag.poseX=flag.poleX;flag.poseY=flag.poleY;flag.poseZ=flag.poleZ;flag.poseSize=flag.size;flag.sprite.scale.set(1.15*flag.size,.84*flag.size,1);flag.sprite.position.set(flag.poleX,flag.poleY+1.20*flag.size,flag.poleZ);flag.sprite.updateMatrix();}flag.sprite.center.set(flag.side<0?.935:.065,.5);flag.sprite.material=flagMaterials[(flag.side<0?0:2)+(flag.done?1:0)];
    const record=markerInfo[k];record.visible=flag.sprite.visible;record.x=flag.poleX;record.y=flag.poleY;record.z=flag.poleZ;record.scale=flag.size;record.side=flag.side;
    if(!flag.enabled||flag.done)continue;const d=Math.abs(player.x-flag.x);if(d<(e.range||10)&&d<distance){nearest=e;distance=d;}
   }
   for(const group of groupedFlags.values()){let chosen=null,score=-1;for(const f of group){if(!f.sprite.visible)continue;const rank=f.entry===active&&!f.done?20:f.enabled&&!f.done?10:f.done?1:5;if(rank>score){score=rank;chosen=f;}}for(const f of group)if(f!==chosen)f.sprite.visible=false;}
   let stakesChanged=false;for(let k=0;k<flags.length;k++){const f=flags[k];markerInfo[k].visible=f.sprite.visible;if(!f.sprite.visible)continue;const slot=stakeSlots[stakeCount];if(slot.x!==f.poleX||slot.y!==f.poleY||slot.z!==f.poleZ||slot.size!==f.size){slot.x=f.poleX;slot.y=f.poleY;slot.z=f.poleZ;slot.size=f.size;stakePose.position.set(f.poleX,f.poleY,f.poleZ);stakePose.scale.setScalar(f.size);stakePose.updateMatrix();stakes.setMatrixAt(stakeCount,stakePose.matrix);stakesChanged=true;}stakeCount++;}
   stakes.count=stakeCount;if(stakesChanged)stakes.instanceMatrix.needsUpdate=true;
   M.playGuideActive=entries.length>0;
   if(active&&(!active.enabled||active.enabled())&&!active.completed?.()){const currentDistance=Math.abs(player.x-value(active.x));if(currentDistance<(active.range||10)&&currentDistance<=distance+3.2)nearest=active;}
   if(!nearest&&active&&!active.completed?.()&&Math.abs(player.x-value(active.x))<(active.range||10)&&clock-lastValidAt<2.8)nearest=active;
   if(selected&&(!selected.enabled||selected.enabled())&&!selected.completed?.()&&Math.abs(player.x-value(selected.x))<(selected.range||10)+2)nearest=selected;
   if(active?.completed?.()){successLesson=active;successUntil=clock+2.4;lastSuccessAt=clock;selected=null;successSource=lastValidLesson===active?lastValidSource:'';successGoal=lastValidLesson===active?lastValidGoal:active.goal;if(!successSource){completionStep.sourceIcon=completionStep.goalIcon='';if(active.describe(completionStep)){successSource=completionStep.sourceIcon;successGoal=completionStep.goalIcon||successGoal;}}}
   if(nearest!==active){active=nearest;entered=clock;paintKey='';}
   if(successLesson&&clock<successUntil&&Math.abs(player.x-value(successLesson.x))<(successLesson.range||10)+1)nearest=null;else successLesson=null;
   hand.visible=false;info.active=active?.id||null;info.card=false;
   if(successLesson){info.action=null;step.sourceIcon=successSource;step.goalIcon=successGoal;info.goal=step.goalIcon;showCard(true);updateCard(successLesson,true);return;}
   if(!active){showCard(false);info.action=null;info.walkHint=lastSuccessAt>=0&&clock-lastSuccessAt>3&&clock-lastInput>3&&!player.locked&&player.grounded&&Math.abs(player.vx)<.4&&player.x<world.length-10;return;}
   step.demoObject=null;step.pointAt=null;step.targetId='';step.action='tap';step.progress=0;step.total=1;step.sourceIcon='';step.goalIcon='';step.radius=.55;step.pivot.set(NaN,NaN,NaN);step.centerX=step.centerY=step.startAngle=step.endAngle=NaN;step.from.set(0,0,0);step.to.set(0,0,0);
   const available=active.describe(step);if(!available){if(lastValidLesson===active&&clock-lastValidAt<2.8){showCard(true);info.action='wait';}else showCard(false);return;}lastValidLesson=active;lastValidAt=clock;lastValidSource=step.sourceIcon;lastValidGoal=step.goalIcon||active.goal;info.demoAvailable=!!(step.demoObject&&ghostBySource.get(step.demoObject));
   info.action=step.action;info.goal=step.goalIcon||active.goal;info.progress=step.progress;info.total=step.total;step.from.toArray(info.source);step.to.toArray(info.target);showCard(true);updateCard(active,false);
   const demo=contactOwner===null&&step.action!=='wait'&&(clock-entered<3.4||clock-lastInput>3.1)&&clock-lastInput>.7&&Math.abs(player.vx)<3.2;
   if(demo){const t=(clock-entered)%4.5;hand.visible=t<3.25;let u=M.clamp((t-.45)/1.95,0,1);u=u*u*(3-2*u);hand.position.copy(step.from);
    if(typeof step.pointAt==='function')step.pointAt(u,hand.position);
    else if(step.action==='drag'||step.action==='press')hand.position.lerp(step.to,u);
    else if(step.action==='turn'){const px=Number.isFinite(step.pivot.x)?step.pivot.x:Number.isFinite(step.centerX)?step.centerX:(step.from.x+step.to.x)*.5,py=Number.isFinite(step.pivot.y)?step.pivot.y:Number.isFinite(step.centerY)?step.centerY:(step.from.y+step.to.y)*.5;let a=Number.isFinite(step.startAngle)?step.startAngle:Math.atan2(step.from.y-py,step.from.x-px),b=Number.isFinite(step.endAngle)?step.endAngle:Math.atan2(step.to.y-py,step.to.x-px);let da=Number.isFinite(step.startAngle)&&Number.isFinite(step.endAngle)?b-a:Math.atan2(Math.sin(b-a),Math.cos(b-a));const radius=Math.hypot(step.from.x-px,step.from.y-py)||step.radius;hand.position.x=px+Math.cos(a+da*u)*radius;hand.position.y=py+Math.sin(a+da*u)*radius;hand.position.z=step.from.z+(step.to.z-step.from.z)*u;}
    else hand.position.y-=.10*Math.sin(M.clamp(t/1.1,0,1)*Math.PI);
    if((step.action==='drag'||step.action==='turn')&&step.demoObject&&hand.visible&&t>.45&&t<2.9){const ghost=ghostBySource.get(step.demoObject);if(ghost){step.demoObject.updateWorldMatrix(true,false);step.demoObject.matrixWorld.decompose(ghost.position,ghost.quaternion,ghost.scale);ghost.position.x+=hand.position.x-step.from.x;ghost.position.y+=hand.position.y-step.from.y;ghost.position.z+=hand.position.z-step.from.z+.025;const fade=Math.min(1,(t-.45)*3,(2.9-t)*4);for(const part of ghost.children)part.material.opacity=.34*Math.max(0,fade);ghost.visible=true;shownGhost=ghost;info.demoVisible=true;}}
    hand.position.x-=.03;hand.position.y+=.44;hand.material.opacity=Math.min(1,t*4,(3.25-t)*4);
   }
  }
  function pointer(type,p){if(type!=='down'||disposed)return false;lastInput=clock;hand.visible=false;for(const flag of flags){if(!flag.sprite.visible||Math.abs(player.x-flag.x)>(flag.entry.range||10)+2)continue;if(M.touchPlayPart(p,flag.sprite,0)){if(!flag.done){selected=flag.entry;entered=clock;lastInput=-20;}return true;}}return false;}
  function moveContact(p,owner){if(contactOwner!==owner)return;touchPulse.position.set(p.x,p.y,.02);touchHand.position.set(p.x-.022,p.y+.33,.02);lastInput=clock;}
  function releaseContact(p,owner,cancel=false){if(contactOwner!==owner)return;moveContact(p,owner);contactOwner=null;touchedAt=cancel?-20:clock;}
  function clearContact(){contactOwner=null;touchedAt=-20;touchPulse.visible=touchHand.visible=false;}
  function noticeInput(){lastInput=clock;hand.visible=false;}
  function dispose(){disposed=true;M.playGuideActive=false;card.remove();style.remove();root.removeFromParent();for(const map of flagMaps)map.dispose();stakeGeo.dispose();stakeMat.dispose();for(const g of ghostGeometry)g.dispose();for(const mat of ghostMaterials)mat.dispose();for(const material of flagMaterials)material.dispose();hand.material.dispose();touchMap.dispose();touchPulse.material.dispose();touchHand.material.dispose();}
  function prepare(renderer){for(const map of[...flagMaps,touchMap,hand.material.map])renderer.initTexture?.(map);for(const ghost of ghosts){ghost.visible=true;renderer.compile(ghost,M.camera,scene);ghost.visible=false;}}
  function warm(renderer,camera){if(!ghosts.length)return;for(const ghost of ghosts)ghost.visible=true;renderer.render(scene,camera);for(const ghost of ghosts)ghost.visible=false;}
  function frameBounds(){const f=flags.find(f=>f.entry===active&&f.sprite.visible);if(!f)return null;framing.minX=f.poleX+(f.side<0?-1.25*f.size:-.25);framing.maxX=f.poleX+(f.side>0?1.25*f.size:.25);return framing;}
  return{update,pointer,warm,frameBounds,feedback,moveContact,releaseContact,clearContact,prepare,noticeInput,dispose,state:()=>info,lessons:entries};
 };
})(window.MARS);
