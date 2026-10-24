function globeFitRange(viewer) {
  const C=window.Cesium;
  const frustum=viewer.camera.frustum;
  const vertical=frustum.fovy/2;
  const horizontal=Math.atan(Math.tan(vertical)*frustum.aspectRatio);
  return C.Ellipsoid.WGS84.maximumRadius/Math.sin(Math.min(vertical,horizontal))*1.12;
}

// At orbital distances, frame the planet rather than the surface point.
export function frameWholeEarth(viewer, fit=false) {
  const C=window.Cesium, camera=viewer.camera;
  const fitRange=globeFitRange(viewer);
  viewer.scene.screenSpaceCameraController.maximumZoomDistance=Math.max(50000000,fitRange*2);
  const distance=C.Cartesian3.magnitude(camera.positionWC);
  if(!fit && distance<fitRange*.9)return false;
  const position=C.Cartesian3.clone(camera.positionWC);
  if(fit && distance<fitRange)C.Cartesian3.multiplyByScalar(position,fitRange/distance,position);
  const direction=C.Cartesian3.normalize(C.Cartesian3.negate(position,new C.Cartesian3()),new C.Cartesian3());
  if(!fit && C.Cartesian3.dot(direction,camera.directionWC)>1-1e-12)return true;
  const right=C.Cartesian3.cross(direction,camera.upWC,new C.Cartesian3());
  if(C.Cartesian3.magnitudeSquared(right)<1e-12)C.Cartesian3.cross(direction,C.Cartesian3.UNIT_Y,right);
  C.Cartesian3.normalize(right,right);
  const up=C.Cartesian3.cross(right,direction,new C.Cartesian3());
  camera.setView({destination:position,orientation:{direction,up}});
  viewer.scene.requestRender();
  return true;
}
