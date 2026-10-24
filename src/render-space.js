import { SUN, PC_AU, position } from './astronomy.js';

// Deterministic illustrative surfaces. None of these samples is a catalog star.
let seed = 719;
const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
const galaxy = document.createElement('canvas');
galaxy.width = galaxy.height = 1400;
const g = galaxy.getContext('2d');
const glow = g.createRadialGradient(700,700,0,700,700,650);
glow.addColorStop(0,'#fff0cbaa');glow.addColorStop(.08,'#edc59877');
glow.addColorStop(.3,'#9a9bb029');glow.addColorStop(.8,'#5b789b0d');glow.addColorStop(1,'#00000000');
g.fillStyle=glow;g.fillRect(0,0,1400,1400);
// A barred spiral morphology, explicitly illustrative rather than fitted arms.
for(let i=0;i<45000;i++){
  const arm=i%4, r=45+Math.pow(random(),.7)*560;
  const spread=(random()+random()+random()-1.5);
  const angle=arm*Math.PI/2+Math.log(r/70)*2.25+spread*(.36+110/r);
  const x=700+Math.cos(angle)*r,y=700+Math.sin(angle)*r;
  const size=.5+random()*2.3;
  g.fillStyle=i%13===0?'rgba(255,163,193,.32)':i%3===0?'rgba(163,196,255,.22)':'rgba(224,228,255,.16)';
  g.beginPath();g.arc(x,y,size,0,Math.PI*2);g.fill();
}
g.save();g.translate(700,700);g.rotate(-.45);g.scale(1,.35);
const core=g.createRadialGradient(0,0,0,0,0,170);core.addColorStop(0,'#fff3dbe6');core.addColorStop(.25,'#e9c6a9ac');core.addColorStop(1,'#d6b2a000');
g.fillStyle=core;g.fillRect(-180,-180,360,360);g.restore();

