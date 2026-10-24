import { SUN, PC_AU, AU_KM, position, fieldWidth } from './astronomy.js';
const $ = (id) => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d');
let viewer, location, marker, accuracyRing, level = 2, epoch = new Date();
const planets = ['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'];
let positions = Object.fromEntries(planets.map(p => [p, position(p, epoch)]));
const status = (message) => { $('status').textContent = message; };
function drawSpace() {
  $('space-note').textContent=`${epoch.toISOString().slice(0,19)} UTC · Galactic north up · Disk illustrative · R₀ = 8178 ±13(stat) ±22(sys) pc · Markers enlarged`;
  const dpr = Math.min(devicePixelRatio, 2), w = innerWidth, h = innerHeight;
  canvas.width = w*dpr; canvas.height = h*dpr; ctx.scale(dpr,dpr);
  ctx.fillStyle = '#03070c'; ctx.fillRect(0,0,w,h);
  const width = fieldWidth(level), px = Math.min(w,h)*.9/width;
  const t = Math.min(1,level*3), u = Math.max(0,Math.min(1,(level-1)*2));
  const earth = positions.Earth;
  const center = SUN.map((n,i) => n*t+(earth[i]-n)*u);
  // Fixed north-Galactic-pole orthographic view. No invented star positions.
  const project = (p) => [w*.52+(p[0]-center[0])*px,h*.47-(p[1]-center[1])*px];
  function dot(p,label,color,r=3) {
    const [x,y]=project(p); if(x < -100 || y < -100 || x>w+100 || y>h+100)return;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    ctx.font='11px monospace';ctx.fillStyle=color;ctx.fillText(label,x+10,y-9);
  }
  if(level < .65) {
    const [x,y]=project([0,0,0]), radius=15000*PC_AU*px;
    const glow=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,radius));
    glow.addColorStop(0,'#c7bda85c');glow.addColorStop(.15,'#8e9ea43a');glow.addColorStop(.7,'#627e8e1c');glow.addColorStop(1,'#00000000');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#b0c9d121';ctx.beginPath();ctx.arc(x,y,8178*PC_AU*px,0,Math.PI*2);ctx.stroke();
    dot([0,0,0],'Galactic center','#f0d9ad',5);
    dot(SUN,'Sun · R₀ = 8.178 kpc','#c1f1d5',5);
  } else {
    dot(SUN,'Sun','#f9d998',6);
    for(const body of planets)dot(positions[body],body,body==='Earth'?'#bdf2d2':'#98abbc',body==='Earth'?5:3);
  }
  const barAU = 10**Math.floor(Math.log10(width/5));
  const barPx = barAU*px;
  ctx.strokeStyle='#8ba9ae';ctx.beginPath();ctx.moveTo(34,h-245);ctx.lineTo(34+barPx,h-245);ctx.stroke();
  ctx.fillStyle='#a9bec0';ctx.font='10px monospace';
  const distance = barAU > 63241 ? `${(barAU/63241.077).toPrecision(3)} ly` : barAU >= .01 ? `${barAU.toPrecision(2)} AU` : `${(barAU*AU_KM).toPrecision(3)} km`;
  ctx.fillText(distance,34,h-255);
  $('distance').textContent = `Field width: ${width>63241?(width/63241.077).toPrecision(3)+' ly':width.toPrecision(3)+' AU'}`;
}
function changeLevel(value) {
  level = Number(value); $('scale').value = level;
  const cosmic = level < 1.85;
  canvas.style.display=cosmic?'block':'none';$('earth').style.visibility=cosmic?'hidden':'visible';
  $('space-note').hidden=!cosmic;
  $('scale-title').textContent=level<.6?'MILKY WAY':level<1.6?'SOLAR SYSTEM':level<2.5?'EARTH':'YOUR LOCATION';
  document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active',Number(b.dataset.level)===Math.round(level)));
  if(cosmic){drawSpace();$('context').textContent='Scroll or use the slider · Galactic north up · Markers enlarged for visibility';}
  else if(viewer){
    const focus=location || {lat:20,lon:0};
    const amount=Math.max(0,Math.min(1,level-2));
    const altitude=Math.exp(Math.log(22000000)*(1-amount)+Math.log(1500)*amount);
    viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(focus.lon,focus.lat,altitude)});
    $('distance').textContent=`Camera altitude: ${(altitude/1000).toLocaleString(undefined,{maximumFractionDigits:1})} km`;
    $('context').textContent=level>2.5&&!location?'Use Find my location or enter coordinates to set your destination.':'Drag to rotate · Scroll to zoom · Right-drag to tilt';
  }
}
function setLocation(lat,lon,accuracy) {
  location={lat,lon};$('location-title').textContent=accuracy?'Your location':'Selected location';
  $('coordinates').textContent=`${lat.toFixed(5)}°, ${lon.toFixed(5)}°${accuracy ? ` · accuracy ±${Math.round(accuracy)} m`:''}`;
  if(marker)viewer.entities.remove(marker);if(accuracyRing)viewer.entities.remove(accuracyRing);
  marker=viewer.entities.add({position:Cesium.Cartesian3.fromDegrees(lon,lat),point:{pixelSize:13,color:Cesium.Color.fromCssColorString('#bdf2d2'),outlineColor:Cesium.Color.BLACK,outlineWidth:3,disableDepthTestDistance:Number.POSITIVE_INFINITY}});
  if(accuracy)accuracyRing=viewer.entities.add({position:Cesium.Cartesian3.fromDegrees(lon,lat),ellipse:{semiMajorAxis:Math.max(accuracy,1),semiMinorAxis:Math.max(accuracy,1),material:Cesium.Color.fromCssColorString('#bdf2d2').withAlpha(.2)}});
  status(accuracy?'Location found. The shaded area shows reported accuracy.':'Coordinates selected.');changeLevel(3);
}
$('locate').onclick=()=>{
  if(!isSecureContext){status('Location requires HTTPS or localhost. Enter coordinates instead.');return;}
  if(!navigator.geolocation){status('Geolocation is unavailable. Enter coordinates instead.');return;}
  $('locate').disabled=true;status('Waiting for your device location…');
  navigator.geolocation.getCurrentPosition(p=>{setLocation(p.coords.latitude,p.coords.longitude,p.coords.accuracy);$('locate').disabled=false;},e=>{status(({1:'Location access was denied. Allow it in browser settings or enter coordinates.',2:'Your device could not determine its location. Enter coordinates instead.',3:'Location request timed out. Try again or enter coordinates.'})[e.code]||'Location unavailable.');$('locate').disabled=false;},{enableHighAccuracy:true,timeout:20000,maximumAge:0});
};
$('coordinate-form').onsubmit=e=>{e.preventDefault();const lat=Number($('lat').value),lon=Number($('lon').value);if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)setLocation(lat,lon);};
$('scale').oninput=e=>changeLevel(e.target.value);
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>changeLevel(b.dataset.level));
canvas.addEventListener('wheel',e=>{e.preventDefault();changeLevel(Math.max(0,Math.min(3,level+e.deltaY*.0005)));},{passive:false});
window.addEventListener('resize',()=>{if(level<1.85)drawSpace();});
$('space-note').textContent='Galactic north projection · Disk glow illustrative · R₀ = 8178 ±13(stat) ±22(sys) pc · Physical distances; enlarged markers';
async function init(){
  try {
    if(!window.Cesium)throw new Error('Globe library unavailable');
    Cesium.Ion.defaultAccessToken='';
    viewer=new Cesium.Viewer('earth',{baseLayer:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,animation:false,timeline:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,requestRenderMode:true});
    viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString('#152c38');
    viewer.scene.screenSpaceCameraController.maximumZoomDistance=50000000;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance=100;
    changeLevel(2);$('locate').disabled=false;$('go').disabled=false;
    status('Ready. Find your location or explore the scale below.');
    try {
      const imagery=await Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',{enablePickFeatures:false});
      imagery.errorEvent.addEventListener(()=>status('Some satellite tiles could not load. Check your connection.'));
      viewer.imageryLayers.addImageryProvider(imagery);
    }catch{status('Satellite imagery is unavailable. Check your connection and reload.');}
  }catch(error){status('The 3D globe could not start. Check WebGL support and your internet connection. Space views remain available.');console.error(error);}
}
init();
setInterval(()=>{epoch=new Date();positions=Object.fromEntries(planets.map(p=>[p,position(p,epoch)]));if(level<1.85)drawSpace();},60000);
