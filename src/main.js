import { SUN, AU_KM, position, fieldWidth, locationRay } from './astronomy.js';
import { drawGalaxy, drawSolarSystem } from './render-space.js';
import './scenes.css';
import './beacons.css';
import { createGlobeBeacon, drawSpaceBeacon } from './beacons.js';
const $ = (id) => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d');
const DEFAULT_LOCATION = {lat:37.4083, lon:-122.179, name:"Stanford Dish"};
const DEFAULT_LEVEL = 2.26;
let viewer, location, level = DEFAULT_LEVEL, epoch = new Date();
const beacons=[];
let activeBeacon;
const removeGlobeBeacons=new Map();
function renderBeaconList(){
  $('beacon-list').replaceChildren();
  for(const beacon of beacons){
    const row=document.createElement('li');
    const focus=document.createElement('button');focus.type='button';focus.className='beacon-focus';focus.setAttribute('aria-current',String(beacon===activeBeacon));focus.setAttribute('aria-label',`Focus ${beacon.name}`);
    const swatch=document.createElement('span');swatch.className='beacon-swatch';swatch.style.backgroundColor=beacon.color;
    focus.append(swatch,document.createTextNode(beacon.name));focus.onclick=()=>focusBeacon(beacon,3);row.append(focus);
    if(beacons.length>1){const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Remove ${beacon.name}`);remove.onclick=()=>{
      removeGlobeBeacons.get(beacon.id)?.();removeGlobeBeacons.delete(beacon.id);beacons.splice(beacons.indexOf(beacon),1);
      if(beacon===activeBeacon)focusBeacon(beacons[0],level);else refreshBeacons();
    };row.append(remove);}
    $('beacon-list').append(row);
  }
}
function focusBeacon(beacon,zoom=level){
  activeBeacon=beacon;location=beacon;
  $('location-title').textContent=beacon.name;
  $('coordinates').textContent=`${beacon.lat.toFixed(5)}°, ${beacon.lon.toFixed(5)}°${beacon.accuracy ? ` · accuracy ±${Math.round(beacon.accuracy)} m`:''}`;
  $('marker-name').value=beacon.name;$('marker-color').value=beacon.color;$('beam-enabled').checked=beacon.enabled;
  renderBeaconList();changeLevel(zoom);
}
function refreshBeacons(){
  if(viewer){for(const cleanup of removeGlobeBeacons.values())cleanup();removeGlobeBeacons.clear();for(const beacon of beacons)removeGlobeBeacons.set(beacon.id,createGlobeBeacon(viewer,beacon));}
  renderBeaconList();if(level<1.85)drawSpace();
}
function updateBeacon(){
  if(!activeBeacon)return;
  activeBeacon.name=$('marker-name').value.trim()||'My location';activeBeacon.color=$('marker-color').value;activeBeacon.enabled=$('beam-enabled').checked;
  $('location-title').textContent=activeBeacon.name;refreshBeacons();
}
$('marker-name').oninput=updateBeacon;$('marker-color').oninput=updateBeacon;$('beam-enabled').onchange=updateBeacon;
const planets = ['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'];
let positions = Object.fromEntries(planets.map(p => [p, position(p, epoch)]));
const status = (message) => { $('status').textContent = message; };
function drawSpace() {
  $('space-note').textContent=`${epoch.toISOString().slice(0,19)} UTC · Galactic north up · ${level<.65?'Spiral structure illustrative · R₀ = 8178 ±13(stat) ±22(sys) pc':'Sun and planet radii share the orbital distance scale · Mean-radius spheres'} · Labels and beacon lengths illustrative`;
  const dpr = Math.min(devicePixelRatio, 2), w = innerWidth, h = innerHeight;
  canvas.width = w*dpr; canvas.height = h*dpr; ctx.scale(dpr,dpr);
  ctx.fillStyle = '#03070c'; ctx.fillRect(0,0,w,h);
  const width = fieldWidth(level), px = Math.min(w,h)*.9/width;
  const t = Math.min(1,level*3), u = Math.max(0,Math.min(1,(level-1)*2));
  const earth = positions.Earth;
  const center = SUN.map((n,i) => n*t+(earth[i]-n)*u);
  // Fixed north-Galactic-pole orthographic view. No invented star positions.
  const project = (p) => [w*.52+(p[0]-center[0])*px,h*.47-(p[1]-center[1])*px];
  if(level < .65) {
    drawGalaxy(ctx,project,px);
    canvas.dataset.rendering='barred-spiral-galaxy';
  } else {
    drawSolarSystem(ctx,project,epoch,positions,px);
    canvas.dataset.rendering='shaded-planets-and-orbits';
  }
  beacons.forEach((beacon,index)=>drawSpaceBeacon(ctx,project,locationRay(beacon.lat,beacon.lon,epoch),beacon,index));
  canvas.dataset.beaconCount=String(beacons.length);
  canvas.dataset.activeBeacon=activeBeacon?.name || '';
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
  document.body.classList.toggle('cosmic',cosmic);
  const galactic = level < .65;
  document.querySelector('.intro h1').innerHTML = cosmic ? (galactic ? 'The Milky Way.' : 'Our solar system.') : 'Your place.<br>In everything.';
  document.querySelector('.intro > p:last-child').textContent = cosmic ? (galactic ? 'A rendered barred spiral. Our Sun lies about 26,700 light-years from the center.' : 'True body sizes and orbital distances. At this scale planets are smaller than a pixel; labels show their positions.') : 'From our galactic neighborhood to the ground beneath your feet.';
  canvas.style.display=cosmic?'block':'none';$('earth').style.visibility=cosmic?'hidden':'visible';
  $('space-note').hidden=!cosmic;
  $('scale-title').textContent=level<.6?'MILKY WAY':level<1.6?'SOLAR SYSTEM':level<2.5?'EARTH':'YOUR LOCATION';
  document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active',Math.abs(Number(b.dataset.level)-level)<.15));
  if(cosmic){drawSpace();$('context').textContent=galactic?'Scroll or use the slider · Galactic north up':'True size and distance scale · Labels and beacons remain visible';}
  else if(viewer){
    const focus=location || {lat:20,lon:0};
    const amount=Math.max(0,Math.min(1,level-2));
    const altitude=Math.exp(Math.log(22000000)*(1-amount)+Math.log(1500)*amount);
    // A nadir view looks straight down the beam. Tilt to expose its height.
    const pitch=Cesium.Math.toRadians(-55);
    viewer.camera.lookAt(Cesium.Cartesian3.fromDegrees(focus.lon,focus.lat),new Cesium.HeadingPitchRange(0,pitch,altitude/Math.sin(-pitch)));
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    $('distance').textContent=`Camera altitude: ${(viewer.camera.positionCartographic.height/1000).toLocaleString(undefined,{maximumFractionDigits:1})} km`;
    $('context').textContent=level>2.5&&!location?'Use Find my location or enter coordinates to set your destination.':'Drag to rotate · Scroll to zoom · Right-drag to tilt';
  }
}
function setLocation(lat,lon,accuracy,options = {}) {
  const id=options.id || crypto.randomUUID();
  let beacon=beacons.find(item=>item.id===id);
  if(!beacon){beacon={id,color:$('marker-color').value || '#7bffe0',enabled:true};beacons.push(beacon);}
  Object.assign(beacon,{lat,lon,accuracy,name:options.name || (accuracy?'Your location':'Selected location')});
  refreshBeacons();focusBeacon(beacon,options.level ?? 3);
  status(options.name==='Stanford Dish' ? 'Default location · California overview. Your beacon shines upward into space.' : accuracy?'Location found. Your beacon is active; the shaded area shows reported accuracy.':'Location beacon added. Customize its name, color, and beam above.');
}
$('locate').onclick=()=>{
  if(!isSecureContext){status('Location requires HTTPS or localhost. Enter coordinates instead.');return;}
  if(!navigator.geolocation){status('Geolocation is unavailable. Enter coordinates instead.');return;}
  $('locate').disabled=true;status('Waiting for your device location…');
  navigator.geolocation.getCurrentPosition(p=>{setLocation(p.coords.latitude,p.coords.longitude,p.coords.accuracy,{id:'device'});$('locate').disabled=false;},e=>{status(({1:'Location access was denied. Allow it in browser settings or enter coordinates.',2:'Your device could not determine its location. Enter coordinates instead.',3:'Location request timed out. Try again or enter coordinates.'})[e.code]||'Location unavailable.');$('locate').disabled=false;},{enableHighAccuracy:true,timeout:20000,maximumAge:0});
};
$('coordinate-form').onsubmit=e=>{e.preventDefault();const lat=Number($('lat').value),lon=Number($('lon').value);if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)setLocation(lat,lon,undefined,{name:$('beacon-name').value.trim() || 'Selected location'});};
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
    viewer.scene.globe.depthTestAgainstTerrain=true;
    viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString('#152c38');
    viewer.scene.screenSpaceCameraController.maximumZoomDistance=50000000;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance=100;
    setLocation(DEFAULT_LOCATION.lat,DEFAULT_LOCATION.lon,undefined,{id:'stanford-dish',name:DEFAULT_LOCATION.name,level:DEFAULT_LEVEL});
    $('locate').disabled=false;$('go').disabled=false;
    try {
      const imagery=await Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',{enablePickFeatures:false});
      imagery.errorEvent.addEventListener(()=>status('Some satellite tiles could not load. Check your connection.'));
      viewer.imageryLayers.addImageryProvider(imagery);
    }catch{status('Satellite imagery is unavailable. Check your connection and reload.');}
  }catch(error){status('The 3D globe could not start. Check WebGL support and your internet connection. Space views remain available.');console.error(error);}
}
init();
setInterval(()=>{epoch=new Date();positions=Object.fromEntries(planets.map(p=>[p,position(p,epoch)]));if(level<1.85)drawSpace();},60000);