const colors={Sun:['#fff8bc','#fba63b'],Mercury:['#b6aaa0','#625a55'],Venus:['#f3d598','#9d754b'],Earth:['#76bbdd','#164277'],Mars:['#eaa17b','#8b3824'],Jupiter:['#efd4b2','#a26d50'],Saturn:['#e8d7b0','#a59063'],Uranus:['#bcf4f3','#4f969d'],Neptune:['#689bf8','#183c9d']};
const textures=new Map();
function surface(body){
  if(textures.has(body))return textures.get(body);
  const image=document.createElement('canvas');image.width=image.height=160;const c=image.getContext('2d');
  c.beginPath();c.arc(80,80,76,0,Math.PI*2);c.clip();
  const [light,dark]=colors[body];const base=c.createLinearGradient(0,0,160,160);base.addColorStop(0,light);base.addColorStop(1,dark);c.fillStyle=base;c.fillRect(0,0,160,160);
  if(body==='Sun'){
    for(let i=0;i<1800;i++){c.fillStyle=i%2?'#fff8b72b':'#e478242b';c.beginPath();c.arc(random()*160,random()*160,.4+random()*1.7,0,Math.PI*2);c.fill();}
  }else if(['Jupiter','Saturn','Uranus','Neptune','Venus'].includes(body)){
    for(let y=0;y<160;y+=2){c.fillStyle=`rgba(${y%8===0?'255,238,211':'61,36,27'},${random()*.23})`;c.fillRect(0,y,160,2+random()*4);}
    if(body==='Jupiter'){c.fillStyle='#ac6454';c.beginPath();c.ellipse(110,104,18,9,-.1,0,Math.PI*2);c.fill();}
  }else if(body==='Earth'){
    c.fillStyle='#648d66';for(let i=0;i<18;i++){c.beginPath();c.ellipse(random()*160,random()*160,8+random()*18,5+random()*16,random()*4,0,Math.PI*2);c.fill();}
    c.fillStyle='#ffffff6b';for(let i=0;i<25;i++){c.beginPath();c.ellipse(random()*160,random()*160,8+random()*18,2,random(),0,Math.PI*2);c.fill();}
  }else{
    for(let i=0;i<110;i++){c.fillStyle=i%2?'#ffffff14':'#00000022';c.beginPath();c.arc(random()*160,random()*160,1+random()*8,0,Math.PI*2);c.fill();}
  }
  const shade=c.createRadialGradient(48,44,3,88,80,88);shade.addColorStop(0,'#ffffff38');shade.addColorStop(.55,'#00000000');shade.addColorStop(1,'#000000ed');c.fillStyle=shade;c.fillRect(0,0,160,160);
  textures.set(body,image);return image;
}
export function planet(ctx,body,x,y,r,label=true){
  if(x < -100 || y < -100 || x>innerWidth+100 || y>innerHeight+100)return;
  if(body==='Sun'){
    const halo=ctx.createRadialGradient(x,y,r*.5,x,y,r*4);halo.addColorStop(0,'#ffce6477');halo.addColorStop(1,'#ffaf1800');ctx.fillStyle=halo;ctx.fillRect(x-r*4,y-r*4,r*8,r*8);
  }
  if(body==='Saturn'){ctx.save();ctx.translate(x,y);ctx.rotate(-.35);ctx.strokeStyle='#e9cf9980';ctx.lineWidth=r*.35;ctx.beginPath();ctx.ellipse(0,0,r*1.9,r*.6,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  ctx.drawImage(surface(body),x-r,y-r,r*2,r*2);
  if(label){ctx.fillStyle=body==='Earth'?'#c1f1d5':'#c2d0da';ctx.font='11px monospace';ctx.fillText(body,x+r+6,y-5);}
}
export function drawGalaxy(ctx,project,px){
  const [x,y]=project([0,0,0]);const r=18000*PC_AU*px;
  ctx.save();ctx.filter='blur(5px) brightness(1.7)';ctx.drawImage(galaxy,x-r,y-r,r*2,r*2);ctx.filter='none';ctx.globalAlpha=.65;ctx.drawImage(galaxy,x-r,y-r,r*2,r*2);ctx.restore();
  ctx.strokeStyle='#e6d2a823';ctx.setLineDash([3,7]);ctx.beginPath();ctx.arc(x,y,8178*PC_AU*px,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#efddbe';ctx.font='11px monospace';ctx.fillText('GALACTIC CENTER',x+25,y+40);
  const [sx,sy]=project(SUN);ctx.strokeStyle='#bdf2d2';ctx.beginPath();ctx.arc(sx,sy,7,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#bdf2d2';ctx.beginPath();ctx.arc(sx,sy,2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(sx,sy-10);ctx.lineTo(sx-25,sy-45);ctx.lineTo(sx-185,sy-45);ctx.stroke();ctx.fillText('YOU ARE HERE',sx-185,sy-66);ctx.fillText('Solar system',sx-185,sy-51);
}
const periods={Mercury:87.969,Venus:224.701,Earth:365.256,Mars:686.98,Jupiter:4332.59,Saturn:10759.22,Uranus:30688.5,Neptune:60182};
let orbitEpoch,orbits;
export function drawSolarSystem(ctx,project,date,positions){
  if(!orbitEpoch || Math.abs(date-orbitEpoch)>86400000){
    orbitEpoch=date;
    orbits=Object.fromEntries(Object.entries(periods).map(([body,days])=>[body,Array.from({length:181},(_,i)=>position(body,new Date(+date+(i/180-.5)*days*86400000)))]));
  }
  for(const [body,path]of Object.entries(orbits)){
    ctx.beginPath();path.forEach((v,i)=>{const [x,y]=project(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.strokeStyle=body==='Earth'?'#9de9c44d':'#8ca8bf35';ctx.lineWidth=1;ctx.stroke();
  }
  const [sx,sy]=project(SUN);planet(ctx,'Sun',sx,sy,23);
  const sizes={Mercury:6,Venus:8,Earth:9,Mars:7,Jupiter:23,Saturn:19,Uranus:14,Neptune:14};
  // Draw outer bodies first so the inner planets remain visible.
  const [ex,ey]=project(positions.Earth);
  const overview=Math.hypot(ex-sx,ey-sy)<35;
  for(const body of Object.keys(periods).reverse()){const [x,y]=project(positions[body]);planet(ctx,body,x,y,sizes[body],!(overview&&['Mercury','Venus','Earth','Mars'].includes(body)));}
}
