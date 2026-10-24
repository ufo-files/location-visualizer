export function createGlobeBeacon(viewer, beacon) {
  const C = window.Cesium;
  const color = C.Color.fromCssColorString(beacon.color);
  const ground = C.Cartesian3.fromDegrees(beacon.lon,beacon.lat,5);
  const top = C.Cartesian3.fromDegrees(beacon.lon,beacon.lat,20000000);
  const entities = [];
  const add = value => entities.push(viewer.entities.add(value));
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><radialGradient id="h"><stop stop-color="${beacon.color}" stop-opacity=".7"/><stop offset="1" stop-color="${beacon.color}" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="32" r="32" fill="url(#h)"/><circle cx="32" cy="32" r="5" fill="white"/><path d="M32 8v8m0 32v8M8 32h8m32 0h8" stroke="${beacon.color}" stroke-width="2"/></svg>`;
  add({position:ground,billboard:{image:`data:image/svg+xml,${encodeURIComponent(icon)}`,width:56,height:56},label:{text:beacon.name,font:'12px sans-serif',fillColor:color,outlineColor:C.Color.BLACK,outlineWidth:3,style:C.LabelStyle.FILL_AND_OUTLINE,pixelOffset:new C.Cartesian2(28,20),horizontalOrigin:C.HorizontalOrigin.LEFT,showBackground:true,backgroundColor:C.Color.BLACK.withAlpha(.6)}});
  if(beacon.enabled){
    add({polyline:{positions:[ground,top],arcType:C.ArcType.NONE,width:18,material:new C.PolylineGlowMaterialProperty({color,glowPower:.3,taperPower:.3})}});
    add({polyline:{positions:[ground,top],arcType:C.ArcType.NONE,width:2,material:color.withAlpha(.95)}});
  }
  if(beacon.accuracy)add({position:ground,ellipse:{semiMajorAxis:Math.max(beacon.accuracy,1),semiMinorAxis:Math.max(beacon.accuracy,1),material:color.withAlpha(.2)}});
  viewer.scene.requestRender();
  return ()=>{for(const entity of entities)viewer.entities.remove(entity);viewer.scene.requestRender();};
}

export function drawSpaceBeacon(ctx, project, ray, beacon, index = 0) {
  const [x,y] = project(ray.origin);
  if(x < -40 || y < -40 || x>innerWidth+40 || y>innerHeight+40)return;
  const projectedLength = Math.hypot(ray.direction[0],ray.direction[1]);
  const length = Math.min(innerWidth,innerHeight)*.48;
  const dx = projectedLength>1e-8 ? ray.direction[0]/projectedLength*length : 0;
  const dy = projectedLength>1e-8 ? -ray.direction[1]/projectedLength*length : 0;
  ctx.save();
  if(beacon.enabled && projectedLength>1e-8){
    const gradient=ctx.createLinearGradient(x,y,x+dx,y+dy);
    gradient.addColorStop(0,beacon.color);gradient.addColorStop(.65,`${beacon.color}ac`);gradient.addColorStop(1,`${beacon.color}00`);
    ctx.strokeStyle=gradient;ctx.lineCap='round';ctx.shadowColor=beacon.color;ctx.shadowBlur=22;
    for(const [width,alpha]of [[22,.08],[9,.25],[2,1]]){
      ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;ctx.shadowColor=beacon.color;ctx.shadowBlur=12;ctx.strokeStyle=beacon.color;ctx.lineWidth=1.5;
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // Names share a physical origin at astronomical scales; stagger label leaders.
  const labelY=y+34+index*32;
  ctx.strokeStyle=`${beacon.color}99`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+12,y+6);ctx.lineTo(x+30,labelY-4);ctx.lineTo(x+43,labelY-4);ctx.stroke();
  ctx.font='11px monospace';ctx.lineWidth=4;ctx.strokeStyle='#03070c';ctx.strokeText(beacon.name,x+48,labelY);ctx.fillStyle=beacon.color;ctx.fillText(beacon.name,x+48,labelY);
  ctx.restore();
}
