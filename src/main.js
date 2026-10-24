import { AU_KM, position, fieldWidth, locationRay } from './astronomy.js';
import { drawGalaxy, drawSolarSystem } from './render-space.js';
import './coordinates.css';
import './interaction.css';
import { createGlobeBeacon, drawSpaceBeacon } from './beacons.js';
import { anchoredGlobeRange } from './globe-camera.js';
const $ = (id) => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d');
const DEFAULT_LOCATION = {lat:37.4083, lon:-122.179, name:"Stanford Dish"};
const DEFAULT_LEVEL = 2.26;
let viewer, location, level = DEFAULT_LEVEL, epoch = new Date();
let cameraAnchor='';
const beacons=[];
let activeBeacon, removeGlobeBeacon;
const planets = ['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'];
let positions = Object.fromEntries(planets.map(p => [p, position(p, epoch)]));
const status = (message,error=false) => { $('status').textContent=message;$('status').classList.toggle('sr-only',!error); };
function drawSpace() {
  const dpr = Math.min(devicePixelRatio, 2), w = innerWidth, h = innerHeight;
  canvas.width = w*dpr; canvas.height = h*dpr; ctx.scale(dpr,dpr);
  ctx.fillStyle = '#03070c'; ctx.fillRect(0,0,w,h);
  const width = fieldWidth(level), px = Math.min(w,h)*.9/width;
  const center=activeBeacon ? locationRay(activeBeacon.lat,activeBeacon.lon,epoch).origin : positions.Earth;
  // Fixed north-Galactic-pole orthographic view. No invented star positions.
  const project = (p) => [w/2+(p[0]-center[0])*px,h/2-(p[1]-center[1])*px];
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
  $('distance').textContent = `Field width: ${width>63241?(width/63241.077).toPrecision(3)+' ly':width.toPrecision(3)+' AU'}`;
}
function changeLevel(value) {
  level = Number(value); $('scale').value = level;
  const cosmic = level < 1.85;
  document.body.classList.toggle('cosmic',cosmic);
  const galactic = level < .65;
  canvas.style.display=cosmic?'block':'none';$('earth').style.visibility=cosmic?'hidden':'visible';
  $('scale').setAttribute('aria-valuetext',level<.6?'Milky Way':level<1.6?'Solar system':level<2.5?'Earth':'Your location');
  if(cosmic){drawSpace();$('context').textContent=galactic?'Scroll or use the slider · Galactic north up':'True size and distance scale · Labels and beacons remain visible';}
  else if(viewer){
    const focus=location || {lat:20,lon:0};
    const amount=Math.max(0,Math.min(1,level-2));
    const altitude=Math.exp(Math.log(22000000)*(1-amount)+Math.log(1500)*amount);
    const pitch=Cesium.Math.toRadians(-55);
    const wide=Math.max(0,Math.min(1,(2.2-level)/.2));
    const range=Math.max(altitude/Math.sin(-pitch),anchoredGlobeRange(viewer)*wide*wide);
    const anchor=`${focus.lat},${focus.lon}`;
    if(cameraAnchor!==anchor){
      viewer.camera.lookAt(Cesium.Cartesian3.fromDegrees(focus.lon,focus.lat,5),new Cesium.HeadingPitchRange(0,pitch,range));
      cameraAnchor=anchor;
    }else{
      const offset=Cesium.Cartesian3.normalize(viewer.camera.position,new Cesium.Cartesian3());
      Cesium.Cartesian3.multiplyByScalar(offset,range,offset);
      viewer.camera.lookAtTransform(viewer.camera.transform,offset);
    }
    $('distance').textContent=`Camera altitude: ${(viewer.camera.positionCartographic.height/1000).toLocaleString(undefined,{maximumFractionDigits:1})} km`;
    $('context').textContent=level>2.5&&!location?'Use Find my location or enter coordinates to set your destination.':'Drag to rotate · Scroll to zoom · Right-drag to tilt';
  }
}
function setLocation(lat,lon,zoom=level) {
  activeBeacon={id:'location',lat,lon,name:'Location',color:'#7bffe0',enabled:true,showLabel:false};
  location=activeBeacon;beacons.splice(0,beacons.length,activeBeacon);
  removeGlobeBeacon?.();removeGlobeBeacon=createGlobeBeacon(viewer,activeBeacon);
  $('location-input').value=`${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  $('location-input').setCustomValidity('');status('Location updated.');changeLevel(zoom);
}
function applyCoordinates(event){
  event?.preventDefault();
  const input=$('location-input'),parts=input.value.trim().split(/[\s,]+/);
  const [lat,lon]=parts.map(Number);
  if(parts.length!==2||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180){
    const message='Enter latitude (−90 to 90), longitude (−180 to 180).';
    input.setCustomValidity(message);status(message,true);input.reportValidity();return;
  }
  setLocation(lat,lon);
}
$('coordinate-form').onsubmit=applyCoordinates;
$('location-input').oninput=()=>{$('location-input').setCustomValidity('');status('Press Enter to apply coordinates.');};
$('location-input').onchange=applyCoordinates;
$('scale').oninput=e=>changeLevel(e.target.value);
canvas.addEventListener('wheel',e=>{e.preventDefault();changeLevel(Math.max(0,Math.min(3,level+e.deltaY*.0005)));},{passive:false});
function resizeScene(){
  if(level<1.85)drawSpace();
  if(viewer){
    viewer.resize();
    const range=anchoredGlobeRange(viewer);
    if(cameraAnchor&&Cesium.Cartesian3.magnitude(viewer.camera.position)>3*Cesium.Ellipsoid.WGS84.maximumRadius){
      const offset=Cesium.Cartesian3.normalize(viewer.camera.position,new Cesium.Cartesian3());
      Cesium.Cartesian3.multiplyByScalar(offset,Math.max(range,Cesium.Cartesian3.magnitude(viewer.camera.position)),offset);
      viewer.camera.lookAtTransform(viewer.camera.transform,offset);
    }
  }
}
window.addEventListener('resize',resizeScene);
window.visualViewport?.addEventListener('resize',resizeScene);
async function init(){
  try {
    if(!window.Cesium)throw new Error('Globe library unavailable');
    Cesium.Ion.defaultAccessToken='';
    viewer=new Cesium.Viewer('earth',{baseLayer:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,animation:false,timeline:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,requestRenderMode:true});
    viewer.scene.globe.depthTestAgainstTerrain=true;
    viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString('#152c38');
    viewer.scene.screenSpaceCameraController.maximumZoomDistance=50000000;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance=100;
    viewer.scene.screenSpaceCameraController.enableTranslate=false;
    viewer.scene.screenSpaceCameraController.enableLook=false;
    setLocation(DEFAULT_LOCATION.lat,DEFAULT_LOCATION.lon,DEFAULT_LEVEL);
    $('location-input').disabled=false;
    try {
      const imagery=await Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',{enablePickFeatures:false});
      imagery.errorEvent.addEventListener(()=>status('Some satellite tiles could not load. Check your connection.'));
      viewer.imageryLayers.addImageryProvider(imagery);
    }catch{status('Satellite imagery is unavailable. Check your connection and reload.',true);}
  }catch(error){status('The 3D globe could not start. Check WebGL support and your internet connection.',true);console.error(error);}
}
init();
setInterval(()=>{epoch=new Date();positions=Object.fromEntries(planets.map(p=>[p,position(p,epoch)]));if(level<1.85)drawSpace();},60000);
