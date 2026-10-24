const cameraFrames=new WeakMap();

function globeFitRange(viewer) {
  const C=window.Cesium;
  const frustum=viewer.camera.frustum;
  const vertical=frustum.fovy/2;
  const horizontal=Math.atan(Math.tan(vertical)*frustum.aspectRatio);
  return C.Ellipsoid.WGS84.maximumRadius/Math.sin(Math.min(vertical,horizontal))*1.12;
}

// Dolly sideways gradually to frame Earth; never change the viewing direction.
export function frameWholeEarth(viewer, fit=false, reset=false) {
  const C=window.Cesium, camera=viewer.camera;
  const fitRange=globeFitRange(viewer);
  viewer.scene.screenSpaceCameraController.maximumZoomDistance=Math.max(50000000,fitRange*2);
  const direction=C.Cartesian3.clone(camera.directionWC);
  const up=C.Cartesian3.clone(camera.upWC);
  let depth=-C.Cartesian3.dot(camera.positionWC,direction);
  const perpendicular=C.Cartesian3.add(camera.positionWC,C.Cartesian3.multiplyByScalar(direction,depth,new C.Cartesian3()),new C.Cartesian3());
  let state=cameraFrames.get(camera);
  if(reset || !state || C.Cartesian3.dot(state.direction,direction)<1-1e-8){
    state={base:C.Cartesian3.clone(perpendicular),last:C.Cartesian3.clone(perpendicular),direction};
    cameraFrames.set(camera,state);
  }else{
    // Preserve intentional pan/zoom movement without applying our offset twice.
    C.Cartesian3.add(state.base,C.Cartesian3.subtract(perpendicular,state.last,new C.Cartesian3()),state.base);
  }
  const start=C.Ellipsoid.WGS84.maximumRadius*1.35;
  const end=Math.max(start+1000000,fitRange*.9);
  let t=Math.max(0,Math.min(1,(depth-start)/(end-start)));
  t=t*t*(3-2*t);
  if(fit){depth=Math.max(depth,fitRange);t=1;}
  const offset=C.Cartesian3.multiplyByScalar(state.base,1-t,new C.Cartesian3());
  const position=C.Cartesian3.add(offset,C.Cartesian3.multiplyByScalar(direction,-depth,new C.Cartesian3()),new C.Cartesian3());
  state.last=C.Cartesian3.clone(offset);state.direction=direction;
  if(C.Cartesian3.distanceSquared(position,camera.positionWC)>.0001){
    camera.setView({destination:position,orientation:{direction,up}});
    viewer.scene.requestRender();
  }
  return t===1;
}
